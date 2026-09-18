import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from app.storage import ObjectStorageClient, ObjectStorageConfig, object_key_for_path


class FakeObjectResult:
    etag = "etag-1"
    version_id = "version-1"


class FakeObjectClient:
    def __init__(self) -> None:
        self.buckets: set[str] = set()
        self.uploads: list[tuple[str, str, str, str]] = []

    def bucket_exists(self, bucket: str) -> bool:
        return bucket in self.buckets

    def make_bucket(self, bucket: str) -> None:
        self.buckets.add(bucket)

    def fput_object(self, bucket: str, key: str, path: str, content_type: str):
        self.uploads.append((bucket, key, path, content_type))
        return FakeObjectResult()


class ObjectStorageTests(unittest.TestCase):
    def test_object_key_contains_relative_path_and_content_digest(self) -> None:
        with TemporaryDirectory() as directory:
            root = Path(directory)
            path = root / "drawings" / "pump.dxf"
            path.parent.mkdir()
            path.write_text("LINE", encoding="utf-8")

            key = object_key_for_path(path, root=root, prefix="cad")

        self.assertTrue(key.startswith("cad/drawings/pump-"))
        self.assertTrue(key.endswith(".dxf"))

    def test_upload_creates_bucket_and_returns_storage_metadata(self) -> None:
        client = FakeObjectClient()
        storage = ObjectStorageClient(
            ObjectStorageConfig(bucket="cad-source", prefix="raw"),
            client=client,
        )
        with TemporaryDirectory() as directory:
            path = Path(directory) / "manual.dxf"
            path.write_bytes(b"0")
            stored = storage.upload_file(path)

        self.assertEqual(client.buckets, {"cad-source"})
        self.assertEqual(stored.bucket, "cad-source")
        self.assertTrue(stored.key.startswith("raw/manual-"))
        self.assertEqual(stored.etag, "etag-1")
        self.assertEqual(stored.version_id, "version-1")


if __name__ == "__main__":
    unittest.main()
