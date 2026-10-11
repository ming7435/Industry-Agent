# FreeCAD 第一阶段文档编辑 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在生产建模中交付 AI 与手动共用的真实文档、对象树、基础编辑、持久版本和新版质检标准更新，不宣称后续工作台已经全部实现。

**Architecture:** Agent 校验会话和类型化命令，Backend 保存文档、修订及命令认领；一个专用执行进程串行调用本机 FreeCAD，并用隔离候选与原生收据提交结果。React 从同一修订快照更新树、属性和逐对象场景；显式发布生成不可变 FC 版本和服务端标准，再更新质检目录。

**Tech Stack:** 现有 Python／FastAPI／Pydantic／MySQL／Redis、FreeCAD 1.1.4 原生 RPC／MCP、React 18.3.1、Three.js 0.186.1、Vite 5.4.10、pytest、node:test 与现有 Playwright／Chrome。

**Spec:** [正式设计方案](L:/industry_agent/docs/superpowers/specs/2026-10-11-freecad-production-workspace-design.md)。本计划仅实现该文件第一阶段；后续工作台分别设计和计划。

## Global Constraints

- 工作目录 L:/industry_agent；保留 .local-backups/、output/ 及任何不属于本任务的改动。任务提交只按明确文件清单暂存，不使用 git add .，不自动推送。
- 新文档使用服务端生成的 DOC-UUID；工作 revision 从 0 递增；发布 version 从 1 递增；完整发布身份为 FC-64位十六进制。
- 五位 part_number 仅用于展示，保留前导零，不作数据库唯一键。对象 Name／object_id 与可修改的 Label 分离；对象替换分配新 object_id。
- 单位首版统一为毫米和度；保留 ±10000 mm 资源边界；直接创建的基础形体最多 24 个；旧规格数量和工作台校验不放宽。
- 原生基础类型只有 Part::Box、Part::Cylinder、Part::Sphere、Part::Cone；圆锥顶径可为 0，其他尺寸为正，底径大于顶径。
- 在线持久性使用 Backend MySQL；SQLite 仅用于隔离测试；运行记录的 Redis 86400 秒期限不能成为新文档寿命。
- 修改类型仅 create_primitive、set_primitive_dimensions、set_placement、set_label、set_visibility、replace_from_spec；不开放任意脚本、属性、路径、表达式或 Gui.runCommand。
- 候选产物位于 output/freecad-documents 的服务端生成子目录；原历史文件和发布内容不覆盖；未知任务不重放，租约到期不表示 CAD 已停止。
- 可见页面每 2 秒只读检查工作头和发布目录；后台暂停，焦点／可见性恢复立即检查；输入草稿不自动触发 CAD 或质检。
- 新文档和产物按 maintenance_session 解析的账号授权；服务令牌不能代替个人身份；匿名旧记录不批量认领。
- 保留侧栏、现有生成能力和质检页面；不恢复已删除的检测模式切换按钮；不改变检测来源、模拟标记或真实放行规则。
- 不自动安装依赖／插件，不读出密钥，不调用付费模型，不控制工厂、机床、机器人、测头，不停止共享 Docker 数据服务。
- 功能入口在全部任务完成前由 FREECAD_DOCUMENTS_ENABLED=false 关闭；隔离测试显式启用。完成后启用使用进程环境，不覆写用户 .env。
- 每个任务执行红—绿测试；实际 FreeCAD／MySQL 验证与 Mock 分开报告，缺少证据的能力保持待验证。

## Review Focus

- 同名中文 Label：必须按 object_id 修改和高亮，孔／组改名不覆盖零件名；Task 1、3、9 的测试固定此行为。
- 整模型替换后对象内部名称再次出现：旧 object_id 和延迟响应不能选中／修改新对象；Task 3、5、8 验证。
- 提交成功但浏览器失去响应：保留原命令身份、查回结果，不换 command_id 重试；Task 4、8 验证。
- 隐藏产品或存在构造对象：发布只看 product_root_ids，不随可见性漏导或重复导出；Task 3、6 验证。
- 跨账号目录游标和损坏标准摘要：不能串用目录／批次，也不能回退到旧 spec 伪造通过；Task 2、6、11 验证。

## 文件结构与固定接口

新增共享模块 L:/industry_agent/shared/freecad_documents.py 管理 JSON 契约，L:/industry_agent/shared/freecad_document_standards.py 管理标准提取／核验。纯契约不导入同名 app 包或原生 FreeCAD。

Backend 新目录 L:/industry_agent/services/backend-service/app/cad_documents/：repository.py 只负责事务与记录，service.py 负责状态转换，routes.py 负责受内部认证保护的传输，__init__.py 只导出入口。使用 shared.persistence.mysql_session；不把新 CAD 数据写入业务 JSON、工单或质检表。

Agent 新目录 L:/industry_agent/services/agent-service/app/cad_documents/：artifacts.py 管理托管文件；native_program.py 生成可信脚本；coordinator.py 处理唯一执行通道；service.py 编排文档 API；proposal.py 解析 AI 命令但不执行；capabilities.py 合并能力和证据。客户端 gateway.py 只传递白名单作业，不传递任意代码。运行入口为 scripts/freecad_document_worker.py。

网页新增 production-cad/documentApi.mjs、documentState.mjs、useCadDocument.jsx、DocumentWorkspace.jsx、DocumentTree.jsx、DocumentProperties.jsx、DocumentViewer.jsx、documentScene.mjs。保持原工作区入口及旧查看器，按新文档模式使用新组件，避免一开始重写整个旧页面。

共享契约固定为下表。所有对象都由 shared.freecad_documents 定义 Pydantic 模型；后续任务只消费这些名字，不各自创建另一套近似字段。

| 模型 | 必需字段 |
| --- | --- |
| DocumentHead | document_id, owner_user_id, part_name, part_number, revision, published_version, published_revision, active_command_id, created_at, updated_at |
| CommandEnvelope | command_id, document_id, expected_revision, command_type, parameters；所有额外字段拒绝 |
| CommandRecord | envelope: CommandEnvelope或None, input_digest, owner_user_id, state, job_id, result, error_code；系统作业 envelope=None，个人修改必须非空；state 为 accepted/running/completed/failed/outcome_unknown |
| DocumentSnapshot | schema_version='freecad_document_v1', document_id, revision, published_version, objects, product_root_ids, source_spec, validation, artifacts |
| ObjectSnapshot | object_id, name, label, type_id, parent_ids, dependency_ids, visible, properties, geometry, editable_commands, read_only_reason |
| NativeJob | job_id, input_digest, job_kind, owner_user_id, document_id, expected_revision, envelope, source；job_kind 仅 edit/import/publish/legacy_generate/discover，legacy_generate/discover 的 document_id和expected_revision可为None |
| NativeReceipt | job_id, input_digest, state, snapshot, artifacts, validation, result, error_code；legacy_generate/discover 的 snapshot可为None，结果在result；由原生执行端写入，文件摘要另行核验 |
| StandardParameters | schema_version='freecad_document_parameters_v1', document_id, revision, run_id, extractor_version, parameters, uncovered, digest |

properties 采用 name、type、value、unit、editable 的记录列表；geometry 包含逐对象网格／曲线清单，不嵌入 arbitrary URL。参数项统一 key、name、object_id、expected、unit、kind、source_property、frame、comparable；未覆盖项 comparable=false。数据摘要使用排序 JSON、UTF-8、allow_nan=false 的 SHA256。共享 CadDocumentError(code: str, message: str, status_code: int) 定义 HTTP／内部错误映射，后续模块不靠字符串猜状态码。

create_primitive.parameters 含 primitive_type（box/cylinder/sphere/cone）及对应的完整扁平尺寸字段；set_primitive_dimensions 为 object_id＋dimensions 字典，API 和 worker 均按目标真实类型约束可修改字段；set_placement 为 object_id＋position＋rotation（axis／angle）；set_label 为 object_id＋label；set_visibility 为 object_id＋visible；replace_from_spec 只含 spec。快照 published_version 是读取时派生的该工作修订发布信息，未发布为 None，不改变原生快照文件／标准摘要。

新文件、函数和测试的名称以下面各任务为准。Backend 与 Agent 的 app 包同名，必须分别启动 pytest，不能用一个 PYTHONPATH 同时收集两边。

## 运行验证命令的环境

以下命令在 L:/industry_agent 运行；设置只影响当前测试进程，不写环境文件：

```powershell
$env:PYTHON_DOTENV_DISABLED = '1'
$env:APP_ENV = 'testing'
$env:PYTHONPATH = 'L:/industry_agent/services/agent-service;L:/industry_agent'
& 'L:/industry_agent/.venv/Scripts/python.exe' -m pytest services/agent-service/tests/test_freecad_document_contract.py -q
```

Backend 测试前将 PYTHONPATH 改为 L:/industry_agent/services/backend-service;L:/industry_agent；回到 Agent 时恢复。fixture 为每个测试提供独立临时数据库、文件根、账号和客户端，不连接线上账号或读取付费配置。

浏览器沿用已存在且本轮只读核实的依赖：

```powershell
$env:PLAYWRIGHT_MODULE_PATH = 'C:/Users/12587/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core/index.mjs'
$env:CHROME_EXECUTABLE = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
node --test tests/browser/freecad-document-workspace.test.mjs
```

执行时再次检查文件存在；不存在则报告未执行，不下载安装替代物。下面的测试命令是计划要求，尚未执行，新增测试文件也尚不存在。

### Task 1: 类型化文档、命令与标准契约

**Files:** Create L:/industry_agent/shared/freecad_documents.py、L:/industry_agent/shared/freecad_document_standards.py；Test L:/industry_agent/services/agent-service/tests/test_freecad_document_contract.py。

**Interfaces:** Produces parse_command(payload: dict) -> CommandEnvelope、command_digest(actor_id: str, command: CommandEnvelope) -> str、validate_snapshot(payload: dict) -> DocumentSnapshot、verify_document_standard(payload: dict) -> StandardParameters。replace_from_spec 的完整几何校验仍由 Agent／worker 调用现有 validate_spec，不在 shared 中导入 app。

- [ ] Step 1：编写失败测试 test_strict_dimensions_and_identity、test_unicode_labels_are_not_object_ids、test_reject_nonfinite_or_extra_fields。固定以下断言，并参数化四类尺寸、布尔冒充数值、NaN、0 轴和陌生类型：

```python
assert parse_command(box_command(length=40, width=20, height=10)).parameters.length == 40
with pytest.raises(ValueError): parse_command(box_command(length=10001))
with pytest.raises(ValueError): parse_command(box_command(code="print(1)"))
assert parse_command(label_command("安装底板", object_id="OBJ-a")).parameters.object_id == "OBJ-a"
```

- [ ] Step 2：用上述 Agent 环境运行 test_freecad_document_contract.py；预期因契约尚未定义而 FAIL，不把网络或配置错误当红灯。
- [ ] Step 3：实现上述接口和表中模型；本测试文件内提供 box_command、label_command 两个字典工厂。每种参数模型禁止额外字段，名称控制字符拒绝，直径／半径映射由原生任务负责。
- [ ] Step 4：重跑同一文件；预期全部 PASS，并加入同短号／不同 DOC 摘要不同、篡改标准 digest 被拒绝的断言。
- [ ] Step 5：仅暂存本任务三个文件，提交 feat: define typed FreeCAD document contracts。

### Task 2: MySQL 持久文档、命令认领与授权目录

**Files:** Create L:/industry_agent/services/backend-service/app/cad_documents/__init__.py、repository.py、service.py、routes.py；Modify L:/industry_agent/services/backend-service/app/main.py；Test L:/industry_agent/services/backend-service/tests/test_cad_document_repository.py、test_cad_document_routes.py。

**Interfaces:** Consumes Task 1。CadDocumentRepository(mysql_config: dict | None=None, sqlite_path: Path | None=None) 提供 create_document(actor_id, request_id, part_name, part_number) -> DocumentHead、get_document(actor_id, document_id) -> DocumentHead、read_snapshot(actor_id, document_id, revision) -> DocumentSnapshot、claim_command(actor_id, envelope) -> CommandRecord、get_command(actor_id, document_id, command_id) -> CommandRecord、list_documents(actor_id, cursor='', limit=50) -> dict、list_designs(actor_id, cursor='', limit=50) -> dict、find_published(actor_id, run_id) -> dict | None。CadDocumentService(repository) 导出 call(operation: str, payload: dict) -> dict，后续任务向这一显式白名单添加方法。

- [ ] Step 1：写 test_reopen_preserves_revision、test_claim_is_atomic、test_foreign_actor_or_cursor_cannot_read，断言重新构造 repository 后 revision 不变、双线程相同命令只产生一个 job_id、改变同一命令参数为 409、另一账号读文档／命令／游标为 403。

```python
assert reopened.get_document("USER-a", doc.document_id).revision == 0
assert first_claim.job_id == repeated_claim.job_id
with pytest.raises(CadDocumentError) as denied: reopened.get_document("USER-b", doc.document_id)
assert denied.value.status_code == 403
```

- [ ] Step 2：Backend 环境运行两个新增测试文件，预期 FAIL（路由／存储不存在）。
- [ ] Step 3：实现四个业务表 cad_documents、cad_revisions、cad_commands、cad_published_versions，增加内部 cad_executor_state 单例表保存执行租约及未知作业屏障。使用 MySQL 短事务和行锁，SQLite 仅 APP_ENV=testing；命令认领按账号＋身份唯一、文档头 CAS，历史表插入不可覆盖。内部路由 POST /internal/cad/documents/{operation} 要求 internal_auth，不加入任意业务工具执行表。
- [ ] Step 4：重跑上述文件，预期 PASS；分页固定默认 50、上限 100，按发布序号／文档身份排序，游标绑定账号，directory_version 为该账号最后发布序号。补测非法会话身份、数据库异常为 503，以及持久目录不读取 Redis。
- [ ] Step 5：只提交上述模块、入口和测试，feat: persist owned CAD documents and command claims。

### Task 3: 托管产物与真实原生候选编辑

**Files:** Create L:/industry_agent/services/agent-service/app/cad_documents/__init__.py、artifacts.py、native_program.py；Create L:/industry_agent/services/agent-service/app/tools/cad/freecad_spec_kernel.py；Modify L:/industry_agent/services/agent-service/app/tools/cad/freecad_mcp.py；Test L:/industry_agent/services/agent-service/tests/test_freecad_document_native.py、test_freecad_document_artifacts.py。

**Interfaces:** Consumes NativeJob／DocumentSnapshot。ArtifactStore(root: Path) 提供 job_directory(job_id: str) -> Path、read_receipt(job_id: str) -> NativeReceipt | None、validate_candidate(job: NativeJob, receipt: NativeReceipt) -> NativeReceipt、artifact_path(document_id, revision, name) -> Path。render_document_program(job: NativeJob, directory: Path, source_path: Path | None) -> str；freecad_spec_kernel.KERNEL_SOURCE 导出可信原生 build_spec_document(doc, spec, out) -> (product_objects, extra_evidence)，供旧 _program 与新候选共用。

- [ ] Step 1：写 test_candidate_keeps_original_bytes、test_duplicate_label_targets_one_uuid、test_replace_spec_allocates_new_object_ids、test_hidden_and_construction_objects_are_distinct。测脚本绑定确定文档句柄、拒绝路径穿越／符号链接、直径 20 转为 Radius 10、对象改 Label 后 source part_name 不变；用隔离 FakeKernel 验证操作契约，不冒充原生通过。

```python
assert {p.name: p.value for p in receipt.snapshot.objects[0].properties}["diameter"] == 20
assert receipt.snapshot.objects[0].object_id == previous.objects[0].object_id
assert set(replaced_ids).isdisjoint(previous_ids)
assert original_fcstd.read_bytes() == original_bytes
```

- [ ] Step 2：Agent 环境运行上述两文件，预期 FAIL（新适配器缺失）。
- [ ] Step 3：抽取当前 _program 的构造部分为可信 kernel，不改变旧导出验证语义。实现四种原生形体、六类命令及可信源副本；原子创建执行认领，保留几何／非几何对象和依赖，全场景共用坐标系。记录 source_spec、product_root_ids、稳定 UUID 属性和逐对象网格／曲线，源规格的组件身份与 Label 分开保存；只在 receipt 完整后认可候选。未知类型的属性只读，set_placement 只准四种独立原生形体。
- [ ] Step 4：重跑新增测试及 test_freecad_tool.py、test_freecad_workbenches.py、test_freecad_drawing.py、test_freecad_sheetmetal.py，预期 PASS。验证文件现有 100 MiB 上限、托管根约束和旧干涉／实体数门禁仍在；空文档与曲线对象不被伪装为实体。
- [ ] Step 5：仅提交原生／产物模块、被抽取旧入口和对应测试，feat: edit isolated native CAD document candidates。

### Task 4: 唯一 worker、旧建模共用通道及未知结果恢复

**Files:** Create L:/industry_agent/services/agent-service/app/cad_documents/coordinator.py、gateway.py；Create L:/industry_agent/scripts/freecad_document_worker.py；Modify L:/industry_agent/services/backend-service/app/cad_documents/repository.py、service.py、routes.py、L:/industry_agent/services/agent-service/app/tools/cad/freecad_mcp.py、L:/industry_agent/scripts/start_all.py；Test L:/industry_agent/services/agent-service/tests/test_freecad_document_coordinator.py、L:/industry_agent/services/backend-service/tests/test_cad_document_execution.py、L:/industry_agent/tests/test_freecad_document_startup.py。

**Interfaces:** Repository 增加 enqueue_system_job(kind, request_key, payload) -> NativeJob、take_job(worker_id) -> NativeJob | None、complete_job(worker_id, receipt) -> CommandRecord、fail_job(worker_id, job_id, error_code, outcome_unknown=False) -> CommandRecord、engine_state() -> dict。Gateway(backend: BackendServiceClient) 提供 enqueue_legacy(run_id: str, spec: dict) -> NativeJob、job(job_id: str) -> CommandRecord。CadDocumentWorker(backend, native_client, artifacts, worker_id) 提供 tick() -> dict、reconcile(job_id: str) -> dict。

- [ ] Step 1：写 test_two_workers_never_execute_together、test_expired_lease_does_not_release_unknown_job、test_lost_submit_queries_original_job；同文档和旧生成共用执行计数，阻塞事件期间第二 worker 的 CAD 调用数为 0，重复 submit 的 job_id 相同。

```python
assert max_parallel_native_calls == 1
assert second_worker.tick()["state"] == "blocked"
assert backend.get_command(actor, doc_id, command_id).state == "outcome_unknown"
assert native_calls_after_reconcile == native_calls_before_reconcile
```

- [ ] Step 2：分别用 Agent／Backend 环境运行对应新增测试，startup 文件按 Agent 环境运行；预期 FAIL。
- [ ] Step 3：实现数据库执行者认领、原生收据恢复和一个 worker 进程。接通已存在 get_rpc_status 的 GUI 状态，核对 runtime-state／pid／版本，只关闭候选文档。FREECAD_DOCUMENTS_ENABLED=true 时旧 freecad_mcp 不直连执行，转为 legacy_generate 作业；false 时保留原分支但文档 API 不可写。共享构造／校验，禁止把任意 code 放入网关。启动器在 Backend 健康后启动脚本；重复启动凭 worker 状态和租约复用，不靠进程名随意终止服务。
- [ ] Step 4：重跑新增文件及 test_freecad_client.py、test_freecad_api.py、test_freecad_start_all.py；预期 PASS。模拟崩溃在 native 保存后／DB 提交前，凭摘要登记一次；没有終结收据时保留写屏障，queue 超时不换请求身份。
- [ ] Step 5：提交唯一协调和旧路径接入及对应测试，feat: serialize CAD mutations through a durable worker。

### Task 5: 个人文档 API、同源代理与只读恢复

**Files:** Create L:/industry_agent/services/agent-service/app/cad_documents/service.py、L:/industry_agent/services/agent-service/app/api/freecad_documents.py；Modify L:/industry_agent/services/agent-service/app/api/server.py、L:/industry_agent/services/agent-service/monitor_web_server.py；Test L:/industry_agent/services/agent-service/tests/test_freecad_document_api.py、test_monitor_cad_document_proxy.py。

**Interfaces:** CadDocumentApplication(backend_factory, artifacts) 提供 create(actor_id, body) -> DocumentHead、submit(actor_id, command) -> CommandRecord、head(actor_id, document_id) -> DocumentHead、snapshot(actor_id, document_id, revision) -> DocumentSnapshot、command(actor_id, document_id, command_id) -> CommandRecord、documents(actor_id, cursor='', limit=50) -> dict。build_document_router(require_write_auth, application_factory) -> APIRouter，路径为设计第 10 节的 documents 及快照／命令接口；新增 GET /documents/{document_id}/snapshots/{revision}/artifacts/{name}。

- [ ] Step 1：写 test_session_required_for_new_documents、test_stale_revision_rejected_without_execution、test_copy_does_not_claim_legacy_owner、test_proxy_keeps_cookie_and_origin。断言无会话 401、旧修订 409、另一账号 403、非法正文 422；被拒请求 worker 作业计数不增加，下载仍按归属检查。

```python
assert anonymous.post("/api/cad/freecad/documents", json=body).status_code == 401
assert owner.post(command_url, json=stale_body).status_code == 409
assert kernel_job_count == before_rejected_requests
```

- [ ] Step 2：Agent 环境运行两个新增文件，预期 FAIL（404 或身份未约束）。
- [ ] Step 3：复用 team_actor，校验同源和服务认证；修改返回 202＋command 身份。创建正文为 request_id、part_name、part_number、source_run_id，除 source_run_id 外全部必填，空编号允许；复制从当前允许只读的完整已完成记录取得服务端产物／摘要，初始化为 import 作业。代理保留 Cookie、验证 Origin；转发 nosniff／CSP／Content-Disposition，禁止直接客户端路径。
- [ ] Step 4：重跑新增文件及 test_monitor_cad_production_proxy.py、test_team_auth_boundary.py，预期 PASS；用已过期来源、被替换 object_id、关闭开关和存储失败测试无静默回退。
- [ ] Step 5：仅提交 API／代理和测试，feat: expose authenticated CAD document editing APIs。

### Task 6: 不可变发布、参数标准及兼容读取

**Files:** Create L:/industry_agent/services/agent-service/app/cad_documents/publishing.py；Modify L:/industry_agent/shared/freecad_document_standards.py、L:/industry_agent/services/backend-service/app/cad_documents/repository.py、service.py、L:/industry_agent/services/agent-service/app/api/freecad_documents.py、app/agents/cad/modeling_api.py、app/cad_documents/native_program.py；Test L:/industry_agent/services/agent-service/tests/test_freecad_document_publish.py、L:/industry_agent/services/backend-service/tests/test_cad_document_publish.py。

**Interfaces:** build_document_standard(snapshot: DocumentSnapshot, run_id: str) -> StandardParameters；CadDocumentPublisher(application) 提供 publish(actor_id, document_id, command_id, expected_revision) -> CommandRecord、public_run(request, run_id) -> dict | None、designs(actor_id, cursor='', limit=50) -> dict。新增 POST /documents/{document_id}/publish 及 GET /designs；Repository 增加 commit_publication(worker_id, receipt, standard) -> dict；同 actor＋DOC＋revision 只有一个发布记录。get_freecad_run_record 先询问持久 public_run，明确不存在才读旧 Redis。

- [ ] Step 1：写 test_publish_same_revision_returns_original_run、test_hidden_product_still_exports、test_constructor_geometry_not_exported、test_standard_binds_current_geometry、test_private_run_never_falls_back_to_redis。

```python
assert repeated["run_id"] == first["run_id"]
assert len(published["run_id"]) == 67
assert exported_root_ids == snapshot.product_root_ids
assert changed_standard.digest != previous_standard.digest
assert redis_reads_on_forbidden_or_mysql_failure == 0
```

- [ ] Step 2：Agent 和 Backend 分别运行新增 publish 测试；预期 FAIL。
- [ ] Step 3：实现根对象导出、STEP 回读和固定产物清单，校验后原子登记发布、递增目录版本；新运行身份取 sha256([actor, document_id, revision]) 的固定规范化 JSON，保留 FC 前缀。标准从当前原生属性／可靠规格映射提取，所有新消费者使用 standard_parameters；spec 无旧格式时为 None，未覆盖项不猜测。完整发布产物按本次用户归属下载，旧匿名读取行为不改写。
- [ ] Step 4：重跑新增文件及 test_freecad_http_contract.py、test_design_quality_integration.py，预期 PASS；模拟导出／DB 故障、新原生球／锥与任意旋转、多个根、缺失收据、清空隔离 Redis。记录消失或摘要损坏不能读成旧标准。
- [ ] Step 5：提交发布／标准和兼容边界，feat: publish immutable CAD versions with verified standards。

### Task 7: 能力目录与可信 AI 命令提案

**Files:** Create L:/industry_agent/services/agent-service/app/cad_documents/capabilities.py、proposal.py；Modify L:/industry_agent/services/agent-service/app/api/freecad_documents.py、app/agents/cad/graph.py、app/tools/registry.py、app/skills/cad/production_modeling.md；Test L:/industry_agent/services/agent-service/tests/test_freecad_document_capabilities.py、test_freecad_document_proposal.py。

**Interfaces:** resolve_freecad_spec(prompt: str, model, explicit_spec: dict | None=None) -> dict，从现有 model_3d 抽出解析，返回 {status:'ready',spec} 或 {status:'needs_input',questions}，不调用 CAD。propose_document_command(head: DocumentHead, snapshot: DocumentSnapshot, prompt: str, model) -> dict 返回 {status,command,questions}；read_capabilities(inventory: dict, evidence: dict) -> dict，通过 GET /capabilities 暴露。新增 POST /documents/{document_id}/proposals，正文 prompt／expected_revision，不产生写作业；用户确认后仍调用 Task 5 commands。

- [ ] Step 1：写 test_directory_is_not_execution、test_discovery_not_equal_readiness、test_ai_missing_dimensions_needs_input、test_proposal_does_not_mutate、test_unverified_ai_remains_pending。Mock 模型输出额外 code／未知对象必须拒绝；同一 fake 中文需求和手动参数产生相同 CommandEnvelope。

```python
assert proposal["status"] == "needs_input"
assert queued_mutations == 0
assert capability["installed"] is True and capability["manual_verified"] is False
assert capability["ai_verified"] is False
```

- [ ] Step 2：运行两个新增文件及 test_freecad_graph.py 的相关测试，先确认新需求 FAIL。
- [ ] Step 3：复用当前严格尺寸核对／needs_input 逻辑，新增命令工具声明但不把 execute_code 变成网页工具。提案消费显式 expected_revision；确认时服务器再次验证。discover 作业读取模块／注册命令，不激活未信任插件；合并内核、适配器版本和本地验证报告，保留未验证／缺依赖／权限限制原因。
- [ ] Step 4：全部上述测试及 test_cad_modeling_contract.py、test_freecad_advanced.py 预期 PASS；证据版本不符时撤销可用标记，目录读取和 Mock 提案均不得连接真实收费模型或控制工厂。
- [ ] Step 5：提交目录和 AI 提案层，feat: expose verified CAD capabilities and typed AI proposals。

### Task 8: 网页文档 API 与防串用状态

**Files:** Create L:/industry_agent/frontend/monitor-react/src/app/production-cad/documentApi.mjs、documentState.mjs、useCadDocument.jsx、documentState.test.mjs；Modify L:/industry_agent/frontend/monitor-react/src/app/production-cad/completedDesigns.mjs。

**Interfaces:** createDocumentApi(request) -> {create,documents,head,snapshot,submit,command,publish,designs,propose,capabilities}，所有读取支持 AbortSignal。createDocumentState(actorId: str) -> state、applyDocumentSnapshot(state, snapshot, token) -> state、selectDocument(state, documentId) -> state、documentPollDelay(visible: bool) -> number | null；useCadDocument({actorId,documentId,api}) 提供 head、snapshot、selectedObjectId、pending、error、submit、publish、selectObject。token 包含 actor、DOC 和世代，轮询 2000 ms。

- [ ] Step 1：编写 node:test 失败测试，固定跨账号／跨 DOC／旧 revision 响应不改变 state，以及提交未收到响应仍保存原 command_id。

```javascript
assert.equal(documentPollDelay(true), 2000);
assert.equal(documentPollDelay(false), null);
assert.equal(applyDocumentSnapshot(current, oldSnapshot, oldToken), current);
assert.equal(reconciled.pending.command_id, submitted.pending.command_id);
```

- [ ] Step 2：运行 node --test frontend/monitor-react/src/app/production-cad/documentState.test.mjs；预期 FAIL（模块缺失）。
- [ ] Step 3：实现纯状态模块、同源请求和 Hook；原命令身份在发送前按账号＋文档保存到会话草稿索引，仅查回恢复。完成后立刻拉取同修订树／网格快照，replace 清空旧 object_id；focus／visibility 刷新，后台取消轮询。完成事件只在发布成功后通知质检，不因普通工作修改发布旧 FC。
- [ ] Step 4：重跑该文件及 completedDesigns 的既有覆盖（freecadAdvanced.test.mjs、qualityParts.test.mjs）；预期 PASS；补测 storage 无权限、HTTP 401、AbortError 不覆盖当前错误状态。
- [ ] Step 5：提交文档状态与调用边界，feat: synchronize owned CAD document state in the browser。

### Task 9: 模型树、属性编辑与工作区接入

**Files:** Create L:/industry_agent/frontend/monitor-react/src/app/production-cad/DocumentWorkspace.jsx、DocumentTree.jsx、DocumentProperties.jsx；Modify L:/industry_agent/frontend/monitor-react/src/app/production-cad/ProductionCadWorkspace.jsx、productionCad.css；Test L:/industry_agent/tests/browser/freecad-document-workspace.test.mjs。

**Interfaces:** DocumentWorkspace({api,actorId,initialDocumentId}) 消费 Task 8；DocumentTree({snapshot,selectedObjectId,onSelect})；DocumentProperties({object,pending,onSubmit})。表单只生产 Task 1 类型化参数，尺寸提交显式按按钮；AI 提案显示旧值／新值后调用同一 submit。

- [ ] Step 1：浏览器写 test 手动创建／修改／刷新后恢复、重复中文 Label、只读复杂对象、未登录／空文档／未知任务，以及 AI 提案未确认时没有 command POST。

```javascript
assert.equal(posts.filter(p => p.command_type === 'set_primitive_dimensions').length, 1);
assert.equal(lastCommand.parameters.object_id, selectedUuid);
assert.equal(await page.getByText('孔标签已改').count(), 1);
assert.equal(await page.getByText('安装底板', {exact:true}).count(), 1);
```

- [ ] Step 2：用已核实浏览器环境运行新增文件；预期 FAIL（入口／组件缺失），不是 browser 模块未安装。
- [ ] Step 3：保留原入口和已有示例，在个人文档模式显示目录、新建、明确复制历史版本、树、属性、手动基础形体和保存版本。复杂类型只读字段说明原因，不隐藏零件。状态显示当前工作修订／已发布版本和未发布修改；submit／publish busy 时禁用重复写，未知任务只提供查回。
- [ ] Step 4：新增浏览器文件及 tests/browser/freecad-workspace.test.mjs 预期 PASS；验证页面键盘选择、中文输入、窄屏布局、错误草稿保留、侧栏及旧生成功能没有恢复删除的模式按钮。
- [ ] Step 5：只提交工作区组件、CSS 和测试，feat: add native document tree and manual CAD properties。

### Task 10: 逐对象三维场景、拾取及视图控制

**Files:** Create L:/industry_agent/frontend/monitor-react/src/app/production-cad/documentScene.mjs、DocumentViewer.jsx、documentScene.test.mjs；Modify L:/industry_agent/frontend/monitor-react/src/app/production-cad/DocumentWorkspace.jsx；Test L:/industry_agent/tests/browser/freecad-document-viewer.test.mjs。

**Interfaces:** buildDocumentScene(snapshot, loadGeometry, signal) -> Promise<sceneBundle>、objectIdFromIntersection(intersection) -> str | null、cadToViewerPosition([x,y,z]) -> [x,y,z]；DocumentViewer({snapshot,selectedObjectId,onSelect})。sceneBundle 提供 root、bounds、objectMap、dispose，不在每个模型上单独 center。

- [ ] Step 1：写测试两个组件间距保持 40 mm、树与点选 UUID 一致、曲线／非几何对象可读、被隐藏对象不拾取、整体零厚度范围不被当坏实体。

```javascript
assert.deepEqual(cadToViewerPosition([0,0,10]), [0,10,0]);
assert.equal(objectIdFromIntersection(hit), 'OBJ-b');
assert.equal(componentDistance(scene), 40);
assert.equal(scene.objectMap.has(nonGeometricUuid), false);
```

- [ ] Step 2：分别运行 node --test frontend/monitor-react/src/app/production-cad/documentScene.test.mjs 和浏览器文件；预期 FAIL。
- [ ] Step 3：用现有 Three.js／STLLoader／OrbitControls 逐对象加载并统一坐标变换，Raycaster 仅返回 object_id。实现正交／透视、标准方向、适应视图和高亮；曲线用 LineSegments 显示但不提供边编辑。切换快照前完成一致性核验，再整体更换场景并 dispose 旧资源；旧异步加载不得加入新版。
- [ ] Step 4：两文件及 directEditing.test.mjs、motion.test.mjs 预期 PASS；测试 WebGL 丢失、坏网格、卸载和缓存 URL 身份不匹配；原运动预览不改造为新的虚构装配。
- [ ] Step 5：提交新场景与视图交互，feat: render and select native CAD objects with stable identities。

### Task 11: 新发布版本目录与质检基准接通

**Files:** Modify L:/industry_agent/shared/simulated_part_design_quality.py、L:/industry_agent/services/agent-service/app/api/quality_simulation.py、L:/industry_agent/frontend/monitor-react/src/app/qualityParts.mjs、QualityWorkspace.jsx、production-cad/completedDesigns.mjs；Test L:/industry_agent/services/agent-service/tests/test_freecad_document_quality.py、L:/industry_agent/frontend/monitor-react/src/app/qualityParts.test.mjs、L:/industry_agent/tests/browser/quality-document-updates.test.mjs。

**Interfaces:** 现有 build_basis(run: dict) -> dict／verify_basis(basis: dict) -> dict 增加提取器 freecad_document_parameters_v1，调用 Task 1／6 标准核验；旧 EXTRACTOR 和 DISPLAY_EXTRACTOR 不改摘要语义。mergePublishedParts(legacy: list, published: list) -> list 在 qualityParts.mjs 导出；QualityWorkspace 增加 follow-current／明确历史选择状态，消费 GET /api/cad/freecad/designs。

- [ ] Step 1：写 test_native_document_standard_is_authoritative、test_corrupt_document_standard_does_not_use_old_spec、test_prior_batch_stays_with_prior_run、test_follow_current_refreshes_but_history_selection_stays。固定 spec=None 仍展示原生零件；新发布不会发 detect POST，过期响应不会恢复旧结果。

```python
assert build_basis(published_native)["parameters"] == published_native["standard_parameters"]["parameters"]
with pytest.raises(ValueError): build_basis(corrupted_native_with_old_spec)
assert old_batch["design_run_id"] == previous_run_id
```

- [ ] Step 2：Agent 环境运行新增 Python 文件，node 跑 qualityParts.test.mjs 和新增浏览器文件；先确认新标准与更新行为 FAIL。
- [ ] Step 3：旧标准继续原验证，新标准按来源／摘要优先核验并保留 uncovered；新 basis 保存 standard_parameters、document_id、revision，保证 verify_basis 能从保存内容重建同一摘要。数据库保存结果及读回仍确定性重算，旧批次不能换提取器。分页目录合并完整 FC 身份，跟随模式发现新版后清结果和请求世代；历史模式只提示新版本。清理既有自动检测触发，发布和刷新只读取标准，用户新检测仍走当前明确数据来源及原设备门禁。
- [ ] Step 4：新增文件、test_simulated_quality_api.py、test_part_quality_boundary.py、tests/browser/quality-model-updates.test.mjs、quality-simulation.test.mjs 预期 PASS；修改旧测试中“刷新自动生成批次”的假设为明确点击，其他模拟标记、分母规则和问题定位断言不放宽。
- [ ] Step 5：提交新标准及版本衔接，feat: bind quality standards and results to published CAD versions。

### Task 12: 隔离真实验证、当前源码构建与能力证据

**Files:** Create L:/industry_agent/scripts/freecad_documents_smoke.py、L:/industry_agent/tests/test_freecad_documents_smoke.py、L:/industry_agent/tests/integration/freecad_document_stack.py、test_freecad_document_mysql.py、test_freecad_document_live.py；Create L:/industry_agent/docs/freecad-production-documents.md；Modify L:/industry_agent/services/agent-service/app/cad_documents/capabilities.py 仅接入验证报告；构建输出 L:/industry_agent/frontend/monitor/。

**Interfaces:** freecad_documents_smoke.verify(output_dir: Path, transport, fixture_backend) -> dict；start_isolated_document_stack(tmp_root: Path, mysql_config: dict) -> context manager 返回 {agent_url,monitor_url,backend_url,actor,worker_id}。报告包含 version_fingerprint、adapter_digest、command_coverage、native_checks、api_checks、browser_checks、artifacts、verified_at，不含密钥；能力目录只有匹配证据才提升 manual_verified，实际 AI 未调用仍为 false。

- [ ] Step 1：写 smoke 报告核验失败测试，断言 native_checks 缺失、错误版本、校验失败、对象／文件身份损坏不得标可用；MySQL 集成 fixture 创建独立测试库，不清空或改动原库。另写隔离栈退出仅终止自己启动进程的测试。
- [ ] Step 2：分别运行 Agent smoke 单测、Backend MySQL 测试（PYTHONPATH 切换），预期新增需求 FAIL；若 MySQL 不可用如实阻塞该项，不能以 SQLite 通过代替。
- [ ] Step 3：实现独立测试栈（18030／18010／18001 先检查空闲；worker 只连接测试 Backend），复用已就绪原生实例但只创建测试候选文档。四类基础形体实际创建、改尺寸、改标签、隐藏、发布、FCStd 重新打开，并验证 STEP 体积／数量／边界；实际旧装配／BIM／钣金／工程图生成保持原校验。未知任务使用隔离 transport 故障注入，不故意卡住现有 GUI。
- [ ] Step 4：运行当前源码构建和纯测试；目标输出均为 PASS／零失败。Agent 与 Backend 套件分进程，前端单测独立：

```powershell
$env:PYTHONPATH = 'L:/industry_agent/services/agent-service;L:/industry_agent'
$cadAgentTests = @(Get-ChildItem -LiteralPath 'services/agent-service/tests' -Filter 'test_freecad_document_*.py' -File | ForEach-Object FullName)
if ($cadAgentTests.Count -eq 0) { throw 'No Agent CAD document tests found' }
& 'L:/industry_agent/.venv/Scripts/python.exe' -m pytest @cadAgentTests tests/test_freecad_documents_smoke.py tests/test_freecad_document_startup.py -q
$env:PYTHONPATH = 'L:/industry_agent/services/backend-service;L:/industry_agent'
$cadBackendTests = @(Get-ChildItem -LiteralPath 'services/backend-service/tests' -Filter 'test_cad_document_*.py' -File | ForEach-Object FullName)
if ($cadBackendTests.Count -eq 0) { throw 'No Backend CAD document tests found' }
& 'L:/industry_agent/.venv/Scripts/python.exe' -m pytest @cadBackendTests -q
node --test frontend/monitor-react/src/app/production-cad/documentState.test.mjs frontend/monitor-react/src/app/production-cad/documentScene.test.mjs
node --test tests/browser/freecad-document-workspace.test.mjs tests/browser/freecad-document-viewer.test.mjs tests/browser/quality-document-updates.test.mjs
npm --prefix frontend/monitor-react run build
```

PowerShell 通过明确路径数组运行测试，不把“没找到测试”当通过。每个命令检查自己的退出码，Python 环境按服务切换；构建前确认 Vite outDir 精确解析为 L:/industry_agent/frontend/monitor，已有源码 public 文件仍可重建；不清其他目录。

- [ ] Step 5：执行新隔离真实用例，确认测试库、进程、原生实例身份后，在 Agent 环境运行 tests/integration/test_freecad_document_live.py 和 smoke，Backend 环境运行 test_freecad_document_mysql.py。报告真实测试数、失败和跳过；完整现有 Agent 套件如仍有基线失败逐项列出，不宣称全项目通过。运行时目录证据放 .runtime/verification，不提交用户产物；真实 AI 测试留待明确费用授权。
- [ ] Step 6：文档记录入口、开关、单 worker、恢复／未知状态、个人权限、只读类型、未完成工作台和测试证据。若需要展示更新，只重新构建前端及重启明确由项目管理的相关应用，保留 FreeCAD、工厂及数据基础设施；未重启则明确标注运行服务仍为旧版本。
- [ ] Step 7：仅提交源码、测试、文档及仓库原本跟踪的构建产物；运行 git diff --check 和分支范围审查，修复可重现问题后交付，不自动推送。最终汇报“第一阶段完成”及未验证项，不声称全 FreeCAD 完成。

## 计划自查映射

| 设计要求 | 实施及验证任务 |
| --- | --- |
| 第 1–4 节：双入口、既有模型可展示、基础真实修改、后续范围不冒充完成 | 3、7、9、10、12 |
| 第 5–7 节：模块边界、归属、持久修订、串行与未知结果 | 1、2、3、4、5 |
| 第 8 节：逐对象坐标、同修订快照、2 秒及过期响应 | 8、9、10 |
| 第 9 节：根对象发布、标准摘要、旧结果身份、不自动检测 | 6、11、12 |
| 第 10 节：接口／下载／会话／同源 | 5、6、7 |
| 第 11 节：安装／适配／依赖／证据区分 | 7、12 |
| 第 12 节：原生、MySQL、浏览器和旧工作台回归 | 各任务红绿＋12 |
| 第 13 节：用户审阅计划和选定执行方式 | 本计划交付后等待，不在写计划时实现 |

Review Focus 五项均有指定失败测试；没有用跳过原生、假模型、假模型树、缩减旧校验或伪造检测结果来填补范围。后续 Sketcher、全 PartDesign、完整撤销重做和各专业工作台不在此计划实现。

## 执行方式与交付边界

推荐 Native：由当前会话逐项实现，每项红—绿验证并保持接口一致，最后独立审查整个第一阶段；这些任务紧密依赖同一个版本／事务契约，连续实现更便于核对。可选 Subagent-driven：每项由新实现者及审阅者处理，独立审查更频繁，但上下文和协调成本更高。

用户需审阅本计划并选定执行方式。当前只有设计和计划文档，所有实施复选框为空，功能代码尚未改动。选定方式后再读取对应执行技能，并从 Task 1 开始；实施过程中遇到必须扩大范围的决定先说明，不用“全功能”目标自动授权。
