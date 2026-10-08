"""虚拟整线控制：写前认领、超时读回、人工确认和整线复核。"""
import os
from threading import Lock
from shared.repair_recovery import repair_checks, RUNNING, STOPPED
from .safety_store import SafetyStore
from shared.controlled_stop import expected_stopped_zero_metrics
from app.workorder.recovery_review import (
    ACTION as RECOVERY_REVIEW, SOURCE as RECOVERY_SOURCE, review_checks,
    stop_outcome, stop_digest, verified_untracked_review,
)


def _verified_inspection(order):
    verification = order.get('repair_verification') or {}
    checks = verification.get('checks') or {}
    required = ('device_identity', 'ready_to_start', 'alarms_clear', 'metrics_available',
                'interlocks_clear', 'recovery_fresh', 'alarm_state_available', 'snapshot_trusted')
    return ((order.get('maintenance_plan_snapshot') or {}).get('plan_kind') == 'inspection'
            and order.get('status') == 'closed' and bool(order.get('assignee'))
            and (order.get('repair_feedback') or {}).get('operator') == order.get('assignee')
            and verification.get('source') == verification.get('phase') == 'inspection'
            and verification.get('passed') is True and all(checks.get(key) is True for key in required))


def _verified_completion(order):
    if (order.get('maintenance_plan_snapshot') or {}).get('plan_kind') == 'inspection':
        return _verified_inspection(order)
    return (order.get('status') in {'completed', 'closed'} and bool(order.get('assignee'))
            and order.get('maintenance_confirmed_by') == order.get('assignee'))


def _collateral_stop_fault(fault, line):
    """Only persisted, verified no-fault stop readback can retire a zero artifact."""
    device_id = fault.get('device_id')
    outcome = (line.get('controls') or {}).get(fault['event_id'] + ':' + device_id + ':emergency_stop') or {}
    sample = outcome.get('snapshot') or {}
    if outcome.get('state') != 'verified' or outcome.get('device_id') != device_id or outcome.get('action') != 'emergency_stop':
        return False
    allowed = expected_stopped_zero_metrics(sample)
    metrics, details = sample.get('metrics'), sample.get('metric_details')
    if not isinstance(metrics, dict) or not isinstance(details, dict) or set(metrics) != set(details):
        return False
    if not allowed or not any(key in allowed and value == 0 for key, value in (sample.get('metrics') or {}).items()):
        return False
    checks = repair_checks(device_id, sample, 'prestart')
    # Historical freshness is irrelevant here; every current sample is checked
    # separately before any start. This record proves the origin of the artifact.
    return all(passed for key, passed in checks.items() if key != 'recovery_fresh')


def recovery_snapshot(payload, device_id):
    # 不回填设备 ID 或当前时间，避免把错设备/缺失数据伪装成可信样本。
    if 'devices' not in payload and 'monitor' not in payload:
        return dict(payload)
    device = next((d for d in payload.get('devices', []) if d.get('device_id') == device_id), {})
    monitor = payload.get('monitor') or {}
    if monitor.get('device_id') != device_id:
        monitor = {}
    result = {**device, **monitor}
    stamp = result.get('checked_at') or result.get('updated_at') or (payload.get('summary') or {}).get('updated_at')
    if isinstance(stamp, (int, float)):
        from datetime import datetime, timezone
        stamp = datetime.fromtimestamp(stamp / 1000, timezone.utc).isoformat()
    result['checked_at'] = stamp
    return result


def explicitly_retired_order(order):
    """仅排除有本次明确撤销授权及状态迁移审计的已归档历史任务。"""
    if order.get('status') != 'rejected' or not order.get('deleted_at'):
        return False
    record = order.get('administrative_cancellation')
    if not isinstance(record, dict) or record.get('source') != 'explicit_user_legacy_removal':
        return False
    if not all(isinstance(record.get(key), str) and record[key].strip() for key in ('request_id', 'operator', 'reason')):
        return False
    if any(record.get(key) != order.get(key) for key in ('workorder_id', 'device_id', 'event_id', 'assignee')):
        return False
    latest = next((event for event in reversed(order.get('events') or [])
                   if isinstance(event, dict) and event.get('action') == 'status_changed'), {})
    return (latest.get('to_status') == 'rejected' and latest.get('workorder_id') == order.get('workorder_id')
            and (latest.get('payload') or {}).get('administrative_cancellation') == record)


def pending_fault_orders(orders, device_ids):
    # 关联受控故障的工单在 try_restart 前段另行核对，撤销不能解除真实停机。
    return [order for order in orders
            if order.get('device_id') in device_ids and (order.get('event_id') or order.get('alarm_code'))
            and order.get('status') not in {'completed', 'closed'}
            and not explicitly_retired_order(order)]


def _order_repair_checks(device_id, snapshot, phase='poststart', orders=()):
    checks = repair_checks(device_id, snapshot, phase)
    for order in orders:
        if order.get('device_id') == device_id:
            for key, passed in repair_checks(device_id, snapshot, phase, order=order).items():
                checks[key] = checks.get(key, True) and passed
    return checks


class LineController:
    def __init__(self, factory_client, ledger):
        self.factory = factory_client
        self.ledger = ledger
        self._unpersisted = {}
        self._spool_error = ''
        self._volatile_claims = set()
        try:
            self.spool = SafetyStore()
        except Exception as error:
            self.spool = None
            self._spool_error = type(error).__name__
        self._lock = Lock()

    @staticmethod
    def enabled():
        return os.getenv('FACTORY_CONTROL_MODE', '').lower() == 'virtual'

    def sample(self, device_id):
        return recovery_snapshot(self.factory.snapshot(device_id), device_id)

    def status(self):
        return self.ledger.status()

    def review_untracked_faults(self, event_ids, authorization):
        """Administrative recovery only after an explicit human request and fresh readback.

        Not called by automatic dispatch or normal workorder completion. Existing
        workorders must still be completed by their own assignees.
        """
        from datetime import datetime, timezone
        if not self.enabled():
            raise ValueError('自动复机控制未启用')
        if not isinstance(authorization, dict) or not all(
                isinstance(authorization.get(k), str) and authorization[k].strip()
                for k in ('request_id', 'operator', 'feedback')):
            raise ValueError('必须提供明确的人工旧故障处理确认')
        if not isinstance(event_ids, list) or not event_ids or len(set(event_ids)) != len(event_ids):
            raise ValueError('必须明确指定待核对的故障事件')
        line = self.ledger.status()
        faults = [f for f in line['faults'] if not f.get('resolved') and f['event_id'] in event_ids]
        if len(faults) != len(event_ids):
            raise ValueError('指定故障不存在或已经解除')
        orders = self.ledger.call('list_workorders', {})['items']
        reviews = []
        for fault in faults:
            if any(o.get('event_id') == fault['event_id'] and o.get('device_id') == fault['device_id'] for o in orders):
                raise ValueError('该故障已有工单，必须由维修负责人完成原工单')
            old = stop_outcome(fault, line)
            if (old.get('state') != 'verified' or old.get('device_id') != fault['device_id']
                    or old.get('action') != 'emergency_stop'):
                raise ValueError('缺少可信的原故障停机记录')
            sample = self.sample(fault['device_id'])
            checks = review_checks(fault, line, sample)
            if not all(checks.values()):
                raise ValueError('旧故障设备核验未通过：' + '、'.join(k for k, passed in checks.items() if not passed))
            proof = {k: authorization[k].strip() for k in ('request_id', 'operator', 'feedback')}
            proof.update(state='verified', source=RECOVERY_SOURCE, action=RECOVERY_REVIEW,
                         event_id=fault['event_id'], device_id=fault['device_id'],
                         stop_digest=stop_digest(old), snapshot=sample, checks=checks,
                         reviewed_at=datetime.now(timezone.utc).isoformat())
            if not verified_untracked_review(fault, {**line, 'controls': {
                    **line.get('controls', {}), fault['event_id'] + ':' + fault['device_id'] + ':' + RECOVERY_REVIEW: proof}}):
                raise ValueError('设备核验快照不够新鲜或旧故障审计不完整')
            reviews.append((fault, proof))
        latest = self.ledger.status()
        if latest['generation'] != line['generation'] or latest['state'] != line['state']:
            raise ValueError('核验期间发生新故障，请重新检查')
        for fault, proof in reviews:
            self.ledger.record_device_control(fault['event_id'], fault['device_id'], RECOVERY_REVIEW, proof)
        return {'reviewed_events': event_ids, 'generation': line['generation']}

    def _pending(self):
        if self.spool is None or self._spool_error:
            raise OSError('本地安全账本不可用')
        return self.spool.pending()

    def _claim_local(self, event_id, device_id, action):
        try:
            if self.spool is None:
                raise OSError('安全账本不可用')
            return self.spool.claim_command(event_id, device_id, action)
        except Exception as error:
            self._spool_error = type(error).__name__
            if action == 'start':
                return False
            # 全部持久化都失败时仍尽力停机，但只保留当前进程的防重复标记，禁止复机。
            key = (event_id, device_id, action)
            if key in self._volatile_claims:
                return False
            self._volatile_claims.add(key)
            return True

    def _control(self, event_id, device_id, action, reason, persist=True, recovery_orders=()):
        target = RUNNING if action == 'start' else STOPPED
        claimed = self.ledger.claim_control(event_id, device_id, action).get('claimed') if persist else True
        if claimed:
            claimed = self._claim_local(event_id, device_id, action)
        error = ''
        response = None
        snapshot = {}
        try:
            try:
                snapshot = self.sample(device_id)
            except Exception:
                if action == 'start':
                    raise
            if action == 'start' and not all(_order_repair_checks(
                    device_id, snapshot, 'prestart', recovery_orders).values()):
                raise ValueError('启动前设备恢复证据不完整或异常')
            already = snapshot.get('device_id') == device_id and str(snapshot.get('status') or '').lower() in target and repair_checks(device_id, snapshot, 'prestart')['recovery_fresh']
            if claimed and not already:
                try:
                    response = self.factory.control_device(device_id, action, reason)
                except Exception as exc:
                    error = type(exc).__name__ + ': 控制响应不确定，已读回核对'
                snapshot = self.sample(device_id)
            verified = snapshot.get('device_id') == device_id and str(snapshot.get('status') or '').lower() in target and repair_checks(device_id, snapshot, 'prestart')['recovery_fresh']
            if action == 'start':
                verified = verified and all(_order_repair_checks(device_id, snapshot, orders=recovery_orders).values())
            outcome = {'state': 'verified' if verified else 'uncertain', 'device_id': device_id, 'action': action, 'command': {'action': action, 'reason': reason}, 'response': response, 'snapshot': snapshot, 'error': error}
        except Exception as exc:
            outcome = {'state': 'uncertain', 'device_id': device_id, 'action': action, 'error': type(exc).__name__}
        if persist:
            self.ledger.record_device_control(event_id, device_id, action, outcome)
        return outcome

    def handle_fault(self, event_id, device_id, reason):
        if not self.enabled():
            return {'state': 'disabled', 'reason': '仅显式虚拟工厂模式允许控制'}
        with self._lock:
            ids = sorted({str(d.get('device_id') or d.get('id') or '') for d in self.factory.devices()} - {''})
            if device_id not in ids or not event_id:
                return {'state': 'failed', 'reason': '故障设备或事件缺失'}
            try:
                if self.spool is None:
                    raise OSError('安全账本不可用')
                self.spool.add(event_id, device_id, ids, reason)
            except ValueError:
                raise
            except Exception as error:
                self._spool_error = type(error).__name__
            persist = True
            try:
                line = self.ledger.claim_fault_event(event_id, device_id, ids)
                if not any(not f.get('resolved') and f.get('event_id') == event_id for f in line.get('faults', [])):
                    if self.spool:
                        self.spool.clear(event_id)
                    return line
            except ValueError:
                raise
            except Exception:
                persist = False
                line = {'generation': -1}
            results = {}
            for target in ids:
                try:
                    results[target] = self._control(event_id, target, 'emergency_stop', reason, persist)
                except Exception:
                    # 账本失败不能阻止安全停机；这一轮永远不允许复机。
                    persist = False
                    results[target] = self._control(event_id, target, 'emergency_stop', reason, False)
            state = 'stopped' if all(r['state'] == 'verified' for r in results.values()) else 'stop_failed'
            result = {'state': state if persist and not self._spool_error else 'unreconciled', 'devices': results, 'generation': line['generation'], 'reason': '安全账本不可用，停机待对账' if self._spool_error else ''}
            if self._spool_error:
                self._unpersisted[event_id] = (device_id, reason)
            if not persist:
                self._unpersisted[event_id] = (device_id, reason)
                return result
            try:
                saved = self.ledger.set_stop_result(line['generation'], result)
                if not self._spool_error and saved.get('generation') == line['generation'] and saved.get('state') == state:
                    self.spool.clear(event_id)
                    self._unpersisted.pop(event_id, None)
                return saved
            except Exception:
                self._unpersisted[event_id] = (device_id, reason)
                return {**result, 'state': 'unreconciled'}

    def confirm_and_restart(self, workorder_id, actor_id, feedback):
        order = self.ledger.call('get_workorder', {'workorder_id': workorder_id}).get('workorder') or {}
        if not actor_id or order.get('assignee') != actor_id:
            raise PermissionError('仅被派工维修人员可以确认维修')
        if (order.get('maintenance_plan_snapshot') or {}).get('plan_kind') == 'inspection':
            raise ValueError('现场检查工单不能确认维修或申请复机，请提交检查记录')
        if not str(feedback or '').strip():
            raise ValueError('请填写实际维修反馈')
        # 自动控制关闭时仍可保存本人维修确认；只读取恢复数据，不发送设备控制。
        if self.enabled():
            # 新的人工确认才触发待停机事件对账；绝不自动重试启动写操作。
            try:
                pending_faults = self._pending()
            except Exception:
                return {'workorder': order, 'machine_control': {'state': 'blocked', 'reason': '本地安全账本不可用，禁止复机'}}
            for pending in pending_faults:
                self.handle_fault(pending['event_id'], pending['device_id'], pending['reason'])
            line = self.ledger.status()
            if line['state'] == 'unreconciled':
                for fault in line['faults']:
                    if not fault.get('resolved'):
                        self.handle_fault(fault['event_id'], fault['device_id'], '人工确认前停机对账')
        sample = self.sample(str(order.get('device_id') or ''))
        checks = repair_checks(order.get('device_id'), sample, 'prestart', order=order)
        if not all(checks.values()):
            labels = {'device_identity': '设备不匹配', 'ready_to_start': '设备状态未就绪',
                      'alarms_clear': '报警或异常指标尚未解除', 'metrics_available': '缺少有效设备指标',
                      'interlocks_clear': '安全互锁未解除', 'recovery_fresh': '设备数据已过期或时间无效',
                      'fault_metrics_complete': '原液压故障指标或当前验收区间缺失'}
            reason = '设备恢复证据未通过校验：' + '；'.join(labels.get(key, key) for key, passed in checks.items() if not passed)
            return {'workorder': order, 'machine_control': {'state': 'blocked', 'checks': checks, 'reason': reason}}
        completed = self.ledger.request('/internal/team/repair/confirm', {'workorder_id': workorder_id, 'actor_id': actor_id, 'feedback': str(feedback), 'snapshot': sample})
        control = self.try_restart(workorder_id, actor_id)
        updated = self.ledger.call('get_workorder', {'workorder_id': workorder_id}).get('workorder')
        return {**completed, 'workorder': updated, 'machine_control': control}

    def try_restart(self, workorder_id, actor_id):
        return self._try_restart(workorder_id, actor_id)

    def try_restart_after_inspection(self, workorder_id, actor_id):
        """A verified inspection may request line recovery, never repair learning."""
        return self._try_restart(workorder_id, actor_id, inspection=True)

    def _try_restart(self, workorder_id, actor_id, inspection=False):
        if not self.enabled():
            return {'state': 'blocked', 'reason': '自动复机控制未启用'}
        try:
            pending = self._pending()
        except Exception:
            return {'state': 'blocked', 'reason': '本地安全账本不可用，禁止复机'}
        if self._unpersisted or pending:
            return {'state': 'blocked', 'reason': '控制模式或停机账本未对账'}
        line = self.ledger.status()
        faults = [f for f in line['faults'] if not f.get('resolved')]
        orders = self.ledger.call('list_workorders', {})['items']
        current = next((o for o in orders if o['workorder_id'] == workorder_id), {})
        recovery_orders = [o for o in orders if o.get('workorder_id') == workorder_id or any(
            o.get('event_id') == f['event_id'] and o.get('device_id') == f['device_id'] for f in faults)]
        authorized = _verified_inspection(current) if inspection else _verified_completion(current) and (current.get('maintenance_plan_snapshot') or {}).get('plan_kind') != 'inspection'
        if not actor_id or current.get('assignee') != actor_id or not authorized:
            return {'state': 'blocked', 'reason': '当前检查工单尚未通过核验' if inspection else '当前工单没有可信维修确认'}
        from app.workorder.review import execution_review
        current_review = execution_review(current)
        if not inspection and current_review['required'] and not current_review['human_confirmed']:
            return {'state': 'blocked', 'reason': '；'.join(current_review['findings']), 'workorder_ids': [workorder_id]}
        collateral = []
        reviewed = []
        fault_blockers = []
        for fault in faults:
            matching = [o for o in orders if o.get('event_id') == fault['event_id'] and o.get('device_id') == fault['device_id']]
            if not matching and _collateral_stop_fault(fault, line):
                collateral.append(fault['event_id'])
                continue
            if not matching and verified_untracked_review(fault, line):
                reviewed.append(fault)
                continue
            unfinished = [o for o in matching if not _verified_completion(o)]
            if not matching or unfinished:
                fault_blockers.append({'event_id': fault['event_id'], 'device_id': fault['device_id'],
                    'alarm_code': (stop_outcome(fault, line).get('snapshot') or {}).get('alarm_code') or '',
                    'kind': 'unfinished_workorder' if matching else 'missing_workorder',
                    'workorder_ids': [o['workorder_id'] for o in unfinished]})
                continue
            reviews = [(o, execution_review(o)) for o in matching if not _verified_inspection(o)]
            blocked = [(o, review) for o, review in reviews if review['required'] and not review['human_confirmed']]
            if blocked:
                return {'state': 'blocked', 'reason': '；'.join(dict.fromkeys(
                    finding for _, review in blocked for finding in review['findings'])),
                    'event_id': fault['event_id'], 'workorder_ids': [o['workorder_id'] for o, _ in blocked]}
        if fault_blockers:
            missing = any(b['kind'] == 'missing_workorder' for b in fault_blockers)
            return {'state': 'blocked', 'reason': '仍有历史故障没有关联工单，需要确认处理结果并核验设备' if missing else '还有未确认完成的故障工单',
                    'event_id': fault_blockers[0]['event_id'], 'fault_blockers': fault_blockers,
                    'workorder_ids': [oid for b in fault_blockers for oid in b['workorder_ids']]}
        ids = sorted({d for f in faults for d in f['device_ids']})
        actual_ids = sorted({str(d.get('device_id') or d.get('id') or '') for d in self.factory.devices()} - {''})
        # 尚无受控停机记录时可只读确认设备已经运行；不补造控制账本或发送启动。
        if line['state'] == 'running' or (line['state'] == 'unknown' and not faults):
            if not actual_ids or current.get('device_id') not in actual_ids:
                return {'state': 'blocked', 'reason': '当前工单设备不在整线设备目录中'}
            unfinished = pending_fault_orders(orders, actual_ids)
            if unfinished:
                return {'state': 'blocked', 'reason': '整线还有其他未完成故障工单', 'workorder_ids': [o['workorder_id'] for o in unfinished]}
            samples = {device_id: self.sample(device_id) for device_id in actual_ids}
            if any(not all(_order_repair_checks(device_id, sample, 'poststart', recovery_orders).values()) for device_id, sample in samples.items()):
                return {'state': 'blocked', 'reason': '最近复机账本与当前设备状态不一致' if line['state'] == 'running' else '整线设备尚未全部恢复正常运行'}
            latest = self.ledger.status()
            if latest['state'] != line['state'] or latest['generation'] != line['generation']:
                return {'state': 'blocked', 'reason': '运行复核期间整线状态发生变化，请重新确认'}
            if current.get('status') == 'completed':
                self.ledger.request('/internal/team/repair/poststart', {'workorder_id': workorder_id, 'snapshot': samples[current['device_id']]})
            return {'state': 'running', 'already_running': True}
        if not ids or ids != actual_ids:
            return {'state': 'blocked', 'reason': '设备目录变化或没有受控停机事件'}
        unfinished = pending_fault_orders(orders, ids)
        if unfinished:
            return {'state': 'blocked', 'reason': '整线还有其他未完成故障工单', 'workorder_ids': [o['workorder_id'] for o in unfinished]}
        for d in ids:
            sample = self.sample(d)
            checks = _order_repair_checks(d, sample, 'prestart', recovery_orders)
            for fault in reviewed:
                if fault['device_id'] == d:
                    checks.update({'reviewed_' + key: passed for key, passed in review_checks(fault, line, sample).items()})
            if not all(checks.values()):
                labels = {'device_identity': '设备身份不一致', 'ready_to_start': '设备状态未就绪',
                          'alarms_clear': '报警或异常指标未解除', 'metrics_available': '缺少有效指标',
                          'interlocks_clear': '安全互锁未解除', 'recovery_fresh': '设备数据过期',
                          'fault_metrics_complete': '原故障验收指标不完整'}
                return {'state': 'blocked', 'device_id': d, 'checks': checks,
                        'reason': d + '：' + '；'.join(labels.get(key, key) for key, passed in checks.items() if not passed)}
        generation = line['generation']
        claim = self.ledger.begin_restart(generation)
        if not claim.get('claimed'):
            return {'state': 'blocked', 'reason': '整线状态不允许重复复机'}
        attempt = claim.get('restart_attempt', 1)
        results = {}
        try:
            for d in ids:
                latest = self.ledger.status()
                if latest['generation'] != generation or latest['state'] != 'starting' or latest.get('restart_attempt', 1) != attempt:
                    raise ValueError('复机中检测到新故障')
                result = self._control('restart-%s-%s' % (generation, attempt), d, 'start', '检查通过后整线复机' if inspection else '维修人员确认后复机', recovery_orders=recovery_orders)
                results[d] = result
                if result['state'] != 'verified':
                    raise ValueError('启动后验证失败')
            for d in ids:
                sample = self.sample(d)
                if not all(_order_repair_checks(d, sample, orders=recovery_orders).values()):
                    raise ValueError('整线运行复核失败')
                if any(f['device_id'] == d and not all(review_checks(f, line, sample, 'poststart').values()) for f in reviewed):
                    raise ValueError('旧故障启动后复核失败')
            for order in orders:
                if order.get('status') == 'completed' and any(order.get('event_id') == f['event_id'] for f in faults):
                    self.ledger.request('/internal/team/repair/poststart', {'workorder_id': order['workorder_id'], 'snapshot': self.sample(order['device_id']), 'generation': generation, 'attempt': attempt})
            reason = ('检查通过后整线运行复核通过' if inspection else '维修确认后整线运行复核通过')
            if collateral:
                reason += '；已核对停机零值产生的历史事件：' + '、'.join(collateral)
            if reviewed:
                reason += '；依据明确人工确认及设备复核解除未关联工单的旧故障：' + '、'.join(f['event_id'] for f in reviewed)
            final = self.ledger.finish_restart(generation, {'state': 'running', 'devices': results, 'reason': reason})
            if final['state'] != 'running' or final['generation'] != generation:
                raise ValueError('启动结束时出现新故障')
            return {'state': 'running', 'devices': results}
        except Exception as exc:
            stopped = {d: self._control('rollback-%s-%s' % (generation, attempt), d, 'emergency_stop', '复机失败回停', persist=False) for d in ids}
            result = {'state': 'failed' if all(r['state'] == 'verified' for r in stopped.values()) else 'rollback_failed', 'reason': str(exc), 'devices': results, 'rollback': stopped}
            try:
                self.ledger.finish_restart(generation, result)
            except Exception:
                result['state'] = 'unreconciled'
            return result
