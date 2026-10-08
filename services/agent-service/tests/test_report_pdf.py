"""报告 PDF 导出工具的回归测试。"""

from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory

from app.tools.report.generate_report_file import generate_report_file


def test_unified_report_pdf_includes_every_order_and_four_centers(tmp_path):
    import pymupdf
    sections = {'lifecycle': {'cycle_id': 'CYCLE-PDF', 'started_at': '2026-10-08T01:00:00Z',
                             'restarted_at': '2026-10-08T01:05:00Z'},
                'diagnosis': {'records': [{'device_id': 'M1', 'event_id': 'EVT-20261008-010000-510-149', 'fault': '2026-10-08 01:00:00 液压异常',
                    'raw': {'triggered_at': '2026-10-08T01:00:01.519Z'}}, {'device_id': 'M2', 'fault': '振动异常'}]},
                'maintenance_plan': {'records': [{'plan_id': 'PLAN-A', 'repair_steps': ['检查压力']}]},
                'workorder': {'records': [{'workorder_id': 'WO-A', 'status': 'closed'}, {'workorder_id': 'WO-B', 'status': 'closed'}]},
                'quality': {'status': 'not_tested', 'records': []}}
    path = tmp_path / 'cycle.pdf'
    result = generate_report_file({'report_id': 'RPT-CYCLE', 'title': '故障处理汇总报告', 'sections': sections},
                                  path=str(path), format='pdf')
    assert result['success']
    with pymupdf.open(path) as document:
        content = ''.join(page.get_text() for page in document)
    for token in ['WO-A', 'WO-B', 'PLAN-A', '停机到复机', '诊断结果', '维修方案', '工单执行', '质检结果', '未关联记录']:
        assert token in content
    assert '2026/10/08 09:00:00' in content
    assert '2026/10/08 09:05:00' in content
    assert '2026-10-08 01:00:00' not in content


def test_generate_report_file_supports_pdf_and_json() -> None:
    """PDF 应可读取且 JSON 导出能力不能被新格式破坏。"""

    report = {
        "report_id": "RPT-TEST-PDF",
        "title": "测试运维报告",
        "summary": "主轴温度异常，已完成维修复测。",
        "report_type": "full_case_report",
        "status": "completed",
        "sections": {"诊断": {"设备": "TRAK-TC820", "结论": "已完成"}, "维修步骤": ["检查传感器", "复测"]},
    }
    with TemporaryDirectory() as directory:
        pdf_path = Path(directory) / "report.pdf"
        pdf_result = generate_report_file(report, path=str(pdf_path), format="pdf")
        assert pdf_result["success"] is True
        assert pdf_result["mime_type"] == "application/pdf"
        assert pdf_path.is_file() and pdf_path.stat().st_size > 1000

        import pymupdf

        document = pymupdf.open(str(pdf_path))
        assert document.page_count >= 1
        assert any(page.get_text().strip() for page in document)
        document.close()

        json_path = Path(directory) / "report.json"
        json_result = generate_report_file(report, path=str(json_path), format="json")
        assert json_result["success"] is True
        assert json_path.read_text(encoding="utf-8").find("RPT-TEST-PDF") >= 0
