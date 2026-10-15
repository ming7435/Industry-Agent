# 全技能优化实施清单

> 当前会话本地实施，使用测试驱动与连续执行；不自动提交、部署或覆盖用户修改。

**Goal:** 全部已注册技能可进入受控优化、审核、验证、发布。

**Architecture:** 保留三个专用模式，为原固定流程技能增加只读 review_flow 核查和真实日志边界。审批与业务判定不由模型修改。

**Tech Stack:** Python、Pydantic、LangGraph、React、pytest、Playwright。

**Spec:** ../specs/2026-10-13-all-skill-evolution-design.md

## 全局约束

- 2026-10-14 已取消每周全局份数上限；仍须人工审核、测试、发布。
- 不读写生产配置、密钥或设备；不删除数据。
- 核查完成不算主业务成功；review_flow 不代表整链验收。
- 首次发布前不新增固定流程模型请求；每 Agent 至多一次有界核查。

## 复核重点

1. 全部实际注册技能可以生成候选，但未知 Agent、未知技能不能冒用。
2. 模型返回不存在路径、凭据路径、编造数值、passed 或工具调用须拒绝。
3. 核查不得改变原业务结果或重复执行业务工具。
4. 并发发布、依赖变化、服务重启和其它人凭据不能绕过门禁。
5. 页面切换技能不得混用样例或误触发设备验证。

## 任务 1：全技能能力及核查边界

文件：optimization.py、loop.py、review.py、agents/base.py；新增 test_all_skill_evolution.py。

接口：review_skills(definitions,input,output,client) 返回仅含服务器事实/缺项的核查结果；运行边界只消费已发布追加规则。

- [x] 补全目录、候选、实际核查、副作用隔离和非法模型输出测试，先看到失败。
- [x] 增加 review_flow 能力与冻结定义的结果边界，保留业务门禁。
- [x] 运行针对性回归。

## 任务 2：验证与北极星

文件：task_testing.py、testing.py、machine_testing.py、evolution.py、north_star.py；领域 API 测试。

接口：任务样例增加 input/output/expected_highlights/expected_missing，真实核查函数和服务端回执控制发布。

- [x] 测试审核→核查→等待人工发布、失败不能发布及指标归属。
- [x] 实现模式路由与严格样例约束。
- [x] 运行各技能及完整 Agent 回归，记录已有失败而不放宽断言。

## 任务 3：全部技能网页与交付

文件：ExpertWorkspace.jsx、SkillTaskSample.jsx、SkillEvolutionPanel.jsx、SkillNorthStarPanel.jsx；日志接入 traceLog.mjs、App.jsx。

- [x] 补 review_flow 页面输入及无机器请求测试，先看到失败。
- [x] 默认显示所有技能，展示对应验收口径。
- [x] 前端回归、隔离构建、中文结果及恢复说明。

## 交付结果

见 `output/all-skill-evolution-implementation.md`。专项 151 通过；Agent 全量 2443 通过、1 个既有版本格式失败、3 个环境跳过；前端单元 264 通过；专家中心浏览器 40 通过、日志补测 12 通过；整套浏览器 286 通过、1 个真实报告接口 502 失败。未自动部署或重启业务进程，不声称生产全链验收通过。
