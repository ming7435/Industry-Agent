"""Production lifecycle and privacy are determined by authorized saved Backend facts."""
from collections import OrderedDict
import re
from collections.abc import Mapping

PHASES = (('preparation', '生产准备'), ('production', '模拟加工'), ('quality', '模拟检测'))
def production_job_id(record):
    containers = [record, *(record.get(key) or {} for key in ('context', 'runtime_context', 'execution_context', 'state_change'))]
    for container in containers:
        if not isinstance(container, Mapping): continue
        for key in ('job_id', 'trace_id', 'task_id'):
            value = container.get(key)
            if isinstance(value, str) and re.fullmatch(r'SIM-JOB-[a-f0-9]{64}', value): return value
    return ''

def is_production_record(record):
    return bool(production_job_id(record)) or record.get('run_type') == 'production_simulation' or any(
        isinstance(record.get(key), Mapping) and record[key].get('run_type') == 'production_simulation'
        for key in ('context', 'runtime_context', 'execution_context', 'state_change'))

def production_run_facts(backend, actor, job_ids):
    identities = list(dict.fromkeys(value for value in job_ids if value))
    result = {}
    for offset in range(0, len(identities), 200):
        result.update(backend.run_facts(actor, identities[offset:offset + 200]))
    return result

def build_production_runs(records):
    groups = OrderedDict()
    for record in records:
        identity = production_job_id(record)
        if identity: groups.setdefault(identity, []).append(record)
    runs = []
    for job_id, items in groups.items():
        timestamps = sorted(str(item.get('timestamp') or '') for item in items)
        runs.append({'run_id': 'production_simulation:' + job_id, 'job_id': job_id, 'run_type': 'production_simulation',
          'label': '模拟生产', 'status': 'blocked', 'trace_id': job_id, 'trace_ids': [job_id], 'task_id': job_id, 'task_ids': [job_id],
          'device_id': 'TRAK-TC820LTYSI-001', 'event_id': '', 'event_ids': [], 'alarm_code': '',
          'started_at': timestamps[0], 'ended_at': timestamps[-1], 'event_count': len(items),
          'tool_count': sum(item.get('type') == 'tool' for item in items), 'error_count': sum(bool(item.get('error')) for item in items),
          'phases': [{'id': key, 'label': label, 'status': 'pending', 'event_count': 0, 'error_count': 0} for key, label in PHASES]})
    return runs

def reconcile_production_runs(items, facts):
    result = []
    for item in items:
        if item.get('run_type') != 'production_simulation': result.append(item); continue
        fact = facts.get(item.get('job_id') or str(item.get('run_id') or '').removeprefix('production_simulation:'))
        phases = [dict(value) for value in item['phases']]
        if not fact:
            result.append({**item, 'status': 'blocked', 'phases': phases, 'fact_warning': '生产事实暂不可用'}); continue
        state, sync = fact.get('status'), fact.get('sync_status')
        phases[0]['status'] = 'completed'
        phases[1]['status'] = 'error' if sync == 'review' else 'blocked' if sync in {'outcome_unknown', 'unavailable'} or state in {'paused', 'interrupted', 'unknown'} else (
            'completed' if state == 'completed' and fact.get('output_saved') else 'running' if state == 'running' else 'blocked' if state == 'completed' else 'pending')
        inspection = fact.get('inspection_status')
        phases[2]['status'] = ('completed' if inspection in {'pass', 'fail'} else 'blocked' if inspection == 'insufficient_data' else 'error' if inspection == 'review' else 'pending') if phases[1]['status'] == 'completed' else 'pending'
        states = [phase['status'] for phase in phases]
        status = 'error' if 'error' in states else 'blocked' if 'blocked' in states else 'completed' if all(value == 'completed' for value in states) else 'running'
        result.append({**item, 'status': status, 'phases': phases, 'actor_id': fact.get('actor_id'),
            'design_run_id': fact.get('design_run_id'), 'batch_id': fact.get('batch_id'), 'part_id': fact.get('part_id'), 'inspection_status': inspection})
    return result
