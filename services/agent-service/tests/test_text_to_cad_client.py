import sys

import pytest

from app.clients.text_to_cad import TextToCadClient, TextToCadConnectionError


def test_executes_trusted_python_without_freecad_or_mcp():
    result = TextToCadClient(command=[sys.executable]).call_tool(
        'execute_code', {'code': 'print("cad subprocess evidence")'})
    assert result['isError'] is False
    assert 'cad subprocess evidence' in result['content'][0]['text']


def test_failed_script_is_an_error_and_keeps_diagnostic():
    result = TextToCadClient(command=[sys.executable]).call_tool(
        'execute_code', {'code': 'raise ValueError("invalid geometry")'})
    assert result['isError'] is True
    assert 'invalid geometry' in result['content'][0]['text']


def test_dispatched_timeout_is_unknown_and_never_replayed(tmp_path):
    marker = tmp_path / 'count'
    code = f'from pathlib import Path\nimport time\np=Path({str(marker)!r})\np.write_text("once")\ntime.sleep(10)'
    with pytest.raises(TextToCadConnectionError) as error:
        TextToCadClient(command=[sys.executable], timeout=1).call_tool('execute_code', {'code': code})
    assert error.value.code == 'outcome_unknown'
    assert marker.read_text() == 'once'


def test_missing_runtime_is_unavailable():
    client = TextToCadClient(command=['__missing_cad_python__'])
    with pytest.raises(TextToCadConnectionError) as error:
        client.call_tool('execute_code', {'code': 'pass'})
    assert error.value.code == 'unavailable'
    assert client.status()['connected'] is False


def test_timeout_reaps_owned_descendant_process(tmp_path):
    import psutil
    marker = tmp_path / 'child.pid'
    child = f'import os,time\nfrom pathlib import Path\nPath({str(marker)!r}).write_text(str(os.getpid()))\ntime.sleep(60)'
    source = ('import subprocess,sys,time\n'
              f'subprocess.Popen([sys.executable,"-c",{child!r}])\n'
              'time.sleep(60)')
    try:
        with pytest.raises(TextToCadConnectionError) as error:
            TextToCadClient(command=[sys.executable], timeout=2).call_tool('execute_code', {'code': source})
        assert error.value.code == 'outcome_unknown'
        assert marker.exists(), 'child must actually start before timeout'
        pid = int(marker.read_text())
        assert not psutil.pid_exists(pid) or psutil.Process(pid).status() == psutil.STATUS_ZOMBIE
    finally:
        if marker.exists():
            pid = int(marker.read_text())
            if psutil.pid_exists(pid) and psutil.Process(pid).status() != psutil.STATUS_ZOMBIE:
                psutil.Process(pid).kill()


def test_only_execution_and_status_tools_are_supported():
    with pytest.raises(TextToCadConnectionError) as error:
        TextToCadClient().call_tool('shell', {'command': 'anything'})
    assert error.value.code == 'unsupported_tool'
