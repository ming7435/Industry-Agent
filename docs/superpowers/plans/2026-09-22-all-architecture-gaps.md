# All Known Architecture Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining runtime, persistence, fallback, routing, RAG, timeout, configuration, and regression gaps identified in `ARCHITECTURE_MODIFICATION_PLAN.md` while preserving existing Agent/A2A/Skill/Tool/API contracts.

**Architecture:** Keep one Agent Runtime and make state boundaries explicit. Add repository interfaces with a SQLite durable implementation for local/demo operation and leave MySQL as an injectable production backend. Make RAG writes/searches durable through the standalone document store, surface partial failures, and prevent side-effect retries. Keep CAD/frontend/infra migration-compatible and avoid unrelated rewrites.

**Tech Stack:** Python 3, FastAPI, SQLite, Pydantic, LangGraph, pytest, existing Whoosh/Milvus/MySQL adapters, Node/Vite.

**Spec:** `C:/Users/12587/Downloads/ARCHITECTURE_MODIFICATION_PLAN.md` and `docs/superpowers/specs/2026-09-22-p0-runtime-rag-lifecycle-design.md`.

## Global Constraints

- Monitor must never construct or execute an Agent Runtime.
- One `event_id` creates at most one task and one WorkOrder; automatic WorkOrder keys remain `monitor:<event_id>`.
- Memory Learn is admitted only for `closed` WorkOrders with valid repair feedback.
- Experience keys remain `workorder:<workorder_id>` and RAG partial failures must be visible and retryable.
- Existing 9 Agents, A2A, Skill Registry, Tool Registry, and public API aliases remain compatible.
- Existing user modifications under `services/rag-service` must not be overwritten.

## Review Focus

- Restart after event/workorder creation must retain idempotent results and order state.
- RAG search must return real stored chunks, not only a synthetic `document:0` hit.
- Production mode must not silently fall back to local memory/RAG when required dependencies fail.
- Timeout handling must not retry side-effecting WorkOrder/Memory operations.
- Router must choose Maintenance for repair intent even when CAD/diagnosis terms also appear.

### Task 1: Durable Event and WorkOrder State

**Files:**
- Create: `services/agent-service/app/runtime/durable_store.py`
- Create: `services/agent-service/app/workorder/repository.py`
- Modify: `services/agent-service/app/runtime/event_store.py`
- Modify: `services/agent-service/app/mcp/workorder.py`
- Modify: `services/agent-service/app/api/server.py`
- Test: `services/agent-service/tests/test_durable_state.py`

**Interfaces:**
- `DurableJsonStore(path).get/set/delete` stores JSON values atomically under a process lock.
- `EventResultStore(event_id, producer)` persists first results when `EVENT_STORE_PATH` is configured.
- `WorkOrderRepository.create/get/update/list` preserves existing adapter return shapes and idempotency keys.

- [ ] Write restart and duplicate tests.
- [ ] Implement file-backed state with memory fallback and repository injection.
- [ ] Run focused tests.
- [ ] Commit `feat: persist event and workorder idempotency state`.

### Task 2: RAG Chunk Semantics and Backend Status

**Files:**
- Modify: `services/rag-service/app/api/documents.py`
- Modify: `services/rag-service/app/api/routes.py`
- Modify: `services/agent-service/app/rag/client.py`
- Test: `services/rag-service/tests/test_rag_api_contract.py`
- Test: `services/agent-service/tests/test_rag_remote_contract.py`

**Interfaces:**
- Standalone search returns stored chunk IDs/text/metadata and document IDs for multi-chunk documents.
- Upsert responses retain per-backend state and never silently turn `success=false` into local fallback.

- [ ] Add multi-chunk search and partial-failure tests.
- [ ] Search chunk rows and expose document/chunk retrieval consistently.
- [ ] Run RAG and Agent contract tests.
- [ ] Commit `fix: make standalone rag writes and chunk search durable`.

### Task 3: Production Fallback Policy

**Files:**
- Modify: `services/agent-service/app/config/settings.py`
- Modify: `services/agent-service/app/rag/client.py`
- Modify: `services/agent-service/app/memory/store.py`
- Modify: `services/agent-service/app/api/server.py`
- Test: `services/agent-service/tests/test_production_degraded_mode.py`

**Interfaces:**
- `APP_ENV` and `ALLOW_DEGRADED_STORAGE` control fallback behavior; production defaults to no silent local fallback.
- Dependency failures return explicit error payloads/status while development/test behavior remains compatible.

- [ ] Add production-mode tests.
- [ ] Centralize policy and apply it to RAG/Memory fallback paths.
- [ ] Run service tests.
- [ ] Commit `fix: make production storage degradation explicit`.

### Task 4: Router Intent Scoring and Timeout Safety

**Files:**
- Modify: `services/agent-service/app/agents/router/agent.py`
- Modify: `services/agent-service/app/harness/runtime.py`
- Modify: `services/agent-service/app/a2a/client.py`
- Test: `services/agent-service/tests/test_router_intents.py`
- Test: `services/agent-service/tests/test_harness_side_effects.py`

**Interfaces:**
- Router exposes deterministic intent scores and selects Maintenance for repair language.
- Harness retries read-only Agents only; WorkOrder/Memory/Quality side effects execute once per idempotency key.

- [ ] Add composite-intent and side-effect retry tests.
- [ ] Implement scoring and side-effect retry policy without changing A2A models.
- [ ] Run focused tests.
- [ ] Commit `fix: prioritize repair intent and protect side effects from retries`.

### Task 5: Configuration and Regression Tooling

**Files:**
- Modify: `package.json`
- Modify: `scripts/start_all.py`
- Create: `pytest-agent.ini`
- Create: `pytest-rag.ini`
- Modify: `.env.example`
- Modify: `services/rag-service/.env.example`
- Test: `services/agent-service/tests/test_config_contract.py`

- [ ] Add platform-neutral Python launch commands and documented config precedence.
- [ ] Add service-specific pytest entry points so both `app` packages are isolated.
- [ ] Run both configured suites and check `git diff --check`.
- [ ] Commit `chore: normalize service startup and test entrypoints`.

### Task 6: Full Verification and Remaining Scope

- [ ] Run Agent, RAG, configured root suites, and smoke-test event → workorder → close → learn → report.
- [ ] Record CAD real-data, frontend decomposition, Alembic/infra, and OpenTelemetry items that require external systems rather than silently claiming completion.
- [ ] Push all commits after verification.

