"""Memory Agent 的经验准入规则。"""

from __future__ import annotations

from typing import Any, Mapping

from app.experience.validator import ExperienceValidator


class MemoryAgentValidator:
    @staticmethod
    def validate_search(request: Mapping[str, Any]) -> list[str]:
        if not any(request.get(key) for key in ("device_id", "device_model", "alarm_code", "fault_type", "component", "part_no", "query")):
            return ["经验检索至少需要一个检索条件"]
        return []

    @staticmethod
    def validate_admission(request: Mapping[str, Any]) -> list[str]:
        workorder = request.get("workorder") or {}
        quality = request.get("quality") or {}
        if not ExperienceValidator().is_valid(workorder, quality):
            return ["仅允许质量通过且工单已关闭的经验进入长期记忆"]
        return []

    @staticmethod
    def deduplicate(items: list[Mapping[str, Any]]) -> list[dict[str, Any]]:
        seen: set[tuple[str, str, str, str]] = set()
        result: list[dict[str, Any]] = []
        for item in items:
            key = (str(item.get("experience_id") or ""), str(item.get("source_workorder") or ""), str(item.get("device_id") or ""), str(item.get("content") or ""))
            if key in seen:
                continue
            seen.add(key)
            result.append(dict(item))
        return result
