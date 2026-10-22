"""Portable packages must execute outside the repository and preserve tool scope."""

import ast
import json
import os
from pathlib import Path
from shutil import copytree
import subprocess
import sys
from threading import Thread
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import pytest

from app.skills.management import _skill_revision
from app.skills.registry import SkillRegistry


ROOT = Path(__file__).parents[1] / 'app/skills'


def _serve(actions):
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            length = int(self.headers.get('Content-Length', '0'))
            requests.append(json.loads(self.rfile.read(length)))
            answer = actions[len(requests) - 1]
            value = {'choices': [{'message': {'role': 'assistant', 'content': json.dumps(answer)}}]}
            body = json.dumps(value).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server, requests


def test_all_packages_pass_self_check_after_copy_outside_repository(tmp_path):
    documents = sorted(ROOT.glob('*/*/SKILL.md'))
    assert len(documents) == 30
    registry = SkillRegistry(ROOT)
    for document in documents:
        package = tmp_path / document.parent.name
        copytree(document.parent, package)
        result = subprocess.run([sys.executable, str(package / 'scripts/run.py'), '--check'],
                                cwd=package, capture_output=True, text=True, encoding='utf-8', timeout=10)
        assert result.returncode == 0, (document, result.stderr, result.stdout)
        assert json.loads(result.stdout)['portable'] is True
        adapter = package / 'scripts/mcp_adapter.py'
        routes = next(ast.literal_eval(node.value) for node in ast.parse(adapter.read_text(encoding='utf-8')).body
                      if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == 'ROUTES'
                                                         for target in node.targets))
        skill = registry.get(document.parent.parent.name, document.parent.name)
        assert set(routes) == set(skill.tools) - {'read_skill_reference'}


def test_copied_diagnosis_package_reads_reference_and_calls_real_adapter(tmp_path):
    package = tmp_path / 'alarm_diagnosis_skill'
    copytree(ROOT / 'diagnosis/alarm_diagnosis_skill', package)
    adapter = tmp_path / 'real_tool.py'
    adapter.write_text('import json,sys\n'
                       'request=json.load(sys.stdin)\n'
                       'assert request["tool"] == "get_alarm_definition"\n'
                       'print(json.dumps({"found":True,"definition":"刀塔分度超时",'
                       '"source":"supplied_test_service"}))\n', encoding='utf-8')
    server, requests = _serve([
        {'action': 'tool', 'tool': 'read_skill_reference', 'arguments': {'reference': 'reasoning'}},
        {'action': 'tool', 'tool': 'get_alarm_definition', 'arguments': {'alarm_code': '700006'}},
        {'action': 'final', 'result': {'status': 'completed', 'summary': '刀塔分度超时',
                                      'diagnosis': '需核查分度机构和反馈', 'evidence': ['报警定义']}}
    ])
    try:
        payload = json.dumps({'event': {'device_id': 'D-TEST', 'alarm_code': '700006'}})
        result = subprocess.run([sys.executable, str(package / 'scripts/run.py'), '--input', '-',
                                 '--model-url', f'http://127.0.0.1:{server.server_port}',
                                 '--tool-script', str(adapter)], input=payload, cwd=package,
                                capture_output=True, text=True, encoding='utf-8', timeout=20,
                                env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
    finally:
        server.shutdown()
        server.server_close()
    assert result.returncode == 0, result.stderr
    output = json.loads(result.stdout)
    assert output['result']['diagnosis'] == '需核查分度机构和反馈'
    assert [item['tool'] for item in output['tool_calls']] == ['read_skill_reference', 'get_alarm_definition']
    assert requests[2]['messages'][-1]['content'].find('supplied_test_service') > 0


def test_copied_package_rejects_tool_not_declared_by_skill(tmp_path):
    package = tmp_path / 'alarm_diagnosis_skill'
    copytree(ROOT / 'diagnosis/alarm_diagnosis_skill', package)
    server, _ = _serve([{'action': 'tool', 'tool': 'delete_workorder', 'arguments': {'workorder_id': 'X'}}])
    try:
        result = subprocess.run([sys.executable, str(package / 'scripts/run.py'), '--input', '-',
                                 '--model-url', f'http://127.0.0.1:{server.server_port}'],
                                input='{"event":{}}', cwd=package,
                                capture_output=True, text=True, encoding='utf-8', timeout=10,
                                env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
    finally:
        server.shutdown()
        server.server_close()
    assert result.returncode == 2
    assert '未授权' in result.stderr


def test_copied_workorder_package_requires_explicit_write_opt_in(tmp_path):
    package = tmp_path / 'workorder_create'
    copytree(ROOT / 'workorder/workorder_create', package)
    server, _ = _serve([{'action': 'tool', 'tool': 'create_workorder',
                         'arguments': {'device_id': 'D-TEST', 'title': '测试工单'}}])
    try:
        result = subprocess.run([sys.executable, str(package / 'scripts/run.py'), '--input', '-',
                                 '--model-url', f'http://127.0.0.1:{server.server_port}'],
                                input='{"request":"创建工单"}', cwd=package,
                                capture_output=True, text=True, encoding='utf-8', timeout=10,
                                env={**os.environ, 'PYTHONIOENCODING': 'utf-8'})
    finally:
        server.shutdown()
        server.server_close()
    assert result.returncode == 2
    assert '--allow-writes' in result.stderr


def test_copied_mcp_adapter_sends_allowed_read_to_tool_service(tmp_path):
    package = tmp_path / 'workorder_tracking'
    copytree(ROOT / 'workorder/workorder_tracking', package)
    requests = []

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            requests.append((self.path, json.loads(self.rfile.read(int(self.headers['Content-Length']))),
                             self.headers.get('Authorization')))
            body = b'{"found":true,"workorder":{"workorder_id":"WO-TEST"}}'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        value = {'tool': 'get_workorder', 'arguments': {'workorder_id': 'WO-TEST'}, 'task': {}}
        result = subprocess.run([sys.executable, str(package / 'scripts/mcp_adapter.py')],
                                input=json.dumps(value), cwd=package, capture_output=True,
                                text=True, encoding='utf-8', timeout=10,
                                env={**os.environ, 'PYTHONIOENCODING': 'utf-8',
                                     'SKILL_MCP_MES_URL': f'http://127.0.0.1:{server.server_port}',
                                     'BACKEND_SERVICE_BASE_URL': 'http://127.0.0.1:65534',
                                     'BACKEND_INTERNAL_TOKEN': 'synthetic-secret',
                                     'SKILL_MCP_TOKEN': ''})
    finally:
        server.shutdown()
        server.server_close()
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout)['workorder']['workorder_id'] == 'WO-TEST'
    assert requests == [('/tools/call', {'tool': 'get_workorder', 'arguments': {'workorder_id': 'WO-TEST'}}, None)]


@pytest.mark.parametrize('script', ['run.py', 'mcp_adapter.py'])
def test_script_change_invalidates_revision_dependency_and_observation(tmp_path, script):
    package = tmp_path / 'skills/diagnosis/alarm_diagnosis_skill'
    copytree(ROOT / 'diagnosis/alarm_diagnosis_skill', package)
    registry = SkillRegistry(tmp_path / 'skills')
    first = registry.get('diagnosis', 'alarm_diagnosis_skill')
    first_revision = _skill_revision(package / 'SKILL.md')
    runner = package / 'scripts' / script
    runner.write_text(runner.read_text(encoding='utf-8') + '\n# changed\n', encoding='utf-8')
    second = registry.get('diagnosis', 'alarm_diagnosis_skill')
    assert first.observation()['skill_fingerprint'] != second.observation()['skill_fingerprint']
    assert _skill_revision(package / 'SKILL.md') != first_revision
    assert runner in registry.source_files('diagnosis')
