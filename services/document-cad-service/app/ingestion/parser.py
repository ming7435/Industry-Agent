"""Unified document parsers for offline RAG ingestion."""

from __future__ import annotations

import csv
import io
import mimetypes
import os
import re
import shutil
import subprocess
import tempfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .file_reader import PathLike, read_file
from .models import (
    BlockType,
    BoundingBox,
    DocumentBlock,
    ImageAsset,
    ParsedPage,
    PdfType,
    StructuredDocument,
)
from .pdf_parser import DEFAULT_VISION_PROMPT, parse_pdf
from .reader import DocumentSource
from .vision import ImageDescriber, VisionError


IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".tif", ".tiff", ".bmp", ".webp", ".jp2"}
# 注册 jp2 的 MIME，使视觉识别上传时 media_type 准确（默认 mimetypes 不识别 .jp2）
mimetypes.add_type("image/jp2", ".jp2")
IMAGE_PATTERN = re.compile(r"!\[([^\]]*)\]\((?:<)?([^)>]+)(?:>)?\)")
TABLE_ROWS_PER_BLOCK = 500
CAD_ENTITY_TYPES = {
    "LINE",
    "LWPOLYLINE",
    "POLYLINE",
    "CIRCLE",
    "ARC",
    "ELLIPSE",
    "TEXT",
    "MTEXT",
    "DIMENSION",
    "INSERT",
}
SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".txt",
    ".md",
    ".markdown",
    ".docx",
    ".csv",
    ".xlsx",
    *IMAGE_EXTENSIONS,
    ".dxf",
    ".dwg",
    ".step",
    ".stp",
}


class CsvParseError(RuntimeError):
    pass


class DocxParseError(RuntimeError):
    pass


class ImageParseError(RuntimeError):
    pass


class XlsxParseError(RuntimeError):
    pass


class DxfParseError(RuntimeError):
    """Raised when DXF parsing is unavailable or fails."""


class DwgConvertError(RuntimeError):
    """Raised when DWG conversion cannot be completed."""


class UnsupportedDocumentError(ValueError):
    """Raised when no parser is registered for a file extension."""


@dataclass(frozen=True)
class DwgConverterConfig:
    """External DWG conversion settings."""

    converter_path: str | None = None
    output_version: str = "ACAD2018"
    output_format: str = "DXF"
    recursive: bool = False

    @classmethod
    def from_env(cls) -> "DwgConverterConfig":
        return cls(converter_path=os.getenv("ODA_FILE_CONVERTER"))


def parse_document(
    path: PathLike,
    *,
    image_describer: ImageDescriber | None = None,
    dwg_config: DwgConverterConfig | None = None,
    source_root: Path | None = None,
) -> StructuredDocument:
    """Parse a supported file and return a common StructuredDocument."""

    if path is None or (isinstance(path, str) and not path.strip()):
        raise ValueError("The input path must not be empty.")
    source = DocumentSource.from_path(path)
    suffix = source.suffix
    if suffix == ".pdf":
        document = parse_pdf(source.path, image_describer=image_describer)
    elif suffix == ".txt":
        document = parse_txt(source.path)
    elif suffix in {".md", ".markdown"}:
        document = parse_markdown(source.path, image_describer=image_describer)
    elif suffix == ".docx":
        document = parse_docx(source.path, image_describer=image_describer)
    elif suffix == ".csv":
        document = parse_csv(source.path)
    elif suffix == ".xlsx":
        document = parse_xlsx(source.path)
    elif suffix in IMAGE_EXTENSIONS:
        document = parse_image(source.path, image_describer=image_describer)
    elif suffix == ".dxf":
        document = parse_dxf(source.path)
    elif suffix in {".step", ".stp"}:
        document = parse_step(source.path)
    elif suffix == ".dwg":
        document = parse_dwg(source.path, config=dwg_config)
    else:
        supported = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise UnsupportedDocumentError(
            f"Unsupported document extension '{suffix or '<none>'}'. Supported: {supported}"
        )

    document.metadata.update(
        {
            "document_id": source.identity(root=source_root),
            "content_hash": source.sha256(),
            "file_size": source.size,
        }
    )
    return document


def parse_txt(path: str | Path) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".txt"})
    text, encoding = source.read_text()
    paragraphs = [part.strip() for part in re.split(r"\n\s*\n", text) if part.strip()]
    if not paragraphs and text.strip():
        paragraphs = [text.strip()]
    blocks = [
        make_text_block(f"p1-t{index}", paragraph, metadata={"source": "text_file", "encoding": encoding})
        for index, paragraph in enumerate(paragraphs, start=1)
    ]
    return text_document(source.path, blocks, source_format="txt", metadata={"encoding": encoding, "paragraph_count": len(blocks)})


def parse_csv(path: str | Path) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".csv"})
    text, encoding = source.read_text()
    try:
        rows = list(csv.reader(io.StringIO(text)))
    except csv.Error as exc:
        raise CsvParseError(f"Unable to parse CSV '{source.path}': {exc}") from exc
    if not rows:
        return text_document(source.path, [], source_format="csv", metadata={"encoding": encoding, "row_count": 0})

    header, data_rows = rows[0], rows[1:]
    batches = [data_rows[start : start + TABLE_ROWS_PER_BLOCK] for start in range(0, len(data_rows), TABLE_ROWS_PER_BLOCK)] or [[]]
    blocks: list[DocumentBlock] = []
    for part, batch in enumerate(batches, start=1):
        table_rows = [header, *batch]
        block_id = f"p1-table{part}"
        blocks.append(DocumentBlock(
            block_id=block_id,
            page_number=1,
            kind=BlockType.TABLE,
            content=markdown_table(table_rows),
            placeholder=f"[[TABLE:{block_id}]]",
            metadata={
                "source": "csv",
                "encoding": encoding,
                "row_start": 2 + (part - 1) * TABLE_ROWS_PER_BLOCK,
                "row_end": 1 + (part - 1) * TABLE_ROWS_PER_BLOCK + len(batch),
                "rows": len(table_rows),
                "columns": max((len(row) for row in table_rows), default=0),
            },
        ))
    return text_document(source.path, blocks, source_format="csv", metadata={"encoding": encoding, "row_count": len(rows)})


def parse_xlsx(path: str | Path) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".xlsx"})
    workbook = _load_workbook(source.path)
    blocks: list[DocumentBlock] = []
    page_numbers: list[int] = []
    try:
        for page_number, worksheet in enumerate(workbook.worksheets, start=1):
            rows = [["" if value is None else value for value in row] for row in worksheet.iter_rows(values_only=True)]
            while rows and not any(str(value).strip() for value in rows[-1]):
                rows.pop()
            if not rows:
                continue
            page_numbers.append(page_number)
            header, data_rows = rows[0], rows[1:]
            batches = [data_rows[start : start + TABLE_ROWS_PER_BLOCK] for start in range(0, len(data_rows), TABLE_ROWS_PER_BLOCK)] or [[]]
            for part, batch in enumerate(batches, start=1):
                table_rows = [header, *batch]
                block_id = f"p{page_number}-table{part}"
                blocks.append(DocumentBlock(
                    block_id=block_id,
                    page_number=page_number,
                    kind=BlockType.TABLE,
                    content=markdown_table(table_rows),
                    placeholder=f"[[TABLE:{block_id}]]",
                    metadata={"source": "xlsx", "worksheet": worksheet.title, "table_part": part, "rows": len(table_rows), "columns": max((len(row) for row in table_rows), default=0)},
                ))
        worksheet_count = len(workbook.sheetnames)
    finally:
        workbook.close()
    return structured_document(source.path, blocks, source_format="xlsx", page_numbers=page_numbers or [1], metadata={"worksheet_count": worksheet_count})


def parse_image(path: str | Path, *, image_describer: ImageDescriber | None = None, vision_prompt: str = DEFAULT_VISION_PROMPT) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions=IMAGE_EXTENSIONS)
    asset = image_asset_from_file(source.path)
    description, status = describe_visual(asset, image_describer=image_describer, prompt=vision_prompt)
    asset.description = description
    block = DocumentBlock(
        block_id="p1-image",
        page_number=1,
        kind=BlockType.IMAGE,
        content=description,
        placeholder="[[IMAGE:p1-image]]",
        metadata={"source": "standalone_image", "asset_id": asset.asset_id, "media_type": asset.media_type, "recognition_status": status},
    )
    return structured_document(source.path, [block], source_format=source.suffix.lstrip("."), assets=[asset], metadata={"recognition_status": status})


def parse_markdown(path: str | Path, *, image_describer: ImageDescriber | None = None, vision_prompt: str = DEFAULT_VISION_PROMPT) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".md", ".markdown"})
    text, encoding = source.read_text()
    blocks: list[DocumentBlock] = []
    assets: list[ImageAsset] = []
    heading_path: list[str] = []
    text_buffer: list[str] = []

    def add_text(content: str, metadata: dict[str, Any]) -> None:
        if content.strip():
            blocks.append(make_text_block(f"p1-t{len(blocks) + 1}", content.strip(), metadata=metadata))

    def flush_text() -> None:
        nonlocal text_buffer
        add_text("\n".join(text_buffer), {"source": "markdown", "encoding": encoding, "heading_path": list(heading_path)})
        text_buffer = []

    lines = text.splitlines()
    index = 0
    while index < len(lines):
        line = lines[index]
        heading = re.match(r"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$", line)
        if heading:
            flush_text()
            level, title = len(heading.group(1)), heading.group(2).strip()
            heading_path[:] = heading_path[: level - 1]
            heading_path.append(title)
            add_text(title, {"source": "markdown_heading", "heading_level": level, "heading_path": list(heading_path), "is_heading": True})
            index += 1
            continue
        if _is_table_start(lines, index):
            flush_text()
            table_lines = [lines[index], lines[index + 1]]
            index += 2
            while index < len(lines) and _is_table_row(lines[index]):
                table_lines.append(lines[index])
                index += 1
            block_id = f"p1-table{len(blocks) + 1}"
            blocks.append(DocumentBlock(block_id, 1, BlockType.TABLE, "\n".join(table_lines), placeholder=f"[[TABLE:{block_id}]]", metadata={"source": "markdown_table", "heading_path": list(heading_path)}))
            continue
        image_match = IMAGE_PATTERN.search(line)
        if image_match:
            flush_text()
            reference = image_match.group(2).strip()
            local_image = _resolve_local_image(source.path, reference)
            if local_image is None:
                add_text(line, {"source": "markdown_image_reference", "image_alt": image_match.group(1), "image_reference": reference, "heading_path": list(heading_path)})
            else:
                asset = image_asset_from_file(local_image, asset_id=f"i{len(assets) + 1}")
                description, status = describe_visual(asset, image_describer=image_describer, prompt=vision_prompt)
                asset.description = description
                assets.append(asset)
                block_id = f"p1-{asset.asset_id}"
                blocks.append(DocumentBlock(
                    block_id, 1, BlockType.IMAGE,
                    f"图片说明：{image_match.group(1).strip()}\n{description}".strip(),
                    placeholder=f"[[IMAGE:{block_id}]]",
                    metadata={"source": "markdown_image", "asset_id": asset.asset_id, "image_reference": reference, "recognition_status": status, "heading_path": list(heading_path)},
                ))
            index += 1
            continue
        text_buffer.append(line)
        index += 1
    flush_text()
    return text_document(source.path, blocks, source_format="md", assets=assets, metadata={"encoding": encoding, "heading_count": sum(bool(block.metadata.get("is_heading")) for block in blocks), "image_count": len(assets)})


def parse_docx(path: str | Path, *, image_describer: ImageDescriber | None = None, vision_prompt: str = DEFAULT_VISION_PROMPT) -> StructuredDocument:
    source = DocumentSource.from_path(path, extensions={".docx"})
    document = _load_docx(source.path)
    blocks: list[DocumentBlock] = []
    assets: list[ImageAsset] = []
    heading_path: list[str] = []
    for body_index, element in enumerate(document.element.body.iterchildren(), start=1):
        tag = element.tag.rsplit("}", 1)[-1]
        if tag == "p":
            paragraph = _paragraph_from_element(document, element)
            text = paragraph.text.strip()
            style_name = str(paragraph.style.name or "")
            level = _heading_level(style_name)
            if text:
                metadata: dict[str, Any] = {"source": "docx_paragraph", "style": style_name, "body_index": body_index}
                if level:
                    heading_path[:] = heading_path[: level - 1]
                    heading_path.append(text)
                    metadata.update({"is_heading": True, "heading_level": level})
                if heading_path:
                    metadata["heading_path"] = list(heading_path)
                blocks.append(make_text_block(f"p1-t{len(blocks) + 1}", text, metadata=metadata))
            for relationship_id in _image_relationship_ids(element):
                asset = _docx_asset(document, relationship_id, len(assets) + 1)
                if asset is None:
                    continue
                description, status = describe_visual(asset, image_describer=image_describer, prompt=vision_prompt)
                asset.description = description
                assets.append(asset)
                block_id = f"p1-{asset.asset_id}"
                blocks.append(DocumentBlock(
                    block_id, 1, BlockType.IMAGE, description,
                    placeholder=f"[[IMAGE:{block_id}]]",
                    metadata={"source": "docx_embedded_image", "asset_id": asset.asset_id, "media_type": asset.media_type, "recognition_status": status, "heading_path": list(heading_path), "body_index": body_index},
                ))
        elif tag == "tbl":
            table = _table_from_element(document, element)
            rows = [[cell.text.strip() for cell in row.cells] for row in table.rows]
            content = markdown_table(rows)
            if content:
                block_id = f"p1-table{len(blocks) + 1}"
                blocks.append(DocumentBlock(block_id, 1, BlockType.TABLE, content, placeholder=f"[[TABLE:{block_id}]]", metadata={"source": "docx_table", "rows": len(rows), "columns": max((len(row) for row in rows), default=0), "heading_path": list(heading_path), "body_index": body_index}))
    return text_document(source.path, blocks, source_format="docx", assets=assets, metadata={"paragraph_count": sum(block.kind is BlockType.TEXT for block in blocks), "table_count": sum(block.kind is BlockType.TABLE for block in blocks), "image_count": len(assets)})


def parse_dxf(path: PathLike) -> StructuredDocument:
    """Extract CAD summary blocks and structured DXF entity metadata."""

    file_path = validate_input_path(path, {".dxf"})
    ezdxf = _load_ezdxf()
    try:
        drawing = ezdxf.readfile(str(file_path))
    except Exception as exc:
        raise DxfParseError(f"Unable to open DXF '{file_path}': {exc}") from exc

    spaces = [("model", drawing.modelspace())]
    try:
        layout_names = drawing.layouts.names()
    except (AttributeError, TypeError):
        layout_names = []
    for layout_name in layout_names:
        if str(layout_name).lower() == "model":
            continue
        try:
            spaces.append((str(layout_name), drawing.layout(layout_name)))
        except (AttributeError, KeyError, TypeError):
            continue

    entity_counts: Counter[str] = Counter()
    layer_counts: Counter[str] = Counter()
    texts: list[str] = []
    dimensions: list[str] = []
    inserts: list[str] = []
    coordinates: list[tuple[float, float]] = []
    entities: list[dict[str, Any]] = []

    for space_name, layout in spaces:
        for entity in layout:
            entity_type = str(entity.dxftype()).upper()
            layer_name = str(getattr(entity.dxf, "layer", "0"))
            entity_counts[entity_type] += 1
            layer_counts[layer_name] += 1
            text_value = ""
            dimension_value = ""
            block_name = ""
            if entity_type in {"TEXT", "MTEXT"}:
                text_value = _entity_text(entity)
                if text_value:
                    texts.append(text_value)
            elif entity_type == "DIMENSION":
                dimension_value = _dimension_text(entity)
                if dimension_value:
                    dimensions.append(dimension_value)
            elif entity_type == "INSERT":
                block_name = str(getattr(entity.dxf, "name", ""))
                if block_name:
                    inserts.append(block_name)
            entity_coordinates = _entity_coordinates(entity)
            coordinates.extend(entity_coordinates)
            entities.append(_dxf_entity_record(
                entity,
                entity_type=entity_type,
                layer_name=layer_name,
                space_name=space_name,
                text_value=text_value,
                dimension_value=dimension_value,
                block_name=block_name,
                coordinates=entity_coordinates,
            ))

    summary = _summary_text(file_path, entity_counts, layer_counts, texts, dimensions, inserts, coordinates)
    blocks: list[DocumentBlock] = [
        make_text_block(
            "p1-cad-summary",
            summary,
            metadata={
                "source": "dxf",
                "entity_counts": dict(entity_counts),
                "layer_counts": dict(layer_counts),
                "entity_types": sorted(entity_counts),
                "layers": sorted(layer_counts),
                "drawing_name": file_path.stem,
                "file_format": "dxf",
            },
        )
    ]
    if texts:
        blocks.append(
            make_text_block(
                "p1-cad-text",
                "图纸文字标注：" + "；".join(_unique(texts)),
                metadata={"source": "dxf_text_entities", "entity_types": ["TEXT", "MTEXT"]},
            )
        )
    if dimensions:
        blocks.append(
            make_text_block(
                "p1-cad-dimensions",
                "图纸尺寸标注：" + "；".join(_unique(dimensions)),
                metadata={"source": "dxf_dimensions", "entity_types": ["DIMENSION"]},
            )
        )
    if inserts:
        blocks.append(
            make_text_block(
                "p1-cad-blocks",
                "图纸块引用：" + "；".join(_unique(inserts)),
                metadata={"source": "dxf_inserts", "entity_types": ["INSERT"]},
            )
        )
    text_block_count = 0
    for index, entity in enumerate(entities, start=1):
        entity_text = entity.get("text") or entity.get("block_name")
        if not entity_text or text_block_count >= MAX_ENTITY_TEXT_BLOCKS:
            continue
        text_block_count += 1
        blocks.append(
            make_text_block(
                f"p1-cad-entity{index}",
                _cad_entity_semantic_text(entity),
                metadata={
                    "source": "dxf_entity",
                    "entity_handle": entity.get("handle"),
                    "entity_type": entity.get("entity_type"),
                    "layer_name": entity.get("layer_name"),
                    "device_id": entity.get("device_id"),
                },
            )
        )
    blocks.extend(_cad_layer_blocks(entities))
    blocks.extend(_cad_entity_type_blocks(entities))

    document = structured_document(
        file_path,
        blocks,
        source_format="dxf",
        metadata={
            "parser": "ezdxf",
            "file_format": "dxf",
            "dxf_version": str(getattr(drawing, "dxfversion", "")),
            "entity_counts": dict(entity_counts),
            "layer_counts": dict(layer_counts),
            "drawing_name": file_path.stem,
            "bbox": _bbox(coordinates),
            "cad_entities": entities,
            "cad_layers": sorted(layer_counts),
        },
    )
    for block in document.blocks:
        block.kind = BlockType.CAD_DRAWING
        block.metadata["recognition_status"] = "recognized"
    for page in document.pages:
        page.has_drawings = True
    return document

def _read_text_lossy(path: PathLike) -> tuple[str, str]:
    """Read a STEP file as text, tolerating unknown/vendor encodings.

    STEP Part 21 is ASCII, but some exporters emit a UTF-8 BOM or 8-bit bytes, so
    fall back to latin-1 instead of failing the whole ingestion run.
    """

    for enc in ("utf-8", "latin-1"):
        try:
            return Path(path).read_text(encoding=enc, errors="strict"), enc
        except UnicodeDecodeError:
            continue
    return Path(path).read_text(encoding="latin-1", errors="replace"), "latin-1"


def _step_header(text: str) -> dict[str, str]:
    """Extract the ISO 10303-21 HEADER section metadata."""

    header: dict[str, str] = {}
    for tag, key in (
        ("FILE_DESCRIPTION", "file_description"),
        ("FILE_NAME", "file_name"),
        ("FILE_SCHEMA", "file_schema"),
    ):
        match = re.search(rf"{tag}\(\s*\(\s*'([^']*)'", text)
        if match:
            header[key] = match.group(1)
    return header


def _step_first_string(raw: str) -> str:
    """Return the first single-quoted string inside an entity parameter list."""

    match = re.search(r"'([^']*)'", raw)
    return match.group(1) if match else ""


def _step_trim(raw: str, limit: int = 240) -> str:
    """Collapse whitespace and cap the length of an entity parameter list."""

    collapsed = re.sub(r"\s+", " ", raw).strip()
    if len(collapsed) > limit:
        collapsed = collapsed[:limit] + "..."
    return collapsed


def _step_entities(text: str) -> list[dict[str, str]]:
    """Extract ISO 10303-21 data-section entity instances.

    Each ``#123=TYPE(...)`` record is captured by balancing parentheses from the
    opening ``(`` to its matching ``)``. Returns a list of dicts with ``id``,
    ``type``, ``label`` (the first quoted attribute, usually a name) and ``params``
    (a trimmed single-line view of the attribute list).
    """

    entities: list[dict[str, str]] = []
    pattern = re.compile(r"#(\d+)\s*=\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(")
    for match in pattern.finditer(text):
        start = match.end() - 1  # index of the opening '('
        depth = 0
        i = start
        n = len(text)
        while i < n:
            ch = text[i]
            if ch == "(":
                depth += 1
            elif ch == ")":
                depth -= 1
                if depth == 0:
                    break
            i += 1
        raw = text[start + 1 : i]
        entities.append(
            {
                "id": match.group(1),
                "type": match.group(2).upper(),
                "label": _step_first_string(raw),
                "params": _step_trim(raw),
            }
        )
    return entities


def parse_step(path: PathLike) -> StructuredDocument:
    """Parse an ISO 10303-21 STEP file into a StructuredDocument.

    STEP (``.step`` / ``.stp``) is a text-based CAD exchange format. We extract the
    header metadata and every data-section entity instance, then render them as
    semantic text/table blocks so the offline chain can clean, chunk and embed them
    like any other document. Geometric coordinates are summarised, not reproduced
    verbatim, to keep chunks retrieval-friendly. The ``step`` source format keeps it
    out of the MySQL CAD metadata tables, which only persist DXF/DWG drawings.
    """

    file_path = validate_input_path(path, {".step", ".stp"})
    text, encoding = _read_text_lossy(file_path)
    header = _step_header(text)
    entities = _step_entities(text)
    type_counts: Counter[str] = Counter(e["type"] for e in entities)

    blocks: list[DocumentBlock] = []
    summary_lines = [
        f"STEP 文件：{file_path.name}",
        f"实体总数：{len(entities)}",
    ]
    if header.get("file_description"):
        summary_lines.append(f"描述：{header['file_description']}")
    if header.get("file_schema"):
        summary_lines.append(f"Schema：{header['file_schema']}")
    if type_counts:
        summary_lines.append(
            "实体类型分布：" + "；".join(f"{t}×{c}" for t, c in type_counts.most_common())
        )
    blocks.append(
        make_text_block(
            "p1-step-summary",
            "\n".join(summary_lines),
            metadata={
                "source": "step",
                "file_format": "step",
                "entity_count": len(entities),
                "entity_type_counts": dict(type_counts),
                "schema": header.get("file_schema", ""),
            },
        )
    )

    if entities:
        table_rows = [["#id", "TYPE", "LABEL"]]
        for e in entities[:500]:
            table_rows.append([e["id"], e["type"], e["label"]])
        blocks.append(
            DocumentBlock(
                block_id="p1-step-table",
                page_number=1,
                kind=BlockType.TABLE,
                content=markdown_table(table_rows),
                placeholder="[[TABLE:p1-step-table]]",
                metadata={"source": "step_entities", "entity_count": len(entities)},
            )
        )
        for index, e in enumerate(entities[:MAX_ENTITY_TEXT_BLOCKS], start=1):
            if not e["label"] and not e["params"]:
                continue
            body = f"STEP 实体 #{e['id']} 类型 {e['type']}"
            if e["label"]:
                body += f"，标识：{e['label']}"
            if e["params"]:
                body += f"。属性：{e['params']}"
            blocks.append(
                make_text_block(
                    f"p1-step-entity{index}",
                    body,
                    metadata={"source": "step_entity", "entity_id": e["id"], "entity_type": e["type"]},
                )
            )

    return text_document(
        file_path,
        blocks,
        source_format="step",
        metadata={
            "encoding": encoding,
            "entity_count": len(entities),
            "entity_type_counts": dict(type_counts),
            "file_schema": header.get("file_schema", ""),
        },
    )


def parse_dwg(
    path: PathLike,
    *,
    config: DwgConverterConfig | None = None,
) -> StructuredDocument:
    """Convert DWG to DXF, then parse the converted DXF document."""

    dwg_path = validate_input_path(path, {".dwg"})
    converter_config = config or DwgConverterConfig.from_env()
    with tempfile.TemporaryDirectory(prefix="dwg-to-dxf-") as output_dir:
        converted_path = convert_dwg_to_dxf(
            dwg_path,
            config=converter_config,
            output_dir=Path(output_dir),
        )
        document = parse_dxf(converted_path)
        converted_dxf_name = converted_path.name
    document.source_name = dwg_path.name
    document.source_path = dwg_path
    document.metadata.update(
        {
            "source_format": "dwg",
            "parser": "dwg_to_dxf+ezdxf",
            "original_file_format": "dwg",
            "converted_dxf_name": converted_dxf_name,
        }
    )
    for block in document.blocks:
        block.metadata["source_format"] = "dwg"
        block.metadata["converted_dxf_name"] = converted_dxf_name
    return document


def convert_dwg_to_dxf(
    path: Path,
    *,
    config: DwgConverterConfig | None = None,
    output_dir: Path | None = None,
) -> Path:
    """Convert one DWG file to a DXF using ODA File Converter."""

    config = config or DwgConverterConfig.from_env()
    converter = _resolve_converter(config.converter_path)
    target_dir = output_dir or Path(tempfile.mkdtemp(prefix="dwg-to-dxf-"))
    target_dir.mkdir(parents=True, exist_ok=True)
    command = [
        str(converter),
        str(path.parent),
        str(target_dir),
        config.output_version,
        config.output_format,
        "1" if config.recursive else "0",
        "1",
    ]
    try:
        completed = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
            timeout=300,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        raise DwgConvertError(f"DWG conversion failed for '{path}': {exc}") from exc
    if completed.returncode != 0:
        detail = (completed.stderr or completed.stdout).strip()
        raise DwgConvertError(f"DWG conversion failed for '{path}': {detail}")
    candidates = list(target_dir.glob(f"{path.stem}*.dxf")) + list(target_dir.rglob(f"{path.stem}*.dxf"))
    if not candidates:
        raise DwgConvertError(f"DWG converter did not create a DXF for '{path}'.")
    return candidates[0]


def validate_input_path(path: PathLike, extensions: set[str] | None = None) -> Path:
    if path is None or (isinstance(path, str) and not path.strip()):
        raise ValueError("The input path must not be empty.")
    file_path = Path(path).expanduser()
    if not file_path.exists():
        raise FileNotFoundError(f"File does not exist: {file_path}")
    if not file_path.is_file():
        raise IsADirectoryError(f"Path is not a file: {file_path}")
    if extensions and file_path.suffix.lower() not in extensions:
        expected = ", ".join(sorted(extensions))
        raise ValueError(f"Expected one of {expected}, got: {file_path}")
    return file_path


def text_document(
    path: Path,
    blocks: list[DocumentBlock],
    *,
    source_format: str,
    metadata: dict[str, Any] | None = None,
    assets: list[ImageAsset] | None = None,
    page_number: int = 1,
) -> StructuredDocument:
    return structured_document(
        path,
        blocks,
        source_format=source_format,
        metadata=metadata,
        assets=assets,
        page_numbers=[page_number],
    )


def structured_document(
    path: Path,
    blocks: list[DocumentBlock],
    *,
    source_format: str,
    metadata: dict[str, Any] | None = None,
    assets: list[ImageAsset] | None = None,
    page_numbers: list[int] | None = None,
) -> StructuredDocument:
    """Build a document with one logical page per supplied page number."""

    numbers = page_numbers or sorted({block.page_number for block in blocks}) or [1]
    pages: list[ParsedPage] = []
    for page_number in numbers:
        page_blocks = [block for block in blocks if block.page_number == page_number]
        pages.append(
            ParsedPage(
                page_number=page_number,
                width=0.0,
                height=0.0,
                text_characters=sum(len(block.content) for block in page_blocks),
                has_images=any(block.kind is BlockType.IMAGE for block in page_blocks),
                has_drawings=any(block.kind is BlockType.CAD_DRAWING for block in page_blocks),
                blocks=page_blocks,
            )
        )
    document_metadata = {
        "source_format": source_format,
        "parser": source_format,
    }
    if metadata:
        document_metadata.update(metadata)
    return StructuredDocument(
        source_name=path.name,
        source_path=path,
        pdf_type=PdfType.TEXT if blocks else PdfType.EMPTY,
        pages=pages,
        blocks=blocks,
        assets=assets or [],
        metadata=document_metadata,
    )


def make_text_block(
    block_id: str,
    content: str,
    *,
    page_number: int = 1,
    metadata: dict[str, Any] | None = None,
) -> DocumentBlock:
    return DocumentBlock(
        block_id=block_id,
        page_number=page_number,
        kind=BlockType.TEXT,
        content=content,
        metadata=metadata or {},
    )


def markdown_table(rows: list[list[Any]]) -> str:
    normalized = _normalize_table_rows(rows)
    if not normalized:
        return ""
    header = normalized[0]
    lines = ["| " + " | ".join(header) + " |", "| " + " | ".join("---" for _ in header) + " |"]
    lines.extend("| " + " | ".join(row) + " |" for row in normalized[1:])
    return "\n".join(lines)


def _normalize_table_rows(rows: list[list[Any]]) -> list[list[str]]:
    normalized = [[_normalize_table_cell(cell) for cell in row] for row in rows]
    normalized = [row for row in normalized if any(row)]
    if not normalized:
        return []

    width = max(len(row) for row in normalized)
    padded = [row + [""] * (width - len(row)) for row in normalized]
    useful_columns = [index for index in range(width) if any(row[index] for row in padded)]
    if not useful_columns:
        return []

    compact = [[row[index] for index in useful_columns] for row in padded]
    header_index = _detect_header_row_index(compact)
    header = [cell or f"列{index + 1}" for index, cell in enumerate(compact[header_index])]
    data_rows = compact[:header_index] + compact[header_index + 1 :]
    return [header, *data_rows]


def _normalize_table_cell(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).replace("|", "\\|").replace("\n", " ").strip()
    return re.sub(r"\s+", " ", text)


def _detect_header_row_index(rows: list[list[str]]) -> int:
    best_index = 0
    best_score = -1.0
    for index, row in enumerate(rows[:5]):
        non_empty = [cell for cell in row if cell]
        if not non_empty:
            continue
        score = len(non_empty) * 2
        if index == 0:
            score += 1
        score += sum(1 for cell in non_empty if re.search(r"[A-Za-z_一-鿿]", cell))
        score -= sum(1 for cell in non_empty if _looks_like_numeric_value(cell))
        if score > best_score:
            best_score = score
            best_index = index
    return best_index


def _looks_like_numeric_value(text: str) -> bool:
    return bool(re.fullmatch(r"[-+]?\d+(?:[.,]\d+)*(?:\s*[A-Za-z%℃°/]+)?", text.strip()))


def describe_visual(
    asset: ImageAsset,
    *,
    image_describer: ImageDescriber | None,
    prompt: str,
) -> tuple[str, str]:
    if image_describer is None:
        return "[待Qwen-VL识别]", "pending"
    try:
        description = image_describer.describe_image(
            asset.data,
            media_type=asset.media_type,
            filename=asset.path.name if asset.path else asset.asset_id,
            page_number=asset.page_number,
            prompt=prompt,
        )
    except (VisionError, OSError, TimeoutError) as exc:
        asset.metadata["recognition_error"] = str(exc)
        return f"[Qwen-VL识别失败：{exc}]", "failed"
    return description, "recognized"


def image_asset_from_file(path: Path, *, asset_id: str = "image") -> ImageAsset:
    data = read_file(path)
    media_type = mimetypes.guess_type(path.name)[0] or "image/png"
    if path.suffix.lower() == ".jp2":
        try:
            from PIL import Image

            with Image.open(io.BytesIO(data)) as image:
                converted = image.convert("RGB")
                output = io.BytesIO()
                converted.save(output, format="PNG")
                data = output.getvalue()
            media_type = "image/png"
        except (ImportError, OSError, ValueError) as exc:
            raise ImageParseError(f"Unable to convert JP2 image '{path}' to PNG: {exc}") from exc
    return ImageAsset(
        asset_id=asset_id,
        page_number=1,
        data=data,
        media_type=media_type,
        bbox=BoundingBox(0.0, 0.0, 0.0, 0.0),
        kind=BlockType.IMAGE,
        path=path,
        metadata={"extension": path.suffix.lower().lstrip(".")},
    )


def _load_workbook(path: Path) -> Any:
    try:
        from openpyxl import load_workbook
    except ImportError as exc:
        raise XlsxParseError("XLSX parsing requires openpyxl.") from exc
    try:
        return load_workbook(path, read_only=True, data_only=True)
    except Exception as exc:
        raise XlsxParseError(f"Unable to open XLSX '{path}': {exc}") from exc


def _load_docx(path: Path) -> Any:
    try:
        from docx import Document
    except ImportError as exc:
        raise DocxParseError("DOCX parsing requires python-docx.") from exc
    try:
        return Document(path)
    except Exception as exc:
        raise DocxParseError(f"Unable to open DOCX '{path}': {exc}") from exc


def _paragraph_from_element(document: Any, element: Any) -> Any:
    from docx.text.paragraph import Paragraph
    return Paragraph(element, document)


def _table_from_element(document: Any, element: Any) -> Any:
    from docx.table import Table
    return Table(element, document)


def _heading_level(style_name: str) -> int | None:
    if not style_name.lower().startswith("heading"):
        return None
    suffix = style_name[len("heading") :].strip()
    return int(suffix) if suffix.isdigit() and int(suffix) > 0 else None


def _image_relationship_ids(element: Any) -> list[str]:
    embed_attribute = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed"
    return [relationship_id for node in element.iter() if node.tag.rsplit("}", 1)[-1] == "blip" and (relationship_id := node.get(embed_attribute))]


def _docx_asset(document: Any, relationship_id: str, image_index: int) -> ImageAsset | None:
    try:
        part = document.part.rels[relationship_id].target_part
        return ImageAsset(asset_id=f"i{image_index}", page_number=1, data=part.blob, media_type=getattr(part, "content_type", "image/png"), kind=BlockType.IMAGE, metadata={"relationship_id": relationship_id})
    except (AttributeError, KeyError):
        return None


def _resolve_local_image(markdown_path: Path, reference: str) -> Path | None:
    if re.match(r"^(?:https?:|data:|//)", reference, flags=re.IGNORECASE):
        return None
    candidate = (markdown_path.parent / reference.split("#", 1)[0].split("?", 1)[0]).resolve()
    return candidate if candidate.is_file() else None


def _is_table_start(lines: list[str], index: int) -> bool:
    return index + 1 < len(lines) and _is_table_row(lines[index]) and bool(re.fullmatch(r"\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*", lines[index + 1]))


def _is_table_row(line: str) -> bool:
    return line.strip().startswith("|") and line.strip().endswith("|")


def _load_ezdxf() -> Any:
    try:
        import ezdxf
    except ImportError as exc:
        raise DxfParseError(
            "DXF parsing requires ezdxf. Install it with 'pip install ezdxf'."
        ) from exc
    return ezdxf


def _entity_text(entity: Any) -> str:
    text = getattr(entity.dxf, "text", "")
    if not text and hasattr(entity, "plain_text"):
        text = entity.plain_text()
    return str(text).replace("\\P", "\n").strip()


def _dimension_text(entity: Any) -> str:
    value = str(getattr(entity.dxf, "text", "")).strip()
    if value and value != "<>":
        return value
    try:
        measurement = float(entity.get_measurement())
    except (AttributeError, TypeError, ValueError):
        return ""
    return f"{measurement:g}"


def _point_pair(value: Any) -> tuple[float, float] | None:
    """Convert Vec/point-like DXF values into an ``(x, y)`` pair."""

    if value is None:
        return None
    if isinstance(value, (tuple, list)):
        if len(value) >= 2:
            try:
                return (float(value[0]), float(value[1]))
            except (TypeError, ValueError):
                return None
        return None
    if hasattr(value, "x") and hasattr(value, "y"):
        try:
            return (float(value.x), float(value.y))
        except (TypeError, ValueError):
            return None
    return None


def _polyline_points(entity: Any) -> list[tuple[float, float]]:
    """Return 2D vertices for polyline-like entities (LWPolyline/Polyline/Spline)."""

    for accessor_name in ("get_points", "points", "vertices"):
        accessor = getattr(entity, accessor_name, None)
        if accessor is None:
            continue
        try:
            items = list(accessor() if callable(accessor) else accessor)
        except (TypeError, ValueError, AttributeError, RuntimeError):
            continue
        points: list[tuple[float, float]] = []
        for item in items:
            location = getattr(item, "dxf", None)
            candidate = getattr(location, "location", None) if location is not None else None
            point = _point_pair(candidate if candidate is not None else item)
            if point is not None:
                points.append(point)
        if points:
            return points
    return []


def _circle_points(entity: Any) -> list[tuple[float, float]]:
    """Approximate a circle/arc bounding box with four cardinal points."""

    namespace = getattr(entity, "dxf", None)
    center = _point_pair(getattr(namespace, "center", None))
    radius = _safe_float(getattr(namespace, "radius", None))
    if center is None or radius is None:
        return []
    x, y = center
    return [(x - radius, y - radius), (x + radius, y + radius)]


def _entity_coordinates(entity: Any) -> list[tuple[float, float]]:
    entity_type = str(getattr(entity, "dxftype", lambda: "")()).upper()
    points: list[tuple[float, float]] = []
    namespace = getattr(entity, "dxf", None)
    if namespace is not None:
        for attribute in ("start", "end", "center", "insert"):
            point = _point_pair(getattr(namespace, attribute, None))
            if point is not None:
                points.append(point)
    if entity_type in {"CIRCLE", "ARC"}:
        points.extend(_circle_points(entity))
    else:
        points.extend(_polyline_points(entity))
    return points


def _entity_length(entity: Any) -> float | None:
    """Return the physical length of a DXF entity when the type provides one."""

    for attribute_name in ("length", "length_"):
        attribute = getattr(entity, attribute_name, None)
        if attribute is None:
            continue
        try:
            value = attribute() if callable(attribute) else attribute
        except (TypeError, ValueError, AttributeError, RuntimeError):
            continue
        length = _safe_float(value)
        if length is not None:
            return length
    return None


_PI = 3.141592653589793


def _distance(first: list[float] | tuple[float, float], second: list[float] | tuple[float, float]) -> float:
    return ((first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2) ** 0.5


def _polyline_length(points: list[tuple[float, float]], closed: bool) -> float | None:
    if len(points) < 2:
        return None
    total = sum(_distance(points[index], points[index + 1]) for index in range(len(points) - 1))
    if closed and len(points) > 2:
        total += _distance(points[-1], points[0])
    return total


def _derived_length(
    entity_type: str,
    geometry: dict[str, Any],
    points: list[tuple[float, float]],
    closed: bool,
) -> float | None:
    """Compute length for entity types whose ezdxf object does not expose it."""

    if entity_type == "LINE" and geometry.get("start") and geometry.get("end"):
        return _distance(geometry["start"], geometry["end"])
    radius = geometry.get("radius")
    if isinstance(radius, int | float):
        if entity_type == "CIRCLE":
            return 2 * _PI * float(radius)
        if entity_type == "ARC":
            start_angle = geometry.get("start_angle")
            end_angle = geometry.get("end_angle")
            if isinstance(start_angle, int | float) and isinstance(end_angle, int | float):
                sweep = abs(float(end_angle) - float(start_angle)) % 360.0
                return _PI * float(radius) * sweep / 180.0
    return _polyline_length(points, closed)


def _polygon_area(points: list[tuple[float, float]]) -> float | None:
    """Signed-area (shoelace) helper for closed 2D polygons."""

    if len(points) < 3:
        return None
    total = 0.0
    for index, (x1, y1) in enumerate(points):
        x2, y2 = points[(index + 1) % len(points)]
        total += x1 * y2 - x2 * y1
    return abs(total) / 2.0


def _dxf_entity_record(
    entity: Any,
    *,
    entity_type: str,
    layer_name: str,
    space_name: str,
    text_value: str,
    dimension_value: str,
    block_name: str,
    coordinates: list[tuple[float, float]],
) -> dict[str, Any]:
    common = _dxf_common_attributes(entity)
    return {
        "entity_id": str(getattr(entity.dxf, "handle", "") or common.get("handle") or ""),
        "handle": str(getattr(entity.dxf, "handle", "") or common.get("handle") or ""),
        "entity_type": entity_type,
        "layer_name": layer_name,
        "block_name": block_name or None,
        "space_name": space_name,
        "text": text_value or dimension_value or None,
        "device_id": _extract_device_id(text_value or dimension_value or block_name),
        "bbox": _bbox(coordinates),
        "geometry": _dxf_geometry(entity, entity_type),
        "color": str(getattr(entity.dxf, "color", "")) or None,
        "linetype": str(getattr(entity.dxf, "linetype", "")) or None,
        "lineweight": _safe_float(getattr(entity.dxf, "lineweight", None)),
        "raw": common,
    }


def _dxf_common_attributes(entity: Any) -> dict[str, Any]:
    result: dict[str, Any] = {}
    namespace = getattr(entity, "dxf", None)
    if namespace is None:
        return result
    for key in ("handle", "layer", "color", "linetype", "lineweight", "text", "name"):
        value = getattr(namespace, key, None)
        if value is not None:
            result[key] = _json_safe_dxf_value(value)
    return result


MAX_GEOMETRY_POINTS = 64
MAX_ENTITY_TEXT_BLOCKS = 300


def _dxf_geometry(entity: Any, entity_type: str) -> dict[str, Any]:
    """Extract base geometry attributes used by MySQL and CAD semantic blocks."""

    namespace = getattr(entity, "dxf", None)
    geometry: dict[str, Any] = {"type": entity_type}
    if namespace is None:
        return geometry

    for attribute in ("start", "end", "center", "insert"):
        point = _point_to_list(getattr(namespace, attribute, None))
        if point is not None:
            geometry[attribute] = point
    for attribute in ("radius", "start_angle", "end_angle", "rotation", "height", "width"):
        value = _safe_float(getattr(namespace, attribute, None))
        if value is not None:
            geometry[attribute] = value
    for attribute in ("major_axis", "minor_axis"):
        point = _point_to_list(getattr(namespace, attribute, None))
        if point is not None:
            geometry[attribute] = point

    points: list[tuple[float, float]] = []
    if entity_type not in {"CIRCLE", "ARC"}:
        points = _polyline_points(entity)
        if points:
            geometry["point_count"] = len(points)
            geometry["points"] = [[x, y] for x, y in points[:MAX_GEOMETRY_POINTS]]

    closed = getattr(entity, "closed", None)
    if isinstance(closed, bool):
        geometry["closed"] = closed

    length = _entity_length(entity) or _derived_length(entity_type, geometry, points, bool(closed))
    if length:
        geometry["length"] = length
    if geometry.get("closed") and len(points) >= 3:
        area = _polygon_area(points)
        if area is not None:
            geometry["area"] = area
    elif entity_type == "CIRCLE":
        radius = geometry.get("radius")
        if radius is not None:
            geometry["area"] = _PI * radius * radius
    return geometry


def _point_to_list(value: Any) -> list[float] | None:
    if value is None or not hasattr(value, "x") or not hasattr(value, "y"):
        return None
    point = [float(value.x), float(value.y)]
    if hasattr(value, "z"):
        point.append(float(value.z))
    return point


def _safe_float(value: Any) -> float | None:
    try:
        return float(value) if value is not None and value != "" else None
    except (TypeError, ValueError):
        return None


def _json_safe_dxf_value(value: Any) -> Any:
    if isinstance(value, str | int | float | bool) or value is None:
        return value
    point = _point_to_list(value)
    if point is not None:
        return point
    return str(value)


def _extract_device_id(text: str) -> str | None:
    if not text:
        return None
    match = re.search(r"\b[A-Z]{1,4}-?\d{2,5}[A-Z]?\b", text.upper())
    return match.group(0) if match else None


def _cad_entity_semantic_text(entity: dict[str, Any]) -> str:
    parts = [
        f"CAD实体类型：{entity.get('entity_type') or 'UNKNOWN'}",
        f"所在图层：{entity.get('layer_name') or '0'}",
    ]
    if entity.get("handle"):
        parts.append(f"DXF Handle：{entity['handle']}")
    if entity.get("block_name"):
        parts.append(f"块名称：{entity['block_name']}")
    if entity.get("device_id"):
        parts.append(f"设备编号：{entity['device_id']}")
    if entity.get("text"):
        parts.append(f"相关标注：{entity['text']}")
    if entity.get("bbox"):
        parts.append(f"坐标范围：{entity['bbox']}")
    details = _cad_geometry_details(entity.get("geometry") or {})
    if details:
        parts.append("几何信息：" + details)
    return "。".join(parts) + "。"


def _cad_geometry_details(geometry: dict[str, Any]) -> str:
    """Render the numeric geometry of one CAD entity for semantic retrieval."""

    details: list[str] = []
    length = geometry.get("length")
    if isinstance(length, int | float):
        details.append(f"长度 {float(length):.3f}")
    radius = geometry.get("radius")
    if isinstance(radius, int | float):
        details.append(f"半径 {float(radius):.3f}")
    area = geometry.get("area")
    if isinstance(area, int | float):
        details.append(f"面积 {float(area):.3f}")
    point_count = geometry.get("point_count")
    if isinstance(point_count, int) and point_count > 0:
        details.append(f"顶点 {point_count} 个")
    for attribute, label in (("start", "起点"), ("end", "终点"), ("center", "圆心"), ("insert", "插入点")):
        point = geometry.get(attribute)
        if isinstance(point, list) and len(point) >= 2:
            rendered = "，".join(f"{float(value):.3f}" for value in point[:3])
            details.append(f"{label}（{rendered}）")
    return "，".join(details)


def _cad_layer_blocks(entities: list[dict[str, Any]]) -> list[DocumentBlock]:
    """Build one semantic block per CAD layer."""

    grouped: dict[str, list[dict[str, Any]]] = {}
    for entity in entities:
        grouped.setdefault(str(entity.get("layer_name") or "0"), []).append(entity)

    blocks: list[DocumentBlock] = []
    for layer_name in sorted(grouped):
        items = grouped[layer_name]
        type_counts = Counter(str(item.get("entity_type")) for item in items)
        coordinates: list[tuple[float, float]] = []
        for item in items:
            bbox = item.get("bbox")
            if isinstance(bbox, list) and len(bbox) == 4:
                coordinates.append((bbox[0], bbox[1]))
                coordinates.append((bbox[2], bbox[3]))
        line = f"图层 {layer_name}：共 {len(items)} 个实体。"
        composition = "，".join(f"{kind} {count} 个" for kind, count in sorted(type_counts.items()))
        if composition:
            line += f"实体构成：{composition}。"
        bbox = _bbox(coordinates)
        if bbox:
            line += f"坐标范围：[{bbox[0]:.4f}, {bbox[1]:.4f}, {bbox[2]:.4f}, {bbox[3]:.4f}]"
        blocks.append(
            make_text_block(
                f"p1-cad-layer-{_slug(layer_name)}",
                line,
                metadata={
                    "source": "dxf_layer_summary",
                    "layer_name": layer_name,
                    "entity_count": len(items),
                    "entity_types": sorted(type_counts),
                },
            )
        )
    return blocks


def _cad_entity_type_blocks(entities: list[dict[str, Any]]) -> list[DocumentBlock]:
    """Build one semantic block per DXF entity type."""

    grouped: dict[str, list[dict[str, Any]]] = {}
    for entity in entities:
        grouped.setdefault(str(entity.get("entity_type") or "UNKNOWN"), []).append(entity)

    blocks: list[DocumentBlock] = []
    for entity_type in sorted(grouped):
        items = grouped[entity_type]
        layer_counts = Counter(str(item.get("layer_name") or "0") for item in items)
        coordinates: list[tuple[float, float]] = []
        lengths: list[float] = []
        for item in items:
            bbox = item.get("bbox")
            if isinstance(bbox, list) and len(bbox) == 4:
                coordinates.append((bbox[0], bbox[1]))
                coordinates.append((bbox[2], bbox[3]))
            length = (item.get("geometry") or {}).get("length")
            if isinstance(length, int | float):
                lengths.append(float(length))
        line = f"{entity_type} 实体：共 {len(items)} 个。"
        layers = "，".join(f"{layer} {count} 个" for layer, count in sorted(layer_counts.items()))
        if layers:
            line += f"分布图层：{layers}。"
        if lengths:
            line += f"总长度 {sum(lengths):.3f}，平均长度 {sum(lengths) / len(lengths):.3f}。"
        bbox = _bbox(coordinates)
        if bbox:
            line += f"坐标范围：[{bbox[0]:.4f}, {bbox[1]:.4f}, {bbox[2]:.4f}, {bbox[3]:.4f}]"
        sample = items[0]
        sample_text = _cad_entity_semantic_text(sample)
        block_text = f"{line}\n典型实体：{sample_text}"
        blocks.append(
            make_text_block(
                f"p1-cad-type-{_slug(entity_type)}",
                block_text,
                metadata={
                    "source": "dxf_entity_type_summary",
                    "entity_type": entity_type,
                    "entity_count": len(items),
                    "entity_handle": sample.get("handle"),
                    "layer_name": sample.get("layer_name"),
                    "device_id": sample.get("device_id"),
                },
            )
        )
    return blocks


def _slug(value: str) -> str:
    """Normalize layer/type names into safe block identifiers."""

    normalized = re.sub(r"[^0-9A-Za-z]+", "_", str(value)).strip("_").lower()
    return normalized or "default"


def _summary_text(
    path: Path,
    entity_counts: Counter[str],
    layer_counts: Counter[str],
    texts: list[str],
    dimensions: list[str],
    inserts: list[str],
    coordinates: list[tuple[float, float]],
) -> str:
    parts = [
        f"CAD图纸：{path.stem}",
        "文件格式：DXF",
        f"图层：{', '.join(sorted(layer_counts)) or '无'}",
        "实体统计：" + "，".join(f"{kind} {count}个" for kind, count in sorted(entity_counts.items())),
    ]
    parts.append("文字标注：" + ("；".join(_unique(texts)[:100]) if texts else "未检出 TEXT/MTEXT 文字实体"))
    parts.append("尺寸标注：" + ("；".join(_unique(dimensions)[:100]) if dimensions else "未检出 DIMENSION 标注实体"))
    parts.append("块引用：" + ("；".join(_unique(inserts)[:100]) if inserts else "未检出 INSERT 块引用"))
    bbox = _bbox(coordinates)
    if bbox:
        parts.append(f"坐标范围：{bbox}")
    return "\n".join(parts)


def _bbox(coordinates: list[tuple[float, float]]) -> list[float] | None:
    if not coordinates:
        return None
    xs = [point[0] for point in coordinates]
    ys = [point[1] for point in coordinates]
    return [min(xs), min(ys), max(xs), max(ys)]


def _unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value.strip()))


def _resolve_converter(converter_path: str | None) -> Path:
    if converter_path:
        path = Path(converter_path).expanduser()
        if path.exists():
            return path
        resolved = shutil.which(converter_path)
        if resolved:
            return Path(resolved)
    for candidate in (
        "ODAFileConverter",
        "ODAFileConverter.exe",
        "FileConverter",
        "FileConverter.exe",
    ):
        resolved = shutil.which(candidate)
        if resolved:
            return Path(resolved)
    raise DwgConvertError(
        "DWG parsing requires ODA File Converter. Set ODA_FILE_CONVERTER to the executable path."
    )


__all__ = [
    "CAD_ENTITY_TYPES",
    "CsvParseError",
    "DocxParseError",
    "DwgConvertError",
    "DwgConverterConfig",
    "DxfParseError",
    "IMAGE_EXTENSIONS",
    "ImageParseError",
    "SUPPORTED_EXTENSIONS",
    "UnsupportedDocumentError",
    "XlsxParseError",
    "convert_dwg_to_dxf",
    "parse_csv",
    "parse_document",
    "parse_docx",
    "parse_dwg",
    "parse_dxf",
    "parse_image",
    "parse_markdown",
    "parse_txt",
    "parse_xlsx",
]
