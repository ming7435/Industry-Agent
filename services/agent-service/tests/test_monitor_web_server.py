def test_monitor_web_server_does_not_construct_agent_runtime(monkeypatch) -> None:
    import monitor_web_server

    monkeypatch.setattr(monitor_web_server.FactoryApiClient, "devices", lambda self: [])
    state = monitor_web_server.MonitorWebState()
    assert not hasattr(monitor_web_server.MonitorWebState, "orchestrator")
    assert not hasattr(state, "orchestrator")
    assert not hasattr(state, "diagnosis_agent")
    state.stop()
