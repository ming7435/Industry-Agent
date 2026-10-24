"""真实FastAPI入口不能由客户端伪造来源、审批身份或验证通过。"""
from types import SimpleNamespace
from time import monotonic, sleep

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


def test_confirmation_preserves_sop_and_rejects_changing_it_after_approval(api):
    c = api.candidate
    endpoint = '/api/expert/evolution/' + c['proposal_id'] + '/confirm'
    sop = '断电挂牌后核对刀塔就位反馈，确认报警清除后申请复机。'
    body = {'candidate_hash': c['candidate_hash'], 'machine': {**MACHINE, 'sop_document': sop}}
    first = api.client.post(endpoint, json=body, headers=headers())
    assert first.status_code == 200, first.text
    saved = api.service.get(c['proposal_id'])
    assert saved['machine']['sop_document'] == sop
    assert saved['confirmed_by'] == 'U-WORKER'
    repeated = api.client.post(endpoint, json=body, headers=headers())
    assert repeated.status_code == 200, repeated.text
    assert repeated.json()['confirmation_id'] == first.json()['confirmation_id']
    changed = api.client.post(endpoint, json={**body, 'machine': {
        **body['machine'], 'sop_document': '另一份未经本次确认的维修依据。'}}, headers=headers())
    assert changed.status_code == 409, changed.text
    assert api.service.get(c['proposal_id'])['machine']['sop_document'] == sop
    assert not (api.service.manager.backup_root / 'tests').exists()


@pytest.mark.parametrize('blank_sop', ['', ' \t '])
def test_legacy_confirmation_replay_treats_blank_sop_as_omitted(api, blank_sop):
    c = api.candidate
    # Existing approvals saved the three-field shape before SOP was added to the API.
    original = api.service.confirm(c['proposal_id'], c['candidate_hash'], dict(MACHINE),
                                   api.actors['worker'], lambda: api.actors['worker'])
    response = api.client.post('/api/expert/evolution/' + c['proposal_id'] + '/confirm',
        json={'candidate_hash': c['candidate_hash'], 'machine': {**MACHINE, 'sop_document': blank_sop}},
        headers=headers())
    assert response.status_code == 200, response.text
    assert response.json()['confirmation_id'] == original['confirmation_id']
    assert api.service.get(c['proposal_id'])['machine'] == MACHINE


@pytest.mark.parametrize('fields', [
    {'device_id': ' ', 'scenario_id': 'turret', 'expected': '完成验证'},
    {'device_id': 'D-EXAMPLE', 'expected': '完成验证'},
    {**MACHINE, 'sop_document': None},
    {**MACHINE, 'sop_document': 'x' * 6001},
    {**MACHINE, 'passed': True},
])
def test_confirmation_still_rejects_invalid_machine_fields(api, fields):
    c = api.candidate
    response = api.client.post('/api/expert/evolution/' + c['proposal_id'] + '/confirm',
        json={'candidate_hash': c['candidate_hash'], 'machine': fields}, headers=headers())
    assert response.status_code == 422, response.text
    assert api.service.get(c['proposal_id'])['status'] == 'awaiting_confirmation'
    assert not (api.service.manager.backup_root / 'tests').exists()


def test_confirmed_sop_reaches_real_machine_trial_without_production_writes(api, monkeypatch):
    from test_expert_machine_trials import Machines
    from test_skill_sandbox_machine_api import Sandbox

    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    manager = api.service.manager
    factory = Machines()
    manager.trials.factory, manager.trials.backend = factory, object()
    manager.trials._sandbox_executor = Sandbox()
    api.actors['worker']['responsible_device_ids'] = ['D-1']
    monkeypatch.setattr('app.api.skill_evolution.BackendServiceClient',
                        lambda: SimpleNamespace(resolve_session=api.actors.get))
    c = api.candidate
    sop = '断电挂牌，检查刀塔就位反馈与分度机构，确认报警消除后申请复机。'
    response = api.client.post('/api/expert/evolution/' + c['proposal_id'] + '/confirm',
        json={'candidate_hash': c['candidate_hash'], 'machine': {
            'device_id': 'D-1', 'scenario_id': 'turret', 'expected': '完成沙箱模拟闭环',
            'sop_document': sop}}, headers=headers())
    assert response.status_code == 200, response.text
    try:
        verifying = api.service.advance(c['proposal_id'])
        assert verifying['status'] == 'verifying', verifying
        deadline = monotonic() + 5
        while True:
            receipt = manager.trials.get(verifying['test_id'], api.actors['worker'])
            if receipt['status'] != 'running' or monotonic() >= deadline:
                break
            sleep(.01)
        assert receipt['status'] == 'completed', receipt
        assert receipt['machine']['sop_document'] == sop
        assert receipt['simulation'] is True
        assert receipt['assessment']['accepted'] is True
        assert receipt['workorders'] == [] and receipt['event_id'] == '' and receipt['report_id'] == ''
        assert factory.starts == [] and factory.clears == 0
        assert api.service.get(c['proposal_id'])['status'] == 'verifying'
    finally:
        manager.trials.pool.shutdown(wait=True)


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
