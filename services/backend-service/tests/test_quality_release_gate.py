"""Quality release must use persisted inspection facts, never a client pass flag."""

import pytest

from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


def complete_validation():
    return {
        "dimensions": {"passed": True, "sufficient_data": True, "status": "pass", "items": [{"item": "diameter_mm", "actual": 10.0, "min": 9.9, "max": 10.1}]},
        "appearance": {"passed": True, "sufficient_data": True, "status": "pass", "items": {"scratch": False, "crack": False, "burr": False, "discoloration": False, "deformation": False}},
        "material": {"passed": True, "sufficient_data": True, "status": "pass", "items": {"grade": "45", "hardness_hb": 205}},
        "function": {"passed": True, "sufficient_data": True, "status": "pass", "items": {"runout_mm": 0.01, "rotation_test": True}},
        "process": {"passed": True, "sufficient_data": True, "status": "pass", "items": {"cycle_complete": True, "traceable": True, "operator_confirmed": True}},
    }


@pytest.fixture
def isolate_team_storage(tmp_path, monkeypatch):
    monkeypatch.setenv("BACKEND_STORAGE", "sqlite")
    monkeypatch.setenv("BACKEND_SQLITE_PATH", str(tmp_path / "team.sqlite3"))


@pytest.fixture(autouse=True)
def isolated_services(isolate_team_storage):
    pass


@pytest.fixture
def service(tmp_path):
    return BackendBusinessService(repository=SQLiteRepository(str(tmp_path / "quality.sqlite3")))


def rectified(service):
    check_id = service.create_quality_check(part_id="PART-GATE", batch_id="BATCH-GATE", result="failed")["quality_check_id"]
    task = service.create_closure_task(quality_check_id=check_id, title="Rework")
    service.complete_closure_task(task["closure_task_id"])
    return check_id, task["closure_task_id"]


def passing_check(service, **changes):
    return service.create_quality_check(**{"part_id": "PART-GATE", "batch_id": "BATCH-GATE", "result": "passed", "quality_validation": complete_validation(), **changes})["quality_check_id"]


@pytest.mark.parametrize("evidence", [["x"], [{"passed": True}], []])
def test_reinspection_rejects_unreferenced_pass_claim(service, evidence):
    check_id, _ = rectified(service)
    with pytest.raises(ValueError):
        service.reinspect_quality_check(check_id, passed=True, evidence=evidence, quality_validation=complete_validation())
    assert service.get_quality_check(check_id)["quality_check"]["reinspection"] == {}


@pytest.mark.parametrize("changes", [{"part_id": "OTHER"}, {"batch_id": "OTHER"}, {"batch_id": ""}, {"result": "pending"}])
def test_reinspection_rejects_wrong_or_unqualified_persisted_check(service, changes):
    check_id, _ = rectified(service)
    reference = passing_check(service, **changes)
    with pytest.raises(ValueError):
        service.reinspect_quality_check(check_id, passed=True, evidence=["x"], reinspection_check_id=reference)


def test_reinspection_rejects_missing_reference(service):
    check_id, _ = rectified(service)
    with pytest.raises(ValueError):
        service.reinspect_quality_check(check_id, passed=True, evidence=["x"], reinspection_check_id="QC-MISSING")


def test_persisted_reinspection_releases_and_audits_reference(service):
    check_id, _ = rectified(service)
    reference = passing_check(service)
    result = service.reinspect_quality_check(check_id, passed=True, reinspection_check_id=reference)
    assert result["quality_check"]["reinspection"]["reinspection_check_id"] == reference
    released = service.release_quality_check(check_id)
    assert released["quality_check"]["status"] == "released"
    audit = service.repository.list_records("audit")
    event = next(item for item in audit if item["action"] == "quality_released")
    assert event["reinspection_check_id"] == reference


def test_release_rechecks_latest_reference_instead_of_cached_pass(service):
    check_id, _ = rectified(service)
    reference = passing_check(service)
    service.reinspect_quality_check(check_id, passed=True, evidence=["x"], reinspection_check_id=reference)
    source = service.repository.get_record("quality", reference)
    source["quality_validation"]["dimensions"]["passed"] = False
    service.repository.save_record("quality", reference, source)
    with pytest.raises(ValueError):
        service.release_quality_check(check_id)
    assert service.repository.get_record("quality", check_id)["status"] == "reinspection"


def test_release_rechecks_latest_rectification_tasks(service):
    check_id, task_id = rectified(service)
    reference = passing_check(service)
    service.reinspect_quality_check(check_id, passed=True, evidence=["x"], reinspection_check_id=reference)
    task = service.repository.get_record("closure", task_id)
    task["status"] = "open"
    service.repository.save_record("closure", task_id, task)
    with pytest.raises(ValueError):
        service.release_quality_check(check_id)


def test_reinspection_rejects_inspection_that_predates_rectification(service):
    reference = passing_check(service)
    check_id, _ = rectified(service)
    with pytest.raises(ValueError):
        service.reinspect_quality_check(check_id, passed=True, evidence=["x"], reinspection_check_id=reference)


def test_direct_release_accepts_complete_initial_check(service):
    reference = passing_check(service)
    assert service.release_quality_check(reference)["quality_check"]["status"] == "released"


def test_direct_release_rejects_legacy_pass_without_batch(service):
    reference = passing_check(service, batch_id="", evidence=["legacy"])
    with pytest.raises(ValueError):
        service.release_quality_check(reference)


def test_failed_reinspection_keeps_failure_path_without_reference(service):
    check_id, _ = rectified(service)
    result = service.reinspect_quality_check(check_id, passed=False, findings=["Still out of tolerance"])
    assert result["quality_check"]["status"] == "failed"


def test_quality_release_and_audit_rollback_together(tmp_path):
    class AuditFailingRepository(SQLiteRepository):
        fail_release_audit = False

        def save_record(self, record_type, record_id, payload):
            if self.fail_release_audit and record_type == "audit" and payload.get("action") == "quality_released":
                raise RuntimeError("audit unavailable")
            return super().save_record(record_type, record_id, payload)

    repository = AuditFailingRepository(str(tmp_path / "atomic.sqlite3"))
    service = BackendBusinessService(repository=repository)
    reference = passing_check(service, evidence=["legacy"])
    repository.fail_release_audit = True
    with pytest.raises(RuntimeError, match="audit unavailable"):
        service.release_quality_check(reference)
    assert repository.get_record("quality", reference)["status"] == "passed"
    assert not any(item["action"] == "quality_released" for item in service.list_audit_logs()["items"])


@pytest.mark.parametrize("flag", ["synthetic", "degraded", "is_synthetic"])
def test_initial_quality_pass_rejects_untrusted_source(service, flag):
    reference = passing_check(service, **{flag: True})
    with pytest.raises(ValueError):
        service.release_quality_check(reference)


@pytest.mark.parametrize("result", ["not_tested", "insufficient_data", "review"])
def test_backend_quality_history_preserves_undetermined_result(service, result):
    check = service.create_quality_check(part_id="PART-STATUS", batch_id="BATCH-STATUS", result=result)["quality_check"]
    assert check["result"] == result
    assert check["status"] == "open"


def test_completed_rectification_invalidates_earlier_initial_pass(service):
    reference = passing_check(service)
    task = service.create_closure_task(quality_check_id=reference, title="Additional mandatory correction")
    service.complete_closure_task(task["closure_task_id"])
    with pytest.raises(ValueError):
        service.release_quality_check(reference)
    assert service.get_quality_check(reference)["quality_check"]["status"] == "reinspection"


def test_appeal_resolution_cannot_bypass_release_by_setting_closed(service):
    check_id = service.create_quality_check(part_id="PART-GATE", batch_id="BATCH-GATE", result="failed")["quality_check_id"]
    appeal = service.submit_quality_appeal(check_id, reason="Review")
    with pytest.raises(ValueError):
        service.resolve_quality_appeal(check_id, appeal_id=appeal["appeal"]["appeal_id"], decision="closed")
    assert service.get_quality_check(check_id)["quality_check"]["status"] == "appealed"
