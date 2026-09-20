from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Mapping


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.quality import QualityAgent
from app.tools.registry import ToolRegistry
from app.trace import TraceRecorder
from app.workorder import WorkOrderService


class StaticQualityTools:
    """隔离外部 PLC/MES，用于覆盖报警未清除的确定性分支。"""

    def __init__(self) -> None:
        self.calls: list[str] = []
        self.workorder = {
            "workorder_id": "WO-QUALITY-FAIL",
            "device_id": "CNC-001",
            "status": "completed",
            "title": "主轴温度维修",
            "steps": ["检查冷却泵", "复测温度"],
            "repair_feedback": "已完成检查和复测",
        }

    def execute(self, name: str, arguments: Mapping[str, Any]) -> dict[str, Any]:
        self.calls.append(name)
        if name == "get_workorder":
            return dict(self.workorder)
        if name == "get_repair_feedback":
            return {"found": True, "success": True, "repair_feedback": self.workorder["repair_feedback"], "complete": True}
        if name == "verify_repair":
            return {"passed": True, "device_recovered": True, "alarm_cleared": False, "sop_compliant": True}
        if name == "check_workorder_compliance":
            return {"passed": True, "status_ok": True, "steps_complete": True, "steps": self.workorder["steps"], "has_feedback": True}
        if name == "get_device_status":
            return {"found": True, "success": True, "status": "running", "alarm_code": "E102", "metrics": {"spindle_temperature_c": 60}}
        if name == "get_active_alarms":
            return {"success": True, "active_alarms": [{"alarm_code": "E102"}]}
        if name == "verify_alarm_clearance":
            return {"passed": False, "alarm_cleared": False, "active_alarms": [{"alarm_code": "E102"}]}
        if name == "get_device_history":
            return {"success": True, "trend": {"spindle_temperature_c": {"latest": 60}}}
        if name == "compare_pre_post_metrics":
            return {"success": True, "parameters_recovered": True, "comparisons": []}
        if name == "check_sop":
            return {"passed": True, "documents": [{"document_id": "SOP-001"}]}
        if name == "reopen_workorder":
            self.workorder["status"] = "open"
            return dict(self.workorder)
        if name == "close_workorder":
            self.workorder["status"] = "closed"
            return dict(self.workorder)
        raise AssertionError("unexpected tool: %s" % name)


def test_quality_graph_contains_documented_nodes() -> None:
    agent = QualityAgent(ToolRegistry())
    node_names = set(agent.graph.get_graph().nodes)
    assert {
        "initialize", "load_skill", "load_workorder", "load_repair_feedback", "verify_device",
        "verify_alarm", "verify_parameters", "verify_sop", "validate", "decision", "final", "fallback",
    }.issubset(node_names)


def test_quality_pass_closes_workorder_and_uses_knowledge_provider() -> None:
    trace = TraceRecorder()
    tools = ToolRegistry(trace=trace)
    workorders = WorkOrderService(tools)
    order = workorders.create("CNC-001", "主轴温度维修", steps=["检查冷却泵", "空载复测"])
    workorders.mark_repair_completed(order["workorder_id"], feedback="冷却泵检查完成，复测温度正常")
    provider_calls: list[dict[str, Any]] = []

    def knowledge_provider(context: Mapping[str, Any], query: str) -> dict[str, Any]:
        provider_calls.append({"context": dict(context), "query": query})
        return {"documents": [{"document_id": "SOP-COOLING-001"}], "evidence": [{"document_id": "SOP-COOLING-001"}], "source": "knowledge-a2a"}

    result = QualityAgent(tools, knowledge_provider=knowledge_provider).run({"workorder": workorders.get(order["workorder_id"])})

    assert result.passed is True
    assert result.status == "pass"
    assert result.sop_compliance is True
    assert result.stop_reason == "validator_pass"
    assert workorders.get(order["workorder_id"])["status"] == "completed"
    assert provider_calls and provider_calls[0]["context"]["required_sources"] == ["sop"]
    tool_names = {item.get("name") for item in trace.list() if item.get("type") == "tool"}
    assert {"get_workorder", "get_repair_feedback", "get_device_status", "get_active_alarms", "check_workorder_compliance", "verify_alarm_clearance", "compare_pre_post_metrics"}.issubset(tool_names)


def test_quality_reopens_workorder_when_alarm_remains_active() -> None:
    tools = StaticQualityTools()
    result = QualityAgent(tools).run({"workorder": dict(tools.workorder)})

    assert result.passed is False
    assert result.status == "fail"
    assert result.alarm_cleared is False
    assert "alarm_still_active" in result.failed_checks
    assert tools.workorder["status"] == "completed"
    assert "reopen_workorder" not in tools.calls
