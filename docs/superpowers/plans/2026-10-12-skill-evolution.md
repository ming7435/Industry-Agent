# Skill自动优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans。用户已选择当前本地连续实施；不逐文件确认，不提交混合工作区，不部署。
**Goal:** 自动修改稿经人工确认后验证并发布。
**Architecture:** 基于现有日志、MySQLJsonStore CAS和MachineTrials/SkillManager建立独立自动优化协调器，不改业务Graph。
**Tech Stack:** Python/FastAPI、现有ModelService、MySQL JSON、React、pytest/浏览器隔离测试。
**Spec:** docs/superpowers/specs/2026-10-12-skill-evolution-design.md
## Global Constraints
仅追加业务判断规则，旧正文和元数据不删；确认后验证；原machine_flow发布门禁不降级；无SQLite候选库；无真实设备或收费模型测试；已有修改先备份并保留。
## Review Focus
1. 并发确认和重启不能二次触发模拟故障（Task2）。
2. 发布后候选状态写失败不能盲目重写文件（Task2）。
3. 日志/模型中的伪造审批和密钥不能进入确认记录（Task1/3）。
4. 线上技能变化、会话撤销、测试数据不足必须停止发布（Task2/3）。
5. 退出、切换技能和迟到的响应不能显示前一身份修改稿（Task4）。
## Task 1: 自动规则生成与可信日志来源
Files: 新建app/skills/evolution.py、app/skills/evolution_sources.py、tests/test_skill_evolution.py。
Interfaces: source_records(trace,registry)->list; generate(source,current)->候选document/reason/rules，只有服务端来源。
- [ ] 写生成器/来源隔离回归，看到FAIL（功能缺失）。
- [ ] 实现单次模型调用、结果约束、保留正文/权限、来源身份/去重。
- [ ] targeted pytest通过；记录进度。
## Task 2: MySQL状态与确认-验证-发布
Files: 新建app/skills/evolution_store.py；扩展evolution.py；tests/test_skill_evolution.py。
Interfaces: store.get/values/get_or_create/compare_and_set；service.confirm(id,hash,machine,actor,resolve_actor)->record；advance(record)复用trials和publish。
- [ ] 写顺序、重复、失败、过期、会话和恢复回归并FAIL。
- [ ] 实现CAS、服务端确认、事务外验证、真实旧门禁、发布不确定对账。
- [ ] 全部新增回归通过；记录进度。
## Task 3: 自动后台工作与API
Files: 新建app/api/skill_evolution.py；修改app/api/expert.py、app/api/server.py；tests/test_skill_evolution_api.py。
Interfaces: build_evolution_router(manager,runtime,require_auth)；startup/start、shutdown/close；后台扫描和验证推进。
- [ ] 真实API覆盖身份/Origin/hash/非前端pass以及后台读取来源，先FAIL。
- [ ] 注入现有manager，增加生命周期和有限并发；无配置不影响原服务启动。
- [ ] 回归expert、trials、proxy与新API；记录进度。
## Task 4: 专家中心修改稿
Files: 新建frontend/monitor-react/src/app/SkillEvolutionPanel.jsx、skillEvolution.css；修改ExpertWorkspace.jsx；tests/browser/skill-evolution.test.mjs。
Interfaces: /api/expert/evolution候选列表/确认/拒绝，确认绑定同一hash和机器信息。
- [ ] 浏览器先验证“确认后才验证”，失败/过期不显示发布，退出迟到安全，看到FAIL。
- [ ] 添加独立区域，不重做原专家页面；正常状态轮询。
- [ ] 新旧浏览器回归和可复现构建通过。
## Task 5: 独立审查与最终交付
- [ ] 真实针对性与全量Agent回归；已知失败按名记录，不放宽断言。
- [ ] 一次独立只读整体审查；重要问题一次TDD修复轮。
- [ ] docs/skill-evolution.md记录使用方式、模型费用边界、备份恢复和未验证事项。

