import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from app.embedding import VectorRecord
from app.ingestion import parse_document
from app.mysql import MySQLConfig, MySQLRagWriter


class FakeCursor:
    def __init__(self, connection) -> None:
        self.connection = connection
        self.rows = []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def execute(self, sql, params=None):
        self.connection.statements.append((sql, params))
        normalized_sql = sql.lstrip().upper()
        if normalized_sql.startswith("SELECT CHUNK_ID"):
            self.rows = [(chunk_id,) for chunk_id in self.connection.existing_chunks]
        elif "SELECT CHUNK_COUNT" in normalized_sql:
            self.rows = [self.connection.complete_document] if self.connection.complete_document else []

    def fetchall(self):
        return list(self.rows)

    def fetchone(self):
        return self.rows[0] if self.rows else None


class FakeConnection:
    def __init__(self) -> None:
        self.existing_chunks = {"stale"}
        self.complete_document = None
        self.statements = []
        self.commits = 0
        self.rollbacks = 0
        self.selected_database = None

    def cursor(self):
        return FakeCursor(self)

    def select_db(self, database):
        self.selected_database = database

    def commit(self):
        self.commits += 1

    def rollback(self):
        self.rollbacks += 1

    def close(self):
        pass


class MySQLWriterTests(unittest.TestCase):
    def test_document_and_chunks_are_upserted_idempotently(self):
        connection = FakeConnection()
        writer = MySQLRagWriter(
            MySQLConfig(database="industry_rag_test"),
            connection=connection,
        )

        writer.initialize()
        previous = writer.begin_document(
            "d" * 64,
            source_name="manual.pdf",
            source_path="data/manual.pdf",
            source_format="pdf",
            content_hash="h" * 64,
            file_size=12,
            metadata={"source_format": "pdf"},
        )
        current = writer.replace_chunks(
            "d" * 64,
            [
                VectorRecord(
                    id="chunk-1",
                    chunk_id="chunk-1",
                    text="主轴维护步骤",
                    vector=[0.1, 0.2],
                    source_name="manual.pdf",
                    source_path="data/manual.pdf",
                    source_format="pdf",
                    page_numbers=[1],
                    chunk_type="text_chunk",
                    quality="high",
                    metadata={"document_id": "d" * 64},
                )
            ],
            collection_name="industry_rag_documents",
        )
        writer.mark_complete("d" * 64, chunk_count=1, vector_count=1)

        self.assertEqual(previous, {"stale"})
        self.assertEqual(current, {"chunk-1"})
        self.assertEqual(connection.selected_database, "industry_rag_test")
        self.assertGreaterEqual(connection.commits, 4)
        self.assertFalse(connection.rollbacks)

    def test_cad_entities_annotations_and_relations_are_linked(self):
        try:
            import ezdxf
        except ImportError as exc:
            self.skipTest(f"optional parser dependency unavailable: {exc}")

        with TemporaryDirectory() as directory:
            path = Path(directory) / "pump.dxf"
            drawing = ezdxf.new("R2010")
            modelspace = drawing.modelspace()
            modelspace.add_line((0, 0), (100, 0), dxfattribs={"layer": "轮廓线"})
            modelspace.add_text("P-101", dxfattribs={"layer": "设备编号"})
            modelspace.add_text("P-101", dxfattribs={"layer": "标注"})
            drawing.saveas(path)

            document = parse_document(path)
            connection = FakeConnection()
            writer = MySQLRagWriter(
                MySQLConfig(database="industry_rag_test"),
                connection=connection,
            )
            writer.initialize()
            writer.begin_document(
                document.metadata["document_id"],
                source_name=document.source_name,
                source_path=str(path),
                source_format=document.source_format,
                content_hash=document.metadata["content_hash"],
                file_size=document.metadata["file_size"],
                metadata=document.metadata,
            )

            stats = writer.replace_cad_document(document)
            relation_rows = [
                params for sql, params in connection.statements
                if "INSERT INTO cad_entity_relations" in sql
            ]
            self.assertEqual(stats["drawings"], 1)
            self.assertEqual(stats["versions"], 1)
            self.assertEqual(stats["layers"], 3)
            self.assertEqual(stats["entities"], 3)
            self.assertEqual(stats["annotations"], 2)
            self.assertGreaterEqual(stats["relations"], 4)
            relation_types = {row[6] for row in relation_rows}
            self.assertIn("same_device_id", relation_types)
            self.assertIn("belongs_to_layer", relation_types)
            entity_blocks = [
                block for block in document.blocks
                if block.metadata.get("source") == "dxf_entity"
            ]
            self.assertEqual(len(entity_blocks), 2)
            self.assertTrue(all(block.metadata.get("entity_id") for block in entity_blocks))
            entity_rows = [
                params for sql, params in connection.statements
                if "INSERT INTO cad_entities" in sql
            ]
            self.assertEqual(len(entity_rows), 3)
            device_rows = [row for row in relation_rows if row[6] == "same_device_id"]
            self.assertEqual(len(device_rows), 1)
            self.assertNotEqual(device_rows[0][4], device_rows[0][5])
            layer_rows = [row for row in relation_rows if row[6] == "belongs_to_layer"]
            self.assertEqual(len(layer_rows), 3)

    def test_find_complete_document_returns_existing_stats(self):
        connection = FakeConnection()
        connection.complete_document = (3, 2)
        writer = MySQLRagWriter(
            MySQLConfig(database="industry_rag_test"),
            connection=connection,
        )

        result = writer.find_complete_document("d" * 64, "h" * 64)

        self.assertEqual(result, {"chunk_count": 3, "vector_count": 2})


if __name__ == "__main__":
    unittest.main()
