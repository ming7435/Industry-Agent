from types import SimpleNamespace

import pytest

from app.runtime.action import ActionModel
from app.runtime.capability import build_capability_registry
from app.runtime.coordinator import RuntimeCoordinator
from app.tools.registry import ToolRegistry


def test_alarm_action_uses_event_scoped_skill_tools() -> None:
    coordinator = RuntimeCoordinator(SimpleNamespace(capabilities=build_capability_registry()))
    action = ActionModel.agent("knowledge", {"required_capability": "document_search"})

    selected = coordinator._enrich_action(
        action,
        {"event": {"event_id": "EVT-1", "device_id": "D-1", "alarm_code": "700001"}, "context": {}},
    )
    allowed = selected.payload["allowed_tools"]

    assert selected.payload["active_skills"] == ["alarm_search_skill"]
    assert {"search_alarm_knowledge", "search_knowledge", "fetch_document", "fetch_chunk"} <= set(allowed)
    assert "search_manual" not in allowed
    tools = ToolRegistry()
    assert tools.guard_call("search_alarm_knowledge", {"query": "700001"}, context={"allowed_tools": allowed})["allow"] is True
    assert tools.guard_call("search_manual", {"query": "700001"}, context={"allowed_tools": allowed})["reason"] == "tool_not_allowed_for_step"


def test_action_payload_cannot_expand_selected_skill_tool_scope() -> None:
    coordinator = RuntimeCoordinator(SimpleNamespace(capabilities=build_capability_registry()))
    action = ActionModel.agent("knowledge", {
        "required_capability": "document_search",
        "allowed_tools": ["delete_workorder", "search_manual"],
    })

    selected = coordinator._enrich_action(action, {"event": {"alarm_code": "700001"}, "context": {}})

    assert "delete_workorder" not in selected.payload["allowed_tools"]
    assert "search_manual" not in selected.payload["allowed_tools"]
    assert "search_alarm_knowledge" in selected.payload["allowed_tools"]


def test_action_payload_cannot_select_broad_default_skill_for_alarm() -> None:
    coordinator = RuntimeCoordinator(SimpleNamespace(capabilities=build_capability_registry()))
    action = ActionModel.agent("knowledge", {
        "required_capability": "document_search",
        "active_skills": ["hybrid_search_skill"],
    })

    selected = coordinator._enrich_action(action, {"event": {"alarm_code": "700001"}, "context": {}})

    assert selected.payload["active_skills"] == ["alarm_search_skill"]
    assert "search_manual" not in selected.payload["allowed_tools"]


def test_explicit_empty_runtime_tool_scope_denies_calls() -> None:
    tools = ToolRegistry()

    assert tools.guard_call("search_knowledge", {"query": "轴承"}, context={"allowed_tools": []}) == {
        "allow": False,
        "reason": "tool_not_allowed_for_step",
    }
    assert tools.guard_call("search_knowledge", {"query": "轴承"})["allow"] is True


@pytest.mark.parametrize(
    ("agent", "capability", "event", "required"),
    [
        ("report", "case_reporting", {"report_type": "closure"}, {"get_diagnosis_record", "get_maintenance_record", "get_quality_record", "get_trace_summary", "persist_report"}),
        ("cad", "drawing_search", {"component": "主轴"}, {"query_part", "query_drawing", "query_bom", "query_relation"}),
        ("maintenance", "repair_planning", {"component": "主轴"}, {"generate_repair_plan", "query_inventory", "query_part_availability", "get_workorder_template", "submit_workorder_draft"}),
    ],
)
def test_skill_scope_keeps_tools_used_by_fixed_agent_graph(agent, capability, event, required) -> None:
    coordinator = RuntimeCoordinator(SimpleNamespace(capabilities=build_capability_registry()))
    action = ActionModel.agent(agent, {"required_capability": capability})

    selected = coordinator._enrich_action(action, {"event": event, "context": {}})
    allowed = selected.payload["allowed_tools"]

    assert required <= set(allowed)
    registry = ToolRegistry()
    for name in required:
        assert registry.guard_call(name, {}, context={"allowed_tools": allowed})["allow"] is True
