"""无需工程拆修的核查任务不能被无关 CAD 服务阻断。"""
from threading import Event
from time import sleep
from copy import deepcopy

import pytest

from runtime_slimming_adapter import build_fault_scenario, documents
from app.runtime.action import ActionModel
from app.runtime.evaluator import RuntimeEvaluator
from app.runtime.event_store import EventResultStore, scoped_event_key
from app.runtime.policy import RuntimePolicy, PolicyStatus
from app.api.maintenance_plans import list_saved_maintenance_plans


def hydraulic_runtime(tmp_path, monkeypatch):
    device = "OPTIONAL-CAD-HYDRAULIC"
    runtime, event = build_fault_scenario(tmp_path, monkeypatch, device_id=device,
        event_id="EVENT-OPTIONAL-CAD", fault="液压压力未达到")
    event.update(alarm_code="700010", severity="critical")
    event["realtime_snapshot"].update(alarm_code="700010", metrics={"hydraulic_pressure": 450})
    runtime.test_boundary.responses[("knowledge", "get_alarm_definition")].update(
        alarm_code="700010", severity="critical")
    sources = documents(device, "液压压力未达到")
    for document in sources:
        document["content"] = "液压压力未达到：保持停机，检查液压油位、外部可见泄漏和压力反馈，记录异常。"
    runtime.test_rag.results = [{"documents": sources, "source": "isolated-test-rag"} for _ in range(6)]
    runtime.container.event_results = EventResultStore()
    return runtime, event


def test_hydraulic_fixed_check_reaches_plan_and_order_without_calling_timed_out_cad(tmp_path, monkeypatch):
    runtime, event = hydraulic_runtime(tmp_path, monkeypatch)
    entered, release = Event(), Event()

    def slow_cad(_arguments):
        entered.set()
        release.wait(1)
        return {"components": [], "drawings": [], "bom_items": [], "source": "isolated-empty-cad"}

    for operation in ("query_part", "query_drawing", "query_bom", "query_relation", "fetch_engineering_record"):
        runtime.test_boundary.responses[("cad", operation)] = slow_cad
    original_timeout = runtime.container.dispatcher.action_timeout_seconds
    monkeypatch.setattr(runtime.container.dispatcher, "action_timeout_seconds", lambda action:
        0.03 if action.target == "cad" else original_timeout(action))
    try:
        result = runtime.container.event_results.get_or_create(scoped_event_key(event),
            lambda: runtime.run_abnormal_event(event))
    finally:
        release.set()
        if entered.is_set():
            sleep(0.2)  # 只等待隔离只读 worker 收尾，避免跨测试继续写临时 Trace。
    assert result.get("maintenance_plan", {}).get("workorder_ready") is True, {
        "status": result.get("status"), "stop_reason": result.get("stop_reason"),
        "runtime_result": result.get("runtime_result"),
    }
    assert result["runtime_result"]["status"] == "completed"
    assert len(runtime.container.workorder_service.list()) == 1
    assert not entered.is_set()
    assert not result.get("cad")
    records = runtime.container.event_results.list_results()
    projected = list_saved_maintenance_plans(records)["items"]
    assert len(projected) == 1
    assert projected[0]["plan_id"] == result["maintenance_plan"]["plan_id"]
    assert projected[0]["event_id"] == event["event_id"]
    assert projected[0]["dispatch"]["status"] == "dispatched"
    assert projected[0]["dispatch"]["workorder_id"] == runtime.container.workorder_service.list()[0]["workorder_id"]
    skipped = [row for row in runtime.container.trace.list() if row.get("event") == "optional_action_skipped"]
    assert len(skipped) == 1
    assert skipped[0]["state_change"]["capability"] == "drawing_search"
    assert "cad" not in result["runtime_result"]["actions"]
    assert not any(row.get("tool_name") in {"query_part", "query_drawing", "query_bom"}
                   for row in runtime.container.trace.list() if row.get("event") == "tool_completed")
    assert runtime.test_reservations == []
    assert not any(operation in {"start_device", "stop_device", "start_line", "stop_line"}
                   for _, operation, _ in runtime.test_boundary.calls)

    # 跳过查询不赋予工程依据：篡改方案为换件仍必须经过最终 Policy。
    altered = deepcopy(result)
    altered["maintenance_plan"]["repair_steps"].append("更换液压泵")
    action = ActionModel.agent("workorder", {"required_capability": "workorder_create"},
        side_effect=True, idempotency_key="isolated-tamper-probe")
    assert RuntimePolicy().evaluate(action, altered).status == PolicyStatus.DENY


def ready_state():
    from test_hydraulic_plan_dispatch import hydraulic_diagnosis, hydraulic_knowledge
    diagnosis = hydraulic_diagnosis(status="completed")
    return {"entry": "trigger", "diagnosis": diagnosis,
            "event": {"event_id": "ISOLATED", "device_id": diagnosis["device_id"], "alarm_code": "700010"},
            "knowledge": {"status": "completed", **hydraulic_knowledge()}}


@pytest.mark.parametrize("change", [
    {"entry": "user"}, {"diagnosis": {"requires_human_review": True}},
    {"diagnosis": {"status": "fallback"}}, {"diagnosis": {"confidence": 0.4}},
    {"diagnosis": {"evidence_status": "insufficient"}}, {"diagnosis": {"evidence_validated": False}},
    {"diagnosis": {"device_id": "OTHER"}}, {"diagnosis": {"alarm_code": "700006"}},
    {"event": {"synthetic": True}}, {"knowledge": {"status": "insufficient_evidence"}},
    {"knowledge": {"synthetic": True}}, {"knowledge": {"degraded": True}},
    {"knowledge": {"documents": [], "evidence": []}},
    {"knowledge": {"documents": [{"document_id": "CATALOG", "content": "700010 液压压力未达到"}]}},
    {"knowledge": {"documents": [{"document_id": "FAKE", "synthetic": True,
        "content": "液压油位、泄漏和压力检查"}]}},
    {"diagnosis": {"alarm_definition": {"name": "刀塔旋转超时"}, "fault": "刀塔旋转超时"}},
])
def test_optional_cad_never_widens_unknown_or_unverified_paths(tmp_path, monkeypatch, change):
    runtime, _ = hydraulic_runtime(tmp_path, monkeypatch)
    coordinator = runtime.container.coordinator
    action = ActionModel.agent("cad", {"required_capability": "drawing_search"})
    remaining = [ActionModel.agent("maintenance", {"required_capability": "repair_planning"})]
    state = ready_state()
    assert coordinator._optional_drawing_reason(action, state, remaining, RuntimeEvaluator())
    for key, value in change.items():
        state[key] = {**state[key], **value} if isinstance(value, dict) else value
    assert coordinator._optional_drawing_reason(action, state, remaining, RuntimeEvaluator()) == ""


def test_explicit_engineering_query_is_not_skipped_without_following_repair_plan(tmp_path, monkeypatch):
    runtime, _ = hydraulic_runtime(tmp_path, monkeypatch)
    state = ready_state()
    state.update(entry="user", user_text="查询设备图纸", context={"device_id": state["event"]["device_id"]})
    result = runtime.container.coordinator.run(state)
    assert any(server == "cad" for server, _, _ in runtime.test_boundary.calls)
    assert "cad" in result["runtime_result"]["actions"]
    assert not any(row.get("event") == "optional_action_skipped" for row in runtime.container.trace.list())
    assert runtime.container.workorder_service.list() == []


def test_missing_knowledge_stops_before_optional_cad_and_cannot_create_plan_or_order(tmp_path, monkeypatch):
    runtime, event = hydraulic_runtime(tmp_path, monkeypatch)
    runtime.test_rag.results = []
    result = runtime.run_abnormal_event(event)
    assert result["runtime_result"]["status"] == "blocked"
    assert result["runtime_result"]["stop_reason"] == "knowledge_evidence_gate"
    assert not result.get("maintenance_plan")
    assert not any(row.get("event") == "optional_action_skipped" for row in runtime.container.trace.list())
    assert runtime.container.workorder_service.list() == []


def test_fault_without_fixed_check_profile_still_requires_real_engineering(tmp_path, monkeypatch):
    runtime, event = build_fault_scenario(tmp_path, monkeypatch,
        device_id="UNKNOWN-PROFILE", event_id="EVENT-UNKNOWN-PROFILE", fault="刀塔旋转超时")
    for operation in ("query_part", "query_drawing", "query_bom", "query_relation", "fetch_engineering_record"):
        runtime.test_boundary.responses[("cad", operation)] = {
            "components": [], "drawings": [], "bom_items": [], "source": "isolated-empty-cad"}
    result = runtime.run_abnormal_event(event)
    assert any(server == "cad" for server, _, _ in runtime.test_boundary.calls)
    assert result["runtime_result"]["status"] == "blocked"
    assert not any(row.get("event") == "optional_action_skipped" for row in runtime.container.trace.list())
    assert runtime.container.workorder_service.list() == []
