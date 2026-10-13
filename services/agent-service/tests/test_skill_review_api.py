"""全部只读技能通过真实 API 使用本领域样例，身份与验收状态不能伪造。"""
from pathlib import Path
from shutil import copytree

import pytest

from app.skills.optimization import verification_mode
from test_all_skill_evolution import SKILLS
from test_skill_evolution import manager
from test_skill_evolution_api import api, headers
from test_all_skill_trials import TASK


def candidate(api, agent, name):
    root = api.service.manager.registry.root
    copytree(Path(__file__).parents[1] / 'app/skills' / agent, root / agent, dirs_exist_ok=True)
    return api.service.generate_source({'source_id': 'SOURCE-' + agent + name, 'trace_id': 'TRACE-' + agent + name,
        'agent': agent, 'name': name, 'facts': '{"validation_findings":["信息缺失"]}'})


@pytest.mark.parametrize('agent,name', [(a, n) for a, n in SKILLS if verification_mode(a, n) == 'review_flow'])
def test_all_review_skills_confirm_only_domain_sample_with_authenticated_identity(api, agent, name):
    c = candidate(api, agent, name)
    response = api.client.post('/api/expert/evolution/' + c['proposal_id'] + '/confirm',
        json={'candidate_hash': c['candidate_hash'], 'task': TASK}, headers=headers())
    assert response.status_code == 200, response.text
    record = api.service.get(c['proposal_id'])
    assert record['verification_mode'] == 'review_flow'
    assert record['machine'] == {'task': TASK}
    assert record['confirmed_by'] == 'U-WORKER'
    assert record['status'] == 'confirmed'
    assert not (api.service.manager.backup_root / 'machine-test.json').exists()


@pytest.mark.parametrize('extra', [
    {'task': {**TASK, 'passed': True}},
    {'task': {**TASK, 'expected_status': 'completed'}},
    {'machine': {'device_id': 'D-1', 'scenario_id': 'S-1', 'expected': 'X'}},
    {'confirmed_by': 'U-BOSS'},
])
def test_review_confirm_rejects_forged_state_and_mixed_machine_mode(api, extra):
    c = candidate(api, 'workorder', 'auto_assignment')
    response = api.client.post('/api/expert/evolution/' + c['proposal_id'] + '/confirm',
        json={'candidate_hash': c['candidate_hash'], 'task': TASK, **extra}, headers=headers())
    assert response.status_code == 422, response.text
    assert api.service.get(c['proposal_id'])['status'] == 'awaiting_confirmation'
