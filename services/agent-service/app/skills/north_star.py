"""北极星指标的真实记录投影；不授权发布、不控制设备、不把观测差值当因果收益。"""
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from itertools import chain, islice
import json
import re
from pathlib import Path
from uuid import uuid4

from app.skills.loop_analytics import week_windows


def _time(value):
    try:
        result = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        return result.astimezone(timezone.utc) if result.tzinfo else None
    except (ValueError, TypeError):
        return None


def _hash(value):
    return bool(re.fullmatch(r'[a-f0-9]{64}', str(value or '')))


def _legacy_knowledge_assessment(payload):
    return (isinstance(payload, dict) and payload.get('basis') == 'knowledge_flow_receipt'
            and isinstance(payload.get('criteria'), dict) and 'query_relevance' not in payload['criteria'])


def _final_assessment(payload):
    return payload.get('trial_status', 'completed') in {'completed', 'failed'}


def _unique(records, key, agent, name):
    return {r[key]: r for r in records if isinstance(r, dict) and r.get('schema') == 1 and
            r.get(key) and r.get('agent') == agent and r.get('name') == name}.values()


def _rate(numerator, denominator, message='没有适用样本，暂不计算'):
    return {'numerator': numerator, 'denominator': denominator,
            'value': round(100 * numerator / denominator, 2) if denominator else None,
            'message': '' if denominator else message}


def _events(health, keys, agent, name):
    events, complete = {}, True
    for key in keys:
        window = (health or {}).get(key) or {}
        complete = complete and bool(window.get('complete'))
        for row in window.get('items', []):
            if row.get('agent') != agent or row.get('name') != name:
                continue
            complete = complete and bool(row.get('outcomes_complete'))
            if row.get('version') == 'unknown' or not _hash(row.get('fingerprint')):
                continue
            for event in row.get('outcome_events', []):
                timestamp = _time(event.get('timestamp'))
                if timestamp and event.get('id'):
                    events[(row['fingerprint'], event['id'])] = {
                        **event, 'time': timestamp, 'fingerprint': row['fingerprint']}
                else:
                    complete = False
    return list(events.values()), complete


def project_metrics(health, alerts, gates, publications, agent, name, as_of, *, journals_complete=True):
    """按内容指纹和可信时间计算四指标；零分母、截断或无对照时返回明确缺项。"""
    bounds = week_windows(as_of)['current']
    start, end = _time(bounds['start']), as_of.astimezone(timezone.utc)
    releases = [r for r in _unique(publications, 'edit_id', agent, name) if
                r.get('kind') == 'file_publication' and _time(r.get('published_at')) and
                _time(r['published_at']) <= end and all(_hash(r.get(k)) for k in
                ('old_revision', 'new_revision', 'old_fingerprint', 'new_fingerprint', 'old_behavior', 'new_behavior'))]
    releases.sort(key=lambda r: (_time(r['published_at']), r['edit_id']))
    events, observations_complete = _events(health, ('previous', 'current'), agent, name)
    gain = {'value': None, 'old': _rate(0, 0), 'new': _rate(0, 0), 'method': 'observational',
            'message': '尚无发布后新旧版本的有效运行对照'}
    if releases:
        release = releases[-1]
        latest_revision = release['new_revision']
        # 无内容变化的重发不能覆盖上一轮真实版本对照；只沿连续发布链回溯。
        for earlier in reversed(releases[:-1]):
            if (release['old_fingerprint'] != release['new_fingerprint'] or
                    earlier['new_revision'] != release['old_revision'] or
                    earlier['new_fingerprint'] != release['old_fingerprint']):
                break
            release = earlier
        published = _time(release['published_at'])
        gain.update(publication_id=release['edit_id'], old_version=release.get('old_version'),
                    new_version=release.get('new_version'), publication_revision=latest_revision)
        for side in ('old', 'new'):
            selected = [r for r in events if r['fingerprint'] == release[side + '_fingerprint'] and
                        r['time'] <= end and (r['time'] < published if side == 'old' else r['time'] >= published)]
            applicable = [r for r in selected if r['verdict'] in {'pass', 'fail', 'degraded'}]
            gain[side] = {**_rate(sum(r['verdict'] == 'pass' for r in applicable), len(applicable)),
                          'successes': sum(r['verdict'] == 'pass' for r in applicable), 'samples': len(applicable),
                          'fingerprint': release[side + '_fingerprint'], 'excluded': len(selected) - len(applicable)}
        if release['old_fingerprint'] == release['new_fingerprint']:
            gain['message'] = '发布没有改变技能内容，不能计算优化收益'
        else:
            missing = [f'缺少{label}有效运行样本' for side, label in (('old', '旧版'), ('new', '新版'))
                       if gain[side]['value'] is None]
            if not observations_complete:
                missing.append('版本运行窗口不完整')
            if not journals_complete:
                missing.append('发布记录未同步完整')
            if missing:
                gain['message'] = '；'.join(missing) + '，暂不计算周收益'
            else:
                gain.update(value=round(100 * (gain['new']['successes'] / gain['new']['samples'] -
                                              gain['old']['successes'] / gain['old']['samples']), 2),
                            message='实际版本成功率差值；不同运行样本的观测比较，不是同场景因果实验')

    current, current_complete = _events(health, ('current',), agent, name)
    failures = [r for r in current if r['verdict'] == 'fail' and start <= r['time'] <= end]
    applicable_alerts = [r for r in _unique(alerts, 'alert_id', agent, name) if
                         _time(r.get('created_at')) and _time(r.get('expires_at')) and _hash(r.get('fingerprint'))]
    covered = sum(any(a['fingerprint'] == f['fingerprint'] and
                      _time(a['created_at']) < f['time'] < _time(a['expires_at']) for a in applicable_alerts)
                  for f in failures)
    recall = _rate(covered, len(failures), '本周没有实际业务校验失败，暂不计算召回率')
    if not current_complete or not journals_complete:
        recall.update(value=None, message='失败事件或预警记录不完整，不能计算召回率')

    completed = [r for r in _unique(gates, 'assessment_id', agent, name) if
                 _final_assessment(r) and not _legacy_knowledge_assessment(r) and type(r.get('accepted')) is bool and _time(r.get('completed_at')) and
                 start <= _time(r['completed_at']) <= end]
    gate = _rate(sum(r['accepted'] for r in completed), len(completed), '本周尚无已完成的真实验收')
    gate['records'] = [{key: r.get(key) for key in ('assessment_id', 'accepted', 'revision', 'completed_at')} | {
        'checks_passed': sum(value is True for value in (r.get('criteria') or {}).values()),
        'checks_total': sum(type(value) is bool for value in (r.get('criteria') or {}).values())}
        for r in sorted(completed, key=lambda r: (_time(r['completed_at']), r['assessment_id']), reverse=True)[:20]]
    if not journals_complete:
        gate.update(value=None, message='验收记录尚未同步完整')

    # 正式版本发布包括版本号变化；重复保存不占分母，回滚必须有连续发布链上的恢复依据。
    from app.skills.update_quota import is_update
    rolled_back, previous, active_release, known_behaviors, known_fingerprints = set(), None, None, set(), set()
    for release in releases:
        if previous and (release['old_revision'] != previous['new_revision'] or
                         release['old_behavior'] != previous['new_behavior']):
            active_release, known_behaviors, known_fingerprints = None, set(), set()
        if is_update(release):
            restored_behavior = (release['new_behavior'] != release['old_behavior'] and
                                 release['new_behavior'] in known_behaviors)
            restored_version = (release['new_fingerprint'] != release['old_fingerprint'] and
                                release['new_fingerprint'] in known_fingerprints)
            if active_release and (restored_behavior or restored_version):
                rolled_back.add(active_release['edit_id'])
            active_release = release
        known_behaviors.update((release['old_behavior'], release['new_behavior']))
        known_fingerprints.update((release['old_fingerprint'], release['new_fingerprint']))
        previous = release
    weekly_releases = [r for r in releases if start <= _time(r['published_at']) <= end]
    cohort = {r['edit_id'] for r in weekly_releases if is_update(r)}
    rollback = _rate(len(cohort & rolled_back), len(cohort), '本周没有成功的正式版本发布，回滚率不适用')
    rollback.update(status='available' if cohort else 'not_applicable',
        observed_publications=len(weekly_releases), excluded_unchanged=len(weekly_releases) - len(cohort),
        records=[{key: r.get(key) for key in ('edit_id', 'published_at', 'old_version', 'new_version')} | {
            'counted': r['edit_id'] in cohort, 'rolled_back': r['edit_id'] in cohort & rolled_back,
            'version_only': r['old_behavior'] == r['new_behavior'] and r.get('old_version') != r.get('new_version')}
            for r in reversed(weekly_releases[-20:])])
    if not journals_complete:
        rollback.update(value=None, status='incomplete', message='发布版本链尚未同步完整')

    return {'kind': 'skill_north_star', 'schema': 1, 'agent': agent, 'name': name,
            'period': {**bounds, 'end': end.isoformat(), 'timezone': 'Asia/Shanghai'},
            'weekly_gain': gain, 'drift_recall': recall, 'gate_pass_rate': gate, 'rollback_rate': rollback,
            'method_note': '成功率依据业务校验；未知与基础设施错误排除。指标辅助审核，不替代审批、测试或人工发布。'}


def publication_snapshot(audit, original, updated, *, path=None):
    """只在受控文件发布边界计算指纹，不读取或存储模型密钥和完整正文。"""
    from app.skills.registry import _parse_markdown_skill, _load_references, SkillDefinition
    source_path = Path(path) if path is not None else Path('metric-source.md')
    references, layout = _load_references(source_path)
    result = {'schema': 1, 'kind': 'file_publication', 'edit_id': audit['edit_id'],
              'agent': audit['agent'], 'name': audit['skill'], 'published_at': audit['timestamp'],
              'old_revision': audit['old_revision'], 'new_revision': audit['new_revision']}
    for side, source in (('old', original), ('new', updated)):
        payload, document = _parse_markdown_skill(source.decode('utf-8'), source_path)
        definition = SkillDefinition.from_payload(audit['agent'], payload, source_path, document, references, layout)
        metadata = dict(definition.metadata)
        metadata.pop('version', None)
        behavior = json.dumps({'metadata': metadata, 'document': document,
                               'references': [item.observation() for item in references], 'goal': definition.goal},
                              sort_keys=True, ensure_ascii=False, default=str)
        result.update({side + '_fingerprint': definition.observation()['skill_fingerprint'],
                       side + '_behavior': sha256(behavior.encode()).hexdigest(), side + '_version': definition.version})
    return result


class NorthStarMetrics:
    """复用 MySQL JSON 存储；GET 只读，后台从既有发布审计及真实测试回执补齐账本。"""
    namespaces = ('skill_north_star_alerts', 'skill_north_star_gates', 'skill_north_star_publications')

    def __init__(self, evolution):
        self.evolution = evolution

    @property
    def store(self):
        return self.evolution.store

    def collect(self, now):
        root = self.evolution.manager.backup_root
        cache = self.evolution._metric_cache
        paths = list(islice(chain(root.glob('*/*/*.json'), (root / 'tests').glob('*.json')), 5001))
        complete, legacy = len(paths) <= 5000, 0
        for path in paths[:5000]:
            if path.is_symlink() or not path.resolve().is_relative_to(root.resolve()):
                complete = False
                continue
            try:
                with self.evolution.manager._transaction():
                    stat = path.stat()
                    key, signature = (id(self.store), str(path)), (stat.st_mtime_ns, stat.st_size)
                    cached = cache.get(key)
                    if cached and cached[0] == signature:
                        legacy += cached[1]
                        continue
                    record = json.loads(path.read_text(encoding='utf-8'))
                    checked = path.stat()
                    if (checked.st_mtime_ns, checked.st_size) != signature:
                        complete = False
                        continue  # 文件在读取间被替换，不能给新内容绑定旧签名。
                legacy_record = 0
                if not isinstance(record, dict):
                    complete = False
                    continue
                if record.get('event') == 'skill_updated':
                    payload = record.get('north_star')
                    if payload and record.get('state') == 'applied':
                        if (not isinstance(payload, dict) or payload.get('schema') != 1 or
                                payload.get('edit_id') != record.get('edit_id') or
                                payload.get('agent') != record.get('agent') or payload.get('name') != record.get('skill') or
                                payload.get('new_revision') != record.get('new_revision')):
                            complete = False
                            continue
                        self.store.get_or_create(self.namespaces[2], payload['edit_id'], lambda: payload)
                    elif payload and record.get('state') == 'prepared':
                        # 文件与数据库不是同一原子事务；未对账回执不能计作成功发布。
                        complete = False
                        continue
                    else:
                        legacy_record = int(not payload)
                elif record.get('mode') in {'machine_flow', 'knowledge_flow', 'cad_spec_flow', 'review_flow'}:
                    from app.skills.optimization import assessment_keys, verification_mode
                    payload = record.get('assessment')
                    if not payload and record.get('status') in {'awaiting_fault', 'running', 'awaiting_repair', 'awaiting_report'}:
                        # 源回执已恢复等待时，也撤回旧账本中的临时失败；保留原验收内容作溯源。
                        payload = self.store.get(self.namespaces[1], record.get('test_id', ''))
                    if payload:
                        criteria = payload.get('criteria') if isinstance(payload, dict) else None
                        legacy_knowledge = _legacy_knowledge_assessment(payload)
                        if (not isinstance(payload, dict) or payload.get('schema') != 1 or
                                payload.get('assessment_id') != record.get('test_id') or
                                payload.get('agent') != record.get('agent') or payload.get('name') != record.get('name') or
                                payload.get('trial_fingerprint') != record.get('fingerprint') or
                                not _hash(payload.get('trial_fingerprint')) or
                                not _time(payload.get('completed_at')) or type(payload.get('accepted')) is not bool or
                                type(payload.get('revision', 0)) is not int or payload.get('revision', 0) < 0 or
                                payload.get('basis') != record['mode'] + '_receipt' or not isinstance(criteria, dict) or
                                (record['mode'] != 'machine_flow' and record['mode'] != verification_mode(record['agent'], record['name'])) or
                                any(type(criteria.get(k)) is not bool for k in assessment_keys(record['mode'])
                                    if not (legacy_knowledge and k == 'query_relevance')) or
                                (payload['accepted'] and not all(criteria.values()))):
                            complete = False
                            continue
                        if legacy_knowledge:
                            # 旧契约未验证查询相关性：不计作当前验收，也不阻断其它技能的指标。
                            legacy += 1
                            cache[key] = (signature, 1)
                            continue
                        payload = {**payload, 'trial_status': record.get('status'),
                                   'source_signature': f'{stat.st_mtime_ns}:{stat.st_size}'}
                        saved = self.store.get_or_create(self.namespaces[1], payload['assessment_id'], lambda: payload)
                        if saved.get('source_signature'):
                            saved_modified = int(saved['source_signature'].split(':', 1)[0])
                            if saved_modified > stat.st_mtime_ns:
                                continue  # 已有较新的源快照，旧收集器不能恢复较早的失败状态。
                        if (payload.get('revision', 0) > saved.get('revision', 0) or
                                payload.get('revision', 0) == saved.get('revision', 0) and
                                payload.get('trial_status') != saved.get('trial_status')):
                            # 同一次试验恢复后替换原验收，不新增分母；CAS 阻止迟到收集覆盖新版。
                            if any(saved.get(k) != payload.get(k) for k in ('agent', 'name', 'trial_fingerprint', 'basis')):
                                complete = False
                                continue
                            updated = self.store.compare_and_set(self.namespaces[1], payload['assessment_id'],
                                'source_signature', saved.get('source_signature'), payload)
                            if updated is None:
                                complete = False
                                continue  # 未缓存该文件，下一轮重新读取最新版。
                    else:
                        legacy_record = int(record.get('status') in {'completed', 'failed'})
                legacy += legacy_record
                cache[key] = (signature, legacy_record)
            except (OSError, ValueError, TypeError):
                complete = False
        sync = self.store.get_or_create('skill_north_star_sync', 'latest', lambda: {'revision': 0})
        if not sync.get('collected_at') or _time(sync['collected_at']) <= now:
            self.store.compare_and_set('skill_north_star_sync', 'latest', 'revision', sync['revision'],
                {'revision': sync['revision'] + 1, 'complete': complete, 'collected_at': now.isoformat(),
                 'legacy_excluded': legacy, 'message': '' if complete else '源记录不完整或发布回执尚未对账'})

    def observe(self, health, now):
        """风险先行信号是已发生的校验失败/降级；只预警将来的同版本失败，不追溯命中。"""
        current = health['current']
        if not current.get('complete'):
            return
        for row in current.get('items', []):
            if row.get('version') == 'unknown' or not row.get('sources'):
                continue
            for source in row['sources']:
                identity = sha256((row['agent'] + ':' + row['name'] + ':' + row['fingerprint'] + ':' +
                                   source['source_id']).encode()).hexdigest()
                payload = {'schema': 1, 'creation_id': uuid4().hex, 'alert_id': identity, 'agent': row['agent'], 'name': row['name'],
                    'fingerprint': row['fingerprint'], 'created_at': now.isoformat(),
                    'expires_at': (now + timedelta(days=7)).isoformat(), 'source_id': source['source_id'],
                    'policy': '近期业务校验失败或证据不足，预警后续同版本执行风险'}
                saved = self.store.get_or_create(self.namespaces[0], identity, lambda: payload)
                if saved.get('creation_id') == payload['creation_id'] and self.evolution.manager.trace:
                    self.evolution.manager.trace.record(type='skill_loop', event='skill_risk_alert',
                        name='技能效果风险预警', agent=row['agent'], skill=row['name'],
                        alert_id=identity, fingerprint=row['fingerprint'], message=payload['policy'])

    def status(self, health, agent, name, now):
        records = [self.store.values(ns, limit=5000) for ns in self.namespaces]
        sync = self.store.get('skill_north_star_sync', 'latest') or {}
        complete = sync.get('complete', False) and all(len(rows) < 5000 for rows in records)
        result = project_metrics(health, *records, agent, name, now, journals_complete=complete)
        current = self.evolution.manager.detail(agent, name)
        result['update_quota'] = current['update_quota']
        if result['weekly_gain'].get('publication_revision') != current['revision']:
            result['weekly_gain'] = {'value': None, 'old': _rate(0, 0), 'new': _rate(0, 0),
                'method': 'observational', 'message': '当前技能发布记录尚未同步，等待后台对账与运行样本'}
        from app.skills.comparison import project_comparison
        comparison = project_comparison(self.store.get('skill_north_star_comparisons', agent + ':' + name), current, now,
                                        publications=records[2] if complete else ())
        if comparison:
            result['operational_metrics'] = {key: result[key] for key in ('weekly_gain', 'drift_recall')}
            for key in ('weekly_gain', 'drift_recall'):
                if result[key].get('value') is None:
                    result[key] = comparison[key]
        result['collected_at'] = sync.get('collected_at')
        result['coverage_note'] = '只统计可验证的新格式回执；历史未保存的验收或预警不补造。'
        result['active_alerts'] = [r for r in _unique(records[0], 'alert_id', agent, name) if
            _time(r.get('created_at')) and _time(r.get('expires_at')) and
            _time(r['created_at']) <= now < _time(r['expires_at'])][-5:]
        assessments = [r for r in _unique(records[1], 'assessment_id', agent, name) if
                       _final_assessment(r) and not _legacy_knowledge_assessment(r) and type(r.get('accepted')) is bool and _time(r.get('completed_at')) and
                       _time(r['completed_at']) <= now]
        result['latest_assessment'] = max(assessments, key=lambda r: _time(r['completed_at']), default=None)
        return result
