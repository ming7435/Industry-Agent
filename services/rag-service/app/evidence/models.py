"""Data structures of the evidence layer.

An :class:`Evidence` is the LLM-facing, normalised view of a retrieved chunk: it
drops retrieval-specific bookkeeping and keeps only the fields a maintenance
technician cares about (device model, fault code, provenance).  An
:class:`EvidenceBundle` groups the evidences of one request and carries the
request-level degradation state so a caller can decide whether the answer is
trustworthy.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class Evidence:
    """A single piece of retrievable knowledge handed to the LLM."""

    chunk_id: str
    """Identifier of the source chunk in the offline index."""

    text: str
    """Chunk content."""

    score: float
    """Relevance score (rerank score when reranking ran, RRF score otherwise)."""

    source: str
    """Originating corpus: ``alarms`` / ``cases`` / ``manuals`` / ``sop``."""

    device_model: str
    """Device model the evidence applies to, when known."""

    error_code: str
    """Fault or alarm code the evidence applies to, when known."""

    citation_id: str
    """Citation marker used in the answer, e.g. ``"[3]"``."""


@dataclass
class EvidenceBundle:
    """The ordered evidences of one request plus its degradation state."""

    query: str
    """The user query the evidences were retrieved for."""

    evidences: list[Evidence] = field(default_factory=list)
    """De-duplicated, source-grouped evidences in citation order."""

    degraded: bool = False
    """Whether any stage of the chain ran in degraded mode."""

    degrade_reason: str = ""
    """Reason of the degradation, empty when ``degraded`` is ``False``."""
