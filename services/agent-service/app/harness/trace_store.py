"""长期调用轨迹存于 MySQL：索引查询、短事务，不扫描巨大事件上下文。"""
import json
from shared.persistence import mysql_session, mysql_configuration
from .runs import RUN_INDEX_SHAPE, run_index_record


def _run_index_sql(shape, prefix='$'):
    fields = []
    for key, nested in shape.items():
        path = prefix + '.' + key
        if isinstance(nested, dict):
            value = _run_index_sql(nested, path)
        else:
            extract = "JSON_EXTRACT(payload, '%s')" % path
            # 旧版 result 也可能保存完整对象，不能把正文带入运行索引。
            value = "CASE WHEN JSON_TYPE(%s) IN ('OBJECT','ARRAY') THEN NULL ELSE %s END" % (extract, extract)
        fields.extend(("'%s'" % key, value))
    return 'JSON_MERGE_PATCH(JSON_OBJECT(),JSON_OBJECT(' + ','.join(fields) + '))'


# 删除不存在字段的 null 值，避免每条索引行传输数百个空字段。
_RUN_INDEX_PROJECTION = _run_index_sql(RUN_INDEX_SHAPE)


class MySQLTraceStore:
    def __init__(self, config=None):
        self._config = dict(config or mysql_configuration())
        with mysql_session(self._config) as db:
            cursor = db.cursor()
            try:
                cursor.execute('CREATE TABLE IF NOT EXISTS agent_execution_trace ('
                               'sequence_id BIGINT AUTO_INCREMENT PRIMARY KEY, '
                               'trace_id VARCHAR(255) NOT NULL, task_id VARCHAR(255) NOT NULL, '
                               'payload JSON NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, '
                               'INDEX trace_lookup(trace_id,sequence_id), INDEX task_lookup(task_id,sequence_id))')
            finally:
                cursor.close()

    def append(self, record):
        with mysql_session(self._config) as db:
            cursor = db.cursor()
            try:
                cursor.execute('INSERT INTO agent_execution_trace(trace_id,task_id,payload) VALUES (%s,%s,%s)',
                               (str(record.get('trace_id') or ''), str(record.get('task_id') or ''), json.dumps(record, ensure_ascii=False)))
            finally:
                cursor.close()

    def list(self, trace_id=None, task_id=None, limit=5000):
        return self._list(trace_id=trace_id, task_id=task_id, limit=limit)

    def list_run_index(self, limit=5000):
        return [run_index_record(record) for record in self._list(limit=limit, projection=_RUN_INDEX_PROJECTION)]

    def _list(self, trace_id=None, task_id=None, limit=5000, projection='payload'):
        clauses, parameters = [], []
        for name, value in (('trace_id', trace_id), ('task_id', task_id)):
            if value is not None:
                clauses.append(name + '=%s')
                parameters.append(str(value))
        limit = max(0, min(5000, int(limit)))
        if not limit:
            return []
        with mysql_session(self._config) as db:
            cursor = db.cursor()
            try:
                where = ' WHERE ' + ' AND '.join(clauses) if clauses else ''
                # 先取索引编号再读取 JSON，避免大型 payload 参与排序。
                cursor.execute('SELECT sequence_id FROM agent_execution_trace' + where + ' ORDER BY sequence_id DESC LIMIT %s', (*parameters, limit))
                ids = [row[0] for row in cursor.fetchall()]
                records = {}
                for offset in range(0, len(ids), 200):
                    chunk = ids[offset:offset + 200]
                    cursor.execute('SELECT sequence_id,' + projection + ' FROM agent_execution_trace WHERE sequence_id IN (' + ','.join(['%s'] * len(chunk)) + ')', tuple(chunk))
                    records.update({row[0]: json.loads(row[1]) for row in cursor.fetchall()})
                return [records[key] for key in reversed(ids) if key in records]
            finally:
                cursor.close()
