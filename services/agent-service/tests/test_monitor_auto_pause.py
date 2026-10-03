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


def test_unconfirmed_fault_sample_does_not_write_control():
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


def test_real_monitor_trigger_stops_line_and_control_only_stops_do_not_retrigger(monkeypatch):
    from collections import deque
    from concurrent.futures import Future, ThreadPoolExecutor
    from app.monitor.monitor import DeviceMonitor
    from app.monitor.line_control import LineController
    from test_line_control import Factory, Ledger
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    factory, ledger = Factory(), Ledger()
    state = _state(factory)
    state.line_controller = LineController(factory, ledger)
    state.control_executor = ThreadPoolExecutor(max_workers=1)
    # 外部诊断/模型调度是本测试的边界；监控判定和控制器都使用真实实现。
    class PendingDiagnosis:
        def submit(self, *args):
            return Future()
    state.diagnosis_executor = PendingDiagnosis()
    state._diagnosis_generation = 0
    state.diagnosis_pending = 0
    state.trigger_history = deque()
    monitor = DeviceMonitor(on_trigger=state._on_trigger)
    monitor.observe(DeviceSample(device_id='M1', timestamp=datetime.now(), status='fault', alarm_code='F1', temperature=40, vibration=0.2, rpm=0))
    state.control_executor.shutdown(wait=True)
    assert state.line_state['state'] == 'stopped'
    assert factory.calls == [('M1', 'emergency_stop'), ('M2', 'emergency_stop')]
    result = monitor.observe(DeviceSample(device_id='M2', timestamp=datetime.now(), status='emergency_stop', temperature=40, vibration=0.2, rpm=0))
    assert result.trigger is None
    assert state.diagnosis_pending == 1
