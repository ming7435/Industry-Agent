"""Bounded public assignment facts, excluding business snapshots and feedback."""
from collections.abc import Mapping


ORDER_FIELDS = (
    'workorder_id', 'plan_id', 'device_id', 'event_id', 'alarm_code', 'status',
    'assignee', 'assignee_name', 'priority', 'risk_level', 'source',
    'created_at', 'updated_at', 'started_at', 'completed_at', 'closed_at',
)
_RESULT_FIELDS = (*ORDER_FIELDS, 'action', 'success', 'found', 'error', 'reason', 'stop_reason', 'backend')


def _fields(value, fields):
    return {key: item[:1024] if isinstance(item, str) else item
            for key in fields if isinstance(item := value.get(key), (str, bool, int, float))}


def compact_workorder_result(value):
    """Preserve owner/status identities without recursively copying an order."""
    if not isinstance(value, Mapping):
        return {}
    result = _fields(value, _RESULT_FIELDS)
    nested = value.get('workorder')
    if isinstance(nested, Mapping):
        result['workorder'] = _fields(nested, ORDER_FIELDS)
    findings = value.get('validation_findings')
    if isinstance(findings, (list, tuple)):
        result['validation_findings'] = [item[:512] for item in findings[:16] if isinstance(item, str)]
    return result


def plan_execution_identity(result):
    """A current order must match the plan, device and original event together."""
    plan = result.get('maintenance_plan') or {}
    event = result.get('event') or {}
    diagnosis = result.get('diagnosis') or {}
    if not all(isinstance(item, Mapping) for item in (plan, event, diagnosis)):
        return None
    values = (plan.get('plan_id'), event.get('device_id') or diagnosis.get('device_id') or plan.get('device_id'),
              event.get('event_id') or diagnosis.get('event_id'))
    return tuple(values) if all(isinstance(item, str) and item for item in values) else None


def reconcile_plan_workorders(results, orders):
    """Refresh read projections only; ambiguous/missing authority is not a dispatch."""
    by_identity = {}
    for order in orders:
        if not isinstance(order, Mapping):
            continue
        identity = tuple(order.get(key) for key in ('plan_id', 'device_id', 'event_id'))
        if all(isinstance(item, str) and item for item in identity):
            by_identity.setdefault(identity, []).append(order)
    refreshed = []
    for source in results:
        result = dict(source)
        identity = plan_execution_identity(result)
        if identity is None:
            refreshed.append(result)
            continue
        saved = compact_workorder_result(result.get('workorder'))
        matching = by_identity.get(identity, [])
        saved_id = saved.get('workorder_id') or (saved.get('workorder') or {}).get('workorder_id')
        exact = [item for item in matching if saved_id and item.get('workorder_id') == saved_id]
        selected = exact[0] if len(exact) == 1 else matching[0] if len(matching) == 1 else None
        if selected is None:
            result.pop('workorder', None)
        else:
            actual = _fields(selected, ORDER_FIELDS)
            assigned = bool(actual.get('assignee'))
            waiting = (not assigned and actual.get('status') == 'open' and saved_id == actual.get('workorder_id')
                       and (saved.get('status') == 'waiting_for_personnel' or saved.get('stop_reason') == 'personnel_query_failed'))
            result['workorder'] = {
                **(saved if waiting else {}),
                'workorder_id': actual.get('workorder_id', ''), 'assignee': actual.get('assignee', ''),
                'success': assigned, 'status': saved.get('status') if waiting else actual.get('status', ''),
                'workorder': actual,
            }
        refreshed.append(result)
    return refreshed
