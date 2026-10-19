"""Headless CAD startup must check the selected interpreter's native kernel."""
import importlib
import json
import subprocess
import sys

import pytest

from scripts import start_all


def runtime():
    assert importlib.util.find_spec('scripts.text_to_cad_runtime'), 'headless CAD runtime probe is missing'
    return importlib.import_module('scripts.text_to_cad_runtime')


def test_missing_interpreter_is_reported_without_launching_gui(tmp_path):
    status = runtime().probe({'CADGEN_PYTHON': str(tmp_path / 'missing-python')})
    assert status == {'ready': False, 'provider': 'text-to-cad', 'reason': 'interpreter_unavailable'}
    assert list(tmp_path.iterdir()) == []


@pytest.mark.parametrize('evidence', [
    {'provider': 'text-to-cad', 'cadgen_version': '0.7.10', 'valid': False, 'volume': 1.0},
    {'provider': 'text-to-cad', 'cadgen_version': '0.7.10', 'valid': True, 'volume': 0.0},
    {'provider': 'text-to-cad', 'cadgen_version': '0.7.9', 'valid': True, 'volume': 1.0},
])
def test_import_or_wrong_version_without_valid_geometry_is_not_ready(monkeypatch, evidence):
    module = runtime()
    monkeypatch.setattr(module.subprocess, 'run', lambda *_args, **_kwargs: subprocess.CompletedProcess([], 0, json.dumps(evidence), ''))
    assert module.probe({}) == {'ready': False, 'provider': 'text-to-cad', 'reason': 'probe_failed'}


def test_probe_accepts_native_evidence_and_uses_selected_python(monkeypatch):
    module = runtime()
    commands = []
    def run(command, **options):
        commands.append((command, options))
        return subprocess.CompletedProcess(command, 0, json.dumps({'provider': 'text-to-cad', 'cadgen_version': '0.7.10', 'build123d_version': '0.11.1', 'node_version': 'v22.16.0', 'valid': True, 'volume': 1.0}), '')
    monkeypatch.setattr(module.subprocess, 'run', run)
    status = module.probe({'CADGEN_PYTHON': sys.executable, 'APP_ENV': 'production'})
    assert status['ready'] is True and status['provider'] == 'text-to-cad'
    command, options = commands[0]
    assert command[0] == sys.executable
    assert command[1:3] == ['-I', '-c']
    assert options['timeout'] == 60
    assert options.get('shell', False) is False


@pytest.mark.parametrize('node_version', [None, 'v18.20.8', 'unrecognized'])
def test_native_kernel_without_supported_mesh_export_runtime_is_not_ready(monkeypatch, node_version):
    module = runtime()
    evidence = {'provider': 'text-to-cad', 'cadgen_version': '0.7.10',
                'node_version': node_version, 'valid': True, 'volume': 1.0}
    monkeypatch.setattr(module.subprocess, 'run', lambda *_args, **_kwargs: subprocess.CompletedProcess([], 0, json.dumps(evidence), ''))
    assert module.probe({}) == {'ready': False, 'provider': 'text-to-cad', 'reason': 'probe_failed'}


@pytest.mark.parametrize('failure', ['timeout', 'nonzero', 'malformed'])
def test_probe_failure_is_bounded_and_does_not_expose_child_output(monkeypatch, failure):
    module = runtime()
    def run(command, **options):
        if failure == 'timeout':
            raise subprocess.TimeoutExpired(command, options['timeout'], stderr='secret=private')
        return subprocess.CompletedProcess(command, 1 if failure == 'nonzero' else 0, 'secret=private', 'secret=private')
    monkeypatch.setattr(module.subprocess, 'run', run)
    result = module.probe({})
    assert result['ready'] is False
    assert result['reason'] == ('probe_timeout' if failure == 'timeout' else 'probe_failed')
    assert 'private' not in json.dumps(result)


def test_startup_uses_headless_probe_in_production(monkeypatch):
    assert hasattr(start_all, '_check_text_to_cad'), 'startup still requires a FreeCAD GUI'
    module = runtime()
    monkeypatch.setattr(module, 'probe', lambda env: {'ready': env['APP_ENV'] == 'production', 'provider': 'text-to-cad'})
    assert start_all._check_text_to_cad({'APP_ENV': 'production'})['ready'] is True


def test_document_worker_prefers_new_flag_and_preserves_legacy_config():
    assert start_all.cad_document_worker_service({'CAD_DOCUMENTS_ENABLED': 'false', 'FREECAD_DOCUMENTS_ENABLED': 'true'}) is None
    for config in ({'CAD_DOCUMENTS_ENABLED': 'true'}, {'FREECAD_DOCUMENTS_ENABLED': 'true'}):
        entry = start_all.cad_document_worker_service(config)
        assert entry[0] == 'cad-document-worker'
        assert entry[1][-1].replace('\\', '/').endswith('/scripts/text_to_cad_document_worker.py')
