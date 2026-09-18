"""Cross-encoder reranking with ``BAAI/bge-reranker-v2-m3``.

The reranker is a heavy, synchronous, GPU-bound component.  Two consequences are
handled here so that the rest of the service stays simple:

* The model is loaded with :class:`FlagEmbedding.FlagReranker` and the requested
  device is validated against the actual CUDA availability -- asking for
  ``cuda`` on a CPU-only host transparently degrades to CPU instead of crashing.
* :meth:`Reranker.rerank` returns *copies* of the input hits.  The fused list is
  therefore left untouched, which lets :mod:`app.api.pipeline` fall back to the
  pure RRF ordering when reranking times out or fails.

Importing this module never imports ``FlagEmbedding`` eagerly in a way that would
break the service: a missing dependency surfaces when a :class:`Reranker` is
constructed, and :func:`app.reranker.pipeline.get_reranker` turns that into a
``None`` singleton.
"""

from __future__ import annotations

import inspect
from copy import copy
from numbers import Real
from typing import Any

from app.retrieval import Hit

try:  # pragma: no cover - exercised only when the dependency is installed
    from FlagEmbedding import FlagReranker
except (ImportError, ModuleNotFoundError):  # pragma: no cover
    FlagReranker = None  # type: ignore[assignment]

STAGE_RERANK = "rerank"
"""Value written to ``Hit.metadata["stage"]`` for reranked hits."""


def _resolve_device(device: str) -> str:
    """Return a usable device string.

    Args:
        device: Requested device, e.g. ``"cuda"``, ``"cuda:1"`` or ``"cpu"``.

    Returns:
        The requested device when it is usable, otherwise ``"cpu"``.
    """
    if not device.lower().startswith("cuda"):
        return device
    try:
        import torch
    except (ImportError, ModuleNotFoundError):
        return "cpu"
    return device if torch.cuda.is_available() else "cpu"


def _scores_to_list(scores: Any) -> list[float]:
    """Normalise ``FlagReranker.compute_score`` output into a list of floats.

    The upstream API returns a scalar for a single pair, a ``numpy`` array for
    several pairs, and occasionally a 0-d array; all three shapes are accepted.

    Args:
        scores: Raw return value of ``compute_score``.

    Returns:
        One float per scored pair, in input order.
    """
    if isinstance(scores, Real):
        return [float(scores)]

    item = getattr(scores, "item", None)
    if callable(item):
        try:
            return [float(item())]
        except (TypeError, ValueError, RuntimeError):
            # Multi-element arrays raise `ValueError: only length-1 arrays can be
            # converted to Python scalars`, so fall through to iteration.
            pass

    return [float(score) for score in scores]


class Reranker:
    """Thin, synchronous wrapper around ``FlagReranker``.

    The class is deliberately low-level: it performs no device probing, no
    timeout handling and no singleton management -- those live in
    :mod:`app.reranker.pipeline` and :mod:`app.api.pipeline`, which run this
    object inside a worker thread because it blocks.
    """

    def __init__(
        self,
        model_path: str,
        device: str = "cuda",
        batch_size: int = 16,
    ) -> None:
        """Load the reranking model.

        Args:
            model_path: Local path or HuggingFace id of the reranker.
            device: Requested device; falls back to ``"cpu"`` when unavailable.
            batch_size: Batch size used by ``compute_score``.

        Raises:
            ValueError: If ``batch_size`` is not strictly positive.
            RuntimeError: If ``FlagEmbedding`` is missing or the model cannot be
                loaded.
        """
        if batch_size <= 0:
            raise ValueError("batch_size must be greater than 0")

        self.model_path = model_path
        self.device = _resolve_device(device)
        self.batch_size = batch_size

        if FlagReranker is None:
            raise RuntimeError("FlagEmbedding is not installed")

        kwargs: dict[str, Any] = {
            "use_fp16": self.device.lower().startswith("cuda"),
        }
        try:
            parameters = inspect.signature(FlagReranker).parameters
        except (TypeError, ValueError):
            parameters = {}

        # Recent FlagEmbedding releases renamed `device` to `devices`; support
        # both so the service does not depend on a single version.
        if "devices" in parameters:
            kwargs["devices"] = self.device
        elif "device" in parameters:
            kwargs["device"] = self.device

        try:
            self.model = FlagReranker(model_path, **kwargs)
        except Exception as exc:  # noqa: BLE001 - re-raised with context
            raise RuntimeError(
                f"failed to load reranker model from {model_path!r}"
            ) from exc

    def rerank(self, query: str, hits: list[Hit], top_n: int = 5) -> list[Hit]:
        """Score ``hits`` against ``query`` and return the best ``top_n``.

        Args:
            query: User query.
            hits: Candidate hits, typically the RRF output.
            top_n: Number of hits to keep.

        Returns:
            New hit objects sorted by descending relevance score, at most
            ``top_n`` items. ``score`` holds the normalised rerank score,
            ``rank`` the 1-based reranked position and
            ``metadata["rerank_score"]`` / ``metadata["stage"]`` record that the
            score comes from this stage. The input list is not modified.

        Raises:
            RuntimeError: If the model returns a different number of scores than
                it received pairs.
        """
        if not hits or top_n <= 0:
            return []

        pairs = [[query, hit.text] for hit in hits]
        try:
            scores = self.model.compute_score(
                pairs,
                normalize=True,
                batch_size=self.batch_size,
            )
        except TypeError as exc:
            # Older FlagEmbedding builds do not accept `batch_size`.
            if "batch_size" not in str(exc):
                raise
            scores = self.model.compute_score(pairs, normalize=True)

        score_list = _scores_to_list(scores)
        if len(score_list) != len(hits):
            raise RuntimeError(
                "reranker returned "
                f"{len(score_list)} scores for {len(hits)} candidates"
            )

        ranked = sorted(
            zip(hits, score_list),
            key=lambda item: item[1],
            reverse=True,
        )[:top_n]

        reranked_hits: list[Hit] = []
        for rank, (hit, score) in enumerate(ranked, start=1):
            reranked_hit = copy(hit)
            reranked_hit.score = float(score)
            reranked_hit.rank = int(rank)
            metadata: dict[str, Any] = dict(getattr(hit, "metadata", None) or {})
            metadata["rerank_score"] = float(score)
            metadata["stage"] = STAGE_RERANK
            reranked_hit.metadata = metadata
            reranked_hits.append(reranked_hit)

        return reranked_hits
