"""Read-time execution review of saved plans; never rewrites historical business facts."""
from collections.abc import Mapping
from shared.technician_confirmation import trusted_technician_confirmation
from .repair_profile import plan_profile_findings


def execution_review(order):
    plan = order.get('maintenance_plan_snapshot') or order.get('maintenance_plan') or {}
    diagnosis = order.get('diagnosis_snapshot') or plan.get('diagnosis') or {}
    findings = plan_profile_findings(plan, diagnosis)
    return {'required': bool(findings), 'findings': findings,
            'human_confirmed': trusted_technician_confirmation(order)}


def reviewed_workorder(order):
    result = dict(order)
    result['execution_review'] = execution_review(order)
    nested = order.get('workorder')
    if isinstance(nested, Mapping) and nested.get('workorder_id'):
        result['workorder'] = {**nested, 'execution_review': execution_review(nested)}
    return result
