---
name: report_generation_skill
version: 1.0
goal: 生成完整、可追溯的工业事件或维修报告。
trigger: default
steps:
  - collect_sources
  - check_completeness
  - compose_report
  - validate_report
  - persist_report
  - collect_event
  - validate_completeness
  - validate_result
  - build_result
tools:
  - get_diagnosis_record
  - get_maintenance_record
  - get_workorder
  - get_quality_record
  - get_trace_summary
  - persist_report
  - generate_report_file
---

# 工业事件报告生成

运行标识：`report_generation_skill`。生成完整、可追溯的工业事件或维修报告。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

请求生成普通工业事件或维修报告时使用默认定义，汇总既有业务记录。

## 输入与前置条件

- 已有事件、诊断、方案、工单、维修反馈、质量与 Trace 记录。
- `report_type`、关联身份与 `persist` 按请求提供；没有材料不能伪造报告内容。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `collect_sources`：读取诊断、方案、工单、质检与执行链路等既有材料。
- `check_completeness`：检查报告所需业务材料是否齐全。
- `compose_report`：根据已取得的记录组织报告正文与来源引用。
- `validate_report`：核对报告章节与业务依据。
- `persist_report`：按请求保存实际报告并核对返回。
- `collect_event`：归一化已有事件和相关记录。
- `validate_completeness`：按报告类型核对资料完整性。
- `validate_result`：检查最终结果的结构、证据与业务约束。
- `build_result`：组装真实处理结果及不足、失败或停止原因。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `get_diagnosis_record`：读取已有诊断记录。
- `get_maintenance_record`：读取已有维修方案记录。
- `get_workorder`：读取指定工单。
- `get_quality_record`：读取已有质量检测记录。
- `get_trace_summary`：读取执行链路摘要。
- `persist_report`：持久化报告记录。
- `generate_report_file`：调用现有报告文件生成能力；是否执行取决于请求与实现。

## 输出与停止条件

输出结构化报告与完整性判断，并按保存请求返回实际持久化结果；文件生成只在对应入口真正执行并成功时成立。

## 安全边界

报告不是重新验收设备。本定义允许既有文件工具，不代表当前 Graph 每次调用它；生成、打开、下载 PDF 仍由真实接口与产物判断。

## 代码入口

- [report Agent 入口](L:/industry_agent/services/agent-service/app/agents/report/agent.py)：输入转换、技能选择与结果校验。
- [report Graph 实现](L:/industry_agent/services/agent-service/app/agents/report/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
