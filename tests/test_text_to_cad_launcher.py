"""The retired GUI launcher must not change existing installations or processes."""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

import pytest


@pytest.mark.skipif(sys.platform != 'win32', reason='Windows compatibility entrypoint')
def test_legacy_stop_does_not_touch_saved_runtime_or_running_process(tmp_path):
    process = subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(30)'])
    state = tmp_path / 'runtime-state.json'
    original = json.dumps({'pid': process.pid, 'executable': sys.executable})
    state.write_text(original, encoding='utf-8')
    script = Path(__file__).resolve().parents[1] / 'scripts/freecad_runtime.ps1'
    try:
        result = subprocess.run([shutil.which('pwsh') or shutil.which('powershell'),
            '-NoProfile', '-File', str(script), 'stop', '-RuntimeRoot', str(tmp_path)],
            env={**os.environ, 'CADGEN_PYTHON': sys.executable}, capture_output=True,
            text=True, encoding='utf-8', timeout=20)
        assert result.returncode == 0
        assert json.loads(result.stdout) == {'provider': 'text-to-cad', 'stopped': False,
                                          'reason': 'no_background_runtime'}
        assert state.read_text(encoding='utf-8') == original
        assert process.poll() is None
    finally:
        process.terminate()
        process.wait(timeout=5)
