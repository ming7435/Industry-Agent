def test_monitor_web_server_imports_current_tool_registry() -> None:
    import monitor_web_server
    from app.tools.registry import ToolRegistry

    assert monitor_web_server.ToolRegistry is ToolRegistry
