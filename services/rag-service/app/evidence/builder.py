"""Turn ranked retrieval hits into a clean, citable evidence bundle.

Three concerns are handled here, in this order:

1. **Grouping** -- hits are grouped by corpus (alarms, cases, manuals, sop) and
   emitted in a fixed order, so the citation numbering follows the way a
   technician reads a diagnostic report: what the machine reported first, then
   what went wrong before, then the reference documentation.
2. **De-duplication** -- a near-duplicate is dropped through a 3-gram Jaccard
   similarity check, because overlapping chunks of the same manual page
   otherwise flood the prompt with the same sentence three times.
3. **Normalisation** -- field values are read from the hit itself or from its
   metadata (the offline ingestion layer is free to choose either location).
"""

from __future__ import annotations

from collections import defaultdict
from math import inf
from typing import Any

from app.retrieval import Hit

from .models import Evidence, EvidenceBundle

_SOURCE_ORDER: tuple[str, ...] = ("alarms", "cases", "manuals", "sop")
"""Preferred emission order of the corpora; unknown sources come last."""

_DEDUP_THRESHOLD = 0.85
"""Jaccard similarity above which two chunks are considered duplicates."""

_NGRAM_SIZE = 3
"""Character n-gram size used by the similarity check (works for CJK too)."""


def _metadata(hit: Hit) -> dict[str, Any]:
    """Return the hit metadata as a plain dict.

    Args:
        hit: A retrieval hit.

    Returns:
        The metadata mapping, or an empty dict when absent or malformed.
    """
    value = getattr(hit, "metadata", None)
    return value if isinstance(value, dict) else {}


def _value(hit: Hit, name: str, *aliases: str) -> Any:
    """Read a field from the hit object, then from its metadata.

    Args:
        hit: A retrieval hit.
        name: Primary field name.
        *aliases: Alternative names accepted for the same field.

    Returns:
        The first non-``None`` value found, otherwise an empty string.
    """
    for key in (name, *aliases):
        value = getattr(hit, key, None)
        if value is not None:
            return value
        value = _metadata(hit).get(key)
        if value is not None:
            return value
    return ""


def _text(hit: Hit) -> str:
    """Return the chunk text of a hit.

    Args:
        hit: A retrieval hit.

    Returns:
        The chunk text, or an empty string when unavailable.
    """
    return str(_value(hit, "text", "content"))


def _source(hit: Hit) -> str:
    """Return the normalised corpus name of a hit.

    ``Hit.source`` carries the *route* label (``bm25`` / ``dense`` / ``fusion``)
    promised by the API contract, while the corpus written by the offline
    pipeline travels in ``metadata["corpus"]``. The corpus wins here because the
    evidence layer groups citations the way a technician reads a report, not by
    retrieval route.

    Args:
        hit: A retrieval hit.

    Returns:
        The lower-cased corpus name, empty when unavailable.
    """
    corpus = str(_value(hit, "corpus")).strip().lower()
    if corpus:
        return corpus
    return str(_value(hit, "source")).strip().lower()


def _score(hit: Hit) -> float:
    """Return the numeric score of a hit.

    Args:
        hit: A retrieval hit.

    Returns:
        The score as float, or ``-inf`` when it is missing or not numeric so
        that broken hits sort last instead of raising.
    """
    value = _value(hit, "score")
    try:
        return float(value)
    except (TypeError, ValueError):
        return -inf


def _ngrams(text: str) -> set[str]:
    """Build the character n-gram set of a text.

    Whitespace is removed first so that line breaks of the two chunkings of the
    same page do not defeat the comparison.

    Args:
        text: Raw text.

    Returns:
        Set of character n-grams (shorter than ``_NGRAM_SIZE`` for tiny texts).
    """
    normalized = "".join(text.split())
    if not normalized:
        return set()
    if len(normalized) < _NGRAM_SIZE:
        return {normalized}
    return {
        normalized[index : index + _NGRAM_SIZE]
        for index in range(len(normalized) - _NGRAM_SIZE + 1)
    }


def _jaccard(left: str, right: str) -> float:
    """Compute the Jaccard similarity of two texts over their n-gram sets.

    Args:
        left: First text.
        right: Second text.

    Returns:
        Similarity in ``[0.0, 1.0]``; ``1.0`` when both texts are empty.
    """
    left_grams = _ngrams(left)
    right_grams = _ngrams(right)
    if not left_grams and not right_grams:
        return 1.0
    if not left_grams or not right_grams:
        return 0.0
    return len(left_grams & right_grams) / len(left_grams | right_grams)


def _is_duplicate(text: str, retained_texts: list[str]) -> bool:
    """Tell whether a text duplicates one of the retained texts.

    Args:
        text: Candidate text.
        retained_texts: Texts already accepted into the bundle.

    Returns:
        ``True`` when the n-gram similarity reaches ``_DEDUP_THRESHOLD``.
    """
    return any(
        _jaccard(text, retained_text) >= _DEDUP_THRESHOLD
        for retained_text in retained_texts
    )


def _evidence_from_hit(hit: Hit, source: str, citation_id: str) -> Evidence:
    """Convert a retrieval hit into an :class:`Evidence`.

    Args:
        hit: A retrieval hit.
        source: Already-normalised corpus name.
        citation_id: Citation marker to attach, e.g. ``"[2]"``.

    Returns:
        The normalised evidence entry.
    """
    return Evidence(
        chunk_id=str(_value(hit, "chunk_id")),
        text=_text(hit),
        score=_score(hit),
        source=source,
        device_model=str(_value(hit, "device_model", "device", "model")),
        error_code=str(_value(hit, "error_code", "fault_code", "alarm_code")),
        citation_id=citation_id,
    )


def build_bundle(query: str, hits: list[Hit]) -> EvidenceBundle:
    """Organise ranked retrieval hits into a de-duplicated evidence bundle.

    Args:
        query: The user query the hits were retrieved for.
        hits: Final ranked hits (after fusion and, when available, reranking).

    Returns:
        An :class:`EvidenceBundle` whose evidences are grouped by corpus, sorted
        by descending score within each corpus, de-duplicated across the whole
        bundle and numbered from ``[1]``. Never ``None`` -- an empty hit list
        yields an empty bundle.
    """
    if not hits:
        return EvidenceBundle(query=query, evidences=[])

    groups: dict[str, list[Hit]] = defaultdict(list)
    for hit in hits:
        groups[_source(hit)].append(hit)

    source_order = list(_SOURCE_ORDER)
    source_order.extend(
        source for source in sorted(groups) if source not in _SOURCE_ORDER
    )

    evidences: list[Evidence] = []
    retained_texts: list[str] = []
    for source in source_order:
        source_hits = sorted(groups.get(source, []), key=_score, reverse=True)
        for hit in source_hits:
            text = _text(hit)
            if _is_duplicate(text, retained_texts):
                continue
            retained_texts.append(text)
            evidences.append(
                _evidence_from_hit(
                    hit,
                    source=source,
                    citation_id=f"[{len(evidences) + 1}]",
                )
            )

    return EvidenceBundle(query=query, evidences=evidences)
