"""报告兼容性和正式质检数据边界的回归测试。"""
from app.workorder.service import BackendBusinessService
from app.workorder.repository import SQLiteRepository
from types import SimpleNamespace


def service(tmp_path):
    return BackendBusinessService(repository=SQLiteRepository(str(tmp_path / 'business.db')), team_service=SimpleNamespace())


def test_legacy_report_is_flat_and_keeps_storage_identity(tmp_path):
    backend = service(tmp_path)
    backend.repository.save_record('report', 'STORED-OLD', {
        'report_id': 'STORED-OLD', 'report': {'report_id': 'RPT-INNER', 'title': '中文报告',
        'workorder_id': 'WO-1', 'sections': {'workorder': {'workorder_id': 'WO-1'}}}})
    report = backend.list_reports(workorder_id='WO-1')['items'][0]
    assert report['report_id'] == 'STORED-OLD'
    assert report['title'] == '中文报告'
    assert backend.get_report('STORED-OLD')['report']['sections'] == report['sections']


def part_data():
    return {'part_id': 'P-A', 'part_no': 'PIN-A', 'device_id': 'M-A', 'part_name': '测试销轴',
            'measurements': {'diameter_mm': 10}, 'specifications': {'diameter_mm': {'min': 9.9, 'max': 10.1}},
            'appearance': {'scratch': False}, 'material': {}, 'function': {}, 'process': {}}


def test_inspection_input_survives_restart_and_identity_is_conjunctive(tmp_path):
    backend = service(tmp_path)
    saved = backend.qms('register_production_part', part=part_data(), operator='USER-A')
    assert saved['part']['source'] == 'manual-inspection'
    fresh = BackendBusinessService(repository=backend.repository, team_service=SimpleNamespace())
    found = fresh.qms('get_production_part', part_id='P-A', device_id='M-A')
    assert found['found'] and found['identity_verified']
    assert found['part']['measurements']['diameter_mm'] == 10
    assert not fresh.qms('get_production_part', part_id='P-A', device_id='M-B')['found']
    assert not fresh.qms('get_production_part', part_id='P-A', part_no='OTHER')['found']
    assert fresh.qms('inspect_part_dimensions', part=found['part'])['passed']
    assert not fresh.qms('inspect_part_appearance', part=found['part'])['passed']


def test_formal_inspection_never_returns_fixture_for_unknown_part(tmp_path):
    backend = service(tmp_path)
    result = backend.qms('get_production_part', part_id='PART-001')
    assert result['found'] is False
    assert result['source'] != 'backend-local-fixture'
