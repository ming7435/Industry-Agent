"""工业知识检索 Agent，负责生成可追踪 Evidence Pack。"""

from __future__ import annotations

from math import isfinite
import re
from typing import Any, Mapping

from app.tools.registry import ToolRegistry
from app.contracts import KnowledgeDocument, KnowledgeResult
from app.agents.base import BaseAgent

from .graph import build_knowledge_graph
from .confidence import calculate_confidence


_ALARM_CODE_RE = re.compile(r"\b[A-Z]?\d{3,6}\b", re.IGNORECASE)


class KnowledgeAgent(BaseAgent):
    name = "knowledge"
    capabilities = ("document_search", "historical_case_search", "evidence_retrieval")

    def __init__(self, tools: ToolRegistry | None = None) -> None:
        self.tools = tools or ToolRegistry()
        self.graph = build_knowledge_graph()

    def search_knowledge(
        self,
        query: str,
        limit: int = 8,
        filters: Mapping[str, Any] | None = None,
        required_sources: list[str] | None = None,
    ) -> KnowledgeResult:
        query = str(query or "").strip()
        query_type = self._classify_query(query, filters or {}, required_sources or [])
        selected_filters = self._build_filters(query, query_type, filters or {})
        raw = self.tools.execute("search_knowledge", {"query": query, "limit": limit, "filters": selected_filters})
        documents = self._deduplicate_documents(raw.get("documents", []))
        status = "completed" if documents else "insufficient_evidence"
        evidence = self._evidence_from_documents(documents)
        confidence_details = self._confidence_details(
            documents, required_sources or [], query=query, degraded=bool(raw.get("degraded", False))
        )
        confidence = confidence_details["overall"]
        retrieval_scope = str(raw.get("retrieval_scope") or ("device" if selected_filters.get("device_id") else "all"))
        return KnowledgeResult(
            query=query,
            status=status,
            query_type=query_type,
            summary=self._summary(query, documents, status),
            answer=self._format_grounded_answer(
                str(raw.get("answer") or ""),
                query=query,
                documents=[item.model_dump(mode="json") for item in documents],
                retrieval_scope=retrieval_scope,
            ),
            evidence=evidence,
            possible_causes=self._possible_causes(documents),
            recommended_checks=self._recommended_checks(documents),
            confidence=confidence,
            documents=documents,
            sources=self._sources(documents),
            filters=selected_filters,
            total=len(documents),
            backend_status=raw.get("connection_status", "unknown"),
            degraded=bool(raw.get("degraded", False)),
            warning=str(raw.get("warning") or ""),
            source=raw.get("source", "rag-service-compatible"),
            confidence_details=confidence_details,
            retrieval_scope=retrieval_scope,
            retrieval_fallback=bool(raw.get("retrieval_fallback", False)),
            retrieval_fallback_reason=str(raw.get("retrieval_fallback_reason") or ""),
        )

    def run(self, task: Any) -> KnowledgeResult:
        payload = {"query": task} if isinstance(task, str) else dict(task or {})
        output = self.graph.invoke({"agent": self, "request": payload})
        result = output.get("result")
        if result is None:
            raise RuntimeError("Knowledge LangGraph 未生成结果")
        return result

    @staticmethod
    def _classify_query(query: str, filters: Mapping[str, Any], required_sources: list[str]) -> str:
        text = " ".join([query, " ".join(str(item) for item in required_sources), " ".join(str(value) for value in filters.values())]).lower()
        if filters.get("alarm_code") or _ALARM_CODE_RE.search(query):
            return "alarm"
        if any(token in text for token in ("manual", "手册", "维修手册")):
            return "manual"
        # “怎么检查”描述的是请求的操作，不是知识来源。没有明确的 SOP/流程
        # 标记时保留混合检索，让案例和手册共同提供互补检查步骤。
        if any(token in text for token in ("sop", "标准作业", "规程", "作业指导")):
            return "sop"
        if any(token in text for token in ("案例", "历史", "经验", "case")):
            return "case"
        if any(token in text for token in ("bom", "零件", "物料", "part")):
            return "engineering"
        return "hybrid"

    @staticmethod
    def _build_filters(query: str, query_type: str, filters: Mapping[str, Any]) -> dict[str, Any]:
        selected = {key: value for key, value in dict(filters or {}).items() if value not in (None, "", [])}
        if query_type == "alarm" and not selected.get("alarm_code"):
            match = _ALARM_CODE_RE.search(query)
            if match:
                selected["alarm_code"] = match.group(0).upper()
        if query_type == "sop" and not selected.get("knowledge_type"):
            selected["knowledge_type"] = "sop"
        if query_type == "manual" and not selected.get("knowledge_type"):
            selected["knowledge_type"] = "manual"
        if query_type == "case" and not selected.get("knowledge_type"):
            selected["knowledge_type"] = "case"
        return selected

    @staticmethod
    def _deduplicate_documents(items: list[Mapping[str, Any]]) -> list[KnowledgeDocument]:
        best: dict[str, Mapping[str, Any]] = {}
        for item in items:
            key = str(item.get("document_id") or "%s|%s" % (item.get("title"), item.get("source")))
            previous = best.get(key)
            if previous is None or KnowledgeAgent._nonnegative_score(item.get("score")) > KnowledgeAgent._nonnegative_score(previous.get("score")):
                best[key] = item
        ordered = sorted(best.values(), key=lambda value: KnowledgeAgent._nonnegative_score(value.get("score")), reverse=True)
        scale = max(1.0, *(KnowledgeAgent._nonnegative_score(item.get("score")) for item in ordered))
        return [KnowledgeDocument(**{**item, "score": KnowledgeAgent._nonnegative_score(item.get("score")) / scale}) for item in ordered]

    @staticmethod
    def _nonnegative_score(value: Any) -> float:
        """清理外部检索分数；本批次的最大值会用于 0~1 归一化。"""

        try:
            score = float(value or 0.0)
        except (TypeError, ValueError):
            score = 0.0
        if not isfinite(score):
            return 0.0
        return max(0.0, score)

    @staticmethod
    def _evidence_from_documents(documents: list[KnowledgeDocument]) -> list[dict[str, Any]]:
        evidence = []
        for doc in documents:
            evidence.append({
                "document_id": doc.document_id,
                "title": doc.title,
                "source": doc.source,
                "score": doc.score,
                "collection": doc.metadata.get("collection", ""),
                "knowledge_type": doc.metadata.get("knowledge_type", ""),
                "component": doc.metadata.get("component", ""),
                "content": doc.content,
            })
        return evidence

    @staticmethod
    def _summary(query: str, documents: list[KnowledgeDocument], status: str) -> str:
        if status != "completed":
            return "未检索到与“%s”直接相关的可追踪知识证据。" % query
        titles = "、".join(doc.title for doc in documents[:3])
        return "检索到 %s 条相关知识证据：%s。" % (len(documents), titles)

    @staticmethod
    def _format_grounded_answer(
        answer: str,
        query: str,
        documents: list[Mapping[str, Any]],
        retrieval_scope: str,
    ) -> str:
        """规范化模型回答，并确保末尾有简明总结。"""

        text = KnowledgeAgent._remove_internal_disclaimers(str(answer or "").strip())
        if not text:
            text = KnowledgeAgent._fallback_answer(query, documents)
        if not text:
            return "暂未检索到直接相关知识。请补充设备编号、报警码或故障现象后重试。"
        blocks = []
        seen: set[str] = set()
        for block in re.split(r"\n\s*\n", text):
            normalized = re.sub(r"\s+", " ", block).strip()
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            blocks.append(block.strip())
        text = "\n\n".join(blocks)
        if re.search(r"(?:最后总结|结论总结|总结)\s*[：:]", text):
            return text
        scope_text = "当前报警机器" if retrieval_scope == "device" else "全库"
        evidence_text = "已返回 %d 条可追踪证据" % len(documents) if documents else "暂无足够可追踪证据"
        return "%s\n\n**最后总结：** 本次按%s优先级检索，%s；优先执行回答中的第一项检查，发现异常时停止相关动作并补充现场数据。" % (
            text,
            scope_text,
            evidence_text,
        )

    @staticmethod
    def _fallback_answer(query: str, documents: list[Mapping[str, Any]]) -> str:
        """模型降级时依据已命中的证据生成可读的中文答案。"""
        entries: list[str] = []
        seen: set[str] = set()
        for item in documents[:3]:
            title = re.sub(r"\s+", " ", str(item.get("title") or "相关知识")).strip()
            content = re.sub(r"\s+", " ", str(item.get("content") or "")).strip()
            content = KnowledgeAgent._clean_evidence_text(content)
            if not content:
                continue
            if len(content) > 260:
                content = content[:260].rstrip("，。；; ") + "…"
            key = "%s|%s" % (title, content)
            if key in seen:
                continue
            seen.add(key)
            entries.append("**%s：** %s" % (title, content))
        if not entries:
            return ""
        return "针对“%s”，已整理出以下可执行知识：\n\n%s" % (str(query or "设备问题").strip(), "\n".join(entries))

    @staticmethod
    def _remove_internal_disclaimers(text: str) -> str:
        """移除面向内部审计的手册/原文提示，保留实际诊断和操作内容。"""
        if not text:
            return ""
        cleaned = re.sub(
            r"(?:具体操作)?\s*(?:请|建议)?以[^。！？\n]{0,100}(?:手册|原文|官方资料)[^。！？\n]{0,30}(?:为准|参考)[。！？]?",
            "",
            text,
            flags=re.IGNORECASE,
        )
        return re.sub(r"\n{3,}", "\n\n", cleaned).strip()

    @staticmethod
    def _clean_evidence_text(text: str) -> str:
        """清理检索元数据，只向用户呈现证据中的业务句子。"""
        structured_metadata = bool(re.search(r"文档\s*[:：]|内容类型\s*[:：]|\[(?:table|cad_drawing)\b|表格行\d+", text, re.IGNORECASE))
        cleaned = KnowledgeAgent._remove_internal_disclaimers(text)
        cleaned = re.sub(r"本地OCR识别结果(?:（[^）]*）|\([^)]*\))?\s*[:：]?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(
            r"文档\s*[:：]\s*\S+\s+页码\s*[:：]\s*\d+\s+内容类型\s*[:：]\s*\S+\s*",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(r"\[(?:table|cad_drawing)[^\]]*\]\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"表格行\d+\s*[:：]\s*", "", cleaned)
        cleaned = re.sub(r"(?:故障名称|部件/系统|安全等级)\s+[^·。；:：]+[·:：]\s*", "", cleaned)
        cleaned = re.sub(
            r"(?:报警码|英文原名|可能原因|复位与验证|前置条件|作业步骤|安全要求)\s+"
            r"(?:[A-Za-z_./-]+\s*)?(?:[；;:：])\s*",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(
            r"\b(?:alarm_code|alarm_message_en|fault_name_zh|possible_causes_zh|verification_zh|"
            r"preconditions|steps|safetywarnings|component|safetylevel|severity|severity_zh|"
            r"subsystem_zh|cnc_system|acceptance_criteria)\b\s*[/_ ]*\s*[:：;；]?\s*",
            "",
            cleaned,
            flags=re.IGNORECASE,
        )
        cleaned = re.sub(r"\b(?:Tool\s+probe\s+up/down\s+error|barfeeder/critical|Toolsetter\s+location\s+switch\s+error)\b", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"安全要求\s*[_-]?\s*", "", cleaned)
        if structured_metadata:
            clauses = []
            seen: set[str] = set()
            for clause in re.split(r"\s*[。！？；;:：]\s*", cleaned):
                normalized = re.sub(r"\s+", " ", clause).strip(" ，,·")
                if not normalized or not re.search(r"[\u4e00-\u9fff]", normalized):
                    continue
                key = re.sub(r"[\d\W_]+", "", normalized)
                if key and key not in seen:
                    seen.add(key)
                    clauses.append(normalized)
            return "；".join(clauses).strip()
        clauses = []
        seen: set[str] = set()
        for clause in re.split(r"\s*[；;]\s*", cleaned):
            normalized = re.sub(r"\s+", " ", clause).strip(" ，,。:：")
            if normalized and normalized not in seen:
                seen.add(normalized)
                clauses.append(normalized)
        return "；".join(clauses).strip()

    @staticmethod
    def _possible_causes(documents: list[KnowledgeDocument]) -> list[str]:
        causes = []
        for doc in documents:
            metadata = doc.metadata
            for key in ("cause", "symptom", "description"):
                value = str(metadata.get(key) or "").strip()
                if value and value not in causes:
                    causes.append(value)
        return causes[:5]

    @staticmethod
    def _recommended_checks(documents: list[KnowledgeDocument]) -> list[str]:
        checks = []
        for doc in documents:
            raw = doc.metadata.get("checks") or doc.metadata.get("remedy") or doc.metadata.get("safe_action")
            values = raw if isinstance(raw, list) else [raw]
            for value in values:
                text = str(value or "").strip()
                if text and text not in checks:
                    checks.append(text)
        if not checks:
            # 文档正文属于证据，不是可直接执行的检查项；正文由证据区单独展示。
            return []
        return checks[:6]

    @staticmethod
    def _sources(documents: list[KnowledgeDocument]) -> list[str]:
        sources = []
        for doc in documents:
            if doc.source and doc.source not in sources:
                sources.append(doc.source)
        return sources

    @staticmethod
    def _dedupe(items: list[str]) -> list[str]:
        values: list[str] = []
        for item in items:
            if item and item not in values:
                values.append(item)
        return values

    @staticmethod
    def _confidence_details(
        documents: list[KnowledgeDocument],
        required_sources: list[str],
        query: str = "",
        degraded: bool = False,
    ) -> dict[str, Any]:
        return calculate_confidence(
            [item.model_dump(mode="json") for item in documents],
            required_sources,
            query=query,
            degraded=degraded,
        )

    @classmethod
    def _confidence(cls, documents: list[KnowledgeDocument], required_sources: list[str]) -> float:
        return cls._confidence_details(documents, required_sources)["overall"]

    @classmethod
    def _confidence_from_documents(cls, documents: list[Mapping[str, Any]], required_sources: list[str]) -> float:
        normalized = cls._deduplicate_documents(documents)
        return cls._confidence_details(normalized, required_sources)["overall"]

    def _build_result(
        self,
        request: Mapping[str, Any],
        query: str,
        query_type: str,
        documents: list[Mapping[str, Any]],
        evidence: list[Mapping[str, Any]],
        status: str,
        observations: list[Mapping[str, Any]],
        validation_findings: list[str],
    ) -> KnowledgeResult:
        normalized = self._deduplicate_documents(documents)
        required_sources = list(request.get("required_sources") or [])
        raw_results = [item.get("result") or {} for item in observations if isinstance(item, Mapping)]
        degraded = any(bool(item.get("degraded")) for item in raw_results)
        confidence_details = self._confidence_details(
            normalized,
            required_sources,
            query=query,
            degraded=degraded,
        )
        confidence = confidence_details["overall"]
        backend_status = next((str(item.get("connection_status")) for item in raw_results if item.get("connection_status")), "unknown")
        source = next((str(item.get("source")) for item in raw_results if item.get("source")), "rag-service-compatible")
        warning_items = [str(item.get("warning")) for item in raw_results if item.get("warning")]
        warning_items.extend(str(item.get("error")) for item in observations if item.get("error"))
        degraded = any(bool(item.get("degraded")) for item in raw_results)
        summary = self._summary(query, normalized, status)
        if validation_findings and status != "completed":
            summary += " 当前结果不满足所需证据覆盖条件。"
        answer = next(
            (str(item.get("answer") or "").strip() for item in raw_results if str(item.get("answer") or "").strip()),
            "",
        )
        retrieval_scope = next(
            (str(item.get("retrieval_scope") or "") for item in raw_results if str(item.get("retrieval_scope") or "").strip()),
            "device" if (request.get("filters") or {}).get("device_id") else "all",
        )
        retrieval_fallback = any(bool(item.get("retrieval_fallback")) for item in raw_results)
        retrieval_fallback_reason = next(
            (str(item.get("retrieval_fallback_reason") or "") for item in raw_results if str(item.get("retrieval_fallback_reason") or "").strip()),
            "",
        )
        answer = self._format_grounded_answer(answer, query=query, documents=[item.model_dump(mode="json") for item in normalized], retrieval_scope=retrieval_scope)
        return KnowledgeResult(
            query=query,
            status=status,
            query_type=query_type,
            summary=summary,
            answer=answer,
            evidence=[dict(item) for item in evidence],
            possible_causes=self._possible_causes(normalized),
            recommended_checks=self._recommended_checks(normalized),
            confidence=confidence,
            documents=normalized,
            sources=self._sources(normalized),
            filters=dict(request.get("filters") or {}),
            total=len(normalized),
            backend_status=backend_status,
            degraded=degraded,
            warning="；".join(self._dedupe(warning_items)),
            source=source,
            validation_findings=list(validation_findings),
            stop_reason="evidence_ready" if status == "completed" else "insufficient_evidence",
            retrieval_trace=[dict(item) for item in observations],
            confidence_details=confidence_details,
            retrieval_scope=retrieval_scope,
            retrieval_fallback=retrieval_fallback,
            retrieval_fallback_reason=retrieval_fallback_reason,
        )
