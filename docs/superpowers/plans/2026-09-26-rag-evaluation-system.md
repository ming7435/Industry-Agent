# RAG Evaluation System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task. Follow the TDD steps and verify each task before moving on.

**Goal:** 为现有 `rag-service` 增加一套本地、可重复、可人工复核的 RAG 效果评测系统，覆盖检索召回、来源覆盖、证据质量、回答可追溯性和无证据拒答能力，不改变线上接口和运行时架构。

**Architecture:** 评测器作为 `services/rag-service/evaluation` 下的本地工具，读取人工维护的 JSONL 题集，调用现有 `POST /search`，把响应转换为逐题指标，再聚合为 JSON 报告。指标计算与 HTTP/CLI 编排分离，测试通过注入请求函数使用固定响应，不依赖在线服务或真实模型。

**Tech Stack:** Python 3.11、标准库 `dataclasses`/`json`/`urllib`/`argparse`/`datetime`、现有 FastAPI RAG `/search` 契约、pytest。

**Spec:** `docs/superpowers/specs/2026-09-26-rag-evaluation-design.md`

## 全局约束

- 只新增本地评测模块、评测数据和文档；不新增 Agent、Tool、MCP、数据库表或线上 API。
- 不修改 `/search` 请求/响应字段，不绕过现有检索链路。
- 报告只保存题目元数据、指标、错误、证据 ID/来源，不复制完整文档正文。
- 缺少人工标注或答案时使用 `null`，不能静默记为 0；单题网络/HTTP/JSON/降级错误写入该题并继续后续题目。
- 保留用户当前工作树中的其他修改；每个实现任务单独提交，提交前只暂存本任务文件。

## 复核重点

- 目标证据 ID 存在时，`recall_at_k` 必须优先按 ID 计算；没有 ID 时才按 `expected_sources` 回退。
- 来源提取要兼容现有 hit 的 `metadata.corpus`、`metadata.source`、顶层 `source` 等实际形态。
- `[n]` 引用校验只允许引用当前响应中存在的证据编号，不能因正文里出现普通数字而误判。
- `should_answer=false` 只在回答明确表达证据不足/无法确认等拒答时通过；不能把正常的限制说明误判为拒答。
- CLI 的 `--no-llm` 不改服务器行为，只跳过答案指标要求；检索指标仍必须完整输出。
- 本地评测不作为 CI 阻断，不改变服务启动和已有测试入口。

---

### 第 1 任务：建立评测数据模型与首批人工复核题集

**Files:**
- Create: `services/rag-service/evaluation/__init__.py`
- Create: `services/rag-service/evaluation/models.py`
- Create: `services/rag-service/evaluation/dataset.jsonl`
- Create: `services/rag-service/tests/test_evaluation_dataset.py`

### 步骤 1：编写失败测试

增加测试，验证：

- 有效 JSONL 行会加载为包含 `id`、`question`、`filters`、`expected_evidence_ids`、`expected_sources`、`relevant_terms` 和 `should_answer` 的 `EvaluationCase`；
- 空 ID/问题、格式错误的 JSON、重复 ID 和非对象行会抛出包含行号的清晰 `ValueError`；
- 已提交的数据集具有唯一 ID，且首批每种题型至少有一个案例，其中包括明确的 `should_answer=false` 案例；
- 可选列表字段默认为空列表，filters 默认是 `{}`，并且不会共享可变状态。

运行：`& 'L:\\anaconda\\python.exe' -m pytest services/rag-service/tests/test_evaluation_dataset.py -q --override-ini pythonpath=services/rag-service`（预期会失败，因为模块尚不存在）。

### 步骤 2：实现最小模型/加载器

- 定义带类型的 dataclass：`EvaluationCase`、`CaseEvaluation`、`EvaluationReport`，并提供 JSON 安全的 `to_dict()` 方法。
- 在 `models.py` 或 `runner.py` 使用的小型加载器中实现 `load_dataset(path)`；在校验错误中保留源文件行号。
- 使用来源于仓库语料的紧凑、便于人工复核的题集初始化 `dataset.jsonl`：报警解释、无报警维修、主轴/冷却、SOP/手册、历史案例、设备范围查询和无证据查询。预期 ID/来源应保持保守，不要编造没有依据的证据。
- 从 `evaluation/__init__.py` 导出公共模型名称。

### 步骤 3：运行测试并提交

再次运行聚焦测试命令；所有数据集/模型测试必须通过。只提交以下文件：

`git add services/rag-service/evaluation services/rag-service/tests/test_evaluation_dataset.py && git commit -m "feat: add rag evaluation dataset models"`

## 第 2 任务：实现确定性的逐题指标

**文件：**
- Create: `services/rag-service/evaluation/runner.py`
- Create: `services/rag-service/tests/test_evaluation_runner.py`

### 步骤 1：编写失败的指标测试

使用固定的内存响应覆盖：

- 目标证据 ID 优先于来源回退计算 `recall_at_k`；
- 来源回退计算 `source_coverage`，并且不区分等价来源标签的大小写；
- `evidence_precision` 使用 `relevant_terms`，没有标注关键词时返回 `null`，且不计入空证据；
- 降级响应保留 `degraded` 和 `degrade_reason`，不把它们伪装成通过；
- `[1]`/`[2]` 等有效引用通过，而 `[0]`、`[3]` 和非引用数字不通过；
- completeness 是答案中出现的已标注术语比例；答案或术语不可用时返回 `null`；
- 肯定题不要求拒答，否定题必须包含拒答信号；
- 聚合只平均非 `null` 指标，并保留逐题错误。

Run: `& 'L:\\anaconda\\python.exe' -m pytest services/rag-service/tests/test_evaluation_runner.py -q --override-ini pythonpath=services/rag-service` (expected to fail initially).

### 步骤 2：实现指标和逐题评估逻辑

- 按规格准确实现 `evaluate_case(case, response, top_k) -> CaseEvaluation`。
- 不假设单一 hit 模式，兼容规范化 hit：从 metadata/顶层后备字段推导证据 ID 和来源；计算召回/覆盖/精度前先截断到 `top_k`。
- 保持指标值为 `float | None`；只保存证据 ID/来源以及简短错误/降级原因。
- 使用范围严格的引用正则，并记录中英文拒答信号列表。
- 在不改变公共 API 契约的前提下，实现基于逐题评估的报告聚合，包括计数、平均值、建议阈值和运行元数据。

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
