# Agent Runtime 精简实施计划

> **For agentic workers:** 按任务逐项实施；执行时必须使用 `superpowers:executing-plans`（本计划推荐的当前会话方式）或 `superpowers:subagent-driven-development`（用户选择分组代理时）。使用下方复选框记录实际进度，不把写完计划当作已实现。

**Goal:** 保持九个 Agent 和现有业务契约，精简重复节点、状态声明、工具实现与 Markdown Skill。

**Architecture:** 正式入口继续使用 RuntimeNode → RuntimeCoordinator。领域 Graph 共用轻量准备阶段和执行状态；工具与 Skill 通过规范定义及兼容名称消除重复，权限和副作用边界不合并。旧编排只在业务测试迁入正式 Runtime 后移除。

**Tech Stack:** Python、LangGraph、Pydantic、PyYAML、pytest；使用本机 `L:/anaconda/python.exe` 与根目录 `pytest-agent.ini`，不安装新依赖。

**Spec:** `docs/superpowers/specs/2026-10-03-agent-runtime-slimming-design.md`，用户已于 2026-10-03 确认。

## 全局约束

- 保留五服务架构与九个业务 Agent；不重做前端，不调整模型供应商，不修改生产配置，不操作业务数据库，不调用真实设备控制接口。
- Skill 继续使用 Markdown 与 YAML Front Matter，不改回独立 YAML 文件。
- 审批、失败回退、复检、幂等对账、故障恢复和安全门禁即使低频，也不能据此删除。
- 当前工作区包含上一轮维修团队和虚拟产线控制的未提交修改。本轮以这些修改后的文件为起点，不回退、不覆盖，也不把尚未完成的功能当作冗余。
- 不把 `status`、`route`、`stop_reason` 合为一个字段；已有响应字段与历史持久化记录不改写。
- 不删除失败测试，不降低门禁，不扩大跳过范围。测试不调用生产数据库、收费模型或真实设备。
- 源码、测试和文档新增注释使用中文；工具名、模型字段与兼容 API 名称保持原有标识符。

## 审查重点

1. 初始化请求无效或模型不可用：准备节点不得继续选 Skill 或进入模型推理。归属任务 1。
2. 两轮运行共享 Agent 实例：步骤列表和查询上下文不能互相污染。归属任务 1。
3. 客户端显式指定旧 Skill 名称：别名可解析且不重复激活，不扩大工具权限。归属任务 3。
4. 旧工具入口带设备、机型、编号或过滤条件：共用实现仍保留范围、参数优先级与返回投影。归属任务 4。
5. 旧编排测试与正式 Runtime 的结果标签不同：保留业务断言与安全要求，不为删除旧文件而降低标准。归属任务 5。

## 文件职责与备份约定

- 新增 `services/agent-service/app/agents/state.py`：公共执行状态类型，无业务状态枚举。
- 修改 `services/agent-service/app/agents/base.py`：准备子步骤组合与既有追踪包装，不新增调度系统。
- 修改九个 `agents/<名称>/graph.py`，以及 `agents/workorder/schemas.py`、`agents/quality/schemas.py`、`agents/memory/schemas.py`、`graph/state.py`：引用公共状态、合并准备节点，保留领域校验。
- 修改 `skills/registry.py` 和少量 Markdown：规范名称、别名、去重及文档对齐。
- 修改 `tools/registry.py` 和已有薄封装：单一工具定义来源及共用执行，不调整外部服务 API。
- 修改六组历史测试，将其断言迁入正式 Runtime；通过后移除 `graph/nodes.py` 的旧编排实现。
- 新增四份针对性测试：`test_graph_preparation.py`、`test_graph_slimming_contract.py`、`test_skill_aliases.py`、`test_tool_alias_contract.py`。交付报告为 `docs/agent-runtime-slimming-report.md`。

每项任务修改前，用 PowerShell `Copy-Item -LiteralPath` 将精确文件按相对路径保存到 `.runtime/backups/agent-runtime-slimming-20261003/`。先检查绝对目标位于仓库内；已存在的备份不覆盖。备份清单记录相对路径和 SHA-256，不复制 `.env`、密钥、数据库或构建产物。新增文件只登记，没有旧版备份。

每组完成后检查本组差异；可进行仅包含本组文件的本地提交。不得使用宽泛的 `git add .` 或提交上一轮未完成的内容；重叠文件含上一轮改动时，保留差异记录并留待最终审阅，不整文件提交。

所有测试命令在独立测试子进程中运行，执行前设置以下隔离环境；不输出继承的变量值，不改写根目录 `.env`，不影响已运行服务的环境：

```powershell
$env:PYTHON_DOTENV_DISABLED = '1'
$env:APP_ENV = 'testing'
$env:MYSQL_HOST = ''
$env:MYSQL_PASSWORD = ''
$env:DEEPSEEK_API_KEY = ''
$env:SILICONFLOW_API_KEY = ''
$env:MODEL_SERVICE_BASE_URL = ''
$env:BACKEND_SERVICE_BASE_URL = ''
$env:RAG_SERVICE_BASE_URL = ''
$env:CAD_SERVICE_BASE_URL = ''
$env:MCP_PLC_URL = ''
$env:MCP_CAD_URL = ''
$env:MCP_MES_URL = ''
$env:MCP_QMS_URL = ''
$env:MCP_INVENTORY_URL = ''
$env:BACKEND_INTERNAL_TOKEN = ''
$env:AGENT_API_TOKEN = ''
$env:FACTORY_API_BASE_URL = 'http://127.0.0.1:9'
$env:FACTORY_CONTROL_MODE = ''
```

跨服务测试仅通过各自测试适配器显式覆盖上述地址；生产配置不能成为默认回退。现有 conftest 继续将运行时存储定位到 tmp_path。

---

### 任务 1：公共执行状态与准备节点

**文件：** 新增 `app/agents/state.py`、`tests/test_graph_preparation.py`；修改 `app/agents/base.py`、九个领域 `graph.py`、上述三份 `schemas.py` 与 `app/graph/state.py`。路径均相对于 `services/agent-service/`。

**接口：**

- 新增 `AgentExecutionState(TypedDict, total=False)`：`active_agent: str`、`active_skills: list[str]`、`current_step: str`、`step_history/completed_steps/failed_steps: list[dict[str, Any]]`。十份状态继承它，领域字段留在原文件。
- 在 `agents/base.py` 新增 `prepare_skill_node(agent_name: str, initialize: Callable[[Mapping[str, Any]], Mapping[str, Any]], load_skill: Callable[[Mapping[str, Any]], Mapping[str, Any]], *, skill_steps: Mapping[str, str] | None = None) -> Callable[[Mapping[str, Any]], dict[str, Any]]`。
- 组合函数先通过 `trace_skill_node` 执行初始化；仅在其 `route == "load_skill"` 时把合并后的状态交给加载步骤。返回累积更新，不重复追加或清空已完成的步骤历史，也不原地改写输入中的可变列表。异常保留原传播规则。
- 领域图将两个注册节点换为 `prepare`，各图继续使用自己的解析函数。Diagnosis 使用 `initialize_diagnosis_state`、`load_diagnosis_skill`，按最终 route 进入 `reason/fallback`；Memory 按 `validate_search/validate_admission/retrieve_memory/fallback` 路由，不能吞掉无效 action。

- [ ] 备份本任务文件，运行当前隔离基线：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q`。记录实际结果；已有失败单独登记。
- [ ] 先写 `test_prepare_stops_on_initialization_fallback`、`test_prepare_keeps_order_and_two_step_records`、`test_prepare_does_not_share_history_between_runs`。断言加载调用次数分别为 0/1、初始化输出先传入加载步骤、原输入未被改写、两次运行 history 不共用列表。
- [ ] 写 `test_preparation_trace_has_task_and_trace_identity` 与 `test_prepare_failure_keeps_original_exception`：真实 TraceRecorder 的两个实际子步骤归属同一 task_id/trace_id；异常保留错误类型和失败事件，不虚构加载成功。
- [ ] 写参数化真实图测试，覆盖九个 Agent 的有效请求、无效请求和原有分支；检查编译图只有一个准备节点。Diagnosis 的不可用客户端不得产生聊天调用；Memory 的非法 action 不得检索或写入。
- [ ] 运行 `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_graph_preparation.py -q`，确认新接口/准备节点测试在修改前失败；已有行为的特征测试可先通过。
- [ ] 实现上述公共类型和组合函数，再逐图替换入口；保留原 initialize/load 函数作为真实子操作，不新增虚构日志节点。追踪中的已有输入输出、Skill、工具和上下文不得丢失。
- [ ] 运行准备测试与 `test_runtime_graph_control.py`、`test_runtime_skill_scope.py`、`test_agent_contract.py`、`test_shared_contracts.py`，再跑 Agent 全量。检查差异仅含本任务文件，登记可恢复路径。

### 任务 2：删除无业务意义的节点与空状态

**文件：** 修改 `app/agents/quality/graph.py`、`app/agents/maintenance/graph.py`、`app/graph/state.py`；新增 `tests/test_graph_slimming_contract.py`。

**接口：** Quality 保留 `validate_part → final`；`decision` 数据字段仍保存真实质检判定，只删除同名空跳转函数与图注册。Maintenance 保持当前正常链路与异常传播，不用假成功替代失败。`rework_via` 不进入公共契约。

- [ ] 备份精确文件，核对 `decision`、Maintenance fallback 和 `rework_via` 的函数调用、动态入口、测试及共享契约引用；只按设计中的证据删除。
- [ ] 写 `test_quality_graph_has_no_noop_decision_node`，调用真实 compiled graph，断言节点不含空 `decision`，且五项检测调用与结果保留。
- [ ] 写 `test_quality_missing_category_still_cannot_pass`，用测试外部数据适配器分别缺少外观、材料、功能和规格，调用实际 Quality Agent，断言结果不为合格；不 mock 验证器。
- [ ] 写 `test_maintenance_graph_has_no_unreachable_fallback_registration` 与 `test_maintenance_error_is_not_success`：编译图没有无入边注册，真实异常或证据不足仍不得产生 workorder_ready=True。
- [ ] 运行针对性测试确认节点测试先失败；删除 Quality 空节点，将边直连 final。Maintenance 去掉无入边注册；若函数没有任何调用则删除函数，否则登记保留的直接消费者。
- [ ] 完成契约核对后删除 `rework_via` 空声明；不要连带删除质检整改状态或 `decision` 判定数据。
- [ ] 运行 `test_graph_slimming_contract.py`、`test_part_quality_boundary.py`、`test_quality_data_gate.py`、`test_quality_identity_boundary.py`、`test_quality_backend_contract.py`，检查备份与本组差异。

### 任务 3：Markdown Skill 合并与兼容别名

**文件：** 修改 `app/skills/registry.py`、`app/agents/base.py`、`app/skills/cad/drawing_lookup.md`、`app/skills/router/intent_routing.md`；删除已备份的 `app/skills/cad/part_search.md`、`app/skills/router/entity_extraction.md`；新增 `tests/test_skill_aliases.py`。其余 Skill 只在真实节点对照发现声明不符时修改，并逐个备份。

**接口：**

- `SkillDefinition.aliases: tuple[str, ...] = ()`，从 Front Matter 的 `aliases` 读取。
- `SkillRegistry.get(agent: str, name: str) -> SkillDefinition | None` 同时接受主名与别名；`select` 显式名称去重，保持首次请求顺序。
- `validate_tools` 同时拒绝同一 Agent 内的主名/别名冲突，错误包含 Agent、名称和来源路径；不同 Agent 名称仍可相同。
- 主名保持 `drawing_lookup_skill` 和 `intent_routing_skill`；旧名 `part_search_skill`、`entity_extraction_skill` 分别作为别名。原工具集合不变，合并文档保留部件定位、实体提取说明。
- `trace_skill_node` 解析旧 active_skills 名称时记录规范 `skill` 与原始 `requested_skills`，历史输入不会丢失身份。

- [ ] 备份文件，写以下明确断言：

```python
assert registry.get("cad", "part_search_skill").name == "drawing_lookup_skill"
assert [s.name for s in registry.select("cad", names=["part_search_skill", "drawing_lookup_skill"])] == ["drawing_lookup_skill"]
assert registry.get("router", "entity_extraction_skill").name == "intent_routing_skill"
```

- [ ] 补 `test_alias_conflict_reports_both_source_paths`、`test_alias_cannot_expand_tool_scope`、`test_trace_records_canonical_and_requested_skill`，使用真实注册表、ToolRegistry.guard_call 与追踪包装。显式空权限清单依然拒绝调用。
- [ ] 运行 `L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_skill_aliases.py -q`，确认别名能力在修改前失败。
- [ ] 实现上述接口；合并两组 Markdown 后再删除两个已备份文档。对实际已执行节点和子操作整理 steps，不能仅为旧名字增加不执行的步骤。
- [ ] 保留 Quality 两份不同范围的定义，保留 Diagnosis 安全分诊、Memory 去重/验收和报告分支。其他文档没有等价证据就不合并。
- [ ] 运行新测试、`test_skill_registry.py`、`test_runtime_skill_scope.py`、`test_agent_contract.py` 和 Agent 全量，验证容器启动的 Skill 工具校验仍通过。

### 任务 4：工具定义收敛与薄封装共用

**文件：** 修改 `app/tools/registry.py`；修改 `app/tools/maintenance/query_inventory.py`、`query_stock.py`、`query_part_availability.py`；修改 `app/tools/knowledge/search_knowledge.py`、`search_alarm_knowledge.py`、`search_sop.py`、`search_manual.py`、`search_fault_cases.py`、`search_semantic_memory.py`；修改 `app/tools/cad/engineering_data.py`、`query_part_relation.py`、`query_assembly_relation.py`；新增 `tests/test_tool_alias_contract.py`。旧 Python 模块路径保留薄兼容导出。

**接口：**

- 在 registry 内新增不可变 `ToolDefinition`，字段为 `name: str`、`handler: Callable[..., dict[str, Any]]`、`description: str`、`server: str`、`operation: str`、`parameters: Mapping[str, Any]`、`exposed_to_model: bool`。
- `ToolRegistry._build_definitions(self) -> dict[str, ToolDefinition]` 成为处理器、schema 与外部操作映射的唯一来源；`execute` 和 `tool_schemas` 消费它。保留当前模型可见工具集合，不把内部验收失败操作新暴露给模型。
- 保留 `ToolRegistry.execute(name, arguments, *, context=None)` 与所有现有工具签名，先检查原请求名称的权限，再派发原外部 operation。未知名称依然拒绝。
- 库存 `query_stock` 作为 `query_inventory` 的兼容导出；可用性保留 `part_no or query` 优先级及原 available/parts/source 投影。不改变库存事实来源。
- 在 search_knowledge.py 新增 `search_filtered_knowledge(rag: Any, query: str, *, knowledge_type: str, limit: int = 5, filters: Mapping[str, Any] | None = None, alarm_code: str = "", remove_alarm_code: bool = False) -> dict[str, Any]`，供专用搜索薄封装调用；原 `search_knowledge` 无类型限制。
- 在 engineering_data.py 新增 `component_relations(lookup: str) -> list[dict[str, Any]]`，复用现有 match_components/relation_for。CAD 入口各自保留编号优先级、结果字段与来源标签；真实远程查询的 device_id/device_model/component_id/part_no 原样传递。

- [ ] 备份文件，先写现有行为特征测试：库存新旧名称返回一致、availability 编号优先；报警过滤和手册移除 alarm_code；案例与记忆知识类型不混用；CAD 远程范围参数与操作名称不变。
- [ ] 使用测试 RAG/MCP 外部边界记录参数与调用次数，实际调用 registry.execute/guard_call，不替换 Registry、权限检查或被测薄封装。断言允许的每次工具调用仅进行一次对应外部请求；拒绝路径调用次数为 0。
- [ ] 写 `test_registry_definitions_drive_handlers_and_schemas`、`test_alias_name_is_guarded_before_operation_resolution`、`test_tool_errors_keep_request_name_and_task_identity`。允许 query_inventory 不等于允许 query_stock；工具异常不得伪装成功或丢失原请求名。
- [ ] 跑 `test_tool_alias_contract.py`，确认特征测试基线通过、新元数据接口测试失败；再实施单一工具定义来源与三个领域的薄封装共用。
- [ ] schema 的必需参数、默认服务、CAD fallback 开关及 synthetic/degraded 标记保持原规则。不同副作用工具不合并、不新增自动重试。
- [ ] 跑工具测试、`test_cad_device_scope.py`、`test_runtime_skill_scope.py`、`test_runtime_policy_dispatch.py`、`test_runtime_idempotency_identity.py` 和 Agent 全量。核对旧入口仍存在、模型暴露集合未扩大。

### 任务 5：迁移历史测试、移除旧编排并交付

**文件：** 修改 `tests/test_business_gates.py`、`test_autonomous_evidence_loop.py`、`test_agent_loop_runtime.py`、`test_full_agent_runtime_e2e.py`、`test_p0_p1_lifecycle_smoke.py`、`test_orchestrator_trigger_flow.py`；新增测试辅助文件 `tests/runtime_slimming_adapter.py`；满足删除条件后移除 `app/graph/nodes.py`；按消费者核对决定是否移除 `app/graph/evidence.py` 兼容空入口；更新 `docs/agent-service-architecture-cleanup.md`，新增 `docs/agent-runtime-slimming-report.md`。

**接口：** 测试辅助文件提供 `build_test_orchestrator(tmp_path: Path, monkeypatch: pytest.MonkeyPatch, *, model_responses: list[dict[str, Any]], rag_results: list[dict[str, Any]]) -> AgentOrchestrator`，构造真实容器、Planner、Policy、Dispatcher、ExecutionManager 与九个 Agent；仅模型响应、RAG/CAD/设备/持久化外部边界使用测试适配器。查询次数等由外部适配器计数，不 mock Coordinator 或 Agent Graph。

- [ ] 备份六组测试及旧源码。先把原测试逐项列入迁移对照表，保留测试场景和最关键的业务断言，不通过删用例制造通过。
- [ ] 在正式 Runtime 上补并跑以下断言：0.42 低置信度且无证据时工单创建次数为 0；连续证据不足时维修/派工不推进；无维修必要不创建；可恢复的取证和方案重规划有界且成功只创建一次。
- [ ] 迁移两个完整生命周期测试：真实事件入口 → 工单等待维修 → 已授权人工反馈/设备恢复验收 → 关闭 → Memory/RAG → Report；沿用上一轮隔离产线测试适配器，不连接真实工厂。维修完成前学习与闭环报告次数为 0。
- [ ] 迁移触发报告与 Trace 隔离测试。旧路径专有 `diagnosis_review/evidence_loop` 标签改为断言正式 runtime_result、Action、真实调用次数和终止原因；安全要求与有界次数不得降低。
- [ ] 跑六组迁移测试及 `test_runtime_policy_e2e.py`、`test_runtime_approval_resume.py`、`test_experience_quality_gate.py`。若正式 Runtime 仍无法承载某项安全要求，保留旧实现并报告受阻场景，不通过扩大本轮业务范围强删。
- [ ] 六组全部完成迁移且仓库内没有入口引用时删除已备份的旧 OrchestratorNodes 实现。仍有外部导入兼容要求则仅保留薄导出，不恢复旧业务副本。证据策略兼容入口只有没有消费者时才删除；公共导出消费者不明则保留并说明。
- [ ] 移除旧编排后再次核对其专属状态，仅移除没有实际消费者或兼容读取需求的声明，不触及历史记录。
- [ ] 依次运行以下验证，记录实际通过/失败/跳过数：

```powershell
L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_graph_preparation.py services/agent-service/tests/test_graph_slimming_contract.py services/agent-service/tests/test_skill_aliases.py services/agent-service/tests/test_tool_alias_contract.py -q
L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q
L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_agent_contract.py services/agent-service/tests/test_shared_contracts.py services/agent-service/tests/test_quality_backend_contract.py tests/integration/test_runtime_rag_cad_contract.py -q
```

- [ ] 若改动实际涉及 Backend 或 CAD 契约，单独用对应 pytest 配置跑受影响测试；不在同一进程混入五个同名 app 包。本轮不修改前端，无需重新构建打包 assets。
- [ ] 对本轮文件执行语法检查及 `git diff --check`。新增文件同样核对空白问题；不以该命令替代业务测试。
- [ ] 写交付报告：实际文件、节点/重复实现/Skill 数量变化、兼容入口、原问题状态、测试命令与结果、未执行验证、备份清单和逐文件恢复方法。单独保留上一轮产线并发/超时未完成项；不能把本轮精简通过写成产线或生产验收通过。

## 自检与执行交接

- 设计中的节点、状态、Tool、Markdown Skill、旧编排、备份和交付均对应上述任务。
- 公共状态与准备函数由任务 1 定义，任务 2 使用；任务 3 别名接口先通过再清理文档；任务 4 的外部名称权限先于共用 operation；任务 5 使用前四项完成后的正式图。
- 五项审查重点分别有对应测试；新功能接口先复现失败，纯重构用修改前后特征测试证明。
- 不强制删除文件数量；发现仍有效的消费者时保留并报告，不改成空壳来假装完成。

推荐当前会话由主执行者逐组连续实施，最后做一次独立审查；这些任务共享基础状态、追踪、注册表和脏工作区，顺序实施便于保留已有修改。用户也可选择分组子代理实施与逐组独立审查。本文等待用户审阅并选择执行方式，尚未修改产品代码。
