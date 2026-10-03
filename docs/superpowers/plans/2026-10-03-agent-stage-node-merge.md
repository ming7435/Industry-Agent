# Agent 阶段合并实施计划

Spec: `docs/superpowers/specs/2026-10-03-agent-stage-node-merge-design.md`

目标：九领域图 85 → 51 个节点，保留所有业务操作、三个内部循环、工具权限和可追溯日志。直接在当前已修改的本地工作区执行；不提交、切换分支或覆盖用户修改。

## 公共接口

基础模块新增 `chain_nodes(*nodes, stop_routes=())`：输入已带日志包装的节点，顺序合并增量状态；遇到指定路由停止，异常不重试。新增 `result_node(final, fallback)`：按当前 route 分支，只调用相应的已包装结果节点。两个函数返回可注册的节点函数，不引入业务路由框架。

## Task 1: 阶段组合工具

1. 备份源码并用隔离运行器执行当前 Agent 基线。Expected: 现有测试全部通过。
2. 新增真实组合函数测试：顺序状态传递、分支提前终止、异常不重试、每轮轨迹独立、task/trace 和结果分支。Expected: 帮助函数缺失，断言失败。
3. 实现最小组合函数。Expected: 新测试全部通过，旧准备节点测试通过。
4. 执行 Agent 全套。Expected: 零失败和新扩大跳过。

## Task 2: Router / Quality / Report

1. 新增实际编译图数量测试，结合真实路由、质检五类结果/身份失败/缺数据、报告完整性/无来源阻断及实际子操作轨迹断言。Expected: 原数量与目标不同，失败。
2. 按设计合并，业务函数保留。Expected: 3/5/5，真实操作顺序及次数不变。
3. 针对性及 Agent 全套回归。Expected: 全绿。

## Task 3: Diagnosis / Knowledge / CAD

1. 新增图数量和循环行为断言；复用正式 Runtime 场景验证循环、预算、无结果和权限拒绝；增强 prepare 阶段测试。Expected: 原图数量失败。
2. 合并顺序操作和终端分支，保留三个循环。Expected: 7/6/5，无额外外部调用或重试。
3. 针对性及 Agent 全套回归。Expected: 全绿。

## Task 4: Maintenance / WorkOrder / Memory

1. 新增图数量、动作入口、验收/准入阻断和子步骤轨迹测试。Expected: 原图数量失败。
2. 合并读取/计划阶段及结果构造，独立保留写操作及门禁。Expected: 6/7/7。
3. 针对性及 Agent 全套回归。Expected: 全绿；审批、库存不足、低置信度、无需维修、经验重复场景仍满足原断言。

## Task 5: 集成交付

1. 新增九图合计 51（不含 START/END/顶层 Runtime）的精确检查，执行针对性、Agent 全套、Backend 相关、跨服务契约测试。Expected: 全绿。
2. 根据本轮备份到当前文件的精确差异交给一次独立最终审查，不拿整个脏工作区冒充本轮修改。
3. 重要发现先 RED 再修复并全量回归；小建议记录待办。更新 `docs/agent-stage-node-merge-report.md`，列明真实文件、计数、测试、恢复和未验证项。

## Review Focus

检查阶段内 route 的陈旧值是否误触发后续操作；特别检查 CAD 队列空/预算不足、Diagnosis act 失败、Knowledge fallback→final、Memory recent/search/learn 的互斥入口与重复学习。核对没有循环丢失、门禁绕过、重复写入、轨迹丢失或跨轮状态污染。检查真正的 compiled graph，而不是仅统计源码。
