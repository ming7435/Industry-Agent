"""报告 PDF 导出工具的回归测试。"""

from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory

from app.tools.report.generate_report_file import generate_report_file


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
