"""工业维修 RAG 服务的在线链路编排。

链路是一条直线：检索、融合、重排、整理、生成；但每一跳都有独立的毫秒级预算和失败模式，
单点失败不会拖垮整个请求。本模块集中维护这套策略：

===============================================  ==============================
失败                                             结果
===============================================  ==============================
稠密路线超时                                     仅 BM25，``dense_timeout``
BM25 路线超时                                    仅稠密，``bm25_timeout``
两条路线都失败                                   空结果，``all_retrievers_failed``
重排超时或错误                                   RRF 顺序，``rerank_timeout``
重排器未加载                                     跳过重排，``reranker_unavailable``
嵌入模型不可用                                   仅 BM25，``embedding_unavailable``
Milvus 不可用                                    仅 BM25，``milvus_unavailable``
Whoosh 不可用                                    仅稠密，``whoosh_unavailable``
LLM 超时或错误                                   有证据但无答案，``llm_timeout``
整体请求超过预算                                 部分结果，``request_timeout``
===============================================  ==============================

只有检索层完全不可用（两条路线都无法构建）时，:mod:`app.api.routes` 才会向客户端升级为 HTTP 503。

这里强制执行的并发规则：

* 两条检索路线通过 :func:`asyncio.gather` 并发运行，并启用 ``return_exceptions=True``，
  因此一条路线失败不会取消另一条路线；
* 所有阻塞调用（Whoosh、Milvus、reranker）都通过 :func:`asyncio.to_thread` 在线程池中运行，
  并受 :func:`asyncio.wait_for` 约束；
* DeepSeek 调用本身已经是异步的，因此直接 await，不再包裹到额外线程中。

关于超时：工作线程无法被中断，因此某条路线超过预算后，请求会跳过它继续执行，线程则在后台完成。
这保证了请求尾延迟可控。
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
# 降级原因：日志和 API 负载共用的唯一事实来源。
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
"""多个原因同时出现时，用于选择单一 ``degrade_reason`` 的严重度顺序。"""

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
    """检索路线无法服务当前请求时抛出。

    携带降级原因，避免编排器猜测某条路线为什么没有产出。
    """

    def __init__(self, degrade_reason: str, detail: str = "") -> None:
        """保存原因并构造异常消息。

        Args:
            degrade_reason: ``REASON_*`` 常量之一。
            detail: 可选的日志可读说明。
        """
        super().__init__(f"{degrade_reason}: {detail}" if detail else degrade_reason)
        self.degrade_reason = degrade_reason


def _now() -> float:
    """返回以秒为单位的单调时间戳。

    Returns:
        高精度单调时钟的当前值。
    """
    return perf_counter()


def _elapsed_ms(started: float) -> int:
    """返回从 ``started`` 到现在经过的毫秒数。

    Args:
        started: 之前由 :func:`_now` 返回的值。

    Returns:
        四舍五入后的经过毫秒数。
    """
    return int(round((perf_counter() - started) * 1000))


def _classify_route_error(exc: BaseException, default: str) -> str:
    """把检索异常映射为降级原因。

    检索器会包装自身依赖，因此这里检查异常类型/模块和消息，用于区分嵌入、Milvus、Whoosh 失败。

    Args:
        exc: 检索路线抛出的异常。
        default: 没有命中任何提示时使用的原因，例如 BM25 路线的 ``whoosh_unavailable``。

    Returns:
        ``REASON_*`` 常量之一。
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
    """单次请求各阶段共享的可变暂存区。

    独立成对象后，即使请求因全局预算中断，也能用链路已经产出的内容返回答案。
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
        """按发现顺序记录一次降级原因。

        Args:
            reason: ``REASON_*`` 常量之一。
        """
        if reason and reason not in self.reasons:
            self.reasons.append(reason)

    def clear_degraded(self) -> None:
        """清空之前记录的降级原因。

        当后续发现取代早先原因时使用，例如两条路线分别失败，但最终结果应统一为
        ``all_retrievers_failed``。
        """
        self.reasons.clear()

    @property
    def degraded(self) -> bool:
        """当前请求是否以降级模式服务。

        Returns:
            至少记录了一个降级原因时返回 ``True``。
        """
        return bool(self.reasons)

    @property
    def degrade_reason(self) -> str:
        """返回信息量最高的降级原因。

        全局 ``request_timeout`` 优先于其他所有原因；否则返回 :data:`_REASON_PRIORITY` 中最严重的原因，
        找不到时回退到第一个记录的原因。

        Returns:
            选中的原因；未发生降级时返回空字符串。
        """
        for reason in _REASON_PRIORITY:
            if reason in self.reasons:
                return reason
        return self.reasons[0] if self.reasons else ""


def _to_hit_model(hit: Hit) -> HitModel:
    """把检索命中转换为 API 表示。

    Args:
        hit: 最终排序后的命中。

    Returns:
        ``SearchResponse.hits`` 中返回的 pydantic 模型。
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
    """编排检索、融合、重排、证据整理和生成。

    流水线持有已经解析好的组件（组件也可能为 ``None``）：组件缺失或失败时让请求降级，
    而不是直接抛出异常。这允许服务在 CUDA 不可用、Milvus 集合仍在构建等场景下仍能启动，
    并返回部分答案。
    """

    def __init__(
        self,
        bm25: Any | None,
        dense: Any | None,
        embedder: Any | None,
        reranker: Any | None,
        llm: Any | None,
    ) -> None:
        """保存已解析组件。

        Args:
            bm25: ``app.whoosh.retriever.BM25Retriever`` 实例或 ``None``。
            dense: ``app.milvus.retriever.DenseRetriever`` 实例或 ``None``。
            embedder: 稠密路线使用的 bge-m3 嵌入器，或 ``None``。
            reranker: ``app.reranker.model.Reranker`` 实例或 ``None``。
            llm: ``app.llm.client.LLMClient`` 实例或 ``None``。
        """
        self._bm25 = bm25
        self._dense = dense
        self._embedder = embedder
        self._reranker = reranker
        self._llm = llm

    @property
    def has_any_retriever(self) -> bool:
        """是否至少有一条检索路线可用。

        Returns:
            BM25 或稠密检索器可用时返回 ``True``。两者都缺失时，调用方必须返回 HTTP 503。
        """
        return self._bm25 is not None or self._dense is not None

    def _effective_top_n(self, request: SearchRequest) -> int:
        """解析要返回的证据数量。

        Args:
            request: 已校验请求；HTTP 调用方的 ``top_n`` 已被约束为 ``>= 1``，这里的回退用于保护绕过校验的程序调用方。

        Returns:
            ``request.top_n`` 为正数时返回它，否则返回 ``settings.rerank_top_n``。
        """
        if request.top_n and request.top_n > 0:
            return int(request.top_n)
        return int(settings.rerank_top_n)

    async def search(self, request: SearchRequest, request_id: str) -> SearchResponse:
        """为单次请求运行完整在线链路。

        Args:
            request: 已校验的搜索请求。
            request_id: UUID4，用于标识本请求的所有日志行。

        Returns:
            完整响应，无论是否降级。依赖失败不会向外抛出：部分结果会以 ``degraded=True`` 和
            ``degrade_reason`` 返回。
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
            # 客户端断开连接或服务正在关闭：继续向外传播。
            raise
        except Exception as exc:  # noqa: BLE001 - 编排器不能返回 500。
            # 编排自身的缺陷。记录 traceback，并用已经产出的内容作答，让调用方仍能拿到证据。
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
        """按顺序执行链路阶段，并沿途记录降级情况。

        Args:
            request: 已校验的搜索请求。
            progress: 共享暂存区，按阶段写入。
        """
        await self._retrieve(request, progress)

        if not progress.bm25_hits and not progress.dense_hits:
            # 两条路线都失败：没有可融合、重排或生成的内容。
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
        """并发运行两条检索路线。

        每条路线一完成就把命中写入 ``progress``，因此在全局预算到期前完成的路线仍会进入部分答案
        （``request_timeout`` 降级）。

        Args:
            request: 已校验的搜索请求。
            progress: 接收命中和路线延迟的暂存区。
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
        """执行 Whoosh/BM25 路线并发布命中。

        Args:
            request: 已校验的搜索请求。
            progress: 接收路线延迟和命中的暂存区。

        Raises:
            RouteUnavailable: 检索器缺失、超时或失败时抛出。
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
        """执行 Milvus/稠密路线并发布命中。

        嵌入模型是硬性前置条件：没有它，稠密路线甚至无法构造查询向量，因此报告为
        ``embedding_unavailable``，而不是 ``milvus_unavailable``。

        Args:
            request: 已校验的搜索请求。
            progress: 接收路线延迟和命中的暂存区。

        Raises:
            RouteUnavailable: 依赖缺失、超时或失败时抛出。
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
        """在线程池中按预算调用同步检索器。

        Args:
            stage: ``"bm25"`` 或 ``"dense"``，用作延迟键和日志标签。
            retriever: 暴露 ``search(query, filters, top_k)`` 的对象。
            fallback_reason: 无法分类失败时使用的原因。
            query: 用户查询。
            filters: 转发给检索器的元数据过滤条件。
            top_k: 请求的候选数量。
            timeout_ms: 路线预算，单位为毫秒。
            progress: 接收路线延迟的暂存区。

        Returns:
            检索器返回的命中列表。

        Raises:
            RouteUnavailable: 超时（``<stage>_timeout``）或失败时抛出。
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
        except Exception as exc:  # noqa: BLE001 - 会被分类为降级原因
            raise RouteUnavailable(
                _classify_route_error(exc, fallback_reason),
                f"{stage} retrieval failed with {type(exc).__name__}",
            ) from exc
        finally:
            progress.latency[stage] = _elapsed_ms(started)

    def _fuse(self, progress: _Progress) -> None:
        """使用 RRF 融合两条路线的结果。

        即使某条路线失败，也始终传入两个列表，确保不同请求之间的融合排序保持可比。

        Args:
            progress: 读取两条路线结果，并写入融合命中和融合延迟的暂存区。
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
        """重排融合命中，失败时回退到 RRF 顺序。

        Args:
            request: 已校验的搜索请求。
            fused_hits: RRF 输出。
            top_n: 保留的命中数量。
            progress: 接收重排延迟和原因的暂存区。

        Returns:
            重排后的命中；重排不可用、超时或抛错时返回融合命中的前 ``top_n`` 项。
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
        except Exception as exc:  # noqa: BLE001 - 任何重排失败都降级
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
        """把最终命中整理为带引用格式的证据块。

        Args:
            request: 已校验的搜索请求。
            progress: 读取最终命中，并写入证据包和证据文本的暂存区。

        Returns:
            产出非空上下文、值得继续生成时返回 ``True``。
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
        """根据证据上下文生成诊断答案。

        生成失败会让 ``answer`` 保持为空并标记 ``llm_timeout``，因此调用方仍能收到已检索证据。

        Args:
            request: 已校验的搜索请求。
            progress: 读取证据，并写入答案和生成延迟的暂存区。
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
        except Exception as exc:  # noqa: BLE001 - 任何生成失败都降级
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
        """链路未完成时返回当前可用的最佳命中列表。

        当全局预算在融合之前到期时会走到这里；已经返回的路线结果仍应展示给调用方。

        Args:
            progress: 保存各路线结果的暂存区。
            top_n: 最多返回的命中数量。

        Returns:
            BM25 命中后接仅稠密命中的列表，并按 ``chunk_id`` 去重。由于融合尚未运行，排序使用原始检索顺序，
            而不是融合顺序。
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
        """用链路已经产出的内容装配 API 响应。

        Args:
            request: 已校验的搜索请求，用于 ``top_n`` 回退。
            progress: 保存命中、证据、答案和降级原因的暂存区。

        Returns:
            返回给调用方的响应。请求在链路中途被中断时，使用当前最佳命中列表，优先级依次为：
            重排命中、融合命中、原始各路线命中。
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
