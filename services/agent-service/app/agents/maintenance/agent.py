"""维修方案 Agent。"""

from __future__ import annotations

from typing import Any, Callable, Mapping
from uuid import uuid4

from app.tools.registry import ToolRegistry
from app.validator import DiagnosisView, MaintenancePlan

from .graph import build_maintenance_graph
from .validator import MaintenancePlanValidator


class MaintenanceAgent:
    name = "maintenance"

    def __init__(
        self,
        tools: ToolRegistry | None = None,
        knowledge_provider: Callable[[Mapping[str, Any], str], Mapping[str, Any]] | None = None,
        cad_provider: Callable[[Mapping[str, Any], str], Mapping[str, Any]] | None = None,
    ) -> None:
        self.tools = tools or ToolRegistry()
        self.knowledge_provider = knowledge_provider
        self.cad_provider = cad_provider
        self.graph = build_maintenance_graph()

    def run(self, task: Any) -> MaintenancePlan:
        payload = {"query": task} if isinstance(task, str) else dict(task or {})
        output = self.graph.invoke({"agent": self, "request": payload})
        result = output.get("result")
        if result is None:
            raise RuntimeError("Maintenance LangGraph 未生成结果")
        return result

    def request_knowledge(self, query: str, diagnosis: DiagnosisView) -> dict[str, Any]:
        context = {"diagnosis": diagnosis.model_dump(mode="json"), "device_id": diagnosis.device_id}
        if self.knowledge_provider is not None:
            return dict(self.knowledge_provider(context, query) or {})
        knowledge = self._safe_tool("search_knowledge", {"query": query, "limit": 5, "filters": {"knowledge_type": "sop"}})
        if not knowledge.get("documents") and not knowledge.get("evidence"):
            knowledge = self._safe_tool("search_knowledge", {"query": query, "limit": 5, "filters": {}})
        return knowledge

    def request_cad(self, query: str, diagnosis: DiagnosisView, required: bool = True) -> dict[str, Any]:
        context = {"diagnosis": diagnosis.model_dump(mode="json"), "device_id": diagnosis.device_id}
        if not required:
            return {}
        if self.cad_provider is not None:
            return dict(self.cad_provider(context, "%s 零件 BOM 安装位置 图纸" % query) or {})
        merged: dict[str, Any] = {}
        arguments = {"query": query, "device_id": diagnosis.device_id, "component": "", "part_no": ""}
        for tool_name in ("query_part", "query_bom", "get_component_location"):
            result = self._safe_tool(tool_name, arguments)
            self._merge_cad_result(merged, result)
        return merged or self._safe_tool("query_cad", arguments)

    @staticmethod
    def _requires_cad(diagnosis: DiagnosisView) -> bool:
        text = "%s %s" % (diagnosis.fault, diagnosis.cause)
        return any(token in text for token in ("轴承", "主轴", "冷却", "泵", "振动", "温度", "传感器", "零件", "部件", "拆装", "BOM"))

    @staticmethod
    def _merge_cad_result(target: dict[str, Any], result: Mapping[str, Any]) -> None:
        if not isinstance(result, Mapping):
            return
        for key in ("components", "drawings", "bom_items", "parts", "part_relations", "assembly_relations", "locations", "evidence", "sources", "drawing_ref_details"):
            values = result.get(key)
            if not isinstance(values, list):
                continue
            target.setdefault(key, [])
            for item in values:
                if item not in target[key]:
                    target[key].append(item)
        for key in ("viewer_context", "location", "component", "part_no", "summary", "status"):
            if result.get(key) and not target.get(key):
                target[key] = result[key]

    def _build_plan_payload(
        self,
        payload: Mapping[str, Any],
        diagnosis: DiagnosisView,
        knowledge: Mapping[str, Any],
        cad: Mapping[str, Any],
        memory: Mapping[str, Any] | None = None,
        inventory: Mapping[str, Any] | None = None,
        part_availability: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        query = self._query(payload, diagnosis)
        tool_plan = self._safe_tool("generate_repair_plan", {"diagnosis": diagnosis.model_dump(mode="json")})
        documents = list(knowledge.get("documents") or [])
        components = list(cad.get("components") or [])
        bom_items = list(cad.get("bom_items") or [])
        spare_parts = dict(inventory or {})
        availability = dict(part_availability or {})
        profile = self._profile(diagnosis, components)

        pre_checks = self._pre_checks(diagnosis, knowledge, components)
        repair_steps = self._repair_steps(profile, tool_plan, knowledge, components)
        post_checks = self._post_checks(profile)
        tools = self._tools(profile)
        parts = self._parts(profile, spare_parts, components, bom_items)
        safety = self._safety(profile, diagnosis.severity)
        evidence = self._evidence(diagnosis, knowledge, cad, spare_parts, profile, memory or {})
        target_part = self._target_part(diagnosis, profile, components, bom_items)
        engineering_context = {
            "drawing_refs": list(cad.get("drawing_refs") or self._drawing_refs(cad, components)),
            "drawing_ref_details": list(cad.get("drawing_ref_details") or []),
            "viewer_context": dict(cad.get("viewer_context") or self._viewer_context(cad, components, diagnosis)),
        }
        plan_payload = {
            "plan_id": "PLAN-" + uuid4().hex[:10].upper(),
            "repair_target": profile["target"],
            "repair_steps": repair_steps,
            "tools": tools,
            "parts": parts,
            "safety": safety,
            "required_tools": tools,
            "required_parts": parts,
            "safety_requirements": safety,
            "pre_checks": pre_checks,
            "post_checks": post_checks,
            "estimated_duration": profile["estimated_minutes"],
            "estimated_time": "%s分钟" % profile["estimated_minutes"],
            "source_documents": self._document_ids(documents),
            "cad_components": self._component_ids(components, bom_items),
            "evidence": evidence,
            "memory_evidence": list((memory or {}).get("items") or [])[:5],
            "inventory_status": spare_parts,
            "part_availability": availability,
            "risk_level": self._risk_level(diagnosis.severity),
            "target_part": target_part,
            "engineering_context": engineering_context,
        }
        return plan_payload

    @staticmethod
    def _plan_result(plan_payload: Mapping[str, Any], diagnosis: DiagnosisView) -> MaintenancePlan:
        payload = dict(plan_payload or {})
        plan_id = str(payload.pop("plan_id", "") or "PLAN-" + uuid4().hex[:10].upper())
        return MaintenancePlan(plan_id=plan_id, diagnosis=diagnosis, **payload)

    @staticmethod
    def _query(payload: Mapping[str, Any], diagnosis: DiagnosisView) -> str:
        return str(payload.get("query") or payload.get("user_text") or diagnosis.fault or diagnosis.cause or "设备维修")

    @staticmethod
    def _ensure_mapping(value: Any) -> dict[str, Any]:
        if hasattr(value, "model_dump"):
            return value.model_dump(mode="json")
        return dict(value or {}) if isinstance(value, Mapping) else {}

    def _safe_tool(self, name: str, arguments: Mapping[str, Any]) -> dict[str, Any]:
        try:
            return self.tools.execute(name, arguments)
        except Exception:
            return {}

    @staticmethod
    def _profile(diagnosis: DiagnosisView, components: list[Mapping[str, Any]]) -> dict[str, Any]:
        text = " ".join([diagnosis.fault, diagnosis.cause, " ".join(str(item.get("name", "")) for item in components)])
        if "温度" in text or "过热" in text or "冷却" in text:
            return {"kind": "thermal", "target": "主轴冷却系统", "estimated_minutes": 60}
        if "振动" in text or "轴承" in text:
            return {"kind": "vibration", "target": "主轴传动与轴承系统", "estimated_minutes": 90}
        return {"kind": "general", "target": diagnosis.fault or "异常设备部件", "estimated_minutes": 60}

    @staticmethod
    def _pre_checks(diagnosis: DiagnosisView, knowledge: Mapping[str, Any], components: list[Mapping[str, Any]]) -> list[str]:
        checks = ["确认设备处于安全停机状态", "复核报警码、实时状态和异常趋势"]
        for item in knowledge.get("recommended_checks") or []:
            text = str(item).strip()
            if text and text not in checks:
                checks.append(text)
        for component in components[:3]:
            name = str(component.get("name") or component.get("component_id") or "").strip()
            position = str(component.get("position") or "").strip()
            if name and position:
                checks.append("按图纸位置确认%s：%s" % (name, position))
        if diagnosis.evidence:
            checks.append("核对诊断证据：%s" % "；".join(diagnosis.evidence[:3]))
        return MaintenanceAgent._dedupe(checks)[:8]

    @staticmethod
    def _repair_steps(profile: Mapping[str, Any], tool_plan: Mapping[str, Any], knowledge: Mapping[str, Any], components: list[Mapping[str, Any]]) -> list[str]:
        kind = profile["kind"]
        if kind == "thermal":
            steps = [
                "执行 LOTO 断电挂牌并等待主轴完全停止",
                "检查冷却液液位、流量、过滤器和冷却泵运行状态",
                "检查主轴温度传感器接线、安装位置和 PLC 模拟量读数",
                "清理散热通道并排查主轴过载运行原因",
                "恢复后空载试运行并记录主轴温度趋势",
            ]
        elif kind == "vibration":
            steps = [
                "执行停机隔离并确认刀具、夹具处于安全状态",
                "检查刀具夹持、工件装夹和主轴端跳",
                "检查主轴轴承、润滑状态和振动传感器固定情况",
                "低速试运行并复测振动速度 RMS",
            ]
        else:
            steps = list(tool_plan.get("repair_steps") or []) or [
                "执行安全隔离",
                "根据报警定义和知识证据检查相关部件",
                "修复后复测异常指标并确认设备恢复",
            ]
        for item in knowledge.get("recommended_checks") or []:
            text = str(item).strip()
            if text and text not in steps:
                steps.insert(max(1, len(steps) - 1), text)
        if components:
            refs = "、".join(str(item.get("drawing_ref") or item.get("component_id") or "") for item in components[:3] if item.get("drawing_ref") or item.get("component_id"))
            if refs:
                steps.insert(1, "按 CAD/BOM 依据定位维修部件：%s" % refs)
        return MaintenanceAgent._dedupe(steps)[:10]

    @staticmethod
    def _post_checks(profile: Mapping[str, Any]) -> list[str]:
        checks = ["确认原报警已清除", "确认设备状态恢复 running/idle 且无新增报警", "记录维修过程和复测数据"]
        if profile["kind"] == "thermal":
            checks.insert(1, "连续观察主轴温度趋势至少一个运行周期")
        elif profile["kind"] == "vibration":
            checks.insert(1, "复测振动速度 RMS 并与阈值比较")
        return checks

    @staticmethod
    def _tools(profile: Mapping[str, Any]) -> list[str]:
        if profile["kind"] == "thermal":
            return ["万用表", "红外测温仪", "流量计", "基础维修工具"]
        if profile["kind"] == "vibration":
            return ["振动测量仪", "百分表", "扭矩扳手", "基础维修工具"]
        return ["万用表", "基础维修工具"]

    @staticmethod
    def _parts(profile: Mapping[str, Any], spare_parts: Mapping[str, Any], components: list[Mapping[str, Any]], bom_items: list[Mapping[str, Any]]) -> list[str]:
        parts: list[str] = []
        for item in spare_parts.get("parts") or []:
            if not MaintenanceAgent._part_matches_profile(profile, item):
                continue
            stock = item.get("stock")
            suffix = "（库存%s）" % stock if stock is not None else ""
            parts.append("%s %s%s" % (item.get("part_id", ""), item.get("name", "备件"), suffix))
        if not parts:
            for item in bom_items or components:
                if item.get("part_no") or item.get("name"):
                    parts.append("%s %s" % (item.get("part_no", ""), item.get("name", "")))
        if not parts and profile["kind"] == "thermal":
            parts = ["TS-PT100-008 主轴温度传感器", "CP-TC820-015 冷却泵（按检查结果更换）"]
        return MaintenanceAgent._dedupe([item.strip() for item in parts if item.strip()])[:6]

    @staticmethod
    def _part_matches_profile(profile: Mapping[str, Any], item: Mapping[str, Any]) -> bool:
        text = "%s %s" % (item.get("part_id", ""), item.get("name", ""))
        kind = profile.get("kind")
        if kind == "thermal":
            return any(token in text for token in ("TEMP", "温度", "PT100", "COOLANT", "冷却", "PUMP", "泵"))
        if kind == "vibration":
            return any(token in text for token in ("BEARING", "轴承", "VIB", "振动"))
        return True

    @staticmethod
    def _safety(profile: Mapping[str, Any], severity: str) -> list[str]:
        safety = ["执行 LOTO 断电挂牌", "佩戴护目镜和防护手套", "确认主轴完全停止后再接触设备"]
        if profile["kind"] == "thermal":
            safety.append("接触冷却液和高温部件前确认温度降至安全范围")
        if "严重" in severity or "高级" in severity or "critical" in severity.lower():
            safety.append("高级风险故障需由班组长确认后开工")
        return safety

    @staticmethod
    def _evidence(diagnosis: DiagnosisView, knowledge: Mapping[str, Any], cad: Mapping[str, Any], spare_parts: Mapping[str, Any], profile: Mapping[str, Any], memory: Mapping[str, Any] | None = None) -> list[dict[str, Any]]:
        evidence: list[dict[str, Any]] = []
        for item in diagnosis.evidence:
            evidence.append({"type": "diagnosis", "content": item})
        for item in knowledge.get("evidence") or []:
            evidence.append({"type": "knowledge", **dict(item)})
        for item in spare_parts.get("parts") or []:
            if MaintenanceAgent._part_matches_profile(profile, item):
                evidence.append({"type": "inventory", **dict(item)})
        for item in cad.get("evidence") or []:
            evidence.append({"type": "cad", **dict(item)})
        for item in (memory or {}).get("items") or []:
            evidence.append({"type": "historical_experience", **dict(item)})
        return evidence[:20]

    @staticmethod
    def _document_ids(documents: list[Mapping[str, Any]]) -> list[str]:
        return MaintenanceAgent._dedupe([str(item.get("document_id") or item.get("id") or "") for item in documents if item])

    @staticmethod
    def _component_ids(components: list[Mapping[str, Any]], bom_items: list[Mapping[str, Any]]) -> list[str]:
        values = []
        for item in components + bom_items:
            values.append(str(item.get("component_id") or item.get("part_no") or ""))
        return MaintenanceAgent._dedupe([item for item in values if item])

    @staticmethod
    def _target_part(diagnosis: DiagnosisView, profile: Mapping[str, Any], components: list[Mapping[str, Any]], bom_items: list[Mapping[str, Any]]) -> dict[str, str]:
        item = next((value for value in bom_items + components if value.get("part_no") or value.get("name")), {})
        raw = diagnosis.raw
        return {
            "part_no": str(raw.get("part_no") or item.get("part_no") or ""),
            "part_name": str(raw.get("part_name") or item.get("name") or profile.get("target") or ""),
            "component": str(raw.get("component") or item.get("component_id") or ""),
        }

    @staticmethod
    def _drawing_refs(cad: Mapping[str, Any], components: list[Mapping[str, Any]]) -> list[Any]:
        values = list(cad.get("drawing_refs") or [])
        for item in list(cad.get("drawings") or []) + components:
            value = item.get("drawing_id") or item.get("drawing_ref")
            if value and value not in values:
                values.append(value)
        return values

    @staticmethod
    def _viewer_context(cad: Mapping[str, Any], components: list[Mapping[str, Any]], diagnosis: DiagnosisView) -> dict[str, str]:
        item = components[0] if components else {}
        return {
            "model_url": str(cad.get("model_url") or ""),
            "mesh_id": str(cad.get("mesh_id") or item.get("component_id") or ""),
            "mesh_name": str(cad.get("mesh_name") or item.get("name") or ""),
            "location": str(cad.get("location") or item.get("position") or ""),
            "default_view": str((cad.get("default_view") or "component") if item else ""),
        }

    @staticmethod
    def _risk_level(severity: str) -> str:
        text = str(severity or "").lower()
        if any(token in text for token in ("critical", "严重", "高级", "high")):
            return "high"
        if any(token in text for token in ("low", "低")):
            return "low"
        return "medium"

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values

    @staticmethod
    def _normalize_diagnosis(value: Any) -> DiagnosisView:
        """将诊断 Agent 的字典结果归一化为维修计划输入模型。"""
        if isinstance(value, DiagnosisView):
            return value
        payload = dict(value or {})
        return DiagnosisView(
            device_id=str(payload.get("device_id") or "unknown"),
            fault=str(payload.get("fault") or payload.get("summary") or payload.get("diagnosis") or payload.get("query") or payload.get("user_text") or "设备异常"),
            cause=str(payload.get("cause") or payload.get("diagnosis") or "需要进一步检查"),
            severity=str(payload.get("severity") or "未知"),
            confidence=payload.get("confidence"),
            evidence=list(payload.get("evidence") or []),
            recommendation=str(payload.get("recommendation") or "按照维修方案执行并复测"),
            raw=payload,
        )
