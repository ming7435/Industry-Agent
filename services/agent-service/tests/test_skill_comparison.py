"""同场景真实模型评估：标签不入模型，评分由服务端重算，不冒充业务运行。"""
from copy import deepcopy
from dataclasses import replace
from datetime import datetime, timezone, timedelta
import json
import re

import pytest

from test_skill_evolution import manager, IsolatedJsonStore

NOW = datetime(2026, 10, 14, 14, tzinfo=timezone.utc)


class ComparisonClient:
    available = True

    def __init__(self):
        self.calls = []

    def chat(self, messages):
        self.calls.append(deepcopy(messages))
        case = json.loads(messages[-1]['content'])
        states = {'C01': 'consistent', 'C02': 'conflicting', 'C03': 'missing', 'C04': 'consistent'}
        state = states[case['case_id']]
        if '旧版正文' in messages[1]['content'] and case['case_id'] == 'C02':
            state = 'consistent'
        answer = {'evidence_state': state, 'risk_alert': case['case_id'] in {'C02', 'C03'},
                  'rationale': '依据当前样例提供的报警目录和观测判断。'}
        return {'model': 'test-provider', 'choices': [{'message': {'content': json.dumps(answer)}}]}


def test_case_identifiers_do_not_reveal_reference_labels():
    from app.skills.comparison import CASES
    assert all(re.fullmatch(r'C\d{2}', row['case_id']) for row in CASES)


def comparison(manager, client=None):
    from app.skills.comparison import run_comparison
    definition = manager.registry.get('diagnosis', 'alarm_diagnosis_skill')
    return run_comparison(replace(definition, document='旧版正文'), definition,
                          manager.detail('diagnosis', definition.name)['revision'], client or ComparisonClient(), now=NOW)


def test_same_cases_are_run_for_both_versions_and_labels_are_not_sent_to_model(manager):
    from app.skills.comparison import project_comparison
    client = ComparisonClient()
    record = comparison(manager, client)
    assert len(client.calls) == 8
    assert [m[-1]['content'] for m in client.calls[:4]] == [m[-1]['content'] for m in client.calls[4:]]
    assert all('expected_state' not in m[-1]['content'] and 'drift_label' not in m[-1]['content'] for m in client.calls)
    result = project_comparison(record, manager.detail('diagnosis', record['name']), NOW)
    assert result['weekly_gain']['value'] == 25
    assert result['weekly_gain']['old']['successes'] == 3 and result['weekly_gain']['new']['successes'] == 4
    assert result['drift_recall']['value'] == 100
    assert result['drift_recall']['numerator'] == result['drift_recall']['denominator'] == 2
    assert result['weekly_gain']['source'] == result['drift_recall']['source'] == 'paired_evaluation'


@pytest.mark.parametrize('change', ['revision', 'future', 'expired', 'missing_case', 'bad_answer', 'synthetic',
                                    'unhashable_answer', 'missing_id', 'invalid_fingerprint',
                                    'missing_old_version', 'missing_new_version', 'missing_current_fingerprint'])
def test_incomplete_stale_or_synthetic_comparison_cannot_supply_metrics(manager, change):
    from app.skills.comparison import project_comparison
    record = comparison(manager)
    if change == 'revision': record['current_revision'] = '0' * 64
    if change == 'future': record['completed_at'] = (NOW + timedelta(days=1)).isoformat()
    if change == 'expired': record['completed_at'] = (NOW - timedelta(days=7)).isoformat()
    if change == 'missing_case': record['cases'].pop()
    if change == 'bad_answer': record['cases'][0]['new']['risk_alert'] = 'true'
    if change == 'synthetic': record['cases'][0]['new']['synthetic'] = True
    if change == 'unhashable_answer': record['cases'][0]['new']['evidence_state'] = {}
    if change == 'missing_id': record.pop('evaluation_id')
    if change == 'invalid_fingerprint': record['old_fingerprint'] = 'not-a-content-hash'
    if change == 'missing_old_version': record.pop('old_version')
    if change == 'missing_new_version': record.pop('new_version')
    current = manager.detail('diagnosis', record['name'])
    if change == 'missing_current_fingerprint': current.pop('content_fingerprint')
    assert project_comparison(record, current, NOW) is None


def test_comparison_fills_only_missing_observation_metrics_and_does_not_write(manager):
    from app.skills.evolution import SkillEvolution
    service = SkillEvolution(manager, store=IsolatedJsonStore())
    service.store.get_or_create('skill_north_star_comparisons', 'diagnosis:alarm_diagnosis_skill', lambda: comparison(manager))
    before = deepcopy(service.store.records)
    result = service.metrics.status(None, 'diagnosis', 'alarm_diagnosis_skill', NOW)
    assert result['weekly_gain']['value'] == 25 and result['drift_recall']['value'] == 100
    assert result['gate_pass_rate']['value'] is None and result['rollback_rate']['value'] is None
    assert result['operational_metrics']['weekly_gain']['value'] is None
    assert service.store.records == before


def test_transport_failure_does_not_become_a_failed_business_sample(manager):
    class Broken(ComparisonClient):
        def chat(self, messages):
            raise TimeoutError('isolated transport error')
    with pytest.raises(TimeoutError):
        comparison(manager, Broken())


def test_comparison_does_not_replace_available_business_metrics(manager, monkeypatch):
    from app.skills.evolution import SkillEvolution
    from app.skills import north_star
    service = SkillEvolution(manager, store=IsolatedJsonStore())
    service.store.get_or_create('skill_north_star_comparisons', 'diagnosis:alarm_diagnosis_skill', lambda: comparison(manager))
    original = north_star.project_metrics
    def available(*args, **kwargs):
        result = original(*args, **kwargs)
        result['weekly_gain'].update(value=10, publication_revision=manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'])
        result['drift_recall'].update(value=20, numerator=1, denominator=5)
        return result
    monkeypatch.setattr(north_star, 'project_metrics', available)
    result = service.metrics.status(None, 'diagnosis', 'alarm_diagnosis_skill', NOW)
    assert result['weekly_gain']['value'] == 10 and result['drift_recall']['value'] == 20
    assert result['weekly_gain'].get('source') != 'paired_evaluation'
