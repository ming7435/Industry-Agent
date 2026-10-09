"""Persist independently verified factory facts, without holding locks over network I/O."""
from copy import deepcopy
from decimal import Decimal, ROUND_HALF_UP
import re
import time
from collections.abc import Mapping

from shared.virtual_turning import (build_virtual_design, build_virtual_program, build_virtual_output,
    validate_factory_receipt, digest, require, SOURCE, VirtualProductionError)
from shared.virtual_production_quality import compare_virtual_output, RULE

JOB = 'sim_production_job'
OUTPUT = 'sim_produced_part'
CHECK = 'sim_quality_check'


class VirtualProductionService:
    def __init__(self, repository):
        self.repository = repository

    @staticmethod
    def _actor(actor):
        require(isinstance(actor, Mapping) and isinstance(actor.get('user_id'), str)
                and 0 < len(actor['user_id']) <= 128 and actor.get('role') in {'technician', 'supervisor'}
                and actor.get('enabled', 1) == 1, 'invalid_actor', '登录身份无效', 401)
        return actor['user_id']

    @staticmethod
    def _command(command_id):
        require(isinstance(command_id, str) and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}', command_id),
                'invalid_command_id', status=422)

    def _owner(self, actor, job):
        identity = self._actor(actor)
        require(job['actor_id'] == identity or actor['role'] == 'supervisor', 'foreign_production_job', '无权访问此生产任务', 403)

    def _read(self, job_id):
        require(isinstance(job_id, str) and re.fullmatch(r'SIM-JOB-[a-f0-9]{64}', job_id), 'invalid_job_id', status=422)
        job = self.repository.get_record(JOB, job_id)
        require(job is not None, 'job_not_found', '生产任务不存在', 404)
        fixed = build_virtual_design(job['design'])
        require(job['design_digest'] == fixed['digest'] and job['design_run_id'] == fixed['run_id']
                and job['program'] == build_virtual_program(fixed, job['setup'], job['material'])
                and digest(job['program']) == job['program_digest'] and job['source'] == SOURCE
                and job['simulation_only'] is True, 'saved_plan_integrity', '已保存方案校核失败')
        return job

    def _valid_output(self, job, value):
        require(value is not None and job['receipt']['status'] == 'completed', 'output_not_completed', '等待模拟加工完成')
        expected = build_virtual_output(job, job['receipt'])
        require(all(value.get(k) == v for k, v in expected.items()) and value.get('actor_id') == job['actor_id']
                and value.get('batch_id') == job['batch_id'], 'saved_output_integrity', '保存的模拟产出校核失败')
        return value

    def _present(self, job):
        result = deepcopy(job)
        value = self.repository.get_record(OUTPUT, job['part_id'])
        result['output'] = value
        result['inspection'] = None
        if value is not None:
            try:
                self._valid_output(job, value)
                if job['sync_status'] == 'confirmed':
                    check = self.repository.get_record(CHECK, self._check_id(value))
                    if check and self._valid_check(job, value, check): result['inspection'] = check
            except VirtualProductionError as error:
                result['output'] = None
                result['sync_status'] = 'review'
                result['error_code'] = error.code
        return result

    def prepare(self, actor, command_id, run, setup, material, batch_id=''):
        owner = self._actor(actor); self._command(command_id)
        require(isinstance(batch_id, str) and len(batch_id) <= 128, 'invalid_batch_id', status=422)
        identity = digest([owner, command_id])
        job_id, part_id = 'SIM-JOB-' + identity, 'SIM-PART-' + identity
        fixed = build_virtual_design(run)
        program = build_virtual_program(fixed, setup, material)
        fingerprint = digest([fixed, program['setup'], program['material'], batch_id])
        with self.repository.simulation_transaction(job_id):
            existing = self.repository.get_record(JOB, job_id)
            if existing:
                require(existing['request_digest'] == fingerprint, 'command_parameters_conflict', '同一指令不能更换设计或工艺')
                return self.get(actor, job_id)
            now = time.time()
            value = {'job_id': job_id, 'part_id': part_id, 'command_id': command_id, 'actor_id': owner,
                     'batch_id': batch_id or 'SIM-BATCH-' + identity[:24], 'design_run_id': fixed['run_id'],
                     'design_digest': fixed['digest'], 'design': fixed, 'setup': deepcopy(program['setup']), 'material': program['material'],
                     'part_name': fixed['part_name'], 'part_number': fixed['part_number'], 'request_digest': fingerprint,
                     'program': program, 'program_digest': digest(program), 'factory_command_id': 'industry-' + identity,
                     'factory_job_id': None, 'status': 'prepared', 'sync_status': 'pending', 'revision': 1,
                     'source': SOURCE, 'simulation_only': True, 'receipt': None, 'progress': 0, 'executed_points': 0,
                     'created_at': now, 'updated_at': now, 'next_sync_at': None, 'sync_failures': 0, 'error_code': None}
            self.repository.save_record(JOB, job_id, value)
            return self._present(value)

    def get(self, actor, job_id):
        job = self._read(job_id); self._owner(actor, job)
        return self._present(job)

    def by_command(self, actor, command_id):
        owner = self._actor(actor); self._command(command_id)
        job_id = 'SIM-JOB-' + digest([owner, command_id])
        if self.repository.get_record(JOB, job_id) is None: return None
        return self.get(actor, job_id)

    def _page(self, items, cursor, limit):
        require(type(limit) is int and 1 <= limit <= 50, 'invalid_page_limit', status=422)
        require(isinstance(cursor, str) and (not cursor or re.fullmatch(r'SIM-JOB-[a-f0-9]{64}', cursor)), 'invalid_cursor', status=422)
        ordered = sorted((item for item in items if item['job_id'] > cursor), key=lambda item: item['job_id'])
        chosen = ordered[:limit]
        return {'items': chosen, 'next_cursor': chosen[-1]['job_id'] if len(ordered) > limit else None}

    def list_jobs(self, actor, design_run_id='', batch_id='', cursor='', limit=50):
        owner = self._actor(actor)
        selected = [job for job in self.repository.list_records(JOB)
                    if (job['actor_id'] == owner or actor['role'] == 'supervisor')
                    and (not design_run_id or job['design_run_id'] == design_run_id) and (not batch_id or job['batch_id'] == batch_id)]
        page = self._page(selected, cursor, limit)
        page['items'] = [self._present(self._read(job['job_id'])) for job in page['items']]
        return page

    @staticmethod
    def _revision(job, expected):
        require(type(expected) is int and expected == job['revision'], 'revision_conflict', '任务已有新事实，请重新读取')

    def _save(self, job, actor_id, **changes):
        updated = {**job, **changes, 'revision': job['revision'] + 1, 'updated_at': time.time(), 'last_sync_actor': actor_id}
        self.repository.save_record(JOB, job['job_id'], updated)
        return self._present(updated)

    def _record_receipt(self, actor, job_id, expected_revision, receipt, runtime=False):
        with self.repository.simulation_transaction(job_id):
            job = self._read(job_id)
            if not runtime: self._owner(actor, job)
            self._revision(job, expected_revision)
            actor_id = 'runtime-reconciler' if runtime else self._actor(actor)
            try:
                valid = validate_factory_receipt(job, receipt)
                output = build_virtual_output(job, valid) if valid['status'] == 'completed' else None
                prior = self.repository.get_record(OUTPUT, job['part_id'])
                if prior is not None:
                    self._valid_output(job, prior)
                    require(output is not None and all(prior.get(k) == v for k, v in output.items()), 'immutable_output_conflict')
            except VirtualProductionError as error:
                return self._save(job, actor_id, sync_status='review', error_code=error.code, next_sync_at=None)
            if valid == job.get('receipt') and job['sync_status'] == 'confirmed': return self._present(job)
            updated = {**job, 'receipt': valid, 'factory_job_id': valid['job_id'], 'status': valid['status'],
                       'progress': valid['progress'], 'executed_points': valid['executed_points'], 'sync_status': 'confirmed',
                       'sync_failures': 0, 'error_code': None,
                       'next_sync_at': None if output else time.time() + (30 if valid['status'] == 'paused' else 2)}
            # Completion and its sole output commit or roll back together.
            result = self._save(updated, actor_id)
            if output and prior is None:
                self.repository.save_record(OUTPUT, job['part_id'], {**output, 'actor_id': job['actor_id'],
                                             'batch_id': job['batch_id'], 'created_at': time.time()})
                result = self._present(self._read(job_id))
            return result

    def record_receipt(self, actor, job_id, expected_revision, receipt):
        return self._record_receipt(actor, job_id, expected_revision, receipt)

    def sync_receipt(self, job_id, expected_revision, receipt):
        return self._record_receipt(None, job_id, expected_revision, receipt, runtime=True)

    def _record_error(self, actor, job_id, expected_revision, code, outcome_unknown=False, runtime=False):
        require(isinstance(code, str) and 1 <= len(code) <= 128, 'invalid_sync_error', status=422)
        with self.repository.simulation_transaction(job_id):
            job = self._read(job_id)
            if not runtime: self._owner(actor, job)
            self._revision(job, expected_revision)
            failures = job['sync_failures'] + 1
            unknown = outcome_unknown or job['sync_status'] == 'outcome_unknown'
            return self._save(job, 'runtime-reconciler' if runtime else self._actor(actor),
                              sync_status='outcome_unknown' if unknown else 'unavailable', error_code=code,
                              sync_failures=failures, next_sync_at=time.time() + [5, 10, 20, 30][min(failures - 1, 3)])

    def record_sync_error(self, actor, job_id, expected_revision, code, outcome_unknown=False):
        return self._record_error(actor, job_id, expected_revision, code, outcome_unknown)

    def sync_error(self, job_id, expected_revision, code):
        return self._record_error(None, job_id, expected_revision, code, runtime=True)

    def pending(self, now: float, cursor='', limit=50):
        require(type(now) in (int, float) and now >= 0, 'invalid_sync_time', status=422)
        jobs = [job for job in self.repository.list_records(JOB)
                if job['sync_status'] != 'review' and not (job['status'] == 'completed' and self.repository.get_record(OUTPUT, job['part_id']))
                and (job['factory_job_id'] or job['sync_status'] == 'outcome_unknown')
                and (job['next_sync_at'] is None or job['next_sync_at'] <= now)]
        keys = ['job_id', 'revision', 'factory_job_id', 'factory_command_id', 'status', 'sync_status', 'actor_id', 'next_sync_at', 'sync_failures']
        page = self._page(jobs, cursor, limit)
        page['items'] = [{k: job[k] for k in keys} for job in page['items']]
        return page

    def output(self, actor, part_id):
        require(isinstance(part_id, str) and re.fullmatch(r'SIM-PART-[a-f0-9]{64}', part_id), 'invalid_part_id', status=422)
        job = self._read('SIM-JOB-' + part_id.removeprefix('SIM-PART-')); self._owner(actor, job)
        return self._valid_output(job, self.repository.get_record(OUTPUT, part_id))

    @staticmethod
    def _check_id(output):
        return 'SIM-CHECK-' + digest([output['part_id'], output['output_digest'], RULE])

    def _valid_check(self, job, output, check):
        expected = compare_virtual_output(job['design'], output)
        return (all(check.get(k) == v for k, v in expected.items()) and check.get('output_digest') == output['output_digest']
                and check.get('check_id') == self._check_id(output) and check.get('part_id') == job['part_id']
                and check.get('job_id') == job['job_id'] and check.get('actor_id') == job['actor_id'])

    def inspect(self, actor, part_id, expected_output_digest):
        # A part shares the stable job lock; no opportunity to rebind a saved output.
        require(isinstance(part_id, str) and re.fullmatch(r'SIM-PART-[a-f0-9]{64}', part_id), 'invalid_part_id', status=422)
        job_id = 'SIM-JOB-' + part_id.removeprefix('SIM-PART-')
        with self.repository.simulation_transaction(job_id):
            job = self._read(job_id); self._owner(actor, job)
            require(job['status'] == 'completed' and job['sync_status'] == 'confirmed', 'output_not_confirmed', '模拟产出尚未确认或需要复核')
            output = self.output(actor, part_id)
            require(expected_output_digest == output['output_digest'], 'output_digest_mismatch', '产出身份已变更，请重新读取')
            result = compare_virtual_output(job['design'], output)
            check_id = self._check_id(output)
            existing = self.repository.get_record(CHECK, check_id)
            if existing:
                require(self._valid_check(job, output, existing), 'inspection_integrity', '保存的检测记录校核失败')
                return existing
            check = {**result, 'check_id': check_id, 'part_id': part_id, 'job_id': job_id,
                     'actor_id': job['actor_id'], 'operator_id': self._actor(actor), 'batch_id': job['batch_id'],
                     'output_digest': output['output_digest'], 'created_at': time.time()}
            self.repository.save_record(CHECK, check_id, check)
            return check

    def quality(self, actor, design_run_id, batch_id, owner_job_id=''):
        owner = self._actor(actor)
        require(re.fullmatch(r'FC-[a-f0-9]{64}', str(design_run_id)) and isinstance(batch_id, str) and batch_id,
                'quality_scope_required', '请选择完整设计版本和批次', 422)
        selected_owner = owner
        jobs = [job for job in self.repository.list_records(JOB) if job['design_run_id'] == design_run_id and job['batch_id'] == batch_id]
        if actor['role'] == 'supervisor':
            if owner_job_id:
                target = self.get(actor, owner_job_id)
                require(target['design_run_id'] == design_run_id and target['batch_id'] == batch_id, 'quality_scope_conflict')
                selected_owner = target['actor_id']
            else:
                owners = {job['actor_id'] for job in jobs}
                require(len(owners) <= 1, 'ambiguous_quality_owner', '同名批次属于多个生产人员，请选择具体任务')
                if owners: selected_owner = next(iter(owners))
        jobs = [job for job in jobs if job['actor_id'] == selected_owner]
        counts = {'total': 0, 'pass': 0, 'fail': 0, 'insufficient_data': 0, 'review': 0, 'pending': 0, 'determinate': 0}
        items = []
        for raw in jobs:
            value = self.repository.get_record(OUTPUT, raw['part_id'])
            if not value: continue
            counts['total'] += 1
            item = {'part_id': raw['part_id'], 'job_id': raw['job_id'], 'status': 'pending', 'inspection': None}
            try:
                job = self._read(raw['job_id']); self._valid_output(job, value)
                require(job['sync_status'] == 'confirmed', 'output_requires_review')
                check = self.repository.get_record(CHECK, self._check_id(value))
                if check:
                    require(self._valid_check(job, value, check), 'inspection_integrity')
                    item.update(status=check['status'], inspection=check)
            except VirtualProductionError:
                item['status'] = 'review'
            counts[item['status']] += 1
            items.append(item)
        counts['determinate'] = counts['pass'] + counts['fail']
        def rate(n, d):
            return float((Decimal(n) * 100 / Decimal(d)).quantize(Decimal('.01'), rounding=ROUND_HALF_UP)) if d else None
        return {'items': items, 'counts': counts, 'rates': {'consistent': rate(counts['pass'], counts['determinate']),
                  'inconsistent': rate(counts['fail'], counts['determinate']), 'coverage': rate(counts['determinate'], counts['total'])},
                'design_run_id': design_run_id, 'batch_id': batch_id, 'actor_id': selected_owner, 'source': SOURCE, 'simulation_only': True}
