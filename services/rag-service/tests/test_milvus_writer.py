import unittest

from app.embedding import VectorRecord
from app.milvus.writer import MilvusVectorWriter
from app.milvus.schema import MilvusConfig


class FakeMilvusClient:
    def __init__(self) -> None:
        self.collections = ["old_a", "old_b"]
        self.inserted: list[dict] = []
        self.flushed = False

    def list_collections(self) -> list[str]:
        return list(self.collections)

    def drop_collection(self, collection_name: str) -> None:
        self.collections.remove(collection_name)

    def insert(self, collection_name: str, data: list[dict]) -> None:
        self.inserted.extend(data)

    def flush(self, collection_name: str) -> None:
        self.flushed = True


class MilvusWriterTests(unittest.TestCase):
    def test_drop_all_collections(self) -> None:
        client = FakeMilvusClient()
        writer = MilvusVectorWriter(MilvusConfig(collection_name="target"), client=client)

        dropped = writer.drop_all_collections()

        self.assertEqual(dropped, ["old_a", "old_b"])
        self.assertEqual(client.collections, [])

    def test_insert_records_flattens_metadata(self) -> None:
        client = FakeMilvusClient()
        writer = MilvusVectorWriter(MilvusConfig(collection_name="target"), client=client)
        record = VectorRecord(
            id="c1",
            chunk_id="c1",
            text="主轴维护",
            vector=[0.1, 0.2],
            source_name="manual.pdf",
            source_path="data/manual.pdf",
            source_format="pdf",
            page_numbers=[1, 2],
            chunk_type="text_chunk",
            quality="high",
            contains_table=False,
            contains_image=False,
            contains_cad=False,
            metadata={"source_name": "manual.pdf"},
        )

        inserted = writer.insert_records([record])

        self.assertEqual(inserted, 1)
        self.assertTrue(client.flushed)
        self.assertEqual(client.inserted[0]["id"], "c1")
        self.assertEqual(client.inserted[0]["page_numbers_json"], "[1, 2]")
        self.assertEqual(client.inserted[0]["source_path"], "data/manual.pdf")
        self.assertEqual(client.inserted[0]["source_format"], "pdf")
        self.assertEqual(client.inserted[0]["vector"], [0.1, 0.2])


if __name__ == "__main__":
    unittest.main()
