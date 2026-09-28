# 诊断到质检闭环门禁实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让诊断置信度、是否需要维修、工单状态迁移、维修验证和质检整改形成可执行的业务闭环。

**Architecture:** 在 Agent runtime/业务服务层集中定义可复用的诊断门禁和状态迁移规则；WorkOrder 创建、Repair Verification、Quality 流程只消费这些规则，不通过前端或单个布尔字段绕过。所有关键分支先用契约测试锁定，再实现并验证 API 与运行时行为。

**Tech Stack:** Python、FastAPI、SQLite durable store、pytest。

## 全局约束

- 低置信度诊断不得自动创建或派发工单。
- 只有 `maintenance_required=true` 的异常才能进入维修工单流程。
- 工单状态只能按显式迁移表变更，非法迁移必须拒绝。
- Repair Verification 必须根据设备恢复数据判定，不接受单独的 `passed=true` 作为证据。
- 质检失败必须经过整改和复检，复检通过后才允许 Release/Close。

## 任务

### 任务 1：诊断置信度与维修必要性门禁

为诊断结果定义稳定的置信度等级、`maintenance_required` 字段和进入工单的判定函数；覆盖低置信度、无需维修、严重异常和正常状态。

### 任务 2：工单状态迁移表

集中定义 WorkOrder 状态迁移图，在创建、更新、派发、反馈、完成、关闭、重开等入口统一校验，拒绝非法跳转并记录当前状态。

### 任务 3：基于设备恢复数据的 Repair Verification

验证必须读取设备最新状态/恢复快照，检查报警清除、关键指标回到阈值、设备运行状态等证据；缺证据或指标仍异常时不得通过。

### 任务 4：Quality FAIL 整改复检闭环

补齐 `FAIL -> 整改 -> 复检 -> Release/Close` 状态与接口行为，复检未通过不能发布/关闭，历史结果保留。

### 任务 5：端到端回归与服务验证

运行新增契约测试、核心 Agent/RAG 测试、编译和服务健康检查，确认门禁没有被 API、runtime 或前端代理绕过。
