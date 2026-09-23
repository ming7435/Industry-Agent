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

## Evidence Loop

Trigger Knowledge retrieval gets one deterministic refinement attempt when the
first result has no usable documents/evidence. The result exposes:

```json
{
  "evidence_loop": {
    "attempts": 1,
    "max_attempts": 1,
    "status": "ready|blocked",
    "stop_reason": "evidence_ready|evidence_exhausted"
  }
}
```

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
