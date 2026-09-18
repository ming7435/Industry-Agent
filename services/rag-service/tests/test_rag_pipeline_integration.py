import unittest
from pathlib import Path

from app.chunk import ChunkerConfig, build_chunks
from app.embedding import EmbeddingConfig, embed_chunks
from app.ingestion.models import (
    BlockType,
    DocumentBlock,
    ParsedPage,
    PdfType,
    StructuredDocument,
)


class FakeEmbeddingClient:
    @property
    def dimension(self) -> int | None:
        return 2

    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        return [[float(len(text)), 1.0] for text in texts]


class RagPipelineIntegrationTests(unittest.TestCase):
    def test_document_can_flow_from_chunking_to_embedding(self) -> None:
        blocks = [
            DocumentBlock(
                block_id="p1-t1",
                page_number=1,
                kind=BlockType.TEXT,
                content="主轴维护步骤：先断电，再拆卸端盖。",
            ),
            DocumentBlock(
                block_id="p1-table1",
                page_number=1,
                kind=BlockType.TABLE,
                content="| 项目 | 参数 |\n| --- | --- |\n| 润滑油 | ISO VG 46 |",
            ),
        ]
        document = StructuredDocument(
            source_name="manual.pdf",
            source_path=Path("manual.pdf"),
            pdf_type=PdfType.TEXT,
            pages=[
                ParsedPage(
                    page_number=1,
                    width=100,
                    height=100,
                    text_characters=50,
                    has_images=False,
                    has_drawings=False,
                    blocks=blocks,
                )
            ],
            blocks=blocks,
            assets=[],
        )

        chunks = build_chunks(document, config=ChunkerConfig(min_characters=1))
        records = embed_chunks(
            chunks,
            FakeEmbeddingClient(),
            config=EmbeddingConfig(min_characters=1),
        )

        self.assertEqual(len(chunks), 2)
        self.assertEqual(len(records), 2)
        self.assertEqual(records[0].source_name, "manual.pdf")
        self.assertEqual(records[0].page_numbers, [1])
        self.assertEqual(len(records[0].vector), 2)


if __name__ == "__main__":
    unittest.main()
