# Agent Service 架构冗余整改记录

## 本次修改

- 顶层编排现在只加载 `app/graph/runtime_node.py` 的 `RuntimeNode`；移除了未注册的 `_after_*` 分支函数。`app/graph/nodes.py` 的旧业务节点仍供历史测试兼容，不再由正式 Graph 导入。
- Skill 命中专用规则时不再同时激活 `default`；`always` 仍参与。Runtime 的工具权限按实际选中 Skill 计算，动作载荷不能扩大权限，显式空清单也不会放行工具。
- 根据固定 Agent Graph 的实际调用，补齐知识检索后备、CAD BOM、报告轨迹等 Skill 声明，避免权限收紧后阻断正常调用。
- `AgentHarness.execute_once` 与 `execute_agent` 共用单次调用和轨迹实现；Runtime 单次执行与 A2A 超时重试策略仍分开。

## 验证

| 命令 | 结果 |
| --- | --- |
| `pytest -c pytest-agent.ini -q` | 262 通过，0 失败，0 跳过 |
| `pytest -c pytest-agent.ini tests/integration/test_runtime_rag_cad_contract.py services/agent-service/tests/test_agent_contract.py services/agent-service/tests/test_shared_contracts.py -q` | 11 通过，0 失败，0 跳过 |
| `python -m compileall -q services/agent-service/app services/agent-service/tests` | 通过 |
| `git diff --check` | 通过 |

新增测试先复现了 Skill 重复命中、动作载荷伪造 Skill/工具范围、空清单放行以及固定 CAD/报告流程缺少工具权限；修复后通过。Harness 的调用轨迹测试是重构前后的特征测试，未通过人为制造失败来改动业务行为。

## 保留项与边界

- 旧 `OrchestratorNodes` 的诊断、知识、维修等方法仍被历史测试直接调用。正式 Graph 已隔离，但这约 400 行兼容代码尚未删除；需把对应测试逐一迁到 Runtime 后再移除，不能直接删测试或假装该路径仍在生产执行。
- `runtime/capabilities.py`、`llm/deepseek.py`、`api/entrypoints.py` 是兼容导出/入口，当前未找到内部生产调用，但外部导入契约无法从仓库内证明不存在，因此保留。
- 本轮没有修改配置或数据，没有部署，没有调用真实设备控制接口。测试通过不等于生产设备或模型服务验收通过。

## 恢复

修改前的源码及测试备份位于 `.runtime/agent-service-architecture-backups/20260929-160000/`。恢复单个文件时，先另存当前版本，再按仓库相对路径从该目录复制；不要整目录覆盖。新增的 `runtime_node.py` 与测试文件无旧版本。Skill 备份另有 `app/skills/skills/` 原始目录副本，按相对路径恢复时优先使用 `app/skills/<分类>/` 下的平铺副本。
