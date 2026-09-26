"""Data contracts for the local RAG evaluation dataset and report."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class EvaluationCase:
    id: str
    question: str
    filters: dict[str, Any] = field(default_factory=dict)
    expected_evidence_ids: list[str] = field(default_factory=list)
    expected_sources: list[str] = field(default_factory=list)
    relevant_terms: list[str] = field(default_factory=list)
    should_answer: bool = True

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class CaseEvaluation:
    id: str
    metrics: dict[str, float | None] = field(default_factory=dict)
    evidence_ids: list[str] = field(default_factory=list)
    evidence_sources: list[str] = field(default_factory=list)
    degraded: bool = False
    degrade_reason: str | None = None
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class EvaluationReport:
    version: str
    run_at_utc: str
    base_url: str
    mode: str
    total_cases: int
    passed_cases: int
    failed_cases: int
    aggregate_metrics: dict[str, float | None]
    suggested_thresholds: dict[str, float]
    cases: list[CaseEvaluation]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def _string_list(value: Any, name: str) -> list[str]:
    if not isinstance(value, list) or any(not isinstance(item, str) or not item.strip() for item in value):
        raise ValueError(f"{name} 必须是非空字符串列表")
    return [item.strip() for item in value]


def load_dataset(path: str | Path) -> list[EvaluationCase]:
    """Load a JSONL gold set, including line-numbered validation errors."""
    cases: list[EvaluationCase] = []
    seen: set[str] = set()
    for line_number, raw_line in enumerate(Path(path).read_text(encoding="utf-8-sig").splitlines(), start=1):
        if not raw_line.strip():
            continue
        try:
            row = json.loads(raw_line)
            if not isinstance(row, dict):
                raise ValueError("题目必须是 JSON 对象")
            case_id = row.get("id")
            question = row.get("question")
            if not isinstance(case_id, str) or not case_id.strip():
                raise ValueError("id 不能为空")
            if not isinstance(question, str) or not question.strip():
                raise ValueError("question 不能为空")
            case_id = case_id.strip()
            if case_id in seen:
                raise ValueError(f"id 重复: {case_id}")
            filters = row.get("filters", {})
            if not isinstance(filters, dict):
                raise ValueError("filters 必须是对象")
            should_answer = row.get("should_answer", True)
            if not isinstance(should_answer, bool):
                raise ValueError("should_answer 必须是布尔值")
            case = EvaluationCase(
                id=case_id,
                question=question.strip(),
                filters=dict(filters),
                expected_evidence_ids=_string_list(row.get("expected_evidence_ids", []), "expected_evidence_ids"),
                expected_sources=_string_list(row.get("expected_sources", []), "expected_sources"),
                relevant_terms=_string_list(row.get("relevant_terms", []), "relevant_terms"),
                should_answer=should_answer,
            )
        except (json.JSONDecodeError, ValueError) as exc:
            raise ValueError(f"数据集第 {line_number} 行无效: {exc}") from exc
        seen.add(case_id)
        cases.append(case)
    if not cases:
        raise ValueError("数据集不能为空")
    return cases
