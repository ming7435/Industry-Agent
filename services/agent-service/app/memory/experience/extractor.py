"""从工单和质检结果生成可检索经验。"""

from __future__ import annotations

from typing import Any, Dict
from uuid import uuid4


class ExperienceExtractor:
    def extract(
        self,
        workorder: Dict[str, Any],
        quality: Dict[str, Any],
        diagnosis: Dict[str, Any] | None = None,
        maintenance_plan: Dict[str, Any] | None = None,
        report: Dict[str, Any] | None = None,
    ) -> Dict[str, Any]:
        diagnosis = diagnosis or {}
        maintenance_plan = maintenance_plan or {}
        quality_findings = "；".join(quality.get("findings", [])) or "维修完成并通过质检"
        fault = diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or "设备异常"
        steps = "；".join(maintenance_plan.get("repair_steps", []))
        content_parts = ["故障：%s" % fault]
        if steps:
            content_parts.append("维修步骤：%s" % steps)
        content_parts.append("质检：%s" % quality_findings)
        return {
            "experience_id": "EXP-" + uuid4().hex[:10].upper(),
            "device_id": workorder.get("device_id") or diagnosis.get("device_id", ""),
            "title": workorder.get("title") or "%s维修经验" % fault,
            "content": "\n".join(content_parts),
            "passed": bool(quality.get("passed")),
            "source_workorder": workorder.get("workorder_id", ""),
            "source_report": report.get("report_id", "") if report else "",
            "collection": "maint_fault_events",
            "record_category": "case",
            "knowledge_type": "case",
            "fault": fault,
            "component": diagnosis.get("component", ""),
        }
