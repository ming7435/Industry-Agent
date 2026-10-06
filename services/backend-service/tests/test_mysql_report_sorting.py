"""隔离 MySQL 复现大型 JSON 报告排序错误，不修改实际业务表。"""
from pathlib import Path
from uuid import uuid4
import pytest
from app.workorder.repository import MySQLRepository


def test_large_reports_are_read_without_sorting_json_payload(monkeypatch):
    import mysql.connector
    from dotenv import dotenv_values
    values = dotenv_values(Path(__file__).resolve().parents[3] / '.env')
    config = {'host': values.get('MYSQL_HOST') or '127.0.0.1', 'port': int(values.get('MYSQL_PORT') or 3306),
              'user': values.get('MYSQL_USER') or 'root', 'password': values.get('MYSQL_PASSWORD') or '',
              'connection_timeout': 5}
    database = 'industry_report_test_' + uuid4().hex[:12]
    try:
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        cursor.execute('CREATE DATABASE `' + database + '` CHARACTER SET utf8mb4')
        cursor.close()
        connection.close()
    except mysql.connector.Error:
        pytest.fail('隔离 MySQL 测试基础设施不可用（连接信息已隐藏）', pytrace=False)
    for name, value in config.items():
        if name != 'connection_timeout':
            monkeypatch.setenv('MYSQL_' + name.upper(), str(value))
    monkeypatch.setenv('MYSQL_DATABASE', database)
    repository = MySQLRepository()
    for index in range(8):
        repository.save_record('report', 'RPT-' + str(index), {'report_id': 'RPT-' + str(index), 'sections': {'notes': '中文报告' * 40000}})
    records = repository.list_records('report')
    assert len(records) == 8
    assert len(records[0]['sections']['notes']) == 160000
