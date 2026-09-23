def test_rag_service_default_port_matches_platform_contract():
    from config.settings import Settings

    assert Settings().service_port == 8020


def test_explicit_and_experience_collections_are_searchable(tmp_path):
    from config.settings import Settings

    settings = Settings(
        _env_file=None,
        rag_data_dir=str(tmp_path),
        milvus_collections="custom_a, custom_b",
        rag_experience_collection="maint_fault_events",
    )

    assert settings.milvus_search_collections == [
        "custom_a",
        "custom_b",
        "maint_fault_events",
    ]


def test_rag_service_env_precedence_is_root_then_service(tmp_path):
    from config.settings import Settings

    root = tmp_path / "root.env"
    service = tmp_path / "service.env"
    root.write_text("SERVICE_PORT=8000\nMILVUS_DATABASE=root_db\n", encoding="utf-8")
    service.write_text("SERVICE_PORT=8020\nMILVUS_DATABASE=service_db\n", encoding="utf-8")

    settings = Settings(_env_file=(str(root), str(service)), _env_file_encoding="utf-8")
    assert settings.service_port == 8020
    assert settings.milvus_database == "service_db"
