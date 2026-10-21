---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 模板、草稿、正式工单是不同事实；submitted只能来自工具实际成功回执。
- 附图沿用已有drawing_url/model_url/mesh_name/location，不用标题造图纸地址。
- 未就绪计划仍可保留ready=False的草稿，不把它显示成已派发维修。

原有约束继续适用：只使用模板与草稿入口，不新增创建、派工、完成、关闭或设备控制权限。

## 工具使用规范（Tools）

仅在当前技能合并白名单与实际维修范围内使用工具。知识及CAD的协作读取由既有Agent/Runtime链路负责，不因正文新增对应工具。方案生成、库存读取、模板和草稿提交分开说明，不把后者当正式派单。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `get_workorder_template` | 需要草稿或正式创建参考时传 device_id，可选 plan。 | 读取 template_id/title/steps/source；是模板，不是已创建的维修任务。 |
| `submit_workorder_draft` | 方案 workorder_ready 且 constraints.need_workorder 时传已构造草稿。 | 读取 draft_id/submitted/source；草稿提交不等于正式创建、派发或完成。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
