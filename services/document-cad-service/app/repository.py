"""CAD engineering repositories for demo and MySQL-backed operation."""

from __future__ import annotations

import json
import os
import re
from threading import Lock, RLock
from typing import Any, Mapping

from shared.local_drawings import device_reference_drawings, known_drawing_device, local_drawing_file


DEMO_CATALOG = [
    {"component_id": "SPINDLE-ASSY", "part_no": "SP-ASSY-TC820-001", "name": "主轴电机组件", "position": "Z轴上方主轴箱", "assembly_relation": "上级为主轴箱总成，下接主轴轴承、温度传感器与冷却回路", "drawing_ref": "DWG-TC820-SPINDLE-001", "quantity": 1, "material": "装配件"},
    {"component_id": "COOLING-PUMP", "part_no": "CP-TC820-015", "name": "冷却泵", "position": "机床后侧冷却单元", "assembly_relation": "向主轴冷却回路供液，连接冷却箱、过滤器和主轴夹套", "drawing_ref": "DWG-TC820-COOLING-002", "quantity": 1, "material": "外购件"},
    {"component_id": "TEMP-PT100", "part_no": "TS-PT100-008", "name": "主轴温度传感器", "position": "主轴电机壳体测温孔", "assembly_relation": "采集主轴温度，信号接入PLC模拟量模块", "drawing_ref": "DWG-TC820-SENSOR-003", "quantity": 1, "material": "传感器"},
    {"component_id": "VIB-SENSOR", "part_no": "VS-RMS-004", "name": "主轴振动传感器", "position": "主轴箱体右侧安装座", "assembly_relation": "采集主轴振动RMS，关联刀具、夹具和主轴轴承", "drawing_ref": "DWG-TC820-SENSOR-004", "quantity": 1, "material": "传感器"},
]


class CADRepositoryError(RuntimeError):
    pass


def validate_device_drawing_registration(record: Mapping[str, Any]) -> dict[str, Any]:
    """登记和命令行预核查使用同一套无数据库副作用的元数据校验。"""
    keys = ('drawing_id', 'version_id', 'device_id', 'device_model', 'drawing_name', 'filename', 'version_label', 'source_kind')
    value = {key: record.get(key, '') for key in keys}
    if any(not isinstance(item, str) for item in value.values()):
        raise CADRepositoryError('图纸登记字段必须是文本')
    value = {key: item.strip() for key, item in value.items()}
    if not all(value[key] for key in ('drawing_id', 'device_id', 'drawing_name', 'filename')) or local_drawing_file(value['filename']) is None:
        raise CADRepositoryError('图纸登记需要设备编号、图纸编号、名称及有效的本地 HTML 文件')
    known_device = known_drawing_device(value['filename'])
    if known_device and value['device_id'] != known_device:
        raise CADRepositoryError('已有图纸属于另一台设备，不能改作本设备的整机图纸')
    limits = {'drawing_id':128, 'version_id':128, 'device_id':128, 'device_model':128, 'drawing_name':255, 'filename':255, 'version_label':64, 'source_kind':64}
    if any(len(value[key]) > limit for key, limit in limits.items()) or not isinstance(record.get('current', True), bool):
        raise CADRepositoryError('图纸登记字段长度或当前版本标记无效')
    value['source_kind'] = value['source_kind'] or 'device_reference'
    return value | {'current':record.get('current', True)}


def _ci_fixture_enabled() -> bool:
    """夹具开关只能用于明确的测试环境，不能被演示回退吞掉。"""

    enabled = os.getenv("CAD_CI_FIXTURE", "").lower() in {"1", "true", "yes"}
    if enabled and os.getenv("APP_ENV", "development").lower() not in {"ci", "test", "testing"}:
        raise CADRepositoryError("CAD CI fixtures are restricted to test environments")
    return enabled


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
            candidates = [item for item in candidates if version in {str(item.get("version_id") or ""), str(item.get("version_label") or "")}]
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
        self._connection_lock = RLock()
        self.connection = None
        # 工程夹具只能写入测试数据库，必须在建立连接和执行 DDL 之前检查。
        _ci_fixture_enabled()
        try:
            import pymysql
        except ImportError as error:
            raise CADRepositoryError("CAD MySQL repository requires PyMySQL") from error
        try:
            self._driver = pymysql
            mysql_port = os.getenv("CAD_MYSQL_PORT") or os.getenv("MYSQL_PORT") or "3306"
            self._connection_options = dict(
                host=os.getenv("CAD_MYSQL_HOST") or os.getenv("MYSQL_HOST", "127.0.0.1"),
                port=int(mysql_port),
                user=os.getenv("CAD_MYSQL_USER") or os.getenv("MYSQL_USER", "root"),
                password=os.getenv("CAD_MYSQL_PASSWORD") or os.getenv("MYSQL_PASSWORD", ""),
                database=os.getenv("CAD_MYSQL_DATABASE") or os.getenv("MYSQL_DATABASE", "industry_agent"),
                charset="utf8mb4",
                connect_timeout=int(os.getenv("CAD_MYSQL_CONNECT_TIMEOUT", "5")),
                read_timeout=int(os.getenv("CAD_MYSQL_READ_TIMEOUT", "5")),
                write_timeout=int(os.getenv("CAD_MYSQL_WRITE_TIMEOUT", "5")),
                autocommit=True,
                cursorclass=pymysql.cursors.DictCursor,
            )
            self.connection = pymysql.connect(**self._connection_options)
            self._ensure_schema()
        except Exception as error:
            self.close()
            raise CADRepositoryError("CAD MySQL unavailable (%s)" % type(error).__name__) from error

    def close(self) -> None:
        """关闭仓库拥有的连接，供缓存失效与断线恢复使用。"""

        with self._connection_lock:
            connection, self.connection = self.connection, None
            if connection is not None:
                try:
                    connection.close()
                except Exception:
                    # 失效连接的关闭错误不能覆盖原查询错误或阻止下一次重连。
                    pass

    def _query(self, sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        """串行执行只读 SQL；明确的断线错误最多重试一次。"""

        with self._connection_lock:
            for attempt in range(2):
                try:
                    if self.connection is None:
                        self.connection = self._driver.connect(**self._connection_options)
                    else:
                        self.connection.ping(reconnect=False)
                    with self.connection.cursor() as cursor:
                        cursor.execute(sql, params)
                        return list(cursor.fetchall())
                except Exception as error:
                    disconnected = isinstance(error, (self._driver.err.InterfaceError, self._driver.err.OperationalError)) and bool(error.args) and error.args[0] in {0, 2003, 2006, 2013, 2014, 2055}
                    if disconnected:
                        self.close()
                        if attempt == 0:
                            continue
                    # 驱动错误可能包含数据库地址或凭据，HTTP 响应只保留错误类型。
                    raise CADRepositoryError("CAD metadata query failed (%s)" % type(error).__name__) from error
        raise CADRepositoryError("CAD metadata query unavailable")

    def _ensure_schema(self) -> None:
        """创建 CAD 自有的工程查询表，不依赖其他服务的迁移流程。"""
        statements = (
            "CREATE TABLE IF NOT EXISTS cad_device_drawings (drawing_id VARCHAR(128) NOT NULL, version_id VARCHAR(128) NOT NULL DEFAULT '', device_id VARCHAR(128) NOT NULL, device_model VARCHAR(128) NOT NULL DEFAULT '', drawing_name VARCHAR(255) NOT NULL, filename VARCHAR(255) NOT NULL, version_label VARCHAR(64) NOT NULL DEFAULT '', is_current TINYINT(1) NOT NULL DEFAULT 1, source_kind VARCHAR(64) NOT NULL DEFAULT 'device_reference', PRIMARY KEY (drawing_id, version_id), KEY idx_device_drawing (device_id, is_current))",
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
                except Exception as error:
                    # 已有数据库可能已经完成迁移；重复添加列可以安全忽略。
                    if not error.args or error.args[0] != 1060:
                        raise
            # CI 使用确定性的工程夹具，让跨服务闭环可以执行真实的 MySQL CAD 查询，而无需启用演示仓库。
            # 生产环境不会启用该夹具（开关默认关闭）。
            if _ci_fixture_enabled():
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
        # 只登记已存在的整机文件，不生成部件/BOM，不覆盖工程人员已维护的元数据。
        for reference in device_reference_drawings():
            self.register_device_drawing({**reference, 'filename': reference['drawing_url'].removeprefix('/drawings/')}, bootstrap=True)

    def register_device_drawing(self, record: Mapping[str, Any], *, bootstrap: bool = False) -> dict[str, Any]:
        """新增整机图纸版本。写操作不自动重试，已有版本不被覆盖。"""
        keys = ('drawing_id', 'version_id', 'device_id', 'device_model', 'drawing_name', 'filename', 'version_label', 'source_kind')
        value = validate_device_drawing_registration(record)
        params = tuple(value[key] for key in keys) + (int(value['current']),)
        with self._connection_lock:
            try:
                with self.connection.cursor() as cursor:
                    cursor.execute('INSERT IGNORE INTO cad_device_drawings (drawing_id, version_id, device_id, device_model, drawing_name, filename, version_label, source_kind, is_current) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)', params)
            except Exception as error:
                raise CADRepositoryError('图纸登记失败，写入状态需对账 (%s)' % type(error).__name__) from error
            if not bootstrap:
                rows = self._query('SELECT device_id, filename FROM cad_device_drawings WHERE drawing_id=%s AND version_id=%s', (value['drawing_id'], value['version_id']))
                if not rows or rows[0]['device_id'] != value['device_id'] or rows[0]['filename'] != value['filename']:
                    raise CADRepositoryError('图纸编号及版本已登记给其他设备或文件，未覆盖原记录')
        return value

    def search_device_drawings(self, *, device_id: str, device_model: str = '', drawing_id: str = '', version: str = '') -> list[dict[str, Any]]:
        """以设备为必需条件检索整机目录，与故障部件查询完全独立。"""
        filters = {'device_id':device_id, 'device_model':device_model, 'drawing_id':drawing_id, 'version':version}
        if any(not isinstance(value, str) for value in filters.values()) or not device_id.strip():
            return []
        clauses, params = ['device_id=%s'], [device_id.strip()]
        for key in ('device_model', 'drawing_id'):
            if filters[key].strip():
                clauses.append(key + '=%s')
                params.append(filters[key].strip())
        if version.strip():
            clauses.append('(version_id=%s OR version_label=%s)')
            params.extend([version.strip(), version.strip()])
        else:
            clauses.append('is_current=1')
        rows = self._query('SELECT * FROM cad_device_drawings WHERE ' + ' AND '.join(clauses) + ' ORDER BY drawing_id, version_id LIMIT %s', tuple(params) + (100,))
        result = []
        for row in rows:
            # 数据库排序规则可能不区分大小写；设备编号、机型、图号和版本仍须逐字一致。
            if any(filters[key].strip() and row.get(key) != filters[key].strip()
                   for key in ('device_id', 'device_model', 'drawing_id')):
                continue
            if version.strip() and version.strip() not in {row.get('version_id'), row.get('version_label')}:
                continue
            filename = row.get('filename', '')
            known_device = known_drawing_device(filename)
            if known_device and row.get('device_id') != known_device:
                raise CADRepositoryError('图纸目录中的已知文件设备归属不一致，未展示错配图纸')
            # 目录记录不能把失效文件、外链或目录外的符号链接伪装为可查看图纸。
            if local_drawing_file(filename) is None:
                continue
            result.append({key: row.get(key, '') for key in ('drawing_id','version_id','version_label','device_id','device_model','drawing_name','source_kind')}
                | {'current':bool(row['is_current']), 'drawing_url':'/drawings/' + filename,
                   'model_url':'/drawings/' + filename, 'source_format':'html', 'drawing_type':'html',
                   'evidence_scope':'device_reference', 'engineering_status':'reference_only', 'source':'mysql-device-drawings'})
        return result

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
            columns = ("e.entity_id", "e.block_name", "e.device_id", "e.text_content", "d.drawing_name", "e.drawing_id", "JSON_UNQUOTE(JSON_EXTRACT(e.raw_json, '$.part_no'))")
            if re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)+", needle.lower()):
                # 结构化标识符使用完整匹配，避免扩展编号或相似部件进入工程结果。
                clauses.append("(" + " OR ".join(f"LOWER({column}) = LOWER(%s)" for column in columns) + ")")
                params.extend([needle] * len(columns))
            else:
                clauses.append("(" + " OR ".join(f"{column} LIKE %s" for column in columns) + ")")
                params.extend(["%%%s%%" % needle] * len(columns))
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
        size = max(1, min(int(limit), 100))
        rows = self._query(sql, tuple(params) + (size,))
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
            rows = self._query(sql, tuple(ids) + tuple(ids))
        except CADRepositoryError as error:
            # 较旧的工程数据库可能还没有关系记录。部件查询仍可使用；在离线解析器填充前，只有关系子资源为空。
            cause = error.__cause__
            if cause is not None and cause.args and cause.args[0] == 1146:
                return {}
            raise
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
        rows = self._query("SELECT COUNT(*) AS total FROM cad_entities")
        row = rows[0] if rows else {}
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
            **{key: raw[key] for key in ('drawing_url', 'model_url', 'viewer_url', 'mesh_id', 'mesh_name',
                                        'default_view', 'drawing_type', 'evidence_scope', 'engineering_status',
                                        'source_kind', 'source_path') if key in raw},
        }


_repository: Any | None = None
_repository_key: tuple[str | None, ...] | None = None
_lock = Lock()


def get_repository() -> DemoCADRepository | MySQLCADRepository:
    global _repository, _repository_key
    key = tuple(os.getenv(name) for name in (
        "APP_ENV", "CAD_CI_FIXTURE", "CAD_ALLOW_DEMO_FALLBACK",
        "CAD_MYSQL_HOST", "CAD_MYSQL_PORT", "CAD_MYSQL_USER", "CAD_MYSQL_PASSWORD", "CAD_MYSQL_DATABASE",
        "CAD_MYSQL_CONNECT_TIMEOUT", "CAD_MYSQL_READ_TIMEOUT", "CAD_MYSQL_WRITE_TIMEOUT",
        "MYSQL_HOST", "MYSQL_PORT", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE",
    ))
    with _lock:
        if _repository is not None:
            if key == _repository_key and not (isinstance(_repository, MySQLCADRepository) and _repository.connection is None):
                return _repository
            if isinstance(_repository, MySQLCADRepository):
                _repository.close()
            _repository = None
            _repository_key = None
        _ci_fixture_enabled()
        configured = bool((os.getenv("CAD_MYSQL_HOST") or os.getenv("MYSQL_HOST") or "").strip())
        # 演示目录只允许在非生产环境显式开启，生产故障必须返回不可用。
        allow_demo = os.getenv("CAD_ALLOW_DEMO_FALLBACK", "").lower() in {"1", "true", "yes"} and os.getenv("APP_ENV", "development").lower() not in {"prod", "production"}
        if configured:
            try:
                _repository = MySQLCADRepository()
                _repository_key = key
                return _repository
            except CADRepositoryError:
                if not allow_demo:
                    raise
        if not allow_demo:
            raise CADRepositoryError("CAD MySQL is required when demo fallback is disabled")
        _repository = DemoCADRepository()
        _repository_key = key
        return _repository


def reset_repository() -> None:
    global _repository, _repository_key
    with _lock:
        if isinstance(_repository, MySQLCADRepository):
            _repository.close()
        _repository = None
        _repository_key = None


__all__ = ["CADRepositoryError", "DemoCADRepository", "MySQLCADRepository", "get_repository", "reset_repository"]
