"""报告 PDF 导出工具的回归测试。"""

from __future__ import annotations

from pathlib import Path
from tempfile import TemporaryDirectory

from app.tools.report.generate_report_file import generate_report_file


def test_article_pdf_uses_paragraphs_without_numbered_sections(tmp_path):
    import pymupdf
    article = '设备因送料机报警停机。智能诊断确认报警类型，维修方案建议检查送料机。\n\n维修人员记录“完成”，人工确认后整线复机，未进行自动恢复核验。\n\n具体操作未记录，经验已保存供后续检索。'
    path = tmp_path / 'article.pdf'
    generate_report_file({'report_id': 'RPT-ARTICLE', 'title': '故障处理汇总报告',
        'article_text': article, 'summary': 'UNUSED-SUMMARY',
        'concise_sections': [{'title': '停机到复机', 'body': 'UNUSED-SECTION'}],
        'sections': {'diagnosis': {'model': 'UNUSED-MODEL'}}}, path=str(path), format='pdf')
    with pymupdf.open(path) as doc:
        assert len(doc) == 1
        text = ''.join(doc[0].get_text().split())
        assert ''.join(article.split()) in text
        assert 'UNUSED' not in text and '01停机到复机' not in text


def test_saved_concise_report_pdf_has_one_page_and_no_raw_parameter_dump(tmp_path):
    import pymupdf
    path = tmp_path / 'concise.pdf'
    report = {'report_id': 'RPT-CONCISE', 'report_type': 'full_case_report', 'title': '故障处理汇总报告',
        'summary': 'UNUSED-OLD-SUMMARY', 'concise_sections': [
            {'title': '停机到复机', 'body': '刀塔报警，人工确认后已复机。'},
            {'title': '工单执行与检查', 'body': '实际处理：完成；未进行自动恢复核验。'},
            {'title': '经验总结', 'body': '经验已保存，具体操作未记录。'}],
        'sections': {'lifecycle': {}, 'diagnosis': {'records': [{'summary': 'UNUSED-MODEL-DUMP' * 500}]}}}
    generate_report_file(report, path=str(path), format='pdf')
    with pymupdf.open(path) as doc:
        text = ''.join(page.get_text() for page in doc)
        assert len(doc) == 1
    assert 'UNUSED' not in text
    assert '具体操作未记录' in text and '人工确认' in text


def test_complete_fault_report_preserves_evidence_checks_and_experience_without_truncation(tmp_path):
    import pymupdf
    path = tmp_path / 'complete.pdf'
    report = {'report_id': 'RPT-COMPLETE', 'title': '故障处理汇总报告', 'status': 'completed',
        'sections': {'lifecycle': {'cycle_id': 'C1', 'restart_method': 'manual_confirmation',
            'restarted_at': '2026-10-09T07:33:12Z'},
            'diagnosis': {'records': [{'device_id': 'M1', 'summary': '压力异常',
                'evidence': [{'evidence_id': 'EVID-37', 'content': '报警定义原文与液压压力历史曲线'}],
                'recommended_checks': ['检查油路泄漏']} ]},
            'maintenance_plan': {'records': [{'plan_id': 'P1', 'repair_steps': ['检查压力'],
                'tools_required': ['压力表'], 'post_checks': ['复测循环']} ]},
            'workorder': {'records': [{'workorder_id': f'WO-{i}', 'status': 'completed',
                'repair_feedback': {'feedback': f'处理记录第{i}项'},
                'repair_verification': {'phase': 'manual_confirmation', 'automatic_verification': False}}
                for i in range(30)]},
            'repair_verification': {'records': [{'phase': 'manual_confirmation', 'confirmed_by': 'U1'}]},
            'experience': {'records': [{'experience_id': 'EXP-FULL', 'content': '实际经验总结完整内容',
                'validation_status': 'manual_confirmed', 'knowledge_sync': {'status': 'indexed'}}]},
            'references': {'records': [{'source': 'backend-persisted-record', 'workorder_id': 'WO-29'}]}}}
    generate_report_file(report, path=str(path), format='pdf')
    with pymupdf.open(path) as document:
        text = ''.join(page.get_text() for page in document)
        assert document.page_count >= 3
        for page in document:
            assert all(28 <= b[0] < b[2] <= 567 and 20 <= b[1] < b[3] <= 830 for b in page.get_text('blocks'))
    for token in ['EVID-37', '报警定义原文与液压压力历史曲线', '检查油路泄漏', '压力表', '复测循环',
                  'WO-29', '处理记录第29项', 'EXP-FULL', '实际经验总结完整内容', '人工确认', '知识']:
        assert token in text
    assert '其余' not in text and '复机核验通过' not in text


def test_fault_report_pdf_includes_every_order_without_product_quality(tmp_path):
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
    for token in ['WO-A', 'WO-B', 'PLAN-A', '停机到复机', '诊断结果', '维修方案', '工单执行']:
        assert token in content
    assert '质检结果' not in content
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


def test_product_quality_pdf_retains_real_failed_measurements(tmp_path):
    import pymupdf
    path = tmp_path / 'quality.pdf'
    generate_report_file({'report_id': 'RPT-QC', 'report_type': 'quality_report', 'status': 'completed',
        'title': '产品质检报告', 'sections': {'quality': {'passed': False, 'findings': ['尺寸超差']}}},
        path=str(path), format='pdf')
    with pymupdf.open(path) as document:
        content = ''.join(page.get_text() for page in document)
    assert '质检结果' in content
    assert '尺寸超差' in content
