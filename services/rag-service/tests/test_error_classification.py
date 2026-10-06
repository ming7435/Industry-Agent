"""实际模型 HTTP 失败应归属对应能力，不能误报数据库故障或超时。"""

import asyncio

import pytest

from app.api.models import SearchRequest
from app.api.pipeline import _Progress, RouteUnavailable
from app.clients.model import RemoteEmbedder, RemoteReranker
from app.milvus.retriever import DenseRetriever
from app.retrieval import Hit
from test_online_connectivity import isolated_pipeline, local_model_server


def test_embedding_http_failure_does_not_report_milvus_unavailable(tmp_path, monkeypatch):
    with local_model_server({"/v1/embeddings": (503, {"error": "account blocked"}, 0)}) as (url, calls):
        monkeypatch.setenv("MODEL_SERVICE_BASE_URL", url)
        embedder = RemoteEmbedder()
        dense = DenseRetriever(collection_names=["isolated"], embedder=embedder)
        pipeline = isolated_pipeline(tmp_path)
        progress = _Progress(request_id="embedding-failure")
        with pytest.raises(RouteUnavailable) as raised:
            asyncio.run(pipeline._search_with_budget(stage="dense", retriever=dense, fallback_reason="milvus_unavailable",
                        query="bearing", filters={}, top_k=1, timeout_ms=1000, progress=progress))
        assert raised.value.degrade_reason == "embedding_unavailable"
        assert len(calls) == 1


def test_rerank_http_failure_is_unavailable_not_timeout(tmp_path, monkeypatch):
    with local_model_server({"/v1/rerank": (503, {"error": "account blocked"}, 0)}) as (url, calls):
        monkeypatch.setenv("MODEL_SERVICE_BASE_URL", url)
        pipeline = isolated_pipeline(tmp_path)
        pipeline._reranker = RemoteReranker()
        progress = _Progress(request_id="rerank-failure")
        hits = [Hit(chunk_id="case:1", text="bearing", score=1, source="bm25", metadata={})]
        result = asyncio.run(pipeline._rerank(SearchRequest(query="bearing"), hits, 1, progress))
        assert result == hits
        assert progress.degrade_reason == "reranker_unavailable"
        assert len(calls) == 1


def test_actual_rerank_transport_timeout_still_reports_timeout(tmp_path, monkeypatch):
    with local_model_server({"/v1/rerank": (200, {"results": []}, 0.08)}) as (url, _calls):
        monkeypatch.setenv("MODEL_SERVICE_BASE_URL", url)
        pipeline = isolated_pipeline(tmp_path)
        pipeline._reranker = RemoteReranker()
        pipeline._reranker.client.timeout = 0.02
        progress = _Progress(request_id="rerank-timeout")
        hits = [Hit(chunk_id="case:1", text="bearing", score=1, source="bm25", metadata={})]
        assert asyncio.run(pipeline._rerank(SearchRequest(query="bearing"), hits, 1, progress)) == hits
        assert progress.degrade_reason == "rerank_timeout"


def test_legacy_offline_reranker_preserves_wrapped_transport_timeout(tmp_path):
    from app.reranker.model import SiliconFlowReranker
    with local_model_server({"/rerank": (200, {"results": []}, 0.08)}) as (url, _calls):
        pipeline = isolated_pipeline(tmp_path)
        pipeline._reranker = SiliconFlowReranker(api_key="isolated-test-token", base_url=url, timeout_s=0.02)
        progress = _Progress(request_id="offline-timeout")
        hits = [Hit(chunk_id="case:1", text="bearing", score=1, source="bm25", metadata={})]
        assert asyncio.run(pipeline._rerank(SearchRequest(query="bearing"), hits, 1, progress)) == hits
        assert progress.degrade_reason == "rerank_timeout"
