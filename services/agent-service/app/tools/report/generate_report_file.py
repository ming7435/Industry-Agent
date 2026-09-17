"""Report MCP：将结构化报告导出为 JSON 文件。"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Mapping


def generate_report_file(
    report: Mapping[str, Any],
    path: str = "",
    format: str = "json",
    **_: Any,
) -> Dict[str, Any]:
    if str(format).lower() != "json":
        return {"success": False, "generated": False, "error": "当前仅支持 JSON 格式", "source": "report-file"}
    if not path:
        return {"success": False, "generated": False, "error": "path 不能为空", "source": "report-file"}
    target = Path(path).expanduser()
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(dict(report or {}), ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    return {"success": True, "generated": True, "path": str(target), "source": "report-file"}
