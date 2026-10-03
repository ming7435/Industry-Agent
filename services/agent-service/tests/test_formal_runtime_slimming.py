"""精简后仍通过正式 Runtime 验证安全门禁，不替换被测编排器。"""

from runtime_slimming_adapter import build_test_orchestrator
import json
import pytest


@pytest.mark.parametrize("extra,allowed", [({}, True), ({"synthetic": True}, False),
                                         ({"requires_human_review": True}, False),
                                         ({"evidence_validated": False}, False)])
def test_normalized_diagnosis_keeps_original_evidence_and_safety_gate(extra, allowed):
    from app.agents.maintenance.agent import MaintenanceAgent
    from app.workorder.policy import auto_workorder_decision
    view = MaintenanceAgent._normalize_diagnosis({
        "device_id": "D-SLIM", "fault": "检修", "confidence": 0.95,
        "evidence": ["设备检查记录"], "evidence_status": "ready",
        "evidence_validated": True, "maintenance_required": True, **extra,
    })
    decision, _ = auto_workorder_decision(view.model_dump(), {
        "maintenance_required": True, "workorder_ready": True,
    })
    assert decision is allowed


def test_shared_runtime_keeps_two_device_queries_and_results_separate(tmp_path, monkeypatch):
    from runtime_slimming_adapter import documents
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[
        {"documents": documents("DEVICE-A", "甲设备检查")},
        {"documents": documents("DEVICE-A", "甲设备检查")},
        {"documents": documents("DEVICE-B", "乙设备检查")},
        {"documents": documents("DEVICE-B", "乙设备检查")},
    ])
    first = runtime.run_abnormal_event({"event_id": "EA", "device_id": "DEVICE-A", "alarm_code": "A01",
                                       "user_text": "甲设备检查", "required_capabilities": ["document_search"]})
    snapshot = json.dumps(first, ensure_ascii=False)
    second = runtime.run_abnormal_event({"event_id": "EB", "device_id": "DEVICE-B", "alarm_code": "B02",
                                        "user_text": "乙设备检查", "required_capabilities": ["document_search"]})
    assert first["runtime_result"]["status"] == second["runtime_result"]["status"] == "completed"
    assert json.dumps(first, ensure_ascii=False) == snapshot
    assert all(call["filters"]["device_id"] == "DEVICE-A" and "甲设备" in call["query"] for call in runtime.test_rag.calls[:2])
    assert all(call["filters"]["device_id"] == "DEVICE-B" and "乙设备" in call["query"] for call in runtime.test_rag.calls[2:])
    assert all(doc["document_id"].startswith("DEVICE-B-") for doc in second["knowledge"]["documents"])
    assert "DEVICE-A" not in json.dumps(second["knowledge"], ensure_ascii=False)
    assert all(item["task_id"] == second["task_id"] and item["trace_id"] == second["trace_id"] for item in second["trace"])


def _ready_state(**plan_updates):
    diagnosis = {
        "device_id": "D-SLIM", "fault": "检修", "confidence": 0.95,
        "evidence": ["设备检查记录"], "evidence_status": "ready",
    }
    return {
        "diagnosis": diagnosis,
        "knowledge": {"documents": [{"document_id": "DOC-SLIM", "source": "test"}]},
        "cad": {"components": [{"component_id": "C-SLIM", "device_id": "D-SLIM"}]},
        "maintenance_plan": {
            "device_id": "D-SLIM", "diagnosis": diagnosis,
            "workorder_ready": True, "maintenance_required": True,
            "repair_steps": ["确认安全隔离后检查"], **plan_updates,
        },
    }


def test_formal_runtime_has_no_automatic_workorder_without_maintenance_need(tmp_path, monkeypatch):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    result = runtime._execute_graph({
        "entry": "trigger",
        "event": {"event_id": "EVT-NO-REPAIR", "device_id": "D-SLIM", "required_capabilities": ["workorder_create"]},
        **_ready_state(maintenance_required=False),
    })
    assert not result.get("workorder", {}).get("workorder_id")
    assert not [call for call in runtime.test_boundary.calls if call[1] == "create_workorder"]
    assert "无需维修" in str(result["runtime_result"])


def test_formal_runtime_empty_evidence_stops_before_maintenance_and_dispatch(tmp_path, monkeypatch):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    result = runtime.run_abnormal_event({
        "event_id": "EVT-NO-EVIDENCE", "device_id": "D-SLIM",
        "required_capabilities": ["document_search", "repair_planning", "workorder_create"],
    })
    assert result["runtime_result"]["status"] == "blocked"
    started_agents = {item.get("agent") for item in result["trace"] if item.get("event") == "step_started"}
    assert "knowledge" in started_agents
    assert not started_agents.intersection({"maintenance", "workorder", "memory", "report"})
    assert not result.get("workorder")
    assert 1 <= len(runtime.test_rag.calls) <= 12
    assert not [call for call in runtime.test_boundary.calls if call[1] == "create_workorder"]


def test_formal_runtime_complementary_retrieval_recovers_with_bounded_calls(tmp_path, monkeypatch):
    documents = [{
        "document_id": "DOC-" + kind, "title": "检修手册",
        "content": "检修时先确认安全隔离，然后检查设备。",
        "source": "test-manual", "score": 0.99, "metadata": {"knowledge_type": kind},
    } for kind in ("manual", "sop", "case", "alarm")]
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[
        {"documents": []}, {"documents": documents},
    ])
    result = runtime.run_abnormal_event({
        "event_id": "EVT-RECOVER-KNOWLEDGE", "device_id": "D-SLIM",
        "user_text": "检修手册", "required_capabilities": ["document_search"],
    })
    assert result["knowledge"]["status"] == "completed"
    assert len(runtime.test_rag.calls) == 2
    assert len(result["knowledge"]["documents"]) == 4
    assert result["runtime_result"]["status"] == "completed"
    assert not [call for call in runtime.test_boundary.calls if call[1] == "create_workorder"]


def test_formal_runtime_diagnosis_review_uses_real_agent_and_bounded_model_calls(tmp_path, monkeypatch):
    def candidate(confidence):
        return {"choices": [{"message": {"role": "assistant", "content": json.dumps({
            "summary": "设备需要检查", "diagnosis": "检修", "confidence": confidence,
            "recommendation": "检查设备", "maintenance_required": True,
        }, ensure_ascii=False)}}]}

    documents = [{
        "document_id": "DOC-REVIEW-" + kind, "title": "设备需要检查",
        "content": "设备需要检查：检修时先确认安全隔离。", "source": "test-manual",
        "score": 0.99, "metadata": {"knowledge_type": kind},
    } for kind in ("manual", "sop", "case", "alarm")]
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[
        candidate(0.42),
        candidate(0.42),
        candidate(0.95),
        {"choices": [{"message": {"role": "assistant", "content": "", "tool_calls": [{
            "id": "READ-DEVICE", "type": "function", "function": {
                "name": "get_device_logs", "arguments": json.dumps({"device_id": "D-SLIM"}),
            },
        }]}}]},
        candidate(0.95),
    ], rag_results=[{"documents": documents}] * 4)
    runtime.test_boundary.responses[("knowledge", "get_alarm_definition")] = {
        "success": True, "found": True, "alarm_code": "700001", "name": "检修",
        "description": "设备需要检查", "source": "isolated-test-alarm",
    }
    runtime.test_boundary.responses[("plc", "get_device_logs")] = {
        "success": True, "found": True, "device_id": "D-SLIM",
        "logs": [{"message": "设备检查记录"}], "source": "isolated-test-device",
    }
    result = runtime.run_abnormal_event({
        "event_id": "EVT-REVIEW-SLIM", "device_id": "D-SLIM", "alarm_code": "700001",
        "realtime_snapshot": {"device_id": "D-SLIM", "status": "fault", "metrics": {"signal": 1}},
        "required_capabilities": ["fault_analysis"],
    })
    # 真实结果使用证据加权，不把模型自报的 0.95 当作最终置信度。
    assert result["diagnosis"]["confidence"] == 0.985
    assert len(runtime.test_model.calls) == 5
    assert len([item for item in result["trace"] if item.get("event") == "replan"]) >= 1
    assert len([call for call in runtime.test_boundary.calls if call[1] == "get_device_logs"]) == 1
    assert not result.get("workorder")
