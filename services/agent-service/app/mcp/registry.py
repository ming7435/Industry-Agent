"""当前阶段的本地 MCP 工具注册器。"""

from __future__ import annotations

from typing import Any, Callable, Dict, Mapping

from app.rag import RAGIndex, RAGServiceClient
from app.tools.diagnosis import get_alarm_definition, get_device_history, get_device_logs, get_device_status
from app.trace import TraceRecorder
from .client import McpClient


class LocalMcpToolRegistry:
    """提供 MCP function tool 所需的 schema 和执行入口。"""

    def __init__(self, base_url: str | None = None, rag_index: RAGIndex | None = None, rag_client: RAGServiceClient | None = None, trace: TraceRecorder | None = None) -> None:
        self.base_url = base_url
        self.rag = rag_client or RAGServiceClient(fallback=rag_index)
        self.trace = trace
        self._handlers: Dict[str, Callable[..., Dict[str, Any]]] = {
            "get_device_status": self._get_device_status,
            "get_alarm_definition": get_alarm_definition,
            "get_device_history": self._get_device_history,
            "get_device_logs": get_device_logs,
            "search_knowledge": self._search_knowledge,
        }
        self.mcp = McpClient(self._handlers)

    def _get_device_status(self, device_id: str, **_: Any) -> Dict[str, Any]:
        return get_device_status(device_id=device_id, base_url=self.base_url)

    def _get_device_history(self, **arguments: Any) -> Dict[str, Any]:
        return get_device_history(base_url=self.base_url, **arguments)

    def _search_knowledge(self, **arguments: Any) -> Dict[str, Any]:
        query = str(arguments.get("query") or "").strip()
        if not query:
            return {
                "query": "",
                "documents": [],
                "total": 0,
                "found": False,
                "success": False,
                "source": "knowledge-mcp",
                "error": "query 不能为空",
            }
        try:
            limit = max(1, min(10, int(arguments.get("limit", 5))))
        except (TypeError, ValueError):
            limit = 5
        filters = arguments.get("filters")
        result = self.rag.search(query, limit=limit, filters=filters if isinstance(filters, Mapping) else {})
        result.setdefault("found", bool(result.get("documents")))
        result.setdefault("success", True)
        return result

    def tool_schemas(self):
        return [
            {
                "type": "function",
                "function": {
                    "name": "get_device_status",
                    "description": "通过PLC MCP查询设备当前运行状态。",
                    "parameters": {
                        "type": "object",
                        "properties": {"device_id": {"type": "string"}},
                        "required": ["device_id"],
                        "additionalProperties": False,
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "search_knowledge",
                    "description": "检索维修手册、SOP、报警库和历史案例，为诊断提供可溯源依据。",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "检索内容，例如主轴温度过高 冷却系统。",
                            },
                            "limit": {
                                "type": "integer",
                                "minimum": 1,
                                "maximum": 10,
                            },
                            "filters": {
                                "type": "object",
                                "description": "可选过滤条件，例如 knowledge_type、component 或 alarm_code。",
                                "additionalProperties": True,
                            },
                        },
                        "required": ["query"],
                        "additionalProperties": False,
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "name": "get_alarm_definition",
                    "description": "根据设备报警码查询报警名称、严重等级、含义和建议检查项。",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "alarm_code": {
                                "type": "string",
                                "description": "设备当前报警码，例如 E102 或 700223。",
                            }
                        },
                        "required": ["alarm_code"],
                        "additionalProperties": False,
                    },
                },
            }
            ,
            {
                "type": "function",
                "function": {
                    "name": "get_device_history",
                    "description": "查询设备过去一段时间的指标历史数据，用于判断持续上升、下降或重复异常趋势。",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "device_id": {
                                "type": "string",
                                "description": "设备编号，例如 TRAK-TC820LTYSI-001。",
                            },
                            "metric_keys": {
                                "type": "array",
                                "items": {"type": "string"},
                                "description": "可选指标 key；不传时返回设备所有可用指标，例如 spindle_temperature_c。",
                            },
                            "limit": {
                                "type": "integer",
                                "minimum": 3,
                                "maximum": 120,
                                "description": "返回最近多少个采样点。",
                            },
                        },
                        "required": ["device_id"],
                        "additionalProperties": False,
                    },
                },
            }
            ,
            {
                "type": "function",
                "function": {
                    "name": "get_device_logs",
                    "description": "查询设备日志、PLC事件、状态切换和错误记录，用于分析报警前后发生了什么。",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "device_id": {"type": "string"},
                            "limit": {"type": "integer", "minimum": 1, "maximum": 100},
                            "log_types": {"type": "array", "items": {"type": "string"}},
                        },
                        "required": ["device_id"],
                        "additionalProperties": False,
                    },
                },
            }
        ]

    def execute(self, name: str, arguments: Mapping[str, Any]) -> Dict[str, Any]:
        """执行已注册的本地 MCP 工具，并统一记录调用轨迹。"""

        server = {"get_device_status": "plc", "get_alarm_definition": "knowledge", "get_device_history": "plc", "get_device_logs": "plc", "search_knowledge": "knowledge"}.get(name, "knowledge")
        if self.trace:
            self.trace.record(type="tool", name=name, event="tool_started", tool=name, mcp_server=server, arguments=dict(arguments))
        try:
            result = self.mcp.call(server, name, arguments)
        except Exception as error:
            if self.trace:
                self.trace.record(type="tool", name=name, event="tool_error", tool=name, mcp_server=server, error=str(error))
            raise
        if self.trace:
            self.trace.record(type="tool", name=name, event="tool_completed", tool=name, mcp_server=server)
        return result
