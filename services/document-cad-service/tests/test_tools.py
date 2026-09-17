import sys
import unittest
import importlib.util
from pathlib import Path


SERVICE_ROOT = Path(__file__).resolve().parents[1]
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

MODULE_PATH = SERVICE_ROOT / "app" / "main.py"
SPEC = importlib.util.spec_from_file_location("document_cad_service_main", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)
call_tool = MODULE.call_tool
ToolCall = MODULE.ToolCall


class DocumentCADServiceTests(unittest.TestCase):
    def test_mcp_tool_call_returns_precise_part(self):
        result = call_tool(ToolCall(tool="query_part", arguments={"part_no": "CP-TC820-015"}))

        self.assertEqual(result["source"], "document-cad-service")
        self.assertEqual([item["component_id"] for item in result["parts"]], ["COOLING-PUMP"])

    def test_fetch_engineering_record_returns_bom_drawings_and_relations(self):
        result = call_tool(ToolCall(tool="fetch_engineering_record", arguments={"component": "TEMP-PT100"}))

        self.assertEqual(result["components"][0]["component_id"], "TEMP-PT100")
        self.assertTrue(result["drawings"])
        self.assertTrue(result["bom_items"])
        self.assertTrue(result["assembly_relations"])


if __name__ == "__main__":
    unittest.main()
