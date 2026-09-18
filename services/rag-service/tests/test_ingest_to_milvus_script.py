import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from scripts.ingest_to_milvus import (
    build_argument_parser,
    collection_name_for_pdf,
    ingest_directory,
)


class FakeMySQLWriter:
    instances = []
    complete_document = None

    def __init__(self, config=None) -> None:
        self.closed = False
        self.begin_calls = []
        self.metadata_updates = []
        FakeMySQLWriter.instances.append(self)

    def initialize(self) -> None:
        pass

    def begin_document(self, document_id: str, **kwargs):
        self.begin_calls.append((document_id, kwargs))
        return set()

    def update_document_metadata(self, document_id: str, **kwargs) -> None:
        self.metadata_updates.append((document_id, kwargs))

    def find_complete_document(self, document_id: str, content_hash: str):
        return FakeMySQLWriter.complete_document

    def mark_failed(self, document_id: str, error: str) -> None:
        pass

    def close(self) -> None:
        self.closed = True


class FakeStorageResult:
    uri = "s3://cad-source/manual-123.txt"

    def to_metadata(self):
        return {
            "storage_bucket": "cad-source",
            "storage_key": "manual-123.txt",
            "storage_uri": self.uri,
            "storage_etag": "etag-1",
            "storage_version_id": "version-1",
        }


class FakeStorageClient:
    instances = []

    def __init__(self, *args, **kwargs) -> None:
        self.uploads = []
        FakeStorageClient.instances.append(self)

    def upload_file(self, path, *, root=None):
        self.uploads.append((path, root))
        return FakeStorageResult()


class FakeEmbeddingClient:
    pass


class FakeMilvusWriter:
    def __init__(self, *args, **kwargs) -> None:
        pass

    def drop_all_collections(self) -> list[str]:
        return []


class IngestToMilvusScriptTests(unittest.TestCase):
    def test_known_pdf_names_map_to_domain_collections(self) -> None:
        cases = {
            "维修手册_TC820LTYsi_BOM数据.pdf": "industry_rag_bom",
            "维修手册_TC820LTYsi_SOP数据.pdf": "industry_rag_sop",
            "维修手册_TC820LTYsi_保养维护数据.pdf": "industry_rag_maintenance",
            "维修手册_TC820LTYsi_安全规程数据.pdf": "industry_rag_safety_rules",
            "维修手册_TC820LTYsi_故障诊断数据.pdf": "industry_rag_troubleshooting",
            "维修手册_TC820LTYsi_报警码数据.pdf": "industry_rag_alarm_codes",
        }

        for filename, expected in cases.items():
            with self.subTest(filename=filename):
                self.assertEqual(collection_name_for_pdf(Path(filename)), expected)

    def test_unknown_document_name_includes_format_and_unique_suffix(self) -> None:
        collection_name = collection_name_for_pdf(Path("123 custom manual.txt"))

        self.assertTrue(collection_name.startswith("industry_rag_doc_123_custom_manual_txt_"))
        self.assertEqual(len(collection_name.rsplit("_", 1)[-1]), 10)

    def test_parser_accepts_local_embedding_model_path(self) -> None:
        args = build_argument_parser().parse_args([
            "--embedding-model-path",
            "models/bge-m3",
            "--chunk-max-characters",
            "900",
            "--chunk-overlap-characters",
            "90",
            "--skip-unchanged",
            "--local-ocr",
            "--project-id",
            "P-001",
            "--tenant-id",
            "tenant-a",
            "--version-label",
            "rev-02",
            "--object-storage",
            "--no-cad-metadata",
            "--log-level",
            "DEBUG",
        ])

        self.assertEqual(args.embedding_model_path, "models/bge-m3")
        self.assertEqual(args.chunk_max_characters, 900)
        self.assertEqual(args.chunk_overlap_characters, 90)
        self.assertTrue(args.skip_unchanged)
        self.assertTrue(args.local_ocr)
        self.assertEqual(args.project_id, "P-001")
        self.assertEqual(args.tenant_id, "tenant-a")
        self.assertEqual(args.version_label, "rev-02")
        self.assertTrue(args.object_storage)
        self.assertFalse(args.cad_metadata)
        self.assertEqual(args.log_level, "DEBUG")

    def test_vision_and_local_ocr_are_mutually_exclusive(self) -> None:
        with TemporaryDirectory() as directory:
            data_dir = Path(directory)
            (data_dir / "manual.txt").write_text("主轴维护步骤。", encoding="utf-8")

            with self.assertRaises(ValueError):
                ingest_directory(
                    data_dir,
                    use_vision=True,
                    use_local_ocr=True,
                    mysql_enabled=False,
                )

    def test_skip_unchanged_uses_mysql_manifest_before_parsing(self) -> None:
        FakeMySQLWriter.instances = []
        FakeMySQLWriter.complete_document = {"chunk_count": 3, "vector_count": 2}
        with TemporaryDirectory() as directory:
            data_dir = Path(directory)
            (data_dir / "manual.txt").write_text("主轴维护步骤。", encoding="utf-8")

            with patch("scripts.ingest_to_milvus.MySQLRagWriter", FakeMySQLWriter), \
                patch("scripts.ingest_to_milvus.BGEM3EmbeddingClient", return_value=FakeEmbeddingClient()), \
                patch("scripts.ingest_to_milvus.MilvusVectorWriter", FakeMilvusWriter), \
                patch("scripts.ingest_to_milvus.parse_document", side_effect=AssertionError("parse should be skipped")):
                result = ingest_directory(
                    data_dir,
                    mysql_enabled=True,
                    skip_unchanged=True,
                )

        FakeMySQLWriter.complete_document = None
        self.assertEqual(result["skipped"], 1)
        self.assertEqual(result["chunks"], 3)
        self.assertEqual(result["vector_records"], 2)
        self.assertTrue(FakeMySQLWriter.instances[0].closed)

    def test_object_storage_upload_is_recorded_when_parse_fails(self) -> None:
        FakeMySQLWriter.instances = []
        FakeMySQLWriter.complete_document = None
        FakeStorageClient.instances = []
        with TemporaryDirectory() as directory:
            data_dir = Path(directory)
            (data_dir / "manual.txt").write_text("主轴维护步骤。", encoding="utf-8")

            with patch("scripts.ingest_to_milvus.MySQLRagWriter", FakeMySQLWriter), \
                patch("scripts.ingest_to_milvus.ObjectStorageClient", FakeStorageClient), \
                patch("scripts.ingest_to_milvus.BGEM3EmbeddingClient", return_value=FakeEmbeddingClient()), \
                patch("scripts.ingest_to_milvus.MilvusVectorWriter", FakeMilvusWriter), \
                patch("scripts.ingest_to_milvus.parse_document", side_effect=RuntimeError("parse error")):
                result = ingest_directory(
                    data_dir,
                    mysql_enabled=True,
                    object_storage_enabled=True,
                    continue_on_error=True,
                )

        writer = FakeMySQLWriter.instances[0]
        self.assertEqual(result["uploaded"], 1)
        self.assertEqual(result["failed"], 1)
        self.assertEqual(len(writer.begin_calls), 1)
        self.assertEqual(len(writer.metadata_updates), 1)
        self.assertEqual(writer.metadata_updates[0][1]["storage"]["storage_uri"], "s3://cad-source/manual-123.txt")
        self.assertTrue(writer.closed)

    def test_mysql_writer_closes_when_fail_fast_raises(self) -> None:
        FakeMySQLWriter.instances = []
        FakeMySQLWriter.complete_document = None
        with TemporaryDirectory() as directory:
            data_dir = Path(directory)
            (data_dir / "manual.txt").write_text("主轴维护步骤。", encoding="utf-8")

            with patch("scripts.ingest_to_milvus.MySQLRagWriter", FakeMySQLWriter), \
                patch("scripts.ingest_to_milvus.BGEM3EmbeddingClient", return_value=FakeEmbeddingClient()), \
                patch("scripts.ingest_to_milvus.MilvusVectorWriter", FakeMilvusWriter), \
                patch("scripts.ingest_to_milvus.parse_document", side_effect=RuntimeError("parse error")):
                with self.assertRaises(RuntimeError):
                    ingest_directory(
                        data_dir,
                        mysql_enabled=True,
                        continue_on_error=False,
                    )

        self.assertEqual(len(FakeMySQLWriter.instances), 1)
        self.assertTrue(FakeMySQLWriter.instances[0].closed)


if __name__ == "__main__":
    unittest.main()
