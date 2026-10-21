"""CAD proposal attempts remain visible from model start through their final outcome."""
import json
from concurrent.futures import ThreadPoolExecutor
from threading import Event

import pytest

from app.api.expert_agents import expert_agent_metrics
from app.cad_documents.proposal import observed_cad_call, propose_document_command
from app.harness.trace import TraceRecorder
from shared.freecad_documents import DocumentHead, DocumentSnapshot


@pytest.mark.parametrize(
    ('model_response', 'expected_status', 'expected_metric'),
    [
        ({'status': 'ready', 'spec': {'units': 'mm', 'operations': [
            {'type': 'box', 'mode': 'add', 'length': 40, 'width': 20,
             'height': 10, 'position': [0, 0, 0]},
        ]}}, 'ready', 'completed'),
        ({'status': 'needs_input', 'questions': ['请确认尺寸']}, 'needs_input', 'blocked'),
        (None, None, 'failed'),
    ],
)
def test_cad_proposal_appears_running_until_the_same_attempt_finishes(
    model_response, expected_status, expected_metric,
):
    entered, release = Event(), Event()

    class Model:
        available = True
        timeout = 30

        def chat(self, _messages):
            entered.set()
            if not release.wait(10):
                raise TimeoutError('test did not release the model')
            if model_response is None:
                raise RuntimeError('model unavailable')
            return {'choices': [{'message': {'content': json.dumps(model_response)}}]}

    head = DocumentHead(document_id='DOC-a', owner_user_id='USER-a', part_name='底板',
                        part_number='00123', revision=0, created_at=0, updated_at=0)
    snapshot = DocumentSnapshot(document_id='DOC-a', revision=0, objects=[], product_root_ids=[],
                                source_spec=None, validation={}, artifacts=[])
    trace = TraceRecorder()

    def cad_metrics():
        return next(item for item in expert_agent_metrics(trace)['items'] if item['agent'] == 'cad')

    with ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(observed_cad_call, propose_document_command, head, snapshot,
                                 '生成长40mm、宽20mm、高10mm的长方体', Model(), trace=trace)
        try:
            assert entered.wait(5), 'proposal did not reach the model'
            active = cad_metrics()
            assert active['total'] == 1
            assert active['running'] == 1
            assert active['completed'] == active['blocked'] == active['failed'] == 0
        finally:
            release.set()
        if model_response is None:
            with pytest.raises(RuntimeError, match='model unavailable'):
                future.result(timeout=5)
        else:
            assert future.result(timeout=5)['status'] == expected_status

    final = cad_metrics()
    assert final['total'] == 1
    assert final['running'] == 0
    assert final[expected_metric] == 1
    lifecycle = [record for record in trace.list() if record.get('event') in
                 {'agent_started', 'agent_completed', 'agent_error'}]
    assert len(lifecycle) == 2
    assert lifecycle[0]['agent_run_id'] == lifecycle[1]['agent_run_id']
    assert lifecycle[0]['trace_id'] == lifecycle[1]['trace_id']
