---
name: hybrid_search_skill
version: 1.0
goal: 为维修依据补充混合资料源，或在没有指定专业知识源时执行混合检索。
trigger: default
triggers:
  - default
  - maintenance_evidence
steps:
  - classify_query
  - search_knowledge
  - rerank_evidence
  - validate_evidence
  - normalize_query
  - select_sources
  - build_filters
  - search
  - build_evidence
  - rank
  - validate_sources
  - build_result
tools:
  - search_knowledge
  - search_sop
  - search_manual
  - search_fault_cases
  - search_semantic_memory
  - fetch_document
  - fetch_chunk
---

# 混合知识检索

运行标识：`hybrid_search_skill`。负责默认混合检索及明确维修依据请求的互补资料检索。

本文正文是技能说明；顶部 YAML 元数据由运行时加载并声明触发条件、步骤和工具权限。

## 适用场景

没有匹配专业知识源时使用默认混合检索；有设备或活动报警范围时仍保留该条件，不自动扩大到全库。

当结构化 `purpose` 为 `maintenance` 时，可与报警检索技能共同选中，允许 Graph 在已有报警资料之外检索 SOP 和故障案例。检索仍受原有预算、设备范围与来源校验约束；普通报警说明不因此启用额外资料源。

## 输入与前置条件

- `query` 与可选 `device_id`、`alarm_code`、`component`、`filters`。
- `purpose: maintenance` 表示明确的维修依据检索意图。
- `required_sources`、`document_id`、`chunk_id`、`limit`、`max_steps` 按实际请求提供。

## 执行步骤

以下列出本技能的步骤或兼容标识。实际顺序、分支与循环由对应 Graph 决定；这些标识不是新增节点，也不表示每次都会执行所有步骤。

- `classify_query`：区分通用知识与专门资料检索。
- `search_knowledge`：执行通用或混合知识检索。
- `rerank_evidence`：对检索证据重排，保留来源与筛选范围。
- `validate_evidence`：核对检索依据、来源和不足信息。
- `normalize_query`：归一化问题与结构化筛选条件。
- `select_sources`：选择与问题相关的资料来源。
- `build_filters`：构建设备、报警、部件等检索条件。
- `search`：执行实际知识检索并记录观察。
- `build_evidence`：整理带来源的知识证据，不补造片段。
- `rank`：按既有相关性规则排序候选证据。
- `validate_sources`：核对候选证据的来源与检索约束。
- `build_result`：组装真实处理结果及不足、失败或停止原因。

## 可调用工具

以下是本技能允许使用的工具范围，不代表每次全部调用。工具不可用时保留不可用或失败状态，不能补造成功结果。

- `search_knowledge`：查询混合维修知识。
- `search_sop`：查询标准作业规程。
- `search_manual`：查询设备手册。
- `search_fault_cases`：查询历史故障案例。
- `search_semantic_memory`：查询历史语义经验。
- `fetch_document`：读取指定文档内容。
- `fetch_chunk`：读取指定知识片段。

## 输出与停止条件

输出融合、排序后的可追踪证据及验证状态；允许有界细化查询，预算结束或没有有效证据时返回不足。

## 安全边界

候选数量和相关性分数不能证明答案正确；不暗中跳过 Model 服务直连供应商，不执行业务写入。

## 代码入口

- [knowledge Agent 入口](L:/industry_agent/services/agent-service/app/agents/knowledge/agent.py)：输入转换、技能选择与结果校验。
- [knowledge Graph 实现](L:/industry_agent/services/agent-service/app/agents/knowledge/graph.py)：实际节点、分支与执行流程。
- [技能注册与加载](L:/industry_agent/services/agent-service/app/skills/registry.py)：Markdown 解析、触发匹配和旧名称兼容。
