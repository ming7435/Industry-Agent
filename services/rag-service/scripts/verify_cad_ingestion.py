"""Verify that the DXF ingestion landed in MySQL, Milvus, and MinIO."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path
from typing import Any

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.config import load_service_env  # noqa: E402
from app.mysql import MySQLConfig  # noqa: E402
from app.storage import ObjectStorageClient, ObjectStorageConfig  # noqa: E402


MYSQL_TABLES = [
    "rag_documents",
    "cad_drawings",
    "cad_drawing_versions",
    "cad_layers",
    "cad_entities",
    "cad_text_annotations",
    "cad_entity_relations",
    "rag_chunks",
]


def check_mysql(config: MySQLConfig) -> dict[str, Any]:
    import pymysql

    connection = pymysql.connect(
        host=config.host,
        port=config.port,
        user=config.user,
        password=config.password,
        database=config.database,
        charset=config.charset,
        connect_timeout=config.connect_timeout,
    )
    report: dict[str, Any] = {}
    try:
        with connection.cursor() as cursor:
            cursor.execute("SHOW TABLES")
            tables = {row[0] for row in cursor.fetchall()}
            report["tables"] = sorted(tables)
            for table in MYSQL_TABLES:
                if table not in tables:
                    report[table] = "missing"
                    continue
                cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
                report[table] = int(cursor.fetchone()[0])
            if "rag_documents" in tables:
                cursor.execute(
                    "SELECT source_name, source_format, status, chunk_count, vector_count, "
                    "storage_bucket, storage_key FROM rag_documents"
                )
                report["documents"] = [list(row) for row in cursor.fetchall()]
            if "cad_layers" in tables:
                cursor.execute("SELECT layer_name, entity_count FROM cad_layers ORDER BY entity_count DESC LIMIT 20")
                report["top_layers"] = [list(row) for row in cursor.fetchall()]
            if "cad_drawing_versions" in tables:
                cursor.execute(
                    "SELECT version_label, source_format, dxf_version, entity_count, layer_count "
                    "FROM cad_drawing_versions"
                )
                report["versions"] = [list(row) for row in cursor.fetchall()]
            if "cad_entity_relations" in tables:
                cursor.execute(
                    "SELECT relation_type, COUNT(*) FROM cad_entity_relations GROUP BY relation_type"
                )
                report["relation_types"] = [list(row) for row in cursor.fetchall()]
            if "cad_entities" in tables:
                cursor.execute(
                    "SELECT entity_type, COUNT(*) FROM cad_entities GROUP BY entity_type "
                    "ORDER BY 2 DESC LIMIT 20"
                )
                report["entity_types"] = [list(row) for row in cursor.fetchall()]
    finally:
        connection.close()
    return report


def check_milvus(uri: str, database: str, collection_name: str) -> dict[str, Any]:
    from pymilvus import MilvusClient

    client = MilvusClient(uri=uri, db_name=database)
    collections = client.list_collections()
    report: dict[str, Any] = {"collections": collections, "collection_count": len(collections)}
    if collection_name not in collections:
        report["entities"] = 0
        return report
    report["entities"] = int(client.get_collection_stats(collection_name).get("row_count", 0))
    sample = client.query(
        collection_name=collection_name,
        filter="",
        output_fields=[
            "chunk_id",
            "source_name",
            "source_format",
            "chunk_type",
            "layer_name",
            "drawing_id",
            "version_id",
            "text",
        ],
        limit=6,
    )
    for row in sample:
        row.pop("vector", None)
        row["drawing_id"] = str(row.get("drawing_id", ""))[:12]
        row["version_id"] = str(row.get("version_id", ""))[:12]
        row["text"] = str(row.get("text", "")).replace("\n", " ")[:90]
    report["sample"] = sample
    return report


def check_object_storage() -> dict[str, Any]:
    client = ObjectStorageClient(ObjectStorageConfig.from_env())
    objects = client.client.list_objects(client.config.bucket, recursive=True)
    items = []
    for item in objects:
        items.append(
            {
                "key": getattr(item, "object_name", None) or str(item),
                "size": getattr(item, "size", None),
                "etag": getattr(item, "etag", None),
            }
        )
    return {"bucket": client.config.bucket, "objects": items}


def render(report: dict[str, Any]) -> None:
    print("=" * 72)
    print("DXF INGESTION VERIFICATION")
    print("=" * 72)
    mysql = report["mysql"]
    print("\n[MySQL] database=%s" % report["mysql_database"])
    print("  tables: %s" % ", ".join(mysql.get("tables", [])))
    for table in MYSQL_TABLES:
        print(f"  rows {table:<24}: {mysql.get(table)}")
    print("\n  documents:")
    for row in mysql.get("documents", []):
        print(f"    {row}")
    print("\n  versions:")
    for row in mysql.get("versions", []):
        print(f"    {row}")
    print("\n  top layers:")
    for row in mysql.get("top_layers", []):
        print(f"    {row}")
    print("\n  entity types:")
    for row in mysql.get("entity_types", []):
        print(f"    {row}")
    print("\n  relation types:")
    for row in mysql.get("relation_types", []):
        print(f"    {row}")

    milvus = report["milvus"]
    print("\n[Milvus] uri=%s database=%s" % (report["milvus_uri"], report["milvus_database"]))
    print(f"  collections ({milvus['collection_count']}): {milvus['collections']}")
    print(f"  entities in '{report['milvus_collection']}': {milvus.get('entities')}")
    for row in milvus.get("sample", []):
        print(f"    {row}")

    storage = report["object_storage"]
    print("\n[Object storage] bucket=%s" % storage["bucket"])
    for item in storage["objects"]:
        print(f"    {item['key']} ({item['size']} bytes)")


def main() -> int:
    load_service_env()
    config = MySQLConfig.from_env()
    milvus_uri = os.getenv("MILVUS_URI", "http://127.0.0.1:19530")
    milvus_database = os.getenv("MILVUS_DATABASE", "industry_rag_documents")
    collection_name = os.getenv("MILVUS_COLLECTION", "cad_semantic_chunks")
    report = {
        "mysql_database": config.database,
        "mysql": check_mysql(config),
        "milvus_uri": milvus_uri,
        "milvus_database": milvus_database,
        "milvus_collection": collection_name,
        "milvus": check_milvus(milvus_uri, milvus_database, collection_name),
        "object_storage": check_object_storage(),
    }
    render(report)
    output = PROJECT_ROOT / "cad_ingestion_report.json"
    output.write_text(
        json.dumps(report, ensure_ascii=False, indent=2, default=str),
        encoding="utf-8",
    )
    print(f"\nJSON report written to: {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
