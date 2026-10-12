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


def test_disabled_dotenv_never_reads_a_project_env_file(tmp_path):
    import os
    import subprocess
    import sys
    from pathlib import Path
    source = Path(__file__).resolve().parents[1] / 'config' / 'settings.py'
    service = tmp_path / 'services' / 'rag-service'
    (service / 'config').mkdir(parents=True)
    (service / 'config' / 'settings.py').write_text(source.read_text(encoding='utf-8'), encoding='utf-8')
    (tmp_path / '.env').write_text('RAG_INTERNAL_TOKEN=isolated-file-that-must-not-load\n', encoding='utf-8')
    env = {**os.environ, 'PYTHON_DOTENV_DISABLED': '1', 'PYTHONPATH': str(service)}
    env.pop('RAG_INTERNAL_TOKEN', None)
    result = subprocess.run([sys.executable, '-c',
        "from config.settings import settings; assert settings.rag_internal_token == '', 'dotenv disabled but project configuration was loaded'"],
        cwd=tmp_path, env=env, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
