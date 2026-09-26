"""Pre-execution policy for controlled Runtime autonomy.

This boundary authorizes canonical Actions, not business Agent internals.
An Agent recommendation cannot grant approval: approval is read only from
the trusted invocation state supplied to Runtime.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Mapping

from .action import ActionModel, ActionType
from .capability import CapabilityRegistry


class PolicyStatus(str, Enum):
    ALLOW = "allow"
    REQUIRE_APPROVAL = "require_approval"
    DENY = "deny"


@dataclass(frozen=True)
class PolicyDecision:
    status: PolicyStatus
    reason: str
    risk_level: str = "normal"
    required_evidence: tuple[str, ...] = ()
    missing_evidence: tuple[str, ...] = ()


class RuntimePolicy:
    """Apply deterministic action-level authorization before dispatch."""

    _MUTATING_TOOLS = frozenset({
        "create_workorder", "update_workorder", "assign_workorder",
        "close_workorder", "reopen_workorder", "mark_repair_completed",
        "submit_repair_feedback", "ingest_knowledge",
    })
    _HIGH_RISK = frozenset({"high", "critical", "r3", "r4"})

    def __init__(self, capabilities: CapabilityRegistry | None = None) -> None:
        self.capabilities = capabilities or CapabilityRegistry()

    def evaluate(self, action: ActionModel, state: Mapping[str, Any] | None = None) -> PolicyDecision:
        current = dict(state or {})
        context = current.get("context")
        context = context if isinstance(context, Mapping) else {}
        payload = dict(action.payload)
        capability = action.required_capability or action.target
        canonical_capability = self.capabilities.canonical_name(capability)
        maintenance = current.get("maintenance_plan")
        maintenance = maintenance if isinstance(maintenance, Mapping) else {}
        risk_level = str(
            maintenance.get("risk_level")
            or context.get("risk_level")
            or payload.get("risk_level")
            or "normal"
        ).strip().lower()
        definition = self.capabilities.get(capability)
        is_mutation = (
            action.side_effect
            or bool(definition and definition.side_effect)
            or (action.action_type == ActionType.TOOL and action.target in self._MUTATING_TOOLS)
        )
        if is_mutation and not action.idempotency_key:
            return PolicyDecision(PolicyStatus.DENY, "idempotency_key_required", risk_level)

        if canonical_capability == "workorder_create":
            required = ("diagnosis", "knowledge", "cad", "maintenance_plan")
            missing = tuple(name for name in required if not self._workorder_evidence_ready(name, current))
            if missing:
                return PolicyDecision(
                    PolicyStatus.DENY, "missing_required_evidence", risk_level,
                    required_evidence=required, missing_evidence=missing,
                )

        if capability in {"quality_inspection", "quality_review"}:
            inspection_type = str(
                payload.get("inspection_type")
                or context.get("inspection_type")
                or ""
            ).strip().lower()
            if inspection_type and inspection_type != "part_quality":
                return PolicyDecision(PolicyStatus.DENY, "quality_scope_violation", risk_level)

        approval_needed = (
            risk_level in self._HIGH_RISK
            or bool(payload.get("requires_approval"))
            or bool(definition and definition.requires_approval)
        ) and is_mutation
        approved = context.get("approved_capabilities") or current.get("approved_capabilities") or []
        if not isinstance(approved, (list, tuple, set)):
            approved = []
        approval_granted = bool(context.get("approval_granted") or current.get("approval_granted"))
        approved_names = {self.capabilities.canonical_name(str(item)) for item in approved}
        if approval_needed and not approval_granted and canonical_capability not in approved_names:
            return PolicyDecision(PolicyStatus.REQUIRE_APPROVAL, "approval_required", risk_level)
        return PolicyDecision(PolicyStatus.ALLOW, "policy_allow", risk_level)

    @staticmethod
    def _workorder_evidence_ready(name: str, state: Mapping[str, Any]) -> bool:
        value = state.get(name)
        if not isinstance(value, Mapping) or not value:
            return False
        if name == "maintenance_plan":
            return bool(value.get("workorder_ready")) and not bool(
                value.get("validation_findings") or value.get("validation_errors")
            )
        if name == "knowledge":
            return bool(value.get("documents") or value.get("evidence") or value.get("items"))
        if name == "cad":
            return bool(value.get("components") or value.get("parts") or value.get("drawings") or value.get("bom"))
        return True


__all__ = ["PolicyStatus", "PolicyDecision", "RuntimePolicy"]
