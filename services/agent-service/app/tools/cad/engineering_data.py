"""CAD 工具共享的本地工程演示数据。"""

from __future__ import annotations

from typing import Any, Dict, Mapping


def engineering_components() -> list[Dict[str, Any]]:
    return [
        {"component_id": "SPINDLE-ASSY", "part_no": "SP-ASSY-TC820-001", "name": "主轴电机组件", "position": "Z轴上方主轴箱", "assembly_relation": "上级为主轴箱总成，下接主轴轴承、温度传感器与冷却回路", "drawing_ref": "DWG-TC820-SPINDLE-001", "quantity": 1, "material": "装配件"},
        {"component_id": "COOLING-PUMP", "part_no": "CP-TC820-015", "name": "冷却泵", "position": "机床后侧冷却单元", "assembly_relation": "向主轴冷却回路供液，连接冷却箱、过滤器和主轴夹套", "drawing_ref": "DWG-TC820-COOLING-002", "quantity": 1, "material": "外购件"},
        {"component_id": "TEMP-PT100", "part_no": "TS-PT100-008", "name": "主轴温度传感器", "position": "主轴电机壳体测温孔", "assembly_relation": "采集主轴温度，信号接入PLC模拟量模块", "drawing_ref": "DWG-TC820-SENSOR-003", "quantity": 1, "material": "传感器"},
        {"component_id": "VIB-SENSOR", "part_no": "VS-RMS-004", "name": "主轴振动传感器", "position": "主轴箱体右侧安装座", "assembly_relation": "采集主轴振动RMS，关联刀具、夹具和主轴轴承", "drawing_ref": "DWG-TC820-SENSOR-004", "quantity": 1, "material": "传感器"},
    ]


def match_components(query: str, components: list[Dict[str, Any]] | None = None) -> list[Dict[str, Any]]:
    values = components or engineering_components()
    text = str(query or "").lower().strip()
    if not text:
        return values[:2]
    for item in values:
        exact_values = (item.get("component_id"), item.get("part_no"), item.get("name"), item.get("drawing_ref"))
        if text in {str(value or "").lower().strip() for value in exact_values}:
            return [dict(item)]
    aliases = {
        "温度": ("TEMP-PT100", "SPINDLE-ASSY", "COOLING-PUMP"),
        "过热": ("TEMP-PT100", "SPINDLE-ASSY", "COOLING-PUMP"),
        "冷却": ("COOLING-PUMP", "SPINDLE-ASSY"),
        "主轴": ("SPINDLE-ASSY", "TEMP-PT100", "VIB-SENSOR", "COOLING-PUMP"),
        "振动": ("VIB-SENSOR", "SPINDLE-ASSY"),
    }
    ids: list[str] = []
    for token, component_ids in aliases.items():
        if token.lower() in text:
            ids.extend(component_id for component_id in component_ids if component_id not in ids)
    for item in values:
        haystack = " ".join(str(item.get(key, "")) for key in ("component_id", "part_no", "name", "position", "drawing_ref")).lower()
        if any(term and term in haystack for term in text.replace("/", " ").replace("-", " ").split()):
            if item["component_id"] not in ids:
                ids.append(item["component_id"])
        elif text in haystack and item["component_id"] not in ids:
            ids.append(item["component_id"])
    by_id = {item["component_id"]: item for item in values}
    return [dict(by_id[component_id]) for component_id in ids if component_id in by_id]


def bom_for(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"component_id": item.get("component_id", ""), "part_no": item.get("part_no", ""), "name": item.get("name", ""), "quantity": item.get("quantity", 1), "material": item.get("material", ""), "drawing_ref": item.get("drawing_ref", "")}


def drawing_for(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"drawing_id": item.get("drawing_ref", ""), "component_id": item.get("component_id", ""), "title": "%s 工程图" % item.get("name", "部件"), "format": "DXF/DWG-compatible", "sheet": "A3", "source": "document-cad-service-demo"}


def relation_for(item: Mapping[str, Any]) -> Dict[str, Any]:
    return {"component_id": item.get("component_id", ""), "part_no": item.get("part_no", ""), "relation": item.get("assembly_relation", ""), "location": item.get("position", ""), "drawing_ref": item.get("drawing_ref", "")}
