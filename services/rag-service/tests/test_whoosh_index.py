import importlib.util
import tempfile
import unittest
from pathlib import Path

from app.corpus import infer_corpus
from app.whoosh.indexer import build_index, count_documents, to_document
from app.whoosh.retriever import BM25Retriever

WHOOSH_AVAILABLE = importlib.util.find_spec("whoosh") is not None


def _record(chunk_id: str, text: str, source_name: str = "维修手册_TC820LTYsi_报警码数据.pdf", **extra) -> dict:
    record = {
        "chunk_id": chunk_id,
        "text": text,
        "source_name": source_name,
        "source_path": f"data/SHUJU/{source_name}",
        "metadata": {"quality": "high"},
    }
    record.update(extra)
    return record


class DocumentMappingTests(unittest.TestCase):
    def test_corpus_is_derived_from_the_source_name(self) -> None:
        document = to_document(_record("c1", "主轴维护"))

        self.assertEqual(document["chunk_id"], "c1")
        self.assertEqual(document["corpus"], "alarms")
        self.assertEqual(document["device_model"], "TC820LTYsi")

    def test_directory_wins_over_filename(self) -> None:
        document = to_document(
            _record("c1", "作业步骤", source_name="notes.txt", source_path="data/sop/notes.txt")
        )

        self.assertEqual(document["corpus"], "sop")

    def test_declared_metadata_corpus_is_kept(self) -> None:
        document = to_document(_record("c1", "案例描述", metadata={"corpus": "cases"}))

        self.assertEqual(document["corpus"], "cases")
        self.assertEqual(infer_corpus(source_name="whatever.pdf"), "manuals")


@unittest.skipUnless(WHOOSH_AVAILABLE, "whoosh is not installed")
class WhooshRoundTripTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.index_dir = Path(self._tmp.name) / "whoosh"

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def test_build_then_search_chinese_text(self) -> None:
        written = build_index(
            [
                _record("c1", "主轴维护步骤：先断电，再拆卸端盖。", source_name="维修手册_TC820LTYsi_保养维护数据.pdf"),
                _record("c2", "报警码 E-204 表示液压压力低。"),
            ],
            self.index_dir,
        )
        self.assertEqual(written, 2)
        self.assertEqual(count_documents(self.index_dir), 2)

        retriever = BM25Retriever(index_dir=str(self.index_dir))
        hits = retriever.search("液压压力", top_k=5)

        self.assertEqual([hit.chunk_id for hit in hits], ["c2"])
        self.assertEqual(hits[0].source, "bm25")
        self.assertEqual(hits[0].metadata["corpus"], "alarms")
        self.assertTrue(retriever.health())

    def test_corpus_filter_is_pushed_down(self) -> None:
        build_index(
            [
                _record("c1", "主轴维护", source_name="维修手册_TC820LTYsi_保养维护数据.pdf"),
                _record("c2", "主轴报警"),
            ],
            self.index_dir,
        )
        retriever = BM25Retriever(index_dir=str(self.index_dir))

        hits = retriever.search("主轴", filters={"corpus": "manuals"})

        self.assertEqual([hit.chunk_id for hit in hits], ["c1"])

    def test_missing_index_reports_unavailable(self) -> None:
        retriever = BM25Retriever(index_dir=str(Path(self._tmp.name) / "missing"))

        self.assertFalse(retriever.health())
        with self.assertRaises(RuntimeError):
            retriever.search("主轴")


if __name__ == "__main__":
    unittest.main()
