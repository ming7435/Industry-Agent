"""Read-only reconciliation of the exact work-order creation identity."""
import json


def order_matches(order, key, event, plan):
    device_id = str(event.get('device_id') or plan.get('device_id') or (plan.get('diagnosis') or {}).get('device_id') or '')
    if not device_id or order.get('deleted_at') or order.get('idempotency_key') != key or order.get('device_id') != device_id:
        return False
    if event.get('event_id') and order.get('event_id') != event['event_id']:
        return False
    if not plan.get('plan_id') or order.get('plan_id') != plan['plan_id'] or not order.get('workorder_id'):
        return False
    frozen = order.get('maintenance_plan_snapshot') or {}
    keys = set(plan) - {'source', 'idempotency_key', 'event_id', 'diagnosis_snapshot', 'maintenance_plan_snapshot'}
    return all(json.dumps(frozen.get(key), sort_keys=True, default=str) == json.dumps(plan[key], sort_keys=True, default=str) for key in keys)


def find_saved_order(tools, action, state):
    event, plan = state.get('event') or {}, state.get('maintenance_plan') or {}
    device_id = str(event.get('device_id') or plan.get('device_id') or (plan.get('diagnosis') or {}).get('device_id') or '')
    data = tools.execute('list_workorders', {'device_id': device_id},
                         context={'agent': 'runtime', 'step': 'reconcile_saved_workorder'})
    if data.get('success') is False or not isinstance(data.get('items'), list):
        raise RuntimeError('工单权威状态暂不可读取，未重复创建')
    return next((order for order in data['items'] if order_matches(order, action.idempotency_key, event, plan)), None)


def resolver_factory(tools):
    def factory(action, state):
        if not action.idempotency_key:
            return None
        def resolve():
            order = find_saved_order(tools, action, state)
            if order and order.get('assignee'):
                return {'action': 'create', 'success': True, 'workorder': order,
                        'workorder_id': order['workorder_id'], 'status': order.get('status'), 'assignee': order['assignee'],
                        'evidence': [{'id': order['workorder_id'], 'source': 'authoritative_workorder'}]}
            return None
        return resolve
    return factory
