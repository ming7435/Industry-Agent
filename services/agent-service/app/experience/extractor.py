"""从工单和质检结果生成可检索经验。"""

from __future__ import annotations

from typing import Any, Dict
from uuid import uuid4

from app.alarm import AlarmCodeParser


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
        fault = diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or workorder.get("diagnosis_context", {}).get("diagnosis") or "设备异常"
        steps = "；".join(maintenance_plan.get("repair_steps", []))
        alarm_code = AlarmCodeParser.extract(
            diagnosis.get("alarm_code") or workorder.get("alarm_code") or diagnosis.get("alarm")
        )
        treatment = steps or str(workorder.get("repair_feedback") or "按维修工单执行现场处理")
        duration_seconds = self._duration_seconds(workorder)
        content_parts = ["故障：%s" % fault]
        if alarm_code:
            content_parts.append("报警码：%s" % alarm_code)
        if steps:
            content_parts.append("维修步骤：%s" % steps)
        if workorder.get("repair_feedback"):
            content_parts.append("现场反馈：%s" % workorder.get("repair_feedback"))
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
            "alarm_code": alarm_code,
            "diagnosis": str(fault),
            "treatment": treatment,
            "duration_seconds": duration_seconds,
        }

    @staticmethod
    def _duration_seconds(workorder: Dict[str, Any]) -> float:
        started = workorder.get("started_at") or workorder.get("created_at")
        ended = workorder.get("completed_at") or workorder.get("closed_at") or workorder.get("updated_at")
        if not started or not ended:
            return 0.0
        try:
            from datetime import datetime
            start = datetime.fromisoformat(str(started).replace("Z", "+00:00"))
            finish = datetime.fromisoformat(str(ended).replace("Z", "+00:00"))
            return max(0.0, (finish - start).total_seconds())
        except (TypeError, ValueError):
            return 0.0
