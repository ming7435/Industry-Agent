import json
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app import main
from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


def test_lifecycle_reads_compact_facts_without_loading_business_bodies(tmp_path, monkeypatch):
    repository = SQLiteRepository(str(tmp_path / 'business.db'))
    service = BackendBusinessService(repository=repository, team_service=SimpleNamespace())
    repository.create({'workorder_id': 'WO-1', 'event_id': 'EV-1', 'device_id': 'D-1',
                       'status': 'completed', 'assignee': 'U-1', 'maintenance_plan_snapshot': {'body': 'x' * 100000}})
    repository.create({'workorder_id': 'WO-OTHER', 'event_id': 'EV-OTHER', 'device_id': 'D-1', 'status': 'completed'})
    repository.save_record('report', 'RPT-1', {'report_id': 'RPT-1', 'report_type': 'full_case_report',
        'event_ids': ['EV-1'], 'workorder_ids': ['WO-1'], 'status': 'incomplete',
        'validation_findings': ['缺少有效维修依据'], 'sections': {'body': 'x' * 100000}})
    repository.save_record('report', 'RPT-OTHER', {'report_id': 'RPT-OTHER', 'event_ids': ['EV-OTHER']})
    repository.save_record('experience', 'EXP-1', {'experience_id': 'EXP-1', 'source_workorder': 'WO-1',
        'validation_status': 'accepted', 'experience_quality_score': .9, 'content': 'x' * 100000})
    def no_full_body(*args):
        raise AssertionError('日志索引不能读取完整工单、报告或经验正文')
    monkeypatch.setattr(repository, 'list', no_full_body)
    monkeypatch.setattr(repository, 'list_records', no_full_body)

    result = service.get_run_lifecycle(event_ids=['EV-1'])

    assert [r['workorder_id'] for r in result['workorders']] == ['WO-1']
    assert [r['report_id'] for r in result['reports']] == ['RPT-1']
    assert [r['experience_id'] for r in result['experiences']] == ['EXP-1']
    assert result['reports'][0]['status'] == 'incomplete'
    assert 'sections' not in result['reports'][0]
    assert 'content' not in result['experiences'][0]
    assert len(json.dumps(result)) < 2000


def test_lifecycle_tool_requires_internal_auth(monkeypatch):
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN', 'isolated-token')
    service = SimpleNamespace(get_run_lifecycle=lambda event_ids: {'success': True, 'workorders': [], 'reports': [], 'experiences': []})
    monkeypatch.setattr(main, 'get_service', lambda: service)
    client = TestClient(main.app)
    body = {'tool': 'get_run_lifecycle', 'arguments': {'event_ids': ['EV-1']}}
    assert client.post('/tools/call', json=body).status_code == 401
    response = client.post('/tools/call', json=body, headers={'Authorization': 'Bearer isolated-token'})
    assert response.status_code == 200
    assert response.json()['workorders'] == []


def test_lifecycle_rejects_unbounded_event_list(tmp_path):
    service = BackendBusinessService(repository=SQLiteRepository(str(tmp_path / 'business.db')), team_service=SimpleNamespace())
    with pytest.raises(ValueError):
        service.get_run_lifecycle(event_ids=[str(i) for i in range(201)])
