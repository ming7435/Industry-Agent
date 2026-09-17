import json
import unittest

from app.ingestion.models import BlockType, BoundingBox, DocumentBlock, PdfType
from app.ingestion.pdf_parser import (
    PdfParserConfig,
    _classify_pdf,
    _table_to_markdown,
)
from app.ingestion.vision import QwenVLClient, QwenVLConfig


class FakeResponse:
    def __init__(self, body: bytes) -> None:
        self.body = body

    def __enter__(self) -> "FakeResponse":
        return self

    def __exit__(self, *args: object) -> None:
        return None

    def read(self) -> bytes:
        return self.body


class VisionClientTests(unittest.TestCase):
    def test_sends_data_url_and_reads_description(self) -> None:
        requests: list[object] = []

        def opener(request: object, timeout: float) -> FakeResponse:
            requests.append(request)
            return FakeResponse(
                json.dumps(
                    {"choices": [{"message": {"content": "零件编号：A-01"}}]},
                    ensure_ascii=False,
                ).encode("utf-8")
            )

        client = QwenVLClient(QwenVLConfig(api_key="test-key"), opener=opener)
        description = client.describe_image(
            b"image-bytes",
            media_type="image/png",
            filename="part.png",
            page_number=2,
            prompt="describe",
        )

        self.assertEqual(description, "零件编号：A-01")
        self.assertEqual(len(requests), 1)
        request = requests[0]
        payload = json.loads(request.data.decode("utf-8"))
        content = payload["messages"][0]["content"]
        self.assertEqual(payload["model"], "qwen-vl-max")
        self.assertEqual(content[0]["text"], "describe")
        self.assertTrue(content[1]["image_url"]["url"].startswith("data:image/png;base64,"))


class PdfIngestionHelpersTests(unittest.TestCase):
    def test_classifies_empty_text_as_scanned(self) -> None:
        self.assertEqual(_classify_pdf([0, 4], minimum=20), PdfType.SCANNED)

    def test_classifies_mixed_document(self) -> None:
        self.assertEqual(_classify_pdf([30, 0], minimum=20), PdfType.MIXED)

    def test_table_is_converted_to_markdown(self) -> None:
        markdown = _table_to_markdown([["编号", "尺寸"], ["A|1", "10 mm"]])
        self.assertEqual(markdown, "| 编号 | 尺寸 |\n| --- | --- |\n| A\\|1 | 10 mm |")

    def test_visual_block_keeps_placeholder_and_description(self) -> None:
        block = DocumentBlock(
            block_id="p1-i1",
            page_number=1,
            kind=BlockType.IMAGE,
            content="尺寸：10 mm；零件编号：A-01",
            bbox=BoundingBox(0, 0, 10, 10),
            placeholder="[[IMAGE:p1-i1]]",
        )
        self.assertIn("[[IMAGE:p1-i1]]", block.render())
        self.assertIn("零件编号：A-01", block.render())
        self.assertNotIn("[[IMAGE:p1-i1]]", block.render(include_placeholder=False))

    def test_parser_config_rejects_invalid_dpi(self) -> None:
        with self.assertRaises(ValueError):
            PdfParserConfig(render_dpi=0)


if __name__ == "__main__":
    unittest.main()
