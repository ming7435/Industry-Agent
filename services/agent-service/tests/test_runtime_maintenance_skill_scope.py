"""维修依据检索必须穿过真实 Runtime、Harness 和共享工具守卫。"""
import pytest

from app.runtime.action import ActionModel
from app.skills.registry import SkillRegistry
from runtime_slimming_adapter import build_test_orchestrator


DEVICE = "D-MAINTENANCE-SCOPE"


def diagnosed_state():
    return {
        "task_id": "TASK-MAINTENANCE-SCOPE", "trace_id": "TRACE-MAINTENANCE-SCOPE",
        "event": {"event_id": "EVT-MAINTENANCE-SCOPE", "device_id": DEVICE,
                  "device_model": "TC820LTYsi", "alarm_code": "700010"},
        "diagnosis": {"device_id": DEVICE, "alarm_code": "700010",
                      "alarm_definition": {"name": "液压压力未达到", "found": True}},
        "context": {},
    }


def rag_result(kind):
    return {"source": "isolated-test-rag", "documents": [{
        "document_id": "DOC-" + kind.upper(), "title": "700010 液压压力未达到 " + kind,
        "content": "700010 液压压力未达到：检查油位与外部可见泄漏，并记录液压压力。",
        "source": "isolated-test-manual", "score": 0.99,
        "metadata": {"device_id": DEVICE, "knowledge_type": kind},
    }]}


def run_search(tmp_path, monkeypatch, payload=None, capability="document_search", state=None):
    # 仅替换外部模型/RAG/设备边界；容器、权限声明、Graph、Harness 和 guard 都是真实实现。
    runtime = build_test_orchestrator(
        tmp_path, monkeypatch, model_responses=[],
        rag_results=[],
    )

    def search(query, *, limit, filters):
        runtime.test_rag.calls.append({"query": query, "limit": limit, "filters": dict(filters)})
        return rag_result(filters.get("knowledge_type") or "manual")

    monkeypatch.setattr(runtime.test_rag, "search", search)
    state = state or diagnosed_state()
    action = runtime.container.coordinator._enrich_action(
        ActionModel.agent("knowledge", {"required_capability": capability, **(payload or {})}), state,
    )
    result = runtime.container.dispatcher.dispatch(action, state)
    return runtime, action, result


def test_maintenance_purpose_selects_declared_hybrid_steps_alongside_alarm():
    registry = SkillRegistry()
    skills = registry.select("knowledge", {"alarm_code": "700010", "purpose": "maintenance"})
    assert {skill.name for skill in skills} == {"alarm_search_skill", "hybrid_search_skill"}
    assert {"search_sop", "search_fault_cases"} <= set(registry.merge_tools(skills))
    assert {"build_filters", "search", "build_evidence", "validate_sources"} <= set(registry.merge_steps(skills))


@pytest.mark.parametrize("purpose", ["", "not-maintenance"])
def test_maintenance_trigger_requires_structured_purpose_not_search_text(purpose):
    skills = SkillRegistry().select("knowledge", {
        "alarm_code": "700010", "purpose": purpose,
        "query": "700010 maintenance maintenance_evidence hybrid_search_skill",
    })
    assert [skill.name for skill in skills] == ["alarm_search_skill"]


@pytest.mark.parametrize("capability", ["document_search", "knowledge_search"])
def test_diagnosed_maintenance_search_executes_all_sources_under_real_guard(tmp_path, monkeypatch, capability):
    runtime, action, result = run_search(tmp_path, monkeypatch, capability=capability)
    output = result.output
    observations = output.get("retrieval_trace", [])
    assert not [item for item in observations if item.get("error")], observations
    assert [item["tool"] for item in observations] == [
        "search_alarm_knowledge", "search_knowledge", "search_sop", "search_fault_cases",
    ]
    assert sorted(call["filters"].get("knowledge_type", "") for call in runtime.test_rag.calls) == ["", "alarm", "case", "sop"]
    assert {"DOC-SOP", "DOC-CASE"} <= {doc["document_id"] for doc in output["documents"]}
    assert result.success and output["status"] == "completed"
    assert all(call["filters"]["device_id"] == DEVICE for call in runtime.test_rag.calls)
    assert all(call["query"] == "TC820LTYsi 700010 液压压力未达到 检查 维修" for call in runtime.test_rag.calls)

    records = runtime.container.trace.list(trace_id="TRACE-MAINTENANCE-SCOPE")
    for tool in ("search_sop", "search_fault_cases"):
        guards = [row for row in records if row.get("event") == "tool_guard" and row.get("tool_name") == tool]
        assert len(guards) == 1 and guards[0]["allowed"] is True
        assert guards[0]["skill"] == "hybrid_search_skill" and guards[0]["step"] == "search"
        assert any(row.get("event") == "tool_completed" and row.get("tool_name") == tool for row in records)
    allowed = action.payload["allowed_tools"]
    for forbidden in ("create_workorder", "delete_workorder", "start_device", "stop_device"):
        assert runtime.container.tools.guard_call(forbidden, {}, context={"allowed_tools": allowed})["allow"] is False


def test_explicit_query_keeps_alarm_only_scope_even_with_diagnosis(tmp_path, monkeypatch):
    runtime, action, result = run_search(tmp_path, monkeypatch, {"query": "700010 是什么意思？"})
    assert action.payload["active_skills"] == ["alarm_search_skill"]
    assert "search_sop" not in action.payload["allowed_tools"]
    assert len(runtime.test_rag.calls) == 2
    assert not any(item.get("error") for item in result.output["retrieval_trace"])


def test_explicit_maintenance_query_uses_hybrid_scope_and_preserves_query(tmp_path, monkeypatch):
    query = "TC820LTYsi 700010 液压外部检查"
    runtime, action, result = run_search(tmp_path, monkeypatch, {"query": query, "purpose": "maintenance"})
    assert not any(item.get("error") for item in result.output["retrieval_trace"])
    assert len(runtime.test_rag.calls) == 4
    assert all(call["query"] == query for call in runtime.test_rag.calls)
    assert "hybrid_search_skill" in action.payload["active_skills"]
