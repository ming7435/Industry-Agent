---
name: experience_extraction
aliases: [memory_write]
version: 1.1
goal: 从已关闭且可信维修验收通过的工单中提取、验证并保存经验。
trigger: learn
steps:
  - validate_closed
  - select_skills
  - validate_admission
  - extract_experience
  - dedup_experience
  - validate_experience
  - persist
  - build_result
  - fallback
tools: []
output: MemoryResult
---

# 维修经验提取与写入

运行标识：`experience_extraction`。从已关闭且可信维修验收通过的工单中提取、验证并保存经验。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

`action=learn` 从已关闭且可信维修验收通过的案例中学习；旧名 `memory_write` 兼容解析。明确 search 动作不因文本含 learn 变成写入。

## 输入与前置条件

- 输入工单、诊断、方案、真实维修反馈与可信验收结果。
- 工单关闭与经验准入条件满足；生产零件质检不能替代设备维修验收。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `validate_closed`：归一化 Memory 入口并校验动作；学习准入另由对应步骤检查。
- `select_skills`：加载匹配技能及其工具和步骤元数据。
- `validate_admission`：核对关闭案例与可信维修验收，决定是否可学习。
- `extract_experience`：从输入案例中提取可追踪的维修事实。
- `dedup_experience`：按来源工单等身份避免重复保存经验。
- `validate_experience`：核对提取经验的事实来源与完整性。
- `persist`：在对应保存条件满足时调用现有持久化路径。
- `build_result`：组装真实处理结果及不足、失败或停止原因。
- `fallback`：返回明确不足或失败，不包装成成功。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

此技能不直接调用注册工具；内部处理或持久化仍以对应 Graph 的实现为准。

## 输出与停止条件

返回 `MemoryResult` 与实际经验、长期记忆和 RAG 保存结果；部分保存不视为全链路完成，同一经验可按既有恢复规则对账。

## 安全边界

不授予 `get_workorder` 或工单/控制工具权限。现有经验模块完成去重、验证和保存；tools 为空不表示该路径没有持久化副作用。

## 代码入口

- [memory Agent 入口](L:/industry_agent/services/agent-service/app/agents/memory/agent.py)：输入转换、技能选择与结果校验。
- [memory Graph 实现](L:/industry_agent/services/agent-service/app/agents/memory/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
