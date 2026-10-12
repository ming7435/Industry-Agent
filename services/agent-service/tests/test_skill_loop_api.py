"""专家中心 Skill Loop 接口只读统计与受鉴权的优化开关。"""
import pytest

from test_skill_evolution import manager
from test_skill_evolution_api import api, headers


def test_loop_get_is_authenticated_read_only_and_distinct_from_agent_task(api):
    before = dict(api.service.store.records)
    response = api.client.get('/api/expert/skill-loop?agent=diagnosis&name=alarm_diagnosis_skill', headers=headers())
    assert response.status_code == 200, response.text
    result = response.json()
    assert result['kind'] == 'skill_loop'
    assert result['health'] is None and result['evaluation']['status'] == 'not_evaluated'
    assert api.service.store.records == before
    assert api.client.get('/api/expert/skill-loop').status_code == 401


@pytest.mark.parametrize('actor,origin,extra,want', [
    ('boss', 'http://testserver', {}, 403),
    ('viewer', 'http://testserver', {}, 403),
    ('worker', 'https://untrusted.invalid', {}, 403),
    ('worker', 'http://testserver', {'passed': True}, 422),
    ('worker', 'http://testserver', {'limit': 99}, 422),
    ('worker', 'http://testserver', {'agent_loop': True}, 422),
])
def test_loop_control_never_accepts_client_authority_or_business_actions(api, actor, origin, extra, want):
    response = api.client.post('/api/expert/skill-loop/control', json={'paused': True, **extra},
                               headers=headers(actor, origin))
    assert response.status_code == want, response.text
    assert api.service.store.get('skill_loop_control', 'global') is None


def test_loop_pause_does_not_confirm_publish_or_modify_candidate(api):
    proposal = api.service.get(api.candidate['proposal_id'])
    response = api.client.post('/api/expert/skill-loop/control', json={'paused': True}, headers=headers())
    assert response.status_code == 200, response.text
    assert response.json()['paused'] is True
    assert api.service.get(proposal['proposal_id']) == proposal
    assert api.client.get('/api/expert/skill-loop', headers=headers('boss')).json()['control']['paused'] is True


def test_loop_control_requires_strict_boolean(api):
    response = api.client.post('/api/expert/skill-loop/control', json={'paused': 'false'}, headers=headers())
    assert response.status_code == 422
