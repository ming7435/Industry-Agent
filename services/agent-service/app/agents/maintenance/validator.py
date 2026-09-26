"""Maintenance Agent 输出校验。"""

from __future__ import annotations

from typing import Any, Mapping


class MaintenancePlanValidator:
    """检查维修计划是否可以交给工单业务节点。"""

    STRUCTURAL_ACTIONS = ("拆", "更换", "安装", "轴承", "传感器", "泵", "主轴")

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

        steps_text = " ".join(str(item) for item in plan.get("repair_steps") or [])
        needs_cad = any(token in steps_text for token in cls.STRUCTURAL_ACTIONS)
        if needs_cad and not plan.get("cad_components"):
            findings.append("涉及拆装或部件操作但缺少 CAD/BOM 依据")

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

        if plan.get("required_parts") and inventory and not any(item.get("available", True) for item in inventory.get("parts") or inventory.get("stock") or []):
            findings.append("所需备件库存不可用")

        return cls._dedupe(findings)

    @staticmethod
    def workorder_ready(findings: list[str], plan: Mapping[str, Any]) -> bool:
        return not findings and bool(plan.get("repair_steps")) and bool(plan.get("repair_target"))

    @classmethod
    def validate_result(cls, plan: Mapping[str, Any], knowledge: Mapping[str, Any], cad: Mapping[str, Any], inventory: Mapping[str, Any] | None = None) -> dict[str, Any]:
        findings = cls.validate(plan, knowledge, cad, inventory)
        return {
            "passed": not findings,
            "checks": {"input": True, "evidence": not findings, "confidence": True, "consistency": not findings, "safety": not findings, "schema": True},
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
