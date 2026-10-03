"""Agent 侧后端业务工具的 HTTP 门面。"""

from __future__ import annotations

import json
import os
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class BackendServiceError(RuntimeError):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class BackendServiceClient:
    backend = "backend-service"

    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = str(base_url or os.getenv("BACKEND_SERVICE_BASE_URL", "")).rstrip("/")
        if not self.base_url:
            raise BackendServiceError("BACKEND_SERVICE_BASE_URL is not configured")
        self.timeout = float(os.getenv("BACKEND_SERVICE_TIMEOUT_SECONDS", "15"))

    def call(self, tool: str, arguments: Mapping[str, Any] | None = None) -> dict[str, Any]:
        return self.request('/tools/call', {'tool': tool, 'arguments': dict(arguments or {})})

    def request(self, path: str, body: Mapping[str, Any]) -> dict[str, Any]:
        headers = {'Content-Type': 'application/json', 'Accept': 'application/json'}
        token = os.getenv('BACKEND_INTERNAL_TOKEN', '').strip()
        if token:
            headers['Authorization'] = 'Bearer ' + token
        request = Request(self.base_url + path, data=json.dumps(dict(body), ensure_ascii=False).encode('utf-8'), method='POST', headers=headers)
        try:
            with urlopen(request, timeout=self.timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:500]
            raise BackendServiceError("backend-service HTTP %s: %s" % (error.code, detail), status_code=error.code) from error
        except (URLError, TimeoutError, OSError, ValueError) as error:
            raise BackendServiceError("backend-service request failed: %s" % error) from error
        if not isinstance(result, dict):
            raise BackendServiceError("backend-service returned invalid JSON")
        return result

    def resolve_session(self, token: str):
        return self.request('/internal/team/session/resolve', {'token': token}).get('user')

    def line_call(self, operation: str, **body):
        return self.request('/internal/line/' + operation, body)['result']

    def status(self):
        return self.line_call('status')

    def claim_fault_event(self, event_id, device_id, device_ids):
        return self.line_call('claim_fault_event', event_id=event_id, device_id=device_id, device_ids=device_ids)

    def claim_control(self, event_id, device_id, action):
        return self.line_call('claim_control', event_id=event_id, device_id=device_id, action=action)

    def record_device_control(self, event_id, device_id, action, outcome):
        return self.line_call('record_device_control', event_id=event_id, device_id=device_id, action=action, outcome=outcome)

    def set_stop_result(self, generation, result):
        return self.line_call('set_stop_result', generation=generation, result=result)

    def begin_restart(self, generation):
        return self.line_call('begin_restart', generation=generation)

    def finish_restart(self, generation, result):
        return self.line_call('finish_restart', generation=generation, result=result)

    def list_open_faults(self):
        return self.line_call('list_open_faults')

    def record_part_quality(self, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        return self.call("create_quality_check", {**dict(payload), "operator": operator})

    create_quality_check = record_part_quality

    def list_quality_checks(self, target_id: str = "", status: str = "") -> list[dict[str, Any]]:
        return list(self.call("list_quality_checks", {"target_id": target_id, "status": status}).get("items") or [])

    def get_quality_check(self, check_id: str) -> dict[str, Any] | None:
        return self.call("get_quality_check", {"check_id": check_id}).get("quality_check")

    def submit_appeal(self, check_id: str, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        return self.call("submit_quality_appeal", {"check_id": check_id, **dict(payload), "operator": operator})

    def create_closure_task(self, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        return self.call("create_closure_task", {**dict(payload), "operator": operator})

    def list_closure_tasks(self, status: str = "") -> list[dict[str, Any]]:
        return list(self.call("list_closure_tasks", {"status": status}).get("items") or [])

    def complete_closure_task(self, task_id: str, operator: str = "", note: str = "") -> dict[str, Any]:
        return self.call("complete_closure_task", {"task_id": task_id, "operator": operator, "note": note})

    def record_reinspection(self, check_id: str, payload: Mapping[str, Any], operator: str = "") -> dict[str, Any]:
        return self.call("reinspect_quality_check", {"check_id": check_id, **dict(payload), "operator": operator or payload.get("operator", "")})

    def release_quality_check(self, check_id: str, operator: str = "") -> dict[str, Any]:
        return self.call("release_quality_check", {"check_id": check_id, "operator": operator})

    def close_quality_check(self, check_id: str, operator: str = "", note: str = "") -> dict[str, Any]:
        return self.call("close_quality_check", {"check_id": check_id, "operator": operator, "note": note})

    def audit_logs(self, object_id: str = "", action: str = "") -> list[dict[str, Any]]:
        return list(self.call("list_audit_logs", {"object_id": object_id, "action": action}).get("items") or [])


__all__ = ["BackendServiceClient", "BackendServiceError"]
