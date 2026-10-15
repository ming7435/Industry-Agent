# RAGAS 评测迁移交付报告

日期：2026-10-14。范围：当前本地项目的 RAG 离线效果评测。Skill 北极星指标继续由独立 Skill Loop 使用，本次不将它替换为 RAGAS，也不混入 Agent 单任务执行循环。

## 1. 已落实的行为

原有关键词覆盖、来源匹配等自研分数已从 RAG 质量评分链路移除。现在由真实 **RAGAS 0.4.3 SDK** 计算指标，不是改名称或自行实现近似算法。

调用链为：

```text
人工启动评测命令
  → 加载 JSONL 题集及人工标注
  → RAG 服务 POST /search 获取证据及回答
  → RAGAS 指标执行器
      → 证据 ID 指标：SDK 直接计算
      → 语义指标：现有 Model 服务 /v1/chat/completions、/v1/embeddings
  → 独立 RAGAS JSON 报告

专家中心 → Skill Loop → 原有北极星指标账本（保持独立）
```

没有新增模型供应商密钥，没有替换当前供应商及模型，没有改动在线 `/search` 处理逻辑、Model 客户端、生产配置或设备控制接口。未增加后台收费评测、自动重试或新的前端页面。

### 指标及条件

| 报告字段 | 含义 | 必需输入 |
| --- | --- | --- |
| `id_based_context_precision` | 检索结果中相关证据的比例 | 检索证据 ID、人工相关证据 ID |
| `id_based_context_recall` | 人工标注证据被检索到的比例 | 人工相关证据 ID；检索为空时允许真实计算零召回 |
| `faithfulness` | 回答陈述被检索内容支持的程度 | 回答、证据、聊天裁判 |
| `answer_relevancy` | 回答与问题的相关性 | 问题、回答、聊天裁判及向量模型 |
| `context_precision_without_reference` | 无标准答案条件下的上下文精确率 | 问题、回答、证据、聊天裁判 |
| `context_recall` | 标准答案内容被证据覆盖的程度 | 问题、证据、人工复核标准答案、聊天裁判 |
| `factual_correctness` | 回答与标准答案的事实一致性 | 回答、人工复核标准答案、聊天裁判 |

题集新增 `reference` 和 `reference_reviewed`。只有明确人工复核的标准答案才参与后两项指标。原题集的 7 道题保留，未用关键词、本次模型回答或推测内容伪造标准答案、证据 ID。

原题集没有相关证据 ID 或已复核标准答案的题，对应指标会为 `null`。完整模式可以计算满足条件的无标准答案指标；`--no-llm` 模式不具备语义裁判能力，缺少 ID 标注时没有有效分数。要求拒答的题不使用回答相关性惩罚拒答，但本次未宣称实现独立的“拒答正确性”评分。

引用编号是否越界、响应耗时及来源仍保留为诊断信息，不作为语义质量分数。

### 错误与成本控制

- 完整模式必须显式传入 `--allow-model-calls`，未确认前不会请求 RAG 或模型服务。
- `--no-llm` 明确发送 `generate_answer=false`，不调用评测裁判；线上检索的向量、重排仍可能由现有提供方收费，不能将此模式称为全部免费。
- 每次最多 100 题，`--top-k` 范围为 1–50，与现有 RAG 请求契约一致。
- 裁判聊天/向量 HTTP 调用默认总上限 60 次，单题指标预算默认 120 秒，单次模型 HTTP 等待最多 30 秒。上限不包含 RAG 自身的检索和回答生成。
- 模型错误、无效 JSON、截断输出、非二元判定、预算用尽、超时及无效分数都留空并记录脱敏原因，不返回旧算法分数冒充 RAGAS。
- 有限值检查只归一 `1e-12` 内的浮点端点误差，实质越界与非有限值仍判为指标错误。
- 关闭 RAGAS 匿名遥测。评测正文仅在内存处理；报告不复制问题、回答、文档正文、凭据或提供方原始错误体。

## 2. 实际文件

| 文件 | 修改内容 |
| --- | --- |
| `services/rag-service/evaluation/models.py` | 人工参考答案及复核标记；指标覆盖数、执行状态、缺项及错误字段 |
| `services/rag-service/evaluation/runner.py` | 删除旧评分；真实调用 RAGAS，规范检索请求、聚合和报告 |
| `services/rag-service/evaluation/run.py` | 命令行授权、模型服务地址、次数和时间预算 |
| `services/rag-service/evaluation/__init__.py` | 更新模块说明 |
| `services/rag-service/evaluation/ragas_engine.py`（新增） | 官方指标、既有 Model 服务适配器、预算和脱敏 |
| `services/rag-service/requirements-evaluation.txt`（新增） | 独立评测环境的兼容版本固定 |
| `services/rag-service/tests/test_evaluation_runner.py` | 保留原测试入口，按新质量契约改为真实 SDK 回归 |
| `services/rag-service/tests/test_ragas_migration_contract.py`（新增） | 授权、检索开关、标准答案与参数边界 |
| `services/rag-service/tests/test_ragas_sdk_integration.py`（新增） | 真实七项指标、模型失败、预算、浮点边界及 CLI 全链路 |
| `services/rag-service/tests/ragas_test_server.py`（新增） | 隔离的 RAG/Model HTTP 测试适配器，仅模拟网络边界 |
| `README.md` | 安装、标注、执行和结果解释 |
| 本报告（新增） | 测试证据、限制及恢复方法 |

报告 schema 升至 `version=2`，标明 `framework=ragas` 和 SDK 版本，保留 `latest.json` 与 UTC 时间戳输出。旧时间戳报告不删除，旧关键词分数不能直接与新语义分数作同口径比较。

`passed_cases` 为兼容字段，表示取得有效指标且无执行错误的完成题数，**不是答案质量通过数**。未设置经业务确认的验收阈值，`quality_verdict=not_assessed`，不猜测工业设备标准，不宣称全部答案正确。

## 3. 安装与执行

已创建并验证的独立环境：`.runtime/ragas-eval-clean`。原全局 Python、在线服务环境未安装或升级此次评测依赖。

```powershell
$env:PYTHONUTF8='1'
# 新机器尚无此环境时创建；已有环境不必重复创建。
L:/anaconda/python.exe -m venv .runtime/ragas-eval-clean
.runtime/ragas-eval-clean/Scripts/python.exe -m pip install `
  -r services/rag-service/requirements.txt `
  -r services/rag-service/requirements-evaluation.txt
```

固定组合为 RAGAS 0.4.3、LangChain 0.3.27、Core 0.3.83、Community 0.3.31、OpenAI 适配包 0.3.35。安装 OpenAI 适配包是 SDK 依赖兼容要求，不代表本项目评测改走 OpenAI；实际请求走原 Model 服务。

最初试验环境继承了全局包，出现无关依赖冲突；改为上述干净环境后 `pip check` 无冲突。最新 Community 包删除了 RAGAS 0.4.3 仍导入的旧适配模块，已通过版本固定解决。Windows 默认编码读取中文依赖失败的问题通过 `PYTHONUTF8=1` 解决。这些试验问题均未通过修改在线环境规避。

启动已有 RAG、Model 服务后，可手动运行一题完整评测，可能产生模型费用：

```powershell
.runtime/ragas-eval-clean/Scripts/python.exe services/rag-service/evaluation/run.py `
  --base-url http://127.0.0.1:8020 `
  --model-service-base-url http://127.0.0.1:8040 `
  --allow-model-calls --limit 1 --top-k 5 --max-model-calls 20 `
  --output-dir evaluation-results
```

仅证据 ID 评测使用 `--no-llm` 替代 `--allow-model-calls`；需要先对实际语料补充人工相关证据 ID。无需为此次离线工具迁移重启五服务，配置文件没有变化。

## 4. 已执行验证

测试调用真实函数、CLI 和官方 SDK，仅 RAG/Model 网络边界采用临时本地 HTTP 适配器。标准答案和证据是测试夹具，不作为生产金标准或生产质量结论。

先加入失败回归再实现：初始迁移 7 项失败；拒答处理、诊断保留、ContextRecall 参数等回归先暴露问题再修正。复核另发现正常浮点误差及检索参数上限问题：真实 SDK 浮点用例先失败，51、100 两个上限用例先失败，随后修复并复测。没有删除失败测试、降低校验或新增跳过来获得通过。

最终命令均在仓库根目录执行，RAG 测试设 `PYTHONUTF8=1`、`RAGAS_DO_NOT_TRACK=true`、`PYTHON_DOTENV_DISABLED=1`：

| 实际命令 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| `.runtime/ragas-eval-clean/Scripts/python.exe -m pytest -c pytest-rag.ini services/rag-service/tests/test_evaluation_runner.py services/rag-service/tests/test_evaluation_dataset.py services/rag-service/tests/test_ragas_migration_contract.py services/rag-service/tests/test_ragas_sdk_integration.py -q` | 38 | 0 | 0 |
| `.runtime/ragas-eval-clean/Scripts/python.exe -m pytest -c pytest-rag.ini -q` | 168 | 0 | 2 |
| `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_north_star.py -q` | 18 | 0 | 0 |
| `.runtime/ragas-eval-clean/Scripts/python.exe -m pip check` | 无依赖冲突 | — | — |

针对性 38 项包含在 RAG 全量 168 项中，不能相加当成不同测试。两项原有跳过均因本机不允许创建测试符号链接，位于 `test_ingestion_boundaries.py:54` 和 `test_whoosh_paths.py:28`。

证据日志：

- `.runtime/verification/ragas-targeted-final-20261014.log`
- `.runtime/verification/ragas-clean-full-final-20261014.log`
- `.runtime/verification/ragas-skill-north-star-final-20261014.log`
- `.runtime/verification/ragas-roundoff-red-20261014.log`

独立只读代码复核确认两项边界问题已修复；另独立运行 7 项相关回归全部通过。

保护文件哈希检查：49 个预先记录的文件中 48 个与任务开始一致，包括共享 `.env`、在线路由、现有 Model 客户端及北极星实现。`app/skills/loop.py` 检测到工作期间的非本次修改；本次没有编辑该文件，也没有为恢复初始哈希而覆盖当前内容。原北极星四项指标的实现未被此次迁移改动，18 项回归通过。

## 5. 未执行及业务限制

- 未运行真实收费裁判或生产 RAG 题集，因本次目标是迁移评测工具，不是授权自动执行收费评测。在线结果质量及实际模型对评测 JSON 的遵循能力仍需手动小批量验证。
- 未启动、重启、部署服务，未调用真实设备、生产数据库或修改数据卷。
- 未重复运行 Backend、CAD、前端全量测试；此次未改这些服务，RAG 全量及 Skill 北极星定向回归已执行。
- 未补造人工参考答案、相关证据 ID 或质量阈值；需专家核对项目实际语料后标注。
- RAGAS 是质量评测，不替代维修审批、设备安全门禁或专家验收。离线软件回归通过不等于生产验收通过。

## 6. 备份与恢复

修改前已有文件备份至 `.local-backups/ragas-migration-20261014-v1/`，保留相对路径，不包含配置密钥。实际修改的旧文件为 `README.md`、四个 `evaluation` 文件和 `test_evaluation_runner.py`；`test_evaluation_dataset.py` 也已备份但未改动。

如需恢复，先停止使用评测命令，确认备份后没有需要保留的进一步人工编辑，然后对上述旧文件逐个从备份复制回同名路径。例如：

```powershell
Copy-Item -LiteralPath 'L:/industry_agent/.local-backups/ragas-migration-20261014-v1/services/rag-service/evaluation/runner.py' `
  -Destination 'L:/industry_agent/services/rag-service/evaluation/runner.py'
```

新增加的执行器、依赖文件、三项测试文件和本报告可单独保留为归档，或确认不再需要后逐个移出项目；不要递归删除项目、数据目录或整个 `.runtime`。此次没有业务数据迁移，旧评测时间戳报告保留，无需恢复数据库或向量索引。

## 7. 官方依据

[RAGAS 包及版本](https://pypi.org/project/ragas/)、[RAG 评测流程](https://docs.ragas.io/en/latest/getstarted/rag_eval/)、[忠实度指标](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/)、[上下文召回指标](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_recall/)。实现以本地安装的固定 SDK 及实际回归结果为依据，不从远程项目覆盖本地代码。
