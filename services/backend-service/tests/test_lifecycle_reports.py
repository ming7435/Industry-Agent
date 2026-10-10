"""设备故障报告的汇总、重试和产品质检独立边界。"""
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


def test_knowledge_retry_queue_resumes_only_due_admitted_saved_cases(tmp_path):
    service, _ = setup(tmp_path)
    for key, overrides in {
        'due': {},
        'backoff': {'knowledge_sync': {'next_retry_at': '2099-01-01T00:00:00+00:00'}},
        'indexed': {'rag_saved': True},
        'rejected': {'validation_status': 'rejected'},
        'low-quality': {'experience_quality_score': .4},
        'manual': {'validation_status': 'manual_confirmed'},
    }.items():
        service.repository.save_record('experience', key, {
            'experience_id': key, 'validation_status': 'accepted',
            'experience_quality_score': .9, 'rag_saved': False, **overrides,
        })
    # A fresh service reads the durable queue instead of depending on a local cache.
    reopened = BackendBusinessService(repository=service.repository, team_service=service.team)
    assert [item['experience_id'] for item in reopened.search_experience(sync_pending=True)['items']] == ['due']


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


def test_completed_cycle_unifies_fault_records_without_requiring_product_quality(tmp_path):
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
    assert set(report['sections']) >= {'diagnosis', 'maintenance_plan', 'workorder', 'lifecycle'}
    assert 'quality' not in report['sections']
    assert report['status'] == 'completed'
    assert report['composition_version'] == 7
    assert len(report['article_text'].split('\n\n')) == 6
    assert all(identity in report['article_text'] for identity in ('WO-1', 'WO-2'))
    assert report['concise_sections']
    assert sum(len(item['title'] + item['body']) for item in report['concise_sections']) <= 500
    assert report['validation_findings'] == []
    assert '质检' not in report['summary']
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


def test_product_quality_results_do_not_change_the_fault_report(tmp_path):
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
    assert updated == report
    assert updated['status'] == 'completed'
    assert service.repository.get_record('quality', 'QC-1')['result'] == 'failed'
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


def test_product_quality_in_the_same_cycle_is_not_included_in_a_fault_report(tmp_path):
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
    assert 'quality' not in report['sections']
    assert report['status'] == 'completed'
    assert report['validation_findings'] == []


def test_legacy_fault_report_is_revalidated_without_quality_and_keeps_its_identity(tmp_path):
    service, ledger = setup(tmp_path)
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    order(service)
    complete(ledger, 1)
    saved = service.list_reports()['items'][0]
    saved.pop('composition_version', None)
    saved['sections']['quality'] = {'status': 'not_tested', 'records': []}
    saved['source_refs'].append({'section': 'quality', 'quality_check_id': 'QC-OLD'})
    saved.update(status='incomplete', validation_findings=['未关联质检记录'])
    service.repository.save_record('report', saved['report_id'], saved)
    service.repository.save_record('report', 'RPT-QC', {'report_id': 'RPT-QC', 'report_type': 'quality_report',
        'status': 'incomplete', 'sections': {'quality': {'result': 'pending'}},
        'validation_findings': ['缺少实测数据']})

    refreshed = next(r for r in service.list_reports()['items'] if r['report_id'] == saved['report_id'])
    assert refreshed['report_id'] == saved['report_id']
    assert refreshed['created_at'] == saved['created_at']
    assert refreshed['status'] == 'completed'
    assert refreshed['validation_findings'] == []
    assert 'quality' not in refreshed['sections']
    assert all(ref['section'] != 'quality' for ref in refreshed['source_refs'])
    assert service.get_report('RPT-QC')['report']['status'] == 'incomplete'
    assert service.get_report('RPT-QC')['report']['validation_findings'] == ['缺少实测数据']
    assert next(r for r in service.list_reports()['items'] if r['report_id'] == saved['report_id']) == refreshed


def test_missing_repair_records_still_prevent_fault_report_completion(tmp_path):
    service, ledger = setup(tmp_path)
    ledger.claim_fault_event('E1', 'M1', ['M1'])
    value = order(service)
    value.pop('repair_feedback')
    service.repository.update(value)
    complete(ledger, 1)
    report = service.list_reports()['items'][0]
    assert report['status'] == 'incomplete'
    assert any('处理说明' in finding for finding in report['validation_findings'])
    assert not any('质检' in finding for finding in report['validation_findings'])


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
