from dataclasses import replace
from datetime import datetime, timedelta, timezone

from app.monitor.models import AlertLevel, DeviceSample
from app.monitor.monitor import DeviceMonitor
from app.monitor.factory_api import FactorySnapshotProvider


def test_same_fault_immediately_after_start_is_a_new_incident_without_a_normal_sample():
    monitor = DeviceMonitor()
    start = datetime.now(timezone.utc)
    sample = DeviceSample('M1', start, 40, .5, 1800, alarm_code='700006',
                          alarm_level=AlertLevel.HIGH, status='alarm', control_state='running')
    first = monitor.observe(sample)
    assert first.trigger is not None
    old_id = first.trigger.abnormal_event.event_id
    assert monitor.observe(replace(sample, timestamp=start + timedelta(seconds=1))).trigger is None
    # The normal instant between manual start and recurring alarm was missed.
    resumed = replace(sample, timestamp=start + timedelta(seconds=2), control_updated_at=start.timestamp() * 1000)
    again = monitor.observe(resumed)
    assert again.trigger is not None
    assert again.trigger.abnormal_event.event_id != old_id
    assert monitor.observe(replace(resumed, timestamp=start + timedelta(seconds=3))).trigger is None


def test_factory_provider_preserves_the_actual_start_timestamp():
    class Factory:
        def snapshot(self, device_id):
            return {'devices': [{'device_id': device_id, 'status': 'alarm', 'control_state': 'running',
                                 'control_updated_at': 1791468548454, 'metrics': {}}]}
    sample = FactorySnapshotProvider(Factory(), 'M1').read()
    assert sample.control_updated_at == 1791468548454
