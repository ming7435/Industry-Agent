"""真实车削生成器回归；几何预期由手算或实际 CAD 实体提供。"""

from copy import deepcopy
import importlib.util
from math import pi
import re

import pytest

from app.agents.cad.modeling_engine import CADKernel
from app.agents.cad.schemas import ModelSpec


def build(design, setup):
    # 首个 RED 在普通断言中说明缺失行为，不把缺失模块藏在收集错误中。
    assert importlib.util.find_spec("app.agents.cad.turning_program") is not None, "缺少真实虚拟车削生成器"
    from app.agents.cad.turning_program import build_turning_program
    return build_turning_program(design, setup)


def cylinder_design(inner=0):
    operations = [{"type": "cylinder", "diameter": 30, "length": 50}]
    if inner:
        operations.append({"type": "cylinder", "diameter": inner, "length": 50, "mode": "cut"})
    return {
        "design_id": "CAD-0123456789ABCDEF0123", "digest": "a" * 64,
        "status": "confirmed", "name": "测试销轴", "material": "45钢",
        "resolved_spec": {"units": "mm", "operations": operations},
        "geometry": {"valid": True, "solid_count": 1, "step_roundtrip_valid": True,
                     "units": "mm", "bounds_mm": [30, 30, 50], "center_mm": [0, 0, 25],
                     "volume_mm3": 31415.926535897932 if inner == 10 else pi * (225 - inner ** 2 / 4) * 50},
    }


def turning_setup(**changes):
    value = {"stock_diameter_mm": 34.0, "stock_length_mm": 70.0, "grip_length_mm": 20.0,
             "clearance_mm": 2.0, "pass_depth_mm": 1.0, "spindle_rpm": 1000,
             "feed_mm_per_rev": 0.1, "tolerance_mm": 0.01, "tool_id": 1,
             "drill_tool_id": None, "drill_diameter_mm": None,
             "device_id": "TRAK-TC820LTYSI-001", "postprocessor": "virtual-trak-turning-v1"}
    value.update(changes)
    return value


def test_cylinder_passes_return_to_front_before_radial_retract():
    program = build(cylinder_design(), turning_setup())
    assert program["profile"] == {"outer_diameter_mm": 30, "inner_diameter_mm": 0, "length_mm": 50}
    assert [(p["motion"], p["x_mm"], p["z_mm"]) for p in program["toolpath"]] == [
        ("rapid", 38, 2),
        ("rapid", 32, 2), ("rapid", 32, 0), ("cut", 32, -50), ("cut", 32, 0), ("rapid", 32, 2), ("rapid", 38, 2),
        ("rapid", 30, 2), ("rapid", 30, 0), ("cut", 30, -50), ("cut", 30, 0), ("rapid", 30, 2), ("rapid", 38, 2),
    ]
    assert all(p["tool_id"] == 1 and p["operation"] == "turn" for p in program["toolpath"])
    assert program["simulation"]["duration_seconds"] == pytest.approx(121.32)
    assert program["simulation"]["simulated_volume_mm3"] == pytest.approx(35342.91735288517)
    assert program["simulation"]["expected_volume_mm3"] == pytest.approx(35342.91735288517)
    assert program["simulation"]["passed"] is True
    assert program["simulation"]["scope"] == "machining-zone"
    assert program["schema_version"] == "virtual-turning-v1" and program["simulation_only"] is True
    assert program["design_id"] == "CAD-0123456789ABCDEF0123" and program["design_digest"] == "a" * 64


def test_through_hole_requires_matching_distinct_drill_and_retracts_inside_removed_hole():
    program = build(cylinder_design(10), turning_setup(drill_tool_id=2, drill_diameter_mm=10))
    drill = [p for p in program["toolpath"] if p["operation"] == "drill"]
    assert [(p["motion"], p["x_mm"], p["z_mm"]) for p in drill] == [
        ("rapid", 0, 2), ("rapid", 0, 0), ("cut", 0, -50), ("rapid", 0, 2), ("rapid", 38, 2),
    ]
    assert all(p["tool_id"] == 2 for p in drill)
    assert program["simulation"]["duration_seconds"] == pytest.approx(156.84)
    assert program["simulation"]["simulated_volume_mm3"] == pytest.approx(31415.926535897932)


@pytest.mark.parametrize("changes", [{}, {"drill_tool_id": 2}, {"drill_diameter_mm": 10},
                                    {"drill_tool_id": 1, "drill_diameter_mm": 10},
                                    {"drill_tool_id": 2, "drill_diameter_mm": 9.99}])
def test_hole_cannot_be_approximated_or_assigned_an_unspecified_tool(changes):
    with pytest.raises(ValueError):
        build(cylinder_design(10), turning_setup(tolerance_mm=5, **changes))


@pytest.mark.parametrize("units,diameter,length", [("cm", 3, 5), ("inch", 30 / 25.4, 50 / 25.4)])
def test_source_units_normalize_to_millimeters(units, diameter, length):
    design = cylinder_design()
    design["resolved_spec"] = {"units": units, "operations": [{"type": "cylinder", "diameter": diameter, "length": length}]}
    program = build(design, turning_setup())
    assert program["profile"] == {"outer_diameter_mm": 30, "inner_diameter_mm": 0, "length_mm": 50}
    assert program["simulation"]["simulated_volume_mm3"] == pytest.approx(35342.91735288517)


@pytest.mark.parametrize("inner", [0, 10])
def test_simulation_matches_an_actual_cadkernel_entity(tmp_path, inner):
    design = cylinder_design(inner)
    spec = ModelSpec.model_validate(design["resolved_spec"]).model_dump(mode="json")
    generated = CADKernel().build(spec, tmp_path / f"real-{inner}")
    design["resolved_spec"], design["geometry"] = spec, generated["geometry"]
    setup = turning_setup(**({"drill_tool_id": 2, "drill_diameter_mm": 10} if inner else {}))
    result = build(design, setup)
    assert result["simulation"]["simulated_volume_mm3"] == pytest.approx(generated["geometry"]["volume_mm3"], abs=1e-6)
    assert result["simulation"]["checks"]["geometry_volume_matches"] is True
    assert result["simulation"]["checks"]["geometry_bounds_match"] is True


@pytest.mark.parametrize("operations", [
    [{"type": "box", "length": 30, "width": 30, "height": 50}],
    [{"type": "cylinder", "diameter": 30, "length": 50, "axis": "x"}],
    [{"type": "cylinder", "diameter": 30, "length": 50, "position": [1, 0, 0]}],
    [{"type": "cylinder", "diameter": 30, "length": 50}, {"type": "chamfer", "size": 1, "edges": "all"}],
    [{"type": "cylinder", "diameter": 30, "length": 50}, {"type": "cylinder", "diameter": 10, "length": 50, "mode": "cut", "position": [1, 0, 0]}],
    [{"type": "cylinder", "diameter": 30, "length": 50}, {"type": "cylinder", "diameter": 10, "length": 49, "mode": "cut"}],
    [{"type": "cylinder", "diameter": 30, "length": 50}, {"type": "cylinder", "diameter": 10, "length": 50, "mode": "add"}],
])
def test_unsupported_features_are_rejected_without_simplification(operations):
    design = cylinder_design()
    design["resolved_spec"]["operations"] = operations
    with pytest.raises(ValueError):
        build(design, turning_setup())


@pytest.mark.parametrize("changes", [{"stock_diameter_mm": 29}, {"stock_length_mm": 69.9},
                                    {"grip_length_mm": 70}, {"pass_depth_mm": 0.000001},
                                    {"device_id": "other"}, {"postprocessor": "exec-upload"},
                                    {"spindle_rpm": 0.000001, "feed_mm_per_rev": 0.000001}])
def test_unavailable_stock_grip_or_unbounded_computation_is_rejected(changes):
    with pytest.raises(ValueError):
        build(cylinder_design(), turning_setup(**changes))


@pytest.mark.parametrize("field,value", [("tool_id", True), ("tool_id", 1.5), ("tool_id", 100),
                                       ("tool_id", 0), ("clearance_mm", 0), ("pass_depth_mm", -1),
                                       ("feed_mm_per_rev", float("nan")), ("stock_length_mm", float("inf")),
                                       ("spindle_rpm", "1000"), ("tolerance_mm", 0),
                                       ("stock_diameter_mm", 10001)])
def test_nonfinite_missing_or_non_numeric_parameters_do_not_generate_nc(field, value):
    with pytest.raises(ValueError):
        build(cylinder_design(), turning_setup(**{field: value}))
    setup = turning_setup()
    del setup[field]
    with pytest.raises(ValueError):
        build(cylinder_design(), setup)


@pytest.mark.parametrize("field,value", [("valid", False), ("solid_count", 2), ("step_roundtrip_valid", False),
                                       ("volume_mm3", 30000), ("bounds_mm", [30, 30, 49]),
                                       ("center_mm", [1, 0, 25])])
def test_large_user_tolerance_does_not_hide_disagreement_with_verified_entity(field, value):
    design = cylinder_design()
    design["geometry"][field] = value
    with pytest.raises(ValueError):
        build(design, turning_setup(tolerance_mm=100))


@pytest.mark.parametrize("changes", [{"status": "ready"}, {"resolved_spec": None}, {"digest": ""}, {"design_id": ""}])
def test_only_confirmed_and_versioned_parametric_entities_can_generate(changes):
    design = cylinder_design()
    design.update(changes)
    with pytest.raises(ValueError):
        build(design, turning_setup())


def test_virtual_nc_is_a_deterministic_white_list_representation_of_each_point():
    design, setup = cylinder_design(10), turning_setup(drill_tool_id=2, drill_diameter_mm=10)
    originals = deepcopy((design, setup))
    result = build(design, setup)
    assert (design, setup) == originals
    assert result == build(design, setup)
    assert result["setup"] == setup
    setup["feed_mm_per_rev"] = 4
    assert result["setup"]["feed_mm_per_rev"] == 0.1
    lines = result["nc_program"].splitlines()
    assert lines[:4] == ["(VIRTUAL ONLY - NOT FOR REAL MACHINE)", "G21", "G90", "G95"]
    assert lines[-2:] == ["M5", "M30"]
    assert lines.count("T01") == 1 and lines.count("T02") == 1 and lines.count("M3 S1000") == 2
    moves = []
    active_tool = None
    for line in lines[4:-2]:
        if re.fullmatch(r"T\d{2}", line):
            active_tool = int(line[1:])
        elif re.fullmatch(r"M3 S1000", line):
            continue
        else:
            match = re.fullmatch(r"G([01]) X(-?\d+(?:\.\d+)?) Z(-?\d+(?:\.\d+)?)(?: F(\d+(?:\.\d+)?))?", line)
            assert match, line
            motion, x, z, feed = match.groups()
            assert (feed == "0.1") if motion == "1" else (feed is None)
            moves.append(("cut" if motion == "1" else "rapid", float(x), float(z), active_tool))
    assert moves == [(p["motion"], p["x_mm"], p["z_mm"], p["tool_id"]) for p in result["toolpath"]]


def test_last_partial_depth_and_exact_stock_still_finish_full_profile():
    result = build(cylinder_design(), turning_setup(stock_diameter_mm=35, pass_depth_mm=1))
    assert [p["x_mm"] for p in result["toolpath"] if p["motion"] == "cut" and p["z_mm"] == -50] == [33, 31, 30]
    result = build(cylinder_design(), turning_setup(stock_diameter_mm=30))
    assert [(p["x_mm"], p["z_mm"]) for p in result["toolpath"] if p["motion"] == "cut"] == [(30, -50), (30, 0)]


@pytest.mark.parametrize("dimension", ["diameter", "length", "hole"])
def test_features_smaller_than_coordinate_precision_are_not_silently_removed(dimension):
    design = cylinder_design()
    if dimension == "hole":
        design["resolved_spec"]["operations"].append({"type": "cylinder", "diameter": 0.0000004, "length": 50, "mode": "cut"})
    else:
        design["resolved_spec"]["operations"][0][dimension] = 0.0000004
        if dimension == "diameter":
            design["geometry"]["bounds_mm"][:2] = [0.0000004, 0.0000004]
            design["geometry"]["volume_mm3"] = pi * 0.0000002 ** 2 * 50
        else:
            design["geometry"]["bounds_mm"][2] = 0.0000004
            design["geometry"]["center_mm"][2] = 0.0000002
            design["geometry"]["volume_mm3"] = pi * 225 * 0.0000004
    with pytest.raises(ValueError):
        build(design, turning_setup())


def test_nc_quantization_cannot_exceed_user_dimension_tolerance():
    design = cylinder_design()
    design["resolved_spec"]["operations"][0]["diameter"] = 30.0000001
    design["geometry"]["bounds_mm"][:2] = [30.0000001, 30.0000001]
    design["geometry"]["volume_mm3"] = pi * (30.0000001 / 2) ** 2 * 50
    with pytest.raises(ValueError):
        build(design, turning_setup(tolerance_mm=0.00000001))


@pytest.mark.parametrize("dimension", ["diameter", "length"])
def test_stock_must_cover_original_dimensions_even_before_nc_quantization(dimension):
    design = cylinder_design()
    original = 30.0000001 if dimension == "diameter" else 50.0000001
    design["resolved_spec"]["operations"][0][dimension] = original
    if dimension == "diameter":
        design["geometry"]["bounds_mm"][:2] = [original, original]
        design["geometry"]["volume_mm3"] = pi * (original / 2) ** 2 * 50
    else:
        design["geometry"]["bounds_mm"][2] = original
        design["geometry"]["center_mm"][2] = original / 2
        design["geometry"]["volume_mm3"] = pi * 225 * original
    with pytest.raises(ValueError):
        build(design, turning_setup(stock_diameter_mm=30))
