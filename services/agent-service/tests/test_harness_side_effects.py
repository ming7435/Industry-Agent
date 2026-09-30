import pytest
from contextlib import contextmanager


class _TraceTools:
    def __init__(self):
        self.contexts = []

    @contextmanager
    def trace_context(self, **values):
        self.contexts.append(values)
        yield


class _ObservedAgent:
    name = "diagnosis"

    def __init__(self):
        self.tools = _TraceTools()

    def run(self, payload):
        return {"event_id": payload["event_id"]}


class _WorkOrderAgent:
    name = "workorder"

    def run(self, _payload):
        raise RuntimeError("side effect failed")


class _ReadOnlyAgent:
    name = "diagnosis"

    def run(self, _payload):
        raise RuntimeError("read failed")


def test_side_effect_agents_ignore_retry_budget():
    from app.harness.runtime import AgentExecutionError, AgentHarness

    harness = AgentHarness(_WorkOrderAgent(), timeout_seconds=1, max_retries=5)
    with pytest.raises(AgentExecutionError):
        harness.execute_agent({"task_id": "TASK-WO"})
    assert len(harness.trace_records()) == 2


def test_read_only_agents_keep_retry_budget():
    from app.harness.runtime import AgentExecutionError, AgentHarness

    harness = AgentHarness(_ReadOnlyAgent(), timeout_seconds=1, max_retries=2)
    with pytest.raises(AgentExecutionError):
        harness.execute_agent({"task_id": "TASK-DIAG"})
    assert len(harness.trace_records()) == 6


@pytest.mark.parametrize("method", ["execute_once", "execute_agent"])
def test_both_harness_entrypoints_record_matching_agent_call(method):
    from app.harness.runtime import AgentHarness

    agent = _ObservedAgent()
    harness = AgentHarness(agent, timeout_seconds=1, max_retries=0)
    result = getattr(harness, method)({"event_id": "EVT-1", "task_id": "TASK-1", "trace_id": "TRACE-1"})

    assert result == {"event_id": "EVT-1"}
    started, completed = harness.trace_records()
    assert (started["event"], completed["event"]) == ("agent_started", "agent_completed")
    assert started["agent_run_id"] == completed["agent_run_id"]
    assert started["attempt"] == completed["attempt"] == 1
    assert completed["output"] == result
    assert agent.tools.contexts[0]["context"]["agent_run_id"] == started["agent_run_id"]
