"""Recognize exact simulator readings that are zero at a no-fault stop boundary."""
import math

STOPPED_ZERO_METRICS = {
    'TRAK-TC820LTYSI-': frozenset({
        'spindle_rpm', 'spindle_load_percent', 'turret_servo_load_percent',
        'spindle_vibration_mm_s', 'live_tool_vibration_mm_s', 'x_axis_vibration_mm_s',
        'z_axis_vibration_mm_s', 'hydraulic_pressure_psi', 'chuck_pressure_psi',
        'quill_pressure_psi', 'tailstock_clamp_pressure_psi', 'coolant_pressure_psi',
        'lubrication_pressure_psi',
    }),
    'LNS-QL-SERVO-80-S2-': frozenset({'feed_speed_m_min', 'pushing_torque_nm', 'servo_ready_signal'}),
    'ELITE-CS612-ROBOT-': frozenset({
        'tool_speed_mm_s', 'joint_speed_deg_s', 'tcp_force_n', 'elbow_force_n',
        'robot_power_w', 'momentum_kg_m_s', 'joint_current_a', 'drag_start_speed_deg_s',
        'drag_start_torque_nm', 'brake_released', 'robot_power_on',
    }),
    'RENISHAW-EQUATOR300-': frozenset({
        'scan_speed_mm_s', 'touch_speed_mm_s', 'probe_deflection_um',
        'probe_vibration_mm_s', 'equator_power_on',
    }),
}


def expected_stopped_zero_metrics(sample):
    stopped = {'stopped', 'paused', 'emergency_stop', 'e_stop'}
    evidence = sample.get('fault_evidence') or {}
    reason = str(sample.get('control_reason') or '').strip()
    if not isinstance(evidence, dict) or (
        any(sample.get(key) for key in ('alarm_code', 'alarm_codes', 'active_alarms', 'alarms'))
        or str(sample.get('status') or '').lower() not in stopped
        or str(sample.get('control_state') or '').lower() not in stopped
        or not reason or evidence.get('source') != 'control_boundary'
        or evidence.get('active') is not False or evidence.get('evidence_status') != 'unavailable'
        or str(evidence.get('control_reason') or '').strip() != reason
        or any(evidence.get(key) for key in ('alarm_code', 'alarm_codes', 'active_alarms'))
        or evidence.get('health_score') is not None
        or set(evidence).difference({'source', 'active', 'evidence_status', 'control_reason',
            'captured_at', 'status_before_stop', 'health_score', 'alarm_code', 'alarm_codes', 'metrics'})
    ):
        return frozenset()
    if 'status_before_stop' in evidence and evidence['status_before_stop'] not in stopped | {'running', 'normal', 'idle', 'ready', 'standby'}:
        return frozenset()
    if 'captured_at' in evidence:
        stamp = evidence['captured_at']
        if isinstance(stamp, bool) or not isinstance(stamp, (int, float)) or not math.isfinite(stamp) or stamp <= 0:
            return frozenset()
    if 'metrics' in evidence:
        metrics = evidence['metrics']
        if not isinstance(metrics, dict) or not metrics or any(
            isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in metrics.values()
        ):
            return frozenset()
    device_id = str(sample.get('device_id') or '').upper()
    return next((metrics for prefix, metrics in STOPPED_ZERO_METRICS.items()
                 if device_id.startswith(prefix) and device_id[len(prefix):].isdigit()), frozenset())
