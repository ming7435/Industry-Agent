from app.harness.trace import TraceRecorder


def test_trace_recorder_filters_and_limits_records():
    trace = TraceRecorder(maxlen=2)
    trace.record(trace_id="t1", task_id="a", event="one")
    trace.record(trace_id="t2", task_id="b", event="two")
    trace.record(trace_id="t1", task_id="c", event="three")

    assert [item["event"] for item in trace.list()] == ["two", "three"]
    assert [item["event"] for item in trace.list(trace_id="t1")] == ["three"]
    assert [item["event"] for item in trace.list(task_id="b")] == ["two"]
