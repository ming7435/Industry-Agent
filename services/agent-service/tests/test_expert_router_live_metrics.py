"""Real Router calls share the business runtime's expert monitoring recorder."""
from fastapi.testclient import TestClient

from app.agents.base import AgentResult
from app.agents.router.agent import RouterAgent
from app.api.expert_agents import expert_agent_metrics
from app.api.server import create_app
from app.graph.workflow import AgentOrchestrator


class ReadOnlyDispatcher:
    """Keep downstream I/O out of this Router integration test."""
    def dispatch(self, action, state):
        assert action.required_capability == 'document_search'
        return AgentResult(success=True, output={'status': 'completed', 'evidence': [{'id': 'manual'}]},
                           evidence=[{'id': 'manual'}], confidence=0.9)


def runtime():
    value = AgentOrchestrator()
    value.container.dispatcher = ReadOnlyDispatcher()
    assert isinstance(value.container.agents['router'], RouterAgent)
    assert value.container.harnesses['router'].agent is value.container.agents['router']
    assert value.container.harnesses['router'].trace is value.container.trace
    return value


def router_calls(value):
    return [event for event in value.container.trace.list() if event.get('agent') == 'router'
            and event.get('event') in {'agent_started', 'agent_completed', 'agent_error'}]


def router_metric(value):
    return next(item for item in expert_agent_metrics(value.container.trace)['items'] if item['agent'] == 'router')


def test_real_coordinator_router_is_recorded_once_in_its_task_trace():
    value = runtime()
    result = value.run_user('查询主轴维修手册')
    events = router_calls(value)
    assert [event['event'] for event in events] == ['agent_started', 'agent_completed']
    assert events[0]['agent_run_id'] == events[1]['agent_run_id']
    assert all(event['trace_id'] == result['trace_id'] and event['task_id'] == result['task_id'] for event in events)
    assert all(event['context']['routing_stage'] == 'planning' for event in events)
    metric = router_metric(value)
    assert metric['total'] == metric['completed'] == 1
    assert metric['running'] == metric['unconfirmed'] == 0


def test_question_permission_preflight_uses_same_router_without_bypassing_auth():
    value = runtime()
    response = TestClient(create_app(value)).post('/api/v1/agent/question',
        json={'user_text': '查询工单 WO-TEST001', 'context': {}})
    assert response.status_code == 401
    events = router_calls(value)
    assert [event['event'] for event in events] == ['agent_started', 'agent_completed']
    assert events[0]['agent_run_id'] == events[1]['agent_run_id']
    assert all(event['context']['run_type'] == 'routing_preflight' for event in events)
    assert all(event['context']['routing_stage'] == 'permission_preflight' for event in events)
    assert router_metric(value)['total'] == 1


def test_normal_question_counts_its_two_existing_router_invocations_once_each():
    value = runtime()
    response = TestClient(create_app(value)).post('/api/v1/agent/question',
        json={'user_text': '查询主轴维修手册', 'context': {}})
    assert response.status_code == 200
    events = router_calls(value)
    assert [event['event'] for event in events] == [
        'agent_started', 'agent_completed', 'agent_started', 'agent_completed']
    assert len({event['agent_run_id'] for event in events}) == 2
    assert [event['context']['routing_stage'] for event in events if event['event'] == 'agent_started'] == [
        'permission_preflight', 'planning']
    metric = router_metric(value)
    assert metric['total'] == metric['completed'] == 2
    assert metric['running'] == metric['unconfirmed'] == 0
