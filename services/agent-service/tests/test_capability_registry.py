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


def test_capability_registry_exposes_canonical_metadata_and_aliases():
    from app.runtime.capability import CapabilityDefinition, build_capability_registry

    registry = build_capability_registry()
    definition = registry.get("workorder_create")

    assert definition is not None
    assert definition.agent == "workorder"
    assert definition.domain == "workorder"
    assert definition.result_key == "workorder"
    assert definition.side_effect is True
    assert registry.get("fault_analysis").replan_capabilities == ("document_search", "diagnosis_review")

    registry.register(CapabilityDefinition(
        name="legacy_fault_lookup",
        agent="diagnosis",
        domain="diagnosis",
        result_key="diagnosis",
        aliases=("legacy_fault",),
    ))
    assert registry.get("legacy_fault").name == "legacy_fault_lookup"
    assert registry.find("legacy_fault") == ["diagnosis"]


def test_capability_registry_metadata_helpers_use_one_definition():
    from app.runtime.capability import build_capability_registry

    registry = build_capability_registry()

    assert registry.domain_for("document_search") == "knowledge"
    assert registry.result_key_for("drawing_search") == "cad"
    assert registry.side_effect_for("workorder_create") is True
    assert registry.requires_approval_for("workorder_update") is True


def test_empty_capability_registry_does_not_report_unregistered_capabilities():
    from app.runtime.capability import CapabilityRegistry

    registry = CapabilityRegistry()

    assert registry.get("document_search") is None
    assert registry.find("document_search") == []
