"""Startup ownership and authentication, using only temporary loopback services."""
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io
import json
from threading import Thread
from types import SimpleNamespace
from urllib.request import Request, urlopen

import pytest

from scripts import skill_sandbox_environment, start_all


KEY = 'isolated-sandbox-test-credential'


@contextmanager
def sandbox_server(mode='authenticated'):
    calls = []

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            key = self.headers.get('OPEN-SANDBOX-API-KEY')
            calls.append((self.path, key))
            status, body = 200, {'status': 'healthy'}
            if self.path == '/credential-trap':
                body = {'items': []}
            elif self.path.startswith('/v1/sandboxes'):
                if mode != 'public' and key != KEY:
                    status, body = 401, {'code': 'INVALID_API_KEY'}
                elif mode == 'redirect':
                    self.send_response(302)
                    self.send_header('Location', '/credential-trap')
                    self.end_headers()
                    return
                elif mode != 'malformed':
                    body = {'items': [], 'pagination': {'page': 1, 'pageSize': 1,
                            'totalItems': 0, 'totalPages': 0, 'hasNextPage': False}}
            encoded = json.dumps(body).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield server.server_port, calls
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=2)


def isolated_launcher(monkeypatch, tmp_path, port, *, occupied=True, exit_timing=None, key=KEY):
    """Replace application process boundaries, not startup decisions or HTTP checks."""
    env = {'APP_ENV': 'development', 'MONITOR_WEB_PORT': '8001',
           'SKILL_SANDBOX_ENABLED': 'true', 'SKILL_SANDBOX_API_KEY': key}
    children = []
    original_port = start_all.service_port
    original_exit = start_all.unexpected_service_exit
    monkeypatch.setattr(start_all, '_default_env', lambda: dict(env))
    monkeypatch.setattr(start_all, '_env_for_service', lambda _: dict(env))
    monkeypatch.setattr(start_all, '_check_text_to_cad', lambda _: {'ready': True})
    monkeypatch.setattr(skill_sandbox_environment, 'ensure_configuration', lambda: tmp_path / 'server.toml')
    monkeypatch.setattr(start_all.shutil, 'which', lambda _: 'isolated-uvx')
    monkeypatch.setattr(start_all, 'service_port', lambda name, command, monitor_port=8001:
                        port if name == 'skill-sandbox' else original_port(name, command, monitor_port))
    monkeypatch.setattr(start_all, '_port_in_use', lambda host, value: occupied and value == port)
    monkeypatch.setattr(start_all, '_wait_for_service_startup', lambda *_: None)

    class Child:
        def __init__(self, command, **kwargs):
            self.name = ('skill-sandbox' if 'opensandbox-server' in command else
                         'web' if '--port' not in command else command[command.index('--port') + 1])
            self.stdout = io.StringIO('')
            self.code = 3 if self.name == 'skill-sandbox' and exit_timing == 'startup' else None
            children.append(self)
            if self.name == 'web' and exit_timing == 'after_readiness':
                next(child for child in children if child.name == 'skill-sandbox').code = 3

        def poll(self):
            return self.code

        def terminate(self):
            self.code = 0

        kill = terminate

        def wait(self, timeout=None):
            return self.code

    monkeypatch.setattr(start_all.subprocess, 'Popen', Child)
    # End the real supervisor after its first health/exit decision, without waiting forever.
    monkeypatch.setattr(start_all, 'unexpected_service_exit',
                        lambda processes: original_exit(processes) or ('model-service', 0))
    return SimpleNamespace(env=env, children=children)


def test_authenticated_sandbox_is_reused_without_rejecting_new_business_credentials(monkeypatch, tmp_path):
    with sandbox_server() as (port, calls):
        runtime = isolated_launcher(monkeypatch, tmp_path, port)
        assert start_all.main() == 0
        assert {child.name for child in runtime.children} == {'8040', '8030', '8020', '8050', '8010', 'web'}
        assert any(path.startswith('/v1/sandboxes') and key == KEY for path, key in calls)
        with urlopen(Request(f'http://127.0.0.1:{port}/health'), timeout=2) as response:
            assert response.status == 200  # Externally owned service survives launcher cleanup.


@pytest.mark.parametrize('exit_timing', ['startup', 'after_readiness'])
def test_bind_race_reuses_authenticated_winner_instead_of_stopping_all_apps(monkeypatch, tmp_path, exit_timing):
    with sandbox_server() as (port, calls):
        runtime = isolated_launcher(monkeypatch, tmp_path, port, occupied=False, exit_timing=exit_timing)
        assert start_all.main() == 0
        assert len(runtime.children) == 7
        assert any(path.startswith('/v1/sandboxes') and key == KEY for path, key in calls)


@pytest.mark.parametrize('mode,key', [('authenticated', 'wrong-test-key'), ('public', KEY),
                                    ('malformed', KEY), ('redirect', KEY)])
def test_unverified_sandbox_port_is_rejected_before_starting_apps(monkeypatch, tmp_path, mode, key, capsys):
    with sandbox_server(mode) as (port, calls):
        runtime = isolated_launcher(monkeypatch, tmp_path, port, key=key)
        with pytest.raises(RuntimeError, match='技能沙箱'):
            start_all.main()
        assert not runtime.children
        assert not any(path == '/credential-trap' for path, _ in calls)
        output = capsys.readouterr().out
        assert KEY not in output and key not in output


def test_existing_business_service_still_requires_matching_internal_identity(monkeypatch, tmp_path):
    with sandbox_server() as (port, _):
        runtime = isolated_launcher(monkeypatch, tmp_path, port)
        monkeypatch.setattr(start_all, '_port_in_use', lambda host, value: value in (port, 8010))
        with pytest.raises(RuntimeError, match='内部身份无法核对'):
            start_all.main()
        assert not runtime.children


def test_new_sandbox_remains_managed_and_is_cleaned_up_with_apps(monkeypatch, tmp_path):
    with sandbox_server() as (port, _):
        runtime = isolated_launcher(monkeypatch, tmp_path, port, occupied=False)
        assert start_all.main() == 0
        assert len(runtime.children) == 7
        assert all(child.poll() is not None for child in runtime.children)


def test_failed_sandbox_without_authenticated_winner_still_stops_startup(monkeypatch, tmp_path, capsys):
    with sandbox_server() as (port, _):
        runtime = isolated_launcher(monkeypatch, tmp_path, port, occupied=False,
                                    exit_timing='startup', key='wrong-test-key')
        assert start_all.main() == 1
        assert {child.name for child in runtime.children} == {'8040', 'skill-sandbox'}
        assert all(child.poll() is not None for child in runtime.children)
        output = capsys.readouterr().out
        assert '未通过身份校验' in output
        assert KEY not in output and 'wrong-test-key' not in output
