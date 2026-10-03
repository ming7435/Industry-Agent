"""工具收敛保留原始名称权限、查询范围、过滤条件和返回投影。"""

from dataclasses import replace

import pytest

from app.harness.trace import TraceRecorder
from app.tools.registry import ToolRegistry
from app.tools.cad.query_part_relation import query_part_relation
from app.tools.cad.query_assembly_relation import query_assembly_relation
from app.tools.maintenance.query_inventory import query_inventory
from app.tools.maintenance.query_stock import query_stock
from app.tools.maintenance.query_part_availability import query_part_availability


class RecordingRag:
    def __init__(self):
        self.calls = []

    def search(self, query, *, limit, filters):
        self.calls.append((query, limit, filters))
        return {"query": query, "documents": [], "source": "rag-test"}


def test_stock_alias_keeps_inventory_facts_and_projection():
    result = query_stock("冷却", device_id="D-1")
    assert result == query_inventory("冷却", device_id="D-1")
    assert result["synthetic"] is True and result["degraded"] is True
    assert result["stock"] == result["parts"]


def test_availability_part_number_has_priority():
    result = query_part_availability("温度", part_no="COOLANT-PUMP", device_id="D-1")
    assert result["query"] == "COOLANT-PUMP"
    assert result["device_id"] == "D-1"
    assert [row["part_no"] for row in result["parts"]] == ["CP-TC820-015"]
    assert result["available"] is True
    assert result["source"] == "inventory-mcp-compatible"


@pytest.mark.parametrize("name,extra,expected", [
    ("search_alarm_knowledge", {"alarm_code": "NEW"}, {"device_id": "D-1", "alarm_code": "NEW", "knowledge_type": "alarm"}),
    ("search_sop", {}, {"device_id": "D-1", "knowledge_type": "sop"}),
    ("search_manual", {}, {"device_id": "D-1", "knowledge_type": "manual"}),
    ("search_fault_cases", {}, {"device_id": "D-1", "knowledge_type": "case"}),
    ("search_semantic_memory", {}, {"device_id": "D-1"}),
])
def test_specialized_rag_filters_are_preserved(name, extra, expected):
    rag = RecordingRag()
    tools = ToolRegistry(rag_client=rag)
    filters = {"device_id": "D-1", "alarm_code": "OLD", "knowledge_type": "wrong"}
    result = tools.execute(name, {"query": "主轴", "limit": 3, "filters": filters, **extra})
    assert result == {"query": "主轴", "documents": [], "source": "rag-test"}
    assert rag.calls == [("主轴", 3, expected)]
    assert filters == {"device_id": "D-1", "alarm_code": "OLD", "knowledge_type": "wrong"}


@pytest.mark.parametrize("name,operation", [
    ("query_part_relation", "query_relation"), ("query_assembly_relation", "query_relation"),
    ("get_component_location", "query_relation"), ("get_drawing_metadata", "query_drawing"),
    ("query_cad", "fetch_engineering_record"), ("query_drawing", "query_drawing"),
    ("query_relation", "query_relation"), ("fetch_engineering_record", "fetch_engineering_record"),
])
def test_cad_remote_scope_and_operation_are_preserved(monkeypatch, name, operation):
    tools = ToolRegistry(cad_base_url="http://cad-test.invalid")
    calls = []

    def external_call(server, operation, arguments):
        calls.append((server, operation, arguments))
        return {"source": "document-cad-service", "components": []}

    monkeypatch.setattr(tools.mcp, "call", external_call)
    args = {"query": "主轴", "device_id": "D-1", "device_model": "TC820", "component_id": "SPINDLE", "part_no": "P-1"}
    assert tools.execute(name, args)["source"] == "document-cad-service"
    assert calls == [("cad", operation, args)]


def test_cad_local_relation_projections_and_lookup_priority():
    part = query_part_relation(part_no="CP-TC820-015", component_id="SPINDLE-ASSY", query="温度")
    assembly = query_assembly_relation(component_id="COOLING-PUMP", part_no="SP-ASSY-TC820-001", component="主轴")
    assert part["query"] == "CP-TC820-015"
    assert assembly["query"] == "COOLING-PUMP"
    assert part["relations"] == assembly["assembly_relations"]
    assert part["relations"][0]["part_no"] == "CP-TC820-015"
    assert part["source"] == "cad-relation-mcp-compatible"
    assert assembly["source"] == "assembly-mcp-compatible"


def test_registry_definitions_drive_handlers_and_schemas(monkeypatch):
    tools = ToolRegistry()
    definitions = getattr(tools, "definitions", None)
    assert definitions is not None, "缺少单一工具定义"
    schemas = {item["function"]["name"]: item["function"] for item in tools.tool_schemas()}
    assert len(definitions) == 66 and len(schemas) == 65
    assert set(definitions) == set(tools.mcp.handlers)
    assert "record_repair_verification_failed" not in schemas
    assert schemas["get_alarm_definition"]["parameters"] == {
        "type": "object", "properties": {"alarm_code": {"type": "string", "description": "报警代码"}},
        "required": ["alarm_code"], "additionalProperties": False,
    }
    definitions["query_stock"] = replace(definitions["query_stock"], description="定义中的说明", operation="query_inventory")
    assert next(item["function"]["description"] for item in tools.tool_schemas() if item["function"]["name"] == "query_stock") == "定义中的说明"
    calls = []
    monkeypatch.setattr(tools.mcp, "call", lambda server, operation, args: calls.append((server, operation)) or {"success": True})
    tools.execute("query_stock", {"query": "泵"})
    assert calls == [("inventory", "query_inventory")]


def test_alias_name_is_guarded_before_operation_resolution(monkeypatch):
    tools = ToolRegistry()
    calls = []
    monkeypatch.setattr(tools.mcp, "call", lambda *args: calls.append(args) or {})
    with pytest.raises(PermissionError, match="tool_not_allowed_for_step"):
        tools.execute("query_stock", {"query": "泵"}, context={"allowed_tools": ["query_inventory"]})
    assert calls == []
    with pytest.raises(PermissionError, match="tool_not_registered"):
        tools.execute("nonexistent", {})
    assert calls == []


def test_tool_errors_keep_request_name_and_task_identity(monkeypatch):
    trace = TraceRecorder()
    tools = ToolRegistry(trace=trace, cad_base_url="http://cad-test.invalid")

    def unavailable(*args):
        raise TimeoutError("外部查询超时")

    monkeypatch.setattr(tools.mcp, "call", unavailable)
    with pytest.raises(TimeoutError):
        tools.execute("query_part_relation", {"part_no": "P-1"}, context={"task_id": "T", "trace_id": "R"})
    rows = trace.list(task_id="T", trace_id="R")
    assert rows[-1]["event"] == "tool_error"
    assert rows[-1]["name"] == "query_part_relation"
    assert not any(row["event"] == "tool_completed" for row in rows)
