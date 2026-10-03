"""知识补检在真实领域图内有界执行，失败不得推进维修。"""
from runtime_slimming_adapter import build_test_orchestrator, documents


def _event():
    return {"event_id": "EVT-EVIDENCE", "device_id": "D-SLIM", "alarm_code": "700001",
            "required_capabilities": ["document_search", "repair_planning", "workorder_create"]}


def test_trigger_evidence_loop_refines_knowledge_query_once(tmp_path, monkeypatch):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[
        {"documents": []}, {"documents": []}, {"documents": documents(query="处理700001 报警定义 含义 检查")},
    ])
    result = runtime.run_abnormal_event({**_event(), "required_capabilities": ["document_search"]})
    assert result["knowledge"]["status"] == "completed"
    assert len(runtime.test_rag.calls) == 3
    assert runtime.test_rag.calls[0]["query"] == runtime.test_rag.calls[1]["query"]
    assert "报警定义 含义 检查" in runtime.test_rag.calls[2]["query"]
    assert result["knowledge"]["query"] == runtime.test_rag.calls[2]["query"]
    refined = [item for item in result["trace"] if item.get("event") == "step_started"
               and item.get("agent") == "knowledge" and item.get("node") == "refine_query"]
    assert len(refined) == 1


def test_trigger_stops_before_workorder_when_evidence_is_still_missing(tmp_path, monkeypatch):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    result = runtime.run_abnormal_event(_event())
    assert result["runtime_result"]["status"] == "blocked"
    assert result["stop_reason"] == "knowledge_evidence_gate"
    assert not result.get("workorder")
    assert len(runtime.test_rag.calls) == 3
    assert len({call["query"] for call in runtime.test_rag.calls}) == 2
    agents = {item.get("agent") for item in result["trace"] if item.get("event") == "step_started"}
    assert not agents.intersection({"maintenance", "workorder", "memory", "report"})
    assert not [call for call in runtime.test_boundary.calls if call[1] == "create_workorder"]


def test_orchestrator_returns_runtime_evidence_block_without_legacy_edges(tmp_path, monkeypatch):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    result = runtime.run_abnormal_event({
        "event_id": "EVT-BLOCK", "device_id": "D-2",
        "required_capabilities": ["document_search", "repair_planning", "workorder_create"],
    })
    assert result["runtime_result"]["status"] == "blocked"
    assert result["stop_reason"] == "knowledge_evidence_gate"
    assert not result.get("workorder")
    assert not [call for call in runtime.test_boundary.calls if call[1] == "create_workorder"]
