from fastapi.testclient import TestClient

from app.main import app
from app.providers.gateway import ModelGateway
from app.providers.base import ProviderError


def test_model_contracts_are_deterministic():
    client = TestClient(app)
    assert client.get("/health").json()["service"] == "model-service"
    chat = client.post("/v1/chat/completions", json={"messages": [{"role": "user", "content": "diagnose"}]})
    assert chat.status_code == 200
    assert chat.json()["choices"][0]["message"]["content"].startswith("[fake-model]")
    embedding = client.post("/v1/embeddings", json={"input": ["a", "b"]})
    assert embedding.status_code == 200
    assert len(embedding.json()["data"]) == 2
    rerank = client.post("/v1/rerank", json={"query": "轴承", "documents": ["轴承异常", "温度异常"]})
    assert rerank.status_code == 200
    assert rerank.json()["results"][0]["index"] == 0


def test_fake_embedding_dimension_is_stable_for_milvus_contract():
    client = TestClient(app)
    first = client.post("/v1/embeddings", json={"input": ["same text"]}).json()["data"][0]["embedding"]
    second = client.post("/v1/embeddings", json={"input": ["same text"]}).json()["data"][0]["embedding"]
    assert len(first) == 1024
    assert first == second


def test_deepseek_chat_provider_is_separate_from_siliconflow_aux_provider(monkeypatch):
    """DeepSeek 对话必须走官方端点，SiliconFlow 仅作为向量/重排辅助提供方。"""

    monkeypatch.setenv("MODEL_PROVIDER", "remote")
    monkeypatch.setenv("MODEL_CHAT_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "deepseek-test-key")
    monkeypatch.setenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1")
    monkeypatch.setenv("SILICONFLOW_API_KEY", "siliconflow-test-key")

    gateway = ModelGateway()

    assert gateway.chat_provider.name == "deepseek"
    assert gateway.chat_provider.base_url == "https://api.deepseek.com"
    assert gateway.aux_provider.name == "siliconflow"
    assert gateway.name == "deepseek"


def test_production_rejects_implicit_fake_provider(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("MODEL_PROVIDER", "fake")

    try:
        ModelGateway()
    except ProviderError as error:
        assert "fake" in str(error).lower()
    else:  # pragma: no cover - documents the production safety gate
        raise AssertionError("production must not start with fake model provider")


def test_remote_health_does_not_claim_unprobed_provider_is_ready(monkeypatch):
    import app.main as main

    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("MODEL_PROVIDER", "remote")
    monkeypatch.setenv("MODEL_CHAT_PROVIDER", "deepseek")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "deepseek-test-key")
    monkeypatch.setenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    monkeypatch.setenv("SILICONFLOW_API_KEY", "siliconflow-test-key")
    main.gateway = ModelGateway()

    payload = main.health()

    assert payload["ready"] is False
    assert payload["capabilities"]["chat"]["configured"] is True
    assert payload["capabilities"]["chat"]["reachable"] == "not_probed"
    assert payload["capabilities"]["chat"]["ready"] is False
