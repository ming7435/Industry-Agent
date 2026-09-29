"""控制 Runtime 自主执行的前置策略。

该边界授权规范 Action，而非业务 Agent 的内部操作。
Agent 的建议不能授予审批权限：审批信息仅从传给 Runtime 的可信调用状态中读取。
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Callable, Mapping

from .action import ActionModel, ActionType
from .capability import CAPABILITY_DEFINITIONS, CapabilityRegistry


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
    """派发前对动作执行确定性的授权检查。"""

    _MUTATING_TOOLS = frozenset({
        "create_workorder", "update_workorder", "assign_workorder",
        "close_workorder", "reopen_workorder", "mark_repair_completed",
        "submit_repair_feedback", "ingest_knowledge",
    })
    _HIGH_RISK = frozenset({"high", "critical", "r3", "r4"})

    def __init__(
        self,
        capabilities: CapabilityRegistry | None = None,
        approval_lookup: Callable[[str], Mapping[str, Any] | None] | None = None,
    ) -> None:
        self.capabilities = capabilities or CapabilityRegistry(CAPABILITY_DEFINITIONS)
        # 审批记录必须来自服务端持久化存储。客户端 context/event 中的同名字段不可信。
        self.approval_lookup = approval_lookup

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
        definition = self.capabilities.metadata_for(capability)
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

        if canonical_capability in {"quality_inspection", "quality_review"}:
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
        approval_granted = self._server_approval_matches(action, current, canonical_capability)
        if approval_needed and not approval_granted:
            return PolicyDecision(PolicyStatus.REQUIRE_APPROVAL, "approval_required", risk_level)
        return PolicyDecision(PolicyStatus.ALLOW, "policy_allow", risk_level)

    def _server_approval_matches(
        self,
        action: ActionModel,
        state: Mapping[str, Any],
        canonical_capability: str,
    ) -> bool:
        """只接受审批存储中绑定的同一 Action，不接受请求体自声明授权。"""

        if self.approval_lookup is None:
            return False
        resume = state.get("runtime_resume")
        if not isinstance(resume, Mapping):
            return False
        pending_id = str(resume.get("pending_id") or "").strip()
        if not pending_id:
            return False
        try:
            record = self.approval_lookup(pending_id)
        except Exception:
            return False
        if not isinstance(record, Mapping) or str(record.get("status") or "") != "resuming":
            return False
        approved_action = ActionModel.coerce(record.get("action"))
        if approved_action is None:
            return False
        approved_capability = approved_action.required_capability or approved_action.target
        if self.capabilities.canonical_name(approved_capability) != canonical_capability:
            return False
        # 指纹覆盖动作类型、目标、全部业务参数和幂等键；任何参数变化都重新审批。
        return approved_action.fingerprint == action.fingerprint

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
