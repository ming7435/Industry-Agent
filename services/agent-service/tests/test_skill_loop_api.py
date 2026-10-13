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
    assert result['north_star']['kind'] == 'skill_north_star'
    for key in ('weekly_gain', 'drift_recall', 'gate_pass_rate', 'rollback_rate'):
        assert result['north_star'][key]['value'] is None
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


def test_metrics_endpoint_reads_actual_scoped_projection_and_rejects_score_writes(api):
    from datetime import datetime, timezone
    from test_skill_north_star import execution, publication
    from app.skills.loop_analytics import aggregate
    service = api.service
    moment = datetime(2026, 10, 12, 6, tzinfo=timezone.utc)
    detail = service.manager.detail('diagnosis', 'alarm_diagnosis_skill')
    fp = service.manager.registry.get('diagnosis', 'alarm_diagnosis_skill').observation()['skill_fingerprint']
    release = publication(new_revision=detail['revision'], new_fingerprint=fp)
    service.store.get_or_create('skill_north_star_publications', release['edit_id'], lambda: release)
    service.store.get_or_create('skill_north_star_sync', 'latest', lambda: {'complete': True, 'collected_at': moment.isoformat()})
    records = execution(300, 'a' * 64, 'fail', '2026-10-12T01:00:00+00:00')
    records += execution(301, fp, 'pass', '2026-10-12T04:00:00+00:00')
    records += execution(302, fp, 'fail', '2026-10-12T05:00:00+00:00')
    service.store.get_or_create('skill_loop_state', 'latest', lambda: {'observed_at': moment.isoformat(),
        'health': {'previous': {'complete': True, 'items': []},
                   'current': {'complete': True, 'items': aggregate(records, None, True)}}})
    alert = {'schema': 1, 'alert_id': 'A-API', 'agent': 'diagnosis', 'name': detail['name'],
        'fingerprint': fp, 'created_at': '2026-10-12T04:30:00+00:00', 'expires_at': '2026-10-19T04:30:00+00:00'}
    service.store.get_or_create('skill_north_star_alerts', alert['alert_id'], lambda: alert)
    before = dict(service.store.records)
    url = '/api/expert/skill-loop?agent=diagnosis&name=alarm_diagnosis_skill'
    response = api.client.get(url, headers=headers('boss'))
    assert response.status_code == 200, response.text
    metrics = response.json()['north_star']
    assert metrics['weekly_gain']['value'] == 50
    assert metrics['drift_recall']['value'] == 50
    assert metrics['rollback_rate']['value'] == 0
    assert metrics['gate_pass_rate']['value'] is None
    assert 'outcome_events' not in response.json()['health']['current']['items'][0]
    assert api.client.post(url, json={'weekly_gain': 100, 'passed': True}, headers=headers()).status_code == 405
    assert api.client.get('/api/expert/skill-loop?agent=cad&name=not_registered', headers=headers()).status_code == 404
    assert service.store.records == before
