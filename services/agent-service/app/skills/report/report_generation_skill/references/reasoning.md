---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- generate_report_file在YAML允许，但普通Report Graph没有文件节点或自动调用。
- 只有generated/success与实际文件回执成立才展示文件，HTTP才提供open_url/download_url。
- 文件内容引用原报告事实，不能补造验收数据来凑完整PDF。

原有约束继续适用：报告不是重新验收设备。本定义允许既有文件工具，不代表当前 Graph 每次调用它；生成、打开、下载 PDF 仍由真实接口与产物判断。

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
| `generate_report_file` | 已持久报告且私有文件授权成立，传 report/path/format。 | 普通 Report Graph 不自动调用；PDF入口成功返回 generated/path，HTTP另提供 open_url/download_url，失败不造链接。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
