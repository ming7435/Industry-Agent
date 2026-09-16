"""用户意图识别和目标 Agent 选择。"""

from __future__ import annotations

import re
from typing import Any, Mapping
from app.validator import RouteResult

from .validator import RouterValidator


_ALARM_CODE_RE = re.compile(r"\b(?:e|alm)[-]?\d{2,6}\b", re.IGNORECASE)
_DEVICE_RE = re.compile(r"\b(?:CNC|TC|PLC|MACHINE|EQP)[-_]?[A-Z0-9]{2,}\b", re.IGNORECASE)
_WORKORDER_RE = re.compile(r"\bWO[-_]?[A-Z0-9]{2,}\b", re.IGNORECASE)
_PART_RE = re.compile(r"\b(?:PN|PART)[-_]?[A-Z0-9]{2,}\b", re.IGNORECASE)

_REPORT_TYPES = {
    "诊断报告": "diagnosis_report",
    "维修报告": "maintenance_report",
    "质检报告": "quality_report",
    "验收报告": "quality_report",
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

    def run(self, task: Any) -> RouteResult:
        payload = task if isinstance(task, Mapping) else {"user_text": str(task or "")}
        text = str(payload.get("user_text", ""))
        context = dict(payload.get("context") or {})
        entities = self._extract_entities(text, context)
        lowered = text.lower()
        intent, reason = self._classify_intent(lowered, entities)
        target_agent = self._target_agent(intent)
        findings = RouterValidator.validate(intent, target_agent, entities)
        if findings:
            intent = "need_more_context"
            target_agent = "router"
            reason = "路由目标已识别，但缺少必要实体：%s" % "；".join(findings)
        confidence = self._confidence(intent, entities, findings)
        return RouteResult(
            intent=intent,
            target_agent=target_agent,
            confidence=confidence,
            reason=reason,
            entities=entities,
            target_input=self._target_input(text, context, entities, intent),
            validation_findings=findings,
        )

    @staticmethod
    def _classify_intent(text: str, entities: Mapping[str, Any]) -> tuple[str, str]:
        if entities.get("alarm_code") and any(keyword in text for keyword in ("什么", "含义", "处理", "步骤", "说明", "手册", "sop")):
            return "knowledge", "识别到报警码知识问答，路由到 Knowledge Agent"
        rules = [
            ("cad", ("cad", "bom", "图纸", "结构", "零件", "物料", "位置", "在哪里", "部件", "组件", "传感器", "装配", "关系")),
            ("quality", ("验收", "质检", "是否恢复", "复测")),
            ("report", ("报告", "日报", "维修记录")),
            ("workorder_action", ("工单", "派工", "创建工单", "查询工单", "关闭工单")),
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
        entities = {key: value for key, value in context.items() if key in {"device_id", "device_model", "alarm_code", "part_no", "workorder_id", "component", "report_type"} and value}
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
            return "workorder_node"
        if intent in {"diagnosis", "knowledge", "cad", "maintenance", "quality", "report"}:
            return intent
        return "router"

    @staticmethod
    def _target_input(text: str, context: Mapping[str, Any], entities: Mapping[str, Any], intent: str) -> dict[str, Any]:
        target_input = {**context, **entities, "user_text": text, "query": text}
        if intent in {"workorder_action", "workorder_query"}:
            target_input.setdefault("action", "query")
        if intent == "report" and entities.get("report_type"):
            target_input["report_type"] = entities["report_type"]
        return target_input

    @staticmethod
    def _confidence(intent: str, entities: Mapping[str, Any], findings: list[str]) -> float:
        if intent == "unknown":
            return 0.2
        if intent == "need_more_context" or findings:
            return 0.55
        return 0.95 if entities else 0.88
