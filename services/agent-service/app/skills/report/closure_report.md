---
name: closure_report_skill
aliases: [trace_report_skill]
version: 1.1
goal: 汇总真实业务记录和执行链路，生成闭环或链路报告。
trigger: closure
triggers: [closure, trace]
steps:
  - collect_event
  - select_skills
  - collect_sources
  - validate_completeness
  - compose_report
  - validate_result
  - persist
  - build_result
  - fallback
tools:
  - get_diagnosis_record
  - get_maintenance_record
  - get_workorder
  - get_quality_record
  - get_trace_summary
  - persist_report
---

# 闭环与执行链路报告

运行标识：`closure_report_skill`。汇总真实业务记录和执行链路，生成闭环或链路报告。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

请求闭环或执行链路报告时使用，包括 `full_case_report`；旧 `trace_report_skill` 为别名。空 trace 字段不代表请求了链路报告。

## 输入与前置条件

- 事件及诊断、方案、工单、维修反馈/验收、质检与实际执行链路。
- 报告类型及 `persist`；完整案例按现有规则要求诊断、方案、工单与维修反馈或验收。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `collect_event`：归一化已有事件和相关记录。
- `select_skills`：加载匹配技能及其工具和步骤元数据。
- `collect_sources`：读取诊断、方案、工单、质检与执行链路等既有材料。
- `validate_completeness`：按报告类型核对资料完整性。
- `compose_report`：根据已取得的记录组织报告正文与来源引用。
- `validate_result`：检查最终结果的结构、证据与业务约束。
- `persist`：在对应保存条件满足时调用现有持久化路径。
- `build_result`：组装真实处理结果及不足、失败或停止原因。
- `fallback`：返回明确不足或失败，不包装成成功。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_diagnosis_record`：读取已有诊断记录。
- `get_maintenance_record`：读取已有维修方案记录。
- `get_workorder`：读取指定工单。
- `get_quality_record`：读取已有质量检测记录。
- `get_trace_summary`：读取执行链路摘要。
- `persist_report`：持久化报告记录。

## 输出与停止条件

输出有来源的闭环/链路报告；缺材料返回 incomplete，不重新补造诊断。`persist=false` 记录实际步骤但不写报告。

## 安全边界

本定义仅保留六个原工具，不自动获得 PDF、删除报告、工单写入或设备控制权限；可信设备验收由上游业务门禁负责。

## 代码入口

- [report Agent 入口](L:/industry_agent/services/agent-service/app/agents/report/agent.py)：输入转换、技能选择与结果校验。
- [report Graph 实现](L:/industry_agent/services/agent-service/app/agents/report/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
