"""自动修改稿必须来自真实日志，确认、验证、发布严格分阶段。"""
import json
from threading import Lock
from copy import deepcopy
from pathlib import Path
from shutil import copytree
import re
from types import SimpleNamespace
from contextlib import contextmanager

import pytest

from app.harness.trace import TraceRecorder
from app.skills.management import SkillManager, SkillEditError
from app.skills.registry import SkillRegistry
from app.tools.registry import ToolRegistry


@pytest.fixture
def manager(tmp_path):
    root = tmp_path / 'skills'
    (root / 'diagnosis').mkdir(parents=True)
    source = Path(__file__).parents[1] / 'app/skills/diagnosis/alarm_diagnosis_skill'
    copytree(source, root / 'diagnosis/alarm_diagnosis_skill')
    # 发布测试使用固定起点，不能随工作区正在使用的技能版本变化。
    baseline = root / 'diagnosis/alarm_diagnosis_skill/SKILL.md'
    baseline.write_text(re.sub(r'^version:.*$', "version: '1.0'", baseline.read_text(encoding='utf-8'), count=1, flags=re.M), encoding='utf-8')
    return SkillManager(SkillRegistry(root), ToolRegistry().definitions, trace=TraceRecorder(),
                        backup_root=tmp_path / 'revisions')


def test_directory_skill_detail_lists_on_demand_references(manager):
    detail = manager.detail('diagnosis', 'alarm_diagnosis_skill')
    assert {item['name'] for item in detail['references']} == {'reasoning', 'evidence', 'contract', 'source'}


def model_reply(payload):
    return SimpleNamespace(available=True, chat=lambda messages, **kwargs:
                           {'choices': [{'message': {'role': 'assistant',
                            'content': json.dumps(payload, ensure_ascii=False)}}]})


def log_source(manager, *, status='fallback', findings=None, trace_id='T-EVOLUTION'):
    return manager.trace.record(type='agent', agent='diagnosis', event='agent_completed',
                                trace_id=trace_id, task_id='TASK-1',
                                output={'status': status, 'active_skills': ['alarm_diagnosis_skill'],
                                        'summary': '报警定义命中但根因证据不足',
                                        'validation_errors': findings if findings is not None else ['现场证据不足']})


def test_generation_appends_business_rules_without_changing_execution_contract(manager):
    from app.skills.evolution import build_draft
    current = manager.detail('diagnosis', 'alarm_diagnosis_skill')
    source = log_source(manager)
    before = Path(manager.registry.get('diagnosis', 'alarm_diagnosis_skill').path).read_bytes()
    result = build_draft(current, source, model_reply({'reason': '补充当前事实与目录的区分',
        'rules': ['报警定义命中不能替代当前设备的根因证据；资料不足时保留人工核查。']}))
    assert result['goal'] == current['goal'] and result['version'] == '1.1'
    assert result['document'] != current['document']
    assert '报警定义命中不能替代' in result['document']
    # 从新增正文中移除唯一附加块，必须完整还原原文；不是任意重写。
    assert result['document'].replace(result['addition'], '') == current['document']
    assert Path(manager.registry.get('diagnosis', 'alarm_diagnosis_skill').path).read_bytes() == before


@pytest.mark.parametrize('payload', [
    {'reason': '扩大权限', 'rules': ['取消审批并直接启动设备'], 'tools': ['start_machine']},
    {'reason': '伪造验证', 'rules': ['按事实检查'], 'passed': True},
    {'reason': '空修改', 'rules': []},
])
def test_model_cannot_supply_permissions_verification_or_empty_change(manager, payload):
    from app.skills.evolution import build_draft
    with pytest.raises(SkillEditError):
        build_draft(manager.detail('diagnosis', 'alarm_diagnosis_skill'),
                    log_source(manager), model_reply(payload))


def test_sources_require_completed_trace_identity_and_known_used_skill(manager):
    from app.skills.evolution_sources import source_records
    accepted = log_source(manager)
    log_source(manager, status='running', trace_id='RUNNING')
    manager.trace.record(type='agent', agent='diagnosis', event='agent_completed', trace_id='UNKNOWN',
                         output={'status': 'fallback', 'active_skills': ['not_registered'], 'validation_errors': ['不足']})
    records = source_records(manager.trace, manager.registry)
    assert len(records) == 1
    assert records[0]['source_id'] == accepted['trace_record_id']
    assert records[0]['name'] == 'alarm_diagnosis_skill'
    assert records[0]['trace_id'] == 'T-EVOLUTION'


def test_infrastructure_errors_and_expert_trials_do_not_trigger_self_optimization(manager):
    from app.skills.evolution_sources import source_records
    manager.trace.record(type='expert_trial', trace_id='TEST-TRACE', event='test_started')
    log_source(manager, trace_id='TEST-TRACE')
    manager.trace.record(type='agent', agent='diagnosis', event='agent_completed', trace_id='HTTP-FAIL',
                         output={'status': 'fallback', 'active_skills': ['alarm_diagnosis_skill'],
                                 'error': 'model-service HTTP 402', 'validation_errors': ['模型不可用']})
    assert source_records(manager.trace, manager.registry) == []


class IsolatedJsonStore:
    """测试专用CAS适配器，无数据库、生产路径或模型配置。"""
    def __init__(self):
        self.records, self.lock = {}, Lock()

    def get(self, namespace, key):
        with self.lock:
            return deepcopy(self.records.get((namespace, key)))

    def values(self, namespace, limit=1000):
        with self.lock:
            return deepcopy([v for (ns, _), v in self.records.items() if ns == namespace][-limit:])

    def get_or_create(self, namespace, key, producer):
        with self.lock:
            if (namespace, key) not in self.records:
                self.records[namespace, key] = producer()
            return deepcopy(self.records[namespace, key])

    def compare_and_set(self, namespace, key, field, expected, values):
        with self.lock:
            record = self.records.get((namespace, key))
            if record is None or record.get(field) != expected:
                return None
            record.update(deepcopy(values))
            return deepcopy(record)

    def publication_fence(self, expected, audit):
        # 只替换数据库传输，使用真实EvolutionStore栅栏而非复制被测判断。
        from app.skills.evolution_store import EvolutionStore
        adapter = EvolutionStore()
        adapter._store = self
        return adapter.publication_fence(expected, audit)

    def _identity(self, namespace, key):
        return namespace, key, key

    @contextmanager
    def _session(self):
        from shared.persistence import _encode
        store = self
        class Cursor:
            def execute(self, sql, params):
                assert 'FOR UPDATE' in sql
                self.identity = params
            def fetchone(self):
                current = store.records.get(tuple(self.identity))
                return {'payload': _encode(current)} if current else None
        with self.lock:
            yield Cursor()

    def _write(self, cursor, namespace, key, value):
        self.records[(namespace, key)] = deepcopy(value)
        return value


ACTOR = {'user_id': 'U-EVOLUTION', 'role': 'technician'}
MACHINE = {'device_id': 'D-EXAMPLE', 'scenario_id': 'turret', 'expected': '保持不确定性并完成受控闭环'}


@pytest.fixture
def evolution(manager):
    return lambda: make_evolution(manager)


def make_evolution(manager):
    from app.skills.evolution import SkillEvolution
    from app.skills.machine_testing import MachineTrials
    from app.skills.testing import fingerprint
    from datetime import datetime, timezone
    from time import time
    # 仅模拟机器执行传输边界替换；真实发布validate_publish及文件备份原子替换保留。
    trials = MachineTrials(manager, SimpleNamespace(container=SimpleNamespace()))
    def start_machine(agent, name, values, actor):
        record = {'test_id': 'f' * 32, 'actor_id': actor['user_id'], 'agent': agent, 'name': name,
                  'fingerprint': fingerprint(values), 'dependencies': trials._dependencies(),
                  'status': 'running', 'mode': 'machine_flow', 'created_epoch': time(),
                  'created_at': datetime.now(timezone.utc).isoformat(), 'result': None}
        trials._write(record)
        return trials._public(record)
    trials.start_machine = start_machine
    trials.get = lambda test_id, actor: trials._public(trials._read(test_id, actor))
    manager.trials = trials
    store = IsolatedJsonStore()
    service = SkillEvolution(manager, store=store, client_factory=lambda: model_reply(
        {'reason': '补充证据门禁', 'rules': ['必须分别记录报警含义与当前观测事实，不足时列出待核查项。']}))
    log_source(manager)
    candidate = service.scan_once()
    return SimpleNamespace(service=service, manager=manager, store=store, candidate=candidate, trials=trials)


def confirm(evolution, *, actor=ACTOR, resolver=None, digest=None):
    c = evolution.candidate
    return evolution.service.confirm(c['proposal_id'], digest or c['candidate_hash'], MACHINE, actor,
                                      resolver or (lambda: actor))


def finish_trial(evolution, status='completed'):
    from datetime import datetime, timezone
    record = evolution.trials._read('f' * 32, ACTOR)
    record.update(status=status)
    # 此夹具替代机器传输，返回完整的外部验收契约；发布门禁仍执行真实代码。
    record['assessment'] = {'schema': 1, 'revision': 1, 'assessment_id': record['test_id'],
        'agent': record['agent'], 'name': record['name'], 'trial_fingerprint': record['fingerprint'],
        'completed_at': datetime.now(timezone.utc).isoformat(), 'basis': 'machine_flow_receipt',
        'accepted': status == 'completed', 'criteria': {
            'diagnosis': True, 'maintenance': True, 'workorder': status == 'completed', 'report': status == 'completed',
            'skill_used': True, 'baseline_unchanged': True, 'dependencies_unchanged': True}}
    evolution.trials._write(record)


def publish_evolution(evolution):
    return evolution.service.publish(evolution.candidate['proposal_id'], evolution.candidate['candidate_hash'],
                                     ACTOR, lambda: ACTOR)


def test_validation_is_impossible_before_human_confirmation(evolution):
    evolution = evolution()
    before = evolution.manager.detail('diagnosis', 'alarm_diagnosis_skill')
    result = evolution.service.advance(evolution.candidate['proposal_id'])
    assert result['status'] == 'awaiting_confirmation'
    assert not (evolution.manager.backup_root / 'tests').exists()
    assert evolution.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == before['revision']


def test_confirmation_precedes_validation_and_only_verified_draft_is_published(evolution):
    evolution = evolution()
    confirmed = confirm(evolution)
    assert confirmed['status'] == 'confirmed' and confirmed['confirmed_by'] == ACTOR['user_id']
    assert not (evolution.manager.backup_root / 'tests').exists()
    verifying = evolution.service.advance(confirmed['proposal_id'])
    assert verifying['status'] == 'verifying'
    assert evolution.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == evolution.candidate['base_revision']
    finish_trial(evolution)
    assert evolution.service.advance(confirmed['proposal_id'])['status'] == 'awaiting_publication'
    published = publish_evolution(evolution)
    assert published['status'] == 'published' and published['edit_id']
    current = evolution.manager.detail('diagnosis', 'alarm_diagnosis_skill')
    assert current['document'] == evolution.candidate['draft']['document']
    assert current['tools'] == evolution.candidate['protected_tools']
    assert current['version'] == '1.1'
    assert published['history'].index('confirmed') < published['history'].index('verifying') < published['history'].index('published')


def test_wrong_hash_or_changed_baseline_cannot_be_confirmed(evolution):
    evolution = evolution()
    with pytest.raises(SkillEditError):
        confirm(evolution, digest='0' * 64)
    path = Path(evolution.manager.registry.get('diagnosis', 'alarm_diagnosis_skill').path)
    path.write_text(path.read_text(encoding='utf-8') + '\n额外现场规则\n', encoding='utf-8')
    with pytest.raises(SkillEditError):
        confirm(evolution)
    assert not (evolution.manager.backup_root / 'tests').exists()


def test_repeated_confirmation_and_validation_do_not_start_another_trial(evolution):
    evolution = evolution()
    first = confirm(evolution)
    second = confirm(evolution)
    assert second['confirmation_id'] == first['confirmation_id']
    evolution.service.advance(first['proposal_id'])
    evolution.service.advance(first['proposal_id'])
    assert len(list((evolution.manager.backup_root / 'tests').glob('*.json'))) == 1
    assert evolution.service.get(first['proposal_id'])['status'] == 'verifying'


@pytest.mark.parametrize('condition', ['failed', 'revoked', 'changed_baseline'])
def test_failed_verification_or_invalid_authority_retains_old_skill(evolution, condition):
    evolution = evolution()
    actor = dict(ACTOR)
    confirm(evolution, resolver=lambda: actor if actor else None)
    evolution.service.advance(evolution.candidate['proposal_id'])
    old = evolution.manager.detail('diagnosis', 'alarm_diagnosis_skill')
    finish_trial(evolution, 'failed' if condition == 'failed' else 'completed')
    if condition == 'revoked':
        actor.clear()
    elif condition == 'changed_baseline':
        path = Path(evolution.manager.registry.get('diagnosis', 'alarm_diagnosis_skill').path)
        path.write_text(path.read_text(encoding='utf-8') + '\n并发专家修改\n', encoding='utf-8')
        old = evolution.manager.detail('diagnosis', 'alarm_diagnosis_skill')
    result = evolution.service.advance(evolution.candidate['proposal_id'])
    assert result['status'] in {'verification_failed', 'stale'}
    assert evolution.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == old['revision']


def test_scan_is_idempotent_and_never_reuses_old_trace_after_publication(evolution):
    evolution = evolution()
    assert evolution.service.scan_once() is None
    confirm(evolution)
    evolution.service.advance(evolution.candidate['proposal_id'])
    finish_trial(evolution)
    evolution.service.advance(evolution.candidate['proposal_id'])
    publish_evolution(evolution)
    assert evolution.service.scan_once() is None
    assert len(evolution.service.list()) == 1


def test_restart_does_not_resume_unconfirmed_authority_or_replay_machine_fault(evolution):
    evolution = evolution()
    from app.skills.evolution import SkillEvolution
    confirm(evolution)
    evolution.service.advance(evolution.candidate['proposal_id'])
    restarted = SkillEvolution(evolution.manager, store=evolution.store)
    # 其它工作进程的有效租约先只读等待，不凭实例号误判它已重启。
    assert restarted.advance(evolution.candidate['proposal_id'])['status'] == 'verifying'
    current = evolution.service.get(evolution.candidate['proposal_id'])
    evolution.store.compare_and_set('skill_evolution', current['proposal_id'], 'revision', current['revision'],
                                    {'lease_until': 0})
    record = restarted.advance(evolution.candidate['proposal_id'])
    assert record['status'] == 'verification_failed'
    assert '重启' in record['message']


def test_active_other_worker_cannot_change_inflight_publish(evolution):
    evolution = evolution()
    from app.skills.evolution import SkillEvolution
    confirm(evolution)
    current = evolution.service.get(evolution.candidate['proposal_id'])
    evolution.store.compare_and_set('skill_evolution', current['proposal_id'], 'revision', current['revision'],
                                    {'status': 'publishing'})
    other = SkillEvolution(evolution.manager, store=evolution.store)
    assert other.advance(current['proposal_id'])['status'] == 'publishing'


def test_background_worker_advances_only_confirmed_candidate(evolution):
    evolution = evolution()
    from app.skills.evolution_worker import EvolutionWorker
    worker = EvolutionWorker(evolution.service, enabled=True)
    worker.tick()
    assert evolution.service.get(evolution.candidate['proposal_id'])['status'] == 'awaiting_confirmation'
    confirm(evolution)
    worker.tick()
    assert evolution.service.get(evolution.candidate['proposal_id'])['status'] == 'verifying'
    finish_trial(evolution)
    worker.tick()
    assert evolution.service.get(evolution.candidate['proposal_id'])['status'] == 'awaiting_publication'
    assert evolution.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == evolution.candidate['base_revision']
    assert publish_evolution(evolution)['status'] == 'published'


def test_lost_publication_lease_cannot_replace_the_live_skill(evolution):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Event
    from app.skills.evolution import SkillEvolution
    e = evolution()
    blocked, release = Event(), Event()
    def actor():
        if e.service.get(e.candidate['proposal_id'])['status'] == 'publishing':
            blocked.set()
            assert release.wait(10)
        return ACTOR
    confirm(e, resolver=actor)
    e.service.advance(e.candidate['proposal_id'])
    finish_trial(e)
    assert e.service.advance(e.candidate['proposal_id'])['status'] == 'awaiting_publication'
    before = e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision']
    other = SkillEvolution(e.manager, store=e.store)
    with ThreadPoolExecutor(max_workers=1) as pool:
        pending = pool.submit(e.service.publish, e.candidate['proposal_id'], e.candidate['candidate_hash'], ACTOR, actor)
        try:
            assert blocked.wait(5)
            current = e.service.get(e.candidate['proposal_id'])
            e.store.compare_and_set('skill_evolution', current['proposal_id'], 'revision', current['revision'],
                                    {'lease_until': 0})
            assert other.advance(current['proposal_id'])['status'] == 'outcome_unknown'
        finally:
            release.set()
        try:
            pending.result(timeout=10)
        except SkillEditError:
            pass
    assert e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == before
    assert e.service.get(e.candidate['proposal_id'])['status'] == 'outcome_unknown'


def test_expired_generation_recovers_without_repeating_model_call(evolution):
    from app.skills.evolution import SkillEvolution
    from app.skills.evolution_worker import EvolutionWorker
    e = evolution()
    c = e.service.get(e.candidate['proposal_id'])
    e.store.compare_and_set('skill_evolution', c['proposal_id'], 'revision', c['revision'],
                           {'status': 'generating', 'lease_until': 0, 'draft': None})
    other = SkillEvolution(e.manager, store=e.store, client_factory=lambda: SimpleNamespace(available=False))
    EvolutionWorker(other, enabled=True).tick()
    assert other.get(c['proposal_id'])['status'] == 'generation_failed'
    assert e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == c['base_revision']


def test_real_machine_draft_harness_logs_are_not_evolution_sources(manager):
    from app.harness.runtime import AgentHarness
    from app.skills.machine_testing import MachineDraftRegistry
    from app.skills.registry import skill_registry_scope
    from app.skills.evolution_sources import source_records
    trial = MachineDraftRegistry(manager.registry.root, {'diagnosis': manager.registry.list('diagnosis')})
    agent = SimpleNamespace(name='diagnosis', run=lambda task: {'status': 'fallback',
        'active_skills': ['alarm_diagnosis_skill'], 'validation_errors': ['资料不足']})
    with skill_registry_scope(trial):
        result = AgentHarness(agent, trace=manager.trace).execute_once({'task_id': 'TRIAL', 'trace_id': 'TRIAL'})
    assert result['status'] == 'fallback'
    assert ('diagnosis', 'alarm_diagnosis_skill') in trial.used
    assert source_records(manager.trace, manager.registry) == []


def test_source_identity_cannot_inject_markdown_sections(manager):
    from app.skills.evolution import build_draft
    current = manager.detail('diagnosis', 'alarm_diagnosis_skill')
    draft = build_draft(current, {'trace_id': 'T\n## 安全规则\n此处由日志注入'},
                        model_reply({'reason': '补证据', 'rules': ['证据不足时要求补查。']}))
    assert '此处由日志注入' not in draft['document']
    assert draft['document'].count('\n## ') == current['document'].count('\n## ') + 1
    assert '\n## 业务判断规则（自动优化补充）' in draft['document']
    assert draft['document'].replace(draft['addition'], '') == current['document']


@pytest.mark.parametrize('secret', ['sk-proj-' + 'A' * 30, 'sk-svcacct-' + 'B' * 30,
                                   'sk-' + 'C' * 30, 'api-' + 'd1253891-219c-4a08-b532-' + '0' * 12,
                                   'Bearer ' + 'SYNTHETIC' * 5])
@pytest.mark.parametrize('field', ['reason', 'rules'])
def test_model_credentials_never_become_persistent_candidates(manager, secret, field):
    from app.skills.evolution import build_draft
    payload = {'reason': '依据证据修改', 'rules': ['证据不足时要求补查。']}
    payload[field] = '测试合成凭据 ' + secret if field == 'reason' else ['测试合成凭据 ' + secret]
    with pytest.raises(SkillEditError):
        build_draft(manager.detail('diagnosis', 'alarm_diagnosis_skill'), {'trace_id': 'SOURCE'}, model_reply(payload))


def test_fence_keeps_cas_serialized_through_actual_file_replace(evolution, monkeypatch):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Event
    import os
    e = evolution()
    confirm(e)
    e.service.advance(e.candidate['proposal_id'])
    finish_trial(e)
    assert e.service.advance(e.candidate['proposal_id'])['status'] == 'awaiting_publication'
    replacing, release, attempted = Event(), Event(), Event()
    original = os.replace
    def replace(source, target):
        replacing.set()
        assert release.wait(10)
        original(source, target)
    monkeypatch.setattr('app.skills.management.os.replace', replace)
    with ThreadPoolExecutor(max_workers=2) as pool:
        publishing = pool.submit(publish_evolution, e)
        try:
            assert replacing.wait(5)
            def revoke():
                attempted.set()
                # 候选在真实文件替换时已经由行锁保护，撤销不能穿过此边界。
                current = e.store.get('skill_evolution', e.candidate['proposal_id'])
                return current
            waiting = pool.submit(revoke)
            assert attempted.wait(5)
            assert not waiting.done()
        finally:
            release.set()
        assert publishing.result(timeout=10)['status'] == 'published'
        assert waiting.result(timeout=10)['publish_applied']['edit_id']


def test_lost_final_state_receipt_reconciles_without_second_file_publish(evolution):
    e = evolution()
    confirm(e)
    e.service.advance(e.candidate['proposal_id'])
    finish_trial(e)
    assert e.service.advance(e.candidate['proposal_id'])['status'] == 'awaiting_publication'
    original = e.store.compare_and_set
    failed = []
    def cas(ns, key, field, expected, changes):
        if changes.get('status') == 'published' and not failed:
            failed.append(True)
            raise RuntimeError('模拟发布状态回执丢失')
        return original(ns, key, field, expected, changes)
    e.store.compare_and_set = cas
    with pytest.raises(RuntimeError):
        publish_evolution(e)
    applied = e.manager.detail('diagnosis', 'alarm_diagnosis_skill')
    assert applied['document'] == e.candidate['draft']['document']
    assert e.service.get(e.candidate['proposal_id'])['status'] == 'publishing'
    assert e.service.advance(e.candidate['proposal_id'])['status'] == 'published'
    assert e.manager.detail('diagnosis', 'alarm_diagnosis_skill')['revision'] == applied['revision']
    directory = e.manager.backup_root / 'diagnosis/alarm_diagnosis_skill'
    assert len(list(directory.glob('*.md'))) == 1


def test_supervisor_is_read_only_for_automatic_draft_review(evolution):
    e = evolution()
    with pytest.raises(SkillEditError) as caught:
        e.service.reject(e.candidate['proposal_id'], e.candidate['candidate_hash'],
                         {'user_id': 'U-BOSS', 'role': 'supervisor'})
    assert caught.value.status == 403
    assert e.service.get(e.candidate['proposal_id'])['status'] == 'awaiting_confirmation'
