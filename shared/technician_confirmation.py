"""Read-only proof of Backend-issued technician feedback and confirmation.

The public API never accepts this receipt. It is issued by Backend after its
own actor checks and retained in the order's audit history. Manual virtual
restarts record human confirmation separately from device verification.
"""
from collections.abc import Mapping
from datetime import datetime, timezone
import hashlib
import json

from shared.repair_recovery import repair_checks


def confirmation_digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
        separators=(',', ':'), default=str).encode('utf-8')).hexdigest()


def trusted_technician_confirmation(order):
    """Return whether the stored receipt still authorizes this exact order context."""
    if not isinstance(order, Mapping) or order.get('status') not in {'completed', 'closed'}:
        return False
    receipt = order.get('technician_confirmation')
    plan = order.get('maintenance_plan_snapshot')
    feedback = order.get('repair_feedback')
    verification = order.get('repair_verification')
    if not all(isinstance(value, Mapping) for value in (receipt, plan, feedback, verification)):
        return False
    manual = (receipt.get('schema_version') == 2
              and receipt.get('confirmation_method') == 'technician_feedback_direct_restart')
    if ((not manual and (receipt.get('schema_version') != 1
                         or receipt.get('confirmation_method') != 'technician_feedback')) or not receipt.get('receipt_id')
            or receipt.get('source') != 'backend_team_repair_confirmation'
            or plan.get('plan_kind', 'repair') != 'repair'):
        return False
    if any(not order.get(key) or receipt.get(key) != order[key] for key in ('workorder_id', 'device_id')):
        return False
    # Legacy manual orders may have no event/plan identifier. Bind the exact
    # stored empty value too, so adding an identifier invalidates the old proof.
    if any(receipt.get(key) != str(order.get(key) or '') for key in ('event_id', 'plan_id')):
        return False
    actor = receipt.get('actor_id')
    if (not actor or actor != order.get('assignee') or actor != order.get('maintenance_confirmed_by')
            or feedback.get('operator') != actor or not isinstance(feedback.get('feedback'), str)
            or not feedback['feedback'].strip()):
        return False
    if (receipt.get('plan_snapshot_digest') != confirmation_digest(plan)
            or receipt.get('feedback_digest') != confirmation_digest(feedback)
            or receipt.get('diagnosis_snapshot_digest') != confirmation_digest(order.get('diagnosis_snapshot') or {})):
        return False
    try:
        timestamp = datetime.fromisoformat(str(receipt.get('confirmed_at')).replace('Z', '+00:00'))
        if timestamp.tzinfo is None or (timestamp - datetime.now(timezone.utc)).total_seconds() > 30:
            return False
    except (ValueError, TypeError, OverflowError):
        return False
    # The matching immutable audit entry prevents editing only the receipt fields.
    events = order.get('events')
    if not isinstance(events, (list, tuple)) or not any(isinstance(event, Mapping) and isinstance(event.get('payload'), Mapping)
               and event['payload'].get('technician_confirmation') == receipt
               for event in events):
        return False
    if manual:
        return (verification.get('source') == 'technician_confirmation'
                and verification.get('phase') == 'manual_confirmation'
                and verification.get('confirmed') is True
                and verification.get('automatic_verification') is False
                and verification.get('confirmed_at') == receipt['confirmed_at'])
    phase = verification.get('phase')
    recovery, stored_checks = verification.get('device_recovery'), verification.get('checks')
    if (verification.get('passed') is not True or verification.get('source') != 'device_recovery'
            or phase not in {'prestart', 'poststart'} or not isinstance(recovery, Mapping)
            or not isinstance(stored_checks, Mapping) or _untrusted(recovery)):
        return False
    current_checks = repair_checks(order['device_id'], recovery, phase)
    if not all(current_checks.values()) or any(stored_checks.get(key) is not True for key in current_checks):
        return False
    prestart = receipt.get('prestart_checks')
    if not isinstance(prestart, Mapping) or not all(prestart.get(key) is True for key in
            ('device_identity', 'ready_to_start', 'alarms_clear', 'metrics_available', 'interlocks_clear', 'recovery_fresh')):
        return False
    if phase == 'prestart' and receipt.get('prestart_snapshot_digest') != confirmation_digest(recovery):
        return False
    return True


def _untrusted(value):
    if isinstance(value, Mapping):
        return any(value.get(key) is True for key in ('synthetic', 'is_synthetic', 'degraded')) or any(
            _untrusted(item) for item in value.values())
    return isinstance(value, (tuple, list)) and any(_untrusted(item) for item in value)
