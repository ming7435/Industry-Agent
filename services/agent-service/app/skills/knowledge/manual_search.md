---
name: manual_search_skill
version: 1.0
goal: 检索设备手册和操作说明。
trigger: manual
steps:
  - normalize_manual_query
  - search_manual
  - fetch_document_or_chunk
  - validate_evidence
tools:
  - search_manual
  - search_knowledge
  - fetch_document
  - fetch_chunk
---

# 设备手册检索

运行标识：`manual_search_skill`。检索设备手册和操作说明。

本文正文是技能说明；顶部 YAML 元数据仍由运行时加载，名称、触发条件、步骤标识、工具权限和兼容别名保持不变。

## 适用场景

问题明确要求设备手册、说明书或操作说明时使用；不把手册标题当成已经取得正文。

## 输入与前置条件

- `query`：具体手册问题。
- 可选 `device_id`、`component`、`document_id`、`chunk_id`、`filters` 与 `limit`。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `normalize_manual_query`：整理手册查询与设备范围。
- `search_manual`：查询设备手册。
- `fetch_document_or_chunk`：读取已找到的文档或片段以补全依据。
- `validate_evidence`：核对检索依据、来源和不足信息。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `search_manual`：查询设备手册。
- `search_knowledge`：查询混合维修知识。
- `fetch_document`：读取指定文档内容。
- `fetch_chunk`：读取指定知识片段。

## 输出与停止条件

输出手册证据、文档与片段引用、相关性和不足信息；未取得正文时不声称已有完整操作步骤。

## 安全边界

文档归属与参数适用范围必须保留；工具返回不可用时不暗用演示资料替代。

## 代码入口

- [knowledge Agent 入口](L:/industry_agent/services/agent-service/app/agents/knowledge/agent.py)：输入转换、技能选择与结果校验。
- [knowledge Graph 实现](L:/industry_agent/services/agent-service/app/agents/knowledge/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
