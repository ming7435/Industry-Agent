from types import SimpleNamespace


class _Tracing:
    def start(self, *_args, **_kwargs):
        return None

    def finish(self, _name, _state, payload):
        return payload


class _EvidenceRequests:
    def __init__(self, knowledge_results):
        self.knowledge_results = list(knowledge_results)
        self.knowledge_queries = []
        self.maintenance_calls = 0
        self.workorder_calls = 0

    def diagnose(self, _state, event):
        return {"device_id": event["device_id"], "fault": "主轴轴承振动"}

    def retrieve_knowledge(self, _state, query):
        self.knowledge_queries.append(query)
        return self.knowledge_results.pop(0)

    def retrieve_cad(self, _state, _query, _from_agent, context=None):
        return {"components": [{"component_id": "BEARING-1"}], "status": "completed"}

    def create_maintenance_plan(self, *_args, **_kwargs):
        self.maintenance_calls += 1
        return {"workorder_ready": True, "repair_steps": ["更换轴承"]}

    def execute_workorder(self, *_args, **_kwargs):
        self.workorder_calls += 1
        return {"success": True, "workorder_id": "WO-1", "status": "open", "workorder": {"workorder_id": "WO-1"}}


def _nodes(requests):
    from app.graph.nodes import OrchestratorNodes

    return OrchestratorNodes(SimpleNamespace(requests=requests, tracing=_Tracing()))


def test_trigger_evidence_loop_refines_knowledge_query_once():
    requests = _EvidenceRequests([
        {"status": "insufficient_evidence", "documents": [], "evidence": []},
        {"status": "completed", "documents": [{"document_id": "DOC-1"}], "evidence": [{"content": "检查轴承"}]},
    ])
    nodes = _nodes(requests)
    state = {
        "entry": "trigger",
        "task_id": "TASK-EVIDENCE-1",
        "trace_id": "TRACE-EVIDENCE-1",
        "event": {"event_id": "EVT-1", "device_id": "D-1"},
        "diagnosis": {"device_id": "D-1", "fault": "主轴轴承振动"},
        "context": {"enforce_evidence_gate": True},
    }

    result = nodes.knowledge(state)

    assert result["knowledge"]["status"] == "completed"
    assert len(requests.knowledge_queries) == 2
    assert result["evidence_loop"]["attempts"] == 1
    assert result["evidence_loop"]["status"] == "ready"


def test_trigger_stops_before_workorder_when_evidence_is_still_missing():
    requests = _EvidenceRequests([
        {"status": "insufficient_evidence", "documents": [], "evidence": []},
        {"status": "insufficient_evidence", "documents": [], "evidence": []},
    ])
    nodes = _nodes(requests)
    state = {
        "entry": "trigger",
        "task_id": "TASK-EVIDENCE-2",
        "trace_id": "TRACE-EVIDENCE-2",
        "event": {"event_id": "EVT-2", "device_id": "D-2"},
        "diagnosis": {"device_id": "D-2", "fault": "主轴轴承振动"},
        "context": {"enforce_evidence_gate": True},
    }
    state.update(nodes.knowledge(state))
    state.update(nodes.cad(state))

    result = nodes.maintenance(state)

    assert result["status"] == "blocked_insufficient_evidence"
    assert result["stop_reason"] == "evidence_gate"
    assert result["workorder"] == {}
    assert requests.maintenance_calls == 0
    assert requests.workorder_calls == 0


def test_orchestrator_ends_when_evidence_gate_blocks_maintenance():
    from app.graph.workflow import AgentOrchestrator

    assert AgentOrchestrator._after_maintenance({
        "entry": "trigger",
        "status": "blocked_insufficient_evidence",
    }) == "blocked"
