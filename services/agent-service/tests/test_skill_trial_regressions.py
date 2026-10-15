"""Regression tests for skill trial, runtime activation and publication consistency.

All skills and receipts live in pytest tmp_path; providers are isolated adapters.
"""
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from shutil import copytree
from threading import Event
from time import monotonic, sleep
from types import SimpleNamespace

import pytest

from app.skills.management import AGENTS, SkillManager
from app.skills.machine_testing import MachineTrials
from app.skills.registry import SkillRegistry, get_skill_registry
from app.skills.review import MARKER, schedule_review
from app.tools.registry import ToolRegistry
from test_expert_machine_trials import Machines, Business
from test_skill_evolution import model_reply


ACTOR = {'user_id': 'U-AUDIT', 'role': 'technician', 'responsible_device_ids': ['D-1']}


@pytest.fixture
def system(tmp_path, monkeypatch):
    root = tmp_path / 'skills'
    source = Path(__file__).resolve().parents[1] / 'app/skills'
    for agent in AGENTS:
        copytree(source / agent, root / agent)
    manager = SkillManager(SkillRegistry(root), ToolRegistry().definitions,
                           trace=None, backup_root=tmp_path / 'receipts')
    factory, backend = Machines(), Business()
    manager.trials = MachineTrials(manager, SimpleNamespace(container=SimpleNamespace()), factory, backend)
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    yield SimpleNamespace(manager=manager, trials=manager.trials, factory=factory, backend=backend)
    manager.trials.pool.shutdown(wait=True)


def draft(system, agent, name):
    current = system.manager.detail(agent, name)
    return {key: current[key] for key in ('version', 'goal', 'document')} | {
        'expected_revision': current['revision'], 'reason': 'isolated audit'}


def wait(system, started):
    deadline = monotonic() + 10
    while monotonic() < deadline:
        receipt = system.trials.get(started['test_id'], ACTOR)
        if receipt['status'] != 'running':
            return receipt
        sleep(.01)
    pytest.fail('trial did not finish')


def test_unrelated_knowledge_reference_cannot_pass(system):
    system.trials.client_factory = lambda: model_reply({'retrieval_plan': ['search_manual', 'search_knowledge']})
    task = {'query': '查找主轴手册', 'expected_status': 'completed',
            'documents': [{'document_id': 'UNRELATED', 'title': '食堂周五菜单',
                           'content': '午餐供应米饭和西红柿炒鸡蛋。', 'source_type': 'manual'}],
            'expected': '返回主轴维修手册，不能把食堂菜单当作维修证据。'}
    started = system.trials.start_task('knowledge', 'manual_search_skill',
        {**draft(system, 'knowledge', 'manual_search_skill'), 'task': task}, ACTOR)
    receipt = wait(system, started)
    assert receipt['assessment']['accepted'] is False, 'unrelated document was accepted as valid evidence'


def test_manually_published_review_rule_is_enabled_in_runtime(system):
    name = 'intent_routing_skill'
    values = draft(system, 'router', name)
    values.update(version='1.1', goal='核查实际路由意图')
    values['document'] += '\n人工修订核查规则：关注实际返回的路由意图。\n'
    assert MARKER not in values['document']
    system.trials.client_factory = lambda: model_reply({'skills': {name: {
        'highlights': ['/output/intent'], 'missing': []}}})
    task = {'input': {'query': '查找手册'}, 'output': {'intent': 'knowledge'},
            'expected_highlights': ['/output/intent'], 'expected_missing': [],
            'expected': '关注实际意图。'}
    receipt = wait(system, system.trials.start_task('router', name, {**values, 'task': task}, ACTOR))
    assert receipt['assessment']['accepted'] is True
    published = system.manager.publish('router', name,
        {**values, 'test_id': receipt['test_id'], 'human_confirmed': True}, ACTOR)
    assert receipt['result']['skill_fingerprint'] == published['content_fingerprint']
    called = Event()
    class Trace:
        def record(self, **kwargs):
            pass
    def chat(messages, **kwargs):
        called.set()
        return model_reply({'skills': {name: {'highlights': ['/output/intent'], 'missing': []}}}).chat(messages)
    schedule_review([system.manager.registry.get('router', name)], task['input'], task['output'],
        client=SimpleNamespace(available=True, chat=chat), trace=Trace(),
        context={'task_id': 'T-AUDIT', 'trace_id': 'TRACE-AUDIT', 'agent_run_id': 'RUN-AUDIT'})
    assert published['revision'] != values['expected_revision']
    assert called.wait(.5), 'published and accepted manual rule never enables the runtime review'


def test_no_alarm_skill_has_a_usable_machine_scenario(system, monkeypatch):
    monkeypatch.setattr(system.factory, 'scenarios', lambda did: {'active_scenarios': [], 'scenarios': [
        {'scenario_id': 'no-alarm', 'name': '无报警指标异常', 'alarm_code': '', 'default_device_id': did}]})
    current = system.manager.detail('diagnosis', 'no_alarm_diagnosis_skill')
    assert current['optimization']['mode'] == 'machine_flow'
    catalog = system.trials.catalog_machines(ACTOR)
    assert any(s['scenario_id'] == 'no-alarm' for d in catalog['items'] for s in d['scenarios']), (
        'skill requires no alarm, but every no-alarm scenario is filtered from its required trial mode')


def test_recovered_machine_receipt_does_not_keep_failed_assessment(system):
    from app.skills.evolution import SkillEvolution
    from test_skill_evolution import IsolatedJsonStore
    metrics = SkillEvolution(system.manager, store=IsolatedJsonStore()).metrics
    values = draft(system, 'diagnosis', 'alarm_diagnosis_skill')
    started = system.trials.start_machine('diagnosis', 'alarm_diagnosis_skill',
        {**values, 'machine': {'device_id': 'D-1', 'scenario_id': 'turret', 'expected': '完成闭环'}}, ACTOR)
    def producer():
        # Preserve the same receipt boundary as AgentHarness, without business side effects.
        get_skill_registry().record_execution('diagnosis', {'active_skills': ['alarm_diagnosis_skill']})
        return {'status': 'failed', 'diagnosis': {'status': 'completed', 'summary': '反馈异常'},
                'maintenance_plan': {'plan_id': 'PLAN-AUDIT'}}
    system.trials.handle_event({'event_id': 'E-AUDIT', 'device_id': 'D-1', 'alarm_code': '700006',
        'timestamp': datetime.now(timezone.utc).isoformat()}, producer)
    first = system.trials.get(started['test_id'], ACTOR)
    assert first['status'] == 'failed' and first['assessment']['accepted'] is False
    metrics.collect(datetime.now(timezone.utc))
    assert metrics.store.values('skill_north_star_gates')[0]['accepted'] is False
    # The delayed order and its completed business records become visible later.
    system.backend.orders['WO-AUDIT'] = {'workorder_id': 'WO-AUDIT', 'device_id': 'D-1',
        'event_id': 'E-AUDIT', 'assignee': ACTOR['user_id'], 'status': 'completed'}
    system.backend.cycles = [{'cycle_id': 'C-AUDIT', 'workorder_ids': ['WO-AUDIT'], 'state': 'running'}]
    system.backend.reports = [{'report_id': 'R-AUDIT', 'cycle_id': 'C-AUDIT', 'persisted': True}]
    recovered = system.trials.get(started['test_id'], ACTOR)
    assert recovered['status'] == 'completed'
    # The real publication gate must use the same recovered assessment.
    system.trials.validate_publish('diagnosis', 'alarm_diagnosis_skill',
        {**values, 'test_id': started['test_id'], 'human_confirmed': True}, ACTOR)
    assert recovered['assessment']['accepted'] is True, 'completed and publishable trial retained its failed assessment'
    metrics.collect(datetime.now(timezone.utc))
    metrics.collect(datetime.now(timezone.utc))
    gates = metrics.store.values('skill_north_star_gates')
    assert len(gates) == 1 and gates[0]['accepted'] is True
    # A lagging collector must not overwrite the recovered metric with its older revision.
    old_record = system.trials._read(started['test_id'], ACTOR)
    old_record['assessment'] = first['assessment']
    system.trials._write(old_record)
    metrics.collect(datetime.now(timezone.utc))
    assert metrics.store.values('skill_north_star_gates')[0]['accepted'] is True


@pytest.mark.parametrize('alarm', [None, ''])
def test_no_alarm_trial_claims_matching_event_and_can_publish(system, monkeypatch, alarm):
    from app.agents.diagnosis.tool_policy import select_skill
    name = 'no_alarm_diagnosis_skill'
    monkeypatch.setattr(system.factory, 'scenarios', lambda did: {
        'active_scenarios': [s for s in system.factory.active if s['device_id'] == did],
        'scenarios': [{'scenario_id': 'no-alarm', 'alarm_code': alarm, 'default_device_id': did}]})
    values = draft(system, 'diagnosis', name)
    started = system.trials.start_machine('diagnosis', name, {**values, 'machine': {
        'device_id': 'D-1', 'scenario_id': 'no-alarm', 'expected': '无报警异常完成闭环'}}, ACTOR)
    event = {'event_id': 'E-NO-ALARM', 'device_id': 'D-1', 'alarm_code': alarm,
             'timestamp': datetime.now(timezone.utc).isoformat(), 'abnormal_metrics': []}
    order = {'workorder_id': 'WO-NO-ALARM', 'event_id': event['event_id'], 'device_id': 'D-1',
             'status': 'completed', 'assignee': ACTOR['user_id']}
    def producer():
        selected = select_skill(event)['skills']
        assert name in selected
        registry = get_skill_registry()
        assert registry.is_expert_trial
        registry.record_execution('diagnosis', {'active_skills': selected})
        system.backend.orders[order['workorder_id']] = order
        return {'diagnosis': {'summary': '现场异常待核对'},
                'maintenance_plan': {'plan_id': 'PLAN-NO-ALARM'}, 'workorder': order}
    system.trials.handle_event(event, producer)
    system.backend.cycles = [{'cycle_id': 'C-NO-ALARM', 'workorder_ids': [order['workorder_id']]}]
    system.backend.reports = [{'report_id': 'R-NO-ALARM', 'cycle_id': 'C-NO-ALARM', 'persisted': True}]
    receipt = system.trials.get(started['test_id'], ACTOR)
    assert receipt['assessment']['accepted'] is True
    published = system.manager.publish('diagnosis', name,
        {**values, 'test_id': started['test_id'], 'human_confirmed': True}, ACTOR)
    assert published['revision'] != values['expected_revision']


@pytest.mark.parametrize('unrelated', ['scenario', 'device', 'old_event', 'different_skill'])
def test_no_alarm_trial_does_not_claim_unrelated_events(system, monkeypatch, unrelated):
    monkeypatch.setattr(system.factory, 'scenarios', lambda did: {
        'active_scenarios': system.factory.active,
        'scenarios': [{'scenario_id': 'no-alarm', 'alarm_code': '', 'default_device_id': did}]})
    started = system.trials.start_machine('diagnosis', 'no_alarm_diagnosis_skill',
        {**draft(system, 'diagnosis', 'no_alarm_diagnosis_skill'), 'machine': {
            'device_id': 'D-1', 'scenario_id': 'no-alarm', 'expected': '无报警异常'}}, ACTOR)
    event = {'event_id': 'E-OTHER', 'device_id': 'D-1', 'alarm_code': None,
             'timestamp': datetime.now(timezone.utc).isoformat()}
    if unrelated == 'scenario':
        system.factory.active = [{'scenario_id': 'other', 'device_id': 'D-1'}]
    if unrelated == 'device':
        event['device_id'] = 'D-2'
    if unrelated == 'old_event':
        event['timestamp'] = '2000-01-01T00:00:00+00:00'
    if unrelated == 'different_skill':
        event['abnormal_metrics'] = [{'key': 'temperature'}, {'key': 'vibration'}]
    system.trials.handle_event(event, lambda: {})
    assert system.trials.get(started['test_id'], ACTOR)['status'] == 'awaiting_fault'


@pytest.mark.parametrize('expected_ids,accepted', [(['DOC-1'], True), (['DOC-2'], False)])
def test_knowledge_trial_checks_expected_evidence_not_just_status(system, expected_ids, accepted):
    system.trials.client_factory = lambda: model_reply({'retrieval_plan': ['search_manual', 'search_knowledge']})
    task = {'query': '查找主轴手册', 'expected_status': 'completed',
            'documents': [
                {'document_id': 'DOC-1', 'title': '主轴手册', 'content': '检查主轴冷却。', 'source_type': 'manual'},
                {'document_id': 'DOC-2', 'title': '食堂菜单', 'content': '米饭鸡蛋。', 'source_type': 'manual'}],
            'expected_document_ids': expected_ids, 'expected': '只返回相关的主轴资料。'}
    receipt = wait(system, system.trials.start_task('knowledge', 'manual_search_skill',
        {**draft(system, 'knowledge', 'manual_search_skill'), 'task': task}, ACTOR))
    assert receipt['assessment']['accepted'] is accepted
    assert [d['document_id'] for d in receipt['result']['documents']] == ['DOC-1']


@pytest.mark.parametrize('status,expected_ids', [
    ('completed', []), ('completed', ['UNKNOWN']), ('completed', ['DOC-1', 'DOC-1']),
    ('insufficient_evidence', ['DOC-1']),
])
def test_knowledge_sample_rejects_inconsistent_evidence_expectations(status, expected_ids):
    from app.skills.management import SkillEditError
    from app.skills.task_testing import validate_task
    with pytest.raises(SkillEditError) as error:
        validate_task('knowledge', 'manual_search_skill', {'query': '查找主轴手册',
            'expected_status': status, 'expected_document_ids': expected_ids, 'expected': '核对返回资料',
            'documents': [{'document_id': 'DOC-1', 'title': '主轴手册', 'content': '检查主轴冷却', 'source_type': 'manual'}]})
    assert error.value.status == 422


@pytest.mark.parametrize('assessment', [None, {'accepted': False}, {'accepted': True}])
def test_machine_publish_rejects_missing_or_incomplete_assessment(system, assessment):
    from time import time
    from uuid import uuid4
    from app.skills.testing import fingerprint
    from app.skills.management import SkillEditError
    values = draft(system, 'diagnosis', 'alarm_diagnosis_skill')
    identity = uuid4().hex
    system.trials._write({'test_id': identity, 'actor_id': ACTOR['user_id'], 'agent': 'diagnosis',
        'name': 'alarm_diagnosis_skill', 'fingerprint': fingerprint(values), 'mode': 'machine_flow',
        'status': 'completed', 'created_epoch': time(), 'dependencies': system.trials._dependencies(),
        'assessment': assessment})
    with pytest.raises(SkillEditError):
        system.trials.validate_publish('diagnosis', 'alarm_diagnosis_skill',
            {**values, 'test_id': identity, 'human_confirmed': True}, ACTOR)


def test_old_knowledge_receipt_without_relevance_check_requires_retest(system):
    from app.skills.management import SkillEditError
    system.trials.client_factory = lambda: model_reply({'retrieval_plan': ['search_manual', 'search_knowledge']})
    values = draft(system, 'knowledge', 'manual_search_skill')
    task = {'query': '查找主轴手册', 'expected_status': 'completed', 'expected': '返回主轴依据',
            'documents': [{'document_id': 'DOC-1', 'title': '主轴手册', 'content': '检查主轴冷却', 'source_type': 'manual'}]}
    receipt = wait(system, system.trials.start_task('knowledge', 'manual_search_skill', {**values, 'task': task}, ACTOR))
    record = system.trials._read(receipt['test_id'], ACTOR)
    record['assessment']['criteria'].pop('query_relevance', None)
    system.trials._write(record)
    with pytest.raises(SkillEditError):
        system.trials.validate_publish('knowledge', 'manual_search_skill',
            {**values, 'test_id': receipt['test_id'], 'human_confirmed': True}, ACTOR)


@pytest.mark.parametrize('pause_at', ['before_receipt_refresh', 'before_commit'])
def test_stale_refresh_cannot_overwrite_recovered_machine_receipt(system, monkeypatch, pause_at):
    values = draft(system, 'diagnosis', 'alarm_diagnosis_skill')
    started = system.trials.start_machine('diagnosis', 'alarm_diagnosis_skill',
        {**values, 'machine': {'device_id': 'D-1', 'scenario_id': 'turret', 'expected': '完成闭环'}}, ACTOR)
    def producer():
        get_skill_registry().record_execution('diagnosis', {'active_skills': ['alarm_diagnosis_skill']})
        return {'status': 'failed', 'diagnosis': {'summary': '反馈异常'},
                'maintenance_plan': {'plan_id': 'PLAN-RACE'}}
    system.trials.handle_event({'event_id': 'E-RACE', 'device_id': 'D-1', 'alarm_code': '700006',
        'timestamp': datetime.now(timezone.utc).isoformat()}, producer)
    first = system.trials.get(started['test_id'], ACTOR)
    assert first['assessment']['accepted'] is False
    paused, resume = Event(), Event()
    def pause_once():
        if not paused.is_set():
            paused.set()
            assert resume.wait(10), 'newer refresh did not finish'
    if pause_at == 'before_receipt_refresh':
        original = system.factory.devices
        def devices():
            result = original()
            pause_once()
            return result
        monkeypatch.setattr(system.factory, 'devices', devices)
    else:
        original = system.trials._save_changes
        def save(test_id, **changes):
            if 'assessment' in changes:
                pause_once()
            return original(test_id, **changes)
        monkeypatch.setattr(system.trials, '_save_changes', save)
    with ThreadPoolExecutor(max_workers=1) as pool:
        stale = pool.submit(system.trials.get, started['test_id'], ACTOR)
        try:
            assert paused.wait(5), 'older refresh did not reach pause'
            system.backend.orders['WO-RACE'] = {'workorder_id': 'WO-RACE', 'device_id': 'D-1',
                'event_id': 'E-RACE', 'assignee': ACTOR['user_id'], 'status': 'completed'}
            system.backend.cycles = [{'cycle_id': 'C-RACE', 'workorder_ids': ['WO-RACE'], 'state': 'running'}]
            system.backend.reports = [{'report_id': 'R-RACE', 'cycle_id': 'C-RACE', 'persisted': True}]
            recovered = system.trials.get(started['test_id'], ACTOR)
            assert recovered['status'] == 'completed' and recovered['assessment']['accepted'] is True
        finally:
            resume.set()
        returned = stale.result(timeout=5)
    saved = system.trials._read(started['test_id'], ACTOR)
    assert returned['status'] == saved['status'] == 'completed'
    assert returned['assessment'] == saved['assessment'] == recovered['assessment']
    assert saved['details'] == recovered['details']
    system.trials.validate_publish('diagnosis', 'alarm_diagnosis_skill',
        {**values, 'test_id': started['test_id'], 'human_confirmed': True}, ACTOR)


def test_legacy_knowledge_receipts_do_not_block_or_inflate_current_metrics(system):
    from app.skills.evolution import SkillEvolution
    from test_skill_evolution import IsolatedJsonStore
    metrics = SkillEvolution(system.manager, store=IsolatedJsonStore()).metrics
    system.trials.client_factory = lambda: model_reply({'retrieval_plan': ['search_manual', 'search_knowledge']})
    values = draft(system, 'knowledge', 'manual_search_skill')
    task = {'query': '查找主轴手册', 'expected_status': 'completed', 'expected': '返回主轴依据',
            'documents': [{'document_id': 'DOC-1', 'title': '主轴手册', 'content': '检查主轴冷却', 'source_type': 'manual'}]}
    first = wait(system, system.trials.start_task('knowledge', 'manual_search_skill', {**values, 'task': task}, ACTOR))
    legacy = system.trials._read(first['test_id'], ACTOR)
    legacy['assessment']['criteria'].pop('query_relevance')
    system.trials._write(legacy)
    # Simulate an existing metric collected by the pre-upgrade service.
    metrics.store.get_or_create('skill_north_star_gates', first['test_id'], lambda: legacy['assessment'])
    metrics.collect(datetime.now(timezone.utc))
    assert metrics.store.get('skill_north_star_sync', 'latest')['complete'] is True
    second = wait(system, system.trials.start_task('knowledge', 'manual_search_skill', {**values, 'task': task}, ACTOR))
    assert second['assessment']['accepted'] is True
    for _ in range(2):
        moment = datetime.now(timezone.utc)
        metrics.collect(moment)
        sync = metrics.store.get('skill_north_star_sync', 'latest')
        assert sync['complete'] is True and sync['legacy_excluded'] == 1
        result = metrics.status(None, 'knowledge', 'manual_search_skill', moment)
        assert result['gate_pass_rate']['denominator'] == 1
        assert result['gate_pass_rate']['value'] == 100
        assert result['latest_assessment']['assessment_id'] == second['test_id']
    # A corrupt old receipt must still block synchronization, rather than being hidden as legacy.
    legacy['assessment']['criteria'].pop('retrieval')
    system.trials._write(legacy)
    metrics.collect(datetime.now(timezone.utc))
    assert metrics.store.get('skill_north_star_sync', 'latest')['complete'] is False

