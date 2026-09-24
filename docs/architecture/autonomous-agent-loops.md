# Autonomous Agent Loops

The runtime is moving from one-shot Agent execution to bounded, evidence-driven
loops. Each loop has an explicit state, a stop condition, and a durable
side-effect rule. The shared implementation is Runtime infrastructure; domain
Nodes only provide observation and action adapters.

## Tool Loop

Diagnosis and Knowledge already use bounded LangGraph tool loops:

- Tool Guard validates every call against the active Skill.
- Observation records are hashed to stop repeated results.
- `max_steps` stops runaway tool calls.
- Tool traces carry `task_id` and `trace_id`.

The loop must stop on a validator-approved result, repeated observation, or a
budget error. Side-effecting tools remain non-retryable unless their boundary is
idempotent.

## Agent Loop

The Graph is now only the Runtime execution layer. It carries state into one
Runtime lifecycle node; Planner and LoopEngine choose the next Action:

```text
Goal/Event -> JEV -> Planner -> CapabilityRegistry -> LoopEngine
  -> ActionModel -> ExecutionManager -> Agent/Tool/MCP
  -> Evidence -> Evaluator -> Continue/Replan/Final
```

The default abnormal-event plan still resolves to
`Diagnosis -> Knowledge -> CAD -> Maintenance -> WorkOrder -> waiting_repair`,
but that order is a Planner result rather than a Graph edge. Maintenance can
return `blocked_insufficient_evidence`; Runtime then stops without creating a
WorkOrder.

## Unified Loop Engine

`app.runtime.loop_engine.LoopEngine` is the shared finite-state runtime for
Evidence, Diagnosis Review, Maintenance Replan and future bounded learning
operations. Its Runtime-native API is:

```text
Observe -> RuntimeEvaluator -> Select Action -> Execute -> Update State
```

The engine enforces `max_iterations`, `min_evidence_score`, a wall-clock
timeout, a cost budget, duplicate-action detection, no-new-evidence detection
and confidence-progress detection. There is no free-running Agent loop: every
loop has a finite policy and an explicit stop reason.

Every step emits an `ActionModel` with one of five kinds: `AGENT`, `TOOL`,
`REPLAN`, `FINAL` or `WAIT`. `LoopGuard` is the single guard implementation
used by the engine. `RuntimeEvaluator` is the single policy point for
`continue`, `replan`, `final` and `blocked`; business Nodes must not duplicate
that decision logic. `ExecutionManager` owns action execution status and
reconciliation boundaries. Runtime tracing records
`planner_start`, `planner_end`, `capability_selected`, `action_selected`,
`execution_start`, `execution_end`, `evidence_added`, `evaluation_result`,
`loop_continue`, `review_result`, `replan` and `loop_stop`
with the active `task_id` and `trace_id`.

## Evidence Loop

Trigger Knowledge retrieval gets one deterministic refinement attempt through
the shared Runtime Engine when the first result has no usable documents or
evidence. The result exposes:

```json
{
  "evidence_loop": {
    "attempts": 1,
    "max_attempts": 1,
    "status": "ready|blocked",
    "stop_reason": "evidence_ready|evidence_exhausted|max_iterations|timeout|duplicate_action",
    "guard_status": "completed|blocked|timeout|error"
  }
}
```

## Diagnosis Review Loop

When a diagnosis explicitly reports low confidence, missing evidence or
validation findings, Runtime performs at most one review pass. The review
receives the same event plus a deterministic review reason and only completes
when the diagnosis evidence score reaches the policy threshold. Legacy
diagnosis payloads without quality fields remain compatible and do not incur a
second call.

## Maintenance Replan Loop

Maintenance plans with validation findings or `workorder_ready=false` receive
at most one replan pass. The second pass is marked with
`context.replan_required=true`; if the bounded loop still cannot produce an
evidence-backed plan, strict trigger mode ends before WorkOrder creation.

Production (`APP_ENV=production`) or an explicit
`context.enforce_evidence_gate=true` requires usable Knowledge and CAD evidence
before maintenance can create a WorkOrder. Development keeps the existing
degraded compatibility behavior while the evidence metadata remains visible.

## Learning Loop

Learning is only entered by a valid closed WorkOrder with repair feedback and
an explicit passed repair verification:

```text
Memory Learn -> RAG Upsert -> Full Case Report
```

`RuntimeOperations` persists each stage under `workorder:<workorder_id>` and
returns `learning_loop` metadata. A failed Memory/RAG stage is retriable; a
failed Report stage retries Report only and never relearns the same WorkOrder.

```json
{
  "learning_loop": {
    "status": "running|blocked|waiting_report|completed",
    "learning_idempotency_key": "workorder:WO-001",
    "stages": ["memory", "rag", "report"]
  }
}
```

All loops are bounded. A loop that cannot satisfy its evidence or side-effect
contract returns an explicit stop reason instead of silently continuing.

## Runtime control plane

The Runtime-native path is now:

```text
Goal
  ↓
Planner (Goal -> Plan -> ActionModel)
  ↓
LoopEngine
  ↓ Observe
RuntimeEvaluator
  ↓ Continue / Replan / Final / Blocked
ActionModel (TOOL | AGENT | REPLAN | FINAL | WAIT)
  ↓
ExecutionManager
  ↓
Agent / Tool / A2A / MCP
  ↓
State update + Evidence
```

`ExecutionManager` exposes explicit `PENDING`, `RUNNING`, `SUCCESS`,
`FAILED`, `TIMEOUT`, `CANCELLED` and `UNKNOWN` states. A timeout never claims
that a worker thread was killed; side-effecting actions require an
`idempotency_key` and remain subject to existing state checks and
reconciliation. `CapabilityRegistry` describes the capabilities of the nine
existing Agents and is the only lookup source used by the basic Planner; it
does not create another Agent. The machine-readable versions of these boundaries live in
`shared/contracts/`; the field-level mapping is documented in
`docs/contracts/runtime-contracts.md`.
