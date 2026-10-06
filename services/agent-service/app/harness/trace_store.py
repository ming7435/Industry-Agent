"""长期调用轨迹存于 MySQL：索引查询、短事务，不扫描巨大事件上下文。"""
import json
from shared.persistence import mysql_session, mysql_configuration


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
                    cursor.execute('SELECT sequence_id,payload FROM agent_execution_trace WHERE sequence_id IN (' + ','.join(['%s'] * len(chunk)) + ')', tuple(chunk))
                    records.update({row[0]: json.loads(row[1]) for row in cursor.fetchall()})
                return [records[key] for key in reversed(ids) if key in records]
            finally:
                cursor.close()
