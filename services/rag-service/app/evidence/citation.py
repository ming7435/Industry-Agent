"""Render an evidence bundle as citation-annotated prompt context.

The output is plain text, one block per evidence, each block headed by the
citation marker the LLM is instructed to reuse in its answer.  Keeping the
marker in the context (instead of only in a JSON side-channel) is what allows the
generation prompt to require grounded references such as ``[2][5]`` and to be
checked afterwards by a human reader.
"""

from __future__ import annotations

from .models import EvidenceBundle

_SOURCE_LABELS: dict[str, str] = {
    "alarms": "报警记录",
    "cases": "维修案例",
    "manuals": "维修手册",
    "sop": "标准作业流程",
}
"""Human-readable corpus labels used in the citation header."""

_EMPTY_EVIDENCE_TEXT = "（未检索到可用证据）"
"""Context text returned for an empty bundle."""


def _citation_number(citation_id: str, fallback: int) -> str:
    """Extract the bare number of a citation marker.

    Args:
        citation_id: Marker such as ``"[3]"``, ``"3"`` or an empty string.
        fallback: Value used when the marker carries no content.

    Returns:
        The number to print in the citation header.
    """
    value = citation_id.strip()
    if value.startswith("[") and value.endswith("]"):
        value = value[1:-1].strip()
    return value or str(fallback)


def format_citations(bundle: EvidenceBundle) -> str:
    """Format each evidence as an LLM-readable, citation-labelled block.

    Args:
        bundle: The evidence bundle produced by
            :func:`app.evidence.builder.build_bundle`.

    Returns:
        Concatenated evidence blocks separated by blank lines, or a placeholder
        sentence when the bundle is empty (so the prompt never contains an empty
        context section).
    """
    if not bundle.evidences:
        return _EMPTY_EVIDENCE_TEXT

    sections: list[str] = []
    for index, evidence in enumerate(bundle.evidences, start=1):
        source = _SOURCE_LABELS.get(evidence.source.lower(), evidence.source)
        number = _citation_number(evidence.citation_id, index)
        device = evidence.device_model or "未标注"
        error_code = evidence.error_code or "未标注"
        sections.append(
            "\n".join(
                (
                    f"【证据 {number}】来源：{source} | "
                    f"设备：{device} | 故障码：{error_code}",
                    f"正文：{evidence.text}",
                )
            )
        )
    return "\n\n".join(sections)
