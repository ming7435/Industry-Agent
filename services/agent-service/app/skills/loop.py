"""独立 Skill Loop：只读观测、周计划和持久预算；人工测试/发布仍由原服务控制。"""
from copy import deepcopy
from datetime import datetime, timezone
from uuid import uuid4

from app.skills.evolution import ACTIVE, NS
from app.skills.loop_analytics import aggregate, week_windows
from app.skills.management import SkillEditError


class SkillLoop:
    def __init__(self, evolution):
        self.evolution = evolution

    @property
    def store(self):
        return self.evolution.store

    def _window(self, bounds):
        start, end = (datetime.fromisoformat(bounds[key]) for key in ('start', 'end'))
        records, after, upper, complete, done = [], 0, None, True, False
        message = ''
        if start == end:
            done = True
        for _ in range(200):
            if done:
                break
            trace = self.evolution.manager.trace
            if trace is None:
                complete, message = False, '没有可信执行轨迹'
                break
            page = trace.skill_window_page(start, end, after=after, upper=upper, limit=200)
            complete = complete and bool(page['complete'])
            records.extend(page['items'])
            next_cursor = page['after']
            upper = page['upper'] if upper is None else upper
            done = bool(page['done'])
            if not done and next_cursor <= after:
                complete, message = False, '轨迹游标未推进，窗口不完整'
                break
            after = next_cursor
            message = page.get('message') or message
            if not complete:
                break
        complete = complete and done
        return {**bounds, 'upper': upper, 'after': after, 'complete': complete,
                'record_count': len(records), 'message': message or ('' if complete else '窗口未读取完整，不能生成周计划'),
                'items': aggregate(records, self.evolution.manager.registry, complete)}

    def _selection(self, previous):
        selected = []
        active = self.evolution.list()
        for row in previous['items']:
            if not previous['complete'] or not row['sources'] or row['version'] == 'unknown':
                continue
            from app.skills.optimization import verification_mode
            if not verification_mode(row['agent'], row['name']):
                continue
            definition = self.evolution.manager.registry.get(row['agent'], row['name'])
            if not definition or definition.observation()['skill_fingerprint'] != row['fingerprint']:
                continue
            if any(r['agent'] == row['agent'] and r['name'] == row['name'] and r['status'] in ACTIVE for r in active):
                continue
            sources = [source for source in reversed(row['sources']) if not self.store.get(
                'skill_evolution_source', source['source_id'] + ':' + source['agent'] + ':' + source['name'])]
            if not sources:
                continue
            verdicts = row['verdicts']
            problems = verdicts['fail'] + verdicts['degraded']
            selected.append({'agent': row['agent'], 'name': row['name'], 'version': row['version'],
                             'fingerprint': row['fingerprint'], 'source': sources[0],
                             'problems': problems, 'problem_ratio': problems / row['calls'],
                             'reason': f"完整周窗口中 {row['calls']} 次执行，{verdicts['fail']} 次业务校验失败、"
                                       f"{verdicts['degraded']} 次证据不足/降级；当前技能版本一致，优先补充取证判断"})
        # 失败量与问题比例的非支配分层；同层确定排序，不用虚构的 bandit 收益。
        remaining, ranked = list(selected), []
        while remaining:
            front = [r for r in remaining if not any(
                s['problems'] >= r['problems'] and s['problem_ratio'] >= r['problem_ratio'] and
                (s['problems'] > r['problems'] or s['problem_ratio'] > r['problem_ratio']) for s in remaining)]
            ranked.extend(sorted(front, key=lambda r: (-r['problems'], -r['problem_ratio'], r['agent'], r['name'])))
            remaining = [r for r in remaining if r not in front]
        return ranked[:3]

    def refresh(self, now=None):
        now = now or datetime.now(timezone.utc)
        windows = week_windows(now)
        week_id = windows['week_id']
        # 旧分页快照没有持续覆盖证明，保留旧数据但不能把旧complete直接沿用。
        previous_key = windows['previous']['start'] + ':coverage-v1:north-star-v1:all-skills-v1'
        previous = self.store.get('skill_loop_snapshot', previous_key)
        if previous is None or not previous.get('complete'):
            previous = self._window(windows['previous'])
            if previous['complete']:
                previous = self.store.get_or_create('skill_loop_snapshot', previous_key, lambda: previous)
        current = self._window(windows['current'])
        self.evolution.metrics.collect(now)
        self.evolution.metrics.observe({'previous': previous, 'current': current}, now)
        initial_plan = {'loop_id': week_id, 'revision': 0, 'recording_policy': 1, 'selection_policy': 3, 'limit': 3, 'selected': self._selection(previous),
                        'source_window': windows['previous'], 'reservations': {}, 'created_at': now.isoformat()}
        # 完整窗口才冻结计划；冷启动/存储失败不能永久保存一份伪完整的空计划。
        if previous['complete']:
            plan = self.store.get_or_create('skill_loop_plan', week_id, lambda: initial_plan)
            # 本周老计划只补尚未占用的空位，不清除任何预约、候选或失败额度。
            if plan.get('recording_policy') == 1 and plan.get('selection_policy') != 3:
                retained = list(plan['selected'])
                keys = {item['agent'] + ':' + item['name'] for item in retained} | set(plan['reservations'])
                capacity = max(0, plan['limit'] - len(keys))
                extra = [item for item in initial_plan['selected'] if item['agent'] + ':' + item['name'] not in keys][:capacity]
                self.store.compare_and_set('skill_loop_plan', week_id, 'revision', plan['revision'],
                    {'revision': plan['revision'] + 1, 'selection_policy': 3, 'selected': retained + extra})
        state = self.store.get_or_create('skill_loop_state', 'latest', lambda: {'revision': 0})
        self.store.compare_and_set('skill_loop_state', 'latest', 'revision', state['revision'],
            {'revision': state['revision'] + 1, 'loop_id': week_id, 'observed_at': now.isoformat(),
             'health': {'previous': previous, 'current': current},
             'evaluation': {'status': 'not_evaluated',
                            'message': '仅为实际版本运行观察；没有独立同基线对照和收益标准，不能宣称优化有效'}})
        return self.status()

    def _reserve(self, week_id):
        for _ in range(8):
            control = self.store.get('skill_loop_control', 'global') or {}
            if control.get('paused'):
                return None
            plan = self.store.get('skill_loop_plan', week_id)
            if not plan or plan.get('recording_policy') != 1 or len(plan['reservations']) >= plan['limit']:
                return None
            for item in plan['selected']:
                key = item['agent'] + ':' + item['name']
                if key not in plan['reservations']:
                    reservation = {'reservation_id': uuid4().hex, 'reserved_at': datetime.now(timezone.utc).isoformat(),
                                   'outcome': 'reserved', 'proposal_id': '',
                                   'source_key': item['source']['source_id'] + ':' + key}
                    reservations = {**plan['reservations'], key: reservation}
                    saved = self.store.compare_and_set('skill_loop_plan', week_id, 'revision', plan['revision'],
                                                        {'revision': plan['revision'] + 1, 'reservations': reservations})
                    if saved:
                        return item, key, reservation
                    break
            else:
                return None
        return None

    def _receipt(self, week_id, key, reservation, candidate):
        for _ in range(8):
            plan = self.store.get('skill_loop_plan', week_id)
            current = plan['reservations'].get(key)
            if not current or current['reservation_id'] != reservation['reservation_id']:
                return
            updated = {**current, 'proposal_id': candidate['proposal_id'] if candidate else '',
                       'outcome': candidate['status'] if candidate else 'not_generated'}
            if self.store.compare_and_set('skill_loop_plan', week_id, 'revision', plan['revision'],
                {'revision': plan['revision'] + 1, 'reservations': {**plan['reservations'], key: updated}}):
                return

    def _candidate_receipt(self, receipt):
        """仅从稳定来源绑定回查，不重放丢失回执的模型或业务写操作。"""
        proposal_id = receipt.get('proposal_id') or ''
        if not proposal_id and receipt.get('source_key'):
            binding = self.store.get('skill_evolution_source', receipt['source_key']) or {}
            proposal_id = binding.get('proposal_id') or ''
        return self.store.get(NS, proposal_id) if proposal_id else None

    def scan_once(self, now=None, *, refresh=True):
        if (self.store.get('skill_loop_control', 'global') or {}).get('paused'):
            return None
        status = self.refresh(now) if refresh else self.status()
        if status.get('loop_id') != week_windows(now or datetime.now(timezone.utc))['week_id']:
            return None
        week_id = status['loop_id']
        reserved = self._reserve(week_id)
        if reserved is None:
            return None
        item, key, reservation = reserved
        # 同一技能跨周仍只能有一份在途稿；失去回执的占位不自动重放收费调用。
        slot = self.store.get_or_create('skill_loop_active', key, lambda: {'revision': 0, 'reservation_id': '', 'proposal_id': ''})
        if slot.get('reservation_id'):
            candidate = self._candidate_receipt(slot)
            if not candidate or candidate['status'] in ACTIVE:
                self._receipt(week_id, key, reservation, None)
                return None
        claimed = self.store.compare_and_set('skill_loop_active', key, 'revision', slot['revision'],
            {'revision': slot['revision'] + 1, 'reservation_id': reservation['reservation_id'], 'proposal_id': '',
             'source_key': reservation['source_key'], 'loop_id': week_id})
        if claimed is None:
            self._receipt(week_id, key, reservation, None)
            return None
        source = {**item['source'], 'skill_loop_id': week_id, 'planning_reason': item['reason'],
                  'window': status['plan']['source_window']}
        candidate = self.evolution.generate_source(source)
        self.store.compare_and_set('skill_loop_active', key, 'revision', claimed['revision'],
            {'revision': claimed['revision'] + 1, 'proposal_id': candidate['proposal_id'] if candidate else '',
             'reservation_id': reservation['reservation_id'] if candidate else ''})
        self._receipt(week_id, key, reservation, candidate)
        return candidate

    def set_paused(self, paused, actor):
        if actor.get('role') != 'technician' or not actor.get('user_id'):
            raise SkillEditError(403, '仅维修人员可以暂停或恢复技能优化，监督人只查看')
        current = self.store.get_or_create('skill_loop_control', 'global', lambda: {'revision': 0, 'paused': False, 'history': []})
        event = {'paused': bool(paused), 'actor_id': actor['user_id'], 'timestamp': datetime.now(timezone.utc).isoformat()}
        result = self.store.compare_and_set('skill_loop_control', 'global', 'revision', current['revision'],
            {'revision': current['revision'] + 1, 'paused': bool(paused), 'history': [*current['history'], event]})
        if result is None:
            raise SkillEditError(409, '技能优化开关刚被更新，请刷新后核对')
        trace = self.evolution.manager.trace
        if trace:
            trace.record(type='skill_loop', event='skill_loop_control', name='技能优化循环', **event)
        return result

    def status(self, agent='', name=''):
        state = deepcopy(self.store.get('skill_loop_state', 'latest') or {})
        control = self.store.get('skill_loop_control', 'global') or {'revision': 0, 'paused': False}
        week_id = state.get('loop_id')
        plan = self.store.get('skill_loop_plan', week_id) if week_id else None
        def matches(row):
            return (not agent or row['agent'] == agent) and (not name or row['name'] == name)
        health = state.get('health')
        north_star = self.evolution.metrics.status(health, agent, name,
            datetime.fromisoformat(state['observed_at']) if state.get('observed_at') else datetime.now(timezone.utc)) if agent and name else None
        if health:
            for window in health.values():
                window['items'] = [{k: v for k, v in row.items() if k not in {'sources', 'outcome_events'}} for row in window['items'] if matches(row)]
        if plan:
            blocked_reason = '' if plan.get('recording_policy') == 1 else '旧计划缺少持续观测覆盖证明，本周停止生成新稿，保留已占额度与原候选'
            selected = []
            for item in plan['selected']:
                if not matches(item):
                    continue
                reservation = plan['reservations'].get(item['agent'] + ':' + item['name'], {})
                proposal = self._candidate_receipt(reservation)
                selected.append({k: v for k, v in item.items() if k != 'source'} | {
                    'proposal_id': proposal['proposal_id'] if proposal else reservation.get('proposal_id', ''),
                    'phase': ('observing' if proposal and proposal['status'] == 'published' else
                              proposal['status'] if proposal else reservation.get('outcome', 'planned'))})
            plan = {k: v for k, v in plan.items() if k not in {'reservations', 'selected'}} | {
                'selected': selected, 'used': len(plan['reservations']),
                'blocked_reason': blocked_reason,
                'remaining': max(0, plan['limit'] - len(plan['reservations']))}
        return {'kind': 'skill_loop', 'loop_id': week_id, 'observed_at': state.get('observed_at'),
                'health': health, 'plan': plan, 'north_star': north_star, 'control': {k: control[k] for k in ('paused', 'revision')},
                'evaluation': state.get('evaluation', {'status': 'not_evaluated', 'message': '尚未评估'})}
