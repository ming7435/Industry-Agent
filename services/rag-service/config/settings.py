"""Centralised runtime configuration for the whole RAG service.

One file, two halves of the same service:

* the **online** chain (retrieve -> fuse -> rerank -> evidence -> generate) reads
  the fan-out, per-stage budgets, model paths and DeepSeek credentials below;
* the **offline** chain (parse -> clean -> chunk -> embed -> Milvus/MySQL/Whoosh)
  reads the corpus directory, Milvus write options, the MySQL metadata store and
  the optional Qwen-VL credentials from the very same object.

Everything is read from environment variables (or a local ``.env`` file) through
``pydantic-settings``. No secret is ever hard-coded: API keys default to an empty
string, must be supplied through the environment, and are never written to the
logs (see :mod:`app.llm.client`).

The ``.env`` lookup is anchored to the service root so the service behaves the
same whether it is started from ``services/rag-service``, from the repository
root, or by a container entrypoint that changed the working directory.
"""

from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

SERVICE_ROOT = Path(__file__).resolve().parents[1]
"""Absolute path of ``services/rag-service``, used to anchor ``.env`` and data."""

ENV_FILE = SERVICE_ROOT / ".env"
"""Service-local ``.env``; loaded in addition to any ``.env`` of the CWD."""


def load_service_env() -> None:
    """Load the service-local ``.env`` without overriding process variables.

    ``pydantic-settings`` already reads :data:`ENV_FILE` when :class:`Settings` is
    instantiated. This helper exists for code paths that read ``os.getenv``
    directly (for example the offline MySQL and Qwen-VL configuration helpers),
    so both halves of the service see the same values.

    Missing ``python-dotenv`` is not an error: the process environment alone is
    then considered authoritative.
    """
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(ENV_FILE, override=False)


def env_bool(name: str, default: bool = False) -> bool:
    """Return a boolean environment variable.

    Args:
        name: Environment variable name.
        default: Value returned when the variable is not set.

    Returns:
        The parsed boolean value.

    Raises:
        ValueError: If the variable is set to something that is neither a truthy
            (``1``/``true``/``yes``/``on``) nor a falsy (``0``/``false``/``no``/
            ``off``) literal.
    """
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be a boolean value, got {value!r}.")


class Settings(BaseSettings):
    """Runtime settings of the industrial-maintenance RAG service.

    Field names map to environment variables case-insensitively, so
    ``bm25_top_k`` can be overridden with ``BM25_TOP_K=30``,
    ``deepseek_api_key`` with ``DEEPSEEK_API_KEY=sk-...`` and ``mysql_host``
    with ``MYSQL_HOST=127.0.0.1``.
    """

    model_config = SettingsConfigDict(
        # The service-local file first, then a CWD ``.env`` may override it;
        # the real process environment always wins over both.
        env_file=(str(ENV_FILE), ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # Retrieval fan-out and fusion
    # ------------------------------------------------------------------
    bm25_top_k: int = 5
    """Number of candidates requested from the Whoosh (BM25) route."""

    dense_top_k: int = 5
    """Number of candidates requested from the Milvus (dense) route."""

    rrf_k: int = 60
    """Smoothing constant of the reciprocal rank fusion."""

    fusion_top_m: int = 5
    """Number of fused candidates kept for the reranking stage."""

    rerank_top_n: int = 5
    """Fallback number of evidences kept when the request omits ``top_n``."""

    # ------------------------------------------------------------------
    # Per-stage millisecond budgets
    # ------------------------------------------------------------------
    bm25_timeout_ms: int = 3000
    """Budget of the Whoosh/BM25 leg."""

    dense_timeout_ms: int = 5000
    """Budget of the Milvus/dense leg."""

    rerank_timeout_ms: int = 15000
    """Budget of the reranking stage."""

    request_timeout_ms: int = 35000
    """Budget of the whole ``POST /search`` request.

    Must stay larger than :attr:`llm_timeout_ms`, otherwise the generation stage
    is cut off by the overall budget before DeepSeek can answer and every
    response comes back with an empty ``answer`` and
    ``degrade_reason="request_timeout"``. The historical default of 2000ms was
    exactly that trap, so the default now follows ``llm_timeout_ms``.
    """

    llm_timeout_ms: int = 30000
    """Budget of the DeepSeek generation call."""

    health_probe_timeout_ms: int = 3000
    """Budget of a single dependency probe used by ``GET /health``.

    The first Milvus readiness probe may include client creation and collection
    discovery. A 500ms budget caused a healthy local Milvus instance to be
    reported as unavailable on a cold process, so the default is deliberately
    above the local connection/discovery latency.
    """

    # ------------------------------------------------------------------
    # Models
    # ------------------------------------------------------------------
    embedding_model_path: str = "D:/models/bge-m3"
    """Local path or HF id of the bge-m3 embedding model."""

    embedding_dim: int = 1024
    """Dense vector dimension produced by bge-m3."""

    embedding_batch_size: int = 16
    """Batch size used when embedding chunks (offline) and queries (online)."""

    embedding_min_characters: int = 20
    """Chunks shorter than this are skipped by the offline embedding pipeline."""

    embedding_normalize: bool = True
    """Whether embeddings are L2-normalised (required for COSINE/IP metric)."""

    reranker_model_path: str = "D:/models/bge-reranker-v2-m3"
    """Local path or HF id of the bge-reranker-v2-m3 model."""

    reranker_batch_size: int = 16
    """Batch size used when scoring query/passage pairs."""

    reranker_device: str = "cpu"
    """Requested device; automatically falls back to CPU when CUDA is absent."""

    # ------------------------------------------------------------------
    # Offline corpus
    # ------------------------------------------------------------------
    rag_data_dir: str = "data/SHUJU"
    """Directory scanned by ``scripts/ingest_to_milvus.py`` (relative to CWD)."""

    default_corpus: str = "manuals"
    """Corpus label used by :func:`app.corpus.infer_corpus` when a document
    carries no corpus signal (``alarms`` / ``cases`` / ``manuals`` / ``sop``).
    """

    # ------------------------------------------------------------------
    # Offline stores
    # ------------------------------------------------------------------
    whoosh_index_dir: str = "data/index/whoosh"
    """Directory holding the built Whoosh BM25 index."""

    milvus_uri: str = "http://localhost:19530"
    """Milvus connection URI."""

    milvus_database: str = "industry_rag_documents"
    """Dedicated Milvus database used by the industrial-maintenance RAG service."""

    milvus_host: str = "localhost"
    """Milvus host, used by clients configured with host/port instead of a URI."""

    milvus_port: int = 19530
    """Milvus port."""

    milvus_collection: str = "industry_rag_chunks"
    """Primary collection used when ``MILVUS_COLLECTIONS`` is not configured.

    Offline ingestion now writes each document to its derived collection, so
    production deployments should set ``MILVUS_COLLECTIONS`` to the collection
    list that online dense retrieval should fan out across.
    """

    milvus_collections: str = ""
    """Comma-separated extra Milvus collections the dense retriever fans out across.

    When empty, the retriever only queries :attr:`milvus_collection`. Set
    ``MILVUS_COLLECTIONS`` to a comma-separated list (e.g.
    ``industry_rag_alarm_codes,industry_rag_bom,industry_rag_sop``) to query
    several collections in one dense search and merge the results by score. The
    resolved list is exposed via :attr:`milvus_search_collections`.
    """

    @property
    def milvus_search_collections(self) -> list[str]:
        """Resolved list of collections the dense retriever queries.

        Returns the parsed ``MILVUS_COLLECTIONS`` list when non-empty, otherwise
        falls back to the single :attr:`milvus_collection`.
        """

        raw = (self.milvus_collections or "").strip()
        if raw:
            parsed = [item.strip() for item in raw.split(",") if item.strip()]
            if parsed:
                return parsed
        return [self.milvus_collection]

    milvus_primary_field: str = "id"
    """Primary key field of the chunk collection."""

    milvus_vector_field: str = "vector"
    """Vector field of the chunk collection."""

    milvus_metric_type: str = "COSINE"
    """Metric type of the vector index."""

    milvus_index_type: str = "AUTOINDEX"
    """Index type of the vector index."""

    milvus_batch_size: int = 128
    """Insert batch size of the offline Milvus writer."""

    milvus_drop_existing: bool = False
    """Whether the offline writer drops an existing collection before creating it."""

    # ------------------------------------------------------------------
    # MySQL metadata store (offline ingestion bookkeeping)
    # ------------------------------------------------------------------
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "industry_rag"
    mysql_charset: str = "utf8mb4"
    mysql_connect_timeout: int = 10

    # ------------------------------------------------------------------
    # Optional vision / CAD helpers used by the offline parsers
    # ------------------------------------------------------------------
    dashscope_api_key: str = ""
    """DashScope key used by Qwen-VL image recognition (optional)."""

    qwen_api_key: str = ""
    """Fallback key for Qwen-VL when ``DASHSCOPE_API_KEY`` is not set."""

    qwen_vl_model: str = "qwen-vl-max"
    """Qwen-VL model id used to describe images and scanned pages."""

    qwen_vl_endpoint: str = (
        "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
    )
    """OpenAI-compatible DashScope endpoint of Qwen-VL."""

    oda_file_converter: str = ""
    """Path to ``ODAFileConverter.exe``, required to read DWG drawings."""

    # ------------------------------------------------------------------
    # LLM (DeepSeek)
    # ------------------------------------------------------------------
    deepseek_api_key: str = ""
    """DeepSeek API key. Must come from ``DEEPSEEK_API_KEY``; never hard-code it."""

    deepseek_base_url: str = "https://api.deepseek.com/v1"
    """OpenAI-compatible base URL of the DeepSeek endpoint."""

    deepseek_model: str = "deepseek-chat"
    """Chat model used for diagnostic generation."""

    llm_temperature: float = 0.2
    """Sampling temperature; kept low so the answer stays grounded in evidence."""

    llm_max_tokens: int = 1024
    """Upper bound of generated tokens."""

    # ------------------------------------------------------------------
    # Service
    # ------------------------------------------------------------------
    service_host: str = "0.0.0.0"
    """Bind address of the uvicorn server."""

    service_port: int = 8000
    """Bind port of the uvicorn server."""

    log_level: str = "INFO"
    """loguru level of the service logger."""

    cors_allow_origins: list[str] = ["*"]
    """Origins allowed by the CORS middleware."""


settings = Settings()
"""Process-wide settings instance, imported by every service module."""


def get_settings() -> Settings:
    """Return the process-wide settings singleton.

    Provided as a FastAPI-friendly accessor so routers and dependencies can take
    configuration through ``Depends`` instead of importing the global directly.

    Returns:
        The already-constructed :class:`Settings` instance.
    """
    return settings


__all__ = [
    "ENV_FILE",
    "SERVICE_ROOT",
    "Settings",
    "env_bool",
    "get_settings",
    "load_service_env",
    "settings",
]
