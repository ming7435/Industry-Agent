"""隔离 MySQL 验证调用轨迹跨进程重建仍可查询。"""
from pathlib import Path
from uuid import uuid4
import pytest
from app.harness.trace import TraceRecorder


def test_trace_survives_recorder_reconstruction_and_filters_task():
    import mysql.connector
    from dotenv import dotenv_values
    values = dotenv_values(Path(__file__).resolve().parents[2] / '.env')
    config = {'host': values.get('MYSQL_HOST') or '127.0.0.1', 'port': int(values.get('MYSQL_PORT') or 3306),
              'user': values.get('MYSQL_USER') or 'root', 'password': values.get('MYSQL_PASSWORD') or '', 'connection_timeout': 5}
    config['database'] = 'industry_trace_test_' + uuid4().hex[:12]
    connection = mysql.connector.connect(**{key: value for key, value in config.items() if key != 'database'})
    cursor = connection.cursor()
    cursor.execute('CREATE DATABASE `' + config['database'] + '` CHARACTER SET utf8mb4')
    cursor.close()
    connection.close()
    from app.harness.trace_store import MySQLTraceStore
    first = TraceRecorder(store=MySQLTraceStore(config))
    first.record(type='agent', event='agent_started', task_id='Q-1', trace_id='T-1', agent_run_id='A-1', input={'password': 'TEST-SECRET', 'part_id': 'P-1'})
    first.record(type='tool', event='tool_completed', task_id='Q-2', trace_id='T-2', output={'passed': False})
    fresh = TraceRecorder(store=MySQLTraceStore(config))
    records = fresh.list(trace_id='T-1')
    assert len(records) == 1 and records[0]['agent_run_id'] == 'A-1'
    assert 'TEST-SECRET' not in str(records)
    assert fresh.list(task_id='Q-2')[0]['output'] == {'passed': False}
    assert fresh.list(limit=0) == []
