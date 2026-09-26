from app.agents.base import AgentResult, BaseAgent
from app.agents.registry import CORE_AGENT_REGISTRY
from app.runtime.jev import GoalEvent, JEVParser


def test_trace_skill_node_accepts_explicit_graph_binding_without_global_aliases():
    from app.agents.base import trace_skill_node

    def node(state):
        return {"value": state["value"] + 1}

    wrapped = trace_skill_node(
        "diagnosis",
        "reason",
        node,
        skill_step="generate_candidates",
    )
    result = wrapped({"value": 1, "step_history": [], "completed_steps": []})

    assert result["current_step"] == "generate_candidates"
    assert result["step_history"][0]["step_id"] == "generate_candidates"


def test_core_agents_declare_the_unified_contract_and_capabilities():
    assert set(CORE_AGENT_REGISTRY) == {
        "router", "diagnosis", "knowledge", "cad", "maintenance",
        "workorder", "quality", "report", "memory",
    }
    for name, agent_type in CORE_AGENT_REGISTRY.items():
        assert issubclass(agent_type, BaseAgent)
        assert agent_type.name == name
        assert agent_type.capabilities


def test_agent_result_normalizes_existing_model_output():
    result = AgentResult.from_value({
        "summary": "bearing fault",
        "evidence": [{"id": "E-1"}],
        "confidence": 0.9,
    })

    assert result.success is True
    assert result.output["summary"] == "bearing fault"
    assert result.evidence == [{"id": "E-1"}]
    assert result.confidence == 0.9


def test_jev_parser_returns_structured_goal_without_selecting_agents():
    event = JEVParser().parse({
        "event_id": "EVT-JEV-1",
        "device_id": "D-1",
        "event_type": "temperature_alarm",
        "severity": "critical",
    })

    assert isinstance(event, GoalEvent)
    assert event.goal
    assert event.entities["event_id"] == "EVT-JEV-1"
    assert "fault_analysis" in event.required_capabilities
    assert "agent" not in event.entities


def test_jev_parser_limits_user_goal_to_relevant_capability():
    event = JEVParser().parse("查询主轴维修手册")

    assert event.source == "user"
    assert event.required_capabilities == ("document_search",)
