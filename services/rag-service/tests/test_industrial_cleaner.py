import unittest
from pathlib import Path

from app.clean import ChunkQuality, IndustrialCleaner
from app.ingestion.models import (
    BlockType,
    DocumentBlock,
    ParsedPage,
    PdfType,
    StructuredDocument,
)


class IndustrialCleanerTests(unittest.TestCase):
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

    def test_removes_repeated_header_but_preserves_industrial_symbols(self) -> None:
        document = self.build_document(
            [
                DocumentBlock(
                    block_id="p1-t1",
                    page_number=1,
                    kind=BlockType.TEXT,
                    content="维修手册\n主轴零件 A-102，尺寸 Φ20±0.02，粗糙度 Ra3.2。",
                ),
                DocumentBlock(
                    block_id="p2-t1",
                    page_number=2,
                    kind=BlockType.TEXT,
                    content="维修手册\n拧紧螺栓 M8，扭矩 30 N。",
                ),
            ]
        )

        cleaned = IndustrialCleaner().clean_document(document)
        text = "\n".join(block.clean_text for block in cleaned)

        self.assertNotIn("维修手册", text)
        self.assertIn("Φ20±0.02", text)
        self.assertIn("Ra3.2", text)
        self.assertIn("M8", text)

    def test_table_markdown_becomes_semantic_rows(self) -> None:
        document = self.build_document(
            [
                DocumentBlock(
                    block_id="p1-table1",
                    page_number=1,
                    kind=BlockType.TABLE,
                    content="| 编号 | 尺寸 |\n| --- | --- |\n| A-01 | 10 mm |",
                    metadata={"rows": 2, "columns": 2},
                )
            ]
        )

        cleaned = IndustrialCleaner().clean_document(document)

        self.assertEqual(len(cleaned), 1)
        self.assertIn("编号: A-01", cleaned[0].clean_text)
        self.assertIn("尺寸: 10 mm", cleaned[0].clean_text)
        self.assertEqual(cleaned[0].quality, ChunkQuality.HIGH)

    def test_table_semantic_text_flattens_multi_row_headers(self) -> None:
        document = self.build_document(
            [
                DocumentBlock(
                    block_id="p1-table1",
                    page_number=1,
                    kind=BlockType.TABLE,
                    content=(
                        "| 部件 | 参数 | 参数 |\n"
                        "| --- | --- | --- |\n"
                        "|  | 最小值 | 最大值 |\n"
                        "| 主轴 | 10 mm | 20 mm |\n"
                        "| 部件 | 参数 | 参数 |"
                    ),
                    metadata={"rows": 4, "columns": 3},
                )
            ]
        )

        cleaned = IndustrialCleaner().clean_document(document)

        self.assertEqual(len(cleaned), 1)
        self.assertIn("部件: 主轴", cleaned[0].clean_text)
        self.assertIn("参数/最小值: 10 mm", cleaned[0].clean_text)
        self.assertIn("参数/最大值: 20 mm", cleaned[0].clean_text)
        self.assertNotIn("表格行2: 部件", cleaned[0].clean_text)

    def test_repairs_chinese_pdf_line_wraps_and_units(self) -> None:
        document = self.build_document(
            [
                DocumentBlock(
                    block_id="p1-t1",
                    page_number=1,
                    kind=BlockType.TEXT,
                    content="主轴轴承安装前应检查\n润滑油状态，温度不得超过 80 ° C。\n1. 保持设备断电。\n2. 安装防护罩。",
                )
            ]
        )

        cleaned = IndustrialCleaner().clean_document(document)

        self.assertEqual(len(cleaned), 1)
        self.assertIn("安装前应检查润滑油状态", cleaned[0].clean_text)
        self.assertIn("80°C", cleaned[0].clean_text)
        self.assertIn("1. 保持设备断电。\n2. 安装防护罩。", cleaned[0].clean_text)


if __name__ == "__main__":
    unittest.main()
