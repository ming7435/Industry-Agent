from app.runtime.operations import RuntimeOperations
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.api.server import create_app
from app.clients.backend import BackendServiceClient


REQUIRED_CHECKS = {
    key: {"passed": True, "status": "pass", "sufficient_data": True, "items": [{"actual": True}], "defects": []}
    for key in ("dimensions", "appearance", "material", "function", "process")
}


class _Requests:
    def inspect_quality(self, state, from_agent, quality_payload):
        return {
            "part_id": "PART-AGENT-001",
            "part_no": "PN-AGENT-001",
            "passed": True,
            "qualified": True,
            "status": "pass",
            "findings": [],
            "inspection_items": [],
            "quality_validation": REQUIRED_CHECKS,
        }


class _Closure:
    def __init__(self):
        self.payload = None

    def record_part_quality(self, payload, operator=""):
        self.payload = dict(payload)
        return {"quality_check_id": "QC-AGENT-001", **self.payload}


def test_agent_quality_persistence_forwards_structured_validation_evidence():
    closure = _Closure()
    operations = RuntimeOperations(_Requests(), closure)

    result = operations.inspect_quality(
        {"context": {"part_id": "PART-AGENT-001"}},
        quality_payload={"part_id": "PART-AGENT-001"},
        persist=True,
    )

    assert result["quality_check_id"] == "QC-AGENT-001"
    assert closure.payload["quality_validation"] == REQUIRED_CHECKS


@pytest.fixture
def backend_closure_transport():
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            assert self.path == "/tools/call"
            payload = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            requests.append(payload)
            response = {"success": True, "quality_check_id": "QC-ORIGINAL", "quality_check": {"quality_check_id": "QC-ORIGINAL", "status": "rectification"}, "backend": "backend-service"}
            encoded = json.dumps(response).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        def log_message(self, *_args):
            pass

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    backend = BackendServiceClient(f"http://127.0.0.1:{server.server_port}")
    runtime = SimpleNamespace(container=SimpleNamespace(closure_service=backend))
    try:
        yield TestClient(create_app(orchestrator=runtime)), requests
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def test_quality_appeal_resolution_connects_to_backend_tool(backend_closure_transport):
    client, requests = backend_closure_transport
    response = client.post("/api/v1/quality/checks/QC-ORIGINAL/appeal/resolve", json={"appeal_id": "APPEAL-1", "decision": "approved", "reason": "Verified correction", "operator": "QUALITY-1"})
    assert response.status_code == 200
    assert response.json()["quality_check"]["status"] == "rectification"
    assert requests == [{"tool": "resolve_quality_appeal", "arguments": {"check_id": "QC-ORIGINAL", "appeal_id": "APPEAL-1", "decision": "approved", "reason": "Verified correction", "operator": "QUALITY-1"}}]


def test_reinspection_api_forwards_persisted_reference_to_backend(backend_closure_transport):
    client, requests = backend_closure_transport
    response = client.post("/api/v1/quality/checks/QC-ORIGINAL/reinspect", json={"passed": True, "reinspection_check_id": "QC-REPEAT", "operator": "QUALITY-1"})
    assert response.status_code == 200
    assert requests == [{"tool": "reinspect_quality_check", "arguments": {"check_id": "QC-ORIGINAL", "passed": True, "reinspection_check_id": "QC-REPEAT", "findings": [], "evidence": [], "operator": "QUALITY-1"}}]
