"""只隔离外部模型、检索和设备边界，保留真实容器与业务函数。"""

from copy import deepcopy
from pathlib import Path
from typing import Any
import json

import pytest

from app.agents.diagnosis import DiagnosisAgent
from app.config import get_settings
from app.graph.workflow import AgentOrchestrator
from app.runtime.container import AgentContainer
from app.tools.registry import ToolRegistry


class ScriptedModel:
    model = "isolated-test-model"

    def __init__(self, responses):
        self.responses = deepcopy(responses)
        self.available = bool(responses)
        self.calls = []

    def chat(self, messages, **kwargs):
        self.calls.append({"messages": deepcopy(messages), **deepcopy(kwargs)})
        if not self.responses:
            raise AssertionError("测试模型响应已耗尽，禁止回退到收费模型")
        return self.responses.pop(0)


class ScriptedRAG:
    def __init__(self, results):
        self.results = deepcopy(results)
        self.calls = []

    def search(self, query, **kwargs):
        self.calls.append({"query": query, **deepcopy(kwargs)})
        return self.results.pop(0) if self.results else {"documents": [], "source": "isolated-test-rag"}

    def ingest(self, **_kwargs):
        raise AssertionError("此门禁测试不得提前写入维修经验")


class ExternalBoundary:
    def __init__(self, original_call):
        self.original_call = original_call
        self.calls = []
        self.responses = {}

    def __call__(self, server, operation, arguments):
        self.calls.append((server, operation, deepcopy(arguments)))
        if (server, operation) in self.responses:
            response = self.responses[(server, operation)]
            return deepcopy(response(arguments) if callable(response) else response)
        if server in {"plc", "cad"}:
            raise AssertionError("门禁测试不得访问外部设备或 CAD：" + operation)
        # 库存、工单、报告仍执行真实处理器，存储路径由测试夹具隔离。
        return self.original_call(server, operation, arguments)


def build_test_orchestrator(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
    *,
    model_responses: list[dict[str, Any]],
    rag_results: list[dict[str, Any]],
) -> AgentOrchestrator:
    for key in (
        "MODEL_SERVICE_BASE_URL", "BACKEND_SERVICE_BASE_URL", "RAG_SERVICE_BASE_URL",
        "CAD_SERVICE_BASE_URL", "MCP_PLC_URL", "MCP_CAD_URL", "MCP_MES_URL",
        "MCP_QMS_URL", "MCP_INVENTORY_URL", "MYSQL_HOST", "MYSQL_PASSWORD",
        "DEEPSEEK_API_KEY", "SILICONFLOW_API_KEY", "FACTORY_CONTROL_MODE",
    ):
        monkeypatch.setenv(key, "")
    monkeypatch.setenv("FACTORY_API_BASE_URL", "http://127.0.0.1:9")
    for key in (
        "EVENT_STORE_PATH", "WORKORDER_STORE_PATH", "LEARNING_RESULT_STORE_PATH",
        "REPORT_STORE_PATH", "PENDING_TASK_STORE_PATH", "LINE_SAFETY_STORE_PATH",
    ):
        monkeypatch.setenv(key, str(tmp_path / (key.lower() + ".sqlite3")))
    get_settings.cache_clear()
    model = ScriptedModel(model_responses)
    rag = ScriptedRAG(rag_results)
    tools = ToolRegistry(rag_client=rag)
    boundary = ExternalBoundary(tools.mcp.call)
    monkeypatch.setattr(tools.mcp, "call", boundary)
    container = AgentContainer(diagnosis_agent=DiagnosisAgent(client=model, tools=tools), tools=tools)
    runtime = AgentOrchestrator(container=container)
    runtime.test_model = model
    runtime.test_rag = rag
    runtime.test_boundary = boundary
    return runtime


def candidate(confidence, fault="检修"):
    return {"choices": [{"message": {"role": "assistant", "content": json.dumps({
        "summary": fault, "diagnosis": fault, "confidence": confidence,
        "recommendation": "检查设备", "maintenance_required": True,
    }, ensure_ascii=False)}}]}


def documents(device_id="D-SLIM", query="检修"):
    return [{
        "document_id": device_id + "-" + kind, "title": query,
        "content": query + "：先确认安全隔离，再检查设备并记录维修结果。",
        "source": "isolated-test-manual", "score": 0.99,
        "metadata": {"device_id": device_id, "knowledge_type": kind},
    } for kind in ("manual", "sop", "case", "alarm")]


def build_fault_scenario(tmp_path, monkeypatch, *, review=False, missing_stock_once=False,
                         device_id="D-SLIM", event_id="EVT-SLIM", fault="检修"):
    log_response = {"choices": [{"message": {"role": "assistant", "content": "", "tool_calls": [{
        "id": "READ-" + device_id, "type": "function", "function": {
            "name": "get_device_logs", "arguments": json.dumps({"device_id": device_id}),
        },
    }]}}]}
    responses = ([candidate(0.42, fault), candidate(0.42, fault)] if review else [])
    responses += [candidate(0.95, fault), log_response, candidate(0.95, fault)]
    runtime = build_test_orchestrator(tmp_path, monkeypatch, model_responses=responses,
                                      rag_results=[{"documents": documents(device_id, fault)}] * 6)
    # 使用显式测试 CAD 地址满足生产范围门禁；所有请求由下面的边界拦截。
    runtime.container.tools.cad_base_url = "http://127.0.0.1:9"
    boundary = runtime.test_boundary
    boundary.responses[("knowledge", "get_alarm_definition")] = {
        "success": True, "found": True, "alarm_code": "700001", "name": fault,
        "description": fault, "source": "isolated-test-alarm",
    }
    boundary.responses[("plc", "get_device_logs")] = {
        "success": True, "found": True, "device_id": device_id,
        "logs": [{"message": fault + "检查记录"}], "source": "isolated-test-device",
    }
    engineering = {
        "components": [{"component_id": "C-" + device_id, "name": "检修部件",
                        "device_id": device_id, "part_no": "PART-001", "drawing_ref": "DRAW-001"}],
        "drawings": [{"drawing_id": "DRAW-001", "component_id": "C-" + device_id}],
        "bom_items": [{"component_id": "C-" + device_id, "part_no": "PART-001", "name": "检修部件"}],
        "source": "document-cad-service-isolated-test", "synthetic": False, "degraded": False,
    }
    for operation in ("query_part", "query_drawing", "query_bom", "query_relation", "fetch_engineering_record"):
        boundary.responses[("cad", operation)] = engineering
    stock = {"parts": [{"part_id": "PART-001", "part_no": "PART-001", "name": "检修部件",
                         "available": True, "stock": 1}], "source": "isolated-test-inventory"}
    stock_responses = ([{"parts": [], "source": "isolated-test-inventory"}] if missing_stock_once else []) + [stock]
    def inventory(_arguments):
        return stock_responses.pop(0) if len(stock_responses) > 1 else stock_responses[0]
    boundary.responses[("inventory", "query_inventory")] = inventory
    boundary.responses[("inventory", "query_part_availability")] = {"available": True, **stock}
    boundary.responses[("mes", "query_technicians")] = {"items": [{
        "technician_id": "TEST-REGISTERED-U1", "primary_device_id": device_id,
        "available": True, "workload": 0,
    }], "source": "isolated-test-registered-team"}
    for operation in ("query_technician_skills", "query_technician_workload"):
        boundary.responses[("mes", operation)] = {"items": []}
    boundary.responses[("mes", "query_shift")] = {"shift": "test"}
    boundary.responses[("mes", "query_team_availability")] = {"available": True}
    # 本地 MES 的人员与库存查询是外部适配点；状态迁移和 SQLite 写入仍用原实现。
    monkeypatch.setattr(runtime.container.registry.workorder_mcp, "query_technicians",
                        lambda **_kwargs: deepcopy(boundary.responses[("mes", "query_technicians")]))
    reservations = []
    def reserve_inventory(**arguments):
        assert arguments["workorder_id"] and arguments["part_no"] and arguments["quantity"] > 0
        reservations.append(deepcopy(arguments))
        return {"success": True, "reserved": True, **arguments, "source": "isolated-test-inventory"}
    monkeypatch.setattr(runtime.container.registry.workorder_mcp, "reserve_inventory", reserve_inventory)
    runtime.test_reservations = reservations
    event = {"event_id": event_id, "device_id": device_id, "alarm_code": "700001",
             "realtime_snapshot": {"device_id": device_id, "status": "fault", "metrics": {"signal": 1}}}
    return runtime, event
