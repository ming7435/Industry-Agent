"""Evidence-quality confidence scoring for Knowledge Agent.

Retrieval scores are not comparable across BM25, dense, RRF and reranker
stages.  This module deliberately scores the *evidence pack* instead of
passing one backend score through as a user-facing confidence value.
"""

from __future__ import annotations

import re
from typing import Any, Mapping


_TOKEN_RE = re.compile(r"[a-z0-9][a-z0-9._/-]*|[\u4e00-\u9fff]{2,}", re.IGNORECASE)


def _tokens(value: Any) -> set[str]:
    text = str(value or "").lower()
    tokens = set(_TOKEN_RE.findall(text))
    # Chinese queries are often short phrases.  Character bigrams preserve
    # useful partial matches without requiring a third-party tokenizer.
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
        # RRF scores are rank signals, not probabilities.  Convert rank and
        # route agreement into a stable relevance estimate.
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
    """Return an explainable confidence score for a retrieved evidence pack.

    The result is intentionally conservative: a high score requires relevant
    content, source coverage and more than one supporting signal.  A missing
    reranker applies a small quality penalty, but does not turn valid RRF/BM25
    evidence into an artificially near-zero confidence.
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

