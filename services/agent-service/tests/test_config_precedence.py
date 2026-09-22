def test_service_env_overrides_root_env_but_process_env_wins():
    from scripts import start_all

    merged = start_all._merge_env(
        explicit={"RAG_SERVICE_BASE_URL": "http://process"},
        root={"RAG_SERVICE_BASE_URL": "http://root", "SERVICE_PORT": "8000"},
        service={"RAG_SERVICE_BASE_URL": "http://service", "SERVICE_PORT": "8020"},
    )

    assert merged["RAG_SERVICE_BASE_URL"] == "http://process"
    assert merged["SERVICE_PORT"] == "8020"
