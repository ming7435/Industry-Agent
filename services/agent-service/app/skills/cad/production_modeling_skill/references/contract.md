---
name: contract
title: 输入契约与真实示例
when: 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。
order: 3
---

## 输入与前置条件（Inputs）

自然语言/结构化建模公开输入为 TextToCadRunRequest：prompt（非空≤10000）、command_id（1–128，字母数字及_.:-）、spec可选、part_name≤120、part_number≤80。禁止控制字符。run_id由服务端command_id哈希生成FC-编号；模型不能指定路径、脚本、内部执行工具名或URL。已有文档修改另用head/snapshot/prompt生成提案，绑定DOC/object_id/revision。

## 示例（Examples）

以下为隔离说明样例，不是现场执行记录。请求形状合法不代表业务门禁已通过；编号、测量和回执必须来自实际系统。

### 示例输入

```json
{
  "command_id": "example-missing-shaft",
  "prompt": "生成一个带孔的销轴"
}
```

### 处理与依据

该输入未给尺寸；只能要求补充，不填示例30/50/10毫米。规格解析结果示例如下，不是执行回执。

### 示例输出

```json
{
  "status": "needs_input",
  "questions": [
    "请补充外径、长度、孔径及孔的位置和方向，并明确单位。"
  ]
}
```
