"""BM25 retrieval over the Whoosh index built by the offline pipeline.

This is the lexical leg of the online chain. It mirrors
:mod:`app.milvus.retriever`: same :class:`~app.milvus.retriever.Hit` shape, same
``search(query, filters, top_k)`` signature, same failure philosophy -- a missing
index or a missing package is reported to the caller, which degrades to
``whoosh_unavailable`` instead of taking the request down.

``Hit.source`` is the route label ``"bm25"``; the corpus stays in
``metadata["corpus"]`` so the evidence layer can still group citations by
corpus after fusion.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from loguru import logger

from app.corpus import infer_corpus
from app.milvus.retriever import Hit

from config.settings import settings

from .schema import (
    FILTER_FIELDS,
    FIELD_CHUNK_ID,
    FIELD_CORPUS,
    FIELD_METADATA,
    FIELD_TEXT,
    TEXT_FIELDS,
)

SOURCE_BM25 = "bm25"
"""Route label carried by the hits produced here."""

STAGE_BM25 = "bm25"
"""Value written to ``Hit.metadata["stage"]``."""


def _load_metadata(raw: Any) -> dict[str, Any]:
    """Parse the stored ``metadata_json`` column of a Whoosh document.

    Args:
        raw: Raw stored value.

    Returns:
        The decoded mapping, or an empty dict when it is not valid JSON.
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


class BM25Retriever:
    """Synchronous Whoosh retriever used by the lexical leg of the online chain.

    The index is opened on first search, so a service started before the offline
    ingestion finished still boots and simply reports this route as unavailable.
    """

    def __init__(
        self,
        index_dir: str | None = None,
        index_path: str | None = None,
        path: str | None = None,
    ) -> None:
        """Store the index location, defaulting to the service settings.

        Args:
            index_dir: Directory of the Whoosh index; defaults to
                ``settings.whoosh_index_dir``. ``index_path`` and ``path`` are
                accepted aliases so the dependency container can bind whichever
                name it finds.
            index_path: Alias of ``index_dir``.
            path: Alias of ``index_dir``.
        """
        self.index_dir = Path(index_dir or index_path or path or settings.whoosh_index_dir)
        self._index: Any = None

    def _get_index(self) -> Any:
        """Open the index on first use and cache it.

        Returns:
            The opened ``whoosh.index.FileIndex``.

        Raises:
            RuntimeError: If ``whoosh`` is missing or the index does not exist.
        """
        if self._index is None:
            try:
                from whoosh import index as whoosh_index
            except (ImportError, ModuleNotFoundError) as exc:
                raise RuntimeError("whoosh is not installed") from exc

            if not whoosh_index.exists_in(str(self.index_dir)):
                raise RuntimeError(
                    f"whoosh index not built yet at {self.index_dir}; "
                    "run scripts/build_whoosh_index.py"
                )
            self._index = whoosh_index.open_dir(str(self.index_dir))
        return self._index

    def search(
        self,
        query: str,
        filters: dict[str, Any] | None = None,
        top_k: int | None = None,
    ) -> list[Hit]:
        """Return the ``top_k`` best lexical matches of the query.

        Args:
            query: User query.
            filters: Metadata filters; ``corpus`` / ``device_model`` /
                ``error_code`` / ``source_name`` become Whoosh terms, the other
                keys are applied in Python on the stored metadata.
            top_k: Number of hits; defaults to ``settings.bm25_top_k``.

        Returns:
            Hits sorted by descending BM25 score, at most ``top_k`` items.

        Raises:
            RuntimeError: If the index is unusable -- reported as
                ``whoosh_unavailable`` by the orchestrator.
        """
        limit = settings.bm25_top_k if top_k is None else int(top_k)
        if limit <= 0 or not query.strip():
            return []

        from whoosh.qparser import MultifieldParser, OrGroup
        from whoosh.query import And, Term

        ix = self._get_index()
        parser = MultifieldParser(list(TEXT_FIELDS), schema=ix.schema, group=OrGroup)

        try:
            parsed = parser.parse(query.strip())
        except Exception as exc:  # noqa: BLE001 - a malformed query yields no hits
            logger.warning("whoosh query parse failed error_type={}", type(exc).__name__)
            return []

        terms: list[Any] = [parsed]
        remaining: dict[str, Any] = {}
        for key, value in (filters or {}).items():
            if value is None:
                continue
            if key in FILTER_FIELDS:
                terms.append(Term(key, str(value)))
            else:
                remaining[key] = value

        hits: list[Hit] = []
        with ix.searcher() as searcher:
            results = searcher.search(And(terms), limit=limit)
            for position, result in enumerate(results, start=1):
                metadata = _load_metadata(result.get(FIELD_METADATA))
                for name in (FIELD_CORPUS, "device_model", "error_code", "source_name"):
                    value = result.get(name)
                    if value:
                        metadata[name] = value
                if not metadata.get(FIELD_CORPUS):
                    metadata[FIELD_CORPUS] = infer_corpus(
                        source_name=metadata.get("source_name"),
                        source_path=metadata.get("source_path"),
                        metadata=metadata,
                    )
                metadata["stage"] = STAGE_BM25
                metadata["bm25_score"] = float(result.score or 0.0)

                hit = Hit(
                    chunk_id=str(result.get(FIELD_CHUNK_ID) or ""),
                    text=str(result.get(FIELD_TEXT) or ""),
                    score=float(result.score or 0.0),
                    source=SOURCE_BM25,
                    metadata=metadata,
                    rank=position,
                )
                if remaining and not self._matches(hit, remaining):
                    continue
                hits.append(hit)

        logger.info("whoosh search dir={} hits={}", self.index_dir, len(hits))
        return hits

    @staticmethod
    def _matches(hit: Hit, remaining: dict[str, Any]) -> bool:
        """Apply the filters Whoosh could not push down.

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

    def health(self) -> bool:
        """Report whether the index is present and readable.

        Returns:
            ``True`` when the index exists and can be opened.
        """
        try:
            self._get_index()
            return True
        except Exception as exc:  # noqa: BLE001 - unhealthy is a valid result
            logger.warning(
                "whoosh health probe failed dir={} error_type={}",
                self.index_dir,
                type(exc).__name__,
            )
            return False


__all__ = ["BM25Retriever", "SOURCE_BM25"]
