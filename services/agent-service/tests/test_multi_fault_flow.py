"""多故障事件独立保留，单条派工故障不阻断其它设备。"""
from collections import deque
from concurrent.futures import Future
from copy import deepcopy
from datetime import datetime, timezone
from threading import Lock
from types import SimpleNamespace

import pytest

from app.clients.backend import BackendServiceError
from app.monitor.models import MonitorStatus
from app.workorder.saved_dispatch import SavedPlanDispatcher
from monitor_web_server import MonitorWebState
from test_saved_plan_workorder_dispatch import source


class PendingExecutor:
    def __init__(self):
        self.calls = []

    def submit(self, callback):
        result = Future()
        self.calls.append((callback, result))
        return result


def monitor_state():
    state = MonitorWebState.__new__(MonitorWebState)
    state.lock = Lock()
    state._diagnosis_generation = 0
    state.diagnosis_pending = 0
    state.line_controller = None
    state.devices = []
    state.latest_diagnosis = None
    state.latest_pipeline = None
    state.latest_diagnoses_by_device = {}
    state.latest_pipelines_by_device = {}
    state._diagnosis_events_by_device = {}
    state._latest_diagnosis_event = {}
    state.diagnosis_history = deque(maxlen=30)
    state.diagnosis_executor = PendingExecutor()
    return state


def trigger(event_id, device_id='M1', revision=1):
    event = {'tenant_id': 'TEST', 'event_id': event_id, 'device_id': device_id,
             'event_revision': revision, 'alarm_code': '700015'}
    return SimpleNamespace(status=MonitorStatus.ALARM,
        abnormal_event=SimpleNamespace(to_dict=lambda: dict(event))), event


def complete(future, event, plan_id):
    future.set_result({'event': dict(event), 'status': 'completed',
        'diagnosis': {'status': 'completed', 'summary': event['event_id'] + ' 独立诊断'},
        'maintenance_plan': {'plan_id': plan_id, 'device_id': event['device_id']},
        'workorder': {'workorder_id': 'WO-' + plan_id, 'plan_id': plan_id}})


def test_second_fault_does_not_cancel_first_result_readback_or_erase_its_plan():
    state = monitor_state()
    first, e1 = trigger('E1')
    second, e2 = trigger('E2')
    state._on_trigger(first)
    state._on_trigger(second)
    callback, first_future = state.diagnosis_executor.calls[0]
    assert callback.keywords['should_continue']() is True
    state._on_pipeline_progress({'maintenance_plan': {'plan_id': 'P1'}}, 0, e1)
    complete(state.diagnosis_executor.calls[1][1], e2, 'P2')
    complete(first_future, e1, 'P1')
    snapshot = state._diagnosis_snapshot()
    assert state.diagnosis_pending == 0
    assert snapshot['latest']['event_id'] == 'E2'
    assert {row['event_id'] for row in snapshot['history']} == {'E1', 'E2'}
    assert {(row['event']['event_id'], row['maintenance_plan']['plan_id'])
            for row in snapshot.get('pipeline_by_event', {}).values()} == {('E1', 'P1'), ('E2', 'P2')}
    assert all(row['maintenance_plan']['device_id'] == row['event']['device_id']
               for row in snapshot['pipeline_by_event'].values())


def test_duplicate_active_event_does_not_submit_another_http_request():
    state = monitor_state()
    first, _ = trigger('E1')
    state._on_trigger(first)
    state._on_trigger(first)
    assert len(state.diagnosis_executor.calls) == 1
    assert state.diagnosis_pending == 1


def test_different_devices_complete_independently_even_when_a_newer_fault_exists():
    state = monitor_state()
    first, e1 = trigger('E1', 'M1')
    second, e2 = trigger('E2', 'M2')
    state._on_trigger(first)
    state._on_trigger(second)
    complete(state.diagnosis_executor.calls[1][1], e2, 'P2')
    complete(state.diagnosis_executor.calls[0][1], e1, 'P1')
    result = state._diagnosis_snapshot()
    assert result['latest_by_device']['M1']['event_id'] == 'E1'
    assert result['latest_by_device']['M2']['event_id'] == 'E2'
    assert len(result.get('pipeline_by_event', {})) == 2


def fault_record(device, number):
    value = source()
    value['event'].update(device_id=device, event_id='E'+str(number))
    value['diagnosis'].update(device_id=device, event_id='E'+str(number))
    value['maintenance_plan'].update(device_id=device, plan_id='P'+str(number),
        diagnosis=deepcopy(value['diagnosis']), workorder_ready=True,
        validation_findings=[], required_parts=[])
    return value


class Ledger:
    """仅隔离远程 Backend 存储和人员目录，不替换派工业务函数。"""
    def __init__(self, records, failure=None):
        self.records, self.failure, self.orders = records, failure, []

    def status(self):
        return {'faults': [dict(row['event'], resolved=False) for row in self.records]}

    def call(self, tool, values):
        if tool == 'list_deleted_maintenance_plan_ids':
            return {'deleted_plan_ids': []}
        if tool == 'list_workorders':
            return {'success': True, 'items': deepcopy(self.orders)}
        if tool == 'query_technicians':
            if values['device_id'] == 'M1' and self.failure == 'personnel':
                raise BackendServiceError('isolated directory unavailable')
            return {'success': True, 'items': [{'technician_id': 'U-'+values['device_id'],
                'responsible_device_ids': [values['device_id']], 'registered': True,
                'online': True, 'available': True}]}
        if tool == 'create_workorder':
            order = next((row for row in self.orders if row['idempotency_key'] == values['idempotency_key']), None)
            if order is None:
                order = {'workorder_id': 'W'+str(len(self.orders)+1), 'status': 'open', **deepcopy(values)}
                self.orders.append(order)
            return {'workorder': deepcopy(order)}
        if tool == 'assign_workorder':
            order = next(row for row in self.orders if row['workorder_id'] == values['workorder_id'])
            order.update(assignee=values['assignee'], status='in_progress')
            return {'workorder': deepcopy(order)}
        raise AssertionError(tool)


def batch_dispatcher(failure=None):
    records = [fault_record('M'+str(number), number) for number in (1, 2, 3)]
    backend = Ledger(records, failure)
    store = SimpleNamespace(list_plan_results=lambda: (deepcopy(records), {'status': 'ready'}),
                            deleted_plan_ids=lambda: [])
    def execute(name, values, **context):
        if name == 'get_device_status':
            if values['device_id'] == 'M1' and failure == 'readback':
                raise BackendServiceError('isolated device readback unavailable')
            return {'device_id': values['device_id'], 'alarm_code': '700015', 'found': True,
                'success': True, 'checked_at': datetime.now(timezone.utc).isoformat()}
        return backend.call(name, values)
    worker = SavedPlanDispatcher(store, backend, SimpleNamespace(execute=execute))
    return worker, backend, records


@pytest.mark.parametrize('failure', ['readback', 'personnel'])
def test_one_fault_dependency_failure_does_not_prevent_other_faults_from_dispatching(failure):
    worker, backend, _ = batch_dispatcher(failure)
    worker.sync()
    worker.sync()
    assert {(row['device_id'], row['event_id'], row['plan_id'], row['assignee']) for row in backend.orders} == {
        ('M2', 'E2', 'P2', 'U-M2'), ('M3', 'E3', 'P3', 'U-M3')}
    assert len(backend.orders) == 2


def test_multiple_ready_plans_keep_correct_fault_links_and_do_not_duplicate_orders():
    worker, backend, records = batch_dispatcher()
    before = deepcopy(records)
    worker.sync()
    worker.sync()
    assert len(backend.orders) == 3
    assert {(row['device_id'], row['event_id'], row['plan_id'], row['assignee']) for row in backend.orders} == {
        ('M1', 'E1', 'P1', 'U-M1'), ('M2', 'E2', 'P2', 'U-M2'), ('M3', 'E3', 'P3', 'U-M3')}
    assert records == before


def test_approval_block_on_one_fault_does_not_block_other_ready_faults():
    worker, backend, records = batch_dispatcher()
    records[0]['maintenance_plan']['requires_approval'] = True
    worker.sync()
    assert {row['device_id'] for row in backend.orders} == {'M2', 'M3'}


def test_older_revision_finishes_without_overwriting_new_revision():
    state = monitor_state()
    first, e1 = trigger('E1', revision=1)
    revised, e2 = trigger('E1', revision=2)
    state._on_trigger(first)
    state._on_trigger(revised)
    complete(state.diagnosis_executor.calls[0][1], e1, 'P1')
    assert state.latest_diagnosis['event_revision'] == 2
    complete(state.diagnosis_executor.calls[1][1], e2, 'P2')
    result = state._diagnosis_snapshot()
    assert result['latest']['event_revision'] == 2
    assert {row['event']['event_revision'] for row in result['pipeline_by_event'].values()} == {1, 2}
    assert state.diagnosis_pending == 0


def test_fault_history_projection_is_bounded_without_cancelling_active_tasks():
    state = monitor_state()
    for index in range(105):
        value, _ = trigger('E' + str(index))
        state._on_trigger(value)
    result = state._diagnosis_snapshot()
    assert len(result['by_event']) == 100
    assert state.diagnosis_executor.calls[0][0].keywords['should_continue']() is True


def test_real_runtime_generates_individual_diagnoses_plans_and_orders_for_multiple_faults(tmp_path, monkeypatch):
    from app.runtime.event_store import EventResultStore, scoped_event_key
    from runtime_slimming_adapter import build_fault_scenario, documents, candidate

    cases = [('M1', 'E1', '开门被禁止：程序、轴、主轴未停止或接料器未下降'),
             ('M2', 'E2', '液压压力未达到'),
             ('M1', 'E3', '开门被禁止：程序、轴、主轴未停止或接料器未下降')]
    runtime, _ = build_fault_scenario(tmp_path, monkeypatch)
    store = EventResultStore()
    results = []
    for device, event_id, fault in cases:
        # Only external model/retrieval/personnel responses vary per event. The shared
        # graph, diagnosis/maintenance/workorder agents, policy and stores are real.
        runtime.test_model.responses = [candidate(.95, fault), candidate(.95, fault), candidate(.95, fault)]
        sources = documents(device, fault)
        if device == 'M2':
            for document in sources:
                document['content'] = '液压压力未达到：保持停机，检查液压油位、外部可见泄漏和压力反馈，记录异常。'
        runtime.test_rag.results = [{'documents': sources} for _ in range(6)]
        boundary = runtime.test_boundary.responses
        boundary[('knowledge', 'get_alarm_definition')].update(name=fault, description=fault)
        boundary[('plc', 'get_device_logs')].update(device_id=device, logs=[{'message':fault}])
        boundary[('mes', 'query_technicians')]['items'][0].update(
            technician_id='U-' + device, primary_device_id=device)
        for operation in ('query_part', 'query_drawing', 'query_bom', 'query_relation', 'fetch_engineering_record'):
            boundary[('cad', operation)] = {'components': [], 'synthetic':False}
        event = {'event_id':event_id, 'device_id':device, 'alarm_code':'700010' if device == 'M2' else '700004',
                 'realtime_snapshot':{'device_id':device, 'status':'fault'}}
        boundary[('knowledge', 'get_alarm_definition')]['alarm_code'] = event['alarm_code']
        result = store.get_or_create(scoped_event_key(event), lambda: runtime.run_abnormal_event(event))
        assert result['runtime_result']['status'] == 'completed', (event_id,
            result['runtime_result']['stop_reason'], result.get('maintenance_plan', {}).get('validation_findings'))
        assert result['diagnosis']['device_id'] == device
        assert result['diagnosis']['summary'] == fault
        assert result['diagnosis']['event_id'] == event_id
        assert result['maintenance_plan']['workorder_ready'] is True
        order = runtime.container.workorder_service.get(result['workorder']['workorder_id'])
        assert (order['device_id'], order['event_id'], order['plan_id'], order['assignee']) == (
            device, event_id, result['maintenance_plan']['plan_id'], 'U-' + device)
        calls = len(runtime.test_model.calls)
        repeated = store.get_or_create(scoped_event_key(event), lambda: pytest.fail('同事件不能重跑 Agent'))
        assert repeated['workorder']['workorder_id'] == order['workorder_id']
        assert len(runtime.test_model.calls) == calls
        results.append(result)
    assert len(runtime.container.workorder_service.list()) == len(store.list_results()) == 3
    assert len({row['maintenance_plan']['plan_id'] for row in results}) == 3
    assert not any(operation in {'start_line', 'stop_line', 'start_device', 'stop_device'}
                   for _, operation, _ in runtime.test_boundary.calls)
