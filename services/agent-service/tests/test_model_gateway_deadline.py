"""The Agent must be able to receive a successful response after a gateway retry."""
import io
import json
import pytest

from app.clients.model import ModelServiceClient, ModelServiceError


def test_chat_receives_a_gateway_retry_response_after_old_ninety_second_limit(monkeypatch):
    monkeypatch.delenv('MODEL_SERVICE_TIMEOUT_SECONDS', raising=False)
    monkeypatch.setenv('MODEL_PROVIDER_TIMEOUT_SECONDS', '90')
    monkeypatch.setenv('MODEL_PROVIDER_MAX_ATTEMPTS', '2')
    def reply(_request, timeout):
        # First upstream attempt expires at 90 s; a real second attempt succeeds at 110 s.
        if timeout < 110:
            raise TimeoutError('gateway retry is still running')
        return io.BytesIO(json.dumps({'choices': [{'message': {'content': 'evidence result'}}]}).encode())
    monkeypatch.setattr('app.clients.model.urlopen', reply)
    result = ModelServiceClient('http://isolated-model').chat([{'role': 'user', 'content': 'diagnose'}])
    assert result['choices'][0]['message']['content'] == 'evidence result'


def test_explicit_client_deadline_remains_authoritative(monkeypatch):
    monkeypatch.setenv('MODEL_SERVICE_TIMEOUT_SECONDS', '30')
    def reply(_request, timeout):
        assert timeout == 30
        raise TimeoutError('configured deadline')
    monkeypatch.setattr('app.clients.model.urlopen', reply)
    with pytest.raises(ModelServiceError, match='configured deadline'):
        ModelServiceClient('http://isolated-model').chat([])
