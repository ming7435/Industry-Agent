---
name: sop_search_skill
version: 1.0
goal: 检索标准作业规程和维修步骤。
trigger: sop_or_repair_steps
steps:
  - classify_sop_query
  - search_sop
  - fetch_document_or_chunk
  - validate_evidence
tools:
  - search_sop
  - search_manual
  - fetch_document
  - fetch_chunk
---

# 标准作业规程检索

运行标识：`sop_search_skill`。检索标准作业规程和维修步骤。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

需要标准作业规程、排查顺序或维修步骤时使用，对应 `sop_or_repair_steps`。

## 输入与前置条件

- 具体维修或检查问题，以及已有设备、报警和部件范围。
- 对应规程文档或片段可按身份补取；不得猜测拆装参数与验收阈值。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `classify_sop_query`：识别规程、排查顺序或维修步骤需求。
- `search_sop`：查询标准作业规程。
- `fetch_document_or_chunk`：读取已找到的文档或片段以补全依据。
- `validate_evidence`：核对检索依据、来源和不足信息。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `search_sop`：查询标准作业规程。
- `search_manual`：查询设备手册。
- `fetch_document`：读取指定文档内容。
- `fetch_chunk`：读取指定知识片段。

## 输出与停止条件

输出规程片段与来源，区分操作步骤和仅包含报警名称的目录；证据不足时返回缺口，不补造完整流程。

## 安全边界

检索只提供依据，不代表授权人员执行。安全要求必须有来源，本技能不派工、不提交完成、不控制机器。

## 代码入口

- [knowledge Agent 入口](L:/industry_agent/services/agent-service/app/agents/knowledge/agent.py)：输入转换、技能选择与结果校验。
- [knowledge Graph 实现](L:/industry_agent/services/agent-service/app/agents/knowledge/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
