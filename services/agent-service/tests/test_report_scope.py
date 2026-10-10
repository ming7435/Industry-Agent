from app.agents.report.agent import ReportAgent


def fault_request():
    return {'persist': False, 'report_type': 'full_case_report',
            'diagnosis': {'device_id': 'M1', 'event_id': 'E1', 'fault': '液压异常'},
            'maintenance_plan': {'repair_target': '液压系统', 'repair_steps': ['检查压力']},
            'workorder': {'workorder_id': 'WO-1', 'device_id': 'M1', 'status': 'completed'},
            'repair_feedback': {'feedback': '液压压力恢复'},
            'quality': {'status': 'pending'}}


def test_fault_report_does_not_require_or_reference_product_quality():
    result = ReportAgent().run(fault_request())
    assert result.status == 'completed'
    assert 'quality' not in result.sections
    assert not any(ref['section'] == 'quality' for ref in result.source_refs)
    assert '质检' not in result.summary


def test_quality_report_does_not_include_fault_repair_sections():
    request = fault_request()
    request.update(report_type='quality_report', quality={'part_id': 'PART-1', 'passed': False, 'result': 'failed'})
    result = ReportAgent().run(request)
    assert result.status == 'completed'
    assert result.sections['quality']['passed'] is False
    assert not set(result.sections).intersection({'diagnosis', 'maintenance_plan', 'workorder', 'repair_feedback', 'repair_verification'})
    assert '液压' not in result.summary


def test_automatic_repair_report_does_not_switch_to_quality_due_to_unrelated_results():
    request = fault_request()
    request.update(report_type='', repair_feedback={})
    result = ReportAgent().run(request)
    assert result.report_type == 'maintenance_report'
    assert result.status == 'completed'
    assert 'quality' not in result.sections
