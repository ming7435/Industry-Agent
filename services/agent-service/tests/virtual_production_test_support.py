"""Real isolated Backend routes for Agent tests; never opens the live business database."""
import hashlib
import importlib
import importlib.util
from pathlib import Path
import sys
import time
from types import SimpleNamespace

from fastapi import FastAPI
from fastapi.testclient import TestClient
import pytest
from app.clients.backend import BackendServiceError

OWNER = {'user_id': 'USER-1', 'username': '生产员', 'role': 'technician', 'enabled': 1}
OTHER = {'user_id': 'USER-2', 'username': '另一生产员', 'role': 'technician', 'enabled': 1}
SUPERVISOR = {'user_id': 'USER-3', 'username': '监督', 'role': 'supervisor', 'enabled': 1}


class RouteBackendClient:
    def __init__(self, client): self.client = client

    def request(self, path, body):
        result = self.client.post(path, json=body, headers={'Authorization': 'Bearer isolated-internal'})
        if result.status_code >= 400: raise BackendServiceError(str(result.json()), result.status_code)
        return result.json()

    def resolve_session(self, token):
        return self.request('/internal/team/session/resolve', {'token': token}).get('user')


@pytest.fixture
def production_backend(tmp_path, monkeypatch):
    root = Path(__file__).resolve().parents[2] / 'backend-service/app'
    name = 'isolated_virtual_backend'
    if name not in sys.modules:
        spec = importlib.util.spec_from_file_location(name, root / '__init__.py', submodule_search_locations=[str(root)])
        module = importlib.util.module_from_spec(spec); sys.modules[name] = module; spec.loader.exec_module(module)
    repository_class = importlib.import_module(name + '.workorder.repository').SQLiteRepository
    team_class = importlib.import_module(name + '.team.repository').TeamRepository
    team_service = importlib.import_module(name + '.team.service').TeamService
    routes = importlib.import_module(name + '.production_simulation.routes')
    service_class = importlib.import_module(name + '.production_simulation.service').VirtualProductionService
    team_routes = importlib.import_module(name + '.team.routes')
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN', 'isolated-internal')
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    facts = repository_class(str(tmp_path / 'facts.db'))
    accounts = team_class(str(tmp_path / 'accounts.db'))
    with accounts.transaction() as db:
        for actor in (OWNER, OTHER, SUPERVISOR):
            db.execute('INSERT INTO team_accounts VALUES (?,?,?,?,?,?,?,?)',
                       (actor['user_id'], actor['username'], actor['user_id'], 'unused', actor['role'], '', 1, time.time()))
    for token, actor in [('owner-session', OWNER), ('other-session', OTHER), ('supervisor-session', SUPERVISOR)]:
        accounts.save_session(hashlib.sha256(token.encode()).hexdigest(), actor['user_id'], time.time() + 3600)
    team = team_service(accounts)
    backend = SimpleNamespace(repository=facts, team=team)
    app = FastAPI(); app.include_router(routes.create_router(lambda: backend)); app.include_router(team_routes.create_router(lambda: backend))
    with TestClient(app) as client:
        yield SimpleNamespace(client=RouteBackendClient(client), store=service_class(facts), repository=facts, actor=OWNER)
