"""在线恢复、请求预算和 Model HTTP 契约的隔离回归测试。

被测依赖缓存、路由、流水线和模型客户端均使用真实实现。外部系统替换为
临时本机 HTTP 服务、临时 SQLite/Whoosh，避免调用正式数据库或收费模型。
"""

from __future__ import annotations

import asyncio
import json
import sqlite3
import threading
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import httpx
import pytest
from fastapi import FastAPI

from app.api import deps, routes
from app.api.documents import DocumentStore
from app.api.models import SearchRequest
from app.api.pipeline import SearchPipeline
from app.clients.model import ModelServiceClient, ModelServiceError, RemoteLLM, RemoteReranker
from app.retrieval import Hit


@contextmanager
def local_model_server(responses):
    """只在随机本机端口提供手工核对的模型响应，不转发任何请求。"""

    calls = []

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            length = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            calls.append((self.path, payload))
            self.respond()

        def do_GET(self):
            calls.append((self.path, None))
            self.respond()

        def respond(self):
            status, payload, delay = responses.get(self.path, (404, {"error": "unknown path"}, 0))
            if delay:
                time.sleep(delay)
            encoded = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            try:
                self.wfile.write(encoded)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    worker = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)
    worker.start()
    try:
        yield f"http://127.0.0.1:{server.server_port}", calls
    finally:
        server.shutdown()
        server.server_close()
        worker.join(timeout=1)


def isolated_pipeline(tmp_path):
    from app.whoosh.indexer import build_index
    from app.whoosh.retriever import BM25Retriever

    index_dir = tmp_path / "whoosh"
    build_index([
        {"chunk_id": "case:1", "text": "bearing repair", "metadata": {"corpus": "cases"}},
    ], index_dir)
    return SearchPipeline(
        bm25=BM25Retriever(index_dir=str(index_dir)),
        dense=None, embedder=None, reranker=None, llm=None,
    )


def search_app(monkeypatch, pipeline_factory, store):
    """保留真实路由，替换会连接外部系统的装配边界。"""

    app = FastAPI()
    app.include_router(routes.router)
    app.dependency_overrides[deps.get_pipeline] = pipeline_factory
    monkeypatch.setattr(routes, "get_pipeline", pipeline_factory)
    monkeypatch.setattr(routes, "get_document_store", lambda: store)
    return app


async def post_search(app):
    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://isolated") as client:
        return await client.post("/search", json={"query": "bearing", "top_n": 1})


def test_failed_singleton_retries_after_external_dependency_recovers(monkeypatch):
    monkeypatch.setattr(deps, "_instances", {})
    monkeypatch.setattr(deps, "_RETRY_DELAY_SECONDS", 0.02, raising=False)
    available = threading.Event()
    component = object()

    def factory():
        if not available.is_set():
            raise ConnectionError("isolated dependency is offline")
        return component

    assert deps._singleton("recoverable", factory, "isolated dependency") is None
    available.set()
    time.sleep(0.03)
    assert deps._singleton("recoverable", factory, "isolated dependency") is component


def test_pipeline_uses_models_recovered_after_initial_construction(tmp_path, monkeypatch):
    monkeypatch.setattr(deps, "_instances", {})
    monkeypatch.setattr(deps, "_RETRY_DELAY_SECONDS", 0.02, raising=False)
    monkeypatch.setenv("MODEL_SERVICE_BASE_URL", "")
    monkeypatch.setattr(deps.settings, "whoosh_index_dir", str(tmp_path / "empty-index"))
    monkeypatch.setattr(deps.settings, "milvus_collections", "")
    first = deps.get_pipeline()
    evidence = [Hit(chunk_id="case:1", text="bearing repair", score=1, source="experience-store")]
    response = asyncio.run(first.search(SearchRequest(query="bearing"), "before", supplemental_hits=evidence))
    assert response.answer == ""

    responses = {
        "/v1/rerank": (200, {"results": [{"index": 0, "relevance_score": 0.9}]}, 0),
        "/v1/chat/completions": (200, {"choices": [{"message": {"content": "维修轴承 [1]"}}]}, 0),
    }
    with local_model_server(responses) as (url, _calls):
        monkeypatch.setenv("MODEL_SERVICE_BASE_URL", url)
        time.sleep(0.03)
        recovered = deps.get_pipeline()
        response = asyncio.run(recovered.search(SearchRequest(query="bearing"), "after", supplemental_hits=evidence))
    assert response.answer == "维修轴承 [1]"
    assert response.grounded is True


def test_async_health_probe_does_not_treat_false_coroutine_as_ready():
    class AsyncDependency:
        async def health(self):
            await asyncio.sleep(0)
            return False

    assert asyncio.run(routes._probe(AsyncDependency())) is False


def test_document_query_runs_outside_event_loop(tmp_path, monkeypatch):
    thread_ids = []

    class TracedDocumentStore(DocumentStore):
        def _connect(self):
            connection = super()._connect()
            connection.set_trace_callback(lambda _sql: thread_ids.append(threading.get_ident()))
            return connection

    store = TracedDocumentStore(str(tmp_path / "documents.sqlite3"))
    pipeline = isolated_pipeline(tmp_path)
    app = search_app(monkeypatch, lambda: pipeline, store)
    thread_ids.clear()

    async def scenario():
        event_loop_thread = threading.get_ident()
        response = await post_search(app)
        assert response.status_code == 200
        assert response.json()["hits"][0]["chunk_id"] == "case:1"
        assert thread_ids and event_loop_thread not in thread_ids

    asyncio.run(scenario())


def test_locked_document_store_cannot_exceed_request_budget(tmp_path, monkeypatch):
    store = DocumentStore(str(tmp_path / "documents.sqlite3"))
    pipeline = isolated_pipeline(tmp_path)
    app = search_app(monkeypatch, lambda: pipeline, store)
    monkeypatch.setattr(routes.settings, "request_timeout_ms", 80)
    blocker = sqlite3.connect(str(store.path), check_same_thread=False)
    blocker.execute("BEGIN EXCLUSIVE")
    release = threading.Timer(0.3, blocker.rollback)
    release.start()
    try:
        async def scenario():
            started = time.perf_counter()
            response = await post_search(app)
            return response, time.perf_counter() - started

        response, elapsed = asyncio.run(scenario())
    finally:
        release.join()
        blocker.close()
    assert response.status_code == 200
    assert response.json()["degrade_reason"] == "request_timeout"
    assert elapsed < 0.2
    assert 60 <= response.json()["latency_ms"]["total"] < 200


def test_document_store_error_preserves_available_whoosh_evidence(tmp_path, monkeypatch):
    store = DocumentStore(str(tmp_path / "documents.sqlite3"))
    store.path = tmp_path / "unavailable-parent" / "documents.sqlite3"
    pipeline = isolated_pipeline(tmp_path)
    app = search_app(monkeypatch, lambda: pipeline, store)
    response = asyncio.run(post_search(app))
    assert response.status_code == 200
    assert response.json()["hits"][0]["chunk_id"] == "case:1"
    assert response.json()["degraded"] is True


def test_pipeline_construction_is_within_request_budget(tmp_path, monkeypatch):
    store = DocumentStore(str(tmp_path / "documents.sqlite3"))
    pipeline = isolated_pipeline(tmp_path)
    monkeypatch.setattr(routes.settings, "request_timeout_ms", 80)

    def slow_factory():
        time.sleep(0.3)
        return pipeline

    app = search_app(monkeypatch, slow_factory, store)

    async def scenario():
        started = time.perf_counter()
        response = await post_search(app)
        assert time.perf_counter() - started < 0.2
        assert response.status_code == 200
        assert response.json()["degrade_reason"] == "request_timeout"

    asyncio.run(scenario())


def test_initialization_and_generation_share_one_total_budget(tmp_path, monkeypatch):
    class DelayedLLM:
        async def generate(self, _query, _evidence):
            await asyncio.sleep(0.12)
            return "维修轴承 [1]"

    store = DocumentStore(str(tmp_path / "documents.sqlite3"))
    store.upsert("case:1", "bearing repair", {}, "cases", [{"chunk_id": "case:1", "text": "bearing repair"}])
    pipeline = SearchPipeline(bm25=None, dense=None, embedder=None, reranker=None, llm=DelayedLLM())
    monkeypatch.setattr(routes.settings, "request_timeout_ms", 170)

    def slow_factory():
        time.sleep(0.1)
        return pipeline

    app = search_app(monkeypatch, slow_factory, store)
    response = asyncio.run(post_search(app))
    assert response.status_code == 200
    assert response.json()["degrade_reason"] == "request_timeout"
    assert response.json()["answer"] == ""
    assert response.json()["hits"][0]["chunk_id"] == "case:1"
    assert 150 <= response.json()["latency_ms"]["total"] < 220


@pytest.mark.parametrize("payload", [
    {"error": {"message": "provider offline"}},
    {"data": []},
    {"data": [{"index": 0, "embedding": []}]},
    {"data": [{"index": 1, "embedding": [0.1, 0.2]}]},
    {"data": [{"index": 0, "embedding": [float("nan"), 0.2]}]},
    {"data": [{"index": 0, "embedding": [True, 0.2]}]},
])
def test_embeddings_reject_malformed_success_responses(payload):
    with local_model_server({"/v1/embeddings": (200, payload, 0)}) as (url, _calls):
        with pytest.raises(ModelServiceError):
            ModelServiceClient(url).embeddings(["bearing"])


def test_embeddings_reject_duplicate_response_indices():
    payload = {"data": [
        {"index": 0, "embedding": [0.1, 0.2]},
        {"index": 0, "embedding": [0.3, 0.4]},
    ]}
    with local_model_server({"/v1/embeddings": (200, payload, 0)}) as (url, _calls):
        with pytest.raises(ModelServiceError):
            ModelServiceClient(url).embeddings(["bearing", "spindle"])


def test_embeddings_restore_input_order_from_server_indices():
    payload = {"data": [
        {"index": 1, "embedding": [0.3, 0.4]},
        {"index": 0, "embedding": [0.1, 0.2]},
    ]}
    with local_model_server({"/v1/embeddings": (200, payload, 0)}) as (url, calls):
        assert ModelServiceClient(url).embeddings(["bearing", "spindle"]) == [[0.1, 0.2], [0.3, 0.4]]
        assert calls[0][1]["input"] == ["bearing", "spindle"]


@pytest.mark.parametrize("payload", [
    {"error": {"message": "provider offline"}},
    {"results": []},
    {"results": [{"index": 5, "relevance_score": 0.9}]},
    {"results": [{"index": 0}]},
    {"results": [{"index": 0, "relevance_score": float("inf")}]},
])
def test_rerank_rejects_missing_or_invalid_scores(payload):
    with local_model_server({"/v1/rerank": (200, payload, 0)}) as (url, _calls):
        with pytest.raises(ModelServiceError):
            ModelServiceClient(url).rerank("bearing", [Hit(chunk_id="case:1", text="bearing repair", score=1, source="fusion")], 1)


def test_rerank_only_returns_provider_selected_candidates():
    hits = [Hit(chunk_id="case:1", text="bearing", score=1, source="fusion"), Hit(chunk_id="case:2", text="spindle", score=1, source="fusion")]
    payload = {"results": [{"index": 1, "relevance_score": -0.2}]}
    with local_model_server({"/v1/rerank": (200, payload, 0)}) as (url, _calls):
        ranked = ModelServiceClient(url).rerank("bearing", hits, 1)
    assert [hit.chunk_id for hit in ranked] == ["case:2"]
    assert ranked[0].score == -0.2
    assert hits[1].score == 1


@pytest.mark.parametrize("content", ["", None, [{"text": "unsupported response"}], 7])
def test_chat_rejects_empty_or_non_text_answers(content):
    payload = {"choices": [{"message": {"content": content}}]}
    with local_model_server({"/v1/chat/completions": (200, payload, 0)}) as (url, _calls):
        with pytest.raises(ModelServiceError):
            asyncio.run(ModelServiceClient(url).generate("bearing", "[1] bearing repair"))


def test_http_error_does_not_leak_provider_response_body():
    payload = {"error": "isolated-credential-must-not-be-exposed"}
    with local_model_server({"/v1/embeddings": (503, payload, 0)}) as (url, _calls):
        with pytest.raises(ModelServiceError) as raised:
            ModelServiceClient(url).embeddings(["bearing"])
    assert "503" in str(raised.value)
    assert "isolated-credential" not in str(raised.value)


@pytest.mark.parametrize("method", ["embedding", "rerank", "chat"])
def test_rag_health_does_not_claim_unprobed_models_are_ready(method, monkeypatch):
    from app.clients.model import RemoteEmbedder

    report = {"service": "model-service", "capabilities": {
        method: {"configured": True, "ready": False, "reachable": "not_probed", "synthetic": False},
    }}
    with local_model_server({"/health": (200, report, 0)}) as (url, calls):
        monkeypatch.setenv("MODEL_SERVICE_BASE_URL", url)
        component = {"embedding": RemoteEmbedder, "rerank": RemoteReranker, "chat": RemoteLLM}[method]()
        assert asyncio.run(routes._ready(lambda: component)) is False
        assert calls == [("/health", None)]


def test_model_health_uses_individual_capability_even_when_overall_ready_is_false(monkeypatch):
    report = {"service": "model-service", "ready": False, "capabilities": {
        "chat": {"configured": True, "ready": True, "reachable": True, "synthetic": False},
        "embedding": {"configured": True, "ready": False, "reachable": "not_probed", "synthetic": False},
    }}
    with local_model_server({"/health": (200, report, 0)}) as (url, calls):
        monkeypatch.setenv("MODEL_SERVICE_BASE_URL", url)
        assert asyncio.run(routes._ready(RemoteLLM)) is True
        assert calls == [("/health", None)]


def test_chat_sends_industrial_grounding_and_citation_instructions():
    payload = {"choices": [{"message": {"content": "维修轴承 [1]"}}]}
    with local_model_server({"/v1/chat/completions": (200, payload, 0)}) as (url, calls):
        assert asyncio.run(ModelServiceClient(url).generate("bearing", "[1] bearing repair")) == "维修轴承 [1]"
    messages = calls[0][1]["messages"]
    assert messages[0]["role"] == "system"
    assert "证据编号" in messages[0]["content"]
    assert "简体中文" in messages[0]["content"]
    assert "【用户问题】\nbearing" in messages[1]["content"]
    assert "【证据】\n[1] bearing repair" in messages[1]["content"]


def test_empty_embedding_batch_does_not_issue_model_request():
    with local_model_server({"/v1/embeddings": (200, {"data": []}, 0)}) as (url, calls):
        assert ModelServiceClient(url).embeddings([]) == []
        assert calls == []


@pytest.mark.parametrize("texts", [[""], ["   "], [None], "bearing"])
def test_embedding_invalid_inputs_fail_before_http(texts):
    payload = {"data": [{"index": 0, "embedding": [0.1, 0.2]}]}
    with local_model_server({"/v1/embeddings": (200, payload, 0)}) as (url, calls):
        with pytest.raises(ModelServiceError):
            ModelServiceClient(url).embeddings(texts)
        assert calls == []


@pytest.mark.parametrize("query,top_n", [("", 1), ("bearing", 0), ("bearing", -1)])
def test_rerank_invalid_inputs_fail_before_http(query, top_n):
    payload = {"results": [{"index": 0, "relevance_score": 0.9}]}
    hits = [Hit(chunk_id="case:1", text="bearing repair", score=1, source="fusion")]
    with local_model_server({"/v1/rerank": (200, payload, 0)}) as (url, calls):
        with pytest.raises(ModelServiceError):
            ModelServiceClient(url).rerank(query, hits, top_n)
        assert calls == []


@pytest.mark.parametrize("query,evidence", [("", "[1] bearing repair"), ("bearing", "")])
def test_chat_missing_question_or_evidence_fails_before_http(query, evidence):
    payload = {"choices": [{"message": {"content": "unsupported answer"}}]}
    with local_model_server({"/v1/chat/completions": (200, payload, 0)}) as (url, calls):
        with pytest.raises(ModelServiceError):
            asyncio.run(ModelServiceClient(url).generate(query, evidence))
        assert calls == []
