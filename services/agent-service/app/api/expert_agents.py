"""Bounded, read-only Agent invocation statistics for the expert overview."""
from collections.abc import Mapping
from datetime import datetime, timedelta, timezone

from app.harness.agent_index import agent_attempt_key
from app.skills.management import AGENTS


def _stamp(value):
    try:
        stamp = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        return stamp.replace(tzinfo=timezone.utc) if stamp.tzinfo is None else stamp.astimezone(timezone.utc)
    except (ValueError, TypeError):
        return datetime.min.replace(tzinfo=timezone.utc)


def _outcome(record):
    event = record.get('event')
    if event == 'agent_started':
        return 'running'
    if event != 'agent_completed' or record.get('error'):
        return 'failed'
    output = record.get('output')
    output = output if isinstance(output, Mapping) else {}
    if isinstance(output.get('output'), Mapping):
        output = output['output']
    status = output.get('status')
    if status in {'waiting_approval', 'waiting_for_personnel', 'awaiting_verification', 'awaiting_repair', 'not_tested'}:
        return 'pending'
    if status in {'failed', 'fail', 'error'}:
        return 'failed'
    validation = output.get('validation')
    if (status in {'blocked', 'needs_input', 'insufficient_evidence', 'insufficient_data', 'insufficient_engineering_data', 'fallback', 'review', 'rejected'}
            or output.get('intent') in {'unknown','need_more_context'}
            or output.get('success') is False or output.get('workorder_ready') is False
            or output.get('validation_errors') or output.get('validation_findings') or output.get('failed_checks')
            or isinstance(validation, Mapping) and any(validation.get(key) is False for key in ('valid', 'pass', 'passed'))):
        return 'blocked'
    if output.get('error'):
        return 'failed'
    return 'completed'


def expert_agent_metrics(trace, *, now=None):
    live_clock = now is None
    now = now or datetime.now(timezone.utc)
    start = now - timedelta(hours=24)
    base = {'source': 'agent_trace', 'window_start': start.isoformat(), 'window_end': now.isoformat(),
            'sample_limit': 5000}
    if trace is None:
        return {**base, 'available': False, 'partial': False, 'items': []}
    try:
        snapshot = getattr(trace, 'agent_index_snapshot', None)
        if callable(snapshot):
            records, live, failed_days, incomplete = snapshot(limit=5000)
        else:
            records, live, failed_days, incomplete = trace.list_agent_index(limit=5000), {}, set(), False
    except Exception:
        return {**base, 'available': False, 'partial': False, 'items': []}
    if live_clock:
        # The snapshot includes lifecycle events that arrive during a database
        # read, so its window must end after that read rather than before it.
        now = datetime.now(timezone.utc)
        start = now - timedelta(hours=24)
        base.update(window_start=start.isoformat(), window_end=now.isoformat())
    attempts = {}
    lifecycle = {'agent_started', 'agent_completed', 'agent_error', 'agent_failed', 'agent_timeout'}
    for record in records:
        if record.get('event') not in lifecycle or not start <= _stamp(record.get('timestamp')) <= now:
            continue
        context = record.get('context') if isinstance(record.get('context'), Mapping) else {}
        agent = str(record.get('agent') or context.get('agent') or record.get('name') or '').lower()
        if agent not in AGENTS:
            continue
        identity = record.get('agent_run_id') or context.get('agent_run_id')
        if not identity:
            if record.get('event') == 'agent_started':
                continue
            identity = record.get('trace_record_id')
        if not identity:
            continue
        key = agent_attempt_key(record) or (agent, str(record.get('trace_id') or ''), str(identity))
        previous = attempts.get(key)
        if previous is None or (_stamp(record.get('timestamp')), record.get('event') != 'agent_started') >= (
                _stamp(previous.get('timestamp')), previous.get('event') != 'agent_started'):
            attempts[key] = record
    for key, record in live.items():
        if key[0] in AGENTS and key not in attempts and start <= _stamp(record.get('timestamp')) <= now:
            attempts[key] = record
    items = {agent: {'agent': agent, 'total': 0, 'completed': 0, 'failed': 0, 'blocked': 0,
                     'running': 0, 'pending': 0, 'unconfirmed': 0, 'completion_rate': None, 'last_failure_at': None}
             for agent in AGENTS}
    for key, record in attempts.items():
        agent = key[0]
        item = items[agent]
        outcome = ('running' if key in live else 'unconfirmed') if record.get('event') == 'agent_started' else _outcome(record)
        item['total'] += 1
        item[outcome] += 1
        if outcome in {'failed', 'blocked'} and _stamp(record.get('timestamp')) >= _stamp(item['last_failure_at']):
            item['last_failure_at'] = record.get('timestamp')
    for item in items.values():
        finished = item['completed'] + item['failed'] + item['blocked']
        item['completion_rate'] = round(item['completed'] / finished * 100, 1) if finished else None
    gap = any(start.date().isoformat() <= day <= now.date().isoformat() for day in failed_days)
    return {**base, 'available': True, 'partial': incomplete or gap or len(records) >= 5000 or bool(getattr(trace, 'storage_error', '')),
            'items': list(items.values())}
