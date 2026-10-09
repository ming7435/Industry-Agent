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
        with self._locks[int(digest(job_id)[:8], 16) % len(self._locks)]:
            return self._invoke_locked(actor, action, arguments, job_id)

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
