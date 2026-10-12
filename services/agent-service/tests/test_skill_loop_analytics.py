"""真实执行统计：未知、降级和基础设施错误不能伪装成业务通过或退化。"""
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest


def rows(status='completed', **output):
    observation = {'trace_record_id': 'OBS-A', 'timestamp': '2026-10-07T03:00:00+00:00',
                   'event': 'skill_observed', 'agent_run_id': 'RUN-A', 'trace_id': 'TRACE-A',
                   'agent': 'diagnosis', 'skill': 'alarm', 'skill_version': '1.0',
                   'skill_fingerprint': 'a' * 64, 'declared_steps': ['load', 'reason', 'validate']}
    step = {**observation, 'trace_record_id': 'STEP-A', 'event': 'step_completed', 'step': 'reason'}
    final = {'trace_record_id': 'END-A', 'timestamp': '2026-10-07T03:00:05+00:00',
             'event': 'agent_completed', 'agent_run_id': 'RUN-A', 'trace_id': 'TRACE-A',
             'agent': 'diagnosis', 'output': {'status': status, **output}, 'elapsed_ms': 50}
    return [observation, step, final]


def aggregate(records, complete=True):
    from app.skills import loop_analytics
    return loop_analytics.aggregate(records, SimpleNamespace(), complete)


@pytest.mark.parametrize('status,output,want', [
    ('completed', {'stop_reason': 'validator_pass'}, 'pass'),
    ('completed', {'validation': {'passed': True}}, 'pass'),
    ('completed', {'confidence': 0.99}, 'unknown'),
    ('completed', {'validation_errors': ['缺少设备证据']}, 'fail'),
    ('completed', {'validation': {'passed': False, 'errors': ['缺少Evidence']}}, 'fail'),
    ('fallback', {}, 'degraded'),
    ('insufficient_evidence', {}, 'degraded'),
    ('fallback', {'error': 'HTTP Error 402'}, 'infrastructure_error'),
    ('failed', {'error': '设备连接超时'}, 'infrastructure_error'),
])
def test_verdict_does_not_use_http_success_or_model_confidence(status, output, want):
    health = aggregate(rows(status, **output))
    assert health[0]['verdicts'][want] == 1
    assert health[0]['calls'] == 1
    assert health[0]['last_gain'] == 'not_evaluated'


def test_repeated_trace_records_and_skill_selections_count_one_attempt():
    source = rows('fallback')
    health = aggregate([*source, *source])
    assert health[0]['calls'] == 1
    assert health[0]['coverage'] == {'executed': 1, 'declared': 3, 'ratio': 1 / 3}
    assert health[0]['sources'][0]['source_id'] == 'END-A'


def test_agent_attempts_are_not_grouped_by_shared_trace_id():
    first = rows('fallback')
    second = [{**r, 'agent_run_id': 'RUN-B', 'trace_record_id': r['trace_record_id'] + '-B'}
              for r in rows('completed', stop_reason='validator_pass')]
    health = aggregate([*first, *second])
    assert health[0]['calls'] == 2
    assert health[0]['verdicts']['degraded'] == 1 and health[0]['verdicts']['pass'] == 1


def test_unfinished_attempt_is_unknown():
    health = aggregate(rows()[:2])
    assert health[0]['verdicts']['unknown'] == 1
    assert health[0]['sources'] == []


def test_expert_scope_is_excluded_but_not_general_business():
    ordinary = rows('fallback')
    expert = [{**r, 'run_type': 'expert_trial', 'trace_record_id': r['trace_record_id'] + '-X',
               'agent_run_id': 'RUN-X'} for r in ordinary]
    assert aggregate([*ordinary, *expert])[0]['calls'] == 1


def test_mixed_version_attempt_cannot_be_optimization_evidence():
    source = rows('fallback')
    source.insert(1, {**source[0], 'trace_record_id': 'OBS-B', 'skill_version': '1.1', 'skill_fingerprint': 'b' * 64})
    health = aggregate(source)
    assert all(r['mixed_version_calls'] == 1 and not r['sources'] for r in health)


def test_incomplete_window_cannot_select_candidates():
    health = aggregate(rows('fallback'), complete=False)
    assert health[0]['complete'] is False
    assert health[0]['sources'] == []


def test_old_logs_missing_version_are_retained_as_unknown():
    final = rows('fallback')[-1]
    final['output']['active_skills'] = ['alarm']
    health = aggregate([final])
    assert health[0]['version'] == 'unknown' and health[0]['calls'] == 1
    assert health[0]['verdicts']['unknown'] == 1 and health[0]['sources'] == []


def test_week_boundaries_are_monday_midnight_in_china():
    from app.skills import loop_analytics
    windows = loop_analytics.week_windows(datetime(2026, 10, 12, 1, 0, tzinfo=timezone.utc))
    assert windows['current']['start'] == '2026-10-11T16:00:00+00:00'
    assert windows['previous']['start'] == '2026-10-04T16:00:00+00:00'
    assert windows['previous']['end'] == '2026-10-11T16:00:00+00:00'
