"""Exercise the local closure gate with persisted record references."""

import pytest

from app.closure import ClosureService


def complete_validation():
    return {
        "dimensions": {"passed": True, "sufficient_data": True, "status": "pass", "items": [{"item": "diameter_mm", "actual": 10.0, "min": 9.9, "max": 10.1}]},
        "appearance": {"passed": True, "sufficient_data": True, "status": "pass", "items": {"scratch": False, "crack": False, "burr": False, "discoloration": False, "deformation": False}},
        "material": {"passed": True, "sufficient_data": True, "status": "pass", "items": {"grade": "45", "hardness_hb": 205}},
        "function": {"passed": True, "sufficient_data": True, "status": "pass", "items": {"runout_mm": 0.01, "rotation_test": True}},
        "process": {"passed": True, "sufficient_data": True, "status": "pass", "items": {"cycle_complete": True, "traceable": True, "operator_confirmed": True}},
    }


@pytest.fixture
def service():
    return ClosureService()


def rectified(service):
    check = service.create_quality_check({"target_id": "PART-GATE", "batch_id": "BATCH-GATE", "result": "failed"})
    task = service.create_closure_task({"quality_check_id": check["quality_check_id"], "title": "Rework"})
    service.complete_closure_task(task["closure_task_id"])
    return check["quality_check_id"], task["closure_task_id"]


def passing_check(service, **changes):
    return service.create_quality_check({"target_id": "PART-GATE", "batch_id": "BATCH-GATE", "result": "passed", "quality_validation": complete_validation(), **changes})["quality_check_id"]


@pytest.mark.parametrize("evidence", [["x"], [{"passed": True}], []])
def test_local_reinspection_rejects_unreferenced_pass_claim(service, evidence):
    check_id, _ = rectified(service)
    with pytest.raises(ValueError):
        service.record_reinspection(check_id, {"passed": True, "evidence": evidence, "quality_validation": complete_validation()})


@pytest.mark.parametrize("changes", [{"target_id": "OTHER"}, {"batch_id": "OTHER"}, {"batch_id": ""}, {"result": "pending"}])
def test_local_reinspection_rejects_wrong_or_unqualified_reference(service, changes):
    check_id, _ = rectified(service)
    reference = passing_check(service, **changes)
    with pytest.raises(ValueError):
        service.record_reinspection(check_id, {"passed": True, "evidence": ["x"], "reinspection_check_id": reference})


def test_local_persisted_reinspection_releases_and_audits_reference(service):
    check_id, _ = rectified(service)
    reference = passing_check(service)
    result = service.record_reinspection(check_id, {"passed": True, "reinspection_check_id": reference})
    assert result["reinspection"]["reinspection_check_id"] == reference
    assert service.release_quality_check(check_id)["status"] == "released"
    event = next(item for item in service.audit_logs() if item["action"] == "quality_released")
    assert event["changes"]["reinspection_check_id"] == reference


def test_local_release_rechecks_reference_and_completed_tasks(service):
    check_id, task_id = rectified(service)
    reference = passing_check(service)
    service.record_reinspection(check_id, {"passed": True, "evidence": ["x"], "reinspection_check_id": reference})
    service._closure_tasks[task_id]["status"] = "open"
    with pytest.raises(ValueError):
        service.release_quality_check(check_id)
    service._closure_tasks[task_id]["status"] = "completed"
    service._quality_checks[reference]["quality_validation"]["material"]["passed"] = False
    with pytest.raises(ValueError):
        service.release_quality_check(check_id)


def test_local_direct_release_uses_full_initial_validation(service):
    reference = passing_check(service)
    assert service.release_quality_check(reference)["status"] == "released"


def test_local_direct_release_rejects_missing_batch(service):
    reference = passing_check(service, batch_id="", evidence=["legacy"])
    with pytest.raises(ValueError):
        service.release_quality_check(reference)


def test_reinspection_api_schema_keeps_persisted_reference():
    from app.api.schemas.closure import QualityReinspectionRequest

    request = QualityReinspectionRequest(passed=True, reinspection_check_id="QC-REFERENCE")
    assert request.model_dump()["reinspection_check_id"] == "QC-REFERENCE"


@pytest.mark.parametrize("flag", ["synthetic", "degraded", "is_synthetic"])
def test_local_initial_quality_pass_rejects_untrusted_source(service, flag):
    reference = passing_check(service, **{flag: True})
    with pytest.raises(ValueError):
        service.release_quality_check(reference)


def test_local_completed_rectification_invalidates_earlier_initial_pass(service):
    reference = passing_check(service)
    task = service.create_closure_task({"quality_check_id": reference, "title": "Additional mandatory correction"})
    service.complete_closure_task(task["closure_task_id"])
    with pytest.raises(ValueError):
        service.release_quality_check(reference)
    assert service.get_quality_check(reference)["status"] == "reinspection"


def test_local_release_rolls_back_state_when_audit_fails():
    class AuditFailingClosureService(ClosureService):
        fail_audit = False

        def _audit(self, action, object_id, operator, changes):
            if self.fail_audit and action == "quality_released":
                raise RuntimeError("audit unavailable")
            super()._audit(action, object_id, operator, changes)

    service = AuditFailingClosureService()
    reference = passing_check(service)
    service.fail_audit = True
    with pytest.raises(RuntimeError, match="audit unavailable"):
        service.release_quality_check(reference)
    assert service.get_quality_check(reference)["status"] == "passed"
    assert not any(item["action"] == "quality_released" for item in service.audit_logs())


@pytest.mark.parametrize("fail", [False, True])
def test_mysql_closure_store_defers_commits_until_gate_and_audit_finish(fail):
    from contextvars import ContextVar
    from types import SimpleNamespace
    from app.closure.store import MySQLClosureStore

    class Connection:
        commits = 0
        rollbacks = 0
        closes = 0

        def cursor(self, **kwargs):
            return self

        def execute(self, sql, args=()):
            if fail and "INSERT INTO closure_audit_logs" in sql:
                raise RuntimeError("audit unavailable")

        def fetchall(self):
            return []

        def commit(self):
            self.commits += 1

        def rollback(self):
            self.rollbacks += 1

        def close(self):
            self.closes += 1

    connection = Connection()
    connections = []

    def connect(**kwargs):
        connections.append(connection)
        return connection

    store = MySQLClosureStore.__new__(MySQLClosureStore)
    store.config = {}
    store._connector = SimpleNamespace(connect=connect)
    store._active_connection = ContextVar("closure-test-connection", default=None)

    def transition():
        with store.quality_transaction():
            store.update_quality_check("QC-1", {"status": "released"})
            assert connection.commits == 0
            store.create_audit({"audit_id": "A-1", "action": "quality_released", "object_id": "QC-1", "operator": "q", "changes": {}, "created_at": "now"})

    if fail:
        with pytest.raises(RuntimeError, match="audit unavailable"):
            transition()
        assert connection.commits == 0
        assert connection.rollbacks == 1
    else:
        transition()
        assert connection.commits == 1
        assert connection.rollbacks == 0
    assert len(connections) == 1
