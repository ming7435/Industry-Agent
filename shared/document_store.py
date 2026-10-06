"""RAG 在线文档与分块正文存 MySQL，向量仍由 Milvus 管理。"""
from contextlib import contextmanager
import json
from shared.persistence import mysql_session


def normalize_corpus(value):
    aliases = {"alarm": "alarms", "case": "cases", "experience": "cases", "manual": "manuals", "engineering": "manuals", "bom": "manuals"}
    value = str(value or "").strip().lower()
    return aliases.get(value, value)


def _json(value):
    return value if isinstance(value, dict) else json.loads(value or "{}")


def normalize_document(document_id, content, metadata, collection, chunks=None):
    """在线写入和旧数据对账使用同一规范化，避免同源迁移产生冲突。"""
    document_id = str(document_id or "").strip()
    if not document_id or len(document_id) > 255:
        raise ValueError("文档编号不能为空或超过 255 个字符")
    content, collection = str(content or ""), str(collection or "")
    metadata = dict(metadata or {})
    metadata["corpus"] = normalize_corpus(metadata.get("corpus") or metadata.get("knowledge_type") or collection)
    normalized_chunks = []
    for index, chunk in enumerate(chunks or [{"chunk_id": document_id + ":0", "text": content}]):
        chunk_id = str(chunk.get("chunk_id") or f"{document_id}:{index}")
        if len(chunk_id) > 512:
            raise ValueError("分块编号不能超过 512 个字符")
        chunk_metadata = {**metadata, **dict(chunk.get("metadata") or {})}
        chunk_metadata["corpus"] = normalize_corpus(chunk_metadata.get("corpus"))
        normalized_chunks.append({"chunk_id": chunk_id, "text": str(chunk.get("text") or chunk.get("content") or content), "metadata": chunk_metadata})
    return {"content": content, "collection": collection, "metadata": metadata,
            "chunks": sorted(normalized_chunks, key=lambda item: item["chunk_id"])}


class MySQLDocumentStore:
    def __init__(self, config=None):
        self._config = config
        with self._session() as cursor:
            # 离线入库已经使用 rag_documents/rag_chunks 的来源审计结构，不能覆盖它们。
            cursor.execute("CREATE TABLE IF NOT EXISTS rag_online_documents (document_id VARCHAR(255) PRIMARY KEY, content LONGTEXT NOT NULL, collection VARCHAR(128) NOT NULL, metadata_json JSON NOT NULL, updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)) ENGINE=InnoDB")
            cursor.execute("CREATE TABLE IF NOT EXISTS rag_online_chunks (document_id VARCHAR(255) NOT NULL, chunk_id VARCHAR(512) NOT NULL, text LONGTEXT NOT NULL, metadata_json JSON NOT NULL, PRIMARY KEY(document_id,chunk_id)) ENGINE=InnoDB")

    @contextmanager
    def _session(self):
        with mysql_session(self._config) as connection:
            cursor = connection.cursor(dictionary=True)
            try:
                yield cursor
            finally:
                cursor.close()

    def upsert(self, document_id, content, metadata, collection, chunks=None):
        normalized = normalize_document(document_id, content, metadata, collection, chunks)
        document_id = str(document_id).strip()
        content, collection, metadata, chunks = (normalized[key] for key in ("content", "collection", "metadata", "chunks"))
        with self._session() as cursor:
            # 更新文档行和替换其所有分块在同一事务，不能出现半个版本。
            cursor.execute("INSERT INTO rag_online_documents(document_id,content,collection,metadata_json) VALUES (%s,%s,%s,%s) ON DUPLICATE KEY UPDATE content=VALUES(content),collection=VALUES(collection),metadata_json=VALUES(metadata_json),updated_at=CURRENT_TIMESTAMP(6)", (document_id, content, collection, json.dumps(metadata, ensure_ascii=False, default=str)))
            cursor.execute("DELETE FROM rag_online_chunks WHERE document_id=%s", (document_id,))
            for chunk in chunks:
                cursor.execute("INSERT INTO rag_online_chunks(document_id,chunk_id,text,metadata_json) VALUES (%s,%s,%s,%s)", (document_id, chunk["chunk_id"], chunk["text"], json.dumps(chunk["metadata"], ensure_ascii=False, default=str)))
        return self.get(document_id) or {}

    def get(self, document_id):
        with self._session() as cursor:
            cursor.execute("SELECT * FROM rag_online_documents WHERE document_id=%s", (str(document_id),))
            row = cursor.fetchone()
            if not row:
                return None
            cursor.execute("SELECT chunk_id,text,metadata_json FROM rag_online_chunks WHERE document_id=%s ORDER BY chunk_id", (str(document_id),))
            chunks = cursor.fetchall()
        return {"document_id": row["document_id"], "content": row["content"], "collection": row["collection"], "metadata": _json(row["metadata_json"]), "chunks": [{"chunk_id": chunk["chunk_id"], "text": chunk["text"], "metadata": _json(chunk["metadata_json"])} for chunk in chunks], "updated_at": row["updated_at"].isoformat()}

    def get_chunk(self, document_id, chunk_id):
        with self._session() as cursor:
            cursor.execute("SELECT text,metadata_json FROM rag_online_chunks WHERE document_id=%s AND chunk_id=%s", (str(document_id), str(chunk_id)))
            row = cursor.fetchone()
        return {"document_id": str(document_id), "chunk_id": str(chunk_id), "text": row["text"], "metadata": _json(row["metadata_json"])} if row else None

    def search(self, query, limit=5, filters=None):
        terms = [part.lower() for part in str(query or "").split() if part][:32]
        selected = {str(key): value for key, value in (filters or {}).items() if value not in (None, "", [], {})}
        merged = "JSON_MERGE_PATCH(d.metadata_json,COALESCE(c.metadata_json,JSON_OBJECT()))"
        haystack = "LOWER(CONCAT(COALESCE(c.text,d.content),' ',CAST(" + merged + " AS CHAR)))"
        score_parts = ["CASE WHEN LOCATE(%s," + haystack + ")>0 THEN 1 ELSE 0 END" for _ in terms]
        score = "+".join(score_parts) if terms else "0.1"
        conditions, parameters = [], list(terms)
        for key, expected in selected.items():
            values = list(expected) if isinstance(expected, (list, tuple, set)) else [expected]
            if key == "collection":
                expression = "LOWER(d.collection)"
            else:
                path = "$." + json.dumps(key, ensure_ascii=False)
                expression = "LOWER(JSON_UNQUOTE(JSON_EXTRACT(" + merged + ",%s)))"
                parameters.append(path)
            if key == "corpus":
                values = [normalize_corpus(value) for value in values]
            conditions.append(expression + " IN (" + ",".join(["%s"] * len(values)) + ")")
            parameters.extend(str(value).lower() for value in values)
        if terms:
            conditions.append("(" + " OR ".join("LOCATE(%s," + haystack + ")>0" for _ in terms) + ")")
            parameters.extend(terms)
        where = " WHERE " + " AND ".join(conditions) if conditions else ""
        parameters.append(max(1, min(int(limit), 1000)))
        with self._session() as cursor:
            cursor.execute("SELECT d.document_id,d.collection,COALESCE(c.chunk_id,CONCAT(d.document_id,':0')) AS chunk_id,COALESCE(c.text,d.content) AS text," + merged + " AS metadata," + score + " AS score FROM rag_online_documents d LEFT JOIN rag_online_chunks c ON c.document_id=d.document_id" + where + " ORDER BY score DESC,chunk_id DESC LIMIT %s", tuple(parameters))
            rows = cursor.fetchall()
        return [{"chunk_id": row["chunk_id"], "text": row["text"], "score": float(row["score"]), "source": "standalone-document-store", "metadata": {**_json(row["metadata"]), "collection": row["collection"], "document_id": row["document_id"]}} for row in rows]
