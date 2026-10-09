"""Narrow Backend facade; no arbitrary tool or browser-supplied actor/role dispatch."""
from app.clients.backend import BackendServiceClient, BackendServiceError
from shared.virtual_turning import require, VirtualProductionError


class VirtualProductionBackend:
    def __init__(self, client=None):
        self.client = client or BackendServiceClient()

    def resolve_session(self, token): return self._call('session_actor', token=token)

    def _call(self, operation, actor=None, **arguments):
        if actor is not None:
            require(isinstance(actor, dict) and actor.get('user_id'), 'invalid_actor', status=401)
            arguments['actor_id'] = actor['user_id']
        try:
            value = self.client.request('/internal/production/virtual/' + operation, arguments)
        except BackendServiceError as error:
            raise VirtualProductionError('production_backend_error', str(error), error.status_code or 503) from error
        require(isinstance(value, dict) and 'result' in value, 'invalid_backend_response', status=503)
        return value['result']

    def prepare(self, actor, **arguments): return self._call('prepare', actor, **arguments)
    def get(self, actor, job_id): return self._call('get', actor, job_id=job_id)
    def by_command(self, actor, command_id): return self._call('by_command', actor, command_id=command_id)
    def list_jobs(self, actor, **filters): return self._call('list_jobs', actor, **filters)
    def record_receipt(self, actor, job_id, expected_revision, receipt):
        return self._call('record_receipt', actor, job_id=job_id, expected_revision=expected_revision, receipt=receipt)
    def record_sync_error(self, actor, job_id, expected_revision, code, outcome_unknown=False):
        return self._call('record_sync_error', actor, job_id=job_id, expected_revision=expected_revision, code=code, outcome_unknown=outcome_unknown)
    def output(self, actor, part_id): return self._call('output', actor, part_id=part_id)
    def inspect(self, actor, part_id, expected_output_digest):
        return self._call('inspect', actor, part_id=part_id, expected_output_digest=expected_output_digest)
    def quality(self, actor, design_run_id, batch_id, owner_job_id=''):
        return self._call('quality', actor, design_run_id=design_run_id, batch_id=batch_id, owner_job_id=owner_job_id)
    def pending(self, now, cursor='', limit=50): return self._call('pending', now=float(now), cursor=cursor, limit=limit)
    def sync_receipt(self, job_id, expected_revision, receipt):
        return self._call('sync_receipt', job_id=job_id, expected_revision=expected_revision, receipt=receipt)
    def sync_error(self, job_id, expected_revision, code):
        return self._call('sync_error', job_id=job_id, expected_revision=expected_revision, code=code)
