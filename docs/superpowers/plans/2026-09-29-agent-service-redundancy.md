# Agent Service 架构冗余整改计划

> **For agentic workers:** 按 superpowers:executing-plans 在当前会话逐项执行；每项先写失败测试，再实现并验证。用户已要求直接修改当前本地项目，因此不另建工作树或要求再次确认。

**Goal:** 缩减未接入的顶层 Graph 流程，收敛 Skill 工具范围和 Agent 执行代码，同时保留现有 API、领域 Agent 与业务门禁。

**Architecture:** 顶层 Graph 只提供 Runtime 入口，业务顺序继续由 RuntimeCoordinator 决定。Skill 的 `default` 只作无专用命中时的兜底；运行时工具范围与实际选中的 Skill 对齐。A2A 与 Runtime 可以有不同策略，但共用 Agent 调用及轨迹实现。

**Tech Stack:** Python 3.12、LangGraph、pytest。

**Spec:** 本会话上一轮 `agent-service` 架构分析与用户“做一下修改”的要求。

## Global Constraints

- 只修改当前本地 `agent-service` 相关源码、测试和此计划记录。
- 先备份将修改的文件；保留用户已有工作区改动，不提交、不部署、不调用真实设备或收费模型。
- 不删失败测试；旧流程测试迁移到实际 Runtime 路径后再删除不可达代码。
- 兼容公开入口与领域 Agent Graph；不重做五服务或前端。

## Review Focus

- 报警与手册等专用 Skill 命中时，不应同时激活 `default` Skill。
- Runtime 守卫只授权当前动作所需工具；空工具列表也应有明确语义。
- 知识检索的后备工具和维修/报告实际调用仍能执行。
- A2A 与 Runtime 调用仍具有准确的尝试次数、输入输出轨迹和超时边界。
- 原来由旧顶层节点测试的低置信度阻断、证据不足阻断和工单状态映射应由实际 Runtime 测试覆盖。

### Task 1: Skill 选择与工具边界

**Files:** `app/skills/registry.py`, `app/runtime/coordinator.py`, 必要的 Skill `.md`，`tests/test_skill_registry.py` 与 Runtime 守卫测试。

- [x] 写专用 Skill 覆盖 default、无命中回退 default、`always` 仍参与的行为测试，并确认失败。
- [x] 写 Runtime 动作只授权选中 Skill 工具、真实检索后备工具仍可用的测试，并确认失败。
- [x] 实现最小选择/工具范围修改，运行专项和 Agent 全量测试。

### Task 2: Agent 执行代码收敛

**Files:** `app/harness/runtime.py`, `tests/test_harness_side_effects.py` 等专项测试。

- [x] 给两个入口补同一调用轨迹的特征测试；原行为通过，按重构路径保持绿色。
- [x] 抽取同一 Agent 调用实现，保留 Runtime 与 A2A 各自需要的外层策略。
- [x] 运行 Harness、A2A、Runtime 专项测试。

### Task 3: 顶层 Graph 旧路径收敛

**Files:** `app/graph/nodes.py`, `app/graph/workflow.py`, 直接调用旧节点的测试文件。

- [x] 将证据阻断的静态边测试改为实际顶层 Graph 测试；其他业务门禁由现有 Runtime/API 测试覆盖。
- [ ] 旧节点生命周期测试尚未全部迁移；正式 Graph 已改为只加载 RuntimeNode，旧节点作为兼容层保留。
- [x] 移除未注册的 `_after_*` 边辅助函数，运行 Graph、Runtime、API 和 Agent 全量测试。

### Task 4: 复核与交付

- [x] 复核 `runtime/capabilities.py`、`llm/deepseek.py` 与 `api/entrypoints.py`；保留潜在外部兼容入口。
- [x] 运行 Agent 全量测试、跨服务契约测试和静态编译检查。
- [x] 在本地修复报告中记录修改、未删的兼容入口、测试与恢复方法。
