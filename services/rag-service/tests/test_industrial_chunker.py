import unittest
from pathlib import Path

from app.chunk import ChunkerConfig, IndustrialChunker, build_chunks
from app.ingestion.models import (
    BlockType,
    DocumentBlock,
    ParsedPage,
    PdfType,
    StructuredDocument,
)


class IndustrialChunkerTests(unittest.TestCase):
    def build_document(self, blocks: list[DocumentBlock]) -> StructuredDocument:
        pages = []
        for page_number in sorted({block.page_number for block in blocks}):
            page_blocks = [block for block in blocks if block.page_number == page_number]
            pages.append(
                ParsedPage(
                    page_number=page_number,
                    width=100,
                    height=100,
                    text_characters=sum(len(block.content) for block in page_blocks),
                    has_images=any(block.kind is BlockType.IMAGE for block in page_blocks),
                    has_drawings=any(block.kind is BlockType.CAD_DRAWING for block in page_blocks),
                    blocks=page_blocks,
                )
            )
        return StructuredDocument(
            source_name="manual.pdf",
            source_path=Path("manual.pdf"),
            pdf_type=PdfType.MIXED,
            pages=pages,
            blocks=blocks,
            assets=[],
        )

    def test_pending_visual_block_is_filtered_from_embedding(self) -> None:
        document = self.build_document(
            [
                DocumentBlock(
                    block_id="p1-i1",
                    page_number=1,
                    kind=BlockType.IMAGE,
                    content="[待Qwen-VL识别]",
                    placeholder="[[IMAGE:p1-i1]]",
                    metadata={"recognition_status": "pending"},
                )
            ]
        )

        chunks = build_chunks(document)

        self.assertEqual(chunks, [])

    def test_recognized_cad_description_gets_medium_quality_metadata(self) -> None:
        document = self.build_document(
            [
                DocumentBlock(
                    block_id="p1-page",
                    page_number=1,
                    kind=BlockType.CAD_DRAWING,
                    content="机械零件图。图号 DRW-88，材料 45#钢，关键尺寸 Φ30±0.01。",
                    placeholder="[[CAD_DRAWING:p1-page]]",
                    metadata={"recognition_status": "recognized"},
                )
            ]
        )

        chunks = build_chunks(document)

        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0].metadata["quality"], "medium")
        self.assertTrue(chunks[0].metadata["contains_cad"])
        self.assertIn("DRW-88", chunks[0].text)

    def test_structure_aware_chunking_keeps_table_independent(self) -> None:
        document = self.build_document(
            [
                DocumentBlock("p1-t1", 1, BlockType.TEXT, "主轴维护步骤说明，拆卸前断电并挂牌。"),
                DocumentBlock(
                    "p1-table1",
                    1,
                    BlockType.TABLE,
                    "| 项目 | 参数 |\n| --- | --- |\n| 润滑油 | ISO VG 46 |",
                ),
                DocumentBlock("p1-t2", 1, BlockType.TEXT, "装回后检查振动值和温升。"),
            ]
        )

        chunks = build_chunks(document, config=ChunkerConfig(min_characters=1))

        self.assertEqual([chunk.metadata["chunk_type"] for chunk in chunks], [
            "text_chunk",
            "table_chunk",
            "text_chunk",
        ])

    def test_image_chunk_merges_neighbor_text_context(self) -> None:
        document = self.build_document(
            [
                DocumentBlock("p1-t1", 1, BlockType.TEXT, "下图为主轴组件拆卸位置。"),
                DocumentBlock(
                    "p1-i1",
                    1,
                    BlockType.IMAGE,
                    "图中显示主轴组件，零件编号 SP-01。",
                    metadata={"recognition_status": "recognized"},
                ),
                DocumentBlock("p1-t2", 1, BlockType.TEXT, "拆卸时注意支撑轴承座。"),
            ]
        )

        chunks = build_chunks(document, config=ChunkerConfig(min_characters=1))

        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0].metadata["chunk_type"], "mixed_chunk")
        self.assertIn("下图为主轴组件拆卸位置", chunks[0].text)
        self.assertIn("SP-01", chunks[0].text)
        self.assertIn("拆卸时注意支撑轴承座", chunks[0].text)

    def test_cad_chunk_is_independent_with_short_title_context(self) -> None:
        document = self.build_document(
            [
                DocumentBlock("p1-t1", 1, BlockType.TEXT, "图纸：主轴端盖"),
                DocumentBlock(
                    "p1-page",
                    1,
                    BlockType.CAD_DRAWING,
                    "图号 DRW-88，材料 45#钢，关键尺寸 Φ30±0.01。",
                    metadata={"recognition_status": "recognized"},
                ),
                DocumentBlock("p1-t2", 1, BlockType.TEXT, "后续正文说明装配注意事项。"),
            ]
        )

        chunks = build_chunks(document, config=ChunkerConfig(min_characters=1))

        self.assertEqual(len(chunks), 1)
        self.assertEqual(chunks[0].metadata["chunk_type"], "cad_chunk")
        self.assertIn("图纸：主轴端盖", chunks[0].text)
        self.assertIn("DRW-88", chunks[0].text)

    def test_low_quality_scanned_page_stays_independent(self) -> None:
        document = self.build_document(
            [
                DocumentBlock("p1-t1", 1, BlockType.TEXT, "扫描页前文。"),
                DocumentBlock(
                    "p1-page",
                    1,
                    BlockType.PAGE_IMAGE,
                    "整页扫描识别内容较少。",
                    metadata={"recognition_status": "pending"},
                ),
                DocumentBlock("p1-t2", 1, BlockType.TEXT, "扫描页后文。"),
            ]
        )

        chunks = build_chunks(document, config=ChunkerConfig(min_characters=1))

        self.assertEqual(len(chunks), 3)
        self.assertEqual(chunks[1].metadata["chunk_type"], "scanned_page_chunk")
        self.assertEqual(chunks[1].metadata["quality"], "low")

        document = self.build_document(
            [
                DocumentBlock(
                    block_id="p1-t1",
                    page_number=1,
                    kind=BlockType.TEXT,
                    content="段落一" * 80 + "\n\n" + "段落二" * 80,
                )
            ]
        )

        chunks = build_chunks(
            document,
            config=ChunkerConfig(max_characters=120, overlap_characters=20, min_characters=1),
        )

        self.assertGreater(len(chunks), 1)
        self.assertTrue(all(len(chunk.text) <= 120 for chunk in chunks))
    def test_heading_starts_new_text_chunk_group(self) -> None:
        document = self.build_document(
            [
                DocumentBlock("p1-h1", 1, BlockType.TEXT, "第一章 维护", metadata={"is_heading": True}),
                DocumentBlock("p1-t1", 1, BlockType.TEXT, "主轴维护步骤说明，拆卸前断电并挂牌。"),
                DocumentBlock("p1-h2", 1, BlockType.TEXT, "第二章 报警", metadata={"is_heading": True}),
                DocumentBlock("p1-t2", 1, BlockType.TEXT, "报警 ALM-01 表示润滑压力不足。"),
            ]
        )

        chunks = build_chunks(document, config=ChunkerConfig(min_characters=1))

        self.assertEqual(len(chunks), 2)
        self.assertIn("第一章 维护", chunks[0].text)
        self.assertNotIn("第二章 报警", chunks[0].text)
        self.assertIn("第二章 报警", chunks[1].text)
    def test_long_text_prefers_sentence_boundary_when_splitting(self) -> None:
        document = self.build_document(
            [
                DocumentBlock(
                    block_id="p1-t1",
                    page_number=1,
                    kind=BlockType.TEXT,
                    content="第一句说明主轴维护需要断电挂牌。第二句说明拆卸轴承座前要做好支撑。第三句说明复装后检查温升和振动。",
                )
            ]
        )

        chunks = build_chunks(
            document,
            config=ChunkerConfig(
                max_characters=60,
                overlap_characters=0,
                min_characters=1,
                include_source_prefix=False,
            ),
        )

        self.assertGreater(len(chunks), 1)
        self.assertTrue(chunks[0].text.endswith("。"))
        self.assertTrue(all(len(chunk.text) <= 60 for chunk in chunks))


if __name__ == "__main__":
    unittest.main()
