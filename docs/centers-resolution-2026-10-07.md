# 日志、报告、质检中心问题解决报告

日期：2026-10-07。范围：原三中心问题、复测发现的 Memory 日志回归，以及让后端实际加载修复。按用户要求，不处理 CAD 环境。

**结论：本次发现的三中心问题已修复并生效。** 后端已重启，前端已重新构建；新页面的真实只读复查全部通过。

## 已完成的修复

原八项修复保留：质检切换目标后丢弃旧响应、日志轮询与轻量索引、日志详情切换、Runtime/阶段终态、报告字段映射、报告缺失原因、PDF 状态绑定、重复申诉选择。详见 [原修复记录](centers-fix-report.md)。

本轮修复 `services/agent-service/app/harness/runs.py`：独立检索按 Trace 收集完整生命周期，缺少 Trace 才使用 Task；根据根 Memory/Knowledge 调用判断终态。子 Agent 完成、旧尝试晚返回、其他 Trace 复用 Task 均不能错误结束或污染当前运行。故障和质检中的检索仍属于原业务运行。

新增 `services/agent-service/tests/test_memory_retrieval_runs.py`，包含 22 项回归；实际数据库记录也完成了只读比对。

实际页面验证还发现前端 `traceLog.mjs` 对 RAG 详情仍逐条匹配关键词，导致返回的 12 条 Memory 事件全部被过滤。现已同步按选中运行的 Trace 身份保留完整详情，缺 Trace 时使用 Task，并阻止其他 Trace 复用 Task 串入。新增 6 项前端边界测试及 1 项真实组件浏览器回归；页面可展示 Memory 负责人及完整事件。

## 在线结果与生效状态

2026-10-07 13:40 左右，已通过原 `scripts/start_all.py` 统一恢复相关应用。新监督器 PID 33292，Agent PID 43860，Backend PID 29756，Monitor PID 36944。重启前诊断队列为 0；独立 Factory PID 20144 保持原创建时间，持久存储未清空。没有修改 CAD 配置或安装依赖。

新 8010 接口及 8001 页面代理均已实测：

- 8 条历史 Memory 检索都显示真实终态，不再停留在 running：7 条 error，1 条 completed。失败的七条各保留 12 个事件，成功的一条保留 20 个事件。
- 7 条历史故障均为 blocked，并保留 `replan_limit_exceeded`。
- 两条访问路径核验的 15 个历史 run ID 全部通过；新响应包含 `storage_warning`，值为空。
- 报告列表和质检历史 GET 返回 HTTP 200；Backend 健康结果为 ready、MySQLRepository。当前前端 JS/CSS 均可访问。

前端重新构建成功，新页面资源为 `index-CbDgPkq4.js`、`index-Dtj1Su68.css`，刷新页面即可加载。

**历史数据说明：** 上一轮保存的 12 事件诊断样本省略了 `output`，所以回放中的 completed 只能验证生命周期归组，不能证明真实业务成功。本轮直接核对完整 Trace、MySQL 轻量索引和负责人 `output.success`：三者一致，失败应显示 error。代表记录在修复前为 running / 8 事件，修复后为 error / 12 事件。这不是新增检索失败，也没有把失败历史改为成功。

## 验证

| 本轮检查 | 结果 |
| --- | --- |
| Agent 完整非 CAD 测试 | 795 通过，63.88 秒，退出码 0 |
| 日志专项：原 46 项、新 22 项、旧保存样本 2 项 | 70 通过，退出码 0 |
| 独立归组与父子调用边界 | 14 通过 |
| 保留真实业务输出的数据库投影回放 | 2 通过 |
| 前端 Node 测试 | 102 通过，退出码 0 |
| 真实 React 组件浏览器回归 | 8 通过，含新增 Memory 完整详情回归 |
| 前端生产构建 | 成功，退出码 0 |
| 8010 直接接口与 8001 代理 | 各 15 个历史运行断言通过 |
| 健康、报告、质检和存储信息 GET | 8 个请求通过 |
| 8001 新构建页面真实数据复查 | 日志、报告、质检 3/3 通过，0 JavaScript 异常 |

真实页面复查中，日志选中 Memory 返回 12 条记录，页面事件总数为 12，负责人明细可见；报告显示 14 份，抽查不完整报告的 3 条缺失原因及实际工单；质检显示 28 条历史及 2 条整改任务。浏览器没有模拟这些 GET 响应；自动 POST 经验搜索在发送前中止，未点击检测、放行、申诉或 PDF 生成按钮，因此本轮在线页面复查不代表实际业务写入验收。相应交互由隔离回归覆盖。

非 CAD 命令：

```powershell
L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q --ignore-glob='*test_cad*'
```

前一轮已经通过的补充浏览器交互、Backend 81 项及质检专项结果保留在 [复测报告](centers-test-report-2026-10-07.md)。本轮未再次修改申诉、放行和检测业务代码；这些写入回归仍在隔离测试环境执行，在线检查只读。

## 证据

目录：`.runtime/verification/centers-resolution-20261007/`。

- `logs-result.md`、`logs-green-meta.json`、`logs-green-output.txt`：修复与专项测试。
- `agent-non-cad-meta.json`、`agent-non-cad-output.log`：795 项完整结果。
- `memory-independent-review.md`：独立复核。
- `logs-live-memory-diagnosis.json`、`logs-memory-actual-index-events.json`、`logs-memory-expected.json`：数据库实际业务结果及完整轻量事件。
- `restart-before.json`、`restart-launched.json`、`restart-after.json`：进程身份与重启证据。
- `live-verification.json`：实际接口、历史终态及静态资源核验。
- `frontend-node-final.log`、`browser-regressions-final.log`、`frontend-build-final.log`：当前前端回归及构建。
- `static-assets-final.json`：新构建 JS/CSS 的实际 HTTP 200 结果。
- `live-browser/after-detail-fix/live-result.md`、`live-centers-readonly.json` 及截图：新构建三个页面通过结果。首轮详情为空的失败证据保留于上一级目录。

工作区中其他维护任务的改动已保留；本轮未提交 Git。CAD 环境未纳入本轮解决与测试结论。
