"""Bounded reusable MySQL connections, leased to one transaction at a time."""
from hashlib import sha256
import json
import os
from threading import BoundedSemaphore, Lock


_permits = {}
_lock = Lock()


class _Lease:
    def __init__(self, connection, permit):
        self._connection, self._permit = connection, permit
        self._close_lock = Lock()

    def __getattr__(self, name):
        return getattr(self._connection, name)

    def close(self):
        with self._close_lock:
            connection, self._connection = self._connection, None
            if connection is None:
                return
            try:
                connection.close()
            finally:
                self._permit.release()

    def __enter__(self):
        return self

    def __exit__(self, *exception):
        self.close()


def connect_mysql(config, connector=None):
    import mysql.connector
    from mysql.connector.errors import PoolError

    driver = connector or mysql.connector

    options = dict(config)
    options.setdefault('connection_timeout', 5)
    default = '0' if os.getenv('APP_ENV', 'development').lower() == 'testing' else '4'
    size = int(os.getenv('MYSQL_POOL_SIZE', default))
    if not 0 <= size <= 32:
        raise ValueError('MYSQL_POOL_SIZE must be between 0 and 32')
    if size == 0:
        return driver.connect(**options)

    # Include credentials and every connection option in the identity, but
    # expose only a digest to the driver. Credential rotation never reuses an
    # already-authenticated connection belonging to the previous configuration.
    identity = json.dumps([os.getpid(), size, options], sort_keys=True, default=str)
    name = 'industry_' + sha256(identity.encode('utf-8')).hexdigest()[:48]
    with _lock:
        permit = _permits.setdefault(name, BoundedSemaphore(size))
    if not permit.acquire(timeout=float(options.get('connection_timeout') or 5)):
        raise PoolError('MySQL connection pool wait timed out')
    try:
        connection = driver.connect(**options, pool_name=name,
            pool_size=size, pool_reset_session=True)
    except BaseException:
        permit.release()
        raise
    return _Lease(connection, permit)
