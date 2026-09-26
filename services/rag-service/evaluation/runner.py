"""Deterministic metrics and local orchestration primitives for RAG evaluation."""

from __future__ import annotations

import re
import json
import urllib.error
import urllib.request
from collections.abc import Iterable
from datetime import datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any

from .models import CaseEvaluation, EvaluationCase, EvaluationReport

_CITATION_RE = re.compile(r"\[(\d+)\]")
_REFUSAL_SIGNALS = (
    "证据不足",
    "无法确认",
    "无法确定",
    "没有足够证据",
    "未找到相关证据",
    "insufficient evidence",
    "cannot determine",
    "unable to confirm",
    "not enough evidence",
)
_THRESHOLDS = {
    "recall_at_k": 0.80,
    "source_coverage": 0.80,
    "citation_validity": 0.95,
    "abstention_accuracy": 0.90,
}


def _metadata(hit: dict[str, Any]) -> dict[str, Any]:
    value = hit.get("metadata")
    return value if isinstance(value, dict) else {}


def _evidence_id(hit: dict[str, Any]) -> str:
    metadata = _metadata(hit)
    return str(hit.get("chunk_id") or hit.get("document_id") or metadata.get("chunk_id") or metadata.get("document_id") or "").strip()


def _source(hit: dict[str, Any]) -> str:
    metadata = _metadata(hit)
    value = metadata.get("corpus") or metadata.get("source") or hit.get("corpus") or hit.get("source")
    return str(value).strip().lower() if value else ""


def _text(hit: dict[str, Any]) -> str:
    return str(hit.get("text") or hit.get("content") or "")


def _normalise_hits(response: dict[str, Any], top_k: int) -> list[dict[str, Any]]:
    hits = response.get("hits")
    if not isinstance(hits, list):
        return []
    return [hit for hit in hits[:top_k] if isinstance(hit, dict)]


def _fraction(numerator: int, denominator: int) -> float | None:
    return numerator / denominator if denominator else None


def _citation_validity(answer: str | None, evidence_count: int) -> float | None:
    if answer is None:
        return None
    citations = [int(value) for value in _CITATION_RE.findall(answer)]
    if not citations:
        return 0.0
    return _fraction(sum(1 for citation in citations if 1 <= citation <= evidence_count), len(citations))


def _abstention_accuracy(answer: str | None, should_answer: bool) -> float | None:
    if answer is None:
        return None
    if should_answer:
        return 1.0
    lowered = answer.casefold()
    return 1.0 if any(signal.casefold() in lowered for signal in _REFUSAL_SIGNALS) else 0.0


def evaluate_case(case: EvaluationCase, response: dict[str, Any], top_k: int = 5) -> CaseEvaluation:
    """Calculate one case without making assumptions about hit metadata shape."""
    hits = _normalise_hits(response, top_k)
    evidence_ids = [_evidence_id(hit) for hit in hits]
    evidence_sources = [_source(hit) for hit in hits]
    expected_ids = {item.casefold() for item in case.expected_evidence_ids}
    expected_sources = {item.casefold() for item in case.expected_sources}
    actual_ids = {item.casefold() for item in evidence_ids if item}
    actual_sources = {item.casefold() for item in evidence_sources if item}

    if expected_ids:
        recall = _fraction(len(expected_ids & actual_ids), len(expected_ids))
    elif expected_sources:
        recall = _fraction(len(expected_sources & actual_sources), len(expected_sources))
    else:
        recall = None
    source_coverage = _fraction(len(expected_sources & actual_sources), len(expected_sources)) if expected_sources else None

    terms = [term.casefold() for term in case.relevant_terms if term.strip()]
    non_empty_hits = [_text(hit) for hit in hits if _text(hit).strip()]
    evidence_precision = None
    if terms:
        evidence_precision = _fraction(
            sum(1 for text in non_empty_hits if any(term in text.casefold() for term in terms)),
            len(non_empty_hits),
        )

    answer = response.get("answer")
    answer = str(answer) if answer is not None else None
    answer_completeness = _fraction(sum(1 for term in terms if term in answer.casefold()), len(terms)) if answer is not None and terms else None
    latency = response.get("latency_ms")
    try:
        retrieval_latency = float(latency) if latency is not None else None
    except (TypeError, ValueError):
        retrieval_latency = None

    return CaseEvaluation(
        id=case.id,
        metrics={
            "recall_at_k": recall,
            "source_coverage": source_coverage,
            "evidence_precision": evidence_precision,
            "retrieval_latency_ms": retrieval_latency,
            "citation_validity": _citation_validity(answer, len(hits)),
            "answer_completeness": answer_completeness,
            "abstention_accuracy": _abstention_accuracy(answer, case.should_answer),
            "answer_latency_ms": retrieval_latency,
        },
        evidence_ids=evidence_ids,
        evidence_sources=evidence_sources,
        degraded=bool(response.get("degraded", False)),
        degrade_reason=str(response.get("degrade_reason")) if response.get("degrade_reason") else None,
        error=str(response.get("error")) if response.get("error") else None,
    )


def _aggregate_metric(cases: Iterable[CaseEvaluation], key: str) -> float | None:
    values = [item.metrics.get(key) for item in cases]
    values = [float(value) for value in values if value is not None]
    return mean(values) if values else None


def aggregate_evaluations(
    cases: list[CaseEvaluation],
    *,
    base_url: str,
    mode: str,
    run_at_utc: str | None = None,
) -> EvaluationReport:
    """Build a report while excluding null metrics from averages."""
    failed = sum(1 for item in cases if item.error)
    metric_names = (
        "recall_at_k",
        "source_coverage",
        "evidence_precision",
        "retrieval_latency_ms",
        "citation_validity",
        "answer_completeness",
        "abstention_accuracy",
        "answer_latency_ms",
    )
    return EvaluationReport(
        version="1",
        run_at_utc=run_at_utc or datetime.now(timezone.utc).isoformat(),
        base_url=base_url,
        mode=mode,
        total_cases=len(cases),
        passed_cases=len(cases) - failed,
        failed_cases=failed,
        aggregate_metrics={name: _aggregate_metric(cases, name) for name in metric_names},
        suggested_thresholds=dict(_THRESHOLDS),
        cases=cases,
    )


def _request_search(base_url: str, payload: dict[str, Any], timeout_s: float) -> dict[str, Any]:
    request = urllib.request.Request(
        base_url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout_s) as response:
        body = json.loads(response.read().decode("utf-8"))
    if not isinstance(body, dict):
        raise ValueError("RAG 响应必须是 JSON 对象")
    return body


def _null_answer_metrics(result: CaseEvaluation) -> None:
    for name in ("citation_validity", "answer_completeness", "abstention_accuracy", "answer_latency_ms"):
        result.metrics[name] = None


def run_evaluation(
    base_url: str,
    dataset_path: str | Path,
    output_dir: str | Path,
    limit: int | None = None,
    no_llm: bool = False,
    *,
    case_ids: list[str] | None = None,
    top_k: int = 5,
    request_fn: Any = None,
) -> EvaluationReport:
    """Run the local evaluator and persist ``latest.json`` plus a timestamped report."""
    from .models import load_dataset

    cases = load_dataset(dataset_path)
    if case_ids:
        known = {case.id for case in cases}
        unknown = [case_id for case_id in case_ids if case_id not in known]
        if unknown:
            raise ValueError(f"未知题目 ID: {', '.join(unknown)}")
        by_id = {case.id: case for case in cases}
        selected = [by_id[case_id] for case_id in case_ids]
    else:
        selected = cases
    if limit is not None:
        if limit < 1:
            raise ValueError("limit 必须大于 0")
        selected = selected[:limit]
    if not selected:
        raise ValueError("没有可运行的评测题目")
    request_fn = request_fn or _request_search
    evaluated: list[CaseEvaluation] = []
    for case in selected:
        payload = {"query": case.question, "filters": case.filters, "top_n": top_k}
        try:
            response = request_fn(f"{base_url.rstrip('/')}/search", payload, 90.0)
            if not isinstance(response, dict):
                raise ValueError("RAG 响应必须是 JSON 对象")
            result = evaluate_case(case, response, top_k=top_k)
        except (Exception) as exc:  # each case is isolated by design
            result = evaluate_case(case, {"error": str(exc)}, top_k=top_k)
            result.error = str(exc)
        if no_llm:
            _null_answer_metrics(result)
        evaluated.append(result)

    run_at = datetime.now(timezone.utc)
    report = aggregate_evaluations(
        evaluated,
        base_url=base_url,
        mode="no_llm" if no_llm else "full",
        run_at_utc=run_at.isoformat(),
    )
    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    serialized = json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n"
    (destination / "latest.json").write_text(serialized, encoding="utf-8")
    timestamp = run_at.strftime("%Y%m%dT%H%M%S.%fZ")
    (destination / f"{timestamp}.json").write_text(serialized, encoding="utf-8")
    return report
