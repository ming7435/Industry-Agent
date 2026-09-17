import unittest
from pathlib import Path

from scripts.ingest_to_milvus import collection_name_for_pdf


class IngestToMilvusScriptTests(unittest.TestCase):
    def test_known_pdf_names_map_to_domain_collections(self) -> None:
        cases = {
            "维修手册_TC820LTYsi_BOM数据.pdf": "industry_rag_bom",
            "维修手册_TC820LTYsi_SOP数据.pdf": "industry_rag_sop",
            "维修手册_TC820LTYsi_保养维护数据.pdf": "industry_rag_maintenance",
            "维修手册_TC820LTYsi_安全规程数据.pdf": "industry_rag_safety_rules",
            "维修手册_TC820LTYsi_故障诊断数据.pdf": "industry_rag_troubleshooting",
            "维修手册_TC820LTYsi_报警码数据.pdf": "industry_rag_alarm_codes",
        }

        for filename, expected in cases.items():
            with self.subTest(filename=filename):
                self.assertEqual(collection_name_for_pdf(Path(filename)), expected)

    def test_unknown_document_name_includes_format_and_unique_suffix(self) -> None:
        collection_name = collection_name_for_pdf(Path("123 custom manual.txt"))

        self.assertTrue(collection_name.startswith("industry_rag_doc_123_custom_manual_txt_"))
        self.assertEqual(len(collection_name.rsplit("_", 1)[-1]), 10)


if __name__ == "__main__":
    unittest.main()
