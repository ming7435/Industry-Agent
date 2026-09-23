"""Knowledge Evidence Pack 校验。"""

from __future__ import annotations

from typing import Any, Mapping, Sequence


SOURCE_ALIASES = {
    "alarm_code": "alarm",
    "alarm_codes": "alarm",
    "fault": "case",
    "fault_case": "case",
    "fault_cases": "case",
    "manuals": "manual",
    "maintenance_manual": "manual",
    "procedure": "sop",
}


def normalize_source(value: Any) -> str:
    normalized = str(value or "").strip().lower()
    return SOURCE_ALIASES.get(normalized, normalized)


class KnowledgeEvidenceValidator:
    """检查证据是否可追踪、来源是否覆盖、结果是否足够支撑后续 Agent。"""

    @classmethod
    def validate(
        cls,
        documents: Sequence[Mapping[str, Any]],
        evidence: Sequence[Mapping[str, Any]],
        required_sources: list[str],
        confidence: float,
        status: str,
    ) -> list[str]:
        findings: list[str] = []
        if not documents and not evidence:
            findings.append("未检索到可追踪知识证据")
        if documents and not all(str(item.get("document_id") or "").strip() for item in documents):
            findings.append("存在缺少 document_id 的知识文档")
        if documents and not all(str(item.get("source") or "").strip() for item in documents):
            findings.append("存在缺少来源的知识文档")
        available = {normalize_source(item.get("knowledge_type") or item.get("source_type")) for item in evidence}
        available.update(normalize_source(item.get("metadata", {}).get("knowledge_type")) for item in documents)
        for required in required_sources:
            value = normalize_source(required)
            if value and value not in available:
                findings.append("缺少必需知识来源：%s" % required)
        if not 0 <= float(confidence or 0) <= 1:
            findings.append("知识检索 confidence 超出 0~1 范围")
        if status == "completed" and not documents:
            findings.append("状态为 completed 但没有知识文档")
        return cls._dedupe(findings)

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values
