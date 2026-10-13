"""领域验证调用真实检索图及规格解析，发布凭据由服务器保存。"""
from dataclasses import replace
from types import SimpleNamespace
from pathlib import Path
from time import sleep
import json

import pytest

from app.skills.testing import SkillTrials, DraftRegistry
from app.skills.machine_testing import MachineTrials
from app.skills.management import SkillEditError
from app.skills.evolution import SkillEvolution
from test_multi_skill_evolution import multiple, observed
from test_skill_evolution import manager, model_reply, IsolatedJsonStore, ACTOR


TASK = {'query': '查找主轴手册', 'prompt': '', 'expected_status': 'completed',
        'documents': [{'document_id': 'DOC-1', 'title': '主轴手册', 'content': '检查实际冷却流量。', 'source_type': 'manual'}],
        'expected_spec': None, 'expected': '返回已提供的手册依据，不编造额外资料。'}


def values(manager, agent='knowledge', name='manual_search_skill'):
    current = manager.detail(agent, name)
    return {k: current[k] for k in ('version', 'goal', 'document')} | {
        'expected_revision': current['revision'], 'reason': '补充来源规则'}


def wait(trials, identity):
    for _ in range(100):
        receipt = trials.get(identity, ACTOR)
        if receipt['status'] not in {'running', 'awaiting_fault'}:
            return receipt
        sleep(.02)
    pytest.fail('隔离领域测试未及时完成')


def client():
    return model_reply({'retrieval_plan': ['search_manual', 'search_knowledge']})


def test_knowledge_trial_preserves_real_evidence_and_publishes_only_same_draft(multiple):
    trials = MachineTrials(multiple, SimpleNamespace())
    trials.client_factory = client
    multiple.trials = trials
    draft = values(multiple)
    started = trials.start_task('knowledge', 'manual_search_skill', {**draft, 'task': TASK}, ACTOR)
    receipt = wait(trials, started['test_id'])
    assert receipt['status'] == 'completed', receipt
    assert receipt['mode'] == 'knowledge_flow'
    assert receipt['assessment']['accepted'] is True
    assert receipt['result']['documents'][0]['document_id'] == 'DOC-1'
    published = multiple.publish('knowledge', 'manual_search_skill', {
        **draft, 'test_id': started['test_id'], 'human_confirmed': True}, ACTOR)
    assert published['revision']


def test_wrong_knowledge_expectation_cannot_be_used_for_publication(multiple):
    trials = MachineTrials(multiple, SimpleNamespace())
    trials.client_factory = client
    multiple.trials = trials
    draft = values(multiple)
    started = trials.start_task('knowledge', 'manual_search_skill', {
        **draft, 'task': {**TASK, 'documents': []}}, ACTOR)
    receipt = wait(trials, started['test_id'])
    assert receipt['status'] == 'failed'
    assert receipt['assessment']['accepted'] is False
    with pytest.raises(SkillEditError):
        multiple.publish('knowledge', 'manual_search_skill', {**draft, 'test_id': started['test_id'], 'human_confirmed': True}, ACTOR)


def test_cad_candidate_checks_actual_prompt_and_missing_dimensions_without_mcp(multiple):
    trials = MachineTrials(multiple, SimpleNamespace())
    trials.client_factory = lambda: model_reply({'status': 'needs_input', 'questions': ['请明确孔径与位置。']})
    multiple.trials = trials
    draft = values(multiple, 'cad', 'production_modeling_skill')
    started = trials.start_task('cad', 'production_modeling_skill', {**draft, 'task': {
        'query': '', 'prompt': '生成带孔齿轮，需要核对孔的位置。', 'documents': [],
        'expected': '询问缺失参数，不补造尺寸。', 'expected_spec': None, 'expected_status': 'needs_input'}}, ACTOR)
    receipt = wait(trials, started['test_id'])
    assert receipt['status'] == 'completed', receipt
    assert receipt['assessment']['criteria']['skill_used'] is True
    assert receipt['assessment']['criteria']['missing_dimensions'] is True
    assert receipt['mode'] == 'cad_spec_flow'
    assert not receipt['result'].get('artifacts')


@pytest.mark.parametrize('extra', [{'passed': True}, {'mode': 'machine_flow'}, {'tools': ['start_machine']}])
def test_task_input_rejects_forged_authority(multiple, extra):
    trials = MachineTrials(multiple, SimpleNamespace())
    with pytest.raises(SkillEditError) as error:
        trials.start_task('knowledge', 'manual_search_skill', {**values(multiple), 'task': {**TASK, **extra}}, ACTOR)
    assert error.value.status == 422


def test_evolution_confirms_task_then_waits_for_human_publish(multiple):
    trials = MachineTrials(multiple, SimpleNamespace())
    trials.client_factory = client
    multiple.trials = trials
    service = SkillEvolution(multiple, store=IsolatedJsonStore(), client_factory=lambda: model_reply({
        'reason': '补充手册来源核查', 'rules': ['仅保留与本次设备手册对应的证据。']}))
    source = {'source_id': 'SOURCE-1', 'trace_id': 'TRACE-1', 'agent': 'knowledge',
              'name': 'manual_search_skill', 'facts': '{}'}
    candidate = service.generate_source(source)
    before = multiple.detail('knowledge', 'manual_search_skill')['revision']
    confirmed = service.confirm(candidate['proposal_id'], candidate['candidate_hash'],
                                {'task': TASK}, ACTOR, lambda: ACTOR)
    assert confirmed['status'] == 'confirmed'
    running = service.advance(candidate['proposal_id'])
    receipt = wait(trials, running['test_id'])
    assert receipt['status'] == 'completed', receipt
    ready = service.advance(candidate['proposal_id'])
    assert ready['status'] == 'awaiting_publication'
    assert multiple.detail('knowledge', 'manual_search_skill')['revision'] == before
    published = service.publish(candidate['proposal_id'], candidate['candidate_hash'], ACTOR, lambda: ACTOR)
    assert published['status'] == 'published'
    assert multiple.detail('knowledge', 'manual_search_skill')['revision'] != before


def test_north_star_accepts_domain_receipt_not_as_fault_flow(multiple):
    from datetime import datetime, timezone
    trials = MachineTrials(multiple, SimpleNamespace())
    trials.client_factory = client
    multiple.trials = trials
    started = trials.start_task('knowledge', 'manual_search_skill', {**values(multiple), 'task': TASK}, ACTOR)
    assert wait(trials, started['test_id'])['status'] == 'completed'
    service = SkillEvolution(multiple, store=IsolatedJsonStore())
    now = datetime.now(timezone.utc)
    service.metrics.collect(now)
    result = service.metrics.status(None, 'knowledge', 'manual_search_skill', now)
    assert result['gate_pass_rate']['value'] == 100
    assert result['latest_assessment']['basis'] == 'knowledge_flow_receipt'
    assert 'workorder' not in result['latest_assessment']['criteria']


def test_complete_fixed_cad_parse_is_not_a_candidate_skill_validation(multiple):
    trials = MachineTrials(multiple, SimpleNamespace())
    trials.client_factory = lambda: model_reply({'status': 'needs_input', 'questions': ['请补充尺寸。']})
    started = trials.start_task('cad', 'production_modeling_skill', {
        **values(multiple, 'cad', 'production_modeling_skill'), 'task': {
            'prompt': '外径30mm、长度50mm的圆柱', 'query': '', 'documents': [],
            'expected_status': 'ready', 'expected_spec': {'units': 'mm', 'operations': [{
                'type': 'cylinder', 'mode': 'add', 'diameter': 30, 'length': 50, 'position': [0,0,0], 'axis':'z'}]},
            'expected': '已有尺寸走固定解析，但不能冒充候选正文的验证。'}}, ACTOR)
    receipt = wait(trials, started['test_id'])
    assert receipt['status'] == 'failed'
    assert receipt['assessment']['criteria']['skill_used'] is False


def test_candidate_domain_test_rejects_changed_dependency(multiple):
    changed = False
    def changing_model():
        def chat(messages, **kwargs):
            nonlocal changed
            if not changed:
                path = Path(multiple.registry.get('knowledge','manual_search_skill').path)
                path.write_text(path.read_text(encoding='utf-8')+'\n另一位专家刚更新正文。',encoding='utf-8')
                changed = True
            return client().chat(messages, **kwargs)
        return SimpleNamespace(available=True,chat=chat)
    trials = MachineTrials(multiple, SimpleNamespace())
    trials.client_factory = changing_model
    started = trials.start_task('knowledge','manual_search_skill',{**values(multiple),'task':TASK},ACTOR)
    receipt = wait(trials,started['test_id'])
    assert receipt['status']=='failed'
    assert receipt['assessment']['criteria']['dependencies_unchanged'] is False
