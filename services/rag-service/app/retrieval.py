"""Shared retrieval primitives used by dense and BM25 routes."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any


@dataclass
class Hit:
    """One candidate chunk returned by a retrieval route."""

    chunk_id: str
    text: str
    score: float
    source: str
    metadata: dict[str, Any] = field(default_factory=dict)
    rank: int = 0


def load_metadata_json(raw: Any) -> dict[str, Any]:
    """Parse a stored metadata JSON value into a mapping."""

    if isinstance(raw, dict):
        return dict(raw)
    if not raw:
        return {}
    try:
        decoded = json.loads(raw)
    except (TypeError, ValueError):
        return {}
    return decoded if isinstance(decoded, dict) else {}


def matches_metadata(hit: Hit, filters: dict[str, Any]) -> bool:
    """Apply case-insensitive metadata filters that could not be pushed down."""

    for key, value in filters.items():
        found = hit.metadata.get(key)
        if found is None:
            return False
        if str(found).lower() != str(value).lower():
            return False
    return True


__all__ = ["Hit", "load_metadata_json", "matches_metadata"]
