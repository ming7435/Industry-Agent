"""四项指标使用真实 MySQL 与临时技能文件；样本为隔离输入，不是生产验收。"""
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from shutil import copyfile
from concurrent.futures import ThreadPoolExecutor
from threading import Event

import pytest

from test_mysql_redis_storage import mysql_config


def test_metrics_persist_deduplicate_and_restore_after_service_reconstruction(mysql_config, tmp_path, monkeypatch):
    monkeypatch.setenv('PYTHON_DOTENV_DISABLED', '1')
    monkeypatch.setenv('APP_ENV', 'testing')
    from shared.persistence import MySQLJsonStore
    from app.harness.trace import TraceRecorder
    from app.harness.trace_store import MySQLTraceStore
    from app.skills.evolution import SkillEvolution
    from app.skills.management import SkillManager
    from app.skills.registry import SkillRegistry
    from app.skills.loop_analytics import aggregate

    assert mysql_config['database'].startswith('industry_storage_test_')
    agent, name = 'diagnosis', 'alarm_diagnosis_skill'
    root = tmp_path / 'skills'
    (root / agent).mkdir(parents=True)
    copyfile(Path(__file__).parents[2] / 'services/agent-service/app/skills/diagnosis/alarm_diagnosis.md',
             root / agent / 'alarm_diagnosis.md')
    registry = SkillRegistry(root)
    trace_store = MySQLTraceStore(mysql_config)
    trace = TraceRecorder(store=trace_store)
    manager = SkillManager(registry, registry.get(agent, name).tools, trace=trace, backup_root=tmp_path / 'revisions')
    service = SkillEvolution(manager, store=MySQLJsonStore(mysql_config),
        client_factory=lambda: pytest.fail('统计不能调用收费模型'))
    actor = {'user_id': 'ISOLATED-METRIC-REVIEWER'}
    original = manager.detail(agent, name)
    old_definition = registry.get(agent, name)

    def publish(version, document, reason):
        current = manager.detail(agent, name)
        return manager.update(agent, name, {'expected_revision': current['revision'], 'version': version,
            'document': document, 'goal': original['goal'], 'reason': reason}, actor)

    def outcome(definition, number, passed, when):
        fields = {'timestamp': when.isoformat(), 'trace_id': 'ISOLATED-T-' + str(number),
            'agent_run_id': 'ISOLATED-R-' + str(number), 'agent': agent}
        trace.record(**{**fields, **definition.observation()}, event='skill_observed')
        trace.record(**fields, event='agent_completed', output={'status': 'completed',
            'stop_reason': 'validator_pass' if passed else 'validation_failed',
            'validation_errors': [] if passed else ['隔离样本校验失败']})

    try:
        publish('1.1', original['document'] + '\n隔离测试的新规则。', '隔离测试发布')
        audit = json.loads(next((manager.backup_root / agent / name).glob('*.json')).read_text(encoding='utf-8'))
        published = datetime.fromisoformat(audit['timestamp'])
        new_definition = registry.get(agent, name)
        for number in range(5):
            outcome(old_definition, number, number != 4, published - timedelta(seconds=1))
        for number in range(10, 15):
            outcome(new_definition, number, number != 14, published + timedelta(seconds=1))
        # 这是已知封闭的测试样本集合，不冒充生产日志的完整周覆盖证明。
        def health():
            return {'previous': {'complete': True, 'items': []},
                'current': {'complete': True, 'items': aggregate(trace.list(), registry, True)}}
        service.metrics.observe(health(), published + timedelta(seconds=2))
        service.metrics.observe(health(), published + timedelta(seconds=2))
        outcome(new_definition, 15, False, published + timedelta(seconds=3))

        directory = manager.backup_root / 'tests'
        directory.mkdir()
        for number in range(4):
            accepted = number != 3
            criteria = dict.fromkeys(('diagnosis', 'maintenance', 'workorder', 'report',
                'skill_used', 'baseline_unchanged', 'dependencies_unchanged'), True)
            criteria['report'] = accepted
            receipt = {'schema': 1, 'assessment_id': 'ISOLATED-G-' + str(number),
                'agent': agent, 'name': name, 'completed_at': published.isoformat(),
                'trial_fingerprint': 'c' * 64, 'accepted': accepted, 'criteria': criteria, 'basis': 'machine_flow_receipt'}
            (directory / (str(number) + '.json')).write_text(json.dumps({'mode': 'machine_flow',
                'test_id': receipt['assessment_id'], 'agent': agent, 'name': name, 'fingerprint': 'c' * 64,
                'status': 'completed' if accepted else 'failed', 'assessment': receipt}), encoding='utf-8')

        moment = published + timedelta(seconds=4)
        service.metrics.collect(moment)
        service.metrics.collect(moment)
        service.store.get_or_create('skill_loop_state', 'latest', lambda: {'observed_at': moment.isoformat(), 'health': health()})
        reopened = SkillEvolution(manager, store=MySQLJsonStore(mysql_config),
            client_factory=lambda: pytest.fail('重建统计不能调用收费模型'))
        result = reopened.loop.status(agent, name)['north_star']
        assert result['weekly_gain']['old']['value'] == 80
        assert result['weekly_gain']['new']['value'] == 66.67
        assert result['weekly_gain']['value'] == -13.33
        # 本周旧版也有一次失败，和新版两次失败合计三次；只有新版末次被提前预警。
        assert result['drift_recall']['numerator'] == 1 and result['drift_recall']['denominator'] == 3
        assert result['drift_recall']['value'] == 33.33
        assert result['gate_pass_rate']['numerator'] == 3 and result['gate_pass_rate']['denominator'] == 4
        assert result['gate_pass_rate']['value'] == 75
        assert result['rollback_rate']['value'] == 0
        alerts = reopened.store.values('skill_north_star_alerts')
        assert len(alerts) == 2
        assert {alert['fingerprint'] for alert in alerts} == {
            old_definition.observation()['skill_fingerprint'], new_definition.observation()['skill_fingerprint']}
        assert len(reopened.store.values('skill_north_star_gates')) == 4
        assert len([r for r in trace.list() if r.get('event') == 'skill_risk_alert']) == 2

        publish('1.2', original['document'], '隔离测试恢复旧行为，版本号保持向前')
        restored_at = datetime.now(timezone.utc)
        cutoff = max(restored_at, moment)
        reopened.metrics.collect(cutoff)
        restored = reopened.metrics.status(health(), agent, name, cutoff)
        assert restored['rollback_rate']['numerator'] == 1
        assert restored['rollback_rate']['denominator'] == 2
        assert restored['rollback_rate']['value'] == 50
        assert restored['weekly_gain']['value'] is None
    finally:
        trace_store.close()


def test_pending_producer_has_no_open_transaction_in_the_isolated_database(mysql_config):
    """直接核对事务事实；不替代或放宽原有一秒写入性能测试。"""
    from shared.persistence import MySQLJsonStore, mysql_session
    store = MySQLJsonStore(mysql_config)
    entered, release = Event(), Event()
    def producer():
        entered.set()
        assert release.wait(30), '测试未完成事务观测'
        return {'completed': True}
    with ThreadPoolExecutor(1) as executor:
        task = executor.submit(store.get_or_create, 'isolated_metric_transaction', 'pending', producer)
        try:
            assert entered.wait(10)
            with mysql_session(mysql_config) as connection:
                cursor = connection.cursor()
                cursor.execute('SELECT COUNT(*) FROM information_schema.innodb_trx t '
                    'JOIN information_schema.processlist p ON p.ID=t.trx_mysql_thread_id WHERE p.DB=%s',
                    (mysql_config['database'],))
                assert cursor.fetchone()[0] == 0
                cursor.close()
        finally:
            release.set()
        assert task.result(timeout=10) == {'completed': True}
