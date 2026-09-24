"""Reranking through SiliconFlow's BGE reranker API."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from copy import copy
from typing import Any

from app.retrieval import Hit
from config.settings import settings

STAGE_RERANK = "rerank"
"""Value written to ``Hit.metadata["stage"]`` for reranked hits."""


def _copy_reranked_hits(hits: list[Hit], scores: list[float], top_n: int) -> list[Hit]:
    if len(scores) != len(hits):
        raise RuntimeError(f"reranker returned {len(scores)} scores for {len(hits)} candidates")

    ranked = sorted(
        zip(hits, scores),
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


class SiliconFlowReranker:
    """Rerank candidates through SiliconFlow's rerank API."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        batch_size: int = 16,
        timeout_s: float = 30.0,
    ) -> None:
        if batch_size <= 0:
            raise ValueError("batch_size must be greater than 0")
        self.api_key = api_key if api_key is not None else settings.siliconflow_api_key
        self.base_url = (base_url or settings.siliconflow_base_url).rstrip("/")
        self.model_path = model or settings.siliconflow_reranker_model
        self.device = "remote"
        self.batch_size = batch_size
        self.timeout_s = timeout_s
        if not self.api_key:
            raise RuntimeError("SILICONFLOW_API_KEY is not configured")

    def rerank(self, query: str, hits: list[Hit], top_n: int = 5) -> list[Hit]:
        if not hits or top_n <= 0:
            return []
        scores = [0.0] * len(hits)
        for start in range(0, len(hits), self.batch_size):
            batch = hits[start : start + self.batch_size]
            for offset, score in self._score_batch(query, [hit.text for hit in batch]).items():
                scores[start + offset] = float(score)
        return _copy_reranked_hits(hits, scores, top_n)

    def _score_batch(self, query: str, documents: list[str]) -> dict[int, float]:
        payload = {
            "model": self.model_path,
            "query": query,
            "documents": documents,
            "top_n": len(documents),
            "return_documents": False,
        }
        request = urllib.request.Request(
            f"{self.base_url}/rerank",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            method="POST",
        )
        try:
            with urllib.request.urlopen(request, timeout=self.timeout_s) as response:
                body = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="ignore")[:300]
            raise RuntimeError(
                f"SiliconFlow rerank request failed: HTTP {exc.code} {detail}"
            ) from exc
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            raise RuntimeError(
                f"SiliconFlow rerank request failed: {type(exc).__name__}"
            ) from exc
        try:
            result = json.loads(body)
            items = result["results"]
            return {
                int(item["index"]): float(item["relevance_score"])
                for item in items
            }
        except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
            raise RuntimeError("SiliconFlow rerank response is unusable") from exc


Reranker = SiliconFlowReranker

__all__ = ["Reranker", "SiliconFlowReranker", "STAGE_RERANK"]
