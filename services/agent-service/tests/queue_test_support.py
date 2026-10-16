"""消息任务测试专用临时 MySQL；默认不连接任何数据库。"""
import json
import os
from uuid import uuid4

import pytest


@pytest.fixture(scope='session')
def queue_mysql_config():
    raw = os.getenv('QUEUE_TEST_MYSQL_CONFIG')
    if not raw:
        pytest.skip('需显式提供隔离 MySQL 测试连接；禁止隐式连接业务数据库')
    import mysql.connector
    config = json.loads(raw)
    config.pop('database', None)
    config.pop('pool_name', None)
    name = 'queue_test_' + uuid4().hex
    connection = mysql.connector.connect(**config)
    try:
        cursor = connection.cursor()
        cursor.execute('CREATE DATABASE `' + name + '`')
        cursor.close()
        yield {**config, 'database': name}
    finally:
        # 名称在本函数生成且校验，只清理本次测试创建的数据库。
        assert name.startswith('queue_test_') and len(name) == 43
        cursor = connection.cursor()
        cursor.execute('DROP DATABASE IF EXISTS `' + name + '`')
        cursor.close()
        connection.close()


@pytest.fixture
def jobs(queue_mysql_config):
    import importlib.util
    assert importlib.util.find_spec('app.runtime.event_jobs'), '尚未实现持久化事件任务'
    from app.runtime.event_jobs import MySQLEventJobs
    return MySQLEventJobs(queue_mysql_config, partitions=4, prefix='test_' + uuid4().hex[:12])


def event(identifier='E-1', device='D-1', **extra):
    return {'event_id': identifier, 'device_id': device, 'tenant_id': 'plant-1',
            'event_revision': 1, 'alarm_code': '700001', **extra}
