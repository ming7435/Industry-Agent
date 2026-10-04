# Agent 工具与 Skill 精简实施计划

> **For agentic workers:** 使用 superpowers:executing-plans 在当前会话逐项实施；不分派实现者，完成后一次独立审查。

**Goal:** 减少重复工具候选与 Skill 文档，保留旧调用、权限、业务门禁和实际执行日志。

**Architecture:** ToolDefinition 标注兼容入口，共用参数模型生成 schema 并预检只读调用。SkillDefinition 支持多触发条件与旧名别名，仅合并权限相同的实际阶段。

**Tech Stack:** Python、Pydantic 2、LangGraph、pytest、Markdown/YAML、PowerShell。

**Spec:** docs/superpowers/specs/2026-10-03-agent-tools-skills-design.md

## Global Constraints

- 只改本地 Agent 工具、Skill 及测试/文档；不修改配置、数据库、前端和 Graph 拓扑。
- 原入口授权先行；不自动把 alias 替换为推荐名，不合并副作用操作。
- 修改前备份；保留用户已有修改。不提交、部署、调用真实设备或收费模型。
- 测试使用临时 SQLite、隔离环境和外部传输替身。

## Review Focus

- 旧名称白名单不得获得推荐名或内部工具的额外权限：Task 1 测试。
- 无效类型与空问题必须在外部请求之前失败，不能重试：Task 1 测试。
- CAD 参数模型必须保持设备、机型、编号与 request_id：Task 1 测试。
- 旧 Skill 名与多个触发条件只激活一个定义，未知名称不能降级到默认：Task 2 测试。
- 搜索、学习、闭环报告条件不得混入彼此工具；真实日志必须映射到实际阶段：Task 2 测试及生命周期回归。

### Task 1: 工具候选和只读契约

**Files:** app/tools/registry.py、新增 app/tools/query_contracts.py、app/agents/diagnosis/tool_policy.py（均在 services/agent-service 下）；新增 tests/test_tool_optimization.py；更新 tests/test_tool_alias_contract.py 的模型候选契约。

**Interfaces:** ToolDefinition 增加 compatibility_for；tool_schemas(allowed_tools=None) 按原名显式筛选。query_contracts 提供名称到 Pydantic 模型的映射，Guard 不执行外部调用。

- [x] 备份源文件并运行隔离 Agent 基线。
- [x] 测试默认不暴露七个重复项，显式旧名仍可调用且拒绝越权；内部工具不可暴露。
- [x] 测试空问题、错误类型、缺失文档编号在请求前拒绝；CAD 完整条件不变，查询不重复。
- [x] 运行新增测试观察预期失败。
- [x] 实施元数据与共用契约，诊断错误码保持 INVALID_ARGUMENT。
- [x] 针对性测试与 Agent 全量通过后再进入 Task 2。

### Task 2: Skill 合并与真实步骤

**Files:** app/skills/registry.py；CAD drawing_lookup.md/bom_analysis.md；Memory experience_extraction.md/memory_write.md/experience_retrieval.md；Report closure_report.md/trace_report.md；tests/test_skill_aliases.py、test_skill_registry.py；新增 tests/test_skill_optimization.py。

**Interfaces:** SkillDefinition.triggers 与 matches(context,text)、is_default/is_always；get/select 返回旧名的规范定义，不扩大 merge_tools 的范围。

- [x] 新增多触发、旧名去重、未知显式名称不回退、权限隔离、真实 trace 映射测试并观察失败。
- [x] 增加多触发兼容并合并三份文档，使用真实 Graph 绑定的步骤；重复文件从备份可恢复。
- [x] 运行针对性、全量 Agent、相关 Backend、跨服务契约测试。
- [x] 一次独立审查，重要发现测试先行修复，不做第二次审查。
- [x] 更新 docs/agent-tools-skills-optimization-report.md，记录数量、命令、限制、恢复方法。
