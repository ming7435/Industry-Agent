---
name: sop_search_skill
description: 当请求SOP、规程或具体检查维修步骤时使用。
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
- read_skill_reference
---

# 标准作业规程检索

运行标识：`sop_search_skill`；所属 Agent：`knowledge`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

检索标准作业规程和维修步骤。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

sop_or_repair_steps 匹配 sop/步骤/规程/怎么修/怎么检查。技能选择与Graph重新分类不同；仅“怎么检查”可能仍形成混合计划，未授权工具必须被拒绝。

不适用：报警名称或零散历史描述不能直接变成完整SOP，也不推定已具现场操作授权。

## 执行流程（Workflow）

### 公共编排

真实公共节点：prepare → retrieve（可重复）→ refine_query（最多一次空结果细化）→ rerank → validate → finish。prepare 内初始化/加载/分类/计划，retrieve 内执行与观察。normalize_query/select_sources/build_filters/search/build_evidence/rank/validate_sources/build_result 是追踪映射；专业步骤标签不新增节点。明确 document_id/chunk_id 优先获取后进入重排，否则执行互补计划。purpose=maintenance 可并行最多4个检索，仍逐项消耗预算。

保留的步骤标识：`classify_sop_query`、`search_sop`、`fetch_document_or_chunk`、`validate_evidence`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

以设备和部件范围检索SOP及适用手册；用 required_sources=['sop'] 表达必须来源；读取前置隔离、顺序、安全和恢复条件，缺关键条件只返回片段和具体缺口。

## 输出规范（Output Format）

使用 KnowledgeResult：query/status/query_type/summary/answer、documents/evidence/sources/total/filters、possible_causes/recommended_checks、confidence/confidence_details、backend_status/degraded/synthetic/warning、validation_findings/stop_reason、retrieval_trace/retrieval_scope/retrieval_fallback/retrieval_fallback_reason/model_metadata。completed 只表示当前校验通过，不保证语义相关或步骤完整。answer 首选工具已有回答，否则摘录前三文档；Graph 本身不调用生成模型。

## 停止条件（Stop Conditions）

工具调用预算默认4，max_steps为1–8；无剩余计划或预算用尽后重排与校验。空结果仅在有余预算时一次固定细化。结果 stop_reason 是 evidence_ready 或 insufficient_evidence，不能擅自添加独立预算状态。知识充分也只交给下游判断，不直接维修。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `sop_search_skill`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |
