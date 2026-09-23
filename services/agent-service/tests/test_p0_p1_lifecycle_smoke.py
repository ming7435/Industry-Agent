from types import SimpleNamespace


class _Tracing:
    def __init__(self):
        self.loop_events = []

    def start(self, _name, _state):
        return None

    def finish(self, _name, _state, payload):
        return payload

    def loop_event(self, name, _state, event, payload):
        self.loop_events.append((name, event, payload))


class _LifecycleRequests:
    def __init__(self, rag_store):
        self.rag_store = rag_store
        self.stages = ["Event"]
        self.order = {}

    def diagnose(self, _state, event):
        self.stages.append("Diagnosis")
        return {"device_id": event["device_id"], "alarm_code": event["alarm_code"], "fault": "主轴轴承磨损"}

    def retrieve_knowledge(self, _state, _query):
        self.stages.append("Knowledge")
        return {"documents": [{"content": "检查并更换主轴轴承"}]}

    def retrieve_cad(self, _state, _query, _from_agent, context=None):
        self.stages.append("CAD")
        return {"components": [{"component_id": "SPINDLE-BEARING", "part_no": "BRG-001"}]}

    def create_maintenance_plan(self, _state, diagnosis, knowledge, cad):
        self.stages.append("Maintenance")
        return {
            "device_id": diagnosis["device_id"],
            "diagnosis": diagnosis,
            "knowledge": knowledge,
            "engineering_context": cad,
            "repair_steps": ["更换主轴轴承", "复测振动"],
            "workorder_ready": True,
        }

    def access_memory(self, _state, action="search", query="", from_agent=None):
        if action != "learn":
            item = self.rag_store.get("workorder:%s" % self.order.get("workorder_id", "")) if self.order else None
            if item:
                self.stages.append("ExperienceRetrieval")
                return {"success": True, "items": [item], "query": query}
            return {"success": False, "items": [], "query": query}
        self.stages.append("Memory")
        document_id = "workorder:%s" % self.order["workorder_id"]
        self.rag_store.upsert(
            document_id,
            "主轴轴承更换后振动恢复正常",
            {"corpus": "cases", "workorder_id": self.order["workorder_id"]},
            "maint_fault_events",
        )
        self.stages.append("RAG")
        return {
            "success": True,
            "rag_saved": True,
            "experience": {"experience_id": document_id, "source_workorder": self.order["workorder_id"]},
        }

    def execute_workorder(self, state, action="create", workorder=None, from_agent=None):
        if action == "create":
            self.stages.append("WorkOrder")
            context = dict(state.get("context") or {})
            self.order = {
                "workorder_id": "WO-SMOKE-1",
                "device_id": "D-SMOKE-1",
                "event_id": context.get("event_id"),
                "status": "open",
                "diagnosis_snapshot": context.get("diagnosis_snapshot") or {},
                "maintenance_plan_snapshot": context.get("maintenance_plan_snapshot") or {},
            }
        elif action == "mark_repair_completed":
            self.stages.append("Complete")
            self.order.update({
                "status": "completed",
                "repair_feedback": state.get("repair_feedback") or {},
                "repair_verification": state.get("repair_verification") or {},
            })
        elif action == "close":
            self.stages.append("Close")
            self.order["status"] = "closed"
        return {"success": True, "status": self.order["status"], "workorder": dict(self.order), "workorder_id": self.order["workorder_id"]}


class _ReportHarness:
    def __init__(self, stages):
        self.stages = stages

    def execute_agent(self, _state):
        self.stages.append("Report")
        return {"report_id": "REPORT-SMOKE-1", "report_type": "full_case_report", "status": "completed", "persisted": True}


def test_event_to_closed_case_smoke(tmp_path):
    from app.graph.nodes import OrchestratorNodes
    from app.runtime.operations import RuntimeOperations

    # Import the standalone RAG store without putting both services' ``app``
    # packages on one interpreter path.  The smoke uses its public durable
    # semantics while the RAG suite covers the HTTP/indexing pipeline itself.
    import importlib.util
    from pathlib import Path

    path = Path(__file__).resolve().parents[2] / "rag-service" / "app" / "api" / "documents.py"
    spec = importlib.util.spec_from_file_location("rag_smoke_documents", path)
    module = importlib.util.module_from_spec(spec)
    assert spec and spec.loader
    spec.loader.exec_module(module)
    rag_store = module.DocumentStore(str(tmp_path / "rag.sqlite3"))

    requests = _LifecycleRequests(rag_store)
    tracing = _Tracing()
    container = SimpleNamespace(requests=requests, tracing=tracing)
    nodes = OrchestratorNodes(container)
    state = {
        "entry": "trigger",
        "task_id": "TASK-SMOKE-1",
        "trace_id": "TRACE-SMOKE-1",
        "event": {"event_id": "EVT-SMOKE-1", "device_id": "D-SMOKE-1", "alarm_code": "E102"},
        "context": {},
    }
    for node in (nodes.diagnosis, nodes.knowledge, nodes.cad, nodes.maintenance, nodes.workorder):
        state.update(node(state))

    assert state["status"] == "waiting_repair"
    assert {event for _name, event, _payload in tracing.loop_events} >= {
        "loop_start", "action_selected", "evidence_added", "review_result", "loop_stop",
    }
    operations = RuntimeOperations(
        requests,
        object(),
        report_harness=_ReportHarness(requests.stages),
        learning_store_path=str(tmp_path / "learning.sqlite3"),
    )
    feedback = {"feedback": "已更换轴承", "result": "repaired", "verification": {"passed": True}}
    completed = operations.execute_workorder("mark_repair_completed", {
        "workorder_id": "WO-SMOKE-1",
        "repair_feedback": feedback,
        "repair_verification": feedback["verification"],
    })
    assert completed["workorder"]["status"] == "completed"
    closed = operations.execute_workorder("close", {"workorder_id": "WO-SMOKE-1"})

    assert closed["workorder"]["status"] == "closed"
    assert closed["memory_result"]["rag_saved"] is True
    assert closed["report"]["report_type"] == "full_case_report"
    retrieved = requests.access_memory({}, action="search", query="轴承维修经验", from_agent="diagnosis")
    assert retrieved["success"] is True
    assert retrieved["items"][0]["document_id"] == "workorder:WO-SMOKE-1"
    assert requests.stages == [
        "Event", "Diagnosis", "Knowledge", "CAD", "Maintenance", "WorkOrder",
        "Complete", "Close", "Memory", "RAG", "Report", "ExperienceRetrieval",
    ]
