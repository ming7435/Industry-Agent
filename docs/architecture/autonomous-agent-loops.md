# Autonomous Agent Loops

The runtime is moving from one-shot Agent execution to four bounded loops. Each
loop has an explicit state, a stop condition, and a durable side-effect rule.

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

The trigger graph is the Agent Loop:

```text
Diagnosis -> Knowledge -> CAD -> Maintenance -> WorkOrder -> waiting_repair
```

Maintenance can return `blocked_insufficient_evidence`; the graph then ends
without creating a WorkOrder. This is the cross-Agent stop boundary and prevents
an optimistic downstream Agent from hiding upstream uncertainty.

## Unified Loop Engine

`app.runtime.loop_engine.LoopEngine` is the shared finite-state runtime for
Evidence, Diagnosis Review and Maintenance Replan. Each step returns
`state/action/evidence_score/done`; the engine enforces `max_iterations`,
`min_evidence_score`, a wall-clock timeout, and duplicate-action detection.
There is no free-running Agent loop: every loop has a finite policy and an
explicit stop reason.

Every step emits an `ActionModel` with one of four kinds: `agent`, `tool`,
`replan` or `final`. `LoopGuard` is the single guard implementation used by
the engine. In addition to the hard budget it detects duplicate actions, no
new evidence and confidence that did not improve. Runtime tracing records
`loop_start`, `action_selected`, `evidence_added`, `review_result` and
`loop_stop` with the active `task_id` and `trace_id`.

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

Learning is only entered by a valid closed WorkOrder with repair feedback:

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

All four loops are bounded. A loop that cannot satisfy its evidence or side
effect contract returns an explicit stop reason instead of silently continuing.
