from evaluation.models import EvaluationCase
from evaluation.runner import aggregate_evaluations, evaluate_case


def case(**overrides):
    values = {
        "id": "case-1",
        "question": "主轴怎么检查？",
        "expected_evidence_ids": ["EXP-1"],
        "expected_sources": ["sop"],
        "relevant_terms": ["冷却", "复测"],
        "should_answer": True,
    }
    values.update(overrides)
    return EvaluationCase(**values)


def response(*, answer="按 SOP 检查冷却并复测。[1]", hits=None, **overrides):
    payload = {
        "hits": hits
        or [
            {"chunk_id": "EXP-1", "text": "检查冷却后复测", "source": "fusion", "metadata": {"corpus": "SOP"}},
            {"chunk_id": "EXP-2", "text": "主轴报警说明", "source": "bm25", "metadata": {"corpus": "alarms"}},
        ],
        "answer": answer,
        "degraded": False,
        "degrade_reason": None,
        "latency_ms": 125,
    }
    payload.update(overrides)
    return payload


def test_evidence_ids_take_precedence_and_evidence_metrics_are_computed():
    result = evaluate_case(case(), response(), top_k=2)

    assert result.evidence_ids == ["EXP-1", "EXP-2"]
    assert result.evidence_sources == ["sop", "alarms"]
    assert result.metrics["recall_at_k"] == 1.0
    assert result.metrics["source_coverage"] == 1.0
    assert result.metrics["evidence_precision"] == 0.5
    assert result.metrics["retrieval_latency_ms"] == 125.0


def test_source_fallback_is_case_insensitive_and_empty_terms_are_null():
    result = evaluate_case(
        case(expected_evidence_ids=[], expected_sources=["SOP", "cases"], relevant_terms=[]),
        response(hits=[{"document_id": "doc-1", "text": "repair", "source": "SOP", "metadata": {}}]),
        top_k=5,
    )

    assert result.metrics["recall_at_k"] == 0.5
    assert result.metrics["source_coverage"] == 0.5
    assert result.metrics["evidence_precision"] is None


def test_citations_completeness_and_abstention_are_checked_against_response():
    valid = evaluate_case(case(), response(answer="检查冷却并复测。[1]"), top_k=2)
    invalid = evaluate_case(case(), response(answer="检查冷却。[0][3]"), top_k=2)
    refused = evaluate_case(
        case(id="no-evidence", expected_evidence_ids=[], expected_sources=[], relevant_terms=[], should_answer=False),
        response(answer="现有证据不足，无法确认具体零件。"),
        top_k=2,
    )

    assert valid.metrics["citation_validity"] == 1.0
    assert valid.metrics["answer_completeness"] == 1.0
    assert valid.metrics["abstention_accuracy"] == 1.0
    assert invalid.metrics["citation_validity"] == 0.0
    assert refused.metrics["abstention_accuracy"] == 1.0


def test_degraded_response_is_recorded_and_missing_answer_metrics_are_null():
    result = evaluate_case(case(), response(answer=None, degraded=True, degrade_reason="embedding unavailable"), top_k=2)

    assert result.degraded is True
    assert result.degrade_reason == "embedding unavailable"
    assert result.metrics["citation_validity"] is None
    assert result.metrics["answer_completeness"] is None


def test_aggregation_averages_only_present_metrics_and_retains_errors():
    first = evaluate_case(case(id="one"), response(), top_k=2)
    second = evaluate_case(case(id="two", relevant_terms=[]), response(answer=None), top_k=2)
    second.error = "HTTP 503"

    report = aggregate_evaluations([first, second], base_url="http://rag", mode="no_llm")

    assert report.total_cases == 2
    assert report.failed_cases == 1
    assert report.aggregate_metrics["recall_at_k"] == 1.0
    assert report.aggregate_metrics["answer_completeness"] == 1.0
    assert report.cases[1].error == "HTTP 503"
    assert report.mode == "no_llm"
