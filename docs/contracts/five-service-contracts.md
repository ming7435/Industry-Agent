# Five-service contracts

## Backend MCP

`POST /tools/call`

```json
{"tool":"create_workorder","arguments":{"device_id":"CNC-001","idempotency_key":"monitor:EVT-1"}}
```

WorkOrder responses contain `success`, `workorder_id`, `status`, and the full
`workorder` record. `mark_repair_completed` requires
`repair_verification.passed=true`; `close_workorder` requires a completed order
with the same verified gate. The unique idempotency key is enforced by the
Backend repository.

Quality, Closure, Audit, report metadata, and structured experience records use
the same Backend boundary. Their public Agent facades remain compatible.

## Model gateway

The Model service normalizes provider failures to HTTP 503 and exposes a stable
OpenAI-compatible request shape. `MODEL_PROVIDER=fake|ci|test` is deterministic
and is the only provider used by the Compose E2E job.

## Runtime trace

Runtime trace records use the existing trace contract and include planner start/end,
action/capability selection, execution start/end, evidence, evaluation, loop
continue/stop, replan, and policy decisions. The trace is returned with an event
response and is queryable through `/api/v1/trace`.
