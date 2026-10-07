"""Standalone retrieval retains its root Agent lifecycle and Trace boundary."""
import pytest

from app.harness.runs import build_run_records


def event(event_name, agent="", *, trace="TRACE-MEMORY", task="TASK-MEMORY", **values):
    return {
        "timestamp": "2026-10-07T00:00:00+00:00", "trace_id": trace, "task_id": task,
        "type": "agent" if event_name.startswith("agent_") else "agent_step" if event_name.startswith("step_") else "tool",
        "event": event_name, "agent": agent, **values,
    }


def retrieval(agent="memory", **values):
    return event("step_completed", agent, skill="experience_retrieval", **values)


def only_rag(records):
    runs = build_run_records(records)
    assert len(runs) == 1
    run = runs[0]
    assert run["run_type"] == "rag"
    return run


def test_completed_memory_retrieval_retains_entire_real_lifecycle():
    records = [event("a2a_started", name="router->memory", timestamp="2026-10-07T00:00:00+00:00"),
               event("agent_started", "memory", agent_run_id="M-1", timestamp="2026-10-07T00:00:01+00:00")]
    for index, step in enumerate(["initialize", "load_skill", "validate_search", "fallback"]):
        for offset, name in enumerate(["step_started", "step_completed"]):
            records.append(event(name, "memory", name=step, node=step, step=step,
                                 skill="experience_retrieval", agent_run_id="M-1",
                                 timestamp=f"2026-10-07T00:00:{2 + index * 2 + offset:02d}+00:00"))
    records.extend([event("agent_completed", "memory", agent_run_id="M-1", timestamp="2026-10-07T00:00:10+00:00"),
                    event("a2a_completed", name="router->memory", timestamp="2026-10-07T00:00:11+00:00")])

    run = only_rag(records)

    assert run["status"] == "completed"
    assert run["event_count"] == 12
    assert run["phases"][0]["event_count"] == 12
    assert run["started_at"] == "2026-10-07T00:00:00+00:00"
    assert run["ended_at"] == "2026-10-07T00:00:11+00:00"


def test_memory_retrieval_remains_running_until_root_terminal():
    run = only_rag([event("agent_started", "memory", agent_run_id="M-1"), retrieval()])

    assert run["status"] == "running"
    assert run["event_count"] == 2
    assert run["phases"][0]["event_count"] == 2


@pytest.mark.parametrize(("terminal", "output", "error", "want"), [
    ("agent_error", {}, "retrieval unavailable", "error"),
    ("memory_error", {}, "memory unavailable", "error"),
    ("agent_completed", {"status": "blocked"}, "", "blocked"),
    ("agent_completed", {"success": False}, "", "error"),
])
def test_memory_root_failure_or_block_is_preserved(terminal, output, error, want):
    run = only_rag([event("agent_started", "memory", agent_run_id="M-1"), retrieval(),
                    event(terminal, "memory", agent_run_id="M-1", output=output, error=error)])

    assert run["status"] == want
    assert run["phases"][0]["status"] == want
    assert run["event_count"] == 3


@pytest.mark.parametrize(("root", "child"), [("memory", "knowledge"), ("knowledge", "memory")])
def test_child_completion_does_not_end_active_retrieval_root(root, child):
    run = only_rag([event("agent_started", root, agent_run_id="ROOT"),
                    event("agent_started", child, task="TASK-CHILD", agent_run_id="CHILD"),
                    retrieval(child, task="TASK-CHILD"),
                    event("agent_completed", child, task="TASK-CHILD", agent_run_id="CHILD")])

    assert run["status"] == "running"
    assert run["event_count"] == 4
    assert run["phases"][0]["event_count"] == 4
    assert run["task_ids"] == ["TASK-MEMORY", "TASK-CHILD"]


@pytest.mark.parametrize(("root", "child"), [("memory", "knowledge"), ("knowledge", "memory")])
def test_root_completion_ends_retrieval_after_nested_child(root, child):
    run = only_rag([event("agent_started", root, agent_run_id="ROOT"),
                    event("agent_started", child, agent_run_id="CHILD"),
                    event("agent_completed", child, agent_run_id="CHILD"),
                    event("agent_completed", root, agent_run_id="ROOT")])

    assert run["status"] == "completed"
    assert run["event_count"] == 4


def test_blocked_memory_root_is_not_replaced_by_completed_knowledge_child():
    run = only_rag([event("agent_started", "memory", agent_run_id="ROOT"),
                    event("agent_started", "knowledge", agent_run_id="CHILD"),
                    event("agent_completed", "knowledge", agent_run_id="CHILD", output={"success": True}),
                    event("agent_completed", "memory", agent_run_id="ROOT", output={"status": "blocked"})])

    assert run["status"] == "blocked"


def test_same_task_in_another_trace_does_not_add_unrelated_workorder_to_rag():
    records = [event("agent_started", "memory", trace="TRACE-A"), retrieval(trace="TRACE-A"),
               event("agent_completed", "memory", trace="TRACE-A"),
               event("agent_started", "workorder", trace="TRACE-B"),
               event("agent_completed", "workorder", trace="TRACE-B")]

    run = only_rag(records)

    assert run["run_id"] == "rag:TRACE-A"
    assert run["status"] == "completed"
    assert run["event_count"] == 3
    assert run["trace_ids"] == ["TRACE-A"]


def test_same_task_fault_trace_does_not_capture_standalone_retrieval_trace():
    records = [event("goal_parsed", "runtime", trace="TRACE-FAULT",
                     state_change={"source": "trigger", "raw": {"event_id": "EV-1"}}),
               event("agent_completed", "diagnosis", trace="TRACE-FAULT"),
               event("agent_started", "memory", trace="TRACE-RAG"), retrieval(trace="TRACE-RAG"),
               event("agent_completed", "memory", trace="TRACE-RAG")]

    runs = build_run_records(records)

    assert {run["run_type"] for run in runs} == {"fault", "rag"}
    assert next(run for run in runs if run["run_type"] == "fault")["trace_ids"] == ["TRACE-FAULT"]
    rag = next(run for run in runs if run["run_type"] == "rag")
    assert rag["trace_ids"] == ["TRACE-RAG"]
    assert rag["status"] == "completed"


def test_same_task_quality_trace_does_not_capture_standalone_retrieval_trace():
    records = [event("agent_completed", "quality", trace="TRACE-QUALITY"),
               event("agent_started", "memory", trace="TRACE-RAG"), retrieval(trace="TRACE-RAG"),
               event("agent_completed", "memory", trace="TRACE-RAG")]

    runs = build_run_records(records)

    assert {run["run_type"] for run in runs} == {"quality", "rag"}
    assert next(run for run in runs if run["run_type"] == "quality")["trace_ids"] == ["TRACE-QUALITY"]
    assert next(run for run in runs if run["run_type"] == "rag")["trace_ids"] == ["TRACE-RAG"]


def test_missing_trace_uses_task_to_retain_retrieval_lifecycle():
    run = only_rag([event("agent_started", "memory", trace=""), retrieval(trace=""),
                    event("agent_completed", "memory", trace="")])

    assert run["run_id"] == "rag:TASK-MEMORY"
    assert run["trace_ids"] == []
    assert run["event_count"] == 3
    assert run["status"] == "completed"


@pytest.mark.parametrize("run_type", ["fault", "quality"])
def test_retrieval_inside_business_run_does_not_create_independent_rag(run_type):
    first = event("goal_parsed", "runtime", state_change={"source": "trigger", "raw": {"event_id": "EV-1"}}) \
        if run_type == "fault" else event("agent_started", "quality")
    records = [first, event("agent_started", "memory"), retrieval(), event("agent_completed", "memory")]
    if run_type == "quality":
        records.append(event("agent_completed", "quality", output={"quality_check": {"status": "released"}}))

    runs = build_run_records(records)

    assert len(runs) == 1
    assert runs[0]["run_type"] == run_type
    assert runs[0]["event_count"] == (4 if run_type == "fault" else 5)


def test_memory_retry_success_does_not_inherit_previous_attempt_error():
    run = only_rag([event("agent_started", "memory", agent_run_id="M-1"), retrieval(agent_run_id="M-1"),
                    event("agent_error", "memory", agent_run_id="M-1", error="old failure"),
                    event("agent_started", "memory", agent_run_id="M-2"),
                    event("agent_completed", "memory", agent_run_id="M-2", output={"success": True})])

    assert run["status"] == "completed"
    assert run["error_count"] == 1


@pytest.mark.parametrize("terminal", ["agent_completed", "agent_error"])
def test_late_old_memory_attempt_cannot_end_current_attempt(terminal):
    run = only_rag([event("agent_started", "memory", agent_run_id="M-1"), retrieval(agent_run_id="M-1"),
                    event("agent_started", "memory", agent_run_id="M-2"),
                    event(terminal, "memory", agent_run_id="M-1", error="old failure" if terminal == "agent_error" else "")])

    assert run["status"] == "running"


def test_knowledge_root_retrieval_keeps_existing_completion_semantics():
    run = only_rag([event("agent_started", "knowledge", agent_run_id="K-1"),
                    event("tool_started", "knowledge", tool_name="search_knowledge"),
                    event("tool_completed", "knowledge", tool_name="search_knowledge"),
                    event("agent_completed", "knowledge", agent_run_id="K-1")])

    assert run["status"] == "completed"
    assert run["event_count"] == 4


def test_retrieval_tools_without_root_terminal_remain_running():
    run = only_rag([retrieval(), event("tool_completed", "memory", tool_name="search_knowledge")])

    assert run["status"] == "running"
