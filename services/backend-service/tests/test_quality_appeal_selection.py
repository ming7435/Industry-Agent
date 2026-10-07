"""Appeal resolution uses one unambiguous pending target in isolated storage."""
from types import SimpleNamespace

import pytest

from app.workorder.repository import SQLiteRepository
from app.workorder.service import BackendBusinessService


@pytest.fixture
def service(tmp_path):
    return BackendBusinessService(
        repository=SQLiteRepository(str(tmp_path / "appeal-selection.sqlite3")),
        team_service=SimpleNamespace(),
    )


def check_with_appeal(service):
    check_id = service.create_quality_check(part_id="PART-APPEAL", batch_id="BATCH-APPEAL", result="failed")["quality_check_id"]
    appeal = service.submit_quality_appeal(check_id, reason="First review")["appeal"]
    return check_id, appeal["appeal_id"]


@pytest.mark.parametrize("decision,status", [("approved", "rectification"), ("rejected", "rejected"), ("withdrawn", "withdrawn")])
def test_empty_id_resolves_second_pending_appeal_after_first_approved(service, decision, status):
    check_id, first_id = check_with_appeal(service)
    service.resolve_quality_appeal(check_id, appeal_id=first_id, decision="approved")
    second_id = service.submit_quality_appeal(check_id, reason="Second review")["appeal"]["appeal_id"]

    result = service.resolve_quality_appeal(check_id, decision=decision)

    assert result["appeal"]["appeal_id"] == second_id
    assert result["quality_check"]["status"] == status
    appeals = {item["appeal_id"]: item["status"] for item in service.get_quality_check(check_id)["quality_check"]["appeals"]}
    assert appeals == {first_id: "approved", second_id: decision}


def test_explicit_resolved_id_cannot_fall_back_to_new_pending_appeal(service):
    check_id, first_id = check_with_appeal(service)
    service.resolve_quality_appeal(check_id, appeal_id=first_id, decision="approved")
    second_id = service.submit_quality_appeal(check_id, reason="Second review")["appeal"]["appeal_id"]
    before = service.get_quality_check(check_id)["quality_check"]
    audit_before = service.list_audit_logs()["items"]

    with pytest.raises(ValueError, match="不能重复处理"):
        service.resolve_quality_appeal(check_id, appeal_id=first_id, decision="rejected")

    assert service.get_quality_check(check_id)["quality_check"] == before
    assert service.list_audit_logs()["items"] == audit_before
    assert next(item for item in before["appeals"] if item["appeal_id"] == second_id)["status"] == "pending"


def test_empty_id_rejects_multiple_pending_appeals_without_state_change(service):
    check_id, _ = check_with_appeal(service)
    service.submit_quality_appeal(check_id, reason="Another pending review")
    before = service.get_quality_check(check_id)["quality_check"]
    audit_before = service.list_audit_logs()["items"]

    with pytest.raises(ValueError, match="多个待处理申诉"):
        service.resolve_quality_appeal(check_id, decision="approved")

    assert service.get_quality_check(check_id)["quality_check"] == before
    assert service.list_audit_logs()["items"] == audit_before


def test_explicit_id_disambiguates_multiple_pending_appeals(service):
    check_id, first_id = check_with_appeal(service)
    second_id = service.submit_quality_appeal(check_id, reason="Another pending review")["appeal"]["appeal_id"]

    result = service.resolve_quality_appeal(check_id, appeal_id=second_id, decision="approved")

    assert result["appeal"]["appeal_id"] == second_id
    appeals = {item["appeal_id"]: item["status"] for item in result["quality_check"]["appeals"]}
    assert appeals == {first_id: "pending", second_id: "approved"}


def test_empty_id_without_pending_appeal_is_rejected(service):
    check_id, appeal_id = check_with_appeal(service)
    service.resolve_quality_appeal(check_id, appeal_id=appeal_id, decision="approved")

    with pytest.raises(ValueError):
        service.resolve_quality_appeal(check_id, decision="rejected")

    assert service.get_quality_check(check_id)["quality_check"]["status"] == "rectification"
