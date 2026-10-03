from fastapi.testclient import TestClient
import app.main as main


def test_internal_tools_reject_missing_token(tmp_path, monkeypatch):
    monkeypatch.setenv('BACKEND_STORAGE', 'sqlite')
    monkeypatch.setenv('BACKEND_SQLITE_PATH', str(tmp_path / 'auth.db'))
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN', 'isolated-test-token')
    main._service = None
    client = TestClient(main.app)
    body = {'tool': 'create_workorder', 'arguments': {'device_id': 'M1'}}
    assert client.post('/tools/call', json=body).status_code == 401
    assert client.post('/tools/call', json=body, headers={'Authorization': 'Bearer isolated-test-token'}).status_code == 200
    assert client.post('/internal/team/session/resolve', json={'token': 'fake'}).status_code == 401
