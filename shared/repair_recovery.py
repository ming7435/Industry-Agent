"""维修预启动和运行复核共用规则；仅使用设备已有报警/指标，不猜测阈值。"""
from datetime import datetime, timezone
from collections.abc import Mapping
import json
import math
import os
import re
from shared.metric_ranges import classify_metric_range
from shared.controlled_stop import expected_stopped_zero_metrics

RUNNING = {'running', 'idle', 'ready', 'standby', 'normal', 'completed'}
STOPPED = {'stopped', 'paused', 'emergency_stop', 'e_stop'}


def _hydraulic_fault_metrics(device_id, order):
    """Use the saved TC820 hydraulic fault, never an unrelated machine's context."""
    if not isinstance(order, Mapping) or order.get('device_id') != device_id:
        return set()
    sources = [order]
    for source in sources:
        for key in ('diagnosis_snapshot', 'maintenance_plan_snapshot', 'diagnosis', 'raw', 'event',
                    'alarm_definition', 'realtime_snapshot'):
            nested = source.get(key)
            if (isinstance(nested, Mapping) and nested.get('device_id', device_id) in ('', device_id)
                    and not any(nested is item for item in sources)):
                sources.append(nested)
    model_values = [device_id] + [source.get(key, '') for source in sources
                                for key in ('device_model', 'model')]
    if not any(re.fullmatch(r'(?:TRAK)?TC820(?:LTY|LT|L)?SI(?:\d+)?',
                           re.sub(r'[^A-Z0-9]', '', str(value).upper())) for value in model_values):
        return set()
    codes = {str(source.get('alarm_code') or '').strip() for source in sources} - {''}
    for source in sources:
        definition = source.get('alarm_definition')
        if isinstance(definition, Mapping) and definition.get('alarm_code'):
            codes.add(str(definition['alarm_code']).strip())
    if '700010' not in codes:
        # A different explicit alarm cannot become hydraulic because its cause
        # or repair target happens to mention a normal hydraulic background value.
        if codes:
            return set()
        hydraulic_primary = False
        for source in sources:
            definition = source.get('alarm_definition')
            definition = definition if isinstance(definition, Mapping) else {}
            primary = str(definition.get('name') or definition.get('description')
                          or source.get('fault') or source.get('summary') or '').strip()
            if re.match(r'(?:700010[\s:：·]*)?(?:液压压力(?:未达到|未达标|不足|过低|丧失)|hydraulic pressure (?:not reached|low|loss))', primary, re.I):
                hydraulic_primary = True
                break
        if not hydraulic_primary:
            return set()
    required = {'hydraulic_pressure_psi'}
    original = json.dumps([{key: source[key] for key in (
        'evidence', 'metrics', 'metric_details', 'anomalies', 'history', 'metric', 'metric_name', 'related_metrics')
        if key in source} for source in sources], ensure_ascii=False, default=str)
    required.update(key for key in ('chuck_pressure_psi', 'quill_pressure_psi', 'tailstock_clamp_pressure_psi')
                    if key in original)
    return required


def _finite_number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def repair_checks(device_id, recovery, phase='poststart', *, order=None):
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
    stopped_zeros = expected_stopped_zero_metrics(recovery) if phase == 'prestart' and isinstance(metrics, dict) else frozenset()
    bad_metrics = any(isinstance(v, dict) and (v.get('abnormal') is True or v.get('status') in {'fault', 'alarm', 'critical'})
                      for key, v in details.items() if key not in stopped_zeros or metrics.get(key) != 0) if isinstance(details, dict) else True
    if isinstance(details, dict) and isinstance(metrics, dict):
        for key, detail in details.items():
            if key in stopped_zeros and metrics.get(key) == 0:
                continue
            if isinstance(detail, dict) and any(detail.get(k) is not None for k in ('normal_range', 'warn_range', 'alarm_range')):
                if key not in metrics or classify_metric_range(metrics[key], detail) is not None:
                    bad_metrics = True
    checks = {
        'device_identity': bool(device_id and recovery.get('device_id') == device_id),
        'ready_to_start' if phase == 'prestart' else 'operational': status in (RUNNING | STOPPED if phase == 'prestart' else RUNNING),
        'alarms_clear': not bool(recovery.get('alarm_code') or recovery.get('active_alarms') or recovery.get('alarm_codes') or recovery.get('alarms') or evidence.get('active') or bad_metrics),
        'metrics_available': valid_metrics,
        'interlocks_clear': recovery.get('interlocks_ok') is not False and recovery.get('safety_interlock_active') is not True,
        'recovery_fresh': fresh and not any(recovery.get(k) is True for k in ('stale', 'expired', 'is_stale')),
    }
    required_metrics = _hydraulic_fault_metrics(device_id, order)
    if required_metrics:
        def complete_metric(key):
            if not isinstance(metrics, Mapping) or not _finite_number(metrics.get(key)) or not isinstance(details, Mapping):
                return False
            detail = details.get(key)
            normal = detail.get('normal_range') if isinstance(detail, Mapping) else None
            return (isinstance(normal, (list, tuple)) and len(normal) == 2
                    and all(_finite_number(bound) for bound in normal) and normal[0] <= normal[1])
        checks['fault_metrics_complete'] = all(complete_metric(key) for key in required_metrics)
    return checks
