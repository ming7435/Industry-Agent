"""全局 Tool Registry，所有 Agent 通过此层访问外部能力。"""

from __future__ import annotations

from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
from typing import Any, Dict, Mapping

from app.mcp.client import McpClient
from app.mcp.workorder import WorkOrderMcpAdapter
from app.rag import RAGIndex, RAGServiceClient
from app.tools.diagnosis import get_alarm_definition, get_device_history, get_device_logs, get_device_status
from app.tools.knowledge import (
    fetch_chunk as fetch_knowledge_chunk,
    fetch_document as fetch_knowledge_document,
    search_alarm_knowledge as search_alarm_knowledge_tool,
    search_fault_cases as search_fault_cases_tool,
    search_knowledge as search_knowledge_tool,
    search_manual as search_manual_tool,
    search_semantic_memory as search_semantic_memory_tool,
    search_sop as search_sop_tool,
)
from app.trace import TraceRecorder


class ToolRegistry:
    def __init__(self, base_url: str | None = None, rag_index: RAGIndex | None = None, rag_client: RAGServiceClient | None = None, trace: TraceRecorder | None = None, cad_base_url: str | None = None) -> None:
        self.base_url = base_url
        self.cad_base_url = (cad_base_url or os.getenv("MCP_CAD_URL") or os.getenv("CAD_SERVICE_BASE_URL") or "").rstrip("/")
        self.rag = rag_client or RAGServiceClient(fallback=rag_index)
        self.trace = trace
        self.workorder_mcp = WorkOrderMcpAdapter()
        self.mcp = McpClient({
            "get_alarm_definition": get_alarm_definition,
            "get_device_history": self._get_device_history,
            "get_device_logs": get_device_logs,
            "get_device_status": self.get_device_status,
            "get_production_status": self.get_production_status,
            "intent_classifier_tool": self.intent_classifier_tool,
            "search_knowledge": lambda **arguments: search_knowledge_tool(self.rag, **arguments),
            "search_alarm_knowledge": lambda **arguments: search_alarm_knowledge_tool(self.rag, **arguments),
            "search_sop": lambda **arguments: search_sop_tool(self.rag, **arguments),
            "search_manual": lambda **arguments: search_manual_tool(self.rag, **arguments),
            "search_fault_cases": lambda **arguments: search_fault_cases_tool(self.rag, **arguments),
            "search_semantic_memory": lambda **arguments: search_semantic_memory_tool(self.rag, **arguments),
            "fetch_document": lambda **arguments: fetch_knowledge_document(self.rag, **arguments),
            "fetch_chunk": lambda **arguments: fetch_knowledge_chunk(self.rag, **arguments),
            "document_parser": self.document_parser,
            "query_cad": self.query_cad,
            "query_bom": self.query_bom,
            "query_part": self.query_part,
            "query_part_relation": self.query_part_relation,
            "query_assembly_relation": self.query_assembly_relation,
            "get_drawing_metadata": self.get_drawing_metadata,
            "get_component_location": self.get_component_location,
            "query_drawing": self.query_drawing,
            "query_relation": self.query_relation,
            "fetch_engineering_record": self.fetch_engineering_record,
            "generate_repair_plan": self.generate_repair_plan,
            "query_spare_part": self.query_spare_part,
            "query_inventory": self.query_inventory,
            "query_stock": self.query_inventory,
            "query_part_availability": self.query_part_availability,
            "get_workorder_template": self.get_workorder_template,
            "submit_workorder_draft": self.submit_workorder_draft,
            "create_workorder": self.workorder_mcp.create_workorder,
            "update_workorder": self.workorder_mcp.update_workorder,
            "get_workorder": self.workorder_mcp.get_workorder,
            "query_workorder": self.workorder_mcp.get_workorder,
            "list_workorders": self.workorder_mcp.list_workorders,
            "assign_workorder": self.workorder_mcp.assign_workorder,
            "submit_repair_feedback": self.workorder_mcp.submit_repair_feedback,
            "mark_repair_completed": self.workorder_mcp.mark_repair_completed,
            "close_workorder": self.workorder_mcp.close_workorder,
            "reopen_workorder": self.workorder_mcp.reopen_workorder,
            "verify_repair": self.workorder_mcp.verify_repair,
            "check_sop": self.check_sop,
            "generate_report": self.generate_report,
            "ingest_knowledge": self.ingest_knowledge,
        }, base_urls={"cad": self.cad_base_url})

    def _get_device_history(self, **arguments: Any) -> Dict[str, Any]:
        """读取设备历史趋势，并把当前工厂地址注入工具调用。"""

        return get_device_history(base_url=self.base_url, **arguments)

    def get_device_status(self, device_id: str, **_: Any) -> Dict[str, Any]:
        return get_device_status(device_id=device_id, base_url=self.base_url)

    def get_production_status(self, device_id: str = "", **_: Any) -> Dict[str, Any]:
        return {
            "device_id": device_id,
            "line": "A线",
            "status": "running",
            "cycle_state": "processing",
            "source": "MES-MCP-compatible",
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }

    def intent_classifier_tool(self, user_text: str, **_: Any) -> Dict[str, Any]:
        text = str(user_text or "").lower()
        if re.search(r"\b(?:e|alm)[-]?\d{2,6}\b", text) and any(keyword in text for keyword in ("什么", "含义", "处理", "步骤", "说明")):
            return {"intent": "knowledge", "confidence": 0.92, "source": "local-intent-classifier"}
        candidates = {
            "diagnosis": ("诊断", "故障", "报警", "异常"),
            "knowledge": ("手册", "sop", "规范", "案例", "怎么检查"),
            "quality": ("验收", "质检", "是否恢复"),
            "report": ("报告", "日报", "维修记录"),
            "workorder_action": ("工单", "派工", "创建工单", "查询工单", "关闭工单"),
            "maintenance": ("维修方案", "怎么修", "怎么维修", "维修步骤", "检修", "维修", "修理", "维护", "保养"),
            "cad": ("cad", "bom", "图纸", "结构", "零件", "物料", "位置", "在哪里", "部件", "组件", "传感器", "装配", "关系"),
        }
        intent = "unknown"
        for name, keywords in candidates.items():
            if any(keyword.lower() in text for keyword in keywords):
                intent = name
                break
        return {"intent": intent, "confidence": 0.92 if intent != "unknown" else 0.2, "source": "local-intent-classifier"}

    def search_knowledge(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_knowledge_tool(self.rag, query, limit=limit, filters=filters)

    def search_alarm_knowledge(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, alarm_code: str = "", **_: Any) -> Dict[str, Any]:
        return search_alarm_knowledge_tool(self.rag, query, limit=limit, filters=filters, alarm_code=alarm_code)

    def search_sop(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_sop_tool(self.rag, query, limit=limit, filters=filters)

    def search_manual(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_manual_tool(self.rag, query, limit=limit, filters=filters)

    def search_fault_cases(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_fault_cases_tool(self.rag, query, limit=limit, filters=filters)

    def search_semantic_memory(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_semantic_memory_tool(self.rag, query, limit=limit, filters=filters)

    def fetch_document(self, document_id: str = "", **_: Any) -> Dict[str, Any]:
        return fetch_knowledge_document(self.rag, document_id)

    def fetch_chunk(self, document_id: str = "", chunk_id: str = "", **_: Any) -> Dict[str, Any]:
        return fetch_knowledge_chunk(self.rag, document_id, chunk_id)

    def ingest_knowledge(self, path: str, collection: str = "", **_: Any) -> Dict[str, Any]:
        return self.rag.ingest_jsonl(path, collection=collection)

    def rag_status(self, **_: Any) -> Dict[str, Any]:
        return self.rag.status()

    def query_cad(self, query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
        components = self._engineering_components()
        lookup = part_no or component or query
        matched = self._match_components(lookup, components)
        return {
            "query": lookup,
            "device_id": device_id,
            "components": matched,
            "drawings": [self._drawing_for(item) for item in matched],
            "source": "cad-mcp-compatible",
        }

    def query_bom(self, query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
        lookup = part_no or component or query
        components = self._match_components(lookup, self._engineering_components())
        items = [self._bom_for(item) for item in components]
        return {"query": lookup, "device_id": device_id, "components": components, "bom_items": items, "source": "bom-mcp-compatible"}

    def query_part(self, query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
        lookup = part_no or component or query
        components = self._match_components(lookup, self._engineering_components())
        return {"query": lookup, "device_id": device_id, "parts": components, "source": "part-mcp-compatible"}

    def query_part_relation(self, part_no: str = "", component_id: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        lookup = part_no or component_id or query
        components = self._match_components(lookup, self._engineering_components())
        relations = [self._relation_for(item) for item in components]
        return {"query": lookup, "relations": relations, "source": "cad-relation-mcp-compatible"}

    def query_assembly_relation(self, component_id: str = "", component: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        lookup = component_id or part_no or component or query
        components = self._match_components(lookup, self._engineering_components())
        relations = [self._relation_for(item) for item in components]
        return {"query": lookup, "assembly_relations": relations, "source": "assembly-mcp-compatible"}

    def get_drawing_metadata(self, component_id: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        lookup = component_id or part_no or query
        components = self._match_components(lookup, self._engineering_components())
        drawings = [self._drawing_for(item) for item in components]
        return {"query": lookup, "drawings": drawings, "source": "drawing-metadata-mcp-compatible"}

    def get_component_location(self, component_id: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        lookup = component_id or part_no or query
        components = self._match_components(lookup, self._engineering_components())
        return {
            "query": lookup,
            "locations": [
                {"component_id": item["component_id"], "part_no": item["part_no"], "location": item["position"], "drawing_ref": item["drawing_ref"]}
                for item in components
            ],
            "source": "component-location-mcp-compatible",
        }

    def query_drawing(self, **arguments: Any) -> Dict[str, Any]:
        return self.get_drawing_metadata(**arguments)

    def query_relation(self, **arguments: Any) -> Dict[str, Any]:
        result = self.query_assembly_relation(**arguments)
        result["relations"] = list(result.get("assembly_relations") or [])
        result["locations"] = self.get_component_location(**arguments).get("locations", [])
        return result

    def fetch_engineering_record(self, **arguments: Any) -> Dict[str, Any]:
        query = str(arguments.get("query") or arguments.get("component") or arguments.get("part_no") or "")
        device_id = str(arguments.get("device_id") or "")
        raw = self.query_cad(query=query, device_id=device_id)
        raw["bom_items"] = self.query_bom(query=query, device_id=device_id).get("bom_items", [])
        raw["assembly_relations"] = self.query_assembly_relation(query=query).get("assembly_relations", [])
        raw["locations"] = self.get_component_location(query=query).get("locations", [])
        raw["source"] = "document-cad-service-local"
        return raw

    @staticmethod
    def _engineering_components() -> list[Dict[str, Any]]:
        return [
            {"component_id": "SPINDLE-ASSY", "part_no": "SP-ASSY-TC820-001", "name": "主轴电机组件", "position": "Z轴上方主轴箱", "assembly_relation": "上级为主轴箱总成，下接主轴轴承、温度传感器与冷却回路", "drawing_ref": "DWG-TC820-SPINDLE-001", "quantity": 1, "material": "装配件"},
            {"component_id": "COOLING-PUMP", "part_no": "CP-TC820-015", "name": "冷却泵", "position": "机床后侧冷却单元", "assembly_relation": "向主轴冷却回路供液，连接冷却箱、过滤器和主轴夹套", "drawing_ref": "DWG-TC820-COOLING-002", "quantity": 1, "material": "外购件"},
            {"component_id": "TEMP-PT100", "part_no": "TS-PT100-008", "name": "主轴温度传感器", "position": "主轴电机壳体测温孔", "assembly_relation": "采集主轴温度，信号接入PLC模拟量模块", "drawing_ref": "DWG-TC820-SENSOR-003", "quantity": 1, "material": "传感器"},
            {"component_id": "VIB-SENSOR", "part_no": "VS-RMS-004", "name": "主轴振动传感器", "position": "主轴箱体右侧安装座", "assembly_relation": "采集主轴振动RMS，关联刀具、夹具和主轴轴承", "drawing_ref": "DWG-TC820-SENSOR-004", "quantity": 1, "material": "传感器"},
        ]

    @classmethod
    def _match_components(cls, query: str, components: list[Dict[str, Any]]) -> list[Dict[str, Any]]:
        text = str(query or "").lower().strip()
        if not text:
            return components[:2]
        for item in components:
            exact_values = (item.get("component_id"), item.get("part_no"), item.get("name"), item.get("drawing_ref"))
            if text in {str(value or "").lower().strip() for value in exact_values}:
                return [dict(item)]
        aliases = {
            "温度": ("TEMP-PT100", "SPINDLE-ASSY", "COOLING-PUMP"),
            "过热": ("TEMP-PT100", "SPINDLE-ASSY", "COOLING-PUMP"),
            "冷却": ("COOLING-PUMP", "SPINDLE-ASSY"),
            "主轴": ("SPINDLE-ASSY", "TEMP-PT100", "VIB-SENSOR", "COOLING-PUMP"),
            "振动": ("VIB-SENSOR", "SPINDLE-ASSY"),
        }
        ids: list[str] = []
        for token, component_ids in aliases.items():
            if token.lower() in text:
                ids.extend(component_id for component_id in component_ids if component_id not in ids)
        for item in components:
            haystack = " ".join(str(item.get(key, "")) for key in ("component_id", "part_no", "name", "position", "drawing_ref")).lower()
            if any(term and term in haystack for term in text.replace("/", " ").replace("-", " ").split()):
                if item["component_id"] not in ids:
                    ids.append(item["component_id"])
            elif text in haystack and item["component_id"] not in ids:
                ids.append(item["component_id"])
        by_id = {item["component_id"]: item for item in components}
        return [dict(by_id[component_id]) for component_id in ids if component_id in by_id]

    @staticmethod
    def _bom_for(item: Mapping[str, Any]) -> Dict[str, Any]:
        return {
            "component_id": item.get("component_id", ""),
            "part_no": item.get("part_no", ""),
            "name": item.get("name", ""),
            "quantity": item.get("quantity", 1),
            "material": item.get("material", ""),
            "drawing_ref": item.get("drawing_ref", ""),
        }

    @staticmethod
    def _drawing_for(item: Mapping[str, Any]) -> Dict[str, Any]:
        return {
            "drawing_id": item.get("drawing_ref", ""),
            "component_id": item.get("component_id", ""),
            "title": "%s 工程图" % item.get("name", "部件"),
            "format": "DXF/DWG-compatible",
            "sheet": "A3",
            "source": "document-cad-service-demo",
        }

    @staticmethod
    def _relation_for(item: Mapping[str, Any]) -> Dict[str, Any]:
        return {
            "component_id": item.get("component_id", ""),
            "part_no": item.get("part_no", ""),
            "relation": item.get("assembly_relation", ""),
            "location": item.get("position", ""),
            "drawing_ref": item.get("drawing_ref", ""),
        }

    def document_parser(self, path: str, **_: Any) -> Dict[str, Any]:
        source = Path(path)
        if not source.is_file():
            raise FileNotFoundError("文档不存在：%s" % source)
        suffix = source.suffix.lower()
        if suffix in {".json", ".jsonl"}:
            if suffix == ".jsonl":
                records = []
                with source.open("r", encoding="utf-8-sig") as stream:
                    for line in stream:
                        if line.strip():
                            records.append(json.loads(line))
                return {"path": str(source), "format": "jsonl", "records": records, "count": len(records)}
            value = json.loads(source.read_text(encoding="utf-8-sig"))
            return {"path": str(source), "format": "json", "content": value}
        text = source.read_text(encoding="utf-8-sig")
        return {"path": str(source), "format": suffix.lstrip(".") or "text", "content": text, "count": len(text)}

    def generate_repair_plan(self, diagnosis: Mapping[str, Any], **_: Any) -> Dict[str, Any]:
        fault = str(diagnosis.get("fault") or diagnosis.get("diagnosis") or "设备异常")
        if "温度" in fault or "过热" in fault:
            steps = ["执行断电和挂牌上锁", "检查冷却液、冷却泵和散热回路", "复测温度并空载试运行"]
        elif "振动" in fault:
            steps = ["停止设备并确认刀具安全", "检查刀具、夹具和主轴轴承", "低速试运行并复测振动"]
        else:
            steps = ["执行安全隔离", "根据报警定义检查相关部件", "复测指标并确认设备恢复"]
        return {"fault": fault, "repair_steps": steps, "safety": ["执行LOTO断电挂牌", "佩戴必要防护用品"]}

    def query_spare_part(self, query: str, device_id: str = "", **_: Any) -> Dict[str, Any]:
        parts = [
            {"part_id": "TEMP-PT100", "part_no": "TS-PT100-008", "name": "PT100温度传感器", "stock": 3, "available": True, "device_id": device_id},
            {"part_id": "COOLANT-PUMP", "part_no": "CP-TC820-015", "name": "主轴冷却泵", "stock": 2, "available": True, "device_id": device_id},
            {"part_id": "SPINDLE-BEARING", "part_no": "SP-BEARING-6208", "name": "主轴轴承", "stock": 1, "available": True, "device_id": device_id},
        ]
        matched = [item for item in parts if any(term in item["name"] or term in item["part_id"] for term in str(query).split())]
        return {"query": query, "parts": matched or parts, "source": "inventory-mcp-compatible"}

    def query_inventory(self, query: str, device_id: str = "", **arguments: Any) -> Dict[str, Any]:
        result = self.query_spare_part(query=query, device_id=device_id, **arguments)
        result["stock"] = list(result.get("parts") or [])
        return result

    def query_part_availability(self, query: str, device_id: str = "", part_no: str = "", **arguments: Any) -> Dict[str, Any]:
        lookup = part_no or query
        result = self.query_spare_part(query=lookup, device_id=device_id, **arguments)
        parts = list(result.get("parts") or [])
        return {"query": lookup, "device_id": device_id, "available": any(int(item.get("stock") or 0) > 0 for item in parts), "parts": parts, "source": "inventory-mcp-compatible"}

    def get_workorder_template(self, device_id: str = "", plan: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        payload = dict(plan or {})
        return {"template_id": "WO-TPL-MAINT-001", "device_id": device_id, "title": "设备维修工单", "steps": list(payload.get("repair_steps") or []), "source": "workorder-template-local"}

    def submit_workorder_draft(self, **arguments: Any) -> Dict[str, Any]:
        return {"draft_id": "WOD-" + datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S"), "submitted": True, "source": "workorder-draft-local", **dict(arguments)}

    def check_sop(self, workorder_id: str = "", query: str = "维修步骤", **_: Any) -> Dict[str, Any]:
        result = self.search_knowledge(query, limit=3, filters={"knowledge_type": "sop"})
        return {"workorder_id": workorder_id, "passed": bool(result.get("documents")), "documents": result.get("documents", []), "source": result.get("source", "")}

    def generate_report(self, report_type: str = "maintenance", sections: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return {"report_type": report_type, "sections": dict(sections or {}), "generated_at": datetime.now(timezone.utc).isoformat(), "source": "report-tool"}

    def create_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.create_workorder(**arguments)

    def update_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.update_workorder(**arguments)

    def get_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.get_workorder(**arguments)

    def query_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return self.get_workorder(**arguments)

    def list_workorders(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.list_workorders(**arguments)

    def assign_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.assign_workorder(**arguments)

    def submit_repair_feedback(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.submit_repair_feedback(**arguments)

    def mark_repair_completed(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.mark_repair_completed(**arguments)

    def close_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.close_workorder(**arguments)

    def reopen_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.reopen_workorder(**arguments)

    def verify_repair(self, **arguments: Any) -> Dict[str, Any]:
        return self.workorder_mcp.verify_repair(**arguments)

    def execute(self, name: str, arguments: Mapping[str, Any]) -> Dict[str, Any]:
        """通过 MCP 客户端分派工具，并记录开始、失败和完成轨迹。"""

        # 工具名称到 MCP 服务的映射保持集中管理，避免 Agent 直接依赖外部系统。
        server = {
            "get_device_status": "plc", "get_device_history": "plc",
            "get_device_logs": "plc",
            "get_production_status": "mes", "query_cad": "cad", "query_bom": "cad",
            "query_part": "cad", "query_part_relation": "cad", "query_assembly_relation": "cad",
            "get_drawing_metadata": "cad", "get_component_location": "cad",
            "create_workorder": "mes", "update_workorder": "mes", "get_workorder": "mes", "query_workorder": "mes",
            "list_workorders": "mes", "assign_workorder": "mes", "submit_repair_feedback": "mes",
            "get_workorder_template": "mes", "submit_workorder_draft": "mes",
            "mark_repair_completed": "mes", "close_workorder": "mes", "reopen_workorder": "mes",
            "verify_repair": "qms", "check_sop": "qms",
            "query_spare_part": "inventory", "query_inventory": "inventory", "query_stock": "inventory", "query_part_availability": "inventory",
            "search_knowledge": "knowledge", "search_alarm_knowledge": "knowledge", "search_sop": "knowledge", "search_manual": "knowledge", "search_fault_cases": "knowledge", "search_semantic_memory": "knowledge",
            "fetch_document": "knowledge", "fetch_chunk": "knowledge", "document_parser": "knowledge", "ingest_knowledge": "knowledge",
            "generate_report": "mes", "generate_repair_plan": "mes",
        }.get(name, "knowledge")
        operation = {
            "query_cad": "fetch_engineering_record",
            "query_part_relation": "query_relation",
            "query_assembly_relation": "query_relation",
            "get_drawing_metadata": "query_drawing",
            "get_component_location": "query_relation",
        }.get(name, name)
        if self.trace:
            self.trace.record(type="tool", name=name, event="tool_started", tool=name, mcp_server=server, arguments=dict(arguments))
        try:
            result = self.mcp.call(server, operation, arguments)
        except Exception as error:
            if server == "cad" and operation in {"query_drawing", "query_bom", "query_part", "query_relation", "fetch_engineering_record"}:
                fallback = self.mcp.handlers.get(operation)
                if fallback is not None:
                    result = fallback(**dict(arguments))
                    result["degraded"] = True
                    result["warning"] = "CAD 远程服务不可用，已使用本地兼容数据：%s" % error
                else:
                    raise
            else:
                if self.trace:
                    self.trace.record(type="tool", name=name, event="tool_error", tool=name, mcp_server=server, error=str(error))
                raise
        if self.trace:
            self.trace.record(type="tool", name=name, event="tool_completed", tool=name, mcp_server=server)
        return result

    def tool_schemas(self) -> list[Dict[str, Any]]:
        return [{"type": "function", "function": {"name": name, "description": description, "parameters": {"type": "object", "additionalProperties": True}}} for name, description in {
            "get_alarm_definition": "查询报警定义",
            "get_device_status": "查询设备状态",
            "get_production_status": "查询MES生产状态",
            "intent_classifier_tool": "识别用户意图并选择目标Agent",
            "get_device_history": "查询设备历史",
            "get_device_logs": "查询设备日志和PLC事件",
            "search_knowledge": "检索工业知识",
            "search_alarm_knowledge": "检索报警知识",
            "search_sop": "检索SOP规程",
            "search_manual": "检索维修手册",
            "search_fault_cases": "检索历史故障案例",
            "search_semantic_memory": "检索语义记忆",
            "fetch_document": "获取知识文档全文",
            "fetch_chunk": "获取知识文档片段",
            "document_parser": "解析维修手册、SOP或工程文档",
            "query_cad": "查询CAD和BOM",
            "query_bom": "查询BOM物料清单",
            "query_part": "查询工程零件",
            "query_part_relation": "查询零件上下游关系",
            "query_assembly_relation": "查询装配关系",
            "get_drawing_metadata": "查询图纸元数据",
            "get_component_location": "查询部件安装位置",
            "query_drawing": "从 CAD 服务查询图纸引用和定位元数据",
            "query_relation": "从 CAD 服务查询装配关系",
            "fetch_engineering_record": "从 CAD 服务获取完整工程记录",
            "generate_repair_plan": "生成维修计划草案",
            "query_spare_part": "查询备件库存",
            "query_inventory": "查询库存",
            "query_stock": "查询库存余量",
            "query_part_availability": "查询备件可用性",
            "get_workorder_template": "获取工单草案模板",
            "submit_workorder_draft": "提交工单草案",
            "create_workorder": "创建维修工单",
            "update_workorder": "更新维修工单",
            "get_workorder": "获取单个维修工单",
            "query_workorder": "查询维修工单",
            "list_workorders": "查询工单列表",
            "assign_workorder": "派工并更新负责人",
            "submit_repair_feedback": "提交维修反馈",
            "mark_repair_completed": "标记维修完成",
            "close_workorder": "关闭维修工单",
            "reopen_workorder": "重新打开维修工单",
            "verify_repair": "验证维修结果",
            "check_sop": "检查维修步骤是否符合SOP",
            "generate_report": "生成结构化运维报告",
            "ingest_knowledge": "将维修手册 JSONL 入库到 RAG",
        }.items()]
