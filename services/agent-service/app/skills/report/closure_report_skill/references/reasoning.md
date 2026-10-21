---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

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
