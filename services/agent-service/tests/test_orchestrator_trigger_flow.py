from runtime_slimming_adapter import build_test_orchestrator


def test_trigger_report_does_not_start_memory_learning(tmp_path, monkeypatch):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    result = runtime.run_abnormal_event({
        "event_id": "EVT-INCIDENT-REPORT", "device_id": "D-SLIM",
        "required_capabilities": ["case_reporting"],
    })
    assert result["report"]["report_id"]
    assert result["report"]["report_type"] == "incident_report"
    assert "memory" not in result
    assert not [item for item in result["trace"] if item.get("agent") == "memory"]


def test_orchestrator_response_trace_isolated_to_current_task_and_trace(tmp_path, monkeypatch):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    trace = runtime.container.trace
    trace.record(task_id="OTHER", trace_id="OTHER-TRACE", event="old")
    first = runtime.run_abnormal_event({"event_id": "EVT-FIRST", "required_capabilities": ["document_search"]})
    result = runtime.run_abnormal_event({"event_id": "EVT-SECOND", "required_capabilities": ["document_search"]})
    assert result["trace"]
    assert result["task_id"] != first["task_id"]
    assert all(item["task_id"] == result["task_id"] and item["trace_id"] == result["trace_id"] for item in result["trace"])


def test_orchestrator_loads_only_active_runtime_node(tmp_path, monkeypatch):
    orchestrator = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])

    assert type(orchestrator.nodes).__name__ == "RuntimeNode"


def test_same_event_has_one_task_and_one_workorder(monkeypatch):
    from fastapi.testclient import TestClient
    from app.api.server import create_app

    # 该 E2E 验证 Runtime 契约，不依赖测试进程中可用的外部 RAG 服务。
    monkeypatch.setenv("RAG_ALLOW_LOCAL_FALLBACK", "true")
    monkeypatch.setenv("RAG_SERVICE_TIMEOUT_SECONDS", "1")
    from app.graph import build_orchestrator
    runtime = build_orchestrator()
    client = TestClient(create_app(runtime))
    event = {"event_id": "EVT-E2E-1", "device_id": "D-1", "alarm_code": "E102", "event_type": "alarm"}
    first = client.post("/api/v1/agent/event", json={"event": event}).json()
    second = client.post("/api/v1/agent/event", json={"event": event}).json()
    assert second["task_id"] == first["task_id"]
    # 低置信度或需人工复核时必须阻断自动派单，不能把诊断结果伪装成工单已进入维修。
    assert first["status"] == "blocked"
    assert first["runtime_result"]["status"] == "blocked"
    assert "workorder" not in first or not first.get("workorder")
    assert first["runtime_plan"]["actions"]
    planned_capabilities = [item["payload"]["required_capability"] for item in first["runtime_plan"]["actions"]]
    assert planned_capabilities
    assert planned_capabilities[:2] == ["document_search", "diagnosis_review"]
    # 新计划保留未完成后续任务，但证据门禁之前绝不能实际启动这些 Agent。
    executed_agents = {item.get("agent") for item in first["trace"] if item.get("event") == "step_started"}
    assert not executed_agents.intersection({"cad", "maintenance", "workorder", "memory", "report"})
    trace_events = {item.get("event") for item in first["trace"]}
    assert {
        "goal_parsed", "planner_start", "planner_end", "capability_selected", "action_selected",
        "execution_start", "execution_end", "evidence_added", "evaluation_result", "loop_continue", "loop_stop",
    } <= trace_events
    assert client.get('/api/workorders').status_code == 401
    # 自动编排的服务查询不冒充维修人员的浏览器会话。
    orders = runtime.container.operations.execute_workorder('query', {})['items']
    matching = [item for item in orders if item.get("event_id") == "EVT-E2E-1"]
    assert matching == []
