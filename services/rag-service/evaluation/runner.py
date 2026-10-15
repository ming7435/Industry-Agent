"""采集 RAG 响应并运行 RAGAS；报告与 Skill 北极星账本完全分离。"""
from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime, timezone
import json
import math
import os
import re
from pathlib import Path
from statistics import mean
from typing import Any
import urllib.request

from .models import CaseEvaluation, EvaluationCase, EvaluationReport
from .ragas_engine import METRICS, RagasEvaluator, safe_error


def _metadata(hit):
    return hit.get('metadata') if isinstance(hit.get('metadata'), dict) else {}


def _evidence_id(hit):
    meta = _metadata(hit)
    return str(hit.get('chunk_id') or hit.get('document_id') or meta.get('chunk_id') or meta.get('document_id') or '').strip()


def _source(hit):
    meta = _metadata(hit)
    value = meta.get('corpus') or meta.get('source') or hit.get('corpus') or hit.get('source')
    return str(value).strip().lower() if value else ''


def evaluate_case(case: EvaluationCase, response: dict[str, Any], top_k=5, *, evaluator=None, no_llm=True):
    """正文只在内存交给 RAGAS，不将题目、证据或回答复制进评测报告。"""
    if type(top_k) is not int or not 1 <= top_k <= 50:
        raise ValueError('top_k 必须为1至50的整数，与RAG接口一致')
    if not isinstance(response, dict):
        raise ValueError('RAG响应必须是JSON对象')
    hits = response.get('hits') or []
    if not isinstance(hits, list) or any(not isinstance(hit, dict) for hit in hits):
        raise ValueError('RAG hits 必须为证据对象列表')
    hits = hits[:top_k]
    contexts = [hit.get('text', hit.get('content', '')) for hit in hits]
    if any(not isinstance(text, str) for text in contexts):
        raise ValueError('RAG证据正文必须是文本')
    answer = response.get('answer')
    if answer is not None and not isinstance(answer, str):
        raise ValueError('RAG答案必须是文本或null')
    if sum(map(len, contexts)) + len(answer or '') + len(case.reference or '') > 100000:
        raise ValueError('单题评测资料超过长度上限，不能截断证据后冒充完整评测')
    result = CaseEvaluation(id=case.id, metrics=dict.fromkeys(METRICS),
        evidence_ids=[_evidence_id(hit) for hit in hits], evidence_sources=[_source(hit) for hit in hits],
        degraded=bool(response.get('degraded')), degrade_reason='RAG服务返回降级状态' if response.get('degraded') else None,
        diagnostics={'latency_ms': _latency(response.get('latency_ms')), 'should_answer': case.should_answer,
                     'latency_breakdown': {key: _latency(value) for key, value in (response.get('latency_ms') or {}).items()}
                         if isinstance(response.get('latency_ms'), dict) else {},
                     'citation_range_valid': _citation_range(answer, len(hits))})
    if response.get('error') or result.degraded:
        result.error = 'RAG响应失败或降级，未计算内容质量指标'
        result.status = 'error'
        return result
    evaluator = evaluator or RagasEvaluator(no_llm=no_llm)
    data = {'user_input': case.question, 'response': answer,
            'retrieved_contexts': [text for text in contexts if text.strip()],
            'retrieved_context_ids': [value for value in result.evidence_ids if value],
            'reference_context_ids': case.expected_evidence_ids,
            'should_answer': case.should_answer,
            'reference': case.reference if case.reference_reviewed else None}
    result.metrics, result.skipped_metrics, result.metric_errors = evaluator.score(data)
    if result.metric_errors:
        result.status, result.error = 'error', '部分RAGAS指标执行失败；失败指标留空，不采用旧算法兜底'
    elif not any(value is not None for value in result.metrics.values()):
        result.status = 'insufficient_data'
    else:
        result.status = 'partial' if result.skipped_metrics else 'completed'
    return result


def _latency(value):
    raw = value.get('total') if isinstance(value, dict) else value
    return float(raw) if type(raw) in (int, float) and math.isfinite(raw) and raw >= 0 else None


def _citation_range(answer, evidence_count):
    numbers = re.findall(r'\[(\d+)\]', answer or '')
    return all(1 <= int(number) <= evidence_count for number in numbers) if numbers else None


def _aggregate_metric(cases: Iterable[CaseEvaluation], key):
    values = [item.metrics.get(key) for item in cases]
    valid = [float(value) for value in values if type(value) in (int, float) and math.isfinite(value)]
    return mean(valid) if valid else None


def aggregate_evaluations(cases, *, base_url, mode, run_at_utc=None, evaluator=None):
    """完成数不代表答案合格；没有设定人工验收阈值时不输出质量通过结论。"""
    return EvaluationReport(version='2', framework_version=evaluator.version if evaluator else '',
        run_at_utc=run_at_utc or datetime.now(timezone.utc).isoformat(), base_url=base_url, mode=mode,
        total_cases=len(cases), passed_cases=sum(item.status in {'completed', 'partial'} and not item.error and not item.degraded for item in cases),
        failed_cases=sum(1 for item in cases if item.status == 'error' or item.error or item.degraded),
        aggregate_metrics={name: _aggregate_metric(cases, name) for name in METRICS},
        metric_coverage={name: sum(item.metrics.get(name) is not None for item in cases) for name in METRICS},
        model_info=evaluator.info() if evaluator else {}, suggested_thresholds={}, cases=cases)


def _request_search(base_url, payload, timeout_s):
    headers = {'Content-Type': 'application/json'}
    token = os.getenv('RAG_INTERNAL_TOKEN', '').strip()
    if token:
        headers['Authorization'] = 'Bearer ' + token
    request = urllib.request.Request(base_url, data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
                                     headers=headers, method='POST')
    try:
        with urllib.request.urlopen(request, timeout=timeout_s) as response:
            body = json.loads(response.read().decode('utf-8'))
    except urllib.error.HTTPError as error:
        error.close()
        raise
    if not isinstance(body, dict):
        raise ValueError('RAG响应必须是JSON对象')
    return body


def run_evaluation(base_url, dataset_path, output_dir, limit=None, no_llm=False, *, case_ids=None,
                   top_k=5, request_fn=None, allow_model_calls=False, model_service_base_url=None,
                   max_model_calls=60, case_timeout=120):
    """手动评测入口；生成和裁判调用需明确选择，有限次数，不启动后台收费任务。"""
    from .models import load_dataset
    if not no_llm and allow_model_calls is not True:
        raise ValueError('完整评测需要显式 allow_model_calls=True，CLI使用 --allow-model-calls 确认模型调用')
    if type(top_k) is not int or not 1 <= top_k <= 50:
        raise ValueError('top_k 必须为1至50的整数，与RAG接口一致')
    cases = load_dataset(dataset_path)
    known = {case.id: case for case in cases}
    if case_ids and any(identity not in known for identity in case_ids):
        raise ValueError('未知题目 ID')
    selected = [known[identity] for identity in dict.fromkeys(case_ids)] if case_ids else cases
    if limit is not None:
        if type(limit) is not int or limit < 1:
            raise ValueError('limit 必须大于0')
        selected = selected[:limit]
    if not selected or len(selected) > 100:
        raise ValueError('每次评测需1至100题，请通过limit分批运行')
    evaluator = RagasEvaluator(no_llm=no_llm, model_service_base_url=model_service_base_url,
                              max_model_calls=max_model_calls, case_timeout=case_timeout)
    request_fn = request_fn or _request_search
    evaluated = []
    for case in selected:
        payload = {'query': case.question, 'filters': case.filters, 'top_n': top_k, 'generate_answer': not no_llm}
        try:
            response = request_fn(f"{base_url.rstrip('/')}/search", payload, 90.0)
            result = evaluate_case(case, response, top_k, evaluator=evaluator)
        except Exception as error:
            result = CaseEvaluation(id=case.id, metrics=dict.fromkeys(METRICS), status='error', error=safe_error(error))
        evaluated.append(result)
    now = datetime.now(timezone.utc)
    report = aggregate_evaluations(evaluated, base_url=base_url, mode='no_llm' if no_llm else 'full',
                                  run_at_utc=now.isoformat(), evaluator=evaluator)
    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    encoded = json.dumps(report.to_dict(), ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    (destination / 'latest.json').write_text(encoded, encoding='utf-8')
    (destination / f"{now.strftime('%Y%m%dT%H%M%S.%fZ')}.json").write_text(encoded, encoding='utf-8')
    return report
