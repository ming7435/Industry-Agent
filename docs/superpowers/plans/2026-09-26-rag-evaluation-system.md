# RAG Evaluation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task. Follow the TDD steps and verify each task before moving on.

**Goal:** 为现有 `rag-service` 增加一套本地、可重复、可人工复核的 RAG 效果评测系统，覆盖检索召回、来源覆盖、证据质量、回答可追溯性和无证据拒答能力，不改变线上接口和运行时架构。

**Architecture:** 评测器作为 `services/rag-service/evaluation` 下的本地工具，读取人工维护的 JSONL 题集，调用现有 `POST /search`，把响应转换为逐题指标，再聚合为 JSON 报告。指标计算与 HTTP/CLI 编排分离，测试通过注入请求函数使用固定响应，不依赖在线服务或真实模型。

**Tech Stack:** Python 3.11、标准库 `dataclasses`/`json`/`urllib`/`argparse`/`datetime`、现有 FastAPI RAG `/search` 契约、pytest。

**Spec:** `docs/superpowers/specs/2026-09-26-rag-evaluation-design.md`

## Global Constraints

- 只新增本地评测模块、评测数据和文档；不新增 Agent、Tool、MCP、数据库表或线上 API。
- 不修改 `/search` 请求/响应字段，不绕过现有检索链路。
- 报告只保存题目元数据、指标、错误、证据 ID/来源，不复制完整文档正文。
- 缺少人工标注或答案时使用 `null`，不能静默记为 0；单题网络/HTTP/JSON/降级错误写入该题并继续后续题目。
- 保留用户当前工作树中的其他修改；每个实现任务单独提交，提交前只暂存本任务文件。

## Review Focus

- 目标证据 ID 存在时，`recall_at_k` 必须优先按 ID 计算；没有 ID 时才按 `expected_sources` 回退。
- 来源提取要兼容现有 hit 的 `metadata.corpus`、`metadata.source`、顶层 `source` 等实际形态。
- `[n]` 引用校验只允许引用当前响应中存在的证据编号，不能因正文里出现普通数字而误判。
- `should_answer=false` 只在回答明确表达证据不足/无法确认等拒答时通过；不能把正常的限制说明误判为拒答。
- CLI 的 `--no-llm` 不改服务器行为，只跳过答案指标要求；检索指标仍必须完整输出。
- 本地评测不作为 CI 阻断，不改变服务启动和已有测试入口。

---

## Task 1: 建立评测数据模型与首批人工复核题集

**Files:**
- Create: `services/rag-service/evaluation/__init__.py`
- Create: `services/rag-service/evaluation/models.py`
- Create: `services/rag-service/evaluation/dataset.jsonl`
- Create: `services/rag-service/tests/test_evaluation_dataset.py`

### Step 1: Write the failing tests

Add tests that verify:

- valid JSONL rows load into `EvaluationCase` with `id`, `question`, `filters`, `expected_evidence_ids`, `expected_sources`, `relevant_terms`, and `should_answer`;
- blank IDs/questions, malformed JSON, duplicate IDs, and non-object rows raise a clear `ValueError` containing the row number;
- the checked-in dataset has unique IDs and at least one case for each first-batch type, including an explicit `should_answer=false` case;
- optional list fields default to empty lists and filters default to `{}` without sharing mutable state.

Run: `& 'L:\\anaconda\\python.exe' -m pytest services/rag-service/tests/test_evaluation_dataset.py -q --override-ini pythonpath=services/rag-service` (expected to fail because modules do not exist).

### Step 2: Implement the smallest model/loader

- Define typed dataclasses `EvaluationCase`, `CaseEvaluation`, `EvaluationReport` with JSON-safe `to_dict()` methods.
- Implement `load_dataset(path)` in `models.py` or a small loader helper used by `runner.py`; preserve source line numbers in validation errors.
- Seed `dataset.jsonl` with a compact, manually reviewable set derived from repository corpus: alarm explanation, no-alarm maintenance, spindle/cooling, SOP/manual, historical case, device-scoped query, and no-evidence query. Keep expected IDs/sources conservative rather than inventing unsupported evidence.
- Export public model names from `evaluation/__init__.py`.

### Step 3: Run tests and commit

Run the focused test command again; all dataset/model tests must pass. Commit only these files:

`git add services/rag-service/evaluation services/rag-service/tests/test_evaluation_dataset.py && git commit -m "feat: add rag evaluation dataset models"`

## Task 2: Implement deterministic per-case metrics

**Files:**
- Create: `services/rag-service/evaluation/runner.py`
- Create: `services/rag-service/tests/test_evaluation_runner.py`

### Step 1: Write failing metric tests

Use fixed in-memory responses to cover:

- expected evidence IDs take precedence over source fallback for `recall_at_k`;
- source fallback computes `source_coverage` and treats equivalent source labels case-insensitively;
- `evidence_precision` uses `relevant_terms`, returns `null` when no terms are labeled, and does not count empty evidence;
- degraded responses preserve `degraded` and `degrade_reason` without pretending they passed;
- valid citations such as `[1]`/`[2]` pass while `[0]`, `[3]`, and non-citation numbers do not;
- completeness is the fraction of labeled terms present in the answer and is `null` when answer/terms are unavailable;
- affirmative cases do not require abstention, while negative cases require a refusal signal;
- aggregation averages only non-null metric values and retains per-case errors.

Run: `& 'L:\\anaconda\\python.exe' -m pytest services/rag-service/tests/test_evaluation_runner.py -q --override-ini pythonpath=services/rag-service` (expected to fail initially).

### Step 2: Implement metric and case evaluation logic

- Implement `evaluate_case(case, response, top_k) -> CaseEvaluation` exactly as specified.
- Normalize hits without assuming one schema: derive evidence ID and source from metadata/top-level fallbacks; truncate to `top_k` before calculating recall/coverage/precision.
- Keep metric values as `float | None`; store evidence IDs/sources and a short error/degrade reason only.
- Use a narrowly scoped citation regex and a documented refusal-signal list in Chinese/English.
- Implement report aggregation over case evaluations, including counts, averages, suggested thresholds, and run metadata without changing the public API contract.

### Step 3: Run tests and commit

Run both dataset and runner tests. Commit only the evaluator and its tests:

`git add services/rag-service/evaluation/runner.py services/rag-service/tests/test_evaluation_runner.py && git commit -m "feat: add deterministic rag evaluation metrics"`

## Task 3: Add HTTP runner, report persistence, and CLI

**Files:**
- Create: `services/rag-service/evaluation/run.py`
- Modify: `services/rag-service/evaluation/runner.py`
- Modify: `services/rag-service/tests/test_evaluation_runner.py`

### Step 1: Write failing orchestration tests

Add tests with a monkeypatched/injected request function that verify:

- `run_evaluation(base_url, dataset_path, output_dir, limit=None, no_llm=False)` (with internal keyword options for `case_ids`, `top_k`, and injected requests) sends each case to `POST /search` with `query`, `filters`, and `top_n`;
- `--case` filtering and `--limit` are deterministic and unknown IDs produce an argument error;
- one request timeout/HTTP error/invalid JSON is recorded on that case while later cases still run;
- `latest.json` and a UTC timestamped JSON file are written and contain version, mode, counts, aggregate metrics, and per-case results;
- `--no-llm` sets answer metrics to `null` but keeps retrieval metrics;
- CLI exits nonzero only for invalid arguments/dataset/runner setup, not for a failed individual case.

Run the focused tests; they should fail before the HTTP/CLI implementation exists.

### Step 2: Implement orchestration

- Use `urllib.request` with a bounded per-request timeout and no new dependency.
- Keep an internal injectable `request_fn` keyword for tests while preserving the documented public call signature for normal callers.
- Build requests against the existing `/search` contract; do not add server-side no-LLM flags. In no-LLM mode, ignore answer scoring and label the report mode accordingly.
- Write reports atomically enough for local use (`latest.json` plus `<UTC timestamp>.json`), create the output directory, and serialize UTF-8 with stable indentation.
- Implement `argparse` options from the spec, resolve the default dataset relative to the module/repository, and print a concise summary plus report path.

### Step 3: Run tests and commit

Run all evaluation tests and a CLI help smoke check:

`& 'L:\\anaconda\\python.exe' -m pytest services/rag-service/tests/test_evaluation_dataset.py services/rag-service/tests/test_evaluation_runner.py -q --override-ini pythonpath=services/rag-service`

`& 'L:\\anaconda\\python.exe' services/rag-service/evaluation/run.py --help`

Commit:

`git add services/rag-service/evaluation/run.py services/rag-service/evaluation/runner.py services/rag-service/tests/test_evaluation_runner.py && git commit -m "feat: add local rag evaluation runner"`

## Task 4: Document local review workflow and verify against the live service

**Files:**
- Modify: `README.md`
- Optionally add: `services/rag-service/evaluation-results/.gitkeep` only if the repository needs a placeholder (do not commit generated reports).

### Step 1: Write documentation checks

Confirm the README documents:

- how to review/edit `dataset.jsonl` golden labels;
- retrieval-only and full-model commands with `--base-url`, `--case`, `--limit`, `--top-k`, and `--output-dir`;
- report locations, null metric semantics, suggested thresholds, and the fact that this is manual/non-CI;
- the expected running service and model prerequisites.

### Step 2: Add the documented commands and run a bounded live smoke

- Document the exact Windows command using `L:\\anaconda\\python.exe` and the repository’s RAG pytest configuration.
- With the existing local RAG service available, run one reviewed case in `--no-llm` mode and one full-model case (or record a clear connection/model error in the report if the service is unavailable).
- Inspect `latest.json` to ensure the report contains evidence IDs/sources and does not contain copied document bodies.

### Step 3: Verify and commit

Run the full RAG test slice plus evaluation tests. Review `git diff --check`, inspect the generated report, and commit only README/docs changes (generated reports remain ignored/untracked):

`git add README.md && git commit -m "docs: document local rag evaluation workflow"`

Final verification command:

`& 'L:\\anaconda\\python.exe' -m pytest services/rag-service/tests -q --override-ini pythonpath=services/rag-service`
