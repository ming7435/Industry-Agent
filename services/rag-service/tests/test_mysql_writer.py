import unittest

from app.embedding import VectorRecord
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
        if sql.lstrip().upper().startswith("SELECT CHUNK_ID"):
            self.rows = [(chunk_id,) for chunk_id in self.connection.existing_chunks]

    def fetchall(self):
        return list(self.rows)


class FakeConnection:
    def __init__(self) -> None:
        self.existing_chunks = {"stale"}
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


if __name__ == "__main__":
    unittest.main()
