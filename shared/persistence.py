"""在线 MySQL JSON 持久化：短事务、原子认领和轻量维修方案投影。"""
from contextlib import contextmanager
from hashlib import sha256
import json
import os
from time import monotonic, sleep
import zlib


class StorageUnavailable(RuntimeError):
    """对外不包含地址、账户和凭据的存储错误。"""


class PendingResultError(RuntimeError):
    def __init__(self, status):
        self.status = status
        super().__init__("操作处理结果未知，需要人工对账" if status == "uncertain" else "同一操作仍在处理中")


def mysql_configuration():
    if any(not os.getenv(name, "").strip() for name in ("MYSQL_HOST", "MYSQL_USER", "MYSQL_DATABASE")):
        raise StorageUnavailable("在线 MySQL 存储要求配置 MYSQL_HOST、MYSQL_USER 和 MYSQL_DATABASE，禁止回退 SQLite")
    return {
        "host": os.getenv("MYSQL_HOST", "127.0.0.1"),
        "port": int(os.getenv("MYSQL_PORT", "3306")),
        "user": os.getenv("MYSQL_USER", "industry"),
        "password": os.getenv("MYSQL_PASSWORD", os.getenv("MYSQL_APP_PASSWORD", "")),
        "database": os.getenv("MYSQL_DATABASE", "industry_agent"),
        "connection_timeout": 5,
    }


@contextmanager
def mysql_session(config=None):
    """每个操作独立连接；调用者不得把远程请求放入该事务。"""
    import mysql.connector
    connection = None
    try:
        connection = mysql.connector.connect(**dict(config or mysql_configuration()), autocommit=False)
        yield connection
        connection.commit()
    except mysql.connector.Error as error:
        if connection is not None:
            try:
                connection.rollback()
            except mysql.connector.Error:
                pass  # 断连后的清理错误不能覆盖原始脱敏错误，更不能触发重写。
        code = f"（错误码 {error.errno}）" if isinstance(error.errno, int) else ""
        raise StorageUnavailable("MySQL 存储不可用，请检查本地连接和权限" + code) from None
    except BaseException:
        if connection is not None:
            try:
                connection.rollback()
            except mysql.connector.Error:
                pass
        raise
    finally:
        if connection is not None:
            try:
                connection.close()
            except mysql.connector.Error:
                pass


def _encode(value):
    # 旧记录的单个上下文也可能达数百 MB，标准 iterencode 仍会复制整个字符串。
    compressor = zlib.compressobj()
    parts = []
    buffer, characters = [], 0
    for chunk in _json_tokens(dict(value)):
        buffer.append(chunk)
        characters += len(chunk)
        if characters >= 65536:
            compressed = compressor.compress("".join(buffer).encode("utf-8"))
            if compressed:
                parts.append(compressed)
            buffer, characters = [], 0
    if buffer:
        parts.append(compressor.compress("".join(buffer).encode("utf-8")))
    parts.append(compressor.flush())
    return b"".join(parts)


def _json_tokens(value, markers=None, encoder=None):
    """保持标准 JSON 语义，对字符串分段转义，限制编码额外内存。"""
    markers = set() if markers is None else markers
    encoder = encoder or json.JSONEncoder(ensure_ascii=False, default=str)
    if isinstance(value, str):
        yield '"'
        for start in range(0, len(value), 65536):
            yield encoder.encode(value[start:start + 65536])[1:-1]
        yield '"'
    elif isinstance(value, (dict, list, tuple)):
        identity = id(value)
        if identity in markers:
            raise ValueError("Circular reference detected")
        markers.add(identity)
        try:
            mapping = isinstance(value, dict)
            yield "{" if mapping else "["
            for index, item in enumerate(value.items() if mapping else value):
                if index:
                    yield ", "
                if mapping:
                    key, item = item
                    if not isinstance(key, str):
                        if key is None or isinstance(key, (int, float, bool)):
                            key = encoder.encode(key)
                        else:
                            raise TypeError("JSON 对象键必须为字符串或数字")
                    yield from _json_tokens(key, markers, encoder)
                    yield ": "
                yield from _json_tokens(item, markers, encoder)
            yield "}" if mapping else "]"
        finally:
            markers.remove(identity)
    elif value is None or isinstance(value, (bool, int, float)):
        yield encoder.encode(value)
    else:
        yield from _json_tokens(str(value), markers, encoder)


def _decode(payload):
    return json.loads(zlib.decompress(bytes(payload)).decode("utf-8"))


class MySQLJsonStore:
    def __init__(self, config=None):
        self._config = dict(config or mysql_configuration())
        with self._session() as cursor:
            cursor.execute("CREATE TABLE IF NOT EXISTS runtime_records_mysql (namespace VARCHAR(64) NOT NULL, key_hash CHAR(64) NOT NULL, state_key TEXT NOT NULL, payload LONGBLOB NOT NULL, updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY(namespace,key_hash)) ENGINE=InnoDB")
            cursor.execute("CREATE TABLE IF NOT EXISTS runtime_claims_mysql (namespace VARCHAR(64) NOT NULL, key_hash CHAR(64) NOT NULL, state_key TEXT NOT NULL, status VARCHAR(16) NOT NULL, created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY(namespace,key_hash)) ENGINE=InnoDB")
            cursor.execute("CREATE TABLE IF NOT EXISTS maintenance_plan_projection (event_key_hash CHAR(64) PRIMARY KEY, plan_id VARCHAR(128) NOT NULL, payload LONGBLOB NOT NULL, updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX(plan_id)) ENGINE=InnoDB")
            cursor.execute("CREATE TABLE IF NOT EXISTS maintenance_plan_deletions (plan_id VARCHAR(128) PRIMARY KEY, actor_id VARCHAR(128) NOT NULL, deleted_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)) ENGINE=InnoDB")

    @contextmanager
    def _session(self):
        with mysql_session(self._config) as connection:
            # 压缩 BLOB 通过二进制参数传输，避免文本 SQL 转义把 64MB 内日志膨胀到包限制以上。
            cursor = connection.cursor(dictionary=True, prepared=True)
            try:
                yield cursor
            finally:
                cursor.close()

    @staticmethod
    def _identity(namespace, key):
        namespace, key = str(namespace), str(key)
        if not namespace or len(namespace) > 64:
            raise ValueError("存储命名空间无效")
        return namespace, sha256(key.encode("utf-8")).hexdigest(), key

    def _write(self, cursor, namespace, key, value):
        ns, digest, original = self._identity(namespace, key)
        cursor.execute("INSERT INTO runtime_records_mysql(namespace,key_hash,state_key,payload) VALUES (%s,%s,%s,%s) ON DUPLICATE KEY UPDATE payload=VALUES(payload), updated_at=CURRENT_TIMESTAMP(6)", (ns, digest, original, _encode(value)))
        self._project(cursor, ns, digest, value)

    def _project(self, cursor, ns, digest, value):
        if ns == "agent_event":
            result = value.get("result", {}) if value.get("_event_result_store_version") == 2 else value
            plan = result.get("maintenance_plan") or {}
            if plan.get("plan_id"):
                # 禁止把工具全文、模型上下文复制到列表查询投影。
                projection = {name: result[name] for name in ("maintenance_plan", "diagnosis", "event", "task_id", "trace_id", "status", "stop_reason", "created_at") if name in result}
                cursor.execute("INSERT INTO maintenance_plan_projection(event_key_hash,plan_id,payload) VALUES (%s,%s,%s) ON DUPLICATE KEY UPDATE plan_id=VALUES(plan_id),payload=VALUES(payload),updated_at=CURRENT_TIMESTAMP(6)", (digest, str(plan["plan_id"]), _encode(projection)))
            else:
                cursor.execute("DELETE FROM maintenance_plan_projection WHERE event_key_hash=%s", (digest,))

    def get(self, namespace, key):
        ns, digest, _ = self._identity(namespace, key)
        with self._session() as cursor:
            cursor.execute("SELECT payload FROM runtime_records_mysql WHERE namespace=%s AND key_hash=%s", (ns, digest))
            row = cursor.fetchone()
        return _decode(row["payload"]) if row else None

    def set(self, namespace, key, value):
        with self._session() as cursor:
            self._write(cursor, namespace, key, value)

    def delete(self, namespace, key):
        ns, digest, _ = self._identity(namespace, key)
        with self._session() as cursor:
            cursor.execute("DELETE FROM runtime_records_mysql WHERE namespace=%s AND key_hash=%s", (ns, digest))

    def keys(self, namespace):
        with self._session() as cursor:
            cursor.execute("SELECT state_key FROM runtime_records_mysql WHERE namespace=%s ORDER BY state_key", (str(namespace),))
            return [row["state_key"] for row in cursor.fetchall()]

    def values(self, namespace, limit=1000):
        with self._session() as cursor:
            cursor.execute("SELECT payload FROM runtime_records_mysql WHERE namespace=%s ORDER BY updated_at DESC,key_hash LIMIT %s", (str(namespace), max(1, min(int(limit), 5000))))
            return [_decode(row["payload"]) for row in cursor.fetchall()]

    def compare_and_set(self, namespace, key, field, expected, values):
        ns, digest, _ = self._identity(namespace, key)
        with self._session() as cursor:
            cursor.execute("SELECT payload FROM runtime_records_mysql WHERE namespace=%s AND key_hash=%s FOR UPDATE", (ns, digest))
            row = cursor.fetchone()
            current = _decode(row["payload"]) if row else None
            if current is None or current.get(str(field)) != expected:
                return None
            current.update(dict(values))
            self._write(cursor, namespace, key, current)
            return current

    def get_or_create(self, namespace, key, producer):
        ns, digest, original = self._identity(namespace, key)
        wait = max(0.1, float(os.getenv("DURABLE_RESULT_WAIT_SECONDS", "180")))
        stale = max(wait, float(os.getenv("DURABLE_CLAIM_STALE_SECONDS", "600")))
        deadline = monotonic() + wait
        while True:
            owner = False
            uncertain = False
            with self._session() as cursor:
                # 唯一键负责跨进程认领；事务结束以后才运行生产函数。
                # 重复键直接取得排他锁；INSERT IGNORE 的共享锁再升级 FOR UPDATE 会并发死锁。
                cursor.execute("INSERT INTO runtime_claims_mysql(namespace,key_hash,state_key,status) VALUES (%s,%s,%s,'running') ON DUPLICATE KEY UPDATE state_key=runtime_claims_mysql.state_key", (ns, digest, original))
                owner = cursor.rowcount == 1
                cursor.execute("SELECT payload FROM runtime_records_mysql WHERE namespace=%s AND key_hash=%s", (ns, digest))
                row = cursor.fetchone()
                if row:
                    if owner:
                        cursor.execute("DELETE FROM runtime_claims_mysql WHERE namespace=%s AND key_hash=%s", (ns, digest))
                    return _decode(row["payload"])
                cursor.execute("SELECT status,TIMESTAMPDIFF(SECOND,created_at,CURRENT_TIMESTAMP) AS age FROM runtime_claims_mysql WHERE namespace=%s AND key_hash=%s FOR UPDATE", (ns, digest))
                claim = cursor.fetchone()
                uncertain = claim["status"] == "uncertain" or claim["age"] >= stale
                if uncertain:
                    cursor.execute("UPDATE runtime_claims_mysql SET status='uncertain' WHERE namespace=%s AND key_hash=%s", (ns, digest))
            if uncertain:
                raise PendingResultError("uncertain")
            if owner:
                try:
                    value = dict(producer() or {})
                except BaseException:
                    with self._session() as cursor:
                        cursor.execute("UPDATE runtime_claims_mysql SET status='uncertain' WHERE namespace=%s AND key_hash=%s", (ns, digest))
                    raise
                with self._session() as cursor:
                    self._write(cursor, namespace, key, value)
                    cursor.execute("DELETE FROM runtime_claims_mysql WHERE namespace=%s AND key_hash=%s", (ns, digest))
                return value
            if monotonic() >= deadline:
                raise PendingResultError("running")
            sleep(0.05)

    def plan_results(self):
        with self._session() as cursor:
            cursor.execute("SELECT p.payload FROM maintenance_plan_projection p LEFT JOIN maintenance_plan_deletions d ON d.plan_id=p.plan_id WHERE d.plan_id IS NULL ORDER BY p.updated_at DESC LIMIT 5000")
            values = [_decode(row["payload"]) for row in cursor.fetchall()]
            cursor.execute("SELECT COUNT(*) AS total FROM maintenance_plan_projection")
            total = cursor.fetchone()["total"]
        return values, {"status": "ready", "loaded_records": len(values), "total_records": total, "error": "", "storage": "mysql"}

    def deleted_plan_ids(self):
        with self._session() as cursor:
            cursor.execute("SELECT plan_id FROM maintenance_plan_deletions ORDER BY deleted_at,plan_id")
            return [row["plan_id"] for row in cursor.fetchall()]

    def delete_plans(self, plan_ids, actor_id):
        ids = list(dict.fromkeys(str(item).strip() for item in plan_ids))
        if not ids or len(ids) > 100 or any(not item or len(item) > 128 for item in ids) or not str(actor_id).strip():
            raise ValueError("请指定有效的方案编号和已登录操作人，每批最多 100 条")
        placeholders = ",".join(["%s"] * len(ids))
        with self._session() as cursor:
            cursor.execute("SELECT plan_id FROM maintenance_plan_projection WHERE plan_id IN (" + placeholders + ") ORDER BY plan_id FOR UPDATE", tuple(ids))
            found = {row["plan_id"] for row in cursor.fetchall()}
            if found != set(ids):
                raise KeyError("维修方案不存在")
            for plan_id in sorted(ids):
                cursor.execute("INSERT IGNORE INTO maintenance_plan_deletions(plan_id,actor_id) VALUES (%s,%s)", (plan_id, str(actor_id)))
        return ids

    def import_record(self, namespace, key, value):
        return self._import_encoded(namespace, key, _encode(value), lambda: dict(value), value)

    def import_serialized_record(self, namespace, key, payload, projection):
        """只供旧库迁移：调用方须用 SQLite 验证对象 JSON，保留巨大原文而不展开上下文。"""
        compressor = zlib.compressobj()
        text = payload if isinstance(payload, str) else None
        chunks = (text[start:start + 65536].encode("utf-8") for start in range(0, len(text), 65536)) if text is not None else payload
        parts = [compressor.compress(chunk) for chunk in chunks]
        parts.append(compressor.flush())
        def resolve():
            if text is None:
                raise ValueError("迁移冲突：巨大旧记录原文与目标不同，禁止覆盖；需独立对账")
            return json.loads(text)
        return self._import_encoded(namespace, key, b"".join(parts), resolve, projection)

    def _import_encoded(self, namespace, key, encoded, resolve_value, projection):
        ns, digest, original = self._identity(namespace, key)
        with self._session() as cursor:
            cursor.execute("INSERT IGNORE INTO runtime_records_mysql(namespace,key_hash,state_key,payload) VALUES (%s,%s,%s,%s)", (ns, digest, original, encoded))
            inserted = cursor.rowcount == 1
            if not inserted:
                cursor.execute("SELECT payload FROM runtime_records_mysql WHERE namespace=%s AND key_hash=%s FOR UPDATE", (ns, digest))
                old = cursor.fetchone()["payload"]
                # 同源重跑通常字节一致；避免把数百 MB 正文再次解压到内存。
                if bytes(old) != encoded and _decode(old) != resolve_value():
                    raise ValueError("迁移冲突：已有记录不同，禁止覆盖")
            self._project(cursor, ns, digest, projection)
            return inserted
