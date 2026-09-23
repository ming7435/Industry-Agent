from types import SimpleNamespace


class _Tracing:
    def start(self, *_args, **_kwargs):
        return None

    def finish(self, _name, _state, payload):
        return payload


class _ReviewRequests:
    def __init__(self):
        self.diagnosis_calls = 0
        self.plan_calls = 0

    def diagnose(self, _state, event):
        self.diagnosis_calls += 1
        if self.diagnosis_calls == 1:
            return {"device_id": event["device_id"], "fault": "轴承振动", "confidence": 0.4, "evidence": []}
        return {"device_id": event["device_id"], "fault": "轴承振动", "confidence": 0.95, "evidence": [{"id": "E-1"}]}

    def access_memory(self, *_args, **_kwargs):
        return {"success": True, "items": []}

    def retrieve_knowledge(self, *_args, **_kwargs):
        return {"status": "completed", "documents": [{"document_id": "DOC-1"}]}

    def retrieve_cad(self, *_args, **_kwargs):
        return {"status": "completed", "components": [{"component_id": "C-1"}]}

    def create_maintenance_plan(self, *_args, **_kwargs):
        self.plan_calls += 1
        if self.plan_calls == 1:
            return {"workorder_ready": False, "validation_findings": ["missing torque"]}
        return {"workorder_ready": True, "repair_steps": ["replace bearing"], "validation_findings": []}


def _nodes(requests):
    from app.graph.nodes import OrchestratorNodes

    return OrchestratorNodes(SimpleNamespace(requests=requests, tracing=_Tracing()))


def test_diagnosis_review_loop_retries_low_confidence_once():
    requests = _ReviewRequests()
    result = _nodes(requests).diagnosis({
        "entry": "trigger",
        "task_id": "TASK-REVIEW",
        "trace_id": "TRACE-REVIEW",
        "event": {"event_id": "EVT-REVIEW", "device_id": "D-1", "event_type": "vibration"},
    })

    assert requests.diagnosis_calls == 2
    assert result["diagnosis"]["confidence"] == 0.95
    assert result["diagnosis_review"]["status"] == "completed"
    assert result["diagnosis_review"]["iterations"] == 2


def test_maintenance_replan_loop_retries_invalid_plan_once():
    requests = _ReviewRequests()
    state = {
        "entry": "trigger",
        "task_id": "TASK-REPLAN",
        "trace_id": "TRACE-REPLAN",
        "diagnosis": {"device_id": "D-1", "fault": "轴承振动", "confidence": 0.95, "evidence": [{"id": "E-1"}]},
        "knowledge": {"status": "completed", "documents": [{"document_id": "DOC-1"}]},
        "cad": {"status": "completed", "components": [{"component_id": "C-1"}]},
        "context": {"enforce_evidence_gate": True},
    }

    result = _nodes(requests).maintenance(state)

    assert requests.plan_calls == 2
    assert result["maintenance_plan"]["workorder_ready"] is True
    assert result["maintenance_replan"]["status"] == "completed"
    assert result["maintenance_replan"]["iterations"] == 2
