"""Skill Loop 按真实问题选择全部合格技能，并发去重，不能自动发布或重试收费生成。"""
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from shutil import copytree
from types import SimpleNamespace

import pytest

from app.harness.trace import TraceRecorder
from app.skills.evolution import SkillEvolution
from app.skills.management import SkillEditError
from test_skill_evolution import manager, IsolatedJsonStore, model_reply, ACTOR

NOW = datetime(2026, 10, 12, 1, tzinfo=timezone.utc)


class WindowStore:
    def __init__(self):
        self.rows = []
    def append(self, record):
        self.rows.append(deepcopy(record))
    def list(self, **kwargs):
        return deepcopy(self.rows)
    def skill_window_page(self, start, end, after=0, upper=None, limit=200):
        upper = len(self.rows) if upper is None else upper
        rows = [(i, r) for i, r in enumerate(self.rows, 1) if after < i <= upper and
                start <= datetime.fromisoformat(r['timestamp']) < end]
        batch = rows[:limit]
        return {'items': deepcopy([r for _, r in batch]), 'after': batch[-1][0] if batch else after,
                'upper': upper, 'complete': True, 'recording_complete': True, 'done': len(batch) < limit, 'storage': 'mysql'}


def add_run(manager, name='alarm_diagnosis_skill', *, number=1, error='', status='fallback', timestamp='2026-10-07T03:00:00+00:00'):
    definition = manager.registry.get('diagnosis', name)
    manager.trace.record(timestamp=timestamp, trace_id='TRACE-' + name + str(number),
                         agent_run_id='RUN-' + name + str(number), event='skill_observed',
                         **definition.observation())
    manager.trace.record(timestamp=timestamp, trace_id='TRACE-' + name + str(number),
                         agent_run_id='RUN-' + name + str(number), agent='diagnosis', event='agent_completed',
                         output={'status': status, 'summary': '现场证据不足，需要补查', 'error': error,
                                 'validation_errors': [] if error else ['缺少设备证据']})


@pytest.fixture
def system(manager):
    manager.trace = TraceRecorder(store=WindowStore())
    service = SkillEvolution(manager, store=IsolatedJsonStore(), client_factory=lambda: model_reply({
        'reason': '补充证据规则', 'rules': ['不能把报警名称当作当前设备的根因证据。'],
        'expected_result': '证据不足时列出待核查内容。'}))
    add_run(manager)
    return service


def loop(service):
    from app.skills.loop import SkillLoop
    return SkillLoop(service)


def test_week_plan_does_not_fill_healthy_or_unobserved_skills(system):
    actual = loop(system)
    status = actual.refresh(NOW)
    assert status['kind'] == 'skill_loop'
    assert status['plan']['limit'] is None and len(status['plan']['selected']) == 1
    assert status['plan']['remaining'] is None
    assert status['plan']['total'] == 1 and status['plan']['pending'] == 1
    assert status['plan']['selected'][0]['name'] == 'alarm_diagnosis_skill'
    assert '证据' in status['plan']['selected'][0]['reason']
    assert status['health']['previous']['complete'] is True
    assert actual.status()['plan']['used'] == 0


def test_reserved_generation_includes_cycle_and_never_publishes(system):
    actual = loop(system)
    before = system.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision']
    candidate = actual.scan_once(NOW)
    assert candidate['status'] == 'awaiting_confirmation'
    assert candidate['skill_loop_id'] == '2026-10-12'
    assert candidate['source']['planning_reason']
    assert '周窗口' in candidate['draft']['reason']
    assert system.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == before
    assert actual.scan_once(NOW) is None
    assert actual.status()['plan']['used'] == 1


def test_infrastructure_failure_does_not_trigger_rule_generation(system):
    system.manager.trace = TraceRecorder(store=WindowStore())
    add_run(system.manager, error='HTTP Error 402')
    actual = loop(system)
    assert actual.scan_once(NOW) is None
    status = actual.status()
    assert status['plan']['selected'] == [] and status['plan']['used'] == 0
    assert status['health']['previous']['items'][0]['verdicts']['infrastructure_error'] == 1


def test_current_changed_version_cannot_use_old_failure_as_basis(system):
    definition = system.manager.registry.get('diagnosis', 'alarm_diagnosis_skill')
    path = Path(definition.path)
    path.write_text(path.read_text(encoding='utf-8') + '\n新发布规则\n', encoding='utf-8')
    actual = loop(system)
    assert actual.scan_once(NOW) is None
    assert actual.status()['plan']['selected'] == []


def test_memory_only_or_failed_window_cannot_generate(system):
    system.manager.trace = TraceRecorder()
    add_run(system.manager)
    actual = loop(system)
    assert actual.scan_once(NOW) is None
    assert actual.status()['health']['previous']['complete'] is False


def test_legacy_snapshot_and_plan_without_coverage_proof_cannot_reenable_generation(system):
    system.manager.trace = TraceRecorder()
    system.store.get_or_create('skill_loop_snapshot', '2026-10-04T16:00:00+00:00',
        lambda: {'complete': True, 'items': [], 'start': '2026-10-04T16:00:00+00:00', 'end': '2026-10-11T16:00:00+00:00'})
    system.store.get_or_create('skill_loop_plan', '2026-10-12', lambda: {'loop_id': '2026-10-12', 'revision': 0,
        'limit': 3, 'selected': [], 'reservations': {'old:A': {}, 'old:B': {}}})
    actual = loop(system)
    assert actual.scan_once(NOW) is None
    status = actual.status()
    assert status['health']['previous']['complete'] is False
    assert status['plan']['used'] == 2 and status['plan']['blocked_reason']


def test_failed_generation_consumes_reservation_across_restart(system):
    system.client_factory = lambda: SimpleNamespace(available=True, chat=lambda *a, **k: (_ for _ in ()).throw(TimeoutError()))
    actual = loop(system)
    failed = actual.scan_once(NOW)
    assert failed['status'] == 'generation_failed'
    restarted = SkillEvolution(system.manager, store=system.store, client_factory=system.client_factory)
    assert loop(restarted).scan_once(NOW) is None
    assert loop(restarted).status()['plan']['used'] == 1
    assert len(system.list()) == 1


def add_four_skills(system):
    source = Path(system.manager.registry.get('diagnosis', 'alarm_diagnosis_skill').path).parent
    for i in range(1, 5):
        name = 'alarm_' + str(i)
        target = system.manager.registry.root / 'diagnosis' / name
        copytree(source, target)
        document = target / 'SKILL.md'
        document.write_text(document.read_text(encoding='utf-8').replace(
            'name: alarm_diagnosis_skill', 'name: ' + name), encoding='utf-8')
        add_run(system.manager, name)


def test_concurrent_workers_generate_all_eligible_skills_without_weekly_quota(system):
    add_four_skills(system)
    services = [SkillEvolution(system.manager, store=system.store, client_factory=system.client_factory) for _ in range(4)]
    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(lambda s: loop(s).scan_once(NOW), services))
    actual = loop(system)
    assert len(actual.status()['plan']['selected']) == 5
    for _ in range(5):
        actual.scan_once(NOW)
    assert len(system.list()) == 5 and actual.status()['plan']['used'] == 5
    assert len({(r['agent'], r['name']) for r in system.list()}) == 5
    assert all(r['status'] == 'awaiting_confirmation' for r in system.list())
    assert actual.status()['plan']['pending'] == 0
    scoped = actual.status('diagnosis', 'alarm_diagnosis_skill')['plan']
    assert len(scoped['selected']) == 1
    assert scoped['total'] == scoped['used'] == 5, '总数仍是全系统计划，不随当前技能筛选改变'


def test_exhausted_legacy_quota_is_removed_without_losing_existing_candidates(system):
    add_four_skills(system)
    actual = loop(system)
    actual.refresh(NOW)
    week_id = '2026-10-12'
    plan = system.store.get('skill_loop_plan', week_id)
    system.store.compare_and_set('skill_loop_plan', week_id, 'revision', plan['revision'],
        {'revision': plan['revision'] + 1, 'selection_policy': 3, 'limit': 3, 'selected': plan['selected'][:3]})
    first = [actual.scan_once(NOW, refresh=False) for _ in range(3)]
    old_reservations = system.store.get('skill_loop_plan', week_id)['reservations']
    restarted = SkillEvolution(system.manager, store=system.store, client_factory=system.client_factory)
    status = restarted.loop.refresh(NOW)
    assert status['plan']['used'] == 3 and status['plan']['pending'] == 2
    assert status['plan']['limit'] is None
    assert system.store.get('skill_loop_plan', week_id)['reservations'] == old_reservations
    for _ in range(3):
        restarted.loop.scan_once(NOW)
    assert len(restarted.list()) == 5
    assert {r['proposal_id'] for r in first} <= {r['proposal_id'] for r in restarted.list()}
    assert len({r['name'] for r in restarted.list()}) == 5


def test_refresh_adds_newly_eligible_skill_after_existing_draft_is_rejected(system):
    existing = system.generate_source({'source_id': 'EARLIER-DRAFT', 'trace_id': 'EARLIER-RUN',
        'agent': 'diagnosis', 'name': 'alarm_diagnosis_skill', 'facts': '{"validation_findings":["缺少证据"]}'})
    # 本周计划创建时仍有在途稿，先不入选；审核拒绝后可纳入该周计划。
    actual = loop(system)
    assert actual.refresh(NOW)['plan']['selected'] == []
    system.reject(existing['proposal_id'], existing['candidate_hash'], ACTOR)
    assert len(actual.refresh(NOW)['plan']['selected']) == 1
    next_candidate = actual.scan_once(NOW)
    assert next_candidate and next_candidate['proposal_id'] != existing['proposal_id']


def test_pause_is_persistent_and_does_not_mutate_business_or_candidates(system):
    actual = loop(system)
    actual.set_paused(True, ACTOR)
    before = system.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision']
    assert loop(SkillEvolution(system.manager, store=system.store)).scan_once(NOW) is None
    assert actual.status()['control']['paused'] is True
    assert system.list() == []
    assert system.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == before
    actual.set_paused(False, ACTOR)
    assert actual.scan_once(NOW)['status'] == 'awaiting_confirmation'


def test_supervisor_cannot_change_skill_loop_control(system):
    with pytest.raises(SkillEditError) as error:
        loop(system).set_paused(True, {'role': 'supervisor', 'user_id': 'S'})
    assert error.value.status == 403


def test_lost_active_receipt_reconciles_terminal_candidate_without_repeating_model(system):
    actual = loop(system)
    candidate = actual.scan_once(NOW)
    key = 'diagnosis:alarm_diagnosis_skill'
    slot = system.store.get('skill_loop_active', key)
    system.store.compare_and_set('skill_loop_active', key, 'revision', slot['revision'], {'proposal_id': ''})
    system.store.compare_and_set('skill_evolution', candidate['proposal_id'], 'revision', candidate['revision'],
                                 {'status': 'generation_failed'})
    source_key = candidate['source']['source_id'] + ':diagnosis:alarm_diagnosis_skill'
    assert system.store.get('skill_evolution_source', source_key)['proposal_id'] == candidate['proposal_id']
    actual.refresh(NOW)
    # 只读对账应能展示已存在的终态；下轮认领时能够安全释放旧占位。
    assert actual.status()['plan']['selected'][0]['phase'] == 'generation_failed'
    assert system.store.get('skill_loop_active', key).get('source_key') == source_key
    add_run(system.manager, number=11, timestamp='2026-10-13T03:00:00+00:00')
    next_candidate = actual.scan_once(datetime(2026, 10, 19, 1, tzinfo=timezone.utc))
    assert next_candidate and next_candidate['proposal_id'] != candidate['proposal_id']
    assert actual.status()['plan']['used'] == 1


def test_source_baseline_is_checked_from_same_detail_snapshot(system):
    from app.skills.loop_analytics import aggregate
    source = aggregate(system.manager.trace.store.rows, system.manager.registry, True)[0]['sources'][0]
    original = system.manager.detail
    def read(agent, name):
        path = Path(system.manager.registry.get(agent, name).path)
        path.write_text(path.read_text(encoding='utf-8') + '\n刚刚发布的新正文\n', encoding='utf-8')
        return original(agent, name)
    system.manager.detail = read
    assert system.generate_source(source) is None
    assert system.list() == []


def test_status_is_read_only_and_never_calls_model(system):
    actual = loop(system)
    before = dict(system.store.records)
    status = actual.status()
    assert status['health'] is None and status['plan'] is None
    assert system.store.records == before


def test_observations_update_when_model_is_unconfigured(system):
    from app.skills.evolution_worker import EvolutionWorker
    system.client_factory = lambda: SimpleNamespace(available=False)
    EvolutionWorker(system, enabled=True).tick()
    status = loop(system).status()
    assert status['health'] is not None
    assert status['plan']['used'] == 0 and system.list() == []


def test_published_candidate_feeds_observation_phase_and_actual_new_version(system):
    from test_skill_evolution import make_evolution, confirm, finish_trial, publish_evolution
    actual = loop(system)
    candidate = actual.scan_once(NOW)
    adapter = make_evolution(system.manager)
    adapter.service, adapter.candidate = system, candidate
    confirm(adapter)
    system.advance(candidate['proposal_id'])
    finish_trial(adapter)
    system.advance(candidate['proposal_id'])
    assert publish_evolution(adapter)['status'] == 'published'
    add_run(system.manager, number=9, status='completed', timestamp='2026-10-12T00:00:00+00:00')
    status = actual.refresh(NOW)
    assert status['plan']['selected'][0]['phase'] == 'observing'
    assert status['health']['current']['items'][0]['version'] == '1.1'
    assert status['health']['current']['items'][0]['fingerprint'] != status['health']['previous']['items'][0]['fingerprint']
    assert status['evaluation']['status'] == 'not_evaluated'


def test_post_publish_current_version_observation_does_not_claim_measured_gain(system):
    actual = loop(system)
    actual.scan_once(NOW)
    add_run(system.manager, number=2, status='completed', timestamp='2026-10-12T00:00:00+00:00')
    status = actual.refresh(NOW)
    assert status['health']['current']['items'][0]['last_gain'] == 'not_evaluated'
    assert status['evaluation']['status'] == 'not_evaluated'
