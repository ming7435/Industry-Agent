from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.harness.trace import TraceRecorder


def test_trace_api_summary_omits_large_bodies_but_full_trace_keeps_them():
    trace = TraceRecorder()
    trace.record(type="tool", event="tool_completed", trace_id="TRACE-1", task_id="TASK-1",
                 tool_name="search_knowledge", context={"device_id": "D-1"},
                 arguments={"query": "主轴"}, output={"answer": "x" * 2000})
    client = TestClient(create_app(orchestrator=SimpleNamespace(container=SimpleNamespace(trace=trace))))

    summary = client.get("/api/trace?limit=10&summary=true").json()["trace"][0]
    full = client.get("/api/trace?trace_id=TRACE-1&limit=10").json()["trace"][0]

    assert summary["trace_id"] == "TRACE-1"
    assert summary["tool_name"] == "search_knowledge"
    assert "output" not in summary
    assert "context" not in summary
    assert full["output"]["answer"] == "x" * 2000
    assert full["context"]["device_id"] == "D-1"
