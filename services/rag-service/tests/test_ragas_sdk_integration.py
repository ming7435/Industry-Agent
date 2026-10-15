"""真实 RAGAS 计算分数，裁判及向量只访问本测试的隔离HTTP服务器。"""
import builtins
import json
import subprocess
import sys

import pytest

from evaluation.models import EvaluationCase
from evaluation.ragas_engine import RagasEvaluator
from evaluation.runner import evaluate_case, run_evaluation
from ragas_test_server import http_adapter, model_reply


def example(**changes):
    values = {'id': 'sample', 'question': '主轴怎么检查？', 'expected_evidence_ids': ['E1'],
              'reference': '检查冷却并复测', 'reference_reviewed': True}
    return EvaluationCase(**{**values, **changes})


def reply():
    return {'answer': '检查冷却并复测。[1]', 'hits': [
        {'chunk_id': 'E1', 'text': '检查冷却', 'metadata': {'corpus': 'sop'}},
        {'chunk_id': 'E2', 'text': '其他资料', 'metadata': {'corpus': 'manual'}}]}


def test_real_ragas_scores_all_metrics_through_existing_model_http_contract():
    with http_adapter(model_reply) as (url, calls):
        engine = RagasEvaluator(model_service_base_url=url)
        result = evaluate_case(example(), reply(), evaluator=engine)
    assert result.status == 'completed', result.metric_errors
    assert result.metrics['id_based_context_precision'] == 0.5
    assert result.metrics['id_based_context_recall'] == 1.0
    assert result.metrics['faithfulness'] == 0.5
    assert result.metrics['answer_relevancy'] == 1.0
    assert result.metrics['context_precision_without_reference'] == pytest.approx(1.0)
    assert result.metrics['context_recall'] == 0.5
    assert result.metrics['factual_correctness'] == pytest.approx(0.5)
    assert {path for path, payload, headers in calls} == {'/v1/chat/completions', '/v1/embeddings'}
    assert not any('Authorization' in headers for path, payload, headers in calls)
    assert engine.info()['judge_http_calls'] == len(calls)


def test_missing_or_unreviewed_reference_is_not_invented_from_keywords():
    for changes in [{'reference': None, 'reference_reviewed': False}, {'reference_reviewed': False}]:
        with http_adapter(model_reply) as (url, calls):
            result = evaluate_case(example(**changes), reply(), evaluator=RagasEvaluator(model_service_base_url=url))
        assert result.status == 'partial'
        assert result.metrics['faithfulness'] == 0.5
        assert result.metrics['context_recall'] is None
        assert result.metrics['factual_correctness'] is None
        assert 'reference' in result.skipped_metrics['context_recall']


def test_judge_call_budget_is_enforced_without_hidden_model_retries():
    with http_adapter(model_reply) as (url, calls):
        result = evaluate_case(example(), reply(), evaluator=RagasEvaluator(model_service_base_url=url, max_model_calls=1))
    assert len(calls) == 1
    assert result.metrics['id_based_context_recall'] == 1.0
    assert result.metrics['faithfulness'] is None
    assert result.status == 'error'
    assert '预算' in result.metric_errors['faithfulness']


@pytest.mark.parametrize('fault', ['http', 'binary', 'truncated', 'json'])
def test_model_errors_cannot_become_scores_or_leak_provider_payload(fault):
    secret = 'sk-test-do-not-save-123456789'

    def broken(path, payload):
        body, status = model_reply(path, payload)
        if path == '/v1/chat/completions':
            if fault == 'http':
                return {'error': secret}, 503
            if fault == 'binary':
                title = json.loads(payload['messages'][0]['content'].split('\n', 1)[1])['title']
                if title == 'NLIStatementOutput':
                    body['choices'][0]['message']['content'] = json.dumps({'statements': [{'statement': 'S', 'reason': secret, 'verdict': 2}]})
            if fault == 'truncated':
                body['choices'][0]['finish_reason'] = 'length'
            if fault == 'json':
                body['choices'][0]['message']['content'] = secret
        return body, status

    with http_adapter(broken) as (url, calls):
        result = evaluate_case(example(), reply(), evaluator=RagasEvaluator(model_service_base_url=url))
    assert result.metrics['faithfulness'] is None
    assert result.metric_errors['faithfulness']
    assert result.status == 'error'
    assert secret not in json.dumps(result.to_dict())
    assert 'answer_completeness' not in result.metrics


def test_missing_sdk_fails_before_querying_rag_and_never_uses_old_metrics(tmp_path, monkeypatch):
    original = builtins.__import__

    def unavailable(name, *args, **kwargs):
        if name == 'ragas':
            raise ImportError('dependency not installed')
        return original(name, *args, **kwargs)

    monkeypatch.setattr(builtins, '__import__', unavailable)
    data = tmp_path / 'dataset.jsonl'
    data.write_text(json.dumps({'id': 'x', 'question': 'Q'}) + '\n', encoding='utf-8')
    calls = []
    with pytest.raises(ValueError, match='RAGAS'):
        run_evaluation('http://isolated', data, tmp_path / 'results', no_llm=True,
                       request_fn=lambda *args: calls.append(args) or reply())
    assert calls == []


def test_cli_requires_consent_without_touching_services():
    process = subprocess.run([sys.executable, 'services/rag-service/evaluation/run.py', '--limit', '1'],
                             capture_output=True, text=True, encoding='utf-8', timeout=20)
    assert process.returncode == 2
    assert '--allow-model-calls' in process.stderr


def test_no_llm_uses_real_ragas_and_never_contacts_model_service(monkeypatch):
    monkeypatch.setenv('MODEL_SERVICE_BASE_URL', 'http://127.0.0.1:1')
    result = evaluate_case(example(), reply(), no_llm=True)
    assert result.metrics['id_based_context_precision'] == 0.5
    assert result.metrics['faithfulness'] is None
    assert result.status == 'partial'


def test_expected_abstention_does_not_use_answer_relevance_as_wrong_answer_penalty():
    with http_adapter(model_reply) as (url, calls):
        result = evaluate_case(example(should_answer=False, reference=None, reference_reviewed=False,
                                      expected_evidence_ids=[]), {'answer': '证据不足，无法确认应更换的零件。', 'hits': []},
                               evaluator=RagasEvaluator(model_service_base_url=url))
    assert result.metrics['answer_relevancy'] is None
    assert result.skipped_metrics['answer_relevancy']
    assert result.status == 'insufficient_data'
    assert calls == []


def test_identical_embeddings_float_roundoff_is_not_a_failed_evaluation():
    def identical(path, payload):
        if path == '/v1/embeddings':
            return {'data': [{'index': i, 'embedding': [1.0, 1.0, 1.0]} for i, text in enumerate(payload['input'])]}, 200
        return model_reply(path, payload)

    with http_adapter(identical) as (url, calls):
        result = evaluate_case(example(), reply(), evaluator=RagasEvaluator(model_service_base_url=url))
    assert result.status == 'completed', result.metric_errors
    assert result.metrics['answer_relevancy'] == 1.0


def test_substantial_out_of_range_sdk_score_is_not_silently_clamped_to_pass():
    embedding_reads = 0

    def opposite(path, payload):
        nonlocal embedding_reads
        if path == '/v1/embeddings':
            embedding_reads += 1
            vector = [1.0, 0.0] if embedding_reads == 1 else [-1.0, 0.0]
            return {'data': [{'index': i, 'embedding': vector} for i, text in enumerate(payload['input'])]}, 200
        return model_reply(path, payload)

    with http_adapter(opposite) as (url, calls):
        result = evaluate_case(example(), reply(), evaluator=RagasEvaluator(model_service_base_url=url))
    assert result.metrics['answer_relevancy'] is None
    assert result.metric_errors['answer_relevancy']
    assert result.status == 'error'


@pytest.mark.parametrize('no_llm', [True, False])
def test_cli_end_to_end_uses_real_http_and_sdk_and_writes_v2_report(tmp_path, monkeypatch, no_llm):
    from app.api.models import SearchRequest

    monkeypatch.setenv('PYTHON_DOTENV_DISABLED', '1')
    monkeypatch.setenv('RAG_INTERNAL_TOKEN', 'isolated-cli-token')
    dataset = tmp_path / 'dataset.jsonl'
    dataset.write_text(json.dumps(example().to_dict(), ensure_ascii=False) + '\n', encoding='utf-8')
    output = tmp_path / 'results'

    def rag_reply(path, payload):
        assert path == '/search'
        SearchRequest(**payload)
        response = reply()
        if not payload['generate_answer']:
            response['answer'] = None
        return response, 200

    with http_adapter(rag_reply) as (rag_url, rag_calls), http_adapter(model_reply) as (model_url, model_calls):
        command = [sys.executable, 'services/rag-service/evaluation/run.py', '--base-url', rag_url,
                   '--dataset', str(dataset), '--output-dir', str(output), '--limit', '1', '--top-k', '50',
                   '--model-service-base-url', model_url, '--max-model-calls', '30']
        command.append('--no-llm' if no_llm else '--allow-model-calls')
        process = subprocess.run(command, capture_output=True, text=True, encoding='utf-8', timeout=40)

    assert process.returncode == 0, process.stderr
    assert len(rag_calls) == 1
    assert rag_calls[0][1]['generate_answer'] is not no_llm
    assert rag_calls[0][2]['Authorization'] == 'Bearer isolated-cli-token'
    report = json.loads((output / 'latest.json').read_text(encoding='utf-8'))
    assert report['version'] == '2'
    assert report['framework'] == 'ragas' and report['framework_version'] == '0.4.3'
    assert report['quality_verdict'] == 'not_assessed'
    assert report['aggregate_metrics']['id_based_context_precision'] == 0.5
    assert report['aggregate_metrics']['faithfulness'] == (None if no_llm else 0.5)
    assert report['model_info']['judge_http_calls'] == len(model_calls)
    assert len(list(output.glob('*.json'))) == 2
    assert bool(model_calls) is not no_llm
    assert 'isolated-cli-token' not in json.dumps(report)
    assert example().question not in json.dumps(report, ensure_ascii=False)


def test_cli_rag_http_failure_is_reported_without_error_body_or_zero_quality(tmp_path, monkeypatch):
    monkeypatch.setenv('PYTHON_DOTENV_DISABLED', '1')
    dataset = tmp_path / 'dataset.jsonl'
    dataset.write_text(json.dumps(example().to_dict()) + '\n', encoding='utf-8')
    output = tmp_path / 'results'
    with http_adapter(lambda path, payload: ({'error': 'private-provider-body'}, 503)) as (url, calls):
        process = subprocess.run([sys.executable, 'services/rag-service/evaluation/run.py', '--base-url', url,
                                  '--dataset', str(dataset), '--output-dir', str(output), '--no-llm'],
                                 capture_output=True, text=True, encoding='utf-8', timeout=40)
    report = json.loads((output / 'latest.json').read_text(encoding='utf-8'))
    assert process.returncode == 1
    assert len(calls) == 1
    assert report['failed_cases'] == 1
    assert report['cases'][0]['error'] == 'RAG 服务 HTTP 503'
    assert all(value is None for value in report['aggregate_metrics'].values())
    assert 'private-provider-body' not in json.dumps(report)
