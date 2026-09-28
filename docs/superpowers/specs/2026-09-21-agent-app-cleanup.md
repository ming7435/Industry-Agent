# Agent 应用清理设计

## 目标

在不移除必要业务能力的前提下清理 `services/agent-service/app`，并让活动 Skill 配置在引用不可用工具时快速失败。

## 功能保留

- 报警解析继续位于 `app/common/alarm.py`；已移除的 `app/alarm` 源码已迁移到该处，行为保持不变。
- 经验提取、准入、去重、存储和 RAG 写入继续位于 `app/memory/`；当前实现体现工单维修反馈闭环模型。
- Trace 记录继续位于 `app/harness/trace.py`；已移除的 `app/trace` 源码已迁移到该处，行为没有损失。
- 共享 Pydantic 契约继续位于 `app/contracts.py`，各 Agent 包负责 Agent 专属校验；当前契约增加了工单生命周期和维修字段。
- 七个根目录旧版 Skill YAML 文件中的所有工具，仍由 `app/skills/{agent}/*.yaml` 下的 32 个活动文件覆盖。

## 清理范围

- 删除仅用于缓存且被忽略的目录 `app/alarm`、`app/experience`、`app/trace` 和 `app/validator`。
- 删除 `app` 下所有被忽略的 `__pycache__` 目录。
- 删除七个已跟踪的根目录旧版 Skill 文件：`cad_skill.yaml`、`diagnosis_skill.yaml`、`knowledge_skill.yaml`、`maintenance_skill.yaml`、`quality_skill.yaml`、`report_skill.yaml` 和 `router_skill.yaml`。
- 保留 `app/runtime/ARCHITECTURE_AUDIT.md`，因为它仍是有用的架构文档。
- 保留所有当前源码目录，因为它们参与应用、监控、工具、记忆、闭环或工单执行路径。

## Skill 校验

`SkillRegistry` 将为每个 Agent 的活动目录提供校验。校验只检查符合现有 `app/skills/{agent}/*.yaml` 契约的目录，并拒绝：

- 同一 Agent 内重复的 Skill 名称；
- 在传入的 Tool Registry 工具集合中不存在的 Skill 工具名称。

`AgentContainer` 在构造 `ToolRegistry` 后、构造 Agent 前执行此校验。错误必须包含 Agent、Skill、源 YAML 和缺失工具，以便直接修复配置问题。

## 验证

- 先由聚焦测试证明当前不会拒绝缺失工具和重复名称。
- 完成校验后，同一测试应当通过。
- 使用所有已注册 MCP handler 名称校验真实目录。
- 完整 Agent Service pytest 套件应当通过。
- `git status` 应只显示七个预期的已跟踪删除项以及代码/测试/计划变更；用户已有的根目录 `README.md` 修改保持不变。
