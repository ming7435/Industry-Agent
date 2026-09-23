def test_default_capability_registry_maps_capability_to_existing_agent():
    from app.runtime.capability import build_capability_registry

    registry = build_capability_registry()

    assert registry.find("fault_analysis") == ["diagnosis"]
    assert registry.find("document_search") == ["knowledge"]
    assert "drawing_search" in registry.for_agent("cad")
    assert len(registry.agents()) == 9


def test_capability_registry_can_resolve_all_matching_agents():
    from app.runtime.capability import build_capability_registry

    registry = build_capability_registry()

    assert registry.lookup("document_search") == ["knowledge"]
