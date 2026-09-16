"""诊断、维修和质检报告 Agent。"""

from __future__ import annotations

from typing import Any
from uuid import uuid4

from app.validator import ReportResult


class ReportAgent:
    name = "report"

    def run(self, task: Any) -> ReportResult:
        payload = dict(task or {})
        diagnosis = payload.get("diagnosis") or {}
        plan = payload.get("maintenance_plan") or payload.get("plan") or {}
        order = payload.get("workorder") or {}
        quality = payload.get("quality") or {}
        device_id = str(diagnosis.get("device_id") or order.get("device_id") or "unknown")
        report_type = str(payload.get("report_type") or "maintenance")
        if report_type not in {"diagnosis", "maintenance", "quality", "daily"}:
            report_type = "maintenance"
        return ReportResult(
            report_id="RPT-" + uuid4().hex[:10].upper(),
            report_type=report_type,
            title="%s设备运维报告" % device_id,
            summary=str(diagnosis.get("fault") or diagnosis.get("summary") or "设备运维流程已执行"),
            sections={
                "diagnosis": diagnosis,
                "maintenance_plan": plan,
                "workorder": order,
                "quality": quality,
            },
        )
