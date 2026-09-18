import unittest

from app.embedding import VectorRecord
from app.milvus.writer import MilvusVectorWriter, MilvusWriteError
from app.milvus.schema import MilvusConfig


class FakeMilvusClient:
    def __init__(self) -> None:
        self.collections = ["old_a", "old_b"]
        self.inserted: list[dict] = []
        self.deleted: list[str] = []
        self.flushed = False

    def list_collections(self) -> list[str]:
        return list(self.collections)

    def drop_collection(self, collection_name: str) -> None:
        self.collections.remove(collection_name)

    def insert(self, collection_name: str, data: list[dict]) -> None:
        self.inserted.extend(data)

    def delete(self, collection_name: str, ids: list[str]) -> None:
        self.deleted.extend(ids)

    def flush(self, collection_name: str) -> None:
        self.flushed = True


class ExistingSchemaMilvusClient(FakeMilvusClient):
    def has_collection(self, collection_name: str) -> bool:
        return True

    def describe_collection(self, collection_name: str) -> dict:
        field_names = [
            "id",
            "chunk_id",
            "text",
            "source_name",
            "source_path",
            "source_format",
            "version_id",
            "entity_id",
            "project_id",
            "layer_name",
            "device_id",
            "tenant_id",
            "page_numbers_json",
            "chunk_type",
            "quality",
            "contains_table",
            "contains_image",
            "contains_cad",
            "metadata_json",
            "vector",
        ]
        return {"fields": [{"name": name} for name in field_names]}


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

    def test_existing_collection_without_cad_field_is_rejected(self) -> None:
        client = ExistingSchemaMilvusClient()
        writer = MilvusVectorWriter(MilvusConfig(collection_name="target"), client=client)

        with self.assertRaisesRegex(MilvusWriteError, "drawing_id"):
            writer.recreate_collection(dimension=2)

    def test_delete_records_removes_stale_chunk_ids(self) -> None:
        client = FakeMilvusClient()
        writer = MilvusVectorWriter(
            MilvusConfig(collection_name="target", batch_size=2),
            client=client,
        )

        deleted = writer.delete_records(["old-1", "old-2", "old-3"])

        self.assertEqual(deleted, 3)
        self.assertEqual(client.deleted, ["old-1", "old-2", "old-3"])


if __name__ == "__main__":
    unittest.main()
