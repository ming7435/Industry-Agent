import importlib
import json


def test_diagnosis_normalizes_model_tool_arguments() -> None:
    policy = importlib.import_module("app.agents.diagnosis.tool_policy")
    state = {
        "event": {
            "device_id": "D-1",
            "alarm_code": "700223",
            "abnormal_metrics": [{"key": "temperature"}],
        },
        "device_id": "D-1",
        "alarm_code": "700223",
    }

    alarm = policy.normalize_tool_arguments(
        "get_alarm_definition",
        {"alarm_code": "700223", "device_id": "D-1"},
        state,
    )
    history = policy.normalize_tool_arguments(
        "get_device_history",
        {"device_id": "D-1", "metrics": ["spindle_temperature_c"]},
        state,
    )

    assert alarm == {"alarm_code": "700223"}
    assert history["metric_keys"] == ["spindle_temperature_c"]
    assert "metrics" not in history


def test_tool_registry_normalizes_diagnostic_aliases_before_dispatch() -> None:
    registry_module = importlib.import_module("app.tools.registry")

    assert registry_module.ToolRegistry.normalize_tool_arguments(
        "get_alarm_definition",
        {"alarm_code": "700223", "device_id": "D-1"},
    ) == {"alarm_code": "700223"}
    assert registry_module.ToolRegistry.normalize_tool_arguments(
        "get_device_history",
        {"device_id": "D-1", "metrics": ["spindle_temperature_c"]},
    ) == {
        "device_id": "D-1",
        "metric_keys": ["spindle_temperature_c"],
    }


def test_device_history_accepts_model_metric_alias(monkeypatch):
    history_module = importlib.import_module("app.tools.diagnosis.get_device_history")

    class Response:
        def read(self):
            return json.dumps(
                {
                    "history": [
                        {"timestamp": "t1", "metrics": {"spindle_pressure_psi": 10}},
                    ]
                }
            ).encode()

        def __enter__(self):
            return self

        def __exit__(self, *_):
            return False

    monkeypatch.setattr(history_module, "urlopen", lambda *_args, **_kwargs: Response())

    result = history_module.get_device_history(
        "D-1",
        metric="spindle_pressure_psi",
        alarm_code="EQ-LED-HOLD-MODE",
        base_url="http://factory",
    )

    assert result["success"] is True
    assert result["metric_keys"] == ["spindle_pressure_psi"]
