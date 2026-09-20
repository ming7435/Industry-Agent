import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.cad.graph import load_skill as load_cad_skill
from app.agents.diagnosis import DiagnosisAgent
from app.agents.knowledge.graph import load_skill as load_knowledge_skill
from app.skills import get_skill_registry


class SkillRegistryTests(unittest.TestCase):
    def setUp(self):
        self.registry = get_skill_registry()

    def test_each_agent_has_directory_skills(self):
        expected = {
            "router": 2,
            "diagnosis": 4,
            "knowledge": 4,
            "cad": 3,
            "maintenance": 3,
            "quality": 2,
            "report": 2,
            "workorder": 5,
            "memory": 4,
        }
        for agent, minimum in expected.items():
            with self.subTest(agent=agent):
                skills = self.registry.list(agent)
                self.assertGreaterEqual(len(skills), minimum)
                self.assertEqual(len({item.name for item in skills}), len(skills))
                self.assertTrue(all(item.path.endswith(".yaml") for item in skills))

    def test_diagnosis_selects_multiple_skills(self):
        selected = self.registry.select(
            "diagnosis",
            {
                "alarm_code": "E102",
                "severity": "critical",
                "abnormal_metrics": [{"name": "temperature"}, {"name": "vibration"}],
                "trigger_reason": "trend repeated abnormality",
            },
        )
        names = {item.name for item in selected}
        self.assertTrue({
            "alarm_diagnosis_skill",
            "multi_metric_diagnosis_skill",
            "trend_diagnosis_skill",
            "safety_triage_skill",
        }.issubset(names))

    def test_tools_are_merged_without_duplicates(self):
        selected = self.registry.select("knowledge", {"query": "主轴维修步骤 SOP"})
        tools = self.registry.merge_tools(selected)
        self.assertEqual(len(tools), len(set(tools)))
        self.assertIn("fetch_document", tools)
        self.assertIn("fetch_chunk", tools)

    def test_quality_skills_are_production_quality_only(self):
        skills = self.registry.list("quality")
        names = {item.name for item in skills}
        self.assertEqual(names, {"part_quality_inspection_skill", "dimension_inspection_skill"})
        self.assertFalse(any("repair" in item.name or "test_result" in item.name for item in skills))

    def test_graph_load_skill_exposes_active_skill_list(self):
        knowledge = load_knowledge_skill({"request": {"query": "主轴维修步骤 SOP"}})
        cad = load_cad_skill({"request": {"component": "主轴轴承", "query": "零件图纸"}})

        self.assertGreaterEqual(len(knowledge["active_skills"]), 2)
        self.assertIn("sop_search_skill", knowledge["active_skills"])
        self.assertGreaterEqual(len(cad["active_skills"]), 2)
        self.assertIn("drawing_lookup_skill", cad["active_skills"])
        self.assertIn("part_search_skill", cad["active_skills"])

    def test_diagnosis_agent_keeps_multiple_skill_contract(self):
        agent = DiagnosisAgent()
        selected = agent._select_skill({
            "alarm_code": "E102",
            "severity": "critical",
            "abnormal_metrics": [{"name": "temperature"}, {"name": "vibration"}],
            "trigger_reason": "趋势持续",
        })
        self.assertGreaterEqual(len(selected["skills"]), 4)
        self.assertIn("alarm_diagnosis_skill", selected["skills"])


if __name__ == "__main__":
    unittest.main()
