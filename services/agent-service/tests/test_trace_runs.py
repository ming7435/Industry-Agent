from app.harness.runs import build_run_records
from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.harness.trace import TraceRecorder


def _event(event, *, trace="TRACE-FAULT", task="TASK-FAULT", agent="", node="", **extra):
    return {
        "timestamp": extra.pop("timestamp", "2026-09-27T08:00:00+00:00"),
        "type": extra.pop("type", "runtime"),
        "event": event,
        "trace_id": trace,
        "task_id": task,
        "agent": agent,
        "node": node,
        **extra,
    }


def test_fault_lifecycle_is_one_record_with_ordered_real_phases():
    records = [
        _event(
            "goal_parsed",
            state_change={
                "source": "trigger",
                "raw": {"event_id": "EVT-100", "device_id": "D-1", "alarm_code": "700001"},
            },
        ),
        _event("agent_completed", agent="diagnosis", node="diagnosis"),
        _event("agent_completed", agent="maintenance", node="maintenance"),
        _event("tool_completed", type="tool", agent="workorder", tool_name="create_workorder"),
        _event("agent_completed", agent="workorder", node="workorder"),
        _event("agent_completed", agent="report", node="report"),
        _event("agent_completed", agent="memory", node="memory"),
    ]

    runs = build_run_records(records)

    assert len(runs) == 1
    run = runs[0]
    assert run["run_type"] == "fault"
    assert run["run_id"] == "fault:EVT-100"
    assert run["device_id"] == "D-1"
    assert run["alarm_code"] == "700001"
    assert [phase["id"] for phase in run["phases"]] == [
        "monitor", "diagnosis", "maintenance", "workorder", "report", "experience"
    ]
    assert all(phase["status"] == "completed" for phase in run["phases"])
    assert run["status"] == "completed"


def test_quality_is_not_merged_into_fault_record():
    records = [
        _event("goal_parsed", state_change={"source": "trigger", "raw": {"event_id": "EVT-101", "device_id": "D-1"}}),
        _event("agent_completed", agent="diagnosis", node="diagnosis"),
        _event("agent_completed", agent="quality", node="quality", trace="TRACE-QUALITY", task="TASK-QUALITY"),
        _event("tool_completed", type="tool", agent="quality", node="quality", trace="TRACE-QUALITY", task="TASK-QUALITY", tool_name="create_quality_check"),
    ]

    runs = build_run_records(records)

    assert {run["run_type"] for run in runs} == {"fault", "quality"}
    fault = next(run for run in runs if run["run_type"] == "fault")
    quality = next(run for run in runs if run["run_type"] == "quality")
    assert [phase["id"] for phase in fault["phases"]] == [
        "monitor", "diagnosis", "maintenance", "workorder", "report", "experience"
    ]
    assert quality["phases"] == [{
        "id": "quality",
        "label": "质检",
        "status": "completed",
        "event_count": 2,
        "first_event_at": "2026-09-27T08:00:00+00:00",
        "last_event_at": "2026-09-27T08:00:00+00:00",
    }]
    assert quality["run_id"] == "quality:TRACE-QUALITY"


def test_incomplete_fault_is_running_and_unobserved_phases_stay_pending():
    records = [
        _event("goal_parsed", state_change={"source": "trigger", "raw": {"event_id": "EVT-102", "device_id": "D-2"}}),
        _event("agent_started", agent="diagnosis", node="diagnosis"),
        _event("tool_error", type="tool", agent="diagnosis", tool_name="search_knowledge", error="timeout"),
    ]

    run = build_run_records(records)[0]

    assert run["status"] == "error"
    assert run["phases"][0]["status"] == "completed"
    assert run["phases"][1]["status"] == "error"
    assert run["phases"][2]["status"] == "pending"
    assert run["error_count"] == 1


def test_runs_api_returns_aggregated_lifecycle_records():
    trace = TraceRecorder()
    trace.record(
        type="runtime",
        event="goal_parsed",
        trace_id="TRACE-API",
        task_id="TASK-API",
        state_change={"source": "trigger", "raw": {"event_id": "EVT-API", "device_id": "D-API"}},
    )
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace(trace=trace))))

    response = client.get("/api/runs")

    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 1
    assert payload["runs"][0]["run_id"] == "fault:EVT-API"
    assert payload["runs"][0]["phases"][0]["status"] == "completed"


def test_only_fault_rag_and_quality_runs_are_listed_and_events_stay_grouped():
    records = [
        _event(
            "goal_parsed",
            trace="TRACE-FAULT-2",
            task="TASK-FAULT-2",
            state_change={
                "source": "trigger",
                "raw": {"event_id": "EVT-200", "device_id": "D-2", "alarm_code": "700012"},
            },
        ),
        _event("agent_completed", trace="TRACE-FAULT-2", task="TASK-DIAG-2", agent="diagnosis", node="diagnosis"),
        _event("tool_completed", trace="TRACE-FAULT-2", task="TASK-WO-2", type="tool", agent="workorder", tool_name="create_workorder"),
        _event("tool_completed", trace="TRACE-RAG-2", task="TASK-RAG-2", type="tool", agent="rag", tool_name="search_knowledge", output={"matches": 2}),
        _event("agent_completed", trace="TRACE-RAG-2", task="TASK-RAG-2", agent="knowledge", node="rag"),
        _event("agent_completed", trace="TRACE-QUALITY-2", task="TASK-QUALITY-2", agent="quality", node="quality"),
        _event("tool_completed", trace="TRACE-QUALITY-2", task="TASK-QUALITY-2", type="tool", agent="quality", tool_name="create_quality_check"),
        # 手动打开的工单任务没有生命周期触发器，不能单独形成用户可见的运行记录。
        _event("tool_completed", trace="TRACE-MANUAL-2", task="TASK-MANUAL-2", type="tool", agent="workorder", tool_name="query_technicians"),
    ]

    runs = build_run_records(records)

    assert {run["run_type"] for run in runs} == {"fault", "rag", "quality"}
    assert len(runs) == 3
    fault = next(run for run in runs if run["run_type"] == "fault")
    rag = next(run for run in runs if run["run_type"] == "rag")
    assert fault["run_id"] == "fault:EVT-200"
    assert fault["event_count"] == 3
    assert set(fault["trace_ids"]) == {"TRACE-FAULT-2"}
    assert rag["run_id"] == "rag:TRACE-RAG-2"
    assert rag["event_count"] == 2
    assert rag["trace_ids"] == ["TRACE-RAG-2"]
