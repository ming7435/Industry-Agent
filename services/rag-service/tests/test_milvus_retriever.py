import unittest

from app.corpus import infer_corpus, infer_device_model
from app.milvus.retriever import (
    SOURCE_DENSE,
    DenseRetriever,
    _build_expression,
    _hit_from_row,
)


class FakeEmbedder:
    def __init__(self, vector=None) -> None:
        self.vector = vector or [0.1, 0.2, 0.3]
        self.dimension = len(self.vector)
        self.calls: list[list[str]] = []

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        self.calls.append(list(texts))
        return [list(self.vector) for _ in texts]


class FakeMilvusClient:
    def __init__(self, rows) -> None:
        self.rows = rows
        self.search_calls: list[dict] = []

    def search(self, **kwargs):
        self.search_calls.append(kwargs)
        return [list(self.rows)]

    def has_collection(self, collection_name: str) -> bool:
        return True


def _row(chunk_id: str, text: str, score: float = 0.9, **entity) -> dict:
    payload = {
        "chunk_id": chunk_id,
        "text": text,
        "source_name": "维修手册_TC820LTYsi_报警码数据.pdf",
        "source_path": "data/SHUJU/维修手册_TC820LTYsi_报警码数据.pdf",
        "metadata_json": '{"quality": "high", "page_numbers": [3]}',
    }
    payload.update(entity)
    return {"id": chunk_id, "score": score, "entity": payload}


class FilterExpressionTests(unittest.TestCase):
    def test_existing_columns_become_a_milvus_expression(self) -> None:
        expression, remaining = _build_expression({"source_format": "pdf", "quality": "high"})

        self.assertEqual(expression, 'source_format == "pdf" and quality == "high"')
        self.assertEqual(remaining, {})

    def test_metadata_only_fields_are_post_filtered(self) -> None:
        expression, remaining = _build_expression(
            {"corpus": "alarms", "device_model": "TC820LTYsi"}
        )

        self.assertEqual(expression, "")
        self.assertEqual(remaining, {"corpus": "alarms", "device_model": "TC820LTYsi"})

    def test_none_values_are_ignored(self) -> None:
        expression, remaining = _build_expression({"corpus": None})

        self.assertEqual(expression, "")
        self.assertEqual(remaining, {})

    def test_quotes_cannot_break_out_of_the_expression(self) -> None:
        expression, _ = _build_expression({"source_format": 'pdf" or 1=="1'})

        self.assertNotIn('"pdf"', expression)


class HitMappingTests(unittest.TestCase):
    def test_row_becomes_a_dense_hit(self) -> None:
        hit = _hit_from_row(_row("c1", "主轴维护步骤", score=0.75))

        self.assertEqual(hit.chunk_id, "c1")
        self.assertEqual(hit.text, "主轴维护步骤")
        self.assertAlmostEqual(hit.score, 0.75)
        self.assertEqual(hit.source, SOURCE_DENSE)
        self.assertEqual(hit.metadata["quality"], "high")
        self.assertEqual(hit.metadata["page_numbers"], [3])
        self.assertEqual(hit.metadata["stage"], "dense")

    def test_corpus_is_derived_from_the_offline_source_name(self) -> None:
        hit = _hit_from_row(_row("c1", "报警码 E-204 液压压力低"))

        self.assertEqual(hit.metadata["corpus"], "alarms")
        self.assertEqual(hit.metadata["device_model"], "TC820LTYsi")

    def test_parent_directory_beats_the_filename(self) -> None:
        hit = _hit_from_row(
            _row("c1", "任意内容", source_name="notes.pdf", source_path="data/sop/notes.pdf")
        )

        self.assertEqual(hit.metadata["corpus"], "sop")

    def test_declared_corpus_in_metadata_wins(self) -> None:
        hit = _hit_from_row(
            _row("c1", "任意内容", metadata_json='{"corpus": "cases"}')
        )

        self.assertEqual(hit.metadata["corpus"], "cases")

    def test_entity_may_be_the_row_itself(self) -> None:
        hit = _hit_from_row({"chunk_id": "c2", "text": "报警码 E-204", "distance": 0.4})

        self.assertEqual(hit.chunk_id, "c2")
        self.assertAlmostEqual(hit.score, 0.4)
        self.assertIn(hit.metadata["corpus"], {"alarms", "cases", "manuals", "sop"})


class DenseRetrieverTests(unittest.TestCase):
    def test_search_embeds_the_query_and_maps_rows(self) -> None:
        client = FakeMilvusClient([_row("c1", "液压压力低"), _row("c2", "更换滤芯")])
        embedder = FakeEmbedder()
        retriever = DenseRetriever(
            collection_name="industry_rag_chunks",
            embedder=embedder,
            client=client,
        )

        hits = retriever.search("液压压力低", filters={"source_format": "pdf"}, top_k=5)

        self.assertEqual(embedder.calls, [["液压压力低"]])
        self.assertEqual(client.search_calls[0]["limit"], 5)
        self.assertEqual(client.search_calls[0]["collection_name"], "industry_rag_chunks")
        self.assertEqual(client.search_calls[0]["filter"], 'source_format == "pdf"')
        self.assertEqual([hit.chunk_id for hit in hits], ["c1", "c2"])

    def test_metadata_filters_are_applied_after_retrieval(self) -> None:
        client = FakeMilvusClient(
            [
                _row("c1", "液压压力低", metadata_json='{"quality": "high", "station": "line-3"}'),
                _row("c2", "更换滤芯", metadata_json='{"quality": "high", "station": "line-7"}'),
            ]
        )
        retriever = DenseRetriever(embedder=FakeEmbedder(), client=client)

        hits = retriever.search("液压", filters={"station": "line-3"})

        self.assertEqual([hit.chunk_id for hit in hits], ["c1"])

    def test_corpus_filter_uses_the_derived_label(self) -> None:
        client = FakeMilvusClient(
            [
                _row("c1", "报警码文本"),
                _row(
                    "c2",
                    "保养文本",
                    source_name="维修手册_TC820LTYsi_保养维护数据.pdf",
                    source_path="data/SHUJU/维修手册_TC820LTYsi_保养维护数据.pdf",
                ),
            ]
        )
        retriever = DenseRetriever(embedder=FakeEmbedder(), client=client)

        hits = retriever.search("维护", filters={"corpus": "manuals"})

        self.assertEqual([hit.chunk_id for hit in hits], ["c2"])

    def test_blank_query_and_zero_top_k_short_circuit(self) -> None:
        client = FakeMilvusClient([_row("c1", "text")])
        retriever = DenseRetriever(embedder=FakeEmbedder(), client=client)

        self.assertEqual(retriever.search("   "), [])
        self.assertEqual(retriever.search("液压", top_k=0), [])
        self.assertEqual(client.search_calls, [])


class CorpusInferenceTests(unittest.TestCase):
    def test_keyword_then_path_then_default(self) -> None:
        self.assertEqual(infer_corpus(source_name="维修手册_X_报警码数据.pdf"), "alarms")
        self.assertEqual(infer_corpus(source_path="data/cases/anything.txt"), "cases")
        self.assertEqual(
            infer_corpus(source_name="random.pdf", source_path="tmp/random.pdf", default="sop"),
            "sop",
        )

    def test_device_model_guess(self) -> None:
        self.assertEqual(
            infer_device_model("维修手册_TC820LTYsi_报警码数据.pdf"),
            "TC820LTYsi",
        )
        self.assertEqual(infer_device_model("随机笔记.pdf"), "")


if __name__ == "__main__":
    unittest.main()
