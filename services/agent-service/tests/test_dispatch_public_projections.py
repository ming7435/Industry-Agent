"""Monitor and MySQL plan reads retain assignment facts with bounded payloads."""
from contextlib import contextmanager
import json

import pytest

from monitor_web_server import compact_public_pipeline
from app.api.maintenance_plans import list_saved_maintenance_plans
from shared.persistence import MySQLJsonStore, _decode, _encode


def pipeline(*, status='in_progress', assigned=True):
    order = {'workorder_id': 'WO-1', 'plan_id': 'PLAN-1', 'device_id': 'D-1',
             'event_id': 'EV-1', 'status': status, 'assignee': 'USER-1' if assigned else '',
             'assignee_name': '维修员甲' if assigned else '', 'started_at': '2026-10-07T08:14:22Z'}
    return {'event': {'event_id': 'EV-1', 'device_id': 'D-1', 'alarm_code': '700006'},
            'diagnosis': {'device_id': 'D-1', 'confidence': .865, 'evidence_status': 'ready',
                          'maintenance_required': True},
            'maintenance_plan': {'plan_id': 'PLAN-1', 'device_id': 'D-1', 'workorder_ready': True,
                                 'maintenance_required': True, 'repair_steps': ['停机检查'], 'validation_findings': []},
            'status': 'in_progress', 'runtime_result': {'status': 'completed'},
            'workorder': {'success': True, 'workorder_id': 'WO-1', 'status': status,
                          'assignee': order['assignee'], 'workorder': order}}


def projected_write(result):
    class Cursor:
        def execute(self, sql, values):
            self.value = _decode(values[2])
    cursor = Cursor()
    object.__new__(MySQLJsonStore)._project(cursor, 'agent_event', 'test-hash', result)
    return cursor.value


def store_for_read(results, orders):
    class Cursor:
        def __init__(self):
            self.calls = []
        def execute(self, sql, values=()):
            self.calls.append((sql, values))
            if 'COUNT(*)' in sql:
                self.rows = [{'total': len(results)}]
            elif 'FROM workorders' in sql:
                self.rows = [{'payload': json.dumps(order)} for order in orders]
            else:
                self.rows = [{'payload': _encode(result)} for result in results]
        def fetchall(self):
            return self.rows
        def fetchone(self):
            return self.rows[0]
    cursor = Cursor()
    @contextmanager
    def session():
        yield cursor
    store = object.__new__(MySQLJsonStore)
    store._session = session
    return store, cursor


def test_monitor_and_mysql_preserve_assignment_without_large_snapshots():
    value = pipeline()
    order = value['workorder']['workorder']
    order['maintenance_plan_snapshot'] = {'context': '禁止复制正文' * 100000}
    order['repair_feedback'] = {'private': '现场个人输入' * 100000}
    value['workorder']['dispatch_context'] = {'context': '工具历史' * 100000}
    for projected in (compact_public_pipeline(value), projected_write(value)):
        result = projected['workorder']
        assert result['workorder_id'] == 'WO-1'
        assert result['workorder']['assignee_name'] == '维修员甲'
        assert result['workorder']['device_id'] == 'D-1'
        assert len(json.dumps(projected, ensure_ascii=False)) < 4000
        assert 'repair_feedback' not in result['workorder']
        assert 'maintenance_plan_snapshot' not in result['workorder']


@pytest.mark.parametrize('status,reason', [
    ('waiting_for_personnel', '等待该设备对应负责人员登录'),
    ('blocked', '负责人员目录查询失败'),
])
def test_compact_projection_retains_business_wait_and_query_failure(status, reason):
    value = pipeline(assigned=False)
    value['workorder'].update(success=False, status=status, error=reason,
                             stop_reason='personnel_query_failed' if status == 'blocked' else status)
    projected = projected_write(value)
    dispatch = list_saved_maintenance_plans([projected])['items'][0]['dispatch']
    assert dispatch['status'] == status
    assert dispatch['allowed'] is False
    assert dispatch['reason'] == reason


def test_legacy_projection_reads_current_assignment_in_one_bounded_select():
    source = pipeline()
    order = source.pop('workorder')['workorder']
    source['maintenance_plan']['requires_approval'] = True
    other = pipeline()
    other['event'] = {**other['event'], 'event_id': 'EV-2', 'device_id': 'D-2'}
    other['maintenance_plan'] = {**other['maintenance_plan'], 'plan_id': 'PLAN-2', 'device_id': 'D-2'}
    other['diagnosis'] = {**other['diagnosis'], 'device_id': 'D-2'}
    other.pop('workorder')
    store, cursor = store_for_read([source, other], [order])
    values, _ = store.plan_results()
    plans = list_saved_maintenance_plans(values)['items']
    assert plans[0]['dispatch']['status'] == 'dispatched'
    assert plans[0]['dispatch']['assignee_name'] == '维修员甲'
    assert plans[1]['dispatch'].get('status') != 'dispatched'
    reads = [sql for sql, _ in cursor.calls if 'FROM workorders' in sql]
    assert len(reads) == 1
    assert 'JSON_' in reads[0] and 'SELECT payload' not in reads[0]
    assert not any('runtime_records_mysql' in sql or sql.startswith(('UPDATE', 'INSERT')) for sql, _ in cursor.calls)


@pytest.mark.parametrize('changed', [
    {'device_id': 'D-OTHER'}, {'event_id': 'EV-OTHER'}, {'plan_id': 'PLAN-OTHER'},
])
def test_live_orders_cannot_attach_to_another_plan_device_or_event(changed):
    value = pipeline()
    order = {**value.pop('workorder')['workorder'], **changed}
    store, _ = store_for_read([value], [order])
    values, _ = store.plan_results()
    assert list_saved_maintenance_plans(values)['items'][0]['dispatch'].get('status') != 'dispatched'


def test_authority_deletion_removes_old_assignment_from_read_only_projection():
    value = pipeline()
    store, _ = store_for_read([value], [])
    values, _ = store.plan_results()
    assert not values[0].get('workorder')
    assert list_saved_maintenance_plans(values)['items'][0]['dispatch'].get('status') != 'dispatched'
    assert value['workorder']['workorder']['assignee'] == 'USER-1'


def test_current_open_order_preserves_unassigned_without_inventing_personnel_wait():
    value = pipeline(assigned=False, status='open')
    order = value['workorder']['workorder']
    store, _ = store_for_read([value], [order])
    values, _ = store.plan_results()
    assert values[0]['workorder']['status'] == 'open'
    assert values[0]['workorder']['workorder']['assignee'] == ''
    assert list_saved_maintenance_plans(values)['items'][0]['dispatch'].get('status') != 'waiting_for_personnel'


def test_current_open_order_does_not_erase_saved_personnel_wait_or_explicit_approval():
    value = pipeline(assigned=False, status='open')
    order = value['workorder']['workorder']
    value['workorder'].update(success=False, status='waiting_for_personnel', error='等待对应负责人登录')
    store, _ = store_for_read([value], [order])
    values, _ = store.plan_results()
    assert list_saved_maintenance_plans(values)['items'][0]['dispatch']['status'] == 'waiting_for_personnel'
    values[0]['maintenance_plan']['requires_approval'] = True
    assert list_saved_maintenance_plans(values)['items'][0]['dispatch']['status'] == 'waiting_approval'


def test_current_assignee_refreshes_saved_assignment_fields():
    value = pipeline()
    order = {**value['workorder']['workorder'], 'assignee': 'USER-NEW', 'assignee_name': '维修员乙', 'status': 'closed'}
    store, _ = store_for_read([value], [order])
    values, _ = store.plan_results()
    assert values[0]['workorder']['workorder']['status'] == 'closed'
    assert list_saved_maintenance_plans(values)['items'][0]['dispatch']['assignee_name'] == '维修员乙'


def test_ambiguous_historical_orders_do_not_invent_an_assignment():
    value = pipeline()
    order = value.pop('workorder')['workorder']
    store, _ = store_for_read([value], [order, {**order, 'workorder_id': 'WO-2', 'assignee': 'USER-2'}])
    values, _ = store.plan_results()
    assert not values[0].get('workorder')


def test_known_order_id_resolves_duplicate_plan_scope_without_picking_other_owner():
    value = pipeline()
    order = value['workorder']['workorder']
    store, _ = store_for_read([value], [{**order, 'workorder_id': 'WO-2', 'assignee': 'USER-2'}, order])
    values, _ = store.plan_results()
    assert values[0]['workorder']['workorder_id'] == 'WO-1'
    assert values[0]['workorder']['assignee'] == 'USER-1'


def test_assignment_completion_clears_old_wait_or_directory_failure():
    value = pipeline()
    order = value['workorder']['workorder']
    value['workorder'].update(success=False, status='waiting_for_personnel', error='旧等待人员原因')
    store, _ = store_for_read([value], [order])
    values, _ = store.plan_results()
    assert list_saved_maintenance_plans(values)['items'][0]['dispatch']['status'] == 'dispatched'
    assert not values[0]['workorder'].get('error')
