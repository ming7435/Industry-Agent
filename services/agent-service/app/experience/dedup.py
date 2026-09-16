"""经验记录去重。"""

from __future__ import annotations

from typing import Any, Iterable, Mapping


def experience_key(item: Mapping[str, Any]) -> tuple[str, str, str]:
    return (
        str(item.get("device_id", "")),
        str(item.get("fault", "")),
        str(item.get("source_workorder", "")),
    )


class ExperienceDeduplicator:
    def contains(self, item: Mapping[str, Any], existing: Iterable[Mapping[str, Any]]) -> bool:
        key = experience_key(item)
        return any(experience_key(value) == key for value in existing)
