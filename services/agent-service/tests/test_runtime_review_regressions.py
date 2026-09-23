import json


def test_planner_supports_declared_capabilities_and_keeps_unknown_capability_visible():
    from app.runtime.planner import Planner

    plan = Planner().plan("requested runtime capabilities", {
        "event_id": "EVT-REVIEW-1",
        "required_capabilities": ["workorder_update", "case_reporting", "bogus_capability"],
    })

    assert [action.required_capability for action in plan.actions] == [
        "workorder_update", "case_reporting", "bogus_capability",
    ]


def test_jev_reports_malformed_input_without_losing_goal_boundary():
    from app.runtime.jev import JEVParser

    parsed = JEVParser().parse({"user_text": "", "required_capabilities": "not-a-list"})

    assert parsed.goal
    assert parsed.validation_findings
    assert "required_capabilities" in " ".join(parsed.validation_findings)


def test_runtime_trace_schema_accepts_new_runtime_events():
    schema = json.loads(open("shared/contracts/runtime-trace.schema.json", encoding="utf-8").read())
    events = set(schema["properties"]["event"]["enum"])

    assert {"goal_parsed", "capability_blocked", "loop_continue", "capability_selected"} <= events
