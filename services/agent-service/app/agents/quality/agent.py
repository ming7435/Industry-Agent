"""生产零件质量检测 Agent，兼容旧维修验收调用。"""

from __future__ import annotations

from typing import Any, Callable, Mapping

from app.tools.registry import ToolRegistry
from app.validator import QualityResult

from .graph import build_quality_graph


class QualityAgent:
    name = "quality"

    def __init__(
        self,
        tools: ToolRegistry | None = None,
        knowledge_provider: Callable[[Mapping[str, Any], str], Mapping[str, Any]] | None = None,
    ) -> None:
        self.tools = tools or ToolRegistry()
        self.knowledge_provider = knowledge_provider
        self.graph = build_quality_graph()

    def verify_repair(self, workorder_id: str, device_id: str = "") -> QualityResult:
        return self.run({"workorder_id": workorder_id, "device_id": device_id})

    def run(self, task: Any) -> QualityResult:
        payload = {"workorder_id": task} if isinstance(task, str) else dict(task or {})
        output = self.graph.invoke({"agent": self, "request": payload})
        result = output.get("result")
        if result is None:
            raise RuntimeError("Quality LangGraph 未生成结果")
        return result

    def request_sop(self, query: str, workorder: Mapping[str, Any], request: Mapping[str, Any]) -> dict[str, Any]:
        if self.knowledge_provider is not None:
            context = {
                "task_id": request.get("task_id", ""),
                "trace_id": request.get("trace_id", ""),
                "device_id": workorder.get("device_id", request.get("device_id", "")),
                "component": (request.get("diagnosis") or {}).get("component", ""),
                "required_sources": ["sop"],
            }
            result = dict(self.knowledge_provider(context, query) or {})
            return {
                "passed": bool(result.get("documents") or result.get("evidence")),
                "documents": list(result.get("documents") or []),
                "evidence": list(result.get("evidence") or []),
                "source": result.get("source", "knowledge-a2a"),
                "a2a": True,
            }
        return self._safe_tool("check_sop", {"workorder_id": workorder.get("workorder_id", ""), "query": query})

    def _build_result(self, state: Mapping[str, Any]) -> QualityResult:
        decision = dict(state.get("decision") or {})
        request = dict(state.get("request") or {})
        part = dict(state.get("part") or request.get("part") or {})
        workorder = dict(state.get("workorder") or {})
        result_payload = {
            "workorder_id": str(workorder.get("workorder_id") or state.get("request", {}).get("workorder_id") or ""),
            "inspection_type": str(request.get("inspection_type") or "part_quality"),
            "part_id": str(part.get("part_id") or request.get("part_id") or ""),
            "part_no": str(part.get("part_no") or request.get("part_no") or ""),
            "part_name": str(part.get("part_name") or request.get("part_name") or ""),
            "batch_id": str(part.get("batch_id") or request.get("batch_id") or ""),
            "production_order_id": str(part.get("production_order_id") or request.get("production_order_id") or ""),
            "device_id": str(part.get("device_id") or request.get("device_id") or ""),
            "inspection_items": list(decision.get("inspection_items") or []),
            "measurements": dict(part.get("measurements") or request.get("measurements") or {}),
            "specifications": dict(decision.get("specifications") or state.get("inspection_plan") or {}),
            "defects": list(decision.get("defects") or []),
            "qualified": bool(decision.get("qualified", decision.get("passed"))),
            "recommendation": self._recommendation(decision),
            "evidence": self._evidence(state),
            "sop_compliance": bool(decision.get("sop_compliant")),
            "stop_reason": "validator_pass" if decision.get("passed") else "validator_fail",
        }
        # Validator fields are authoritative, while the surrounding payload
        # adds the stable identity and evidence fields required by the DTO.
        result_payload.update(decision)
        result_payload["sop_compliance"] = bool(decision.get("sop_compliant"))
        result_payload["recommendation"] = self._recommendation(decision)
        result_payload["evidence"] = self._evidence(state)
        result_payload["stop_reason"] = "validator_pass" if decision.get("passed") else "validator_fail"
        return QualityResult(**result_payload)

    @staticmethod
    def _fallback_result(request: Mapping[str, Any], findings: list[str]) -> QualityResult:
        part = dict(request.get("part") or {})
        return QualityResult(
            workorder_id=str(request.get("workorder_id") or ""),
            inspection_type=str(request.get("inspection_type") or "part_quality"),
            part_id=str(part.get("part_id") or request.get("part_id") or ""),
            part_no=str(part.get("part_no") or request.get("part_no") or ""),
            part_name=str(part.get("part_name") or request.get("part_name") or ""),
            batch_id=str(part.get("batch_id") or request.get("batch_id") or ""),
            production_order_id=str(part.get("production_order_id") or request.get("production_order_id") or ""),
            device_id=str(part.get("device_id") or request.get("device_id") or ""),
            passed=False,
            status="review",
            device_recovered=False,
            alarm_cleared=False,
            parameters_recovered=False,
            workorder_compliance=False,
            sop_compliant=False,
            sop_compliance=False,
            failed_checks=["quality_input_missing"],
            findings=findings,
            recommendation="补充生产零件编号、检测数据和规格后重新发起质量检测。",
        )

    def _safe_tool(self, name: str, arguments: Mapping[str, Any]) -> dict[str, Any]:
        try:
            return self.tools.execute(name, arguments)
        except Exception as error:
            return {"found": False, "success": False, "error": str(error), "tool": name}

    @staticmethod
    def _context_text(payload: Mapping[str, Any], workorder: Mapping[str, Any]) -> str:
        diagnosis = dict(payload.get("diagnosis") or payload.get("diagnosis_result") or {})
        plan = dict(payload.get("maintenance_plan") or {})
        return " ".join([
            str(workorder.get("title") or ""),
            " ".join(str(item) for item in workorder.get("steps") or []),
            str(diagnosis.get("fault") or diagnosis.get("summary") or diagnosis.get("diagnosis") or ""),
            str(plan.get("repair_target") or ""),
        ])

    @staticmethod
    def _metric_keys(text: str) -> list[str]:
        keys: list[str] = []
        if any(token in text for token in ("温度", "过热", "冷却", "主轴温升")):
            keys.append("spindle_temperature_c")
        if any(token in text for token in ("振动", "轴承")):
            keys.append("spindle_vibration_mm_s")
        return keys

    @staticmethod
    def _sop_query(payload: Mapping[str, Any], workorder: Mapping[str, Any]) -> str:
        plan = dict(payload.get("maintenance_plan") or {})
        parts = [str(workorder.get("title") or ""), " ".join(str(item) for item in workorder.get("steps") or []), str(plan.get("repair_target") or ""), "SOP 维修验收"]
        return " ".join(part for part in parts if part).strip() or "维修 SOP 验收"

    @staticmethod
    def _evidence(state: Mapping[str, Any]) -> list[dict[str, Any]]:
        request = dict(state.get("request") or {})
        if request.get("inspection_type") == "part_quality":
            part = dict(state.get("part") or request.get("part") or {})
            return [
                {"type": "part_identity", "part_id": part.get("part_id", ""), "part_no": part.get("part_no", ""), "part_name": part.get("part_name", ""), "batch_id": part.get("batch_id", ""), "production_order_id": part.get("production_order_id", "")},
                {"type": "dimensions", **dict(state.get("dimension_check") or {})},
                {"type": "appearance", **dict(state.get("appearance_check") or {})},
                {"type": "material", **dict(state.get("material_check") or {})},
                {"type": "function", **dict(state.get("function_check") or {})},
                {"type": "process", **dict(state.get("process_check") or {})},
            ]
        workorder = dict(state.get("workorder") or {})
        parameter_check = dict(state.get("parameter_check") or {})
        sop_check = dict(state.get("sop_check") or {})
        return [
            {"type": "workorder", "workorder_id": workorder.get("workorder_id", ""), "status": workorder.get("status", ""), "step_count": len(workorder.get("steps") or []), "has_feedback": bool(workorder.get("repair_feedback"))},
            {"type": "repair_feedback", **dict(state.get("repair_feedback") or {})},
            {"type": "workorder_compliance", **dict(state.get("workorder_check") or {})},
            {"type": "repair_check", **dict(state.get("repair_check") or {})},
            {"type": "device_status", **dict(state.get("device_status") or {})},
            {"type": "alarm_clearance", **dict(state.get("alarm_check") or {})},
            {"type": "parameters", "parameters_recovered": parameter_check.get("parameters_recovered"), "details": parameter_check.get("comparisons") or parameter_check.get("evidence") or []},
            {"type": "sop", "passed": sop_check.get("passed"), "document_count": len(sop_check.get("documents") or []), "source": sop_check.get("source", "")},
        ]

    @staticmethod
    def _recommendation(decision: Mapping[str, Any]) -> str:
        if decision.get("inspection_type") == "part_quality" or "qualified" in decision:
            if decision.get("passed"):
                return "零件质量检测合格，可进入入库或装配流程。"
            return "零件质量检测未通过，请隔离不合格品并复核缺陷项。"
        if decision.get("passed"):
            return "维修验收通过，工单已关闭并可进入报告与经验沉淀。"
        failed = set(decision.get("failed_checks") or [])
        if "workorder_not_completed" in failed:
            return "工单尚未完成，不能执行维修验收。"
        if "alarm_still_active" in failed or "parameters_not_recovered" in failed:
            return "维修后状态未恢复，工单已重开并应回到 Maintenance 复修。"
        if "sop_not_compliant" in failed or "repair_feedback_missing" in failed:
            return "补充 SOP 执行证据和维修反馈后重新发起质检。"
        return "质检未通过，建议复核工单执行记录并安排返修。"
