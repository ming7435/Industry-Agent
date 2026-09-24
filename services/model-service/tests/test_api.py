from fastapi.testclient import TestClient

from app.main import app


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
