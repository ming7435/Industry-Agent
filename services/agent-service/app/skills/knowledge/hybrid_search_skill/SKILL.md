---
name: hybrid_search_skill
description: 当问题无专业检索匹配，或结构化 purpose=maintenance 需要互补资料时使用。
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
- read_skill_reference
---

# 混合维修依据检索

运行标识：`hybrid_search_skill`；所属 Agent：`knowledge`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

为维修依据补充混合资料源，或在没有指定专业知识源时执行混合检索。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

default 在没有专业命中时回退；maintenance_evidence 只检查 purpose=maintenance，此时可与专业技能共选。普通报警文本不会自行授权全部资料源。

不适用：不是无条件全库查询；已有精确文档或片段时优先相应获取，不重复检索代替它。

## 执行流程（Workflow）

### 公共编排

真实公共节点：prepare → retrieve（可重复）→ refine_query（最多一次空结果细化）→ rerank → validate → finish。prepare 内初始化/加载/分类/计划，retrieve 内执行与观察。normalize_query/select_sources/build_filters/search/build_evidence/rank/validate_sources/build_result 是追踪映射；专业步骤标签不新增节点。明确 document_id/chunk_id 优先获取后进入重排，否则执行互补计划。purpose=maintenance 可并行最多4个检索，仍逐项消耗预算。

保留的步骤标识：`classify_query`、`search_knowledge`、`rerank_evidence`、`validate_evidence`、`normalize_query`、`select_sources`、`build_filters`、`search`、`build_evidence`、`rank`、`validate_sources`、`build_result`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

按问题分类选择互补来源，普通混合计划为通用/SOP/手册/案例；维修报警按需要补SOP及案例，required_sources才是硬覆盖条件。合并有出处证据，报告回答来源与降级状态。

## 输出规范（Output Format）

使用 KnowledgeResult：query/status/query_type/summary/answer、documents/evidence/sources/total/filters、possible_causes/recommended_checks、confidence/confidence_details、backend_status/degraded/synthetic/warning、validation_findings/stop_reason、retrieval_trace/retrieval_scope/retrieval_fallback/retrieval_fallback_reason/model_metadata。completed 只表示当前校验通过，不保证语义相关或步骤完整。answer 首选工具已有回答，否则摘录前三文档；Graph 本身不调用生成模型。

## 停止条件（Stop Conditions）

工具调用预算默认4，max_steps为1–8；无剩余计划或预算用尽后重排与校验。空结果仅在有余预算时一次固定细化。结果 stop_reason 是 evidence_ready 或 insufficient_evidence，不能擅自添加独立预算状态。知识充分也只交给下游判断，不直接维修。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `hybrid_search_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |
