"""Attach read-only, current device evidence without declaring a historical quality cause."""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from datetime import datetime, timezone

from app.tools.diagnosis.get_device_status import get_device_status


def enrich_batch_report(report, base_url=None):
    result = deepcopy(report)
    machines = (result.get('problem_analysis') or {}).get('machines') or []
    # Bound a page query even when a manually recorded batch lists many devices.
    selected = machines[:16]
    def read(machine):
        device_id = machine['device_id']
        try:
            value = get_device_status(device_id, base_url=base_url, timeout=2.0)
            if (value.get('found') is not True or value.get('success') is not True
                    or value.get('device_id') != device_id
                    or value.get('synthetic') is True or value.get('degraded') is True
                    or value.get('evidence_status') == 'untrusted'
                    or value.get('source_timestamp_provided') is not True):
                raise ValueError('Device evidence unavailable')
            checked_at = datetime.fromisoformat(str(value.get('checked_at') or '').replace('Z', '+00:00'))
            if checked_at.tzinfo is None:
                raise ValueError('Device evidence timestamp has no timezone')
            age = (datetime.now(timezone.utc) - checked_at).total_seconds()
            if age < -60 or age > 300:
                return {'availability': 'stale', 'device_id': device_id, 'checked_at': value.get('checked_at'),
                        'note': '设备快照时间过旧或异常，不能作为当前设备故障证据；请重新采集。'}
            return {'availability': 'available', 'device_id': device_id, 'status': value.get('status', 'unknown'),
                'alarm_code': value.get('alarm_code'), 'alarm_label': value.get('alarm_label'),
                'device_name': value.get('name', ''), 'metrics': value.get('metrics') or {},
                'checked_at': value.get('checked_at'), 'source': value.get('source'),
                'scope': 'current_device_state',
                'note': '这是采集时的设备状态，不证明该零件生产时的故障或质量根因。'}
        except Exception:
            return {'availability': 'unavailable', 'device_id': device_id,
                    'note': '当前设备证据不可用，保留已核实的质量结果，不猜测机器故障。'}
    if selected:
        with ThreadPoolExecutor(max_workers=min(4, len(selected))) as executor:
            for machine, evidence in zip(selected, executor.map(read, selected)):
                machine['device_evidence'] = evidence
    for machine in machines[16:]:
        machine['device_evidence'] = {'availability': 'not_queried', 'device_id': machine['device_id'],
                                    'note': '批次关联机器较多，本轮仅查询前16台机器的当前状态。'}
    return result
