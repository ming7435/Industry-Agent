"""长期调用轨迹存于 MySQL：索引查询、短事务，不扫描巨大事件上下文。"""
import json
from contextlib import contextmanager
from threading import Lock
from time import monotonic
from shared.persistence import StorageUnavailable, mysql_session, mysql_configuration
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


def _skill_window_projection():
    """仅传统计所需字段，不能复制完整任务、模型上下文或工具返回正文。"""
    fields = []
    for key in ('timestamp', 'trace_record_id', 'trace_id', 'task_id', 'agent_run_id', 'agent', 'type',
                'event', 'skill', 'skill_version', 'skill_fingerprint', 'declared_steps', 'step',
                'run_type', 'step_run_id', 'elapsed_ms', 'error'):
        fields.extend(("'%s'" % key, "JSON_EXTRACT(payload,'$.%s')" % key))
    output_fields = []
    for key in ('status', 'stop_reason', 'validation_errors', 'validation_findings', 'validation',
                'error', 'success', 'summary', 'active_skills', 'source', 'model', 'cached'):
        # AgentResult 的内层 output 和直接业务结果都兼容。
        value = "COALESCE(JSON_EXTRACT(payload,'$.output.output.%s'),JSON_EXTRACT(payload,'$.output.%s'))" % (key, key)
        output_fields.extend(("'%s'" % key, value))
    fields.extend(("'output'", 'JSON_OBJECT(' + ','.join(output_fields) + ')'))
    return 'JSON_OBJECT(' + ','.join(fields) + ')'


_SKILL_WINDOW_PROJECTION = _skill_window_projection()


class MySQLTraceStore:
    def __init__(self, config=None):
        self._config = dict(config or mysql_configuration())
        self._append_lock = Lock()
        self._append_connection = None
        self._append_opened_at = self._append_last_used = 0.0
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

    def _discard_append_connection(self):
        import mysql.connector
        connection, self._append_connection = self._append_connection, None
        if connection is not None:
            try:
                connection.close()
            except mysql.connector.Error:
                pass

    @contextmanager
    def _append_session(self):
        """只复用轨迹写连接；逐条同步提交，不重试可能已经提交的记录。"""
        import mysql.connector
        with self._append_lock:
            now = monotonic()
            if self._append_connection is not None and (
                now - self._append_last_used >= 30 or now - self._append_opened_at >= 300
            ):
                self._discard_append_connection()
            try:
                if self._append_connection is None:
                    self._append_connection = mysql.connector.connect(**self._config, autocommit=False)
                    self._append_opened_at = monotonic()
                yield self._append_connection
                self._append_connection.commit()
                self._append_last_used = monotonic()
            except BaseException as error:
                if self._append_connection is not None:
                    try:
                        self._append_connection.rollback()
                    except mysql.connector.Error:
                        pass
                # 断线、提交回执丢失及调用者中断都必须弃用连接，绝不重放该条。
                self._discard_append_connection()
                if isinstance(error, mysql.connector.Error):
                    code = f"（错误码 {error.errno}）" if isinstance(error.errno, int) else ""
                    raise StorageUnavailable("MySQL 轨迹存储不可用，请检查本地连接和权限" + code) from None
                raise

    def close(self):
        """释放本实例拥有的唯一写连接，不影响独立的查询事务。"""
        with self._append_lock:
            self._discard_append_connection()

    def __del__(self):
        try:
            self.close()
        except Exception:
            pass  # 构造失败或解释器退出时可能已无锁/驱动模块。

    def append(self, record):
        with self._append_session() as db:
            cursor = db.cursor()
            try:
                cursor.execute('INSERT INTO agent_execution_trace(trace_id,task_id,payload) VALUES (%s,%s,%s)',
                               (str(record.get('trace_id') or ''), str(record.get('task_id') or ''), json.dumps(record, ensure_ascii=False)))
            finally:
                cursor.close()

    def list(self, trace_id=None, task_id=None, limit=5000):
        return self._list(trace_id=trace_id, task_id=task_id, limit=limit)

    def skill_window_page(self, start, end, after=0, upper=None, limit=200):
        from datetime import timezone
        if start.tzinfo is None or end.tzinfo is None or start >= end:
            raise ValueError('技能观测窗口必须有时区且结束晚于开始')
        bounds = (start.astimezone(timezone.utc).replace(tzinfo=None),
                  end.astimezone(timezone.utc).replace(tzinfo=None))
        limit = max(1, min(200, int(limit)))
        with mysql_session(self._config) as db:
            cursor = db.cursor()
            try:
                if upper is None:
                    cursor.execute('SELECT COALESCE(MAX(sequence_id),0) FROM agent_execution_trace')
                    upper = int(cursor.fetchone()[0])
                cursor.execute('SELECT sequence_id,' + _SKILL_WINDOW_PROJECTION +
                               ' FROM agent_execution_trace WHERE created_at>=%s AND created_at<%s'
                               ' AND sequence_id>%s AND sequence_id<=%s ORDER BY sequence_id ASC LIMIT %s',
                               (*bounds, max(0, int(after)), max(0, int(upper)), limit))
                rows = cursor.fetchall()
                return {'items': [json.loads(row[1]) for row in rows],
                        'after': int(rows[-1][0]) if rows else after, 'upper': upper,
                        'done': len(rows) < limit, 'complete': True, 'storage': 'mysql'}
            finally:
                cursor.close()

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
