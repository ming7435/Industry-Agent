import importlib.util
from pathlib import Path


_SPEC = importlib.util.spec_from_file_location("test_all_script", Path(__file__).parents[1] / "scripts" / "test_all.py")
test_all = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
_SPEC.loader.exec_module(test_all)


def test_run_commands_executes_every_suite_after_failure(monkeypatch):
    calls = []

    class Completed:
        def __init__(self, code):
            self.returncode = code

    def fake_run(command, cwd):
        calls.append(command)
        return Completed(1 if len(calls) == 1 else 0)

    monkeypatch.setattr(test_all.subprocess, "run", fake_run)
    results = test_all.run_commands([["first"], ["second"], ["third"]])

    assert calls == [["first"], ["second"], ["third"]]
    assert [item.returncode for item in results] == [1, 0, 0]
