"""统一启动器只启动已安装的本地 CAD，不下载依赖、不影响其他服务。"""
import subprocess

from scripts import start_all


def test_missing_optional_cad_installation_is_explicit_and_not_launched(tmp_path, monkeypatch):
    monkeypatch.setattr(start_all, 'PROJECT_ROOT', tmp_path)
    result = start_all._start_optional_freecad({})
    assert result['ready'] is False
    assert result['reason'] == 'not_installed'
    assert not (tmp_path / '.runtime').exists()


def installed(tmp_path):
    for name in ('.runtime/freecad/bin/FreeCAD.exe', '.runtime/freecad-mcp-venv/Scripts/freecad-mcp.exe', 'scripts/freecad_runtime.ps1'):
        target = tmp_path / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.touch()


def test_installed_cad_is_started_with_bounded_hidden_launcher(tmp_path, monkeypatch):
    installed(tmp_path)
    monkeypatch.setattr(start_all, 'PROJECT_ROOT', tmp_path)
    monkeypatch.setattr(start_all, 'FREECAD_PLATFORM', 'win32')
    calls = []

    def boundary(command, **kwargs):
        calls.append((command, kwargs))
        return subprocess.CompletedProcess(command, 0, '{"running":true,"pid":1234,"rpc_ready":true}', '')

    monkeypatch.setattr(start_all.subprocess, 'run', boundary)
    result = start_all._start_optional_freecad({'APP_ENV': 'development'})
    assert result['ready'] is True
    assert len(calls) == 1
    command, options = calls[0]
    assert command[-3:] == ['start', '-WaitSeconds', '45']
    assert command[command.index('-File') + 1] == str(tmp_path / 'scripts/freecad_runtime.ps1')
    assert options['timeout'] == 55
    assert options['env'] == {'APP_ENV': 'development'}
    assert options.get('shell', False) is False


def test_failed_optional_cad_start_is_reported_without_secret_details(tmp_path, monkeypatch):
    installed(tmp_path)
    monkeypatch.setattr(start_all, 'PROJECT_ROOT', tmp_path)
    monkeypatch.setattr(start_all, 'FREECAD_PLATFORM', 'win32')

    def boundary(command, **kwargs):
        return subprocess.CompletedProcess(command, 1, '', 'private-path secret=DO_NOT_SHOW')

    monkeypatch.setattr(start_all.subprocess, 'run', boundary)
    result = start_all._start_optional_freecad({})
    assert result == {'ready': False, 'reason': 'start_failed'}


def test_running_gui_without_confirmed_rpc_is_not_ready(tmp_path, monkeypatch):
    installed(tmp_path)
    monkeypatch.setattr(start_all, 'PROJECT_ROOT', tmp_path)
    monkeypatch.setattr(start_all, 'FREECAD_PLATFORM', 'win32')
    monkeypatch.setattr(start_all.subprocess, 'run', lambda command, **kwargs:
        subprocess.CompletedProcess(command, 0, '{"running":true,"pid":1234,"rpc_ready":false}', ''))
    assert start_all._start_optional_freecad({}) == {'ready': False, 'reason': 'start_failed'}


def test_optional_cad_start_timeout_does_not_repeat_launch(tmp_path, monkeypatch):
    installed(tmp_path)
    monkeypatch.setattr(start_all, 'PROJECT_ROOT', tmp_path)
    monkeypatch.setattr(start_all, 'FREECAD_PLATFORM', 'win32')
    calls = []

    def boundary(command, **kwargs):
        calls.append(command)
        raise subprocess.TimeoutExpired(command, 55)

    monkeypatch.setattr(start_all.subprocess, 'run', boundary)
    assert start_all._start_optional_freecad({}) == {'ready': False, 'reason': 'start_failed'}
    assert len(calls) == 1


def test_production_does_not_implicitly_start_a_local_gui(tmp_path, monkeypatch):
    installed(tmp_path)
    monkeypatch.setattr(start_all, 'PROJECT_ROOT', tmp_path)
    monkeypatch.setattr(start_all, 'FREECAD_PLATFORM', 'win32')
    assert start_all._start_optional_freecad({'APP_ENV': 'production'}) == {'ready': False, 'reason': 'manual_start_required'}
