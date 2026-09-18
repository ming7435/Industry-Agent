import unittest

from app.embedding.bge_m3 import BGEM3EmbeddingClient

from app.chunk import IndustrialChunk
from app.embedding import (
    EmbeddingConfig,
    EmbeddingError,
    VectorRecord,
    embed_chunks,
    should_embed_chunk,
    validate_vector,
)


class FakeEmbeddingClient:
    def __init__(self, dimension: int = 3) -> None:
        self._dimension = dimension
        self.calls: list[list[str]] = []

    @property
    def dimension(self) -> int | None:
        return self._dimension

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        self.calls.append(texts)
        return [
            [float(index + 1) for index in range(self._dimension)]
            for _ in texts
        ]


def make_chunk(
    chunk_id: str,
    text: str,
    *,
    quality: str = "high",
    statuses: list[str] | None = None,
) -> IndustrialChunk:
    return IndustrialChunk(
        chunk_id=chunk_id,
        text=text,
        metadata={
            "source_name": "manual.pdf",
            "source_path": "manual.pdf",
            "pdf_type": "mixed",
            "chunk_type": "text_chunk",
            "quality": quality,
            "page_numbers": [1],
            "block_ids": ["p1-t1"],
            "block_types": ["text"],
            "contains_table": False,
            "contains_image": False,
            "contains_cad": False,
            "recognition_statuses": statuses or [],
            "warnings": [],
        },
    )


class EmbeddingPipelineTests(unittest.TestCase):
    def test_filters_low_quality_and_pending_chunks(self) -> None:
        config = EmbeddingConfig(min_characters=5)

        self.assertTrue(should_embed_chunk(make_chunk("c1", "有效工业正文内容", quality="high"), config))
        self.assertFalse(should_embed_chunk(make_chunk("c2", "有效工业正文内容", quality="low"), config))
        self.assertFalse(
            should_embed_chunk(
                make_chunk("c3", "有效工业正文内容", statuses=["pending"]),
                config,
            )
        )

    def test_embeds_chunks_in_batches_and_builds_records(self) -> None:
        chunks = [
            make_chunk("c1", "文档: manual.pdf\n主轴维护步骤。"),
            make_chunk("c2", "文档: manual.pdf\n润滑参数 ISO VG 46。"),
            make_chunk("c3", "文档: manual.pdf\n图号 DRW-88。", quality="medium"),
        ]
        client = FakeEmbeddingClient(dimension=4)

        records = embed_chunks(
            chunks,
            client,
            config=EmbeddingConfig(batch_size=2, min_characters=5),
        )

        self.assertEqual(len(records), 3)
        self.assertEqual(len(client.calls), 2)
        self.assertEqual(records[0].chunk_id, "c1")
        self.assertEqual(records[0].source_name, "manual.pdf")
        self.assertEqual(records[0].page_numbers, [1])
        self.assertEqual(records[0].vector, [1.0, 2.0, 3.0, 4.0])
        self.assertIn('"chunk_type": "text_chunk"', records[0].metadata_json)

    def test_validate_vector_rejects_wrong_dimension(self) -> None:
        with self.assertRaises(EmbeddingError):
            validate_vector([1.0, 2.0], expected_dimension=3)

    def test_vector_record_flattens_milvus_fields(self) -> None:
        chunk = make_chunk("c1", "文档: manual.pdf\n主轴维护步骤。")

        record = VectorRecord.from_chunk(chunk, [0.1, 0.2, 0.3])

        self.assertEqual(record.id, "c1")
        self.assertEqual(record.chunk_type, "text_chunk")
        self.assertFalse(record.contains_cad)
        self.assertEqual(record.to_dict()["metadata"]["source_name"], "manual.pdf")

    def test_bge_client_normalizes_legacy_model_output(self) -> None:
        class LegacyModel:
            def encode(self, texts: list[str], **kwargs: object) -> list[list[float]]:
                if kwargs:
                    raise TypeError("legacy encode signature")
                return [[3.0, 4.0] for _ in texts]

        client = BGEM3EmbeddingClient(
            EmbeddingConfig(normalize_embeddings=True),
            model=LegacyModel(),
        )

        vectors = client.embed_texts(["工业文本"])

        self.assertEqual(vectors, [[0.6, 0.8]])
    def test_embedding_config_accepts_local_model_path(self) -> None:
        config = EmbeddingConfig(model_path="models/bge-m3")

        self.assertEqual(config.model_path, "models/bge-m3")

    def test_embedding_config_rejects_empty_local_model_path(self) -> None:
        with self.assertRaises(ValueError):
            EmbeddingConfig(model_path=" ")


if __name__ == "__main__":
    unittest.main()
