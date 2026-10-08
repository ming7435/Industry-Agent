"""删除业务实体的正文，事件身份和独立诊断记录仍可追溯。"""
from hashlib import sha256


def creation_deletion_key(order):
    key = str(order.get('idempotency_key') or '')
    return sha256(key.encode()).hexdigest() if key else ''


def order_plan_ids(order):
    ids = [order.get('plan_id'), (order.get('maintenance_plan_snapshot') or {}).get('plan_id')]
    for revision in order.get('plan_revisions') or []:
        ids.extend((revision.get('previous_plan_id'), revision.get('plan_id')))
    return list(dict.fromkeys(str(identifier) for identifier in ids if identifier))


def deletion_records(order, audit, plan_ids):
    receipt = {'workorder_id': order['workorder_id'], 'assignee': order.get('assignee', ''),
               'actor_id': audit['operator'], 'deleted_at': audit['created_at'], 'deleted_plan_ids': plan_ids}
    records = [('audit', audit['audit_id'], audit), ('workorder_deleted', order['workorder_id'], receipt)]
    key = creation_deletion_key(order)
    if key:
        records.append(('workorder_creation_deleted', key, {'workorder_id': order['workorder_id']}))
    records.extend(('maintenance_plan_deleted', plan_id, {'plan_id': plan_id,
        'workorder_id': order['workorder_id'], 'deleted_at': audit['created_at'], 'actor_id': audit['operator']})
        for plan_id in plan_ids)
    return records


def deleted_entities(value, plan_ids, workorder_ids=()):
    """移除正文中的方案/工单对象；不复制巨大字符串，也不移除独立诊断。"""
    plans, orders = set(plan_ids), set(workorder_ids)
    omitted = object()

    def visit(node):
        if isinstance(node, dict):
            if node.get('workorder_id') in orders:
                return omitted
            if node.get('plan_id') in plans and not node.get('workorder_id'):
                return omitted
            result = {}
            for key, child in node.items():
                updated = visit(child)
                if updated is not omitted:
                    result[key] = updated
            return result
        if isinstance(node, list):
            return [updated for child in node if (updated := visit(child)) is not omitted]
        return node

    result = visit(value)
    return {} if result is omitted else result


def event_plan_id(value):
    result = value.get('result', {}) if value.get('_event_result_store_version') == 2 else value
    return str((result.get('maintenance_plan') or {}).get('plan_id') or '')
