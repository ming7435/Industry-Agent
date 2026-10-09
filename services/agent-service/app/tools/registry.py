"""全局 Tool Registry，所有 Agent 通过此层访问外部能力。"""

from __future__ import annotations

import os
from contextlib import contextmanager
from contextvars import ContextVar
from copy import deepcopy
from dataclasses import dataclass, replace
from hashlib import sha256
from time import perf_counter
from uuid import uuid4
from typing import Any, Callable, Dict, Iterable, Iterator, Mapping

from pydantic import BaseModel
from app.tools.query_contracts import QUERY_ARGUMENT_MODELS, query_argument_error, validated_query

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
from app.tools.cad.buildcad_mcp import buildcad_mcp
from app.tools.cad.freecad_mcp import freecad_mcp
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


_TOOL_TRACE_CONTEXT: ContextVar[tuple[str, str]] = ContextVar(
    "tool_trace_context",
    default=("", ""),
)
_TOOL_EXECUTION_CONTEXT: ContextVar[dict[str, Any]] = ContextVar(
    "tool_execution_context",
    default={},
)


@dataclass(frozen=True)
class ToolExecutionContext:
    """供 Runtime、Agent 和 Tool Guard 共用的可选上下文。"""

    agent: str = ""
    skills: tuple[str, ...] = ()
    step: str = ""
    allowed_tools: tuple[str, ...] = ()
    task_id: str = ""
    trace_id: str = ""

    def as_dict(self) -> dict[str, Any]:
        return {
            "agent": self.agent,
            "skills": list(self.skills),
            "step": self.step,
            "allowed_tools": list(self.allowed_tools),
            "task_id": self.task_id,
            "trace_id": self.trace_id,
        }


@dataclass(frozen=True)
class ToolDefinition:
    """处理器、模型声明和外部路由的单一规范定义。"""

    name: str
    handler: Callable[..., dict[str, Any]]
    description: str
    server: str
    operation: str
    parameters: Mapping[str, Any]
    exposed_to_model: bool
    compatibility_for: str = ''
    argument_model: type[BaseModel] | None = None
    local_only: bool = False


class ToolRegistry:
    def __init__(self, base_url: str | None = None, rag_index: RAGIndex | None = None, rag_client: RAGServiceClient | None = None, trace: TraceRecorder | None = None, cad_base_url: str | None = None, rag_base_url: str | None = None) -> None:
        self.base_url = base_url
        self.backend_base_url = (os.getenv("BACKEND_SERVICE_BASE_URL") or os.getenv("MCP_MES_URL") or "").rstrip("/")
        self.cad_base_url = (cad_base_url or os.getenv("MCP_CAD_URL") or os.getenv("CAD_SERVICE_BASE_URL") or "").rstrip("/")
        # 裸注册表对 Agent 测试和库调用方保持确定且本地化。运行中的编排器会显式注入配置的远程 RAG URL。
        self.rag = rag_client or RAGServiceClient(base_url=rag_base_url or "", fallback=rag_index)
        self.trace = trace
        # 部署拓扑中由 Backend 负责业务持久化。只有未配置 Backend 地址的
        # 库调用和测试调用才保留本地适配器；存在 HTTP 边界时，Agent 进程
        # 不直接打开业务 MySQL 连接。
        self.workorder_mcp = None if self.backend_base_url else WorkOrderMcpAdapter()
        self.quality_mcp = None if self.backend_base_url else QualityMcpAdapter()
        self.report_store = {} if self.backend_base_url else build_report_store()
        self.definitions = self._build_definitions()
        self.mcp = McpClient({name: definition.handler for name, definition in self.definitions.items()}, base_urls={
            "cad": self.cad_base_url,
            "mes": self.backend_base_url,
            "inventory": os.getenv("MCP_INVENTORY_URL", "").rstrip("/") or self.backend_base_url,
            "qms": os.getenv("MCP_QMS_URL", "").rstrip("/") or self.backend_base_url,
        })

    def _build_definitions(self) -> dict[str, ToolDefinition]:
        """集中定义所有工具；副作用名称和模型暴露范围保持独立。"""
        generic_parameters = {"type": "object", "additionalProperties": True}
        definitions = [
            *[ToolDefinition(name, self._formal_quality_action, '执行正式质检闭环操作', 'mes', name, generic_parameters, False) for name in (
                'create_closure_task','complete_closure_task','submit_quality_appeal','resolve_quality_appeal',
                'reinspect_quality_check','release_quality_check','close_quality_check')],
            ToolDefinition('register_production_part', self._register_production_part, '保存登录人员录入的实测数据和设计规格', 'qms', 'register_production_part', generic_parameters, False),
            ToolDefinition('get_batch_quality', self._formal_quality_action, '读取正式批次优良率、生产追溯及整改建议', 'qms', 'get_batch_quality', generic_parameters, False),
            ToolDefinition('create_quality_check', self._create_quality_check, '保存 Agent 的真实质检证据和数据结果', 'mes', 'create_quality_check', generic_parameters, False),
            ToolDefinition("get_alarm_definition", self._get_alarm_definition, "查询设备所属报警定义", "knowledge", "get_alarm_definition", {"type":"object","properties":{"alarm_code":{"type":"string","description":"报警代码"}},"required":["alarm_code"],"additionalProperties":False}, True),
            ToolDefinition("get_device_status", self.get_device_status, "查询设备状态", "plc", "get_device_status", generic_parameters, True),
            ToolDefinition("get_active_alarms", self.get_active_alarms, "查询设备当前活动报警", "plc", "get_active_alarms", generic_parameters, True),
            ToolDefinition("get_production_status", get_production_status_tool, "查询MES生产状态", "mes", "get_production_status", generic_parameters, True),
            ToolDefinition("intent_classifier_tool", intent_classifier_tool_fn, "识别用户意图并选择目标Agent", "knowledge", "intent_classifier_tool", generic_parameters, True),
            ToolDefinition("get_device_history", self._get_device_history, "查询设备历史", "plc", "get_device_history", {"type":"object","properties":{"device_id":{"type":"string","description":"设备编号"},"metric_keys":{"type":"array","items":{"type":"string"},"description":"指标键列表"},"metric":{"type":"string","description":"单个指标键"},"limit":{"type":"integer","minimum":3,"maximum":120},"alarm_code":{"type":"string","description":"关联报警代码"}},"required":["device_id"],"additionalProperties":False}, True),
            ToolDefinition("get_device_logs", get_device_logs, "查询设备日志和PLC事件", "plc", "get_device_logs", generic_parameters, True),
            ToolDefinition("search_knowledge", lambda **arguments: search_knowledge_tool(self.rag, **arguments), "检索工业知识", "knowledge", "search_knowledge", generic_parameters, True),
            ToolDefinition("search_alarm_knowledge", lambda **arguments: search_alarm_knowledge_tool(self.rag, **arguments), "检索报警知识", "knowledge", "search_alarm_knowledge", generic_parameters, True),
            ToolDefinition("search_sop", lambda **arguments: search_sop_tool(self.rag, **arguments), "检索SOP规程", "knowledge", "search_sop", generic_parameters, True),
            ToolDefinition("search_manual", lambda **arguments: search_manual_tool(self.rag, **arguments), "检索维修手册", "knowledge", "search_manual", generic_parameters, True),
            ToolDefinition("search_fault_cases", lambda **arguments: search_fault_cases_tool(self.rag, **arguments), "检索历史故障案例", "knowledge", "search_fault_cases", generic_parameters, True),
            ToolDefinition("search_semantic_memory", lambda **arguments: search_semantic_memory_tool(self.rag, **arguments), "检索语义记忆", "knowledge", "search_semantic_memory", generic_parameters, True),
            ToolDefinition("fetch_document", lambda **arguments: fetch_knowledge_document(self.rag, **arguments), "获取知识文档全文", "knowledge", "fetch_document", generic_parameters, True),
            ToolDefinition("fetch_chunk", lambda **arguments: fetch_knowledge_chunk(self.rag, **arguments), "获取知识文档片段", "knowledge", "fetch_chunk", generic_parameters, True),
            ToolDefinition("document_parser", self.document_parser, "解析维修手册、SOP或工程文档", "knowledge", "document_parser", generic_parameters, True),
            ToolDefinition("query_cad", self.query_cad, "查询CAD和BOM", "cad", "fetch_engineering_record", generic_parameters, False, compatibility_for="fetch_engineering_record"),
            ToolDefinition("query_bom", self.query_bom, "查询BOM物料清单", "cad", "query_bom", generic_parameters, True),
            ToolDefinition("query_part", self.query_part, "查询工程零件", "cad", "query_part", generic_parameters, True),
            ToolDefinition("query_part_relation", self.query_part_relation, "查询零件上下游关系", "cad", "query_relation", generic_parameters, False, compatibility_for="query_relation"),
            ToolDefinition("query_assembly_relation", self.query_assembly_relation, "查询装配关系", "cad", "query_relation", generic_parameters, False, compatibility_for="query_relation"),
            ToolDefinition("get_drawing_metadata", self.get_drawing_metadata, "查询图纸元数据", "cad", "query_drawing", generic_parameters, False, compatibility_for="query_drawing"),
            ToolDefinition("get_component_location", self.get_component_location, "查询部件安装位置", "cad", "query_relation", generic_parameters, False, compatibility_for="query_relation"),
            ToolDefinition("query_drawing", self.query_drawing, "从 CAD 服务查询图纸引用和定位元数据", "cad", "query_drawing", generic_parameters, True),
            ToolDefinition("query_relation", self.query_relation, "从 CAD 服务查询装配关系", "cad", "query_relation", generic_parameters, True),
            ToolDefinition("fetch_engineering_record", self.fetch_engineering_record, "从 CAD 服务获取完整工程记录", "cad", "fetch_engineering_record", generic_parameters, True),
            ToolDefinition("buildcad_mcp", buildcad_mcp, "调用已授权 BuildCAD MCP 的实际工具", "local", "buildcad_mcp", {"type": "object", "properties": {"tool_name": {"type": "string"}, "arguments": {"type": "object"}}, "required": ["tool_name", "arguments"], "additionalProperties": False}, False, local_only=True),
            ToolDefinition("freecad_mcp", freecad_mcp, "通过本地 FreeCAD MCP 创建并校验真实实体", "local", "freecad_mcp", {"type": "object", "properties": {"spec": {"type": "object"}}, "required": ["spec"], "additionalProperties": False}, False, local_only=True),
            ToolDefinition("generate_repair_plan", self.generate_repair_plan, "生成维修计划草案", "local", "generate_repair_plan", generic_parameters, True),
            ToolDefinition("query_spare_part", self.query_spare_part, "查询备件库存", "inventory", "query_spare_part", generic_parameters, True),
            ToolDefinition("query_inventory", self.query_inventory, "查询库存", "inventory", "query_inventory", generic_parameters, True),
            ToolDefinition("query_stock", self.query_stock, "查询库存余量", "inventory", "query_stock", generic_parameters, False, compatibility_for="query_inventory"),
            ToolDefinition("query_part_availability", self.query_part_availability, "查询备件可用性", "inventory", "query_part_availability", generic_parameters, True),
            ToolDefinition("get_workorder_template", self.get_workorder_template, "获取工单草案模板", "mes", "get_workorder_template", generic_parameters, True),
            ToolDefinition("submit_workorder_draft", self.submit_workorder_draft, "提交工单草案", "mes", "submit_workorder_draft", generic_parameters, True),
            ToolDefinition("create_workorder", self.create_workorder, "创建维修工单", "mes", "create_workorder", generic_parameters, True),
            ToolDefinition("update_workorder", self.update_workorder, "更新维修工单", "mes", "update_workorder", generic_parameters, True),
            ToolDefinition("get_workorder", self.get_workorder, "获取单个维修工单", "mes", "get_workorder", generic_parameters, True),
            ToolDefinition("query_workorder", self.query_workorder, "查询维修工单", "mes", "query_workorder", generic_parameters, False, compatibility_for="get_workorder"),
            ToolDefinition("list_workorders", self.list_workorders, "查询工单列表", "mes", "list_workorders", generic_parameters, True),
            ToolDefinition("delete_workorder", self.delete_workorder, "删除维修工单", "mes", "delete_workorder", generic_parameters, True),
            ToolDefinition("assign_workorder", self.assign_workorder, "派工并更新负责人", "mes", "assign_workorder", generic_parameters, True),
            ToolDefinition("submit_repair_feedback", self.submit_repair_feedback, "提交维修反馈", "mes", "submit_repair_feedback", generic_parameters, True),
            ToolDefinition("mark_repair_completed", self.mark_repair_completed, "标记维修完成", "mes", "mark_repair_completed", generic_parameters, True),
            ToolDefinition("close_workorder", self.close_workorder, "关闭维修工单", "mes", "close_workorder", generic_parameters, True),
            ToolDefinition("reopen_workorder", self.reopen_workorder, "重新打开维修工单", "mes", "reopen_workorder", generic_parameters, True),
            ToolDefinition("query_technicians", self.query_technicians, "查询可派工维修人员", "mes", "query_technicians", generic_parameters, True),
            ToolDefinition("query_technician_skills", self.query_technician_skills, "查询维修人员技能", "mes", "query_technician_skills", generic_parameters, True),
            ToolDefinition("query_technician_workload", self.query_technician_workload, "查询维修人员负载", "mes", "query_technician_workload", generic_parameters, True),
            ToolDefinition("query_shift", self.query_shift, "查询当前班次", "mes", "query_shift", generic_parameters, True),
            ToolDefinition("query_team_availability", self.query_team_availability, "查询班组可用性", "mes", "query_team_availability", generic_parameters, True),
            ToolDefinition("get_production_part", self.get_production_part, "获取已生产零件及生产追溯信息", "qms", "get_production_part", generic_parameters, True),
            ToolDefinition("get_part_specification", self.get_part_specification, "获取零件质量规格和检验标准", "qms", "get_part_specification", generic_parameters, True),
            ToolDefinition("inspect_part_dimensions", self.inspect_part_dimensions, "检测零件尺寸是否符合规格", "qms", "inspect_part_dimensions", generic_parameters, True),
            ToolDefinition("inspect_part_appearance", self.inspect_part_appearance, "检测零件外观缺陷", "qms", "inspect_part_appearance", generic_parameters, True),
            ToolDefinition("inspect_part_material", self.inspect_part_material, "检测零件材料和硬度", "qms", "inspect_part_material", generic_parameters, True),
            ToolDefinition("inspect_part_function", self.inspect_part_function, "检测零件功能和关键性能", "qms", "inspect_part_function", generic_parameters, True),
            ToolDefinition("inspect_part_process", self.inspect_part_process, "检测零件生产过程记录是否完整", "qms", "inspect_part_process", generic_parameters, True),
            ToolDefinition("generate_report", self.generate_report, "生成结构化运维报告", "mes", "generate_report", generic_parameters, True),
            ToolDefinition("get_diagnosis_record", self.get_diagnosis_record, "获取已有诊断记录", "local", "get_diagnosis_record", generic_parameters, True),
            ToolDefinition("get_maintenance_record", self.get_maintenance_record, "获取已有维修计划记录", "local", "get_maintenance_record", generic_parameters, True),
            ToolDefinition("get_quality_record", self.get_quality_record, "获取已有质检记录", "local", "get_quality_record", generic_parameters, True),
            ToolDefinition("get_trace_summary", self.get_trace_summary, "获取流程 Trace 摘要", "local", "get_trace_summary", generic_parameters, True),
            ToolDefinition("persist_report", self.persist_report, "持久化结构化报告", "mes", "persist_report", generic_parameters, True),
            ToolDefinition("delete_report", self.delete_report, "删除结构化报告", "mes", "delete_report", generic_parameters, True),
            ToolDefinition("generate_report_file", self.generate_report_file, "导出报告文件", "local", "generate_report_file", generic_parameters, True),
            ToolDefinition("ingest_knowledge", self.ingest_knowledge, "将维修手册 JSONL 入库到 RAG", "knowledge", "ingest_knowledge", generic_parameters, True),
            ToolDefinition("record_repair_verification_failed", self.record_repair_verification_failed, "记录维修验收未通过", "mes", "record_repair_verification_failed", generic_parameters, False),
        ]
        result = {}
        for definition in definitions:
            argument_model = QUERY_ARGUMENT_MODELS.get(definition.name)
            if argument_model is not None:
                definition = replace(definition, argument_model=argument_model, parameters=argument_model.model_json_schema())
            result[definition.name] = definition
        return result

    @staticmethod
    def _register_production_part(**arguments: Any) -> Dict[str, Any]:
        raise RuntimeError('质检数据录入需要已配置的 Backend MySQL 服务，不使用演示适配器')

    @staticmethod
    def _formal_quality_action(**arguments: Any) -> Dict[str, Any]:
        raise RuntimeError('正式质检闭环需要 Backend 服务，不使用演示状态')

    def _create_quality_check(self, **arguments: Any) -> Dict[str, Any]:
        service = getattr(self, 'closure_service', None)
        if service is None:
            raise RuntimeError('质检记录服务未配置')
        values = dict(arguments)
        operator = str(values.pop('operator', 'quality-agent'))
        return service.record_part_quality(values, operator=operator)

    @contextmanager
    def trace_context(
        self,
        task_id: str = "",
        trace_id: str = "",
        context: Mapping[str, Any] | ToolExecutionContext | None = None,
        **metadata: Any,
    ) -> Iterator[None]:
        """将当前任务和轨迹信息绑定到直接调用的工具。"""

        token = _TOOL_TRACE_CONTEXT.set((str(task_id or ""), str(trace_id or "")))
        base_context = context.as_dict() if isinstance(context, ToolExecutionContext) else dict(context or {})
        execution_context = {**_TOOL_EXECUTION_CONTEXT.get(), **base_context, **metadata}
        execution_context.setdefault("task_id", str(task_id or ""))
        execution_context.setdefault("trace_id", str(trace_id or ""))
        context_token = _TOOL_EXECUTION_CONTEXT.set(execution_context)
        try:
            yield
        finally:
            _TOOL_EXECUTION_CONTEXT.reset(context_token)
            _TOOL_TRACE_CONTEXT.reset(token)

    def current_trace_context(self) -> Dict[str, Any]:
        """返回当前真实调用边界；不从请求正文读取权限或审批状态。"""
        return dict(_TOOL_EXECUTION_CONTEXT.get())

    def _get_device_history(self, **arguments: Any) -> Dict[str, Any]:
        """读取设备历史趋势，并把当前工厂地址注入工具调用。"""

        return get_device_history(base_url=self.base_url, **arguments)

    def _get_alarm_definition(self, alarm_code: str, device_id: str = '') -> Dict[str, Any]:
        return get_alarm_definition(alarm_code, device_id=device_id, base_url=self.base_url)

    @staticmethod
    def normalize_tool_arguments(name: str, arguments: Mapping[str, Any]) -> Dict[str, Any]:
        """在 MCP 分派前统一诊断工具的历史参数别名。"""

        normalized = dict(arguments or {})
        if name == "get_alarm_definition":
            # 报警定义只接受 alarm_code，设备编号只属于调用上下文。
            normalized.pop("device_id", None)
        elif name == "get_device_history":
            # 兼容模型常见的 metrics 命名，实际工具参数统一为 metric_keys。
            model_metrics = normalized.pop("metrics", None)
            if not normalized.get("metric_keys") and model_metrics is not None:
                normalized["metric_keys"] = model_metrics
        return normalized

    def get_device_status(self, device_id: str, **_: Any) -> Dict[str, Any]:
        return get_device_status(device_id=device_id, base_url=self.base_url)

    def get_active_alarms(self, device_id: str, **arguments: Any) -> Dict[str, Any]:
        return get_active_alarms_tool(device_id=device_id, base_url=self.base_url, **arguments)

    def get_production_status(self, device_id: str = "", **_: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("mes", "get_production_status", {"device_id": device_id})
        return get_production_status_tool(device_id=device_id)

    def intent_classifier_tool(self, user_text: str, **_: Any) -> Dict[str, Any]:
        return intent_classifier_tool_fn(user_text=user_text)

    @validated_query('search_knowledge')
    def search_knowledge(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_knowledge_tool(self.rag, query, limit=limit, filters=filters)

    @validated_query('search_alarm_knowledge')
    def search_alarm_knowledge(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, alarm_code: str = "", **_: Any) -> Dict[str, Any]:
        return search_alarm_knowledge_tool(self.rag, query, limit=limit, filters=filters, alarm_code=alarm_code)

    @validated_query('search_sop')
    def search_sop(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_sop_tool(self.rag, query, limit=limit, filters=filters)

    @validated_query('search_manual')
    def search_manual(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_manual_tool(self.rag, query, limit=limit, filters=filters)

    @validated_query('search_fault_cases')
    def search_fault_cases(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_fault_cases_tool(self.rag, query, limit=limit, filters=filters)

    @validated_query('search_semantic_memory')
    def search_semantic_memory(self, query: str, limit: int = 5, filters: Mapping[str, Any] | None = None, **_: Any) -> Dict[str, Any]:
        return search_semantic_memory_tool(self.rag, query, limit=limit, filters=filters)

    @validated_query('fetch_document')
    def fetch_document(self, document_id: str = "", **_: Any) -> Dict[str, Any]:
        return fetch_knowledge_document(self.rag, document_id)

    @validated_query('fetch_chunk')
    def fetch_chunk(self, document_id: str = "", chunk_id: str = "", **_: Any) -> Dict[str, Any]:
        return fetch_knowledge_chunk(self.rag, document_id, chunk_id)

    def ingest_knowledge(self, path: str, collection: str = "", **_: Any) -> Dict[str, Any]:
        return ingest_knowledge_tool(self.rag, path=path, collection=collection)

    def rag_status(self, **_: Any) -> Dict[str, Any]:
        return rag_status_tool(self.rag)

    @validated_query('query_cad')
    def query_cad(self, query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
        return query_cad_tool(query=query, device_id=device_id, component=component, part_no=part_no)

    @validated_query('query_bom')
    def query_bom(self, query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
        return query_bom_tool(query=query, device_id=device_id, component=component, part_no=part_no)

    @validated_query('query_part')
    def query_part(self, query: str = "", device_id: str = "", component: str = "", part_no: str = "", **_: Any) -> Dict[str, Any]:
        return query_part_tool(query=query, device_id=device_id, component=component, part_no=part_no)

    @validated_query('query_part_relation')
    def query_part_relation(self, part_no: str = "", component_id: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        return query_part_relation_tool(part_no=part_no, component_id=component_id, query=query)

    @validated_query('query_assembly_relation')
    def query_assembly_relation(self, component_id: str = "", component: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        return query_assembly_relation_tool(component_id=component_id, component=component, part_no=part_no, query=query)

    @validated_query('get_drawing_metadata')
    def get_drawing_metadata(self, component_id: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        return get_drawing_metadata_tool(component_id=component_id, part_no=part_no, query=query)

    @validated_query('get_component_location')
    def get_component_location(self, component_id: str = "", part_no: str = "", query: str = "", **_: Any) -> Dict[str, Any]:
        return get_component_location_tool(component_id=component_id, part_no=part_no, query=query)

    @validated_query('query_drawing')
    def query_drawing(self, **arguments: Any) -> Dict[str, Any]:
        return query_drawing_tool(**arguments)

    @validated_query('query_relation')
    def query_relation(self, **arguments: Any) -> Dict[str, Any]:
        return query_relation_tool(**arguments)

    @validated_query('fetch_engineering_record')
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
        if self.backend_base_url:
            return self.mcp.call("mes", "get_workorder_template", {"device_id": device_id, "plan": dict(plan or {})})
        return get_workorder_template_tool(device_id=device_id, plan=plan)

    def submit_workorder_draft(self, **arguments: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("mes", "submit_workorder_draft", arguments)
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
        if self.backend_base_url:
            return self.mcp.call("mes", "persist_report", arguments)
        return persist_report_tool(self.report_store, **arguments)

    def list_reports(self, workorder_id: str = "", **_: Any) -> Dict[str, Any]:
        """列出报告工作区中已持久化的报告。"""

        if self.backend_base_url:
            return self.mcp.call("mes", "list_reports", {"workorder_id": workorder_id})
        items = list(self.report_store.values())
        if workorder_id:
            items = [item for item in items if str(item.get("workorder_id") or "") == str(workorder_id)]
        return {"success": True, "items": items, "count": len(items), "backend": "report-store"}

    def delete_report(self, report_id: str = "", **_: Any) -> Dict[str, Any]:
        report_id = str(report_id or "").strip()
        if self.backend_base_url:
            return self.mcp.call("mes", "delete_report", {"report_id": report_id})
        if not report_id or report_id not in self.report_store:
            return {"success": False, "deleted": False, "found": False, "report_id": report_id, "backend": "report-store"}
        del self.report_store[report_id]
        return {"success": True, "deleted": True, "found": True, "report_id": report_id, "backend": "report-store"}

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

    def delete_workorder(self, workorder_id: str = "", **arguments: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("mes", "delete_workorder", {"workorder_id": workorder_id, **arguments})
        return self.workorder_mcp.delete_workorder(workorder_id=workorder_id, **arguments)

    def assign_workorder(self, **arguments: Any) -> Dict[str, Any]:
        return assign_workorder_tool(self.workorder_mcp, **arguments)

    def submit_repair_feedback(self, **arguments: Any) -> Dict[str, Any]:
        return submit_repair_feedback_tool(self.workorder_mcp, **arguments)

    def mark_repair_completed(self, **arguments: Any) -> Dict[str, Any]:
        return mark_repair_completed_tool(self.workorder_mcp, **arguments)

    def record_repair_verification_failed(self, **arguments: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("mes", "record_repair_verification_failed", arguments)
        return self.workorder_mcp.record_repair_verification_failed(**arguments)

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
        if self.backend_base_url:
            return self.mcp.call("qms", "get_production_part", arguments)
        return get_production_part_tool(self.quality_mcp, **arguments)

    def get_part_specification(self, **arguments: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("qms", "get_part_specification", arguments)
        return get_part_specification_tool(self.quality_mcp, **arguments)

    def inspect_part_dimensions(self, **arguments: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("qms", "inspect_part_dimensions", arguments)
        return inspect_part_dimensions_tool(self.quality_mcp, **arguments)

    def inspect_part_appearance(self, **arguments: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("qms", "inspect_part_appearance", arguments)
        return inspect_part_appearance_tool(self.quality_mcp, **arguments)

    def inspect_part_material(self, **arguments: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("qms", "inspect_part_material", arguments)
        return inspect_part_material_tool(self.quality_mcp, **arguments)

    def inspect_part_function(self, **arguments: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("qms", "inspect_part_function", arguments)
        return inspect_part_function_tool(self.quality_mcp, **arguments)

    def inspect_part_process(self, **arguments: Any) -> Dict[str, Any]:
        if self.backend_base_url:
            return self.mcp.call("qms", "inspect_part_process", arguments)
        return inspect_part_process_tool(self.quality_mcp, **arguments)

    def execute(
        self,
        name: str,
        arguments: Mapping[str, Any],
        *,
        context: Mapping[str, Any] | ToolExecutionContext | None = None,
    ) -> Dict[str, Any]:
        """通过 MCP 客户端分派工具，并记录开始、失败和完成轨迹。"""

        definition = self.definitions.get(name)
        # 兼容调用方显式注册的额外本地处理器；权限仍检查原请求名称。
        server = definition.server if definition else "knowledge"
        operation = definition.operation if definition else name
        started = perf_counter()
        input_payload = self.normalize_tool_arguments(name, arguments)
        task_id, trace_id = _TOOL_TRACE_CONTEXT.get()
        supplied_context = context.as_dict() if isinstance(context, ToolExecutionContext) else dict(context or {})
        execution_context = {**_TOOL_EXECUTION_CONTEXT.get(), **supplied_context}
        if execution_context.get("task_id"):
            task_id = str(execution_context["task_id"])
        if execution_context.get("trace_id"):
            trace_id = str(execution_context["trace_id"])
        # 将生效的 Runtime 上下文写入每条工具事件，使日志页面不仅能展示
        # 调用了什么，还能展示调用原因以及设备、Agent、步骤范围。
        trace_context = dict(execution_context)
        call_id = 'TOOL-CALL-' + uuid4().hex
        trace_context['tool_call_id'] = call_id
        allowed_tools = execution_context.get("allowed_tools")
        allowed = {str(item) for item in allowed_tools or [] if str(item).strip()}
        guard_error = self._guard_error(name, input_payload, execution_context, allowed)
        if guard_error:
            guard_payload = {
                "allowed_tools": sorted(allowed),
                "agent": str(execution_context.get("agent") or ""),
                "skill": str(execution_context.get("skill") or ""),
                "step": str(execution_context.get("step") or ""),
                "allowed": False,
                "reason": guard_error,
            }
            if self.trace:
                self.trace.record(
                    type="tool", name=name, event="tool_guard", tool=name,
                    tool_name=name, mcp_server=server, arguments=input_payload,
                    output=None, execution_time=0.0, error=guard_payload["reason"],
                    task_id=task_id, trace_id=trace_id, context=trace_context, **guard_payload,
                )
            raise PermissionError("tool %s rejected by shared guard: %s" % (name, guard_error))
        if self.trace:
            self.trace.record(
                type="tool", name=name, event="tool_guard", tool=name,
                tool_name=name, mcp_server=server, arguments=input_payload,
                output=None, execution_time=0.0, error="", task_id=task_id,
                trace_id=trace_id, allowed=True,
                agent=str(execution_context.get("agent") or ""),
                skill=str(execution_context.get("skill") or ""),
                step=str(execution_context.get("step") or ""),
                context=trace_context,
            )
        if self.trace:
            self.trace.record(
                type="tool", name=name, event="tool_started", tool=name, tool_name=name,
                mcp_server=server, arguments=input_payload, input=input_payload,
                output=None, execution_time=0.0, error="", task_id=task_id, trace_id=trace_id,
                context=trace_context,
            )
        try:
            if server == "cad" and not self.cad_base_url and not self._cad_fallback_allowed():
                raise RuntimeError("生产模式要求配置 MCP_CAD_URL 或 CAD_SERVICE_BASE_URL")
            call_arguments = dict(input_payload)
            if name == 'get_alarm_definition':
                # 设备范围来自 Agent 的真实事件上下文，不接受模型改写的设备参数。
                call_arguments['device_id'] = str(execution_context.get('device_id') or '')
            # 内部任务工具必须在本地校验可信上下文，不允许环境变量将其改为远程调用。
            result = definition.handler(**call_arguments) if definition and definition.local_only else self.mcp.call(server, operation, call_arguments)
        except Exception as error:
            if server == "cad" and operation in {"query_drawing", "query_bom", "query_part", "query_relation", "fetch_engineering_record"} and self._cad_fallback_allowed():
                fallback = self.mcp.handlers.get(operation)
                if fallback is not None:
                    result = fallback(**dict(arguments))
                    result["degraded"] = True
                    result["synthetic"] = True
                    result["backend_status"] = "local_fallback"
                    result["warning"] = "CAD 远程服务不可用，已使用本地兼容数据：%s" % error
                else:
                    raise
            else:
                if self.trace:
                    self.trace.record(
                        type="tool", name=name, event="tool_error", tool=name, tool_name=name,
                        mcp_server=server, arguments=input_payload, input=input_payload,
                        output=None, execution_time=perf_counter() - started, error=str(error),
                        task_id=task_id, trace_id=trace_id, context=trace_context,
                    )
                raise
        observation = self._normalize_observation(name, result, execution_context)
        if self.trace:
            self.trace.record(
                type="tool", name=name, event="tool_called", tool=name, tool_name=name,
                mcp_server=server, arguments=input_payload, output=result,
                execution_time=perf_counter() - started, error="", task_id=task_id, trace_id=trace_id,
                agent=str(execution_context.get("agent") or ""),
                skill=str(execution_context.get("skill") or ""),
                step=str(execution_context.get("step") or ""),
                context=trace_context,
            )
            self.trace.record(
                type="runtime", name=name, event="observation_added", tool=name, tool_name=name,
                mcp_server=server, state_change={"observation": observation},
                keys=["observation"], execution_time=perf_counter() - started,
                error="", task_id=task_id, trace_id=trace_id, context=trace_context,
            )
            if observation.get("evidence"):
                self.trace.record(
                    type="runtime", name=name, event="evidence_added", tool=name, tool_name=name,
                    mcp_server=server, state_change={"evidence": observation["evidence"]},
                    keys=["evidence"], execution_time=perf_counter() - started,
                    error="", task_id=task_id, trace_id=trace_id, context=trace_context,
                )
            self.trace.record(
                type="tool", name=name, event="tool_completed", tool=name, tool_name=name,
                mcp_server=server, arguments=input_payload, input=input_payload,
                output=result, execution_time=perf_counter() - started, error="",
                task_id=task_id, trace_id=trace_id, context=trace_context,
            )
        return result

    def _guard_error(
        self,
        name: str,
        arguments: Mapping[str, Any],
        context: Mapping[str, Any],
        allowed: set[str],
    ) -> str:
        """调用处理程序前返回一条确定的工具调用校验结果。"""

        if name not in self.mcp.handlers:
            return "tool_not_registered"
        if "allowed_tools" in context and name not in allowed:
            return "tool_not_allowed_for_step"
        required = {
            "get_alarm_definition": ("alarm_code",),
            "get_device_status": ("device_id",),
            "get_active_alarms": ("device_id",),
            "get_device_history": ("device_id",),
            "get_device_logs": ("device_id",),
            "get_production_status": ("device_id",),
        }.get(name, ())
        missing = [key for key in required if not arguments.get(key)]
        if missing:
            return "missing_required_argument:%s" % ",".join(missing)
        definition = self.definitions.get(name)
        if definition and definition.argument_model is not None:
            # 与 Python 直接调用入口共享校验，不修改原始请求。
            error = query_argument_error(name, arguments)
            if error:
                return error
        calls = context.get("tool_calls") or []
        if isinstance(calls, (list, tuple)):
            for item in calls:
                if not isinstance(item, Mapping):
                    continue
                previous = str(item.get("name") or item.get("tool") or item.get("tool_name") or "")
                previous_args = item.get("arguments") or item.get("input") or {}
                if previous == name and isinstance(previous_args, Mapping) and dict(previous_args) == dict(arguments):
                    return "duplicate_tool_call"
        return ""

    def guard_call(
        self,
        name: str,
        arguments: Mapping[str, Any],
        *,
        context: Mapping[str, Any] | ToolExecutionContext | None = None,
    ) -> dict[str, Any]:
        """检查动态工具调用但不执行，用于兼容诊断流程。"""

        supplied = context.as_dict() if isinstance(context, ToolExecutionContext) else dict(context or {})
        execution_context = {**_TOOL_EXECUTION_CONTEXT.get(), **supplied}
        values = execution_context.get("allowed_tools") or []
        allowed = {str(item) for item in values if str(item).strip()}
        normalized_arguments = self.normalize_tool_arguments(name, arguments)
        error = self._guard_error(name, normalized_arguments, execution_context, allowed)
        decision = {"allow": not bool(error), "reason": error or "allowed"}
        if self.trace:
            self.trace.record(
                type="tool", name=name, event="tool_guard", tool=name, tool_name=name,
                arguments=dict(arguments), output=None, execution_time=0.0,
                error=error, task_id=str(execution_context.get("task_id") or ""),
                trace_id=str(execution_context.get("trace_id") or ""),
                allowed=decision["allow"], reason=decision["reason"],
                agent=str(execution_context.get("agent") or ""),
                skill=str(execution_context.get("skill") or ""),
                step=str(execution_context.get("step") or ""),
            )
        return decision

    @staticmethod
    def _normalize_observation(name: str, result: Any, context: Mapping[str, Any]) -> dict[str, Any]:
        payload = dict(result) if isinstance(result, Mapping) else {"value": result}
        evidence = payload.get("evidence") or payload.get("documents") or payload.get("items") or []
        facts = {key: payload[key] for key in ("query", "status", "found", "trend", "device_id", "part_no") if key in payload}
        try:
            confidence = max(0.0, min(1.0, float(payload.get("confidence") or 0.0)))
        except (TypeError, ValueError):
            confidence = 0.0
        observation_id = "OBS-" + sha256((name + repr(payload)[:256]).encode("utf-8")).hexdigest()[:12].upper()
        return {
            "observation_id": observation_id,
            "step_id": str(context.get("step") or ""),
            "tool": name,
            "source": str(context.get("agent") or "tool"),
            "type": str(payload.get("observation_type") or payload.get("type") or "tool_result"),
            "subject": str(payload.get("device_id") or payload.get("part_id") or payload.get("query") or ""),
            "facts": facts,
            "valid": payload.get("success") is not False and not bool(payload.get("error")),
            "confidence": confidence,
            "raw": payload,
            "evidence": list(evidence) if isinstance(evidence, list) else [],
        }

    @staticmethod
    def _cad_fallback_allowed() -> bool:
        explicit = os.getenv("CAD_ALLOW_DEMO_FALLBACK")
        if explicit is not None:
            return explicit.strip().lower() in {"1", "true", "yes", "on"}
        # 本地开发也默认关闭演示 CAD，避免示例部件被当作真实工程依据。
        return False

    def tool_schemas(self, allowed_tools: Iterable[str] | None = None) -> list[Dict[str, Any]]:
        """默认隐藏重复查询；显式白名单只暴露获准原名，内部工具始终隐藏。"""
        allowed = None if allowed_tools is None else set(allowed_tools)
        return [
            {
                "type": "function",
                "function": {
                    "name": definition.name,
                    "description": definition.description,
                    "parameters": deepcopy(dict(definition.parameters)),
                },
            }
            for definition in self.definitions.values()
            if (definition.exposed_to_model or (allowed is not None and definition.compatibility_for))
            and (allowed is None or definition.name in allowed)
        ]
