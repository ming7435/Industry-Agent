"""Minimal lifecycle projection; never retain prompts, tools or generated documents."""
from collections.abc import Mapping

AGENT_EVENTS = ('agent_started', 'agent_completed', 'agent_error', 'agent_failed', 'agent_timeout')
OUTPUT_FIELDS = ('status', 'intent', 'success', 'workorder_ready')
FINDING_FIELDS = ('error', 'validation_errors', 'validation_findings', 'failed_checks')


def agent_index_record(record):
    context = record.get('context') if isinstance(record.get('context'), Mapping) else {}
    output = record.get('output') if isinstance(record.get('output'), Mapping) else {}
    if isinstance(output.get('output'), Mapping):
        output = output['output']
    validation = output.get('validation') if isinstance(output.get('validation'), Mapping) else {}
    return {**{key: record.get(key) for key in ('timestamp','trace_record_id','trace_id','event','name')},
            'agent': record.get('agent') or context.get('agent'),
            'agent_run_id': record.get('agent_run_id') or context.get('agent_run_id'),
            'error': bool(record.get('error')),
            'output': {**{key:output.get(key) for key in OUTPUT_FIELDS},
                       **{key:bool(output.get(key)) for key in FINDING_FIELDS},
                       'validation': {key:validation.get(key) for key in ('valid','pass','passed')}}}
