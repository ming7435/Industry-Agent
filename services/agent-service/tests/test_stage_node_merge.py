"""实际领域图的节点数量、业务操作和失败分支回归。"""

from importlib import import_module

import pytest

from app.harness.trace import TraceRecorder


COUNTS = {"router": 3, "diagnosis": 7, "knowledge": 6, "cad": 5, "maintenance": 6,
          "workorder": 7, "quality": 5, "report": 5, "memory": 7}


@pytest.mark.parametrize("name,expected", COUNTS.items())
def test_compiled_stage_node_count(name, expected):
    module = import_module(f"app.agents.{name}.graph")
    graph = getattr(module, f"build_{name}_graph")()
    actual = set(graph.get_graph().nodes) - {"__start__", "__end__"}
    assert len(actual) == expected, (name, actual)


def test_all_nine_graphs_total_51_and_only_original_loop_domains_have_cycles():
    counts, loops = {}, set()
    for name in COUNTS:
        module = import_module(f"app.agents.{name}.graph")
        graph = getattr(module, f"build_{name}_graph")().get_graph()
        counts[name] = len(set(graph.nodes) - {"__start__", "__end__"})
        outgoing = {node: [] for node in graph.nodes}
        for edge in graph.edges:
            outgoing[edge.source].append(edge.target)

        def reaches_self(node, current, visited):
            for target in outgoing[current]:
                if target == node:
                    return True
                if target not in visited and reaches_self(node, target, visited | {target}):
                    return True
            return False

        if any(reaches_self(node, node, {node}) for node in graph.nodes):
            loops.add(name)
    assert counts == COUNTS and sum(counts.values()) == 51
    assert loops == {"diagnosis", "knowledge", "cad"}


def test_memory_rank_stage_preserves_verified_results_and_deduplication():
    from app.agents.memory.agent import MemoryAgent
    from app.memory.service import ExperienceLearningModule
    from app.memory.store import LongMemoryStore, ShortMemoryStore
    from runtime_slimming_adapter import ScriptedRAG

    store = LongMemoryStore()
    item = {"experience_id": "EXP-1", "source_workorder": "WO-1", "device_id": "D-1", "content": "主轴维修",
            "validation_status": "accepted", "memory_saved": True, "rag_saved": True}
    store.save(item)
    store.save(item)
    agent = MemoryAgent(experience_module=ExperienceLearningModule(ShortMemoryStore(), store, ScriptedRAG([])))
    result = agent.run({"action": "recent", "limit": 20})
    assert result.success and result.count == 1
    assert result.items[0]["experience_id"] == "EXP-1"


def started(trace):
    return [row["name"] for row in trace.list() if row.get("event") == "step_started"]


def test_router_stage_preserves_entities_validation_and_real_trace():
    from app.agents.router.agent import RouterAgent

    agent = RouterAgent()
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"user_text": "报警 E102 是什么含义", "context": {"device_id": "D-1"},
                        "task_id": "T-ROUTE", "trace_id": "R-ROUTE"})
    assert result.target_agent == "knowledge"
    assert result.entities["alarm_code"] == "E102"
    assert result.entities["device_id"] == "D-1"
    assert started(trace) == ["initialize", "load_skill", "classify_intent", "extract_entities", "validate_route", "final"]
    assert all(row["task_id"] == "T-ROUTE" and row["trace_id"] == "R-ROUTE" for row in trace.list())


def test_quality_stage_keeps_all_checks_and_trace(monkeypatch):
    from test_graph_slimming_contract import quality_agent

    agent, transport = quality_agent(monkeypatch)
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"part_id": "PART-1"})
    assert result.passed and len(result.inspection_items) == 5
    assert len(transport.calls) == 7
    assert started(trace) == ["initialize", "load_skill", "load_part", "load_inspection_plan",
                              "inspect_dimensions", "inspect_appearance", "inspect_material",
                              "inspect_function", "inspect_process", "validate_part", "final"]


def test_quality_identity_gate_stops_before_specifications_or_checks(monkeypatch):
    from test_graph_slimming_contract import quality_agent

    agent, transport = quality_agent(monkeypatch)
    calls = []

    def missing_part(server, operation, arguments):
        calls.append(operation)
        assert operation == "get_production_part", "身份门禁失败后仍调用质检"
        return {"success": False, "found": False}

    monkeypatch.setattr(agent.tools.mcp, "call", missing_part)
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"part_id": "PART-1"})
    assert not result.passed
    assert calls == ["get_production_part"]
    assert started(trace) == ["initialize", "load_skill", "load_part", "fallback"]


def test_report_stage_keeps_incomplete_status_and_source_steps():
    from app.agents.report.agent import ReportAgent

    agent = ReportAgent()
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"report_type": "maintenance_report", "persist": False,
                        "diagnosis": {"device_id": "D-1", "diagnosis": "待检查", "confidence": 0.2}})
    assert result.status == "incomplete"
    assert not result.persisted
    assert result.validation_findings
    assert started(trace) == ["initialize", "load_skill", "collect_sources", "check_completeness",
                              "compose", "validate", "persist", "final"]


def test_empty_knowledge_keeps_bounded_refinement_and_fallback_then_final():
    from app.agents.knowledge.agent import KnowledgeAgent
    from app.tools.registry import ToolRegistry
    from runtime_slimming_adapter import ScriptedRAG

    rag = ScriptedRAG([])
    agent = KnowledgeAgent(ToolRegistry(rag_client=rag))
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"query": "主轴手册", "device_id": "D-1", "max_steps": 4})
    assert result.status == "insufficient_evidence"
    assert result.validation_findings and not result.documents
    assert len(rag.calls) == 3
    names = started(trace)
    assert names.count("retrieve") == names.count("observe") == 3
    assert names.count("refine_query") == 1
    assert names[-2:] == ["fallback", "final"]


@pytest.mark.parametrize("max_steps,expected_calls", [(1, 1), (5, 4)])
def test_cad_query_loop_keeps_budget_scope_and_no_stale_observation(monkeypatch, max_steps, expected_calls):
    from app.agents.cad.agent import CADAgent
    from app.tools.registry import ToolRegistry

    tools = ToolRegistry(cad_base_url="http://isolated-cad.invalid")
    calls = []

    def cad_boundary(server, operation, arguments):
        assert server == "cad"
        assert arguments["device_id"] == "D-1"
        calls.append(operation)
        return {"success": True, "components": [], "source": "document-cad-service"}

    monkeypatch.setattr(tools.mcp, "call", cad_boundary)
    agent = CADAgent(tools)
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"query": "主轴", "device_id": "D-1", "max_steps": max_steps})
    assert result.status == "insufficient_engineering_data"
    assert len(calls) == expected_calls == len(result.steps)
    assert started(trace).count("observe") == expected_calls
    assert started(trace)[-2:] == ["validate_relation", "fallback"]


def test_diagnosis_guard_loop_cannot_execute_forbidden_write(monkeypatch):
    import json
    from app.agents.diagnosis.agent import DiagnosisAgent
    from app.tools.registry import ToolRegistry
    from runtime_slimming_adapter import ScriptedModel

    model = ScriptedModel([{"choices": [{"message": {"role": "assistant", "content": "", "tool_calls": [{
        "id": str(i), "type": "function", "function": {"name": "create_workorder", "arguments": json.dumps({"device_id": "D-1"})},
    }]}}]} for i in range(2)])
    tools = ToolRegistry()
    monkeypatch.setattr(tools.mcp, "call", lambda *args: pytest.fail("被拒绝的写工具不能调用外部服务"))
    agent = DiagnosisAgent(client=model, tools=tools)
    agent.runtime_trace = trace = TraceRecorder()
    from app.agents.diagnosis.schemas import DiagnosisState
    event = {"event_id": "E-DENIED", "device_id": "D-1"}
    output = agent.graph.invoke({"agent": agent, "event": event, "event_id": "E-DENIED", "device_id": "D-1",
                                 "agent_state": DiagnosisState(abnormal_event=event, max_steps=2),
                                 "diagnosis_run_id": "RUN-DENIED"})
    result = output["final_result"]
    assert len(model.calls) == 2
    assert result.stop_reason == "max_steps"
    names = started(trace)
    assert names.count("tool_guard") == 2
    assert "act" not in names and "observe" not in names
    assert names[-1] == "fallback"


def test_maintenance_stage_keeps_safety_and_evidence_gates_separate():
    from app.agents.maintenance.agent import MaintenanceAgent

    agent = MaintenanceAgent(knowledge_provider=lambda context, query: {}, cad_provider=lambda context, query: {})
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"runtime_managed": True, "diagnosis": {
        "device_id": "D-1", "fault": "主轴温度", "confidence": 0.2, "maintenance_required": True,
    }})
    assert not result.workorder_ready and result.validation_findings
    assert started(trace) == ["initialize", "load_skill", "assess_diagnosis", "request_knowledge", "request_cad",
                              "plan_repair", "check_parts_tools", "safety_validate", "validate", "prepare_workorder", "final"]


def test_workorder_invalid_request_keeps_direct_fallback_without_writes():
    from app.agents.workorder.agent import WorkOrderAgent

    class NoWrites:
        def create_from_plan(self, plan):
            pytest.fail("缺少有效方案不能写入工单")

    agent = WorkOrderAgent(service=NoWrites())
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"action": "create"})
    assert not result.success and result.validation_findings
    assert started(trace) == ["initialize", "load_skill", "validate_plan", "fallback"]


@pytest.mark.parametrize("action,tool", [
    ("update", "update_workorder"), ("assign", "assign_workorder"), ("close", "close_workorder"),
])
def test_workorder_execution_timeout_still_runs_original_validation_without_retry(monkeypatch, action, tool):
    from app.agents.workorder.agent import WorkOrderAgent
    from app.tools.registry import ToolRegistry

    tools = ToolRegistry()
    calls = []

    def uncertain_write(server, operation, arguments):
        assert operation == tool and arguments["workorder_id"] == "WO-UNCERTAIN"
        calls.append(operation)
        raise TimeoutError("业务写入结果不确定")

    monkeypatch.setattr(tools.mcp, "call", uncertain_write)
    agent = WorkOrderAgent(tools)
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"action": action, "workorder_id": "WO-UNCERTAIN", "status": "in_progress",
                        "assignee": "TECH-1"})
    assert not result.success
    assert calls == [tool], "不确定写操作不能重复执行"
    assert result.validation_findings == ["业务写入结果不确定", "工单业务动作未返回 workorder_id"]
    assert started(trace) == ["initialize", "load_skill", "validate_plan", "execute_action", "validate", "fallback"]


@pytest.mark.parametrize("action", ["recent", "search", "learn"])
def test_memory_entry_uses_only_appropriate_gate_and_rejects_unverified_learning(action):
    from app.agents.memory.agent import MemoryAgent
    from app.memory.service import ExperienceLearningModule
    from app.memory.store import LongMemoryStore, ShortMemoryStore
    from runtime_slimming_adapter import ScriptedRAG

    module = ExperienceLearningModule(ShortMemoryStore(), LongMemoryStore(), ScriptedRAG([]))
    agent = MemoryAgent(experience_module=module)
    agent.runtime_trace = trace = TraceRecorder()
    result = agent.run({"action": action, "query": "主轴"})
    assert not result.success
    names = started(trace)
    if action == "learn":
        assert names == ["initialize", "load_skill", "validate_admission", "fallback"]
        assert not result.experience
    else:
        assert "validate_admission" not in names and "persist" not in names
        assert names == ["initialize", "load_skill"] + (["validate_search"] if action == "search" else []) + [
            "retrieve_memory", "dedup", "rerank", "validate", "final",
        ]
