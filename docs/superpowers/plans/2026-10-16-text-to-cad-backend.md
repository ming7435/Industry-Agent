# text-to-cad Backend Implementation Plan

> **For agentic workers:** Execute independent ownership scopes in parallel and integrate with regression tests and a fresh final review.

**Goal:** Replace all active FreeCAD execution with text-to-cad while preserving the project's workflows and existing records.

**Architecture:** Trusted structured requests compile to Python using cadgen/build123d. Bounded subprocess clients replace GUI/MCP execution. Stable API aliases and storage identities preserve compatibility.

**Tech Stack:** Python, cadgen[snapshot]==0.7.10, build123d, FastAPI, React, pytest, Node test runner.

**Spec:** docs/superpowers/specs/2026-10-16-text-to-cad-backend-design.md

## Global Constraints

- Preserve identity, authorization, idempotency, revisions and historical files.
- No active FreeCAD runtime dependency or model-provided Python execution.
- Validate geometry and exports before declaring success.

## Review Focus

- Timeout after dispatch must not automatically replay a model or publication.
- Existing published records and old artifact URLs must remain readable.
- Hidden objects remain in complete product exports; placements and object IDs survive edits.
- Unsupported/malformed geometry and empty exports must fail honestly.
- Canonical and legacy API routes share authorization, concurrency and idempotency state.

### Task 1: Execution and geometry (root)
- [ ] Add failing subprocess and real-geometry tests.
- [ ] Implement `TextToCadClient.call_tool/status/close`, trusted `text_to_cad(spec)` and standalone source exports.
- [ ] Implement `build_operations(operations) -> Shape` and `build_spec(spec, out) -> (list[Shape], evidence)`; migrate every active geometry feature.
- [ ] Replace old native modules with compatibility aliases and verify real STEP round trips.

### Task 2: Durable documents (document agent)
- [ ] Test migration, revision identity and publication using model.json/model.py.
- [ ] Replace native document programs, artifact validation and capability discovery.
- [ ] Keep historical readers/schema identities; update backend artifact contracts and quality binding.

### Task 3: API and frontend (surface agent)
- [ ] Test canonical/legacy APIs, graph tool routing and source downloads.
- [ ] Switch default provider/tool and add shared route aliases; update skill instructions.
- [ ] Update frontend model/document downloads and provider wording; run Node tests and build.

### Task 4: Runtime and deployment (runtime agent)
- [ ] Test headless startup/probe and worker launch.
- [ ] Pin/install cadgen in project runtime; remove GUI launch dependencies.
- [ ] Update startup, workers, Docker/CI, env examples and setup docs; run smoke.

### Task 5: Integration and review (root)
- [ ] Run affected suites, actual geometry matrix and project aggregate checks.
- [ ] Inspect/render representative artifacts; independently review the combined diff.
- [ ] Resolve findings and document exact verification and any remaining limitations.
