# Agent 领域阶段合并报告

日期：2026-10-03。目录：`L:/industry_agent`。接续用户确认的本地合并任务，保留已有未提交修改；未访问远程项目、未提交、未部署、未调用真实设备。

## 实际结果

九个业务 Agent 保留；其领域 Graph **85 → 51** 个调度节点，减少 34 个（40%）。不含 START/END；加上原有顶层 Runtime 单节点，总计 52。数量来自实际编译图，不代表线上调用频率或已测得性能提升。

| Agent | 原数量 | 新数量 | 合并内容 |
| --- | ---: | ---: | --- |
| Router | 6 | 3 | 意图/实体/路由校验；统一结果入口 |
| Diagnosis | 9 | 7 | 执行工具/记录观测；统一结果入口 |
| Knowledge | 10 | 6 | 准备/分类/计划；检索/观测；统一结果入口 |
| CAD | 8 | 5 | 准备/解析部件；查询/观测；统一结果入口 |
| Maintenance | 10 | 6 | 准备/诊断分析；知识/CAD 上下文；方案/备件；草稿/结果 |
| WorkOrder | 10 | 7 | 派工上下文/候选排序；验收/结果入口 |
| Quality | 11 | 5 | 零件/规格；五项检测阶段；统一结果入口 |
| Report | 8 | 5 | 来源/完整性；成文/验收；统一结果入口 |
| Memory | 13 | 7 | 准备/动作对应准入；去重/排序/检索验收；提取/经验去重；统一结果入口 |

30 个 Markdown Skill、66 个工具入口（65 个模型可见）不变。没有删业务功能或将低频门禁当作冗余删除。

## 保留的真实操作和安全边界

- Diagnosis 模型/工具循环、Knowledge 精化检索循环、CAD 工程查询循环仍在；其余六个领域图仍无内部循环。外层 Runtime 重规划不改。
- 子操作仍独立记录原来的 Agent/Skill 步骤及 task_id/trace_id。合并减少图调度，未缩减工具输入、输出、错误和上下文日志。
- 工单创建、派工、执行动作仍是独立写阶段；输入门禁失败直接回退，执行动作异常仍按原路径经过最终校验再返回失败。没有额外写重试。
- Maintenance 安全校验、方案校验独立；低置信度、无需维修、证据/库存不足门禁保留。
- Quality 仍做尺寸、外观、材料、功能、工艺五类检测；身份失败时不调用规格和检测，缺少必需数据不能合格。
- Knowledge 无证据时有界精化，失败仍按原 fallback→final 形成明确不足结果；CAD 到达预算不重复 observe 旧结果。
- Report 不完整仍返回 incomplete，未将未持久化写成成功；Memory 的 recent/search/learn 入口互斥，学习准入/经验验收/重复 RAG 恢复保留。

## 修改的本地文件

- `services/agent-service/app/agents/base.py`：新增轻量 `chain_nodes`、`result_node`，顺序传递增量、明确路由停止、异常不重试；子节点已有日志封装不重复包装。
- `services/agent-service/app/agents/{router,diagnosis,knowledge,cad,maintenance,workorder,quality,report,memory}/graph.py`：上述阶段注册和边合并；原业务函数保留。Router 合并后无消费者的 `_route` 删除。
- `services/agent-service/tests/test_graph_preparation.py`：新 prepare 阶段边界用真实 Agent 验证，不删除原初始化阻断/跨轮/异常测试。
- 新增 `tests/test_stage_composition.py` 和 `tests/test_stage_node_merge.py`（位于 Agent 服务）：组合行为、实际图计数/循环、工具预算、失败门禁和子操作日志；净新增 34 项测试。
- 本设计/计划及两份既有架构记录增加本轮入口，不改写历史测试数量。

## 回归记录

测试运行器：`.superpowers/sdd/2026-10-03-agent-stage-node-merge/run-tests.ps1`。仅子进程使用隔离环境，禁用 .env、清空外部服务/模型密钥，临时 SQLite/内存存储和外部测试适配器；各服务 app 包使用独立进程。

| 实际命令（运行器 Targets 参数） | 日志 | 通过 | 失败 | 跳过 |
| --- | --- | ---: | ---: | ---: |
| `python -m pytest -c pytest-agent.ini -q`（修改前 UTF-8 基线） | baseline-utf8.log | 378 | 0 | 0 |
| `test_stage_composition.py test_graph_preparation.py` | task1-targeted.log | 23 | 0 | 0 |
| 全套 Task 1 | task1-suite.log | 385 | 0 | 0 |
| `test_stage_node_merge.py test_graph_slimming_contract.py test_report_pdf.py` | task2-targeted.log | 16 | 0 | 0 |
| 全套 Task 2 | task2-suite.log | 392 | 0 | 0 |
| `test_stage_node_merge.py test_graph_preparation.py test_formal_runtime_slimming.py test_cad_device_scope.py` | task3-targeted.log | 41 | 0 | 0 |
| 全套 Task 3 | task3-suite.log | 399 | 0 | 0 |
| `test_stage_node_merge.py test_graph_preparation.py test_memory_rag_retry.py test_workorder_idempotency.py test_workorder_reconciliation_boundary.py test_formal_runtime_slimming.py` | task4-targeted.log | 58 | 0 | 0 |
| 全套 Task 4 | task4-suite.log | 407 | 0 | 0 |
| `test_stage_composition.py test_stage_node_merge.py test_graph_preparation.py test_full_agent_runtime_e2e.py test_p0_p1_lifecycle_smoke.py` | task5-targeted.log | 49 | 0 | 0 |
| Agent 全套 | task5-suite.log | 409 | 0 | 0 |
| Backend：`python -m pytest -c pytest-backend.ini -q services/backend-service/tests/test_team_dispatch.py services/backend-service/tests/test_team_repair_confirmation.py` | task5-backend.log | 6 | 0 | 0 |
| Agent 契约：`test_agent_contract.py test_shared_contracts.py test_quality_backend_contract.py tests/integration/test_runtime_rag_cad_contract.py` | task5-contracts.log | 12 | 0 | 0 |
| 最终修复专项：`test_stage_node_merge.py test_stage_composition.py test_graph_preparation.py test_workorder_idempotency.py test_workorder_reconciliation_boundary.py` | final-fix-green.log | 59 | 0 | 0 |
| 最终 Agent 全套 | final-agent-suite.log | 412 | 0 | 0 |
| 最终 Backend 相关回归（同上两个文件） | final-backend.log | 6 | 0 | 0 |
| 最终跨服务契约（同上四个文件） | final-contracts.log | 12 | 0 | 0 |

Task 1 新组合函数测试先 7 failed；Task 2 新图计数先 3 failed；Task 3、4 图计数及新 prepare 边界分别先 5 failed，随后实现并通过。业务等价特征在合并前也运行，不能将结构目标失败误报为原业务故障。

首次基线 376 passed / 2 failed 是 Windows Backend 子进程输出中文时与 UTF-8 解码不一致；设置测试子进程 PYTHONUTF8/PYTHONIOENCODING 后在产品代码未修改时 378 passed。未删失败测试或跳过校验。

最终源码和新增测试 `python -m compileall -q` 通过；项目默认配置下、本轮文件范围 `git diff --check` 通过。最终三组回归在工单异常路径修复后重新执行，结果不只是修复前记录。

## 配置、备份和恢复

无产品配置、状态模型、API 或数据库迁移变化，不涉及数据删除。源码修改前备份目录：`.runtime/backups/agent-stage-node-merge-20261003/`，按原相对路径保存 10 份产品源码、1 份既有测试、2 份既有文档。清单与校验摘要在同目录 `manifest.md`。

恢复时先另存当前文件，再按清单逐个 `Copy-Item -LiteralPath <备份绝对路径> -Destination <原文件绝对路径>`；不要整体覆盖工作区，不使用 git reset/checkout。新增两份测试和三份设计/计划/报告单独列出，确认没有后续改动后再决定如何处理。无需恢复数据库或 .env。

## 验证边界

本轮只改 Agent Graph，未运行其他四服务的全部测试，执行了受影响 Backend 及跨服务契约；没有收费模型、真实 MySQL/PLC、生产环境、浏览器在线长时间联调或部署验证。离线回归通过不是生产验收。

前轮记录的虚拟产线迟到复机结果隔离、响应丢失对账、部分后验通过后回停、并发派工覆盖、停机读回失败人工恢复等项目不在本次节点合并范围，未因合并声称已完成。

## 执行决策

1. 对话批准的方案直接执行，不再次要求文档审批；若书面映射理解不符，成本是调整合并分组。
2. 保留当前工作区、不新建 worktree、不提交，保留本轮账本和输出；避免丢失既有未提交修改，成本是恢复要按文件清单操作，而非依赖单独提交。
3. 真实模型/设备/生产数据库的在线、并发恢复和长期效果留待专门验收；成本是尚不能排除线上环境差异及既有恢复风险。
4. 未跑性能基准，不声称具体延迟或成本改善；成本是实际运行收益可能有限。

## 独立最终审查

一次 fresh-context gpt-6-astra / high 只读审查核对 13 份备份摘要、实际图计数及三个循环，未发现失败放行、重复写或状态污染。审查发现工单执行异常时漏掉原 `validate` 步骤（原评 Minor，本轮按验收/日志等价要求升为 Important）。

新增真实 WorkOrderAgent→WorkOrderService→ToolRegistry→隔离 MCP 超时边界的更新、派工、关闭三项回归，先 3 failed，随后保留 `execute_action→validate→fallback`，同时仍只执行一次业务写操作。输入校验失败仍直接回退。没有另派第二次审查，无延期的小建议。
