"""维修质量验证 Agent。"""

from __future__ import annotations

from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.validator import QualityResult

from .validator import QualityValidator


class QualityAgent:
    name = "quality"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()

    def verify_repair(self, workorder_id: str, device_id: str = "") -> QualityResult:
        return self.run({"workorder_id": workorder_id, "device_id": device_id})

    def run(self, task: Any) -> QualityResult:
        payload = dict(task or {})
        workorder = self._load_workorder(payload)
        workorder_id = str(workorder.get("workorder_id") or payload.get("workorder_id") or "")
        device_id = str(workorder.get("device_id") or payload.get("device_id") or "")
        repair_check = self._safe_tool("verify_repair", {"workorder_id": workorder_id, "device_id": device_id})
        device_status = self._safe_tool("get_device_status", {"device_id": device_id}) if device_id else {}
        parameter_check = self._verify_parameters(payload, workorder, device_status)
        sop_check = self._safe_tool("check_sop", {"workorder_id": workorder_id, "query": self._sop_query(payload, workorder)})
        decision = QualityValidator.validate(workorder, repair_check, device_status, sop_check, parameter_check)
        return QualityResult(
            workorder_id=workorder_id,
            recommendation=self._recommendation(decision),
            evidence=self._evidence(workorder, repair_check, device_status, parameter_check, sop_check),
            **decision,
        )

    def _load_workorder(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        raw = payload.get("workorder") or {}
        workorder = raw.model_dump(mode="json") if hasattr(raw, "model_dump") else dict(raw or {})
        if workorder.get("workorder_id"):
            return workorder
        workorder_id = str(payload.get("workorder_id") or "")
        if not workorder_id:
            return dict(payload)
        return self._safe_tool("get_workorder", {"workorder_id": workorder_id})

    def _verify_parameters(self, payload: Mapping[str, Any], workorder: Mapping[str, Any], device_status: Mapping[str, Any]) -> dict[str, Any]:
        diagnosis = dict(payload.get("diagnosis") or {})
        plan = dict(payload.get("maintenance_plan") or {})
        text = " ".join([
            str(workorder.get("title") or ""),
            " ".join(str(item) for item in workorder.get("steps") or []),
            str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or ""),
            str(plan.get("repair_target") or ""),
        ])
        metric_keys = self._metric_keys(text)
        if not metric_keys:
            return {"parameters_recovered": True, "reason": "无明确关键参数，按工单/QMS结果判定", "metric_keys": []}
        history = self._safe_tool("get_device_history", {"device_id": workorder.get("device_id", ""), "metric_keys": metric_keys, "limit": 20})
        status_metrics = dict(device_status.get("metrics") or {}) if isinstance(device_status, Mapping) else {}
        failed: list[str] = []
        evidence: list[dict[str, Any]] = []
        for key in metric_keys:
            latest = self._latest_metric(key, status_metrics, history)
            threshold = self._recovery_threshold(key)
            recovered = True if latest is None else latest <= threshold
            evidence.append({"metric": key, "latest": latest, "threshold": threshold, "recovered": recovered})
            if not recovered:
                failed.append("%s=%s 超过恢复阈值 %s" % (key, latest, threshold))
        if failed:
            return {"parameters_recovered": False, "reason": "；".join(failed), "metric_keys": metric_keys, "history": history, "evidence": evidence}
        return {"parameters_recovered": True, "reason": "关键参数已恢复或无异常采样", "metric_keys": metric_keys, "history": history, "evidence": evidence}

    def _safe_tool(self, name: str, arguments: Mapping[str, Any]) -> dict[str, Any]:
        try:
            return self.tools.execute(name, arguments)
        except Exception as error:
            return {"found": False, "success": False, "error": str(error), "tool": name}

    @staticmethod
    def _metric_keys(text: str) -> list[str]:
        keys: list[str] = []
        if any(token in text for token in ("温度", "过热", "冷却", "主轴温升")):
            keys.append("spindle_temperature_c")
        if any(token in text for token in ("振动", "轴承")):
            keys.append("spindle_vibration_mm_s")
        return keys

    @staticmethod
    def _latest_metric(key: str, status_metrics: Mapping[str, Any], history: Mapping[str, Any]) -> float | None:
        value = status_metrics.get(key)
        if value is None:
            trend = (history.get("trend") or {}).get(key) or {}
            value = trend.get("latest")
        try:
            return float(value)
        except (TypeError, ValueError):
            return None

    @staticmethod
    def _recovery_threshold(key: str) -> float:
        if key == "spindle_temperature_c":
            return 75.0
        if key == "spindle_vibration_mm_s":
            return 4.5
        return float("inf")

    @staticmethod
    def _sop_query(payload: Mapping[str, Any], workorder: Mapping[str, Any]) -> str:
        plan = dict(payload.get("maintenance_plan") or {})
        parts = [
            str(workorder.get("title") or ""),
            " ".join(str(item) for item in workorder.get("steps") or []),
            str(plan.get("repair_target") or ""),
            "SOP 维修验收",
        ]
        return " ".join(part for part in parts if part).strip() or "维修 SOP 验收"

    @staticmethod
    def _evidence(
        workorder: Mapping[str, Any],
        repair_check: Mapping[str, Any],
        device_status: Mapping[str, Any],
        parameter_check: Mapping[str, Any],
        sop_check: Mapping[str, Any],
    ) -> list[dict[str, Any]]:
        evidence = [
            {"type": "workorder", "workorder_id": workorder.get("workorder_id", ""), "status": workorder.get("status", ""), "step_count": len(workorder.get("steps") or []), "has_feedback": bool(workorder.get("repair_feedback"))},
            {"type": "repair_check", **dict(repair_check)},
            {"type": "device_status", "found": device_status.get("found"), "status": device_status.get("status"), "alarm_code": device_status.get("alarm_code"), "source": device_status.get("source", "")},
            {"type": "parameters", "parameters_recovered": parameter_check.get("parameters_recovered"), "metric_keys": parameter_check.get("metric_keys", []), "details": parameter_check.get("evidence", [])},
            {"type": "sop", "passed": sop_check.get("passed"), "document_count": len(sop_check.get("documents") or []), "source": sop_check.get("source", "")},
        ]
        return evidence

    @staticmethod
    def _recommendation(decision: Mapping[str, Any]) -> str:
        if decision.get("passed"):
            return "维修验收通过，可关闭工单并进入报告与经验沉淀。"
        failed = set(decision.get("failed_checks") or [])
        if "alarm_still_active" in failed or "parameters_not_recovered" in failed:
            return "维修后状态未恢复，建议重新打开工单并回到 Maintenance 复修。"
        if "sop_not_compliant" in failed or "repair_feedback_missing" in failed:
            return "补充 SOP 执行证据和维修反馈后再发起质检。"
        return "质检未通过，建议复核工单执行记录并安排返修。"
