"""Knowledge Agent 的证据质量置信度评分。

BM25、稠密检索、RRF 和重排阶段的分数不可直接比较。本模块有意对 *证据包* 评分，而不是把某个后端分数直接作为面向用户的置信度。
"""

from __future__ import annotations

import re
from typing import Any, Mapping


_TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9._/-]*|[\u4e00-\u9fff]{2,}", re.IGNORECASE)


def _tokens(value: Any) -> set[str]:
    text = str(value or "").lower()
    tokens = set(_TOKEN_RE.findall(text))
    # 中文查询经常是短语。字符二元组可以保留有用的局部匹配，且不依赖第三方分词器。
    for phrase in re.findall(r"[\u4e00-\u9fff]+", text):
        tokens.update(phrase[index : index + 2] for index in range(len(phrase) - 1))
    return tokens


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, float(value)))


def _source(document: Mapping[str, Any]) -> str:
    metadata = document.get("metadata") or {}
    return str(
        document.get("knowledge_type")
        or metadata.get("knowledge_type")
        or document.get("source_type")
        or metadata.get("source_type")
        or ""
    ).strip().lower()


def _relevance(document: Mapping[str, Any], position: int) -> float:
    metadata = document.get("metadata") or {}
    try:
        score = _clamp(float(document.get("score") or 0.0))
    except (TypeError, ValueError):
        score = 0.0

    stage = str(metadata.get("stage") or "").lower()
    if stage == "rerank" or metadata.get("rerank_score") is not None:
        return score
    if stage in {"fusion", "rrf"} or metadata.get("fusion_score") is not None:
        # RRF 分数是排名信号，不是概率。将排名和检索路径一致性转换为稳定的相关性估计。
        detail = metadata.get("rrf_detail") or {}
        agreement = min(1.0, len(detail) / 2.0) if isinstance(detail, Mapping) else 0.0
        rank_quality = max(0.0, 1.0 - 0.08 * max(position - 1, 0))
        return _clamp(0.72 * rank_quality + 0.18 * agreement + 0.10 * min(score * 20.0, 1.0))
    return score


def calculate_confidence(
    documents: list[Mapping[str, Any]],
    required_sources: list[str] | None = None,
    query: str = "",
    degraded: bool = False,
) -> dict[str, Any]:
    """返回检索证据包的可解释置信度分数。

    结果有意保持保守：高分需要相关内容、来源覆盖，以及不止一个支撑信号。缺少重排器只会施加小幅质量惩罚，不会把有效的 RRF/BM25 证据人为压到接近零置信度。
    """

    if not documents:
        return {
            "overall": 0.0,
            "relevance": 0.0,
            "query_coverage": 0.0,
            "source_coverage": 0.0,
            "evidence_breadth": 0.0,
            "agreement": 0.0,
            "degraded_penalty": 0.0,
        }

    required = {str(item or "").strip().lower() for item in (required_sources or []) if str(item or "").strip()}
    source_values = {_source(item) for item in documents if _source(item)}
    if required:
        source_coverage = len(required & source_values) / len(required)
    else:
        source_coverage = min(1.0, 0.55 + 0.2 * len(source_values))

    query_tokens = _tokens(query)
    coverage_values: list[float] = []
    relevance_values: list[float] = []
    agreements: list[float] = []
    for position, document in enumerate(documents, start=1):
        metadata = document.get("metadata") or {}
        content_tokens = _tokens(" ".join([
            str(document.get("title") or ""),
            str(document.get("content") or ""),
            str(metadata.get("keywords") or ""),
            str(metadata.get("alarm_code") or ""),
            str(metadata.get("component") or ""),
        ]))
        coverage_values.append(
            1.0 if not query_tokens else min(1.0, len(query_tokens & content_tokens) / max(1, min(5, len(query_tokens))))
        )
        relevance_values.append(_relevance(document, position))
        detail = metadata.get("rrf_detail") or {}
        agreements.append(min(1.0, len(detail) / 2.0) if isinstance(detail, Mapping) else 0.0)

    relevance = max(relevance_values)
    query_coverage = max(coverage_values)
    breadth = min(1.0, len(documents) / 3.0)
    agreement = max(agreements) if agreements else 0.0
    degraded_penalty = 0.05 if degraded else 0.0
    overall = _clamp(
        0.40 * relevance
        + 0.25 * query_coverage
        + 0.20 * source_coverage
        + 0.10 * breadth
        + 0.05 * agreement
        - degraded_penalty
    )
    return {
        "overall": round(overall, 4),
        "relevance": round(relevance, 4),
        "query_coverage": round(query_coverage, 4),
        "source_coverage": round(source_coverage, 4),
        "evidence_breadth": round(breadth, 4),
        "agreement": round(agreement, 4),
        "degraded_penalty": round(degraded_penalty, 4),
    }

