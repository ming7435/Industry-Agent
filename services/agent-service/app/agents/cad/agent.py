"""CAD/BOM 工程数据分析 Agent。"""

from __future__ import annotations

from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.validator import CADComponent, CADResult


class CADAgent:
    name = "cad"

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()

    def query_component(self, query: str, device_id: str = "") -> CADResult:
        query = str(query or "").strip() or "主轴组件"
        raw = self.tools.execute("query_cad", {"query": query, "device_id": device_id})
        bom = self.tools.execute("query_bom", {"query": query, "device_id": device_id})
        drawings = self.tools.execute("get_drawing_metadata", {"query": query})
        relations = self.tools.execute("query_assembly_relation", {"query": query})
        locations = self.tools.execute("get_component_location", {"query": query})

        components = self._components(raw.get("components", []))
        bom_items = list(bom.get("bom_items") or [])
        drawing_items = self._merge_by_key(list(raw.get("drawings") or []) + list(drawings.get("drawings") or []), "drawing_id")
        relation_items = self._merge_by_key(list(relations.get("assembly_relations") or []), "component_id")
        evidence = self._evidence(components, bom_items, drawing_items, relation_items, locations.get("locations", []))
        status = "completed" if components or bom_items or drawing_items else "insufficient_engineering_data"
        return CADResult(
            query=query,
            status=status,
            query_type=self._query_type(query),
            summary=self._summary(query, components, drawing_items, status),
            components=components,
            drawings=drawing_items,
            bom_items=bom_items,
            assembly_relations=relation_items,
            evidence=evidence,
            sources=self._sources(raw, bom, drawings, relations, locations),
            confidence=self._confidence(components, drawing_items, relation_items),
            total=len(components),
            source=raw.get("source", "cad-mcp-compatible"),
        )

    def query_bom(self, query: str, device_id: str = "") -> CADResult:
        return self.query_component(query, device_id)

    def run(self, task: Any) -> CADResult:
        payload = {"query": task} if isinstance(task, str) else dict(task or {})
        return self.query_component(
            str(payload.get("query") or payload.get("fault") or "主轴组件"),
            str(payload.get("device_id") or ""),
        )

    @staticmethod
    def _query_type(query: str) -> str:
        lowered = query.lower()
        if any(token in lowered for token in ("bom", "物料", "零件", "part")):
            return "bom"
        if any(token in lowered for token in ("位置", "在哪里", "location")):
            return "location"
        if any(token in lowered for token in ("装配", "关系", "relation")):
            return "assembly_relation"
        return "component"

    @staticmethod
    def _components(items: list[Mapping[str, Any]]) -> list[CADComponent]:
        best: dict[str, Mapping[str, Any]] = {}
        for item in items:
            key = str(item.get("component_id") or item.get("part_no") or item.get("name") or "")
            if key and key not in best:
                best[key] = item
        return [CADComponent(**item) for item in best.values()]

    @staticmethod
    def _merge_by_key(items: list[Mapping[str, Any]], key: str) -> list[dict[str, Any]]:
        merged: dict[str, dict[str, Any]] = {}
        for item in items:
            value = str(item.get(key) or item.get("component_id") or item.get("part_no") or item.get("title") or "")
            if value and value not in merged:
                merged[value] = dict(item)
        return list(merged.values())

    @staticmethod
    def _evidence(
        components: list[CADComponent],
        bom_items: list[Mapping[str, Any]],
        drawings: list[Mapping[str, Any]],
        relations: list[Mapping[str, Any]],
        locations: list[Mapping[str, Any]],
    ) -> list[dict[str, Any]]:
        evidence: list[dict[str, Any]] = []
        for item in components:
            evidence.append({
                "type": "component",
                "component_id": item.component_id,
                "part_no": item.part_no,
                "name": item.name,
                "position": item.position,
                "drawing_ref": item.drawing_ref,
            })
        for item in bom_items:
            evidence.append({"type": "bom", **dict(item)})
        for item in drawings:
            evidence.append({"type": "drawing", **dict(item)})
        for item in relations:
            evidence.append({"type": "assembly_relation", **dict(item)})
        for item in locations:
            evidence.append({"type": "location", **dict(item)})
        return evidence

    @staticmethod
    def _summary(query: str, components: list[CADComponent], drawings: list[Mapping[str, Any]], status: str) -> str:
        if status != "completed":
            return "未查询到与“%s”直接相关的 CAD/BOM 工程数据。" % query
        names = "、".join(item.name for item in components[:4])
        return "定位到 %s 个工程部件、%s 份图纸引用：%s。" % (len(components), len(drawings), names)

    @staticmethod
    def _sources(*payloads: Mapping[str, Any]) -> list[str]:
        sources: list[str] = []
        for payload in payloads:
            source = str(payload.get("source") or "")
            if source and source not in sources:
                sources.append(source)
        return sources

    @staticmethod
    def _confidence(components: list[CADComponent], drawings: list[Mapping[str, Any]], relations: list[Mapping[str, Any]]) -> float:
        if not components:
            return 0.0
        value = 0.65
        if drawings:
            value += 0.15
        if relations:
            value += 0.1
        if all(item.part_no for item in components):
            value += 0.05
        return round(min(1.0, value), 4)
