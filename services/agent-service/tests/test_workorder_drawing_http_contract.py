"""Agent API→真实 ToolRegistry/MCP HTTP→CAD API→隔离 SQL 仓库的跨服务契约。"""
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from types import SimpleNamespace
from urllib.request import urlopen

from fastapi.testclient import TestClient

from app.api.server import create_app
from app.harness import TraceRecorder
from app.tools.registry import ToolRegistry


def test_scoped_drawings_through_actual_mcp_and_monitor_proxy(tmp_path, monkeypatch):
    root = Path(__file__).resolve().parents[3]
    drawings = tmp_path / 'drawings'
    drawings.mkdir()
    (drawings / 'TC820si.html').write_text('<html>测试边界</html>', encoding='utf-8')
    with socket.socket() as listener:
        listener.bind(('127.0.0.1',0))
        port = listener.getsockname()[1]
    environment = {key:value for key,value in os.environ.items() if not key.startswith(('MYSQL_','CAD_'))}
    environment.update({'APP_ENV':'testing','PYTHON_DOTENV_DISABLED':'1', 'CAD_MYSQL_HOST':'cad-test.invalid',
        'LOCAL_DRAWINGS_ROOT':str(drawings), 'DRAWING_TEST_SQL':str(tmp_path / 'isolated.sqlite3'),
        'DRAWING_TEST_PORT':str(port), 'PYTHONPATH':os.pathsep.join([str(root/'services/document-cad-service'),
            str(root/'services/document-cad-service/tests'),str(root)])})
    peer = """
import os
from pathlib import Path
import pymysql
import uvicorn
from test_runtime_connectivity import TemporaryMySQLAdapter
adapter = TemporaryMySQLAdapter(Path(os.environ['DRAWING_TEST_SQL']))
pymysql.connect = adapter.connect
uvicorn.run('app.main:app',host='127.0.0.1',port=int(os.environ['DRAWING_TEST_PORT']),log_level='error')
"""
    process = subprocess.Popen([sys.executable,'-c',peer],cwd=root,env=environment,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        base = f'http://127.0.0.1:{port}'
        deadline = time.monotonic()+15
        while True:
            assert process.poll() is None, '隔离 CAD 测试进程提前退出'
            try:
                with urlopen(base+'/ready',timeout=.5) as response:
                    assert json.load(response)['ready'] is True
                break
            except OSError:
                assert time.monotonic() < deadline, '隔离 CAD 服务未及时就绪'
                time.sleep(.05)
        monkeypatch.setenv('BACKEND_SERVICE_BASE_URL','http://127.0.0.1:9')
        monkeypatch.setenv('CAD_ALLOW_DEMO_FALLBACK','false')
        trace = TraceRecorder()
        tools = ToolRegistry(cad_base_url=base,rag_client=object(),trace=trace)
        client = TestClient(create_app(SimpleNamespace(container=SimpleNamespace(registry=tools))))
        device = 'TRAK-TC820LTYSI-001'
        data = client.get('/api/cad/drawings',params={'device_id':device}).json()
        assert data['status'] == 'available'
        assert data['source'] == 'mysql-device-drawings'
        assert data['drawings'][0]['drawing_url'] == '/drawings/TC820si.html'
        assert client.get('/api/cad/drawings',params={'device_id':'ELITE-CS612-ROBOT-001'}).json()['status'] == 'not_found'
        calls = [record for record in trace.list() if record.get('event') == 'tool_called']
        assert len(calls) == 2
        assert all(record['tool_name'] == 'query_drawing' and record['mcp_server'] == 'cad' for record in calls)
        assert calls[0]['arguments']['device_id'] == device
        assert calls[0]['arguments']['reference_only'] is True
        assert calls[0]['output']['drawings'][0]['device_id'] == device
        import monitor_web_server as monitor
        assert monitor.MonitorRequestHandler._should_proxy('/api/cad/drawings') is True
        assert monitor.MonitorRequestHandler._should_proxy('/tools/call') is False
    finally:
        process.terminate()
        process.wait(timeout=5)
