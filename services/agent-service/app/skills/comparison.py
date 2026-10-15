"""同场景证据判断评估。使用真实模型，独立保存，不写业务轨迹或验收回执。"""
from copy import deepcopy
from datetime import datetime, timezone
from hashlib import sha256
import json
import re
from uuid import uuid4

from app.skills.loop_analytics import week_windows


CASES = (
    {'case_id': 'C01', 'expected_state': 'consistent', 'drift_label': False,
     'input': {'alarm': {'code': '700001', 'definition': '润滑压力未达到', 'found': True},
               'reference': {'metric': 'lubrication_pressure_psi', 'normal_range': [66, 74]},
               'current': {'lubrication_pressure_psi': 47}, 'history': [69, 61, 47]}},
    {'case_id': 'C02', 'expected_state': 'conflicting', 'drift_label': True,
     'input': {'alarm': {'code': '700001', 'definition': '润滑压力未达到', 'found': True},
               'reference': {'metric': 'lubrication_pressure_psi', 'normal_range': [66, 74]},
               'current': {'lubrication_pressure_psi': 69}, 'history': [69, 69, 69]}},
    {'case_id': 'C03', 'expected_state': 'missing', 'drift_label': True,
     'input': {'alarm': {'code': '700999', 'definition': '', 'found': False},
               'reference': {}, 'current': {}, 'history': []}},
    {'case_id': 'C04', 'expected_state': 'consistent', 'drift_label': False,
     'input': {'alarm': {'code': '700006', 'definition': '刀塔旋转超时', 'found': True},
               'reference': {'rotation_feedback_expected': 1, 'servo_load_normal_range': [12, 38]},
               'current': {'rotation_feedback': 0, 'servo_load': 89}, 'history': [25, 60, 89]}},
)
SUITE_HASH = sha256(json.dumps(CASES, sort_keys=True, ensure_ascii=False).encode()).hexdigest()
_STATES = {'consistent', 'conflicting', 'missing'}


def _time(value):
    try:
        result = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        return result.astimezone(timezone.utc) if result.tzinfo else None
    except (TypeError, ValueError):
        return None


def _answer_valid(answer):
    return (isinstance(answer, dict) and isinstance(answer.get('evidence_state'), str)
            and answer['evidence_state'] in _STATES
            and type(answer.get('risk_alert')) is bool and answer.get('synthetic') is False
            and isinstance(answer.get('rationale'), str) and bool(answer['rationale'].strip())
            and isinstance(answer.get('model'), str) and bool(answer['model']))


def run_comparison(baseline, current, current_revision, client, *, now=None):
    """隐藏标准答案，各版本读取完全相同输入；传输错误终止，不伪造模型失败。"""
    from app.agents.diagnosis.parsing import assistant_message, parse_final_json
    if baseline.agent != current.agent or baseline.name != current.name or not client.available:
        raise ValueError('对照技能身份或模型配置不完整')
    rows = deepcopy(list(CASES))
    for side, definition in (('old', baseline), ('new', current)):
        for row in rows:
            response = client.chat([
                {'role': 'system', 'content': '这是隔离的技能证据判断评估。严格依据下面的技能正文和样例事实。'
                 '返回 JSON：evidence_state 为 consistent（报警与当前证据一致）、conflicting（当前证据与报警矛盾）'
                 '或 missing（缺少目录定义或关键观测），risk_alert 为布尔值，rationale 为理由。'
                 '本评估的漂移风险指输入与参考依据冲突，或出现未登记报警且关键观测缺失；'
                 '正常范围内的变化或与已知故障一致的证据不算漂移。不要返回分数或验收结论。'},
                {'role': 'system', 'content': definition.document},
                {'role': 'user', 'content': json.dumps({'case_id': row['case_id'], 'input': row['input']}, ensure_ascii=False)},
            ])
            answer = parse_final_json(str(assistant_message(response).get('content') or ''))
            metadata = response.get('model_metadata') or response.get('metadata') or {}
            answer = {k: answer.get(k) for k in ('evidence_state', 'risk_alert', 'rationale')} | {
                'model': str(response.get('model') or getattr(client, 'model', '') or ''),
                'synthetic': bool(response.get('synthetic') or metadata.get('synthetic'))}
            if not _answer_valid(answer) or 'fake' in answer['model'].lower():
                raise ValueError('模型未返回可核验的真实评估答案')
            row[side] = answer
    moment = now or datetime.now(timezone.utc)
    return {'schema': 1, 'kind': 'skill_comparison', 'evaluation_id': uuid4().hex,
            'agent': current.agent, 'name': current.name, 'current_revision': current_revision,
            'old_fingerprint': baseline.observation()['skill_fingerprint'],
            'new_fingerprint': current.observation()['skill_fingerprint'],
            'old_version': baseline.version, 'new_version': current.version,
            'suite_hash': SUITE_HASH, 'completed_at': moment.isoformat(), 'cases': rows}


def _evaluation_reuse(record, current, publications, completed, now):
    """仅沿成功发布链验证同一运行定义；不修改原评估的答案、修订号或时间。"""
    revision, fingerprint, version = record['current_revision'], record['new_fingerprint'], record['new_version']
    if revision == current['revision'] and fingerprint == current['content_fingerprint']:
        return {}
    if not isinstance(current.get('version'), str) or not current['version']:
        return None
    journal = {}
    for row in publications:
        if (not isinstance(row, dict) or row.get('schema') != 1 or row.get('kind') != 'file_publication' or
                row.get('agent') != record['agent'] or row.get('name') != record['name']):
            continue
        occurred = _time(row.get('published_at'))
        if not occurred or not completed <= occurred <= now or not isinstance(row.get('edit_id'), str) or not row['edit_id']:
            continue
        if row['edit_id'] in journal and journal[row['edit_id']] != row:
            return None
        journal[row['edit_id']] = row
    used, latest, behavior = [], completed, None
    for _ in range(len(journal)):
        links = [row for identity, row in journal.items() if identity not in used and
                 row.get('old_revision') == revision and _time(row['published_at']) >= latest]
        if len(links) != 1:
            return None  # 缺链或分叉时不能猜测哪个发布对应当前内容。
        row = links[0]
        if (row.get('old_fingerprint') != fingerprint or row.get('old_version') != version or
                not all(re.fullmatch(r'[a-f0-9]{64}', str(row.get(key) or '')) for key in
                    ('old_revision','new_revision','old_fingerprint','new_fingerprint','old_behavior','new_behavior')) or
                row['old_behavior'] != row['new_behavior'] or
                (behavior is not None and row['old_behavior'] != behavior) or
                not isinstance(row.get('new_version'), str) or not row['new_version']):
            return None
        revision, fingerprint, version = row['new_revision'], row['new_fingerprint'], row['new_version']
        behavior = row['new_behavior']
        used.append(row['edit_id'])
        latest = _time(row['published_at'])
        if (revision == current['revision'] and fingerprint == current['content_fingerprint'] and
                version == current['version']):
            return {'evaluated_version':record['new_version'], 'evaluated_revision':record['current_revision'],
                    'current_version':version, 'current_revision':revision, 'publication_ids':used,
                    'reason':'发布链证明仅版本号或文件格式变化，技能正文和运行定义一致'}
    return None


def project_comparison(record, current, now, *, publications=()):
    """由原始答案重算，不读取客户端提供的百分比；只用于当前技能的本周评估。"""
    if not isinstance(record, dict):
        return None
    completed = _time(record.get('completed_at'))
    if (record.get('schema') != 1 or record.get('kind') != 'skill_comparison'
            or not re.fullmatch(r'[a-f0-9]{32}', str(record.get('evaluation_id') or ''))
            or record.get('agent') != current.get('agent') or record.get('name') != current.get('name')
            or not all(isinstance(record.get(side + '_version'), str) and record[side + '_version'].strip() for side in ('old', 'new'))
            or not re.fullmatch(r'[a-f0-9]{64}', str(current.get('revision') or ''))
            or not re.fullmatch(r'[a-f0-9]{64}', str(current.get('content_fingerprint') or ''))
            or not re.fullmatch(r'[a-f0-9]{64}', str(record.get('current_revision') or ''))
            or record.get('suite_hash') != SUITE_HASH
            or not completed or not _time(week_windows(now)['current']['start']) <= completed <= now
            or not all(re.fullmatch(r'[a-f0-9]{64}', str(record.get(side + '_fingerprint') or '')) for side in ('old', 'new'))
            or record.get('old_fingerprint') == record.get('new_fingerprint')):
        return None
    reuse = _evaluation_reuse(record, current, publications, completed, now)
    if reuse is None:
        return None
    rows = record.get('cases')
    if not isinstance(rows, list) or len(rows) != len(CASES):
        return None
    for row, reference in zip(rows, CASES):
        if not isinstance(row, dict) or any(row.get(k) != v for k, v in reference.items()):
            return None
        if not all(_answer_valid(row.get(side)) for side in ('old', 'new')):
            return None
    rates = {}
    for side in ('old', 'new'):
        successes = sum(row[side]['evidence_state'] == row['expected_state'] for row in rows)
        rates[side] = {'value': round(100 * successes / len(rows), 2), 'successes': successes,
                       'samples': len(rows), 'fingerprint': record[side + '_fingerprint']}
    positives = [row for row in rows if row['drift_label']]
    recalled = sum(row['new']['risk_alert'] for row in positives)
    common = {'source': 'paired_evaluation', 'evaluation_id': record['evaluation_id'],
              'evaluated_at': completed.isoformat()}
    if reuse:
        common['evaluation_reuse'] = reuse
    return {'weekly_gain': {**common, **rates, 'value': round(rates['new']['value'] - rates['old']['value'], 2),
                'old_version': record['old_version'], 'new_version': reuse['current_version'] if reuse else record['new_version'],
                'method': 'paired_scenario_evaluation', 'publication_revision': current['revision'],
                'message': '本周同场景证据判断通过率差值；来自真实模型评估，不是业务运行周收益'},
            'drift_recall': {**common, 'value': round(100 * recalled / len(positives), 2),
                'numerator': recalled, 'denominator': len(positives),
                'message': '标注漂移场景的模型预警召回率；不是生产失败召回率'}}
