from types import SimpleNamespace

from app.agents.quality.graph import inspect_dimensions, load_inspection_plan, load_part


def test_unknown_part_cannot_be_replaced_by_request_supplied_data():
    agent = SimpleNamespace(_safe_tool=lambda *_: {"found": False, "success": False, "part": {}})
    supplied = {"part_id": "PART-NOT-FOUND", "specifications": {"width_mm": {"min": 1, "max": 2}}}

    result = load_part({"agent": agent, "request": {"part_id": "PART-NOT-FOUND", "part": supplied}})

    assert result["route"] == "fallback"
    assert result["part"] == {}


def test_trusted_part_lookup_preserves_source_values_over_request_overrides():
    trusted = {
        "part_id": "PART-1", "measurements": {"width_mm": 9},
        "specifications": {"width_mm": {"min": 1, "max": 2}},
    }
    agent = SimpleNamespace(_safe_tool=lambda *_: {
        "found": True, "success": True, "identity_verified": True,
        "part": trusted, "synthetic": False, "degraded": False,
    })

    result = load_part({"agent": agent, "request": {
        "part_id": "PART-1", "measurements": {"width_mm": 1.5},
        "specifications": {"width_mm": {"min": 1, "max": 10}},
    }})

    assert result["route"] == "load_inspection_plan"
    assert result["part"]["measurements"] == {"width_mm": 9}
    assert result["part"]["specifications"] == {"width_mm": {"min": 1, "max": 2}}


def test_dimension_check_uses_verified_part_measurements_and_specifications():
    seen = {}

    def inspect(name, arguments):
        seen[name] = arguments
        if name == "get_part_specification":
            return {"success": True, "specifications": {"width_mm": {"min": 1, "max": 2}}}
        return {"passed": False}

    state = {
        "agent": SimpleNamespace(_safe_tool=inspect),
        "part": {"part_id": "PART-1", "measurements": {"width_mm": 9},
                 "specifications": {"width_mm": {"min": 1, "max": 2}}},
        "request": {"inspection_plan": {"width_mm": {"min": 1, "max": 10}},
                    "measurements": {"width_mm": 1.5}},
    }

    plan = load_inspection_plan(state)
    inspect_dimensions({**state, **plan})

    assert plan["inspection_plan"] == {"width_mm": {"min": 1, "max": 2}}
    assert seen["inspect_part_dimensions"]["measurements"] == {"width_mm": 9}
