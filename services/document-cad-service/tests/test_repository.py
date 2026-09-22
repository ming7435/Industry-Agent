def test_demo_repository_preserves_structured_catalog_contract():
    from app.repository import DemoCADRepository

    repository = DemoCADRepository()
    items = repository.search("主轴")
    assert items
    assert {"component_id", "part_no", "drawing_ref"} <= set(items[0])


def test_production_without_mysql_does_not_silently_use_demo(monkeypatch):
    from app import repository

    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("CAD_MYSQL_HOST", raising=False)
    monkeypatch.delenv("MYSQL_HOST", raising=False)
    monkeypatch.delenv("CAD_ALLOW_DEMO_FALLBACK", raising=False)
    repository.reset_repository()
    try:
        try:
            repository.get_repository()
        except repository.CADRepositoryError:
            pass
        else:
            raise AssertionError("production CAD unexpectedly used demo catalog")
    finally:
        monkeypatch.setenv("APP_ENV", "development")
        repository.reset_repository()
