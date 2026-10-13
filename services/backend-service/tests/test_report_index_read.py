from threading import Event

from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


def test_report_index_reads_metadata_without_loading_report_bodies(tmp_path, monkeypatch):
    repository = SQLiteRepository(str(tmp_path / 'reports.db'))
    report = {'report_id': 'R-A', 'title': '完整报告', 'status': 'completed',
              'workorder_ids': ['WO-A'], 'updated_at': '2026-10-13',
              'sections': {'workorder': {'workorder_id': 'WO-A'}, 'evidence': 'x' * 1000000}}
    repository.save_record('report', 'R-A', report)
    repository.save_record('report', 'R-B', {'report_id': 'R-B', 'updated_at': '2026-10-14',
        'report': {'report_id': 'LEGACY-B', 'title': '历史报告', 'status': 'incomplete',
                   'validation_findings': ['资料待补充'], 'sections': {'workorder': {'workorder_id': 'WO-B'}}}})
    monkeypatch.setattr(repository, 'list_records', lambda *_: (_ for _ in ()).throw(AssertionError('Loaded full bodies')))
    items = repository.list_report_index()
    assert {item['report_id'] for item in items} == {'R-A', 'R-B'}
    assert all('sections' not in item for item in items)
    assert next(item for item in items if item['report_id'] == 'R-B')['title'] == '历史报告'
    assert repository.list_report_index('WO-B')[0]['report_id'] == 'R-B'
    assert repository.get_record('report', 'R-A') == report


def test_summary_read_returns_while_report_sync_is_blocked_and_coalesces(tmp_path, monkeypatch):
    monkeypatch.setenv('BACKEND_STORAGE', 'sqlite')
    monkeypatch.setenv('BACKEND_SQLITE_PATH', str(tmp_path / 'service.db'))
    monkeypatch.setenv('TEAM_SQLITE_PATH', str(tmp_path / 'team.db'))
    service = BackendBusinessService()
    service.repository.save_record('report', 'R-A', {'report_id': 'R-A', 'title': '已保存报告'})
    entered, release, done = Event(), Event(), Event()
    calls = []
    def slow_sync():
        calls.append(1)
        entered.set()
        release.wait(5)
        done.set()
    monkeypatch.setattr(service, 'sync_lifecycle_reports', slow_sync)
    try:
        result = service.list_reports(summary=True)
        assert result['items'][0]['report_id'] == 'R-A'
        assert not done.is_set(), 'Reading reports waited for composition'
        assert entered.wait(1)
        assert service.list_reports(summary=True)['count'] == 1
        assert calls == [1]
    finally:
        release.set()
        assert done.wait(1)


def test_report_display_preserves_article_and_quality_without_loading_raw_evidence(tmp_path, monkeypatch):
    repository = SQLiteRepository(str(tmp_path / 'display.db'))
    repository.save_record('report', 'R-A', {'report_id': 'R-A', 'title': '正式报告',
        'status': 'incomplete', 'validation_findings': ['现场资料待核实'], 'workorder_ids': ['WO-A'],
        'article_text': '已保存的真实处理正文', 'article_outline': [{'title': '处理过程', 'paragraph_indexes': [0]}],
        'sections': {'quality': {'passed': False, 'findings': ['超差']}, 'raw_evidence': 'x' * 1000000}})
    monkeypatch.setattr(repository, 'get_record', lambda *_: (_ for _ in ()).throw(AssertionError('Loaded raw evidence')))
    view = repository.get_report_view('R-A')
    assert view['article_text'] == '已保存的真实处理正文'
    assert view['workorder_ids'] == ['WO-A']
    assert view['validation_findings'] == ['现场资料待核实']
    assert view['sections']['quality']['passed'] is False
    assert 'raw_evidence' not in view['sections']


def test_report_display_uses_full_legacy_body_when_no_saved_article_exists(tmp_path):
    repository = SQLiteRepository(str(tmp_path / 'legacy-display.db'))
    legacy = {'report_id': 'R-L', 'sections': {'diagnosis': {'summary': '历史诊断'}}}
    repository.save_record('report', 'R-L', legacy)
    assert repository.get_report_view('R-L') == legacy
    assert repository.get_report_view('MISSING') is None
