from app.monitor.control_policy import result_requires_emergency_stop
from app.monitor.models import AlertLevel, DeviceSample, MonitorResult, MonitorStatus
from datetime import datetime


def test_high_result_requires_an_emergency_stop():
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
    assert result_requires_emergency_stop(result) is True


def test_warning_result_does_not_stop_machine():
    sample = DeviceSample(
        device_id="MACHINE-1",
        timestamp=datetime.now(),
        temperature=50,
        vibration=1,
        rpm=1000,
        status="running",
    )
    result = MonitorResult(
        device_id="MACHINE-1",
        status=MonitorStatus.WARNING,
        current_sample=sample,
        observations=(),
        trigger=None,
    )
    assert result_requires_emergency_stop(result) is False
