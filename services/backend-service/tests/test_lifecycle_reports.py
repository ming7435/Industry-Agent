"""一次受控停机至复机的报告，与重试、并发故障及质检关联边界。"""
from types import SimpleNamespace

from app.line_control.repository import LineControlRepository
from app.team.repository import TeamRepository
from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


def setup(tmp_path):
    team = TeamRepository(sqlite_path=str(tmp_path / 'team.db'))
    service = BackendBusinessService(repository=SQLiteRepository(str(tmp_path / 'business.db')),
                                     team_service=SimpleNamespace(repository=team))
    return service, LineControlRepository(team)


def order(service, event='E1', device='M1', key='WO-1', kind='inspection'):
    value = dict(workorder_id=key, device_id=device, event_id=event, status='closed', assignee='U1',
                 title='液压检查', plan_id='PLAN-' + key, trace_id='TRACE-' + key,
                 diagnosis_snapshot={'fault': '液压压力不足', 'device_id': device, 'event_id': event},
                 maintenance_plan_snapshot={'plan_id': 'PLAN-' + key, 'plan_kind': kind,
                                            'repair_steps': ['检查液压压力'], 'repair_target': '液压系统'},
                 repair_feedback={'feedback': '检查完成', 'operator': 'U1'},
                 inspection_verification={'passed': True, 'phase': 'inspection'})
    service.repository.create(value)
    return value


def complete(ledger, generation):
    ledger.set_stop_result(generation, {'state': 'stopped'})
    ledger.begin_restart(generation)
    return ledger.finish_restart(generation, {'state': 'running', 'devices': {'M1': {'state': 'verified'}}})


def test_completed_cycle_unifies_records_once_and_missing_quality_is_explicit(tmp_path):
    service, ledger = setup(tmp_path)
    ledger.claim_fault_event('E1', 'M1', ['M1', 'M2'])
    order(service)
    ledger.claim_fault_event('E2', 'M2', ['M1', 'M2'])
    order(service, 'E2', 'M2', 'WO-2', 'repair')
    assert service.list_reports()['items'] == []
    complete(ledger, 2)
    reports = service.list_reports()['items']
    assert len(reports) == 1
    report = reports[0]
    assert report['report_type'] == 'full_case_report'
    assert report['sections']['lifecycle']['state'] == 'running'
    assert report['sections']['lifecycle']['event_ids'] == ['E1', 'E2']
    assert report['workorder_ids'] == ['WO-1', 'WO-2']
    assert set(report['sections']) >= {'diagnosis', 'maintenance_plan', 'workorder', 'quality', 'lifecycle'}
    assert report['sections']['quality']['status'] == 'not_tested'
    assert 'passed' not in report['sections']['quality']
    assert report['status'] == 'incomplete'
    assert '未关联质检记录' in report['validation_findings']
    complete(ledger, 2)
    assert service.list_reports()['items'] == reports
    # 删除的是报告列表项，不应被轮询恢复。
    service.delete_report(report['report_id'])
    assert service.list_reports()['items'] == []


def test_failed_and_stale_restart_never_complete_a_cycle(tmp_path):
    service, ledger = setup(tmp_path)
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    ledger.set_stop_result(1, {'state': 'stopped'})
    ledger.begin_restart(1)
    ledger.finish_restart(1, {'state': 'failed'})
    assert service.list_reports()['items'] == []
    ledger.claim_fault_event('E2', 'M1', ['M1'])
    ledger.finish_restart(1, {'state': 'running'})
    assert service.list_reports()['items'] == []


def test_quality_matches_workorder_and_device_and_updates_same_report(tmp_path):
    service, ledger = setup(tmp_path)
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    order(service)
    complete(ledger, 1)
    report = service.list_reports()['items'][0]
    service.repository.save_record('quality', 'QC-WRONG', dict(quality_check_id='QC-WRONG',
        workorder_id='OTHER', device_id='M1', result='passed', status='passed'))
    service.repository.save_record('quality', 'QC-DEVICE', dict(quality_check_id='QC-DEVICE',
        workorder_id='WO-1', device_id='M2', result='passed', status='passed'))
    assert service.list_reports()['items'][0] == report
    service.repository.save_record('quality', 'QC-1', dict(quality_check_id='QC-1',
        workorder_id='WO-1', device_id='M1', result='failed', status='failed', findings=['尺寸异常']))
    updated = service.list_reports()['items'][0]
    assert updated['report_id'] == report['report_id']
    assert updated['sections']['quality']['records'][0]['quality_check_id'] == 'QC-1'
    assert updated['sections']['quality']['passed'] is False
    assert updated['status'] == 'completed'  # 内容完整不等于质量通过。
    assert len(service.list_reports()['items']) == 1


def test_pending_report_survives_storage_failure_and_process_restart(tmp_path, monkeypatch):
    service, ledger = setup(tmp_path)
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    order(service)
    complete(ledger, 1)
    original = service.persist_report
    monkeypatch.setattr(service, 'persist_report', lambda **_: (_ for _ in ()).throw(OSError('store unavailable')))
    assert service.list_reports()['items'] == []
    assert ledger.status()['state'] == 'running'
    assert ledger.status()['completed_cycles'][0]['report_status'] == 'pending'
    monkeypatch.setattr(service, 'persist_report', original)
    fresh = BackendBusinessService(repository=service.repository, team_service=service.team)
    assert len(fresh.list_reports()['items']) == 1
    assert ledger.status()['completed_cycles'][0]['report_status'] == 'generated'


def test_next_cycle_excludes_previous_events_and_orders(tmp_path):
    service, ledger = setup(tmp_path)
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    order(service)
    complete(ledger, 1)
    first = service.list_reports()['items'][0]
    ledger.claim_fault_event('E2', 'M1', ['M1'])
    order(service, 'E2', 'M1', 'WO-2')
    complete(ledger, 2)
    reports = service.list_reports()['items']
    assert len(reports) == 2
    second = next(item for item in reports if item['report_id'] != first['report_id'])
    assert second['workorder_ids'] == ['WO-2']
    assert second['sections']['lifecycle']['event_ids'] == ['E2']


def test_quality_in_cycle_time_window_is_included_but_old_same_device_is_not(tmp_path):
    from datetime import datetime, timezone
    service, ledger = setup(tmp_path)
    line = ledger.claim_fault_event('E1', 'M1', ['M1', 'M2'])
    order(service)
    stamp = datetime.fromtimestamp(line['active_cycle']['started_at'] + .001, timezone.utc).isoformat()
    for key, device, created in [('QC-NOW', 'M2', stamp), ('QC-OLD', 'M1', '2020-01-01T00:00:00Z'), ('QC-OTHER', 'M3', stamp)]:
        service.repository.save_record('quality', key, dict(quality_check_id=key, device_id=device,
            result='pending', status='open', created_at=created))
    # 保证测试检测时间处于停机至复机窗口中。
    from time import sleep
    sleep(.01)
    complete(ledger, 1)
    report = service.list_reports()['items'][0]
    assert [q['quality_check_id'] for q in report['sections']['quality']['records']] == ['QC-NOW']
    assert 'passed' not in report['sections']['quality']
    assert '关联质检记录尚未完成检测' in report['validation_findings']


def test_success_route_generates_without_opening_report_page(tmp_path, monkeypatch):
    from fastapi import FastAPI
    from fastapi.testclient import TestClient
    from app.line_control.routes import create_router
    service, ledger = setup(tmp_path)
    monkeypatch.setenv('BACKEND_STORAGE', 'sqlite')
    monkeypatch.delenv('BACKEND_INTERNAL_TOKEN', raising=False)
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    order(service)
    ledger.set_stop_result(1, {'state': 'stopped'})
    ledger.begin_restart(1)
    app = FastAPI()
    app.include_router(create_router(lambda: service))
    result = TestClient(app).post('/internal/line/finish_restart', json={'generation': 1,
        'result': {'state': 'running', 'devices': {'M1': {'state': 'verified'}}}})
    assert result.status_code == 200
    assert len(service.repository.list_records('report')) == 1


def test_deployment_during_legacy_stop_uses_persisted_readback_times(tmp_path):
    service, ledger = setup(tmp_path)
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    order(service)
    ledger.set_stop_result(1, {'state': 'stopped'})
    def legacy(line):
        line.pop('active_cycle')
        line['faults'][0].pop('claimed_at')
        line['faults'][0].pop('cycle_id')
    ledger._mutate(legacy)
    ledger.record_device_control('E1', 'M1', 'emergency_stop', {'state': 'verified', 'action': 'emergency_stop',
        'snapshot': {'checked_at': '2026-10-08T01:00:00+00:00'}})
    ledger.begin_restart(1)
    ledger.finish_restart(1, {'state': 'running'})
    report = service.list_reports()['items'][0]
    assert report['sections']['lifecycle']['started_at'] == '2026-10-08T01:00:00+00:00'
    assert report['workorder_ids'] == ['WO-1']


def test_concurrent_report_reads_create_one_persisted_cycle_report(tmp_path):
    from concurrent.futures import ThreadPoolExecutor
    service, ledger = setup(tmp_path)
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    order(service)
    complete(ledger, 1)
    with ThreadPoolExecutor(max_workers=4) as pool:
        readings = list(pool.map(lambda _: service.list_reports(), range(8)))
    assert all(len(reading['items']) == 1 for reading in readings)
    assert len(service.repository.list_records('report')) == 1
