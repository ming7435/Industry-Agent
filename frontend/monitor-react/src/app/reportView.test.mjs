import test from 'node:test';
import assert from 'node:assert/strict';
import * as reportView from './reportView.mjs';

function section(sections, title) {
  const result = sections.find(item => item.title === title);
  assert.ok(result, `报告必须显示${title}`);
  return result;
}

function completeness(report) {
  assert.equal(typeof reportView.reportCompleteness, 'function', '报告完整性辅助函数必须可用');
  return reportView.reportCompleteness(report);
}

test('真实工单没有摘要时仍展示编号、执行状态、负责人和执行步骤', () => {
  const displayed = reportView.buildReportDisplaySections({workorder: {
    workorder_id: 'WO-REAL', status: 'closed', assignee: 'TECH-001',
    steps: ['断电挂牌', '更换轴承并记录温度'], repair_feedback: {}, repair_verification: {},
  }});
  const order = section(displayed, '工单安排');
  assert.match(order.body, /WO-REAL/);
  assert.match(order.body, /已关闭/);
  assert.match(order.body, /TECH-001/);
  assert.deepEqual(section(displayed, '工单步骤').items, ['断电挂牌', '更换轴承并记录温度']);
});

test('历史工单封装以内部工单的状态、姓名和步骤为准', () => {
  const displayed = reportView.buildReportDisplaySections({workorder: {
    workorder_id: 'WO-LEGACY', status: 'in_progress', assignee: 'TECH-001',
    workorder: {workorder_id: 'WO-LEGACY', status: 'closed', assignee: 'TECH-001',
      assignee_name: '张工', steps: ['复测完成'], summary: '现场执行记录'},
  }});
  const body = section(displayed, '工单安排').body;
  assert.match(body, /WO-LEGACY/);
  assert.match(body, /已关闭/);
  assert.match(body, /张工/);
  assert.match(body, /现场执行记录/);
  assert.doesNotMatch(body, /维修中|处理中/);
  assert.deepEqual(section(displayed, '工单步骤').items, ['复测完成']);
});

test('空顶层反馈不能遮住历史工单内的实际反馈和失败复核', () => {
  const displayed = reportView.buildReportDisplaySections({
    repair_feedback: {}, repair_verification: {},
    workorder: {workorder_id: 'WO-NESTED', workorder: {
      workorder_id: 'WO-NESTED', status: 'in_progress',
      repair_feedback: {feedback: '已更换轴承，等待验证'},
      repair_verification: {passed: false, summary: '振动仍超限', phase: 'poststart'},
    }},
  });
  assert.match(section(displayed, '维修反馈').body, /已更换轴承，等待验证/);
  const verification = section(displayed, '维修复核').body;
  assert.match(verification, /未通过/);
  assert.match(verification, /振动仍超限/);
  assert.match(verification, /开机后/);
});

test('顶层现场反馈和仅有通过标志的复核独立显示', () => {
  const displayed = reportView.buildReportDisplaySections({
    repair_feedback: {feedback: '已完成接线检查'},
    repair_verification: {passed: true, status: 'verified', phase: 'prestart'},
  });
  assert.match(section(displayed, '维修反馈').body, /已完成接线检查/);
  assert.match(section(displayed, '维修复核').body, /通过/);
  assert.match(section(displayed, '维修复核').body, /开机前/);
  assert.doesNotMatch(section(displayed, '维修复核').body, /已关闭|闭环完成/);
});

test('工单反馈直接保存为字符串时仍展示实际内容', () => {
  const displayed = reportView.buildReportDisplaySections({work_order: {
    workorder_id: 'WO-TEXT', status: 'awaiting_verification', repair_feedback: '已更换冷却泵',
  }});
  assert.match(section(displayed, '工单安排').body, /待验证/);
  assert.equal(section(displayed, '维修反馈').body, '已更换冷却泵');
});

test('缺失或空章节不产生虚构的工单、反馈或复核结果', () => {
  for (const input of [undefined, null, {}, {workorder: {}, repair_feedback: {}, repair_verification: {}}, {
    workorder: {workorder: {}, repair_feedback: {feedback: ' '}, repair_verification: {}},
  }]) {
    assert.deepEqual(reportView.buildReportDisplaySections(input), []);
  }
});

test('工单映射保留诊断、维修方案、质量章节的现有结果', () => {
  assert.deepEqual(reportView.buildReportDisplaySections({
    diagnosis_result: {fault: '主轴温度异常'}, maintenance: {repair_steps: ['检查冷却液', '空载复测']},
    repair_result: {result: '温度已恢复'}, quality_result: {passed: false, findings: ['尺寸超差']},
  }), [
    {title: '诊断结论', body: '主轴温度异常'}, {title: '维修步骤', items: ['检查冷却液', '空载复测']},
    {title: '维修反馈', body: '温度已恢复'}, {title: '质量结果', body: '未通过；尺寸超差'},
  ]);
});

test('报告标记不完整时不依赖历史摘要中的提醒', () => {
  assert.deepEqual(completeness({status: 'incomplete', summary: '设备已生成维修计划报告。'}), {
    label: '资料不完整', tone: 'warning', findings: [],
  });
});

test('任何非空校验问题都覆盖 completed 状态并保留问题内容', () => {
  assert.deepEqual(completeness({status: 'completed', validation_findings: ['  诊断记录缺少故障事实  ', '', '维修计划缺少步骤']}), {
    label: '资料不完整', tone: 'warning', findings: ['诊断记录缺少故障事实', '维修计划缺少步骤'],
  });
});

test('只有 completed 且无实际校验问题的报告标记内容完整', () => {
  assert.deepEqual(completeness({status: 'completed', validation_findings: [' ', '']}), {
    label: '内容完整', tone: 'normal', findings: [],
  });
});

test('生成失败、处理中和未知状态保留真实状态而非标记内容完整', () => {
  assert.deepEqual(completeness({status: 'error'}), {label: '生成失败', tone: 'error', findings: []});
  assert.deepEqual(completeness({status: 'in_progress'}), {label: '生成中', tone: 'normal', findings: []});
  assert.deepEqual(completeness({status: 'pending'}), {label: '待处理', tone: 'normal', findings: []});
  assert.deepEqual(completeness({status: 'cancelled'}), {label: '已取消', tone: 'normal', findings: []});
  assert.deepEqual(completeness(), {label: '待确认', tone: 'normal', findings: []});
  assert.deepEqual(completeness(null), {label: '待确认', tone: 'normal', findings: []});
  const unfamiliar = completeness({status: 'custom_state'});
  assert.match(unfamiliar.label, /custom_state/);
  assert.notEqual(unfamiliar.label, '内容完整');
});
