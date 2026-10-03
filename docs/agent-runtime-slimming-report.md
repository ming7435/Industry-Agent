# Agent 节点、状态、工具与 Skill 精简交付报告

日期：2026-10-03。工作目录：`L:/industry_agent`。仅以当前磁盘代码为依据。

后续阶段已继续将领域图从 85 合并到 51 个节点；下面保留第一阶段的修改和验证记录。当前数量、阶段映射及本轮验证见 [领域阶段合并报告](agent-stage-node-merge-report.md)。

## 结论

五项 Agent Runtime 精简任务已完成，剩余六个场景已迁入正式 Runtime，旧编排实现已移除。保留九个 Agent、五服务边界、原工具入口、业务状态及安全校验。未改生产配置、模型选择、数据库或前端，未连接真实设备，未部署或推送。

| 项目 | 修改前 | 修改后 | 含义 |
| --- | --- | --- | --- |
| 九个领域 Graph 注册节点 | 96 | 85 | 九组准备节点合并，另移除两个无业务意义节点 |
| Markdown Skill 文档 | 32 | 30 | 两组重复文档合并，旧名仍可解析 |
| 工具处理器 | 66 | 66 | 仅合并内部实现，入口不删 |
| 模型可见工具 | 65 | 65 | 内部失败验收工具仍不暴露 |
| Agent 全量回归 | 319 通过 | 378 通过 | 净新增 59 项，无失败/跳过 |

节点数量来自实际编译图（不含 START/END）：Router 6、Diagnosis 9、Knowledge 10、CAD 8、Maintenance 10、WorkOrder 10、Quality 11、Report 8、Memory 13。以上不是线上调用频率或性能基准。

## 实际行为与问题状态

| 问题 / 目标 | 状态 | 实际处理 |
| --- | --- | --- |
| 初始化、Skill 加载重复注册 | 已完成 | 共用 prepare，但保留原两个实际子操作、日志输入输出与任务身份；初始化阻断时不加载 Skill |
| 多份执行状态重复声明 | 已完成 | 十份状态继承 AgentExecutionState，领域字段不动 |
| Quality 空 decision 节点 | 已完成 | validate_part 直连 final；decision 业务结果字段保留；缺失检测类别/规格仍不得合格 |
| Maintenance 无入边 fallback | 已完成 | 核实无消费者后删除函数和注册；异常传播、证据不足仍不可派工 |
| rework_via 空声明 | 已完成 | 删除无消费者声明，不删质检整改状态 |
| CAD / Router 重复 Skill | 已完成 | drawing_lookup_skill、intent_routing_skill 为主名，旧 part_search_skill、entity_extraction_skill 为别名；冲突校验、顺序去重、规范与请求名追踪 |
| 工具注册字典漂移 | 已完成 | ToolDefinition 为处理器、描述、schema、server/operation 唯一来源；权限按原工具名先检查 |
| 库存 / RAG / CAD 薄封装重复 | 已完成 | 共用事实查询/过滤/关系函数；旧 Python 导入、参数优先级及投影保持 |
| 规范 CAD 工具误走本地知识处理器 | 已修复 | query_drawing/query_relation/fetch_engineering_record 显式绑定 CAD，不再暗用演示返回 |
| 空知识结果仍进入 Maintenance | 已修复 | Knowledge 图有界补检后仍不满足证据门禁，正式 Runtime 立即阻断；不启动维修、派工、学习或报告 |
| 正式 diagnosis_review 返回原缓存 | 已修复 | 使用已有 review=True 缓存旁路；真实模型边界、工具和诊断验证回归通过 |
| 所有历史测试迁到正式 Runtime / 删除旧编排 | 已完成 | 六组全部迁移/保留真实业务服务测试；旧 graph/nodes.py 与旧专属测试适配器删除，原场景和安全门禁保留 |
| 重规划丢失剩余任务 | 已修复 | 专用复核能力后追加未完成任务，顺序去重；真实复核/方案重规划成功后仅创建一次 |
| 方案验证/派工丢失诊断证据状态 | 已修复 | 验证中传递原诊断；派工门禁读取 DiagnosisView.raw，保留 synthetic、人工复核与未验证阻断，不增加默认通过标记 |
| 成功领域复用证据被误判为无进展 | 已修复 | 领域实际验收通过计业务进展，不伪造新证据、不将单阶段通过视为整个计划结束 |
| 空检索结果提前终结，细化未执行 | 已修复 | 有证据且来源满足才正常结束；无证据时在原预算内细化一次，仍不足就阻断 |
| evidence 兼容导出 | 保留 | 仅三个薄导出，外部消费者无法证明不存在 |
| 低频审批、失败分支、幂等、复检 | 保留 | 不以调用少作为删除依据；原回归继续执行 |

删除文件为两份内容并入主文档的重复 Skill：`skills/cad/part_search.md`、`skills/router/entity_extraction.md`，以及 `app/graph/nodes.py` 和 `tests/team_completion_adapter.py`；同时移除无用节点函数、空声明及五个仅旧编排消费的状态声明，均可从备份恢复。没有删除数据、数据库、配置或前端产物。

## 历史测试迁移对照

| 测试组 / 场景 | 当前路径与保留断言 |
| --- | --- |
| test_business_gates：低置信度不创建 | 已迁移至真实容器、Planner、Policy、Dispatcher、WorkOrder Graph；0.42 原值保留、创建调用为 0、无工单、明确置信度门禁错误 |
| test_business_gates：其余六项 | 原本直接测试真实业务服务/验证器，保留并运行 |
| test_autonomous_evidence_loop：Runtime 阻断 | 去掉模拟 Coordinator，真实 Runtime 返回 knowledge_evidence_gate，不创建工单 |
| test_autonomous_evidence_loop：查询细化一次、持续不足 | 真实 Knowledge 图两次互补检索后细化一次；共 3 次查询，持续不足不启动维修、派工、学习或报告 |
| test_orchestrator_trigger_flow：触发报告 | 真实 Report Agent，生成 incident_report，不学习 Memory |
| test_orchestrator_trigger_flow：任务日志隔离 | 同一真实容器连续运行两轮；另补不同设备、查询和互斥证据逐项断言，首轮结果不被改写，返回轨迹只属于本轮 |
| test_orchestrator_trigger_flow：活动节点 | 真实容器构造，仍只加载 RuntimeNode |
| test_orchestrator_trigger_flow：同事件 API | 原本正式 API 场景，保留并运行 |
| test_agent_loop_runtime：复核、方案重规划 | 真实诊断复核一次、5 次模型边界调用，证据加权 0.985；库存首次不足使真实方案重规划一次，2 次库存查询，最终仅创建一次 |
| test_full_agent_runtime_e2e | 真实故障入口同时触发两种重规划→派工→未授权人员拒绝→可信设备验收→关闭→Memory/RAG→完整报告；维修前/关闭前无学习和闭环报告 |
| test_p0_p1_lifecycle_smoke | 真实 Runtime 与独立 Backend 注册/维修确认进程；RAG 临时 SQLite、Memory、Report 真实持久化；重复关闭只入库一次、报告一次 |

续作修复了此前阻碍迁移的正式调用链问题；没有通过降低断言删除旧实现。旧 API 测试从“未生成后续计划”改为验证“保留待办，但证据门禁前不执行维修/派工，持久化中没有工单”，并继续断言补证/复核能力优先。`graph/evidence.py` 仅保留三个公开薄导出；没有第二套编排。历史 JSON 记录没有改写。

## 修改文件

以下为备份版本与当前版本有差异的源码、Skill 和既有测试（包含四份删除文件）：

- `services/agent-service/app/agents/base.py`
- `services/agent-service/app/agents/cad/graph.py`
- `services/agent-service/app/agents/diagnosis/graph.py`
- `services/agent-service/app/agents/knowledge/graph.py`
- `services/agent-service/app/agents/maintenance/graph.py`
- `services/agent-service/app/agents/memory/graph.py`
- `services/agent-service/app/agents/memory/schemas.py`
- `services/agent-service/app/agents/quality/graph.py`
- `services/agent-service/app/agents/quality/schemas.py`
- `services/agent-service/app/agents/report/graph.py`
- `services/agent-service/app/agents/router/graph.py`
- `services/agent-service/app/agents/workorder/graph.py`
- `services/agent-service/app/agents/workorder/schemas.py`
- `services/agent-service/app/graph/state.py`
- `services/agent-service/app/runtime/coordinator.py`
- `services/agent-service/app/runtime/dispatcher.py`
- `services/agent-service/app/runtime/loop_engine.py`
- `services/agent-service/app/workorder/policy.py`
- `services/agent-service/app/graph/nodes.py`（删除）
- `services/agent-service/app/skills/registry.py`
- `services/agent-service/app/skills/cad/drawing_lookup.md`
- `services/agent-service/app/skills/cad/part_search.md`
- `services/agent-service/app/skills/router/entity_extraction.md`
- `services/agent-service/app/skills/router/intent_routing.md`
- `services/agent-service/app/tools/registry.py`
- `services/agent-service/app/tools/cad/engineering_data.py`
- `services/agent-service/app/tools/cad/query_assembly_relation.py`
- `services/agent-service/app/tools/cad/query_part_relation.py`
- `services/agent-service/app/tools/knowledge/search_alarm_knowledge.py`
- `services/agent-service/app/tools/knowledge/search_fault_cases.py`
- `services/agent-service/app/tools/knowledge/search_knowledge.py`
- `services/agent-service/app/tools/knowledge/search_manual.py`
- `services/agent-service/app/tools/knowledge/search_semantic_memory.py`
- `services/agent-service/app/tools/knowledge/search_sop.py`
- `services/agent-service/app/tools/maintenance/query_part_availability.py`
- `services/agent-service/app/tools/maintenance/query_stock.py`
- `services/agent-service/tests/test_autonomous_evidence_loop.py`
- `services/agent-service/tests/test_business_gates.py`
- `services/agent-service/tests/test_orchestrator_trigger_flow.py`
- `services/agent-service/tests/test_agent_loop_runtime.py`
- `services/agent-service/tests/test_full_agent_runtime_e2e.py`
- `services/agent-service/tests/test_p0_p1_lifecycle_smoke.py`
- `services/agent-service/tests/test_runtime_replan.py`
- `services/agent-service/tests/team_completion_adapter.py`（删除）

新增源码和测试：

- `services/agent-service/app/agents/state.py`
- `services/agent-service/tests/test_graph_preparation.py`
- `services/agent-service/tests/test_graph_slimming_contract.py`
- `services/agent-service/tests/test_skill_aliases.py`
- `services/agent-service/tests/test_tool_alias_contract.py`
- `services/agent-service/tests/runtime_slimming_adapter.py`
- `services/agent-service/tests/test_formal_runtime_slimming.py`
- `services/agent-service/tests/formal_lifecycle_adapter.py`
- `services/agent-service/tests/backend_lifecycle_worker.py`

文档还更新 `docs/agent-service-architecture-cleanup.md` 与批准计划的进度复选框；新增本报告。未修改但预备备份的候选文件不能算作本轮改动。Git 中其他已有变更不归本报告，本轮没有整文件提交它们。

## 验证记录

统一隔离执行脚本：`.superpowers/sdd/2026-10-03-agent-runtime-slimming/run-tests.ps1`。
脚本禁用 dotenv，清空供应商密钥、MySQL/外部服务连接、设备控制模式；设置测试环境和不可达工厂地址。现有 conftest 与新增适配器将存储设为 tmp_path。真实被测 Runtime/Agent/验证器不被 mock；模型、检索和外部设备响应使用测试适配器。

| 日志 Label / 实际命令 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| baseline：python -m pytest -c pytest-agent.ini -q | 319 | 0 | 0 |
| task1-full：同上 | 335 | 0 | 0 |
| task2-full：同上 | 343 | 0 | 0 |
| task3-full：同上 | 348 | 0 | 0 |
| task4-full：同上 | 367 | 0 | 0 |
| task5-regression：六组历史测试 + 正式测试 + policy_e2e / approval_resume / experience_quality_gate | 30 | 0 | 0 |
| final-targeted：五份新专项测试 | 52 | 0 | 0 |
| task5-full：python -m pytest -c pytest-agent.ini -q | 371 | 0 | 0 |
| final-full：终审后再次运行全量同一命令 | 371 | 0 | 0 |
| final-contracts：agent_contract / shared_contracts / quality_backend_contract / tests/integration/test_runtime_rag_cad_contract.py | 12 | 0 | 0 |
| completion-baseline：续作前 Agent 全量 | 371 | 0 | 0 |
| completion-loops-green4：复核/方案/规范化/剩余计划 | 16 | 0 | 0 |
| completion-evidence-green：真实细化与不足阻断 | 3 | 0 | 0 |
| completion-all-scenarios-green：六组迁移 + policy_e2e / approval_resume / experience_quality_gate | 26 | 0 | 0 |
| completion-delete-full：删除旧实现后 Agent 全量 | 378 | 0 | 0 |
| completion-backend-contract：独立 pytest-backend.ini，team_repair_confirmation / team_dispatch | 6 | 0 | 0 |
| completion-contracts：上述四组跨服务契约 | 12 | 0 | 0 |
| completion-final-targeted：五份新专项测试重跑 | 57 | 0 | 0 |
| completion-final-full：收尾前 Agent 全量重跑 | 378 | 0 | 0 |
| completion-final-backend：独立 Backend 相关回归重跑 | 6 | 0 | 0 |
| completion-final-contracts：跨服务契约重跑 | 12 | 0 | 0 |
| completion-independent-review：独立审查重跑专项及迁移回归 | 81 | 0 | 0 |
| completion-post-review-full：续作终审后 Agent 全量复跑 | 378 | 0 | 0 |

实际 Python：`L:/anaconda/python.exe`。对应 PowerShell 命令例如：

```powershell
& ./.superpowers/sdd/2026-10-03-agent-runtime-slimming/run-tests.ps1 -Label task5-full
& ./.superpowers/sdd/2026-10-03-agent-runtime-slimming/run-tests.ps1 -Label final-targeted -Targets @('services/agent-service/tests/test_graph_preparation.py','services/agent-service/tests/test_graph_slimming_contract.py','services/agent-service/tests/test_skill_aliases.py','services/agent-service/tests/test_tool_alias_contract.py','services/agent-service/tests/test_formal_runtime_slimming.py')
& ./.superpowers/sdd/2026-10-03-agent-runtime-slimming/run-tests.ps1 -Label final-contracts -Targets @('services/agent-service/tests/test_agent_contract.py','services/agent-service/tests/test_shared_contracts.py','services/agent-service/tests/test_quality_backend_contract.py','tests/integration/test_runtime_rag_cad_contract.py')
& ./.superpowers/sdd/2026-10-03-agent-runtime-slimming/run-tests.ps1 -Label completion-backend-contract -Config pytest-backend.ini -Targets @('services/backend-service/tests/test_team_repair_confirmation.py','services/backend-service/tests/test_team_dispatch.py')
& ./.superpowers/sdd/2026-10-03-agent-runtime-slimming/run-tests.ps1 -Label completion-post-review-full
& L:/anaconda/python.exe -m compileall -q services/agent-service/app services/agent-service/tests
git diff --check
```

语法检查通过；diff --check 退出 0，仅有既有 LF/CRLF 提示。新增文件另做空白检查。RED 记录保留：任务 1 14 项失败、任务 2 2 项失败、任务 3 4 项失败、任务 4 4 项失败；两个正式 Runtime 问题分别有 1 项失败→修复通过。初期测试装配误差均按真实接口修正，不改产品校验来迎合测试。

## 未执行的验证与保留风险

空白检查补充：按项目原 Git 配置的 diff --check 退出 0，本轮全部文件（含新增文件）行末空格/Tab 扫描也通过。额外覆盖 core.autocrlf=false 的诊断将 Windows CRLF 视作行末空白而失败，恢复原设置后通过；没有因此修改源码或项目 Git 配置。

- 未联调真实模型、MySQL、Milvus、真实 CAD 或工厂；未进行收费生成、真实设备控制、自动部署、Docker 构建、前端重建。
- 本轮没有修改 Backend/Document-CAD/Model/RAG 的实现或共享协议，运行的是本地隔离跨服务契约，不能称其余四服务全量或生产验收。
- 两个完整维修闭环已使用正式 Runtime 通过隔离验收；设备仍为测试适配器，不构成真实设备验收。
- 上一轮产线功能的五个待收尾项保留：迟到复机结果的 generation/attempt 隔离；提交成功但响应丢失后的对账；部分后验成功回停后的工单关闭门禁；并发派工负责人覆盖；停机读回失败后的人工恢复路径。本轮不声称修复。
- 未猜测工业设备合格阈值，也未把模型置信度直接当作设备恢复验收。
- 前阶段独立审查发现的双轮上下文隔离覆盖建议已补：不同设备/查询/互斥证据均验证。续作独立终审无 Critical/Important/新增 Minor，详见末尾终审记录。

## 配置、迁移与恢复

没有配置、数据库模式或数据迁移。本轮不会改变已运行服务的环境；新增别名向后兼容，不改写历史记录。

修改前备份目录：`.runtime/backups/agent-runtime-slimming-20261003/`；续作增量目录为 `.runtime/backups/agent-runtime-slimming-completion-20261003/`，可单独恢复到 371 项通过的前阶段版本。相对路径与 SHA-256 见该目录 `manifest.md`。备份保留用户已有修改，未复制生产配置、密钥、数据库或构建产物。

恢复单个文件前先另存当前版本，再从备份按完全相同的相对路径复制；不要批量覆盖目录，不使用 reset/checkout。示例仅用于手工恢复已确认的单个文件：

```powershell
# 先将当前文件另存，防止丢失后续工作；请自行选择尚不存在的保存路径。
Copy-Item -LiteralPath 'L:/industry_agent/services/agent-service/app/tools/registry.py' -Destination 'L:/industry_agent/.runtime/registry-before-restore.py'
Copy-Item -LiteralPath 'L:/industry_agent/.runtime/backups/agent-runtime-slimming-20261003/services/agent-service/app/tools/registry.py' -Destination 'L:/industry_agent/services/agent-service/app/tools/registry.py'
```

两个删除 Skill 可直接从对应备份恢复，但应和 registry/base 的别名变更一起核对，避免重复名称冲突。新增文件无旧版备份，撤回时先核对调用关系和是否有后续改动，不能单独删公共 state.py。本轮差异及测试日志保留在计划的 .superpowers/sdd 目录，没有自动提交/合并/推送。

## 实施决策

完整决策及代价逐项记录于执行 progress.md；核心是原地保护已有改动、保留可恢复证据、以真实注册表测试项目 Skill、保留语义记忆既有过滤语义、纠正 CAD 路由、阻断耗尽补检、真正执行诊断复核、先完整迁移再删旧编排、不发起部署或分支集成。

## 续作验证说明

复现日志保留于同一执行目录：completion-replan-red（2 失败）、completion-normalization-red（1 失败）、completion-loops-diagnostic2（真实方案缺诊断）、completion-loops-green2（实际派工门禁丢 raw 状态）、completion-evidence-red（2 失败）。随后正式领域调用和完整回归通过。用于装配测试的报告存储/检索返回字段错误也保留在日志中，按真实接口修正，没有修改产品返回字段来迁就测试。

独立 Backend 子进程仅使用本次 tmp_path 中的工单/团队 SQLite；真实执行注册、身份核验、状态迁移和预启动/后启动验收，未 mock 被测 Backend 业务。RAG 文档存储按文件路径独立加载，检索/写入真实 SQLite；未声称 Milvus 在线索引验收。人工确认流程沿用现有 LineController，工厂控制对象是显式测试适配器。

续作的关键决策：按用户“全部完成”补齐剩余计划算法；已验收领域计真实业务进展但不视作整轮完成；从 raw 保留原诊断证据和安全标记；安全断言验证实际执行和存储而非删除待办；保留公开 evidence 薄导出。代价与完整历史决策记录在 progress.md 中。

续作收尾检查：compileall 退出 0，git diff --check 退出 0；精确备份中 20 个文件的 SHA-256 与清单一致；本轮及备份候选的 97 个现存文件空白扫描无行末空格/Tab。检查没有改写配置、数据或备份源码。

## 续作独立终审与交付边界

runtime_slimming_completion_review 使用全新上下文只读审查精确备份到当前文件的差异，并核对全部五项 Review Focus。独立重跑 81 项专项/迁移回归全部通过，0 失败、0 跳过；没有 Critical、Important 或新增 Minor。认可本地五项 Agent 精简完成，不授权提交、合并或部署。

审查未判断的行为逐项有 ledger Ruling：

- 真实模型/MySQL/Milvus/CAD/工厂可用性：未连接，保留生产联调要求；代价是不构成生产验收。
- 迟到复机结果的 generation/attempt 隔离：保留原问题；代价是旧结果可能覆盖较新恢复状态。
- 写入成功但响应丢失后的对账：保留原问题；代价是不确定结果需另行对账。
- 部分后验成功后回停的工单关闭门禁：保留原问题；代价是异常回停分支仍需专项验收。
- 并发派工负责人覆盖：保留原问题；代价是并发分配安全仍需单独修复。
- 停机读回失败后的人工恢复：保留原问题；代价是不声称全自动产线闭环可靠。
- 仓库外私有代码直接导入旧内部编排：本地无消费者后按批准计划删除，不把内部模块视作公共接口，公开 evidence 薄导出保留；代价是外部直接消费者须迁移或按备份恢复。

以上是范围与兼容性决定，不是隐藏完成清单。没有新增待处理的审查 Minor；五项精简任务已全部完成。当前分支 codex/virtual-line-team-design 和本地文件原样保留，精确备份与执行日志保留，未自动提交或部署。

终审后最终执行 completion-post-review-full：378 通过、0 失败、0 跳过（12.90 秒）。最终 git diff --check 退出 0。没有在该轮之后修改产品源码。
