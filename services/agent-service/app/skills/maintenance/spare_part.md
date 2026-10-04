---
name: spare_part_skill
version: 1.0
goal: 确定维修所需备件，并核对库存和可用性。
trigger: part_or_component
steps:
  - resolve_target_part
  - query_inventory
  - query_part_availability
  - validate_parts
tools:
  - query_inventory
  - query_part_availability
---

# 备件分析

运行标识：`spare_part_skill`。确定维修所需备件，并核对库存和可用性。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

需要确认维修备件及其库存、可用性时使用，对应部件或零件号条件。

## 输入与前置条件

- 已核对设备归属的维修目标和零件号。
- 实际库存与备件可用性接口返回；没有真实适配器时记录不可用。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `resolve_target_part`：根据维修目标确定备件编号与设备关系。
- `query_inventory`：读取备件库存的实际返回。
- `query_part_availability`：核对备件当前可用性与不可用原因。
- `validate_parts`：核对备件列表及库存/可用性返回。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `query_inventory`：查询备件库存。
- `query_part_availability`：查询备件可用性。

## 输出与停止条件

输出有依据的备件列表与库存/可用状态；未知库存不等于库存为零，也不等于可以领用。

## 安全边界

这只是查询分析，不预约、扣减或消耗库存，不编造库存数量或替代型号。

## 代码入口

- [maintenance Agent 入口](L:/industry_agent/services/agent-service/app/agents/maintenance/agent.py)：输入转换、技能选择与结果校验。
- [maintenance Graph 实现](L:/industry_agent/services/agent-service/app/agents/maintenance/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
