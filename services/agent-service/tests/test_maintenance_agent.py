import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.cad import CADAgent
from app.agents.knowledge import KnowledgeAgent
from app.agents.maintenance import MaintenanceAgent
from app.graph import build_orchestrator
from app.tools.registry import ToolRegistry


class MaintenanceAgentContractTests(unittest.TestCase):
    def setUp(self):
        self.tools = ToolRegistry()

    def test_maintenance_plan_uses_knowledge_cad_inventory_and_draft(self):
        knowledge = KnowledgeAgent(self.tools).run({"query": "E102 主轴温度 SOP", "required_sources": ["sop"]})
        cad = CADAgent(self.tools).run({"query": "主轴 温度 冷却", "device_id": "CNC-001"})
        result = MaintenanceAgent(self.tools).run({
            "task_id": "TASK-001",
            "trace_id": "TRACE-001",
            "device_id": "CNC-001",
            "diagnosis_result": {
                "device_id": "CNC-001",
                "fault": "主轴温度异常",
                "cause": "冷却系统可能异常",
                "severity": "高级故障",
                "confidence": 0.86,
                "evidence": ["温度超过阈值", "E102 报警触发"],
            },
            "knowledge": knowledge.model_dump(mode="json"),
            "cad": cad.model_dump(mode="json"),
            "constraints": {"need_workorder": True},
        })

        self.assertEqual(result.repair_target, "主轴冷却系统")
        self.assertTrue(result.workorder_ready)
        self.assertTrue(result.required_tools)
        self.assertTrue(result.required_parts)
        self.assertTrue(result.safety_requirements)
        self.assertTrue(result.pre_checks)
        self.assertTrue(result.post_checks)
        self.assertTrue(result.inventory_status.get("parts"))
        self.assertTrue(result.part_availability.get("available"))
        self.assertTrue(result.workorder_draft.get("ready"))
        self.assertFalse(result.validation_findings)

    def test_maintenance_blocks_workorder_without_sop_and_cad_evidence(self):
        result = MaintenanceAgent(self.tools).run({
            "diagnosis_result": {
                "device_id": "CNC-001",
                "fault": "主轴温度异常",
                "cause": "冷却系统可能异常",
                "severity": "high",
            },
            "knowledge": {"documents": [], "evidence": []},
            "cad": {"components": [], "bom_items": [], "evidence": []},
        })

        self.assertFalse(result.workorder_ready)
        self.assertTrue(any("SOP" in item or "知识库" in item for item in result.validation_findings))
        self.assertIn("涉及拆装或部件操作但缺少 CAD/BOM 依据", result.validation_findings)
        self.assertFalse(result.workorder_draft.get("ready"))

    def test_orchestrator_routes_user_repair_question_through_maintenance_a2a(self):
        orchestrator = build_orchestrator(tools=self.tools)
        result = orchestrator.run_user("CNC-001 主轴冷却泵怎么维修", {"device_id": "CNC-001"})

        self.assertEqual(result["route"], "maintenance")
        self.assertIn("maintenance_plan", result)
        self.assertTrue(result["maintenance_plan"]["repair_steps"])
        self.assertTrue(result["maintenance_plan"]["workorder_draft"])
        self.assertTrue(any(item.get("name") == "maintenance" and item.get("event") == "agent_completed" for item in result["trace"]))


if __name__ == "__main__":
    unittest.main()
