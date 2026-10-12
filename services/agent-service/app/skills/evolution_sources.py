"""只从服务器执行轨迹提取优化来源；不接受客户端提交的失败结论。"""
from collections import defaultdict
from collections.abc import Mapping
import json

from app.harness.trace import safe_trace_value


def source_records(trace, registry):
    if trace is None:
        return []
    records = trace.list(limit=500)
    if getattr(trace, 'storage_error', ''):
        return []
    grouped = defaultdict(list)
    for record in records:
        if record.get('trace_id'):
            grouped[str(record['trace_id'])].append(record)
    sources = []
    for record in reversed(records):
        if record.get('event') != 'agent_completed' or not record.get('trace_record_id') or not record.get('trace_id'):
            continue
        group = grouped[str(record['trace_id'])]
        if any(str(r.get('type', '')).startswith(('expert', 'skill_evolution')) or
               r.get('test_id') or r.get('expert_test_id') or
               'expert' in str((r.get('context') or {}).get('run_type', '')).lower()
               for r in group if isinstance(r.get('context', {}), Mapping)):
            continue
        agent = str(record.get('agent') or record.get('name') or '')
        if not agent or not (registry.root / agent).is_dir() or agent.startswith('.') or '/' in agent or '\\' in agent:
            continue
        output = record.get('output')
        if not isinstance(output, Mapping):
            continue
        output = output.get('output') if isinstance(output.get('output'), Mapping) else output
        findings = output.get('validation_errors') or output.get('validation_findings') or []
        if output.get('status') not in {'completed', 'fallback', 'failed', 'insufficient_evidence'}:
            continue
        if not findings and output.get('status') not in {'fallback', 'insufficient_evidence'}:
            continue
        error = str(output.get('error') or '').lower()
        if error or any(token in str(findings).lower() for token in
                        ('http ', 'http error', 'timeout', '超时', '模型不可用', '未配置', '连接失败', '余额')):
            continue
        names = output.get('active_skills') or []
        if isinstance(names, str):
            names = names.split('+')
        if not names:
            names = [r.get('skill') or (r.get('context') or {}).get('skill')
                     for r in group if r.get('agent') == agent and isinstance(r.get('context', {}), Mapping)]
        for name in dict.fromkeys(str(n) for n in names if n):
            definition = registry.get(agent, name)
            if definition is None:
                continue
            facts = {key: output[key] for key in
                     ('summary', 'diagnosis', 'status', 'confidence', 'evidence', 'validation_errors',
                      'validation_findings', 'stop_reason', 'requires_human_review') if key in output}
            sources.append({'source_id': str(record['trace_record_id']), 'trace_id': str(record['trace_id']),
                            'task_id': str(record.get('task_id') or ''), 'agent': agent, 'name': definition.name,
                            'timestamp': str(record.get('timestamp') or ''),
                            'facts': json.dumps(safe_trace_value(facts), ensure_ascii=False)[:6000]})
    return sources
