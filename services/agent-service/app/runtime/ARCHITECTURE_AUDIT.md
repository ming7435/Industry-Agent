# Agent Service 架构审查与重构记录

## Runtime 收敛后的控制路径（当前实现）

```text
Goal/Event
  → JEVParser
  → Planner（只生成 Action）
  → CapabilityRegistry（按 required_capability 选 Agent）
  → LoopEngine（统一边界、超时、重复动作和停止条件）
  → ActionModel
  → RuntimePolicy（allow / require_approval / deny）
  → ExecutionManager
  → Agent / Tool / MCP
  → Evidence
  → RuntimeEvaluator（continue / replan / final / blocked）
  → Planner 重规划或最终状态
  → Memory Learning（由 learning Action 进入）
```

顶层 LangGraph 只注册 `runtime` 节点，负责 State 生命周期和 Runtime 入口；旧业务节点方法保留给直接调用方和兼容测试，但不再构成顶层业务边。`QualityAgent` 是生产零件质量检测的唯一质量 Agent，能力为 `quality_inspection / quality_review`。

Runtime 的一次任务可以通过 `task_id + trace_id` 还原 Planner、Capability、Action、Execution、Evidence、Evaluation 和 Loop 停止原因。Runtime-managed 的 Diagnosis/Maintenance 请求不会再通过注入的 Knowledge/CAD provider 发起隐式 A2A；同查询的有效知识证据由 Dispatcher 复用。

### 第一阶段边界（已完成）

第一阶段的“自治”是 Runtime 驱动且有界的自治：Agent 可以通过统一的
`AgentResult.next_actions` 提出后续能力需求，但不能直接调用另一个 Agent。Runtime
会将显式 `required_capability` 送回 Planner，重新生成 Action，再由
CapabilityRegistry 选择执行者。Evaluator 的 `replan` 同样经过这条路径，并受限于
有界重规划次数、执行超时、幂等键和 LoopEngine 停止条件。

第一阶段不包括 Safety / Policy Control；它只保证动作调度、证据闭环、重规划和执行
边界可追踪、可停止。第二阶段在其上增加如下执行前策略控制。

### 第二阶段 Safety / Policy Control（当前实现）

RuntimeDispatcher 在 ExecutionManager 之前调用 `RuntimePolicy`。副作用 Action 必须
带幂等键；`workorder_create` 必须具备诊断、知识、CAD 和可执行维修计划证据；高风险
或显式要求审批的变更动作必须在 Runtime state/context 中出现对应的
`approved_capabilities`。策略结果写入 `policy_decision` Trace；`deny` 终止为
`blocked`，`require_approval` 终止为 `waiting_approval`，两者都不会触发 Agent、Tool
或 MCP 执行。Memory 的经验内容准入仍由既有 Memory Validator / Evaluator 负责，避免
Policy 重复实现业务规则。

`waiting_approval` 会由 `PendingTaskStore` 持久化完整 State、Plan、Action、策略结果
和 `runtime_next_index`。Approval API 提供 pending 查询、approve 和 reject；approve
通过 `RuntimeCoordinator.resume_pending()` 从原 Action/index 恢复，不重新调用 Planner；
reject 形成 `rejected → blocked` 的终态，并写入 `approval_requested/approved/rejected/
resumed` Trace。

审查范围：`services/agent-service/app/`，以重构前 `3aed0ae` 提交的 176 个 Python 文件为依据；不以 README 作为架构依据。

## 重构前调用关系

```text
api/entrypoints.py、api/server.py、监控入口
  → graph/workflow.py: AgentOrchestrator
  → graph/nodes.py: OrchestratorNodes
  → A2AClient → Endpoint → AgentHarness
  → 9 个 Agent 的内部 LangGraph
  → ToolRegistry → tools/* → MCP/RAG/业务服务
```

`graph/nodes.py` 重构前同时承担 Graph Node、Agent 创建、Runtime/Harness/Trace 管理、A2A 请求与响应适配、业务服务创建和 API 直接操作。API 路由本身位于 `api/server.py`，但它直接访问节点对象的私有能力。

## 两个入口与 State

`run_user()` 提供 `entry=user`、`user_text/context`；`run_abnormal_event()` 提供 `entry=trigger`、`event`。两者共用 `_execute_graph()`，生成 `task_id/trace_id/errors`，调用同一个 LangGraph，并返回 Trace。

历史 Graph 节点仍保留以兼容直接调用方；当前顶层 Graph 只建立
`START → runtime → END`。因此下述旧节点关系仅描述兼容层，不再决定 Runtime 业务顺序。
Runtime 的实际顺序由 Planner 生成的 Actions、CapabilityRegistry 和 LoopEngine
动态决定；零件质检仍只使用现有 `QualityAgent` 的
`quality_inspection / quality_review` 能力。

`AgentState` 核心字段：`task_id, trace_id, entry, user_text, context, event, route, route_result, diagnosis, knowledge, cad, maintenance_plan, workorder, workorder_result, quality, rework_via, report, experience, memory, memory_result, repair_feedback, repair_verification, status, pending_workorder_id, errors, trace`。重构未修改字段定义。

## 9 个 Agent

| Agent | 输入 → 输出；Schema | Prompt、Tool 与 A2A | 内部 Graph / State 重点 |
|---|---|---|---|
| router | 文本/上下文 → `RouteResult`；`RouterGraphState` | 规则分类、Skill；无独立 Prompt 和直接 A2A | 意图→实体→目标校验→final/fallback；读 task/text/context，写 intent/entities/result |
| diagnosis | 异常事件 → `DiagnosisResult`；`DiagnosisState/DiagnosisGraphState` | 独立 `prompt.py`、LLM、Tool Guard；注入 Knowledge provider | Reason↔Act/Observe→Validate；读 event/messages，写 observations/evidence/final_result |
| knowledge | 查询/过滤 → `KnowledgeResult`；`KnowledgeQuery/GraphState` | RAG Tool Registry、Skill；无直接 A2A | 检索/观察/改写/重排/校验；读 request，写 documents/evidence/result |
| cad | 设备/部件/图纸查询 → `CADResult`；`CADQuery/GraphState` | CAD/BOM 工具、Skill；无直接 A2A | 工程查询循环→关系校验；写组件、图纸、BOM、结果 |
| maintenance | 诊断/知识/CAD/Memory → `MaintenancePlan`；`MaintenanceQuery/GraphState` | 注入 Knowledge/CAD provider，库存工具；无独立 Prompt | 知识/CAD→备件/安全→计划/工单草稿；写 plan_payload/result |
| workorder | 动作/计划 → `WorkOrderResult`；`WorkOrderQuery/GraphState` | WorkOrderService、派工工具；关闭后学习由入口编排 | 创建或动作→派工→校验；写 workorder/candidates/result |
| quality | 零件/检验数据 → `QualityResult`；`QualityQuery/WorkflowState` | QMS 五类质检工具；无直接 A2A | 零件/计划→尺寸/外观/材料/功能/工艺→决策 |
| report | 各阶段结果 → `ReportResult`；`ReportQuery/WorkflowState` | 报告工具；触发入口后由编排请求 Memory | 来源/完整性→报告组合/持久化；写 sections/report/result |
| memory | search/recent/learn → `MemoryResult`；`MemoryQuery/GraphState` | ExperienceLearningModule、Memory Store、RAG | 检索/去重/重排或经验准入/提取/写入；写 items/experience/result |

除 Diagnosis 的 `prompt.py` 外，Agent 主要由代码规则、Skill Registry 和内部 Graph 组织决策。Agent 间调用经 A2A 适配或注入的 provider，不意味着每个 Agent 都直接持有 `A2AClient`。

## 逐文件职责表（重构前）

下表每行列出文件、源码模块说明与导入依赖。工具包装器的客户端由调用方注入；`__init__.py` 多为同目录导出。

| 文件 | 职责 | 主要依赖 |
|---|---|---|
| `__init__.py` | 智能体服务应用包。 | 标准库/调用方 |
| `a2a/__init__.py` | Agent-to-Agent 通信契约和本地传输适配。 | .client, .registry, .models |
| `a2a/client.py` | 单进程 A2A 传输层。 | pydantic, .models, .registry |
| `a2a/models.py` | Agent 间调用的结构化请求和响应。 | pydantic |
| `a2a/registry.py` | A2A 核心 Agent 注册表和合法协作矩阵。 | 标准库/调用方 |
| `agents/__init__.py` | 面向工业设备的各类智能体。 | .cad, .diagnosis, .knowledge, .maintenance, .memory, .quality, .report, .router, .workorder |
| `agents/cad/__init__.py` | CAD Agent。 | .agent, .schemas, .validator |
| `agents/cad/agent.py` | CAD/BOM 工程数据分析 Agent。 | app.tools.registry, app.contracts, .graph, .schemas |
| `agents/cad/graph.py` | CAD Agent 的 LangGraph 工程查询流程。 | langgraph.graph, app.skills, app.contracts, .schemas, .validator |
| `agents/cad/schemas.py` | CAD Agent 的内部请求契约。 | pydantic |
| `agents/cad/validator.py` | CAD Agent 工程证据校验。 | app.contracts |
| `agents/diagnosis/__init__.py` | Diagnosis Agent 入口。 | .agent, .dedup, .graph, .schemas |
| `agents/diagnosis/agent.py` | Diagnosis Agent 的诊断编排逻辑。 | ., .dedup, .graph, .schemas, app.common, app.llm, app.tools.registry |
| `agents/diagnosis/dedup.py` | Diagnosis Agent 运行去重和幂等缓存。 | 标准库/调用方 |
| `agents/diagnosis/evidence.py` | Diagnosis Agent 的 Observation 与证据整理。 | .schemas |
| `agents/diagnosis/graph.py` | Diagnosis Agent 的 LangGraph Reason-Act-Observe-Validate 工作流。 | langgraph.graph, app.agents.diagnosis, app.skills |
| `agents/diagnosis/parsing.py` | Diagnosis Agent 的通用解析与格式化工具。 | 标准库/调用方 |
| `agents/diagnosis/prompt.py` | Diagnosis Agent 的提示词构建。 | 标准库/调用方 |
| `agents/diagnosis/schemas.py` | Diagnosis Agent 的状态与结果契约。 | 标准库/调用方 |
| `agents/diagnosis/tool_policy.py` | Diagnosis Agent 的 Skill 选择和工具访问策略。 | .schemas |
| `agents/diagnosis/validator.py` | Diagnosis Agent 诊断候选结果校验。 | ., .schemas |
| `agents/knowledge/__init__.py` | Knowledge Agent。 | .agent |
| `agents/knowledge/agent.py` | 工业知识检索 Agent，负责生成可追踪 Evidence Pack。 | app.tools.registry, app.contracts, .graph, .confidence |
| `agents/knowledge/confidence.py` | Evidence-quality confidence scoring for Knowledge Agent. | 标准库/调用方 |
| `agents/knowledge/graph.py` | Knowledge Agent 的 LangGraph 检索、融合和证据校验流程。 | langgraph.graph, app.skills, app.contracts, .schemas, .validator |
| `agents/knowledge/schemas.py` | Knowledge Agent 的内部请求契约。 | pydantic |
| `agents/knowledge/validator.py` | Knowledge Evidence Pack 校验。 | 标准库/调用方 |
| `agents/maintenance/__init__.py` | Maintenance Agent。 | .agent |
| `agents/maintenance/agent.py` | 维修方案 Agent。 | app.tools.registry, app.contracts, .graph, .validator |
| `agents/maintenance/graph.py` | Maintenance Agent 的 LangGraph 维修计划流程。 | langgraph.graph, app.skills, app.contracts, .schemas, .validator |
| `agents/maintenance/schemas.py` | Maintenance Agent 的内部请求契约。 | pydantic |
| `agents/maintenance/validator.py` | Maintenance Agent 输出校验。 | 标准库/调用方 |
| `agents/memory/__init__.py` | Memory Agent。 | .agent, .schemas |
| `agents/memory/agent.py` | Memory Agent：只管理已验证维修经验的检索与沉淀。 | app.memory, app.rag, app.tools.registry, .graph, .schemas |
| `agents/memory/graph.py` | Memory Agent LangGraph：区分经验检索和经验学习两条路径。 | langgraph.graph, app.skills, .schemas, .validator |
| `agents/memory/schemas.py` | Memory Agent 的检索和经验学习契约。 | pydantic |
| `agents/memory/validator.py` | Memory Agent 的经验准入规则。 | app.memory.validator |
| `agents/quality/__init__.py` | Quality Agent。 | .agent, .schemas |
| `agents/quality/agent.py` | 生产零件质量检测 Agent。 | app.tools.registry, app.contracts, .graph |
| `agents/quality/graph.py` | Quality Agent 的生产零件质检 LangGraph。 | langgraph.graph, app.skills, app.contracts, .schemas, .validator |
| `agents/quality/schemas.py` | Quality Agent 的生产零件质检输入和图状态契约。 | pydantic |
| `agents/quality/validator.py` | 生产零件质量检测的确定性校验规则。 | 标准库/调用方 |
| `agents/registry.py` | 最终 Agent Registry：注册九个核心 Agent。 | .cad, .diagnosis, .knowledge, .maintenance, .memory, .quality, .report, .router, .workorder |
| `agents/report/__init__.py` | Report Agent。 | .agent, .schemas |
| `agents/report/agent.py` | 运维案例报告 Agent。 | app.tools.registry, app.contracts, .graph, .validator |
| `agents/report/graph.py` | Report Agent 的报告汇总 LangGraph。 | langgraph.graph, app.skills, app.contracts, .schemas |
| `agents/report/schemas.py` | Report Agent 的输入和状态契约。 | pydantic |
| `agents/report/validator.py` | Report Agent 的事实一致性和完整性校验。 | 标准库/调用方 |
| `agents/router/__init__.py` | Router Agent。 | .agent, .graph |
| `agents/router/agent.py` | 用户意图识别和目标 Agent 选择。 | app.contracts, .graph |
| `agents/router/graph.py` | Router Agent 的 LangGraph 意图识别与路由编排。 | langgraph.graph, app.skills, app.contracts, .validator |
| `agents/router/validator.py` | Router Agent 的目标与必要实体校验。 | 标准库/调用方 |
| `agents/workorder/__init__.py` | WorkOrder Agent。 | .agent, .schemas |
| `agents/workorder/agent.py` | WorkOrder Agent：只负责编排工单生命周期，不诊断、不制定维修方案、不做质检。 | app.tools.registry, app.workorder, .graph, .schemas, .validator |
| `agents/workorder/graph.py` | WorkOrder Agent LangGraph 编排。 | langgraph.graph, app.skills, .schemas, .validator |
| `agents/workorder/schemas.py` | WorkOrder Agent 的输入、内部状态和输出契约。 | pydantic |
| `agents/workorder/validator.py` | WorkOrder Agent 的确定性校验和派工规则。 | app.workorder.validator |
| `api/__init__.py` | Agent Service 对外入口。 | .entrypoints |
| `api/entrypoints.py` | 两个业务入口：自动异常和用户主动提问。 | app.graph |
| `api/server.py` | Agent Service 的 FastAPI 入口。 | fastapi, fastapi.middleware.cors, pydantic, app.graph |
| `closure/__init__.py` | 工单质检闭环服务。 | .service, .store |
| `closure/service.py` | 质检、整改和审计的闭环服务。 | .store |
| `closure/store.py` | 质检闭环持久化适配器。 | 标准库/调用方 |
| `common/__init__.py` | 跨领域通用解析器和基础类型。 | .alarm |
| `common/alarm.py` | 统一处理工厂原始报警文本。 | 标准库/调用方 |
| `contracts.py` | 多 Agent 共享的 Pydantic 契约。 | pydantic |
| `graph/__init__.py` | 跨 Agent LangGraph 编排入口。 | .workflow |
| `graph/nodes.py` | 多 Agent 编排节点。 | app.a2a, app.agents.diagnosis, app.agents.registry, app.memory, app.graph.state, app.harness, app.tools.registry, app.workorder, app.workorder.validator, app.closure |
| `graph/state.py` | 多 Agent 编排共享状态。 | 标准库/调用方 |
| `graph/workflow.py` | 用户入口和自动异常入口共用的 LangGraph Orchestrator。 | langgraph.graph, app.agents.diagnosis, app.graph.nodes, app.graph.state, app.tools.registry |
| `harness/__init__.py` | Agent Runtime Harness 入口。 | .runtime, .trace |
| `harness/runtime.py` | Agent Runtime 的生命周期、超时和重试边界。 | .trace |
| `harness/trace.py` | 轻量级 Trace 记录器，后续可替换为 OpenTelemetry。 | 标准库/调用方 |
| `llm/__init__.py` | 平台级共享 LLM 客户端。 | .deepseek, .provider |
| `llm/deepseek.py` | DeepSeek OpenAI Compatible API 客户端。 | 标准库/调用方 |
| `llm/provider.py` | 平台级默认 LLM Provider。 | .deepseek |
| `mcp/__init__.py` | MCP 客户端入口。 | .client |
| `mcp/client.py` | 外部系统 MCP 客户端适配层。 | 标准库/调用方 |
| `mcp/quality.py` | QMS 生产零件质检的本地适配器。 | 标准库/调用方 |
| `mcp/workorder.py` | MES 工单 MCP 适配器。 | 标准库/调用方 |
| `memory/__init__.py` | 短期、长期记忆和经验沉淀接口。 | .dedup, .extractor, .service, .store, .validator, .writer |
| `memory/dedup.py` | 经验记录去重。 | 标准库/调用方 |
| `memory/extractor.py` | 从工单和质检结果生成可检索经验。 | app.common |
| `memory/service.py` | 经验学习模块，不是 Agent。 | .store, app.rag, app.contracts, app.harness, .extractor, .validator, .writer |
| `memory/store.py` | 短期/长期 Memory 抽象，支持本地回退和 Redis/MySQL 后端。 | redis |
| `memory/validator.py` | 经验学习准入校验。 | app.workorder |
| `memory/writer.py` | 经验写入短期记忆、长期记忆和 RAG。 | app.rag, .dedup |
| `monitor/__init__.py` | 连续设备监测与诊断触发生成模块。 | .models, .monitor, .rules, .runner, .factory_api |
| `monitor/factory_api.py` | 设备实时数据接口的 HTTP 适配器。 | app.common, .models, .presentation |
| `monitor/models.py` | 设备监测器使用的数据契约。 | 标准库/调用方 |
| `monitor/monitor.py` | 连续设备监测器与诊断触发状态机。 | .models, .rules |
| `monitor/presentation.py` | 面向维修人员的设备状态展示文本。 | 标准库/调用方 |
| `monitor/rules.py` | 首个监控演示使用的阈值配置。 | .models |
| `monitor/runner.py` | 连续设备监测的后台运行器。 | .models, .monitor |
| `rag/__init__.py` | 维修手册 RAG 的本地索引与 JSONL 入库能力。 | .index, .client |
| `rag/client.py` | RAG Service 客户端边界。 | .index |
| `rag/index.py` | 面向维修手册 JSONL 的轻量本地 RAG 索引。 | 标准库/调用方 |
| `skills/__init__.py` | 多 Skill 管理能力。 | .registry |
| `skills/registry.py` | Agent Skill Registry。 | yaml |
| `tools/__init__.py` | 智能体可调用的领域工具。 | .registry |
| `tools/cad/__init__.py` | CAD/BOM 工程数据工具。 | .fetch_engineering_record, .get_component_location, .get_drawing_metadata, .query_assembly_relation, .query_bom, .query_cad, .query_drawing, .query_part, .query_part_relation, .query_relation |
| `tools/cad/engineering_data.py` | CAD 工具共享的本地工程演示数据。 | 标准库/调用方 |
| `tools/cad/fetch_engineering_record.py` | CAD MCP：获取完整工程记录。 | .get_component_location, .query_assembly_relation, .query_bom, .query_cad |
| `tools/cad/get_component_location.py` | CAD MCP：查询部件安装位置。 | .engineering_data |
| `tools/cad/get_drawing_metadata.py` | CAD MCP：查询图纸元数据。 | .engineering_data |
| `tools/cad/query_assembly_relation.py` | CAD MCP：查询装配关系。 | .engineering_data |
| `tools/cad/query_bom.py` | CAD MCP：查询 BOM。 | .engineering_data |
| `tools/cad/query_cad.py` | CAD MCP：查询 CAD 部件与图纸。 | .engineering_data |
| `tools/cad/query_drawing.py` | CAD MCP：图纸查询兼容入口。 | .get_drawing_metadata |
| `tools/cad/query_part.py` | CAD MCP：查询工程零件。 | .engineering_data |
| `tools/cad/query_part_relation.py` | CAD MCP：查询零件关系。 | .engineering_data |
| `tools/cad/query_relation.py` | CAD MCP：关系查询兼容入口。 | .get_component_location, .query_assembly_relation |
| `tools/diagnosis/__init__.py` | Diagnosis Agent 的领域工具。 | .get_alarm_definition, .get_device_history, .get_device_logs, .get_device_status, .get_active_alarms, .get_production_status |
| `tools/diagnosis/get_active_alarms.py` | 查询设备当前活动报警。 | .get_device_status |
| `tools/diagnosis/get_alarm_definition.py` | Diagnosis Agent 的本地 MCP 兼容工具。 | app.common |
| `tools/diagnosis/get_device_history.py` | 设备历史趋势查询工具。 | 标准库/调用方 |
| `tools/diagnosis/get_device_logs.py` | 设备日志查询工具。 | 标准库/调用方 |
| `tools/diagnosis/get_device_status.py` | 设备当前状态查询工具。 | app.common, app.monitor.presentation |
| `tools/diagnosis/get_production_status.py` | MES MCP：查询生产状态。 | app.monitor.presentation |
| `tools/knowledge/__init__.py` | Knowledge Agent 的领域工具，每个工具独立一个 Python 文件。 | .fetch_chunk, .fetch_document, .document_parser, .ingest_knowledge, .rag_status, .search_alarm_knowledge, .search_fault_cases, .search_knowledge, .search_manual, .search_semantic_memory, .search_sop |
| `tools/knowledge/document_parser.py` | Knowledge MCP：解析维修手册、SOP 或工程文档。 | 标准库/调用方 |
| `tools/knowledge/fetch_chunk.py` | Knowledge MCP：文档片段获取工具。 | 标准库/调用方 |
| `tools/knowledge/fetch_document.py` | Knowledge MCP：全文档获取工具。 | 标准库/调用方 |
| `tools/knowledge/ingest_knowledge.py` | Knowledge MCP：将知识文档入库。 | 标准库/调用方 |
| `tools/knowledge/rag_status.py` | Knowledge MCP：查询 RAG 状态。 | 标准库/调用方 |
| `tools/knowledge/search_alarm_knowledge.py` | Knowledge MCP：报警知识检索工具。 | .search_knowledge |
| `tools/knowledge/search_fault_cases.py` | Knowledge MCP：历史故障案例检索工具。 | .search_knowledge |
| `tools/knowledge/search_knowledge.py` | Knowledge MCP：统一知识检索工具。 | 标准库/调用方 |
| `tools/knowledge/search_manual.py` | Knowledge MCP：维修手册检索工具。 | .search_knowledge |
| `tools/knowledge/search_semantic_memory.py` | Knowledge MCP：语义记忆检索工具。 | .search_knowledge |
| `tools/knowledge/search_sop.py` | Knowledge MCP：SOP 检索工具。 | .search_knowledge |
| `tools/maintenance/__init__.py` | Maintenance Agent 相关工具。 | .assign_workorder, .close_workorder, .create_workorder, .generate_repair_plan, .get_workorder, .get_workorder_template, .list_workorders, .mark_repair_completed, .query_inventory, .query_part_availability, .query_spare_part, .query_stock, .query_workorder, .query_shift, .query_team_availability, .query_technician_skills, .query_technician_workload, .query_technicians, .reopen_workorder, .submit_repair_feedback, .submit_workorder_draft, .update_workorder |
| `tools/maintenance/assign_workorder.py` | WorkOrder MCP：派工。 | 标准库/调用方 |
| `tools/maintenance/close_workorder.py` | WorkOrder MCP：关闭维修工单。 | 标准库/调用方 |
| `tools/maintenance/create_workorder.py` | WorkOrder MCP：创建维修工单。 | 标准库/调用方 |
| `tools/maintenance/generate_repair_plan.py` | MES MCP：生成维修计划草案。 | 标准库/调用方 |
| `tools/maintenance/get_workorder.py` | WorkOrder MCP：获取单个维修工单。 | 标准库/调用方 |
| `tools/maintenance/get_workorder_template.py` | WorkOrder MCP：获取工单草案模板。 | 标准库/调用方 |
| `tools/maintenance/list_workorders.py` | WorkOrder MCP：查询工单列表。 | 标准库/调用方 |
| `tools/maintenance/mark_repair_completed.py` | WorkOrder MCP：标记维修完成。 | 标准库/调用方 |
| `tools/maintenance/query_inventory.py` | Inventory MCP：查询库存。 | .query_spare_part |
| `tools/maintenance/query_part_availability.py` | Inventory MCP：查询备件可用性。 | .query_spare_part |
| `tools/maintenance/query_shift.py` | 查询当前班次。 | 标准库/调用方 |
| `tools/maintenance/query_spare_part.py` | Inventory MCP：查询备件库存。 | 标准库/调用方 |
| `tools/maintenance/query_stock.py` | Inventory MCP：查询库存余量。 | .query_inventory |
| `tools/maintenance/query_team_availability.py` | 查询维修班组可用性。 | 标准库/调用方 |
| `tools/maintenance/query_technician_skills.py` | 查询维修人员技能。 | 标准库/调用方 |
| `tools/maintenance/query_technician_workload.py` | 查询维修人员工作负载。 | 标准库/调用方 |
| `tools/maintenance/query_technicians.py` | 查询可派工维修人员。 | 标准库/调用方 |
| `tools/maintenance/query_workorder.py` | WorkOrder MCP：查询维修工单。 | .get_workorder |
| `tools/maintenance/reopen_workorder.py` | WorkOrder MCP：重新打开维修工单。 | 标准库/调用方 |
| `tools/maintenance/submit_repair_feedback.py` | WorkOrder MCP：提交维修反馈。 | 标准库/调用方 |
| `tools/maintenance/submit_workorder_draft.py` | WorkOrder MCP：提交工单草案。 | 标准库/调用方 |
| `tools/maintenance/update_workorder.py` | WorkOrder MCP：更新维修工单。 | 标准库/调用方 |
| `tools/quality/__init__.py` | Quality Agent 的生产零件质检工具。 | .get_part_specification, .get_production_part, .inspect_part_appearance, .inspect_part_dimensions, .inspect_part_function, .inspect_part_material, .inspect_part_process |
| `tools/quality/get_part_specification.py` | 获取零件质量规格和检验标准。 | 标准库/调用方 |
| `tools/quality/get_production_part.py` | 获取已生产零件及其生产追溯信息。 | 标准库/调用方 |
| `tools/quality/inspect_part_appearance.py` | 执行零件外观检测。 | 标准库/调用方 |
| `tools/quality/inspect_part_dimensions.py` | 执行零件尺寸检测。 | 标准库/调用方 |
| `tools/quality/inspect_part_function.py` | 执行零件功能检测。 | 标准库/调用方 |
| `tools/quality/inspect_part_material.py` | 执行零件材质检测。 | 标准库/调用方 |
| `tools/quality/inspect_part_process.py` | 执行零件生产过程合规检测。 | 标准库/调用方 |
| `tools/registry.py` | 全局 Tool Registry，所有 Agent 通过此层访问外部能力。 | app.mcp.client, app.mcp.quality, app.mcp.workorder, app.rag, app.tools.cad, app.tools.diagnosis, app.tools.maintenance, app.tools.knowledge, app.tools.quality, app.tools.report, app.tools.router, app.harness |
| `tools/report/__init__.py` | Report Agent 相关工具。 | .get_diagnosis_record, .get_maintenance_record, .get_quality_record, .get_trace_summary, .generate_report, .generate_report_file, .persist_report |
| `tools/report/generate_report.py` | Report MCP：生成结构化运维报告。 | 标准库/调用方 |
| `tools/report/generate_report_file.py` | Report MCP：将结构化报告导出为 JSON 文件。 | 标准库/调用方 |
| `tools/report/get_diagnosis_record.py` | Report MCP：读取已有诊断记录，不重新执行诊断。 | 标准库/调用方 |
| `tools/report/get_maintenance_record.py` | Report MCP：读取已有维修计划记录。 | 标准库/调用方 |
| `tools/report/get_quality_record.py` | Report MCP：读取已有质检记录。 | 标准库/调用方 |
| `tools/report/get_trace_summary.py` | Report MCP：把已有 Trace 压缩成报告可引用的摘要。 | 标准库/调用方 |
| `tools/report/persist_report.py` | Report MCP：持久化结构化报告。 | 标准库/调用方 |
| `tools/router/__init__.py` | Router Agent 的工具。 | .intent_classifier_tool |
| `tools/router/intent_classifier_tool.py` | Router MCP：本地意图分类工具。 | 标准库/调用方 |
| `workorder/__init__.py` | WorkOrder System 业务服务，不作为核心 Agent。 | .service, .validator |
| `workorder/service.py` | 工单业务服务，不属于 Agent。 | app.tools.registry, app.contracts, .validator |
| `workorder/validator.py` | 工单业务输入和状态校验。 | 标准库/调用方 |

## 修改计划与落点

| 原位置 | 新位置/修改 | 原因 | 影响 |
|---|---|---|---|
| `graph/nodes.py` 依赖装配 | `runtime/container.py` | Agent 生命周期和依赖注入归 Runtime | 保持 9 Agent 构造参数及共享资源 |
| `graph/nodes.py` 节点 Trace | `runtime/tracing.py` | 节点不管理 Trace 生命周期 | 保持 node_started/node_completed 事件 |
| `graph/nodes.py` A2A Endpoint | `a2a/endpoints.py` | 响应适配归通信层 | 保持请求、响应协议 |
| `graph/nodes.py` A2A Request/provider | `a2a/requests.py` | 请求模型和路由适配归通信层 | 保持合法协作矩阵 |
| `graph/nodes.py` API 工单/Memory/质检操作 | `runtime/operations.py` | API 不依赖 Graph Node 私有方法；质检落库属于业务操作 | 保持 API 路径、结果和学习条件 |
| `graph/nodes.py` 序列化辅助 | `common/serialization.py` | Graph 与 A2A 共用，避免循环导入 | 输出字典规则不变 |
| `graph/nodes.py` 的 11 个节点 | 留在 `graph/nodes.py` | 仅保留 State→调用→State 更新 | Graph 边与 State 字段不变 |
| `graph/workflow.py` | 注入 `AgentContainer` | 连接 Runtime 与 Graph | 两个入口签名不变 |
| `api/server.py` | 调用 Runtime 资源和操作 | API 不触达节点私有实现 | HTTP 协议不变 |

## 重构后结构与验证

```text
app/
  a2a/{client,models,registry,endpoints,requests}.py
  common/{alarm,serialization}.py
  graph/{state,workflow,nodes}.py
  runtime/{container,operations,tracing}.py
  agents/{router,diagnosis,knowledge,cad,maintenance,workorder,quality,report,memory}/
  api/  closure/  harness/  memory/  workorder/  tools/  mcp/  rag/
```

验证记录：

- `python -m unittest discover -s services/agent-service/tests -p "test_*.py"`：从仓库根目录运行时 `app` 不在导入路径；设置 `PYTHONPATH=services/agent-service` 后发现 0 个测试，因为现有用例是 pytest 函数。
- `python -m pytest -q -p no:cacheprovider`：7 个测试通过。
- `python -m compileall -q app`：通过。
- 两个 Graph 入口分别验证了用户知识→报告和自动异常→工单的节点链；Graph 质检路径验证了 `quality_check_id` 与 Closure 记录。
- 静态核对确认 25 个 API 路由、`AgentState` 源码及 LangGraph 节点/边声明保持不变；Runtime 烟测确认 9 Agent、7 个 A2A Endpoint、Provider 与 Trace 绑定。

现有测试文件没有逐一覆盖所有 A2A 适配器。本次范围限定为 `app/`，因此未修改测试目录；独立审查未发现具体行为回归。未连接现场 RAG、MCP 和数据库做外部集成验证。
