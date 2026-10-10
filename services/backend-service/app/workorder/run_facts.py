"""在数据库中投影生命周期字段，日志轮询不读取业务正文。"""
import json


ORDER_FIELDS = ('workorder_id', 'event_id', 'device_id', 'status', 'assignee', 'created_at', 'updated_at')
REPORT_FIELDS = ('report_id', 'report_type', 'event_id', 'event_ids', 'device_id', 'device_ids',
                 'workorder_id', 'workorder_ids', 'status', 'persisted', 'validation_findings', 'created_at', 'updated_at')
EXPERIENCE_FIELDS = ('experience_id', 'source_workorder', 'workorder_id', 'validation_status',
                     'experience_quality_score', 'rag_saved', 'learning_scope', 'memory_saved',
                     'confirmation_receipt_id', 'knowledge_sync', 'created_at', 'updated_at')


def read_run_facts(query, event_ids, *, mysql=False):
    if not event_ids:
        return {'workorders': [], 'reports': [], 'experiences': []}
    placeholder = '%s' if mysql else '?'
    def projection(fields, report=False):
        pairs = []
        for field in fields:
            paths = [f"JSON_EXTRACT(payload,'$.{field}')"]
            if report:
                paths.append(f"JSON_EXTRACT(payload,'$.report.{field}')")
                if field in {'workorder_id', 'device_id', 'event_id'}:
                    paths.extend(f"JSON_EXTRACT(payload,'$.{prefix}sections.workorder.{field}')" for prefix in ('', 'report.'))
            value = 'COALESCE(' + ','.join(paths) + ')' if len(paths) > 1 else paths[0]
            pairs.extend(("'" + field + "'", value))
        return 'JSON_OBJECT(' + ','.join(pairs) + ')'
    event_value = "JSON_EXTRACT(payload,'$.event_id')"
    if mysql:
        event_value = 'JSON_UNQUOTE(' + event_value + ')'
    marks = ','.join([placeholder] * len(event_ids))
    orders = [json.loads(row[0]) for row in query(
        'SELECT ' + projection(ORDER_FIELDS) + ' FROM workorders WHERE ' + event_value + ' IN (' + marks + ')', tuple(event_ids))]
    order_ids = {o['workorder_id'] for o in orders}
    reports = [json.loads(row[0]) for row in query(
        'SELECT ' + projection(REPORT_FIELDS, report=True) + ' FROM business_records WHERE record_type=' + placeholder, ('report',))]
    requested = set(event_ids)
    reports = [r for r in reports if r.get('event_id') in requested
               or requested.intersection(r.get('event_ids') or [])
               or r.get('workorder_id') in order_ids
               or order_ids.intersection(r.get('workorder_ids') or [])]
    experiences = []
    if order_ids:
        source = "COALESCE(JSON_EXTRACT(payload,'$.source_workorder'),JSON_EXTRACT(payload,'$.workorder_id'))"
        if mysql:
            source = 'JSON_UNQUOTE(' + source + ')'
        marks = ','.join([placeholder] * len(order_ids))
        experiences = [json.loads(row[0]) for row in query(
            'SELECT ' + projection(EXPERIENCE_FIELDS) + ' FROM business_records WHERE record_type=' + placeholder
            + ' AND ' + source + ' IN (' + marks + ')', ('experience', *sorted(order_ids)))]
    return {'workorders': orders, 'reports': reports, 'experiences': experiences}
