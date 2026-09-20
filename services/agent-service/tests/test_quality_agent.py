from __future__ import annotations

from pathlib import Path

import sys


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.quality import QualityAgent
from app.tools.registry import ToolRegistry


def test_quality_graph_contains_only_production_inspection_nodes() -> None:
    agent = QualityAgent(ToolRegistry())
    node_names = set(agent.graph.get_graph().nodes)
    assert {
        "initialize", "load_skill", "load_part", "load_inspection_plan",
        "inspect_dimensions", "inspect_appearance", "inspect_material",
        "inspect_function", "inspect_process", "validate_part", "decision",
        "final", "fallback",
    }.issubset(node_names)
    assert not {
        "load_workorder", "load_repair_feedback", "verify_device", "verify_alarm",
        "verify_parameters", "verify_sop", "validate",
    }.intersection(node_names)


def test_quality_agent_inspects_produced_part_by_default() -> None:
    result = QualityAgent(ToolRegistry()).run({"part_id": "PART-001", "inspection_type": "part_quality"})

    assert result.inspection_type == "part_quality"
    assert result.part_id == "PART-001"
    assert result.qualified is True
    assert result.quality_grade == "合格"
    assert {item["name"] for item in result.inspection_items} == {"尺寸检测", "外观检测", "材料检测", "功能检测", "工艺追溯检测"}
    assert all(item["passed"] for item in result.inspection_items)
    assert {item["type"] for item in result.evidence} == {"part_identity", "dimensions", "appearance", "material", "function", "process"}


def test_quality_agent_returns_part_defects_for_failed_measurement() -> None:
    result = QualityAgent(ToolRegistry()).run({
        "inspection_type": "part_quality",
        "part": {
            "part_id": "PART-BAD",
            "part_no": "PART-BAD-NO",
            "measurements": {"outer_diameter_mm": 50.50},
            "appearance": {"scratch": True},
            "material": {"grade": "铝"},
            "function": {"rotation_test": False},
            "process": {"cycle_complete": True, "traceable": True, "operator_confirmed": True},
            "specifications": {"outer_diameter_mm": {"min": 49.98, "max": 50.02}, "material_grade": "45钢"},
        },
    })

    assert result.qualified is False
    assert "dimension_not_qualified" in result.failed_checks
    assert "appearance_not_qualified" in result.failed_checks
    assert result.defects


def test_quality_agent_does_not_expose_repair_acceptance_tools() -> None:
    registry = ToolRegistry()
    names = {schema["function"]["name"] for schema in registry.tool_schemas()}
    assert {
        "get_production_part", "get_part_specification", "inspect_part_dimensions",
        "inspect_part_appearance", "inspect_part_material", "inspect_part_function",
        "inspect_part_process",
    }.issubset(names)
    assert not {
        "verify_repair", "check_sop", "check_workorder_compliance",
        "compare_pre_post_metrics", "verify_alarm_clearance", "get_repair_feedback",
    }.intersection(names)
