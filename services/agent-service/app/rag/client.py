"""RAG Service 客户端边界。

生产环境通过 HTTP 调用独立 rag-service；本地索引只作为无外部服务时的 Demo 回退。
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Mapping
from urllib.request import Request, urlopen

from .index import RAGIndex, build_default_index


_KNOWN_CONTROLLER_TRANSLATIONS = (
    ("Pointer with value zero is freed: {hex}", "控制器检测到空指针被释放（底层软件指针异常）"),
    ("Wrong memory pointer is freed: {hex}", "控制器检测到错误内存指针被释放（底层软件内存异常）"),
    ("The pointer value is 0", "控制器检测到指针值为 0（底层软件指针异常）"),
    ("An error occurred in controller software.", "控制器软件发生错误。"),
    ("Power off and restart the controller.", "关闭并重新启动控制器。"),
    ("Update the controller software.", "升级控制器软件。"),
    ("Contact ELITE ROBOTS after-sales service for assistance.", "联系设备厂家售后服务。"),
)


def _operator_text(value: Any) -> str:
    """在读取边界翻译已知的控制器底层消息。"""

    text = str(value or "")
    for source, target in _KNOWN_CONTROLLER_TRANSLATIONS:
        text = text.replace(source, target)
    return text


class RAGServiceClient:
    backend = "rag-service"

    def __init__(self, base_url: str | None = None, fallback: RAGIndex | None = None) -> None:
        # 远程访问由应用装配显式决定。保持裸客户端本地化，可以避免先前
        # 加载的项目 .env 改变独立 Agent/库调用的行为；编排器构建运行图时
        # 会注入 RAG_SERVICE_BASE_URL。
        configured_base_url = "" if base_url is None else base_url
        self.base_url = str(configured_base_url).strip().rstrip("/")
        # RAG 从依赖构造、文档查询到生成统一使用 REQUEST_TIMEOUT_MS；客户端
        # 不能在该预算结束前断开，并预留响应序列化和本机传输的五秒余量。
        request_budget = max(0.0, float(os.getenv("REQUEST_TIMEOUT_MS", "35000")) / 1000)
        self.timeout = max(float(os.getenv("RAG_SERVICE_TIMEOUT_SECONDS", "30")), request_budget + 5.0)
        explicit_fallback = os.getenv("RAG_ALLOW_LOCAL_FALLBACK")
        if explicit_fallback is None:
            self.allow_fallback = os.getenv("APP_ENV", "development").strip().lower() not in {"prod", "production"}
        else:
            self.allow_fallback = explicit_fallback.lower() in {"1", "true", "yes"}
        self.fallback = fallback or build_default_index()

    def search(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None) -> Dict[str, Any]:
        selected_filters = dict(filters or {})
        remote_query = self._build_remote_query(query, selected_filters)
        # 远程 API 契约将自然语言查询限制为 2000 个字符。模型生成的诊断
        # 上下文可能更长，因此在客户端边界截断，让检索平滑降级，而不是
        # 返回 HTTP 422。
        remote_query = remote_query[:2000]
        payload = {
            "query": remote_query,
            "top_n": limit,
            "filters": self._normalize_remote_filters(selected_filters),
        }
        if self.base_url:
            try:
                result = self._normalize_remote_search(self._post("/search", payload), query, selected_filters)
                scoped_device = str(selected_filters.get("device_id") or "").strip()
                alarm_active = bool(selected_filters.get("alarm_active")) and bool(scoped_device)
                if alarm_active and not result.get("documents"):
                    # 优先使用机器范围，但旧语料可能没有设备元数据。此时在
                    # 全库重试同一个报警查询，确保操作员得到有依据的证据，
                    # 而不是得到泛化的空答案。
                    fallback_filters = dict(selected_filters)
                    fallback_filters.pop("device_id", None)
                    fallback_filters.pop("device_model", None)
                    fallback_filters.pop("alarm_active", None)
                    fallback_query = self._build_remote_query(query, fallback_filters)[:2000]
                    fallback_payload = {
                        "query": fallback_query,
                        "top_n": limit,
                        "filters": self._normalize_remote_filters(fallback_filters),
                    }
                    fallback = self._normalize_remote_search(
                        self._post("/search", fallback_payload), query, fallback_filters
                    )
                    if fallback.get("documents"):
                        result = fallback
                    result["retrieval_scope"] = "all"
                    result["retrieval_fallback"] = True
                    result["retrieval_fallback_reason"] = "当前报警机器无匹配证据，已扩大到全库检索"
                if self.allow_fallback and result.get("degraded") and not result.get("documents"):
                    # 远程检索器已降级且没有命中时，切换到本地索引，避免把空答案交给用户。
                    local = self._humanize_result(
                        self.fallback.search(query, limit=limit, filters=self._fallback_filters(selected_filters))
                    )
                    if local.get("documents"):
                        local["connection_status"] = "remote_degraded_local_fallback"
                        local["degraded"] = True
                        local["remote_base_url"] = self.base_url
                        local["warning"] = str(result.get("degrade_reason") or "远程检索降级，已使用本地知识索引")
                        local["retrieval_scope"] = self._fallback_scope(selected_filters)
                        local["retrieval_fallback"] = True
                        local["retrieval_fallback_reason"] = "远程检索无命中，已使用本地知识索引"
                        result = local
                if "retrieval_scope" not in result:
                    result["retrieval_scope"] = "device" if alarm_active else "all"
                    result["retrieval_fallback"] = False
                result.setdefault("backend", "remote-rag-service")
                result.setdefault("connection_status", "connected")
                result.setdefault("degraded", False)
                return result
            except Exception as error:
                if not self.allow_fallback:
                    raise
                result = self._humanize_result(self.fallback.search(query, limit=limit, filters=self._fallback_filters(selected_filters)))
                result["connection_status"] = "remote_unavailable_fallback"
                result["degraded"] = True
                result["remote_base_url"] = self.base_url
                result["warning"] = "%s: %s" % (type(error).__name__, error)
                result["retrieval_scope"] = self._fallback_scope(selected_filters)
                result["retrieval_fallback"] = result["retrieval_scope"] == "all" and bool(selected_filters.get("alarm_active"))
                if result["retrieval_fallback"]:
                    result["retrieval_fallback_reason"] = "远程服务不可用，当前仅有全库本地索引"
                return result
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        result = self._humanize_result(self.fallback.search(query, limit=limit, filters=self._fallback_filters(selected_filters)))
        result["connection_status"] = "local_fallback"
        result["degraded"] = True
        result["remote_base_url"] = ""
        result["warning"] = "RAG_SERVICE_BASE_URL 未配置，当前使用本地演示知识索引。"
        result["retrieval_scope"] = self._fallback_scope(selected_filters)
        result["retrieval_fallback"] = result["retrieval_scope"] == "all" and bool(selected_filters.get("alarm_active"))
        if result["retrieval_fallback"]:
            result["retrieval_fallback_reason"] = "当前本地索引没有设备元数据，已使用全库检索"
        return result

    def _fallback_scope(self, filters: Mapping[str, Any]) -> str:
        active = bool(filters.get("alarm_active")) and bool(str(filters.get("device_id") or "").strip())
        if not active:
            return "all"
        records = getattr(self.fallback, "_records", {})
        has_device_metadata = any(str(item.get("device_id") or "").strip() for item in records.values())
        return "device" if has_device_metadata else "all"

    @staticmethod
    def _humanize_result(result: Dict[str, Any]) -> Dict[str, Any]:
        """在不重新入库的情况下保持旧版/本地索引文档可读。"""

        payload = dict(result or {})
        documents = []
        for item in payload.get("documents") or []:
            document = dict(item)
            raw_content = str(document.get("content") or "")
            document.setdefault("raw_content", raw_content)
            document["content"] = _operator_text(raw_content)
            documents.append(document)
        payload["documents"] = documents
        return payload

    @staticmethod
    def _build_remote_query(query: str, filters: Mapping[str, Any]) -> str:
        """将结构化标识加入远程自然语言查询。

        独立 RAG API 按语料库过滤，报警和部件字段则保存在片段元数据中。
        将这些标识加入查询可保留精确编码检索能力，无需更改 RAG 服务契约。
        """
        text = str(query or "").strip()
        additions = []
        for key, label in (("alarm_code", "报警码"), ("error_code", "故障码"), ("component", "部件"), ("device_id", "设备")):
            value = str(filters.get(key) or "").strip()
            if value and value.lower() not in text.lower():
                additions.append(f"{label} {value}")
        return " ".join([text, *additions]).strip()

    @staticmethod
    def _normalize_remote_filters(filters: Mapping[str, Any]) -> Dict[str, Any]:
        """将 Agent 知识过滤条件映射为 RAG 服务索引的字段。"""

        corpus_by_type = {
            "alarm": "alarms",
            "case": "cases",
            "sop": "sop",
            "manual": "manuals",
            "bom": "bom",
        }
        result: Dict[str, Any] = {}
        knowledge_type = str(filters.get("knowledge_type") or "").strip().lower()
        if knowledge_type in corpus_by_type:
            result["corpus"] = corpus_by_type[knowledge_type]
        for key in ("corpus", "source_format", "source_name", "project_id", "tenant_id"):
            value = filters.get(key)
            if value not in (None, "", [], {}):
                result[key] = value
        # 当前机器是检索的硬边界。报警/部件标识仍作为查询提示，因为旧的
        # 维修记录可能没有填充这些元数据；硬过滤会隐藏同一机器的有效步骤。
        for key in ("device_id", "device_model"):
            value = filters.get(key)
            if value not in (None, "", [], {}):
                result[key] = value
        return result

    def _fallback_filters(self, filters: Mapping[str, Any]) -> Dict[str, Any]:
        """在本地回退索引包含该元数据时保留机器范围。

        内置演示索引早于设备元数据。在降级模式下，设备 ID 会保留在查询文本中，
        而远程 RAG 仍应用严格的元数据边界。
        """

        selected = {
            key: value
            for key, value in dict(filters or {}).items()
            if key not in {"alarm_active", "alarm_code", "error_code", "component"}
            and value not in (None, "", [], {})
        }
        records = getattr(self.fallback, "_records", {})
        has_device_metadata = any(str(item.get("device_id") or "").strip() for item in records.values())
        if not has_device_metadata:
            selected.pop("device_id", None)
            selected.pop("device_model", None)
        return selected

    @staticmethod
    def _normalize_remote_search(
        result: Mapping[str, Any],
        query: str,
        filters: Mapping[str, Any] | None,
    ) -> Dict[str, Any]:
        """将独立 RAG 的 ``hits`` 契约适配为 Agent 的 ``documents``。

        检索服务有意暴露面向片段的字段，而 Agent 工具暴露面向文档的字段。
        将适配器保留在 HTTP 边界，可让两个服务继续使用各自的原生契约。
        """

        payload = dict(result)
        documents = []
        for hit in result.get("hits") or []:
            if not isinstance(hit, Mapping):
                continue
            metadata = dict(hit.get("metadata") or {})
            corpus_to_type = {
                "alarms": "alarm",
                "cases": "case",
                "manuals": "manual",
                "sop": "sop",
                "bom": "bom",
            }
            if not metadata.get("knowledge_type") and metadata.get("corpus") in corpus_to_type:
                metadata["knowledge_type"] = corpus_to_type[metadata["corpus"]]
            chunk_id = str(hit.get("chunk_id") or hit.get("id") or "")
            source = str(
                metadata.get("source_name")
                or metadata.get("source_path")
                or hit.get("source")
                or "remote-rag-service"
            )
            documents.append(
                {
                    "document_id": chunk_id,
                    "chunk_id": chunk_id,
                    "title": source,
                    "content": _operator_text(hit.get("text") or ""),
                    "raw_content": str(hit.get("text") or ""),
                    "source": source,
                    "score": hit.get("score", 0.0),
                    "metadata": metadata,
                }
            )
        payload["query"] = str(result.get("query") or query)
        payload["filters"] = dict(filters or {})
        payload["documents"] = documents
        payload["total"] = len(documents)
        payload["found"] = bool(documents)
        payload["success"] = True
        payload["source"] = "remote-rag-service"
        return payload

    def ingest_jsonl(self, path: str, collection: str = "") -> Dict[str, Any]:
        payload = {"path": path, "collection": collection}
        if self.base_url:
            try:
                return self._post("/documents/ingest", payload)
            except Exception:
                if not self.allow_fallback:
                    raise
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        return self.fallback.ingest_jsonl(path, collection=collection)

    def upsert(self, record: Mapping[str, Any], collection: str = "", *, require_remote: bool = False) -> Dict[str, Any]:
        """写入一条经验记录；远程 RAG 不支持时按配置回退到本地索引。"""

        if self.base_url:
            try:
                normalized = dict(record)
                normalized.setdefault("document_id", str(normalized.get("experience_id") or normalized.get("id") or ""))
                normalized.setdefault("content", str(normalized.get("content") or ""))
                normalized.setdefault("metadata", {key: value for key, value in normalized.items() if key not in {"content", "document_id"}})
                normalized["collection"] = collection or normalized.get("collection") or "maint_fault_events"
                return self._post("/documents/upsert", normalized)
            except Exception:
                if require_remote or not self.allow_fallback:
                    raise
        if require_remote:
            raise RuntimeError('知识沉淀要求远程 RAG 索引，服务地址未配置')
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        loaded = self.fallback.upsert([record], collection=collection)
        return {"loaded": loaded, "backend": self.fallback.backend}

    def fetch_document(self, document_id: str) -> Dict[str, Any]:
        payload = {"document_id": str(document_id or "")}
        if self.base_url:
            try:
                return self._get("/documents/%s" % payload["document_id"])
            except Exception:
                if not self.allow_fallback:
                    raise
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        return self.fallback.fetch_document(payload["document_id"])

    def fetch_chunk(self, document_id: str, chunk_id: str = "") -> Dict[str, Any]:
        payload = {"document_id": str(document_id or ""), "chunk_id": str(chunk_id or "")}
        if self.base_url:
            try:
                return self._get("/documents/%s/chunks/%s" % (payload["document_id"], payload["chunk_id"]))
            except Exception:
                if not self.allow_fallback:
                    raise
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        return self.fallback.fetch_chunk(payload["document_id"], payload["chunk_id"])

    def status(self) -> Dict[str, Any]:
        if self.base_url:
            try:
                # 独立 RAG 服务通过 /health 暴露就绪状态。保持面向 Agent 的
                # 状态结构，同时使用公开契约，不依赖不存在的 /status 路由。
                result = self._get("/health")
                result.setdefault("backend", "remote-rag-service")
                result["connected"] = True
                result["connection_status"] = "connected"
                result["remote_base_url"] = self.base_url
                # HTTP 连通性和依赖就绪是两件事。远程服务可能可访问，但其中
                # 一个可选阶段（例如重排器）仍然不可用。
                component_keys = ("milvus", "whoosh", "embedding", "reranker", "llm")
                result["degraded"] = not all(bool(result.get(key)) for key in component_keys)
                return result
            except Exception as error:
                if not self.allow_fallback:
                    raise
                return {
                    "backend": "local-rag-fallback",
                    "connected": False,
                    "degraded": True,
                    "connection_status": "remote_unavailable_fallback",
                    "remote_base_url": self.base_url,
                    "warning": "%s: %s" % (type(error).__name__, error),
                    "record_count": self.fallback.count(),
                    "collections": self.fallback.collections(),
                }
        if not self.allow_fallback:
            raise RuntimeError("RAG_SERVICE_BASE_URL 未配置且已禁止本地回退")
        return {
            "backend": "local-rag-fallback",
            "connected": False,
            "degraded": True,
            "connection_status": "local_fallback",
            "remote_base_url": "",
            "warning": "RAG_SERVICE_BASE_URL 未配置，当前使用本地演示知识索引。",
            "record_count": self.fallback.count(),
            "collections": self.fallback.collections(),
        }

    def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        request = Request(
            self.base_url + path,
            data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            method="POST",
            headers={"Content-Type": "application/json", "Accept": "application/json"},
        )
        with urlopen(request, timeout=self.timeout) as response:
            value = json.loads(response.read().decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("RAG Service 返回格式错误")
        return value

    def _get(self, path: str) -> Dict[str, Any]:
        request = Request(self.base_url + path, method="GET", headers={"Accept": "application/json"})
        with urlopen(request, timeout=self.timeout) as response:
            value = json.loads(response.read().decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("RAG Service 返回格式错误")
        return value
