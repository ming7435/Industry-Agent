"""比较维修前后指标并判断关键参数是否恢复。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


DEFAULT_THRESHOLDS = {
    "spindle_temperature_c": 75.0,
    "spindle_vibration_mm_s": 4.5,
}


def compare_pre_post_metrics(
    pre_metrics: Mapping[str, Any] | None = None,
    post_metrics: Mapping[str, Any] | None = None,
    history: Mapping[str, Any] | None = None,
    metric_keys: list[str] | None = None,
    thresholds: Mapping[str, Any] | None = None,
    **_: Any,
) -> Dict[str, Any]:
    before = dict(pre_metrics or {})
    after = dict(post_metrics or {})
    trend = dict((history or {}).get("trend") or {})
    for key, summary in trend.items():
        if key not in after and isinstance(summary, Mapping):
            after[key] = summary.get("latest")
    keys = list(metric_keys or [])
    for key in list(before) + list(after):
        if key not in keys:
            keys.append(key)
    limit_map = {**DEFAULT_THRESHOLDS, **dict(thresholds or {})}
    comparisons = []
    failed = []
    for key in keys:
        pre = _number(before.get(key))
        post = _number(after.get(key))
        threshold = _number(limit_map.get(key))
        recovered = True if post is None else (threshold is None or post <= threshold)
        improved = pre is None or post is None or post <= pre
        comparisons.append({"metric": key, "pre": pre, "post": post, "threshold": threshold, "improved": improved, "recovered": recovered})
        if not recovered:
            failed.append("%s=%s 超过恢复阈值 %s" % (key, post, threshold))
    return {
        "success": True,
        "parameters_recovered": not failed,
        "improved": all(item["improved"] for item in comparisons) if comparisons else True,
        "metric_keys": keys,
        "comparisons": comparisons,
        "evidence": comparisons,
        "reason": "；".join(failed) if failed else "关键参数已恢复或无异常采样",
        "source": "plc-mcp",
    }


def _number(value: Any) -> float | None:
    try:
        return None if value is None else float(value)
    except (TypeError, ValueError):
        return None
