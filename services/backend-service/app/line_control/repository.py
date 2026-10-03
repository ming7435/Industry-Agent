"""控制前持久化意图；不确定的写操作只读回对账，不盲目重试。"""
import time


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

    def claim_fault_event(self, event_id, device_id, device_ids):
        if not event_id or not device_id or device_id not in device_ids:
            raise ValueError('故障事件及设备目录不完整')
        def update(line):
            old = next((f for f in line['faults'] if f['event_id'] == event_id), None)
            if old:
                if old['device_id'] != device_id or old['device_ids'] != sorted(set(device_ids)):
                    raise ValueError('事件已绑定不同设备参数')
                return dict(line)
            line['generation'] += 1
            line['state'] = 'stopping'
            line['faults'].append({'event_id': event_id, 'device_id': device_id, 'device_ids': sorted(set(device_ids)), 'resolved': False})
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
            return dict(line)
        return self._mutate(update)

    def begin_restart(self, generation):
        def update(line):
            rollback = line.get('rollback') or {}
            safe_retry = line['state'] == 'failed' and bool(rollback) and all(v.get('state') == 'verified' for v in rollback.values())
            if line['generation'] != generation or (line['state'] != 'stopped' and not safe_retry):
                return {'claimed': False, **line}
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
                line['state'] = result['state']
                line['devices'] = result.get('devices', {})
                line['reason'] = result.get('reason', '')
                line['rollback'] = result.get('rollback', {})
                if line['state'] == 'running':
                    for fault in line['faults']:
                        fault['resolved'] = True
            return dict(line)
        return self._mutate(update)

    def list_open_faults(self):
        return [f for f in self.status()['faults'] if not f['resolved']]
