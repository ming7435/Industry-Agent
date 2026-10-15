"""按北京时间自然周、技能身份计算成功发布次数；草稿和测试不消耗额度。"""
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import re

from app.skills.loop_analytics import week_windows

WEEKLY_UPDATE_LIMIT = 3


def _time(value):
    try:
        parsed = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        return parsed.astimezone(timezone.utc) if parsed.tzinfo else None
    except (TypeError, ValueError):
        return None


def is_update(publication):
    """版本改变或技能内容改变计一次；重复保存、纯格式变化不计次数。"""
    old, new = publication.get('old_version'), publication.get('new_version')
    return (old is not None and new is not None and str(old) != str(new) or
            bool(publication.get('old_behavior') and publication.get('new_behavior') and
                 publication['old_behavior'] != publication['new_behavior']))


def _valid_snapshot(snapshot, record):
    if not isinstance(snapshot, dict) or snapshot.get('schema') != 1 or snapshot.get('kind') != 'file_publication':
        return False
    identity = {'edit_id':'edit_id', 'agent':'agent', 'name':'skill', 'published_at':'timestamp',
                'old_revision':'old_revision', 'new_revision':'new_revision',
                'old_version':'old_version', 'new_version':'new_version'}
    if any(not isinstance(snapshot.get(key), str) or not snapshot[key] or snapshot[key] != record.get(outer)
           for key, outer in identity.items()):
        return False
    return all(isinstance(snapshot.get(key), str) and re.fullmatch(r'[0-9a-f]{64}', snapshot[key])
               for key in ('old_behavior', 'new_behavior'))


def project_update_quota(records, agent, name, now, *, complete=True):
    bounds = week_windows(now)
    start = _time(bounds['current']['start'])
    reset = start + timedelta(days=7)
    counted = {}
    for record in records:
        if not isinstance(record, dict):
            complete = False
            continue
        if record.get('event') != 'skill_updated' or record.get('agent') != agent or record.get('skill') != name:
            continue
        occurred = _time(record.get('timestamp'))
        if occurred is None:
            complete = False
            continue
        if not start <= occurred < reset or occurred > now:
            continue
        if record.get('state') == 'prepared':
            complete = False
            continue
        if record.get('state') != 'applied':
            continue
        snapshot = record.get('north_star')
        if snapshot is not None and not _valid_snapshot(snapshot, record):
            complete = False
            continue
        snapshot = record if snapshot is None else snapshot
        if is_update(snapshot):
            if not isinstance(record.get('edit_id'), str) or not record['edit_id']:
                complete = False
                continue
            counted[record['edit_id']] = {key: record.get(key) for key in ('edit_id', 'timestamp', 'old_version', 'new_version')}
        elif (snapshot is record and (not record.get('old_revision') or
                                     record.get('old_revision') != record.get('new_revision'))):
            complete = False  # 旧记录缺少内容对照，不能把未知修改认定为重复保存。
    used = len(counted)
    return {'scope': 'skill', 'agent': agent, 'name': name, 'limit': WEEKLY_UPDATE_LIMIT,
            'used': used, 'remaining': max(0, WEEKLY_UPDATE_LIMIT-used) if complete else None,
            'week_id': bounds['week_id'], 'start': start.isoformat(), 'reset_at': reset.isoformat(),
            'timezone': 'Asia/Shanghai', 'complete': complete, 'enforced': True,
            'message': '' if complete else '发布记录尚待核对，暂不能确认剩余更新次数',
            'records': list(counted.values())}


def read_update_quota(root, agent, name, now):
    directory = Path(root) / agent / name
    records, complete = [], True
    for path in directory.glob('*.json'):
        try:
            if path.is_symlink() or not path.resolve().is_relative_to(directory.resolve()):
                complete = False
                continue
            records.append(json.loads(path.read_text(encoding='utf-8')))
        except (OSError, ValueError):
            complete = False
    return project_update_quota(records, agent, name, now, complete=complete)
