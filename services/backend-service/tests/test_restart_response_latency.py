"""A committed restart receipt must not wait for report generation."""
from concurrent.futures import ThreadPoolExecutor
from threading import Event, Thread
from types import SimpleNamespace
import json
import socket
from urllib.request import Request, urlopen

from fastapi import FastAPI
import uvicorn

from app.line_control.repository import LineControlRepository
from app.line_control.routes import create_router
from app.team.repository import TeamRepository


def test_restart_receipt_returns_while_report_generation_is_still_busy(tmp_path, monkeypatch):
    monkeypatch.setenv('APP_ENV', 'testing')
    monkeypatch.setenv('BACKEND_STORAGE', 'sqlite')
    monkeypatch.setenv('BACKEND_INTERNAL_TOKEN', 'isolated-restart-token')
    repository = TeamRepository(str(tmp_path / 'team.sqlite3'))
    ledger = LineControlRepository(repository)
    generation = ledger.claim_fault_event('EV-1', 'M1', ['M1'])['generation']
    ledger.set_stop_result(generation, {'state': 'stopped', 'devices': {}})
    ledger.begin_restart(generation)
    report_started, release_report = Event(), Event()
    def slow_report():
        report_started.set()
        release_report.wait(10)
    service = SimpleNamespace(team=SimpleNamespace(repository=repository), sync_lifecycle_reports=slow_report)
    app = FastAPI()
    app.include_router(create_router(lambda: service))
    with socket.socket() as bound:
        bound.bind(('127.0.0.1', 0))
        port = bound.getsockname()[1]
    server = uvicorn.Server(uvicorn.Config(app, host='127.0.0.1', port=port, log_level='error', ws='none'))
    thread = Thread(target=server.run, daemon=True)
    thread.start()
    def finish():
        request = Request(f'http://127.0.0.1:{port}/internal/line/finish_restart',
            data=json.dumps({'generation': generation, 'result': {
                'state': 'running', 'devices': {'M1': {'state': 'verified'}},
            }}).encode(), headers={'Content-Type': 'application/json',
                                  'Authorization': 'Bearer isolated-restart-token'}, method='POST')
        with urlopen(request, timeout=5) as response:
            return json.load(response)
    pool = ThreadPoolExecutor(max_workers=1)
    try:
        import time
        deadline = time.monotonic() + 5
        while not server.started and time.monotonic() < deadline:
            time.sleep(0.01)
        assert server.started
        future = pool.submit(finish)
        assert report_started.wait(3)
        result = future.result(timeout=1)
        assert result['result']['state'] == 'running'
        assert ledger.status()['state'] == 'running'
        assert not release_report.is_set()
    finally:
        release_report.set()
        pool.shutdown(wait=True)
        server.should_exit = True
        thread.join(5)
