---
name: closure_report_skill
description: 当需要汇总故障闭环或执行链路事实时使用。
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
  - persist_report
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

运行标识：`closure_report_skill`；所属 Agent：`report`；兼容别名：`trace_report_skill`。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

汇总真实业务记录和执行链路，生成闭环或链路报告。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

closure匹配closure/closure_report/full_case_report，trace匹配trace/trace_report；trace_report_skill为兼容别名。这是技能选择，最终report_type仍由既有类型及资料推断。

不适用：不能仅因报告名含闭环就宣布工单已经关闭或机器已复机。

## 输入与前置条件（Inputs）

ReportQuery：report_type、task_id/trace_id/device_id/event_id/workorder_id，diagnosis/maintenance_plan/workorder/repair_feedback/repair_verification/quality/knowledge/event/context，trace（对象列表），persist（默认True）。已有记录可直接传入；缺资料保留缺口，不通过伪造ID取得另一事件资料。

## 执行流程（Workflow）

### 公共编排

真实节点prepare → collect_context → compose → persist → finish。prepare初始化/加载；collect_context读取与完整性检查；compose组合正文和结果校验；persist按请求保存；finish成功或fallback。collect_event/select_skills/validate_completeness/compose_report/validate_result/persist_report/build_result是追踪映射，YAML的文件步骤不是普通Graph节点。

保留的步骤标识：`collect_event`、`select_skills`、`collect_sources`、`validate_completeness`、`compose_report`、`validate_result`、`persist`、`persist_report`、`build_result`、`fallback`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

从本事件/工单记录收集诊断、计划、实际反馈与验收及Trace；按类型检查完整性，给每个事实章节附来源；资料不足写incomplete，persist请求保存时核对回执。

## 业务判断规则（Reasoning Rules）

- 建议方案与实际维修反馈分别放对应章节，计划中步骤不当作已执行操作。
- Trace计数或任务存在不是业务完成证据，未执行步骤不补工具记录。
- full_case需要诊断/计划/工单及反馈或维修验收，缺任一不得写完整闭环成功。

原有约束继续适用：本定义仅保留六个原工具，不自动获得 PDF、删除报告、工单写入或设备控制权限；可信设备验收由上游业务门禁负责。

## 工具使用规范（Tools）

只有需要且当前允许的资料读取才调用。get_workorder只在未传内嵌工单且有编号时读取。persist=False不保存。generate_report_file即便获声明，普通Graph也不调用；文件入口另有服务端私有授权。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `get_diagnosis_record` | 需要诊断资料时传已有 record/event/event_id。 | 读取 found/success/record/来源身份；缺诊断不造确定根因。 |
| `get_maintenance_record` | 需要维修资料时传 record/plan_id，工具兼容 plan。 | 使用真实计划字段，不从标题臆造处理步骤。 |
| `get_workorder` | 明确工单编号时传 workorder_id。 | 读取 found/工单状态与事实；不存在和传输失败都不能用缓存成功替代。 |
| `get_quality_record` | 仅相关产品质检报告需要，传 record/workorder_id。 | 保留原检测结论和来源；质检通过不能替代维修验收。 |
| `get_trace_summary` | 需要执行汇总时传 trace/trace_id。 | summary 含 record_count/type_counts/names；零计数不是 Agent 已执行证明。 |
| `persist_report` | 需要持久化时传 report。 | 必须核对实际保存回执；incomplete 可保存但不能改为完整事实报告。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。

## 证据与数据真实性（Evidence Rules）

每个存在的事实章节附source_refs（section/type/id/source/label），区分事件、诊断、建议、实际反馈、维修验收与执行计数。空trace的0计数结构不是Agent执行证明。产品quality仅属于quality_report，不能用其通过证明维修恢复；其它报告不塞产品质量记录。

## 输出规范（Output Format）

使用 ReportResult：report_id/report_type/title/summary/status、sections/source_refs/validation_findings、persisted/file_path/stop_reason/created_at。正文类型由已有规则认定diagnosis_report/maintenance_report/quality_report/incident_report/full_case_report，或既有别名；closure/trace触发选择不新建结果类型。status=completed表示报告资料校验完成，不证明设备验收或PDF已生成。

## 异常处理（Error Handling）

读记录异常保留found=False/success=False/error；资料不足但有章节时可compose并status=incomplete，可按persist要求保存。保存未确认保留incomplete/report_persistence_failed。空资料按原fallback。不能把空默认file_path填成不存在文件。

## 停止条件（Stop Conditions）

diagnosis报告要诊断；maintenance要诊断/方案/工单；quality要质检；incident要事件；full_case还要反馈或维修验收。各事实还需对应标识/正文和source_refs。满足本次报告校验后结束，无新增循环；PDF渲染成败独立报告。

## 安全与权限边界（Safety & Constraints）

只汇总已有事实，不诊断、维修、派发、复机或重新做检测。不使用原有引用替代本事件身份。报告正文保存与生成可打开下载的真实PDF必须分别核验。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "report_type": "full_case_report",
  "persist": false,
  "diagnosis": {
    "device_id": "CNC-01",
    "fault": "冷却泵异常"
  },
  "maintenance_plan": {
    "repair_target": "冷却泵",
    "repair_steps": [
      "核对供液"
    ]
  },
  "workorder": {
    "workorder_id": "WO-EXAMPLE",
    "device_id": "CNC-01"
  }
}
```

### 处理与依据

没有实际处理反馈/验收：即使有计划，也只输出incomplete，persist=False不保存。

### 示例输出

```json
{
  "report_id": "RPT-EXAMPLE",
  "report_type": "full_case_report",
  "title": "冷却泵异常案例资料",
  "summary": "缺少实际维修反馈或验收",
  "status": "incomplete",
  "persisted": false,
  "validation_findings": [
    "缺少维修反馈或维修验收"
  ]
}
```

## 参考实现（References）

- [app/agents/report/agent.py](L:/industry_agent/services/agent-service/app/agents/report/agent.py)
- [app/agents/report/graph.py](L:/industry_agent/services/agent-service/app/agents/report/graph.py)
- [app/agents/report/schemas.py](L:/industry_agent/services/agent-service/app/agents/report/schemas.py)
- [app/agents/report/validator.py](L:/industry_agent/services/agent-service/app/agents/report/validator.py)
- [app/contracts.py](L:/industry_agent/services/agent-service/app/contracts.py)
- [app/skills/registry.py](L:/industry_agent/services/agent-service/app/skills/registry.py)
- [app/tools/registry.py](L:/industry_agent/services/agent-service/app/tools/registry.py)
