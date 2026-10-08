"""启动器安全检查调用真实 PowerShell 进程管理脚本。"""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

import pytest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "freecad_runtime.ps1"
POWERSHELL = shutil.which("pwsh") or shutil.which("powershell")
pytestmark = pytest.mark.skipif(sys.platform != "win32", reason="Windows launcher")


def run_launcher(action, runtime):
    return subprocess.run(
        [POWERSHELL, "-NoProfile", "-File", str(SCRIPT), action, "-RuntimeRoot", str(runtime)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=20,
    )


def test_status_does_not_create_runtime_directory(tmp_path):
    runtime = tmp_path / "absent"
    result = run_launcher("status", runtime)
    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout)["running"] is False
    assert not runtime.exists()


def test_windows_powershell_default_runtime_path_is_resolved_after_parameters(tmp_path):
    # Windows 自带 5.1 与当前终端 7.x 都必须支持省略 RuntimeRoot 的启动命令。
    isolated_script = tmp_path / 'scripts' / SCRIPT.name
    isolated_script.parent.mkdir()
    shutil.copy2(SCRIPT, isolated_script)
    result = subprocess.run([shutil.which('powershell'), '-NoProfile', '-ExecutionPolicy', 'Bypass',
        '-File', str(isolated_script), 'status'], capture_output=True, text=True, encoding='utf-8',
        errors='replace', timeout=20)
    assert result.returncode == 0, result.stderr
    status = json.loads(result.stdout)
    assert status['running'] is False
    assert Path(status['runtime_root']) == tmp_path / '.runtime' / 'freecad'
    assert not (tmp_path / '.runtime').exists()


def test_start_reports_missing_installation_without_launching(tmp_path):
    result = run_launcher("start", tmp_path)
    assert result.returncode != 0
    assert "FreeCAD.exe" in result.stderr
    assert not (tmp_path / "runtime-state.json").exists()


def test_stop_refuses_pid_whose_executable_is_not_the_recorded_freecad(tmp_path):
    child = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(30)"])
    try:
        (tmp_path / "runtime-state.json").write_text(
            json.dumps({"pid": child.pid, "executable": str(tmp_path / "bin" / "FreeCAD.exe"),
                        "start_time_utc": "2000-01-01T00:00:00.0000000Z"}), encoding="utf-8"
        )
        result = run_launcher("stop", tmp_path)
        assert result.returncode != 0
        assert "identity" in result.stderr.lower()
        assert child.poll() is None
        assert (tmp_path / "runtime-state.json").exists()
    finally:
        child.terminate()
        child.wait(timeout=5)


def test_start_cannot_reuse_a_running_gui_as_rpc_ready(tmp_path):
    executable = tmp_path / 'bin' / 'FreeCAD.exe'
    executable.parent.mkdir()
    shutil.copy2(Path(os.environ['SystemRoot']) / 'System32' / 'ping.exe', executable)
    child = subprocess.Popen([str(executable), '-t', '127.0.0.1'], stdout=subprocess.DEVNULL)
    try:
        start = subprocess.check_output([POWERSHELL, '-NoProfile', '-Command',
            f"(Get-Process -Id {child.pid}).StartTime.ToUniversalTime().ToString('o')"], text=True, encoding='utf-8').strip()
        (tmp_path / 'runtime-state.json').write_text(json.dumps({'pid': child.pid,
            'executable': str(executable), 'start_time_utc': start}), encoding='utf-8')
        result = run_launcher('start', tmp_path)
        assert result.returncode != 0
        status = json.loads(result.stdout)
        assert status['running'] is True and status['rpc_ready'] is False
        assert child.poll() is None
    finally:
        child.terminate()
        child.wait(timeout=5)


@pytest.mark.parametrize("use_actual_start", [True, False])
def test_lifecycle_checks_executable_and_start_time_before_stopping(tmp_path, use_actual_start):
    executable = tmp_path / "bin" / "FreeCAD.exe"
    executable.parent.mkdir()
    # A harmless real Windows process exercises identity handling without CAD.
    shutil.copy2(Path(os.environ["SystemRoot"]) / "System32" / "ping.exe", executable)
    child = subprocess.Popen([str(executable), "-t", "127.0.0.1"], stdout=subprocess.DEVNULL)
    try:
        start = subprocess.check_output(
            [POWERSHELL, "-NoProfile", "-Command",
             f"(Get-Process -Id {child.pid}).StartTime.ToUniversalTime().ToString('o')"],
            text=True, encoding="utf-8",
        ).strip()
        state = {"pid": child.pid, "executable": str(executable),
                 "start_time_utc": start if use_actual_start else "2000-01-01T00:00:00.0000000Z"}
        (tmp_path / "runtime-state.json").write_text(json.dumps(state), encoding="utf-8")
        if use_actual_start:
            status = run_launcher("status", tmp_path)
            assert status.returncode == 0, status.stderr
            assert json.loads(status.stdout)["running"] is True
            result = run_launcher("stop", tmp_path)
            assert result.returncode == 0, result.stderr
            assert json.loads(result.stdout)["stopped"] is True
            child.wait(timeout=5)
            assert not (tmp_path / "runtime-state.json").exists()
        else:
            result = run_launcher("stop", tmp_path)
            assert result.returncode != 0
            assert "identity" in result.stderr.lower()
            assert child.poll() is None
    finally:
        if child.poll() is None:
            child.terminate()
        child.wait(timeout=5)
