"""评测迁移不能只改名，也不能绕过模型调用预算或伪造标准答案。"""
import json

import pytest

from evaluation.models import load_dataset
from evaluation.runner import run_evaluation


@pytest.mark.parametrize('top_k', [51, 100])
def test_top_k_outside_rag_api_contract_is_rejected_before_search(tmp_path, top_k):
    calls = []
    with pytest.raises(ValueError, match='top_k'):
        run_evaluation('http://isolated-rag', dataset(tmp_path), tmp_path / 'out', no_llm=True,
                       top_k=top_k, request_fn=lambda *args: calls.append(args) or {'hits': []})
    assert calls == []


def dataset(tmp_path, **extra):
    path = tmp_path / 'dataset.jsonl'
    path.write_text(json.dumps({'id': 'one', 'question': '主轴报警如何检查？', **extra}, ensure_ascii=False) + '\n', encoding='utf-8')
    return path


def test_no_llm_really_disables_answer_generation_and_identifies_framework(tmp_path):
    calls = []

    def search(url, payload, timeout):
        calls.append(payload)
        return {'hits': [{'chunk_id': 'E1', 'text': '主轴报警记录'}], 'answer': None}

    report = run_evaluation('http://isolated-rag', dataset(tmp_path, expected_evidence_ids=['E1']),
                            tmp_path / 'out', no_llm=True, request_fn=search)
    assert calls[0].get('generate_answer') is False
    assert report.to_dict().get('framework') == 'ragas'
    assert report.cases[0].metrics.get('id_based_context_recall') == 1.0
    assert 'answer_completeness' not in report.cases[0].metrics


def test_full_evaluation_requires_explicit_model_call_opt_in_before_search(tmp_path):
    calls = []
    with pytest.raises(ValueError, match='allow_model_calls|模型调用'):
        run_evaluation('http://isolated-rag', dataset(tmp_path), tmp_path / 'out',
                       request_fn=lambda *args: calls.append(args) or {'hits': [], 'answer': '答复'})
    assert calls == []


def test_reviewed_reference_is_preserved_not_derived_from_keywords(tmp_path):
    cases = load_dataset(dataset(tmp_path, reference='人工复核的答案', reference_reviewed=True,
                                 relevant_terms=['不是标准答案']))
    assert cases[0].to_dict().get('reference') == '人工复核的答案'
    assert cases[0].to_dict().get('reference_reviewed') is True


@pytest.mark.parametrize('extra', [
    {'reference': 123}, {'reference_reviewed': 'true'},
    {'reference': '   ', 'reference_reviewed': True}, {'reference_reviewed': True},
])
def test_invalid_reference_annotation_is_rejected(tmp_path, extra):
    with pytest.raises(ValueError, match='reference|标准答案'):
        load_dataset(dataset(tmp_path, **extra))
