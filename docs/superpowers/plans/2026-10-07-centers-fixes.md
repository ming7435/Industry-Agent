# 日志、报告、质检中心修复计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 修复检查报告确认的 8 项缺陷，并保留有针对性的回归测试。

**Architecture:** 保持现有 React 工作区与 Agent/Backend API 边界。对异步返回校验目标身份，轮询只保留一个在途请求；日志运行索引仅读取聚合所需字段，完整轨迹按选中链路读取。报告明确展示业务字段与完整性；申诉使用当前待处理记录。

**Tech Stack:** React 18、原生 Node 测试、Playwright、Python/pytest、MySQL JSON、隔离 SQLite。

**Spec:** `.runtime/verification/center-audit/inspection-report.md` 的 8 项确认问题；用户已授权修复。

## Global Constraints

- 保留当前工作区已有修改；不提交、回滚或覆盖其他任务的改动。
- 不读取密钥，不向在线服务执行质检、放行、报告生成/删除或其他业务写入。
- 原来的检查脚本保留；新的回归测试断言正确行为，先验证失败再修复。
- 不增加业务 Agent，不更改质检放行证据门禁，不伪造阶段完成。
- 前端构建更新现有 `frontend/monitor`，服务端修改是否已加载须单独确认。

## Review Focus

- 旧请求在目标切换或卸载后返回：不能替换当前目标。
- 刷新慢于轮询间隔或读取失败：不能堆积请求，也不能显示另一条记录。
- Runtime 已阻塞与 Agent 尚未结束：状态与实际控制流一致。
- 报告包含历史封装、空反馈与不完整内容：按真实字段展示。
- 多次申诉及明确的已结束申诉 ID：只操作当前待处理申诉，保留防重复处理规则。

### Task 1: 日志运行索引、生命周期与异步安全（主实现者）

**Files:** `app/harness/{trace,trace_store,runs}.py`、`app/api/server.py`、`frontend/monitor-react/src/app/App.jsx`、对应 Python/浏览器回归测试。

**Interfaces:** `TraceRecorder.list_run_index(limit)` 返回适合 `build_run_records` 的轻量事件；存储同名方法在 SQL 中裁剪 JSON。原完整 `list()` 契约不变。

- [x] 添加阶段子工具完成、Runtime 阻塞、重试/后续事件、索引轻量字段和慢轮询/详情切换回归；验证失败。
- [x] 实现轻量索引读取与真实终态聚合；阶段完成以 Agent/节点负责人终态为准。
- [x] 将日志刷新改为完成后调度并保护在途请求；详情与 Agent 展示绑定选中 run。
- [x] 验证专项测试与真实 React 组件交互。

### Task 2: 报告展示、完整性、PDF 归属（报告辅助实现者 + 主实现者）

**Files:** `reportView.mjs`、`reportView.test.mjs`；`App.jsx` 仅主实现者修改。

**Interfaces:** 保留 `buildReportDisplaySections(sections)`；新增 `reportCompleteness(report)` 返回 `{label,tone,findings}`。工单兼容 `workorder.workorder` 封装，反馈兼容工单内层。

- [x] 补工单真实字段、嵌套反馈、空数据、完整性判定回归并验证失败。
- [x] 实现字段映射和完整性辅助函数；保留现有章节结构。
- [x] 主实现者在列表/正文展示完整性，PDF 就绪状态按报告 ID 保存，轮询校正选中 ID。
- [x] 验证两个 PDF 竞态与不完整报告信息可见。

### Task 3: 质检目标保护与重复申诉（申诉辅助实现者 + 主实现者）

**Files:** `qualityWorkspace.mjs`、对应 Node 测试、两服务申诉方法及测试；`App.jsx` 仅主实现者修改。

**Interfaces:** 新增 `pendingQualityAppealId(record)` 返回唯一待处理申诉 ID 或空串；`runQualityAction(resolve_appeal)` 保留显式 ID。两后端空 ID 选择当前 pending 申诉；显式已结束 ID 继续拒绝。

- [x] 添加二次申诉的两后端回归与 pending ID 前端测试，验证失败。
- [x] 修复待处理申诉选择，不修改放行规则。
- [x] 主实现者将质检检测、操作与历史刷新绑定目标世代，丢弃过期成功/错误/刷新；页面传选中 QC 的 pending 申诉 ID。
- [x] 验证真实组件目标切换不会串结果，申诉闭环可重复处理。

### Task 4: 集成验证与交付（主实现者）

- [x] 运行相关前端测试、两服务完整 pytest 套件及隔离浏览器测试。
- [x] 构建前端，验证已运行页面；如需重新加载服务，在确认启动方式后操作。
- [x] 审阅最终差异，记录验证结果和未加载的运行态限制。
