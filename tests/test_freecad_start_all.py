"""统一启动器只启动已安装的本地 CAD，不下载依赖、不影响其他服务。"""
import subprocess
import json
import sys
import time
from pathlib import Path

import pytest

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
        kwargs['stdout'].write(b'{"running":true,"pid":1234,"rpc_ready":true}')
        return subprocess.CompletedProcess(command, 0)

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
    def boundary(command, **kwargs):
        kwargs['stdout'].write(b'{"running":true,"pid":1234,"rpc_ready":false}')
        return subprocess.CompletedProcess(command, 0)

    monkeypatch.setattr(start_all.subprocess, 'run', boundary)
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


@pytest.mark.skipif(sys.platform != 'win32', reason='Windows inherited output handles')
@pytest.mark.parametrize('launcher_hangs', [False, True], ids=['ready', 'timeout'])
def test_optional_cad_start_returns_while_gui_keeps_inherited_output_open(tmp_path, launcher_hangs):
    """A long-lived GUI must neither delay startup nor defeat its timeout."""
    installed(tmp_path)
    gui = tmp_path / 'gui.py'
    gui.write_text('''from pathlib import Path
import sys, time
root = Path(sys.argv[1])
deadline = time.monotonic() + 30
while not (root / 'release').exists() and time.monotonic() < deadline:
    if (root / 'probe').exists():
        (root / 'alive').touch()
    time.sleep(.05)
''', encoding='utf-8')
    parent = tmp_path / 'scripts' / 'freecad_runtime.ps1'
    parent.write_text('''from pathlib import Path
import json, subprocess, sys, time
root = Path(sys.argv[1])
subprocess.Popen([sys.executable, str(root / 'gui.py'), str(root)],
                 stdin=subprocess.DEVNULL, close_fds=False)
print(json.dumps({'running': True, 'rpc_ready': True}), flush=True)
if sys.argv[2] == 'True':
    time.sleep(30)
''', encoding='utf-8')
    worker = tmp_path / 'worker.py'
    worker.write_text('''from pathlib import Path
import json, subprocess, sys
sys.path.insert(0, sys.argv[1])
from scripts import start_all
root = Path(sys.argv[2])
start_all.PROJECT_ROOT = root
start_all.FREECAD_PLATFORM = 'win32'
real_run = subprocess.run
def run_launcher(command, **options):
    options['timeout'] = 2
    return real_run([sys.executable, str(root / 'scripts/freecad_runtime.ps1'),
                     str(root), sys.argv[3]], **options)
start_all.subprocess.run = run_launcher
result = start_all._start_optional_freecad({'APP_ENV': 'development'})
(root / 'result.json').write_text(json.dumps(result), encoding='utf-8')
''', encoding='utf-8')
    process = subprocess.Popen(
        [sys.executable, str(worker), str(Path(__file__).resolve().parents[1]),
         str(tmp_path), str(launcher_hangs)], stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        creationflags=subprocess.CREATE_NO_WINDOW,
    )
    try:
        try:
            process.wait(timeout=6)
        except subprocess.TimeoutExpired:
            pytest.fail('FreeCAD startup stayed blocked by the running GUI output handles')
        assert process.returncode == 0
        expected = {'ready': False, 'reason': 'start_failed'} if launcher_hangs else {'ready': True}
        assert json.loads((tmp_path / 'result.json').read_text(encoding='utf-8')) == expected
        (tmp_path / 'probe').touch()
        deadline = time.monotonic() + 2
        while not (tmp_path / 'alive').exists() and time.monotonic() < deadline:
            time.sleep(.05)
        assert (tmp_path / 'alive').exists(), 'The optional launcher must preserve the GUI process'
    finally:
        (tmp_path / 'release').touch()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait(timeout=5)
