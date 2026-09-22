def test_rag_service_default_port_matches_platform_contract():
    from config.settings import Settings

    assert Settings().service_port == 8020
