"""日志页性能读模型；模型计数与 Agent/工具事件分别统计，不重复相加。"""
from datetime import datetime, timezone, timedelta
import json
import math
import os
from urllib.request import Request, urlopen
from urllib.error import HTTPError


def _stamp(value):
    try:
        stamp = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
        return stamp if stamp.tzinfo else stamp.replace(tzinfo=timezone.utc)
    except (ValueError, TypeError):
        return None


def trace_metrics(recorder, window_minutes, now):
    query = getattr(recorder, 'list_run_index', recorder.list)
    try:
        records = query(limit=5000)
    except Exception:
        return {'available': False, 'message': 'Agent运行统计暂不可用'}
    cutoff = now - timedelta(minutes=window_minutes)
    selected = [row for row in records if (stamp := _stamp(row.get('timestamp'))) and cutoff <= stamp <= now]
    result = {'available': True, 'source': 'trace_index', 'sample_limit': 5000,
              'partial': len(records) >= 5000 or bool(getattr(recorder, 'storage_error', ''))}
    for name, category, identity in (('agents', 'agent', 'agent_run_id'), ('tools', 'tool', 'tool_call_id')):
        terminal = {}
        for index, row in enumerate(selected):
            event = row.get('event', '')
            if row.get('type') != category or event not in {category + suffix for suffix in ('_completed', '_error', '_failed', '_timeout')}:
                continue
            key = row.get(identity) or (row.get('context') or {}).get(identity) or row.get('trace_record_id') or str(index)
            terminal[(row.get('trace_id'), key)] = row
        completed = sum(row.get('event') == category + '_completed' and not row.get('error') for row in terminal.values())
        count = len(terminal)
        durations = []
        for row in terminal.values():
            value = row.get('elapsed_ms')
            if value is None and type(row.get('execution_time')) in (int, float):
                value = row['execution_time'] * 1000
            if type(value) in (int, float) and math.isfinite(value) and value >= 0:
                durations.append(value)
        result[name] = {'completed': completed, 'failed': count - completed,
                        'success_rate': completed / count if count else None,
                        'average_ms': sum(durations) / len(durations) if durations else None}
    return result


def runtime_metrics(recorder, window_minutes=15):
    now = datetime.now(timezone.utc)
    model = {'available': False, 'message': '模型监控尚未配置或暂不可用'}
    base = os.getenv('MODEL_SERVICE_BASE_URL', '').rstrip('/')
    if base:
        try:
            request = Request(base + '/internal/metrics?window_minutes=' + str(window_minutes), headers={'Accept': 'application/json'})
            with urlopen(request, timeout=2) as response:
                value = json.loads(response.read(1024 * 1024).decode('utf-8'))
            if isinstance(value, dict) and value.get('available') is True and value.get('scope') == 'model_service_process':
                model = value
        except HTTPError as error:
            error.close()
        except Exception:
            # 地址、凭据和提供方错误体不能进入页面。监控失败不触发业务重试。
            pass
    return {'generated_at': now.isoformat(), 'window_minutes': window_minutes, 'model': model,
            'agent': trace_metrics(recorder, window_minutes, now)}
