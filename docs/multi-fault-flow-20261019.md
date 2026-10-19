# 多故障诊断、维修方案与工单派发整改

日期：2026-10-19。仅以当前本地源码为依据，不访问 GitHub，不恢复 RabbitMQ。

## 业务如何运行

```text
监控确认故障（设备＋事件＋修订）
  → 一次 HTTP 提交＋只读进度回查
  → Runtime / Diagnosis Agent 诊断与取证
  → Knowledge / 必要的 CAD 工程依据
  → Maintenance Agent 生成本故障的维修方案
  → 置信度、维修必要性、资料与审批门禁
  → WorkOrder Agent / 后台已存方案派工器
  → 关联原故障、原方案和对应设备的维修人员
```

每个独立事件执行自己的真实 Runtime 循环，不借用其他事件的诊断、方案或工单。已有的低置信度复核、方案重规划和动作预算继续有效，没有增加新的 Agent 或 Skill。循环执行仍在 `app/runtime/coordinator.py`，不是在浏览器里调用模型。

“多个故障”包括不同设备的独立事件，以及同一设备先后发生的新事件、同事件的新修订。一个故障窗口内关联的多个传感器异常仍按现有监控规则汇总为事件证据，不把每个测量点机械拆成多张工单。本次不把模拟工厂单一 `alarm_code` 字段改造成 PLC 多报警协议，也不声称已经验收任意多根因的同时诊断准确率。

## 实际修复

| 文件 | 关键行为 |
| --- | --- |
| `services/agent-service/monitor_web_server.py` | 新增按事件跟踪活动任务与有界结果投影。同设备新故障到来后，旧任务仍可回查、保存结果；晚返回不能覆盖新任务。同一活动事件版本不会重复提交。保留原会话重置隔离、超时不确定状态与只读对账。精简方案响应保留设备、事件、修订和范围身份。 |
| `services/agent-service/app/workorder/saved_dispatch.py` | 单条方案的设备回读、人员目录或派工异常不再中断其他方案。错误日志只写方案/事件/设备标识及异常类型，不写原始敏感错误。下一轮先对账已有工单，不在异常点立即重试写操作。 |
| `frontend/monitor-react/src/app/diagnosisView.mjs` | 按设备列出可查看的故障事件；严格区分事件、修订和租户/项目；显式选择历史任务时只读展示对应诊断与方案/工单链接。兼容旧精简方案中的嵌套诊断归属。 |
| `frontend/monitor-react/src/app/App.jsx` | 智能诊断增加“查看故障任务”；默认继续跟随当前故障。任一事件阶段变化均可更新只读预取。修复方案 5 秒轮询与 5 秒缓存相撞导致延迟显示派单的问题，保留并发读取去重。 |
| `frontend/monitor-react/src/app/maintenanceWorkspace.mjs` | 较早事件已生成的方案也可进入列表，不只读取每台设备最后一个事件。原有删除标记、正式工单快照优先级、关联身份判断继续有效。 |
| 新增测试 | `services/agent-service/tests/test_multi_fault_flow.py`、`frontend/monitor-react/src/app/diagnosisTasks.test.mjs`、`tests/browser/multi-fault-diagnosis.test.mjs`。 |
| `frontend/monitor/` | 从当前 React 源码通过 Vite 构建，未手工修改打包资源。 |

本次使用测试驱动流程：先复现旧事件被丢弃、单条异常中断派工、缺失方案归属和历史选择等问题，再修改实现。页面轮询延迟由原有浏览器测试复现，修复后原测试直接通过，未删除或放宽断言。

### 防止串单和重复费用

- 活动事件按租户、设备、事件、修订区分；正式 API 原有持久化幂等与参数指纹校验保留。
- 只读切换、刷新方案/工单列表不运行 Agent，不产生新的模型生成请求。
- 同事件重复提交返回原有结果；变化参数需要正确修订，不能复用旧结果。
- 单个设备当前报警、过期回读、负责人登录状态仍需核对。后台派工器仍只自动处理设备最新未解除事件，不能因历史选择而重派旧故障。
- 既有明确审批要求继续阻止自动派发；本次没有修改全局审批风险分类或绕过审批。不把“有诊断”解释成“允许派单”。
- `maintenance_required=false`、证据不足、方案未通过等原有业务门禁继续生效；无真实负责人或库存依据时不编造数据。
- 事件页面投影最多保留 100 项；这不是业务记录保留策略。正式诊断结果、维修方案和工单仍由原持久化存储管理。

## 验证结果

| 范围 | 通过 | 失败 | 跳过 |
| --- | ---: | ---: | ---: |
| Agent、监控、方案、派工、审批相关回归，命令 A | 211 | 0 | 0 |
| 跨服务契约、事件修订、阶段进度、可选 CAD 和 API 鉴权，命令 B | 44 | 0 | 0 |
| 前端业务函数，命令 C | 99 | 0 | 0 |
| 真实浏览器组件/页面，命令 D | 25 | 0 | 0 |

共 379 项通过。本次真实 Runtime 集成用例在同一个容器、图、策略与存储中依次处理 M1/E1、M2/E2、M1/E3，检查三个独立诊断、三个不同方案及三个正确关联的工单；重复事件不重跑模型或建立新单。隔离的模型、知识、工程与人员适配器仅替换外部边界，没有替换被测业务函数。

Vite 最终构建退出码为 0；保留现有 500 kB 分包大小警告，没有调高告警阈值掩盖。所改跟踪文件的 `git diff --check` 通过。

开发阶段已观察并修复的失败：初始后端回归 5 失败/1 通过；补充方案设备身份断言后 1 失败/5 通过；新增前端导出尚不存在时导入失败；历史方案集合 1 失败/3 通过；旧精简响应兼容 1 失败/4 通过；浏览器首次有效运行 24 通过/1 失败，失败为原有方案轮询用例。最终上表所有对应测试均通过。首次未指定浏览器依赖路径时另有 2 项环境导入失败；改用本机已有 Playwright 和 Chrome 后正常执行，未安装或下载依赖。

### 实际命令

在项目根目录 PowerShell 执行：

```powershell
# A
L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_multi_fault_flow.py services/agent-service/tests/test_saved_plan_workorder_dispatch.py services/agent-service/tests/test_diagnosis_result_recovery.py services/agent-service/tests/test_monitor_web_server.py services/agent-service/tests/test_monitor_auto_pause.py services/agent-service/tests/test_monitor_control_boundary.py services/agent-service/tests/test_monitor_restart_incident.py services/agent-service/tests/test_maintenance_fault_dispatch.py services/agent-service/tests/test_maintenance_inventory_identity.py services/agent-service/tests/test_interlock_plan_dispatch.py services/agent-service/tests/test_hydraulic_plan_dispatch.py services/agent-service/tests/test_hydraulic_runtime_policy.py services/agent-service/tests/test_warning_inspection_dispatch.py services/agent-service/tests/test_repair_only_workflow.py services/agent-service/tests/test_agent_loop_runtime.py services/agent-service/tests/test_direct_event_dispatch.py services/agent-service/tests/test_runtime_approval.py services/agent-service/tests/test_runtime_approval_api.py services/agent-service/tests/test_runtime_approval_resume.py -q --tb=short

# B
L:/anaconda/python.exe -m pytest -c pytest-agent.ini tests/integration/test_compose_environment_contract.py tests/integration/test_runtime_rag_cad_contract.py tests/integration/test_virtual_line_team_contract.py tests/integration/test_monitor_container_layout.py services/agent-service/tests/test_event_result_revision.py services/agent-service/tests/test_diagnosis_stage_progress.py services/agent-service/tests/test_optional_cad_dispatch.py services/agent-service/tests/test_api_auth.py -q --tb=short

# C
L:/nodejs/node.exe --test frontend/monitor-react/src/app/diagnosisTasks.test.mjs frontend/monitor-react/src/app/diagnosisView.test.mjs frontend/monitor-react/src/app/incidentIdentity.test.mjs frontend/monitor-react/src/app/maintenanceWorkspace.test.mjs frontend/monitor-react/src/app/maintenanceWorkspaceUi.test.mjs frontend/monitor-react/src/app/maintenanceOrderReads.test.mjs frontend/monitor-react/src/app/workspaceReads.test.mjs frontend/monitor-react/src/workorderDispatch.test.mjs frontend/monitor-react/src/workorderAlarm.test.mjs frontend/monitor-react/src/workorderSeparation.test.mjs

# D：只在本命令进程设置测试工具地址
$env:PLAYWRIGHT_MODULE_PATH='C:/Users/12587/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
$env:CHROME_EXECUTABLE='C:/Program Files/Google/Chrome/Application/chrome.exe'
L:/nodejs/node.exe --test tests/browser/multi-fault-diagnosis.test.mjs tests/browser/diagnosis-status.test.mjs tests/browser/maintenance-incident-link.test.mjs tests/browser/workorder-loading.test.mjs tests/browser/online-device-dispatch.test.mjs

Set-Location L:/industry_agent/frontend/monitor-react
L:/nodejs/node.exe node_modules/vite/bin/vite.js build
```

## 本地运行检查及未执行项

只读检查确认六个应用端口的健康/页面可访问，8001 的 `/api/monitor/snapshot` 已提供按事件结果字段，检查时无待返回诊断。没有为本次测试制造现场故障、写入正式业务记录、控制设备或调用收费模型。

本次未主动重启其他本地任务正在使用的统一启动进程，也未修改启动目录指针。React 构建已更新；运行中的进程不因文件变化自动重载，最后补充的精简方案身份字段在下次正常统一重载后加载，前端已兼容旧响应的嵌套归属。独立故障跟踪主体与后台派工异常隔离修改早于当前服务启动；快照中的新字段也已只读核实。

没有在本轮重新执行整个五服务全量测试；之前全量检查的 CAD/RAG 环境问题见 `docs/remove-rabbitmq-20261019.md`，不在本轮伪装为全项目通过。本轮离线回归不能等同生产验收、真实 PLC 多故障联调或真实模型诊断准确性验收。

## 配置、数据与恢复

- 没有修改 `.env`、供应商、模型、收费配置、数据库结构或持久化数据；无需数据迁移。不增加 SQLite 或消息中间件依赖。
- 修改前的五个源码文件及原前端构建已按相对路径备份到 `.local-backups/multi-fault-flow-20261019/`，不含密钥或数据库副本。
- 恢复前等待活动任务结束，对未知结果先对账。按相对路径将备份文件复制回对应源码位置；若后续已有其他人的修改，应先逐项比较，只恢复本次差异，不能批量覆盖。
- 前端优先恢复对应源码后重新执行构建；旧构建副本也保留在上述备份的 `frontend/monitor/` 中。恢复后按项目原统一启动流程重载应用，不需要删除任何数据库、幂等记录或数据卷。
- 新增的测试和本文可保留用于审计；不使用 `git reset --hard` 清理工作区。
