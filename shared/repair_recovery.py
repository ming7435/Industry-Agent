"""维修预启动和运行复核共用规则；仅使用设备已有报警/指标，不猜测阈值。"""
from datetime import datetime, timezone
import math
import os
from shared.metric_ranges import classify_metric_range

RUNNING = {'running', 'idle', 'ready', 'standby', 'normal', 'completed'}
STOPPED = {'stopped', 'paused', 'emergency_stop', 'e_stop'}


def repair_checks(device_id, recovery, phase='poststart'):
    status = str(recovery.get('status') or recovery.get('control_state') or '').lower()
    timestamp = recovery.get('checked_at') or recovery.get('timestamp') or recovery.get('updated_at')
    fresh = False
    try:
        checked = datetime.fromisoformat(str(timestamp).replace('Z', '+00:00'))
        checked = checked if checked.tzinfo else checked.replace(tzinfo=timezone.utc)
        age = (datetime.now(timezone.utc) - checked).total_seconds()
        fresh = -float(os.getenv('RECOVERY_CLOCK_SKEW_SECONDS', '30')) <= age <= float(os.getenv('RECOVERY_MAX_AGE_SECONDS', '86400'))
        if recovery.get('expires_at'):
            expires = datetime.fromisoformat(str(recovery['expires_at']).replace('Z', '+00:00'))
            fresh = fresh and expires.replace(tzinfo=expires.tzinfo or timezone.utc) > datetime.now(timezone.utc)
    except (TypeError, ValueError, OverflowError):
        pass
    metrics = recovery.get('metrics') or {}
    valid_metrics = isinstance(metrics, dict) and bool(metrics) and all(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) for v in metrics.values())
    evidence = recovery.get('fault_evidence') or {}
    if not isinstance(evidence, dict):
        evidence = {'active': True}
    details = recovery.get('metric_details') or {}
    bad_metrics = any(isinstance(v, dict) and (v.get('abnormal') is True or v.get('status') in {'fault', 'alarm', 'critical'}) for v in details.values()) if isinstance(details, dict) else True
    if isinstance(details, dict) and isinstance(metrics, dict):
        for key, detail in details.items():
            if isinstance(detail, dict) and any(detail.get(k) is not None for k in ('normal_range', 'warn_range', 'alarm_range')):
                if key not in metrics or classify_metric_range(metrics[key], detail) is not None:
                    bad_metrics = True
    return {
        'device_identity': bool(device_id and recovery.get('device_id') == device_id),
        'ready_to_start' if phase == 'prestart' else 'operational': status in (RUNNING | STOPPED if phase == 'prestart' else RUNNING),
        'alarms_clear': not bool(recovery.get('alarm_code') or recovery.get('active_alarms') or recovery.get('alarm_codes') or recovery.get('alarms') or evidence.get('active') or bad_metrics),
        'metrics_available': valid_metrics,
        'interlocks_clear': recovery.get('interlocks_ok') is not False and recovery.get('safety_interlock_active') is not True,
        'recovery_fresh': fresh and not any(recovery.get(k) is True for k in ('stale', 'expired', 'is_stale')),
    }
