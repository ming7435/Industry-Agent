"""Agent-side HTTP facade for Backend business tools."""

from __future__ import annotations

import json
import os
from typing import Any, Mapping
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class BackendServiceError(RuntimeError):
    pass


class BackendServiceClient:
    backend = "backend-service"

    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = str(base_url or os.getenv("BACKEND_SERVICE_BASE_URL", "")).rstrip("/")
        if not self.base_url:
            raise BackendServiceError("BACKEND_SERVICE_BASE_URL is not configured")
        self.timeout = float(os.getenv("BACKEND_SERVICE_TIMEOUT_SECONDS", "15"))

    def call(self, tool: str, arguments: Mapping[str, Any] | None = None) -> dict[str, Any]:
        request = Request(self.base_url + "/tools/call", data=json.dumps({"tool": tool, "arguments": dict(arguments or {})}, ensure_ascii=False).encode("utf-8"), method="POST", headers={"Content-Type": "application/json", "Accept": "application/json"})
        try:
            with urlopen(request, timeout=self.timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
        except HTTPError as error:
            detail = error.read().decode("utf-8", errors="replace")[:500]
            raise BackendServiceError("backend-service HTTP %s: %s" % (error.code, detail)) from error
        except (URLError, TimeoutError, OSError, ValueError) as error:
            raise BackendServiceError("backend-service request failed: %s" % error) from error
        if not isinstance(result, dict):
            raise BackendServiceError("backend-service returned invalid JSON")
        return result

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

    def audit_logs(self, object_id: str = "", action: str = "") -> list[dict[str, Any]]:
        return list(self.call("list_audit_logs", {"object_id": object_id, "action": action}).get("items") or [])


__all__ = ["BackendServiceClient", "BackendServiceError"]
