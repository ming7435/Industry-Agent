from evaluation.models import EvaluationCase
import json

import pytest

from evaluation.runner import aggregate_evaluations, evaluate_case, run_evaluation


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
    assert result.metrics["id_based_context_recall"] == 1.0
    assert result.metrics["id_based_context_precision"] == 0.5
    assert result.diagnostics["latency_ms"] == 125.0
    assert 'evidence_precision' not in result.metrics


def test_latency_breakdown_uses_total_for_retrieval_and_llm_for_answer():
    result = evaluate_case(case(), response(latency_ms={"total": 125, "llm": 40}), top_k=2)

    assert result.diagnostics['latency_ms'] == 125.0
    assert result.diagnostics['latency_breakdown'] == {'total': 125.0, 'llm': 40.0}


def test_corpus_labels_cannot_replace_reference_ids_or_become_keyword_scores():
    result = evaluate_case(
        case(expected_evidence_ids=[], expected_sources=["SOP", "cases"], relevant_terms=[]),
        response(hits=[{"document_id": "doc-1", "text": "repair", "source": "SOP", "metadata": {}}]),
        top_k=5,
    )

    assert result.evidence_sources == ['sop']
    assert result.metrics['id_based_context_recall'] is None
    assert result.metrics['id_based_context_precision'] is None
    assert result.status == 'insufficient_data'


def test_citation_ranges_are_diagnostics_not_semantic_quality_scores():
    valid = evaluate_case(case(), response(answer="检查冷却并复测。[1]"), top_k=2)
    invalid = evaluate_case(case(), response(answer="检查冷却。[0][3]"), top_k=2)
    refused = evaluate_case(
        case(id="no-evidence", expected_evidence_ids=[], expected_sources=[], relevant_terms=[], should_answer=False),
        response(answer="现有证据不足，无法确认具体零件。"),
        top_k=2,
    )

    assert valid.diagnostics['citation_range_valid'] is True
    assert invalid.diagnostics['citation_range_valid'] is False
    assert refused.diagnostics['should_answer'] is False
    assert valid.metrics['faithfulness'] is None
    assert invalid.metrics['faithfulness'] is None
    assert 'answer_completeness' not in valid.metrics


def test_degraded_response_is_recorded_and_missing_answer_metrics_are_null():
    result = evaluate_case(case(), response(answer=None, degraded=True, degrade_reason="embedding unavailable"), top_k=2)

    assert result.degraded is True
    assert result.degrade_reason
    assert result.metrics['faithfulness'] is None
    assert all(score is None for score in result.metrics.values())
    assert aggregate_evaluations([result], base_url="http://rag", mode="no_llm").failed_cases == 1


def test_aggregation_averages_only_present_metrics_and_retains_errors():
    first = evaluate_case(case(id="one"), response(), top_k=2)
    second = evaluate_case(case(id="two", relevant_terms=[]), response(answer=None), top_k=2)
    second.error = "HTTP 503"

    report = aggregate_evaluations([first, second], base_url="http://rag", mode="no_llm")

    assert report.total_cases == 2
    assert report.failed_cases == 1
    assert report.aggregate_metrics['id_based_context_recall'] == 1.0
    assert report.aggregate_metrics['faithfulness'] is None
    assert report.metric_coverage['faithfulness'] == 0
    assert report.quality_verdict == 'not_assessed'
    assert report.cases[1].error == "HTTP 503"
    assert report.mode == "no_llm"


def test_run_evaluation_posts_search_payload_and_writes_two_report_files(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    dataset.write_text(
        json.dumps({"id": "one", "question": "Q1", "filters": {"device": "D1"}}, ensure_ascii=False) + "\n"
        + json.dumps({"id": "two", "question": "Q2"}, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    requests = []

    def request_fn(url, payload, timeout_s):
        requests.append((url, payload, timeout_s))
        return response(answer="答案 [1]")

    report = run_evaluation(
        "http://rag:8020",
        dataset,
        tmp_path / "results",
        top_k=3,
        no_llm=True,
        request_fn=request_fn,
    )

    assert [request[0] for request in requests] == ["http://rag:8020/search", "http://rag:8020/search"]
    assert requests[0][1] == {"query": "Q1", "filters": {"device": "D1"}, "top_n": 3, 'generate_answer': False}
    assert (tmp_path / "results" / "latest.json").exists()
    timestamped = [path for path in (tmp_path / "results").glob("*.json") if path.name != "latest.json"]
    assert len(timestamped) == 1
    assert report.total_cases == 2
    saved = json.loads((tmp_path / "results" / "latest.json").read_text(encoding="utf-8"))
    assert saved['version'] == '2'
    assert saved['framework'] == 'ragas'
    assert saved['framework_version'] == '0.4.3'


def test_run_evaluation_filters_cases_limits_and_keeps_individual_errors(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    dataset.write_text(
        "\n".join(json.dumps({"id": item, "question": item}) for item in ("one", "two", "three")) + "\n",
        encoding="utf-8",
    )
    calls = []

    def request_fn(url, payload, timeout_s):
        calls.append(payload["query"])
        if payload["query"] == "two":
            raise TimeoutError("timed out")
        return response()

    report = run_evaluation(
        "http://rag",
        dataset,
        tmp_path / "results",
        case_ids=["three", "two"],
        limit=2,
        no_llm=True,
        request_fn=request_fn,
    )

    assert calls == ["three", "two"]
    assert report.cases[1].error == '评测请求超时'
    assert report.cases[1].metrics['id_based_context_recall'] is None
    assert report.failed_cases == 1
    with pytest.raises(ValueError, match="未知题目 ID"):
        run_evaluation("http://rag", dataset, tmp_path / "other", case_ids=["missing"], request_fn=request_fn, no_llm=True)


def test_no_llm_preserves_retrieval_metrics_and_nulls_answer_metrics(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    dataset.write_text(json.dumps({"id": "one", "question": "Q"}) + "\n", encoding="utf-8")

    report = run_evaluation(
        "http://rag",
        dataset,
        tmp_path / "results",
        no_llm=True,
        request_fn=lambda url, payload, timeout_s: response(),
    )

    assert report.mode == "no_llm"
    assert report.cases[0].diagnostics['latency_ms'] == 125.0
    assert report.cases[0].metrics['faithfulness'] is None
    assert report.cases[0].metrics['answer_relevancy'] is None


def test_failed_request_does_not_turn_expected_sources_into_zero_score(tmp_path):
    dataset = tmp_path / "dataset.jsonl"
    dataset.write_text(
        json.dumps({"id": "one", "question": "Q", "expected_sources": ["sop"]}) + "\n",
        encoding="utf-8",
    )

    report = run_evaluation(
        "http://rag",
        dataset,
        tmp_path / "results",
        request_fn=lambda url, payload, timeout_s: (_ for _ in ()).throw(TimeoutError("timed out")),
        no_llm=True,
    )

    assert report.cases[0].error == '评测请求超时'
    assert report.cases[0].metrics['id_based_context_recall'] is None
    assert all(value is None for value in report.cases[0].metrics.values())
