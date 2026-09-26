# Runtime Fine-Grained Agent Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the existing Runtime and nine existing Agents expose a shared, fine-grained, executable, observable, and verifiable step contract without adding Agents, services, or a second orchestration layer.

**Architecture:** Extend the existing action, skill, agent, tool, trace, and evaluator boundaries in place. A normalized `StepDefinition` is derived from old or structured Skill YAML, `AgentState`/`AgentResult` carry step observations and evidence, `ToolRegistry.execute` owns one optional guard context, and Runtime tracing records the complete step lifecycle. Existing Graph nodes remain execution containers and Runtime remains the decision owner.

**Tech Stack:** Python 3.11+, Pydantic, dataclasses, PyYAML, pytest, existing LangGraph Runtime.

**Spec:** User-pasted implementation requirements in `C:/Users/12587/.codex/attachments/1111e845-d2d8-4f68-b47b-6cc0aef60003/已粘贴的文本.txt`.

## Global Constraints

- Do not add a business Agent, Skill, Tool, microservice, or new directory.
- Keep the nine existing Agents and preserve old YAML, Runtime, Planner, RAG, WorkOrder, and Trace contracts.
- Add at most four Python files; prefer extending existing files.
- Preserve backward compatibility for old string Skill steps and existing Agent/Tool callers.

## Review Focus

- Old string Skill steps and new mapping steps must normalize identically enough for Runtime dispatch.
- A tool called outside its allowed context must be denied and traced before the handler runs.
- Empty or malformed observations must produce explicit missing evidence and a recommended action.
- Runtime state must preserve step history even when an Agent fails or the loop stops at its budget.
- Existing tests and public API payloads must retain their fields and meanings.

### Task 1: Shared execution models and Skill normalization

**Files:**
- Modify: `services/agent-service/app/runtime/action.py`
- Modify: `services/agent-service/app/skills/registry.py`
- Modify: `services/agent-service/app/agents/base.py`
- Test: `services/agent-service/tests/test_fine_grained_runtime.py`

- [ ] Add backward-compatible Pydantic models for `StepDefinition`, `Observation`, `Evidence`, `ValidationResult`, and `StepResult`.
- [ ] Extend `SkillDefinition` with `required_evidence`, `stop_conditions`, `failure_policy`, `output_schema`, and `normalized_steps()`; parse string and mapping step entries.
- [ ] Extend `AgentResult` with observations, validation, and step history while keeping existing defaults and `from_value` behavior.
- [ ] Test old/new YAML normalization and unified result serialization.

### Task 2: Shared Tool Guard and Runtime step context

**Files:**
- Modify: `services/agent-service/app/tools/registry.py`
- Modify: `services/agent-service/app/runtime/dispatcher.py`
- Modify: `services/agent-service/app/harness/runtime.py`
- Test: `services/agent-service/tests/test_fine_grained_runtime.py`

- [ ] Add an optional execution context containing agent, skills, step, allowed tools, task, and trace identifiers.
- [ ] Reject unknown or disallowed tools before MCP invocation, record `tool_guard`, and preserve direct legacy calls when no context is supplied.
- [ ] Bind the context through the existing Harness tool context and dispatcher task payload.
- [ ] Test allowed, denied, and legacy tool calls.

### Task 3: Trace/state lifecycle and evaluator diagnostics

**Files:**
- Modify: `services/agent-service/app/graph/state.py`
- Modify: `services/agent-service/app/runtime/tracing.py`
- Modify: `services/agent-service/app/runtime/evaluator.py`
- Modify: `services/agent-service/app/runtime/coordinator.py`
- Test: `services/agent-service/tests/test_fine_grained_runtime.py`

- [ ] Add active agent/skill/step, completed/failed steps, observations, evidence, validation, stop reason, and next action state fields.
- [ ] Add trace helpers/events for skill and step lifecycle, tool guard, observation/evidence, validation, and decision events.
- [ ] Include `missing_evidence` and `recommended_action` in evaluator results without changing status semantics.
- [ ] Update the Runtime loop to annotate each planned action with skill/step metadata and persist lifecycle updates.

### Task 4: Integration and regression verification

**Files:**
- Modify: `services/agent-service/tests/test_fine_grained_runtime.py`
- Modify: `docs/...` only if runtime contract documentation needs the final event example.

- [ ] Exercise a complete existing Runtime path with capability selection, step trace, evidence, evaluation, and bounded stop.
- [ ] Run focused tests, full Agent tests, integration tests, build checks, and `git diff --check`.
- [ ] Audit file count and produce a complete trace example in the final report.

