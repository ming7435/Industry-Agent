"""Durable CAD failures retain their cause without executing a model or native kernel."""
import pytest

from app.agents.cad.agent import CADAgent
from app.harness.trace import TraceRecorder
from app.tools.registry import ToolRegistry


RUN_ID = 'FC-' + 'd' * 64
SPEC = {'units': 'mm', 'operations': [
    {'type': 'box', 'mode': 'add', 'length': 30, 'width': 20, 'height': 10, 'position': [0, 0, 0]},
]}


class StoredJobBackend:
    def __init__(self, state, error_code):
        self.state, self.error_code = state, error_code
        self.operations = []

    def request(self, path, body):
        operation = path.rsplit('/', 1)[-1]
        self.operations.append(operation)
        if operation == 'enqueue_system_job':
            assert body['request_key'] == RUN_ID
            return {'result': dict(job_id='JOB-isolated', input_digest='a' * 64,
                job_kind='legacy_generate', owner_user_id='SYSTEM', document_id=None,
                expected_revision=None, envelope=None, source=body['payload'])}
        assert operation == 'job'
        assert body['job_id'] == 'JOB-isolated'
        return {'result': dict(envelope=None, input_digest='a' * 64, owner_user_id='SYSTEM',
            state=self.state, job_id='JOB-isolated', error_code=self.error_code)}


def run_stored_job(monkeypatch, backend):
    monkeypatch.setenv('CAD_DOCUMENTS_ENABLED', 'true')
    monkeypatch.setattr('app.cad_documents.gateway.BackendServiceClient', lambda: backend)

    class NoNativeExecution:
        def call_tool(self, *args, **kwargs):
            pytest.fail('Stored failures must never execute a native CAD call')

    trace = TraceRecorder()
    agent = CADAgent(ToolRegistry(trace=trace))
    agent.runtime_trace = trace
    return agent.run_freecad('已确认的长方体规格', run_id=RUN_ID,
        client=NoNativeExecution(), model=None, spec=SPEC)


@pytest.mark.parametrize('error_code,message', [
    ('runtime_unavailable', 'Text-to-CAD 建模运行环境不可用，请检查本地 Python 环境和几何内核依赖。'),
    ('native_offline', 'Text-to-CAD 本地建模内核未就绪，请检查内核运行环境。'),
    ('managed_runtime_mismatch', 'Text-to-CAD 托管内核运行环境校验未通过，请检查内核版本及运行环境配置。'),
    ('geometry_invalid', 'text-to-cad 未通过几何验证'),
    (None, 'text-to-cad 未通过几何验证'),
])
def test_durable_failures_keep_their_code_and_classified_message(monkeypatch, error_code, message):
    backend = StoredJobBackend('failed', error_code)
    result = run_stored_job(monkeypatch, backend)
    assert result['status'] == 'failed'
    assert result['error_code'] == (error_code or 'native_failed')
    assert result['error'] == message
    assert result['answer'] == message
    assert result['error_stage'] == 'text_to_cad'
    assert result['artifacts'] == []
    assert result['calls'] == []
    assert backend.operations == ['enqueue_system_job', 'job']


def test_durable_unknown_result_queries_original_job_without_replay(monkeypatch):
    backend = StoredJobBackend('outcome_unknown', 'transport_or_validation_failed')
    result = run_stored_job(monkeypatch, backend)
    assert result['status'] == 'outcome_unknown'
    assert result['error_code'] == 'outcome_unknown'
    assert '不会自动重放' in result['error']
    assert result['artifacts'] == []
    assert backend.operations == ['enqueue_system_job', 'job']
