"""候选稿和审核记录复用MySQL短事务CAS，不增加SQLite或本地JSON数据库。"""
from threading import Lock


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
