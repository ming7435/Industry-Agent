import sys
import unittest
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.agents.knowledge import KnowledgeAgent
from app.tools.registry import ToolRegistry


class KnowledgeAgentTests(unittest.TestCase):
    def setUp(self):
        self.tools = ToolRegistry()
        self.agent = KnowledgeAgent(self.tools)

    def test_graph_returns_traceable_evidence_pack(self):
        result = self.agent.run({
            "query": "E102 主轴温度 SOP",
            "alarm_code": "E102",
            "required_sources": ["alarm", "sop"],
        })

        self.assertEqual(result.status, "completed")
        self.assertEqual(result.query_type, "alarm")
        self.assertTrue(result.documents)
        self.assertTrue(result.evidence)
        self.assertTrue(result.sources)
        self.assertFalse(result.validation_findings)
        self.assertTrue(result.retrieval_trace)
        self.assertEqual(result.retrieval_trace[0]["tool"], "search_alarm_knowledge")

    def test_graph_marks_missing_required_source_as_insufficient(self):
        result = self.agent.run({
            "query": "E102 主轴温度",
            "required_sources": ["manual"],
            "filters": {"component": "不存在部件"},
            "max_steps": 2,
        })

        self.assertEqual(result.status, "insufficient_evidence")
        self.assertFalse(result.documents)
        self.assertIn("未检索到可追踪知识证据", result.validation_findings)
        self.assertIn("insufficient_evidence", result.stop_reason)

    def test_document_and_chunk_tools_use_rag_boundary(self):
        document = self.tools.execute("fetch_document", {"document_id": "SOP-COOLING-001"})
        chunk = self.tools.execute("fetch_chunk", {"document_id": "SOP-COOLING-001", "chunk_id": "SOP-COOLING-001#1"})

        self.assertTrue(document["found"])
        self.assertIn("冷却泵", document["content"])
        self.assertEqual(chunk["chunk_id"], "SOP-COOLING-001#1")
        self.assertEqual(chunk["chunk_content"], document["content"])

    def test_knowledge_tool_aliases_keep_source_filters(self):
        sop = self.tools.execute("search_sop", {"query": "主轴 温度 冷却"})
        alarm = self.tools.execute("search_alarm_knowledge", {"query": "E102 主轴温度", "alarm_code": "E102"})

        self.assertTrue(sop["documents"])
        self.assertTrue(all(item["metadata"]["knowledge_type"] == "sop" for item in sop["documents"]))
        self.assertTrue(alarm["documents"])
        self.assertTrue(all(item["metadata"]["knowledge_type"] == "alarm" for item in alarm["documents"]))

    def test_confidence_is_evidence_quality_not_raw_rrf_score(self):
        result = self.agent.run({
            "query": "E102 主轴温度处理步骤",
            "alarm_code": "E102",
            "required_sources": ["alarm", "sop"],
        })

        self.assertGreaterEqual(result.confidence, 0.5)
        self.assertEqual(result.confidence, result.confidence_details["overall"])
        self.assertIn("query_coverage", result.confidence_details)
        self.assertIn("source_coverage", result.confidence_details)

    def test_graph_retrieves_complementary_sources_before_reranking(self):
        result = self.agent.run({
            "query": "E102 主轴温度处理步骤",
            "alarm_code": "E102",
            "required_sources": ["alarm", "sop"],
        })

        tools = [item["tool"] for item in result.retrieval_trace]
        self.assertIn("search_alarm_knowledge", tools)
        self.assertIn("search_sop", tools)


if __name__ == "__main__":
    unittest.main()
