import sys
from pathlib import Path

import pytest


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.a2a import (  # noqa: E402
    A2AClient,
    A2AError,
    KnowledgeRequest,
    KnowledgeResponse,
    QualityRequest,
    QualityResponse,
    is_allowed_a2a_route,
)
from app.graph import build_orchestrator  # noqa: E402
from app.tools.registry import ToolRegistry  # noqa: E402


def _request(source: str = "diagnosis", target: str = "knowledge") -> KnowledgeRequest:
    return KnowledgeRequest(
        request_id="A2A-REQ-001",
        task_id="TASK-001",
        trace_id="TRACE-001",
        from_agent=source,
        to_agent=target,
        query="主轴温度异常",
    )


def test_a2a_collaboration_matrix_matches_design() -> None:
    assert is_allowed_a2a_route("diagnosis", "knowledge")
    assert is_allowed_a2a_route("maintenance", "cad")
    assert is_allowed_a2a_route("quality", "maintenance")
    assert not is_allowed_a2a_route("diagnosis", "report")
    assert not is_allowed_a2a_route("quality", "cad")
    assert not is_allowed_a2a_route("knowledge", "diagnosis")


def test_a2a_protocol_payload_contains_subtype_fields() -> None:
    request = _request()
    protocol = request.to_protocol_dict()
    assert protocol["message_id"] == request.request_id
    assert protocol["source_agent"] == "diagnosis"
    assert protocol["target_agent"] == "knowledge"
    assert protocol["payload"]["query"] == "主轴温度异常"


def test_a2a_response_must_correlate_with_request() -> None:
    client = A2AClient()

    def handler(request: KnowledgeRequest) -> KnowledgeResponse:
        return KnowledgeResponse(
            request_id=request.request_id,
            reply_to=request.message_id,
            task_id=request.task_id,
            trace_id=request.trace_id,
            from_agent="knowledge",
            to_agent=request.from_agent,
        )

    client.register("knowledge", handler)
    response = client.request(_request(), KnowledgeResponse)
    assert response.reply_to == "A2A-REQ-001"
    assert response.trace_id == "TRACE-001"

    def mismatched_handler(request: KnowledgeRequest) -> KnowledgeResponse:
        return KnowledgeResponse(
            request_id="A2A-WRONG",
            reply_to=request.message_id,
            task_id=request.task_id,
            trace_id=request.trace_id,
            from_agent="knowledge",
            to_agent=request.from_agent,
        )

    client.register("knowledge", mismatched_handler)
    with pytest.raises(A2AError, match="request_id"):
        client.request(_request(), KnowledgeResponse)


def test_a2a_rejects_routes_outside_collaboration_matrix() -> None:
    client = A2AClient()
    client.register("diagnosis", lambda request: {})
    request = _request(source="knowledge", target="diagnosis")
    with pytest.raises(A2AError, match="协作路径"):
        client.request(request, KnowledgeResponse)


def test_quality_contract_and_quality_to_maintenance_rework_a2a() -> None:
    quality_request = QualityRequest(
        request_id="A2A-QUALITY-001",
        task_id="TASK-QUALITY-001",
        trace_id="TRACE-QUALITY-001",
        from_agent="router",
        to_agent="quality",
        workorder_id="WO-001",
    )
    assert quality_request.message_id == quality_request.request_id
    assert quality_request.source_agent == "router"
    assert quality_request.target_agent == "quality"

    orchestrator = build_orchestrator(tools=ToolRegistry())
    plan = orchestrator.nodes._maintenance_request(
        {
            "entry": "trigger",
            "task_id": "TASK-REWORK-001",
            "trace_id": "TRACE-REWORK-001",
            "context": {"device_id": "CNC-001"},
            "quality": {"passed": False, "failed_checks": ["alarm_still_active"]},
        },
        {"device_id": "CNC-001", "fault": "主轴温度异常", "severity": "high"},
        {"documents": [{"document_id": "SOP-001"}], "evidence": [{"document_id": "SOP-001"}]},
        {"components": [{"component_id": "COOLING-PUMP", "name": "冷却泵"}]},
        quality={"passed": False, "failed_checks": ["alarm_still_active"]},
    )
    assert isinstance(plan, dict)
    a2a_calls = [item for item in orchestrator.nodes.trace_records() if item.get("type") == "a2a"]
    assert any(item.get("from_agent") == "quality" and item.get("to_agent") == "maintenance" for item in a2a_calls)


def test_quality_response_has_structured_result_fields() -> None:
    response = QualityResponse(
        request_id="A2A-QUALITY-002",
        reply_to="A2A-QUALITY-REQ-002",
        task_id="TASK-QUALITY-002",
        trace_id="TRACE-QUALITY-002",
        from_agent="quality",
        to_agent="router",
        passed=False,
        rework_required=True,
        validation_findings=["报警仍然存在"],
        stop_reason="validator_fail",
    )
    assert response.rework_required is True
    assert response.validation_findings == ["报警仍然存在"]


def test_diagnosis_and_maintenance_can_request_memory_with_explicit_sources() -> None:
    orchestrator = build_orchestrator(tools=ToolRegistry())
    state = {
        "task_id": "TASK-MEMORY-SOURCE-001",
        "trace_id": "TRACE-MEMORY-SOURCE-001",
        "entry": "user",
        "user_text": "查询主轴轴承历史经验",
        "context": {"device_id": "CNC-001"},
        "diagnosis": {"device_id": "CNC-001", "fault": "主轴轴承异常"},
    }

    orchestrator.nodes._memory_request(state, action="search", query="主轴轴承异常", from_agent="diagnosis")
    orchestrator.nodes._memory_request(state, action="search", query="主轴轴承异常", from_agent="maintenance")

    calls = [item for item in orchestrator.nodes.trace_records() if item.get("type") == "a2a" and item.get("to_agent") == "memory"]
    assert {item.get("from_agent") for item in calls} >= {"diagnosis", "maintenance"}


def test_api_quality_entry_uses_quality_a2a_and_updates_workorder() -> None:
    orchestrator = build_orchestrator(tools=ToolRegistry())
    order = orchestrator.nodes.workorder_service.create(
        device_id="CNC-001",
        title="主轴温度异常维修",
        steps=["检查冷却回路"],
    )
    orchestrator.nodes.workorder_service.mark_repair_completed(
        order["workorder_id"],
        feedback="已完成维修并提交复测",
    )

    result = orchestrator.nodes.quality_workorder(order["workorder_id"])

    assert result["workorder"]["workorder_id"] == order["workorder_id"]
    assert any(
        item.get("type") == "a2a"
        and item.get("from_agent") == "workorder"
        and item.get("to_agent") == "quality"
        for item in orchestrator.nodes.trace_records()
    )
