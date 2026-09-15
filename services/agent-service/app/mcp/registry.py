"""当前阶段的本地 MCP 工具注册器。"""

from __future__ import annotations

from typing import Any, Callable, Dict, Mapping

from app.tools.diagnosis import get_alarm_definition, get_device_history


class LocalMcpToolRegistry:
    """提供 MCP function tool 所需的 schema 和执行入口。"""

    def __init__(self, base_url: str | None = None) -> None:
        self.base_url = base_url
        self._handlers: Dict[str, Callable[..., Dict[str, Any]]] = {
            "get_alarm_definition": get_alarm_definition,
            "get_device_history": self._get_device_history,
        }

    def _get_device_history(self, **arguments: Any) -> Dict[str, Any]:
        return get_device_history(base_url=self.base_url, **arguments)

    def tool_schemas(self):
        return [
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
                                "description": "需要查询的指标 key，例如 spindle_temperature_c、lubrication_level_percent。",
                            },
                            "limit": {
                                "type": "integer",
                                "minimum": 3,
                                "maximum": 120,
                                "description": "返回最近多少个采样点。",
                            },
                        },
                        "required": ["device_id", "metric_keys"],
                        "additionalProperties": False,
                    },
                },
            }
        ]

    def execute(self, name: str, arguments: Mapping[str, Any]) -> Dict[str, Any]:
        handler = self._handlers.get(name)
        if handler is None:
            raise ValueError("未知工具：%s" % name)
        return handler(**dict(arguments))
