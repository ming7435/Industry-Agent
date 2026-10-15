"""每个技能独立计算每周三次正式更新，发布文件与额度检查在同一锁内。"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path

import pytest

from app.skills.management import SkillEditError, SkillManager
from app.skills.registry import SkillRegistry
from test_skill_evolution import manager

AGENT, NAME = 'diagnosis', 'alarm_diagnosis_skill'
ACTOR = {'user_id': 'U-QUOTA', 'role': 'technician'}


def update(manager, name=NAME):
    current = manager.detail(AGENT, name)
    parts = current['version'].split('.')
    parts[-1] = str(int(parts[-1]) + 1)
    return manager.update(AGENT, name, {'expected_revision': current['revision'],
        'version': '.'.join(parts), 'goal': current['goal'], 'document': current['document'],
        'reason': '测试本技能版本发布次数'}, ACTOR)


def test_fourth_update_is_rejected_before_file_or_audit_changes(manager):
    assert manager.detail(AGENT, NAME)['update_quota']['remaining'] == 3
    for count in range(1, 4):
        saved = update(manager)
        assert saved['update_quota']['used'] == count
        assert saved['update_quota']['remaining'] == 3-count
    before = Path(manager.registry.get(AGENT, NAME).path).read_bytes()
    audits = list(manager.backup_root.rglob('*.json'))
    with pytest.raises(SkillEditError, match='每周.*3.*上限') as error:
        update(manager)
    assert error.value.status == 409
    assert Path(manager.registry.get(AGENT, NAME).path).read_bytes() == before
    assert list(manager.backup_root.rglob('*.json')) == audits


def test_each_skill_has_its_own_three_updates(manager):
    original = Path(manager.registry.get(AGENT, NAME).path)
    other = original.with_name('other_alarm.md')
    other.write_text(original.read_text(encoding='utf-8').replace('name: '+NAME, 'name: other_alarm'), encoding='utf-8')
    for _ in range(3):
        update(manager)
    assert manager.detail(AGENT, 'other_alarm')['update_quota']['used'] == 0
    for _ in range(3):
        update(manager, 'other_alarm')
    assert manager.detail(AGENT, 'other_alarm')['update_quota']['used'] == 3


def test_duplicate_save_and_aborted_publication_do_not_consume_updates(manager):
    saved = update(manager)
    unchanged = manager.update(AGENT, NAME, {'expected_revision': saved['revision'],
        'version': saved['version'], 'goal': saved['goal'], 'document': saved['document'],
        'reason': '重复保存'}, ACTOR)
    assert unchanged['update_quota']['used'] == 1
    directory = manager.backup_root / AGENT / NAME
    (directory/'aborted.json').write_text(json.dumps({'event':'skill_updated', 'state':'aborted',
        'agent':AGENT, 'skill':NAME, 'timestamp':datetime.now(timezone.utc).isoformat()}), encoding='utf-8')
    assert manager.detail(AGENT, NAME)['update_quota']['used'] == 1


def test_quota_resets_at_monday_midnight_in_china():
    from app.skills.update_quota import project_update_quota
    record = {'event':'skill_updated','state':'applied','agent':AGENT,'skill':NAME,'edit_id':'P',
        'old_version':'1.0','new_version':'1.1','timestamp':'2026-10-11T15:59:59+00:00'}
    before = project_update_quota([record], AGENT, NAME, datetime(2026,10,11,15,59,59,tzinfo=timezone.utc))
    after = project_update_quota([record], AGENT, NAME, datetime(2026,10,11,16,tzinfo=timezone.utc))
    assert before['used'] == 1 and after['used'] == 0
    assert after['reset_at'] == '2026-10-18T16:00:00+00:00'


def test_two_managers_cannot_both_take_the_last_update(manager):
    update(manager)
    update(manager)
    services = [SkillManager(SkillRegistry(manager.registry.root), manager.available_tools,
                            backup_root=manager.backup_root) for _ in range(2)]
    def attempt(service):
        for _ in range(3):
            try:
                update(service)
                return 'published'
            except SkillEditError as error:
                if '上限' in str(error):
                    return 'quota'
                if '其它修改' not in str(error):
                    raise
        pytest.fail('版本冲突后仍无法核对额度')
    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(attempt, services))
    assert sorted(outcomes) == ['published', 'quota']
    assert manager.detail(AGENT, NAME)['update_quota']['used'] == 3


@pytest.mark.parametrize('state,snapshot', [('prepared',{}), ('applied','broken'), ('applied',{'schema':1})])
def test_unreconciled_audit_does_not_invent_remaining_updates(manager, state, snapshot):
    directory = manager.backup_root / AGENT / NAME
    directory.mkdir(parents=True)
    (directory/'uncertain.json').write_text(json.dumps({'event':'skill_updated','state':state,
        'agent':AGENT,'skill':NAME,'timestamp':datetime.now(timezone.utc).isoformat(),
        'north_star':snapshot}),encoding='utf-8')
    quota = manager.detail(AGENT, NAME)['update_quota']
    assert quota['complete'] is False and quota['remaining'] is None
    with pytest.raises(SkillEditError,match='核对'):
        update(manager)


@pytest.mark.parametrize('field,value', [('name','another_skill'), ('old_version','9.0'),
    ('old_behavior',''), ('new_revision','wrong-revision')])
def test_inconsistent_publication_snapshot_blocks_further_updates(manager, field, value):
    saved = update(manager)
    path = manager.backup_root / AGENT / NAME / (saved['edit_id'] + '.json')
    audit = json.loads(path.read_text(encoding='utf-8'))
    audit['north_star'][field] = value
    path.write_text(json.dumps(audit), encoding='utf-8')
    quota = manager.detail(AGENT, NAME)['update_quota']
    assert quota['complete'] is False and quota['remaining'] is None
    with pytest.raises(SkillEditError, match='核对'):
        update(manager)
