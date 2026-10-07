"""检查反馈由服务端采样，Backend事实决定结束，不进入任何复机路径。"""
from copy import deepcopy
from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api import team_auth
from app.clients.backend import BackendServiceError
from app.monitor.factory_api import FactoryApiClient, FactoryApiError
from app.monitor.line_control import LineController


class BackendBoundary:
    def __init__(self, status="in_progress", passed=False, role="technician", assignee="U-CHECK", kind="inspection"):
        self.actor = {"user_id": "U-CHECK", "role": role}
        self.order = {"workorder_id": "WO-CHECK", "device_id": "M-CHECK", "assignee": assignee,
                      "status": "in_progress", "maintenance_plan_snapshot": {"plan_kind": kind}}
        self.calls, self.requests = [], []
        self.result = {"success": True, "workorder": {**deepcopy(self.order), "status": status,
            "repair_verification": {"source": "inspection", "phase": "inspection", "passed": passed}},
            "inspection_result": {"passed": passed, "checks": {"alarms_cleared": passed},
                                  "validation_findings": [] if passed else ["当前报警未清除"]}}
        self.error = None

    def resolve_session(self, token):
        assert token == "isolated-test-session"
        return deepcopy(self.actor)

    def call(self, name, body):
        self.calls.append((name, deepcopy(body)))
        if name == "get_workorder":
            assert body == {"workorder_id": "WO-CHECK"}
            return {"workorder": deepcopy(self.order)}
        if name == "submit_repair_feedback":
            return {"success": True, "workorder": deepcopy(self.order)}
        raise AssertionError("检查反馈不得使用通用状态/控制写入口：" + name)

    def request(self, path, body):
        self.requests.append((path, deepcopy(body)))
        assert path == "/internal/team/inspection/record"
        if self.error:
            raise self.error
        return deepcopy(self.result)


def setup_boundary(monkeypatch, *, status="warning", alarm="700003", passed=False, **changes):
    backend = BackendBoundary(status="closed" if passed else "in_progress", passed=passed, **changes)
    monkeypatch.setattr(team_auth, "BackendServiceClient", lambda: backend)
    reads = []
    sample = {"device_id": "M-CHECK", "status": status, "alarm_code": alarm,
              "metrics": {"pressure": 1.2}, "checked_at": datetime.now(timezone.utc).isoformat()}
    envelope = {"devices": [{"device_id": "M-OTHER", "status": "running", "alarm_code": "", "metrics": {"pressure": 9}},
                            {"device_id": "M-CHECK", "status": status, "alarm_code": alarm,
                             "metrics": {"pressure": 1.2}, "checked_at": sample["checked_at"]}],
                "monitor": {"device_id": "M-OTHER", "status": "running", "alarm_code": ""}}
    def snapshot(self, device_id):
        reads.append(device_id)
        return deepcopy(envelope)
    monkeypatch.setattr(FactoryApiClient, "snapshot", snapshot)
    def forbid_control(*args, **kwargs):
        raise AssertionError("检查反馈只能读取快照，不能实例化控制器或启停/维修复机")
    monkeypatch.setattr(FactoryApiClient, "control_device", forbid_control)
    monkeypatch.setattr(LineController, "__init__", forbid_control)
    monkeypatch.setattr(LineController, "confirm_and_restart", forbid_control)
    monkeypatch.setattr(LineController, "try_restart", forbid_control)
    request = SimpleNamespace(cookies={"maintenance_session": "isolated-test-session"})
    return backend, reads, envelope, sample, request


@pytest.mark.parametrize("status,alarm,passed", [
    ("warning", "700003", False), ("running", "", True), ("stopped", "", True),
])
def test_inspection_feedback_sends_only_server_snapshot_and_returns_backend_facts(monkeypatch, status, alarm, passed):
    backend, reads, _, sample, request = setup_boundary(monkeypatch, status=status, alarm=alarm, passed=passed)
    forged = {"device_id": "M-OTHER", "status": "running", "alarm_code": "", "metrics": {"pressure": 999}}
    result = team_auth.human_action("WO-CHECK", "submit_feedback", {
        "feedback": "已核查报警及外观并上报", "snapshot": forged,
        "verification": {"passed": True}, "actor_id": "U-OTHER", "device_id": "M-OTHER",
    }, request)
    assert reads == ["M-CHECK"]
    assert backend.requests == [("/internal/team/inspection/record", {
        "workorder_id": "WO-CHECK", "actor_id": "U-CHECK", "feedback": "已核查报警及外观并上报", "snapshot": sample})]
    assert [name for name, _ in backend.calls] == ["get_workorder"]
    assert result == backend.result
    assert result["inspection_result"]["passed"] is passed
    assert result["workorder"]["status"] == ("closed" if passed else "in_progress")


def test_sampling_failure_saves_feedback_with_missing_evidence_not_client_snapshot(monkeypatch):
    backend, _, _, _, request = setup_boundary(monkeypatch)
    def unavailable(self, device_id):
        raise FactoryApiError("isolated snapshot unavailable")
    monkeypatch.setattr(FactoryApiClient, "snapshot", unavailable)
    result = team_auth.human_action("WO-CHECK", "submit_feedback", {
        "feedback": "记录现场观察，实时数据暂不可用", "snapshot": {"device_id": "M-CHECK", "status": "running"},
    }, request)
    assert backend.requests
    assert backend.requests[0][1]["snapshot"] == {}
    assert result["workorder"]["status"] == "in_progress"
    assert result["inspection_result"]["passed"] is False


def test_wrong_device_snapshot_is_not_filled_with_requested_identity_or_time(monkeypatch):
    backend, _, envelope, _, request = setup_boundary(monkeypatch)
    envelope["devices"] = [{"device_id": "M-OTHER", "status": "running"}]
    team_auth.human_action("WO-CHECK", "submit_feedback", {"feedback": "已观察"}, request)
    assert backend.requests
    snapshot = backend.requests[0][1]["snapshot"]
    assert not snapshot.get("device_id")
    assert not snapshot.get("checked_at")


@pytest.mark.parametrize("changes", [{"role": "supervisor"}, {"assignee": "U-OTHER"}])
def test_only_real_session_assignee_can_sample_and_record_inspection(monkeypatch, changes):
    backend, reads, _, _, request = setup_boundary(monkeypatch, **changes)
    with pytest.raises(HTTPException) as error:
        team_auth.human_action("WO-CHECK", "submit_feedback", {"feedback": "已观察"}, request)
    assert error.value.status_code == 403
    assert reads == [] and backend.requests == []


def test_inspection_without_device_identity_does_not_read_unspecified_factory(monkeypatch):
    backend, reads, _, _, request = setup_boundary(monkeypatch)
    backend.order["device_id"] = ""
    with pytest.raises(HTTPException) as error:
        team_auth.human_action("WO-CHECK", "submit_feedback", {"feedback": "已观察"}, request)
    assert error.value.status_code == 409
    assert reads == [] and backend.requests == []


def test_existing_repair_feedback_path_does_not_gain_snapshot_or_inspection_closure(monkeypatch):
    backend, reads, _, _, request = setup_boundary(monkeypatch, kind="repair")
    team_auth.human_action("WO-CHECK", "submit_feedback", {"repair_feedback": {"result": "已完成维修记录"}}, request)
    assert reads == [] and backend.requests == []
    assert backend.calls[-1] == ("submit_repair_feedback", {
        "workorder_id": "WO-CHECK", "feedback": {"feedback": "已完成维修记录", "operator": "U-CHECK"}})


def test_inspection_mark_repair_completed_still_fails_before_sampling(monkeypatch):
    backend, reads, _, _, request = setup_boundary(monkeypatch)
    with pytest.raises(HTTPException) as error:
        team_auth.human_action("WO-CHECK", "mark_repair_completed", {"feedback": "已观察"}, request)
    assert error.value.status_code == 409
    assert reads == [] and backend.requests == []


def test_inspection_backend_failure_does_not_fall_back_to_generic_feedback_or_restart(monkeypatch):
    backend, reads, _, _, request = setup_boundary(monkeypatch)
    backend.error = BackendServiceError("isolated backend unavailable", status_code=503)
    with pytest.raises(BackendServiceError) as error:
        team_auth.human_action("WO-CHECK", "submit_feedback", {"feedback": "已观察"}, request)
    assert error.value.status_code == 503
    assert reads == ["M-CHECK"]
    assert [name for name, _ in backend.calls] == ["get_workorder"]
    assert len(backend.requests) == 1
