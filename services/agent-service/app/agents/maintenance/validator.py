"""Maintenance Agent 输出校验。"""

from __future__ import annotations

from typing import Any, Mapping
from math import isfinite

from app.workorder.policy import maintenance_decision
from app.workorder.repair_profile import part_matches_profile, repair_profile


class MaintenancePlanValidator:
    """检查维修计划是否可以交给工单业务节点。"""

    STRUCTURAL_ACTIONS = ("拆", "更换", "安装", "轴承", "传感器", "泵", "主轴")

    @staticmethod
    def maintenance_required(plan: Mapping[str, Any]) -> bool:
        required, _ = maintenance_decision(
            diagnosis=plan.get("diagnosis") if isinstance(plan.get("diagnosis"), Mapping) else {},
            event=plan.get("event") if isinstance(plan.get("event"), Mapping) else {},
            plan=plan,
        )
        return required

    @classmethod
    def validate(cls, plan: Mapping[str, Any], knowledge: Mapping[str, Any], cad: Mapping[str, Any], inventory: Mapping[str, Any] | None = None) -> list[str]:
        findings: list[str] = []
        if not str(plan.get("repair_target") or "").strip():
            findings.append("维修对象不明确")
        if not plan.get("repair_steps"):
            findings.append("缺少可执行维修步骤")
        if not plan.get("safety") and not plan.get("safety_requirements"):
            findings.append("缺少安全要求")

        documents = list(knowledge.get("documents") or []) if isinstance(knowledge, Mapping) else []
        knowledge_evidence = list(knowledge.get("evidence") or []) if isinstance(knowledge, Mapping) else []
        if not documents and not knowledge_evidence:
            findings.append("缺少 SOP 或知识库证据")
        diagnosis = plan.get("diagnosis") if isinstance(plan.get("diagnosis"), Mapping) else {}
        evidence_status = str(diagnosis.get("evidence_status") or "").strip().lower()
        if evidence_status in {"", "insufficient", "pending", "unknown", "blocked"}:
            findings.append("诊断证据不足，不能生成可派工维修方案")
        if diagnosis.get("evidence_validated") is False or diagnosis.get("validated") is False:
            findings.append("诊断证据尚未通过校验")

        needs_cad = cls.requires_cad(plan)
        if needs_cad and not plan.get("cad_components"):
            findings.append("涉及拆装或部件操作但缺少 CAD/BOM 依据")
        elif needs_cad:
            profile = repair_profile(diagnosis)
            matched = [item for item in list(cad.get("components") or []) + list(cad.get("bom_items") or [])
                       if isinstance(item, Mapping) and part_matches_profile(profile, item)]
            if not any(str(item.get("component_id") or item.get("part_no") or "") in plan.get("cad_components", []) for item in matched):
                findings.append("CAD/BOM 依据未匹配本次故障维修对象")
        if needs_cad and isinstance(cad, Mapping) and (cad.get("synthetic") is True or cad.get("degraded") is True or str(cad.get("source") or "").endswith("-local")):
            findings.append("CAD 为演示或降级数据，不能作为正式维修依据")

        known_parts = cls._known_part_tokens(cad)
        inventory = inventory or {}
        inventory_tokens = cls._inventory_part_tokens(inventory)
        for part in plan.get("parts") or []:
            part_text = str(part)
            evidence_tokens = known_parts + inventory_tokens
            if any(char.isdigit() for char in part_text) and evidence_tokens and not any(token and token in part_text for token in evidence_tokens):
                findings.append("备件型号缺少工程依据：%s" % part_text)
            if any(char.isdigit() for char in part_text) and not evidence_tokens:
                findings.append("备件型号缺少工程依据：%s" % part_text)

        if plan.get("required_parts") and not inventory:
            findings.append("所需备件缺少库存依据")
        else:
            stock = inventory.get("parts") or inventory.get("stock") or []
            for required in plan.get("required_parts") or []:
                if not any(cls._available_required_part(item, required) for item in stock if isinstance(item, Mapping)):
                    findings.append("所需备件库存缺失或不可用：%s" % required)
        if plan.get("required_parts") and any(item.get("synthetic") is True for item in inventory.get("parts") or inventory.get("stock") or []):
            findings.append("备件库存为演示数据，不能作为正式派工依据")

        return cls._dedupe(findings)

    @staticmethod
    def requires_cad(plan: Mapping[str, Any]) -> bool:
        """Runtime 和方案校验共用工程依据规则，明确拆修动作不能声明豁免。"""
        steps_text = " ".join(str(item) for item in plan.get("repair_steps") or [])
        declared = bool(plan.get("cad_required")) if "cad_required" in plan else any(
            token in steps_text for token in MaintenancePlanValidator.STRUCTURAL_ACTIONS)
        return declared or any(token in steps_text for token in (
            "拆卸", "拆装", "拆解", "更换", "安装", "改接", "调整接线"))

    @staticmethod
    def _available_required_part(item: Mapping[str, Any], required: Any) -> bool:
        if isinstance(required, Mapping):
            identity = str(required.get("part_no") or required.get("part_id") or "").strip()
        else:
            identity = str(required or "").strip().split(" ", 1)[0]
        if not identity or identity not in [str(item.get(key) or "").strip() for key in ("part_id", "part_no")]:
            return False
        if item.get("available") is False:
            return False
        if item.get("stock") is not None:
            try:
                quantity = float(item["stock"])
                return not isinstance(item["stock"], bool) and isfinite(quantity) and quantity > 0
            except (ValueError, TypeError):
                return False
        return item.get("available") is True

    @staticmethod
    def workorder_ready(findings: list[str], plan: Mapping[str, Any]) -> bool:
        return (
            not findings
            and bool(plan.get("repair_steps"))
            and bool(plan.get("repair_target"))
            and MaintenancePlanValidator.maintenance_required(plan)
        )

    @classmethod
    def validate_result(cls, plan: Mapping[str, Any], knowledge: Mapping[str, Any], cad: Mapping[str, Any], inventory: Mapping[str, Any] | None = None) -> dict[str, Any]:
        findings = cls.validate(plan, knowledge, cad, inventory)
        return {
            "passed": not findings,
            "checks": {"input": True, "evidence": not findings, "confidence": not any("诊断证据" in item for item in findings), "consistency": not findings, "safety": not findings, "schema": True},
            "findings": list(findings),
            "missing": list(findings),
            "recommended_action": {"type": "replan", "target": "maintenance_replan"} if findings else {"type": "agent", "target": "workorder_create"},
        }

    @staticmethod
    def _known_part_tokens(cad: Mapping[str, Any]) -> list[str]:
        tokens: list[str] = []
        for item in list(cad.get("components") or []) + list(cad.get("bom_items") or []):
            for key in ("component_id", "part_no", "name"):
                value = str(item.get(key) or "").strip()
                if value:
                    tokens.append(value)
        return tokens

    @staticmethod
    def _inventory_part_tokens(inventory: Mapping[str, Any]) -> list[str]:
        tokens: list[str] = []
        for item in list(inventory.get("parts") or []) + list(inventory.get("stock") or []):
            for key in ("part_id", "part_no", "name"):
                value = str(item.get(key) or "").strip()
                if value:
                    tokens.append(value)
        return tokens

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values
