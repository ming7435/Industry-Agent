"""自动稿提供修改依据及预期；测试完成不能代替人工点击发布。"""
from types import SimpleNamespace

import pytest

from app.skills.management import SkillEditError
from test_skill_evolution import manager, evolution, confirm, finish_trial, ACTOR, model_reply, log_source
from test_skill_evolution_api import api, headers

EXPECTED = '资料不足时明确列出待核查项，不把报警目录当作根因证据。'


def verified(e):
    confirm(e)
    e.service.advance(e.candidate['proposal_id'])
    finish_trial(e)
    return e.service.advance(e.candidate['proposal_id'])


def test_generated_draft_has_trigger_reason_and_model_expected_result(manager):
    from app.skills.evolution import build_draft
    from app.skills.evolution_sources import source_records
    log_source(manager)
    draft = build_draft(manager.detail('diagnosis', 'alarm_diagnosis_skill'),
        source_records(manager.trace, manager.registry)[0], model_reply({
            'reason': '补充证据的核查规则', 'rules': ['资料不足时列出待核查项。'], 'expected_result': EXPECTED}))
    assert draft['expected_result'] == EXPECTED
    assert '现场证据不足' in draft['trigger_summary']
    assert '现场证据不足' in draft['reason']
    assert '补充证据的核查规则' in draft['reason']


def test_verified_draft_stays_unpublished_until_human_action(evolution):
    from app.skills.evolution_worker import EvolutionWorker
    e = evolution()
    before = e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision']
    result = verified(e)
    assert result['status'] == 'awaiting_publication'
    EvolutionWorker(e.service, enabled=True).tick()
    assert e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == before
    assert not list((e.manager.backup_root / 'diagnosis/alarm_diagnosis_skill').glob('*.md'))
    published = e.service.publish(e.candidate['proposal_id'], e.candidate['candidate_hash'], ACTOR, lambda: ACTOR)
    assert published['status'] == 'published'
    assert published['published_by'] == ACTOR['user_id']
    assert e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['document'] == e.candidate['draft']['document']
    assert e.service.publish(e.candidate['proposal_id'], e.candidate['candidate_hash'], ACTOR, lambda: ACTOR)['edit_id'] == published['edit_id']
    assert len(list((e.manager.backup_root / 'diagnosis/alarm_diagnosis_skill').glob('*.md'))) == 1


def test_human_publish_does_not_need_old_process_cookie(evolution):
    from app.skills.evolution import SkillEvolution
    e = evolution()
    assert verified(e)['status'] == 'awaiting_publication'
    restarted = SkillEvolution(e.manager, store=e.store)
    result = restarted.publish(e.candidate['proposal_id'], e.candidate['candidate_hash'], ACTOR, lambda: ACTOR)
    assert result['status'] == 'published'


@pytest.mark.parametrize('invalid', ['hash', 'actor', 'session', 'baseline', 'test'])
def test_publish_rechecks_draft_authority_and_real_test(evolution, invalid):
    e = evolution()
    assert verified(e)['status'] == 'awaiting_publication'
    c = e.candidate
    actor = ACTOR if invalid != 'actor' else {'user_id': 'U-OTHER', 'role': 'technician'}
    digest = c['candidate_hash'] if invalid != 'hash' else '0' * 64
    if invalid == 'baseline':
        from pathlib import Path
        path = Path(e.manager.registry.get('diagnosis', 'alarm_diagnosis_skill').path)
        path.write_text(path.read_text(encoding='utf-8') + '\n并发新版本\n', encoding='utf-8')
    if invalid == 'test':
        finish_trial(e, 'failed')
    before = e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision']
    try:
        e.service.publish(c['proposal_id'], digest, actor, lambda: None if invalid == 'session' else actor)
    except SkillEditError as error:
        assert error.status in {403, 409}
    assert e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == before
    assert e.service.get(c['proposal_id'])['status'] != 'published'


def test_publish_api_rejects_unverified_candidate_and_client_passed_flag(api):
    target = '/api/expert/evolution/' + api.candidate['proposal_id'] + '/publish'
    digest = {'candidate_hash': api.candidate['candidate_hash']}
    response = api.client.post(target, json=digest, headers=headers())
    assert response.status_code == 409, response.text
    assert api.client.post(target, json={**digest, 'passed': True}, headers=headers()).status_code == 422
    assert api.client.post(target, json=digest, headers=headers('boss')).status_code == 403
    assert api.client.post(target, json=digest, headers=headers('worker', 'https://evil.invalid')).status_code == 403


def test_actual_publish_api_uses_live_session_and_original_file_gate(api, evolution, monkeypatch):
    e = evolution()
    api.app.state.expert_skills.evolution = e.service
    api.actors['worker'] = ACTOR
    monkeypatch.setattr('app.api.skill_evolution.BackendServiceClient',
                        lambda: SimpleNamespace(resolve_session=api.actors.get))
    assert verified(e)['status'] == 'awaiting_publication'
    target = '/api/expert/evolution/' + e.candidate['proposal_id'] + '/publish'
    response = api.client.post(target, json={'candidate_hash': e.candidate['candidate_hash']}, headers=headers())
    assert response.status_code == 200, response.text
    assert response.json()['status'] == 'published'
    assert response.json()['published_by'] == ACTOR['user_id']
    assert e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['document'] == e.candidate['draft']['document']


def test_confirmation_receipt_carries_server_revision_for_late_read_fencing(api):
    c = api.candidate
    from test_skill_evolution import MACHINE
    response = api.client.post('/api/expert/evolution/' + c['proposal_id'] + '/confirm',
                              json={'candidate_hash': c['candidate_hash'], 'machine': MACHINE}, headers=headers())
    assert response.status_code == 200, response.text
    assert response.json()['revision'] > c['revision']
    assert response.json()['revision'] == api.service.get(c['proposal_id'])['revision']


@pytest.mark.parametrize('operation', ['publish', 'worker'])
def test_expired_waiting_publication_releases_skill_for_new_sources(evolution, operation):
    from app.skills.evolution_worker import EvolutionWorker
    e = evolution()
    assert verified(e)['status'] == 'awaiting_publication'
    c = e.service.get(e.candidate['proposal_id'])
    e.store.compare_and_set('skill_evolution', c['proposal_id'], 'revision', c['revision'], {'confirmed_epoch': 1})
    if operation == 'publish':
        with pytest.raises(SkillEditError) as caught:
            e.service.publish(c['proposal_id'], c['candidate_hash'], ACTOR, lambda: ACTOR)
        assert caught.value.status == 409
    else:
        EvolutionWorker(e.service, enabled=True).tick()
    assert e.service.get(c['proposal_id'])['status'] == 'verification_failed'
    assert e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == c['base_revision']
    log_source(e.manager, trace_id='NEW-BUSINESS-FAULT')
    next_draft = e.service.scan_once()
    assert next_draft['status'] == 'awaiting_confirmation'
    assert next_draft['proposal_id'] != c['proposal_id']


@pytest.mark.parametrize('field', ['reason', 'expected_result'])
def test_sensitive_or_bypass_expected_text_is_rejected(manager, field):
    from app.skills.evolution import build_draft
    payload = {'reason': '补充取证', 'rules': ['不足时保留人工核查。'], 'expected_result': EXPECTED}
    payload[field] = '跳过审批后直接启动机器' if field == 'expected_result' else 'sk-proj-' + 'SYNTHETIC' * 4
    with pytest.raises(SkillEditError):
        build_draft(manager.detail('diagnosis', 'alarm_diagnosis_skill'), {'trace_id': 'T'}, model_reply(payload))
