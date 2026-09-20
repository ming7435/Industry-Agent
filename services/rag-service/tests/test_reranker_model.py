import json
import unittest
from unittest.mock import patch

from app.embedding.models import SiliconFlowEmbeddingClient
from app.reranker.model import SiliconFlowReranker
from app.retrieval import Hit


class _FakeResponse:
    def __init__(self, payload: dict):
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def read(self) -> bytes:
        return json.dumps(self.payload).encode("utf-8")


class SiliconFlowClientTests(unittest.TestCase):
    def test_embedding_client_returns_vectors_in_index_order(self) -> None:
        response = {
            "data": [
                {"index": 1, "embedding": [0.3, 0.4]},
                {"index": 0, "embedding": [0.1, 0.2]},
            ]
        }
        with patch("app.embedding.models.urllib.request.urlopen", return_value=_FakeResponse(response)):
            client = SiliconFlowEmbeddingClient(api_key="test", base_url="https://example.test", model="BAAI/bge-m3")
            vectors = client.embed_texts(["first", "second"])

        self.assertEqual(vectors, [[0.1, 0.2], [0.3, 0.4]])
        self.assertEqual(client.dimension, 2)

    def test_reranker_sorts_hits_by_remote_score(self) -> None:
        response = {
            "results": [
                {"index": 0, "relevance_score": 0.2},
                {"index": 1, "relevance_score": 0.9},
            ]
        }
        hits = [
            Hit(chunk_id="a", text="low", score=0.0, source="test"),
            Hit(chunk_id="b", text="high", score=0.0, source="test"),
        ]
        with patch("app.reranker.model.urllib.request.urlopen", return_value=_FakeResponse(response)):
            client = SiliconFlowReranker(api_key="test", base_url="https://example.test", model="BAAI/bge-reranker-v2-m3")
            reranked = client.rerank("query", hits, top_n=2)

        self.assertEqual([hit.chunk_id for hit in reranked], ["b", "a"])
        self.assertEqual(reranked[0].metadata["stage"], "rerank")
        self.assertEqual(reranked[0].metadata["rerank_score"], 0.9)
        self.assertEqual(hits[0].metadata, {})


if __name__ == "__main__":
    unittest.main()
