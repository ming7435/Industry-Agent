"""Quality Agent 维修验收规则。"""

from __future__ import annotations

from typing import Any, Mapping


class QualityValidator:
    """把维修后验收条件收敛成确定性 PASS/FAIL。"""

    COMPLETED_STATUSES = {"completed", "repair_completed", "closed"}
    RECOVERED_DEVICE_STATUSES = {"running", "idle", "standby", "ready", "normal", "ok"}

    @classmethod
    def validate(
        cls,
        workorder: Mapping[str, Any],
        repair_check: Mapping[str, Any],
        device_status: Mapping[str, Any],
        sop_check: Mapping[str, Any],
        parameter_check: Mapping[str, Any],
        alarm_check: Mapping[str, Any] | None = None,
        workorder_check: Mapping[str, Any] | None = None,
        repair_feedback: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        failed: list[str] = []
        findings: list[str] = []

        compliance = dict(workorder_check or {})
        feedback_result = dict(repair_feedback or {})
        workorder_compliance = (
            bool(compliance.get("status_ok")) and bool(compliance.get("steps_complete"))
            if compliance
            else str(workorder.get("status") or "") in cls.COMPLETED_STATUSES
        )
        if not workorder_compliance:
            failed.append("workorder_not_completed")
            findings.append("工单未处于 completed/closed 状态")
        else:
            findings.append("工单状态已完成")

        steps = list(compliance.get("steps") or workorder.get("steps") or [])
        if not steps or compliance.get("missing_steps"):
            failed.append("workorder_steps_missing")
            findings.append("工单缺少维修步骤记录")

        feedback = str(feedback_result.get("repair_feedback") or feedback_result.get("feedback") or workorder.get("repair_feedback") or "").strip()
        if not feedback and workorder_compliance:
            failed.append("repair_feedback_missing")
            findings.append("维修反馈为空，无法确认现场执行记录")

        alarm_result = dict(alarm_check or {})
        if device_status.get("found") is False or device_status.get("success") is False:
            device_recovered = bool(repair_check.get("device_recovered"))
            alarm_cleared = bool(alarm_result.get("alarm_cleared", repair_check.get("alarm_cleared")))
            findings.append("设备实时状态不可用，使用 QMS/工单验证结果兜底")
        else:
            device_state = str(device_status.get("status") or "").lower()
            alarm_code = device_status.get("alarm_code")
            device_recovered = device_state in cls.RECOVERED_DEVICE_STATUSES or bool(repair_check.get("device_recovered"))
            alarm_cleared = bool(alarm_result.get("alarm_cleared", alarm_code in (None, "", "None")))
            if not device_recovered:
                failed.append("device_not_recovered")
                findings.append("设备状态未恢复：%s" % (device_status.get("status") or "unknown"))
            if not alarm_cleared:
                failed.append("alarm_still_active")
                findings.append("维修后仍存在报警：%s" % alarm_code)

        parameters_recovered = bool(parameter_check.get("parameters_recovered", True))
        if not parameters_recovered:
            failed.append("parameters_not_recovered")
            findings.append(str(parameter_check.get("reason") or "关键参数未恢复"))

        sop_compliant = bool(sop_check.get("passed") or sop_check.get("sop_compliance") or repair_check.get("sop_compliant"))
        if not sop_compliant:
            failed.append("sop_not_compliant")
            findings.append("未找到或未满足维修 SOP 证据")

        passed = not failed and bool(repair_check.get("passed", workorder_compliance))
        return {
            "passed": passed,
            "status": "pass" if passed else "fail",
            "device_recovered": device_recovered,
            "alarm_cleared": alarm_cleared,
            "parameters_recovered": parameters_recovered,
            "workorder_compliance": workorder_compliance,
            "sop_compliant": sop_compliant,
            "failed_checks": cls._dedupe(failed),
            "findings": cls._dedupe(findings + list(repair_check.get("findings") or [])),
        }

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values
