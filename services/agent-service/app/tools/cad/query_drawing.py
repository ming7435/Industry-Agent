"""CAD MCP：图纸查询兼容入口。"""

from __future__ import annotations

from typing import Any, Dict

from .get_drawing_metadata import get_drawing_metadata


def query_drawing(**arguments: Any) -> Dict[str, Any]:
    return get_drawing_metadata(**arguments)
