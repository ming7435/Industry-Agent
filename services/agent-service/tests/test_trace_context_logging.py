from app.harness.trace import TraceRecorder
from app.tools.registry import ToolRegistry


def test_tool_trace_keeps_execution_context_for_log_viewer():
    trace = TraceRecorder()
    registry = ToolRegistry(trace=trace)
    registry.mcp.handlers["get_device_status"] = lambda **_: {"status": "normal", "device_id": "D-1"}

    registry.execute(
        "get_device_status",
        {"device_id": "D-1"},
        context={"agent": "diagnosis", "step": "读取设备状态", "device_id": "D-1"},
    )

    called = next(item for item in trace.list() if item.get("event") == "tool_called")
    assert called["context"]["agent"] == "diagnosis"
    assert called["context"]["step"] == "读取设备状态"
    assert called["context"]["device_id"] == "D-1"
    assert called["output"]["status"] == "normal"
