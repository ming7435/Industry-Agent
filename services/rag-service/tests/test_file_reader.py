import tempfile
import unittest
from pathlib import Path

from app.ingestion.file_reader import (
    FileReadError,
    iter_file_chunks,
    read_file,
    read_text_file,
)


TEST_ROOT = Path(__file__).resolve().parents[1] / ".test-tmp"


class FileReaderTests(unittest.TestCase):
    def temporary_directory(self) -> tempfile.TemporaryDirectory[str]:
        TEST_ROOT.mkdir(exist_ok=True)
        return tempfile.TemporaryDirectory(dir=TEST_ROOT)

    def test_reads_markdown_as_raw_bytes(self) -> None:
        with self.temporary_directory() as directory:
            path = Path(directory) / "sample.md"
            original = b"# Title\r\n\r\n**content**\n"
            path.write_bytes(original)

            self.assertEqual(read_file(path), original)

    def test_reads_binary_image_data_without_parsing(self) -> None:
        with self.temporary_directory() as directory:
            path = Path(directory) / "sample.png"
            original = b"\x89PNG\r\n\x1a\n\x00\x00binary-data"
            path.write_bytes(original)

            self.assertEqual(read_file(path), original)

    def test_reads_unknown_extension_as_raw_bytes(self) -> None:
        with self.temporary_directory() as directory:
            path = Path(directory) / "sample.unknown"
            original = bytes(range(256))
            path.write_bytes(original)

            self.assertEqual(read_file(path), original)

    def test_reads_large_file_in_chunks(self) -> None:
        with self.temporary_directory() as directory:
            path = Path(directory) / "large.bin"
            original = bytes(range(256)) * 100
            path.write_bytes(original)

            chunks = list(iter_file_chunks(path, chunk_size=17))

            self.assertGreater(len(chunks), 1)
            self.assertTrue(all(len(chunk) <= 17 for chunk in chunks))
            self.assertEqual(b"".join(chunks), original)

    def test_decodes_explicitly_requested_text_encoding(self) -> None:
        with self.temporary_directory() as directory:
            path = Path(directory) / "sample.md"
            original = "Industry data"
            path.write_bytes(original.encode("utf-8"))

            self.assertEqual(read_text_file(path, encoding="utf-8"), original)

    def test_missing_file_has_a_clear_error(self) -> None:
        with self.temporary_directory() as directory:
            path = Path(directory) / "missing.bin"

            with self.assertRaises(FileNotFoundError):
                read_file(path)

    def test_invalid_chunk_size_is_rejected(self) -> None:
        with self.temporary_directory() as directory:
            path = Path(directory) / "sample.bin"
            path.write_bytes(b"data")

            with self.assertRaises(ValueError):
                list(iter_file_chunks(path, chunk_size=0))


if __name__ == "__main__":
    unittest.main()
