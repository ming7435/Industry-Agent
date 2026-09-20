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
        "diagnosis/get_active_alarms.py",
        "diagnosis/get_device_history.py",
        "diagnosis/get_device_logs.py",
        "diagnosis/get_device_status.py",
        "diagnosis/get_production_status.py",
        "knowledge/document_parser.py",
        "knowledge/fetch_chunk.py",
        "knowledge/fetch_document.py",
        "knowledge/ingest_knowledge.py",
        "knowledge/search_alarm_knowledge.py",
        "knowledge/search_fault_cases.py",
        "knowledge/search_knowledge.py",
        "knowledge/search_manual.py",
        "knowledge/search_semantic_memory.py",
        "knowledge/search_sop.py",
        "maintenance/assign_workorder.py",
        "maintenance/close_workorder.py",
        "maintenance/create_workorder.py",
        "maintenance/generate_repair_plan.py",
        "maintenance/get_workorder.py",
        "maintenance/get_workorder_template.py",
        "maintenance/list_workorders.py",
        "maintenance/mark_repair_completed.py",
        "maintenance/query_inventory.py",
        "maintenance/query_part_availability.py",
        "maintenance/query_spare_part.py",
        "maintenance/query_stock.py",
        "maintenance/query_workorder.py",
        "maintenance/reopen_workorder.py",
        "maintenance/submit_repair_feedback.py",
        "maintenance/submit_workorder_draft.py",
        "maintenance/update_workorder.py",
        "maintenance/query_shift.py",
        "maintenance/query_team_availability.py",
        "maintenance/query_technician_skills.py",
        "maintenance/query_technician_workload.py",
        "maintenance/query_technicians.py",
        "quality/check_sop.py",
        "quality/check_workorder_compliance.py",
        "quality/compare_pre_post_metrics.py",
        "quality/get_repair_feedback.py",
        "quality/verify_alarm_clearance.py",
        "quality/verify_repair.py",
        "report/generate_report.py",
        "report/generate_report_file.py",
        "report/get_diagnosis_record.py",
        "report/get_maintenance_record.py",
        "report/get_quality_record.py",
        "report/get_trace_summary.py",
        "report/persist_report.py",
        "router/intent_classifier_tool.py",
    }

    missing = [path for path in sorted(expected_tool_files) if not (TOOLS_ROOT / path).is_file()]
    assert missing == []


def test_tool_directories_match_core_agents() -> None:
    tool_dirs = {path.name for path in TOOLS_ROOT.iterdir() if path.is_dir() and path.name != "__pycache__"}
    assert tool_dirs == {"router", "diagnosis", "knowledge", "cad", "maintenance", "quality", "report"}
