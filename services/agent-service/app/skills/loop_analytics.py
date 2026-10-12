"""Skill Loop 的只读窗口统计；不调度 Agent、不修改技能或业务状态。"""
from collections import defaultdict
from collections.abc import Mapping
from datetime import datetime, timedelta, timezone
import json
import re

from app.harness.trace import safe_trace_value


VERDICTS = ('pass', 'fail', 'degraded', 'unknown', 'infrastructure_error')
_INFRA = re.compile(r'http\s*(?:error\s*)?[45]\d\d|timeout|timed out|connection|超时|连接|余额|未配置|模型不可用|llm_unavailable|model_unavailable', re.I)


def week_windows(now):
    if now.tzinfo is None:
        raise ValueError('周窗口时间必须有时区')
    china = timezone(timedelta(hours=8))
    local = now.astimezone(china)
    start = (local - timedelta(days=local.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    def window(left, right):
        return {'start': left.astimezone(timezone.utc).isoformat(), 'end': right.astimezone(timezone.utc).isoformat()}
    return {'week_id': start.date().isoformat(), 'previous': window(start - timedelta(days=7), start),
            'current': window(start, now)}


def _output(record):
    output = record.get('output') or {}
    if not isinstance(output, Mapping):
        return {}
    return output.get('output') if isinstance(output.get('output'), Mapping) else output


def _findings(output):
    validation = output.get('validation') or {}
    findings = output.get('validation_errors') or output.get('validation_findings') or (
        validation.get('errors') or validation.get('findings') if isinstance(validation, Mapping) else []) or []
    return [str(x)[:400] for x in findings[:6]] if isinstance(findings, list) else [str(findings)[:400]]


def _verdict(terminal):
    if terminal is None:
        return 'unknown'
    output = _output(terminal)
    findings = _findings(output)
    if terminal.get('event') == 'agent_timeout' or _INFRA.search(str(terminal.get('error') or output.get('error') or '') + ' '.join(findings)):
        return 'infrastructure_error'
    if output.get('error') or terminal.get('event') == 'agent_error':
        return 'unknown'
    if findings:
        return 'fail'
    if output.get('status') in {'fallback', 'insufficient_evidence'}:
        return 'degraded'
    validation = output.get('validation') or {}
    if isinstance(validation, Mapping) and any(validation.get(k) is False for k in ('pass', 'passed', 'valid')):
        return 'fail'
    if output.get('status') == 'completed' and (output.get('stop_reason') == 'validator_pass' or
            isinstance(validation, Mapping) and any(validation.get(k) is True for k in ('pass', 'passed', 'valid'))):
        return 'pass'
    return 'unknown'


def _is_trial(record):
    context = record.get('context') or {}
    return (str(record.get('type') or '').startswith(('expert', 'skill_evolution', 'skill_loop')) or
            bool(record.get('test_id') or record.get('expert_test_id')) or
            str(record.get('run_type') or (context.get('run_type') if isinstance(context, Mapping) else '') or '')
            in {'expert_trial', 'skill_replay', 'skill_loop'})


def aggregate(records, registry, complete):
    """按服务器 attempt 和实际指纹统计；缺归属/混合版本明确降为未知。"""
    groups, seen = defaultdict(list), set()
    for record in records:
        identity = record.get('trace_record_id')
        if not identity or identity in seen:
            continue
        seen.add(identity)
        key = (str(record.get('agent') or ''), str(record.get('agent_run_id') or 'unknown:' + identity))
        groups[key].append(record)
    result = {}
    for (agent, run_id), group in groups.items():
        if any(_is_trial(r) for r in group):
            continue
        terminals = [r for r in group if r.get('event') in {'agent_completed', 'agent_error', 'agent_timeout'}]
        terminal = terminals[0] if len(terminals) == 1 else None
        output = _output(terminal or {})
        definitions = {}
        for record in group:
            if record.get('event') == 'skill_observed' and record.get('skill'):
                name = str(record['skill'])
                fingerprint = str(record.get('skill_fingerprint') or '')
                version = str(record.get('skill_version') or 'unknown')
                if not re.fullmatch(r'[a-f0-9]{64}', fingerprint):
                    version, fingerprint = 'unknown', ''
                definitions[(name, version, fingerprint)] = record
        if not definitions and terminal:
            names = output.get('active_skills') or []
            if isinstance(names, str):
                names = names.split('+')
            for name in names:
                if isinstance(name, str) and name:
                    definitions[(name, 'unknown', '')] = {}
        for (name, version, fingerprint), observed in definitions.items():
            key = (agent, name, version, fingerprint)
            row = result.setdefault(key, {'agent': agent, 'name': name, 'version': version,
                'fingerprint': fingerprint, 'calls': 0, 'verdicts': dict.fromkeys(VERDICTS, 0),
                'complete': bool(complete), 'mixed_version_calls': 0, 'last_seen': '',
                'failure_ewma': None, 'last_gain': 'not_evaluated', 'sources': [],
                '_executed': set(), '_declared': set()})
            mixed = sum(n == name for n, _, _ in definitions) > 1
            verdict = _verdict(terminal)
            if version == 'unknown' or mixed or run_id.startswith('unknown:'):
                verdict = 'unknown'
            row['calls'] += 1
            row['verdicts'][verdict] += 1
            row['mixed_version_calls'] += int(mixed)
            timestamps = [str(r.get('timestamp') or '') for r in group]
            row['last_seen'] = max(row['last_seen'], *timestamps)
            row['_declared'].update(str(s) for s in (observed.get('declared_steps') or []))
            row['_executed'].update(str(r['step']) for r in group if r.get('event') == 'step_completed' and
                                    r.get('skill') == name and r.get('skill_fingerprint') == fingerprint and r.get('step'))
            if verdict in {'pass', 'fail', 'degraded'}:
                failure = float(verdict != 'pass')
                row['failure_ewma'] = failure if row['failure_ewma'] is None else 0.3 * failure + 0.7 * row['failure_ewma']
            if complete and verdict in {'fail', 'degraded'} and terminal and terminal.get('trace_id'):
                facts = {k: output[k] for k in ('status', 'summary', 'stop_reason', 'validation_errors', 'validation_findings') if k in output}
                if not _findings(facts) and _findings(output):
                    facts['validation_findings'] = _findings(output)
                row['sources'].append({'source_id': terminal['trace_record_id'], 'trace_id': terminal['trace_id'],
                    'task_id': terminal.get('task_id') or '', 'agent': agent, 'name': name,
                    'timestamp': terminal.get('timestamp') or '', 'version': version, 'fingerprint': fingerprint,
                    'facts': json.dumps(safe_trace_value(facts), ensure_ascii=False)[:6000]})
    for row in result.values():
        declared, executed = row.pop('_declared'), row.pop('_executed')
        executed = executed & declared
        row['coverage'] = {'executed': len(executed), 'declared': len(declared),
                           'ratio': len(executed) / len(declared) if declared else None}
        row['verdict_completeness'] = 1 - row['verdicts']['unknown'] / row['calls']
    return sorted(result.values(), key=lambda r: (r['agent'], r['name'], r['version'], r['fingerprint']))
