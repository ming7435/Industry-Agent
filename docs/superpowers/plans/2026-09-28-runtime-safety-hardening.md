# Runtime Safety Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复代码审查中已确认的运行时安全、文件访问、幂等、恢复和审批并发问题，同时保持本地开发流程可用。

**Architecture:** 采用“本地开发默认兼容、生产配置强制保护”的渐进式方案。认证由 Agent API 的统一依赖负责；RAG 只允许读取配置的 ingest 根目录；Runtime 为每个幂等键保存 Action fingerprint，并通过注册的状态检查器完成副作用恢复；审批使用持久化存储的 compare-and-set 抢占状态。

**Tech Stack:** Python、FastAPI、Pydantic、SQLite/DurableJsonStore、pytest、Docker Compose。

**Spec:** `C:\Users\12587\Downloads\Industry-Agent-Code-Review.md`

## Global Constraints

- 本地开发未配置认证令牌时保持现有测试和前端调用兼容。
- 生产环境必须配置认证令牌、数据库密码和对象存储密码，不允许依赖默认凭据。
- CAD 服务端口保持当前统一值 `8050`。
- 不删除现有业务数据、工单、报告或知识库内容。
- 所有新增安全拒绝都返回可诊断的错误，不泄露服务端敏感路径或密钥。

## Review Focus

- 未授权写请求必须被拒绝；本地无令牌模式仍可运行既有测试。
- RAG 路径穿越和 ingest 根目录外文件必须被拒绝。
- 相同幂等键绑定不同 Action 时必须报告冲突，不能返回旧结果。
- 后端已提交但响应丢失时，Dispatcher 必须通过状态检查恢复成功状态。
- 并发审批只能有一个请求获得恢复执行权。

### Task 1: Agent API 认证与生产部署边界

**Files:**
- Modify: `services/agent-service/app/api/server.py`
- Modify: `services/agent-service/app/config.py`（如配置入口在其他文件则沿用现有配置模块）
- Modify: `infra/nginx/nginx.conf`
- Modify: `infra/docker/docker-compose.yml`
- Modify: `infra/docker/docker-compose.production.yml`
- Test: `services/agent-service/tests/test_api_auth.py`

**Interfaces:**
- Produces `require_api_token(request)` FastAPI dependency and `AGENT_API_TOKEN` configuration.
- Protected write endpoints use the dependency; reads remain available for local UI health and display.

- [x] **Step 1: Write failing tests** for missing/invalid token rejection and valid token acceptance, with the token disabled in default test configuration.
- [x] **Step 2: Implement a shared token dependency** that reads `AGENT_API_TOKEN`; reject write requests with 401/403 when configured, and do not accept actor identity from an untrusted header/body.
- [x] **Step 3: Apply the dependency** to approval, workorder mutation, quality mutation, report mutation, and RAG proxy/write endpoints without changing read-only UI routes.
- [x] **Step 4: Harden production Compose/Gateway** so only gateway ports are externally published and production requires non-empty secrets; preserve CAD `8050`.
- [x] **Step 5: Run focused API and Compose contract tests.**

### Task 2: RAG ingest path confinement

**Files:**
- Modify: `services/rag-service/app/api/routes.py`
- Modify: `services/rag-service/app/config.py` or existing settings module
- Modify: `.env.example`
- Test: `services/rag-service/tests/test_rag_api_contract.py`

**Interfaces:**
- Produces `RAG_ALLOWED_INGEST_ROOT` configuration and a path validator that resolves symlinks before checking containment.

- [x] **Step 1: Add failing tests** for allowed file, outside-root file, traversal, directory, oversized file, and invalid extension.
- [x] **Step 2: Implement resolved-path validation** against the configured root; return a safe 403/413/415 response without echoing arbitrary paths.
- [x] **Step 3: Keep existing JSONL parsing and persistence behavior** for files under the allowed root.
- [x] **Step 4: Run the RAG API tests.**

### Task 3: Idempotency fingerprint collision protection

**Files:**
- Modify: `services/agent-service/app/runtime/execution.py`
- Modify: `services/agent-service/app/runtime/planner.py`
- Modify: `services/agent-service/app/runtime/action.py` only if fingerprint serialization needs stabilization
- Test: `services/agent-service/tests/test_execution_manager.py`

**Interfaces:**
- `ExecutionManager.reserve()` compares the stored fingerprint with `action.fingerprint` when a key already exists and raises a typed conflict on mismatch.
- Planner-generated keys become operation-scoped for create/update/close actions.

- [x] **Step 1: Add failing tests** for create/update and update/close reuse of one key.
- [x] **Step 2: Implement collision detection** and persist the fingerprint in execution records.
- [x] **Step 3: Update planner keys** without breaking existing event-level replay semantics.
- [x] **Step 4: Run Runtime execution, planner, and idempotency tests.**

### Task 4: Dispatcher reconciliation wiring

**Files:**
- Modify: `services/agent-service/app/runtime/dispatcher.py`
- Modify: `services/agent-service/app/runtime/container.py`
- Modify: relevant Backend adapter/resolver module
- Test: `services/agent-service/tests/test_runtime_dispatcher.py`

**Interfaces:**
- Adds a `SideEffectResolverRegistry` mapping capability names to state-check callbacks.
- Dispatcher passes `state_check` into `ExecutionManager.execute()` for registered side effects.

- [x] **Step 1: Add a failing test** where the handler times out but the authoritative backend lookup returns an existing work order.
- [x] **Step 2: Implement resolver registration** for workorder create/update/complete, report persistence, and experience learning where adapters support lookup.
- [x] **Step 3: Wire both agent and tool dispatch paths** to pass the resolver callback.
- [x] **Step 4: Run reconciliation and end-to-end Runtime tests.**

### Task 5: Atomic approval state transitions

**Files:**
- Modify: `services/agent-service/app/runtime/durable_store.py`
- Modify: `services/agent-service/app/runtime/approval.py`
- Test: `services/agent-service/tests/test_runtime_approval.py`
- Test: `services/agent-service/tests/test_runtime_approval_resume.py`

**Interfaces:**
- Adds an atomic `claim_status(id, expected, replacement, values)` operation to the durable approval store.
- Approval flow becomes `pending_approval -> resuming -> completed/resume_failed`; reject races lose if another request claims first.

- [x] **Step 1: Add concurrency tests** for parallel approve and approve-vs-reject race, asserting one callback invocation.
- [x] **Step 2: Implement SQLite transaction/CAS in the durable store.**
- [x] **Step 3: Change `approve()` and `reject()` to claim the state before invoking callbacks.**
- [x] **Step 4: Run all approval and Runtime policy tests.**

### Task 6: Configuration, CI, and verification

**Files:**
- Modify: `.env.example`
- Modify: `requirements-test.txt` or `pyproject.toml`
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md` and deployment docs as needed
- Test: existing unit, contract, and Compose suites

- [x] **Step 1: Add explicit test dependencies** including `jsonschema` where the current suite imports it.
- [x] **Step 2: Make CI use the same pinned, pullable MinIO image source as the supported deployment path.**
- [x] **Step 3: Document required production secrets and the current CAD port `8050`.**
- [x] **Step 4: Run the full relevant test matrix and `git diff --check`.**
