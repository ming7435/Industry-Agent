"""Exercise the actual production store through an isolated loopback HTTP server."""
from contextlib import contextmanager
from copy import deepcopy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import socket
import sys
import threading
from urllib.parse import unquote

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / 'tests/unit'))
from test_virtual_turning import factory_module, RunningLine, run, setup


@pytest.fixture
def isolated_factory(tmp_path, monkeypatch):
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    module = factory_module()
    store = module.ProductionStore(tmp_path, RunningLine())
    calls, mode = [], {}

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args): pass

        def handle_request(self):
            data = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))) or b'{}')
            calls.append({'method': self.command, 'path': self.path, 'body': data, 'header': self.headers.get('X-Factory-Production')})
            path = self.path
            try:
                if path == '/api/production/capabilities':
                    value = store.capabilities()
                    value.update(mode.get('capabilities', {}))
                elif path == '/api/production/jobs': value = store.submit(data['command_id'], data['program'])
                elif path.endswith('/start'):
                    assert data['simulation_only'] is True
                    value = store.start(path.split('/')[-2], data['digest'], data['operator'])
                elif '/by-command/' in path: value = store.by_command(unquote(path.split('/')[-1]))
                else: value = store.get(unquote(path.split('/')[-1]))
                if self.command == 'POST' and mode.get('lost'):
                    self.connection.shutdown(socket.SHUT_RDWR)
                    self.connection.close()
                    return
                if mode.get('redirect'):
                    self.send_response(302)
                    self.send_header('Location', '/unexpected')
                    self.end_headers()
                    return
                raw = mode.get('raw', json.dumps(value).encode())
                self.send_response(200)
            except module.ProductionError as error:
                raw = json.dumps({'error': str(error)}).encode()
                self.send_response(error.status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(raw)))
            self.end_headers()
            try: self.wfile.write(raw)
            except (BrokenPipeError, ConnectionResetError): pass

        do_GET = do_POST = handle_request

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        yield f'http://127.0.0.1:{server.server_port}', store, calls, mode
    finally:
        server.shutdown(); server.server_close(); thread.join(timeout=2); store.close()


def program():
    from shared.virtual_turning import build_virtual_design, build_virtual_program
    return build_virtual_program(build_virtual_design(run()), setup(), '模拟钢材')


def test_receive_never_starts_or_controls(isolated_factory):
    from app.production_simulation.factory import VirtualFactoryClient
    url, store, calls, mode = isolated_factory
    client = VirtualFactoryClient(url)
    job = client.submit('test:received.1', program())
    assert job['status'] == 'received'
    assert [r['path'] for r in calls if r['method'] == 'POST'] == ['/api/production/jobs']
    assert calls[-1]['header'] == 'virtual-v1'
    assert client.by_command('test:received.1')['job_id'] == job['job_id']
    started = client.start(job['job_id'], job['program_digest'], '测试用户')
    assert started['status'] == 'running'
    store.tick(20)
    assert client.get(job['job_id'])['status'] == 'completed'


def test_lost_receive_response_does_not_retry_write(isolated_factory):
    from app.production_simulation.factory import VirtualFactoryClient, VirtualFactoryError
    url, store, calls, mode = isolated_factory
    mode['lost'] = True
    client = VirtualFactoryClient(url, timeout=1)
    with pytest.raises(VirtualFactoryError) as error: client.submit('test-lost', program())
    assert error.value.outcome_unknown is True
    assert len([r for r in calls if r['method'] == 'POST']) == 1
    mode.clear()
    assert client.by_command('test-lost')['status'] == 'received'


@pytest.mark.parametrize('url', ['https://127.0.0.1:4529', 'http://example.com', 'http://127.0.0.1:4529/path',
                                'http://user@localhost:4529', 'http://localhost:4529?x=1', 'http://127.0.0.1:0',
                                'http://127.0.0.1:4529#fragment'])
def test_endpoint_validation_rejects_non_loopback_and_extra_targets(url, monkeypatch):
    from app.production_simulation.factory import VirtualFactoryClient, VirtualFactoryError
    monkeypatch.setenv('FACTORY_CONTROL_MODE', 'virtual')
    with pytest.raises(VirtualFactoryError): VirtualFactoryClient(url)


@pytest.mark.parametrize('change', [{'ready': False}, {'simulation_only': False}, {'schema_version': 'other'},
                                   {'device_id': 'other'}, {'postprocessor': 'other'}, {'scope': 'whole-part'},
                                   {'profiles': [{}]}, {'postprocessors': 1}])
def test_invalid_capability_cannot_submit(isolated_factory, change):
    from app.production_simulation.factory import VirtualFactoryClient, VirtualFactoryError
    url, _, calls, mode = isolated_factory
    mode['capabilities'] = change
    with pytest.raises(VirtualFactoryError): VirtualFactoryClient(url).submit('cap-test', program())
    assert not any(r['method'] == 'POST' for r in calls)


def test_mode_is_required_before_each_write(isolated_factory, monkeypatch):
    from app.production_simulation.factory import VirtualFactoryClient, VirtualFactoryError
    url, _, calls, _ = isolated_factory
    client = VirtualFactoryClient(url)
    monkeypatch.setenv('FACTORY_CONTROL_MODE', '')
    with pytest.raises(VirtualFactoryError): client.submit('wrong-mode', program())
    assert not any(r['method'] == 'POST' for r in calls)


@pytest.mark.parametrize('raw', [b'not json', b'[]', b'{"status":"received"}', b' ' * (4 * 1024 * 1024 + 1)],
                         ids=['not-json', 'array', 'wrong-shape', 'oversized'])
def test_malformed_or_unbounded_response_is_rejected(isolated_factory, raw):
    from app.production_simulation.factory import VirtualFactoryClient, VirtualFactoryError
    url, _, _, mode = isolated_factory
    mode['raw'] = raw
    with pytest.raises(VirtualFactoryError): VirtualFactoryClient(url).capabilities()


def test_redirect_is_not_followed(isolated_factory):
    from app.production_simulation.factory import VirtualFactoryClient, VirtualFactoryError
    url, _, calls, mode = isolated_factory
    mode['redirect'] = True
    with pytest.raises(VirtualFactoryError): VirtualFactoryClient(url).capabilities()
    assert [r['path'] for r in calls] == ['/api/production/capabilities']


def test_conflict_is_known_and_invalid_operator_never_writes(isolated_factory):
    from app.production_simulation.factory import VirtualFactoryClient, VirtualFactoryError
    url, _, calls, _ = isolated_factory
    client = VirtualFactoryClient(url)
    job = client.submit('conflict', program())
    with pytest.raises(VirtualFactoryError) as error: client.start(job['job_id'], 'b' * 64, '用户')
    assert error.value.status == 409
    assert error.value.outcome_unknown is False
    count = len(calls)
    with pytest.raises(VirtualFactoryError): client.start(job['job_id'], job['program_digest'], '')
    assert len(calls) == count
