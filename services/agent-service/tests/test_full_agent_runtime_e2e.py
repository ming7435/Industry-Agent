from types import SimpleNamespace


class _Tracing:
    def __init__(self):
        self.events = []

    def start(self, *_args, **_kwargs):
        return None

    def finish(self, _name, _state, payload):
        return payload

    def loop_event(self, name, _state, event, payload):
        self.events.append((name, event, payload))


class _Requests:
    def __init__(self):
        self.diagnosis_calls = 0
        self.plan_calls = 0
        self.order = {}
        self.experience = None

    def diagnose(self, _state, event):
        self.diagnosis_calls += 1
        if self.diagnosis_calls == 1:
            return {"device_id": event["device_id"], "fault": "bearing", "confidence": 0.4, "evidence": []}
        return {"device_id": event["device_id"], "fault": "bearing", "confidence": 0.95, "evidence": [{"id": "EV-1"}]}

    def retrieve_knowledge(self, _state, _query):
        return {"status": "completed", "documents": [{"document_id": "DOC-1"}]}

    def retrieve_cad(self, *_args, **_kwargs):
        return {"status": "completed", "components": [{"component_id": "C-1"}]}

    def create_maintenance_plan(self, *_args, **_kwargs):
        self.plan_calls += 1
        if self.plan_calls == 1:
            return {"workorder_ready": False, "validation_findings": ["missing torque"]}
        return {"workorder_ready": True, "repair_steps": ["replace bearing"], "validation_findings": []}

    def access_memory(self, state, action="search", query="", from_agent=None):
        if action == "learn":
            self.experience = {
                "experience_id": "workorder:WO-E2E-1",
                "source_workorder": "WO-E2E-1",
                "content": "bearing repaired",
            }
            return {"success": True, "rag_saved": True, "experience": dict(self.experience)}
        return {"success": bool(self.experience), "items": [dict(self.experience)] if self.experience else [], "query": query}

    def execute_workorder(self, state, action="create", workorder=None, from_agent=None):
        if action == "create":
            context = dict(state.get("context") or {})
            self.order = {
                "workorder_id": "WO-E2E-1", "status": "open", "device_id": "D-E2E-1",
                "event_id": context.get("event_id"),
                "diagnosis_snapshot": context.get("diagnosis_snapshot") or {},
                "maintenance_plan_snapshot": context.get("maintenance_plan_snapshot") or {},
            }
        elif action == "mark_repair_completed":
            self.order.update({
                "status": "completed", "repair_feedback": state.get("repair_feedback") or {},
                "repair_verification": state.get("repair_verification") or {},
            })
        elif action == "close":
            self.order["status"] = "closed"
        return {"success": True, "status": self.order["status"], "workorder_id": self.order["workorder_id"], "workorder": dict(self.order)}


class _Report:
    def execute_agent(self, _state):
        return {"report_id": "REPORT-E2E-1", "report_type": "full_case_report", "status": "completed", "persisted": True}


def test_full_evidence_driven_runtime_lifecycle(tmp_path):
    from app.graph.nodes import OrchestratorNodes
    from app.runtime.operations import RuntimeOperations

    requests = _Requests()
    tracing = _Tracing()
    nodes = OrchestratorNodes(SimpleNamespace(requests=requests, tracing=tracing))
    state = {
        "entry": "trigger", "task_id": "TASK-E2E-1", "trace_id": "TRACE-E2E-1",
        "event": {"event_id": "EVT-E2E-1", "device_id": "D-E2E-1", "event_type": "vibration"},
        "context": {"enforce_evidence_gate": True},
    }
    for node in (nodes.diagnosis, nodes.knowledge, nodes.cad, nodes.maintenance, nodes.workorder):
        state.update(node(state))

    assert state["status"] == "waiting_repair"
    assert requests.diagnosis_calls == 2
    assert requests.plan_calls == 2

    operations = RuntimeOperations(
        requests, object(), report_harness=_Report(),
        learning_store_path=str(tmp_path / "learning.sqlite3"),
    )
    feedback = {"feedback": "repaired", "result": "repaired", "verification": {"passed": True}}
    operations.execute_workorder("mark_repair_completed", {
        "workorder_id": "WO-E2E-1", "repair_feedback": feedback,
        "repair_verification": feedback["verification"],
    })
    closed = operations.execute_workorder("close", {"workorder_id": "WO-E2E-1"})
    retrieved = operations.execute_memory("search", {"query": "bearing experience"})

    assert closed["learning_loop"]["status"] == "completed"
    assert closed["memory_result"]["rag_saved"] is True
    assert retrieved["items"][0]["experience_id"] == "workorder:WO-E2E-1"
    events = {event for _name, event, _payload in tracing.events}
    assert {"evaluation_result", "execution_start", "execution_end", "replan"} <= events
