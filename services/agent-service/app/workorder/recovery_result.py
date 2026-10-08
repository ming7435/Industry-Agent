"""Project a saved, verified line restart into workorder reads without control writes."""
from collections.abc import Mapping

from app.clients.backend import BackendServiceError
from shared.repair_recovery import RUNNING
from shared.technician_confirmation import trusted_technician_confirmation


def _poststart_confirmed(order):
    verification = order.get('repair_verification') or {}
    return (verification.get('phase') == 'poststart' and verification.get('passed') is True
            and trusted_technician_confirmation(order))


def _verified_devices(cycle):
    devices, ids = cycle.get('devices'), cycle.get('device_ids')
    if not isinstance(devices, Mapping) or not isinstance(ids, list) or not ids or set(devices) != set(ids):
        return False
    for device_id, outcome in devices.items():
        if not isinstance(outcome, Mapping):
            return False
        sample = outcome.get('snapshot') or {}
        if (outcome.get('state') != 'verified' or outcome.get('device_id') != device_id
                or sample.get('device_id') != device_id
                or str(sample.get('status') or sample.get('control_state') or '').lower() not in RUNNING
                or sample.get('alarm_code') or sample.get('active_alarms')):
            return False
    return True


def with_current_restart_results(orders, backend):
    """Old open tabs already prefer an API machine_control over their local error."""
    confirmed = [order for order in orders if _poststart_confirmed(order)]
    if not confirmed:
        return orders
    try:
        line = backend.status()
    except BackendServiceError:
        return orders
    if (not isinstance(line, Mapping) or line.get('state') != 'running'
            or not isinstance(line.get('faults'), list)
            or any(f.get('resolved') is not True for f in line['faults'])):
        return orders
    updates = {}
    for order in confirmed:
        cycle = next((c for c in reversed(line.get('completed_cycles') or [])
            if c.get('state') == 'running' and c.get('generation') == line.get('generation')
            and order.get('event_id') in (c.get('event_ids') or [])
            and any(f.get('event_id') == order.get('event_id') and f.get('device_id') == order.get('device_id')
                    for f in c.get('faults') or [])
            and _verified_devices(c)), None)
        if cycle:
            updates[order['workorder_id']] = {
                'state': 'running', 'source': 'persisted_line_restart',
                'generation': line['generation'], 'cycle_id': cycle['cycle_id'],
                'verified_at': cycle.get('restarted_at'),
            }
    return [{**order, 'machine_control': updates[order['workorder_id']]}
            if order.get('workorder_id') in updates else order for order in orders]
