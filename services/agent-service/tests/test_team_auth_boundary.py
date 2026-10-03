import pytest
from starlette.requests import Request
from fastapi import HTTPException
from app.api.team_auth import team_actor, require_assignee


class Backend:
    def resolve_session(self, token):
        return {'user_id': 'U1', 'role': 'technician'} if token == 'valid' else None
    def call(self, tool, params):
        return {'workorder': {'assignee': 'U2'}}


def request(cookie=''):
    return Request({'type': 'http', 'headers': [(b'cookie', cookie.encode())]})


def test_missing_and_forged_session_denied():
    for cookie in ('', 'maintenance_session=forged'):
        with pytest.raises(HTTPException) as error:
            team_actor(request(cookie), Backend())
        assert error.value.status_code == 401


def test_other_assignee_and_supervisor_cannot_confirm():
    actor = team_actor(request('maintenance_session=valid'), Backend())
    with pytest.raises(HTTPException) as error:
        require_assignee('WO1', actor, Backend())
    assert error.value.status_code == 403


@pytest.mark.parametrize('path', ['/api/agent/question', '/api/v1/agent/question', '/api/agent/question/summary', '/api/v1/agent/question/summary'])
def test_question_cannot_bypass_personal_workorder_access(path):
    from fastapi.testclient import TestClient
    from app.api.server import create_app
    response = TestClient(create_app()).post(path, json={'user_text': '查询工单', 'context': {'workorder_id': 'WO-OTHERS', 'role': 'supervisor', 'actor_id': 'someone'}})
    assert response.status_code == 401


@pytest.mark.parametrize('context', [
    {'required_capabilities': ['workorder_query'], 'workorder_id': 'WO-OTHERS'},
    {'user_text': '查询工单', 'workorder_id': 'WO-OTHERS'},
    {'event_id': 'forged-event', 'required_capabilities': ['workorder_update']},
])
def test_question_cannot_inject_runtime_workorder_capability(context):
    from fastapi.testclient import TestClient
    from app.api.server import create_app
    response = TestClient(create_app()).post('/api/v1/agent/question', json={'user_text': '执行这个任务', 'context': context})
    assert response.status_code in {401, 403, 422}
    with pytest.raises(HTTPException) as error:
        require_assignee('WO1', {'role': 'supervisor', 'user_id': 'U2'}, Backend())
    assert error.value.status_code == 403
