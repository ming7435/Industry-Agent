import sys
import json
import tempfile
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents import CADAgent, ExperienceAgent, KnowledgeAgent, MaintenanceAgent, QualityAgent, ReportAgent, RouterAgent, WorkOrderAgent
from app.agents.diagnosis import DiagnosisAgent
from app.graph import build_orchestrator
from app.tools.registry import ToolRegistry
from app.rag import RAGIndex


class MissingKeyClient:
    available = False
    model = "deepseek-chat"


class AllAgentTests(unittest.TestCase):
    def setUp(self):
        self.tools = ToolRegistry()

    def test_all_domain_agents_are_callable(self):
        route = RouterAgent().run("请查询主轴温升检查SOP")
        knowledge = KnowledgeAgent(self.tools).run("主轴 温度 冷却")
        cad = CADAgent(self.tools).run({"query": "主轴 温度", "device_id": "CNC-001"})
        diagnosis = {
            "device_id": "CNC-001",
            "fault": "主轴温度异常",
            "cause": "冷却系统可能异常",
            "severity": "高级故障",
            "confidence": 0.8,
            "evidence": ["温度超过阈值"],
        }
        plan = MaintenanceAgent().run({"diagnosis": diagnosis, "knowledge": knowledge.model_dump(), "cad": cad.model_dump()})
        order_agent = WorkOrderAgent(self.tools)
        order = order_agent.run({"plan": plan.model_dump()})
        order_agent.update(order.workorder_id, "completed")
        quality = QualityAgent(self.tools).run({"workorder": order.model_dump()})
        report = ReportAgent().run({"diagnosis": diagnosis, "maintenance_plan": plan.model_dump(), "workorder": order.model_dump(), "quality": quality.model_dump()})

        self.assertEqual(route.intent, "knowledge")
        self.assertTrue(knowledge.documents)
        self.assertTrue(cad.components)
        self.assertTrue(plan.repair_steps)
        self.assertEqual(order.status, "open")
        self.assertTrue(quality.passed)
        self.assertTrue(report.report_id)

    def test_automatic_event_runs_full_agent_chain(self):
        orchestrator = build_orchestrator(diagnosis_agent=DiagnosisAgent(client=MissingKeyClient()))
        result = orchestrator.run_abnormal_event({
            "event_id": "EVT-001",
            "device_id": "CNC-001",
            "alarm_code": "E102",
            "severity": "high",
            "abnormal_metrics": [{"label": "主轴温度", "value": 85, "unit": "°C"}],
            "timestamp": "2026-09-15T10:00:05",
        })

        for key in ("diagnosis", "knowledge", "cad", "maintenance_plan", "workorder", "quality", "report", "experience", "memory", "trace"):
            self.assertIn(key, result)
        self.assertEqual(result["report"]["report_type"], "maintenance")
        self.assertEqual(result["workorder"]["status"], "completed")
        self.assertTrue(result["quality"]["passed"])
        self.assertTrue(result["experience"]["memory_saved"])

    def test_experience_agent_writes_memory_and_rag(self):
        agent = ExperienceAgent()
        result = agent.run({
            "diagnosis": {"device_id": "CNC-001", "fault": "主轴温度异常"},
            "maintenance_plan": {"repair_steps": ["检查冷却泵"]},
            "workorder": {"workorder_id": "WO-001", "device_id": "CNC-001", "title": "主轴温度维修"},
            "quality": {"passed": True, "findings": ["报警已清除"]},
            "report": {"report_id": "RPT-001"},
        })

        self.assertEqual(result.device_id, "CNC-001")
        self.assertTrue(result.memory_saved)
        self.assertTrue(result.rag_saved)
        found = agent.rag.search("主轴温度维修")
        self.assertTrue(found["documents"])

    def test_rag_search_keeps_field_design_metadata(self):
        result = self.tools.search_knowledge("700223 主轴过热")

        self.assertEqual(result["source"], "local-hybrid-compatible")
        self.assertTrue(result["documents"])
        document = result["documents"][0]
        self.assertEqual(document["document_id"], "ALARM-700223")
        self.assertEqual(document["metadata"]["alarm_code"], "700223")
        self.assertEqual(document["metadata"]["collection"], "maint_fault_events")

    def test_rag_jsonl_ingest_and_filter(self):
        index = RAGIndex()
        with tempfile.NamedTemporaryFile("w", suffix="_报警码数据.jsonl", encoding="utf-8", delete=False) as stream:
            json.dump({
                "id": "FAULT-1",
                "title": "液压压力不足",
                "alarm_code": "E900",
                "component": "液压系统",
                "knowledge_type": "alarm",
                "symptom": "液压压力低",
                "checks": ["检查液压油位"],
                "source_file": "维修手册/报警码数据.jsonl",
            }, stream, ensure_ascii=False)
            stream.write("\n")
            path = stream.name

        try:
            result = index.ingest_jsonl(path)
            self.assertEqual(result["loaded"], 1)
            found = index.search("E900 液压", filters={"component": "液压系统"})
            self.assertEqual(found["documents"][0]["document_id"], "FAULT-1")
            self.assertIn("液压压力低", found["documents"][0]["content"])
        finally:
            Path(path).unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
