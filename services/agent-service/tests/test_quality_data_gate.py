from app.agents.quality.validator import QualityValidator
from app.mcp.quality import QualityMcpAdapter


def _passing_check(name: str) -> dict:
    return {
        "name": name,
        "passed": True,
        "qualified": True,
        "status": "pass",
        "sufficient_data": True,
        "items": [{"item": name, "passed": True}],
        "defects": [],
        "source": "qms",
        "synthetic": False,
        "degraded": False,
    }


def test_quality_validator_requires_specification_and_all_real_checks():
    checks = [_passing_check(name) for name in ("尺寸", "外观", "材料", "功能", "工艺")]

    result = QualityValidator.validate_part(
        {"part_id": "PART-001"},
        {},
        *checks,
    )

    assert result["passed"] is False
    assert "specification_missing" in result["failed_checks"]
    assert result["validation"]["recommended_action"]["type"] == "wait"


def test_local_qms_adapter_does_not_promote_unknown_part_to_a_real_result():
    result = QualityMcpAdapter().get_production_part(part_id="PART-UNKNOWN")

    assert result["found"] is False
    assert result["part"] == {}


def test_quality_validator_rejects_synthetic_checks_even_when_they_look_like_passes():
    checks = [_passing_check(name) for name in ("尺寸", "外观", "材料", "功能", "工艺")]
    checks[0]["synthetic"] = True
    result = QualityValidator.validate_part(
        {"part_id": "PART-001"},
        {"outer_diameter_mm": {"min": 49.98, "max": 50.02}},
        *checks,
    )
    assert result["passed"] is False
    assert result["inspection_items"][0]["evidence_status"] == "untrusted"


def test_qms_checks_with_partial_measurements_are_not_reported_as_pass():
    adapter = QualityMcpAdapter()

    material = adapter.inspect_part_material({"material": {"grade": "45钢"}}, specifications={})
    function = adapter.inspect_part_function({"function": {"rotation_test": True}}, specifications={})
    appearance = adapter.inspect_part_appearance({"appearance": {"scratch": False}})

    assert material["status"] == "not_tested"
    assert function["status"] == "not_tested"
    assert appearance["status"] == "not_tested"


def test_quality_record_with_unstructured_evidence_is_not_qualified():
    from app.closure import ClosureService

    record = ClosureService().create_quality_check({"target_id": "PART-EVIDENCE", "result": "passed", "evidence": [{"note": "看起来正常"}]})

    assert record["result"] == "pending"
    assert record["status"] == "open"


def test_quality_validator_does_not_coerce_string_false_or_null_to_pass():
    checks = [_passing_check(name) for name in ("尺寸", "外观", "材料", "功能", "工艺")]
    checks[1]["passed"] = "false"
    checks[1]["sufficient_data"] = None

    result = QualityValidator.validate_part(
        {"part_id": "PART-001"},
        {"outer_diameter_mm": {"min": 49.98, "max": 50.02}},
        *checks,
    )

    assert result["passed"] is False
    assert result["status"] == "not_tested"
    assert result["inspection_items"][1]["passed"] is False


def test_qms_appearance_requires_explicit_boolean_values():
    adapter = QualityMcpAdapter()

    null_value = adapter.inspect_part_appearance({"appearance": {key: None for key in ("scratch", "crack", "burr", "discoloration", "deformation")}})
    string_value = adapter.inspect_part_appearance({"appearance": {key: "false" for key in ("scratch", "crack", "burr", "discoloration", "deformation")}})
    defect = adapter.inspect_part_appearance({"appearance": {key: False for key in ("scratch", "crack", "burr", "discoloration", "deformation")} | {"crack": True}})

    assert null_value["status"] == "not_tested"
    assert string_value["status"] == "not_tested"
    assert defect["status"] == "fail"


def test_qms_function_requires_true_rotation_and_finite_measurement():
    adapter = QualityMcpAdapter()
    specification = {"runout_mm": {"min": 0.0, "max": 0.03}}

    null_rotation = adapter.inspect_part_function({"function": {"runout_mm": 0.018, "rotation_test": None}}, specifications=specification)
    string_rotation = adapter.inspect_part_function({"function": {"runout_mm": 0.018, "rotation_test": "true"}}, specifications=specification)
    nan_measurement = adapter.inspect_part_function({"function": {"runout_mm": float("nan"), "rotation_test": True}}, specifications=specification)

    assert null_rotation["status"] == "not_tested"
    assert string_rotation["status"] == "not_tested"
    assert nan_measurement["status"] == "not_tested"


def test_qms_dimensions_require_finite_measurements_and_a_real_bound():
    adapter = QualityMcpAdapter()

    missing_bound = adapter.inspect_part_dimensions(
        {"measurements": {"outer_diameter_mm": 50.0}},
        specifications={"outer_diameter_mm": {}},
    )
    invalid_value = adapter.inspect_part_dimensions(
        {"measurements": {"outer_diameter_mm": float("inf")}},
        specifications={"outer_diameter_mm": {"min": 49.0, "max": 51.0}},
    )

    assert missing_bound["status"] == "not_tested"
    assert invalid_value["status"] == "not_tested"
