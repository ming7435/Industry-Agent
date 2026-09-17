from __future__ import annotations

from pathlib import Path


TOOLS_ROOT = Path(__file__).resolve().parents[1] / "app" / "tools"


def test_agent_tools_are_split_by_tool_name() -> None:
    expected_tool_files = {
        "cad/fetch_engineering_record.py",
        "cad/get_component_location.py",
        "cad/get_drawing_metadata.py",
        "cad/query_assembly_relation.py",
        "cad/query_bom.py",
        "cad/query_cad.py",
        "cad/query_drawing.py",
        "cad/query_part.py",
        "cad/query_part_relation.py",
        "cad/query_relation.py",
        "diagnosis/get_alarm_definition.py",
        "diagnosis/get_device_history.py",
        "diagnosis/get_device_logs.py",
        "diagnosis/get_device_status.py",
        "inventory/query_inventory.py",
        "inventory/query_part_availability.py",
        "inventory/query_spare_part.py",
        "inventory/query_stock.py",
        "knowledge/fetch_chunk.py",
        "knowledge/fetch_document.py",
        "knowledge/ingest_knowledge.py",
        "knowledge/search_alarm_knowledge.py",
        "knowledge/search_fault_cases.py",
        "knowledge/search_knowledge.py",
        "knowledge/search_manual.py",
        "knowledge/search_semantic_memory.py",
        "knowledge/search_sop.py",
        "maintenance/generate_repair_plan.py",
        "parser/document_parser.py",
        "production/get_production_status.py",
        "quality/check_sop.py",
        "report/generate_report.py",
        "router/intent_classifier_tool.py",
        "workorder/assign_workorder.py",
        "workorder/close_workorder.py",
        "workorder/create_workorder.py",
        "workorder/get_workorder.py",
        "workorder/get_workorder_template.py",
        "workorder/list_workorders.py",
        "workorder/mark_repair_completed.py",
        "workorder/query_workorder.py",
        "workorder/reopen_workorder.py",
        "workorder/submit_repair_feedback.py",
        "workorder/submit_workorder_draft.py",
        "workorder/update_workorder.py",
        "workorder/verify_repair.py",
    }

    missing = [path for path in sorted(expected_tool_files) if not (TOOLS_ROOT / path).is_file()]
    assert missing == []
