# 日志折叠与系统运行监控交付说明

日期：2026-10-15。修改范围：现有日志工作区、只读性能接口、模型网关用量采集及相应测试。

## 页面变化

- 日志系统顶部新增“系统运行监控”，位于运行记录上方。
- 运行记录、执行明细默认折叠；选择某条运行会展开对应执行明细。
- 保留原有 Agent、Tool、Skill、原始证据、返回体、经验总结及筛选功能，不删除历史数据。
- 完整 Trace 按需读取：取消全局后台完整 Trace 预取，目录及工单版本缓存继续复用。
- 监控每 5 秒只读刷新，可选择最近 5 分钟、15 分钟、1 小时；离开日志页暂停监控轮询。

新增可见指标：输入/输出/总 Token、已报告 Token 每分钟、模型调用量、请求吞吐、平均响应时间、95 分位耗时、错误数、当前在途数、调用成功率、分钟调用趋势、Agent/工具终态回执数量、进程启动和更新时间。展开“统计口径与调用分类”可查看对话、向量、重排、视觉分类。

## 数据来源与统计边界

```text
真实提供方回执 → ModelGateway → 有界性能计数器
                                     ↓ GET /internal/metrics
已有 Trace 轻量索引 → Agent GET /api/runtime/metrics
                                     ↓ Monitor 精确只读代理
                                日志页运行监控
```

模型统计以一次网关调用为单位，含其内部等待及重试耗时，不将供应商内部重试重复计算为多次网关调用，也不能替代供应商账单。成功率是已结束调用的技术成功比例，不是维修完成率、质检合格率或模型答案正确率。

总吞吐为窗口内完成请求数除以已观测时长后折算为每分钟；观测时长至少按 1 秒计算。Token 吞吐只计算已报告部分，不等同于模型生成阶段的每秒输出速度。未采集首字延迟，不以总耗时冒充首字延迟。

Token 取提供方 `usage` 的有效非负整数；输入、输出都已报告时可求和，缺项不通过字符数估算。没有用量回执显示“未采集”，真实零值仍显示 0，并单列已报告/未报告调用数。测试模式调用单独计数，不混入真实用量。

计数器最多保留 20,000 条轻量回执，不保存提示词、回答、用户标识、模型密钥或错误正文。超过容量明确显示部分统计。它是当前 Model 服务进程的内存观测，重启清零、不同进程不自动合并，页面显示启动时间；本次没有新增数据库或迁移业务数据，不使用 SQLite，也不改动已有 Redis/MySQL/Milvus 数据。

Agent/工具统计使用最近 5,000 条轻量 Trace 索引，按调用编号去重，只统计所选窗口内的结束回执，包括超时；不将开始、结束和中间事件重复当成多次调用。达到样本上限或存储异常时明确提示非全量。工具原始 `execution_time` 为秒，汇总时换算为毫秒。模型、Agent、工具三种数量不相加。

## 实际代码

- `frontend/monitor-react/src/app/RuntimeMonitor.jsx`、`runtimeMonitor.css`：监控展示、范围选择、轮询及折叠样式。
- `frontend/monitor-react/src/app/App.jsx`：日志两区域默认折叠、详情按需加载，原统计移动到相应折叠区域。
- `frontend/monitor-react/src/app/workspaceReads.mjs`：移除完整 Trace 全局预取，保留其他既有缓存行为。
- `services/model-service/app/metrics.py`：有界、并发安全的进程内指标计算。
- `services/model-service/app/providers/gateway.py`：在真实调用边界记录开始、结束、用量和耗时，不在网络调用期间持有计数器锁。
- `services/model-service/app/main.py`：只读 `/internal/metrics`，无模型探测。
- `services/agent-service/app/api/runtime_metrics.py`：读取模型汇总、计算 Trace 回执统计、失败脱敏。
- `services/agent-service/app/api/server.py`：新增 `/api/runtime/metrics`、`/api/v1/runtime/metrics`，继续沿用既有 GET 鉴权。
- `services/agent-service/app/harness/runs.py`：轻量索引补齐调用编号和耗时字段，不读取大正文。
- `services/agent-service/monitor_web_server.py`：仅精确代理上述监控路径，拒绝监控写入，不开放模型生成端点。
- 新增模型、Agent、代理及浏览器监控回归；原日志测试改为显式展开后继续检查原证据及行为，没有删除失败测试或放宽原等待标准。
- `frontend/monitor/`：从当前 React 源码构建，未手工修改压缩后的 assets。

## 验证结果

测试先复现缺失功能，再实施。复核发现并验证修复了三项边界：超时回执漏计、全局 Trace 预取绕过折叠、工具耗时字段单位不一致。

| 实际验证 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| Model 全量：`L:/anaconda/python.exe -m pytest -c pytest-model.ini -q` | 34 | 0 | 0 |
| Agent 监控、代理与 Trace 定向回归 | 21 | 0 | 0 |
| 前端全部单元测试：Node 测试发现 `frontend/monitor-react/src/**/*.test.mjs` | 295 | 0 | 0 |
| 最终受影响日志浏览器回归（12 个文件） | 35 | 0 | 0 |
| Agent 全量：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini -q` | 2647 | 1 | 3 |
| 完整浏览器回归：Node 发现 `tests/browser/*.test.mjs`，并发 2 | 341 | 5 | 0 |
| 完整浏览器失败文件的串行复查（3 个文件） | 19 | 1 | 0 |

这些测试存在包含关系，不能简单相加。Agent 全量启动后增加的 HTTP 契约/代理用例另由最终定向回归覆盖，不将未被当次收集的新增测试计入该全量数字。

完整回归不是全绿，保留以下事实：

1. Agent 失败为 `test_skill_standardization.py::test_each_document_loads_without_changing_runtime_contract[diagnosis-alarm_diagnosis_skill]`，现有技能为 1.1，旧标准化基线为 1.0；单独复跑仍失败。本次没有修改该技能、回退其版本或改基线。
2. 浏览器全量三项 `inspection-dispatch.test.mjs` 导航超过原有 3 秒限制；同样标准下串行复跑全部通过，没有延长其等待标准。
3. 浏览器全量的一项原日志可见性测试尚未显式展开；补上真实用户展开动作后，最终日志 35 项全部通过，原证据断言仍保留。
4. 剩余 `online-device-dispatch.test.mjs:60` 的“人员等待 → 已自动派单”轮询超时，串行复跑仍失败。该问题在 `docs/workorder-loading-fix-20261014.md` 中已有记录，未在此次日志监控修改中处理，也未伪称通过。
5. Agent 三项原跳过：一项 Windows 符号链接权限、两项需显式开启的真实 FreeCAD 验收。未扩大跳过范围。

主要证据日志在 `.runtime/verification/`：

- `runtime-monitor-model-20261015.log`
- `runtime-monitor-agent-20261015.log`
- `runtime-monitor-agent-targeted-final-20261015.log`
- `runtime-monitor-contract-20261015.log`
- `runtime-monitor-frontend-unit-final-20261015.log`
- `runtime-monitor-logs-final-20261015.log`
- `runtime-monitor-browser-full-final-20261015.log`
- `runtime-monitor-browser-recheck-20261015.log`
- `runtime-monitor-build-final-20261015.log`

Vite 构建成功，仍有既有三维依赖块超过 500 kB 的警告，未通过调高阈值隐藏警告。

## 当前本机只读检查

`http://127.0.0.1:8001/?view=logs` 已提供当前构建。实际 GET 监控接口返回 200，模型和 Agent 统计均可用，并已有真实用量回执。

在当前页面进行只读浏览器检查：两区均折叠、真实指标可见、无页面异常、无业务写请求。已查看桌面截图和 390 像素窄屏缺失数据状态，未发现横向溢出；独立测试还验证了时间范围更新、展开明细及离开页面停止轮询。

截图：`.runtime/verification/runtime-monitor-live-20261015.png`、`runtime-monitor-desktop-20261015.png`、`runtime-monitor-mobile-20261015.png`。隔离测试截图使用明确测试夹具，不能作为生产效果或收费账单依据；live 截图来自当前本机真实 GET 数据，仅代表截图时刻。

本次没有主动调用收费模型生成、启动/停止机器、重启或部署服务，也没有删除数据库或修改密钥配置。内置浏览器面板打开工具当前返回请求错误，已使用本机只读浏览器完成实际检查，未因此发布或转存到外部站点。

## 配置、备份与恢复

不新增环境变量或依赖，继续读取现有 `MODEL_SERVICE_BASE_URL`。共享 `.env` 与 RAG 评测 runner 的保护哈希一致。检查期间发现 `skills/north_star.py` 有非本次修改，未覆盖或回退；本次未编辑北极星代码。

修改前现有源码及相关测试已备份到 `.local-backups/runtime-monitor-20261015-v1/`，保留相对路径，不包含密钥文件。需要撤回时，先确认后续人工修改没有与备份重叠，再逐个将备份文件复制回对应源码路径；新增模块可保留归档，最后重新构建前端。例如：

```powershell
Copy-Item -LiteralPath 'L:/industry_agent/.local-backups/runtime-monitor-20261015-v1/frontend/monitor-react/src/app/App.jsx' `
  -Destination 'L:/industry_agent/frontend/monitor-react/src/app/App.jsx'
# 对其余需要恢复的已修改源码逐个执行对应复制，再从 frontend/monitor-react 构建。
```

不要整体覆盖当前工作区，也不要为撤回监控功能删除 MySQL、Redis、Milvus 或 CAD 数据。此次没有数据库迁移。
