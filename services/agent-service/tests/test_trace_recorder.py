from app.harness.trace import TraceRecorder


def test_trace_recorder_filters_and_limits_records():
    trace = TraceRecorder(maxlen=2)
    trace.record(trace_id="t1", task_id="a", event="one")
    trace.record(trace_id="t2", task_id="b", event="two")
    trace.record(trace_id="t1", task_id="c", event="three")

    assert [item["event"] for item in trace.list()] == ["two", "three"]
    assert [item["event"] for item in trace.list(trace_id="t1")] == ["three"]
    assert [item["event"] for item in trace.list(task_id="b")] == ["two"]


def test_node_trace_records_task_and_trace_ids():
    from app.runtime.tracing import NodeTrace

    trace = TraceRecorder()
    node_trace = NodeTrace(trace)
    state = {"task_id": "TASK-1", "trace_id": "TRACE-1"}
    node_trace.start("route", state)
    node_trace.finish("route", state, {"route": "diagnosis"})

    assert trace.list()
    assert all(item["task_id"] == "TASK-1" for item in trace.list())
    assert all(item["trace_id"] == "TRACE-1" for item in trace.list())
