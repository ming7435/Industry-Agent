"""Project report directory fields in SQL; preserve full bodies for detail reads."""
import json


FIELDS = ('report_id', 'title', 'report_type', 'status', 'validation_findings',
          'created_at', 'updated_at', 'persisted', 'workorder_id', 'workorder_ids')


def report_index_sql(names=FIELDS):
    fields = []
    for field in names:
        paths = [f"JSON_EXTRACT(payload,'$.report.{field}')", f"JSON_EXTRACT(payload,'$.{field}')"]
        if field in {'report_id', 'updated_at'}:
            paths.reverse()
        if field == 'workorder_id':
            paths += ["JSON_EXTRACT(payload,'$.report.sections.workorder.workorder_id')",
                      "JSON_EXTRACT(payload,'$.sections.workorder.workorder_id')"]
        fields.extend(("'" + field + "'", 'COALESCE(' + ','.join(paths) + ')'))
    return 'JSON_OBJECT(' + ','.join(fields) + ')'


def report_view_sql():
    article_fields = ('article_title', 'article_subtitle', 'article_text', 'article_outline', 'summary', 'concise_sections')
    quality = "COALESCE(JSON_EXTRACT(payload,'$.report.sections.quality'),JSON_EXTRACT(payload,'$.sections.quality'))"
    return report_index_sql(FIELDS + article_fields)[:-1] + ", 'sections',JSON_OBJECT('quality'," + quality + '))'


def saved_report_view(payload, identifier):
    if payload is None:
        return None
    item = json.loads(payload)
    if not (isinstance(item.get('article_text'), str) and item['article_text'].strip()) and item.get('report_type') != 'quality_report':
        return None
    item['report_id'] = item.get('report_id') or identifier
    return item


def read_report_index(rows, workorder_id=''):
    items = []
    for identifier, payload in rows:
        item = json.loads(payload)
        item['report_id'] = item.get('report_id') or identifier
        if workorder_id and workorder_id != item.get('workorder_id') and workorder_id not in (item.get('workorder_ids') or []):
            continue
        items.append(item)
    items.sort(key=lambda item: str(item.get('created_at') or item.get('updated_at') or ''), reverse=True)
    return items
