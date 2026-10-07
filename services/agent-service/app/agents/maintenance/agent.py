"""维修方案 Agent。"""

from __future__ import annotations

from typing import Any, Callable, Mapping
from uuid import uuid4

from app.tools.registry import ToolRegistry
from app.contracts import DiagnosisView, MaintenancePlan
from app.agents.base import BaseAgent

from .graph import build_maintenance_graph
from app.workorder.policy import maintenance_decision
from app.workorder.repair_profile import part_matches_profile, repair_profile


class MaintenanceAgent(BaseAgent):
    name = "maintenance"
    capabilities = ("repair_plan", "repair_planning", "maintenance_replan")

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
    def _mapping_items(value: Any) -> list[Mapping[str, Any]]:
        """仅保留外部提供方返回的结构化证据记录。

        此边界接收的提供方数据不可信；若允许字符串进入，``dict(item)`` 会失败，
        进而使原本有效的维修计划中断。统一规范化后，下游证据模型才能保持稳定。
        """
        if not isinstance(value, (list, tuple)):
            return []
        return [item for item in value if isinstance(item, Mapping)]

    @staticmethod
    def _requires_cad(diagnosis: DiagnosisView) -> bool:
        # 互锁核查只读取状态，不拆修部件；不能因为报警正文提到主轴就要求主轴图纸。
        if repair_profile(diagnosis.model_dump(mode="json"))["kind"] == "safety_interlock":
            return False
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
        tool_plan = self._safe_tool("generate_repair_plan", {"diagnosis": diagnosis.model_dump(mode="json")})
        documents = list(knowledge.get("documents") or [])
        components = list(cad.get("components") or [])
        bom_items = list(cad.get("bom_items") or [])
        spare_parts = dict(inventory or {})
        availability = dict(part_availability or {})
        profile = self._profile(diagnosis, components)
        components = [item for item in components if self._part_matches_profile(profile, item)]
        bom_items = [item for item in bom_items if self._part_matches_profile(profile, item)]
        maintenance_required, maintenance_reason = maintenance_decision(
            diagnosis=diagnosis.model_dump(mode="json"),
            plan=payload,
        )

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
            "required_parts": self._required_parts(parts),
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
            "maintenance_required": maintenance_required,
            "maintenance_reason": maintenance_reason,
            "cad_required": self._requires_cad(diagnosis),
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
        return repair_profile(diagnosis.model_dump(mode="json"))

    @staticmethod
    def _pre_checks(diagnosis: DiagnosisView, knowledge: Mapping[str, Any], components: list[Mapping[str, Any]]) -> list[str]:
        checks = ["确认设备处于安全停机状态", "复核报警码、实时状态和异常趋势"]
        for text in MaintenanceAgent._safe_recommended_checks(knowledge):
            if text not in checks:
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
        if kind == "safety_interlock":
            from app.workorder.repair_profile import interlock_inspection_steps
            # 不把检索到的跨设备拆修步骤混入只读互锁核查，也不自动操作设备。
            return interlock_inspection_steps()
        if kind == "lubrication":
            steps = [
                "执行安全隔离并断电挂牌，确认设备已停止",
                "核对润滑油液位、润滑泵运行状态及压力反馈",
                "检查润滑油路、过滤器是否堵塞或泄漏，确认实际故障点",
                "按检查结果及维修证据处理故障，不直接更换未经确认的部件",
                "恢复后复测润滑压力和报警状态，记录设备恢复数据",
            ]
        elif kind == "thermal":
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
        for text in MaintenanceAgent._safe_recommended_checks(knowledge):
            if text not in steps:
                steps.insert(max(1, len(steps) - 1), text)
        if components:
            refs = "、".join(str(item.get("drawing_ref") or item.get("component_id") or "") for item in components[:3] if item.get("drawing_ref") or item.get("component_id"))
            if refs:
                steps.insert(1, "按 CAD/BOM 依据定位维修部件：%s" % refs)
        return MaintenanceAgent._dedupe(steps)[:10]

    @staticmethod
    def _safe_recommended_checks(knowledge: Mapping[str, Any]) -> list[str]:
        """只允许短小、可执行的检查项进入维修步骤，隔离原始证据正文。"""
        checks: list[str] = []
        blocked_markers = (
            "本地ocr识别结果",
            "内容类型:",
            "evidence.",
            "steps.action",
            "steps.safety",
            "positioningerror",
            "encoderlost",
            "alarm dictionary",
            "报警字典",
        )
        for item in knowledge.get("recommended_checks") or []:
            text = " ".join(str(item or "").split()).strip()
            lowered = text.lower()
            if not text or len(text) > 120 or any(marker in lowered for marker in blocked_markers):
                continue
            if text not in checks:
                checks.append(text)
        return checks[:6]

    @staticmethod
    def _post_checks(profile: Mapping[str, Any]) -> list[str]:
        checks = ["确认原报警已清除", "确认设备状态恢复 running/idle 且无新增报警", "记录维修过程和复测数据"]
        if profile["kind"] == "lubrication":
            checks.insert(1, "复测润滑压力及供油状态，与当前设备已配置的验收标准比较")
        elif profile["kind"] == "thermal":
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
        if profile["kind"] == "safety_interlock":
            # 核查工单没有更换动作；库存里存在备件不等于本次需要预留它。
            return []
        parts: list[str] = []
        for item in spare_parts.get("parts") or []:
            if not MaintenanceAgent._part_matches_profile(profile, item):
                continue
            identity = item.get("part_no") or item.get("part_id") or ""
            if not str(identity).strip():
                continue
            parts.append("%s %s" % (identity, item.get("name", "备件")))
        if not parts:
            for item in bom_items or components:
                if MaintenanceAgent._part_matches_profile(profile, item) and (item.get("part_no") or item.get("name")):
                    parts.append("%s %s" % (item.get("part_no", ""), item.get("name", "")))
        return MaintenanceAgent._dedupe([item.strip() for item in parts if item.strip()])[:6]

    @staticmethod
    def _required_parts(parts: list[str]) -> list[str]:
        """库存查询和预留使用编号；名称用于显示，库存数量保留在库存证据中。"""
        return MaintenanceAgent._dedupe([part.split(" ", 1)[0] for part in parts if part])

    @staticmethod
    def _part_matches_profile(profile: Mapping[str, Any], item: Mapping[str, Any]) -> bool:
        return part_matches_profile(profile, item)

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
        for diagnosis_item in diagnosis.evidence:
            evidence.append({"type": "diagnosis", "content": diagnosis_item})
        for knowledge_item in MaintenanceAgent._mapping_items(knowledge.get("evidence")):
            evidence.append({"type": "knowledge", **dict(knowledge_item)})
        for inventory_item in MaintenanceAgent._mapping_items(spare_parts.get("parts")):
            if MaintenanceAgent._part_matches_profile(profile, inventory_item):
                evidence.append({"type": "inventory", **dict(inventory_item)})
        for cad_item in MaintenanceAgent._mapping_items(cad.get("evidence")):
            evidence.append({"type": "cad", **dict(cad_item)})
        for memory_item in MaintenanceAgent._mapping_items((memory or {}).get("items")):
            evidence.append({"type": "historical_experience", **dict(memory_item)})
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
        candidates = [value for value in bom_items + components if MaintenanceAgent._part_matches_profile(profile, value) and (value.get("part_no") or value.get("name"))]
        raw = diagnosis.raw
        item = next((value for value in candidates if (raw.get("part_no") and raw["part_no"] == value.get("part_no")) or (raw.get("component") and raw["component"] == value.get("component_id"))), candidates[0] if candidates else {})
        return {
            "part_no": str(item.get("part_no") or ""),
            "part_name": str(item.get("name") or profile.get("target") or ""),
            "component": str(item.get("component_id") or ""),
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
            maintenance_required=payload.get("maintenance_required"),
            maintenance_reason=str(payload.get("maintenance_reason") or ""),
            raw=payload,
        )
