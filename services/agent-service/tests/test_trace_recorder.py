from app.harness.trace import TraceRecorder


def test_trace_recorder_filters_and_limits_records():
    trace = TraceRecorder(maxlen=2)
    trace.record(trace_id="t1", task_id="a", event="one")
    trace.record(trace_id="t2", task_id="b", event="two")
    trace.record(trace_id="t1", task_id="c", event="three")

    assert [item["event"] for item in trace.list()] == ["two", "three"]
    assert [item["event"] for item in trace.list(trace_id="t1")] == ["three"]
    assert [item["event"] for item in trace.list(task_id="b")] == ["two"]


def test_tool_trace_records_keep_current_task_and_trace():
    from app.tools.registry import ToolRegistry

    trace = TraceRecorder()
    registry = ToolRegistry(rag_client=object(), trace=trace)
    with registry.trace_context(task_id="TASK-TOOL", trace_id="TRACE-TOOL"):
        registry.execute("get_alarm_definition", {"alarm_code": "700223"})

    records = [item for item in trace.list() if item.get("type") == "tool"]
    assert records
    assert {(item.get("task_id"), item.get("trace_id")) for item in records} == {
        ("TASK-TOOL", "TRACE-TOOL")
    }
