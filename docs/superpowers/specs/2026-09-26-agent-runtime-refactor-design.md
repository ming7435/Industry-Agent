# Agent Runtime 架构重构设计

## 目标

在保留九个业务 Agent、Skill/Tool、A2A、MCP、JEV、Planner、ActionModel、双层 Loop、Evidence、Validator、Policy、Approval、Trace、Memory 学习、RAG、CAD、WorkOrder 和 Quality 能力的前提下，集中 Capability 元数据并收窄 Runtime 边界，降低新增能力和维护连接点的数量。

## 现状审计

当前顶层入口已经是 `AgentOrchestrator → LangGraph(runtime) → OrchestratorNodes.runtime → RuntimeCoordinator`。Coordinator 内部调用 `JEVParser → Planner → LoopEngine → RuntimeDispatcher → ExecutionManager → AgentHarness/Agent`，结果经过 `RuntimeEvaluator` 决定继续、重规划或终止。旧的 `_after_diagnosis` 等函数仍存在，但顶层 Graph 不再注册这些节点，应继续作为兼容入口，直到测试和外部调用审计确认可以删除。

当前主要架构缺口如下：

1. `runtime/capability.py` 只保存 Agent 和 capability 名称，domain、result key、side effect、approval 和 reason 仍分散在 Planner、Coordinator、Policy 及 Agent 声明中。
2. `RuntimeCoordinator` 通过 `_result_key()`、`_domain_for_capability()` 和 replan 分支维护领域映射。
3. `agents/base.py` 的 `trace_skill_node` 维护所有 Agent 的中央 aliases，Graph node 改名时容易造成静默错配。
4. `LoopEngine`、Dispatcher、ExecutionManager、Harness 的职责已经基本分开，但缺少单一的 capability metadata 接口来支撑这些边界。

## 设计

### Capability metadata

新增不可变 `CapabilityDefinition`，字段为 `name`、`agent`、`domain`、`result_key`、`description`、`side_effect`、`requires_approval`、`default_reason`、`aliases` 和声明式 `replan_capabilities`。Registry 以 canonical name 和 alias 索引定义，并继续提供现有 `find`、`lookup`、`for_agent`、`snapshot` 和 Agent 实例解析 API。

Planner 从 Registry 读取默认 reason、side effect、idempotency 和目标 Agent；Coordinator 从 Registry 读取 result key、domain 和声明式重规划动作；Dispatcher 使用 Registry 解析 capability。未知 capability 保持显式失败或兼容 fallback，不通过新的字符串映射扩散。

### Skill/node binding

`trace_skill_node` 只接受调用方提供的 `skill_step`（未提供时使用 node 名称），负责通用的 Skill 查找、trace 和状态记录。每个 Agent 的 Graph 在 `build_*_graph` 附近定义本领域 node→skill step 绑定并传入 wrapper。`base.py` 不再包含领域 Agent 名称或节点 aliases。

### Runtime boundaries

保留现有文件布局，先逻辑收敛，不进行物理目录搬迁。Coordinator 继续编排 Parse → Plan → Execute → Evaluate → Replan/Final，但不再承载 capability→domain/result key 的表。LoopEngine 负责迭代和停止条件，Dispatcher 负责解析和策略前置，ExecutionManager 负责 timeout/retry/lifecycle，Harness 负责 Agent boundary。外部 API、Graph State 和持久化结构保持兼容。

### Legacy compatibility

`_after_diagnosis`、`_after_knowledge`、`_after_cad`、`_after_maintenance` 暂不删除；增加兼容说明并通过搜索和测试确认它们不参与新顶层 Graph。只有没有直接调用依赖时，才在后续清理阶段移除。

## 验收标准

- Registry 是 capability metadata 的唯一 Runtime 查询入口，现有注册和查找 API 行为不变。
- Coordinator 不再定义 capability→domain/result key 的重复映射。
- 九个 Agent 的 Graph 均显式提供 Skill step binding，`base.py` 不包含领域 aliases。
- 两层 Loop、A2A/MCP、Evidence/Observation/Validation、Policy/Approval、Trace、Memory、RAG、CAD、WorkOrder 和 Quality 测试保持通过。
- 新增普通 capability 主要修改定义、Agent 声明及其 Skill/Tool。
