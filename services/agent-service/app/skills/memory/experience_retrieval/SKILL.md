---
name: experience_retrieval
description: 当需要查询匹配维修经验或列出近期记录时使用。
version: 1.1
goal: 检索或列出已验证的历史维修经验。
trigger: search
triggers:
- search
- recent
steps:
- validate_closed
- select_skills
- validate_search
- retrieve_memory
- dedup
- score_experience
- validate
- build_result
- fallback
tools:
- search_semantic_memory
- read_skill_reference
output: MemoryResult
---

# 历史维修经验读取

运行标识：`experience_retrieval`；所属 Agent：`memory`；兼容别名：无。唯一运行元数据来源是本文件 YAML。Agent 接收与转换任务，Graph 决定编排、分支、预算和降级，Skill 指导业务判断，Tools 返回真实观察，原 Result 契约限制公开结构。正文不授予新增权限。

## 技能概述（Overview）

检索或列出已验证的历史维修经验。 只完成本技能责任范围，保留未解决事实与下游判断边界。

## 触发场景（When to Use）

action=search或recent；结构化动作优先正文，experience_retrieval与memory_dedup共选。

不适用：不因检索文字含“学习”切换到写入，不宣称检索Graph再次验收了所有旧记录。

## 执行流程（Workflow）

### 公共编排

prepare组合初始化/选择/准入；检索走retrieve_memory → rank_results（dedup/rerank/validate）→ finish；学习走extract（extract_experience/dedup_experience）→ validate_experience → persist → finish。validate_closed/select_skills/score_experience/build_result等是业务或追踪标签；summarize/sync走专属保存路径，不是learn的免验收替代。

保留的步骤标识：`validate_closed`、`select_skills`、`validate_search`、`retrieve_memory`、`dedup`、`score_experience`、`validate`、`build_result`、`fallback`。结构化 tool 步骤须按绑定工具执行；字符串步骤可为内部函数/追踪标签，不等于独立图节点。

### 本技能业务任务

search需至少一种设备/报警/故障/部件/query条件，recent仅limit；通过内部experience_module/long_memory/store读取，按四元组去重，再以query词命中数稳定降序取limit。

## 输出规范（Output Format）

使用 MemoryResult：action/success/items/experience/count/backend/validation_findings/stop_reason/error。经验里保留experience_id/device_id/fault/content/source_workorder/source_report、learning_idempotency_key、validation_status/experience_quality_score、memory_saved/rag_saved/duplicate等实际字段。success不代表两阶段均成功；必须分别核对memory_saved与rag_saved。

## 停止条件（Stop Conditions）

读流程按已取结果去重、排序及limit结束，无模型推理循环。学习须达到已有准入和质量门槛，重复已完成可结束，不同部分保存走稳定ID恢复。普通final的stop_reason=completed可能仍success=False，不把它等同新增保存成功。

## 参考文档（按需读取）

下列内容不进入默认上下文。需要时调用工具 `read_skill_reference`：`skill` 填 `experience_retrieval`，`reference` 填表内名称；读取后再引用具体条款，不要凭记忆补写。

| reference | 内容 | 何时读取 |
| --- | --- | --- |
| `reasoning` | 业务判断规则与工具使用规范 | 需要判断证据是否充分、选择工具、解释取舍或核对工具字段时读取。 |
| `evidence` | 证据、异常与安全边界 | 需要确认证据来源、处理缺失与冲突、或核对权限与安全边界时读取。 |
| `contract` | 输入契约与真实示例 | 需要构造请求、核对字段、验证返回结构或确认前置条件时读取。 |
| `source` | 参考实现索引 | 需要定位真实代码实现、测试或数据模型时读取。 |

## 独立运行

复制本目录后，可运行 `python scripts/run.py --check`，或使用 `python scripts/run.py --input task.json --model-url http://127.0.0.1:8040 --tool-script scripts/mcp_adapter.py` 执行业务任务。输入字段见 `references/contract.md`；真实工具连接与限制见 `references/standalone.md`。
