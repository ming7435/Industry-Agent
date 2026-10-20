"""专家卡片按真实 Agent 尝试统计；不把受阻返回和子工具当成功。"""
from datetime import datetime, timezone

from app.api.expert_agents import expert_agent_metrics
from app.harness.trace import TraceRecorder
import pytest


NOW = datetime(2026, 10, 20, 4, tzinfo=timezone.utc)


def test_attempts_are_deduplicated_and_bound_to_agent():
    trace = TraceRecorder()
    def record(agent, attempt, event, **extra):
        trace.record(timestamp='2026-10-20T03:00:00Z', agent=agent, agent_run_id=attempt,
                     trace_id='trace', event=event, **extra)
    record('diagnosis', 'a', 'agent_started')
    record('diagnosis', 'a', 'agent_completed', output={'status': 'completed'})
    record('diagnosis', 'a', 'agent_completed', output={'status': 'completed'})
    record('diagnosis', 'b', 'agent_timeout')
    record('maintenance', 'c', 'agent_completed', output={'workorder_ready': False})
    record('workorder', 'd', 'agent_completed', output={'status': 'waiting_for_personnel'})
    record('cad', 'e', 'agent_started')
    record('knowledge', 'f', 'tool_completed')
    record('unknown', 'g', 'agent_completed')
    result = expert_agent_metrics(trace, now=NOW)
    assert result['available'] is True
    by_agent = {item['agent']: item for item in result['items']}
    assert by_agent['diagnosis']['total'] == 2
    assert by_agent['diagnosis']['completed'] == 1
    assert by_agent['diagnosis']['failed'] == 1
    assert by_agent['diagnosis']['completion_rate'] == 50
    assert by_agent['maintenance']['blocked'] == 1
    assert by_agent['maintenance']['completed'] == 0
    assert by_agent['workorder']['pending'] == 1
    assert by_agent['workorder']['completion_rate'] is None
    assert by_agent['cad']['running'] == 1
    assert by_agent['knowledge']['total'] == 0
    assert by_agent['knowledge']['completion_rate'] is None
    assert 'unknown' not in by_agent


def test_validation_failure_is_not_completed_and_latest_terminal_wins():
    trace = TraceRecorder()
    for event, stamp, output in [
        ('agent_completed', '2026-10-20T03:01:00Z', {'validation': {'valid': False}}),
        ('agent_started', '2026-10-20T03:00:00Z', {}),
    ]:
        trace.record(agent='cad', agent_run_id='a', trace_id='t', event=event, timestamp=stamp, output=output)
    value = next(item for item in expert_agent_metrics(trace, now=NOW)['items'] if item['agent'] == 'cad')
    assert value['blocked'] == 1
    assert value['running'] == 0
    assert value['last_failure_at'] == '2026-10-20T03:01:00Z'


def test_missing_storage_is_unavailable_and_old_events_are_excluded():
    assert expert_agent_metrics(None, now=NOW)['available'] is False
    trace = TraceRecorder()
    trace.record(agent='diagnosis', event='agent_error', agent_run_id='old', timestamp='2026-10-18T00:00:00Z')
    result = expert_agent_metrics(trace, now=NOW)
    assert all(item['total'] == 0 for item in result['items'])
    trace.storage_error = 'disk unavailable'
    assert expert_agent_metrics(trace, now=NOW)['partial'] is True


@pytest.mark.parametrize('output',[
    {'status':'blocked','error':'库存不可用'},
    {'intent':'unknown','validation_findings':[]},
    {'intent':'need_more_context'},
    {'status':'insufficient_engineering_data'},
])
def test_blocked_business_returns_stay_blocked(output):
    trace=TraceRecorder()
    trace.record(agent='router',agent_run_id='a',event='agent_completed',output=output,
                 timestamp='2026-10-20T03:00:00Z')
    value=next(item for item in expert_agent_metrics(trace,now=NOW)['items'] if item['agent']=='router')
    assert value['blocked']==1
    assert value['completed']==value['failed']==0


def test_agent_metrics_use_small_dedicated_projection():
    class Store:
        def list(self,**kwargs):
            raise AssertionError('must not read complete trace payloads')
        def list_agent_index(self,limit):
            return [{'agent':'diagnosis','agent_run_id':'a','event':'agent_completed',
                     'timestamp':'2026-10-20T03:00:00Z','output':{'status':'completed'}}]
    result=expert_agent_metrics(TraceRecorder(store=Store()),now=NOW)
    assert next(item for item in result['items'] if item['agent']=='diagnosis')['completed']==1
