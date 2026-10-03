"""删除空跳转后仍保持真实检测、证据和错误门禁。"""

import pytest

from app.agents.maintenance.agent import MaintenanceAgent
from app.agents.quality.agent import QualityAgent
from app.tools.registry import ToolRegistry


class QmsTransport:
    """隔离的外部 QMS 返回体；Agent 图及其验证器保持真实。"""

    def __init__(self, missing=""):
        self.missing = missing
        self.calls = []

    def call(self, server, operation, arguments):
        self.calls.append((server, operation, arguments))
        if operation == "get_production_part":
            return {"success": True, "found": True, "identity_verified": True, "part": {"part_id": "PART-1"}, "source": "qms"}
        if operation == "get_part_specification":
            return {"success": True, "specifications": {} if self.missing == "specifications" else {"length_mm": {"min": 9.9, "max": 10.1}}}
        if operation == self.missing:
            return {"status": "not_tested", "sufficient_data": False, "passed": False, "source": "qms"}
        return {"status": "pass", "sufficient_data": True, "passed": True, "source": "qms", "items": [{"passed": True}], "defects": []}


def quality_agent(monkeypatch, missing=""):
    tools = ToolRegistry()
    transport = QmsTransport(missing)
    monkeypatch.setattr(tools.mcp, "call", transport.call)
    return QualityAgent(tools), transport


def test_quality_graph_has_no_noop_decision_node(monkeypatch):
    agent, transport = quality_agent(monkeypatch)
    assert "decision" not in agent.graph.nodes
    result = agent.run({"part_id": "PART-1"})
    assert result.passed is True
    assert [operation for _, operation, _ in transport.calls] == [
        "get_production_part", "get_part_specification", "inspect_part_dimensions",
        "inspect_part_appearance", "inspect_part_material", "inspect_part_function", "inspect_part_process",
    ]
    assert len(result.inspection_items) == 5


@pytest.mark.parametrize("missing", ["inspect_part_appearance", "inspect_part_material", "inspect_part_function", "specifications"])
def test_quality_missing_category_still_cannot_pass(monkeypatch, missing):
    agent, transport = quality_agent(monkeypatch, missing)
    result = agent.run({"part_id": "PART-1"})
    assert result.passed is False
    assert result.failed_checks
    assert len(transport.calls) == 7


def test_maintenance_graph_has_no_unreachable_fallback_registration():
    assert "fallback" not in MaintenanceAgent().graph.nodes


def test_maintenance_error_is_not_success():
    def failing_knowledge(context, query):
        raise LookupError("取证失败")

    agent = MaintenanceAgent(knowledge_provider=failing_knowledge)
    with pytest.raises(LookupError, match="取证失败"):
        agent.run({"diagnosis": {"device_id": "D-1", "fault": "主轴温度", "confidence": 0.9, "maintenance_required": True}})


def test_maintenance_insufficient_evidence_is_not_workorder_ready():
    agent = MaintenanceAgent(knowledge_provider=lambda context, query: {}, cad_provider=lambda context, query: {})
    result = agent.run({"diagnosis": {"device_id": "D-1", "fault": "主轴温度", "confidence": 0.9, "maintenance_required": True}})
    assert result.workorder_ready is False
    assert result.validation_findings
