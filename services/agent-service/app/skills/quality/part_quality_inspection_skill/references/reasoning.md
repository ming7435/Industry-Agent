---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 普通范围外观需五项明确布尔，材料按已声明牌号/硬度，功能需跳动标准与rotation_test，工艺需cycle_complete/traceable/operator_confirmed；缺数据不默认通过。
- 申诉批准进入rectification而非放行；全部整改完成后才复检，通过需整改后新检测、同零件/批次/scope/设计版本。
- Release再次核对整改与复检，released才允许Close；质检记录关闭不授权机器启动。

原有约束继续适用：单个 `passed=true` 不能替代完整可信检测；synthetic/degraded 不作为生产验收。失败后的整改、复检、放行和关闭由 Backend 闭环处理。

## 工具使用规范（Tools）

以服务端确认的范围决定实际调用，不把所有允许工具都写成每次执行。常规inspect读取权威零件及标准；create_quality_check/整改/申诉/复检/放行/关闭需要私有闭环授权，不能由JSON字段伪造。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `create_quality_check` | 受服务端正式质检入口授权时传 operator 与真实检测字段。 | 返回 quality_check_id/quality_check/success；持久化事实与检测结论分别核对。 |
| `get_production_part` | 生产身份已知时传 part_id/part_no/batch_id/production_order_id 和 part。 | 核对 success/found/identity_verified、身份及 synthetic/degraded；客户端数据不能替代权威生产记录。 |
| `get_part_specification` | 已取得可信生产记录时传 part。 | 读取 specifications/source；缺少必需规格为数据不足，不默认合格。 |
| `inspect_part_dimensions` | 有权威 part 和标准时传 part/measurements/specifications。 | 核对 items/status/passed/sufficient_data；cad_parameters 为完整参数精确比较，缺项与超差分别表达。 |
| `inspect_part_appearance` | 仅普通五类范围适用时传 part。 | 读取外观检查体；缺布尔缺陷项为不足，不把未检测记为通过。 |
| `inspect_part_material` | 普通范围有材料标准时传 part/specifications。 | 读取牌号/硬度检查；未知材料或缺标准不是合格。 |
| `inspect_part_function` | 普通范围有功能标准时传 part/specifications。 | 读取跳动及 rotation_test 检查；没有测量不能推定功能通过。 |
| `inspect_part_process` | 普通范围需工艺追溯时传 part。 | 读取 cycle_complete/traceable/operator_confirmed，缺项不代替现场确认。 |
| `create_closure_task` | 已存在质检单且获闭环授权时传 operator/quality_check_id/workorder_id/title/owner/actions/due_at。 | 读取 closure_task_id/closure_task；建整改任务不等于整改完成。 |
| `complete_closure_task` | 实际整改完成时传 task_id/operator/note。 | 保存 closure_task；只有全部必要任务完成才可复检。 |
| `submit_quality_appeal` | 对现有 check_id 申诉时传 check_id/reason/evidence/operator/applicant。 | 读取 appeal；提交申诉不能改为检测通过或放行。 |
| `resolve_quality_appeal` | 正式审批入口传 check_id/appeal_id/decision/reason/operator。 | 读取 appeal/quality_check；批准进入整改，不直接 Release。 |
| `reinspect_quality_check` | 整改完成并有新的真实检测时传 check_id/passed/findings/evidence/operator/reinspection_check_id。 | 核对同零件、批次、范围和设计版本，以及检测晚于整改；不是客户端 passed 自证。 |
| `release_quality_check` | 有效通过复检后传 check_id/operator。 | 再次核对全部整改和复检依据，返回实际 quality_check；不绕过现场标准。 |
| `close_quality_check` | 仅 released 状态传 check_id/operator/note。 | 返回实际关闭状态；未放行不允许关闭冒充完成。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
