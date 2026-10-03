# Agent Service 架构冗余整改记录

## 2026-10-03 领域阶段合并

九个领域图在前轮 85 节点基础上继续合并为 51：Router 3、Diagnosis 7、Knowledge 6、CAD 5、Maintenance 6、WorkOrder 7、Quality 5、Report 5、Memory 7。顶层 Runtime 仍为单独一个节点。Diagnosis、Knowledge、CAD 三个内部循环保留；工单写入阶段、安全门禁和原子操作日志保留。

本轮仅调整领域图注册和边，不改变 30 个 Markdown Skill、66 个工具（65 个模型可见）或五服务接口。完整映射、测试和恢复方法见 [领域阶段合并报告](agent-stage-node-merge-report.md)。下文是前轮和更早的历史记录。

## 2026-10-03 增量精简

本轮在已有本地修改上整理：九个领域 Graph 共 96 → 85 个注册节点，公共执行状态统一到 `agents/state.py`；32 → 30 份 Markdown Skill，两个旧名称保留别名；66 个工具处理器与 65 个模型可见入口保持不变，注册信息改为单一来源，库存、RAG、CAD 薄封装共用实现。

准备阶段仍记录初始化、Skill 加载两个真实子步骤。正式 Runtime 的空知识检索终止门禁、诊断复核缓存旁路、重规划剩余动作保留与方案/诊断验证衔接已补回归修复。本轮 Agent 全量 378 项通过、六组迁移及相关安全回归 26 项通过、Backend 相关测试 6 项通过、跨服务契约 12 项通过，均无失败/跳过。

六组历史测试已迁移到正式 Runtime；两个完整维修闭环也调用真实工单、注册/维修确认、经验和报告实现。外部模型、设备与库存使用隔离适配器。无消费者的旧 graph/nodes.py（435 行）、测试适配器及五个旧专属状态声明已删除，公开 evidence 薄导出仍保留。上述数量是源码结构和离线回归结果，不是线上调用量或生产验收。

完整文件、边界、测试、恢复和保留项见 [本轮交付报告](agent-runtime-slimming-report.md)。以下内容为先前整改记录，原验证数量不是本轮结果。

## 2026-09-29 历史整改记录

以下保留项和测试数量描述当时状态；2026-10-03 的完成状态以上节和本轮交付报告为准。

### 当时修改

- 顶层编排现在只加载 `app/graph/runtime_node.py` 的 `RuntimeNode`；移除了未注册的 `_after_*` 分支函数。`app/graph/nodes.py` 的旧业务节点仍供历史测试兼容，不再由正式 Graph 导入。
- Skill 命中专用规则时不再同时激活 `default`；`always` 仍参与。Runtime 的工具权限按实际选中 Skill 计算，动作载荷不能扩大权限，显式空清单也不会放行工具。
- 根据固定 Agent Graph 的实际调用，补齐知识检索后备、CAD BOM、报告轨迹等 Skill 声明，避免权限收紧后阻断正常调用。
- `AgentHarness.execute_once` 与 `execute_agent` 共用单次调用和轨迹实现；Runtime 单次执行与 A2A 超时重试策略仍分开。

### 当时验证

| 命令 | 结果 |
| --- | --- |
| `pytest -c pytest-agent.ini -q` | 262 通过，0 失败，0 跳过 |
| `pytest -c pytest-agent.ini tests/integration/test_runtime_rag_cad_contract.py services/agent-service/tests/test_agent_contract.py services/agent-service/tests/test_shared_contracts.py -q` | 11 通过，0 失败，0 跳过 |
| `python -m compileall -q services/agent-service/app services/agent-service/tests` | 通过 |
| `git diff --check` | 通过 |

新增测试先复现了 Skill 重复命中、动作载荷伪造 Skill/工具范围、空清单放行以及固定 CAD/报告流程缺少工具权限；修复后通过。Harness 的调用轨迹测试是重构前后的特征测试，未通过人为制造失败来改动业务行为。

### 当时保留项与边界

- 旧 `OrchestratorNodes` 的诊断、知识、维修等方法仍被历史测试直接调用。正式 Graph 已隔离，但这约 400 行兼容代码尚未删除；需把对应测试逐一迁到 Runtime 后再移除，不能直接删测试或假装该路径仍在生产执行。
- `runtime/capabilities.py`、`llm/deepseek.py`、`api/entrypoints.py` 是兼容导出/入口，当前未找到内部生产调用，但外部导入契约无法从仓库内证明不存在，因此保留。
- 本轮没有修改配置或数据，没有部署，没有调用真实设备控制接口。测试通过不等于生产设备或模型服务验收通过。

### 当时恢复

修改前的源码及测试备份位于 `.runtime/agent-service-architecture-backups/20260929-160000/`。恢复单个文件时，先另存当前版本，再按仓库相对路径从该目录复制；不要整目录覆盖。新增的 `runtime_node.py` 与测试文件无旧版本。Skill 备份另有 `app/skills/skills/` 原始目录副本，按相对路径恢复时优先使用 `app/skills/<分类>/` 下的平铺副本。
