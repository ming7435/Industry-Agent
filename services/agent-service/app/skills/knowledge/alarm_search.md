---
name: alarm_search_skill
version: 1.0
goal: 检索报警定义以及与报警相关的技术知识。
trigger: exists(alarm_code)
steps:
  - normalize_alarm_code
  - search_alarm_knowledge
  - fetch_document_or_chunk
  - validate_evidence
tools:
  - search_alarm_knowledge
  - search_knowledge
  - fetch_document
  - fetch_chunk
---

# 报警知识检索

运行标识：`alarm_search_skill`。检索报警定义以及与报警相关的技术知识。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

检索报警定义、报警对应系统与相关技术知识时使用；默认触发为 `exists(alarm_code)`。

## 输入与前置条件

- 问题或报警码，以及已知设备和部件范围。
- 可选文档/片段身份与返回数量限制；指定设备的查询不暗中改为无范围查询。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `normalize_alarm_code`：清洗报警表达并保留编号身份。
- `search_alarm_knowledge`：查询报警相关知识和定义片段。
- `fetch_document_or_chunk`：读取已找到的文档或片段以补全依据。
- `validate_evidence`：核对检索依据、来源和不足信息。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `search_alarm_knowledge`：查询报警知识。
- `search_knowledge`：查询混合维修知识。
- `fetch_document`：读取指定文档内容。
- `fetch_chunk`：读取指定知识片段。

## 输出与停止条件

输出报警相关文档片段、来源与证据状态；空结果正常返回不足，报警目录不冒充详细维修 SOP。

## 安全边界

允许通用 `search_knowledge` 作为既有检索补充，但不能绕过设备范围，也不能写工单或控制设备。

## 代码入口

- [knowledge Agent 入口](L:/industry_agent/services/agent-service/app/agents/knowledge/agent.py)：输入转换、技能选择与结果校验。
- [knowledge Graph 实现](L:/industry_agent/services/agent-service/app/agents/knowledge/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
