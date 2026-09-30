from concurrent.futures import ThreadPoolExecutor
from threading import Lock
from time import sleep

from app.runtime.operations import RuntimeOperations


class _Requests:
    def __init__(self):
        self.learn_calls = 0

    def execute_workorder(self, state, action="create", workorder=None, from_agent=None):
        return {
            "status": "closed",
            "workorder": {
                "workorder_id": "WO-CLOSE-1",
                "device_id": "D-1",
                "status": "closed",
                "repair_feedback": {"feedback": "fixed"},
                "repair_verification": {
                    "passed": True,
                    "status": "verified",
                    "source": "device_recovery",
                    "device_recovery": {"device_id": "D-1", "status": "running", "active_alarms": [], "metrics": {"health": 99}, "checked_at": "2026-09-28T12:00:00Z"},
                    "checks": {"device_identity": True, "operational": True, "alarms_clear": True, "metrics_available": True},
                },
                "event_id": "EVT-1",
            },
        }

    def access_memory(self, state, action="search", query="", from_agent=None):
        self.learn_calls += 1
        return {
            "success": True,
            "rag_saved": True,
            "experience": {"experience_id": "EXP-1", "source_workorder": "WO-CLOSE-1"},
        }


class _Report:
    def __init__(self):
        self.calls = 0

    def execute_agent(self, state):
        self.calls += 1
        return {"report_id": "REPORT-1", "report_type": "full_case_report", "status": "completed", "persisted": True}


class _FlakyReport(_Report):
    def execute_agent(self, state):
        self.calls += 1
        if self.calls == 1:
            raise RuntimeError("report backend unavailable")
        return {"report_id": "REPORT-RETRY", "report_type": "full_case_report", "status": "completed", "persisted": True}


class _Trace:
    def __init__(self):
        self.events = []

    def record(self, **payload):
        self.events.append(payload)


class _SlowRequests(_Requests):
    def __init__(self):
        super().__init__()
        self.lock = Lock()

    def access_memory(self, state, action="search", query="", from_agent=None):
        with self.lock:
            self.learn_calls += 1
        sleep(0.1)
        return {
            "success": True,
            "rag_saved": True,
            "experience": {"experience_id": "EXP-1", "source_workorder": "WO-CLOSE-1"},
        }


def test_close_learning_result_survives_runtime_reconstruction(tmp_path):
    path = str(tmp_path / "learning.sqlite3")
    first_requests = _Requests()
    first_report = _Report()
    first = RuntimeOperations(first_requests, object(), report_harness=first_report, learning_store_path=path)

    first_result = first.execute_workorder("close", {"workorder_id": "WO-CLOSE-1"})
    assert first_requests.learn_calls == 1
    assert first_report.calls == 1
    assert first_result["report"]["report_id"] == "REPORT-1"

    second_requests = _Requests()
    second_report = _Report()
    second = RuntimeOperations(second_requests, object(), report_harness=second_report, learning_store_path=path)
    second_result = second.execute_workorder("close", {"workorder_id": "WO-CLOSE-1"})

    assert second_requests.learn_calls == 0
    assert second_report.calls == 0
    assert second_result["memory_result"]["success"] is True
    assert second_result["report"]["report_id"] == "REPORT-1"


def test_report_failure_keeps_uncertain_stage_without_relearning_or_blind_retry(tmp_path):
    path = str(tmp_path / "learning.sqlite3")
    first_requests = _Requests()
    first_report = _FlakyReport()
    first = RuntimeOperations(first_requests, object(), report_harness=first_report, learning_store_path=path)
    failed = first.execute_workorder("close", {"workorder_id": "WO-CLOSE-1"})
    assert first_requests.learn_calls == 1
    assert failed["memory_result"]["success"] is True
    assert failed["report"]["success"] is False

    second_requests = _Requests()
    second_report = _FlakyReport()
    second_report.calls = 1
    second = RuntimeOperations(second_requests, object(), report_harness=second_report, learning_store_path=path)
    retried = second.execute_workorder("close", {"workorder_id": "WO-CLOSE-1"})

    assert second_requests.learn_calls == 0
    assert second_report.calls == 1
    assert retried["report"]["success"] is False
    assert "人工对账" in retried["report"]["error"]
    assert retried["learning_loop"]["status"] == "waiting_report"
    assert retried["learning_loop"]["stages"] == ["memory", "rag"]


def test_concurrent_close_runs_learning_and_report_once(tmp_path):
    requests = _SlowRequests()
    report = _Report()
    operations = RuntimeOperations(
        requests,
        object(),
        report_harness=report,
        learning_store_path=str(tmp_path / "learning.sqlite3"),
    )

    with ThreadPoolExecutor(max_workers=2) as executor:
        results = list(executor.map(
            lambda _: operations.execute_workorder("close", {"workorder_id": "WO-CLOSE-1"}),
            range(2),
        ))

    assert requests.learn_calls == 1
    assert report.calls == 1
    assert {item["report"]["report_id"] for item in results} == {"REPORT-1"}


def test_close_learning_loop_emits_runtime_trace_events(tmp_path):
    trace = _Trace()
    operations = RuntimeOperations(
        _Requests(), object(), report_harness=_Report(),
        learning_store_path=str(tmp_path / "learning.sqlite3"), trace=trace,
    )

    operations.execute_workorder("close", {"workorder_id": "WO-CLOSE-1"})

    assert [item["event"] for item in trace.events if item.get("type") == "loop"] == [
        "loop_start", "action_selected", "evidence_added", "review_result", "loop_stop",
    ]
