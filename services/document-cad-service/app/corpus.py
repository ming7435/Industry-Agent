"""Corpus labelling on the online side of the service.

The offline pipeline was left untouched: it writes ``source_name``,
``source_path`` and a ``metadata_json`` blob, nothing else. The online chain
still needs a corpus label per hit -- it is what
:mod:`app.evidence.builder` groups citations by (``alarms`` / ``cases`` /
``manuals`` / ``sop``, in that reading order).

So the label is derived **here**, at read time, from what the offline half
already produced:

1. an explicit ``corpus`` key in ``metadata_json``, if the document declared one;
2. the parent directory of ``source_path`` (``data/alarms/...``);
3. a keyword in ``source_name`` (``..._报警码数据.pdf`` -> ``alarms``);
4. ``settings.default_corpus``.

Deriving instead of storing means an already-ingested collection is labelled
correctly without re-running ingestion, and the offline writer keeps its schema.
"""

from __future__ import annotations

import re
from typing import Any

from config.settings import settings

CONTROLLED_CORPORA: tuple[str, ...] = ("alarms", "cases", "manuals", "sop")
"""Corpus labels the evidence layer knows how to order."""

CORPUS_BY_KEYWORD: dict[str, str] = {
    "报警码": "alarms",
    "报警": "alarms",
    "alarm": "alarms",
    "故障诊断": "cases",
    "故障": "cases",
    "troubleshooting": "cases",
    "case": "cases",
    "sop": "sop",
    "作业指导": "sop",
    "保养维护": "manuals",
    "安全规程": "manuals",
    "维修手册": "manuals",
    "manual": "manuals",
    "bom": "manuals",
}
"""Filename keywords mapped to a corpus, longest/first match wins."""

DEVICE_MODEL_PATTERN = re.compile(r"[A-Za-z]{1,5}\d{2,6}[A-Za-z0-9]*")
"""Loose ``letters + digits`` device-model pattern, e.g. ``TC820LTYsi``."""


def _from_metadata(metadata: dict[str, Any] | None) -> str:
    """Return the corpus declared by the document metadata, if any.

    Args:
        metadata: Parsed ``metadata_json`` of a chunk.

    Returns:
        The lower-cased corpus label, or an empty string when absent.
    """
    if not isinstance(metadata, dict):
        return ""
    value = metadata.get("corpus")
    return str(value).strip().lower() if value else ""


def _from_path(source_path: str | None) -> str:
    """Return the corpus implied by the directory of a document.

    Args:
        source_path: Path of the source document.

    Returns:
        The corpus label when a parent directory matches, else an empty string.
    """
    if not source_path:
        return ""
    for part in reversed(str(source_path).replace("\\", "/").split("/")[:-1]):
        if part.lower() in CONTROLLED_CORPORA:
            return part.lower()
    return ""


def _from_name(source_name: str | None) -> str:
    """Return the corpus implied by the filename of a document.

    Args:
        source_name: File name (or any display name) of the document.

    Returns:
        The corpus label of the first matching keyword, else an empty string.
    """
    if not source_name:
        return ""
    name = str(source_name).lower()
    for keyword, corpus in CORPUS_BY_KEYWORD.items():
        if keyword.lower() in name:
            return corpus
    return ""


def infer_corpus(
    *,
    source_name: str | None = None,
    source_path: str | None = None,
    metadata: dict[str, Any] | None = None,
    default: str | None = None,
) -> str:
    """Return the corpus label of a chunk, derived from offline fields.

    Args:
        source_name: File name of the source document.
        source_path: Path of the source document.
        metadata: Parsed ``metadata_json`` of the chunk.
        default: Fallback label; ``settings.default_corpus`` when omitted.

    Returns:
        One of :data:`CONTROLLED_CORPORA` (or the fallback when nothing matches).
    """
    for candidate in (
        _from_metadata(metadata),
        _from_path(source_path),
        _from_name(source_name),
    ):
        if candidate:
            return candidate
    return default or settings.default_corpus


def infer_device_model(source_name: str | None, source_path: str | None = None) -> str:
    """Return a plausible device model for a document.

    Args:
        source_name: File name of the source document.
        source_path: Path of the source document, used as a fallback.

    Returns:
        The first ``letters + digits`` token (``TC820LTYsi``), or an empty string.
    """
    for candidate in (source_name, source_path):
        if not candidate:
            continue
        match = DEVICE_MODEL_PATTERN.search(str(candidate))
        if match:
            return match.group(0)
    return ""


__all__ = [
    "CONTROLLED_CORPORA",
    "CORPUS_BY_KEYWORD",
    "infer_corpus",
    "infer_device_model",
]
