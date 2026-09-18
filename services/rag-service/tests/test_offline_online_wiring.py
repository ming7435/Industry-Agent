import importlib.util
import unittest

from app.corpus import infer_corpus, infer_device_model
from app.embedding.model import QueryEmbedder

SETTINGS_AVAILABLE = importlib.util.find_spec("pydantic_settings") is not None


class FakeEmbeddingClient:
    def __init__(self, dimension: int = 3) -> None:
        self.dimension = dimension
        self.calls: list[list[str]] = []

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        self.calls.append(list(texts))
        return [[0.1] * self.dimension for _ in texts]


class QueryEmbedderTests(unittest.TestCase):
    def test_query_is_encoded_with_the_wrapped_client(self) -> None:
        client = FakeEmbeddingClient(dimension=4)
        embedder = QueryEmbedder(client)

        vector = embedder.embed_query("液压压力低")

        self.assertEqual(client.calls, [["液压压力低"]])
        self.assertEqual(len(vector), 4)
        self.assertEqual(embedder.dimension, 4)

    def test_offline_client_without_embed_query_still_works(self) -> None:
        from app.milvus.retriever import _embed_query

        client = FakeEmbeddingClient(dimension=2)

        self.assertEqual(_embed_query(client, "液压"), [0.1, 0.1])


class CorpusInferenceTests(unittest.TestCase):
    def test_parent_directory_wins(self) -> None:
        self.assertEqual(
            infer_corpus(source_path="data/alarms/维修手册_报警码数据.pdf"),
            "alarms",
        )

    def test_filename_keyword_is_the_fallback(self) -> None:
        self.assertEqual(
            infer_corpus(source_name="维修手册_TC820LTYsi_SOP数据.pdf"),
            "sop",
        )

    def test_unknown_document_falls_back_to_settings(self) -> None:
        if not SETTINGS_AVAILABLE:
            self.skipTest("pydantic-settings is not installed")

        from config.settings import settings

        self.assertEqual(infer_corpus(source_name="random-notes.pdf"), settings.default_corpus)

    def test_device_model_is_read_from_the_filename(self) -> None:
        self.assertEqual(
            infer_device_model("维修手册_TC820LTYsi_报警码数据.pdf"),
            "TC820LTYsi",
        )
        self.assertEqual(infer_device_model("随机笔记.pdf"), "")


if __name__ == "__main__":
    unittest.main()
