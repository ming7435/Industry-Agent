"""多设备负责范围的独立 Agent 进程；仅连接父测试创建的 Backend。"""

import json
import os
from urllib.error import HTTPError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

from fastapi.testclient import TestClient

from app.agents.workorder.agent import WorkOrderAgent
from app.api.server import create_app
from app.clients.backend import BackendServiceClient


BACKEND_URL = os.environ["BACKEND_SERVICE_BASE_URL"]
assert os.environ["APP_ENV"] == "testing"
assert os.environ["BACKEND_STORAGE"] == "sqlite"
assert urlparse(BACKEND_URL).hostname == "127.0.0.1"
assert urlparse(BACKEND_URL).port not in {4529, 8001, 8010, 8020, 8030, 8040, 8050}


def public_call(path, body=None, cookie=""):
    headers = {"Content-Type": "application/json"}
    if cookie:
        headers["Cookie"] = cookie
    request = Request(
        BACKEND_URL + path,
        data=json.dumps(body).encode() if body is not None else None,
        headers=headers,
        method="POST" if body is not None else "GET",
    )
    with urlopen(request, timeout=5) as response:
        return json.load(response), response.headers.get("Set-Cookie", "").split(";")[0]


def create_fault(agent, event_id, device_id):
    diagnosis = {
        "device_id": device_id,
        "fault": "隔离派工测试故障",
        "confidence": 0.95,
        "evidence_status": "validated",
        "evidence_validated": True,
        "severity": "fault",
    }
    plan = {
        "device_id": device_id,
        "plan_id": "PLAN-" + event_id,
        "repair_steps": ["处理隔离测试故障"],
        "workorder_ready": True,
        "maintenance_required": True,
        "diagnosis": diagnosis,
    }
    return agent.run({
        "action": "create", "source": "monitor", "event_id": event_id,
        "idempotency_key": event_id, "maintenance_plan": plan,
    })


def assert_waiting(result):
    assert not result.success, result.model_dump()
    assert result.status == "waiting_for_personnel", result.model_dump()
    assert result.workorder_id, result.model_dump()
    assert not result.workorder.get("assignee"), result.model_dump()


def assert_assigned(result, user_id, expected_id):
    assert result.success, result.model_dump()
    assert result.assignee == user_id, result.model_dump()
    assert result.workorder_id == expected_id, result.model_dump()


def assert_visible_orders(app, cookie, expected_ids):
    with TestClient(app) as client:
        client.cookies.set("maintenance_session", cookie.split("=", 1)[1])
        response = client.get("/api/workorders")
        assert response.status_code == 200, response.text
        assert {order["workorder_id"] for order in response.json()["items"]} == expected_ids
    public_orders, _ = public_call("/api/team/workorders", cookie=cookie)
    assert {order["workorder_id"] for order in public_orders["items"]} == expected_ids


def assert_update_rejected(cookie, device_ids):
    try:
        public_call("/api/team/responsibilities", {"responsible_device_ids": device_ids}, cookie)
    except HTTPError as error:
        assert error.code == 409, error.read().decode()
    else:
        raise AssertionError("Unfinished assigned work must prevent removing its device")


def main():
    backend = BackendServiceClient()
    agent = WorkOrderAgent()
    registration, _ = public_call("/api/team/register", {
        "username": "multi-device-tech", "password": "isolated-password-123",
        "role": "technician", "responsible_device_ids": ["M1", "M2"],
    })
    owner = registration["user"]
    assert owner["responsible_device_ids"] == ["M1", "M2"], owner
    assert owner["primary_device_id"] == "M1", owner

    # 注册不会造成在线状态；选中的非主设备也必须等本人登录。
    offline = create_fault(agent, "EVENT-M2-FIRST", "M2")
    assert_waiting(offline)
    assert not backend.call("query_team_availability", {"device_id": "M2"})["available"]
    login, owner_cookie = public_call("/api/team/login", {
        "username": owner["username"], "password": "isolated-password-123",
    })
    assert login["user"]["responsible_device_ids"] == ["M1", "M2"]
    candidates = backend.call("query_technicians", {"device_id": "M2"})["items"]
    assert len(candidates) == 1, candidates
    assert candidates[0]["responsible_device_ids"] == ["M1", "M2"], candidates
    assert candidates[0]["online"] is True and candidates[0]["available"] is True
    assert backend.call("query_team_availability", {"device_id": "M2"})["available"]
    assigned = create_fault(agent, "EVENT-M2-FIRST", "M2")
    assert_assigned(assigned, owner["user_id"], offline.workorder_id)
    # 新 Agent 实例证明数据库幂等也成立，不依赖当前实例的内存缓存。
    repeated = create_fault(WorkOrderAgent(), "EVENT-M2-FIRST", "M2")
    assert_assigned(repeated, owner["user_id"], assigned.workorder_id)
    assert len(backend.call("list_workorders", {})["items"]) == 1

    unselected = create_fault(agent, "EVENT-M3-FIRST", "M3")
    assert_waiting(unselected)
    assert backend.call("query_technicians", {"device_id": "M3"})["items"] == []

    # 不能移除仍有本人在手工单的 M2；失败更新不能写入一半的设备范围。
    assert_update_rejected(owner_cookie, ["M1", "M3"])
    unchanged, _ = public_call("/api/team/me", cookie=owner_cookie)
    assert unchanged["user"]["responsible_device_ids"] == ["M1", "M2"], unchanged
    # 移除无在手任务的 M1，并加入 M3 后，新范围应在当前会话立即生效。
    updated, _ = public_call("/api/team/responsibilities", {"responsible_device_ids": ["M2", "M3"]}, owner_cookie)
    assert updated["user"]["responsible_device_ids"] == ["M2", "M3"], updated
    me, _ = public_call("/api/team/me", cookie=owner_cookie)
    assert me["user"]["responsible_device_ids"] == ["M2", "M3"], me
    changed = create_fault(agent, "EVENT-M3-FIRST", "M3")
    assert_assigned(changed, owner["user_id"], unselected.workorder_id)
    removed_scope = create_fault(agent, "EVENT-M1-FIRST", "M1")
    assert_waiting(removed_scope)
    assert backend.call("query_technicians", {"device_id": "M1"})["items"] == []

    other, _ = public_call("/api/team/register", {
        "username": "second-device-tech", "password": "isolated-password-456",
        "role": "technician", "responsible_device_ids": ["M1"],
    })
    _, other_cookie = public_call("/api/team/login", {
        "username": other["user"]["username"], "password": "isolated-password-456",
    })
    other_order = create_fault(agent, "EVENT-M1-FIRST", "M1")
    assert_assigned(other_order, other["user"]["user_id"], removed_scope.workorder_id)
    app = create_app()
    assert_visible_orders(app, owner_cookie, {assigned.workorder_id, changed.workorder_id})
    assert_visible_orders(app, other_cookie, {other_order.workorder_id})

    public_call("/api/team/logout", {}, owner_cookie)
    logged_out = create_fault(agent, "EVENT-M2-OFFLINE", "M2")
    assert_waiting(logged_out)
    assert not backend.call("query_team_availability", {"device_id": "M2"})["available"]
    assert backend.call("query_team_availability", {"device_id": "M1"})["available"]
    orders = backend.call("list_workorders", {})["items"]
    assert len(orders) == 4, orders
    assert sum(bool(order.get("assignee")) for order in orders) == 3, orders
    print(json.dumps({
        "assigned_orders": 3, "pending_orders": 1,
        "non_primary_assignment": True, "responsibilities_updated": True,
        "account_isolation": True,
    }))


if __name__ == "__main__":
    main()
