import importlib
import json


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
