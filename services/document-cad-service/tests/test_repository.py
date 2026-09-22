def test_demo_repository_preserves_structured_catalog_contract():
    from app.repository import DemoCADRepository

    items = DemoCADRepository().search("主轴")
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


def test_mysql_normalization_preserves_structured_bom_and_relations():
    from app.repository import MySQLCADRepository

    value = MySQLCADRepository._normalize({
        "entity_id": "E-1",
        "entity_type": "INSERT",
        "layer_name": "SPINDLE",
        "raw_json": {
            "part_no": "P-1",
            "name": "轴承",
            "bom_items": [{"part_no": "P-2", "quantity": 2}],
            "part_relations": [{"source": "E-1", "target": "E-2", "relation_type": "contains"}],
        },
        "drawing_id": "DWG-1",
        "drawing_name": "主轴图",
    })

    assert value["bom_items"] == [{"part_no": "P-2", "quantity": 2}]
    assert value["part_relations"][0]["relation_type"] == "contains"
