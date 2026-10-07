"""虚拟整线控制：写前认领、超时读回、人工确认和整线复核。"""
import os
from threading import Lock
from shared.repair_recovery import repair_checks, RUNNING, STOPPED
from .safety_store import SafetyStore


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

    def _control(self, event_id, device_id, action, reason, persist=True):
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
            already = snapshot.get('device_id') == device_id and str(snapshot.get('status') or '').lower() in target and repair_checks(device_id, snapshot, 'prestart')['recovery_fresh']
            if claimed and not already:
                try:
                    response = self.factory.control_device(device_id, action, reason)
                except Exception as exc:
                    error = type(exc).__name__ + ': 控制响应不确定，已读回核对'
                snapshot = self.sample(device_id)
            verified = snapshot.get('device_id') == device_id and str(snapshot.get('status') or '').lower() in target and repair_checks(device_id, snapshot, 'prestart')['recovery_fresh']
            if action == 'start':
                verified = verified and all(repair_checks(device_id, snapshot).values())
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
        if not self.enabled():
            return {'machine_control': {'state': 'blocked', 'reason': '虚拟控制模式未启用'}}
        order = self.ledger.call('get_workorder', {'workorder_id': workorder_id}).get('workorder') or {}
        if not actor_id or order.get('assignee') != actor_id:
            raise PermissionError('仅被派工维修人员可以确认维修')
        if (order.get('maintenance_plan_snapshot') or {}).get('plan_kind') == 'inspection':
            raise ValueError('现场检查工单不能确认维修或申请复机，请提交检查记录')
        if not str(feedback or '').strip():
            raise ValueError('请填写实际维修反馈')
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
        checks = repair_checks(order.get('device_id'), sample, 'prestart')
        if not all(checks.values()):
            return {'workorder': order, 'machine_control': {'state': 'blocked', 'checks': checks, 'reason': '设备恢复证据未通过校验'}}
        completed = self.ledger.request('/internal/team/repair/confirm', {'workorder_id': workorder_id, 'actor_id': actor_id, 'feedback': str(feedback), 'snapshot': sample})
        control = self.try_restart(workorder_id, actor_id)
        updated = self.ledger.call('get_workorder', {'workorder_id': workorder_id}).get('workorder')
        return {**completed, 'workorder': updated, 'machine_control': control}

    def try_restart(self, workorder_id, actor_id):
        try:
            pending = self._pending()
        except Exception:
            return {'state': 'blocked', 'reason': '本地安全账本不可用，禁止复机'}
        if not self.enabled() or self._unpersisted or pending:
            return {'state': 'blocked', 'reason': '控制模式或停机账本未对账'}
        line = self.ledger.status()
        faults = [f for f in line['faults'] if not f.get('resolved')]
        orders = self.ledger.call('list_workorders', {})['items']
        current = next((o for o in orders if o['workorder_id'] == workorder_id), {})
        if not actor_id or current.get('status') not in {'completed', 'closed'} or current.get('assignee') != actor_id or current.get('maintenance_confirmed_by') != actor_id:
            return {'state': 'blocked', 'reason': '当前工单没有可信维修确认'}
        from app.workorder.review import execution_review
        current_review = execution_review(current)
        if current_review['required'] and not current_review['human_confirmed']:
            return {'state': 'blocked', 'reason': '；'.join(current_review['findings']), 'workorder_ids': [workorder_id]}
        for fault in faults:
            matching = [o for o in orders if o.get('event_id') == fault['event_id'] and o.get('device_id') == fault['device_id']]
            if not matching or any(o.get('status') not in {'completed', 'closed'} or not o.get('maintenance_confirmed_by') or o.get('maintenance_confirmed_by') != o.get('assignee') for o in matching):
                return {'state': 'blocked', 'reason': '还有未确认完成的故障工单', 'event_id': fault['event_id']}
            reviews = [(o, execution_review(o)) for o in matching]
            blocked = [(o, review) for o, review in reviews if review['required'] and not review['human_confirmed']]
            if blocked:
                return {'state': 'blocked', 'reason': '；'.join(dict.fromkeys(
                    finding for _, review in blocked for finding in review['findings'])),
                    'event_id': fault['event_id'], 'workorder_ids': [o['workorder_id'] for o, _ in blocked]}
        ids = sorted({d for f in faults for d in f['device_ids']})
        actual_ids = sorted({str(d.get('device_id') or d.get('id') or '') for d in self.factory.devices()} - {''})
        if line['state'] == 'running':
            if not actual_ids or current.get('device_id') not in actual_ids:
                return {'state': 'blocked', 'reason': '当前工单设备不在整线设备目录中'}
            unfinished = [o for o in orders if o.get('device_id') in actual_ids and (o.get('event_id') or o.get('alarm_code')) and o.get('status') not in {'completed', 'closed'}]
            if unfinished:
                return {'state': 'blocked', 'reason': '整线还有其他未完成故障工单', 'workorder_ids': [o['workorder_id'] for o in unfinished]}
            samples = {device_id: self.sample(device_id) for device_id in actual_ids}
            if any(not all(repair_checks(device_id, sample, 'poststart').values()) for device_id, sample in samples.items()):
                return {'state': 'blocked', 'reason': '最近复机账本与当前设备状态不一致'}
            latest = self.ledger.status()
            if latest['state'] != 'running' or latest['generation'] != line['generation']:
                return {'state': 'blocked', 'reason': '运行复核期间整线状态发生变化，请重新确认'}
            if current.get('status') == 'completed':
                self.ledger.request('/internal/team/repair/poststart', {'workorder_id': workorder_id, 'snapshot': samples[current['device_id']]})
            return {'state': 'running', 'already_running': True}
        if not ids or ids != actual_ids:
            return {'state': 'blocked', 'reason': '设备目录变化或没有受控停机事件'}
        unfinished = [o for o in orders if o.get('device_id') in ids and (o.get('event_id') or o.get('alarm_code')) and o.get('status') not in {'completed', 'closed'}]
        if unfinished:
            return {'state': 'blocked', 'reason': '整线还有其他未完成故障工单', 'workorder_ids': [o['workorder_id'] for o in unfinished]}
        for d in ids:
            checks = repair_checks(d, self.sample(d), 'prestart')
            if not all(checks.values()):
                return {'state': 'blocked', 'device_id': d, 'checks': checks}
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
                result = self._control('restart-%s-%s' % (generation, attempt), d, 'start', '维修人员确认后复机')
                results[d] = result
                if result['state'] != 'verified':
                    raise ValueError('启动后验证失败')
            for d in ids:
                if not all(repair_checks(d, self.sample(d)).values()):
                    raise ValueError('整线运行复核失败')
            for order in orders:
                if order.get('status') == 'completed' and any(order.get('event_id') == f['event_id'] for f in faults):
                    self.ledger.request('/internal/team/repair/poststart', {'workorder_id': order['workorder_id'], 'snapshot': self.sample(order['device_id']), 'generation': generation, 'attempt': attempt})
            final = self.ledger.finish_restart(generation, {'state': 'running', 'devices': results})
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
