"""The upstream server reports execution failures in ordinary text content."""

import importlib.util
from pathlib import Path

import pytest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "freecad_smoke.py"


def parse(result):
    assert SCRIPT.exists(), "The real MCP smoke verifier must exist"
    spec = importlib.util.spec_from_file_location("freecad_smoke", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.parse_execution_result(result)


def test_execution_failure_is_rejected_even_when_mcp_is_error_is_false():
    with pytest.raises(RuntimeError, match="Failed to execute code"):
        parse({"isError": False, "content": [{"type": "text", "text": "Failed to execute code: bad shape"}]})


def test_missing_geometry_evidence_is_rejected():
    with pytest.raises(RuntimeError, match="geometry evidence"):
        parse({"isError": False, "content": [{"type": "text", "text": "Code executed successfully: Output: done"}]})


def test_geometry_evidence_is_read_from_stdout_without_guessing():
    result = parse({"isError": False, "content": [{"type": "text", "text":
        'Code executed successfully: Python code executed successfully.\nOutput: FREECAD_SMOKE_JSON={"valid":true,"solids":1,"volume":2717.2566611769184}\n'}]})
    assert result == {"valid": True, "solids": 1, "volume": 2717.2566611769184}
