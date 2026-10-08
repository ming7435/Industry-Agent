"""控制前持久化意图；不确定的写操作只读回对账，不盲目重试。"""
import time
from copy import deepcopy
from datetime import datetime


class LineControlRepository:
    def __init__(self, repository):
        self.repository = repository

    def status(self):
        with self.repository.transaction() as db:
            return self.repository.state(db, 'line', {'state': 'unknown', 'generation': 0, 'faults': [], 'controls': {}})

    def _mutate(self, callback):
        with self.repository.transaction() as db:
            self.repository.lock(db)
            value = self.repository.state(db, 'line', {'state': 'unknown', 'generation': 0, 'faults': [], 'controls': {}})
            result = callback(value)
            value['updated_at'] = time.time()
            self.repository.save_state(db, 'line', value)
        return result

    @staticmethod
    def _ensure_existing_cycle(line):
        """升级前已停机的事件也在复机时汇总，时间只采用已保存的控制读回。"""
        faults = [f for f in line['faults'] if not f.get('resolved')]
        if line.get('active_cycle') or not faults:
            return
        ids = {f['event_id'] for f in faults}
        stopped = []
        for key, control in line.get('controls', {}).items():
            if not any(key.startswith(event + ':') for event in ids) or control.get('action') != 'emergency_stop' or control.get('state') != 'verified':
                continue
            try:
                stamp = datetime.fromisoformat(str((control.get('snapshot') or {}).get('checked_at') or '').replace('Z', '+00:00'))
                if stamp.tzinfo:
                    stopped.append(stamp.timestamp())
            except (ValueError, TypeError):
                pass
        started = [f['claimed_at'] for f in faults if f.get('claimed_at')]
        line['active_cycle'] = {'cycle_id': 'CYCLE-' + faults[0]['event_id'],
            'started_at': min(started or stopped) if started or stopped else None,
            'stopped_at': max(stopped) if stopped else None,
            'time_source': 'persisted_fault_or_stop_readback',
            'device_ids': sorted({device for f in faults for device in f['device_ids']})}

    def claim_fault_event(self, event_id, device_id, device_ids):
        if not event_id or not device_id or device_id not in device_ids:
            raise ValueError('故障事件及设备目录不完整')
        def update(line):
            old = next((f for f in line['faults'] if f['event_id'] == event_id), None)
            if old:
                if old['device_id'] != device_id or old['device_ids'] != sorted(set(device_ids)):
                    raise ValueError('事件已绑定不同设备参数')
                if not old.get('resolved'):
                    self._ensure_existing_cycle(line)
                return dict(line)
            line['generation'] += 1
            if not line.get('active_cycle'):
                self._ensure_existing_cycle(line)
            if not line.get('active_cycle'):
                line['active_cycle'] = {'cycle_id': 'CYCLE-' + event_id,
                                        'started_at': time.time(),
                                        'device_ids': sorted(set(device_ids))}
            line['state'] = 'stopping'
            line['faults'].append({'event_id': event_id, 'device_id': device_id, 'device_ids': sorted(set(device_ids)),
                                   'claimed_at': time.time(), 'cycle_id': line['active_cycle']['cycle_id'], 'resolved': False})
            return dict(line)
        return self._mutate(update)

    def claim_control(self, event_id, device_id, action):
        key = event_id + ':' + device_id + ':' + action
        def update(line):
            old = line['controls'].get(key)
            if old:
                return {'claimed': False, 'outcome': old}
            line['controls'][key] = {'state': 'pending', 'action': action, 'device_id': device_id}
            return {'claimed': True}
        return self._mutate(update)

    def record_device_control(self, event_id, device_id, action, outcome):
        def update(line):
            line['controls'][event_id + ':' + device_id + ':' + action] = dict(outcome)
            return dict(outcome)
        return self._mutate(update)

    def set_stop_result(self, generation, result):
        def update(line):
            if line['generation'] == generation:
                line['state'] = result['state']
                line['devices'] = result.get('devices', {})
                line['reason'] = result.get('reason', '')
                if result['state'] == 'stopped' and line.get('active_cycle'):
                    line['active_cycle'].setdefault('stopped_at', time.time())
            return dict(line)
        return self._mutate(update)

    def begin_restart(self, generation):
        def update(line):
            rollback = line.get('rollback') or {}
            safe_retry = line['state'] == 'failed' and bool(rollback) and all(v.get('state') == 'verified' for v in rollback.values())
            if line['generation'] != generation or (line['state'] != 'stopped' and not safe_retry):
                return {'claimed': False, **line}
            self._ensure_existing_cycle(line)
            line['state'] = 'starting'
            line['restart_attempt'] = line.get('restart_attempt', 0) + 1
            return {'claimed': True, **line}
        return self._mutate(update)

    def finish_restart(self, generation, result):
        def update(line):
            if line['generation'] != generation:
                line.setdefault('stale_results', []).append({'generation': generation, 'result': result})
                if result['state'] in {'failed', 'rollback_failed', 'unreconciled'}:
                    # 旧启动仍可能在新故障停机后才应用；回停不确定必须撤销当前安全宣告。
                    line['state'] = result['state']
                    line['reason'] = result.get('reason', '')
                    line['rollback'] = result.get('rollback', {})
                return dict(line)
            if line['generation'] == generation:
                if result['state'] == 'running' and line['state'] == 'starting':
                    self._ensure_existing_cycle(line)
                line['state'] = result['state']
                line['devices'] = result.get('devices', {})
                line['reason'] = result.get('reason', '')
                line['rollback'] = result.get('rollback', {})
                if line['state'] == 'running':
                    cycle = line.pop('active_cycle', None)
                    if cycle:
                        faults = [deepcopy(f) for f in line['faults'] if not f.get('resolved')]
                        line.setdefault('completed_cycles', []).append({**cycle, 'generation': generation,
                            'restarted_at': time.time(), 'state': 'running', 'faults': faults,
                            'event_ids': [f['event_id'] for f in faults], 'devices': deepcopy(line['devices']),
                            'reason': line['reason'], 'report_status': 'pending'})
                    for fault in line['faults']:
                        fault['resolved'] = True
            return dict(line)
        return self._mutate(update)

    def record_cycle_report(self, cycle_id, report_id, status='generated', error=''):
        """报告保存失败仅保留重试意图，不改变设备控制状态。"""
        def update(line):
            cycle = next((c for c in line.get('completed_cycles', []) if c['cycle_id'] == cycle_id), None)
            if cycle:
                cycle.update(report_id=report_id, report_status=status, report_error=error)
            return dict(cycle or {})
        return self._mutate(update)

    def list_open_faults(self):
        return [f for f in self.status()['faults'] if not f['resolved']]
