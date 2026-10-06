"""旧 SQLite 只读迁移到 MySQL/Redis；默认仅清点，显式 --apply 才写入。"""
from contextlib import closing
from datetime import datetime
from hashlib import sha256
import argparse
import json
from pathlib import Path
import sqlite3
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
from shared.persistence import MySQLJsonStore, mysql_session, _decode
from shared.document_store import MySQLDocumentStore, normalize_document
from shared.temporary_cache import RedisJsonCache


NATIVE_SCHEMAS = {
    "workorders": "workorder_id VARCHAR(64) PRIMARY KEY,idempotency_key VARCHAR(255) UNIQUE,payload JSON NOT NULL,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    "business_records": "record_type VARCHAR(64) NOT NULL,record_id VARCHAR(128) NOT NULL,payload JSON NOT NULL,updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,PRIMARY KEY(record_type,record_id)",
    "team_accounts": "user_id VARCHAR(64) PRIMARY KEY,username VARCHAR(128) NOT NULL,username_key VARCHAR(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL UNIQUE,password_hash TEXT NOT NULL,role VARCHAR(24) NOT NULL,primary_device_id VARCHAR(128) NOT NULL,enabled INTEGER NOT NULL,created_at DOUBLE NOT NULL",
    "team_state": "state_key VARCHAR(128) PRIMARY KEY,payload LONGTEXT NOT NULL",
}
NATIVE_KEYS = {"workorders": ("workorder_id",), "business_records": ("record_type", "record_id"), "team_accounts": ("user_id",), "team_state": ("state_key",)}
NATIVE_COLUMNS = {
    "workorders": ("workorder_id", "idempotency_key", "payload"),
    "business_records": ("record_type", "record_id", "payload"),
    "team_accounts": ("user_id", "username", "username_key", "password_hash", "role", "primary_device_id", "enabled", "created_at"),
    "team_state": ("state_key", "payload"),
}
LARGE_RECORD_CHARACTERS = 8 * 1024 * 1024


def _runtime_record(store, db, row):
    keys = (row["namespace"], row["state_key"])
    located = db.execute("SELECT rowid,length(CAST(payload AS BLOB)) FROM runtime_state WHERE namespace=? AND state_key=?", keys).fetchone()
    if located[1] < LARGE_RECORD_CHARACTERS:
        payload = db.execute("SELECT payload FROM runtime_state WHERE namespace=? AND state_key=?", keys).fetchone()[0]
        return store.import_record(*keys, json.loads(payload))
    # SQLite 在只读旧库中验证 JSON 并仅提取方案子树，不能在 Python 展开海量工具上下文。
    valid = db.execute("SELECT json_valid(payload),json_type(payload) FROM runtime_state WHERE namespace=? AND state_key=?", keys).fetchone()
    if not valid or not valid[0] or valid[1] != "object":
        raise ValueError("旧运行记录不是有效的对象 JSON，未写入目标")
    projection = {}
    if row["namespace"] == "agent_event":
        version = db.execute("SELECT json_extract(payload,'$._event_result_store_version') FROM runtime_state WHERE namespace=? AND state_key=?", keys).fetchone()[0]
        fields = ("maintenance_plan", "diagnosis", "event", "task_id", "trace_id", "status", "stop_reason", "created_at")
        paths = tuple(("$.result." if version == 2 else "$.") + field for field in fields)
        extracted = db.execute("SELECT json_extract(payload," + ",".join("?" for _ in paths) + ") FROM runtime_state WHERE namespace=? AND state_key=?", (*paths, *keys)).fetchone()[0]
        projection = {key: value for key, value in zip(fields, json.loads(extracted)) if value is not None}
    def chunks():
        # 增量 BLOB 接口同样可只读 TEXT；禁止每次 substr 重扫整份数百 MB 的列。
        with db.blobopen("runtime_state", "payload", located[0], readonly=True) as blob:
            while part := blob.read(65536):
                yield part
    return store.import_serialized_record(*keys, chunks(), projection)


def _native_record(store, table, row):
    """限定表/列名，逐条事务导入；旧记录不同就停止，不覆盖新数据。"""
    columns, keys = NATIVE_COLUMNS[table], NATIVE_KEYS[table]
    where = " AND ".join(key + "=%s" for key in keys)
    with store._session() as cursor:
        cursor.execute("CREATE TABLE IF NOT EXISTS " + table + " (" + NATIVE_SCHEMAS[table] + ") ENGINE=InnoDB")
        cursor.execute("SELECT " + ",".join(columns) + " FROM " + table + " WHERE " + where + " FOR UPDATE", tuple(row[key] for key in keys))
        old = cursor.fetchone()
        if old:
            for name in columns:
                actual, expected = old[name], row[name]
                if name == "payload":
                    actual = json.loads(actual) if isinstance(actual, (str, bytes)) else actual
                    expected = json.loads(expected) if isinstance(expected, (str, bytes)) else expected
                if actual != expected:
                    raise ValueError("迁移冲突：已有业务记录不同，禁止覆盖")
            return False
        cursor.execute("INSERT INTO " + table + " (" + ",".join(columns) + ") VALUES (" + ",".join(["%s"] * len(columns)) + ")", tuple(row[name] for name in columns))
        return True


def _legacy_claim(store, row):
    ns, digest, key = store._identity(row["namespace"], row["state_key"])
    with store._session() as cursor:
        cursor.execute("SELECT payload FROM runtime_records_mysql WHERE namespace=%s AND key_hash=%s", (ns, digest))
        if cursor.fetchone():
            return False
        # 不能证明旧进程完成的领取一律保持不确定，迁移后不重新执行设备/派工。
        cursor.execute("INSERT IGNORE INTO runtime_claims_mysql(namespace,key_hash,state_key,status) VALUES (%s,%s,%s,'uncertain')", (ns, digest, key))
        return cursor.rowcount == 1


def _document_values(db, row):
    chunks = [dict(chunk) for chunk in db.execute("SELECT chunk_id,text,metadata_json FROM rag_chunks WHERE document_id=? ORDER BY chunk_id", (row["document_id"],))] if "rag_chunks" in {item[0] for item in db.execute("SELECT name FROM sqlite_master WHERE type='table'")} else []
    values = [{"chunk_id": item["chunk_id"], "text": item["text"], "metadata": json.loads(item["metadata_json"])} for item in chunks]
    return normalize_document(row["document_id"], row["content"], json.loads(row["metadata_json"]), row["collection"], values)


def _document_record(store, db, row):
    expected = _document_values(db, row)
    target = MySQLDocumentStore(store._config)
    old = target.get(row["document_id"])
    if old:
        if any(old[key] != value for key, value in expected.items()):
            raise ValueError("迁移冲突：已有文档不同，禁止覆盖")
        return False
    target.upsert(row["document_id"], expected["content"], expected["metadata"], expected["collection"], expected["chunks"])
    return True


def migrate_file(path, store=None, *, apply=False, archive_workorders=False, excluded_documents=()):
    source = Path(path).resolve(strict=True)
    counts = {"records": 0, "written": 0, "unchanged": 0, "excluded": 0, "tables": {}, "unsupported_tables": []}
    excluded_documents = set(excluded_documents)
    with closing(sqlite3.connect(source.as_uri() + "?mode=ro", uri=True)) as db:
        db.row_factory = sqlite3.Row
        tables = {item[0] for item in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        supported = {"runtime_state", "runtime_claims", "reports", "pending_faults", "control_claims", "rag_documents", "rag_chunks", "team_sessions", *NATIVE_SCHEMAS}
        counts["unsupported_tables"] = sorted(tables - supported - {"sqlite_sequence"})
        for table in sorted(tables & supported - {"rag_chunks"}):
            count = int(db.execute("SELECT COUNT(*) FROM " + table).fetchone()[0])
            counts["tables"][table] = count
            counts["records"] += count
            if not apply:
                continue
            if store is None:
                raise ValueError("实际迁移需要显式 MySQL 目标")
            query = "SELECT namespace,state_key FROM runtime_state" if table == "runtime_state" else "SELECT * FROM " + table
            for row in db.execute(query):
                if table == "runtime_state":
                    wrote = _runtime_record(store, db, row)
                elif table == "runtime_claims":
                    wrote = _legacy_claim(store, row)
                elif table == "reports":
                    wrote = store.import_record("reports", row["report_id"], json.loads(row["payload"]))
                elif table == "pending_faults":
                    wrote = store.import_record("safety_pending", row["event_id"], json.loads(row["payload"]))
                elif table == "control_claims":
                    wrote = store.import_record("safety_claim", row["command_key"], {"claimed": True})
                elif table == "rag_documents":
                    if row["document_id"] in excluded_documents:
                        counts["excluded"] += 1
                        continue
                    wrote = _document_record(store, db, row)
                elif table == "team_sessions":
                    remaining = int(float(row["expires_at"]) - time.time())
                    wrote = False
                    if remaining > 0:
                        cache = RedisJsonCache(prefix="industry:team:sessions", ttl_seconds=remaining)
                        value = {"user_id": row["user_id"], "expires_at": row["expires_at"]}
                        old = cache.get(row["token_hash"])
                        if old and old != value:
                            raise ValueError("迁移冲突：会话记录不同")
                        if not old:
                            cache.set(row["token_hash"], value)
                            wrote = True
                elif table == "workorders" and archive_workorders:
                    wrote = store.import_record("legacy_workorder_archive", row["workorder_id"], json.loads(row["payload"]))
                else:
                    wrote = _native_record(store, table, dict(row))
                counts["written" if wrote else "unchanged"] += 1
    return counts


def backup_source(source, backup_dir):
    source = Path(source).resolve(strict=True)
    destination = Path(backup_dir).resolve() / (source.stem + "-" + sha256(str(source).encode()).hexdigest()[:8] + ".sqlite3")
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        raise FileExistsError("备份目标已存在，禁止覆盖；请选择新的备份目录")
    with closing(sqlite3.connect(source.as_uri() + "?mode=ro", uri=True)) as old, closing(sqlite3.connect(destination)) as copied:
        old.backup(copied)
    return destination


def check_target(path, config=None, *, archive_workorders=False, excluded_documents=()):
    """服务仍运行时可只读预检；不建表，不写入，也不输出账户/正文。"""
    counts = {"records_checked": 0, "conflicts": 0, "existing_equal": 0}
    source = Path(path).resolve(strict=True)
    with closing(sqlite3.connect(source.as_uri() + "?mode=ro", uri=True)) as db, mysql_session(config) as connection:
        db.row_factory = sqlite3.Row
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("SHOW TABLES")
            target_tables = {next(iter(row.values())) for row in cursor.fetchall()}
            sources = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            for table in sources & ({"runtime_state", "reports", "pending_faults", "control_claims", "rag_documents"} | set(NATIVE_SCHEMAS)):
                archived = table == "workorders" and archive_workorders
                destination = "rag_online_documents" if table == "rag_documents" else table if table in NATIVE_SCHEMAS and not archived else "runtime_records_mysql"
                if destination not in target_tables:
                    continue
                for row in db.execute("SELECT * FROM " + table):
                    if table == "rag_documents":
                        if row["document_id"] in excluded_documents:
                            continue
                        expected = _document_values(db, row)
                        cursor.execute("SELECT content,collection,metadata_json FROM rag_online_documents WHERE document_id=%s", (row["document_id"],))
                        old = cursor.fetchall()
                        equal = False
                        if old:
                            cursor.execute("SELECT chunk_id,text,metadata_json FROM rag_online_chunks WHERE document_id=%s ORDER BY chunk_id", (row["document_id"],))
                            chunks = [{"chunk_id": chunk["chunk_id"], "text": chunk["text"], "metadata": json.loads(chunk["metadata_json"])} for chunk in cursor.fetchall()]
                            equal = {"content": old[0]["content"], "collection": old[0]["collection"], "metadata": json.loads(old[0]["metadata_json"]), "chunks": chunks} == expected
                    elif table in NATIVE_SCHEMAS and not archived:
                        columns, keys = NATIVE_COLUMNS[table], NATIVE_KEYS[table]
                        where = " AND ".join(key + "=%s" for key in keys)
                        parameters = [row[key] for key in keys]
                        if table == "team_accounts":
                            where += " OR username_key=%s"
                            parameters.append(row["username_key"])
                        if table == "workorders" and row["idempotency_key"]:
                            where += " OR idempotency_key=%s"
                            parameters.append(row["idempotency_key"])
                        cursor.execute("SELECT " + ",".join(columns) + " FROM " + table + " WHERE " + where, tuple(parameters))
                        old = cursor.fetchall()
                        equal = len(old) == 1 and all((json.loads(old[0][key]) == json.loads(row[key]) if key == "payload" else old[0][key] == row[key]) for key in columns)
                    else:
                        if archived:
                            namespace, key, expected = "legacy_workorder_archive", row["workorder_id"], json.loads(row["payload"])
                        elif table == "runtime_state":
                            namespace, key, expected = row["namespace"], row["state_key"], json.loads(row["payload"])
                        elif table == "reports":
                            namespace, key, expected = "reports", row["report_id"], json.loads(row["payload"])
                        elif table == "pending_faults":
                            namespace, key, expected = "safety_pending", row["event_id"], json.loads(row["payload"])
                        else:
                            namespace, key, expected = "safety_claim", row["command_key"], {"claimed": True}
                        cursor.execute("SELECT payload FROM runtime_records_mysql WHERE namespace=%s AND key_hash=%s", (namespace, sha256(str(key).encode()).hexdigest()))
                        old = cursor.fetchall()
                        equal = len(old) == 1 and _decode(old[0]["payload"]) == expected
                    if old:
                        counts["records_checked"] += 1
                        counts["existing_equal" if equal else "conflicts"] += 1
        finally:
            cursor.close()
    return counts


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", action="append", required=True, help="明确指定旧 SQLite 文件，可重复")
    parser.add_argument("--apply", action="store_true", help="完成备份后实际迁移；默认只读清点")
    parser.add_argument("--backup-dir", help="实际迁移前的 SQLite 一致性备份目录，不输出正文/凭据")
    parser.add_argument("--check-target", action="store_true", help="只读预检已有 MySQL 记录冲突，不创建表")
    parser.add_argument("--archive-workorders", action="store_true", help="旧 Agent 工单只保存为 MySQL 归档，不覆盖权威工单表")
    parser.add_argument("--exclude-document-id", action="append", default=[], help="明确排除已确认归属的测试文档；旧源文件仍保留")
    args = parser.parse_args()
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env", override=False)
    store = None
    backup_dir = args.backup_dir or str(ROOT / ".runtime" / "backups" / ("sqlite-migration-" + datetime.now().strftime("%Y%m%d-%H%M%S")))
    for name in args.source:
        source = Path(name).resolve(strict=True)
        if args.check_target:
            print(json.dumps({"source": str(source), "mode": "check-target", **check_target(source, archive_workorders=args.archive_workorders, excluded_documents=set(args.exclude_document_id))}, ensure_ascii=False))
            continue
        if args.apply:
            backup_source(source, backup_dir)
            if store is None:
                store = MySQLJsonStore()
        result = migrate_file(source, store, apply=args.apply, archive_workorders=args.archive_workorders, excluded_documents=set(args.exclude_document_id))
        print(json.dumps({"source": str(source), "mode": "apply" if args.apply else "dry-run", **result}, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # 不把连接异常或账户/会话正文写到控制台。
        from shared.persistence import StorageUnavailable
        reason = str(error) if isinstance(error, StorageUnavailable) else type(error).__name__
        print("迁移未完成：源库仍保留，请检查文件、连接、权限或目标记录冲突。原因类型：" + reason, file=sys.stderr)
        raise SystemExit(1)
