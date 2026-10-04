---
name: repair_plan_skill
version: 1.0
goal: 依据诊断结论和证据生成可执行的维修方案。
trigger: repair_plan
steps:
  - assess_diagnosis
  - request_knowledge
  - request_cad
  - plan_repair
  - validate_plan
  - validate_diagnosis
  - determine_required_parts
  - build_safety_steps
  - build_result
tools:
  - generate_repair_plan
  - query_inventory
  - query_part_availability
  - get_workorder_template
  - submit_workorder_draft
---

# 维修方案生成

运行标识：`repair_plan_skill`。依据诊断结论和证据生成可执行的维修方案。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

诊断及证据需要进一步形成维修方案时使用，明确故障分析、步骤、工具、备件与依据。

## 输入与前置条件

- `device_id` 与 `diagnosis_result`/`diagnosis`。
- 已有 `knowledge`、`cad`、`memory`、`constraints` 等资料，保留来源与不足信息。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `assess_diagnosis`：核对诊断结论、证据状态与维修必要性。
- `request_knowledge`：请求与当前故障相关的维修知识。
- `request_cad`：请求对应设备的工程定位依据。
- `plan_repair`：根据诊断、知识和工程证据生成方案。
- `validate_plan`：按当前领域规则检查方案或动作前置条件。
- `validate_diagnosis`：核对诊断完整性及维修决策依据。
- `determine_required_parts`：依据维修目标确定需要核对的备件。
- `build_safety_steps`：整理有依据的安全准备要求，不猜测设备阈值。
- `build_result`：组装真实处理结果及不足、失败或停止原因。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `generate_repair_plan`：调用既有维修方案生成能力。
- `query_inventory`：查询备件库存。
- `query_part_availability`：查询备件可用性。
- `get_workorder_template`：读取工单模板。
- `submit_workorder_draft`：提交工单草稿。

## 输出与停止条件

输出方案与就绪/不足判断；维修必要性、诊断可信度和资料完整性不足时不能把方案当作可自动派工。

## 安全边界

方案与正式工单分离；允许的草稿工具不代表正式派工权限。正文不会新增工具或绕过 diagnosis 与 workorder 业务门禁。

## 代码入口

- [maintenance Agent 入口](L:/industry_agent/services/agent-service/app/agents/maintenance/agent.py)：输入转换、技能选择与结果校验。
- [maintenance Graph 实现](L:/industry_agent/services/agent-service/app/agents/maintenance/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
