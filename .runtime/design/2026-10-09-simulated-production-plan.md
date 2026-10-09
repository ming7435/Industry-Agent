# 生产建模与模拟工厂接入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将有效 CAD 版本经 CAD Agent 下发当前模拟工厂，持续保存加工事实，并由 Quality Agent 检测对应产出尺寸。

**Architecture:** 复用当前工厂的虚拟车削接收与执行契约。共享模块负责受限几何转换、程序校核及尺寸比较；Backend 保存不可变方案、产出及检测，Agent 服务负责授权、工具调度和持续对账。页面读取保存事实，模拟记录与正式质检及现有比对仪数值演示分别保存和统计。

**Tech Stack:** Python、FastAPI、Pydantic、LangGraph、现有 MySQL／SQLite Repository、React 18.3.1、Vite 5.4.10、Node 原生测试及项目既有 Playwright 浏览器夹具；不增加产品依赖。

**Spec:** [接入设计](./2026-10-09-simulated-production-design.md)。用户已于 2026-10-09 发出“开始”，进入本计划阶段。

## Global Constraints（全局约束）

- 设备 `TRAK-TC820LTYSI-001`；工厂契约 `virtual-turning-v1`，后处理器 `virtual-trak-turning-v1`；每个任务对应一件模拟加工产出。
- 只支持毫米、有效单实体、已完成 STEP 回读的实心圆柱或单个同轴通孔圆柱；未支持特征整体拒绝，坐标最多六位小数且无损表达。
- `source=factory-simulation`、`simulation_only=true`；产出 `synthetic=true`；记录类型 `sim_production_job`、`sim_produced_part`、`sim_quality_check`，不得写入正式 `production_part`／`quality`。
- 方案和已确认产出不可变；同一指令重试不新增任务，不同参数返回 409；所有事实持久化于 Backend。
- CAD Agent 准备、下发、启动；Quality Agent 执行专用模拟尺寸分支；Runtime 协调并持续对账，不新增 Agent。
- 工厂回环地址、`FACTORY_CONTROL_MODE=virtual`、能力契约及登录人员均须核实；生成模型与接收程序均不启动加工，设备恢复不自动继续任务。
- 后台对账每两秒检查活动任务，失败按 5 至 30 秒退避，暂停任务每 30 秒查询；后台只调用工厂 GET，不提交、启动或恢复设备。
- API 前缀 `/api/production/virtual`；生产记录对创建人员及已有 `supervisor` 角色开放；客户端不能提供通过标志、标准、产出或服务端授权。
- 比较规则 `virtual_profile_dimensions_v1`，Decimal 精确比较；`setup.tolerance_mm` 不解释为制造公差。
- 日志 `run_type=production_simulation`，阶段“生产准备 → 模拟加工 → 模拟检测”；故障维修流程保持原行为。
- 所有新逻辑先验证失败测试，再实现并验证通过。共享文件先重新读取，保留工作区既有改动；本次补丁单独审查，禁止整文件提交夹带其他改动。
- 当前另有 `quality_simulation`、`QualityWorkspace.jsx` 和 `shared/simulated_part_design_quality.py` 的比对仪演示改动；不能调用其样本生成器替代工厂产出，也不能覆盖其记录或统计。
- 设计与计划放在 `.runtime/design`；不新增 `docs` 下的流程文档，不推送远端。

## Review Focus（重点验证）

1. CAD 含未应用修改、同名短号或缓存过期：只接受固定完整版本，旧响应不能覆盖新选择；任务保存后无需 CAD 缓存。由任务 1、6、7、8 验证。
2. 数值是布尔值、NaN、无穷值或超出坐标精度：拒绝而不默默换成零或舍入；长切除工具只形成实际贯通孔。由任务 1 验证。
3. 工厂已接收但响应或 Backend 写入中断：按原指令对账，不能重复生产或显示完成；持久化事务失败须回滚。由任务 2、3、5 验证。
4. 相同批次名称属于其他用户、版本或演示来源：身份和统计严格隔离，监督人可见记录也不能混算。由任务 3、6、8、9 验证。
5. 页面关闭、服务重启、旧工厂回执和报警恢复：后台补齐事实，旧响应不回退进度，已确认产出不变，恢复必须明确启动。由任务 3、5、9、10 验证。

## 文件边界与稳定接口

新增共享模块 `shared/virtual_turning.py`（设计、工艺、程序、回执）与 `shared/virtual_production_quality.py`（加工区尺寸比较），不把这些逻辑塞入现有真实尺寸或比对仪演示模块。

Backend 新增 `app/production_simulation/{__init__,service,routes}.py`，挂载独立内部路由。Agent 服务新增 `app/production_simulation/{__init__,factory,backend,context,tools,agents,coordinator,reconciler}.py` 和 `app/api/production_simulation.py`；现有 Agent、Graph、A2A、注册及启动文件只增加必要接点。

Frontend 新增 `app/production-cad/SimulatedProductionPanel.jsx`、`virtualProduction.mjs`、`virtualProduction.test.mjs`、`virtualProduction.css`，以及 `app/ProductionQualityWorkspace.jsx`、`QualitySourceWorkspace.jsx`。通过最小父组件接点挂载，保留现有 `QualityWorkspace.jsx` 实现。

以下签名中的 `Mapping`、`dict` 均为 JSON 兼容对象；网络和存储对象只保留于服务端上下文，不写入 Trace 或响应。新增错误 `VirtualProductionError(code: str, message: str, status: int = 409)`，验证拒绝与存储／连接不确定结果分别处理。

共同 DTO 固定字段：设计使用 `run_id`、`digest`、`nominal_profile`、`transform`；任务使用 `job_id`、`part_id`、`design_run_id`、`design_digest`、`program_digest`、`status`、`sync_status`、`revision`、`actor_id`、`batch_id`、`factory_command_id`、`factory_job_id`、`source`、`simulation_only`。产出使用 `part_id`、`job_id`、`design_run_id`、`profile`、`output_digest`、`source`、`simulation_only`、`synthetic`。检测使用 `check_id`、`part_id`、`job_id`、`design_digest`、`output_digest`、`rule`、`status`、`items`、`source`、`simulation_only`；比较行使用 `key`、`name`、`unit`、`expected`、`actual`、`difference`、`status`，数值比较字段采用十进制文本。

单任务 API 返回上述任务对象，并可附 `output`／`inspection`；列表返回 `items` 与 `next_cursor`；quality 返回 `items`、`counts`、`rates`、`design_run_id`、`batch_id`、`source`、`simulation_only`。不将成功接收的 HTTP 状态映射成任务 completed。

## Task 1：受限加工程序与模拟尺寸规则

**Files:** Create `shared/virtual_turning.py`, `shared/virtual_production_quality.py`; Test `tests/unit/test_virtual_turning.py`, `tests/unit/test_virtual_production_quality.py`。

**Interfaces:**
- `build_virtual_design(run: Mapping) -> dict`：固定设计快照、摘要、名称／展示短号、加工区名义尺寸和 CAD→机床变换。
- `build_virtual_program(design: Mapping, setup: Mapping, material: str) -> dict`：工厂原始程序包；`validate_virtual_program(program: Mapping) -> dict` 独立重算刀路、时间及体积。
- `validate_factory_receipt(job: Mapping, receipt: Mapping) -> dict`：校验身份、程序摘要、合法状态、完整事件前缀及完成事实。
- `build_virtual_output(job: Mapping, receipt: Mapping) -> dict`：由完成回执形成带摘要的不可变加工产出；`compare_virtual_output(design: Mapping, output: Mapping) -> dict` 返回逐项和状态，不保存。

- [ ] **Step 1 — 失败测试：** 圆柱 Ø20×10、毛坯 Ø24×20、夹持 5、退让 2、切深 2、1000 rpm、0.2 mm/rev，断言 7 个刀路点、6.72 秒、体积 `1000*pi`；增加 Ø6 同轴通孔后为 12 点、12.24 秒、体积 `910*pi`，并核对虚拟 NC 固定头与 X 直径坐标。比较测试断言产出外径 `20.1` 对标准 `20` 差值为 `0.1`、状态 `fail`；缺值为 `insufficient_data`。
  测试名 `test_generated_program_is_accepted_by_factory`，核心断言 `assert len(program['toolpath']) == 7`、`assert program['simulation']['duration_seconds'] == pytest.approx(6.72)`；`test_output_difference_is_not_release_evidence` 断言 `result['status'] == 'fail'`、外径行 `difference == '0.1'`、`result['simulation_only'] is True`。
- [ ] **Step 2 — 确认失败：** `L:\anaconda\python.exe -m pytest -c pytest-agent.ini tests/unit/test_virtual_turning.py tests/unit/test_virtual_production_quality.py -q`；新增模块缺失或断言失败，不能把夹具／导入错误当作已验证行为失败。
- [ ] **Step 3 — 实现接口：** 使用 Decimal 验证输入和精度，确定性生成／重算受限车削、贯通钻孔、虚拟 NC、时间与稳定环形体积；校验原始程序摘要，不信任 passed 标志。覆盖 x/y/z 轴与偏移转换，孔深取真实交集；比较仅包含外径、加工区长度、有孔时孔径，不伪造轴向或孔位测量。
- [ ] **Step 4 — 正向与拒绝验证：** 补齐布尔值、NaN／无穷、超六位精度、刀路数量上限、毛坯不足、零进给、错钻头、盲孔／偏心孔／多孔／圆角／装配、相同短号不同完整版本、变造摘要及长孔工具测试；运行 Step 2 命令全部通过。以工厂 `validate_program` 在隔离测试中验证生成包确实被现有工厂接受。
- [ ] **Step 5 — 局部提交：** 仅提交本任务新文件，`feat: compile validated virtual turning programs and compare outputs`。

## Task 2：固定回环工厂适配器

**Files:** Create `services/agent-service/app/production_simulation/__init__.py`, `factory.py`; Test `services/agent-service/tests/test_virtual_factory_client.py`。

**Interfaces:** `VirtualFactoryClient(base_url: str, timeout: float = 5)`；方法 `capabilities()`, `submit(command_id, program)`, `by_command(command_id)`, `get(job_id)`, `start(job_id, digest, operator)`，均返回经过形状校验的 `dict`。异常 `VirtualFactoryError` 区分 `status`、`outcome_unknown`、`execution_started`。

- [ ] **Step 1 — 失败测试：** 临时 HTTP 工厂记录请求，断言下发路由 `/api/production/jobs`、必需请求头 `X-Factory-Production: virtual-v1`、启动 `simulation_only=true`；接收后不能出现 start 或设备控制请求。未知响应测试断言不会产生第二个指令号。
  测试名 `test_receive_never_starts_or_controls`，核心断言 `job['status'] == 'received'`、`[r.path for r in requests if r.method == 'POST'] == ['/api/production/jobs']`；`test_lost_receive_response_does_not_retry_write` 断言接收 POST 次数为 1 且异常 `outcome_unknown is True`。
- [ ] **Step 2 — 确认失败：** `L:\anaconda\python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_virtual_factory_client.py -q`。
- [ ] **Step 3 — 实现接口：** 只允许 HTTP 回环主机且无用户信息、额外路径或重定向；验证虚拟模式、能力 schema／设备／后处理器／scope；URL 段规范编码，响应至多 4 MiB，不自动重试写入。固定调用现有能力、接收、查询、启动接口，禁止控制设备或更改故障场景。
- [ ] **Step 4 — 验证：** 真实临时工厂接收／启动／对账通过；覆盖非回环地址、错误能力、无 ready、HTTP 409、超大／非 JSON／错误版本响应、重定向、下发成功后断连接、编码指令与错误 operator；Step 2 全部通过。
- [ ] **Step 5 — 局部提交：** `feat: add bounded virtual factory production transport`。

## Task 3：持久化任务、回执、产出与检测

**Files:** Create `services/backend-service/app/production_simulation/{__init__,service,routes}.py`; Modify `services/backend-service/app/workorder/repository.py`, `app/main.py`; Test `services/backend-service/tests/test_virtual_production_store.py`, `test_virtual_production_quality.py`。

**Interfaces:** Repository 新增 `simulation_transaction(lock_id: str)`，MySQL 行锁与 SQLite 写事务提供相同语义。`VirtualProductionService(repository)` 提供 `prepare(actor, command_id, run, setup, material, batch_id='')`, `get(actor, job_id)`, `by_command(actor, command_id)`, `list_jobs(actor, design_run_id='', batch_id='', cursor='', limit=50)`, `record_receipt(actor, job_id, expected_revision, receipt)`, `record_sync_error(actor, job_id, expected_revision, code, outcome_unknown=False)`, `output(actor, part_id)`, `inspect(actor, part_id, expected_output_digest)`, `quality(actor, design_run_id, batch_id)`，均返回 `dict`。

后台固定内部入口 `pending(now: float, cursor: str = '', limit: int = 50) -> dict`、`sync_receipt(job_id: str, expected_revision: int, receipt: Mapping) -> dict`、`sync_error(job_id: str, expected_revision: int, code: str) -> dict` 不接受浏览器 actor，使用经过内部认证的协调服务身份，只能读待核对事实或同步回执；记录原 owner 和 runtime 同步来源，不能创建、下发、启动或更换程序。

内部路由 `/internal/production/virtual/{operation}` 复用 `internal_auth` 和 Backend 用户目录解析 actor 的实际角色，不信任传入 role。操作名单固定为上述方法及 `pending`（供后台查询）；请求禁止额外字段。内部 `pending`／同步仅返回必要待核对任务，需共享内部认证，浏览器不可直接访问。

- [ ] **Step 1 — 失败测试：** 同用户同指令／相同参数只保存一个 `sim_production_job`；换参数抛 409。同一工厂完成回执同步两次，只保存一个 `sim_produced_part`，数据库中正式 `production_part`、`quality`、`simulated_quality_batch` 均为空。产出尚未完成时不能保存有效检测。
  测试名 `test_idempotent_plan_and_completed_output`，断言 `first['job_id'] == replay['job_id']`、`len(repository.list_records('sim_production_job')) == 1`、`len(repository.list_records('sim_produced_part')) == 1`、`repository.list_records('quality') == []`；`test_old_revision_cannot_replace_new_fact` 断言冲突返回 409 且保存进度不变。
- [ ] **Step 2 — 确认失败：** `L:\anaconda\python.exe -m pytest -c pytest-backend.ini services/backend-service/tests/test_virtual_production_store.py services/backend-service/tests/test_virtual_production_quality.py -q`。
- [ ] **Step 3 — 实现接口：** 在独立记录类型内保存完整快照、原程序／摘要、actor、指令身份、稳定任务／产出编号、修订号及来源。准备前后重算共享验证，跨网络不持锁；记录状态和同步状态分离。完成回执与产出同事务提交，已确认产出冲突转 review 不覆盖。模拟检测重算后保存独立记录，同产出与规则复用结果。
- [ ] **Step 4 — 验证：** 复用 `test_production_part_transaction.py` 的隔离 MySQL 驱动适配方式，同时覆盖 MySQL 与 SQLite 锁／回滚、并发不同设计／工艺、持久化故障、旧 revision、退回进度、变造事件前缀、错任务／摘要／单位／非有限输出、未知 actor／伪造 supervisor。检测覆盖 pass／fail／缺测／来源冲突、重复去重、设计＋批次＋owner＋来源隔离及零分母。Step 2 全部通过。
- [ ] **Step 5 — 局部提交：** 只选择本次 Repository／main 接点补丁及新文件，`feat: persist immutable virtual production facts and inspections`。

## Task 4：CAD／Quality 的可信工具与 Agent 分支

**Files:** Create `services/agent-service/app/production_simulation/{backend,context,tools,agents}.py`, `app/skills/cad/virtual_production.md`, `app/skills/quality/virtual_size_inspection.md`; Modify `app/tools/registry.py`, `app/agents/cad/{agent,graph}.py`, `app/agents/quality/{agent,graph}.py`, `app/a2a/{models,requests,endpoints}.py`, `app/runtime/capability.py`; Test `services/agent-service/tests/test_virtual_production_agents.py`。

**Interfaces:** `VirtualProductionBackend(client)` 对应任务 3 的固定内部操作；`VirtualExecutionContext` 为仅服务端生成的 Python 上下文，携带实际 actor、动作、目标、Backend／Factory 对象及私有 authority 标记，不能由 JSON 构造。`virtual_tool_scope(context)` 在 Agent 节点执行期间建立可信上下文。

CAD 能力 `virtual_production`、技能 `virtual_production_skill`，工具 `prepare_virtual_production`、`submit_virtual_production`、`start_virtual_production`、`sync_virtual_production`。Quality 能力 `virtual_size_inspection`、技能 `virtual_size_inspection_skill`、工具 `inspect_virtual_output`。工具均不对模型公开；CAD 接收 `operation='virtual_production'`，Quality 接收 `inspection_type='virtual_profile_dimensions_v1'`，但必须同时具备可信服务器上下文。

A2A 新增 `execute_virtual_production(action: str, arguments: Mapping, context: VirtualExecutionContext) -> dict`、`inspect_virtual_output(part_id: str, output_digest: str, context: VirtualExecutionContext) -> dict`。上下文字段在传输日志／响应中排除，端点只将通过类型和私有 authority 核验的对象传入对应 Harness，不接受普通 JSON 同名字段。

- [ ] **Step 1 — 失败测试：** 通过 Runtime 构造的可信 A2A 请求可执行 CAD 生成及独立 Quality 检测，Trace 中存在对应 Agent／技能／工具。仅提供相同 operation／actor JSON 的请求被拒绝，不能下发或启动；默认故障能力序列未增加生产能力。
  测试名 `test_trusted_a2a_routes_to_existing_agents`，断言准备结果 `status == 'prepared'`、检测结果 `rule == 'virtual_profile_dimensions_v1'`、Agent 集合仍为原有九个；`test_json_cannot_authorize_production_tool` 断言工厂写请求数为 0 且没有模拟任务记录。
- [ ] **Step 2 — 确认失败：** `L:\anaconda\python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_virtual_production_agents.py -q`。
- [ ] **Step 3 — 实现接口：** 专用节点建立工具上下文并调用技能步骤，支持 Harness 的执行线程；scope 不从模型 arguments 或 HTTP body 信任字段生成。只有明确 start 上下文可调用启动工具，其余上下文禁止。扩展能力注册但不加入默认故障计划；保留既有建模、工程查询、正式质量和整改分支。
- [ ] **Step 4 — 验证：** CAD／Quality 两类节点、技能工具许可、未授权 Graph／A2A／ToolRegistry 调用、start 越界、上下文序列化与 Trace 不泄漏对象或认证、正式质检继续拒绝模拟来源均通过；既有 CAD 和质量身份／放行契约必要回归通过。
- [ ] **Step 5 — 局部提交：** `feat: route authorized virtual production through CAD and Quality agents`。

## Task 5：生产协调、未知结果对账与后台同步

**Files:** Create `services/agent-service/app/production_simulation/{coordinator,reconciler}.py`; Modify `app/runtime/{container,operations}.py`, `app/api/server.py` 的启动／关闭接点；Test `services/agent-service/tests/test_virtual_production_reconciliation.py`。

**Interfaces:** `VirtualProductionCoordinator(backend, factory, operations, trace)` 提供 `prepare(actor, arguments)`, `submit(actor, job_id, digest)`, `start(actor, job_id, digest)`, `sync(actor, job_id)`, `inspect(actor, part_id, output_digest)`；通过任务 4 的可信 A2A 调度。`VirtualProductionReconciler(coordinator, backend, clock)` 提供 `start()`, `close()`, `run_once(now: float) -> dict`；测试可注入时钟，不用长时间 sleep。

- [ ] **Step 1 — 失败测试：** 工厂接收后断连接、Backend 回执写入失败后恢复，均按原 command 查询，只存在一个工厂任务；启动超时不自动 start。无浏览器参与时调用 `run_once` 后完成事实和产出被保存，关闭再新建 reconciler 后继续核对保存任务。
  测试名 `test_unknown_receive_reconciles_one_factory_job`，断言所有接收指令号集合长度为 1、工厂任务数为 1；`test_background_reconciliation_saves_without_browser` 断言保存状态 completed、产出数 1、后台请求全部为 GET；`test_restart_does_not_automatically_resume_paused_job` 断言 start 请求次数不增加。
- [ ] **Step 2 — 确认失败：** `L:\anaconda\python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_virtual_production_reconciliation.py -q`。
- [ ] **Step 3 — 实现接口：** prepare 经 CAD 保存方案；submit 必先确认固定任务和摘要，未知结果以 GET by-command 对账，找不到时只由明确 submit 重试原包；start 只在明确动作发生。后台跨重启从 pending 分页恢复，以最多四个并发读取运行有界工作队列；每两秒检查活动任务，5、10、20、30 秒退避，暂停 30 秒，完成与产出保存后停止。调用网络前读取修订号，保存遇到较新事实时重新读取，不能覆盖。
- [ ] **Step 4 — 验证：** 同时提交／后台同步、旧返回、新事件前缀、工厂缺失、暂停／恢复／中断、服务重启、无页面、Backend 失败、任务饥饿与关闭线程均验证。后台请求日志只包含工厂 GET；不会对 received、paused 或 interrupted 自动 start，不自动改设备状态。Step 2 全部通过。
- [ ] **Step 5 — 局部提交：** `feat: reconcile virtual production continuously without repeated execution`。

## Task 6：登录保护的 API 与限定 Web 代理

**Files:** Create `services/agent-service/app/api/production_simulation.py`; Modify `app/api/server.py`, `monitor_web_server.py`; Test `services/agent-service/tests/test_virtual_production_api.py`, `test_monitor_virtual_production_proxy.py`。

**Interfaces:** `build_virtual_production_router(coordinator, backend, require_write_auth, cad_reader)` 挂载设计第 9 节全部 API。Pydantic 请求仅允许完整设计编号、指令号、工艺、材料、批次、任务／程序摘要及产出摘要；actor 由 `team_actor` 解析，设计经 `get_freecad_run_record` 读取。

- [ ] **Step 1 — 失败测试：** 真实 TestClient 的 plan→submit→start→sync→inspect 请求穿过 Runtime／Agent，首次创建使用服务端 CAD；GET 不下发、不启动、不持久化同步。未登录返回 401，其他普通用户读取／写入他人任务拒绝，supervisor 按真实目录角色授权；伪造 actor／role／run／结果字段返回 422。
  测试名 `test_authenticated_production_api_uses_server_design`，断言提交 run／qualified 额外字段返回 422、首次 GET 工厂写请求数为 0；`test_cross_owner_job_is_not_accessible` 断言其他普通用户返回 403／404、匿名返回 401、真实 supervisor 返回 200。
- [ ] **Step 2 — 确认失败：** `L:\anaconda\python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_virtual_production_api.py services/agent-service/tests/test_monitor_virtual_production_proxy.py -q`。
- [ ] **Step 3 — 实现接口：** 挂载 `/api/production/virtual` 的严格 schema 和错误映射；列表最多 50 条，稳定游标及设计／批次服务端过滤。已有方案重试先查保存任务，CAD TTL 过期仍可读原快照，但不能凭客户端旧快照创建新版本。Monitor 增加明确代理前缀，复用 Cookie 和内部写头、同源写检查，限制请求大小，客户端不能更改代理目标。
- [ ] **Step 4 — 验证：** 完整 API、错误能力、服务断开、HTTP 409 与 outcome_unknown、缓存过期、原指令对账、分页、大小限制、错误 Origin、认证转发／无认证拒绝、非生产任意路径不代理，以及无工厂直接调用均通过；既有 Web CAD／team／质量代理回归。
- [ ] **Step 5 — 局部提交：** `feat: expose authenticated virtual production workflow APIs`。

## Task 7：生产建模页面的模拟生产面板

**Files:** Create `frontend/monitor-react/src/app/production-cad/{SimulatedProductionPanel.jsx,virtualProduction.mjs,virtualProduction.test.mjs,virtualProduction.css}`; Modify `ProductionCadWorkspace.jsx`, `frontend/monitor-react/src/teamSession.mjs`; Test `tests/browser/virtual-production-workspace.test.mjs`。

**Interfaces:** `<SimulatedProductionPanel run={run} draftPending={boolean} />`；`virtualProduction.mjs` 提供 `productionRequest(path, options)`, `validateProductionJob(value, expected)`, `productionPendingKey(actorId, runId)`, `formatProductionStatus(job)`。请求复用通用 session 校验；pending 仅保存指令及目标编号，不保存私有程序和产出。

- [ ] **Step 1 — 失败测试：** 真实浏览器读取有效圆柱、显示模拟预设，生成／保存方案与下发不 start；点击明确启动才 POST start。设计有未应用修改时不能 prepare／submit；同短号不同完整编号及慢返回切换均显示对应版本。
  测试名 `production is started only after the explicit action`，断言保存／下发后 `startPosts.length === 0`，点击启动后为 1；`draft and stale responses cannot change production target` 断言草稿状态按钮 disabled 且所有请求 design_run_id 等于当前已保存完整版本。
- [ ] **Step 2 — 确认失败：** `node --test frontend/monitor-react/src/app/production-cad/virtualProduction.test.mjs tests/browser/virtual-production-workspace.test.mjs`，使用项目已配置的 Playwright 路径／浏览器。
- [ ] **Step 3 — 实现接口：** 面板放在已完成模型结果下，使用独立 CSS 前缀；展示支持范围、工艺、批次、方案与明确动作。复用登录态与原指令核对，状态只取 API；页面每两秒读取活动任务并可主动 sync。修改工艺产生新方案，不覆盖旧包；登录变化或版本切换取消旧请求并清空旧私有结果。
- [ ] **Step 4 — 验证：** 无模型／未支持模型／无登录／故障暂停／结果未知／恢复／刷新等状态及合法下发全通过；sessionPath 新增前缀回归，已有 freecad 编辑与浏览器工作台回归通过。确认没有直接请求 `127.0.0.1:4529`。
- [ ] **Step 5 — 局部提交：** `feat: add explicit simulated production controls to CAD workspace`。

## Task 8：读取工厂产出的质量检测页面

**Files:** Create `frontend/monitor-react/src/app/{ProductionQualityWorkspace.jsx,QualitySourceWorkspace.jsx,productionQuality.mjs,productionQuality.test.mjs,productionQuality.css}`; Modify `app/App.jsx` 的质量组件导入接点；Test `tests/browser/production-quality-workspace.test.mjs`。

**Interfaces:** `QualitySourceWorkspace` 将“工厂产出检测”与当前“比对仪数值演示”作为独立来源；已有 `QualityWorkspace.jsx` 完整保留。`ProductionQualityWorkspace` 只读取任务 6 API，`productionQuality.mjs` 提供 `validateProductionInspection(value, expected)`, `formatProductionRate(value)`, `qualitySelectionIdentity(actorId, runId, batchId, partId)`。

- [ ] **Step 1 — 失败测试：** 真实浏览器选择完整设计／批次／产出，“开始检测”发送 part 与 output_digest，展示保存的标准、工厂值和偏差；尚未完成生产不能检测。读取后台产出不要求 sessionStorage 留有 CAD，未登录不泄漏记录。
  测试名 `factory output is inspected with its immutable design`，断言检查 POST 目标 part_id 和 body.output_digest 与所选产出相同，页面出现 `20.1` 与 `0.1`；`production quality survives missing CAD session history` 断言清空 sessionStorage 后仍显示 Backend 中的产出且不能出现比对仪演示的 10 件样本。
- [ ] **Step 2 — 确认失败：** `node --test frontend/monitor-react/src/app/productionQuality.test.mjs tests/browser/production-quality-workspace.test.mjs`。
- [ ] **Step 3 — 实现接口：** 新增来源切换包装组件，通过最小 App 接点挂载；有可读生产任务时进入工厂产出来源，现有比对仪来源仍可使用。页面先按服务端任务目录选版本／批次，再选产出；率值使用服务端统计和件数。显示模拟来源、一致／不一致／缺测／待复核，不调用比对仪 generate_samples，不使用标准填实际值。检测期间锁定目标，旧异步返回及会话失效不得覆盖新选择。
- [ ] **Step 4 — 验证：** pass／fail／无产出／零分母／部分未检、多个批次／版本／用户隔离、TTL 过期、检测请求未知核对与统计失败显示均通过。既有 `quality-simulation.test.mjs` 与 `quality-empty-workspace.test.mjs` 必要回归通过；两个来源记录和统计没有合并。
- [ ] **Step 5 — 局部提交：** `feat: inspect saved factory outputs alongside independent quality demos`。

## Task 9：生产日志阶段与保存事实同步

**Files:** Create `services/agent-service/app/production_simulation/run_facts.py`; Modify `app/harness/runs.py`, `app/api/server.py`, `frontend/monitor-react/src/app/App.jsx` 的日志类型标签接点；Test `services/agent-service/tests/test_virtual_production_runs.py`, `tests/browser/virtual-production-logs.test.mjs`。

**Interfaces:** `production_run_facts(backend, actor, job_ids: list[str]) -> dict` 返回批量紧凑事实；`reconcile_production_runs(items: list[dict], facts: Mapping) -> list[dict]` 更新生产准备／加工／检测状态。生产 Trace 固定关联项目 job_id 与 run_type，不混入故障、RAG 或比对仪演示。

- [ ] **Step 1 — 失败测试：** 完成工厂回执且未检测：准备／加工完成、检测待执行；检测保存后全部完成。只有 start HTTP 成功但仍 running 时加工保持进行中；工厂／Backend 不可核对时不默认完成。相同 device 的维修 run 仍保留原六阶段。
  测试名 `test_production_phases_follow_persisted_facts`，断言 phase ids 为 `['preparation', 'production', 'quality']`，完成未检时 states 为 `['completed', 'completed', 'pending']`；`test_production_trace_does_not_leak_to_another_user` 断言未授权响应没有生产记录。
- [ ] **Step 2 — 确认失败：** `L:\anaconda\python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_virtual_production_runs.py -q`，以及 `node --test tests/browser/virtual-production-logs.test.mjs`。
- [ ] **Step 3 — 实现接口：** 为生产类型增加独立三阶段，完成／错误来自 Backend 事实，Trace 只提供步骤与工具证据。生产日志和 `/api/v1/trace` 的生产记录按真实会话和 owner／supervisor 过滤；匿名及其他普通用户不能查询生产任务 Trace，既有故障日志访问行为保留。Backend 事实批量读取避免每行网络请求。
- [ ] **Step 4 — 验证：** 页面三阶段、关闭页面后完成状态、暂停／中断、Backend 不可用、越权 Trace、历史维修／质检／RAG 各类隔离及原日志相关回归通过；压缩索引不丢失生产归组身份。
- [ ] **Step 5 — 局部提交：** `feat: reconcile production log phases from persisted factory facts`。

## Task 10：联调验收、构建与可追溯交付

**Files:** Create `services/agent-service/tests/test_virtual_production_integration.py`, `tests/integration/virtual-production-live.mjs`; Modify `docs/项目说明书.md` 仅更新已经验证的能力与范围。

**Interfaces:** 集成测试使用项目真实 Backend／Agent 路由、临时存储和临时工厂执行器；借鉴现有 `test_design_quality_integration.py` 的隔离服务夹具。实时验证脚本默认拒绝写入，明确配置模拟目标、登录身份及校验任务前缀后运行，所有操作记录 `VERIFY-SIM-20261009-*` 身份。

- [ ] **Step 1 — 失败测试：** 无页面参与的 cylinder／coaxial-through-hole plan→submit→start→completed→output→Quality Agent→saved inspection，断言两件对应两任务、固定设计版本、模拟来源、正式质检记录为空；加入服务重启恢复与登录退出后产出保存案例。
  测试名 `test_cad_factory_quality_chain_without_browser`，断言任务数 2、产出数 2、对应两个原始完整版本、两次检测 `status == 'pass'` 且 source 为 factory-simulation，正式质量／工单数量不因本链增加；`test_restarted_agent_catches_up_completed_factory_job` 断言重启没有新 start，原任务 completed 且产出仅一件。
- [ ] **Step 2 — 确认失败：** `L:\anaconda\python.exe -m pytest -c pytest-agent.ini services/agent-service/tests/test_virtual_production_integration.py -q`；缺失接点或错误状态必须使验收失败。
- [ ] **Step 3 — 补齐接点：** 仅修复集成证据暴露的本功能缺口；不修复与本次无关的既有 CAD／质量／API 基线失败，不覆盖比对仪演示或维修／记忆改动。
- [ ] **Step 4 — 回归与构建：** 运行任务 1–9 全部新测试及受影响的既有 CAD、质检来源／放行、日志和 Web 代理测试；Frontend 用 PowerShell 收集 `src` 下 `*.test.mjs` 后 `node --test`，构建 `npm.cmd run build`。Python 全服务测试若存在基线失败保存完整结果并比较新增失败，不能宣称全通过。产物保持本次构建结果，不删除运行数据。
- [ ] **Step 5 — 当前模拟工厂验证：** 核对当前活动维修／生产任务与服务管理器后启用新代码，保留共享认证并不启动可见终端窗口。只对无占用、正常模拟线提交标识清楚的测试任务，验证 CAD 页面与质量页面真实点击、背景同步、刷新恢复以及日志完成状态；故障暂停／执行器重启在隔离工厂中验证，不改变当前故障场景。不具备重启窗口时保留构建并如实报告待启用，不能把隔离验收当作实时接入完成。
- [ ] **Step 6 — 保存证据与交付：** 证据放在 `.runtime/verification/simulated-production-20261009/`，记录测试命令、通过／失败、任务／产出／检测编号和页面截图；项目说明书准确标明三种 Agent 分工、圆柱／通孔限制及模拟来源。审查仅属于本次的最终补丁，提交 `feat: verify CAD to virtual factory production and inspection workflow`。

## Self-review 与执行交接

已逐项映射设计 1–12 节：支持范围及数值规则→任务 1；工厂契约→任务 2；不可变记录及事务→任务 3；Agent 分工和可信工具→任务 4；后台恢复→任务 5；API／归属→任务 6；两页面→任务 7–8；日志→任务 9；验收／文档／启用→任务 10。五项 Review Focus 均有对应测试步骤。

建议采用 **Native：由当前会话直接执行本计划**。各任务紧密依赖相同程序、身份、产出和 A2A 契约，单一执行上下文更便于保持接口一致；完成后按执行技能安排独立审查。另一种执行方式为分任务子代理实施并逐任务审查，需要更多上下文和协调。

计划完成不表示功能完成。用户审阅本文件并选择执行方式后，使用 `superpowers:executing-plans`（Native）或 `superpowers:subagent-driven-development`（子代理方式）开始任务 1，随后按清单推进。
