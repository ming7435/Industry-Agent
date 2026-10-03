"""阶段合并只改变图调度，不改变子步骤、门禁和日志身份。"""

from types import SimpleNamespace

import pytest

from app.agents import base
from app.harness.trace import TraceRecorder


def chain(*nodes, **kwargs):
    factory = getattr(base, "chain_nodes", None)
    assert callable(factory), "缺少顺序阶段组合函数"
    return factory(*nodes, **kwargs)


def terminal(final, fallback):
    factory = getattr(base, "result_node", None)
    assert callable(factory), "缺少结果分支组合函数"
    return factory(final, fallback)


def test_chain_passes_incremental_state_without_mutating_input():
    seen = []

    def first(state):
        seen.append(state["input"])
        return {"value": 2, "route": "next"}

    def second(state):
        assert state["input"] == "原输入" and state["value"] == 2
        seen.append(state["value"])
        return {"value": 3, "output": "完成"}

    original = {"input": "原输入", "value": 1}
    result = chain(first, second)(original)
    assert result == {"value": 3, "route": "next", "output": "完成"}
    assert original == {"input": "原输入", "value": 1}
    assert seen == ["原输入", 2]


@pytest.mark.parametrize("route", ["fallback", "validate_relation"])
def test_chain_stops_on_explicit_gate_without_observing_stale_output(route):
    calls = []
    result = chain(lambda state: {"route": route}, lambda state: calls.append("observe") or {},
                   stop_routes=("fallback", "validate_relation"))({"old_observation": "上一轮"})
    assert result["route"] == route
    assert not calls


def test_chain_exception_stops_and_does_not_retry_write():
    calls = []

    def fail(state):
        calls.append("write")
        raise TimeoutError("写操作结果不确定")

    with pytest.raises(TimeoutError, match="结果不确定"):
        chain(fail, lambda state: calls.append("next") or {})({})
    assert calls == ["write"]


def test_chain_preserves_real_substep_trace_and_per_run_history():
    trace = TraceRecorder()
    nodes = [base.trace_skill_node("router", name, lambda state: {"route": "next"})
             for name in ("classify_intent", "extract_entities")]
    stage = chain(*nodes)
    initial = {"agent": SimpleNamespace(runtime_trace=trace), "task_id": "T-1", "trace_id": "R-1",
               "step_history": [{"step_id": "prior"}], "completed_steps": []}
    first = stage(initial)
    second = stage({**initial, "task_id": "T-2", "trace_id": "R-2"})
    assert [row["step_id"] for row in first["step_history"]] == ["prior", "classify_intent", "extract_entities"]
    assert len(first["completed_steps"]) == 2
    first["step_history"].append({"step_id": "first_only"})
    assert len(second["step_history"]) == 3
    assert initial["step_history"] == [{"step_id": "prior"}]
    assert [(row["name"], row["event"]) for row in trace.list(task_id="T-2", trace_id="R-2")] == [
        ("classify_intent", "step_started"), ("classify_intent", "step_completed"),
        ("extract_entities", "step_started"), ("extract_entities", "step_completed"),
    ]


@pytest.mark.parametrize("route,chosen", [("final", "final"), ("fallback", "fallback")])
def test_terminal_runs_only_the_selected_real_result_branch(route, chosen):
    trace = TraceRecorder()
    final = base.trace_skill_node("router", "final", lambda state: {"result": "成功"})
    fallback = base.trace_skill_node("router", "fallback", lambda state: {"result": "失败"})
    result = terminal(final, fallback)({"agent": SimpleNamespace(runtime_trace=trace), "route": route})
    assert result["result"] == ("成功" if chosen == "final" else "失败")
    assert [row["step_id"] for row in result["step_history"]] == [chosen]
    assert [row["name"] for row in trace.list() if row["event"] == "step_started"] == [chosen]
