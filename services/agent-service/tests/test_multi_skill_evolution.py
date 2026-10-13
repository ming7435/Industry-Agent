"""多类技能共同入选；检索候选必须实际参与决策，不能扩大权限。"""
from pathlib import Path
from shutil import copytree
from types import SimpleNamespace
import json

import pytest

from app.harness.trace import TraceRecorder
from app.skills.evolution import SkillEvolution
from app.skills.registry import skill_registry_scope
from test_skill_evolution import manager, IsolatedJsonStore, model_reply
from test_skill_loop import WindowStore, NOW


@pytest.fixture
def multiple(manager):
    source = Path(__file__).parents[1] / 'app/skills'
    for folder in ('knowledge', 'cad', 'maintenance'):
        copytree(source / folder, manager.registry.root / folder)
    manager.trace = TraceRecorder(store=WindowStore())
    return manager


def observed(manager, agent, name, number=1):
    identity = agent + str(number)
    data = dict(timestamp='2026-10-07T03:00:00+00:00', trace_id='TRACE-' + identity,
                agent_run_id='RUN-' + identity)
    manager.trace.record(**data, event='skill_observed', **manager.registry.get(agent, name).observation())
    manager.trace.record(**data, agent=agent, event='agent_completed', output={
        'status': 'insufficient_evidence', 'validation_findings': ['缺少完整依据']})


def test_week_plan_selects_diagnosis_knowledge_and_cad_with_one_shared_budget(multiple):
    for agent, name in [('diagnosis', 'alarm_diagnosis_skill'), ('knowledge', 'hybrid_search_skill'),
                        ('cad', 'production_modeling_skill'), ('maintenance', 'repair_plan_skill')]:
        observed(multiple, agent, name)
    service = SkillEvolution(multiple, store=IsolatedJsonStore(), client_factory=lambda: model_reply({
        'reason': '补充证据规则', 'rules': ['依据不足时明确询问，不补造参数。']}))
    plan = service.loop.refresh(NOW)['plan']
    assert {r['agent'] for r in plan['selected']} == {'diagnosis', 'knowledge', 'cad'}
    assert plan['limit'] == 3
    generated = [service.loop.scan_once(NOW) for _ in range(4)]
    assert sum(r is not None for r in generated) == 3
    assert all(r['status'] == 'awaiting_confirmation' for r in generated if r)
    assert service.loop.status()['plan']['used'] == 3
    modes = {r['agent']: r['verification_mode'] for r in generated if r}
    assert modes == {'diagnosis': 'machine_flow', 'knowledge': 'knowledge_flow', 'cad': 'cad_spec_flow'}


class Documents:
    def __init__(self):
        self.calls = []
    def execute(self, name, arguments, context=None):
        self.calls.append((name, dict(arguments)))
        return {'documents': [{'document_id': 'DOC-1', 'title': '主轴手册',
            'source': 'maintenance_manual', 'content': '检查实际冷却流量。', 'score': 1,
            'metadata': {'knowledge_type': 'manual'}}] if name == 'search_manual' else []}


def test_knowledge_skill_changes_real_retrieval_order_without_changing_scope(multiple):
    from app.agents.knowledge.agent import KnowledgeAgent
    seen = []
    def chat(messages, **kwargs):
        seen.extend(messages)
        return model_reply({'retrieval_plan': ['search_manual', 'search_sop', 'search_fault_cases', 'search_knowledge']}).chat(messages)
    client = SimpleNamespace(available=True, timeout=30, chat=chat)
    tools = Documents()
    with skill_registry_scope(multiple.registry):
        result = KnowledgeAgent(tools=tools, client=client).run({
            'query': '主轴温度过高', 'max_steps': 1, 'device_id': 'D-2', 'filters': {'device_model': 'M-2'}})
    assert tools.calls[0][0] == 'search_manual'
    assert tools.calls[0][1]['filters'] == {'device_id': 'D-2', 'device_model': 'M-2'}
    assert result.documents[0].document_id == 'DOC-1'
    assert '混合维修依据检索' in '\n'.join(m['content'] for m in seen)


@pytest.mark.parametrize('plan', [['start_machine'], ['search_manual'], ['search_manual'] * 4])
def test_knowledge_model_cannot_expand_remove_or_duplicate_operations(multiple, plan):
    from app.agents.knowledge.agent import KnowledgeAgent
    tools = Documents()
    with skill_registry_scope(multiple.registry):
        KnowledgeAgent(tools=tools, client=model_reply({'retrieval_plan': plan})).run({'query': '主轴异常', 'max_steps': 1})
    assert tools.calls[0][0] == 'search_knowledge'
    assert len(tools.calls) == 1


def test_catalog_explains_supported_test_modes_and_fixed_algorithm_limit(multiple):
    knowledge = multiple.detail('knowledge', 'hybrid_search_skill')
    cad = multiple.detail('cad', 'production_modeling_skill')
    fixed = multiple.detail('maintenance', 'repair_plan_skill')
    assert knowledge['optimization']['mode'] == 'knowledge_flow'
    assert cad['optimization']['mode'] == 'cad_spec_flow'
    assert fixed['optimization']['enabled'] is True
    assert fixed['optimization']['mode'] == 'review_flow'


def test_old_diagnosis_only_week_plan_can_add_domains_without_losing_budget(multiple):
    for agent, name in [('diagnosis', 'alarm_diagnosis_skill'), ('knowledge', 'hybrid_search_skill'), ('cad', 'production_modeling_skill')]:
        observed(multiple, agent, name)
    service = SkillEvolution(multiple, store=IsolatedJsonStore())
    service.store.get_or_create('skill_loop_plan', '2026-10-12', lambda: {
        'loop_id': '2026-10-12', 'revision': 0, 'recording_policy': 1, 'limit': 3,
        'selected': [], 'source_window': {}, 'reservations': {'diagnosis:alarm_diagnosis_skill': {'outcome': 'generation_failed'}}})
    plan = service.loop.refresh(NOW)['plan']
    assert plan['used'] == 1 and plan['remaining'] == 2
    assert {item['agent'] for item in plan['selected']} == {'knowledge', 'cad'}


def test_unknown_agent_cannot_generate_automatic_candidate(multiple):
    service = SkillEvolution(multiple, store=IsolatedJsonStore(), client_factory=lambda: pytest.fail('未知智能体不得调用优化模型'))
    assert service.generate_source({'source_id':'F-1','trace_id':'F-RUN','agent':'unknown-agent',
        'name':'repair_plan_skill','facts':'{}'}) is None


def test_cad_real_proposal_observation_can_enter_skill_health(multiple):
    from app.skills.loop_analytics import aggregate
    from app.cad_documents.proposal import observed_cad_call, resolve_freecad_spec
    client = model_reply({'status':'needs_input','questions':['请提供尺寸和孔位。']})
    client.timeout = 10
    with skill_registry_scope(multiple.registry):
        result = observed_cad_call(resolve_freecad_spec, '生成一个带孔零件，尺寸尚未确定',
            client, trace=multiple.trace)
    assert result['status'] == 'needs_input'
    row = aggregate(multiple.trace.store.rows, multiple.registry, True)[0]
    assert row['agent'] == 'cad' and row['name'] == 'production_modeling_skill'
    assert row['verdicts']['degraded'] == 1 and row['sources']
