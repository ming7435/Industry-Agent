"""Report Agent 的事实一致性和完整性校验。"""

from __future__ import annotations

from typing import Any, Mapping


class ReportValidator:
    """确保报告只引用已有结果，并区分计划、执行和验收事实。"""

    @classmethod
    def validate(
        cls,
        sections: Mapping[str, Any],
        source_refs: list[Mapping[str, Any]],
        report_type: str = "full_case_report",
    ) -> list[str]:
        findings: list[str] = []
        diagnosis = cls._mapping(sections.get("diagnosis"))
        plan = cls._mapping(sections.get("maintenance_plan"))
        order = cls._mapping(sections.get("workorder"))
        quality = cls._mapping(sections.get("quality"))

        if diagnosis and not cls._first(diagnosis, "fault", "summary", "diagnosis"):
            findings.append("诊断记录缺少故障事实")
        if plan and not cls._first(plan, "repair_target", "repair_steps"):
            findings.append("维修计划缺少维修对象或步骤")
        if order and not cls._first(order, "workorder_id"):
            findings.append("工单记录缺少 workorder_id")
        if quality:
            if "passed" not in quality:
                findings.append("质检记录缺少 QualityResult.passed")
            if order and quality.get("workorder_id") and order.get("workorder_id") != quality.get("workorder_id"):
                findings.append("质检记录与工单编号不一致")
        required_sections = {
            "diagnosis_report": ("diagnosis",),
            "maintenance_report": ("diagnosis", "maintenance_plan", "workorder"),
            "quality_report": ("workorder", "quality"),
            "incident_report": ("event",),
            "full_case_report": ("diagnosis", "maintenance_plan", "workorder", "quality"),
        }.get(report_type, ("diagnosis", "maintenance_plan", "workorder", "quality"))
        for section in required_sections:
            if not cls._mapping(sections.get(section)):
                findings.append("报告缺少 %s 必需记录" % section)

        expected_sections = [name for name, value in {
            "diagnosis": diagnosis,
            "maintenance_plan": plan,
            "workorder": order,
            "quality": quality,
            "event": cls._mapping(sections.get("event")),
        }.items() if value]
        referenced_sections = {str(item.get("section") or "") for item in source_refs if isinstance(item, Mapping)}
        for section in expected_sections:
            if section not in referenced_sections:
                findings.append("报告缺少 %s 的 source_refs" % section)
        if not source_refs:
            findings.append("报告缺少 source_refs")
        return cls._dedupe(findings)

    @staticmethod
    def _mapping(value: Any) -> dict[str, Any]:
        if hasattr(value, "model_dump"):
            return value.model_dump(mode="json")
        return dict(value or {}) if isinstance(value, Mapping) else {}

    @staticmethod
    def _first(value: Mapping[str, Any], *keys: str) -> Any:
        for key in keys:
            item = value.get(key)
            if item:
                return item
        return ""

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values
