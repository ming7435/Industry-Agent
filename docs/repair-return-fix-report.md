# 维修方案与工单返回 / 显示修复

实施日期：2026-10-04 定位与备份，2026-10-05 继续实现和回归。未提交 Git。前几节记录最初修复阶段（当时未重启）；最后追加节为主代理实际启动与最终验证，勿将历史实例状态当作当前状态。

## 现场结论

2026-10-04 只读 GET `http://127.0.0.1:8001/api/monitor/snapshot` 确认：TRAK-TC820LTYSI-001 的报警 700001 已有方案 `PLAN-06AB25A668`，诊断置信度 0.886、诊断 `evidence_status=ready`，但 `workorder_ready=false`，整体 `status=blocked`、`stop_reason=replan_limit_exceeded`。方案的真实阻塞项为：

- 涉及拆装或部件操作但缺少 CAD/BOM 依据。
- 备件型号缺少工程依据：TS-PT100-008 主轴温度传感器。
- 备件型号缺少工程依据：CP-TC820-015 冷却泵（按检查结果更换）。
- 备件库存为演示数据，不能作为正式派工依据。

因此当前没有自动工单是现有证据门禁的正常拒绝。修复不把这些方案改成就绪、不降低置信度要求、不生成假备件、不删除校验、不触发派单。

## 根因与修改

1. `MaintenancePlanWorkspace` 原先主要依赖受个人会话限制的 `/api/workorders`，只 mount 时读一次工单；未派工方案无法出现在独立列表，工单 401 被误表述成维修方案服务不可用。现在 GET `/api/maintenance/plans` 独立读取已有事件结果；前端合并实时快照、持久化事件方案、已授权工单的真实方案快照，5 秒刷新并提供手动刷新。个人工单错误独立显示，未登录时不请求个人工单列表。
2. `request` 原先只读取 `body.error`，FastAPI 的 `body.detail` 只显示为 401/403/422 状态码。现在提取字符串 detail 与验证列表的字段路径和消息，原有 error 响应仍兼容。
3. 工单系统存在废弃 `createOrder` POST 与“从当前故障创建工单”文案，服务却按设计拒绝人工创建。现在删除废弃创建函数、默认负责人及更新时无关的负责人字段，说明工单由系统验证后自动派发，并在当前没有可见工单时直接显示已有方案的 `workorder_ready`、原始 `validation_findings` 与 `stop_reason`。
4. 监控的 `compact_public_pipeline` 原先丢失维修方案 Evidence。现在保留 Evidence 和方案门禁字段，并为独立方案读取加入 `/api/maintenance/` 的现有认证代理路径。

新增接口只是既有数据的读取投影，不执行事件生产、诊断、收费模型、工单创建或控制操作。已有 GET 服务身份认证、个人工单权限、维修确认、验收和审批代码没有放宽。`maintenance/graph.py` 已存在的 diagnosis.raw 合并逻辑未改动。

## 文件与恢复

修改前逐文件备份到 `.runtime/backups/20261004-repair-return/`，恢复 SHA256 清单见同目录 `restore-manifest.md`。原有文件 5 个：

- `frontend/monitor-react/src/app/App.jsx`
- `services/agent-service/app/api/server.py`
- `services/agent-service/app/runtime/event_store.py`
- `services/agent-service/app/runtime/durable_store.py`
- `services/agent-service/monitor_web_server.py`

新增文件：`app/api/maintenance_plans.py`、`tests/test_maintenance_plan_returns.py`（均在 agent-service）、前端 `src/app/apiRequest.mjs`、`maintenanceWorkspace.mjs`、`maintenanceWorkspace.test.mjs`、`maintenanceWorkspaceUi.test.mjs`，及本文。没有备份任何密钥、配置或业务数据库。

## 失败复现与回归

先运行真实行为失败用例，再修改生产代码：

- Python 初始 6 失败：独立列表缺失返回 404；Evidence 被裁剪；代理无法路由；读取授权后的接口缺失；未派工方案无法读取与置信度门禁信息缺失。
- Node 初始 5 失败：真实 React 组件渲染无工单方案/其他设备方案不可见；空态误导创建；真实 request 丢失 401 detail、422 字段路径。新增读取辅助函数的 5 个契约用例也先断言缺失而失败。后续针对旧快照抢先、新报警工单阻塞原因缺失、已登录仍被提示登录的 3 个回归均先复现后修复。

验证使用 `L:/anaconda/python.exe` 和 `L:/nodejs/node.exe`，数据库来自 pytest 临时目录；跨服务代理测试使用本机临时 HTTP 端口；界面测试通过 esbuild 编译实际 App.jsx，再以真实 React 服务端渲染观察文本，未用源码 grep 断言代替行为。

- 针对性 Python：`-m pytest -c pytest-agent.ini services/agent-service/tests/test_maintenance_plan_returns.py -q`，6 通过。
- 前端：`--test src/*.test.mjs src/app/*.test.mjs`，37 通过、0 失败；其中维修专项 13 个。
- 完整 Agent 首次：`-m pytest -c pytest-agent.ini -q`，535 通过、55 失败、2 警告（186.57 秒）。53 失败来自主代理同时新增且当时仍处 RED 的 CAD 测试：`test_cad_manufacturing_api.py` 5 条、`test_cad_turning_program.py` 48 条；不属于维修修复。另 2 个既有失败为 `test_full_agent_runtime_e2e.py::test_full_evidence_driven_runtime_lifecycle` 与 `test_p0_p1_lifecycle_smoke.py::test_event_to_closed_case_smoke`，Windows 子进程默认编码与父进程 UTF-8 不一致，reader 解码 0xb8 失败，导致 stdout=None。
- 仅测试进程加 `PYTHONUTF8=1`、`PYTHONIOENCODING=utf-8` 后，上述 2 个生命周期测试 2 通过（4.22 秒）；没有修改启动配置或测试断言。
- Agent 既有全量（保留原有 CAD 测试，仅暂排除主代理新增且实施中的两个文件）：测试进程设 UTF-8 后，`-m pytest -c pytest-agent.ini -q --ignore=services/agent-service/tests/test_cad_manufacturing_api.py --ignore=services/agent-service/tests/test_cad_turning_program.py`，537 通过、0 失败、无警告（130.70 秒）。主代理完成 CAD 后仍需统一跑无排除全量和构建/启动验证。

## 依赖受阻与验证边界

只读查看 `.runtime/startup-20261004-184845.log`：第 644/671/713/727/760/771 行记录模型供应商 HTTP 402（余额不足）造成 RAG rerank 降级；第 776–779 行为 CAD `/tools/call` 503。上游 CAD/BOM 工程依据、正式库存数据和服务可用性仍需恢复，不能由展示修复代替。

未触发实际异常事件、工单更新、实际设备控制或生产数据库读取。本次没有重启服务或连接收费模型；外部目录、CAD 子模块、启动脚本和配置未修改。最终现场展示和构建重启由主代理统一验证。

## 2026-10-05 追加：CAD 虚拟生产代理 DNS rebinding 边界

独立审查确认一个与新增虚拟生产直接相关的缺陷：监控代理原先只比较 `Origin.netloc` 与 `Host`。恶意网站可用 `Host: evil.example:<当前端口>`、`Origin: http://evil.example:<当前端口>` 通过检查，代理随后附加服务令牌并转发 CAD manufacturing 的生产写请求。

此项仅修改 `services/agent-service/monitor_web_server.py`，新增 `services/agent-service/tests/test_monitor_cad_production_proxy.py`，不改其他已完成源码。只对 `/api/cad/designs/{id}/manufacturing` 写子树，在附加服务凭据、向上游发送之前验证：

- 连接 peer 是本机回环地址；单个 Host 只能为 localhost、127.0.0.1 或 [::1]，并使用当前监控服务器端口。
- 必须提供单个完整的 `http://<Host>` Origin；HTTPS、其他端口、路径、查询、片段、用户信息、缺失及重复来源均拒绝。
- 匹配路由前解析 URL 并解码路径，覆盖 percent-encoded manufacturing/designs 或分隔符，并覆盖 Starlette 末尾 `$` 匹配所接受的最终换行及 slash redirect 变体。
- 必须使用单个 ASCII 十进制 Content-Length；负值、非数字、重复长度、Transfer-Encoding、截断请求体均拒绝。生产 JSON 上限 1 MiB，读取期间单独设置 5 秒 socket 超时、finally 恢复原值，不改变既有 CAD 文件上传或其他路由读取路径。

原有其他路由的来源检查、服务身份/个人 Cookie 透传、上游认证与错误响应保持不变；GET 与非 manufacturing CAD 写路径保持原行为，原不支持的 PUT/PATCH 仍返回 501。该补丁没有取消生产审批、证据或工单门禁，也没有触发生产。

先使用两个本机随机临时 HTTP 端口、真实 MonitorRequestHandler 与计数上游复现 RED：恶意同源 Host dispatch 实际返回 200，计数上游收到 1 次附服务身份的写入（测试期望 403 和 0 次）。修改后为 403、0 次；合法本机同源仍为 200，并准确携带隔离的测试令牌与原请求体。完整请求作为单个字节包发送，避免 Windows 对分开发送 headers/body 的早期拒绝连接竞态；仍通过真实 HTTP 解析和代理，没有用模拟转发或源码断言代替。

专项和邻近回归：`L:/anaconda/python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_monitor_cad_production_proxy.py services/agent-service/tests/test_monitor_web_server.py services/agent-service/tests/test_monitor_team_proxy.py services/agent-service/tests/test_monitor_control_boundary.py services/agent-service/tests/test_monitor_auto_pause.py services/agent-service/tests/test_maintenance_plan_returns.py -q --tb=short`，测试进程设置 PYTHONUTF8=1、PYTHONIOENCODING=utf-8，**61 通过、0 失败（11.14 秒）**；其中新增真实 HTTP 边界用例 45 项，最终专项单独复跑 45 通过（3.53 秒）。只读加载本次接手备份再次执行恶意 Host 用例，仍得到 RED `(200, 1)`，未还原或改写工作区。主代理正在做统一全量回归，本任务不并发重复全量或重启。

独立只读安全复核发现初稿路径分类漏掉 `/manufacturing%0A`；本地 Uvicorn 对路径解码、Starlette 的终端 `$` 正则可接受最终换行，slash redirect 还可覆盖 `%0A/` 变体。两条真实临时代理测试先复现 200 和上游写入，再修正解码后的路径分类。最终测试先直接验证真实 Starlette matcher 接受该路径，随后验证恶意 Host 的代理拒绝，避免只测试不会匹配生产路由的编码样例。

最终追加慢/不完整正文用例：连接保持打开、声明 20 字节但只发送 2 字节，没有 EOF。先复现原读取持续等待到测试客户端超时，再仅对该读取加入 socket 超时。测试把 5 秒常量临时缩到 0.1 秒加速验证，结果为 400、上游零写入，并观测超时和合法读取后 socket 原超时都正确恢复。测试没有改正式配置。

同一轮独立只读复核给出最终 PASS，并独立重跑 45/45 专项。受审 monitor 源码 SHA256：`9295EA55A8693CF1AB6A0239830F08F814B8A7862B0E13C7F65E5A0F0119F3CE`。5 秒是 socket 等待超时，不是整个请求的总时限。

接手源码和已有报告额外备份到 `.runtime/backups/20261005-cad-proxy/`，SHA256 恢复清单见该目录 `restore-manifest.md`。此前 `.runtime/backups/20261004-repair-return/` 原始备份未覆盖。新备份仍不含密钥、配置或业务数据库。此次验证仅使用本机临时服务与隔离测试令牌，未修改正式服务/配置/设备。

## 2026-10-05 主代理继续：大历史库读取与最终启动验证

按用户要求先完成 3D 再测试全功能，确认端口空闲后已启动本地虚拟工厂及原项目启动器。新方案接口首次现场请求仍超过 30 秒，发现事件库约 4.6GB、79 条事件，最新一条约 49MB；原列表解码完整工具上下文是直接原因，不是方案没生成。

修改 `runtime/event_store.py`、新增 `runtime/event_plan_reader.py`、`api/server.py` 应用关闭钩子：专用只读连接，一次提取七类方案业务字段，最新记录先返回，后台逐条读取，请求有界等待并返回 loading/ready/failed；主库/WAL 或本地写入变化触发刷新。没有写事务、结构迁移或数据删除，不占 Durable 写锁；应用退出可中断读连接。

前端 `maintenanceWorkspace.mjs` 保留加载状态，`App.jsx` 初始状态为 loading，未完整读取时既不提示暂无方案，也不声称当前报警没有方案；读取失败明确呈现，而非吞掉错误。已有方案、证据和真实派发门禁仍保留。

新增测试调用实际 SQLite/API/React 组件：大上下文投影与读取状态先 2 失败 / 7 通过，前端辅助先 1 失败 / 6 通过，真实组件加载误报先 1 失败 / 7 通过；修改后 API 9、完整前端 51 通过。最终无排除 Agent 652 通过，Backend 35、RAG 48、Document-CAD 8、Model 5、Factory 68、跨服务业务/CAD 5 通过，Vite 构建成功。精确命令/日志和各环境阻塞见 `docs/cad-production-and-repair-delivery.md`，不将专项重复累计。

只读独立复核 API 9、辅助 7、组件 8 通过，16 次并发只创建一个 reader；外部 WAL 写入能刷新；执行中的 SQLite 关闭后线程和连接释放；新旧包装、diagnosis.raw 标记保留；无剩余 Critical/Important/Minor。历史读取为最终一致视图，不标记为交易级原子快照。

最终真实 8001 `/api/maintenance/plans` 为 200、51 个方案、history.ready、79/79 条事件完成，复查 113ms。无会话工单仍为 401，须人员登录；8050 CAD/BOM MySQL unavailable，正式库存依据不足仍会阻止自动派发。不能因为显示问题已修就取消证据/审批/验收/人员权限或制造假工单。

逐文件备份/恢复：`.runtime/backups/20261005-maintenance-read-stream/RESTORE.md`。未复制密钥或数据库，未修改生产配置，未向正式设备发送控制或工单命令。隔离回归通过不是生产验收通过。
