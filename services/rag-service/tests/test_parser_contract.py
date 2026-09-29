from pathlib import Path

from app.ingestion.parser import parse_markdown


def test_markdown_parser_handles_tables_and_remote_image_references(tmp_path: Path):
    source = tmp_path / "guide.md"
    source.write_text(
        "# 检查指南\n\n"
        "| 项目 | 结果 |\n| --- | --- |\n| 温度 | 正常 |\n\n"
        "![远程示意图](https://example.invalid/image.png)\n",
        encoding="utf-8",
    )

    document = parse_markdown(source)

    assert any(block.kind.value == "table" for block in document.blocks)
    assert any(block.metadata.get("source") == "markdown_image_reference" for block in document.blocks)
