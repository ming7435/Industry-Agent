def test_default_capability_registry_matches_concrete_agent_declarations():
    from app.agents.registry import CORE_AGENT_REGISTRY
    from app.runtime.capability import build_capability_registry

    registry = build_capability_registry()
    expected = {
        name: list(getattr(agent_type, "capabilities", ()))
        for name, agent_type in CORE_AGENT_REGISTRY.items()
    }

    assert registry.snapshot() == expected


def test_planner_does_not_resolve_removed_capability_aliases():
    from app.runtime.capability import build_capability_registry
    from app.runtime.planner import Planner

    registry = build_capability_registry()
    assert registry.find("case_retrieval") == []
    assert registry.find("historical_case_search") == ["knowledge"]

    plan = Planner(capabilities=registry).plan(
        "检索历史案例",
        {"required_capabilities": ["historical_case_search"]},
    )
    assert plan.actions[0].target == "knowledge"
