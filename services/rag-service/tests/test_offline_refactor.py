from pathlib import Path

from app.chunk import ChunkerConfig
from app.embedding import EmbeddingConfig
from app.ingestion.offline import build_pipeline_signature, run_preflight
from app.ingestion.cache import IngestionCache
from app.ingestion.models import BlockType, DocumentBlock, PdfType, StructuredDocument
from app.chunk import IndustrialChunk
from app.chunk.industrial_chunker import _chunk_id
from app.clean import ChunkQuality, CleanedBlock
from app.mysql.writer import MySQLRagWriter
from config.settings import SERVICE_ROOT, Settings


def test_relative_rag_paths_are_resolved_from_service_root():
    configured = Settings(_env_file=None, rag_data_dir="data", whoosh_index_dir="data/index/whoosh")

    assert configured.rag_data_path == (SERVICE_ROOT / "data").resolve()
    assert configured.whoosh_index_path == (SERVICE_ROOT / "data/index/whoosh").resolve()


def test_pipeline_signature_changes_with_embedding_model():
    chunk = ChunkerConfig()
    first = build_pipeline_signature(
        chunk_config=chunk,
        embedding_config=EmbeddingConfig(model_name="model-a"),
        ocr_backend="rapidocr",
    )
    second = build_pipeline_signature(
        chunk_config=chunk,
        embedding_config=EmbeddingConfig(model_name="model-b"),
        ocr_backend="rapidocr",
    )

    assert first != second
    assert len(first) == 64


def test_preflight_can_validate_local_inputs_without_network(tmp_path: Path):
    data_dir = tmp_path / "data"
    source = data_dir / "manuals" / "manual.txt"
    source.parent.mkdir(parents=True)
    source.write_text("maintenance manual", encoding="utf-8")

    report = run_preflight(
        data_dir=data_dir,
        whoosh_index_dir=data_dir / "index" / "whoosh",
        files=[source],
        collections=["industry_rag_manuals"],
        milvus_uri="http://127.0.0.1:19530",
        mysql_host="127.0.0.1",
        mysql_port=3306,
        embedding_api_key="configured",
        ocr_backend="",
        cache_dir=data_dir / ".ingestion_cache",
        probe_network=False,
    )

    assert report.ready is True
    assert report.files == 1
    assert report.collections == ("industry_rag_manuals",)
    assert report.checks["ingestion_cache_dir"] is True


def test_intermediate_cache_round_trip_and_invalidation(tmp_path: Path):
    block = DocumentBlock(
        block_id="b1",
        page_number=1,
        kind=BlockType.TEXT,
        content="bearing maintenance",
    )
    document = StructuredDocument(
        source_name="manual.pdf",
        source_path=tmp_path / "manual.pdf",
        pdf_type=PdfType.TEXT,
        pages=[],
        blocks=[block],
        assets=[],
        metadata={"document_id": "doc", "cad_entities": [{"handle": "1"}]},
    )
    chunks = [IndustrialChunk(chunk_id="chunk-1", text="bearing maintenance", metadata={"page_numbers": [1]})]
    cache = IngestionCache(tmp_path / "cache")
    cache.store(
        "doc",
        content_hash="content-a",
        pipeline_signature="pipeline-a",
        document=document,
        chunks=chunks,
    )

    hit = cache.load("doc", content_hash="content-a", pipeline_signature="pipeline-a")

    assert hit is not None
    assert hit.document.metadata["cad_entities"] == [{"handle": "1"}]
    assert hit.chunks[0].chunk_id == "chunk-1"
    assert cache.load("doc", content_hash="content-b", pipeline_signature="pipeline-a") is None
    assert cache.load("doc", content_hash="content-a", pipeline_signature="pipeline-b") is None


def test_chunk_ids_change_between_content_or_pipeline_versions(tmp_path: Path):
    block = CleanedBlock(
        block_id="block-1",
        page_number=1,
        kind=BlockType.TEXT,
        clean_text="maintenance",
        raw_text="maintenance",
        quality=ChunkQuality.HIGH,
    )
    document = StructuredDocument(
        source_name="manual.pdf",
        source_path=tmp_path / "manual.pdf",
        pdf_type=PdfType.TEXT,
        pages=[],
        blocks=[],
        assets=[],
        metadata={
            "document_id": "doc",
            "content_hash": "content-a",
            "pipeline_signature": "pipeline-a",
        },
    )
    first = _chunk_id(document, [block], 1, 1)
    document.metadata["pipeline_signature"] = "pipeline-b"
    second = _chunk_id(document, [block], 1, 1)

    assert first != second


class _Cursor:
    def __init__(self, row):
        self.row = row

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def execute(self, *_args):
        return None

    def fetchone(self):
        return self.row

    def fetchall(self):
        return [("chunk-1",), ("chunk-2",), ("chunk-3",)]


class _Connection:
    def __init__(self, row):
        self.row = row

    def select_db(self, _database):
        return None

    def cursor(self):
        return _Cursor(self.row)


def test_incremental_lookup_requires_matching_pipeline_signature():
    matching = MySQLRagWriter(
        connection=_Connection((3, 3, '{"pipeline_signature":"same"}'))
    )
    stale = MySQLRagWriter(
        connection=_Connection((3, 3, '{"pipeline_signature":"old"}'))
    )

    assert matching.find_complete_document("doc", "hash", pipeline_signature="same") == {
        "chunk_count": 3,
        "vector_count": 3,
        "chunk_ids": ["chunk-1", "chunk-2", "chunk-3"],
    }
    assert stale.find_complete_document("doc", "hash", pipeline_signature="same") is None
