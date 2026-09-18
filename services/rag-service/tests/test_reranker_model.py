import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.reranker.model import _validate_local_model_path


class RerankerModelValidationTests(unittest.TestCase):
    def test_incomplete_local_checkout_reports_missing_files(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            model_dir = Path(temp_dir)
            (model_dir / "config.json").write_text("{}", encoding="utf-8")

            with self.assertRaisesRegex(
                RuntimeError,
                "model.safetensors, tokenizer.json, sentencepiece.bpe.model",
            ):
                _validate_local_model_path(str(model_dir))

    def test_complete_local_checkout_passes_validation(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            model_dir = Path(temp_dir)
            for name in (
                "config.json",
                "model.safetensors",
                "tokenizer.json",
                "sentencepiece.bpe.model",
            ):
                (model_dir / name).write_bytes(b"model")

            with patch(
                "app.reranker.model._EXPECTED_LOCAL_FILE_SIZES",
                {
                    "model.safetensors": 5,
                    "tokenizer.json": 5,
                    "sentencepiece.bpe.model": 5,
                },
            ):
                _validate_local_model_path(str(model_dir))


if __name__ == "__main__":
    unittest.main()
