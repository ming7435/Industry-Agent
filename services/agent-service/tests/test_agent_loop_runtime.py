"""复核与方案重规划必须执行真实 Runtime 和领域 Agent。"""

from runtime_slimming_adapter import build_fault_scenario


def _capabilities(result):
    return [item["state_change"]["action"]["payload"]["required_capability"] for item in result["trace"]
            if item.get("event") == "skill_selected" and item.get("name") == "runtime"]


def test_diagnosis_review_loop_retries_low_confidence_once(tmp_path, monkeypatch):
    runtime, event = build_fault_scenario(tmp_path, monkeypatch, review=True)
    result = runtime.run_abnormal_event(event)
    assert result["runtime_result"]["status"] == "completed", [item for item in result["runtime_result"]["history"] if item.get("error")]
    capabilities = _capabilities(result)
    assert capabilities.count("fault_analysis") == 1
    assert capabilities.count("diagnosis_review") == 1
    assert result["diagnosis"]["confidence"] == 0.985
    assert len(runtime.test_model.calls) == 5
    assert capabilities[-3:] == ["drawing_search", "repair_planning", "workorder_create"]
    assert result["workorder"]["workorder"]["status"] == "in_progress"
    assert len([call for call in runtime.test_boundary.calls if call[1] == "create_workorder"]) == 1


def test_maintenance_replan_loop_retries_invalid_plan_once(tmp_path, monkeypatch):
    runtime, event = build_fault_scenario(tmp_path, monkeypatch, missing_stock_once=True)
    result = runtime.run_abnormal_event(event)
    assert result["runtime_result"]["status"] == "completed", (result["runtime_result"], result.get("maintenance_plan", {}).get("inventory_status"), result.get("runtime_plan"))
    capabilities = _capabilities(result)
    assert capabilities.count("repair_planning") == 1
    assert capabilities.count("maintenance_replan") == 1
    assert result["maintenance_plan"]["workorder_ready"] is True
    assert not result["maintenance_plan"]["validation_findings"]
    assert len([call for call in runtime.test_boundary.calls if call[1] == "query_inventory"]) == 2
    assert len([call for call in runtime.test_boundary.calls if call[1] == "create_workorder"]) == 1
