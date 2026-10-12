"""Opt-in regression using real MySQL JSON, in a new isolated test database."""
import json
import os
from pathlib import Path
from uuid import uuid4

import pytest

from app.quality_simulation.service import SimulatedQualityService
from app.workorder.repository import MySQLRepository
from test_simulated_quality import flange, station


class SafeConfig(dict):
    def __repr__(self):
        return '<isolated MySQL configuration; credentials hidden>'


@pytest.fixture
def mysql_repository(monkeypatch):
    if os.getenv('QUALITY_MYSQL_TEST') != '1':
        pytest.skip('Set QUALITY_MYSQL_TEST=1 for the isolated real MySQL test')
    import mysql.connector
    from scripts.start_all import _env_for_service
    root = Path(__file__).resolve().parents[3]
    env = _env_for_service(root / 'services/backend-service')
    config = SafeConfig(host=env.get('MYSQL_HOST', '127.0.0.1'), port=int(env.get('MYSQL_PORT', '3306')),
                        user=env.get('MYSQL_USER', 'industry'),
                        password=env.get('MYSQL_PASSWORD', env.get('MYSQL_APP_PASSWORD', '')),
                        connection_timeout=5)
    database = 'industry_quality_precision_test_' + uuid4().hex[:12]
    connection = mysql.connector.connect(**config)
    try:
        cursor = connection.cursor()
        cursor.execute('CREATE DATABASE `' + database + '` CHARACTER SET utf8mb4')
        cursor.close()
    finally:
        connection.close()
    # Never drop an existing database or touch the configured business database.
    for key in ('host', 'port', 'user', 'password'):
        monkeypatch.setenv('MYSQL_' + key.upper(), str(config[key]))
    monkeypatch.setenv('MYSQL_DATABASE', database)
    monkeypatch.setenv('QUALITY_SIMULATION_ENABLED', 'true')
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    monkeypatch.setenv('APP_ENV', 'development')
    return MySQLRepository()


def test_real_mysql_preserves_precision_across_detection_refresh_and_repeat(mysql_repository):
    service = SimulatedQualityService(mysql_repository)
    run = flange()
    run.update(part_name='渐开线直齿轮', part_number='93594')
    run['spec'] = {'units': 'mm', 'operations': [
        {'type': 'gear', 'module': 2, 'teeth': 20, 'width': 10, 'pressure_angle': 20}]}
    run['validation']['bounds_mm'] = [44.00000020000001, 44.00000020000001, 10.000000199999999]
    first = service.detect('U-1', 'real-mysql-first', run, station())
    # Reconstruct both service and repository: no in-memory copy can hide loss.
    reopened = SimulatedQualityService(MySQLRepository())
    refreshed = reopened.design('U-1', run['run_id'])
    assert refreshed['basis']['validation']['bounds_mm'][2] == 10.000000199999999
    z = next(p for p in refreshed['basis']['parameters'] if p['key'] == 'model.bounds_mm.2')
    assert z['expected'] == '10.000000199999999'
    assert refreshed['latest'] == first
    assert reopened.request('U-1', 'real-mysql-first') == first
    assert reopened.designs('U-1')[0]['part_number'] == '93594'
    second = reopened.detect('U-1', 'real-mysql-second', run, station())
    assert second['batch_id'] != first['batch_id']
    assert reopened.request('U-1', 'real-mysql-second') == second
    assert second['item_summary']['rates']['qualified'] is not None
    assert second['counts']['pending'] == 10  # Incomplete gear features remain pending.
    assert reopened.repository.list_records('quality') == []
    changed = json.loads(json.dumps(run))
    changed['spec']['operations'][0]['width'] = 11
    with pytest.raises(ValueError):
        reopened.detect('U-1', 'real-mysql-changed', changed, station())
