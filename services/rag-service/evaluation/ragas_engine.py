"""真实 RAGAS 指标执行器；仅通过既有 Model 服务使用模型，禁止指标兜底。"""
from __future__ import annotations

import asyncio
from copy import copy
import json
import math
import os
from threading import Lock
from time import monotonic

# 评测输入可能含企业资料，关闭第三方匿名遥测；不修改用户配置文件。
os.environ['RAGAS_DO_NOT_TRACK'] = 'true'

METRICS = ('id_based_context_precision', 'id_based_context_recall', 'faithfulness',
           'answer_relevancy', 'context_precision_without_reference', 'context_recall', 'factual_correctness')


class EvaluationBudgetError(RuntimeError):
    pass


def safe_error(error):
    """不把提供方正文、原始提示词、凭据或检索资料写入结果。"""
    from app.clients.model import ModelServiceError
    if isinstance(error, EvaluationBudgetError):
        return '评测模型调用次数或单题时间预算已用尽'
    if isinstance(error, (TimeoutError, asyncio.TimeoutError)):
        return '评测请求超时'
    if isinstance(error, ModelServiceError):
        return str(error)
    from urllib.error import HTTPError
    if isinstance(error, HTTPError):
        return f'RAG 服务 HTTP {error.code}'
    return f'评测执行失败（{type(error).__name__}）'


class ModelBudget:
    def __init__(self, max_calls=60, case_timeout=120):
        if type(max_calls) is not int or not 1 <= max_calls <= 1000:
            raise ValueError('max_model_calls 必须为1至1000的整数')
        if not isinstance(case_timeout, (int, float)) or isinstance(case_timeout, bool) or not 0 < case_timeout <= 600:
            raise ValueError('case_timeout 必须在0至600秒之间')
        self.max_calls, self.case_timeout = max_calls, float(case_timeout)
        self.calls, self.deadline, self.lock = 0, 0.0, Lock()

    def begin_case(self):
        self.deadline = monotonic() + self.case_timeout

    def claim(self):
        with self.lock:
            remaining = self.deadline - monotonic()
            if self.calls >= self.max_calls or remaining <= 0:
                raise EvaluationBudgetError()
            self.calls += 1
            return min(30.0, remaining)


def _binary_flags(value):
    """SDK部分字段仅声明int；额外拒绝会被当作真值的2或字符串。"""
    if isinstance(value, dict):
        for key, item in value.items():
            if key in {'verdict', 'attributed', 'noncommittal'} and (type(item) is not int or item not in (0, 1)):
                raise ValueError('评测判定必须为0或1')
            if key == 'verdicts' and (not isinstance(item, list) or any(type(v) is not int or v not in (0, 1) for v in item)):
                raise ValueError('评测判定必须为0或1')
            _binary_flags(item)
    elif isinstance(value, list):
        for item in value:
            _binary_flags(item)


def model_adapters(client, budget):
    """使用 RAGAS 0.4 的现代组件协议，不让 SDK 创建默认 OpenAI 客户端。"""
    from ragas.llms.base import InstructorBaseRagasLLM
    from ragas.embeddings.base import BaseRagasEmbedding

    class GatewayLLM(InstructorBaseRagasLLM):
        def generate(self, prompt, response_model):
            active = copy(client)
            active.timeout = budget.claim()
            schema = json.dumps(response_model.model_json_schema(), ensure_ascii=False)
            body = active._post('/v1/chat/completions', {
                'model': os.getenv('MODEL_CHAT_MODEL', ''), 'temperature': 0.0, 'max_tokens': 4096,
                'messages': [{'role': 'system', 'content': '你是只读评测助手。仅返回符合以下JSON Schema的JSON，不调用工具。\n' + schema},
                             {'role': 'user', 'content': prompt}],
            })
            try:
                choice = body['choices'][0]
                if choice.get('finish_reason') != 'stop' or choice['message'].get('tool_calls'):
                    raise ValueError('评测生成未完整结束')
                content = choice['message']['content'].strip()
                if content.startswith('```json\n') and content.endswith('\n```'):
                    content = content[8:-4]
                value = json.loads(content)
                _binary_flags(value)
                return response_model.model_validate(value)
            except (KeyError, IndexError, AttributeError, TypeError, ValueError) as error:
                raise ValueError('模型评测结果格式无效') from error

        async def agenerate(self, prompt, response_model):
            return await asyncio.to_thread(self.generate, prompt, response_model)

    class GatewayEmbedding(BaseRagasEmbedding):
        def embed_text(self, text, **kwargs):
            return self.embed_texts([text])[0]

        def embed_texts(self, texts, **kwargs):
            active = copy(client)
            active.timeout = budget.claim()
            return active.embeddings(texts)

        async def aembed_text(self, text, **kwargs):
            return await asyncio.to_thread(self.embed_text, text)

        async def aembed_texts(self, texts, **kwargs):
            return await asyncio.to_thread(self.embed_texts, texts)

    return GatewayLLM(), GatewayEmbedding()


class RagasEvaluator:
    def __init__(self, *, no_llm=False, model_service_base_url=None, max_model_calls=60, case_timeout=120):
        try:
            import ragas
            from ragas.metrics.collections import Faithfulness, AnswerRelevancy, ContextPrecisionWithoutReference, ContextRecall, FactualCorrectness
            # 0.4.3 的 collections 尚未导出ID指标，使用该固定版本的官方实现。
            from ragas.metrics._context_precision import IDBasedContextPrecision
            from ragas.metrics._context_recall import IDBasedContextRecall
        except ImportError as error:
            raise ValueError('RAGAS依赖未安装或不兼容，请在独立环境安装 requirements-evaluation.txt') from error
        if ragas.__version__ != '0.4.3':
            raise ValueError('请安装项目已验证的 RAGAS 0.4.3，不能静默使用其他指标版本')
        self.version, self.no_llm = ragas.__version__, no_llm
        self.budget = ModelBudget(max_model_calls, case_timeout)
        self.metrics = [IDBasedContextPrecision(), IDBasedContextRecall()]
        if not no_llm:
            from app.clients.model import ModelServiceClient
            self.client = ModelServiceClient(model_service_base_url)
            llm, embeddings = model_adapters(self.client, self.budget)
            self.metrics += [Faithfulness(llm), AnswerRelevancy(llm, embeddings),
                             ContextPrecisionWithoutReference(llm), ContextRecall(llm), FactualCorrectness(llm)]

    def info(self):
        return {'route': 'model-service' if not self.no_llm else 'no_judge_model',
                'chat_model': os.getenv('MODEL_CHAT_MODEL', '') or 'model-service configured default',
                'embedding_model': os.getenv('MODEL_EMBEDDING_MODEL', 'BAAI/bge-m3'),
                'judge_http_calls': self.budget.calls, 'max_judge_http_calls': self.budget.max_calls,
                'case_timeout_seconds': self.budget.case_timeout}

    def score(self, data):
        self.budget.begin_case()
        return asyncio.run(self._score(data))

    async def _score(self, data):
        from ragas import SingleTurnSample
        scores = dict.fromkeys(METRICS)
        skipped, errors = {}, {}
        sample = SingleTurnSample(**data)
        for metric in self.metrics:
            name = metric.name
            if name.startswith('id_based'):
                if not data.get('reference_context_ids'):
                    skipped[name] = '缺少人工标注的相关证据ID'; continue
                if name.endswith('precision') and not data.get('retrieved_context_ids'):
                    skipped[name] = '没有返回证据ID，精确率不适用'; continue
                operation = lambda: metric.single_turn_ascore(sample)
            else:
                if name == 'answer_relevancy' and data.get('should_answer') is False:
                    skipped[name] = '题目要求拒答，不用回答相关性惩罚正确拒答'; continue
                required = {'user_input', 'response'}
                if name in {'faithfulness', 'context_precision_without_reference', 'context_recall'}:
                    required.add('retrieved_contexts')
                if name in {'context_recall', 'factual_correctness'}:
                    required.add('reference')
                if name == 'factual_correctness':
                    required.discard('user_input')
                if name == 'context_recall':
                    required.discard('response')
                missing = sorted(key for key in required if not data.get(key))
                if missing:
                    skipped[name] = '缺少已核实评测输入：' + '、'.join(missing); continue
                arguments = {key: data[key] for key in required}
                operation = lambda: metric.ascore(**arguments)
            try:
                remaining = self.budget.deadline - monotonic()
                if remaining <= 0:
                    raise EvaluationBudgetError()
                result = await asyncio.wait_for(operation(), timeout=remaining)
                value = float(getattr(result, 'value', result))
                # 只容忍余弦计算等产生的端点舍入误差，实际越界和非有限值仍失败。
                if not math.isfinite(value) or not -1e-12 <= value <= 1 + 1e-12:
                    raise ValueError('指标未返回0至1之间的有限值')
                scores[name] = min(1.0, max(0.0, value))
            except Exception as error:
                errors[name] = safe_error(error)
        for name in METRICS:
            if name not in {metric.name for metric in self.metrics}:
                skipped[name] = 'no_llm模式禁用评测模型'
        return scores, skipped, errors
