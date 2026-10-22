---
name: memory_dedup
description: 当Memory流程读取或学习经验，需要抑制同源重复并核对部分保存时使用。
version: 1.0
goal: 避免同一工单的维修经验重复写入。
trigger: always
steps:
- dedup
- dedup_experience
tools:
- read_skill_reference
output: MemoryResult
---

# 维修经验去重与部分保存恢复

运行标识：`memory_dedup`；所属 Agent：`memory`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

避免同一工单的维修经验重复写入。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

always只在Memory技能范围内附加，不是所有Agent全局触发；不单独提供新的去重API。

不适用：不删除历史或做语义合并，不以重复标志遮盖RAG未同步事实。

## 执行流程（Workflow）

### 公共编排

prepare组合初始化/选择/准入；检索走retrieve_memory → rank_results（dedup/rerank/validate）→ finish；学习走extract（extract_experience/dedup_experience）→ validate_experience → persist → finish。validate_closed/select_skills/score_experience/build_result等是业务或追踪标签；summarize/sync走专属保存路径，不是learn的免验收替代。

保留的步骤标识：`dedup`、`dedup_experience`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

读结果在rank_results用四元组去重；学习在extract用device_id/fault/source_workorder查重。匹配experience_id且rag_saved=False时保持原ID继续validate/persist恢复同步，其它重复按原分支结束。

## 输出规范（Output Format）

使用 MemoryResult：action/success/items/experience/count/backend/validation_findings/stop_reason/error。经验里保留experience_id/device_id/fault/content/source_workorder/source_report、learning_idempotency_key、validation_status/experience_quality_score、memory_saved/rag_saved/duplicate等实际字段。success不代表两阶段均成功；必须分别核对memory_saved与rag_saved。

## 停止条件（Stop Conditions）

读流程按已取结果去重、排序及limit结束，无模型推理循环。学习须达到已有准入和质量门槛，重复已完成可结束，不同部分保存走稳定ID恢复。普通final的stop_reason=completed可能仍success=False，不把它等同新增保存成功。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `memory_dedup`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
