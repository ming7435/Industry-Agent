from types import SimpleNamespace


class _Requests:
    def __init__(self):
        self.learn_calls = 0

    def execute_workorder(self, state, action="close", **_kwargs):
        return {
            "success": True,
            "status": "closed",
            "workorder": {
                "workorder_id": "WO-1",
                "device_id": "D-1",
                "status": "closed",
                "event_id": "EVT-1",
                "repair_feedback": {"feedback": "replaced"},
                "diagnosis_snapshot": {"fault": "spindle"},
                "maintenance_plan_snapshot": {"repair_steps": ["replace"]},
            },
        }

    def access_memory(self, _state, action="learn", **_kwargs):
        assert action == "learn"
        self.learn_calls += 1
        return {"success": True, "experience": {"experience_id": "EXP-WO-1"}, "rag_saved": True}


class _ReportHarness:
    def __init__(self):
        self.calls = []

    def execute_agent(self, state):
        self.calls.append(dict(state))
        return {"report_id": "R-WO-1", "report_type": "full_case_report", "status": "completed"}


def test_close_with_valid_feedback_learns_once_then_reports():
    from app.runtime.operations import RuntimeOperations

    requests = _Requests()
    reports = _ReportHarness()
    operations = RuntimeOperations(requests, SimpleNamespace(), report_harness=reports)

    first = operations.execute_workorder(
        "close",
        {"workorder_id": "WO-1", "repair_feedback": {"feedback": "replaced"}},
    )
    second = operations.execute_workorder(
        "close",
        {"workorder_id": "WO-1", "repair_feedback": {"feedback": "replaced"}},
    )

    assert first["memory_result"]["success"] is True
    assert first["report"]["report_type"] == "full_case_report"
    assert second["memory_result"]["experience"]["experience_id"] == "EXP-WO-1"
    assert requests.learn_calls == 1
    assert len(reports.calls) == 1
    assert reports.calls[0]["context"]["report_type"] == "full_case_report"


def test_close_without_feedback_does_not_learn_or_report():
    from app.runtime.operations import RuntimeOperations

    class _NoFeedbackRequests(_Requests):
        def execute_workorder(self, state, action="close", **_kwargs):
            result = super().execute_workorder(state, action=action, **_kwargs)
            result["workorder"]["repair_feedback"] = {}
            return result

    requests = _NoFeedbackRequests()
    reports = _ReportHarness()
    result = RuntimeOperations(requests, SimpleNamespace(), report_harness=reports).execute_workorder(
        "close", {"workorder_id": "WO-2"}
    )

    assert "memory_result" not in result
    assert "report" not in result
    assert requests.learn_calls == 0
    assert reports.calls == []
