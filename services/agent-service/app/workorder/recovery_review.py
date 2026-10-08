"""Explicit review of an untracked stop event; never implies a workorder was repaired."""
from datetime import datetime, timezone
import hashlib
import json
import math

from shared.controlled_stop import expected_stopped_zero_metrics
from shared.repair_recovery import repair_checks

ACTION = 'fault_recovery_review'
SOURCE = 'explicit_user_fault_recovery'


def stop_outcome(fault, line):
    return (line.get('controls') or {}).get(
        fault['event_id'] + ':' + fault['device_id'] + ':emergency_stop') or {}


def stop_digest(outcome):
    return hashlib.sha256(json.dumps(outcome, sort_keys=True, ensure_ascii=False,
                                    separators=(',', ':')).encode('utf-8')).hexdigest()


def _number(value):
    return isinstance(value, (float, int)) and not isinstance(value, bool) and math.isfinite(value)


def _untrusted(value):
    if isinstance(value, dict):
        return any(value.get(k) is True for k in ('synthetic', 'is_synthetic', 'degraded')) or any(
            _untrusted(item) for item in value.values())
    return isinstance(value, (list, tuple)) and any(_untrusted(item) for item in value)


def review_checks(fault, line, sample, phase='prestart'):
    old = stop_outcome(fault, line)
    previous = old.get('snapshot') or {}
    context = {'device_id': fault['device_id'], 'alarm_code': previous.get('alarm_code'),
               'diagnosis_snapshot': previous}
    checks = repair_checks(fault['device_id'], sample, phase, order=context)
    checks['snapshot_trusted'] = not _untrusted(sample)
    original = previous.get('metrics') or {}
    metrics, details = sample.get('metrics') or {}, sample.get('metric_details') or {}
    old_details = previous.get('metric_details') or {}
    before_stop = (previous.get('fault_evidence') or {}).get('metrics') or original
    stopped_zeros = expected_stopped_zero_metrics(sample) if phase == 'prestart' else set()

    def normal_metric(key):
        detail = details.get(key) or {}
        normal = detail.get('normal_range') if isinstance(detail, dict) else None
        value = metrics.get(key)
        if not (_number(value) and isinstance(normal, (list, tuple)) and len(normal) == 2
                and all(_number(bound) for bound in normal) and normal[0] <= normal[1]):
            return False
        old_normal = (old_details.get(key) or {}).get('normal_range')
        old_value = before_stop.get(key)
        was_abnormal = (isinstance(old_normal, (list, tuple)) and len(old_normal) == 2
                        and all(_number(bound) for bound in old_normal) and _number(old_value)
                        and not old_normal[0] <= old_value <= old_normal[1])
        return normal[0] <= value <= normal[1] or (
            key in stopped_zeros and value == 0 and not was_abnormal)

    checks['original_fault_metrics'] = bool(original) and all(normal_metric(key) for key in original)
    return checks


def verified_untracked_review(fault, line):
    """A service-authenticated audit binds one human request to one saved stop."""
    old = stop_outcome(fault, line)
    proof = (line.get('controls') or {}).get(
        fault['event_id'] + ':' + fault['device_id'] + ':' + ACTION) or {}
    if (old.get('state') != 'verified' or old.get('device_id') != fault['device_id']
            or old.get('action') != 'emergency_stop'
            or proof.get('state') != 'verified' or proof.get('source') != SOURCE
            or proof.get('action') != ACTION or proof.get('event_id') != fault['event_id']
            or proof.get('device_id') != fault['device_id'] or proof.get('stop_digest') != stop_digest(old)
            or not all(isinstance(proof.get(k), str) and proof[k].strip()
                       for k in ('request_id', 'operator', 'feedback', 'reviewed_at'))):
        return False
    sample = proof.get('snapshot') or {}
    try:
        reviewed = datetime.fromisoformat(proof['reviewed_at'].replace('Z', '+00:00'))
        checked = datetime.fromisoformat(str(sample['checked_at']).replace('Z', '+00:00'))
        if not reviewed.tzinfo or not checked.tzinfo or not -30 <= (reviewed - checked).total_seconds() <= 30:
            return False
        if (reviewed - datetime.now(timezone.utc)).total_seconds() > 30:
            return False
    except (KeyError, TypeError, ValueError):
        return False
    checks = review_checks(fault, line, sample)
    # Freshness was checked against the saved review time; current samples are
    # checked again for every device before any restart.
    return all(passed for key, passed in checks.items() if key != 'recovery_fresh')
