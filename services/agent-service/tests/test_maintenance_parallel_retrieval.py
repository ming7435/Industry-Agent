"""维修检索并行只隔离外部 RAG，真实 Harness/工具守卫与校验保留。"""
from copy import deepcopy
from threading import Barrier, BrokenBarrierError, Lock, get_ident

import pytest

from app.agents.base import AgentResult
from app.agents.knowledge.graph import retrieve
from app.runtime.action import ActionModel
from app.runtime.dispatcher import RuntimeDispatcher
from runtime_slimming_adapter import build_test_orchestrator


DEVICE = "D-PARALLEL"
OPERATIONS = ["search_alarm_knowledge", "search_knowledge", "search_sop", "search_fault_cases"]


class ParallelRag:
    def __init__(self, tools, parties, fail_kind=None):
        self.tools = tools
        self.barrier = Barrier(parties)
        self.fail_kind = fail_kind
        self.calls = []
        self.lock = Lock()
        self.active = self.peak = 0

    def search(self, query, **kwargs):
        kind = kwargs["filters"].get("knowledge_type", "manual")
        with self.lock:
            self.active += 1
            self.peak = max(self.peak, self.active)
            self.calls.append({"query": query, "filters": deepcopy(kwargs["filters"]),
                               "kind": kind, "thread": get_ident(),
                               "context": self.tools.current_trace_context()})
        try:
            try:
                self.barrier.wait(timeout=2)
            except BrokenBarrierError:
                raise AssertionError("independent searches did not run concurrently") from None
            if kind == self.fail_kind:
                raise RuntimeError("isolated SOP retrieval failure")
            return {"source": "isolated-parallel-rag", "documents": [{
                "document_id": "DOC-" + kind, "title": "700010 液压压力未达到 " + kind,
                "content": "700010 液压压力未达到，保持停机，检查油位、外部泄漏及压力反馈。",
                "source": "isolated-device-manual", "score": .99,
                "metadata": {"device_id": DEVICE, "knowledge_type": kind},
            }]}
        finally:
            with self.lock:
                self.active -= 1


def setup_runtime(tmp_path, monkeypatch, parties=4, fail_kind=None, payload=None):
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=[], rag_results=[])
    state = {"task_id": "TASK-PARALLEL", "trace_id": "TRACE-PARALLEL", "context": {},
             "event": {"event_id": "EVENT-PARALLEL", "device_id": DEVICE, "alarm_code": "700010"},
             "diagnosis": {"device_id": DEVICE, "alarm_code": "700010",
                           "alarm_definition": {"found": True, "name": "液压压力未达到"}}}
    action = runtime.container.coordinator._enrich_action(
        ActionModel.agent("knowledge", {"required_capability": "document_search", **(payload or {})}), state)
    rag = ParallelRag(runtime.container.tools, parties, fail_kind)
    monkeypatch.setattr(runtime.test_rag, "search", rag.search)
    return runtime, state, action, rag


def run_harness(runtime, state, action, **overrides):
    task = RuntimeDispatcher._task_for_agent("document_search", state, action.payload)
    task.update(overrides)
    task["runtime_context"] = RuntimeDispatcher._runtime_context(action, state, "knowledge")
    return AgentResult.from_value(runtime.container.harnesses["knowledge"].execute_once(task))


def test_real_runtime_runs_four_searches_concurrently_with_bound_guard_and_ordered_results(tmp_path, monkeypatch):
    runtime, state, action, rag = setup_runtime(tmp_path, monkeypatch)
    result = runtime.container.dispatcher.dispatch(action, state)
    observations = result.output["retrieval_trace"]
    assert not [item for item in observations if item["error"]], observations
    assert rag.peak == 4 and len({call["thread"] for call in rag.calls}) == 4
    assert [item["tool"] for item in observations] == OPERATIONS
    assert [doc["document_id"] for doc in result.output["documents"]] == ["DOC-alarm", "DOC-manual", "DOC-sop", "DOC-case"]
    assert result.success and result.output["status"] == "completed"
    for call in rag.calls:
        assert call["filters"]["device_id"] == DEVICE
        assert call["context"]["allowed_tools"] == action.payload["allowed_tools"]
        assert call["context"]["skill"] == "hybrid_search_skill"
        assert call["context"]["step"] == "search"
        assert call["context"]["trace_id"] == state["trace_id"]
        assert call["context"]["task_id"] == state["task_id"]
    guards = [row for row in runtime.container.trace.list(trace_id=state["trace_id"]) if row.get("event") == "tool_guard"]
    assert {row["tool_name"] for row in guards} == set(OPERATIONS)
    assert all(row["allowed"] is True for row in guards)


def test_parallel_workers_cannot_escape_narrow_harness_permissions(tmp_path, monkeypatch):
    runtime, state, action, rag = setup_runtime(tmp_path, monkeypatch, parties=3)
    action = action.model_copy(update={"payload": {**action.payload,
        "allowed_tools": [tool for tool in action.payload["allowed_tools"] if tool != "search_sop"]}})
    result = runtime.container.dispatcher.dispatch(action, state)
    observations = result.output["retrieval_trace"]
    assert rag.peak == 3
    assert {call["kind"] for call in rag.calls} == {"alarm", "manual", "case"}
    assert [item["tool"] for item in observations] == OPERATIONS
    failures = [item for item in observations if item["error"]]
    assert len(failures) == 1 and failures[0]["tool"] == "search_sop"
    assert "tool_not_allowed_for_step" in failures[0]["error"]
    guards = [row for row in runtime.container.trace.list(trace_id=state["trace_id"]) if row.get("event") == "tool_guard"]
    assert [row["tool_name"] for row in guards if row["allowed"] is False] == ["search_sop"]
    assert "tool_not_allowed_for_step" in result.output["warning"]


def test_one_failed_source_keeps_other_results_and_required_source_validation(tmp_path, monkeypatch):
    runtime, state, action, rag = setup_runtime(tmp_path, monkeypatch, fail_kind="sop")
    result = run_harness(runtime, state, action, required_sources=["sop"])
    assert rag.peak == 4
    assert [item["tool"] for item in result.output["retrieval_trace"]] == OPERATIONS
    failures = [item for item in result.output["retrieval_trace"] if item["error"]]
    assert len(failures) == 1 and failures[0]["tool"] == "search_sop"
    assert "isolated SOP retrieval failure" in failures[0]["error"]
    assert "isolated SOP retrieval failure" in result.output["warning"]
    assert {doc["document_id"] for doc in result.output["documents"]} == {"DOC-alarm", "DOC-manual", "DOC-case"}
    assert result.output["status"] == "insufficient_evidence"
    assert result.output["validation_findings"]


@pytest.mark.parametrize(("used", "budget", "operations", "expected"), [
    (1, 3, OPERATIONS, 2),
    (0, 8, [*OPERATIONS, "search_manual", "search_semantic_memory"], 4),
])
def test_each_batch_respects_remaining_budget_and_four_worker_cap(tmp_path, monkeypatch, used, budget, operations, expected):
    runtime, state, action, rag = setup_runtime(tmp_path, monkeypatch, parties=expected)
    task = RuntimeDispatcher._task_for_agent("document_search", state, action.payload)
    context = RuntimeDispatcher._runtime_context(action, state, "knowledge")
    with runtime.container.tools.trace_context(context=context):
        result = retrieve({"agent": runtime.container.agents["knowledge"], "request": task,
                           "query": task["query"], "pending_tools": operations,
                           "step_count": used, "max_steps": budget})
    assert not [item for item in result["observations"] if item["error"]], result["observations"]
    assert len(rag.calls) == rag.peak == expected
    assert result["step_count"] == used + expected
    assert result["pending_tools"] == operations[expected:]


def test_ordinary_alarm_queries_keep_sequential_search_flow(tmp_path, monkeypatch):
    runtime, state, action, rag = setup_runtime(tmp_path, monkeypatch, parties=1, payload={"query": "700010 是什么意思"})
    result = runtime.container.dispatcher.dispatch(action, state)
    assert [item["tool"] for item in result.output["retrieval_trace"]] == OPERATIONS[:2]
    assert [call["kind"] for call in rag.calls] == ["alarm", "manual"]
    assert len({call["thread"] for call in rag.calls}) == 1
    assert rag.peak == 1


@pytest.mark.parametrize("lookup", ["document_id", "chunk_id"])
def test_explicit_maintenance_document_lookup_does_not_expand_into_parallel_search(tmp_path, monkeypatch, lookup):
    runtime, state, action, rag = setup_runtime(tmp_path, monkeypatch, parties=1)
    operation = "fetch_chunk" if lookup == "chunk_id" else "fetch_document"
    runtime.test_boundary.responses[("knowledge", operation)] = {
        "found": True, "document_id": "EXACT-DOC", "chunk_id": "EXACT-CHUNK",
        "content": "700010 液压检查依据", "source": "isolated-manual",
        "metadata": {"device_id": DEVICE, "knowledge_type": "manual"},
    }
    result = run_harness(runtime, state, action, **{lookup: "EXACT-CHUNK" if lookup == "chunk_id" else "EXACT-DOC"})
    assert [item["tool"] for item in result.output["retrieval_trace"]] == [operation]
    assert not rag.calls
