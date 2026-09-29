"""CAD engineering repositories for demo and MySQL-backed operation."""

from __future__ import annotations

import json
import os
import re
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

    def search(self, query: str = "", limit: int = 20, filters: Mapping[str, Any] | None = None) -> list[dict[str, Any]]:
        filters = dict(filters or {})
        candidates = [dict(item) for item in self.items]
        # 结构化条件必须在截断前应用，避免目标设备被前 20 条无关记录遮住。
        for key in ("device_id", "tenant_id", "project_id", "component_id"):
            expected = str(filters.get(key) or "").strip()
            if expected:
                candidates = [item for item in candidates if str(item.get(key) or "") == expected]
        drawing_id = str(filters.get("drawing_id") or "").strip()
        if drawing_id:
            candidates = [item for item in candidates if str(item.get("drawing_id") or item.get("drawing_ref") or "") == drawing_id]
        part_no = str(filters.get("part_no") or "").strip()
        if part_no:
            candidates = [item for item in candidates if str(item.get("part_no") or (item.get("raw_json") or {}).get("part_no") or "") == part_no]
        device_model = str(filters.get("device_model") or "").strip()
        if device_model:
            candidates = [item for item in candidates if str(item.get("device_model") or "") == device_model]
        version = str(filters.get("version") or "").strip()
        if version:
            candidates = [item for item in candidates if str(item.get("version_id") or item.get("version_label") or "") == version]
        elif not filters.get("include_history"):
            candidates = [item for item in candidates if item.get("current", True) is True]
        text = str(query or "").lower().strip()
        if not text:
            return candidates[: min(limit, 2)]
        exact = []
        fuzzy = []
        for item in candidates:
            values = [str(item.get(key) or "").lower() for key in ("component_id", "part_no", "name", "position", "drawing_ref", "drawing_id")]
            if text in values:
                exact.append(dict(item))
            elif any(token and any(token in value for value in values) for token in text.replace("/", " ").replace("-", " ").split()):
                fuzzy.append(dict(item))
            # 结构化部件/零件标识绝不能降级为部分词元匹配：LUBRICATION-PUMP 不是 COOLING-PUMP。
        if re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)+", text):
            return exact[:limit]
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
            self._ensure_schema()
        except Exception as error:
            raise CADRepositoryError("CAD MySQL unavailable: %s" % error) from error

    def _ensure_schema(self) -> None:
        """Create the small engineering read schema when migrations are absent.

        CAD owns these tables; it must not depend on the Agent or RAG migration
        process merely to answer a health probe or an engineering lookup.
        """
        statements = (
            "CREATE TABLE IF NOT EXISTS cad_drawings (drawing_id VARCHAR(128) PRIMARY KEY, drawing_name VARCHAR(255) NOT NULL DEFAULT '', version_id VARCHAR(128) NOT NULL DEFAULT '', version_label VARCHAR(64) NOT NULL DEFAULT '', is_current TINYINT(1) NOT NULL DEFAULT 1, source_format VARCHAR(32) NOT NULL DEFAULT '', object_ref VARCHAR(512) NOT NULL DEFAULT '')",
            "CREATE TABLE IF NOT EXISTS cad_entities (entity_id VARCHAR(160) PRIMARY KEY, entity_type VARCHAR(64) NOT NULL DEFAULT '', layer_name VARCHAR(255) NOT NULL DEFAULT '', block_name VARCHAR(255) NOT NULL DEFAULT '', device_id VARCHAR(128) NOT NULL DEFAULT '', text_content TEXT, raw_json JSON NOT NULL, drawing_id VARCHAR(128) NOT NULL DEFAULT '')",
            "CREATE TABLE IF NOT EXISTS cad_entity_relations (source_entity_id VARCHAR(160) NOT NULL, target_entity_id VARCHAR(160) NOT NULL, relation_type VARCHAR(128) NOT NULL DEFAULT '', evidence_text TEXT, metadata_json JSON, KEY idx_cad_rel_source (source_entity_id), KEY idx_cad_rel_target (target_entity_id))",
        )
        with self.connection.cursor() as cursor:
            for statement in statements:
                cursor.execute(statement)
            for statement in (
                "ALTER TABLE cad_drawings ADD COLUMN version_id VARCHAR(128) NOT NULL DEFAULT ''",
                "ALTER TABLE cad_drawings ADD COLUMN version_label VARCHAR(64) NOT NULL DEFAULT ''",
                "ALTER TABLE cad_drawings ADD COLUMN is_current TINYINT(1) NOT NULL DEFAULT 1",
                "ALTER TABLE cad_drawings ADD COLUMN source_format VARCHAR(32) NOT NULL DEFAULT ''",
                "ALTER TABLE cad_drawings ADD COLUMN object_ref VARCHAR(512) NOT NULL DEFAULT ''",
            ):
                try:
                    cursor.execute(statement)
                except Exception:
                    # 已有数据库可能已经完成迁移；重复添加列可以安全忽略。
                    pass
            # CI 使用确定性的工程夹具，让跨服务闭环可以执行真实的 MySQL CAD 查询，而无需启用演示仓库。
            # 生产环境不会启用该夹具（开关默认关闭）。
            if os.getenv("CAD_CI_FIXTURE", "").lower() in {"1", "true", "yes"}:
                cursor.execute(
                    "INSERT IGNORE INTO cad_drawings (drawing_id, drawing_name) VALUES (%s, %s)",
                    ("DWG-CI-SPINDLE-001", "TC820 主轴总成工程图"),
                )
                cursor.execute(
                    "INSERT IGNORE INTO cad_entities "
                    "(entity_id, entity_type, layer_name, block_name, device_id, text_content, raw_json, drawing_id) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    (
                        "SPINDLE-ASSY",
                        "component",
                        "ASSEMBLY",
                        "SPINDLE-ASSY",
                        "TC820-001",
                        "主轴电机组件",
                        json.dumps(
                            {
                                "component_id": "SPINDLE-ASSY",
                                "part_no": "SP-ASSY-TC820-001",
                                "name": "主轴电机组件",
                                "position": "Z轴上方主轴箱",
                                "assembly_relation": "上级为主轴箱总成，下接主轴轴承与温度传感器",
                                "quantity": 1,
                                "material": "装配件",
                                "bom_items": ["主轴轴承", "温度传感器"],
                            },
                            ensure_ascii=False,
                        ),
                        "DWG-CI-SPINDLE-001",
                    ),
                )
        self.connection.commit()

    def search(self, query: str = "", limit: int = 20, filters: Mapping[str, Any] | None = None) -> list[dict[str, Any]]:
        needle = str(query or "").strip()
        select = (
            "SELECT e.entity_id, e.entity_type, e.layer_name, e.block_name, e.device_id, e.text_content, "
            "e.raw_json, e.drawing_id, d.drawing_name, d.version_id, d.version_label, d.is_current, d.source_format, d.object_ref "
            "FROM cad_entities e JOIN cad_drawings d ON d.drawing_id=e.drawing_id "
        )
        filters = dict(filters or {})
        clauses: list[str] = []
        params: list[Any] = []
        if needle:
            text = "%%%s%%" % needle
            clauses.append("(e.entity_id LIKE %s OR e.block_name LIKE %s OR e.device_id LIKE %s OR e.text_content LIKE %s OR d.drawing_name LIKE %s OR JSON_UNQUOTE(JSON_EXTRACT(e.raw_json, '$.part_no')) LIKE %s)")
            params.extend([text] * 6)
        exact_columns = {
            "device_id": "e.device_id",
            "component_id": "e.entity_id",
            "drawing_id": "e.drawing_id",
        }
        for key, column in exact_columns.items():
            value = str(filters.get(key) or "").strip()
            if value:
                clauses.append(f"{column} = %s")
                params.append(value)
        for key, expression in (("device_model", "JSON_UNQUOTE(JSON_EXTRACT(e.raw_json, '$.device_model'))"), ("tenant_id", "JSON_UNQUOTE(JSON_EXTRACT(e.raw_json, '$.tenant_id'))"), ("project_id", "JSON_UNQUOTE(JSON_EXTRACT(e.raw_json, '$.project_id'))"), ("part_no", "JSON_UNQUOTE(JSON_EXTRACT(e.raw_json, '$.part_no'))")):
            value = str(filters.get(key) or "").strip()
            if value:
                clauses.append(f"{expression} = %s")
                params.append(value)
        version = str(filters.get("version") or "").strip()
        if version:
            clauses.append("(d.version_id = %s OR d.version_label = %s)")
            params.extend([version, version])
        elif not filters.get("include_history"):
            clauses.append("d.is_current = 1")
        sql = select
        if clauses:
            sql += "WHERE " + " AND ".join(clauses) + " "
        sql += "LIMIT %s"
        try:
            with self.connection.cursor() as cursor:
                size = max(1, min(int(limit), 100))
                cursor.execute(sql, tuple(params) + (size,))
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
            # 较旧的工程数据库可能还没有关系记录。部件查询仍可使用；在离线解析器填充前，只有关系子资源为空。
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
            "part_no": str(raw.get("part_no") or ""),
            "part_identity_status": "validated" if raw.get("part_no") else "unknown",
            "name": str(raw.get("name") or row.get("text_content") or row.get("block_name") or row.get("entity_type") or component_id),
            "position": str(raw.get("position") or ""),
            "cad_layer": str(row.get("layer_name") or ""),
            "installation_location": str(raw.get("position") or ""),
            "assembly_relation": str(raw.get("assembly_relation") or ""),
            "drawing_ref": str(row.get("drawing_id") or ""),
            "drawing_id": str(row.get("drawing_id") or ""),
            "drawing_name": str(row.get("drawing_name") or ""),
            "version_id": str(row.get("version_id") or ""),
            "version_label": str(row.get("version_label") or ""),
            "current": bool(row.get("is_current", True)),
            "source_format": str(row.get("source_format") or "unknown"),
            "object_ref": str(row.get("object_ref") or ""),
            "quantity": int(raw.get("quantity") or 1),
            "material": str(raw.get("material") or ""),
            "device_id": str(row.get("device_id") or ""),
            "device_model": str(raw.get("device_model") or row.get("device_model") or ""),
            "tenant_id": str(raw.get("tenant_id") or row.get("tenant_id") or ""),
            "project_id": str(raw.get("project_id") or row.get("project_id") or ""),
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
        # 演示目录只能显式开启；开发环境默认也不能把示例部件冒充真实工程数据。
        allow_demo = os.getenv("CAD_ALLOW_DEMO_FALLBACK", "").lower() in {"1", "true", "yes"}
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
