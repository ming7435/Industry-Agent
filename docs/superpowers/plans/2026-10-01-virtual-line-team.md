# Virtual Line Maintenance Team Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在单条虚拟产线中实现五人维修小组注册登录、真实账号自动派工与催办、确认故障整线停机，以及经被派工人员确认和服务端核验后的整线复机。

**Architecture:** Backend 的 MySQL 是账号、会话、工单与控制事件的数据源；Agent 负责监控、派工决策、虚拟设备控制和复机门禁；现有 Monitor 同源入口提供必要的注册、登录、工单和监督界面。新增人机身份不能替代现有服务身份，任何前端提供的姓名或恢复样本都不能获得复机资格。

**Tech Stack:** Python、FastAPI、mysql-connector-python、pytest；React 18、Vite 5、Node.js 20+；现有虚拟工厂 HTTP API。

**Spec:** `docs/superpowers/specs/2026-09-30-virtual-line-team-design.md`

## Global Constraints

- 当前只有一条**虚拟**产线；不得接入真实 PLC，也不得在测试中调用真实设备。
- 五个席位：`1 supervisor + 4 technician`；注册身份由用户选择，维修人员需选择真实设备 ID。
- 设备归属只提供派工优先级；首选无法接单时选择同组未完成工单最少的维修人员。
- 监督人只查看和站内催办；仅登录且被派工的维修人员可确认其工单。
- Backend 账号、会话、工单、控制事件持久化于 MySQL；SQLite 仅供隔离测试。
- 停机为故障触发的最佳努力操作；复机遇身份、数据或设备状态不确定时必须失败关闭。
- 数据库只做增量迁移；原有工单及其他服务功能保留；不在产品接口混入演示技师。
- 不猜测工业阈值；复机快照使用现有 `RECOVERY_MAX_AGE_SECONDS` 配置。
- 每项先写真实函数/API 的失败测试，再实施并回归；不把离线测试写成生产验收。

## Review Focus

以下五类输入容易在正常路径之外破坏功能；每项在对应任务中有指定测试。

1. 最后一个角色席位被并发注册：Task 1 应只有一次成功，另一请求返回冲突。
2. 大小写或 Unicode 等价用户名重复：Task 1 应拒绝重复，不能生成两个可登录身份。
3. 过期会话或伪造角色、确认人字段：Task 3 应返回 401/403，不能写维修确认。
4. 设备控制超时后结果不明：Task 4 应先读回状态，不盲目重发控制命令。
5. 复机过程中出现新故障：Task 5 应中止启动、回停已启动设备，不报告正常运行。

---

## File map and boundaries

- Backend `app/team/{repository,service,routes,device_catalog}.py`：账号与会话持久化、席位约束、注册设备校验、站内催办；`app/main.py` 只挂载路由与保护内部端点。
- Backend `app/workorder/service.py`：用真实维修人员查询与工作量替代正式派工中的固定技师；验证派工对象。
- Backend `app/line_control/{repository,routes}.py`：故障事件、逐设备控制结果与整线状态的持久记录；对 Agent 提供内部对账接口。
- Agent `app/clients/backend.py` 与 `app/mcp/client.py`：Backend 专用服务凭证、会话校验及控制事件调用；`app/api/team_auth.py`：人工工单动作的身份依赖。
- Agent `app/monitor/line_control.py`：停机/复机状态机和虚拟工厂读写；`app/monitor/control_policy.py`：确认故障与预警的分界；`monitor_web_server.py`：非阻塞触发及同源代理。
- Agent `app/agents/workorder/agent.py`、`app/workorder/{service,validator}.py`、`app/runtime/operations.py`、`app/api/server.py`：真实候选人、可信完成确认及复机入口。
- Frontend `src/teamApi.mjs`、`src/TeamAccess.jsx`、`src/SupervisorQueue.jsx`、`src/app/App.jsx`、`src/workorderSheet.mjs`：最小注册登录、本人任务、监督催办和整线状态；不重做其他页面。
- 各服务测试分别在各自目录独立运行，避免五服务同名 `app` 包冲突；跨服务联调测试放在 `tests/integration/` 并以独立进程启动。

### Task 1: Backend 账号、席位与会话

**Files:**
- Create: `services/backend-service/app/team/__init__.py`, `repository.py`, `service.py`, `routes.py`, `device_catalog.py`
- Modify: `services/backend-service/app/main.py`
- Test: `services/backend-service/tests/test_team_auth.py`, `services/backend-service/tests/test_team_mysql_repository.py`

**Interfaces:**
- Produces: `TeamService.register(username: str, password: str, role: str, primary_device_id: str = "") -> dict[str, Any]`；`login(username: str, password: str) -> tuple[dict[str, Any], str]`；`resolve_session(token: str) -> dict[str, Any] | None`；`logout(token: str) -> None`。
- Produces: `POST /api/team/register`、`POST /api/team/login`、`POST /api/team/logout`、`GET /api/team/me`；公开响应永不包含密码哈希或会话哈希。
- Consumes: 虚拟工厂 `GET /api/devices` 的真实设备 ID；`BACKEND_STORAGE=sqlite` 和 `BACKEND_SQLITE_PATH` 为隔离测试，默认生产存储为 MySQL。

- [ ] **Step 1: 写失败测试。** `test_registration_caps_roles_atomically` 并发提交两个最后席位请求，断言仅一项 `201`；`test_equivalent_username_conflicts` 断言规范化后重复为 `409`；`test_password_hash_and_session` 断言数据库不含明文、错误密码为 `401`、注销后 `me` 为 `401`；`test_unknown_device_rejected` 断言虚构设备为 `422`。
- [ ] **Step 2: 证明失败。** 工作目录 `services/backend-service`：`python -m pytest tests/test_team_auth.py -q`；预期测试因路由/服务缺失失败。
- [ ] **Step 3: 实施最小实现。** `TeamRepository` 以每次操作独立连接和明确事务创建账号、会话、席位表；用户名 NFC+casefold 唯一；密码使用随机盐与 `hashlib.scrypt`，会话使用随机不透明令牌且仅存令牌摘要；`TeamService` 验证 1/4 席位和真实设备目录；Cookie 为 `HttpOnly; SameSite=Strict; Path=/`，HTTPS 时加 `Secure`。
- [ ] **Step 4: 运行定向测试。** 同 Step 2；预期全部 PASS，且原 `tests/test_workorder_api.py` 不出现新增失败。若提供专用 `TEAM_TEST_MYSQL_DSN`，运行 `python -m pytest tests/test_team_mysql_repository.py -q` 验证 MySQL 重连后账号保留；未提供时将这一项单独列为基础设施未验证，不计为业务通过。
- [ ] **Step 5: 只提交本任务文件。** `git add services/backend-service/app/team services/backend-service/app/main.py services/backend-service/tests/test_team_auth.py services/backend-service/tests/test_team_mysql_repository.py`；`git commit -m "feat: add maintenance team accounts and sessions"`。

### Task 2: 真实人员候选、工作量与监督催办

**Files:**
- Modify: `services/backend-service/app/workorder/service.py`, `services/backend-service/app/team/{repository,service,routes}.py`
- Modify: `services/agent-service/app/agents/workorder/agent.py`
- Test: `services/backend-service/tests/test_team_dispatch.py`, `services/agent-service/tests/test_team_dispatch.py`

**Interfaces:**
- Consumes: Task 1 的账号 ID、角色与设备归属。
- Produces: `BackendBusinessService.__init__(repository: Any | None = None, team_service: TeamService | None = None) -> None`；`query_technicians(device_id: str = "", **kwargs: Any) -> dict[str, Any]`，每项至少有 `technician_id`、`name`、`primary_device_id`、`workload`、`available`，且不含 `synthetic=True`；`TeamService.create_reminder(workorder_id: str, actor_id: str, recipient_id: str, text: str) -> dict[str, Any]`。
- Produces: `GET/POST /api/team/reminders`；Agent 的 `rank_candidates(...)` 按负责设备优先、未完成工单数、稳定账号 ID 排序。

- [ ] **Step 1: 写失败测试。** `test_query_technicians_uses_registered_accounts_only` 断言无注册人员时 `items=[]`，监督人不在候选；`test_dispatch_prefers_device_then_least_workload` 断言首选不可接单时选其他维修人员；`test_reminder_supervisor_only` 断言维修人员催办为 `403`、催办仅关联指定工单；`test_removed_device_assignment_falls_back` 断言旧设备备注不污染新设备派工。
- [ ] **Step 2: 证明失败。** 分别在 Backend/Agent 服务目录运行 `python -m pytest tests/test_team_dispatch.py -q`；预期因固定技师或缺失催办失败。
- [ ] **Step 3: 实施最小实现。** Backend 按账号表和未完成工单计算候选/工作量并验证 `assign_workorder` 目标；Agent 改排序，但只使用 Backend 返回的真实人员字段；原本的演示适配器继续仅用于显式测试，正式派工不查询其固定名单。站内催办按会话身份写入 MySQL。
- [ ] **Step 4: 运行两服务定向及既有派工回归。** 预期真实候选与催办测试 PASS；若旧测试隐含固定技师，改为显式注册测试账号或显式演示适配器，不降低断言。
- [ ] **Step 5: 只提交本任务文件。** `git add services/backend-service/app services/backend-service/tests/test_team_dispatch.py services/agent-service/app/agents/workorder/agent.py services/agent-service/tests/test_team_dispatch.py`；`git commit -m "feat: dispatch to registered technicians and record reminders"`。

### Task 3: 同源代理、服务身份与人工工单权限

**Files:**
- Create: `services/agent-service/app/api/team_auth.py`
- Modify: `services/agent-service/app/clients/backend.py`, `services/agent-service/app/mcp/client.py`, `services/agent-service/app/api/server.py`, `services/agent-service/monitor_web_server.py`
- Modify: `services/backend-service/app/main.py`, `services/backend-service/app/team/routes.py`
- Test: `services/agent-service/tests/test_team_auth_boundary.py`, `services/agent-service/tests/test_monitor_proxy_auth.py`, `services/backend-service/tests/test_internal_tool_auth.py`

**Interfaces:**
- Consumes: Task 1 `resolve_session`，Task 2 的真实工单被派工账号 ID。
- Produces: `BackendServiceClient.resolve_session(token: str) -> dict[str, Any] | None`；`require_technician_actor(request: Request) -> dict[str, Any]`；Backend 的 `POST /internal/team/session/resolve` 只接受独立服务凭证 `BACKEND_INTERNAL_TOKEN`。
- Produces: Monitor 的 `/api/team/*` 显式方法白名单代理到 Backend，正确转发 Cookie/Set-Cookie；现有工单代理转发 Cookie，但不信任客户端伪造的角色/演员请求头。

- [ ] **Step 1: 写失败测试。** `test_forged_confirmation_and_expired_session_denied` 断言无会话为 `401`、监督人为 `403`、改写 `maintenance_confirmed_by` 不能改变服务端演员；`test_supervisor_sees_all_and_technician_only_own_orders` 断言浏览器工单列表按会话过滤；`test_proxy_forwards_cookie_without_actor_header` 断言 Cookie/Set-Cookie 往返且伪造角色头不透传；`test_internal_tool_write_requires_service_token` 断言直接无凭证调用敏感写工具被拒绝。
- [ ] **Step 2: 证明失败。** 在两个服务目录分别运行上述单文件 pytest；预期原服务令牌代理允许无个人身份或缺失接口而失败。
- [ ] **Step 3: 实施最小实现。** Agent 人工反馈/完成动作同时要求原服务边界与已验证的个人会话，并从会话注入 `actor_id`；浏览器工单列表要求会话且监督人可看全部、维修人员只看本人，自动监控派工保持服务身份。Backend 对内部会话解析和敏感工具写操作验证 `BACKEND_INTERNAL_TOKEN`；`BackendServiceClient` 与 `McpClient` 调用 Backend 的 `mes/qms/inventory` 工具时发送该凭证，不向 CAD/RAG/Model 透传。`BACKEND_STORAGE=mysql` 时缺少服务凭证不得启动敏感写接口；SQLite 隔离测试显式设置测试凭证。文档只说明变量名，不提交真实密钥。
- [ ] **Step 4: 运行定向及现有 Agent API/代理测试。** 预期权限测试 PASS，普通读操作与合法自动流程不被误拒绝。
- [ ] **Step 5: 只提交本任务文件。** `git add services/agent-service/app/api services/agent-service/app/clients/backend.py services/agent-service/app/mcp/client.py services/agent-service/monitor_web_server.py services/agent-service/tests/test_team_auth_boundary.py services/agent-service/tests/test_monitor_proxy_auth.py services/backend-service/app services/backend-service/tests/test_internal_tool_auth.py`；`git commit -m "feat: bind workorder actions to authenticated technicians"`。

### Task 4: 故障确认后的虚拟整线停机与控制账本

**Files:**
- Create: `services/backend-service/app/line_control/__init__.py`, `repository.py`, `routes.py`
- Create: `services/agent-service/app/monitor/line_control.py`
- Modify: `services/backend-service/app/main.py`, `services/agent-service/app/clients/backend.py`, `services/agent-service/app/monitor/control_policy.py`, `services/agent-service/monitor_web_server.py`
- Test: `services/backend-service/tests/test_line_control_store.py`, `services/agent-service/tests/test_monitor_auto_pause.py`, `services/agent-service/tests/test_line_control_stop.py`

**Interfaces:**
- Produces: `LineController.__init__(factory_client: FactoryApiClient, ledger: BackendServiceClient) -> None`；`handle_fault(event_id: str, device_id: str, reason: str) -> dict[str, Any]`；`status() -> dict[str, Any]`。Backend `LineControlRepository.claim_fault_event(event_id: str, device_id: str, device_ids: list[str]) -> dict[str, Any]`、`record_device_control(event_id: str, device_id: str, action: str, outcome: dict[str, Any]) -> dict[str, Any]`、`list_open_faults() -> list[dict[str, Any]]`；Agent `BackendServiceClient` 暴露同名远程门面。
- Consumes: Task 3 的内部服务凭证；`FactoryApiClient.devices()`、`control_device(device_id, "emergency_stop", reason)` 与 `snapshot(device_id)`。

- [ ] **Step 1: 写失败测试。** `test_confirmed_fault_stops_all_devices_once` 对四个虚拟设备断言每台一次 `emergency_stop`；`test_warning_and_offline_unknown_do_not_stop` 断言预警/未知不误控；`test_partial_stop_is_not_reported_as_stopped` 断言逐设备失败；`test_timeout_reads_back_before_retry` 断言超时仅先查状态；`test_fault_ledger_survives_restart` 断言同一事件重启后不重复控制。
- [ ] **Step 2: 证明失败。** Backend 与 Agent 各运行对应测试文件；预期现有“确认故障也不自动停机”的断言需要替换为新行为测试，先看到新测试失败。
- [ ] **Step 3: 实施最小实现。** Monitor 在 `_on_trigger` 收到 `MonitorStatus.FAULT` 后把停机交给专用执行器，锁内只更新状态；控制器读取真实虚拟设备目录，逐台命令并读回状态；Backend 增量表以事件 ID/设备/动作做幂等和逐台审计。MySQL 暂不可用仍尝试停机，但标记待对账且禁止复机；控制入口必须显式设置 `FACTORY_CONTROL_MODE=virtual`，否则只监控不发送控制命令。
- [ ] **Step 4: 运行定向与监控回归。** 预期全部 PASS，重复轮询不会追加控制调用，监控线程不长期阻塞。
- [ ] **Step 5: 只提交本任务文件。** `git add services/backend-service/app/line_control services/backend-service/app/main.py services/backend-service/tests/test_line_control_store.py services/agent-service/app/monitor services/agent-service/monitor_web_server.py services/agent-service/app/clients/backend.py services/agent-service/tests/test_monitor_auto_pause.py services/agent-service/tests/test_line_control_stop.py`；`git commit -m "feat: stop virtual line on confirmed fault"`。

### Task 5: 被派工人员确认与可信整线复机

**Files:**
- Modify: `services/agent-service/app/monitor/line_control.py`, `services/agent-service/app/runtime/operations.py`, `services/agent-service/app/api/server.py`, `services/agent-service/app/workorder/{service,validator}.py`
- Modify: `services/backend-service/app/workorder/service.py`, `services/backend-service/app/line_control/{repository,routes}.py`
- Test: `services/agent-service/tests/test_workorder_machine_resume.py`, `services/agent-service/tests/test_line_control_restart.py`, `services/backend-service/tests/test_workorder_recovery_phase.py`

**Interfaces:**
- Consumes: Task 3 的可信 `actor_id`、Task 4 的持久故障事件与逐设备控制记录。
- Produces: `LineController.try_restart(workorder_id: str, actor_id: str) -> dict[str, Any]`，明确返回 `blocked | starting | running | failed` 和逐设备原因；`RuntimeOperations.execute_workorder(self, action: str, payload: Mapping[str, Any] | None = None, from_agent: str = "router", *, actor_id: str = "") -> Dict[str, Any]` 为人工完成流程传递独立可信参数。

- [ ] **Step 1: 写失败测试。** `test_only_assignee_can_confirm` 断言其他维修人员/监督人拒绝；`test_client_passed_and_restart_requested_ignored` 断言伪造前端恢复样本不启动；`test_other_active_fault_blocks_line_restart` 断言多故障保持停机；`test_stale_wrong_device_snapshot_blocks` 断言样本缺失/过期/设备不符保持停机；`test_new_fault_mid_restart_stops_started_devices` 断言新故障中止并回停；`test_all_poststart_snapshots_required_for_running` 断言任一设备未正常不显示运行。
- [ ] **Step 2: 证明失败。** 在 Agent/Backend 服务目录运行对应新测试；预期当前无整线复机流程，失败原因可定位。
- [ ] **Step 3: 实施最小实现。** 人工完成入口从服务端会话得到确认人，查询真实工单被派工 ID；启动前由服务端读取新鲜快照并生成 `phase=prestart` 检查，保留当前工单完成状态但禁止仅凭此关闭；所有相关故障工单满足门禁后逐台 `start`，每步重新检查是否出现新故障；启动后用 `phase=poststart` 的新快照核验所有设备，成功才记整线运行并允许最终关闭。失败记录验证失败，按现有状态迁移回停/重开，不把 `passed=true` 当证据。超时先读回设备状态并对账。
- [ ] **Step 4: 运行定向与旧工单状态测试。** 预期全部 PASS；旧工单仍可查询，但未绑定注册身份不能自动复机。
- [ ] **Step 5: 只提交本任务文件。** `git add services/agent-service/app services/agent-service/tests/test_workorder_machine_resume.py services/agent-service/tests/test_line_control_restart.py services/backend-service/app services/backend-service/tests/test_workorder_recovery_phase.py`；`git commit -m "feat: verify repair and restart virtual line safely"`。

### Task 6: 最小前端交互与跨服务回归

**Files:**
- Create: `frontend/monitor-react/src/teamApi.mjs`, `TeamAccess.jsx`, `SupervisorQueue.jsx`
- Modify: `frontend/monitor-react/src/app/App.jsx`, `frontend/monitor-react/src/workorderSheet.mjs`
- Test: `frontend/monitor-react/src/teamApi.test.mjs`, `frontend/monitor-react/src/workorderSeparation.test.mjs`, `tests/integration/test_virtual_line_team_contract.py`
- Update: `services/backend-service/README.md`, `README.md`

**Interfaces:**
- Consumes: Tasks 1–5 的 `/api/team/*`、工单与整线状态契约。
- Produces: 注册/登录、本人工单、监督催办与逐设备控制结果界面；前端维修提交只含反馈，不含伪造 `maintenance_confirmed_by`、`passed` 或 `restart_requested`。

- [ ] **Step 1: 写失败测试。** `test_registration_payload_role_and_primary_device` 断言监督人无设备、维修人员发送真实设备 ID；`test_completion_payload_contains_no_client_verification` 断言前端不制造恢复证据；跨服务测试用独立进程和虚拟工厂适配器走“注册→故障→整线停机→自动派工→确认→逐台复机”，并断言监督人只能催办。
- [ ] **Step 2: 证明失败。** 前端目录运行 `node --test src/teamApi.test.mjs src/workorderSeparation.test.mjs`；仓库根目录运行 `python -m pytest tests/integration/test_virtual_line_team_contract.py -q`；预期新测试失败。
- [ ] **Step 3: 实施最小实现。** 只在现有 App 中接入三个专责组件/API 客户端；注册设备来自监控真实目录；界面显示待派工、停机部分失败、待复机验证、复机失败与正常运行的真实状态。README 记录本地 MySQL 增量迁移、`BACKEND_INTERNAL_TOKEN`、`FACTORY_CONTROL_MODE=virtual` 配置和恢复方式，不提交密钥；不手改打包后的 assets。
- [ ] **Step 4: 运行回归。** Backend 目录 `python -m pytest tests -q`；Agent 目录 `python -m pytest tests -q`；前端目录 `node --test` 与 `npm run build`；仓库根目录 `python -m pytest tests/integration/test_virtual_line_team_contract.py -q`。记录通过/失败/跳过；依赖不可用单独记录，不能宣称生产验收。
- [ ] **Step 5: 只提交本任务文件。** `git add frontend/monitor-react/src tests/integration/test_virtual_line_team_contract.py services/backend-service/README.md README.md`；`git commit -m "feat: expose maintenance team and virtual line workflow"`。

## Final verification and recovery note

每个任务改动前备份将触及的源码文件；只做增量 MySQL 表迁移，不删除旧工单或数据。最终对比本计划与设计文档，检查迁移可回滚、配置不含密钥、无真实设备调用；分别报告单元、前端、跨服务与本地五服务联调的实际执行结果。实施阶段若发现当前代码已经满足某项要求，保留现有逻辑并记录证据，不为清单制造改动。
