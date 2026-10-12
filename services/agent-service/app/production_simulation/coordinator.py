"""Coordinate explicit actions through existing agents and GET-only background facts."""
from app.a2a.client import A2AError
from threading import RLock
from app.harness.runtime import AgentExecutionError
from shared.virtual_turning import VirtualProductionError, digest
from .context import create_virtual_context
from .factory import VirtualFactoryError


class VirtualProductionCoordinator:
    def __init__(self, backend, factory, operations, trace):
        self.backend, self.factory, self.operations, self.trace = backend, factory, operations, trace
        self._locks = tuple(RLock() for _ in range(64))

    def _invoke(self, actor, action, arguments):
        if action == 'prepare': job_id = 'SIM-JOB-' + digest([actor['user_id'], arguments['command_id']])
        elif action == 'inspect': job_id = 'SIM-JOB-' + arguments['part_id'].removeprefix('SIM-PART-')
        else: job_id = arguments['job_id']
        recovery = getattr(self, 'recovery', None)
        from contextlib import nullcontext
        with recovery.execution_scope(job_id + ':' + action, 'production') if recovery else nullcontext():
            return self._invoke_tracked(actor, action, arguments, job_id)

    def _invoke_tracked(self, actor, action, arguments, job_id):
        with self._locks[int(digest(job_id)[:8], 16) % len(self._locks)]:
            recovery = getattr(self, 'recovery', None)
            state = {'task_id': job_id + ':' + action, 'trace_id': job_id, 'recovery_actor_id': actor['user_id'],
                     'production_job_id': job_id, 'production_action': action, 'production_arguments': arguments,
                     'next_action': {'target': 'quality' if action == 'inspect' else 'cad',
                                     'required_capability': 'virtual_' + action, 'side_effect': action != 'sync'},
                     'completed_steps': []}
            if recovery is not None:
                previous = recovery.get(recovery.identifier(state['task_id'], 'production'))
                if previous:
                    from app.runtime.recovery import RecoveryConflict
                    if previous['status'] == 'resuming' or recovery.summary(previous)['status'] == 'running':
                        raise RecoveryConflict('原生产动作仍在执行或恢复中，请刷新状态')
                    state['runtime_recovery_epoch'] = previous.get('epoch', 0)
                recovery.checkpoint(state, 'running', kind='production')
            try:
                result = self._invoke_locked(actor, action, arguments, job_id)
            except Exception as error:
                if recovery is not None:
                    state['runtime_execution'] = {'side_effect_status': 'unknown' if action != 'sync' else 'not_applied'}
                    recovery.checkpoint(state, 'failed', kind='production', error=error)
                raise
            if recovery is not None:
                unknown = isinstance(result, dict) and result.get('sync_status') == 'outcome_unknown'
                if unknown: state['runtime_execution'] = {'side_effect_status': 'unknown'}
                recovery.checkpoint(state, 'outcome_unknown' if unknown else 'completed', kind='production',
                                    error='生产结果尚未确认' if unknown else '')
            return result

    def resume_failed(self, record, actor):
        from app.runtime.recovery import RecoveryConflict
        state = dict(record['state'])
        if actor.get('user_id') != state.get('recovery_actor_id'):
            raise RecoveryConflict('只能恢复本人原生产任务')
        action, arguments, job_id = state['production_action'], state['production_arguments'], state['production_job_id']
        # Always resolve the original backend job; recovery never allocates a new command.
        try:
            job = self.backend.get(actor, job_id)
        except VirtualProductionError as error:
            if action != 'prepare' or error.status != 404:
                raise
            job = None
        complete_states = {'submit': {'received', 'running', 'completed', 'inspected', 'compared'},
                           'start': {'running', 'completed', 'inspected', 'compared'},
                           'inspect': set()}
        def complete(job):
            if job.get('actor_id') != state['recovery_actor_id']:
                raise RecoveryConflict('原生产任务归属不一致，不能恢复')
            if action == 'prepare':
                from shared.virtual_turning import build_virtual_design, build_virtual_program
                fixed = build_virtual_design(arguments['run'])
                program = build_virtual_program(fixed, arguments['setup'], arguments['material'])
                expected = digest([fixed, program['setup'], program['material'], arguments.get('batch_id', '')])
                if job.get('request_digest') != expected:
                    raise RecoveryConflict('同一生产指令的设计或工艺已冲突，不能作为成功回执')
            if action in {'submit', 'start'} and arguments.get('digest') != job.get('program_digest'):
                raise RecoveryConflict('原生产程序摘要不一致，不能恢复提交或启动')
            if action == 'inspect':
                check = job.get('inspection') or {}
                return bool(check.get('check_id')) and all(check.get(key) == value for key, value in {
                    'job_id': job_id, 'actor_id': state['recovery_actor_id'], 'part_id': arguments['part_id'],
                    'output_digest': arguments['output_digest']}.items())
            return action == 'prepare' or job.get('status') in complete_states.get(action, set())
        if job is not None and complete(job):
            return {**state, 'recovery_status': 'completed'}
        if record.get('reconcile_only') and action not in {'prepare', 'sync'}:
            if job is None:
                raise RecoveryConflict('原生产任务无法核对，未重复提交')
            if action != 'inspect':
                self.reconcile_saved(job)
            job = self.backend.get(actor, job_id)
            if not complete(job):
                raise RecoveryConflict('原生产动作结果仍未确认，仅执行状态核对，未再次启动或提交')
            return {**state, 'recovery_status': 'completed'}
        with self._locks[int(digest(job_id)[:8], 16) % len(self._locks)]:
            result = self._invoke_locked(actor, action, arguments, job_id)
        unknown = isinstance(result, dict) and result.get('sync_status') == 'outcome_unknown'
        return {**state, 'recovery_status': 'outcome_unknown' if unknown else 'completed',
                'recovery_error': '原生产动作结果仍未确认' if unknown else ''}

    def _invoke_locked(self, actor, action, arguments, job_id):
        context = create_virtual_context(actor, action, arguments, self.backend, self.factory, job_id)
        try:
            if action == 'inspect':
                result = self.operations.inspect_virtual_output(arguments['part_id'], arguments['output_digest'], context)
            else:
                result = self.operations.execute_virtual_production(action, arguments, context)
        except (A2AError, AgentExecutionError) as error:
            cause, domain = error, None
            while cause is not None:
                if isinstance(cause, VirtualProductionError): domain = cause
                cause = cause.__cause__
            if domain is not None and domain.status < 500: raise domain from None
            # A write may have happened. Read the already saved identity; never repeat it.
            try:
                current = self.backend.get(actor, job_id)
                if current['sync_status'] == 'outcome_unknown': return current
            except VirtualProductionError: pass
            raise domain or VirtualProductionError('production_execution_unknown', '执行结果需要核对原任务', 503) from None
        if self.trace:
            job = self.backend.get(actor, job_id)
            self.trace.record(type='production', name='virtual_' + action, event='production_action_saved',
                agent='quality' if action == 'inspect' else 'cad', task_id=job_id, trace_id=job_id,
                run_type='production_simulation', context={'run_type': 'production_simulation', 'actor_id': job['actor_id'],
                    'job_id': job_id, 'device_id': job['program']['device_id']},
                state_change={'job_id': job_id, 'action': action, 'status': job['status'], 'sync_status': job['sync_status']})
        return result

    def prepare(self, actor, arguments): return self._invoke(actor, 'prepare', arguments)
    def submit(self, actor, job_id, digest): return self._invoke(actor, 'submit', {'job_id': job_id, 'digest': digest})
    def start(self, actor, job_id, digest): return self._invoke(actor, 'start', {'job_id': job_id, 'digest': digest})
    def sync(self, actor, job_id): return self._invoke(actor, 'sync', {'job_id': job_id})
    def inspect(self, actor, part_id, output_digest):
        return self._invoke(actor, 'inspect', {'part_id': part_id, 'output_digest': output_digest})

    def reconcile_saved(self, job):
        """Runtime authority can read and save receipts, but cannot execute production."""
        with self._locks[int(digest(job['job_id'])[:8], 16) % len(self._locks)]:
            return self._reconcile_locked(job)

    def _reconcile_locked(self, job):
        try:
            receipt = self.factory.get(job['factory_job_id']) if job.get('factory_job_id') else self.factory.by_command(job['factory_command_id'])
            saved = self.backend.sync_receipt(job['job_id'], job['revision'], receipt)
            if self.trace:
                self.trace.record(type='production', name='background_sync', event='production_fact_saved',
                    agent='runtime', task_id=job['job_id'], trace_id=job['job_id'], run_type='production_simulation',
                    context={'run_type': 'production_simulation', 'actor_id': saved['actor_id'], 'job_id': job['job_id']},
                    state_change={'job_id': job['job_id'], 'status': saved['status'], 'sync_status': saved['sync_status']})
            return saved
        except VirtualFactoryError as error:
            try: return self.backend.sync_error(job['job_id'], job['revision'], error.code)
            except VirtualProductionError as failure:
                if failure.status == 409: return {'status': 'newer_fact'}
                raise
        except VirtualProductionError as error:
            if error.status == 409: return {'status': 'newer_fact'}
            raise
