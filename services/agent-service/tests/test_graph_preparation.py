"""准备阶段合并后的行为、日志归属与图状态回归。"""

from importlib import import_module
from types import SimpleNamespace

import pytest
from pydantic import ValidationError

from app.agents import base
from app.agents.diagnosis.schemas import DiagnosisState
from app.agents.memory.agent import MemoryAgent
from app.harness.trace import TraceRecorder


def preparation(initialize, load, **kwargs):
    factory = getattr(base, "prepare_skill_node", None)
    assert callable(factory), "缺少共用准备节点"
    return factory("router", initialize, load, **kwargs)


def test_prepare_stops_on_initialization_fallback():
    calls = []
    node = preparation(lambda state: {"route": "fallback", "error": "无效请求"}, lambda state: calls.append(state) or {})
    result = node({})
    assert result["route"] == "fallback"
    assert calls == []
    assert len(result["step_history"]) == 1


def test_prepare_keeps_order_and_two_step_records():
    calls = []

    def initialize(state):
        calls.append("initialize")
        return {"route": "load_skill", "text": "归一化输入"}

    def load(state):
        assert state["text"] == "归一化输入"
        assert len(state["step_history"]) == 2
        calls.append("load_skill")
        return {"route": "classify_intent", "active_skills": ["intent_routing_skill"]}

    original = {"step_history": [{"step_id": "prior"}], "completed_steps": []}
    result = preparation(initialize, load)(original)
    assert calls == ["initialize", "load_skill"]
    assert [row["step_id"] for row in result["step_history"]] == ["prior", "initialize", "load_skill"]
    assert len(result["completed_steps"]) == 2
    assert original == {"step_history": [{"step_id": "prior"}], "completed_steps": []}
    assert result["text"] == "归一化输入"


def test_prepare_does_not_share_history_between_runs():
    node = preparation(lambda state: {"route": "load_skill"}, lambda state: {"route": "final"})
    first, second = node({}), node({})
    first["step_history"].append({"step_id": "first_only"})
    assert len(second["step_history"]) == 2
    assert first["completed_steps"] is not second["completed_steps"]


def test_preparation_trace_has_task_and_trace_identity():
    trace = TraceRecorder()
    node = preparation(lambda state: {"route": "load_skill"}, lambda state: {"route": "final"})
    node({"agent": SimpleNamespace(runtime_trace=trace), "task": {"task_id": "TASK-1", "trace_id": "TRACE-1"}})
    records = trace.list(task_id="TASK-1", trace_id="TRACE-1")
    assert [(row["name"], row["event"]) for row in records] == [
        ("initialize", "step_started"), ("initialize", "step_completed"),
        ("load_skill", "step_started"), ("load_skill", "step_completed"),
    ]


def test_prepare_failure_keeps_original_exception():
    trace = TraceRecorder()

    def fail(state):
        raise ValueError("加载失败")

    node = preparation(lambda state: {"route": "load_skill"}, fail)
    with pytest.raises(ValueError, match="加载失败"):
        node({"agent": SimpleNamespace(runtime_trace=trace), "task_id": "T", "trace_id": "R"})
    assert [(row["name"], row["event"]) for row in trace.list()] == [
        ("initialize", "step_started"), ("initialize", "step_completed"),
        ("load_skill", "step_started"), ("load_skill", "step_failed"),
    ]


@pytest.mark.parametrize("name,expected", [
    ("router", "classify_intent"), ("diagnosis", "reason"), ("knowledge", "retrieve"),
    ("cad", "plan_engineering_query"), ("maintenance", "request_knowledge"), ("workorder", "validate_plan"),
    ("quality", "load_part"), ("report", "collect_sources"), ("memory", "retrieve_memory"),
])
def test_real_graph_prepare_preserves_routing_and_inherited_history(name, expected):
    module = import_module(f"app.agents.{name}.graph")
    graph = getattr(module, f"build_{name}_graph")()
    assert "prepare" in graph.nodes, "领域图仍重复注册初始化和加载节点"
    assert "initialize" not in graph.nodes and "load_skill" not in graph.nodes
    trace = TraceRecorder()
    agent_class = getattr(import_module(f"app.agents.{name}.agent"), {
        "router": "RouterAgent", "diagnosis": "DiagnosisAgent", "knowledge": "KnowledgeAgent", "cad": "CADAgent",
        "maintenance": "MaintenanceAgent", "workorder": "WorkOrderAgent", "quality": "QualityAgent",
        "report": "ReportAgent", "memory": "MemoryAgent",
    }[name])
    agent = agent_class()
    agent.runtime_trace = trace
    if name == "diagnosis":
        agent.client = SimpleNamespace(available=True)
    state = {
        "agent": agent, "request": {"query": "主轴", "action": "search" if name == "memory" else "create"},
        "task": {"user_text": "查询主轴"}, "event": {"device_id": "D-1", "alarm_code": "700001"},
        "agent_state": DiagnosisState(abnormal_event={}), "step_history": [{"step_id": "prior"}],
    }
    result = graph.invoke(state, interrupt_after=["prepare"])
    assert result["route"] == expected
    expected_count = {"knowledge": 4, "cad": 3, "maintenance": 3, "memory": 3}.get(name, 2)
    assert len(result["step_history"]) == expected_count + 1
    assert result["step_history"][0] == {"step_id": "prior"}
    assert len(result["completed_steps"]) == expected_count
    names = [row["name"] for row in trace.list() if row["event"] == "step_started"]
    assert names == ["initialize", "load_skill"] + {
        "knowledge": ["classify_query", "plan_retrieval"], "cad": ["resolve_component"],
        "maintenance": ["assess_diagnosis"], "memory": ["validate_search"],
    }.get(name, [])
    assert result["active_agent"] == name


def test_unavailable_diagnosis_stops_before_skill_or_chat():
    from app.agents.diagnosis.agent import DiagnosisAgent

    class UnavailableModel:
        available = False

        def chat(self, *args, **kwargs):
            pytest.fail("不可用模型不能被调用")

    agent = DiagnosisAgent(client=UnavailableModel())
    trace = agent.runtime_trace = TraceRecorder()
    result = agent.run({"event_id": "E-PREP", "device_id": "D-1", "alarm_code": "700001"})
    assert result.stop_reason == "llm_unavailable"
    assert not any(row.get("name") == "load_skill" for row in trace.list())


def test_invalid_memory_action_does_not_retrieve_or_write():
    class ExternalMemory:
        def search(self, **kwargs):
            pytest.fail("非法动作不应执行检索")

        def learn(self, **kwargs):
            pytest.fail("非法动作不应写入经验")

    with pytest.raises(ValidationError, match="action"):
        MemoryAgent(experience_module=ExternalMemory()).run({"action": "invalid", "query": "主轴"})
