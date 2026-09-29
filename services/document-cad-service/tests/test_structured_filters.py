from app import main
from app.repository import DemoCADRepository


def test_demo_filters_before_limit_and_keeps_device_scope():
    items = [
        {"component_id": f"P-{i}", "part_no": f"PN-{i}", "name": "主轴", "drawing_ref": f"DWG-{i}", "device_id": "OTHER"}
        for i in range(30)
    ]
    items.append({"component_id": "TARGET", "part_no": "PN-TARGET", "name": "主轴", "drawing_ref": "DWG-TARGET", "device_id": "DEVICE-A"})
    repository = DemoCADRepository(items)

    result = repository.search("主轴", limit=1, filters={"device_id": "DEVICE-A"})

    assert [item["component_id"] for item in result] == ["TARGET"]


def test_api_passes_part_and_drawing_filters_to_repository(monkeypatch):
    class Repository:
        backend = "fixture"

        def __init__(self):
            self.filters = None

        def search(self, query, limit=20, filters=None):
            self.filters = filters
            return [{"component_id": "C-1", "part_no": "P-1", "drawing_ref": "DWG-1", "device_id": "DEVICE-A", "current": True}]

    repository = Repository()
    monkeypatch.setattr(main, "get_repository", lambda: repository)

    result = main.query_part(query="主轴", component="C-1", part_no="P-1", device_id="DEVICE-A", drawing_id="DWG-1")

    assert result["parts"]
    assert repository.filters == {
        "device_id": "DEVICE-A", "device_model": "", "drawing_id": "DWG-1", "version": "",
        "include_history": False, "tenant_id": "", "project_id": "", "component_id": "C-1", "part_no": "P-1",
    }


def test_explicit_part_no_is_not_lost_by_fetch_engineering_record(monkeypatch):
    class Repository:
        backend = "fixture"

        def search(self, query, limit=20, filters=None):
            assert filters["part_no"] == "P-TARGET"
            return [{"component_id": "C-1", "part_no": "P-TARGET", "drawing_ref": "DWG-1", "device_id": "DEVICE-A", "current": True, "part_relations": [], "bom_items": []}]

    monkeypatch.setattr(main, "get_repository", lambda: Repository())
    result = main.fetch_engineering_record(query="主轴", part_no="P-TARGET", device_id="DEVICE-A")
    assert result["components"][0]["part_no"] == "P-TARGET"
