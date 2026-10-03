# Agent 领域阶段合并设计

本轮以当前本地源码为基线，接续用户确认的 51 节点方案。用户已明确开始执行且不再逐项询问；本文件记录执行边界，不代表用户另行审阅过本文件。

## 范围

九个 Agent、五服务边界、30 份 Markdown Skill、66 个工具的接口和权限保持不变。不调整生产配置、不调用真实设备、不部署、不重做前端。顶层 Runtime 节点不合并。现有工作区修改全部保留。

仅合并领域图的调度阶段；业务函数和验证器继续执行，每个实际子操作继续使用原 Skill 步骤、task_id、trace_id 记录。不得用一个汇总日志取代工具入参、返回体、错误和上下文。

## 合并映射

| Agent | 原数量 | 目标 | 阶段组成 |
| --- | ---: | ---: | --- |
| Router | 6 | 3 | prepare；classify_intent/extract_entities/validate_route；结果分支 |
| Diagnosis | 9 | 7 | prepare、reason、tool_guard、act/observe、loop_guard、validate、结果分支 |
| Knowledge | 10 | 6 | prepare/classify_query/plan_retrieval；retrieve/observe；refine_query；rerank；validate；结果分支 |
| CAD | 8 | 5 | prepare/resolve_component；plan_engineering_query；query/observe；validate_relation；结果分支 |
| Maintenance | 10 | 6 | prepare/assess_diagnosis；request_knowledge/request_cad；plan_repair/check_parts_tools；safety_validate；validate；prepare_workorder/final |
| WorkOrder | 10 | 7 | prepare；validate_plan；create_order；collect_dispatch_context/select_assignee；assign_order；execute_action；validate/结果分支 |
| Quality | 11 | 5 | prepare；load_part/load_inspection_plan；五项 inspect；validate_part；结果分支 |
| Report | 8 | 5 | prepare；collect_sources/check_completeness；compose/validate；persist；结果分支 |
| Memory | 13 | 7 | prepare/动作对应入口验证；retrieve_memory；dedup/rerank/validate；extract_experience/dedup_experience；validate_experience；persist；结果分支 |

结果分支只执行当前路径真实的 final 或 fallback；Knowledge 失败路径仍执行 fallback 后 final，不能丢失证据不足的结果构造。Memory 入口只执行当前动作对应的验证，recent 不执行搜索或学习验证。

## 不可改变的行为

- Diagnosis 模型/工具循环、Knowledge 检索精化循环、CAD 工程查询循环仍存在；保留各自步数、重复观测和失败门禁。
- 初始化阻断后不继续选择 Skill 或执行领域操作；act 失败后不 observe；CAD 查询到预算上限或队列为空后不复用旧观测。
- 工单创建、派工、反馈、完成等副作用阶段不能混成一个可重复执行的写操作；审批、幂等、维修验收规则保持原样。
- Quality 仍执行五类检查；零件身份失败后不调用检测；缺失数据不合格。
- Maintenance 安全校验和最终验证仍分别执行；证据不足、低置信度、无需维修不放行。
- 报告仍明确 incomplete、持久化状态；经验学习准入及校验均在写入前执行。
- 合并函数仅顺序传递节点返回的增量状态，不能重试，异常直接传播；每次运行独立累计轨迹。
- 合并后的 prepare 是新的阶段边界，其测试要验证阶段中全部真实子操作，不将新边界误当成旧的 initialize/load_skill 边界。

## 验证和恢复

先备份九个图、基础帮助函数、被修改的测试到 `.runtime/backups/agent-stage-node-merge-20261003/`，只复制源码，不复制配置/密钥/数据库。恢复须先另存当前文件，再逐项从备份复制，不整体回退工作区。

先观察新增测试在现有实现中失败，再实现合并；现有功能特征测试须继续通过。运行 Agent 全套、受影响的 Backend 与跨服务契约测试，独立进程/临时数据库/外部测试适配器隔离。不把离线测试称为生产验收。数量目标若与真实功能冲突，以功能和安全为先并记录偏离。
