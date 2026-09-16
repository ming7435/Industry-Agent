"""全局 Tool Registry，所有 Agent 通过此层访问外部能力。"""

from __future__ import annotations

from datetime import datetime, timezone
import json
from pathlib import Path
from typing import Any, Dict, Mapping
from uuid import uuid4

from app.mcp.client import McpClient
from app.rag import RAGIndex, RAGServiceClient
from app.tools.diagnosis import get_alarm_definition, get_device_history, get_device_logs, get_device_status
from app.trace import TraceRecorder


class ToolRegistry:
    def __init__(self, base_url: str | None = None, rag_index: RAGIndex | None = None, rag_client: RAGServiceClient | None = None, trace: TraceRecorder | None = None) -> None:
        self.base_url = base_url
        self.rag = rag_client or RAGServiceClient(fallback=rag_index)
        self.trace = trace
        self._orders: Dict[str, Dict[str, Any]] = {}
        self.mcp = McpClient({
            "get_alarm_definition": get_alarm_definition,
            "get_device_history": self._get_device_history,
            "get_device_logs": get_device_logs,
            "get_device_status": self.get_device_status,
            "get_production_status": self.get_production_status,
            "intent_classifier_tool": self.intent_classifier_tool,
            "search_knowledge": self.search_knowledge,
            "document_parser": self.document_parser,
            "query_cad": self.query_cad,
            "query_bom": self.query_bom,
            "generate_repair_plan": self.generate_repair_plan,
            "query_spare_part": self.query_spare_part,
            "create_workorder": self.create_workorder,
            "update_workorder": self.update_workorder,
            "query_workorder": self.query_workorder,
            "close_workorder": self.close_workorder,
            "verify_repair": self.verify_repair,
            "check_sop": self.check_sop,
            "generate_report": self.generate_report,
            "ingest_knowledge": self.ingest_knowledge,
        })

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
        candidates = {
            "diagnosis": ("诊断", "故障", "报警", "异常"),
            "knowledge": ("手册", "sop", "规范", "案例", "怎么检查"),
            "maintenance": ("维修方案", "怎么修", "维修步骤", "检修"),
            "workorder": ("工单", "派工", "创建工单"),
            "quality": ("验收", "质检", "是否恢复"),
            "report": ("报告", "日报", "维修记录"),
            "experience": ("经验", "沉淀", "成功案例", "历史维修"),
        }
        intent = "unknown"
        for name, keywords in candidates.items():
            if any(keyword.lower() in text for keyword in keywords):
                intent = name
                break
        return {"intent": intent, "confidence": 0.92 if intent != "unknown" else 0.2, "source": "local-intent-classifier"}

    def search_knowledge(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return self.rag.search(query, limit=limit, filters=filters)

    def ingest_knowledge(self, path: str, collection: str = "", **_: Any) -> Dict[str, Any]:
        return self.rag.ingest_jsonl(path, collection=collection)

    def rag_status(self, **_: Any) -> Dict[str, Any]:
        return self.rag.status()

    def query_cad(self, query: str, device_id: str = "", **_: Any) -> Dict[str, Any]:
        components = [
            {"component_id": "SPINDLE-ASSY", "name": "主轴电机组件", "position": "Z轴上方主轴箱", "assembly_relation": "连接主轴轴承与冷却回路", "quantity": 1},
            {"component_id": "COOLING-PUMP", "name": "冷却泵", "position": "机床后侧冷却单元", "assembly_relation": "向主轴冷却回路供液", "quantity": 1},
            {"component_id": "TEMP-PT100", "name": "主轴温度传感器", "position": "主轴电机壳体", "assembly_relation": "采集主轴温度", "quantity": 1},
            {"component_id": "VIB-SENSOR", "name": "主轴振动传感器", "position": "主轴箱体", "assembly_relation": "采集主轴振动RMS", "quantity": 1},
        ]
        matched = [item for item in components if any(term in item["name"] or term in item["component_id"] for term in str(query).split())]
        return {"query": query, "device_id": device_id, "components": matched or components[:2], "source": "cad-mcp-compatible"}

    def query_bom(self, query: str, device_id: str = "", **_: Any) -> Dict[str, Any]:
        result = self.query_cad(query, device_id)
        result["source"] = "bom-mcp-compatible"
        return result

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
            {"part_id": "TEMP-PT100", "name": "PT100温度传感器", "stock": 3, "device_id": device_id},
            {"part_id": "COOLANT-PUMP", "name": "主轴冷却泵", "stock": 2, "device_id": device_id},
            {"part_id": "SPINDLE-BEARING", "name": "主轴轴承", "stock": 1, "device_id": device_id},
        ]
        matched = [item for item in parts if any(term in item["name"] or term in item["part_id"] for term in str(query).split())]
        return {"query": query, "parts": matched or parts, "source": "inventory-mcp-compatible"}

    def check_sop(self, workorder_id: str = "", query: str = "维修步骤", **_: Any) -> Dict[str, Any]:
        result = self.search_knowledge(query, limit=3, filters={"knowledge_type": "sop"})
        return {"workorder_id": workorder_id, "passed": bool(result.get("documents")), "documents": result.get("documents", []), "source": result.get("source", "")}

    def generate_report(self, report_type: str = "maintenance", sections: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return {"report_type": report_type, "sections": dict(sections or {}), "generated_at": datetime.now(timezone.utc).isoformat(), "source": "report-tool"}

    def create_workorder(self, device_id: str, title: str, plan_id: str = "", steps: list[str] | None = None, **_: Any) -> Dict[str, Any]:
        now = datetime.now(timezone.utc).isoformat()
        order = {"workorder_id": "WO-" + uuid4().hex[:10].upper(), "device_id": device_id, "status": "open", "title": title, "plan_id": plan_id, "steps": steps or [], "created_at": now, "updated_at": now}
        self._orders[order["workorder_id"]] = order
        return dict(order)

    def update_workorder(self, workorder_id: str, status: str = "in_progress", **fields: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        if order is None:
            raise KeyError("工单不存在：%s" % workorder_id)
        order.update(fields)
        order["status"] = status
        order["updated_at"] = datetime.now(timezone.utc).isoformat()
        return dict(order)

    def query_workorder(self, workorder_id: str, **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id)
        return dict(order) if order else {"found": False, "workorder_id": workorder_id}

    def close_workorder(self, workorder_id: str, **_: Any) -> Dict[str, Any]:
        return self.update_workorder(workorder_id, status="closed")

    def verify_repair(self, workorder_id: str, device_id: str = "", **_: Any) -> Dict[str, Any]:
        order = self._orders.get(workorder_id, {})
        passed = order.get("status") in {"completed", "closed"}
        return {"workorder_id": workorder_id, "device_id": device_id, "passed": passed, "device_recovered": passed, "alarm_cleared": passed, "sop_compliant": True, "findings": ["工单状态已完成" if passed else "工单仍未完成"]}

    def execute(self, name: str, arguments: Mapping[str, Any]) -> Dict[str, Any]:
        """通过 MCP 客户端分派工具，并记录开始、失败和完成轨迹。"""

        # 工具名称到 MCP 服务的映射保持集中管理，避免 Agent 直接依赖外部系统。
        server = {
            "get_device_status": "plc", "get_device_history": "plc",
            "get_device_logs": "plc",
            "get_production_status": "mes", "query_cad": "cad", "query_bom": "cad",
            "create_workorder": "mes", "update_workorder": "mes", "query_workorder": "mes",
            "close_workorder": "mes", "verify_repair": "qms", "check_sop": "qms",
            "query_spare_part": "inventory", "search_knowledge": "knowledge",
            "document_parser": "knowledge", "ingest_knowledge": "knowledge",
            "generate_report": "mes", "generate_repair_plan": "mes",
        }.get(name, "knowledge")
        if self.trace:
            self.trace.record(event="tool_started", tool=name, mcp_server=server, arguments=dict(arguments))
        try:
            result = self.mcp.call(server, name, arguments)
        except Exception as error:
            if self.trace:
                self.trace.record(event="tool_error", tool=name, mcp_server=server, error=str(error))
            raise
        if self.trace:
            self.trace.record(event="tool_completed", tool=name, mcp_server=server)
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
            "document_parser": "解析维修手册、SOP或工程文档",
            "query_cad": "查询CAD和BOM",
            "query_bom": "查询BOM物料清单",
            "generate_repair_plan": "生成维修计划草案",
            "query_spare_part": "查询备件库存",
            "create_workorder": "创建维修工单",
            "update_workorder": "更新维修工单",
            "query_workorder": "查询维修工单",
            "close_workorder": "关闭维修工单",
            "verify_repair": "验证维修结果",
            "check_sop": "检查维修步骤是否符合SOP",
            "generate_report": "生成结构化运维报告",
            "ingest_knowledge": "将维修手册 JSONL 入库到 RAG",
        }.items()]
