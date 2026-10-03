from datetime import datetime
from app.monitor.monitor import DeviceMonitor
from app.monitor.models import DeviceSample


def test_offline_or_control_only_stop_never_creates_fault_order_trigger():
    for status in ('offline', 'emergency_stop', 'e_stop', 'stopped'):
        result = DeviceMonitor().observe(DeviceSample(device_id='M1', timestamp=datetime.now(), status=status, temperature=40, vibration=0.2, rpm=0, metrics={'pressure': 1}))
        assert result.trigger is None
        assert result.status.value in {'unknown', 'stopped'}


def test_real_fault_or_active_alarm_still_triggers_when_stopped():
    for status in ('fault', 'emergency_stop'):
        result = DeviceMonitor().observe(DeviceSample(device_id='M1', timestamp=datetime.now(), status=status, alarm_code='F1', temperature=40, vibration=0.2, rpm=0, metrics={'pressure': 1}))
        assert result.trigger is not None
        assert result.status.value == 'fault'
