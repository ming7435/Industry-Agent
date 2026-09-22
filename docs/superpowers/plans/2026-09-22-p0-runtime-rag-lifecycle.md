# P0 Runtime, WorkOrder and RAG Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 收敛 Monitor/Agent 单运行时，建立事件与工单双层幂等，修正自动异常与关闭后学习生命周期，并补齐 standalone RAG 的写入/读取契约。

**Architecture:** Monitor 只采样、判断规则并 POST 原始 `AbnormalEvent`；Agent Service 的单一 Orchestrator 执行自动图，在创建工单后以 `pipeline.status=waiting_repair` 结束。EventStore 先提供进程内去重抽象，WorkOrder adapter 统一处理 `monitor:<event_id>` 幂等；关闭入口保存的工单上下文驱动一次 Memory learn、远程 RAG upsert 和注入式 Full Case Report。Trace 在 Node/Agent/Tool 边界补齐 `task_id/trace_id`，RAG Service 与 Agent client 通过 `/documents/*` 规范化接口交互。

**Tech Stack:** Python 3、FastAPI、LangGraph、Pydantic、pytest、现有 A2A/Skill/Tool Registry、urllib HTTP client、现有 RAG storage/retriever 组件。

**Spec:** `docs/superpowers/specs/2026-09-22-p0-runtime-rag-lifecycle-design.md`

## Global Constraints

- 保持现有 9 个 Agent、A2A、Skill、Tool Registry 和 API 契约兼容；新增字段只追加，不删除现有字段。
- 自动入口严格为 `Diagnosis -> Knowledge -> CAD -> Maintenance -> WorkOrder -> END`。
- 自动异常完成时 `pipeline.status=waiting_repair`，底层 `workorder.status=open`（或已派工后的合法状态）。
- 自动异常工单幂等键固定为 `monitor:<event_id>`；重复 Event POST 返回首次 task/pipeline。
- Memory Learn 仅允许在工单 `closed` 且 `WorkOrderValidator.can_learn(order, feedback)` 为真时执行。
- 经验幂等键固定为 `workorder:<workorder_id>`，原始 event 作为 `source_event_id` 元数据。
- RAG upsert 返回每个后端状态；任一必需后端写失败时整体 `success=false`，不得静默伪装成功。
- Monitor 调用 Agent Service 失败时只记录错误，不在 Monitor 内执行 Agent 或创建工单。

## Review Focus

- 同一 `event_id` 并发/重复 POST：必须返回同一 task/pipeline 且只执行一次图；由任务 1 的 Event idempotency 测试覆盖。
- 自动图完成状态：`pipeline.status` 与 `workorder.status` 不能混淆，且 trigger 分支不得执行 Report/Memory；由任务 2 的 graph 测试覆盖。
- Trace 记录缺失 `trace_id` 或串入其他 task：由任务 2 的 tracing/orchestrator 测试覆盖。
- Close 缺少反馈、重复 close、重开后再次 close：不得重复 Memory/RAG/Report；由任务 4 的 lifecycle 测试覆盖。
- RAG Milvus/MySQL/Whoosh 部分失败：响应必须暴露后端状态并返回 `success=false`；由任务 5 的 contract 测试覆盖。

### Task 1: Remove Monitor Runtime and Add Agent Event Idempotency

**Files:**
- Modify: `services/agent-service/monitor_web_server.py`
- Create: `services/agent-service/app/runtime/event_store.py`
- Modify: `services/agent-service/app/api/server.py`
- Test: `services/agent-service/tests/test_monitor_web_server.py`
- Test: `services/agent-service/tests/test_monitor_dispatch.py`

**Interfaces:**
- Consumes: `AbnormalEvent.to_dict()`, existing `AGENT_SERVICE_BASE_URL`, `POST /api/v1/agent/event`.
- Produces: `EventResultStore.get_or_create(event_id, producer) -> dict`, where duplicate calls return the original response; Monitor `dispatch_agent_event(event) -> dict` only calls Agent Service.

- [ ] **Step 1: Write the failing tests**

```python
def test_monitor_state_does_not_construct_agent_runtime(monkeypatch):
    import monitor_web_server
    assert not hasattr(monitor_web_server.MonitorWebState, "orchestrator")
    assert not hasattr(monitor_web_server.MonitorWebState, "diagnosis_agent")


def test_duplicate_event_returns_original_agent_result():
    from app.runtime.event_store import EventResultStore
    store = EventResultStore()
    first = store.get_or_create("EVT-1", lambda: {"task_id": "TASK-1", "status": "waiting_repair"})
    second = store.get_or_create("EVT-1", lambda: {"task_id": "TASK-2"})
    assert first == second
    assert second["task_id"] == "TASK-1"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest services/agent-service/tests/test_monitor_web_server.py services/agent-service/tests/test_monitor_dispatch.py -q`

Expected: FAIL because Monitor still owns an orchestrator and EventResultStore does not exist.

- [ ] **Step 3: Write the minimal implementation**

Remove Monitor imports/construction of `DiagnosisAgent`, `AgentHarness`, `build_orchestrator`, `ToolRegistry`, executor and diagnosis callback. Add `dispatch_agent_event()` that serializes the event and POSTs `/api/v1/agent/event`; `_on_trigger` submits that function and stores the returned pipeline. Add `EventResultStore` with a lock and bounded dict keyed by `event_id`; wrap `create_app`’s abnormal-event handler with it so duplicate event requests return the first response. Preserve deprecated `/api/agent/event` alias.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest services/agent-service/tests/test_monitor_web_server.py services/agent-service/tests/test_monitor_dispatch.py -q`

Expected: PASS; no Monitor-owned Agent runtime remains and duplicate events reuse the first result.

- [ ] **Step 5: Commit**

```bash
git add services/agent-service/monitor_web_server.py services/agent-service/app/runtime/event_store.py services/agent-service/app/api/server.py services/agent-service/tests/test_monitor_web_server.py services/agent-service/tests/test_monitor_dispatch.py
git commit -m "refactor: route monitor events through single agent runtime"
```

### Task 2: Fix Automatic Graph Lifecycle and Trace Context

**Files:**
- Modify: `services/agent-service/app/graph/workflow.py`
- Modify: `services/agent-service/app/graph/nodes.py`
- Modify: `services/agent-service/app/runtime/tracing.py`
- Modify: `services/agent-service/app/graph/state.py`
- Test: `services/agent-service/tests/test_orchestrator_trigger_flow.py`
- Test: `services/agent-service/tests/test_trace_recorder.py`

**Interfaces:**
- Consumes: `AgentState.task_id`, `AgentState.trace_id`, existing `OrchestratorNodes.workorder`.
- Produces: trigger graph result with `status="waiting_repair"`, `workorder.status="open"`, no trigger `memory`/`report`; every NodeTrace record has both IDs; `_execute_graph()` returns only current IDs.

- [ ] **Step 1: Write the failing tests**

```python
def test_trigger_graph_stops_after_workorder(monkeypatch):
    from app.graph.workflow import build_orchestrator
    runtime = build_orchestrator()
    result = runtime.run_abnormal_event({"event_id": "EVT-TRIGGER-1", "device_id": "D-1", "alarm_code": "E102"})
    assert result["status"] == "waiting_repair"
    assert result["workorder"]["status"] == "open"
    assert "memory" not in result
    assert "report" not in result


def test_node_trace_records_current_trace_id():
    from app.harness.trace import TraceRecorder
    from app.runtime.tracing import NodeTrace
    recorder = TraceRecorder()
    tracer = NodeTrace(recorder)
    state = {"task_id": "TASK-1", "trace_id": "TRACE-1"}
    tracer.start("route", state)
    tracer.finish("route", state, {"route": "diagnosis"})
    assert all(item["task_id"] == "TASK-1" and item["trace_id"] == "TRACE-1" for item in recorder.list())
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest services/agent-service/tests/test_orchestrator_trigger_flow.py services/agent-service/tests/test_trace_recorder.py -q`

Expected: FAIL because `workorder` currently continues to `report`, trigger `report` learns memory, and NodeTrace omits `trace_id`.

- [ ] **Step 3: Write the minimal implementation**

Change `graph.add_edge("workorder", END)`. Remove trigger-side Memory Learn from `OrchestratorNodes.report`; leave report available for explicit user/report routes. Ensure `workorder` returns pipeline `status="waiting_repair"` while preserving returned order status. Pass `trace_id` in `NodeTrace.start/finish` records and update any Agent/Tool tracing adapters that construct records without it. In `_execute_graph`, filter `self.container.trace.list(trace_id=state["trace_id"], task_id=state["task_id"])` before assigning `result["trace"]`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest services/agent-service/tests/test_orchestrator_trigger_flow.py services/agent-service/tests/test_trace_recorder.py -q`

Expected: PASS and no cross-task trace entries in trigger responses.

- [ ] **Step 5: Commit**

```bash
git add services/agent-service/app/graph/workflow.py services/agent-service/app/graph/nodes.py services/agent-service/app/runtime/tracing.py services/agent-service/app/graph/state.py services/agent-service/tests/test_orchestrator_trigger_flow.py services/agent-service/tests/test_trace_recorder.py
git commit -m "fix: stop trigger graph after workorder and isolate trace"
```

### Task 3: Enforce WorkOrder Idempotency and Preserve Closure Context

**Files:**
- Modify: `services/agent-service/app/mcp/workorder.py`
- Modify: `services/agent-service/app/workorder/service.py`
- Modify: `services/agent-service/app/runtime/operations.py`
- Modify: `services/agent-service/app/api/server.py`
- Modify: `services/agent-service/app/graph/nodes.py`
- Test: `services/agent-service/tests/test_workorder_idempotency.py`
- Test: `services/agent-service/tests/test_closure_flow.py`

**Interfaces:**
- Consumes: `idempotency_key`, `event_id`, diagnosis and maintenance plan state.
- Produces: `WorkOrderMcpAdapter.create_workorder(..., idempotency_key="monitor:<event_id>", event_id=...)` returning an existing order on duplicate; order fields `event_id`, `diagnosis_snapshot`, `maintenance_plan_snapshot`, `idempotency_key`.

- [ ] **Step 1: Write the failing tests**

```python
def test_workorder_create_is_idempotent_by_key():
    from app.mcp.workorder import WorkOrderMcpAdapter
    adapter = WorkOrderMcpAdapter()
    first = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-1", event_id="EVT-1")
    second = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-1", event_id="EVT-1")
    assert first["workorder_id"] == second["workorder_id"]
    assert len(adapter.orders) == 1


def test_auto_workorder_keeps_diagnosis_and_plan_snapshots():
    from app.mcp.workorder import WorkOrderMcpAdapter
    adapter = WorkOrderMcpAdapter()
    order = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-2", event_id="EVT-2", diagnosis_snapshot={"fault": "f"}, maintenance_plan_snapshot={"repair_steps": ["replace"]})
    assert order["event_id"] == "EVT-2"
    assert order["diagnosis_snapshot"]["fault"] == "f"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest services/agent-service/tests/test_workorder_idempotency.py services/agent-service/tests/test_closure_flow.py -q`

Expected: FAIL because adapter ignores idempotency/context fields and always creates a new ID.

- [ ] **Step 3: Write the minimal implementation**

Add an `_idempotency_index` mapping in `WorkOrderMcpAdapter`; check it before UUID generation and return a copy of the existing order. Add optional context fields to `create_workorder` and persist them in the order. Update `WorkOrderService.create_from_plan` and `RuntimeOperations.execute_workorder` to pass `idempotency_key`, `event_id`, snapshots, and preserve them in the API path. For trigger nodes, derive `idempotency_key="monitor:%s" % event_id` before calling `execute_workorder`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest services/agent-service/tests/test_workorder_idempotency.py services/agent-service/tests/test_closure_flow.py -q`

Expected: PASS; repeated event creation returns one order and close has complete diagnosis/plan context.

- [ ] **Step 5: Commit**

```bash
git add services/agent-service/app/mcp/workorder.py services/agent-service/app/workorder/service.py services/agent-service/app/runtime/operations.py services/agent-service/app/api/server.py services/agent-service/app/graph/nodes.py services/agent-service/tests/test_workorder_idempotency.py services/agent-service/tests/test_closure_flow.py
git commit -m "fix: make workorder creation idempotent and context preserving"
```

### Task 4: Gate Memory Learn and Inject Full Case Report on Close

**Files:**
- Modify: `services/agent-service/app/runtime/operations.py`
- Modify: `services/agent-service/app/runtime/container.py`
- Modify: `services/agent-service/app/agents/report/agent.py`
- Modify: `services/agent-service/app/agents/report/graph.py`
- Modify: `services/agent-service/app/memory/service.py`
- Test: `services/agent-service/tests/test_memory_lifecycle.py`

**Interfaces:**
- Consumes: closed WorkOrder with feedback, saved snapshots, `workorder:<id>` learning key, injected `report` harness.
- Produces: one close response containing `memory_result` and, on successful learn, `report` with `report_type="full_case_report"`; repeated close is a no-op for learning/report.

- [ ] **Step 1: Write the failing tests**

```python
def test_close_with_valid_feedback_learns_once_then_reports(monkeypatch):
    from app.api.server import create_app
    from fastapi.testclient import TestClient
    client = TestClient(create_app())
    created = client.post("/api/workorders", json={"device_id": "D-1", "title": "fault", "idempotency_key": "monitor:EVT-3"}).json()
    workorder_id = created["workorder_id"]
    client.post(f"/api/v1/workorders/{workorder_id}/complete", json={"feedback": "replaced", "verification": {"passed": True}})
    closed = client.post(f"/api/workorders/{workorder_id}/action", json={"action": "close", "repair_feedback": {"feedback": "replaced"}}).json()
    assert closed["memory_result"]["success"] is True
    assert closed["report"]["report_type"] == "full_case_report"


def test_close_without_feedback_does_not_learn_or_report():
    from app.mcp.workorder import WorkOrderMcpAdapter
    from app.workorder.validator import WorkOrderValidator
    adapter = WorkOrderMcpAdapter()
    order = adapter.create_workorder("D-1", "fault", idempotency_key="monitor:EVT-4")
    closed = adapter.close_workorder(order["workorder_id"])
    assert not WorkOrderValidator.can_learn(closed, closed.get("repair_feedback"))
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest services/agent-service/tests/test_memory_lifecycle.py -q`

Expected: FAIL because close does not yet invoke an injected report path and duplicate learning is not guarded by a WorkOrder key.

- [ ] **Step 3: Write the minimal implementation**

Inject the existing report harness/agent through `AgentContainer` into `RuntimeOperations` (do not instantiate `ReportAgent` inside close). After a successful close, compute `learning_idempotency_key="workorder:<workorder_id>"`, include `source_event_id`, snapshots, feedback and verification in the learn state, and guard repeated calls with an in-process learning-result cache keyed by that value. On first successful learn, execute the injected report harness with `report_type="full_case_report"`; return per-stage errors without reopening or rolling back the order. Ensure `ExperienceLearningModule` forwards the stable key into its deduplicator/RAG payload.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest services/agent-service/tests/test_memory_lifecycle.py services/agent-service/tests/test_closure_flow.py -q`

Expected: PASS; valid close runs learn → RAG → full case report once, invalid/repeated close does not.

- [ ] **Step 5: Commit**

```bash
git add services/agent-service/app/runtime/operations.py services/agent-service/app/runtime/container.py services/agent-service/app/agents/report/agent.py services/agent-service/app/agents/report/graph.py services/agent-service/app/memory/service.py services/agent-service/tests/test_memory_lifecycle.py
git commit -m "feat: gate memory learning and report on closed workorders"
```

### Task 5: Complete Standalone RAG Documents Contract

**Files:**
- Modify: `services/rag-service/app/api/models.py`
- Modify: `services/rag-service/app/api/routes.py`
- Modify: `services/rag-service/app/api/deps.py`
- Modify: `services/rag-service/app/storage.py`
- Modify: `services/rag-service/app/milvus/writer.py`
- Modify: `services/rag-service/app/mysql/writer.py`
- Modify: `services/rag-service/app/whoosh/indexer.py`
- Modify: `services/agent-service/app/rag/client.py`
- Create: `services/rag-service/tests/test_rag_api_contract.py`
- Test: `services/agent-service/tests/test_rag_remote_contract.py`

**Interfaces:**
- Consumes: `DocumentUpsertRequest(document_id, content, metadata, collection, chunks)`, existing storage/indexer/writer APIs.
- Produces: `POST /documents/upsert`, `POST /documents/ingest`, `GET /documents/{document_id}`, `GET /documents/{document_id}/chunks/{chunk_id}` with `{success, backends, document}`; Agent client uses canonical paths and retains old aliases.

- [ ] **Step 1: Write the failing tests**

```python
def test_rag_upsert_and_fetch_document_contract():
    from fastapi.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    payload = {"document_id": "EXP-1", "content": "repaired spindle", "metadata": {"source_event_id": "EVT-1"}, "collection": "maint_fault_events"}
    response = client.post("/documents/upsert", json=payload)
    assert response.status_code == 200
    assert response.json()["success"] is True
    fetched = client.get("/documents/EXP-1")
    assert fetched.status_code == 200
    assert fetched.json()["document"]["document_id"] == "EXP-1"


def test_rag_partial_backend_failure_is_visible(monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import app
    monkeypatch.setenv("RAG_TEST_FAIL_WHOOSH", "1")
    result = TestClient(app).post("/documents/upsert", json={"document_id": "EXP-2", "content": "x", "metadata": {}, "collection": "cases"}).json()
    assert result["success"] is False
    assert result["backends"]["whoosh"]["success"] is False
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pytest services/rag-service/tests/test_rag_api_contract.py services/agent-service/tests/test_rag_remote_contract.py -q`

Expected: FAIL with 404 because standalone RAG currently exposes only `/search` and `/health`, and Agent client posts legacy `/upsert`.

- [ ] **Step 3: Write the minimal implementation**

Add Pydantic request/response models and routes. Keep a document/chunk metadata registry in the existing storage abstraction, call available MySQL/Milvus/Whoosh writers, collect `{success, error}` for each backend, and derive overall success from required backend outcomes. Add canonical GET routes and compatibility POST aliases. Change Agent `RAGServiceClient.ingest_jsonl`, `upsert`, `fetch_document`, and `fetch_chunk` to canonical paths; only use local fallback when configured, and surface remote partial-failure responses unchanged.

- [ ] **Step 4: Run tests to verify they pass**

Run: `pytest services/rag-service/tests/test_rag_api_contract.py services/agent-service/tests/test_rag_remote_contract.py -q`

Expected: PASS for upsert/fetch/search, and partial backend failure is explicit.

- [ ] **Step 5: Commit**

```bash
git add services/rag-service/app/api/models.py services/rag-service/app/api/routes.py services/rag-service/app/api/deps.py services/rag-service/app/storage.py services/rag-service/app/milvus/writer.py services/rag-service/app/mysql/writer.py services/rag-service/app/whoosh/indexer.py services/agent-service/app/rag/client.py services/rag-service/tests/test_rag_api_contract.py services/agent-service/tests/test_rag_remote_contract.py
git commit -m "feat: complete standalone rag document contract"
```

### Task 6: End-to-End Regression and Verification

**Files:**
- Modify: `services/agent-service/tests/test_requests_public_api.py`
- Modify: `services/agent-service/tests/test_monitor_web_server.py`
- Modify: `services/agent-service/tests/test_orchestrator_trigger_flow.py`
- Modify: `services/agent-service/tests/test_workorder_idempotency.py`
- Modify: `services/agent-service/tests/test_memory_lifecycle.py`
- Modify: `services/agent-service/tests/test_rag_remote_contract.py`

**Interfaces:**
- Consumes: all task outputs and existing public FastAPI endpoints.
- Produces: repeatable P0 acceptance suite and a documented list of remaining failures unrelated to this scope.

- [ ] **Step 1: Write the failing end-to-end tests**

```python
def test_same_event_has_one_task_and_one_workorder():
    from app.api.server import create_app
    from fastapi.testclient import TestClient
    client = TestClient(create_app())
    event = {"event_id": "EVT-E2E-1", "device_id": "D-1", "alarm_code": "E102", "event_type": "alarm"}
    first = client.post("/api/v1/agent/event", json={"event": event}).json()
    second = client.post("/api/v1/agent/event", json={"event": event}).json()
    assert second["task_id"] == first["task_id"]
    orders = client.get("/api/workorders").json()["items"]
    assert len([item for item in orders if item.get("event_id") == "EVT-E2E-1"]) == 1
```

- [ ] **Step 2: Run the complete suite to verify the baseline failure**

Run: `pytest -q`

Expected: the new acceptance test or affected existing tests fail before all tasks are implemented.

- [ ] **Step 3: Implement only compatibility fixes exposed by the suite**

Adjust response serialization, deprecated aliases, and fixtures so the P0 contract remains compatible without adding unrelated refactors. Do not weaken assertions about task/event/workorder uniqueness or close-gated learning.

- [ ] **Step 4: Run focused and full verification**

Run:

```bash
pytest services/agent-service/tests -q
pytest services/rag-service/tests -q
pytest -q
```

Expected: all in-scope tests pass. Any unrelated pre-existing failure is recorded by file and reason in the final report.

- [ ] **Step 5: Commit**

```bash
git add services/agent-service/tests services/rag-service/tests
git commit -m "test: verify p0 runtime lifecycle and rag contract"
```
