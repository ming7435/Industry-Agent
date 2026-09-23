"""Keep the repository-level shared contract snapshots syntactically usable."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
CONTRACTS = ROOT / "shared" / "contracts"


def test_shared_contracts_are_valid_json_and_expose_runtime_boundaries() -> None:
    expected = {
        "runtime-action.schema.json",
        "runtime-loop.schema.json",
        "runtime-trace.schema.json",
        "workorder-lifecycle.schema.json",
        "rag-experience.schema.json",
    }
    assert {path.name for path in CONTRACTS.glob("*.json")} >= expected

    documents = {
        path.name: json.loads(path.read_text(encoding="utf-8"))
        for path in CONTRACTS.glob("*.json")
    }
    action = documents["runtime-action.schema.json"]
    assert "action_id" in action["required"]
    assert action["properties"]["action_type"]["enum"] == ["TOOL", "AGENT", "FINAL", "REPLAN", "WAIT"]
    assert action["x-legacy-input-aliases"]["kind"] == "action_type"

    evaluation = documents["runtime-loop.schema.json"]["definitions"]["evaluation"]
    assert evaluation["properties"]["status"]["enum"] == ["continue", "replan", "final", "blocked"]

    trace = documents["runtime-trace.schema.json"]
    assert {"event", "task_id", "trace_id"} <= set(trace["required"])
    assert "execution_start" in trace["properties"]["event"]["enum"]
    assert "planner_start" in trace["properties"]["event"]["enum"]

    workorder = documents["workorder-lifecycle.schema.json"]
    assert "closed" in workorder["properties"]["status"]["enum"]
    assert "pipeline_status" in workorder["properties"]

    experience = documents["rag-experience.schema.json"]
    assert experience["properties"]["collection"]["const"] == "maint_fault_events"
    assert experience["properties"]["learning_idempotency_key"]["pattern"] == "^workorder:.+"
