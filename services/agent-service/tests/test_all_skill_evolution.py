"""全部技能候选与真实结果核查边界；模型不能制造事实或改变业务执行。"""
from copy import deepcopy
from pathlib import Path
from shutil import copytree
from types import SimpleNamespace

import pytest

from app.harness.trace import TraceRecorder
from app.skills.evolution import SkillEvolution
from app.skills.management import AGENTS
from app.skills.registry import SkillRegistry, skill_registry_scope
from test_skill_evolution import manager, IsolatedJsonStore, model_reply

ROOT = Path(__file__).parents[1] / 'app/skills'
SKILLS = [(agent, definition.name) for agent in AGENTS for definition in SkillRegistry(ROOT).list(agent)]


@pytest.fixture
def all_skills(manager):
    for agent in AGENTS:
        copytree(ROOT / agent, manager.registry.root / agent, dirs_exist_ok=True)
    return manager


@pytest.mark.parametrize('agent,name', SKILLS)
def test_each_registered_skill_can_generate_only_an_unpublished_candidate(all_skills, agent, name):
    service = SkillEvolution(all_skills, store=IsolatedJsonStore(), client_factory=lambda: model_reply({
        'reason': '补充事实关注与缺项核查', 'rules': ['只依据已返回的业务事实，资料缺失时保留待核实项。']}))
    original = all_skills.detail(agent, name)
    result = service.generate_source({'source_id': 'SRC-' + agent + name, 'trace_id': 'T-' + agent + name,
        'agent': agent, 'name': name, 'facts': '{"validation_findings":["依据不足"]}'})
    assert result['status'] == 'awaiting_confirmation'
    assert result['verification_mode']
    assert all_skills.detail(agent, name)['revision'] == original['revision']
    assert result['protected_tools'] == original['tools']


def test_review_result_contains_server_facts_not_model_generated_values(all_skills):
    from app.skills.review import review_skills
    definition = all_skills.registry.get('workorder', 'auto_assignment')
    source_input, source_output = {'device_id': 'D-1', 'feedback': None}, {'status': 'assigned', 'assignee': 'U-1'}
    original = deepcopy(source_output)
    result = review_skills([definition], source_input, source_output, model_reply({'skills': {definition.name: {
        'highlights': ['/output/assignee'], 'missing': ['/input/feedback']}}}))
    assert result[definition.name]['highlights'] == [{'path': '/output/assignee', 'value': 'U-1'}]
    assert result[definition.name]['missing'] == ['/input/feedback']
    assert source_output == original


@pytest.mark.parametrize('choice', [
    {'highlights': ['/output/not_found'], 'missing': []},
    {'highlights': ['/input/password'], 'missing': []},
    {'highlights': ['/output/status'], 'missing': ['/output/status']},
    {'highlights': ['/output/status'], 'missing': [], 'passed': True},
    {'highlights': ['/output/status'], 'missing': [], 'values': {'status': 'completed'}},
])
def test_review_rejects_invented_sensitive_or_authority_output(all_skills, choice):
    from app.skills.review import review_skills
    definition = all_skills.registry.get('workorder', 'auto_assignment')
    with pytest.raises(ValueError):
        review_skills([definition], {'password': 'not-a-real-credential'}, {'status': 'assigned'},
            model_reply({'skills': {definition.name: choice}}))


def test_actual_router_result_uses_published_rule_but_keeps_deterministic_route(all_skills):
    from app.agents.router.agent import RouterAgent
    definition = all_skills.registry.get('router', 'intent_routing_skill')
    path = Path(definition.path)
    path.write_text(path.read_text(encoding='utf-8') + '\n自动优化候选规则（来源运行：T-1）：\n- 优先展示已确认的路由意图。\n', encoding='utf-8')
    agent = RouterAgent()
    agent.runtime_trace = TraceRecorder()
    seen = []
    def chat(messages, **kwargs):
        seen.extend(messages)
        return model_reply({'skills': {'intent_routing_skill': {'highlights': ['/output/intent'], 'missing': []}}}).chat(messages)
    agent.skill_review_client = SimpleNamespace(available=True, chat=chat, timeout=8)
    with skill_registry_scope(all_skills.registry):
        result = agent.run('查询维修手册')
    assert result.intent == 'knowledge'
    from time import sleep
    for _ in range(100):
        reviews = [r for r in agent.runtime_trace.list() if r['event'] == 'skill_review_completed']
        if reviews:
            break
        sleep(.01)
    assert reviews[0]['output']['highlights'] == [{'path': '/output/intent', 'value': 'knowledge'}]
    assert '优先展示已确认的路由意图' in '\n'.join(m['content'] for m in seen)


def test_original_fixed_skills_do_not_add_model_requests_before_publication(all_skills):
    from app.agents.router.agent import RouterAgent
    agent = RouterAgent()
    agent.skill_review_client = SimpleNamespace(available=True, chat=lambda *a, **k: pytest.fail('未发布不调用模型'))
    with skill_registry_scope(all_skills.registry):
        assert agent.run('查询维修手册').intent == 'knowledge'


def test_review_copies_long_fact_exactly_instead_of_silently_truncating(all_skills):
    from app.skills.review import review_skills
    definition = all_skills.registry.get('report', 'report_generation_skill')
    text = '维修记录' * 300
    result = review_skills([definition], {}, {'summary': text}, model_reply({'skills': {definition.name: {
        'highlights': ['/output/summary'], 'missing': []}}}))
    assert result[definition.name]['highlights'][0]['value'] == text


def test_review_never_sends_chinese_credential_fields_to_model(all_skills):
    from app.skills.review import review_skills
    definition = all_skills.registry.get('workorder', 'auto_assignment')
    seen = []
    def chat(messages, **kwargs):
        seen.extend(messages)
        return model_reply({'skills': {definition.name: {'highlights': ['/output/status'], 'missing': []}}}).chat(messages)
    review_skills([definition], {'密码': 'isolated-sensitive-marker', '密钥': 'isolated-key-marker'},
        {'status': 'assigned'}, SimpleNamespace(available=True, chat=chat))
    assert 'isolated-sensitive-marker' not in str(seen)
    assert 'isolated-key-marker' not in str(seen)


@pytest.mark.parametrize('key', ['cookie', '_virtual_context', 'virtual_context', '_file_authority', '_closure_authority'])
def test_review_never_exposes_private_authority_fields(all_skills, key):
    from app.skills.review import review_skills
    definition = all_skills.registry.get('report', 'report_generation_skill')
    seen = []
    def chat(messages, **kwargs):
        seen.extend(messages)
        return model_reply({'skills': {definition.name: {'highlights': ['/output/status'], 'missing': []}}}).chat(messages)
    review_skills([definition], {key: 'isolated-private-marker'}, {'status': 'completed'},
        SimpleNamespace(available=True, chat=chat))
    assert 'isolated-private-marker' not in str(seen)


def test_complete_candidate_document_after_8192_characters_is_actually_consumed(all_skills):
    from dataclasses import replace
    from app.skills.review import review_skills
    definition = all_skills.registry.get('workorder', 'auto_assignment')
    marker = '末尾实际候选规则：优先展示真实负责人'
    definition = replace(definition, document='原始规则。' * 1700 + '\n' + marker)
    seen = []
    def chat(messages, **kwargs):
        seen.extend(messages)
        return model_reply({'skills': {definition.name: {'highlights': ['/output/assignee'], 'missing': []}}}).chat(messages)
    review_skills([definition], {}, {'assignee': 'U-1'}, SimpleNamespace(available=True, chat=chat))
    assert marker in str(seen)
    assert '[截断' not in str(seen)


def test_runtime_review_does_not_block_or_change_original_route(all_skills):
    from threading import Event
    from app.agents.router.agent import RouterAgent
    definition = all_skills.registry.get('router', 'intent_routing_skill')
    path = Path(definition.path)
    path.write_text(path.read_text(encoding='utf-8') + '\n自动优化候选规则（来源运行：T-1）：\n- 关注已确认意图。\n', encoding='utf-8')
    started, release, done = Event(), Event(), Event()
    def chat(messages, **kwargs):
        started.set()
        try:
            assert release.wait(2), '测试核查线程未释放'
            return model_reply({'skills': {'intent_routing_skill': {'highlights': ['/output/intent'], 'missing': []}}}).chat(messages)
        finally:
            done.set()
    agent = RouterAgent()
    agent.runtime_trace = TraceRecorder()
    agent.skill_review_client = SimpleNamespace(available=True, chat=chat)
    try:
        with skill_registry_scope(all_skills.registry):
            result = agent.run('查询维修手册')
        assert started.wait(1)
        assert not done.is_set(), '路由结果不应等候核查返回'
        assert result.intent == 'knowledge'
    finally:
        release.set()
        assert done.wait(1)


def test_bounded_runtime_review_freezes_facts_batches_skills_and_does_not_queue(all_skills, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    from dataclasses import replace
    from threading import BoundedSemaphore, Event, Lock
    from time import sleep
    from app.skills import review
    definitions = [replace(d, document=d.document + '\n' + review.MARKER + 'T-1）：\n- 核对已有状态。\n')
                   for d in all_skills.registry.list('workorder')[:2]]
    trace = TraceRecorder()
    source_input, source_output = {'device_id': 'D-1', '_file_authority': object()}, {'status': 'assigned'}
    count, lock, both_started, release = [], Lock(), Event(), Event()
    def chat(messages, **kwargs):
        with lock:
            count.append(messages)
            if len(count) == 2:
                both_started.set()
        assert release.wait(2), '测试模型必须由本地事件释放'
        return model_reply({'skills': {d.name: {'highlights': ['/output/status'], 'missing': []}
                                      for d in definitions}}).chat(messages)
    with ThreadPoolExecutor(max_workers=2) as pool:
        monkeypatch.setattr(review, '_POOL', pool)
        monkeypatch.setattr(review, '_SLOTS', BoundedSemaphore(2))
        try:
            for index in range(2):
                review.schedule_review(definitions, source_input, source_output, trace=trace,
                    client=SimpleNamespace(available=True, chat=chat), context={'trace_id': 'T-' + str(index)})
            assert both_started.wait(1)
            source_input['device_id'] = 'CHANGED'
            source_output['status'] = 'completed'
            review.schedule_review(definitions, source_input, source_output, trace=trace,
                client=SimpleNamespace(available=True, chat=chat), context={'trace_id': 'BUSY'})
            assert len([r for r in trace.list() if r['event'] == 'skill_review_unverified']) == 2
        finally:
            release.set()
        for _ in range(100):
            completed = [r for r in trace.list() if r['event'] == 'skill_review_completed']
            if len(completed) == 4:
                break
            sleep(.01)
    assert len(count) == 2, '两个原执行各一次模型核查；饱和执行不得排队或重试'
    assert all(r['output']['highlights'] == [{'path': '/output/status', 'value': 'assigned'}] for r in completed)
    assert len(completed) == 4, '两次执行均返回两技能的独立真实核查记录'
    assert source_output['status'] == 'completed'


@pytest.mark.parametrize('agent,output,want', [
    ('workorder', {'success': False, 'status': 'blocked', 'stop_reason': 'validation_failed',
        'error': '负责人未满足资格', 'validation_findings': ['负责人未满足资格']}, 'fail'),
    ('workorder', {'success': True, 'workorder_id': 'WO-1', 'assignee': 'U-1', 'status': 'assigned', 'stop_reason': 'completed'}, 'pass'),
    ('workorder', {'success': False, 'status': 'waiting_approval', 'stop_reason': 'approval_required',
        'validation_findings': ['仍需审批']}, 'unknown'),
    ('maintenance', {'plan_id': 'P-1', 'workorder_ready': True, 'validation_findings': []}, 'pass'),
    ('quality', {'passed': True, 'qualified': True, 'status': 'pass', 'stop_reason': 'validator_pass'}, 'pass'),
    ('quality', {'passed': False, 'status': 'fail', 'findings': ['尺寸超差']}, 'fail'),
    ('quality', {'passed': False, 'status': 'not_tested'}, 'unknown'),
    ('router', {'intent': 'unknown', 'target_agent': 'router', 'validation_findings': []}, 'degraded'),
    ('memory', {'success': True, 'action': 'learn', 'stop_reason': 'completed', 'experience': {'memory_saved': True}}, 'pass'),
    ('report', {'status': 'completed', 'stop_reason': 'validator_pass', 'persisted': False}, 'unknown'),
])
def test_business_health_uses_domain_receipts_not_readonly_review_status(all_skills, agent, output, want):
    from app.skills.loop_analytics import aggregate
    definition = all_skills.registry.list(agent)[0]
    records = [{'trace_record_id': 'OBS-1', 'event': 'skill_observed', 'trace_id': 'T-1',
        'agent_run_id': 'A-1', 'timestamp': '2026-10-07T03:00:00+00:00', **definition.observation()},
        {'trace_record_id': 'END-1', 'event': 'agent_completed', 'trace_id': 'T-1', 'agent_run_id': 'A-1',
         'timestamp': '2026-10-07T03:00:01+00:00', 'agent': agent, 'output': output},
        {'trace_record_id': 'REVIEW-1', 'event': 'skill_review_completed', 'trace_id': 'T-1',
         'agent_run_id': 'A-1', 'agent': agent, 'status': 'completed'}]
    row = aggregate(records, all_skills.registry, True)[0]
    assert row['verdicts'][want] == 1
