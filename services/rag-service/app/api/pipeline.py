"""Online chain orchestration for the industrial-maintenance RAG service.

The chain is a straight line -- retrieve, fuse, rerank, organise, generate -- but
every hop has its own millisecond budget and its own failure mode, and a failure
never takes the whole request down.  This module owns that policy:

===============================================  ==============================
failure                                          outcome
===============================================  ==============================
dense leg timeout                                BM25 only, ``dense_timeout``
BM25 leg timeout                                 dense only, ``bm25_timeout``
both legs failed                                 empty result,
                                                 ``all_retrievers_failed``
rerank timeout / error                           RRF ordering,
                                                 ``rerank_timeout``
reranker not loaded                              skip rerank,
                                                 ``reranker_unavailable``
embedding model unusable                         BM25 only,
                                                 ``embedding_unavailable``
Milvus unusable                                  BM25 only,
                                                 ``milvus_unavailable``
Whoosh unusable                                  dense only,
                                                 ``whoosh_unavailable``
LLM timeout / error                              evidences without answer,
                                                 ``llm_timeout``
whole request past budget                        partial result,
                                                 ``request_timeout``
===============================================  ==============================

Only a completely unusable retrieval layer (neither route constructible) is
escalated to the client as HTTP 503, by :mod:`app.api.routes`.

Concurrency rules enforced here:

* the two retrieval legs run concurrently through :func:`asyncio.gather` with
  ``return_exceptions=True``, so one failing leg cannot cancel the other;
* every blocking call (Whoosh, Milvus, reranker) runs in a worker thread via
  :func:`asyncio.to_thread` and is bounded by :func:`asyncio.wait_for`;
* the DeepSeek call is already asynchronous and is therefore awaited directly,
  never wrapped in another thread.

Note on timeouts: a worker thread cannot be interrupted, so when a leg exceeds
its budget the request continues without it while the thread finishes in the
background.  This is what keeps the tail latency of a request bounded.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from time import perf_counter
from typing import Any, Literal

from loguru import logger

from app.evidence import EvidenceBundle, build_bundle, format_citations
from app.fusion import rrf_fusion
from app.retrieval import Hit

from config.settings import settings

from .models import HitModel, LatencyBreakdown, SearchRequest, SearchResponse

# ---------------------------------------------------------------------------
# Degrade reasons -- the single source of truth for logs and API payloads.
# ---------------------------------------------------------------------------
REASON_DENSE_TIMEOUT: str = "dense_timeout"
REASON_BM25_TIMEOUT: str = "bm25_timeout"
REASON_ALL_RETRIEVERS_FAILED: str = "all_retrievers_failed"
REASON_RERANK_TIMEOUT: str = "rerank_timeout"
REASON_RERANKER_UNAVAILABLE: str = "reranker_unavailable"
REASON_EMBEDDING_UNAVAILABLE: str = "embedding_unavailable"
REASON_MILVUS_UNAVAILABLE: str = "milvus_unavailable"
REASON_WHOOSH_UNAVAILABLE: str = "whoosh_unavailable"
REASON_LLM_TIMEOUT: str = "llm_timeout"
REASON_REQUEST_TIMEOUT: str = "request_timeout"

_REASON_PRIORITY: tuple[str, ...] = (
    REASON_REQUEST_TIMEOUT,
    REASON_ALL_RETRIEVERS_FAILED,
    REASON_DENSE_TIMEOUT,
    REASON_BM25_TIMEOUT,
    REASON_EMBEDDING_UNAVAILABLE,
    REASON_MILVUS_UNAVAILABLE,
    REASON_WHOOSH_UNAVAILABLE,
    REASON_RERANK_TIMEOUT,
    REASON_RERANKER_UNAVAILABLE,
    REASON_LLM_TIMEOUT,
)
"""Severity order used to pick a single ``degrade_reason`` when several occurred."""

_STAGE_BM25: Literal["bm25"] = "bm25"
_STAGE_DENSE: Literal["dense"] = "dense"

_EMBEDDING_HINTS: tuple[str, ...] = (
    "app.embedding",
    "siliconflow embedding",
    "embedding",
)
_MILVUS_HINTS: tuple[str, ...] = ("pymilvus", "milvus", "grpc")
_WHOOSH_HINTS: tuple[str, ...] = ("whoosh",)


class RouteUnavailable(RuntimeError):
    """Raised by a retrieval route that cannot serve the request.

    Carries the degradation reason so the orchestrator does not have to guess why
    a leg produced nothing.
    """

    def __init__(self, degrade_reason: str, detail: str = "") -> None:
        """Store the reason and build the exception message.

        Args:
            degrade_reason: One of the ``REASON_*`` constants.
            detail: Optional human-readable explanation for the logs.
        """
        super().__init__(f"{degrade_reason}: {detail}" if detail else degrade_reason)
        self.degrade_reason = degrade_reason


def _now() -> float:
    """Return a monotonic timestamp in seconds.

    Returns:
        The current value of a high-resolution monotonic clock.
    """
    return perf_counter()


def _elapsed_ms(started: float) -> int:
    """Return the milliseconds elapsed since ``started``.

    Args:
        started: Value previously returned by :func:`_now`.

    Returns:
        Elapsed milliseconds, rounded to the nearest integer.
    """
    return int(round((perf_counter() - started) * 1000))


def _classify_route_error(exc: BaseException, default: str) -> str:
    """Map a retrieval exception to a degradation reason.

    The retrievers wrap their own dependencies, so the exception type/module and
    message are inspected to tell an embedding failure from a Milvus failure from
    a Whoosh failure.

    Args:
        exc: Exception raised by a retrieval leg.
        default: Reason used when no hint matches (e.g.
            ``whoosh_unavailable`` for the BM25 leg).

    Returns:
        One of the ``REASON_*`` constants.
    """
    haystack = f"{type(exc).__module__ or ''} {exc}".lower()
    if any(hint in haystack for hint in _EMBEDDING_HINTS):
        return REASON_EMBEDDING_UNAVAILABLE
    if any(hint in haystack for hint in _MILVUS_HINTS):
        return REASON_MILVUS_UNAVAILABLE
    if any(hint in haystack for hint in _WHOOSH_HINTS):
        return REASON_WHOOSH_UNAVAILABLE
    return default


@dataclass
class _Progress:
    """Mutable scratch pad shared by the stages of one request.

    It exists so that a request aborted by the global budget can still be
    answered with whatever the chain had already produced.
    """

    request_id: str
    bm25_hits: list[Hit] = field(default_factory=list)
    dense_hits: list[Hit] = field(default_factory=list)
    fused_hits: list[Hit] = field(default_factory=list)
    final_hits: list[Hit] = field(default_factory=list)
    bundle: EvidenceBundle | None = None
    evidence_text: str = ""
    answer: str = ""
    latency: dict[str, int] = field(
        default_factory=lambda: {
            "bm25": 0,
            "dense": 0,
            "fusion": 0,
            "rerank": 0,
            "llm": 0,
            "total": 0,
        }
    )
    reasons: list[str] = field(default_factory=list)

    def mark_degraded(self, reason: str) -> None:
        """Record a degradation reason, once, in discovery order.

        Args:
            reason: One of the ``REASON_*`` constants.
        """
        if reason and reason not in self.reasons:
            self.reasons.append(reason)

    def clear_degraded(self) -> None:
        """Forget previously recorded reasons.

        Used when a later finding supersedes earlier ones, e.g. both legs failed
        individually but the outcome is the single ``all_retrievers_failed``.
        """
        self.reasons.clear()

    @property
    def degraded(self) -> bool:
        """Whether the request is being served in degraded mode.

        Returns:
            ``True`` when at least one degradation was recorded.
        """
        return bool(self.reasons)

    @property
    def degrade_reason(self) -> str:
        """Return the most informative degradation reason.

        The global ``request_timeout`` wins over everything else; otherwise the
        most severe reason of :data:`_REASON_PRIORITY` is returned, falling back
        to the first recorded one.

        Returns:
            The selected reason, or an empty string when nothing degraded.
        """
        for reason in _REASON_PRIORITY:
            if reason in self.reasons:
                return reason
        return self.reasons[0] if self.reasons else ""


def _to_hit_model(hit: Hit) -> HitModel:
    """Convert a retriever hit into its API representation.

    Args:
        hit: Final ranked hit.

    Returns:
        The pydantic model returned inside ``SearchResponse.hits``.
    """
    metadata = getattr(hit, "metadata", None)
    return HitModel(
        chunk_id=str(getattr(hit, "chunk_id", "")),
        text=str(getattr(hit, "text", "")),
        score=float(getattr(hit, "score", 0.0) or 0.0),
        source=str(getattr(hit, "source", "") or ""),
        metadata=dict(metadata) if isinstance(metadata, dict) else {},
    )


class SearchPipeline:
    """Orchestrates retrieve -> fuse -> rerank -> evidence -> generate.

    The pipeline holds already-resolved (possibly ``None``) components: a missing
    or failed component degrades the request instead of raising, which is what
    allows the service to boot and serve partial answers when, for example, CUDA
    is unavailable or the Milvus collection is still being built.
    """

    def __init__(
        self,
        bm25: Any | None,
        dense: Any | None,
        embedder: Any | None,
        reranker: Any | None,
        llm: Any | None,
    ) -> None:
        """Store the resolved components.

        Args:
            bm25: ``app.whoosh.retriever.BM25Retriever`` instance or ``None``.
            dense: ``app.milvus.retriever.DenseRetriever`` instance or ``None``.
            embedder: bge-m3 embedder used by the dense route, or ``None``.
            reranker: ``app.reranker.model.Reranker`` instance or ``None``.
            llm: ``app.llm.client.LLMClient`` instance or ``None``.
        """
        self._bm25 = bm25
        self._dense = dense
        self._embedder = embedder
        self._reranker = reranker
        self._llm = llm

    @property
    def has_any_retriever(self) -> bool:
        """Whether at least one retrieval route is usable.

        Returns:
            ``True`` when the BM25 or the dense retriever is available. When both
            are missing the caller must answer HTTP 503.
        """
        return self._bm25 is not None or self._dense is not None

    def _effective_top_n(self, request: SearchRequest) -> int:
        """Resolve the number of evidences to return.

        Args:
            request: Validated request; ``top_n`` is already constrained to
                ``>= 1`` for HTTP callers, the fallback protects programmatic
                callers that bypass validation.

        Returns:
            ``request.top_n`` when positive, otherwise ``settings.rerank_top_n``.
        """
        if request.top_n and request.top_n > 0:
            return int(request.top_n)
        return int(settings.rerank_top_n)

    async def search(self, request: SearchRequest, request_id: str) -> SearchResponse:
        """Run the full online chain for one request.

        Args:
            request: Validated search request.
            request_id: UUID4 identifying this request in every log line.

        Returns:
            The complete response, degraded or not. Never raises for a
            dependency failure: partial results are returned with
            ``degraded=True`` and a ``degrade_reason``.
        """
        progress = _Progress(request_id=request_id)
        started = _now()
        request_budget_s = settings.request_timeout_ms / 1000

        try:
            await asyncio.wait_for(
                self._run(request, progress),
                timeout=request_budget_s,
            )
        except TimeoutError:
            progress.mark_degraded(REASON_REQUEST_TIMEOUT)
            logger.warning(
                "request_id={} degraded reason={} request_timeout_ms={}",
                request_id,
                REASON_REQUEST_TIMEOUT,
                settings.request_timeout_ms,
            )
        except asyncio.CancelledError:
            # Client disconnected or the server is shutting down: propagate.
            raise
        except Exception as exc:  # noqa: BLE001 - orchestrator must never 500
            # A bug in the orchestration itself. Log the traceback and answer
            # with whatever was produced so the caller still gets the evidences.
            logger.exception(
                "request_id={} stage=orchestration error_type={} error={}",
                request_id,
                type(exc).__name__,
                exc,
            )
            progress.mark_degraded(REASON_ALL_RETRIEVERS_FAILED)

        progress.latency["total"] = _elapsed_ms(started)
        response = self._build_response(request, progress)

        logger.info(
            "request_id={} bm25_ms={} dense_ms={} fusion_ms={} rerank_ms={} "
            "llm_ms={} total_ms={} hits={} answer_chars={} degraded={} reason={}",
            request_id,
            response.latency_ms.bm25,
            response.latency_ms.dense,
            response.latency_ms.fusion,
            response.latency_ms.rerank,
            response.latency_ms.llm,
            response.latency_ms.total,
            len(response.hits),
            len(response.answer),
            response.degraded,
            response.degrade_reason or "-",
        )
        return response

    async def _run(self, request: SearchRequest, progress: _Progress) -> None:
        """Execute the chain stages in order, recording degradation as it goes.

        Args:
            request: Validated search request.
            progress: Shared scratch pad, written stage by stage.
        """
        await self._retrieve(request, progress)

        if not progress.bm25_hits and not progress.dense_hits:
            # Both legs failed: nothing to fuse, rerank or generate from.
            progress.clear_degraded()
            progress.mark_degraded(REASON_ALL_RETRIEVERS_FAILED)
            logger.warning(
                "request_id={} stage=retrieval degraded reason={}",
                progress.request_id,
                REASON_ALL_RETRIEVERS_FAILED,
            )
            return

        self._fuse(progress)
        if not progress.fused_hits:
            progress.mark_degraded(REASON_ALL_RETRIEVERS_FAILED)
            return

        top_n = self._effective_top_n(request)
        progress.final_hits = await self._rerank(request, progress.fused_hits, top_n, progress)

        if not self._build_evidence(request, progress):
            return

        await self._generate(request, progress)

    async def _retrieve(self, request: SearchRequest, progress: _Progress) -> None:
        """Run both retrieval legs concurrently.

        Each leg publishes its hits into ``progress`` as soon as it finishes, so a
        leg that completed before the global budget expired is still part of the
        partial answer (``request_timeout`` degradation).

        Args:
            request: Validated search request.
            progress: Scratch pad receiving the hits and leg latencies.
        """
        outcomes = await asyncio.gather(
            self._bm25_route(request, progress),
            self._dense_route(request, progress),
            return_exceptions=True,
        )

        for stage, outcome in zip((_STAGE_BM25, _STAGE_DENSE), outcomes):
            if not isinstance(outcome, BaseException):
                continue
            reason = getattr(outcome, "degrade_reason", "") or _classify_route_error(
                outcome,
                REASON_WHOOSH_UNAVAILABLE if stage == _STAGE_BM25 else REASON_MILVUS_UNAVAILABLE,
            )
            progress.mark_degraded(reason)
            logger.warning(
                "request_id={} stage={} degraded reason={} error={!r}",
                progress.request_id,
                stage,
                reason,
                outcome,
            )

        logger.info(
            "request_id={} stage=retrieval bm25_ms={} dense_ms={} "
            "bm25_hits={} dense_hits={}",
            progress.request_id,
            progress.latency[_STAGE_BM25],
            progress.latency[_STAGE_DENSE],
            len(progress.bm25_hits),
            len(progress.dense_hits),
        )

    async def _bm25_route(self, request: SearchRequest, progress: _Progress) -> None:
        """Execute the Whoosh/BM25 leg and publish its hits.

        Args:
            request: Validated search request.
            progress: Scratch pad receiving the leg latency and hits.

        Raises:
            RouteUnavailable: If the retriever is missing, times out or fails.
        """
        if self._bm25 is None:
            raise RouteUnavailable(REASON_WHOOSH_UNAVAILABLE, "whoosh retriever is not available")
        hits = await self._search_with_budget(
            stage=_STAGE_BM25,
            retriever=self._bm25,
            fallback_reason=REASON_WHOOSH_UNAVAILABLE,
            query=request.query,
            filters=request.filters,
            top_k=settings.bm25_top_k,
            timeout_ms=settings.bm25_timeout_ms,
            progress=progress,
        )
        progress.bm25_hits = list(hits)

    async def _dense_route(self, request: SearchRequest, progress: _Progress) -> None:
        """Execute the Milvus/dense leg and publish its hits.

        The embedding model is a hard precondition: without it the dense route
        cannot even build a query vector, so it is reported as
        ``embedding_unavailable`` rather than ``milvus_unavailable``.

        Args:
            request: Validated search request.
            progress: Scratch pad receiving the leg latency and hits.

        Raises:
            RouteUnavailable: If a dependency is missing, times out or fails.
        """
        if self._dense is None:
            raise RouteUnavailable(REASON_MILVUS_UNAVAILABLE, "milvus retriever is not available")
        if self._embedder is None:
            raise RouteUnavailable(
                REASON_EMBEDDING_UNAVAILABLE,
                "embedding model is not available for the dense route",
            )
        hits = await self._search_with_budget(
            stage=_STAGE_DENSE,
            retriever=self._dense,
            fallback_reason=REASON_MILVUS_UNAVAILABLE,
            query=request.query,
            filters=request.filters,
            top_k=settings.dense_top_k,
            timeout_ms=settings.dense_timeout_ms,
            progress=progress,
        )
        progress.dense_hits = list(hits)

    async def _search_with_budget(
        self,
        stage: str,
        retriever: Any,
        fallback_reason: str,
        query: str,
        filters: dict[str, Any],
        top_k: int,
        timeout_ms: int,
        progress: _Progress,
    ) -> list[Hit]:
        """Call a synchronous retriever in a worker thread under a budget.

        Args:
            stage: ``"bm25"`` or ``"dense"``, used as latency key and log label.
            retriever: Object exposing ``search(query, filters, top_k)``.
            fallback_reason: Reason used when the failure cannot be classified.
            query: User query.
            filters: Metadata filters forwarded to the retriever.
            top_k: Number of candidates requested.
            timeout_ms: Leg budget in milliseconds.
            progress: Scratch pad receiving the leg latency.

        Returns:
            The hits returned by the retriever.

        Raises:
            RouteUnavailable: On timeout (``<stage>_timeout``) or failure.
        """
        started = _now()
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(retriever.search, query, filters, top_k),
                timeout=timeout_ms / 1000,
            )
        except TimeoutError as exc:
            raise RouteUnavailable(
                f"{stage}_timeout",
                f"{stage} retrieval exceeded {timeout_ms}ms",
            ) from exc
        except RouteUnavailable:
            raise
        except Exception as exc:  # noqa: BLE001 - classified into a degrade reason
            raise RouteUnavailable(
                _classify_route_error(exc, fallback_reason),
                f"{stage} retrieval failed with {type(exc).__name__}",
            ) from exc
        finally:
            progress.latency[stage] = _elapsed_ms(started)

    def _fuse(self, progress: _Progress) -> None:
        """Fuse both leg results with RRF.

        Both lists are always passed, even when one leg failed, so the fused
        ordering stays comparable across requests.

        Args:
            progress: Scratch pad read for the legs and written with the fused
                hits and the fusion latency.
        """
        started = _now()
        try:
            progress.fused_hits = rrf_fusion(
                [progress.bm25_hits, progress.dense_hits],
                k=settings.rrf_k,
                top_m=settings.fusion_top_m,
            )
        except (ValueError, TypeError) as exc:
            logger.error(
                "request_id={} stage=fusion error_type={} error={}",
                progress.request_id,
                type(exc).__name__,
                exc,
            )
            progress.fused_hits = []
        finally:
            progress.latency["fusion"] = _elapsed_ms(started)

        logger.info(
            "request_id={} stage=fusion fusion_ms={} fused_hits={}",
            progress.request_id,
            progress.latency["fusion"],
            len(progress.fused_hits),
        )

    async def _rerank(
        self,
        request: SearchRequest,
        fused_hits: list[Hit],
        top_n: int,
        progress: _Progress,
    ) -> list[Hit]:
        """Rerank the fused hits, falling back to the RRF ordering on failure.

        Args:
            request: Validated search request.
            fused_hits: RRF output.
            top_n: Number of hits to keep.
            progress: Scratch pad receiving the rerank latency and reasons.

        Returns:
            Reranked hits, or the top ``top_n`` fused hits when reranking is
            unavailable, times out or raises.
        """
        if self._reranker is None:
            progress.mark_degraded(REASON_RERANKER_UNAVAILABLE)
            logger.warning(
                "request_id={} stage=rerank degraded reason={}",
                progress.request_id,
                REASON_RERANKER_UNAVAILABLE,
            )
            return fused_hits[:top_n]

        started = _now()
        try:
            reranked = await asyncio.wait_for(
                asyncio.to_thread(self._reranker.rerank, request.query, fused_hits, top_n),
                timeout=settings.rerank_timeout_ms / 1000,
            )
        except TimeoutError:
            progress.mark_degraded(REASON_RERANK_TIMEOUT)
            logger.warning(
                "request_id={} stage=rerank degraded reason={} rerank_timeout_ms={}",
                progress.request_id,
                REASON_RERANK_TIMEOUT,
                settings.rerank_timeout_ms,
            )
            return fused_hits[:top_n]
        except Exception as exc:  # noqa: BLE001 - any rerank failure degrades
            progress.mark_degraded(REASON_RERANK_TIMEOUT)
            logger.warning(
                "request_id={} stage=rerank degraded reason={} error_type={} error={!r}",
                progress.request_id,
                REASON_RERANK_TIMEOUT,
                type(exc).__name__,
                exc,
            )
            return fused_hits[:top_n]
        else:
            logger.info(
                "request_id={} stage=rerank rerank_ms={} reranked_hits={}",
                progress.request_id,
                progress.latency["rerank"],
                len(reranked),
            )
            return list(reranked)
        finally:
            progress.latency["rerank"] = _elapsed_ms(started)

    def _build_evidence(self, request: SearchRequest, progress: _Progress) -> bool:
        """Organise the final hits into a citation-formatted evidence block.

        Args:
            request: Validated search request.
            progress: Scratch pad read for the final hits and written with the
                bundle and the evidence text.

        Returns:
            ``True`` when a non-empty context was produced, i.e. when generation
            is worth attempting.
        """
        try:
            bundle = build_bundle(request.query, progress.final_hits)
            evidence_text = format_citations(bundle)
        except (AttributeError, TypeError, ValueError) as exc:
            logger.warning(
                "request_id={} stage=evidence error_type={} error={!r}",
                progress.request_id,
                type(exc).__name__,
                exc,
            )
            progress.bundle = None
            progress.evidence_text = ""
            return False

        progress.bundle = bundle
        progress.evidence_text = evidence_text
        return bool(evidence_text.strip())

    async def _generate(self, request: SearchRequest, progress: _Progress) -> None:
        """Generate the diagnostic answer from the evidence context.

        A generation failure leaves ``answer`` empty and marks ``llm_timeout``,
        so the caller still receives the retrieved evidences.

        Args:
            request: Validated search request.
            progress: Scratch pad read for the evidence and written with the
                answer and the generation latency.
        """
        if self._llm is None:
            progress.mark_degraded(REASON_LLM_TIMEOUT)
            logger.warning(
                "request_id={} stage=llm degraded reason={}",
                progress.request_id,
                REASON_LLM_TIMEOUT,
            )
            return

        started = _now()
        try:
            progress.answer = await asyncio.wait_for(
                self._llm.generate(request.query, progress.evidence_text),
                timeout=settings.llm_timeout_ms / 1000,
            )
        except TimeoutError:
            progress.mark_degraded(REASON_LLM_TIMEOUT)
            logger.warning(
                "request_id={} stage=llm degraded reason={} llm_timeout_ms={}",
                progress.request_id,
                REASON_LLM_TIMEOUT,
                settings.llm_timeout_ms,
            )
        except Exception as exc:  # noqa: BLE001 - any generation failure degrades
            progress.mark_degraded(REASON_LLM_TIMEOUT)
            logger.warning(
                "request_id={} stage=llm degraded reason={} error_type={} error={!r}",
                progress.request_id,
                REASON_LLM_TIMEOUT,
                type(exc).__name__,
                exc,
            )
        else:
            logger.info(
                "request_id={} stage=llm llm_ms={} answer_chars={}",
                progress.request_id,
                progress.latency["llm"],
                len(progress.answer),
            )
        finally:
            progress.latency["llm"] = _elapsed_ms(started)

    def _partial_hits(self, progress: _Progress, top_n: int) -> list[Hit]:
        """Return the best hit list available when the chain did not finish.

        Reached when the global budget expired before fusion -- the legs that had
        already answered still deserve to be shown to the caller.

        Args:
            progress: Scratch pad holding the per-leg results.
            top_n: Maximum number of hits to return.

        Returns:
            The BM25 hits followed by the dense-only hits, de-duplicated by
            ``chunk_id``. The ordering is the raw retrieval order, not a fused
            one, because fusion never ran.
        """
        partial: list[Hit] = []
        seen: set[str] = set()
        for hit in (*progress.bm25_hits, *progress.dense_hits):
            chunk_id = str(getattr(hit, "chunk_id", ""))
            if chunk_id in seen:
                continue
            seen.add(chunk_id)
            partial.append(hit)
        return partial[:top_n]

    def _build_response(self, request: SearchRequest, progress: _Progress) -> SearchResponse:
        """Assemble the API response from whatever the chain produced.

        Args:
            request: Validated search request, used for the ``top_n`` fallback.
            progress: Scratch pad holding hits, evidence, answer and degradations.

        Returns:
            The response returned to the caller. When the request was aborted
            mid-chain the best available hit list is used, in this order:
            reranked hits, fused hits, raw per-leg hits.
        """
        top_n = self._effective_top_n(request)
        hits = progress.final_hits or progress.fused_hits[:top_n] or self._partial_hits(
            progress, top_n
        )

        if progress.bundle is not None:
            progress.bundle.degraded = progress.degraded
            progress.bundle.degrade_reason = progress.degrade_reason

        return SearchResponse(
            request_id=progress.request_id,
            hits=[_to_hit_model(hit) for hit in hits],
            evidence_text=progress.evidence_text,
            answer=progress.answer,
            degraded=progress.degraded,
            degrade_reason=progress.degrade_reason,
            latency_ms=LatencyBreakdown(**progress.latency),
        )
