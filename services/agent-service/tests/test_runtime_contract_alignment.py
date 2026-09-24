"""Executable checks for the Runtime JSON Schema contracts."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator

from app.harness import TraceRecorder


ROOT = Path(__file__).resolve().parents[3]
CONTRACTS = ROOT / "shared" / "contracts"


def _schema(name: str) -> dict:
    return json.loads((CONTRACTS / name).read_text(encoding="utf-8"))


def _assert_valid(schema: dict, value: dict) -> None:
    Draft202012Validator(schema).validate(value)


def _assert_invalid(schema: dict, value: dict) -> None:
    with pytest.raises(Exception):
        Draft202012Validator(schema).validate(value)


def test_runtime_action_schema_requires_capability_for_agent_actions_only() -> None:
    schema = _schema("runtime-action.schema.json")

    _assert_valid(
        schema,
        {
            "action_id": "ACT-AGENT-1",
            "action_type": "AGENT",
            "target": "diagnosis",
            "payload": {"required_capability": "fault_analysis"},
        },
    )
    _assert_invalid(
        schema,
        {
            "action_id": "ACT-AGENT-2",
            "action_type": "AGENT",
            "target": "diagnosis",
            "payload": {},
        },
    )
    _assert_invalid(
        schema,
        {
            "action_id": "ACT-AGENT-3",
            "action_type": "AGENT",
            "target": "diagnosis",
            "payload": {"required_capability": "   "},
        },
    )
    for action_type in ("TOOL", "FINAL", "WAIT", "REPLAN"):
        _assert_valid(
            schema,
            {
                "action_id": "ACT-%s-1" % action_type,
                "action_type": action_type,
                "target": action_type.lower(),
                "payload": {},
            },
        )


def test_runtime_trace_schema_accepts_real_harness_and_tool_lifecycle_records() -> None:
    schema = _schema("runtime-trace.schema.json")
    trace = TraceRecorder()

    class _Agent:
        name = "diagnosis"

        def run(self, payload):
            return {"task_id": payload["task_id"]}

    from app.harness.runtime import AgentHarness

    event = {"task_id": "TASK-CONTRACT", "trace_id": "TRACE-CONTRACT"}
    AgentHarness(_Agent(), timeout_seconds=1, max_retries=0, trace=trace).execute_agent(event)

    from app.tools.registry import ToolRegistry

    registry = ToolRegistry(rag_client=object(), trace=trace)
    with registry.trace_context(task_id=event["task_id"], trace_id=event["trace_id"]):
        registry.execute("get_alarm_definition", {"alarm_code": "700223"})

    records = trace.list(task_id=event["task_id"], trace_id=event["trace_id"])
    assert {record["event"] for record in records} >= {
        "agent_started",
        "agent_completed",
        "tool_started",
        "tool_completed",
    }
    for record in records:
        _assert_valid(schema, {"event": record["event"], "task_id": event["task_id"], "trace_id": event["trace_id"], **record})

