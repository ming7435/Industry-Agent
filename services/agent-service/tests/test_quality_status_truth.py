"""Missing or untrusted data must not become a failed physical inspection."""

import pytest

from app.agents.quality.agent import QualityAgent
from app.agents.quality.validator import QualityValidator
from app.closure import ClosureService
from app.runtime.operations import RuntimeOperations
from test_quality_data_gate import _passing_check
from test_quality_release_gate import complete_validation


@pytest.mark.parametrize("status,passed,expected", [
    ("not_tested", False, "not_tested"),
    ("insufficient_data", False, "insufficient_data"),
    ("review", False, "review"),
    ("fail", False, "failed"),
    ("pass", True, "passed"),
    ("not_tested", True, "not_tested"),
    ("pass", "false", "review"),
])
def test_quality_persistence_preserves_actual_inspection_state(status, passed, expected):
    class Requests:
        def inspect_quality(self, state, from_agent, quality_payload):
            return {"part_id": "PART-STATUS", "batch_id": "BATCH-STATUS", "status": status, "passed": passed, "qualified": passed, "quality_validation": complete_validation()}

    closure = ClosureService()
    result = RuntimeOperations(Requests(), closure).inspect_quality({}, persist=True)
    check = closure.get_quality_check(result["quality_check_id"])
    assert check["result"] == expected
    assert check["status"] == ("passed" if expected == "passed" else "failed" if expected == "failed" else "open")


def test_online_quality_preserves_case_identity_without_separate_report():
    class Requests:
        def inspect_quality(self, *args, **kwargs):
            return {'part_id': 'PART-1', 'device_id': 'M1', 'status': 'not_tested', 'passed': False}
    class Backend:
        backend = 'backend-service'
        def record_part_quality(self, payload, operator):
            assert payload['workorder_id'] == 'WO-1' and payload['event_id'] == 'E1'
            return {'quality_check_id': 'QC-1', **payload}
    class Report:
        def execute_agent(self, *args):
            raise AssertionError('复机周期报告不能按单个质检记录另行生成')
    result = RuntimeOperations(Requests(), Backend(), report_harness=Report()).inspect_quality({},
        quality_payload={'workorder_id': 'WO-1', 'event_id': 'E1'}, persist=True)
    assert result['quality_check_id'] == 'QC-1'
    assert 'report' not in result


@pytest.mark.parametrize("status", ["not_tested", "insufficient_data", "review"])
def test_quality_recommendation_does_not_declare_unmeasured_parts_defective(status):
    recommendation = QualityAgent._recommendation({"status": status, "passed": False})
    assert "不合格品" not in recommendation
    assert "补充" in recommendation or "复核" in recommendation


def test_quality_recommendation_still_holds_real_failed_parts():
    assert "不合格品" in QualityAgent._recommendation({"status": "fail", "passed": False})


@pytest.mark.parametrize("missing", ["specification", "part_identity", "sufficient_data"])
def test_quality_validator_missing_data_has_consistent_untested_grade(missing):
    checks = [_passing_check(name) for name in ("尺寸", "外观", "材料", "功能", "工艺")]
    specification = {} if missing == "specification" else {"diameter_mm": {"min": 9.9, "max": 10.1}}
    part = {} if missing == "part_identity" else {"part_id": "PART-STATUS"}
    if missing == "sufficient_data":
        checks[0]["sufficient_data"] = False
    result = QualityValidator.validate_part(part, specification, *checks)
    assert result["passed"] is False
    assert result["status"] == "not_tested"
    assert result["quality_grade"] == "未检测"


def test_quality_validator_untrusted_evidence_requires_review():
    checks = [_passing_check(name) for name in ("尺寸", "外观", "材料", "功能", "工艺")]
    checks[0]["synthetic"] = True
    result = QualityValidator.validate_part({"part_id": "PART-STATUS"}, {"diameter_mm": {"min": 9.9, "max": 10.1}}, *checks)
    assert result["status"] == "review"
    assert result["quality_grade"] == "待复核"


def test_quality_validator_keeps_actual_measured_failure_even_if_other_checks_are_missing():
    checks = [_passing_check(name) for name in ("尺寸", "外观", "材料", "功能", "工艺")]
    checks[0].update({"passed": False, "status": "fail", "defects": [{"item": "diameter_mm", "actual": 11.0}]})
    checks[1].update({"passed": False, "status": "not_tested", "sufficient_data": False})
    result = QualityValidator.validate_part({"part_id": "PART-STATUS"}, {"diameter_mm": {"min": 9.9, "max": 10.1}}, *checks)
    assert result["status"] == "fail"
    assert result["quality_grade"] == "不合格"


def test_quality_validator_keeps_missing_check_payload_as_not_tested():
    checks = [_passing_check(name) for name in ("尺寸", "外观", "材料", "功能", "工艺")]
    checks[0] = None
    result = QualityValidator.validate_part({"part_id": "PART-STATUS"}, {"diameter_mm": {"min": 9.9, "max": 10.1}}, *checks)
    assert result["status"] == "not_tested"
    assert result["quality_grade"] == "未检测"
