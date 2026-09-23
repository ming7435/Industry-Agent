"""全局 Tool Registry，所有 Agent 通过此层访问外部能力。"""

from __future__ import annotations

import os
from time import perf_counter
from typing import Any, Dict, Mapping

from app.mcp.client import McpClient
from app.mcp.quality import QualityMcpAdapter
from app.mcp.workorder import WorkOrderMcpAdapter
from app.rag import RAGIndex, RAGServiceClient
from app.tools.cad import (
    fetch_engineering_record as fetch_engineering_record_tool,
    get_component_location as get_component_location_tool,
    get_drawing_metadata as get_drawing_metadata_tool,
    query_assembly_relation as query_assembly_relation_tool,
    query_bom as query_bom_tool,
    query_cad as query_cad_tool,
    query_drawing as query_drawing_tool,
    query_part as query_part_tool,
    query_part_relation as query_part_relation_tool,
    query_relation as query_relation_tool,
)
from app.tools.diagnosis import get_active_alarms as get_active_alarms_tool
from app.tools.diagnosis import get_alarm_definition, get_device_history, get_device_logs, get_device_status
from app.tools.diagnosis import get_production_status as get_production_status_tool
from app.tools.maintenance import (
    assign_workorder as assign_workorder_tool,
    close_workorder as close_workorder_tool,
    create_workorder as create_workorder_tool,
    generate_repair_plan as generate_repair_plan_tool,
    get_workorder as get_workorder_tool,
    get_workorder_template as get_workorder_template_tool,
    list_workorders as list_workorders_tool,
    mark_repair_completed as mark_repair_completed_tool,
    query_inventory as query_inventory_tool,
    query_part_availability as query_part_availability_tool,
    query_spare_part as query_spare_part_tool,
    query_stock as query_stock_tool,
    query_workorder as query_workorder_tool,
    reopen_workorder as reopen_workorder_tool,
    submit_repair_feedback as submit_repair_feedback_tool,
    submit_workorder_draft as submit_workorder_draft_tool,
    update_workorder as update_workorder_tool,
    query_shift as query_shift_tool,
    query_team_availability as query_team_availability_tool,
    query_technician_skills as query_technician_skills_tool,
    query_technician_workload as query_technician_workload_tool,
    query_technicians as query_technicians_tool,
)
from app.tools.knowledge import (
    document_parser as document_parser_tool,
    fetch_chunk as fetch_knowledge_chunk,
    fetch_document as fetch_knowledge_document,
    ingest_knowledge as ingest_knowledge_tool,
    rag_status as rag_status_tool,
    search_alarm_knowledge as search_alarm_knowledge_tool,
    search_fault_cases as search_fault_cases_tool,
    search_knowledge as search_knowledge_tool,
    search_manual as search_manual_tool,
    search_semantic_memory as search_semantic_memory_tool,
    search_sop as search_sop_tool,
)
from app.tools.quality import (
    get_production_part as get_production_part_tool,
    get_part_specification as get_part_specification_tool,
    inspect_part_dimensions as inspect_part_dimensions_tool,
    inspect_part_appearance as inspect_part_appearance_tool,
    inspect_part_material as inspect_part_material_tool,
    inspect_part_function as inspect_part_function_tool,
    inspect_part_process as inspect_part_process_tool,
)
from app.tools.report import (
    generate_report_file as generate_report_file_tool,
    get_diagnosis_record as get_diagnosis_record_tool,
    get_maintenance_record as get_maintenance_record_tool,
    get_quality_record as get_quality_record_tool,
    get_trace_summary as get_trace_summary_tool,
    persist_report as persist_report_tool,
)
from app.tools.report import generate_report as generate_report_tool
from app.tools.router import intent_classifier_tool as intent_classifier_tool_fn
from app.harness import TraceRecorder
from app.report.store import build_report_store


class ToolRegistry:
    def __init__(self, base_url: str | None = None, rag_index: RAGIndex | None = None, rag_client: RAGServiceClient | None = None, trace: TraceRecorder | None = None, cad_base_url: str | None = None, rag_base_url: str | None = None) -> None:
        self.base_url = base_url
        self.cad_base_url = (cad_base_url or os.getenv("MCP_CAD_URL") or os.getenv("CAD_SERVICE_BASE_URL") or "").rstrip("/")
        # 裸注册表对 Agent 测试和库调用方保持确定且本地化。运行中的编排器会显式注入配置的远程 RAG URL。
        self.rag = rag_client or RAGServiceClient(base_url=rag_base_url or "", fallback=rag_index)
        self.trace = trace
        self.workorder_mcp = WorkOrderMcpAdapter()
        self.quality_mcp = QualityMcpAdapter()
        self.report_store = build_report_store()
        self.mcp = McpClient({
            "get_alarm_definition": get_alarm_definition,
            "get_device_history": self._get_device_history,
            "get_device_logs": get_device_logs,
            "get_device_status": self.get_device_status,
            "get_active_alarms": self.get_active_alarms,
            "get_production_status": get_production_status_tool,
            "intent_classifier_tool": intent_classifier_tool_fn,
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
            "query_stock": self.query_stock,
            "query_part_availability": self.query_part_availability,
            "get_workorder_template": self.get_workorder_template,
            "submit_workorder_draft": self.submit_workorder_draft,
            "create_workorder": self.create_workorder,
            "update_workorder": self.update_workorder,
            "get_workorder": self.get_workorder,
            "query_workorder": self.query_workorder,
            "list_workorders": self.list_workorders,
            "assign_workorder": self.assign_workorder,
            "submit_repair_feedback": self.submit_repair_feedback,
            "mark_repair_completed": self.mark_repair_completed,
            "close_workorder": self.close_workorder,
            "reopen_workorder": self.reopen_workorder,
            "query_technicians": self.query_technicians,
            "query_technician_skills": self.query_technician_skills,
            "query_technician_workload": self.query_technician_workload,
            "query_shift": self.query_shift,
            "query_team_availability": self.query_team_availability,
            "get_production_part": self.get_production_part,
            "get_part_specification": self.get_part_specification,
            "inspect_part_dimensions": self.inspect_part_dimensions,
            "inspect_part_appearance": self.inspect_part_appearance,
            "inspect_part_material": self.inspect_part_material,
            "inspect_part_function": self.inspect_part_function,
            "inspect_part_process": self.inspect_part_process,
            "generate_report": self.generate_report,
            "get_diagnosis_record": self.get_diagnosis_record,
            "get_maintenance_record": self.get_maintenance_record,
            "get_quality_record": self.get_quality_record,
            "get_trace_summary": self.get_trace_summary,
            "persist_report": self.persist_report,
            "generate_report_file": self.generate_report_file,
            "ingest_knowledge": self.ingest_knowledge,
        }, base_urls={"cad": self.cad_base_url})

    def _get_device_history(self, **arguments: Any) -> Dict[str, Any]:
        """读取设备历史趋势，并把当前工厂地址注入工具调用。"""

        return get_device_history(base_url=self.base_url, **arguments)

    def get_device_status(self, device_id: str, **_: Any) -> Dict[str, Any]:
        return get_device_status(device_id=device_id, base_url=self.base_url)

    def get_active_alarms(self, device_id: str, **arguments: Any) -> Dict[str, Any]:
        return get_active_alarms_tool(device_id=device_id, base_url=self.base_url, **arguments)

    def get_production_status(self, device_id: str = "", **_: Any) -> Dict[str, Any]:
        return get_production_status_tool(device_id=device_id)

    def intent_classifier_tool(self, user_text: str, **_: Any) -> Dict[str, Any]:
        return intent_classifier_tool_fn(user_text=user_text)

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
        return ingest_knowledge_tool(self.rag, path=path, collection=collection)

    def rag_status(self, **_: Any) -> Dict[str, Any]:
        return rag_status_tool(self.rag)

    def query_cad(self, query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
        return query_cad_tool(query=query, device_id=device_id, component=component, part_no=part_no)

    def query_bom(self, query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
        return query_bom_tool(query=query, device_id=device_id, component=component, part_no=part_no)

    def query_part(self, query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
        return query_part_tool(query=query, device_id=device_id, component=component, part_no=part_no)

    def query_part_relation(self, part_no: str = "", component_id: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        return query_part_relation_tool(part_no=part_no, component_id=component_id, query=query)

    def query_assembly_relation(self, component_id: str = "", component: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        return query_assembly_relation_tool(component_id=component_id, component=component, part_no=part_no, query=query)

    def get_drawing_metadata(self, component_id: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        return get_drawing_metadata_tool(component_id=component_id, part_no=part_no, query=query)

    def get_component_location(self, component_id: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        return get_component_location_tool(component_id=component_id, part_no=part_no, query=query)

    def query_drawing(self, **arguments: Any) -> Dict[str, Any]:
        return query_drawing_tool(**arguments)

    def query_relation(self, **arguments: Any) -> Dict[str, Any]:
        return query_relation_tool(**arguments)

    def fetch_engineering_record(self, **arguments: Any) -> Dict[str, Any]:
        return fetch_engineering_record_tool(**arguments)

    def document_parser(self, path: str, **_: Any) -> Dict[str, Any]:
        return document_parser_tool(path=path)

    def generate_repair_plan(self, diagnosis: Mapping[str, Any], **_: Any) -> Dict[str, Any]:
        return generate_repair_plan_tool(diagnosis=diagnosis)

    def query_spare_part(self, query: str, device_id: str = "", **_: Any) -> Dict[str, Any]:
        return query_spare_part_tool(query=query, device_id=device_id)

    def query_inventory(self, query: str, device_id: str = "", **arguments: Any) -> Dict[str, Any]:
        return query_inventory_tool(query=query, device_id=device_id, **arguments)

    def query_stock(self, query: str, device_id: str = "", **arguments: Any) -> Dict[str, Any]:
        return query_stock_tool(query=query, device_id=device_id, **arguments)

    def query_part_availability(self, query: str, device_id: str = "", part_no: str = "", **arguments: Any) -> Dict[str, Any]:
        return query_part_availability_tool(query=query, device_id=device_id, part_no=part_no, **arguments)

    def get_workorder_template(self, device_id: str = "", plan: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return get_workorder_template_tool(device_id=device_id, plan=plan)

    def submit_workorder_draft(self, **arguments: Any) -> Dict[str, Any]:
        return submit_workorder_draft_tool(**arguments)

    def generate_report(self, report_type: str = "maintenance", sections: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return generate_report_tool(report_type=report_type, sections=sections)

    def get_diagnosis_record(self, **arguments: Any) -> Dict[str, Any]:
        return get_diagnosis_record_tool(**arguments)

    def get_maintenance_record(self, **arguments: Any) -> Dict[str, Any]:
        return get_maintenance_record_tool(**arguments)

    def get_quality_record(self, **arguments: Any) -> Dict[str, Any]:
        return get_quality_record_tool(**arguments)

    def get_trace_summary(self, **arguments: Any) -> Dict[str, Any]:
        return get_trace_summary_tool(**arguments)

    def persist_report(self, **arguments: Any) -> Dict[str, Any]:
        return persist_report_tool(self.report_store, **arguments)

    def generate_report_file(self, **arguments: Any) -> Dict[str, Any]:
        return generate_report_file_tool(**arguments)

    def create_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return create_workorder_tool(self.workorder_mcp, **arguments)

    def update_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return update_workorder_tool(self.workorder_mcp, **arguments)

    def get_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return get_workorder_tool(self.workorder_mcp, **arguments)

    def query_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return query_workorder_tool(self.workorder_mcp, **arguments)

    def list_workorders(self, **arguments: Any) -> Dict[str, Any]:
        return list_workorders_tool(self.workorder_mcp, **arguments)

    def assign_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return assign_workorder_tool(self.workorder_mcp, **arguments)

    def submit_repair_feedback(self, **arguments: Any) -> Dict[str, Any]:
        return submit_repair_feedback_tool(self.workorder_mcp, **arguments)

    def mark_repair_completed(self, **arguments: Any) -> Dict[str, Any]:
        return mark_repair_completed_tool(self.workorder_mcp, **arguments)

    def close_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return close_workorder_tool(self.workorder_mcp, **arguments)

    def reopen_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return reopen_workorder_tool(self.workorder_mcp, **arguments)

    def query_technicians(self, **arguments: Any) -> Dict[str, Any]:
        return query_technicians_tool(self.workorder_mcp, **arguments)

    def query_technician_skills(self, **arguments: Any) -> Dict[str, Any]:
        return query_technician_skills_tool(self.workorder_mcp, **arguments)

    def query_technician_workload(self, **arguments: Any) -> Dict[str, Any]:
        return query_technician_workload_tool(self.workorder_mcp, **arguments)

    def query_shift(self, **arguments: Any) -> Dict[str, Any]:
        return query_shift_tool(self.workorder_mcp, **arguments)

    def query_team_availability(self, **arguments: Any) -> Dict[str, Any]:
        return query_team_availability_tool(self.workorder_mcp, **arguments)

    def get_production_part(self, **arguments: Any) -> Dict[str, Any]:
        return get_production_part_tool(self.quality_mcp, **arguments)

    def get_part_specification(self, **arguments: Any) -> Dict[str, Any]:
        return get_part_specification_tool(self.quality_mcp, **arguments)

    def inspect_part_dimensions(self, **arguments: Any) -> Dict[str, Any]:
        return inspect_part_dimensions_tool(self.quality_mcp, **arguments)

    def inspect_part_appearance(self, **arguments: Any) -> Dict[str, Any]:
        return inspect_part_appearance_tool(self.quality_mcp, **arguments)

    def inspect_part_material(self, **arguments: Any) -> Dict[str, Any]:
        return inspect_part_material_tool(self.quality_mcp, **arguments)

    def inspect_part_function(self, **arguments: Any) -> Dict[str, Any]:
        return inspect_part_function_tool(self.quality_mcp, **arguments)

    def inspect_part_process(self, **arguments: Any) -> Dict[str, Any]:
        return inspect_part_process_tool(self.quality_mcp, **arguments)

    def execute(self, name: str, arguments: Mapping[str, Any]) -> Dict[str, Any]:
        """通过 MCP 客户端分派工具，并记录开始、失败和完成轨迹。"""

        # 工具名称到 MCP 服务的映射保持集中管理，避免 Agent 直接依赖外部系统。
        server = {
            "get_device_status": "plc", "get_device_history": "plc", "get_active_alarms": "plc",
            "get_device_logs": "plc",
            "get_production_status": "mes", "query_cad": "cad", "query_bom": "cad",
            "query_part": "cad", "query_part_relation": "cad", "query_assembly_relation": "cad",
            "get_drawing_metadata": "cad", "get_component_location": "cad",
            "create_workorder": "mes", "update_workorder": "mes", "get_workorder": "mes", "query_workorder": "mes",
            "list_workorders": "mes", "assign_workorder": "mes", "submit_repair_feedback": "mes",
            "get_workorder_template": "mes", "submit_workorder_draft": "mes",
            "mark_repair_completed": "mes", "close_workorder": "mes", "reopen_workorder": "mes",
            "query_technicians": "mes", "query_technician_skills": "mes", "query_technician_workload": "mes", "query_shift": "mes", "query_team_availability": "mes",
            "get_production_part": "qms", "get_part_specification": "qms",
            "inspect_part_dimensions": "qms", "inspect_part_appearance": "qms",
            "inspect_part_material": "qms", "inspect_part_function": "qms", "inspect_part_process": "qms",
            "query_spare_part": "inventory", "query_inventory": "inventory", "query_stock": "inventory", "query_part_availability": "inventory",
            "search_knowledge": "knowledge", "search_alarm_knowledge": "knowledge", "search_sop": "knowledge", "search_manual": "knowledge", "search_fault_cases": "knowledge", "search_semantic_memory": "knowledge",
            "fetch_document": "knowledge", "fetch_chunk": "knowledge", "document_parser": "knowledge", "ingest_knowledge": "knowledge",
            "generate_report": "mes", "generate_repair_plan": "mes",
            "get_diagnosis_record": "mes", "get_maintenance_record": "mes", "get_quality_record": "mes",
            "get_trace_summary": "mes", "persist_report": "mes", "generate_report_file": "mes",
        }.get(name, "knowledge")
        operation = {
            "query_cad": "fetch_engineering_record",
            "query_part_relation": "query_relation",
            "query_assembly_relation": "query_relation",
            "get_drawing_metadata": "query_drawing",
            "get_component_location": "query_relation",
        }.get(name, name)
        started = perf_counter()
        input_payload = dict(arguments)
        if self.trace:
            self.trace.record(
                type="tool", name=name, event="tool_started", tool=name, tool_name=name,
                mcp_server=server, arguments=input_payload, input=input_payload,
                output=None, execution_time=0.0, error="",
            )
        try:
            result = self.mcp.call(server, operation, arguments)
        except Exception as error:
            if server == "cad" and operation in {"query_drawing", "query_bom", "query_part", "query_relation", "fetch_engineering_record"} and self._cad_fallback_allowed():
                fallback = self.mcp.handlers.get(operation)
                if fallback is not None:
                    result = fallback(**dict(arguments))
                    result["degraded"] = True
                    result["warning"] = "CAD 远程服务不可用，已使用本地兼容数据：%s" % error
                else:
                    raise
            else:
                if self.trace:
                    self.trace.record(
                        type="tool", name=name, event="tool_error", tool=name, tool_name=name,
                        mcp_server=server, arguments=input_payload, input=input_payload,
                        output=None, execution_time=perf_counter() - started, error=str(error),
                    )
                raise
        if self.trace:
            self.trace.record(
                type="tool", name=name, event="tool_completed", tool=name, tool_name=name,
                mcp_server=server, arguments=input_payload, input=input_payload,
                output=result, execution_time=perf_counter() - started, error="",
            )
        return result

    @staticmethod
    def _cad_fallback_allowed() -> bool:
        explicit = os.getenv("CAD_ALLOW_DEMO_FALLBACK")
        if explicit is not None:
            return explicit.strip().lower() in {"1", "true", "yes", "on"}
        return os.getenv("APP_ENV", "development").strip().lower() not in {"prod", "production"}

    def tool_schemas(self) -> list[Dict[str, Any]]:
        return [{"type": "function", "function": {"name": name, "description": description, "parameters": {"type": "object", "additionalProperties": True}}} for name, description in {
            "get_alarm_definition": "查询报警定义",
            "get_device_status": "查询设备状态",
            "get_active_alarms": "查询设备当前活动报警",
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
            "query_technicians": "查询可派工维修人员",
            "query_technician_skills": "查询维修人员技能",
            "query_technician_workload": "查询维修人员负载",
            "query_shift": "查询当前班次",
            "query_team_availability": "查询班组可用性",
            "get_production_part": "获取已生产零件及生产追溯信息",
            "get_part_specification": "获取零件质量规格和检验标准",
            "inspect_part_dimensions": "检测零件尺寸是否符合规格",
            "inspect_part_appearance": "检测零件外观缺陷",
            "inspect_part_material": "检测零件材料和硬度",
            "inspect_part_function": "检测零件功能和关键性能",
            "inspect_part_process": "检测零件生产过程记录是否完整",
            "generate_report": "生成结构化运维报告",
            "get_diagnosis_record": "获取已有诊断记录",
            "get_maintenance_record": "获取已有维修计划记录",
            "get_quality_record": "获取已有质检记录",
            "get_trace_summary": "获取流程 Trace 摘要",
            "persist_report": "持久化结构化报告",
            "generate_report_file": "导出报告文件",
            "ingest_knowledge": "将维修手册 JSONL 入库到 RAG",
        }.items()]
