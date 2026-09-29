from app.agents.cad.graph import validate_relation


def test_cad_evidence_for_another_device_is_rejected():
    result = validate_relation(
        {
            "request": {"device_id": "DEVICE-A", "query": "主轴"},
            "query_type": "component",
            "components": [
                {
                    "component_id": "SPINDLE-B",
                    "name": "另一台设备的主轴",
                    "part_no": "P-B",
                    "device_id": "DEVICE-B",
                }
            ],
            "drawings": [{"drawing_id": "DWG-B", "component_id": "SPINDLE-B"}],
        }
    )

    assert result["route"] == "fallback"
    assert any("设备归属不匹配" in item for item in result["validation"]["errors"])


def test_cad_evidence_without_device_scope_is_not_verified_for_scoped_request():
    result = validate_relation(
        {
            "request": {"device_id": "DEVICE-A", "query": "主轴"},
            "query_type": "component",
            "components": [{"component_id": "SPINDLE", "name": "主轴", "part_no": "P-1"}],
            "drawings": [{"drawing_id": "DWG-1", "component_id": "SPINDLE"}],
        }
    )

    assert result["route"] == "fallback"
    assert any("缺少设备归属" in item for item in result["validation"]["errors"])
