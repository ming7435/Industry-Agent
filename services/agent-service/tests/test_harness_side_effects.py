import pytest


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
