from app.api import deps


def test_component_factory_passes_injected_settings_to_optional_constructor():
    class Component:
        def __init__(self, endpoint: str = "default"):
            self.endpoint = endpoint

    value = deps._instantiate(Component, {"endpoint": "http://model-service"}, "component")

    assert value.endpoint == "http://model-service"


def test_dense_factory_injects_the_model_service_embedder(monkeypatch):
    expected_embedder = object()

    class Dense:
        def __init__(self, *, embedder, **kwargs):
            self.embedder = embedder

    import app.milvus.retriever as retriever_module

    monkeypatch.setattr(retriever_module, "DenseRetriever", Dense)
    monkeypatch.setattr(deps, "get_embedder", lambda: expected_embedder)

    result = deps._create_dense()

    assert result.embedder is expected_embedder


def test_remote_embedder_uses_model_service_without_supplier_key(monkeypatch):
    import json
    import app.clients.model as model_module

    calls = []

    class Response:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self):
            return json.dumps({"data": [{"index": 0, "embedding": [0.1, 0.2]}]}).encode()

    def opener(request, timeout):
        calls.append((request.full_url, timeout))
        return Response()

    monkeypatch.setattr(model_module, "urlopen", opener)
    monkeypatch.setenv("MODEL_SERVICE_BASE_URL", "http://model-service:8040")
    monkeypatch.delenv("SILICONFLOW_API_KEY", raising=False)

    embedder = model_module.RemoteEmbedder()

    assert embedder.embed_query("主轴温度") == [0.1, 0.2]
    assert calls and calls[0][0] == "http://model-service:8040/v1/embeddings"


def test_dense_retriever_rejects_injected_vector_dimension_mismatch():
    from app.milvus.retriever import DenseRetriever

    class Embedder:
        dimension = 2

        def embed_query(self, query):
            return [0.1, 0.2]

    class Client:
        def search(self, **kwargs):
            return [[]]

    retriever = DenseRetriever(collection_names=["cases"], dim=3, embedder=Embedder(), client=Client())
    try:
        retriever.search("主轴", top_k=1)
    except RuntimeError as error:
        assert "dimension" in str(error).lower()
    else:
        raise AssertionError("dimension mismatch must be rejected before Milvus search")
