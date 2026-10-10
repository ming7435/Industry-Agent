"""Skill tools bound to an authorized action, target and immutable saved program."""
from shared.virtual_turning import require, VirtualProductionError
from .context import current_virtual_context
from .factory import VirtualFactoryError


def _read_factory(context, job):
    return context.factory.get(job['factory_job_id']) if job['factory_job_id'] else context.factory.by_command(job['factory_command_id'])


def _save_receipt(context, job, receipt):
    return context.backend.record_receipt(context.actor, job['job_id'], job['revision'], receipt)


def _failed(context, job, error, explicit_write=False):
    saved = context.backend.record_sync_error(context.actor, job['job_id'], job['revision'], error.code, error.outcome_unknown)
    if explicit_write and not error.outcome_unknown and error.status < 500:
        # A known rejection is still read back: some executors persist a pause
        # before returning 409. Only a validated receipt can clear the pending flag.
        try: saved = _save_receipt(context, saved, _read_factory(context, saved))
        except VirtualFactoryError: pass
        failure = VirtualProductionError(error.code, str(error), error.status)
        failure.outcome_unknown = saved['sync_status'] == 'outcome_unknown'
        raise failure from None
    return {**saved, 'error_message': str(error)}


def prepare_virtual_production(**arguments):
    context = current_virtual_context('prepare', arguments)
    require(set(arguments) <= {'command_id', 'run', 'setup', 'material', 'batch_id'}, 'unsupported_prepare_fields', status=422)
    return context.backend.prepare(context.actor, **arguments)


def submit_virtual_production(**arguments):
    context = current_virtual_context('submit', arguments)
    require(set(arguments) == {'job_id', 'digest'}, 'unsupported_submit_fields', status=422)
    job = context.backend.get(context.actor, arguments['job_id'])
    require(job['program_digest'] == arguments['digest'], 'program_digest_mismatch')
    require(job['sync_status'] != 'review', 'production_requires_review')
    if job['factory_job_id']:
        return sync_saved_job(context, job)
    # Arm durable reconciliation before the uncertain write crosses the network.
    job = context.backend.record_sync_error(context.actor, job['job_id'], job['revision'], 'receive_pending', True)
    try:
        try:
            receipt = context.factory.by_command(job['factory_command_id'])
        except VirtualFactoryError as error:
            if error.status != 404: raise
            receipt = context.factory.submit(job['factory_command_id'], job['program'])
        return _save_receipt(context, job, receipt)
    except VirtualFactoryError as error:
        if error.outcome_unknown:
            try: return _save_receipt(context, job, context.factory.by_command(job['factory_command_id']))
            except VirtualFactoryError: pass
        return _failed(context, job, error, explicit_write=True)


def start_virtual_production(**arguments):
    context = current_virtual_context('start', arguments)
    require(set(arguments) == {'job_id', 'digest'}, 'unsupported_start_fields', status=422)
    job = context.backend.get(context.actor, arguments['job_id'])
    require(job['program_digest'] == arguments['digest'], 'program_digest_mismatch')
    require(job['sync_status'] != 'review' and job['factory_job_id'], 'production_not_received')
    if job['sync_status'] == 'outcome_unknown' or job['status'] in {'running', 'completed'}:
        return sync_saved_job(context, job)
    require(job['status'] in {'received', 'paused', 'interrupted'}, 'production_cannot_start')
    job = context.backend.record_sync_error(context.actor, job['job_id'], job['revision'], 'start_pending', True)
    try:
        receipt = context.factory.start(job['factory_job_id'], job['program_digest'], context.actor['user_id'])
        return _save_receipt(context, job, receipt)
    except VirtualFactoryError as error:
        if error.outcome_unknown:
            try: return _save_receipt(context, job, _read_factory(context, job))
            except VirtualFactoryError: pass
        return _failed(context, job, error, explicit_write=True)


def sync_saved_job(context, job):
    try: return _save_receipt(context, job, _read_factory(context, job))
    except VirtualFactoryError as error: return _failed(context, job, error)


def sync_virtual_production(**arguments):
    context = current_virtual_context('sync', arguments)
    require(set(arguments) == {'job_id'}, 'unsupported_sync_fields', status=422)
    return sync_saved_job(context, context.backend.get(context.actor, arguments['job_id']))


def inspect_virtual_output(**arguments):
    context = current_virtual_context('inspect', arguments)
    require(set(arguments) == {'part_id', 'output_digest'}, 'unsupported_inspection_fields', status=422)
    return context.backend.inspect(context.actor, arguments['part_id'], arguments['output_digest'])


TOOLS = {function.__name__: function for function in [prepare_virtual_production, submit_virtual_production,
    start_virtual_production, sync_virtual_production, inspect_virtual_output]}
