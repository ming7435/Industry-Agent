"""面向维修手册 JSONL 的轻量本地 RAG 索引。

索引保留与 Milvus 对齐的集合、过滤字段和溯源元数据。当前默认使用
标准库实现关键词召回，后续可以在不改 Knowledge Agent 契约的情况下替换为
Milvus 向量检索或混合检索后端。
"""

from __future__ import annotations

import json
import os
import re
from collections import Counter
from pathlib import Path
from threading import RLock
from typing import Any, Dict, Iterable, List, Mapping


COLLECTION_BY_HINT = {
    "SOP": "maint_sop_procedures",
    "报警码": "maint_fault_events",
    "故障诊断": "maint_fault_events",
    "BOM": "maint_bom_items",
    "保养维护": "maint_manual_chunks",
    "安全规程": "maint_manual_chunks",
}

_TOKEN_RE = re.compile(r"[A-Za-z0-9_]+|[\u4e00-\u9fff]")


def tokenize_search_text(value: Any) -> List[str]:
    """把中英文、报警码和字段名拆成可稳定匹配的词元。"""

    text = str(value or "").lower()
    return _TOKEN_RE.findall(text)


def flatten_search_value(value: Any) -> str:
    """将嵌套字段展开成 RAG 检索使用的纯文本。"""

    if isinstance(value, (list, tuple)):
        return " ".join(flatten_search_value(item) for item in value)
    if isinstance(value, Mapping):
        return " ".join(f"{key} {flatten_search_value(item)}" for key, item in value.items())
    return str(value or "")


def collection_for_path(path: str | os.PathLike[str]) -> str:
    name = Path(path).name
    for hint, collection in COLLECTION_BY_HINT.items():
        if hint in name:
            return collection
    return "maint_manual_chunks"


def collection_for_record(record: Mapping[str, Any]) -> str:
    category = str(record.get("record_category") or "").lower()
    knowledge_type = str(record.get("knowledge_type") or "").lower()
    if category in {"sop", "procedure"} or knowledge_type == "sop":
        return "maint_sop_procedures"
    if category in {"fault", "alarm", "case", "diagnosis"} or knowledge_type in {"alarm", "fault", "case", "diagnosis"}:
        return "maint_fault_events"
    if category in {"bom", "part", "parts"} or knowledge_type in {"bom", "part", "parts"}:
        return "maint_bom_items"
    return "maint_manual_chunks"


def normalize_record(record: Mapping[str, Any], collection: str = "") -> Dict[str, Any]:
    """按入库设计补齐集合、向量源和最小溯源字段。"""

    item = dict(record)
    item["id"] = str(item.get("id") or item.get("document_id") or "")
    item["collection"] = str(item.get("collection") or collection or collection_for_record(item))
    item["source_file"] = str(item.get("source_file") or item.get("source") or "")
    item["device_model"] = str(item.get("device_model") or item.get("applicable_model") or "TC820LTYsi")
    item["component"] = str(item.get("component") or "")
    item["knowledge_type"] = str(item.get("knowledge_type") or item.get("record_category") or "manual")
    item["page"] = item.get("page")
    item["page_end"] = item.get("page_end")
    item["keywords"] = item.get("keywords") if isinstance(item.get("keywords"), list) else []

    retrieval_text = str(item.get("retrieval_text") or "").strip()
    if not retrieval_text:
        fields = (
            "title", "summary_zh", "keywords", "component", "alarm_code",
            "procedure_name", "symptom", "cause", "checks", "remedy",
            "safe_action", "description", "part_name", "verification",
            "acceptance_criteria", "source_excerpt",
        )
        retrieval_text = "\n".join(
            f"{field}: {flatten_search_value(item.get(field))}"
            for field in fields
            if item.get(field) not in (None, "", [], {})
        )
    item["retrieval_text"] = retrieval_text or str(item.get("content") or item.get("title") or item["id"])
    item["content"] = str(item.get("content") or item["retrieval_text"])
    return item


class RAGIndex:
    """进程内 RAG 索引，提供 JSONL 入库和带过滤条件的检索。"""

    backend = "local-hybrid-compatible"

    def __init__(self, records: Iterable[Mapping[str, Any]] | None = None) -> None:
        self._records: Dict[str, Dict[str, Any]] = {}
        self._lock = RLock()
        if records:
            self.upsert(records)

    def upsert(self, records: Iterable[Mapping[str, Any]], collection: str = "") -> int:
        count = 0
        with self._lock:
            for raw in records:
                item = normalize_record(raw, collection=collection)
                if not item["id"]:
                    continue
                self._records[item["id"]] = item
                count += 1
        return count

    def ingest_jsonl(self, path: str | os.PathLike[str], collection: str = "") -> Dict[str, Any]:
        source = Path(path)
        if not source.is_file():
            raise FileNotFoundError(f"RAG JSONL 不存在：{source}")

        selected_collection = collection or collection_for_path(source)
        records: List[Dict[str, Any]] = []
        invalid_lines = 0
        with source.open("r", encoding="utf-8-sig") as stream:
            for line in stream:
                if not line.strip():
                    continue
                try:
                    value = json.loads(line)
                except json.JSONDecodeError:
                    invalid_lines += 1
                    continue
                if isinstance(value, Mapping):
                    records.append(dict(value))
                else:
                    invalid_lines += 1

        loaded = self.upsert(records, collection=selected_collection)
        return {
            "source_file": str(source),
            "collection": selected_collection,
            "loaded": loaded,
            "invalid_lines": invalid_lines,
        }

    def ingest_directory(self, directory: str | os.PathLike[str]) -> List[Dict[str, Any]]:
        root = Path(directory)
        if not root.is_dir():
            raise NotADirectoryError(f"RAG 数据目录不存在：{root}")
        return [self.ingest_jsonl(path) for path in sorted(root.glob("*.jsonl"))]

    def search(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None) -> Dict[str, Any]:
        query = str(query or "").strip()
        limit = max(1, min(int(limit or 5), 50))
        query_tokens = Counter(tokenize_search_text(query))
        filters = dict(filters or {})
        ranked: List[tuple[float, Dict[str, Any]]] = []

        with self._lock:
            records = list(self._records.values())

        for item in records:
            if not record_matches_filters(item, filters):
                continue
            text = flatten_search_value(item.get("retrieval_text", "")).lower()
            searchable = Counter(tokenize_search_text(text))
            overlap = sum(min(query_tokens[token], searchable[token]) for token in query_tokens)
            phrase_bonus = 0.25 if query and query.lower() in text else 0.0
            alarm_bonus = 0.4 if item.get("alarm_code") and str(item["alarm_code"]).lower() in query.lower() else 0.0
            if overlap == 0 and not phrase_bonus and not alarm_bonus:
                continue
            score = min(1.0, 0.35 + 0.08 * overlap + phrase_bonus + alarm_bonus)
            ranked.append((score, item))

        ranked.sort(key=lambda value: (value[0], str(value[1].get("id"))), reverse=True)
        documents = []
        for score, item in ranked[:limit]:
            metadata = {
                key: value for key, value in item.items()
                if key not in {"content", "retrieval_text", "keywords"}
            }
            metadata["keywords"] = item.get("keywords", [])
            documents.append({
                "document_id": item["id"],
                "title": str(item.get("title") or item.get("procedure_name") or item.get("part_name") or item["id"]),
                "content": item.get("content", item.get("retrieval_text", "")),
                "source": item.get("source_file") or item.get("source") or self.backend,
                "score": round(score, 4),
                "metadata": metadata,
            })
        return {"query": query, "documents": documents, "source": self.backend, "total": len(documents), "filters": filters}

    def fetch_document(self, document_id: str) -> Dict[str, Any]:
        """按文档 ID 获取完整知识记录，保持检索结果的溯源字段。"""

        key = str(document_id or "").strip()
        with self._lock:
            item = dict(self._records.get(key) or {})
        if not item:
            return {"document_id": key, "found": False, "source": self.backend, "content": ""}
        return {
            "document_id": key,
            "found": True,
            "title": str(item.get("title") or item.get("procedure_name") or key),
            "content": item.get("content", item.get("retrieval_text", "")),
            "source": item.get("source_file") or item.get("source") or self.backend,
            "metadata": {name: value for name, value in item.items() if name not in {"content", "retrieval_text"}},
        }

    def fetch_chunk(self, document_id: str, chunk_id: str = "") -> Dict[str, Any]:
        """本地索引暂按文档粒度返回片段，预留远程 RAG 的 chunk_id。"""

        result = self.fetch_document(document_id)
        result["chunk_id"] = str(chunk_id or document_id or "")
        result["chunk_content"] = result.get("content", "") if result.get("found") else ""
        return result

    def count(self) -> int:
        """返回当前索引中的有效记录数。"""

        with self._lock:
            return len(self._records)

    def collections(self) -> Dict[str, int]:
        """按集合统计当前索引中的记录数。"""

        with self._lock:
            result: Counter[str] = Counter(str(item.get("collection", "")) for item in self._records.values())
        return dict(result)


def record_matches_filters(item: Mapping[str, Any], filters: Mapping[str, Any]) -> bool:
    """判断一条知识记录是否满足用户指定的元数据过滤条件。"""

    for key, expected in filters.items():
        if expected in (None, "", []):
            continue
        actual = item.get(key)
        if isinstance(actual, list):
            values = {str(value).lower() for value in actual}
            if str(expected).lower() not in values:
                return False
        elif str(actual or "").lower() != str(expected).lower():
            return False
    return True


def build_default_index() -> RAGIndex:
    """构建演示索引，并在配置目录存在时自动加载 JSONL。"""

    index = RAGIndex([
        {
            "id": "SOP-COOLING-001",
            "title": "主轴温升检查SOP",
            "content": "检查冷却液流量、冷却泵、散热器和主轴负载；温度恢复后空载运行确认。",
            "source_file": "演示数据/SOP",
            "record_category": "sop",
            "knowledge_type": "sop",
            "component": "主轴冷却系统",
            "keywords": ["温度", "主轴", "冷却"],
        },
        {
            "id": "ALARM-E102",
            "title": "E102 主轴温度异常报警说明",
            "content": "E102 表示主轴温度超过运行阈值，应检查冷却液流量、冷却泵状态、散热器堵塞、主轴负载和温度传感器。",
            "source_file": "演示数据/报警码",
            "alarm_code": "E102",
            "record_category": "fault",
            "knowledge_type": "alarm",
            "component": "主轴冷却系统",
            "keywords": ["E102", "温度", "主轴", "冷却"],
            "checks": ["检查冷却液流量", "检查冷却泵状态", "检查散热器堵塞", "复核主轴负载"],
        },
        {
            "id": "ALARM-700223",
            "title": "主轴过热报警说明",
            "content": "700223表示主轴过热，应检查冷却系统、负载和温度传感器。",
            "source_file": "演示数据/报警码",
            "alarm_code": "700223",
            "record_category": "fault",
            "knowledge_type": "alarm",
            "component": "主轴",
            "keywords": ["700223", "过热", "主轴"],
        },
        {
            "id": "CASE-LUBE-001",
            "title": "润滑油液位下降案例",
            "content": "液位持续下降时优先检查泄漏、供油泵和液位传感器。",
            "source_file": "演示数据/历史案例",
            "record_category": "case",
            "knowledge_type": "case",
            "component": "润滑系统",
            "keywords": ["润滑", "液位", "泄漏"],
        },
        {
            "id": "SOP-VIBRATION-001",
            "title": "主轴振动检查SOP",
            "content": "检查刀具、夹具、轴承和主轴动平衡，复测振动速度RMS。",
            "source_file": "演示数据/维修手册",
            "record_category": "sop",
            "knowledge_type": "sop",
            "component": "主轴",
            "keywords": ["振动", "轴承", "刀具"],
        },
        {
            "id": "MANUAL-SPINDLE-001",
            "title": "主轴系统维修手册",
            "content": "主轴系统维修前执行断电挂牌；检查冷却、润滑、轴承和温度传感器，维修后复测温度与振动参数。",
            "source_file": "演示数据/维修手册",
            "record_category": "manual",
            "knowledge_type": "manual",
            "component": "主轴",
            "keywords": ["主轴", "维修手册", "轴承", "温度传感器"],
        },
    ])
    data_dir = os.getenv("RAG_DATA_DIR", "").strip()
    if data_dir and Path(data_dir).is_dir():
        index.ingest_directory(data_dir)
    return index
