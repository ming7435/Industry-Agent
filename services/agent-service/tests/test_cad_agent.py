import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.cad import CADAgent
from app.graph import build_orchestrator
from app.tools.registry import ToolRegistry


class CADAgentContractTests(unittest.TestCase):
    def setUp(self):
        self.tools = ToolRegistry()

    def test_cad_request_contract_returns_engineering_pack(self):
        result = CADAgent(self.tools).run({
            "request_id": "CADR-001",
            "device_id": "TC820LTYsi-001",
            "device_model": "TC820LTYsi",
            "component": "COOLING-PUMP",
            "part_no": "CP-TC820-015",
            "query": "冷却泵位于哪个总成，关联哪些零件？",
        })

        self.assertEqual(result.status, "completed")
        self.assertEqual(result.request_id, "CADR-001")
        self.assertEqual(result.device_id, "TC820LTYsi-001")
        self.assertEqual(result.component, "COOLING-PUMP")
        self.assertEqual(result.part_no, "CP-TC820-015")
        self.assertEqual(result.location, "机床后侧冷却单元")
        self.assertEqual(result.drawing_refs, ["DWG-TC820-COOLING-002"])
        self.assertEqual([item.component_id for item in result.components], ["COOLING-PUMP"])
        self.assertTrue(result.bom_items)
        self.assertTrue(result.assembly_relations)
        self.assertFalse(result.validation_findings)
        self.assertEqual(result.stop_reason, "validator_pass")

    def test_cad_agent_fallback_does_not_fabricate_data(self):
        result = CADAgent(self.tools).run({"query": "不存在的部件 XYZ-404", "device_id": "CNC-001"})

        self.assertEqual(result.status, "insufficient_engineering_data")
        self.assertEqual(result.components, [])
        self.assertEqual(result.confidence, 0.0)
        self.assertTrue(result.validation_findings)
        self.assertEqual(result.stop_reason, "cad_service_no_data")

    def test_orchestrator_exposes_cad_a2a_endpoint(self):
        orchestrator = build_orchestrator(tools=self.tools)
        result = orchestrator.run_user("冷却泵位于哪个总成，关联哪些零件？", {"component": "COOLING-PUMP", "part_no": "CP-TC820-015"})

        self.assertEqual(result["route"], "cad")
        self.assertEqual(result["cad"]["status"], "completed")
        self.assertEqual(result["cad"]["component"], "COOLING-PUMP")
        self.assertTrue(any(item.get("type") == "component" for item in result["cad"]["evidence"]))


if __name__ == "__main__":
    unittest.main()
