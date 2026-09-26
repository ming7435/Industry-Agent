# RAG Evaluation System Design

## Goal

为现有 `rag-service` 增加一个本地可重复运行的效果评测工具，用固定工业维修题集量化检索覆盖、证据质量、答案可追溯性和无答案处理能力；首版不接入 CI，不改变线上 RAG API，不新增 Agent 或服务。

## Confirmed scope

- 评测方式：本地手动运行。
- 评测集来源：从仓库现有语料整理候选问题和目标证据，由用户人工复核后作为金标准。
- 首版同时支持检索评测和真实模型答案评测；`--no-llm` 模式只执行检索与证据指标。
- 评测请求通过现有 `POST /search`，不绕过线上检索链路。
- 报告只保存评测元数据、分数、错误和必要的证据 ID/来源，不复制整份文档正文。

## Evaluation dataset

文件：`services/rag-service/evaluation/dataset.jsonl`

每行是一个 JSON 对象：

```json
{
  "id": "spindle-overheat-001",
  "question": "主轴温度过高怎么检查？",
  "filters": {},
  "expected_sources": ["cases", "sop", "manuals"],
  "relevant_terms": ["冷却", "LOTO", "复测"],
  "should_answer": true
}
```

字段约束：

- `id` 在数据集内唯一。
- `question` 为真实用户问题，不能为空。
- `filters` 与现有 `/search` 请求一致。
- `expected_sources` 是人工复核后的目标语料来源；允许为空，表示来源不作硬要求。
- `relevant_terms` 是人工复核的必要概念，不要求固定措辞。
- `should_answer=false` 表示应明确说明证据不足，不得强行给结论。

首批题型：报警解释、无报警设备维修问答、主轴/冷却检查、SOP/手册定位、历史维修案例、设备范围过滤、无证据问题。

## Metrics

### Retrieval metrics

- `recall_at_k`：目标证据 ID 或人工标注的目标来源是否进入前 K 命中；有目标 ID 时优先按 ID，否则按来源覆盖。
- `source_coverage`：命中的来源种类数除以目标来源种类数。
- `evidence_precision`：命中证据中包含至少一个 `relevant_terms` 的比例；无关键词标注时只报告来源覆盖。
- `retrieval_latency_ms`：使用服务返回的总延迟。
- `retrieval_degraded`：记录 `degraded`、`degrade_reason`，不把降级结果伪装成通过。

### Answer metrics

仅在完整模式并且响应有 `answer` 时计算：

- `citation_validity`：回答中的 `[n]` 引用是否落在返回证据编号范围内。
- `answer_completeness`：回答是否覆盖人工标注的 `relevant_terms`。
- `abstention_accuracy`：`should_answer=false` 时是否明确出现“证据不足/无法确认”等拒答信号；`should_answer=true` 时不因泛化说明误判为拒答。
- `answer_latency_ms`：服务总延迟中的生成阶段耗时。

所有指标保留逐题明细和整体平均值；缺少标注或模型答案时使用 `null`，不当作 0。

## Runner contract

新增模块：`services/rag-service/evaluation/runner.py`

提供：

- `load_dataset(path) -> list[EvaluationCase]`
- `evaluate_case(case, response, top_k) -> CaseEvaluation`
- `run_evaluation(base_url, dataset_path, output_dir, limit=None, no_llm=False) -> EvaluationReport`

新增命令模块：`services/rag-service/evaluation/run.py`

命令参数：

- `--base-url`：默认 `http://127.0.0.1:8020`
- `--dataset`：默认仓库内 `dataset.jsonl`
- `--output-dir`：默认 `evaluation-results`
- `--case`：只运行一个或多个题目 ID
- `--limit`：限制运行题目数
- `--top-k`：默认 5
- `--no-llm`：只评测检索和证据，不要求答案

结果文件：

- `latest.json`
- `<UTC timestamp>.json`

报告包含版本、运行时间、请求地址、模式、题目总数、通过/失败计数、聚合指标和逐题结果。网络错误、HTTP 错误、JSON 错误和响应降级都写入逐题 `error`/`degrade_reason`，单题失败不阻断其余题目。

## Quality gates for local review

首版不自动阻断提交，但报告提供建议阈值字段，便于人工判断：

- `retrieval_recall_at_k >= 0.80`
- `source_coverage >= 0.80`
- `citation_validity >= 0.95`
- `abstention_accuracy >= 0.90`

阈值只作为报告提示，不改变退出码；命令仅在参数、数据集或运行器自身出错时返回非零。

## Files

- Create: `services/rag-service/evaluation/__init__.py`
- Create: `services/rag-service/evaluation/models.py`
- Create: `services/rag-service/evaluation/runner.py`
- Create: `services/rag-service/evaluation/run.py`
- Create: `services/rag-service/evaluation/dataset.jsonl`
- Create: `services/rag-service/tests/test_evaluation_runner.py`
- Create: `services/rag-service/tests/test_evaluation_dataset.py`
- Modify: `README.md`，补充本地评测命令和报告说明。

## Out of scope

- 不新增线上 API。
- 不新增 Agent、Tool、MCP 或数据库表。
- 不在首版自动修改题集或让模型自动生成金标准。
- 不把 LLM 自评、BLEU/ROUGE 等文本相似度作为唯一答案质量标准。

