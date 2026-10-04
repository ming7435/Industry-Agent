---
name: workorder_skill
version: 1.0
goal: 结合维修方案与工程资料生成工单草稿。
trigger: workorder
steps:
  - build_workorder_draft
  - attach_repair_target
  - attach_drawing_context
  - submit_workorder_draft
tools:
  - get_workorder_template
  - submit_workorder_draft
---

# 工单草稿准备

运行标识：`workorder_skill`。结合维修方案与工程资料生成工单草稿。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

维修方案需要准备工单草稿和工程引用时使用；不是正式创建/派工的同义词。

## 输入与前置条件

- 已生成方案、设备身份、维修目标与对应图纸/BOM 引用。
- 草稿模板及现有约束；正式执行仍需 WorkOrder 业务检查。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `build_workorder_draft`：依据已有维修方案准备执行草稿。
- `attach_repair_target`：附上已核对设备归属的维修目标。
- `attach_drawing_context`：把对应设备的工程图纸引用附到草稿。
- `submit_workorder_draft`：提交方案草稿，草稿不等于正式派工完成。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_workorder_template`：读取工单模板。
- `submit_workorder_draft`：提交工单草稿。

## 输出与停止条件

输出工单草稿或草稿提交实际结果；提交草稿不代表工单已派出或维修已开始。

## 安全边界

只使用模板与草稿入口，不新增创建、派工、完成、关闭或设备控制权限。

## 代码入口

- [maintenance Agent 入口](L:/industry_agent/services/agent-service/app/agents/maintenance/agent.py)：输入转换、技能选择与结果校验。
- [maintenance Graph 实现](L:/industry_agent/services/agent-service/app/agents/maintenance/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
