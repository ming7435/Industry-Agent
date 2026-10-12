"""候选稿和审核记录复用MySQL短事务CAS，不增加SQLite或本地JSON数据库。"""
from threading import Lock
from contextlib import contextmanager
from datetime import datetime, timezone
from time import time

from app.skills.management import SkillEditError


class EvolutionStore:
    def __init__(self):
        self._store = None
        self._lock = Lock()

    def _backend(self):
        with self._lock:
            if self._store is None:
                from shared.persistence import MySQLJsonStore
                self._store = MySQLJsonStore()
            return self._store

    def get(self, *args):
        return self._backend().get(*args)

    def values(self, *args, **kwargs):
        return self._backend().values(*args, **kwargs)

    def get_or_create(self, *args):
        return self._backend().get_or_create(*args)

    def compare_and_set(self, *args):
        return self._backend().compare_and_set(*args)

    @contextmanager
    def publication_fence(self, expected, audit):
        """文件锁内取得MySQL行锁，仅在最终本地原子替换期间持有短事务。

        会话、模型、设备请求均已结束。其它进程不能在校验所有权后、替换文件
        前撤销租约。文件与数据库无法组成分布式原子事务，提交不确定时只读对账。
        """
        from shared.persistence import _decode
        store = self._backend()
        ns, digest, key = store._identity('skill_evolution', expected['proposal_id'])
        with store._session() as cursor:
            cursor.execute('SELECT payload FROM runtime_records_mysql WHERE namespace=%s AND key_hash=%s FOR UPDATE',
                           (ns, digest))
            row = cursor.fetchone()
            current = _decode(row['payload']) if row else None
            if (not current or current.get('status') != 'publishing' or current.get('lease_until', 0) <= time() or
                    any(current.get(field) != expected.get(field) for field in
                        ('revision', 'owner_instance', 'candidate_hash', 'confirmation_id', 'test_id',
                         'publish_requested_by', 'publish_request_id')) or
                    not current.get('publish_request_id') or
                    current.get('publish_requested_by') != current.get('confirmed_by') or
                    current.get('publish_applied')):
                raise SkillEditError(409, '发布所有权已失效，未替换技能文件')
            yield
            current.update(revision=current['revision'] + 1, lease_until=time() + 180,
                           updated_at=datetime.now(timezone.utc).isoformat(),
                           publish_applied={'edit_id': audit['edit_id'], 'revision': audit['new_revision']})
            store._write(cursor, ns, key, current)
