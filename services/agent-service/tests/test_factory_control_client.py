import json

import pytest

from app.monitor.factory_api import FactoryApiClient


class _Response:
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")

    def __enter__(self):
        return self

    def __exit__(self, *_):
        return False

    def read(self):
        return self.payload


def test_control_device_posts_explicit_action_and_returns_factory_state(monkeypatch):
    captured = {}

    def fake_urlopen(request, timeout):
        captured["url"] = request.full_url
        captured["method"] = request.method
        captured["body"] = json.loads(request.data.decode("utf-8"))
        captured["timeout"] = timeout
        return _Response({"ok": True, "action": "start", "device": {"status": "running"}})

    monkeypatch.setattr("app.monitor.factory_api.urlopen", fake_urlopen)
    result = FactoryApiClient("http://factory.test", timeout=2).control_device(
        "MACHINE-1", "start", reason="repair verified"
    )

    assert result["ok"] is True
    assert captured == {
        "url": "http://factory.test/api/devices/MACHINE-1/control",
        "method": "POST",
        "body": {"action": "start", "reason": "repair verified"},
        "timeout": 2,
    }
