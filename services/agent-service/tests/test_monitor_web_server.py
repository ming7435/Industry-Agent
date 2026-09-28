def test_monitor_web_server_imports_current_tool_registry() -> None:
    import monitor_web_server
    from app.tools.registry import ToolRegistry

    assert monitor_web_server.ToolRegistry is ToolRegistry


def test_monitor_web_state_does_not_control_machine_for_a_severe_result() -> None:
    from datetime import datetime
    from threading import Lock

    from app.monitor.models import DeviceSample, MonitorResult, MonitorStatus
    from monitor_web_server import MonitorWebState

    class FakeClient:
        def __init__(self):
            self.calls = []

        def control_device(self, device_id, action, reason=""):
            self.calls.append((device_id, action, reason))
            return {"ok": True, "action": action, "device": {"status": "emergency_stop"}}

    state = MonitorWebState.__new__(MonitorWebState)
    state.lock = Lock()
    state.latest_result = None
    state.latest_results = {}
    state.latest_error = None
    state.result_count = 0
    state.alarm_event_count = 0
    state.alarm_event_counts = {}
    state.diagnosis_task_count = 0
    state._last_alarm_codes = {}
    from collections import deque
    state.trigger_history = deque(maxlen=30)
    state.machine_controls = {}
    state.client = FakeClient()
    sample = DeviceSample(
        device_id="MACHINE-1",
        timestamp=datetime.now(),
        temperature=80,
        vibration=4,
        rpm=1000,
        status="alarm",
    )
    result = MonitorResult(
        device_id="MACHINE-1",
        status=MonitorStatus.FAULT,
        current_sample=sample,
        observations=(),
        trigger=None,
    )

    state._on_result(result)

    assert state.client.calls == []
    assert state.machine_controls == {}
