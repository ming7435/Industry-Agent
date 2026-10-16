"""MySQL 事件任务及事务发件箱；事务中只做状态读写，不调用模型或消息服务。"""
from contextlib import contextmanager
from hashlib import sha256
import json
import re

from shared.persistence import mysql_session
from .event_store import scoped_event_key


def event_identity(event):
    if not isinstance(event, dict) or not str(event.get('event_id') or '').strip() \
            or not str(event.get('device_id') or '').strip():
        raise ValueError('事件编号和设备编号不能为空')
    revision = event.get('event_revision', 1)
    if isinstance(revision, bool) or str(revision) != str(int(revision)) or int(revision) < 1:
        raise ValueError('事件修订必须是正整数')
    key = scoped_event_key(event)
    fingerprint = sha256(json.dumps(event, ensure_ascii=False, sort_keys=True, default=str).encode()).hexdigest()
    device = json.dumps([str(event.get('tenant_id') or ''), str(event['device_id'])], ensure_ascii=False)
    return sha256(key.encode()).hexdigest(), fingerprint, sha256(device.encode()).hexdigest()


class MySQLEventJobs:
    """任务入库即包含待发送标记，避免“数据库已写、消息未发”的双写缺口。"""

    def __init__(self, config=None, *, partitions=16, prefix='agent_event'):
        if not re.fullmatch(r'[a-z][a-z0-9_]{0,39}', prefix) or not 1 <= int(partitions) <= 64:
            raise ValueError('队列名称或分区数量无效')
        self.config, self.partitions, self.prefix = config, int(partitions), prefix
        self.table, self.devices, self.meta = prefix + '_jobs', prefix + '_devices', prefix + '_queue_meta'
        with self.session() as cursor:
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {self.meta} (id INT PRIMARY KEY, partitions INT NOT NULL, transport_prefix VARCHAR(100)) ENGINE=InnoDB')
            cursor.execute(f'INSERT IGNORE INTO {self.meta}(id,partitions) VALUES (1,%s)', (self.partitions,))
            cursor.execute(f'SELECT partitions FROM {self.meta} WHERE id=1')
            if cursor.fetchone()['partitions'] != self.partitions:
                raise ValueError('已有任务队列的分区数量不能直接修改；需先排空并进行兼容迁移')
            cursor.execute(f'CREATE TABLE IF NOT EXISTS {self.devices} (device_key CHAR(64) PRIMARY KEY) ENGINE=InnoDB')
            cursor.execute(f'''CREATE TABLE IF NOT EXISTS {self.table} (
                sequence_id BIGINT AUTO_INCREMENT PRIMARY KEY, job_id CHAR(64) NOT NULL UNIQUE,
                fingerprint CHAR(64) NOT NULL, device_key CHAR(64) NOT NULL, partition_id INT NOT NULL,
                payload MEDIUMTEXT NOT NULL, status VARCHAR(16) NOT NULL DEFAULT 'queued',
                published BOOLEAN NOT NULL DEFAULT FALSE, owner VARCHAR(64) NOT NULL DEFAULT '',
                error_code VARCHAR(64) NOT NULL DEFAULT '',
                created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
                updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX device_order(device_key,status,sequence_id), INDEX outbox(status,published,sequence_id)
            ) ENGINE=InnoDB''')

    @contextmanager
    def session(self):
        with mysql_session(self.config) as connection:
            cursor = connection.cursor(dictionary=True)
            try:
                yield cursor
            finally:
                cursor.close()

    @staticmethod
    def decode(row):
        return {**row, 'event': json.loads(row['payload'])} if row else None

    def submit(self, event):
        job_id, fingerprint, device_key = event_identity(event)
        payload = json.dumps(event, ensure_ascii=False, default=str)
        if len(payload.encode()) > 1024 * 1024:
            raise ValueError('事件内容超过 1 MiB，请通过证据引用传递大文件')
        with self.session() as cursor:
            cursor.execute(f'INSERT IGNORE INTO {self.devices}(device_key) VALUES (%s)', (device_key,))
            cursor.execute(f'''INSERT IGNORE INTO {self.table}
                (job_id,fingerprint,device_key,partition_id,payload) VALUES (%s,%s,%s,%s,%s)''',
                (job_id, fingerprint, device_key, int(device_key, 16) % self.partitions, payload))
            cursor.execute(f'SELECT * FROM {self.table} WHERE job_id=%s', (job_id,))
            row = cursor.fetchone()
            if row['fingerprint'] != fingerprint:
                raise ValueError('相同事件修订的请求参数不一致')
        return self.decode(row)

    def get(self, job_id):
        with self.session() as cursor:
            cursor.execute(f'SELECT * FROM {self.table} WHERE job_id=%s', (job_id,))
            return self.decode(cursor.fetchone())

    def pending(self, limit=100):
        with self.session() as cursor:
            cursor.execute(f'''SELECT j.* FROM {self.table} j
                WHERE j.status='queued' AND j.published=FALSE AND NOT EXISTS
                (SELECT 1 FROM {self.table} p WHERE p.device_key=j.device_key
                 AND p.sequence_id<j.sequence_id AND p.status IN ('queued','running','unknown'))
                ORDER BY j.sequence_id LIMIT %s''', (max(1, min(int(limit), 100)),))
            return [self.decode(row) for row in cursor.fetchall()]

    def published(self, job_id):
        with self.session() as cursor:
            cursor.execute(f'UPDATE {self.table} SET published=TRUE WHERE job_id=%s', (job_id,))

    def claim(self, job_id, owner):
        record = self.get(job_id)
        if record is None:
            return 'missing'
        with self.session() as cursor:
            # 跨进程短事务设备锁；绝不持锁等待模型或人工审批。
            cursor.execute(f'SELECT device_key FROM {self.devices} WHERE device_key=%s FOR UPDATE', (record['device_key'],))
            cursor.fetchone()
            cursor.execute(f'SELECT * FROM {self.table} WHERE job_id=%s FOR UPDATE', (job_id,))
            row = cursor.fetchone()
            if row['status'] == 'succeeded':
                return 'done'
            if row['status'] == 'failed':
                return 'failed'
            if row['status'] in {'running', 'unknown'}:
                return 'reconcile'
            cursor.execute(f'''SELECT job_id FROM {self.table} WHERE device_key=%s AND sequence_id<%s
                AND status IN ('queued','running','unknown') LIMIT 1''', (row['device_key'], row['sequence_id']))
            if cursor.fetchone():
                return 'blocked'
            cursor.execute(f"UPDATE {self.table} SET status='running',owner=%s,published=TRUE WHERE job_id=%s", (owner, job_id))
            return 'execute'

    def finish(self, job_id, owner, status, error_code=''):
        if status not in {'succeeded', 'unknown', 'failed'}:
            raise ValueError('非法任务结束状态')
        with self.session() as cursor:
            cursor.execute(f'''UPDATE {self.table} SET status=%s,error_code=%s
                WHERE job_id=%s AND owner=%s AND status IN ('running','unknown')''',
                (status, error_code[:64], job_id, owner))
            return cursor.rowcount == 1

    def reconcile(self, job_id, *, completed=False):
        """只能依据原事件结果清除不确定状态；没有结果时禁止重新执行。"""
        with self.session() as cursor:
            cursor.execute(f"UPDATE {self.table} SET status=%s,error_code=%s WHERE job_id=%s AND status IN ('running','unknown')",
                           ('succeeded' if completed else 'unknown', '' if completed else 'execution_outcome_unknown', job_id))

    def defer(self, job_id):
        with self.session() as cursor:
            cursor.execute(f"UPDATE {self.table} SET published=FALSE WHERE job_id=%s AND status='queued'", (job_id,))

    def counts(self):
        with self.session() as cursor:
            cursor.execute(f'SELECT status,COUNT(*) AS total FROM {self.table} GROUP BY status')
            return {row['status']: int(row['total']) for row in cursor.fetchall()}

    def unresolved(self, after=0):
        with self.session() as cursor:
            def batch(cursor_value):
                cursor.execute(f"SELECT * FROM {self.table} WHERE status IN ('running','unknown') AND sequence_id>%s ORDER BY sequence_id LIMIT 100", (int(cursor_value),))
                return cursor.fetchall()
            rows = batch(after)
            if not rows and after:
                rows = batch(0)
            return [self.decode(row) for row in rows]

    def bind_transport(self, prefix):
        with self.session() as cursor:
            cursor.execute(f'SELECT transport_prefix FROM {self.meta} WHERE id=1 FOR UPDATE')
            previous = cursor.fetchone()['transport_prefix']
            if previous is not None and previous != prefix:
                raise ValueError('已有队列的前缀不能直接修改；请先核对并迁移未完成任务')
            cursor.execute(f'UPDATE {self.meta} SET transport_prefix=%s WHERE id=1', (prefix,))

    def dead_letter(self, job_id):
        with self.session() as cursor:
            cursor.execute(f'''UPDATE {self.table} SET
                status=CASE WHEN status='queued' THEN 'failed' ELSE 'unknown' END,
                error_code='delivery_exhausted' WHERE job_id=%s AND status IN ('queued','running','unknown')''', (job_id,))
