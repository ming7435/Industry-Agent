"""Dense retrieval over the Milvus collection filled by the offline pipeline.

This module is the seam between the two halves of the service: the offline
ingestion writes chunks into one collection and this retriever reads them back
for the online chain. It only ever reads columns the offline writer already
produces -- no schema change, no re-ingestion, no extra field:

    id / chunk_id / text / source_name / source_path / source_format /
    page_numbers_json / chunk_type / quality / contains_table /
    contains_image / contains_cad / metadata_json / vector

``Hit`` is defined **here** and imported everywhere else
(:mod:`app.fusion`, :mod:`app.evidence`, :mod:`app.reranker`,
:mod:`app.api.pipeline`) so the whole online chain agrees on one hit shape:

* ``source`` is the *route label* (``"dense"`` here, ``"bm25"`` for Whoosh,
  ``"fusion"`` after RRF) -- that is what the API contract promises;
* ``metadata["corpus"]`` is the *corpus label*, derived at read time by
  :func:`app.corpus.infer_corpus` from the offline ``source_name`` /
  ``source_path`` / ``metadata_json``. The evidence layer groups citations by it.

Both travel together through fusion and reranking because those stages copy the
metadata of the hit they rewrite.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Any

from loguru import logger

from app.corpus import infer_corpus, infer_device_model

from config.settings import settings

SOURCE_DENSE = "dense"
"""Route label carried by the hits produced here."""

STAGE_DENSE = "dense"
"""Value written to ``Hit.metadata["stage"]``."""

_FILTERABLE_FIELDS: tuple[str, ...] = (
    "source_name",
    "source_format",
    "chunk_type",
    "quality",
)
"""Existing collection columns a filter can be pushed down to as an expression.

``corpus`` / ``device_model`` / ``error_code`` are *not* columns: they live in
``metadata_json`` and are applied in Python by :func:`_matches`.
"""

_OUTPUT_FIELDS: tuple[str, ...] = (
    "chunk_id",
    "text",
    "source_name",
    "source_path",
    "source_format",
    "page_numbers_json",
    "chunk_type",
    "quality",
    "contains_table",
    "contains_image",
    "contains_cad",
    "metadata_json",
)
"""Scalar columns read back with every hit."""


@dataclass
class Hit:
    """One candidate chunk returned by a retrieval route."""

    chunk_id: str
    """Identifier of the chunk in the offline index."""

    text: str
    """Chunk content."""

    score: float
    """Route-specific relevance score (dense similarity, BM25 score, RRF score)."""

    source: str
    """Route label: ``bm25`` / ``dense`` / ``fusion``."""

    metadata: dict[str, Any] = field(default_factory=dict)
    """Offline chunk metadata plus the derived ``corpus`` label."""

    rank: int = 0
    """1-based position inside the list this hit belongs to."""


def _sanitize(value: Any) -> str:
    """Return a value safe to embed in a Milvus expression.

    Args:
        value: Raw filter value.

    Returns:
        The string form without characters that could break out of the quoted
        literal of the expression.
    """
    return str(value).replace("\\", " ").replace('"', " ").strip()


def _build_expression(filters: dict[str, Any] | None) -> tuple[str, dict[str, Any]]:
    """Split the request filters into a Milvus expression and a post-filter.

    Args:
        filters: Metadata filters forwarded by the caller, e.g.
            ``{"corpus": "manuals", "source_format": "pdf"}``.

    Returns:
        A ``(expression, remaining)`` pair: ``expression`` is pushed down to
        Milvus (empty when nothing is filterable) and ``remaining`` holds the
        keys only present in ``metadata_json``, applied in Python after search.
    """
    if not filters:
        return "", {}

    clauses: list[str] = []
    remaining: dict[str, Any] = {}
    for key, value in filters.items():
        if value is None:
            continue
        if key in _FILTERABLE_FIELDS:
            clauses.append(f'{key} == "{_sanitize(value)}"')
        else:
            remaining[key] = value

    return " and ".join(clauses), remaining


def _matches(hit: Hit, remaining: dict[str, Any]) -> bool:
    """Tell whether a hit satisfies the filters Milvus could not push down.

    Args:
        hit: Candidate hit.
        remaining: Filters to apply on the hit metadata.

    Returns:
        ``True`` when every filter matches (string comparison, case-insensitive).
    """
    for key, value in remaining.items():
        found = hit.metadata.get(key)
        if found is None:
            return False
        if str(found).lower() != str(value).lower():
            return False
    return True


def _load_json(raw: Any) -> dict[str, Any]:
    """Parse a ``metadata_json`` column.

    Args:
        raw: Raw column value.

    Returns:
        The decoded mapping, or an empty dict when the value is not valid JSON.
    """
    if isinstance(raw, dict):
        return dict(raw)
    if not raw:
        return {}
    try:
        decoded = json.loads(raw)
    except (TypeError, ValueError):
        return {}
    return decoded if isinstance(decoded, dict) else {}


def _embed_query(embedder: Any, query: str) -> list[float]:
    """Encode one query with whatever the embedder exposes.

    :class:`~app.embedding.model.QueryEmbedder` offers ``embed_query``, while a
    bare offline client (for example ``BGEM3EmbeddingClient``) only offers
    ``embed_texts``. Both are accepted so the retriever keeps working when a
    plain client is injected.

    Args:
        embedder: Object exposing ``embed_query`` and/or ``embed_texts``.
        query: User query.

    Returns:
        The query vector.

    Raises:
        RuntimeError: If the embedder yields no vector.
    """
    encode = getattr(embedder, "embed_query", None)
    if callable(encode):
        return encode(query)

    vectors = embedder.embed_texts([query])
    if not vectors:
        raise RuntimeError("embedding model returned no vector for the query")
    return vectors[0]


def _hit_from_row(row: Any) -> Hit:
    """Convert one Milvus search result row into a :class:`Hit`.

    The corpus label is *derived* here (see :mod:`app.corpus`), so a collection
    ingested before this code existed is labelled correctly without re-ingestion.

    Args:
        row: Row as returned by ``MilvusClient.search`` -- a mapping with an
            ``entity`` sub-mapping (pymilvus >= 2.4) or the entity itself.

    Returns:
        The hit, with the offline metadata and the derived corpus attached.
    """
    entity = row.get("entity", row) if isinstance(row, dict) else row
    entity = entity or {}

    score = 0.0
    if isinstance(row, dict):
        raw_score = row.get("score", row.get("distance"))
        try:
            score = float(raw_score)
        except (TypeError, ValueError):
            score = 0.0

    metadata: dict[str, Any] = _load_json(entity.get("metadata_json"))
    for name in _OUTPUT_FIELDS:
        if name in ("text", "metadata_json"):
            continue
        value = entity.get(name)
        if value not in (None, ""):
            metadata[name] = value

    raw_pages = entity.get("page_numbers_json")
    if isinstance(raw_pages, str) and raw_pages:
        try:
            metadata["page_numbers"] = json.loads(raw_pages)
        except (TypeError, ValueError):
            pass

    metadata["corpus"] = infer_corpus(
        source_name=metadata.get("source_name"),
        source_path=metadata.get("source_path"),
        metadata=metadata,
    )
    if not metadata.get("device_model"):
        device_model = infer_device_model(metadata.get("source_name"))
        if device_model:
            metadata["device_model"] = device_model
    metadata["stage"] = STAGE_DENSE

    return Hit(
        chunk_id=str(entity.get("chunk_id") or entity.get("id") or ""),
        text=str(entity.get("text") or ""),
        score=score,
        source=SOURCE_DENSE,
        metadata=metadata,
    )


class DenseRetriever:
    """Synchronous Milvus retriever used by the dense leg of the online chain.

    Construction never raises for a missing store: ``pymilvus`` is imported
    lazily and the Milvus client is created on first search. A failure is
    re-raised at that point and turned into ``milvus_unavailable`` /
    ``embedding_unavailable`` by :mod:`app.api.pipeline`.
    """

    def __init__(
        self,
        uri: str | None = None,
        host: str | None = None,
        port: int | None = None,
        collection_name: str | None = None,
        collection: str | None = None,
        dim: int | None = None,
        embedding_dim: int | None = None,
        embedder: Any | None = None,
        client: Any | None = None,
    ) -> None:
        """Store the connection parameters, defaulting to the service settings.

        Args:
            uri: Milvus URI; defaults to ``settings.milvus_uri``.
            host: Milvus host (alternative to ``uri``).
            port: Milvus port (alternative to ``uri``).
            collection_name: Collection to query; defaults to
                ``settings.milvus_collection`` -- the same collection the
                offline writer fills. ``collection`` is an alias.
            collection: Alias of ``collection_name``.
            dim: Expected vector dimension; defaults to ``settings.embedding_dim``.
            embedding_dim: Alias of ``dim``.
            embedder: Query embedder; defaults to the process-wide
                :func:`app.embedding.model.get_embedder`.
            client: Pre-built Milvus client, mainly for tests.
        """
        self.uri = uri or settings.milvus_uri
        self.host = host or settings.milvus_host
        self.port = int(port or settings.milvus_port)
        self.collection_name = collection_name or collection or settings.milvus_collection
        self.dim = int(dim or embedding_dim or settings.embedding_dim)
        self._embedder = embedder
        self._client = client

    def _get_client(self) -> Any:
        """Return the Milvus client, creating it on first use.

        Returns:
            The ``pymilvus.MilvusClient`` bound to the configured URI.

        Raises:
            RuntimeError: If ``pymilvus`` is not installed.
        """
        if self._client is None:
            try:
                from pymilvus import MilvusClient
            except (ImportError, ModuleNotFoundError) as exc:
                raise RuntimeError("pymilvus is not installed") from exc
            self._client = MilvusClient(uri=self.uri)
            logger.info(
                "milvus client created uri={} collection={}",
                self.uri,
                self.collection_name,
            )
        return self._client

    def _get_embedder(self) -> Any:
        """Return the query embedder.

        Returns:
            The configured embedder, or the process-wide one.

        Raises:
            RuntimeError: If no embedding model is available -- reported as
                ``embedding_unavailable`` by the orchestrator.
        """
        if self._embedder is not None:
            return self._embedder

        from app.embedding.model import get_embedder

        self._embedder = get_embedder()
        if self._embedder is None:
            raise RuntimeError("embedding model is not available")
        return self._embedder

    def search(
        self,
        query: str,
        filters: dict[str, Any] | None = None,
        top_k: int | None = None,
    ) -> list[Hit]:
        """Return the ``top_k`` nearest chunks of the query vector.

        Args:
            query: User query.
            filters: Metadata filters; the ones matching a real column become a
                Milvus expression, the others are applied in Python.
            top_k: Number of hits; defaults to ``settings.dense_top_k``.

        Returns:
            Hits sorted by descending similarity, at most ``top_k`` items.

        Raises:
            RuntimeError: If the embedder or Milvus is unusable.
        """
        limit = settings.dense_top_k if top_k is None else int(top_k)
        if limit <= 0 or not query.strip():
            return []

        vector = _embed_query(self._get_embedder(), query)
        expression, remaining = _build_expression(filters)

        client = self._get_client()
        results = client.search(
            collection_name=self.collection_name,
            data=[vector],
            limit=limit,
            # ``None`` rather than ``""``: some pymilvus builds reject an empty
            # filter expression.
            filter=expression or None,
            output_fields=list(_OUTPUT_FIELDS),
        )

        rows = results[0] if results else []
        hits = [_hit_from_row(row) for row in rows]
        if remaining:
            hits = [hit for hit in hits if _matches(hit, remaining)]

        logger.info(
            "dense search collection={} hits={} filtered={}",
            self.collection_name,
            len(hits),
            bool(remaining),
        )
        return hits

    def health(self) -> bool:
        """Report whether the collection is reachable.

        Returns:
            ``True`` when the collection exists; ``False`` on any error, so the
            health endpoint stays cheap and never raises.
        """
        try:
            client = self._get_client()
            return bool(client.has_collection(self.collection_name))
        except Exception as exc:  # noqa: BLE001 - unhealthy is a valid result
            logger.warning(
                "milvus health probe failed collection={} error_type={}",
                self.collection_name,
                type(exc).__name__,
            )
            return False


__all__ = ["Hit", "DenseRetriever", "SOURCE_DENSE"]
