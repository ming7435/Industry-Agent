"""生产零件质量检测 Agent。"""

from __future__ import annotations

from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.validator import QualityResult

from .graph import build_quality_graph


class QualityAgent:
    name = "quality"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()
        self.graph = build_quality_graph()

    def run(self, task: Any) -> QualityResult:
        payload = dict(task or {}) if isinstance(task, Mapping) else {}
        output = self.graph.invoke({"agent": self, "request": payload})
        result = output.get("result")
        if result is None:
            raise RuntimeError("Quality LangGraph 未生成结果")
        return result

    def _build_result(self, state: Mapping[str, Any]) -> QualityResult:
        decision = dict(state.get("decision") or {})
        request = dict(state.get("request") or {})
        part = dict(state.get("part") or request.get("part") or {})
        result_payload = {
            "inspection_type": "part_quality",
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
            "stop_reason": "validator_pass" if decision.get("passed") else "validator_fail",
        }
        result_payload.update(decision)
        result_payload["inspection_type"] = "part_quality"
        result_payload["recommendation"] = self._recommendation(decision)
        result_payload["evidence"] = self._evidence(state)
        result_payload["stop_reason"] = "validator_pass" if decision.get("passed") else "validator_fail"
        return QualityResult(**result_payload)

    @staticmethod
    def _fallback_result(request: Mapping[str, Any], findings: list[str]) -> QualityResult:
        part = dict(request.get("part") or {})
        return QualityResult(
            inspection_type="part_quality",
            part_id=str(part.get("part_id") or request.get("part_id") or ""),
            part_no=str(part.get("part_no") or request.get("part_no") or ""),
            part_name=str(part.get("part_name") or request.get("part_name") or ""),
            batch_id=str(part.get("batch_id") or request.get("batch_id") or ""),
            production_order_id=str(part.get("production_order_id") or request.get("production_order_id") or ""),
            device_id=str(part.get("device_id") or request.get("device_id") or ""),
            passed=False,
            status="review",
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
    def _evidence(state: Mapping[str, Any]) -> list[dict[str, Any]]:
        request = dict(state.get("request") or {})
        part = dict(state.get("part") or request.get("part") or {})
        return [
            {
                "type": "part_identity",
                "part_id": part.get("part_id", ""),
                "part_no": part.get("part_no", ""),
                "part_name": part.get("part_name", ""),
                "batch_id": part.get("batch_id", ""),
                "production_order_id": part.get("production_order_id", ""),
            },
            {"type": "dimensions", **dict(state.get("dimension_check") or {})},
            {"type": "appearance", **dict(state.get("appearance_check") or {})},
            {"type": "material", **dict(state.get("material_check") or {})},
            {"type": "function", **dict(state.get("function_check") or {})},
            {"type": "process", **dict(state.get("process_check") or {})},
        ]

    @staticmethod
    def _recommendation(decision: Mapping[str, Any]) -> str:
        if decision.get("passed"):
            return "零件质量检测合格，可进入入库或装配流程。"
        return "零件质量检测未通过，请隔离不合格品并复核缺陷项。"
