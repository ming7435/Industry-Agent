"""原固定流程技能的候选核查、审核发布及北极星回执。"""
from datetime import datetime, timezone
from time import sleep
from types import SimpleNamespace

import pytest

from app.skills.evolution import SkillEvolution
from app.skills.machine_testing import MachineTrials
from test_all_skill_evolution import all_skills
from test_skill_evolution import manager, ACTOR, IsolatedJsonStore, model_reply


TASK = {'input': {'device_id': 'D-1', 'feedback': None},
        'output': {'status': 'assigned', 'assignee': 'U-1'},
        'expected_highlights': ['/output/assignee'], 'expected_missing': ['/input/feedback'],
        'expected_status': 'reviewed', 'expected': '关注真实负责人，提示尚未提交反馈；不改变工单状态。'}


def wait_receipt(system, identity):
    for _ in range(100):
        receipt = system.manager.trials.get(identity, ACTOR)
        if receipt['status'] != 'running':
            return receipt
        sleep(.01)
    pytest.fail('隔离技能核查未完成')


@pytest.fixture
def system(all_skills):
    all_skills.trials = MachineTrials(all_skills, SimpleNamespace())
    all_skills.trials.client_factory = lambda: model_reply({'skills': {'auto_assignment': {
        'highlights': ['/output/assignee'], 'missing': ['/input/feedback']}}})
    return SkillEvolution(all_skills, store=IsolatedJsonStore(), client_factory=lambda: model_reply({
        'reason': '补充负责人和反馈信息核查', 'rules': ['关注实际负责人和未提供的反馈，不伪造工单进度。']}))


def candidate(system):
    return system.generate_source({'source_id': 'WO-SOURCE', 'trace_id': 'WO-TRACE',
        'agent': 'workorder', 'name': 'auto_assignment', 'facts': '{"validation_findings":["反馈信息缺失"]}'})


def test_review_candidate_stays_unpublished_until_matching_trial_and_human_publish(system):
    c = candidate(system)
    old = system.manager.detail('workorder', 'auto_assignment')['revision']
    system.confirm(c['proposal_id'], c['candidate_hash'], {'task': TASK}, ACTOR, lambda: ACTOR)
    verifying = system.advance(c['proposal_id'])
    result = wait_receipt(system, verifying['test_id'])
    assert result['status'] == 'completed', result
    assert result['mode'] == 'review_flow'
    assert result['assessment']['accepted'] is True
    assert result['result']['highlights'] == [{'path': '/output/assignee', 'value': 'U-1'}]
    ready = system.advance(c['proposal_id'])
    assert ready['status'] == 'awaiting_publication'
    assert system.manager.detail('workorder', 'auto_assignment')['revision'] == old
    system.publish(c['proposal_id'], c['candidate_hash'], ACTOR, lambda: ACTOR)
    assert system.manager.detail('workorder', 'auto_assignment')['revision'] != old
    now = datetime.now(timezone.utc)
    system.metrics.collect(now)
    metric = system.metrics.status(None, 'workorder', 'auto_assignment', now)
    assert metric['gate_pass_rate']['value'] == 100
    assert metric['latest_assessment']['basis'] == 'review_flow_receipt'
    assert 'report' not in metric['latest_assessment']['criteria']


def test_wrong_review_expectation_cannot_publish_even_if_model_answer_is_structurally_valid(system):
    c = candidate(system)
    system.confirm(c['proposal_id'], c['candidate_hash'], {'task': {**TASK,
        'expected_highlights': ['/output/status']}}, ACTOR, lambda: ACTOR)
    verifying = system.advance(c['proposal_id'])
    result = wait_receipt(system, verifying['test_id'])
    assert result['status'] == 'failed'
    assert result['assessment']['accepted'] is False
    assert system.advance(c['proposal_id'])['status'] == 'verification_failed'
    from app.skills.management import SkillEditError
    with pytest.raises(SkillEditError):
        system.publish(c['proposal_id'], c['candidate_hash'], ACTOR, lambda: ACTOR)


def test_review_task_rejects_nonexistent_expected_paths_before_model_call(system):
    from app.skills.management import SkillEditError
    c = candidate(system)
    with pytest.raises(SkillEditError) as error:
        system.confirm(c['proposal_id'], c['candidate_hash'], {'task': {**TASK,
            'expected_highlights': ['/output/invented']}}, ACTOR, lambda: ACTOR)
    assert error.value.status == 422
    assert system.get(c['proposal_id'])['status'] == 'awaiting_confirmation'


@pytest.mark.parametrize('key', ['密码', '密钥', 'cookie', 'nested_context', '_file_authority', '_closure_authority', '_virtual_context'])
def test_review_sample_rejects_credentials_or_private_context_before_persistence(system, key):
    from app.skills.management import SkillEditError
    c = candidate(system)
    sample = {**TASK, 'input': {**TASK['input'], 'details': {key: 'isolated-sensitive-marker'}}}
    with pytest.raises(SkillEditError) as error:
        system.confirm(c['proposal_id'], c['candidate_hash'], {'task': sample}, ACTOR, lambda: ACTOR)
    assert error.value.status == 422
    assert system.get(c['proposal_id'])['status'] == 'awaiting_confirmation'
    assert 'isolated-sensitive-marker' not in str(system.store.records)


def test_review_skill_cannot_use_old_machine_entry_to_trigger_fault_or_publish(system, monkeypatch):
    from time import time
    from uuid import uuid4
    from app.skills.management import SkillEditError
    from app.skills.testing import fingerprint
    c = candidate(system)
    values = {k: c['draft'][k] for k in ('expected_revision', 'version', 'goal', 'document', 'reason')}
    values['machine'] = {'device_id': 'D-1', 'scenario_id': 'S-1', 'expected': 'X'}
    trials = system.manager.trials
    monkeypatch.setattr(trials, '_clients', lambda: pytest.fail('只读技能不能读取/触发故障适配器'))
    with pytest.raises(SkillEditError) as start_error:
        trials.start_machine('workorder', 'auto_assignment', values, ACTOR)
    assert start_error.value.status == 422
    test_id = uuid4().hex
    trials._write({'test_id': test_id, 'actor_id': ACTOR['user_id'], 'mode': 'machine_flow',
        'agent': 'workorder', 'name': 'auto_assignment', 'fingerprint': fingerprint(values),
        'created_epoch': time(), 'status': 'completed', 'dependencies': trials._dependencies()})
    with pytest.raises(SkillEditError) as publish_error:
        trials.validate_publish('workorder', 'auto_assignment',
            {**values, 'test_id': test_id, 'human_confirmed': True}, ACTOR)
    assert publish_error.value.status == 409
