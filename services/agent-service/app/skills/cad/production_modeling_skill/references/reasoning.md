---
name: reasoning
title: 业务判断规则与工具使用规范
when: 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。
order: 1
---

## 业务判断规则（Reasoning Rules）

- 单位/外径/孔径/长宽高/位置必须对应原需求，不能只检查数字出现过就认定语义匹配。
- 每项用户特征必须保留；不支持/复杂不确定的需求要询问，不以简单圆柱冒充完成。
- 模型提案、实体执行、导出校验、保存版本与生产验收分开，不以旋转摄像机冒充装配运动。

## 工具使用规范（Tools）

build_model绑定text_to_cad，只接白名单结构化spec，私有text_to_cad_tool_scope绑定本次任务；text_to_cad_document_proposal只生成类型化命令提案，确认后才进入文档原生队列。复杂规格必须由用户核对，不靠前端伪模型替代执行。

| 工具 | 何时调用与参数 | 返回使用及失败边界 |
| --- | --- | --- |
| `text_to_cad` | 只有服务端绑定本次 Text-to-CAD 执行上下文且规格已校验时传 spec。 | 读取 status/validation/artifacts/calls；仅实体与 STEP 回读、导出文件都验证才承认完成，未知不重放。 |
| `text_to_cad_document_proposal` | 针对已有文档修订的中文修改，传 head/snapshot/prompt。 | 返回 ready/command/requires_confirmation 或 needs_input/questions；是提案，不是已修改模型。 |

所有工具仅在前置条件满足且实际路径需要时调用；允许不等于本次已调用。失败返回/异常保留到现有观察、finding或错误分支，不补造成功体。
