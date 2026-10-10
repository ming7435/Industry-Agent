# 专家中心实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 左侧知识资产增加专家中心，优先维护有内部循环的 Agent Skill 中文 Markdown。

**Architecture:** 复用现有 Skill 注册表和维修小组身份。有效维修人员账号可更新技能目标、版本和正文；工具权限、步骤、名称及触发条件保持不变。源码原子写入、旧版本备份、版本冲突检查；下次加载生效。

**Tech Stack:** FastAPI、Python、Markdown/YAML、React、现有 Monitor 同源代理。

**Spec:** 本次用户请求和本会话已说明的范围。

## Global Constraints

- 当前本地工作目录实施；保留已有修改，不创建新工作树、不提交、不改配置或密钥。
- 不调用模型、真实设备及生产数据库做测试；临时目录和测试身份提供者隔离验证。
- 网页只维护现有 Skill，不新增工具、修改执行权限或替代业务门禁。
- 本轮按用户此前“不再询问、连续修改”的指令直接实施。

## Review Focus

- 登录身份变更不能把旧响应或草稿误保存到新账号。
- 并发修改和外部文件变化不能静默覆盖。
- 路径或符号链接不能写到技能目录以外。
- 中文文档保存后，下次真实加载必须消费更新；历史任务不重新执行。
- 写入失败保留旧文件，备份和更新审计能够恢复。

### Task 1: Skill 管理接口和热加载

**Files:** `app/skills/management.py`、`app/skills/registry.py`、`app/api/expert.py`、`app/api/server.py`，对应 Agent 服务测试。

**Interfaces:** GET `/api/expert/skills?loop_only=true`、GET/POST `/api/expert/skills/{agent}/{name}`。POST 包含 expected_revision、goal、version、document、reason；拒绝其它字段。

- [x] 先测试真实 API 缺失返回 404、缓存不能更新及正文未进入诊断上下文。
- [x] 加入受控更新、会话权限、同源校验、文件备份、原子替换和审计。
- [x] 注册表检测文件变化并重载；诊断加载正文，保持原工具校验。
- [x] 测试未登录/越权、冲突、元数据保留、备份、两注册表更新可见和失败不覆盖。

### Task 2: 网页和同源代理

**Files:** `ExpertWorkspace.jsx`、`expert.css`、`WorkbenchShell.jsx`、`App.jsx`、`teamSession.mjs`、`monitor_web_server.py`，浏览器/代理测试。

**Interfaces:** 使用 Task 1 API；默认只显示诊断、知识检索和 CAD，支持显示其它技能。复用现有有效维修账号编辑，未知身份只读，未登录不可读取。

- [x] 先测试实际 App 无专家中心入口、刷新/版本冲突和账号边界。
- [x] 加入中文纵向列表和正文编辑器，显示目标、版本、修改说明、受控工具和流程只读信息。
- [x] 加入代理白名单、正文大小及同源边界，加入会话失效处理。
- [x] 浏览器验证完整保存请求、错误草稿保留、只读身份、刷新及导航。

### Task 3: 回归和交付

- [x] 针对性回归、Agent 测试、前端单元测试与当前源码构建。针对性143通过，完整Agent71失败已如实记录，不能称整个项目通过。
- [x] 独立代码审查并验证发现的问题。
- [x] 文档记录实际测试、备份恢复、权限、生效边界和未验证项。

## 执行记录

- 实施前备份：`.local-backups/expert-center-20261010-102254`，仅七个将修改的源码文件，不含配置。
- 裁定：本次不创建工作树或提交，遵循用户只修改当前本地已有代码并保留修改的要求。
- 初始假设为监督账号编辑；代码核实后发现 Backend 注册、登录和会话解析均只支持 technician。裁定：专家中心复用当前有效维修账号编辑，兼容 supervisor，但不引入新账号体系、不改变 Backend 身份或任何设备、审批权限；操作留修订审计。已向用户说明。
- 独立审查：两个重要问题为冲突刷新缺少新版对照、切换中心丢失草稿；均补了先失败后通过的浏览器用例。文件快照问题因影响并发修订正确性按重要问题修复。
