import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.diagnosis import DiagnosisAgent, DiagnosisRunCache
from app.agents.diagnosis.tool_policy import requires_history, select_skill
from app.mcp.registry import LocalMcpToolRegistry
from app.tools.diagnosis import get_alarm_definition, get_device_history, get_device_logs, get_device_status


class FakeLLMClient:
    available = True
    model = "shared-llm-test"
    provider = "llm-test"

    def __init__(self):
        self.calls = []

    def chat(self, messages, tools=None, tool_choice=None):
        self.calls.append({"messages": messages, "tools": tools, "tool_choice": tool_choice})
        if len(self.calls) == 1:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": None,
                        "tool_calls": [{
                            "id": "call_alarm_definition",
                            "type": "function",
                            "function": {
                                "name": "get_alarm_definition",
                                "arguments": json.dumps({"alarm_code": "E102"}),
                            },
                        }],
                    }
                }]
            }
        if len(self.calls) == 2:
            return {
                "choices": [{
                    "message": {
                        "role": "assistant",
                        "content": None,
                        "tool_calls": [{
                            "id": "call_history",
                            "type": "function",
                            "function": {
                                "name": "get_device_history",
                                "arguments": json.dumps({"device_id": "CNC-001", "metric_keys": ["spindle_temperature_c"]}),
                            },
                        }],
                    }
                }]
            }
        return {
            "choices": [{
                "message": {
                    "role": "assistant",
                    "content": json.dumps({
                        "summary": "设备 CNC-001 检测到主轴温度异常。",
                        "diagnosis": "主轴温度持续升高，建议检查冷却和主轴负载。",
                        "confidence": 0.82,
                        "next_action": "检查冷却液流量和主轴负载",
                    }, ensure_ascii=False),
                }
            }]
        }


class MissingKeyClient:
    available = False
    model = "shared-llm"


class HistoryLLMClient:
    available = True
    model = "shared-llm-history-test"

    def __init__(self):
        self.calls = []

    def chat(self, messages, tools=None, tool_choice=None):
        self.calls.append({"messages": messages, "tools": tools, "tool_choice": tool_choice})
        if len(self.calls) == 1:
            return {"choices": [{"message": {
                "role": "assistant",
                "tool_calls": [{
                    "id": "call_alarm",
                    "type": "function",
                    "function": {"name": "get_alarm_definition", "arguments": json.dumps({"alarm_code": "E102"})},
                }],
            }}]}
        if len(self.calls) == 2:
            return {"choices": [{"message": {
                "role": "assistant",
                "tool_calls": [{
                    "id": "call_history",
                    "type": "function",
                    "function": {"name": "get_device_history", "arguments": json.dumps({
                        "device_id": "CNC-001",
                        "metric_keys": ["spindle_temperature_c"],
                        "limit": 6,
                    })},
                }],
            }}]}
        return {"choices": [{"message": {
            "role": "assistant",
            "content": json.dumps({
                "summary": "主轴温度持续上升，属于持续性温升异常。",
                "diagnosis": "历史趋势显示温度连续升高，建议检查冷却和润滑。",
                "confidence": 0.9,
            }, ensure_ascii=False),
        }}]}


class ForbiddenToolLLMClient:
    available = True
    model = "shared-llm-forbidden-tool-test"

    def __init__(self):
        self.calls = []

    def chat(self, messages, tools=None, tool_choice=None):
        self.calls.append({"messages": messages, "tools": tools, "tool_choice": tool_choice})
        if len(self.calls) == 1:
            return {"choices": [{"message": {
                "role": "assistant",
                "tool_calls": [{
                    "id": "call_forbidden",
                    "type": "function",
                    "function": {"name": "create_workorder", "arguments": json.dumps({"device_id": "CNC-001"})},
                }],
            }}]}
        if len(self.calls) == 2:
            return {"choices": [{"message": {
                "role": "assistant",
                "tool_calls": [{
                    "id": "call_history_after_guard",
                    "type": "function",
                    "function": {"name": "get_device_history", "arguments": json.dumps({"device_id": "CNC-001"})},
                }],
            }}]}
        return {"choices": [{"message": {
            "role": "assistant",
            "content": json.dumps({
                "summary": "设备 CNC-001 出现无报警码异常。",
                "diagnosis": "已有异常指标但证据不足，需要人工复核现场状态。",
                "confidence": 0.42,
                "recommendation": "补充设备日志和历史趋势后再确认根因。",
            }, ensure_ascii=False),
        }}]}


class FakeHistoryRegistry(LocalMcpToolRegistry):
    def execute(self, name, arguments):
        if name == "get_device_history":
            return {
                "found": True,
                "device_id": arguments["device_id"],
                "sample_count": 6,
                "series": {"spindle_temperature_c": [
                    {"timestamp": "1", "value": 58.2},
                    {"timestamp": "2", "value": 56.4},
                    {"timestamp": "3", "value": 53.1},
                    {"timestamp": "4", "value": 49.8},
                    {"timestamp": "5", "value": 46.5},
                    {"timestamp": "6", "value": 43.7},
                ]},
            }
        return super().execute(name, arguments)


class DiagnosisAgentTests(unittest.TestCase):
    def event(self):
        return {
            "key": "event:CNC-001:2026-09-15T10:00:05",
            "device_id": "CNC-001",
            "event_type": "temperature",
            "severity": "high",
            "alarm_code": "E102",
            "abnormal_metrics": [{
                "label": "主轴温度",
                "value": 85,
                "unit": "°C",
            }],
            "realtime_snapshot": {
                "device_id": "CNC-001",
                "temperature": 85,
                "vibration": 2.1,
                "rpm": 3800,
            },
            "trigger_rules": ["threshold", "duration"],
            "timestamp": "2026-09-15T10:00:05",
        }

    def test_mock_alarm_definition_is_chinese_and_stable(self):
        result = get_alarm_definition("E102")

        self.assertTrue(result["found"])
        self.assertEqual(result["name"], "主轴温度异常")
        self.assertEqual(result["severity"], "high")
        self.assertEqual(result["severity_label"], "高级故障")

    def test_unknown_alarm_definition_is_explicitly_unresolved(self):
        result = get_alarm_definition("not-exists")

        self.assertFalse(result["found"])
        self.assertEqual(result["severity_label"], "未知")
        self.assertIn("没有找到", result["description"])

    def test_device_status_normalizes_factory_snapshot(self):
        payload = {
            "summary": {"updated_at": 1234567890},
            "devices": [{
                "device_id": "CNC-001",
                "name": "测试车床",
                "device_type": "turning_center",
                "status": "running",
                "mode": "AUTO",
                "cycle_state": "processing",
                "metrics": {"spindle_temperature_c": 82.5},
            }],
        }

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

            def read(self):
                return json.dumps(payload).encode("utf-8")

        with patch("app.tools.diagnosis.status.urlopen", return_value=FakeResponse()):
            result = get_device_status("CNC-001", base_url="http://factory.test")

        self.assertTrue(result["found"])
        self.assertEqual(result["status"], "running")
        self.assertEqual(result["metrics"]["spindle_temperature_c"], 82.5)
        self.assertEqual(result["source"], "plc-mcp")

    def test_device_history_returns_trend_summary(self):
        payload = {
            "history": [
                {"timestamp": "1", "metrics": {"spindle_temperature_c": 60}},
                {"timestamp": "2", "metrics": {"spindle_temperature_c": 65}},
                {"timestamp": "3", "metrics": {"spindle_temperature_c": 72}},
            ],
            "metric_definitions": {},
        }

        class FakeResponse:
            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

            def read(self):
                return json.dumps(payload).encode("utf-8")

        with patch("app.tools.diagnosis.history.urlopen", return_value=FakeResponse()):
            result = get_device_history(
                "CNC-001",
                metric_keys=["temperature"],
                limit=3,
                base_url="http://factory.test",
            )

        self.assertTrue(result["found"])
        self.assertEqual(result["metric_keys"], ["spindle_temperature_c"])
        self.assertEqual(result["trend"]["spindle_temperature_c"]["direction"], "rising")
        self.assertEqual(result["trend"]["spindle_temperature_c"]["latest"], 72.0)

    def test_device_logs_returns_mcp_compatible_result(self):
        result = get_device_logs("CNC-001")

        self.assertTrue(result["success"])
        self.assertTrue(result["found"])
        self.assertEqual(result["tool"], "get_device_logs")
        self.assertTrue(result["logs"])

    def test_agent_calls_alarm_tool_then_returns_model_result(self):
        client = FakeLLMClient()
        result = DiagnosisAgent(client=client).run(self.event())

        self.assertEqual(result.status.value, "completed")
        self.assertEqual(result.source, "llm-test")
        self.assertEqual(result.confidence, 0.82)
        self.assertEqual(result.alarm_definition["name"], "主轴温度异常")
        self.assertEqual(len(result.tool_calls), 2)
        self.assertEqual(result.tool_calls[0]["name"], "get_alarm_definition")
        self.assertEqual(result.tool_calls[1]["name"], "get_device_history")
        self.assertEqual(result.event_id, "event:CNC-001:2026-09-15T10:00:05")
        self.assertEqual(len(client.calls), 3)
        self.assertIsNotNone(client.calls[0]["tools"])

    def test_agent_has_local_fallback_when_llm_is_unavailable(self):
        result = DiagnosisAgent(client=MissingKeyClient()).run(self.event())

        self.assertEqual(result.status.value, "fallback")
        self.assertEqual(result.source, "local_fallback")
        self.assertIn("主轴温度异常", result.summary)
        self.assertIn("85°C", result.summary)
        self.assertEqual(result.tool_calls[0]["name"], "get_alarm_definition")

    def test_agent_uses_shared_llm_provider_when_client_is_not_injected(self):
        client = MissingKeyClient()

        with patch("app.agents.diagnosis.agent.get_default_llm_client", return_value=client) as provider:
            agent = DiagnosisAgent()

        provider.assert_called_once_with()
        self.assertIs(agent.client, client)

    def test_same_event_revision_is_idempotent(self):
        client = FakeLLMClient()
        cache = DiagnosisRunCache()
        agent = DiagnosisAgent(client=client, run_cache=cache)
        event = self.event()

        first = agent.run(event)
        second = agent.run(event)

        self.assertFalse(first.cached)
        self.assertTrue(second.cached)
        self.assertEqual(first.diagnosis_run_id, second.diagnosis_run_id)
        self.assertEqual(len(client.calls), 3)
        self.assertEqual(len(cache), 1)

    def test_event_revision_upgrade_runs_again(self):
        first_client = FakeLLMClient()
        agent = DiagnosisAgent(client=first_client)
        event = self.event()

        first = agent.run(event)
        event["event_revision"] = 2
        second_client = FakeLLMClient()
        agent.client = second_client
        second = agent.run(event)

        self.assertFalse(second.cached)
        self.assertNotEqual(first.diagnosis_run_id, second.diagnosis_run_id)
        self.assertEqual(len(first_client.calls), 3)
        self.assertEqual(len(second_client.calls), 3)

    def test_skill_selection_composes_alarm_trend_multi_metric_and_safety(self):
        event = self.event()
        event.update({
            "severity": "critical",
            "event_type": "multi_metric",
            "duration_seconds": 12,
            "abnormal_metrics": event["abnormal_metrics"] + [{"label": "主轴振动", "value": 4.2, "unit": "mm/s"}],
        })

        selected = select_skill(event)

        self.assertEqual(
            selected["skills"],
            ["alarm_diagnosis_skill", "multi_metric_diagnosis_skill", "trend_diagnosis_skill", "safety_triage_skill"],
        )
        self.assertTrue(requires_history(event))
        self.assertNotIn("get_device_status", selected["allowed_tools"])

    def test_registry_exposes_design_diagnosis_tools(self):
        registry = LocalMcpToolRegistry()

        names = [item["function"]["name"] for item in registry.tool_schemas()]
        self.assertEqual(names, ["get_device_status", "search_knowledge", "get_alarm_definition", "get_device_history", "get_device_logs"])
        search_schema = registry.tool_schemas()[1]["function"]["parameters"]
        history_schema = registry.tool_schemas()[3]["function"]["parameters"]
        logs_schema = registry.tool_schemas()[4]["function"]["parameters"]
        self.assertIn("filters", search_schema["properties"])
        self.assertEqual(history_schema["required"], ["device_id"])
        self.assertEqual(logs_schema["required"], ["device_id"])

    def test_registry_can_search_manual_knowledge(self):
        registry = LocalMcpToolRegistry()

        result = registry.execute("search_knowledge", {"query": "主轴 温度 冷却"})

        self.assertEqual(result["source"], "local-hybrid-compatible")
        self.assertTrue(result["documents"])

    def test_registry_returns_structured_error_for_empty_knowledge_query(self):
        registry = LocalMcpToolRegistry()

        result = registry.execute("search_knowledge", {"query": ""})

        self.assertEqual(result["total"], 0)
        self.assertIn("不能为空", result["error"])

    def test_agent_can_continue_from_alarm_definition_to_history(self):
        client = HistoryLLMClient()
        result = DiagnosisAgent(client=client, tools=FakeHistoryRegistry()).run(self.event())

        self.assertEqual(result.status.value, "completed")
        self.assertEqual(len(client.calls), 3)
        self.assertEqual(
            [item["name"] for item in result.tool_calls],
            ["get_alarm_definition", "get_device_history"],
        )
        self.assertIn("历史趋势", result.diagnosis)

    def test_tool_guard_denies_non_diagnosis_tool(self):
        event = self.event()
        event.pop("alarm_code")
        client = ForbiddenToolLLMClient()

        result = DiagnosisAgent(client=client).run(event)

        self.assertEqual(result.status.value, "completed")
        self.assertEqual(result.tool_calls[0]["name"], "create_workorder")
        self.assertEqual(result.tool_calls[0]["guard"], "deny")
        self.assertEqual(result.tool_calls[0]["result"]["error"]["code"], "TOOL_NOT_ALLOWED")
        self.assertEqual(result.tool_calls[1]["name"], "get_device_history")
        exposed_tools = [item["function"]["name"] for item in client.calls[0]["tools"]]
        self.assertNotIn("create_workorder", exposed_tools)
        self.assertIn("get_device_logs", exposed_tools)

    def test_result_keeps_event_and_task_metadata(self):
        event = self.event()
        event["event_id"] = "EVT-20260915-100005-000"
        event["task_id"] = "TASK-20260915-100005-000"
        event["event_revision"] = 2
        event["trigger_reason"] = "故障等级升级"
        result = DiagnosisAgent(client=FakeLLMClient()).run(event)

        payload = result.to_dict()
        self.assertEqual(payload["event_id"], "EVT-20260915-100005-000")
        self.assertEqual(payload["task_id"], "TASK-20260915-100005-000")
        self.assertEqual(payload["triggered_at"], "2026-09-15T10:00:05")
        self.assertEqual(payload["event_revision"], 2)
        self.assertEqual(payload["trigger_cause"], "故障等级升级")


if __name__ == "__main__":
    unittest.main()
