"""技能观测不能事后套用新版本，也不能把内存缓存冒充完整周数据。"""
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from dataclasses import replace
from datetime import datetime, timezone
from types import SimpleNamespace

from app.harness.runtime import AgentHarness
from app.harness.trace import TraceRecorder
from app.skills.registry import SkillRegistry
from test_skill_evolution import manager


def test_harness_records_loaded_version_before_file_changes(manager):
    selected = manager.registry.get('diagnosis', 'alarm_diagnosis_skill')
    path = __import__('pathlib').Path(selected.path)
    class Agent:
        name = 'diagnosis'
        def run(self, task):
            old = manager.registry.get('diagnosis', selected.name)
            path.write_text(path.read_text(encoding='utf-8').replace('version: "1.0"', 'version: "9.0"')
                            .replace('version: 1.0', 'version: 9.0'), encoding='utf-8')
            # 测试发布中途换正文：日志必须保留旧对象内容，不能在结束时重读文件。
            path.write_text(path.read_text(encoding='utf-8') + '\n后续新规则\n', encoding='utf-8')
            return {'status': 'completed', 'stop_reason': 'validator_pass', 'summary': old.document[:60]}
    trace = TraceRecorder()
    result = AgentHarness(Agent(), trace=trace).execute_agent({'trace_id': 'T-ONE'})
    assert result['status'] == 'completed'
    observations = [r for r in trace.list() if r.get('event') == 'skill_observed']
    assert len(observations) == 1
    assert observations[0]['skill_version'] == selected.version
    assert len(observations[0]['skill_fingerprint']) == 64
    assert observations[0]['agent_run_id'] == trace.list()[-1]['agent_run_id']
    assert manager.registry.get('diagnosis', selected.name).document != selected.document


def test_parallel_harness_observations_do_not_cross_tasks(manager):
    class Agent:
        name = 'diagnosis'
        def run(self, task):
            manager.registry.select('diagnosis', names=['alarm_diagnosis_skill'])
            return {'status': 'fallback'}
    trace = TraceRecorder()
    harness = AgentHarness(Agent(), trace=trace)
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(harness.execute_once, [{'trace_id': 'T-A'}, {'trace_id': 'T-B'}]))
    rows = [r for r in trace.list() if r.get('event') == 'skill_observed']
    assert {r['trace_id'] for r in rows} == {'T-A', 'T-B'}
    assert len({r['agent_run_id'] for r in rows}) == 2


def test_skill_fingerprint_comes_from_object_not_current_path(manager):
    definition = manager.registry.get('diagnosis', 'alarm_diagnosis_skill')
    observe = getattr(definition, 'observation', None)
    assert callable(observe), '缺少实际选择的版本观测接口'
    old = observe()
    assert replace(definition, document=definition.document + '\n新规则').observation()['skill_fingerprint'] != old['skill_fingerprint']
    assert old['skill_version'] == '1.0'


def test_memory_window_is_not_marked_persistently_complete():
    trace = TraceRecorder()
    trace.record(event='agent_completed', agent='diagnosis', trace_id='T-A')
    query = getattr(trace, 'skill_window_page', None)
    assert callable(query), '缺少可信窗口查询'
    result = query(datetime(2026, 1, 1, tzinfo=timezone.utc), datetime(2027, 1, 1, tzinfo=timezone.utc))
    assert result['complete'] is False
    assert result['done'] is True
    assert result['storage'] == 'memory'
    assert len(result['items']) == 1


def test_mysql_window_query_binds_bounds_uses_fixed_cursor_and_closes(monkeypatch):
    from app.harness.trace_store import MySQLTraceStore
    calls, closed = [], []
    class Cursor:
        rowcount = 1
        def execute(self, sql, parameters=()):
            calls.append((sql, parameters))
            self.sql = sql
        def fetchone(self):
            return (44,)
        def fetchall(self):
            if 'FROM agent_trace_coverage' in self.sql:
                return [(datetime(2026, 1, 1), datetime(2026, 11, 1), None, '[]')]
            return [(11, '{"event":"agent_completed","agent_run_id":"A"}'),
                    (12, '{"event":"agent_completed","agent_run_id":"B"}')]
        def close(self):
            closed.append(True)
    @contextmanager
    def session(config):
        assert config.get('time_zone') == '+00:00', '窗口比较必须使用UTC连接，不能依赖本机MySQL时区'
        yield SimpleNamespace(cursor=lambda: Cursor())
    monkeypatch.setattr('app.harness.trace_store.mysql_session', session)
    store = object.__new__(MySQLTraceStore)
    store._config = {}
    from app.harness.trace_coverage import CoverageTracker
    store._coverage = CoverageTracker(clock=lambda: datetime(2026, 11, 1))
    query = getattr(store, 'skill_window_page', None)
    assert callable(query), '缺少固定上界的持久化分页'
    start = datetime(2026, 10, 4, 16, tzinfo=timezone.utc)
    end = datetime(2026, 10, 11, 16, tzinfo=timezone.utc)
    result = query(start, end, limit=2)
    assert result['upper'] == 44 and result['after'] == 12
    assert result['done'] is False and result['complete'] is True
    sql, parameters = calls[-1]
    assert 'sequence_id>%s' in sql and 'sequence_id<=%s' in sql
    assert parameters == (start.replace(tzinfo=None), end.replace(tzinfo=None), 0, 44, 2)
    assert 'SELECT sequence_id,payload FROM' not in sql, '不能查询巨大的完整上下文'
    assert closed == [True]
    calls.clear()
    query(start, end, after=12, upper=44, limit=2)
    payload_calls = [call for call in calls if call[0].startswith('SELECT sequence_id,')]
    assert len(payload_calls) == 1 and payload_calls[0][1][-3:] == (12, 44, 2)
    assert not any('MAX(sequence_id)' in sql for sql, _ in calls)


def test_client_cannot_label_business_execution_as_expert_trial(manager):
    agent = SimpleNamespace(name='diagnosis', run=lambda task: {'status': 'fallback'})
    trace = TraceRecorder()
    AgentHarness(agent, trace=trace).execute_once({'runtime_context': {'run_type': 'expert_trial'}})
    assert trace.list()[-1]['run_type'] == 'business'


def test_quality_trace_keeps_original_business_run_kind():
    agent = SimpleNamespace(name='quality', run=lambda task: {'status': 'completed'})
    trace = TraceRecorder()
    AgentHarness(agent, trace=trace).execute_once({'runtime_context': {'run_type': 'quality'}})
    assert trace.list()[-1]['run_type'] == 'quality'


def test_node_mapping_does_not_reselect_new_body_as_business_execution(manager):
    from pathlib import Path
    from app.agents.base import trace_skill_node
    from app.tools.registry import ToolRegistry
    class Agent:
        name = 'diagnosis'
        skill_registry = manager.registry
        runtime_trace = manager.trace
        tools = ToolRegistry(trace=manager.trace)
        def run(self, task):
            loaded = self.skill_registry.get('diagnosis', 'alarm_diagnosis_skill')
            path = Path(loaded.path)
            path.write_text(path.read_text(encoding='utf-8').replace('version: 1.0', 'version: 1.1') + '\n新正文', encoding='utf-8')
            node = trace_skill_node('diagnosis', 'reason', lambda state: {'used': loaded.document}, skill_step='diagnose')
            return node({'agent': self, 'request': task, 'active_skills': [loaded.name]})
    result = AgentHarness(Agent(), trace=manager.trace).execute_once({'trace_id': 'T-LOAD'})
    assert not result['used'].endswith('新正文')
    steps = [r for r in manager.trace.list() if r.get('event') == 'step_completed']
    assert steps[0]['skill_version'] == '1.0'
    assert {r['skill_version'] for r in manager.trace.list() if r.get('event') == 'skill_observed'} == {'1.0'}


def test_evicted_failed_event_cannot_make_window_complete():
    class Storage:
        fail = True
        def append(self, record):
            if self.fail:
                raise RuntimeError('隔离写失败')
        def skill_window_page(self, *args, **kwargs):
            return {'items': [], 'complete': True, 'recording_complete': True,
                    'done': True, 'after': 0, 'upper': 0, 'storage': 'mysql'}
    storage = Storage()
    trace = TraceRecorder(maxlen=1, store=storage)
    trace.record(event='agent_started')
    storage.fail = False
    trace.record(event='agent_completed')
    result = trace.skill_window_page(datetime(2026, 1, 1, tzinfo=timezone.utc), datetime(2027, 1, 1, tzinfo=timezone.utc))
    assert result['complete'] is False


def test_query_without_recording_coverage_proof_is_incomplete():
    storage = SimpleNamespace(skill_window_page=lambda *a, **k: {'items': [], 'complete': True,
        'done': True, 'after': 0, 'upper': 0, 'storage': 'mysql'})
    trace = TraceRecorder(store=storage)
    result = trace.skill_window_page(datetime(2026, 1, 1, tzinfo=timezone.utc), datetime(2027, 1, 1, tzinfo=timezone.utc))
    assert result['complete'] is False
