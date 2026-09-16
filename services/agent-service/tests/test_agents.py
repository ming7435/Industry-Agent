import sys
import json
import tempfile
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents import CADAgent, KnowledgeAgent, MaintenanceAgent, QualityAgent, ReportAgent, RouterAgent
from app.agents.diagnosis import DiagnosisAgent
from app.agents.registry import CORE_AGENT_REGISTRY
from app.experience import ExperienceLearningModule
from app.graph import build_orchestrator
from app.tools.registry import ToolRegistry
from app.tools.workorder import WorkOrderService
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
        workorders = WorkOrderService(self.tools)
        order = workorders.create_from_plan(plan)
        workorders.mark_repair_completed(order.workorder_id, feedback="已检查冷却泵并完成空载复测")
        quality = QualityAgent(self.tools).run({"workorder": workorders.get(order.workorder_id)})
        report = ReportAgent().run({"diagnosis": diagnosis, "maintenance_plan": plan.model_dump(), "workorder": workorders.get(order.workorder_id), "quality": quality.model_dump()})

        self.assertEqual(route.intent, "knowledge")
        self.assertTrue(knowledge.documents)
        self.assertEqual(knowledge.status, "completed")
        self.assertTrue(knowledge.evidence)
        self.assertTrue(knowledge.sources)
        self.assertTrue(cad.components)
        self.assertEqual(cad.status, "completed")
        self.assertTrue(cad.drawings)
        self.assertTrue(cad.bom_items)
        self.assertTrue(cad.assembly_relations)
        self.assertTrue(plan.repair_steps)
        self.assertEqual(order.status, "open")
        self.assertTrue(quality.passed)
        self.assertEqual(quality.status, "pass")
        self.assertTrue(quality.workorder_compliance)
        self.assertTrue(quality.sop_compliant)
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
        self.assertEqual(result["report"]["report_type"], "full_case_report")
        self.assertEqual(result["report"]["status"], "completed")
        self.assertTrue(result["report"]["source_refs"])
        self.assertEqual(result["workorder"]["status"], "closed")
        self.assertTrue(result["quality"]["passed"])
        self.assertTrue(result["experience"]["memory_saved"])
        self.assertEqual(
            set(orchestrator.nodes.harnesses),
            {"router", "diagnosis", "knowledge", "cad", "maintenance", "quality", "report"},
        )
        self.assertTrue({"agent", "node", "tool", "module"}.issubset({item.get("type") for item in result["trace"]}))

    def test_workorder_intent_is_a_business_node_action(self):
        result = self.tools.intent_classifier_tool("请查询工单 WO-001 的维修状态")
        self.assertEqual(result["intent"], "workorder_action")

    def test_router_sends_engineering_location_questions_to_cad(self):
        route = RouterAgent().run("主轴温度传感器在哪里")
        tool_route = self.tools.intent_classifier_tool("主轴温度传感器在哪里")

        self.assertEqual(route.intent, "cad")
        self.assertEqual(tool_route["intent"], "cad")

    def test_router_sends_alarm_code_questions_to_knowledge(self):
        route = RouterAgent().run("E102 主轴温度怎么处理")
        tool_route = self.tools.intent_classifier_tool("E102 主轴温度怎么处理")

        self.assertEqual(route.intent, "knowledge")
        self.assertEqual(tool_route["intent"], "knowledge")

    def test_router_sends_repair_questions_to_maintenance(self):
        route = RouterAgent().run("主轴冷却泵怎么维修")
        tool_route = self.tools.intent_classifier_tool("主轴冷却泵怎么维修")

        self.assertEqual(route.intent, "maintenance")
        self.assertEqual(tool_route["intent"], "maintenance")

    def test_knowledge_agent_returns_evidence_pack(self):
        result = KnowledgeAgent(self.tools).run({"query": "700223 主轴过热", "required_sources": ["alarm"]})

        self.assertEqual(result.status, "completed")
        self.assertEqual(result.query_type, "alarm")
        self.assertTrue(result.summary)
        self.assertTrue(result.evidence)
        self.assertTrue(result.sources)
        self.assertGreater(result.confidence, 0)
        self.assertTrue(result.degraded)
        self.assertEqual(result.backend_status, "local_fallback")
        self.assertEqual(result.documents[0].document_id, "ALARM-700223")

    def test_knowledge_agent_reports_insufficient_evidence(self):
        result = KnowledgeAgent(self.tools).run({"query": "完全不存在的故障码 X999999", "filters": {"component": "不存在部件"}})

        self.assertEqual(result.status, "insufficient_evidence")
        self.assertEqual(result.confidence, 0.0)
        self.assertEqual(result.documents, [])
        self.assertIn("未检索到", result.summary)

    def test_cad_agent_returns_engineering_pack(self):
        result = CADAgent(self.tools).run({"query": "主轴 温度 冷却", "device_id": "CNC-001"})

        component_ids = {item.component_id for item in result.components}
        self.assertEqual(result.status, "completed")
        self.assertIn("TEMP-PT100", component_ids)
        self.assertIn("COOLING-PUMP", component_ids)
        self.assertTrue(result.drawings)
        self.assertTrue(result.bom_items)
        self.assertTrue(result.assembly_relations)
        self.assertTrue(result.evidence)
        self.assertGreater(result.confidence, 0.8)

    def test_cad_agent_reports_insufficient_engineering_data(self):
        result = CADAgent(self.tools).run({"query": "不存在的部件 XYZ-404", "device_id": "CNC-001"})

        self.assertEqual(result.status, "insufficient_engineering_data")
        self.assertEqual(result.components, [])
        self.assertEqual(result.confidence, 0.0)

    def test_maintenance_agent_builds_workorder_ready_plan(self):
        knowledge = KnowledgeAgent(self.tools).run({"query": "E102 主轴温度 SOP", "required_sources": ["sop"]})
        cad = CADAgent(self.tools).run({"query": "主轴 温度 冷却", "device_id": "CNC-001"})
        result = MaintenanceAgent(self.tools).run({
            "diagnosis": {
                "device_id": "CNC-001",
                "fault": "主轴温度异常",
                "cause": "冷却系统可能异常",
                "severity": "高级故障",
                "confidence": 0.86,
                "evidence": ["温度超过阈值", "E102 报警触发"],
            },
            "knowledge": knowledge.model_dump(),
            "cad": cad.model_dump(),
        })

        self.assertEqual(result.repair_target, "主轴冷却系统")
        self.assertTrue(result.workorder_ready)
        self.assertFalse(result.validation_findings)
        self.assertTrue(result.pre_checks)
        self.assertTrue(result.post_checks)
        self.assertTrue(result.required_tools)
        self.assertTrue(result.required_parts)
        self.assertTrue(result.safety_requirements)
        self.assertIn("TEMP-PT100", result.cad_components)
        self.assertTrue(any(item.get("type") == "inventory" for item in result.evidence))

    def test_maintenance_agent_marks_missing_cad_as_not_ready(self):
        result = MaintenanceAgent(self.tools).run({
            "diagnosis": {
                "device_id": "CNC-001",
                "fault": "主轴温度异常",
                "cause": "冷却系统可能异常",
                "severity": "high",
            },
            "knowledge": {"documents": [{"document_id": "SOP-1"}], "evidence": [{"document_id": "SOP-1"}]},
            "cad": {"components": [], "bom_items": [], "evidence": []},
        })

        self.assertFalse(result.workorder_ready)
        self.assertIn("涉及拆装或部件操作但缺少 CAD/BOM 依据", result.validation_findings)

    def test_quality_agent_requires_completed_workorder_and_feedback(self):
        workorders = WorkOrderService(self.tools)
        order = workorders.create("CNC-001", "主轴温度维修", steps=["检查冷却泵"])
        open_quality = QualityAgent(self.tools).run({"workorder": workorders.get(order["workorder_id"])})
        workorders.mark_repair_completed(order["workorder_id"])
        missing_feedback = QualityAgent(self.tools).run({"workorder": workorders.get(order["workorder_id"])})
        workorders.mark_repair_completed(order["workorder_id"], feedback="已检查冷却泵，报警已清除")
        passed = QualityAgent(self.tools).run({"workorder": workorders.get(order["workorder_id"])})

        self.assertFalse(open_quality.passed)
        self.assertIn("workorder_not_completed", open_quality.failed_checks)
        self.assertFalse(missing_feedback.passed)
        self.assertIn("repair_feedback_missing", missing_feedback.failed_checks)
        self.assertTrue(passed.passed)
        self.assertTrue(passed.alarm_cleared)
        self.assertTrue(passed.parameters_recovered)
        self.assertTrue(any(item.get("type") == "sop" for item in passed.evidence))

    def test_report_agent_separates_plan_execution_and_quality_sources(self):
        report = ReportAgent().run({
            "report_type": "full_case_report",
            "task_id": "TASK-REPORT-001",
            "trace_id": "TRACE-REPORT-001",
            "diagnosis": {
                "event_id": "EVT-001",
                "device_id": "CNC-001",
                "fault": "主轴温度异常",
                "diagnosis_run_id": "RUN-001",
                "source": "deepseek",
            },
            "maintenance_plan": {
                "plan_id": "PLAN-001",
                "repair_target": "主轴冷却系统",
                "repair_steps": ["检查冷却泵"],
                "source_documents": ["SOP-COOLING-001"],
                "cad_components": ["COOLING-PUMP"],
            },
            "workorder": {
                "workorder_id": "WO-001",
                "device_id": "CNC-001",
                "plan_id": "PLAN-001",
                "status": "closed",
                "title": "主轴温度维修",
                "steps": ["检查冷却泵"],
                "repair_feedback": "已检查冷却泵并完成复测",
            },
            "quality": {
                "workorder_id": "WO-001",
                "passed": True,
                "status": "pass",
                "device_recovered": True,
                "alarm_cleared": True,
                "sop_compliant": True,
                "evidence": [{"type": "sop", "document_id": "SOP-COOLING-001"}],
            },
            "trace": [{"type": "agent", "name": "diagnosis"}, {"type": "node", "name": "workorder"}],
        })

        self.assertEqual(report.report_type, "full_case_report")
        self.assertEqual(report.status, "completed")
        self.assertEqual(report.sections["maintenance_plan"]["repair_steps"], ["检查冷却泵"])
        self.assertEqual(report.sections["workorder"]["repair_feedback"], "已检查冷却泵并完成复测")
        self.assertTrue(any(item["section"] == "maintenance_plan" and item["id"] == "SOP-COOLING-001" for item in report.source_refs))
        self.assertTrue(any(item["section"] == "workorder" and item["id"] == "WO-001" for item in report.source_refs))
        self.assertTrue(any(item["section"] == "quality" and item["id"] == "WO-001" for item in report.source_refs))

    def test_report_agent_marks_missing_sources_incomplete_without_inventing_facts(self):
        report = ReportAgent().run({
            "report_type": "maintenance_report",
            "diagnosis": {"device_id": "CNC-001", "fault": "主轴温度异常"},
            "maintenance_plan": {"plan_id": "PLAN-001", "repair_target": "主轴冷却系统", "repair_steps": ["检查冷却泵"]},
        })

        self.assertEqual(report.status, "incomplete")
        self.assertTrue(report.validation_findings)
        self.assertIn("workorder", report.validation_findings[0] or "")
        self.assertIn("主轴温度异常", report.summary)
        self.assertNotIn("根因已确认", report.summary)

    def test_core_agent_registry_and_experience_module(self):
        self.assertEqual(set(CORE_AGENT_REGISTRY), {"router", "diagnosis", "knowledge", "cad", "maintenance", "quality", "report"})
        module = ExperienceLearningModule()
        result = module.learn({
            "diagnosis": {"device_id": "CNC-001", "fault": "主轴温度异常"},
            "maintenance_plan": {"repair_steps": ["检查冷却泵"]},
            "workorder": {"workorder_id": "WO-001", "device_id": "CNC-001", "title": "主轴温度维修", "status": "closed"},
            "quality": {"passed": True, "findings": ["报警已清除"]},
            "report": {"report_id": "RPT-001"},
        })

        self.assertEqual(result.device_id, "CNC-001")
        self.assertTrue(result.memory_saved)
        self.assertTrue(result.rag_saved)
        found = module.rag.search("主轴温度维修")
        self.assertTrue(found["documents"])

    def test_rag_search_keeps_field_design_metadata(self):
        result = self.tools.search_knowledge("700223 主轴过热")

        self.assertEqual(result["source"], "local-hybrid-compatible")
        self.assertEqual(result["connection_status"], "local_fallback")
        self.assertTrue(result["degraded"])
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
