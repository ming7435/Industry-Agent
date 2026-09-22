"""用户意图识别和目标 Agent 选择。"""

from __future__ import annotations

import re
from typing import Any, Mapping

from app.common.alarm import AlarmCodeParser
from app.contracts import RouteResult

from .graph import build_router_graph


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
        rules = {
            "quality": {"零件质量": 5, "质量检测": 5, "尺寸检测": 5, "外观检测": 4, "材料检测": 4, "功能检测": 4, "生产出来": 3, "成品质检": 5, "零件质检": 5},
            "cad": {"cad": 5, "bom": 5, "图纸": 5, "结构": 3, "零件": 1, "物料": 3, "位置": 4, "在哪里": 4, "部件": 1, "组件": 1, "传感器": 1, "装配": 4, "关系": 3},
            "report": {"报告": 4, "日报": 5, "维修记录": 4},
            "workorder_query": {"查询工单": 6, "工单状态": 6, "维修状态": 3, "查看工单": 6, "获取工单": 6},
            "workorder_action": {"创建工单": 7, "新建工单": 7, "生成工单": 7, "派工": 6, "关闭工单": 7, "更新工单": 6, "重新打开工单": 7},
            "memory": {"历史维修经验": 5, "维修经验": 5, "经验库": 5, "类似案例": 5, "历史案例": 5},
            "maintenance": {"维修方案": 6, "怎么修": 7, "怎么维修": 7, "维修步骤": 6, "检修": 4, "维修": 3, "修理": 4, "维护": 3, "保养": 3, "更换": 4},
            "knowledge": {"手册": 4, "sop": 5, "规范": 4, "案例": 2, "怎么检查": 5, "含义": 4, "说明": 3},
            "diagnosis": {"诊断": 5, "故障": 3, "报警": 2, "异常": 2, "为什么": 5, "原因": 5},
        }
        scores = {candidate: sum(weight for keyword, weight in keywords.items() if keyword.lower() in text) for candidate, keywords in rules.items()}
        if entities.get("alarm_code") and any(keyword in text for keyword in ("什么", "含义", "处理", "步骤", "说明", "手册", "sop")):
            scores["knowledge"] = scores.get("knowledge", 0) + 4
        ranked = sorted(((score, candidate) for candidate, score in scores.items() if score), reverse=True)
        if ranked:
            best_score, candidate = ranked[0]
            if len(ranked) > 1 and ranked[1][0] == best_score and candidate not in {"workorder_action", "workorder_query"}:
                return "need_more_context", "检测到多个同等优先级意图：%s" % ", ".join(item[1] for item in ranked if item[0] == best_score)
            return candidate, "根据意图得分完成路由：%s=%s" % (candidate, best_score)
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
        alarm_code = AlarmCodeParser.extract(text)
        if alarm_code:
            entities["alarm_code"] = alarm_code
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
