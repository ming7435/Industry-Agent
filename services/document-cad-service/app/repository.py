"""CAD engineering repositories for demo and MySQL-backed operation."""

from __future__ import annotations

import json
import os
from threading import Lock
from typing import Any, Mapping


DEMO_CATALOG = [
    {"component_id": "SPINDLE-ASSY", "part_no": "SP-ASSY-TC820-001", "name": "主轴电机组件", "position": "Z轴上方主轴箱", "assembly_relation": "上级为主轴箱总成，下接主轴轴承、温度传感器与冷却回路", "drawing_ref": "DWG-TC820-SPINDLE-001", "quantity": 1, "material": "装配件"},
    {"component_id": "COOLING-PUMP", "part_no": "CP-TC820-015", "name": "冷却泵", "position": "机床后侧冷却单元", "assembly_relation": "向主轴冷却回路供液，连接冷却箱、过滤器和主轴夹套", "drawing_ref": "DWG-TC820-COOLING-002", "quantity": 1, "material": "外购件"},
    {"component_id": "TEMP-PT100", "part_no": "TS-PT100-008", "name": "主轴温度传感器", "position": "主轴电机壳体测温孔", "assembly_relation": "采集主轴温度，信号接入PLC模拟量模块", "drawing_ref": "DWG-TC820-SENSOR-003", "quantity": 1, "material": "传感器"},
    {"component_id": "VIB-SENSOR", "part_no": "VS-RMS-004", "name": "主轴振动传感器", "position": "主轴箱体右侧安装座", "assembly_relation": "采集主轴振动RMS，关联刀具、夹具和主轴轴承", "drawing_ref": "DWG-TC820-SENSOR-004", "quantity": 1, "material": "传感器"},
]


class CADRepositoryError(RuntimeError):
    pass


class DemoCADRepository:
    backend = "demo-catalog"

    def __init__(self, items: list[Mapping[str, Any]] | None = None) -> None:
        self.items = [dict(item) for item in (items or DEMO_CATALOG)]

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        text = str(query or "").lower().strip()
        if not text:
            return [dict(item) for item in self.items[: min(limit, 2)]]
        exact = []
        fuzzy = []
        for item in self.items:
            values = [str(item.get(key) or "").lower() for key in ("component_id", "part_no", "name", "position", "drawing_ref")]
            if text in values:
                exact.append(dict(item))
            elif any(token and any(token in value for value in values) for token in text.replace("/", " ").replace("-", " ").split()):
                fuzzy.append(dict(item))
        return (exact or fuzzy)[:limit]

    def count(self) -> int:
        return len(self.items)


class MySQLCADRepository:
    backend = "mysql-engineering-metadata"

    def __init__(self) -> None:
        try:
            import pymysql
        except ImportError as error:
            raise CADRepositoryError("CAD MySQL repository requires PyMySQL") from error
        try:
            mysql_port = os.getenv("CAD_MYSQL_PORT") or os.getenv("MYSQL_PORT") or "3306"
            self.connection = pymysql.connect(
                host=os.getenv("CAD_MYSQL_HOST") or os.getenv("MYSQL_HOST", "127.0.0.1"),
                port=int(mysql_port),
                user=os.getenv("CAD_MYSQL_USER") or os.getenv("MYSQL_USER", "root"),
                password=os.getenv("CAD_MYSQL_PASSWORD") or os.getenv("MYSQL_PASSWORD", ""),
                database=os.getenv("CAD_MYSQL_DATABASE") or os.getenv("MYSQL_DATABASE", "industry_agent"),
                charset="utf8mb4",
                connect_timeout=int(os.getenv("CAD_MYSQL_CONNECT_TIMEOUT", "5")),
                cursorclass=pymysql.cursors.DictCursor,
            )
        except Exception as error:
            raise CADRepositoryError("CAD MySQL unavailable: %s" % error) from error

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        needle = str(query or "").strip()
        text = "%%%s%%" % needle
        select = (
            "SELECT e.entity_id, e.entity_type, e.layer_name, e.block_name, e.device_id, e.text_content, "
            "e.raw_json, e.drawing_id, d.drawing_name "
            "FROM cad_entities e JOIN cad_drawings d ON d.drawing_id=e.drawing_id "
        )
        sql = select + (
            "WHERE e.entity_id LIKE %s OR e.block_name LIKE %s OR e.device_id LIKE %s "
            "OR e.text_content LIKE %s OR d.drawing_name LIKE %s LIMIT %s"
            if needle else "LIMIT %s"
        )
        try:
            with self.connection.cursor() as cursor:
                size = max(1, min(int(limit), 100))
                cursor.execute(sql, (text, text, text, text, text, size) if needle else (size,))
                rows = cursor.fetchall()
        except Exception as error:
            raise CADRepositoryError("CAD metadata query failed: %s" % error) from error
        values = [self._normalize(row) for row in rows]
        relations = self._relations_for_many([value["component_id"] for value in values])
        for value in values:
            value["part_relations"] = relations.get(value["component_id"], [])
        return values

    def _relations_for(self, component_id: str) -> list[dict[str, Any]]:
        """Load persisted CAD entity relations when the parser populated them."""

        return self._relations_for_many([component_id]).get(str(component_id), [])

    def _relations_for_many(self, component_ids: list[str]) -> dict[str, list[dict[str, Any]]]:
        """Load relations in one query and keep them scoped to the result set."""

        ids = list(dict.fromkeys(str(item) for item in component_ids if str(item)))
        if not ids:
            return {}
        placeholders = ",".join(["%s"] * len(ids))
        sql = (
            "SELECT source_entity_id, target_entity_id, relation_type, evidence_text, metadata_json "
            f"FROM cad_entity_relations WHERE source_entity_id IN ({placeholders}) "
            f"OR target_entity_id IN ({placeholders})"
        )

        try:
            with self.connection.cursor() as cursor:
                cursor.execute(sql, tuple(ids) + tuple(ids))
                rows = cursor.fetchall()
        except Exception as error:
            # Older engineering databases may not have relation rows yet. The
            # component query remains usable; only the relation sub-resource is
            # empty until the offline parser populates it.
            if "doesn't exist" in str(error).lower() or "unknown table" in str(error).lower():
                return {}
            raise CADRepositoryError("CAD relation query failed: %s" % error) from error
        values: dict[str, list[dict[str, Any]]] = {item: [] for item in ids}
        for row in rows:
            metadata = row.get("metadata_json") or {}
            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except ValueError:
                    metadata = {}
            source = str(row.get("source_entity_id") or "")
            target = str(row.get("target_entity_id") or "")
            relation = {
                "component_id": source or target,
                "part_no": target,
                "relation": str(row.get("relation_type") or ""),
                "assembly_relation": str(row.get("relation_type") or ""),
                "location": str(row.get("evidence_text") or ""),
                "source_entity_id": source,
                "target_entity_id": target,
                "relation_type": str(row.get("relation_type") or ""),
                "evidence_text": str(row.get("evidence_text") or ""),
                "metadata": dict(metadata) if isinstance(metadata, Mapping) else {},
            }
            if source in values:
                values[source].append(relation)
            if target in values and target != source:
                values[target].append(relation)
        return values

    def count(self) -> int:
        with self.connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) AS total FROM cad_entities")
            row = cursor.fetchone() or {}
        return int(row.get("total") or 0)

    @staticmethod
    def _normalize(row: Mapping[str, Any]) -> dict[str, Any]:
        raw = row.get("raw_json") or {}
        if isinstance(raw, str):
            try:
                raw = json.loads(raw)
            except ValueError:
                raw = {}
        raw = dict(raw) if isinstance(raw, Mapping) else {}
        component_id = str(row.get("entity_id") or raw.get("component_id") or "")
        return {
            "component_id": component_id,
            "part_no": str(raw.get("part_no") or row.get("block_name") or component_id),
            "name": str(raw.get("name") or row.get("text_content") or row.get("block_name") or row.get("entity_type") or component_id),
            "position": str(raw.get("position") or row.get("layer_name") or ""),
            "assembly_relation": str(raw.get("assembly_relation") or "工程关系见 cad_entity_relations"),
            "drawing_ref": str(row.get("drawing_id") or ""),
            "drawing_name": str(row.get("drawing_name") or ""),
            "quantity": int(raw.get("quantity") or 1),
            "material": str(raw.get("material") or ""),
            "device_id": str(row.get("device_id") or ""),
            "bom_items": list(raw.get("bom_items") or []),
            "part_relations": list(raw.get("part_relations") or []),
        }


_repository: Any | None = None
_lock = Lock()


def get_repository() -> DemoCADRepository | MySQLCADRepository:
    global _repository
    if _repository is not None:
        return _repository
    with _lock:
        if _repository is not None:
            return _repository
        configured = bool((os.getenv("CAD_MYSQL_HOST") or os.getenv("MYSQL_HOST") or "").strip())
        allow_demo = os.getenv("CAD_ALLOW_DEMO_FALLBACK", "").lower() in {"1", "true", "yes"}
        if not os.getenv("CAD_ALLOW_DEMO_FALLBACK"):
            allow_demo = os.getenv("APP_ENV", "development").lower() not in {"prod", "production"}
        if configured:
            try:
                _repository = MySQLCADRepository()
                return _repository
            except CADRepositoryError:
                if not allow_demo:
                    raise
        if not allow_demo:
            raise CADRepositoryError("CAD MySQL is required when demo fallback is disabled")
        _repository = DemoCADRepository()
        return _repository


def reset_repository() -> None:
    global _repository
    with _lock:
        _repository = None


__all__ = ["CADRepositoryError", "DemoCADRepository", "MySQLCADRepository", "get_repository", "reset_repository"]
