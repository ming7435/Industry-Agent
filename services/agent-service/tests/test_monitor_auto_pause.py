from datetime import datetime
from threading import Lock

from app.monitor.models import DeviceSample, MonitorResult, MonitorStatus
from monitor_web_server import MonitorWebState


class _Factory:
    def __init__(self, error: Exception | None = None):
        self.calls = []
        self.error = error

    def control_device(self, device_id, action, reason=""):
        self.calls.append((device_id, action, reason))
        if self.error:
            raise self.error
        return {
            "ok": True,
            "action": action,
            "device": {"device_id": device_id, "status": "stopped", "control_state": "stopped"},
        }


def _state(factory):
    state = MonitorWebState.__new__(MonitorWebState)
    state.lock = Lock()
    state.client = factory
    state.machine_controls = {}
    state._paused_event_keys = set()
    state.latest_result = None
    state.latest_results = {}
    state.latest_error = None
    state.result_count = 0
    state.alarm_event_count = 0
    state.alarm_event_counts = {}
    state._last_alarm_codes = {}
    state.diagnosis_task_count = 0
    state.trigger_history = []
    return state


def _result(status=MonitorStatus.FAULT, alarm_code="A-1"):
    sample = DeviceSample(
        device_id="MACHINE-1",
        timestamp=datetime.now(),
        temperature=90.0,
        vibration=4.0,
        rpm=1000.0,
        status="fault" if status == MonitorStatus.FAULT else "running",
        alarm_code=alarm_code,
    )
    return MonitorResult(
        device_id="MACHINE-1",
        status=status,
        current_sample=sample,
        observations=(),
        trigger=None,
    )


def test_confirmed_fault_does_not_control_device_automatically():
    factory = _Factory()
    state = _state(factory)
    result = _result()

    state._on_result(result)
    state._on_result(result)

    assert factory.calls == []
    assert state.machine_controls == {}


def test_warning_does_not_pause_device():
    factory = _Factory()
    state = _state(factory)

    state._on_result(_result(MonitorStatus.WARNING, "W-1"))

    assert factory.calls == []
    assert state.machine_controls == {}


def test_fault_control_failure_is_not_created_when_automatic_control_is_disabled():
    factory = _Factory(RuntimeError("factory offline"))
    state = _state(factory)

    state._on_result(_result())

    assert factory.calls == []
    assert state.machine_controls == {}
