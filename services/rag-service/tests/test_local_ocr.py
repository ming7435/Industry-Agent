import unittest

from app.ingestion.ocr import LocalOcrClient, LocalOcrConfig, OcrError


class FakePaddleEngine:
    def ocr(self, path: str, cls: bool = True):
        return [[[[0, 0], [1, 0], [1, 1], [0, 1]], ("主轴报警 ALM-01", 0.98)]]


class LocalOcrTests(unittest.TestCase):
    def test_paddleocr_result_becomes_image_description(self) -> None:
        client = LocalOcrClient(
            LocalOcrConfig(min_characters=1),
            ocr_engine=FakePaddleEngine(),
        )

        description = client.describe_image(
            b"image-bytes",
            media_type="image/png",
            filename="page.png",
            page_number=2,
            prompt="ignored",
        )

        self.assertIn("本地OCR识别结果", description)
        self.assertIn("主轴报警 ALM-01", description)

    def test_rejects_empty_ocr_result(self) -> None:
        class EmptyEngine:
            def ocr(self, path: str, cls: bool = True):
                return []

        client = LocalOcrClient(
            LocalOcrConfig(min_characters=1),
            ocr_engine=EmptyEngine(),
        )

        with self.assertRaises(OcrError):
            client.describe_image(
                b"image-bytes",
                media_type="image/png",
                filename="page.png",
                page_number=1,
                prompt="ignored",
            )


if __name__ == "__main__":
    unittest.main()
