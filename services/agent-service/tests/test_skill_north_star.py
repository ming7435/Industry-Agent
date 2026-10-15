"""北极星指标依据实际版本结果、提前预警、验收及文件发布链，不接受客户端评分。"""
from copy import deepcopy
from datetime import datetime, timezone

import pytest

from app.skills.loop_analytics import aggregate, week_windows
from test_skill_evolution import manager

NOW = datetime(2026, 10, 12, 6, tzinfo=timezone.utc)
AGENT, NAME = 'diagnosis', 'alarm_diagnosis_skill'


def execution(number, fingerprint, verdict, timestamp):
    common = {'agent': AGENT, 'agent_run_id': 'RUN-' + str(number), 'trace_id': 'T-' + str(number),
              'timestamp': timestamp}
    output = {'status': 'completed', 'stop_reason': 'validator_pass'}
    if verdict == 'fail':
        output['validation_errors'] = ['证据与结论不一致']
    elif verdict == 'degraded':
        output = {'status': 'insufficient_evidence'}
    elif verdict == 'infrastructure_error':
        output = {'status': 'completed', 'error': 'HTTP Error 402'}
    elif verdict == 'unknown':
        output = {'status': 'completed'}
    return [{**common, 'trace_record_id': 'OBS-' + str(number), 'event': 'skill_observed',
             'skill': NAME, 'skill_version': '1.0' if fingerprint == 'a' * 64 else '1.1',
             'skill_fingerprint': fingerprint, 'declared_steps': ['reason']},
            {**common, 'trace_record_id': 'END-' + str(number), 'event': 'agent_completed', 'output': output}]


def health():
    windows = week_windows(NOW)
    old = [r for i, verdict in enumerate(['pass'] * 4 + ['fail'])
           for r in execution(i, 'a' * 64, verdict, '2026-10-07T03:00:00+00:00')]
    new = [r for i, verdict in enumerate(['pass'] * 4 + ['infrastructure_error', 'unknown'], 10)
           for r in execution(i, 'b' * 64, verdict, '2026-10-12T04:00:00+00:00')]
    return {'previous': {**windows['previous'], 'complete': True, 'items': aggregate(old, None, True)},
            'current': {**windows['current'], 'complete': True, 'items': aggregate(new, None, True)}}


def publication(**changes):
    return {'schema': 1, 'kind': 'file_publication', 'edit_id': 'P-1', 'agent': AGENT, 'name': NAME,
            'published_at': '2026-10-12T02:00:00+00:00', 'old_fingerprint': 'a' * 64,
            'new_fingerprint': 'b' * 64, 'old_behavior': 'c' * 64, 'new_behavior': 'd' * 64,
            'old_revision': '1' * 64, 'new_revision': '2' * 64, 'old_version': '1.0', 'new_version': '1.1', **changes}


def metrics(*, samples=None, alerts=(), gates=(), publications=None):
    from app.skills.north_star import project_metrics
    return project_metrics(samples or health(), list(alerts), list(gates),
                           [publication()] if publications is None else list(publications), AGENT, NAME, NOW)


def test_gain_uses_actual_fingerprints_and_excludes_unknown_and_transport_errors():
    gain = metrics()['weekly_gain']
    assert gain['old']['successes'] == 4 and gain['old']['samples'] == 5
    assert gain['new']['successes'] == 4 and gain['new']['samples'] == 4
    assert gain['old']['value'] == 80 and gain['new']['value'] == 100
    assert gain['value'] == 20 and gain['method'] == 'observational'


@pytest.mark.parametrize('head_revision', ['2' * 64, '3' * 64])
def test_unchanged_republication_keeps_last_content_change_as_gain_baseline(head_revision):
    original = publication()
    unchanged = publication(edit_id='P-SAME', published_at='2026-10-12T05:00:00+00:00',
        old_fingerprint='b' * 64, new_fingerprint='b' * 64,
        old_behavior='d' * 64, new_behavior='d' * 64,
        old_revision='2' * 64, new_revision=head_revision, old_version='1.1', new_version='1.1')
    gain = metrics(publications=[unchanged, original])['weekly_gain']
    assert gain['value'] == 20
    assert gain['publication_id'] == original['edit_id']
    assert gain['publication_revision'] == head_revision, '当前文件校验仍应绑定最新发布修订'
    assert gain['old']['samples'] == 5 and gain['new']['samples'] == 4


def test_multiple_unchanged_publications_preserve_the_original_comparison_boundary():
    unchanged = publication(edit_id='P-SAME-1', published_at='2026-10-12T04:30:00+00:00',
        old_fingerprint='b' * 64, new_fingerprint='b' * 64,
        old_revision='2' * 64, new_revision='3' * 64)
    later = {**unchanged, 'edit_id': 'P-SAME-2', 'published_at': '2026-10-12T05:00:00+00:00',
             'old_revision': '3' * 64, 'new_revision': '4' * 64}
    gain = metrics(publications=[later, publication(), unchanged])['weekly_gain']
    assert gain['value'] == 20 and gain['publication_id'] == 'P-1'
    assert gain['publication_revision'] == '4' * 64


def test_missing_publication_link_cannot_reuse_an_unrelated_old_comparison():
    unchanged = publication(edit_id='P-UNLINKED', published_at='2026-10-12T05:00:00+00:00',
        old_fingerprint='b' * 64, new_fingerprint='b' * 64,
        old_revision='9' * 64, new_revision='3' * 64)
    gain = metrics(publications=[publication(), unchanged])['weekly_gain']
    assert gain['value'] is None and gain['publication_id'] == 'P-UNLINKED'


def test_real_new_content_never_falls_back_to_an_older_successful_gain():
    changed = publication(edit_id='P-NEW', published_at='2026-10-12T05:00:00+00:00',
        old_fingerprint='b' * 64, new_fingerprint='e' * 64,
        old_revision='2' * 64, new_revision='3' * 64)
    gain = metrics(publications=[publication(), changed])['weekly_gain']
    assert gain['value'] is None and gain['publication_id'] == 'P-NEW'
    assert gain['old']['samples'] == 4 and gain['new']['samples'] == 0
    assert '缺少新版有效运行样本' in gain['message']


def test_gain_explains_missing_version_samples_even_when_coverage_is_incomplete():
    samples = {'previous': {'complete': False, 'items': []}, 'current': {'complete': False, 'items': []}}
    gain = metrics(samples=samples)['weekly_gain']
    assert gain['value'] is None
    assert '缺少旧版有效运行样本' in gain['message']
    assert '缺少新版有效运行样本' in gain['message']
    assert '窗口不完整' in gain['message']


def test_no_same_content_improvement_and_no_empty_denominator_score():
    unchanged = metrics(publications=[publication(new_fingerprint='a' * 64)])
    assert unchanged['weekly_gain']['value'] is None
    empty = metrics(publications=[])
    assert empty['weekly_gain']['value'] is None
    assert empty['drift_recall']['value'] is None
    assert empty['gate_pass_rate']['value'] is None
    assert empty['rollback_rate']['value'] is None


def test_incomplete_window_does_not_claim_a_version_effect():
    samples = health()
    samples['current']['complete'] = False
    assert metrics(samples=samples)['weekly_gain']['value'] is None


def test_drift_recall_counts_only_preexisting_unexpired_same_version_alerts():
    samples = health()
    current = [r for i, timestamp in enumerate(['2026-10-12T04:00:00+00:00', '2026-10-12T05:00:00+00:00'], 20)
               for r in execution(i, 'b' * 64, 'fail', timestamp)]
    samples['current']['items'] = aggregate(current, None, True)
    alert = {'schema': 1, 'alert_id': 'A-1', 'agent': AGENT, 'name': NAME, 'fingerprint': 'b' * 64,
             'created_at': '2026-10-12T04:30:00+00:00', 'expires_at': '2026-10-19T04:30:00+00:00'}
    rate = metrics(samples=samples, alerts=[alert, deepcopy(alert)])['drift_recall']
    assert rate['numerator'] == 1 and rate['denominator'] == 2 and rate['value'] == 50
    for change in [{'fingerprint': 'a' * 64}, {'agent': 'workorder'}, {'name': 'other'},
                   {'created_at': '2026-10-12T05:00:00+00:00'},
                   {'expires_at': '2026-10-12T04:00:00+00:00'}]:
        assert metrics(samples=samples, alerts=[{**alert, **change}])['drift_recall']['value'] == 0


def test_gate_rate_counts_terminal_server_assessments_once_not_draft_rejections():
    gates = [{'schema': 1, 'assessment_id': 'G-' + str(i), 'agent': AGENT, 'name': NAME,
              'completed_at': '2026-10-12T03:00:00+00:00', 'accepted': accepted}
             for i, accepted in enumerate([True, True, True, False])]
    rate = metrics(gates=[*gates, gates[0], {'status': 'rejected'},
                          {**gates[0], 'assessment_id': 'OTHER', 'agent': 'cad'}])['gate_pass_rate']
    assert rate['numerator'] == 3 and rate['denominator'] == 4 and rate['value'] == 75


def test_rollback_requires_successful_file_lineage_and_restored_older_behavior():
    first = publication()
    restored = publication(edit_id='P-2', published_at='2026-10-12T05:00:00+00:00',
        old_fingerprint='b' * 64, new_fingerprint='e' * 64, old_behavior='d' * 64,
        new_behavior='c' * 64, old_revision='2' * 64, new_revision='3' * 64, new_version='1.2')
    rate = metrics(publications=[restored, first, first])['rollback_rate']
    assert rate['numerator'] == 1 and rate['denominator'] == 2 and rate['value'] == 50
    for change in [{'old_revision': '4' * 64}, {'new_behavior': 'f' * 64}, {'kind': 'rejected'}]:
        assert metrics(publications=[first, {**restored, **change}])['rollback_rate']['numerator'] == 0


def test_events_and_publications_after_observation_cutoff_cannot_improve_score():
    assert metrics(publications=[publication(published_at='2026-10-12T07:00:00+00:00')])['rollback_rate']['value'] is None


@pytest.mark.parametrize('new_revision', ['1' * 64, '2' * 64])
def test_rollback_excludes_saves_without_a_behavior_change(new_revision):
    saved = publication(new_behavior='c' * 64, new_revision=new_revision)
    rate = metrics(publications=[saved])['rollback_rate']
    assert rate['denominator'] == 0, '格式变化、版本标记变化和重复保存不能增加新版发布数'
    assert rate['numerator'] == 0 and rate['value'] is None
    assert rate['status'] == 'not_applicable'
    assert rate['observed_publications'] == rate['excluded_unchanged'] == 1
    assert rate['records'][0]['counted'] is False


@pytest.mark.parametrize('first_time,denominator,numerator', [
    ('2026-10-12T02:00:00+00:00', 2, 1), ('2026-10-07T02:00:00+00:00', 1, 0)])
def test_rollback_after_unchanged_save_is_attributed_to_actual_changed_release(first_time, denominator, numerator):
    first = publication(published_at=first_time)
    unchanged = publication(edit_id='P-SAVE', published_at='2026-10-12T03:00:00+00:00',
        old_revision='2' * 64, new_revision='3' * 64, old_behavior='d' * 64, new_behavior='d' * 64,
        old_fingerprint='b' * 64, new_fingerprint='e' * 64)
    restored = publication(edit_id='P-RESTORE', published_at='2026-10-12T05:00:00+00:00',
        old_revision='3' * 64, new_revision='4' * 64, old_behavior='d' * 64, new_behavior='c' * 64,
        old_fingerprint='e' * 64, new_fingerprint='f' * 64)
    rate = metrics(publications=[restored, first, unchanged])['rollback_rate']
    assert rate['denominator'] == denominator and rate['numerator'] == numerator
    assert rate['excluded_unchanged'] == 1
    assert {r['edit_id'] for r in rate['records'] if r['counted'] and r['rolled_back']} == ({'P-1'} if numerator else set())


def test_gate_evidence_identifies_final_test_and_its_individual_checks():
    gate = {'schema': 1, 'assessment_id': 'G-RECOVERED', 'agent': AGENT, 'name': NAME,
            'completed_at': '2026-10-12T03:00:00+00:00', 'accepted': True, 'revision': 2,
            'criteria': {'diagnosis': True, 'maintenance': True, 'workorder': True, 'report': True,
                         'skill_used': True, 'baseline_unchanged': True, 'dependencies_unchanged': True}}
    rate = metrics(gates=[gate, deepcopy(gate)])['gate_pass_rate']
    assert rate['numerator'] == rate['denominator'] == 1
    assert len(rate['records']) == 1
    assert rate['records'][0]['checks_passed'] == rate['records'][0]['checks_total'] == 7
    assert rate['records'][0]['assessment_id'] == 'G-RECOVERED' and rate['records'][0]['revision'] == 2


def test_real_aggregate_retains_terminal_time_without_exposing_raw_device_inputs():
    row = health()['previous']['items'][0]
    assert len(row['outcome_events']) == 5
    assert row['outcome_events'][0]['timestamp'] == '2026-10-07T03:00:00+00:00'
    assert 'input' not in row['outcome_events'][0]


def test_actual_file_releases_and_restore_generate_idempotent_rollback_statistics(manager):
    from app.skills.evolution import SkillEvolution
    from test_skill_evolution import IsolatedJsonStore, ACTOR
    service = SkillEvolution(manager, store=IsolatedJsonStore())
    original = manager.detail(AGENT, NAME)
    first = manager.update(AGENT, NAME, {'expected_revision': original['revision'], 'version': '1.1',
        'goal': original['goal'], 'document': original['document'] + '\n新增设备核对规则。', 'reason': '新增规则'}, ACTOR)
    manager.update(AGENT, NAME, {'expected_revision': first['revision'], 'version': '1.2',
        'goal': original['goal'], 'document': original['document'], 'reason': '恢复已验证的旧规则'}, ACTOR)
    moment = datetime.now(timezone.utc)
    service.metrics.collect(moment)
    result = service.metrics.status(None, AGENT, NAME, moment)
    assert result['rollback_rate']['numerator'] == 1
    assert result['rollback_rate']['denominator'] == 2
    assert result['rollback_rate']['value'] == 50
    service.metrics.collect(moment)
    assert service.metrics.status(None, AGENT, NAME, moment)['rollback_rate'] == result['rollback_rate']


def test_alert_emission_is_real_persistent_and_not_retroactive(manager):
    from app.harness.trace import TraceRecorder
    from app.skills.evolution import SkillEvolution
    from test_skill_evolution import IsolatedJsonStore
    from test_skill_loop import WindowStore
    service = SkillEvolution(manager, store=IsolatedJsonStore())
    manager.trace = TraceRecorder(store=WindowStore())
    definition = manager.registry.get(AGENT, NAME)
    fingerprint = definition.observation()['skill_fingerprint']
    for row in execution(100, fingerprint, 'fail', '2026-10-12T03:00:00+00:00'):
        manager.trace.record(**row)
    service.loop.refresh(datetime(2026, 10, 12, 4, tzinfo=timezone.utc))
    alerts = service.store.values('skill_north_star_alerts')
    assert len(alerts) == 1 and alerts[0]['created_at'] == '2026-10-12T04:00:00+00:00'
    for row in execution(101, fingerprint, 'fail', '2026-10-12T05:00:00+00:00'):
        manager.trace.record(**row)
    service.loop.refresh(NOW)
    rate = service.loop.status(AGENT, NAME)['north_star']['drift_recall']
    assert rate['numerator'] == 1 and rate['denominator'] == 2 and rate['value'] == 50


def test_unrecorded_or_truncated_outcomes_are_not_a_success_score():
    samples = health()
    samples['current']['items'][0]['outcomes_complete'] = False
    assert metrics(samples=samples)['weekly_gain']['value'] is None


def test_repeated_observation_emits_only_one_actual_warning(manager):
    from app.harness.trace import TraceRecorder
    from app.skills.evolution import SkillEvolution
    from test_skill_evolution import IsolatedJsonStore
    from test_skill_loop import WindowStore
    service = SkillEvolution(manager, store=IsolatedJsonStore())
    manager.trace = TraceRecorder(store=WindowStore())
    for row in execution(102, 'b' * 64, 'fail', '2026-10-12T05:00:00+00:00'):
        manager.trace.record(**row)
    samples = {'current': {'complete': True, 'items': aggregate(manager.trace.store.list(), None, True)}}
    service.metrics.observe(samples, NOW)
    service.metrics.observe(samples, NOW)
    assert len(service.store.values('skill_north_star_alerts')) == 1
    assert len([r for r in manager.trace.store.list() if r.get('event') == 'skill_risk_alert']) == 1


@pytest.mark.parametrize('payload', ['invalid', {'schema': 1, 'edit_id': 'BAD'}])
def test_malformed_publication_is_not_a_metric_or_worker_crash(manager, payload):
    import json
    from app.skills.evolution import SkillEvolution
    from test_skill_evolution import IsolatedJsonStore
    service = SkillEvolution(manager, store=IsolatedJsonStore())
    directory = manager.backup_root / AGENT / NAME
    directory.mkdir(parents=True)
    (directory / 'bad.json').write_text(json.dumps({'event': 'skill_updated', 'state': 'applied',
        'edit_id': 'BAD', 'agent': AGENT, 'skill': NAME, 'north_star': payload}), encoding='utf-8')
    service.metrics.collect(NOW)
    assert service.store.values('skill_north_star_publications') == []
    assert service.store.get('skill_north_star_sync', 'latest')['complete'] is False


@pytest.mark.parametrize('accepted,criteria', [('true', {'diagnosis': True}), (True, {'diagnosis': False})])
def test_unverifiable_acceptance_receipt_cannot_complete_the_metrics_ledger(manager, accepted, criteria):
    import json
    from app.skills.evolution import SkillEvolution
    from test_skill_evolution import IsolatedJsonStore
    service = SkillEvolution(manager, store=IsolatedJsonStore())
    directory = manager.backup_root / 'tests'
    directory.mkdir(parents=True)
    receipt = {'schema': 1, 'assessment_id': 'G-BAD', 'agent': AGENT, 'name': NAME,
        'completed_at': NOW.isoformat(), 'accepted': accepted, 'trial_fingerprint': 'b' * 64,
        'criteria': criteria, 'basis': 'machine_flow_receipt'}
    (directory / 'bad.json').write_text(json.dumps({'mode': 'machine_flow', 'status': 'completed',
        'test_id': 'G-BAD', 'agent': AGENT, 'name': NAME, 'fingerprint': 'b' * 64,
        'assessment': receipt}), encoding='utf-8')
    service.metrics.collect(NOW)
    assert service.store.get('skill_north_star_sync', 'latest')['complete'] is False
    assert service.store.values('skill_north_star_gates') == []


def test_new_publication_does_not_reuse_old_gain_while_ledger_is_stale(manager):
    from datetime import timedelta
    from app.skills.evolution import SkillEvolution
    from test_skill_evolution import IsolatedJsonStore, ACTOR
    service = SkillEvolution(manager, store=IsolatedJsonStore())
    original = manager.detail(AGENT, NAME)
    old_fp = manager.registry.get(AGENT, NAME).observation()['skill_fingerprint']
    first = manager.update(AGENT, NAME, {'expected_revision': original['revision'], 'version': '1.1',
        'goal': original['goal'], 'document': original['document'] + '\n新增规则。', 'reason': '新增规则'}, ACTOR)
    new_fp = manager.registry.get(AGENT, NAME).observation()['skill_fingerprint']
    moment = datetime.now(timezone.utc)
    records = execution(200, old_fp, 'fail', (moment - timedelta(seconds=2)).isoformat())
    records += execution(201, new_fp, 'pass', moment.isoformat())
    samples = {'previous': {'complete': True, 'items': []},
               'current': {'complete': True, 'items': aggregate(records, None, True)}}
    service.metrics.collect(moment)
    assert service.metrics.status(samples, AGENT, NAME, moment)['weekly_gain']['value'] == 100
    manager.update(AGENT, NAME, {'expected_revision': first['revision'], 'version': '1.2',
        'goal': original['goal'], 'document': original['document'] + '\n另一规则。', 'reason': '另一修改'}, ACTOR)
    before = deepcopy(service.store.records)
    result = service.metrics.status(samples, AGENT, NAME, moment)
    assert result['weekly_gain']['value'] is None
    assert '同步' in result['weekly_gain']['message']
    assert service.store.records == before, 'GET 不能补写账本或发布文件'


def test_failed_file_replacement_is_not_permanent_unknown_publication(manager):
    from contextlib import contextmanager
    from app.skills.evolution import SkillEvolution
    from app.skills.management import SkillEditError
    from test_skill_evolution import IsolatedJsonStore, ACTOR
    service = SkillEvolution(manager, store=IsolatedJsonStore())
    original = manager.detail(AGENT, NAME)
    @contextmanager
    def deny(audit):
        raise SkillEditError(409, '发布栅栏不满足')
        yield
    with pytest.raises(SkillEditError):
        manager.update(AGENT, NAME, {'expected_revision': original['revision'], 'version': '1.1',
            'goal': original['goal'], 'document': original['document'] + '\n未发布修改。', 'reason': '测试'},
            ACTOR, publication_fence=deny)
    assert manager.detail(AGENT, NAME)['revision'] == original['revision']
    service.metrics.collect(datetime.now(timezone.utc))
    assert service.store.get('skill_north_star_sync', 'latest')['complete'] is True
    assert service.store.values('skill_north_star_publications') == []
