"""A controlled stop must not create a new diagnosis from expected zero readings."""

from dataclasses import replace
from datetime import datetime, timedelta

import pytest

from app.monitor.models import DeviceSample
from app.monitor.monitor import DeviceMonitor


TURNING = "TRAK-TC820LTYSI-001"
BASE_TIME = datetime(2026, 10, 8, 10, 0)
# Factory simulator/factory.py STOPPED_ZERO_METRICS and STOPPED_DECAY_METRICS.
# Literal fixtures deliberately do not import the monitor's exclusion list.
STOPPED_METRICS = [
    (TURNING, {
        "spindle_rpm": [1200, 2600], "spindle_load_percent": [22, 48],
        "turret_servo_load_percent": [12, 38], "spindle_vibration_mm_s": [.5, 1.8],
        "live_tool_vibration_mm_s": [.4, 1.6], "x_axis_vibration_mm_s": [.2, .9],
        "z_axis_vibration_mm_s": [.2, .9], "hydraulic_pressure_psi": [680, 720],
        "chuck_pressure_psi": [230, 310], "quill_pressure_psi": [95, 130],
        "tailstock_clamp_pressure_psi": [670, 720], "coolant_pressure_psi": [64, 74],
        "lubrication_pressure_psi": [66, 74],
    }),
    ("LNS-QL-SERVO-80-S2-001", {
        "feed_speed_m_min": [0, 100], "pushing_torque_nm": [20, 167],
        "servo_ready_signal": [1, 1],
    }),
    ("ELITE-CS612-ROBOT-001", {
        "tool_speed_mm_s": [1, 250], "joint_speed_deg_s": [1, 90],
        "tcp_force_n": [1, 100], "elbow_force_n": [1, 100],
        "robot_power_w": [100, 600], "momentum_kg_m_s": [.1, 10],
        "joint_current_a": [.1, 5], "drag_start_speed_deg_s": [0, 1],
        "drag_start_torque_nm": [0, 1], "brake_released": [1, 1],
        "robot_power_on": [1, 1],
    }),
    ("RENISHAW-EQUATOR300-001", {
        "scan_speed_mm_s": [30, 160], "touch_speed_mm_s": [1, 8],
        "probe_deflection_um": [.5, 3.2], "probe_vibration_mm_s": [.02, .12],
        "equator_power_on": [1, 1],
    }),
]


def stopped_sample(device=TURNING, ranges=None, **changes):
    ranges = ranges or {"spindle_rpm": [1200, 2600], "spindle_load_percent": [22, 48]}
    return replace(DeviceSample(
        device_id=device, timestamp=BASE_TIME, temperature=40, vibration=0, rpm=0,
        status="stopped", control_state="stopped", cycle_state="stopped",
        control_reason="operator panel stop",
        fault_evidence={"source": "control_boundary", "active": False,
                        "evidence_status": "unavailable", "control_reason": "operator panel stop"},
        metrics={key: 0.0 for key in ranges},
        metric_details={key: {"normal_range": band} for key, band in ranges.items()},
    ), **changes)


@pytest.mark.parametrize("device,ranges", STOPPED_METRICS)
@pytest.mark.parametrize("state", ["stopped", "paused", "emergency_stop", "e_stop"])
def test_factory_expected_zero_readings_do_not_create_diagnosis(device, ranges, state):
    monitor = DeviceMonitor()
    sample = stopped_sample(device, ranges, status=state, control_state=state)
    for second in range(7):
        result = monitor.observe(replace(sample, timestamp=BASE_TIME + timedelta(seconds=second)))
        assert result.status.value == "stopped"
        assert result.observations == ()
        assert result.trigger is None


@pytest.mark.parametrize("changes", [
    {"control_state": None}, {"control_state": "running"}, {"status": "running"},
    {"control_reason": ""}, {"fault_evidence": {}},
    {"fault_evidence": {"source": "sensor", "active": False}},
    {"fault_evidence": {"source": "control_boundary", "active": True,
                        "evidence_status": "captured", "control_reason": "operator panel stop"}},
    {"fault_evidence": {"source": "control_boundary", "active": False,
                        "evidence_status": "captured", "control_reason": "operator panel stop"}},
    {"device_id": "UNKNOWN-MACHINE-001"},
])
def test_no_zero_exclusion_without_matching_known_control_boundary(changes):
    result = DeviceMonitor().observe(stopped_sample(**changes))
    assert any(item.key == "metric:spindle_rpm" for item in result.observations)
    assert result.trigger is not None


@pytest.mark.parametrize("code", ["700010", "700006", "F1"])
def test_active_alarm_remains_immediate_and_keeps_metric_evidence(code):
    result = DeviceMonitor().observe(stopped_sample(alarm_code=code))
    assert result.status.value == "fault"
    assert result.trigger is not None
    assert result.trigger.abnormal_event.alarm_code == code
    assert any(item.key == "metric:spindle_rpm" for item in result.observations)


@pytest.mark.parametrize("key,value,normal,alarm", [
    ("hydraulic_pressure_psi", 550, [680, 720], [470, 620]),
    ("spindle_temperature_c", 90, [40, 55], [80, 100]),
    ("spindle_vibration_mm_s", 6, [.5, 1.8], [4, 7]),
    ("unknown_pressure_psi", 0, [20, 30], [0, 5]),
    ("coolant_level_percent", 0, [60, 100], [0, 20]),
])
def test_stopped_nonzero_or_non_excluded_fault_still_triggers(key, value, normal, alarm):
    sample = stopped_sample()
    sample = replace(sample, metrics={**sample.metrics, key: value},
                     metric_details={**sample.metric_details, key: {
                         "normal_range": normal, "alarm_range": alarm}})
    monitor = DeviceMonitor()
    results = [monitor.observe(replace(sample, timestamp=BASE_TIME + timedelta(seconds=i)))
               for i in range(7)]
    assert results[-1].status.value == "fault"
    assert any(result.trigger for result in results)
    assert any(item.monitoring_point in {key, "spindle_bearing_housing"}
               for item in results[-1].observations)


@pytest.mark.parametrize("field,value", [("temperature", 90), ("vibration", 6)])
def test_stopped_legacy_temperature_and_vibration_are_still_checked(field, value):
    result = DeviceMonitor().observe(stopped_sample(**{field: value}))
    assert any(item.kind == field for item in result.observations)
    assert result.status.value == "fault"


def test_model_specific_zero_signal_does_not_hide_another_models_fault():
    sample = stopped_sample(ranges={"servo_ready_signal": [1, 1]})
    result = DeviceMonitor().observe(sample)
    assert [item.key for item in result.observations] == ["metric:servo_ready_signal"]


def test_real_alarm_then_controlled_stop_does_not_replace_original_event():
    emitted = []
    monitor = DeviceMonitor(on_trigger=emitted.append)
    sample = stopped_sample()
    first = monitor.observe(replace(sample, alarm_code="700010"))
    original = first.trigger.event_id
    for second in range(1, 8):
        result = monitor.observe(replace(sample, timestamp=BASE_TIME + timedelta(seconds=second)))
        assert result.status.value == "stopped"
        assert result.trigger is None
    assert [event.event_id for event in emitted] == [original]
    # A later genuine recurrence still creates its own lifecycle.
    recurrence = monitor.observe(replace(sample, timestamp=BASE_TIME + timedelta(seconds=8),
                                         alarm_code="700010"))
    assert recurrence.trigger.event_id != original


def test_recovery_then_operator_stop_does_not_create_a_replacement_event():
    emitted = []
    monitor = DeviceMonitor(on_trigger=emitted.append)
    sample = stopped_sample()
    original = monitor.observe(replace(sample, alarm_code="700010")).trigger.event_id
    running = replace(sample, timestamp=BASE_TIME + timedelta(seconds=1), status="running",
                      control_state="running", fault_evidence={}, metrics={
                          "spindle_rpm": 1800, "spindle_load_percent": 30})
    assert monitor.observe(running).status.value == "normal"
    stopped = monitor.observe(replace(sample, timestamp=BASE_TIME + timedelta(seconds=2)))
    assert stopped.status.value == "stopped"
    assert stopped.trigger is None
    assert [event.event_id for event in emitted] == [original]


def test_full_factory_no_fault_emergency_stop_evidence_does_not_create_collateral_events():
    sample = stopped_sample(device='ELITE-CS612-ROBOT-001', ranges={'robot_power_on': [1, 1]},
                            status='emergency_stop', control_state='emergency_stop', control_reason='整线故障停止')
    sample = replace(sample, fault_evidence={
        'source': 'control_boundary', 'active': False, 'evidence_status': 'unavailable',
        'control_reason': '整线故障停止', 'captured_at': 1791429600000,
        'status_before_stop': 'running', 'health_score': None, 'alarm_code': '',
        'alarm_codes': [], 'metrics': {'robot_power_on': 1.0},
    })
    result = DeviceMonitor().observe(sample)
    assert result.observations == ()
    assert result.trigger is None
    from dataclasses import asdict
    from shared.repair_recovery import repair_checks
    recovery = asdict(sample)
    recovery['checked_at'] = datetime.now().astimezone().isoformat()
    assert repair_checks(sample.device_id, recovery, 'prestart')['alarms_clear'] is True
    assert repair_checks(sample.device_id, recovery, 'poststart')['operational'] is False
