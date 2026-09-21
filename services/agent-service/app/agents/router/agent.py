"""用户意图识别和目标 Agent 选择。"""

from __future__ import annotations

import re
from typing import Any, Mapping

from app.contracts import RouteResult

from .graph import build_router_graph


_ALARM_CODE_RE = re.compile(r"\b(?:e\d{2,6}(?:s\d+)?|alm[-]?\d{2,6})\b", re.IGNORECASE)
_DEVICE_RE = re.compile(r"\b(?:CNC|TC|PLC|MACHINE|EQP)[-_]?[A-Z0-9]{2,}\b", re.IGNORECASE)
_WORKORDER_RE = re.compile(r"\bWO[-_]?[A-Z0-9]{2,}\b", re.IGNORECASE)
_PART_RE = re.compile(r"\b(?:PN|PART)[-_]?[A-Z0-9]{2,}\b", re.IGNORECASE)

_REPORT_TYPES = {
    "诊断报告": "diagnosis_report",
    "维修报告": "maintenance_report",
    "质检报告": "quality_report",
    "验收报告": "maintenance_report",
    "事件报告": "incident_report",
    "案例报告": "full_case_report",
    "完整报告": "full_case_report",
    "日报": "daily",
}

_COMPONENT_KEYWORDS = (
    "主轴",
    "冷却泵",
    "冷却系统",
    "温度传感器",
    "液压系统",
    "伺服电机",
    "刀库",
    "轴承",
)


class RouterAgent:
    name = "router"

    def __init__(self) -> None:
        self.graph = build_router_graph()

    def run(self, task: Any) -> RouteResult:
        payload = task if isinstance(task, Mapping) else {"user_text": str(task or "")}
        output = self.graph.invoke({"agent": self, "task": dict(payload)})
        result = output.get("result")
        if result is None:
            raise RuntimeError("Router LangGraph 未生成结果")
        return result

    @staticmethod
    def _classify_intent(text: str, entities: Mapping[str, Any]) -> tuple[str, str]:
        context_hint = str(
            entities.get("route_hint")
            or entities.get("intent")
            or entities.get("task_type")
            or entities.get("target_agent")
            or ""
        ).strip().lower()
        if context_hint in {"diagnosis", "knowledge", "cad", "maintenance", "workorder", "quality", "report", "memory", "workorder_action", "workorder_query"}:
            return context_hint, "根据上游上下文 route_hint 完成路由：%s" % context_hint
        if entities.get("alarm_code") and any(keyword in text for keyword in ("什么", "含义", "处理", "步骤", "说明", "手册", "sop")):
            return "knowledge", "识别到报警码知识问答，路由到 Knowledge Agent"
        rules = [
            ("quality", ("零件质量", "质量检测", "尺寸检测", "外观检测", "材料检测", "功能检测", "生产出来", "成品质检", "零件质检")),
            ("cad", ("cad", "bom", "图纸", "结构", "零件", "物料", "位置", "在哪里", "部件", "组件", "传感器", "装配", "关系")),
            ("report", ("报告", "日报", "维修记录")),
            ("workorder_query", ("查询工单", "工单状态", "维修状态", "查看工单", "获取工单")),
            ("workorder_action", ("创建工单", "新建工单", "生成工单", "派工", "关闭工单", "更新工单", "重新打开工单")),
            ("memory", ("历史维修经验", "维修经验", "经验库", "类似案例", "历史案例")),
            ("maintenance", ("维修方案", "怎么修", "怎么维修", "维修步骤", "检修", "维修", "修理", "维护", "保养")),
            ("knowledge", ("手册", "sop", "规范", "案例", "怎么检查")),
            ("diagnosis", ("诊断", "故障", "报警", "异常", "为什么")),
        ]
        for candidate, keywords in rules:
            if any(keyword.lower() in text for keyword in keywords):
                return candidate, "根据用户文本关键词完成路由：%s" % candidate
        return "unknown", "未识别到明确的工业运维意图"

    @staticmethod
    def _extract_entities(text: str, context: Mapping[str, Any]) -> dict[str, Any]:
        entities = {
            key: value
            for key, value in context.items()
            if key in {
                "device_id", "device_model", "alarm_code", "part_no", "workorder_id", "component", "report_type",
                "part_id", "batch_id", "production_order_id", "inspection_type",
                "route_hint", "intent", "task_type", "target_agent",
            } and value
        }
        alarm = _ALARM_CODE_RE.search(text)
        if alarm:
            entities["alarm_code"] = alarm.group(0).upper().replace("-", "")
        device = _DEVICE_RE.search(text)
        if device and not entities.get("device_id"):
            entities["device_id"] = device.group(0).upper()
        workorder = _WORKORDER_RE.search(text)
        if workorder:
            entities["workorder_id"] = workorder.group(0).upper().replace("_", "-")
        part = _PART_RE.search(text)
        if part:
            entities["part_no"] = part.group(0).upper()
            entities.setdefault("part_id", part.group(0).upper())
        batch = re.search(r"\bBATCH[-_]?[A-Z0-9]{2,}\b", text, re.IGNORECASE)
        if batch:
            entities["batch_id"] = batch.group(0).upper().replace("_", "-")
        production_order = re.search(r"\bPO[-_]?[A-Z0-9]{2,}\b", text, re.IGNORECASE)
        if production_order:
            entities["production_order_id"] = production_order.group(0).upper().replace("_", "-")
        for keyword, report_type in _REPORT_TYPES.items():
            if keyword in text:
                entities["report_type"] = report_type
                break
        if not entities.get("component"):
            for keyword in _COMPONENT_KEYWORDS:
                if keyword in text:
                    entities["component"] = keyword
                    break
        return entities

    @staticmethod
    def _target_agent(intent: str) -> str:
        if intent in {"workorder_action", "workorder_query"}:
            return "workorder"
        if intent in {"diagnosis", "knowledge", "cad", "maintenance", "workorder", "quality", "report", "memory"}:
            return intent
        return "router"

    @staticmethod
    def _target_input(text: str, context: Mapping[str, Any], entities: Mapping[str, Any], intent: str) -> dict[str, Any]:
        target_input = {**context, **entities, "user_text": text, "query": text}
        if intent == "workorder_query":
            target_input["action"] = "query"
        elif intent == "workorder_action":
            if any(keyword in text for keyword in ("创建工单", "新建工单", "生成工单")):
                action = "create"
            elif "关闭工单" in text:
                action = "close"
            elif "重新打开工单" in text or "重开工单" in text:
                action = "reopen"
            elif "派工" in text:
                action = "assign"
            else:
                action = "update"
            target_input["action"] = action
        if intent == "report" and entities.get("report_type"):
            target_input["report_type"] = entities["report_type"]
        if intent == "quality":
            target_input["inspection_type"] = "part_quality"
            target_input["action"] = "inspect_part"
        return target_input

    @staticmethod
    def _confidence(intent: str, entities: Mapping[str, Any], findings: list[str]) -> float:
        if intent == "unknown":
            return 0.2
        if intent == "need_more_context" or findings:
            return 0.55
        return 0.95 if entities else 0.88
