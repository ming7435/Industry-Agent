"""Reciprocal Rank Fusion (RRF) for heterogeneous retrieval routes.

The Whoosh (BM25) and Milvus (dense) routes produce scores on incomparable
scales, so the two ranked lists are merged by rank instead of by score:

    score(chunk) = sum over routes of 1 / (k + rank(chunk, route))

Each route contributes only its best rank for a given chunk, while a chunk found
by several routes accumulates the contributions -- that is what makes RRF
reward documents that both lexical and semantic retrieval agree on.

The function is pure and side-effect free: it never mutates the incoming hits,
it returns shallow copies enriched with fusion bookkeeping, so the caller can
still inspect the original route lists (used by the degradation paths in
:mod:`app.api.pipeline`).
"""

from __future__ import annotations

from copy import copy
from typing import Any

from app.retrieval import Hit

from config.settings import settings

SOURCE_FUSION = "fusion"
"""``Hit.source`` value used when a chunk was found by more than one route."""

STAGE_FUSION = "fusion"
"""Value written to ``Hit.metadata["stage"]`` for fused hits."""


def _route_name(hit: Hit, route_index: int) -> str:
    """Return the route label a hit belongs to.

    Args:
        hit: Hit produced by a retrieval route.
        route_index: Position of the route in the input list, used as fallback.

    Returns:
        The hit's ``source`` when set, otherwise ``"route_<index>"``.
    """
    source = str(getattr(hit, "source", "") or "").strip()
    return source or f"route_{route_index}"


def _fused_hit(
    hit: Hit,
    score: float,
    source: str,
    rank: int,
    metadata: dict[str, Any],
) -> Hit:
    """Build the fused copy of a hit.

    Args:
        hit: Original hit (never mutated).
        score: Accumulated RRF score.
        source: Route label, or :data:`SOURCE_FUSION` for multi-route chunks.
        rank: 1-based position in the fused result.
        metadata: Metadata of the fused hit.

    Returns:
        A shallow copy of ``hit`` carrying the fusion score, rank and metadata.
    """
    fused_hit = copy(hit)
    fused_hit.score = float(score)
    fused_hit.source = source
    fused_hit.rank = int(rank)
    fused_hit.metadata = metadata
    return fused_hit


def rrf_fusion(
    result_lists: list[list[Hit]],
    k: int | None = None,
    top_m: int | None = None,
) -> list[Hit]:
    """Fuse several ranked result lists with reciprocal rank fusion.

    Args:
        result_lists: Ranked hits per route (``[bm25_hits, dense_hits]``), each
            already sorted by descending relevance. Empty lists are allowed and
            simply contribute nothing.
        k: RRF smoothing constant. ``None`` (default) reads
            ``settings.rrf_k``.
        top_m: Maximum number of fused hits returned. ``None`` (default) reads
            ``settings.fusion_top_m``.

    Returns:
        Fused hits sorted by descending RRF score, at most ``top_m`` items.
        ``score`` holds the RRF score, ``rank`` the 1-based fused position,
        ``source`` is the single route name or ``"fusion"``, and ``metadata``
        carries ``rrf_detail`` (route -> best rank), ``fusion_score`` and
        ``stage``.

    Raises:
        ValueError: If ``k`` is not strictly positive.
    """
    effective_k = settings.rrf_k if k is None else int(k)
    effective_top_m = settings.fusion_top_m if top_m is None else int(top_m)

    if effective_k <= 0:
        raise ValueError("rrf k must be greater than 0")
    if effective_top_m <= 0:
        return []

    scores: dict[str, float] = {}
    routes_by_chunk: dict[str, dict[str, int]] = {}
    hits_by_chunk: dict[str, Hit] = {}

    for route_index, result_list in enumerate(result_lists):
        seen_in_route: set[str] = set()
        for rank, hit in enumerate(result_list, start=1):
            chunk_id = str(getattr(hit, "chunk_id", "") or "").strip()
            if not chunk_id or chunk_id in seen_in_route:
                # A duplicated chunk inside one route only counts at its best
                # rank, otherwise padding a list would inflate its weight.
                continue
            seen_in_route.add(chunk_id)

            route = _route_name(hit, route_index)
            scores[chunk_id] = scores.get(chunk_id, 0.0) + 1.0 / (
                effective_k + rank
            )
            routes_by_chunk.setdefault(chunk_id, {}).setdefault(route, rank)
            hits_by_chunk.setdefault(chunk_id, hit)

    ranked_chunk_ids = sorted(
        scores,
        key=lambda chunk_id: scores[chunk_id],
        reverse=True,
    )[:effective_top_m]

    fused_hits: list[Hit] = []
    for rank, chunk_id in enumerate(ranked_chunk_ids, start=1):
        origin_hit = hits_by_chunk[chunk_id]
        rrf_detail = routes_by_chunk.get(chunk_id, {})
        source = next(iter(rrf_detail)) if len(rrf_detail) == 1 else SOURCE_FUSION
        metadata: dict[str, Any] = dict(getattr(origin_hit, "metadata", None) or {})
        metadata["rrf_detail"] = dict(rrf_detail)
        metadata["fusion_score"] = scores[chunk_id]
        metadata["stage"] = STAGE_FUSION

        fused_hits.append(
            _fused_hit(
                origin_hit,
                score=scores[chunk_id],
                source=source,
                rank=rank,
                metadata=metadata,
            )
        )

    return fused_hits
