"""CAD Agent 工程证据校验。"""

from __future__ import annotations

from typing import Any, Mapping, Sequence

from app.contracts import CADComponent


class CADEngineeringValidator:
    """校验 CAD、BOM、图纸、位置和关系证据是否一致。"""

    @classmethod
    def validate(
        cls,
        components: list[CADComponent],
        bom_items: Sequence[Mapping[str, Any]],
        drawings: Sequence[Mapping[str, Any]],
        part_relations: Sequence[Mapping[str, Any]],
        assembly_relations: Sequence[Mapping[str, Any]],
        locations: Sequence[Mapping[str, Any]],
    ) -> list[str]:
        findings: list[str] = []
        component_ids = {item.component_id for item in components if item.component_id}
        part_numbers = {item.part_no for item in components if item.part_no}
        drawing_refs = {item.drawing_ref for item in components if item.drawing_ref}

        if not components:
            findings.append("未解析到工程部件")
        for component in components:
            if not component.part_no:
                findings.append("部件缺少零件号：%s" % component.component_id)
            if not component.drawing_ref:
                findings.append("部件缺少图纸引用：%s" % component.component_id)
            if not component.position:
                findings.append("部件缺少安装位置：%s" % component.component_id)

        for item in bom_items:
            part_no = str(item.get("part_no") or "")
            component_id = str(item.get("component_id") or "")
            if part_no and part_numbers and part_no not in part_numbers:
                findings.append("BOM 零件号未匹配 CAD 部件：%s" % part_no)
            if component_id and component_ids and component_id not in component_ids:
                findings.append("BOM 部件未匹配 CAD 部件：%s" % component_id)

        for item in drawings:
            drawing_id = str(item.get("drawing_id") or "")
            component_id = str(item.get("component_id") or "")
            if drawing_id and drawing_refs and drawing_id not in drawing_refs:
                findings.append("图纸引用未匹配 CAD 部件：%s" % drawing_id)
            if component_id and component_ids and component_id not in component_ids:
                findings.append("图纸部件未匹配 CAD 部件：%s" % component_id)

        for item in (*part_relations, *assembly_relations, *locations):
            component_id = str(item.get("component_id") or "")
            part_no = str(item.get("part_no") or "")
            if component_id and component_ids and component_id not in component_ids:
                findings.append("关系/位置中的部件未匹配 CAD 部件：%s" % component_id)
            if part_no and part_numbers and part_no not in part_numbers:
                findings.append("关系/位置中的零件号未匹配 CAD 部件：%s" % part_no)

        if components and not bom_items:
            findings.append("缺少 BOM 物料依据")
        if components and not drawings:
            findings.append("缺少图纸依据")
        if components and not assembly_relations:
            findings.append("缺少装配关系依据")
        if components and not locations:
            findings.append("缺少部件位置依据")
        return cls._dedupe(findings)

    @classmethod
    def validate_result(cls, *args: Any, **kwargs: Any) -> dict[str, Any]:
        findings = cls.validate(*args, **kwargs)
        return {
            "passed": not findings,
            "checks": {"input": True, "evidence": not findings, "confidence": True, "consistency": not findings, "safety": True, "schema": True},
            "findings": list(findings),
            "missing": list(findings),
            "recommended_action": {"type": "tool", "target": "fetch_engineering_record"} if findings else {"type": "continue"},
        }

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values
