from copy import deepcopy

from shared.report_presentation import report_presentation


def test_article_connects_saved_facts_without_field_labels_or_500_character_cutoff():
    from shared import report_presentation as module
    builder = getattr(module, 'report_article', None)
    assert callable(builder)
    source = {'sections': {'lifecycle': {'started_at': '2026-10-09T13:39:05Z',
        'restarted_at': '2026-10-09T13:40:56Z', 'duration_seconds': 111.1,
        'restart_method': 'manual_confirmation'},
        'diagnosis': {'records': [{'device_id': 'M1', 'alarm_code': '700015',
            'conclusion': '送料机报警反馈，属于初级预警。',
            'diagnosis': '送料机就绪信号 barfeed_ready_signal 从1变为0。主轴负载43.7%，液压总压力698 psi。设备日志未发现通信中断。现有证据无法区分送料机状态与接口问题，需要现场核查。',
            'recommendation': '检查送料机料棒余量和面板报警，再核查信号端子及电平。', 'confidence': 0.886, 'model': 'UNUSED-MODEL'}]},
        'maintenance_plan': {'records': [{'repair_steps': ['执行安全隔离', '检查送料机']}]},
        'workorder': {'records': [{'assignee_name': '李工', 'repair_feedback': {'feedback': '完成'}}]},
        'experience': {'records': [{'knowledge_sync': {'searchable': True},
            'limitations': ['具体操作未记录，不能确认根因或换件效果']}]}}}
    before = deepcopy(source)
    article = builder(source)
    assert len(article.split('\n\n')) == 6 and len(article) > 500
    for token in ['2026年10月09日21:39:05', 'M1', '700015', '送料机', '维修方案建议', '李工',
                  '“完成”', '21:40:56', '111.1秒', '人工确认', '未进行自动恢复核验', '具体操作未记录', '检索',
                  '43.7%', '698 psi', '88.6%', '料棒余量', '接口问题']:
        assert token in article
    for token in ['负责人：', '实际处理：', 'UNUSED', '01 ', '工单执行与检查\n']:
        assert token not in article
    assert source == before
    assert 'barfeed_ready_signal' not in article
    assert '更换了' not in article


def test_concise_report_is_under_500_characters_and_does_not_dump_internal_fields():
    from shared import report_presentation as module
    builder = getattr(module, 'concise_report_sections', None)
    assert callable(builder), '报告页面和 PDF 需要统一的简明正文'
    source = {'sections': {'lifecycle': {'started_at': '2026-10-09T07:30:59Z',
        'restarted_at': '2026-10-09T07:33:12Z', 'restart_method': 'manual_confirmation', 'duration_seconds': 132.5},
        'diagnosis': {'records': [{'device_id': 'M1', 'alarm_code': '700006', 'summary': '刀塔旋转超时。负载异常。',
            'model': 'UNUSED-MODEL', 'evidence_records': [{'tool': 'UNUSED-TOOL', 'result': {'series': list(range(1000))}}]}]},
        'maintenance_plan': {'records': [{'repair_steps': ['安全隔离', '检查刀塔']}]},
        'workorder': {'records': [{'workorder_id': 'WO-1', 'assignee_name': '李工', 'status': 'completed',
            'repair_feedback': {'feedback': '完成'}, 'repair_verification': {'phase': 'manual_confirmation'}}]},
        'experience': {'records': [{'knowledge_sync': {'searchable': True},
            'limitations': ['具体操作未记录，不能确认根因或换件效果']} ]}}}
    before = deepcopy(source)
    shown = builder(source)
    body = ''.join(item['title'] + item['body'] for item in shown)
    assert len(''.join(body.split())) <= 500
    for token in ['700006', '刀塔旋转超时', '安全隔离', '李工', '完成', '人工确认', '未进行自动恢复核验', '经验']:
        assert token in body
    assert 'UNUSED' not in body and 'series' not in body and '具体操作未记录' in body
    assert source == before
    source['sections']['diagnosis']['records'][0]['summary'] = '长诊断。' * 2000
    assert sum(len(item['title'] + item['body']) for item in builder(source)) <= 500


def test_presentation_preserves_business_facts_and_summarizes_repeated_sampling_receipts():
    result = {'sample_count': 3, 'series': {'pressure': [
        {'value': 100, 'timestamp': 1791531000000}, {'value': 80, 'timestamp': 1791531001000},
        {'value': 90, 'timestamp': 1791531002000}]}}
    source = {'lifecycle': {'restart_method': 'manual_confirmation'},
        'diagnosis': {'records': [{'evidence_records': [
            {'content': '压力趋势依据一', 'result': deepcopy(result)},
            {'content': '压力趋势依据二', 'result': deepcopy(result)}]}]},
        'workorder': {'records': [{'workorder_id': f'WO-{i}', 'repair_feedback': {'feedback': f'真实处理{i}'}}
                                 for i in range(31)]}}
    before = deepcopy(source)
    shown = report_presentation(source)
    assert source == before
    assert len(shown['workorder']['records']) == 31
    records = shown['diagnosis']['records'][0]['evidence_records']
    stats = records[0]['result']['series_summary']['pressure']
    assert stats['sample_count'] == 3 and stats['min'] == 80 and stats['max'] == 100
    assert stats['mean'] == 90 and stats['latest'] == 90
    assert stats['started_at'] and stats['ended_at']
    assert records[1]['content'] == '压力趋势依据二' and 'result' not in records[1]
    assert '首次记录' in records[1]['source_basis']
