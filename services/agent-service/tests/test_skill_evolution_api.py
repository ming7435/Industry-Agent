"""真实FastAPI入口不能由客户端伪造来源、审批身份或验证通过。"""
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from app.api.server import create_app
from app.skills.evolution import SkillEvolution
from test_skill_evolution import manager, IsolatedJsonStore, model_reply, log_source, MACHINE


@pytest.fixture
def api(manager, monkeypatch):
    actors = {'worker': {'user_id': 'U-WORKER', 'role': 'technician'},
              'boss': {'user_id': 'U-BOSS', 'role': 'supervisor'},
              'viewer': {'user_id': 'U-VIEWER', 'role': 'viewer'}}
    monkeypatch.setattr('app.api.team_auth.BackendServiceClient',
                        lambda: SimpleNamespace(resolve_session=actors.get))
    container = SimpleNamespace(skill_registry=manager.registry, trace=manager.trace,
                                registry=SimpleNamespace(mcp=SimpleNamespace(handlers={name: object()
                                    for name in manager.available_tools})))
    app = create_app(SimpleNamespace(container=container))
    actual = app.state.expert_skills
    service = getattr(actual, 'evolution', None) or SkillEvolution(actual)
    service.store = IsolatedJsonStore()
    service.client_factory = lambda: model_reply({'reason': '补充不足说明', 'rules': ['现场证据不足时列出待核查内容。']})
    actual.evolution = service
    log_source(actual)
    candidate = service.scan_once()
    return SimpleNamespace(client=TestClient(app), service=service, candidate=candidate, actors=actors, app=app)


def headers(actor='worker', origin='http://testserver'):
    return {'Cookie': 'maintenance_session=' + actor, 'Origin': origin}


def test_authenticated_catalog_reports_real_candidate_and_no_mutation(api):
    before = api.service.manager.detail('diagnosis', 'alarm_diagnosis_skill')
    response = api.client.get('/api/expert/evolution?agent=diagnosis&name=alarm_diagnosis_skill', headers=headers())
    assert response.status_code == 200, response.text
    assert response.json()['items'][0]['proposal_id'] == api.candidate['proposal_id']
    assert response.json()['items'][0]['status'] == 'awaiting_confirmation'
    assert api.service.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == before['revision']


def test_confirmation_endpoint_stores_human_identity_before_starting_validation(api):
    c = api.candidate
    response = api.client.post('/api/expert/evolution/' + c['proposal_id'] + '/confirm',
                              json={'candidate_hash': c['candidate_hash'], 'machine': MACHINE}, headers=headers())
    assert response.status_code == 200, response.text
    assert response.json()['status'] == 'confirmed'
    assert response.json()['confirmed_by'] == 'U-WORKER'
    assert not (api.service.manager.backup_root / 'tests').exists()


@pytest.mark.parametrize('actor,origin,extra,want', [
    ('viewer', 'http://testserver', {}, 403),
    ('worker', 'https://untrusted.invalid', {}, 403),
    ('worker', 'http://testserver', {'passed': True}, 422),
    ('worker', 'http://testserver', {'confirmed_by': 'U-BOSS'}, 422),
    ('boss', 'http://testserver', {}, 403),
])
def test_confirmation_cannot_bypass_identity_origin_or_server_validation(api, actor, origin, extra, want):
    c = api.candidate
    response = api.client.post('/api/expert/evolution/' + c['proposal_id'] + '/confirm',
                              json={'candidate_hash': c['candidate_hash'], 'machine': MACHINE, **extra},
                              headers=headers(actor, origin))
    assert response.status_code == want, response.text
    assert api.service.get(c['proposal_id'])['status'] == 'awaiting_confirmation'


def test_unauthenticated_reads_and_arbitrary_source_posts_are_rejected(api):
    assert api.client.get('/api/expert/evolution').status_code == 401
    assert api.client.post('/api/expert/evolution', json={'source': {'passed': True}},
                          headers=headers()).status_code in (404, 405)
