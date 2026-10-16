"""启动配置与安全校验，不加载本地业务配置或调用收费模型。"""
import pytest


def test_local_launcher_selects_rabbitmq_without_rewriting_env(monkeypatch):
    from scripts import start_all
    monkeypatch.setattr(start_all, '_read_env_file', lambda _: {})
    monkeypatch.delenv('AGENT_EVENT_TRANSPORT', raising=False)
    env = start_all._default_env()
    assert env['AGENT_EVENT_TRANSPORT'] == 'rabbitmq'
    assert env['AGENT_EVENT_WORKERS'] == '4'


def test_production_rejects_guest_and_inline_without_leaking_credentials(monkeypatch):
    from app.runtime.event_queue import QueueSettings, queue_enabled
    monkeypatch.setenv('APP_ENV', 'production')
    with pytest.raises(ValueError) as caught:
        QueueSettings(url='amqp://guest:do-not-print@127.0.0.1:5672/%2F')
    assert 'do-not-print' not in str(caught.value)
    monkeypatch.setenv('AGENT_EVENT_TRANSPORT', 'inline')
    with pytest.raises(ValueError, match='生产'):
        queue_enabled()


def test_connection_errors_do_not_expose_url_in_public_state():
    from app.runtime.event_queue import QueueSettings
    settings = QueueSettings(url='amqp://isolated:do-not-print@127.0.0.1:5672/%2F')
    assert 'do-not-print' not in repr(settings)


def test_unknown_transport_is_not_silently_accepted(monkeypatch):
    from app.runtime.event_queue import queue_enabled
    monkeypatch.setenv('AGENT_EVENT_TRANSPORT', 'invalid')
    with pytest.raises(ValueError):
        queue_enabled()
