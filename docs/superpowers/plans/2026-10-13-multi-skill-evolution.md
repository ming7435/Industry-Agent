# 多类技能优化实施清单

> 执行：当前会话按 superpowers:executing-plans 实施；用户已要求直接连续修改，不反复请求继续。不自动提交或覆盖已有修改。

**Goal:** 让有实际决策和验证能力的诊断、检索、CAD 技能共同参与独立优化循环。

**Architecture:** 统一能力选择，领域验证适配器复用原候选状态机和发布锁。正文与真实决策相连；所有候选仍人工审核、验证、发布。

**Tech Stack:** Python、LangGraph、Pydantic、React、pytest、Node/Playwright。

**Spec:** ../specs/2026-10-13-multi-skill-evolution-design.md

## 全局约束

- 每周全局预算仍为 3，不降低业务门禁。
- 不调用真实设备、收费模型或生产数据库验证；不修改密钥配置。
- 保留本地用户修改；源文件先备份；不手工编辑构建 assets。
- 新模式验收不得冒充工单、报告或实体内核验收。

## 复核重点

1. 嵌套任务参数伪造验收或变更工具权限：严格拒绝。
2. 候选选择后线上文件变动：停止测试/发布。
3. 模型只返回固定解析结果、没有实际使用候选正文：禁止发布。
4. 旧周计划已占额度：保留且不重复生成。
5. 不同技能切换后测试输入、结果和北极星展示不能串用。

## 任务 1：技能能力与实际消费

文件：skills/loop.py、management.py、优化能力模块；agents/knowledge/agent.py、graph.py；CAD 运行观察。

接口：verification_mode(agent,name) 返回 machine_flow、knowledge_flow、cad_spec_flow 或空；目录增加能力元数据。

- [x] 新增多类选择与模型消费行为测试，运行确认失败。
- [x] 实现能力路由；知识技能仅影响有界检索顺序；记录 CAD 的独立真实执行结果。
- [x] 运行选择、检索、CAD 回归。

## 任务 2：候选验证及四项统计

文件：skills/testing.py、machine_testing.py、evolution.py、north_star.py；api/expert.py、skill_evolution.py；新领域测试模块。

接口：start_task(agent,name,values,actor) 返回真实持久测试凭据；确认请求 machine/task 二选一且模式由服务端决定。

- [x] 补任务验证、权限、版本、发布及不同验收口径测试，运行确认失败。
- [x] 实现领域测试与候选状态机路由，不接受 instruction_preview 为自动发布凭据。
- [x] 扩展可信验收采集，保留原诊断规则。
- [x] 运行针对性及完整 Agent 回归（完整结果存在 1 项本地原始版本类型基线失败，见结果报告）。

## 任务 3：专家中心与交付

文件：ExpertWorkspace.jsx、SkillEvolutionPanel.jsx、SkillNorthStarPanel.jsx、浏览器测试。

- [x] 补知识/CAD 测试输入和不会触发机器故障的浏览器测试，运行确认失败。
- [x] 根据能力显示样例验证或机器验证，北极星显示对应验收项。
- [x] 运行前端测试及构建，交付中文结果与恢复说明（实际报告页数据依赖测试另有 1 项失败）。

执行记录见 `output/multi-skill-evolution-implementation.md`。实施过程中保留了其它用户修改与本地人工发布，没有因两个现场/基线失败覆盖用户文件或放宽校验。
