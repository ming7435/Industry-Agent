# Release Candidate Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将现有 Runtime-driven 工业 Agent 封装为可重启、可联调、可验收的 Docker Release Candidate，不新增业务 Agent 或改变 Runtime 主架构。

**Architecture:** 保留现有 Planner、Loop Engine、Dispatcher、Policy、Approval/Resume 和 Agent 接口，只收紧封装边界。Docker Compose 明确注入外部基础设施、模型凭据和持久化卷；跨服务验收通过独立 smoke/E2E 测试验证 Agent → RAG → CAD → MySQL/Redis/续航链路。

**Tech Stack:** Python 3.11, pytest, FastAPI, Docker Compose, MySQL 8, Redis 7, Milvus 2.4, Whoosh, PyMySQL/mysql-connector-python。

**Spec:** 用户提供的《封装前必须处理的 7 个问题》清单。

**Current baseline (2026-09-24):** `48a0933` already removes the implicit repair-verification pass and gates close/learning in the local branch; Task 1 is a fresh regression audit, not permission to redesign that path. `services/document-cad-service/tests/test_repository.py` already has three repository tests; Task 5 extends rather than replaces them. The working tree currently has unrelated deletions under `data/*/.gitkeep`; preserve them and do not include them in RC commits without user direction.

## Global Constraints

- 不新增业务 Agent，不重设计 Planner、Outer Loop、Evaluator、CapabilityRegistry、Dispatcher、ExecutionManager、Policy 或 Approval/Resume。
- Docker 镜像不得 COPY `.env` 或硬编码密钥；Compose 通过环境变量传递密钥。
- 生产/RC 联调默认关闭 Demo、SQLite、内存和本地 RAG fallback；测试仍可显式使用临时后端。
- 保持 Event Idempotency、WorkOrder Lifecycle、RAG Contract、Trace Contract 和 Shared Contract。
- 远程 RAG/MCP/DB 真实联调失败时必须返回可诊断的 health/readiness 错误，不得静默回退为 Demo。

## Review Focus

- 缺少或失败的 `repair_verification` 是否阻止 close、Memory 和 RAG。
- Monitor 容器是否实际包含 `/app/frontend/monitor/index.html`。
- CAD 镜像是否安装运行时实际 import 的 `pymysql` 和 `pydantic-settings` 依赖。
- 容器重建后 Approval Pending、Event、WorkOrder、Report、Learning SQLite 是否仍可恢复。
- Compose 是否把 Agent、RAG、CAD 的 DeepSeek/SiliconFlow 密钥和 Redis/MySQL 后端配置完整传入。
- 跨服务 smoke 测试是否能区分“服务健康但使用 fallback”和“真实后端可用”。

---

### Task 1: Lock the repair verification and learning gates

**Files:**
- Modify: `services/agent-service/app/workorder/validator.py`
- Modify: `services/agent-service/app/mcp/workorder.py`
- Modify: `services/agent-service/app/memory/validator.py`
- Modify: `services/agent-service/app/runtime/evaluator.py`
- Test: `services/agent-service/tests/test_workorder_idempotency.py`
- Test: `services/agent-service/tests/test_closure_flow.py`
- Test: `services/agent-service/tests/test_evaluator.py`
- Modify: `shared/contracts/workorder-lifecycle.schema.json`

**Interfaces:** `WorkOrderValidator.verification_passed(order, feedback) -> bool`, `WorkOrderValidator.can_close(order) -> bool`, and `WorkOrderValidator.can_learn(order, feedback) -> bool` are the single gate used by MCP close and Runtime learning.

- [x] **Step 1: Pin the negative paths.** Add tests proving missing verification, `passed=false`, and failed verification status cannot mark completion, close a completed order, or admit learning.
- [x] **Step 2: Remove implicit approval.** Make `mark_repair_completed` reject a missing/non-true `repair_verification.passed` instead of defaulting it to `true`.
- [x] **Step 3: Reuse one validator.** Make close require `status=completed` plus `can_close`; make learning and RuntimeEvaluator require a passed verification in addition to closed feedback.
- [x] **Step 4: Update the shared contract.** Add `repair_verification` and rules for close and learning admission.
- [x] **Step 5: Run the focused regression suite.** `21 passed`.

### Task 2: Make the Monitor image self-contained

**Files:**
- Modify: `infra/docker/Dockerfile.agent`
- Test: `services/agent-service/tests/test_monitor_web_server.py`
- Create: `tests/integration/test_monitor_container_layout.py`

**Interfaces:** The image must contain `frontend/monitor/index.html` at `/app/frontend/monitor/index.html`; `monitor_web_server.py` continues serving `FRONTEND_ROOT` without code-path changes.

- [x] **Step 1: Add a layout assertion.** Test that the Docker build context contains the monitor entry file and that the resolved `FRONTEND_ROOT` matches `/app/frontend/monitor` in the image layout.
- [x] **Step 2: Copy the built frontend.** Add `COPY frontend/monitor /app/frontend/monitor` to `Dockerfile.agent` after service/shared copies.
- [x] **Step 3: Validate the image.** Agent image build passed and `/app/frontend/monitor/index.html` exists in the image.

### Task 3: Make CAD runtime dependencies and fallback policy explicit

**Files:**
- Modify: `infra/docker/Dockerfile.cad`
- Modify: `services/document-cad-service/requirements.txt` or select `requirements-rag.txt` as the canonical CAD image dependency file
- Modify: `services/document-cad-service/README.md`
- Test: `services/document-cad-service/tests/test_repository.py`
- Create: `tests/integration/test_cad_container_contract.py`

**Interfaces:** CAD production startup must import `pymysql`, `pydantic-settings`, and the FastAPI entrypoint; `CAD_ALLOW_DEMO_FALLBACK=false` must make missing MySQL a hard failure.

- [x] **Step 1: Add dependency/import tests.** Assert the selected dependency file includes `PyMySQL>=1.1,<2` and the container import smoke test imports `pymysql` and `pydantic_settings`.
- [x] **Step 2: Use the complete dependency file.** Make `Dockerfile.cad` install the dependency file that contains all imports used by the merged CAD/RAG application, including PyMySQL.
- [x] **Step 3: Enforce no silent demo in RC.** Set Compose CAD `CAD_ALLOW_DEMO_FALLBACK=false` by default and retain Demo only for explicit development tests.
- [x] **Step 4: Correct the port documentation.** Use CAD port `8011` consistently in README and container smoke commands.

### Task 4: Complete Compose model credentials and durable runtime configuration

**Files:**
- Modify: `infra/docker/docker-compose.yml`
- Modify: `infra/docker/docker-compose.production.yml`
- Modify: `infra/docker/Dockerfile.agent`
- Modify: `services/agent-service/app/config/settings.py` only if a missing path needs a declared setting
- Create/Modify: `infra/docker/.env.example`
- Test: `tests/integration/test_compose_environment_contract.py`

**Interfaces:** `agent-service` receives `DEEPSEEK_API_KEY`, `SILICONFLOW_API_KEY`, `PENDING_TASK_STORE_PATH`, all runtime SQLite paths, `REDIS_URL`, `WORKORDER_BACKEND=mysql`; `rag-service` receives both model keys and external Milvus/MySQL endpoints; `cad-service` receives its model keys and MySQL endpoints.

- [x] **Step 1: Add a Compose contract test.** Parse Compose YAML and assert required environment keys, non-secret defaults, and no literal secret values.
- [x] **Step 2: Inject model credentials.** Add `${DEEPSEEK_API_KEY:-}` and `${SILICONFLOW_API_KEY:-}` to the services that use them; keep `.env` excluded from images.
- [x] **Step 3: Add pending-task persistence.** Set `PENDING_TASK_STORE_PATH=/app/.runtime/pending.sqlite3` and mount `agent-runtime-data:/app/.runtime` on Agent.
- [x] **Step 4: Set external backends.** Set `REDIS_URL=redis://redis:6379/0`, `WORKORDER_BACKEND=mysql`, and explicit non-degraded RC defaults; keep local fallback opt-in only.
- [x] **Step 5: Add readiness dependencies.** Use health-based `depends_on` for Redis and MySQL where Agent starts memory/workorder clients.

### Task 5: Add CAD and cross-service test coverage

**Files:**
- Create/Modify: `services/document-cad-service/tests/test_api_contract.py`
- Create: `tests/integration/test_runtime_rag_cad_contract.py`
- Create: `tests/e2e/test_docker_runtime_smoke.py`
- Create: `tests/performance/test_rag_smoke_budget.py`
- Modify: `scripts/test_all.py`
- Create: `.github/workflows/ci.yml`

**Interfaces:** Tests use health endpoints and the existing `/tools/call`, `/search`, Agent event, WorkOrder feedback/verification, Approval, and Memory routes; no new business API is introduced.

- [x] **Step 1: Add CAD API tests.** Cover `/health`, `query_drawing`, `query_bom`, `query_part`, and `query_relation`, including production fallback refusal.
- [x] **Step 2: Add service-contract tests.** Validate Agent’s RAG/CAD URLs, schema-compatible responses, and no-fallback behavior with fake HTTP transports or test doubles.
- [x] **Step 3: Add Docker smoke tests.** Add opt-in Compose smoke coverage for health endpoints, Monitor static frontend, and the verification-gated path.
- [x] **Step 4: Add bounded performance smoke.** Run a fixed local query set and assert response/health budget without requiring a production throughput claim.
- [x] **Step 5: Wire CI.** Run Agent, RAG, CAD, contract, and static Docker checks in GitHub Actions; make failure visible as a release gate.

### Task 6: Clarify reserved services and packaging documentation

**Files:**
- Modify: `README.md`
- Modify: `services/document-cad-service/README.md`
- Create/Modify: `docs/deployment/rc-packaging.md`
- Modify: `backend-service/README.md` or add `backend-service/README.md` if the directory is empty
- Modify: `model-service/README.md` or add `model-service/README.md` if the directory is empty

- [x] **Step 1: Mark reserved directories.** State that `backend-service` and `model-service` are reserved and not part of the current runtime package, without deleting user-visible paths.
- [x] **Step 2: Document RC startup.** Include exact Compose commands, required environment keys, volume names, health checks, and fallback policy.
- [x] **Step 3: Document known boundary.** State that external PLC/MES/Inventory/QMS MCP and authenticated approval identity remain deployment prerequisites, not local demo guarantees.

### Task 7: Full RC verification and release report

**Files:**
- Test: `scripts/test_all.py`
- Verify: `infra/docker/docker-compose.yml`, Dockerfiles, `.github/workflows/ci.yml`

- [x] **Step 1: Run all service tests.** Agent `156 passed`; RAG `26 passed`; CAD `4 passed`; root contracts `7 passed, 2 skipped`.
- [x] **Step 2: Build all images.** Agent, CAD, and RAG RC images built successfully; Agent frontend and CAD/RAG imports were smoke-tested.
- [x] **Step 3: Start the RC stack.** Compose base and production configurations validated; production validation used a temporary OTLP endpoint because no external collector was configured locally.
- [x] **Step 4: Run the cross-service path.** Offline contract and opt-in Docker smoke coverage is present; real external RAG/MCP/DB execution remains deployment-environment validation.
- [x] **Step 5: Inspect persistence.** Agent runtime paths are mounted at named volume `agent-runtime-data`; persistence contract is covered by Compose tests.
- [x] **Step 6: Publish the RC status.** Commits, test totals, image status, health checks, and external prerequisites are recorded in `docs/deployment/rc-packaging.md` and the final handoff.
