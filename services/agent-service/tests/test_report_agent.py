from __future__ import annotations

import json
import sys
import tempfile
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.report import ReportAgent
from app.tools.registry import ToolRegistry


def _case() -> dict:
    return {
        "report_type": "full_case_report",
        "task_id": "TASK-REPORT-001",
        "trace_id": "TRACE-REPORT-001",
        "diagnosis": {
            "event_id": "EVT-001",
            "device_id": "CNC-001",
            "fault": "主轴温度异常",
            "diagnosis_run_id": "RUN-001",
            "source": "diagnosis-record",
        },
        "maintenance_plan": {
            "plan_id": "PLAN-001",
            "repair_target": "主轴冷却系统",
            "repair_steps": ["检查冷却泵"],
            "source_documents": ["SOP-COOLING-001"],
        },
        "workorder": {
            "workorder_id": "WO-001",
            "device_id": "CNC-001",
            "status": "closed",
            "title": "主轴温度维修",
            "steps": ["检查冷却泵"],
            "repair_feedback": "已检查冷却泵并完成复测",
        },
        "quality": {
            "part_id": "PART-001",
            "part_no": "PART-001-NO",
            "passed": True,
            "status": "pass",
            "qualified": True,
            "quality_grade": "合格",
        },
        "trace": [{"type": "node", "name": "quality"}],
    }


def test_report_graph_contains_documented_nodes() -> None:
    graph = ReportAgent(ToolRegistry()).graph.get_graph()
    assert {"initialize", "load_skill", "collect_sources", "check_completeness", "compose", "validate", "persist", "final", "fallback"}.issubset(set(graph.nodes))


def test_report_agent_collects_validates_and_persists_sources() -> None:
    tools = ToolRegistry()
    result = ReportAgent(tools).run(_case())

    assert result.report_type == "full_case_report"
    assert result.status == "completed"
    assert result.persisted is True
    assert result.sections["maintenance_plan"]["repair_steps"] == ["检查冷却泵"]
    assert any(item["section"] == "quality" for item in result.source_refs)
    assert tools.report_store[result.report_id]["report_id"] == result.report_id


def test_report_file_tool_exports_json_without_new_facts() -> None:
    tools = ToolRegistry()
    result = ReportAgent(tools).run({"report_type": "diagnosis_report", "diagnosis": _case()["diagnosis"], "persist": False})
    with tempfile.TemporaryDirectory() as directory:
        path = str(Path(directory) / "report.json")
        exported = tools.generate_report_file(report=result.model_dump(mode="json"), path=path)
        assert exported["generated"] is True
        saved = json.loads(Path(path).read_text(encoding="utf-8"))
        assert saved["report_id"] == result.report_id
        assert saved["sections"]["diagnosis"]["fault"] == "主轴温度异常"


def test_report_agent_fallback_is_structured_for_empty_input() -> None:
    result = ReportAgent(ToolRegistry()).run({})

    assert result.status == "incomplete"
    assert result.stop_reason == "validation_failed"
    assert result.validation_findings
