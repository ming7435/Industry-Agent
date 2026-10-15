import React from 'react';

export const taskSampleFor = (skill, task) => skill.optimization?.mode === 'review_flow' ? ({
  kind: 'review_flow',
  input_text: JSON.stringify(task?.input || {device_id:'TEST-DEVICE',feedback:null}, null, 2),
  output_text: JSON.stringify(task?.output || {status:'待核实',message:'资料不完整'}, null, 2),
  expected_highlights_text: JSON.stringify(task?.expected_highlights || ['/output/status'], null, 2),
  expected_missing_text: JSON.stringify(task?.expected_missing || ['/input/feedback'], null, 2),
  expected_status:'reviewed',
  expected:task?.expected || '按候选规则指出已有事实和实际缺项，不改变业务结果、审批或控制权限。',
}) : ({
  kind: skill.optimization?.mode,
  query: task?.query || (skill.agent === 'knowledge' ? ({alarm_search_skill:'解释报警700001',sop_search_skill:'查找主轴维修步骤',
    manual_search_skill:'查找主轴手册',fault_case_skill:'查找主轴故障历史案例'}[skill.name] || '查找主轴故障依据') : ''),
  prompt: task?.prompt || (skill.agent === 'cad' ? '设计一个带孔零件，孔径与位置尚未提供' : ''),
  documents_text: JSON.stringify(task?.documents || [], null, 2),
  expected_spec_text: task?.expected_spec ? JSON.stringify(task.expected_spec, null, 2) : '',
  expected_document_ids_text: task?.expected_document_ids ? JSON.stringify(task.expected_document_ids, null, 2) : '',
  expected_status: task?.expected_status || (skill.agent === 'cad' ? 'needs_input' : 'insufficient_evidence'),
  expected: task?.expected || '资料或尺寸不足时明确要求补充，不编造证据或参数。',
});

export function taskPayload(sample) {
  try {
    if (sample.kind === 'review_flow') return {
      input: JSON.parse(sample.input_text), output: JSON.parse(sample.output_text),
      expected_highlights: JSON.parse(sample.expected_highlights_text),
      expected_missing: JSON.parse(sample.expected_missing_text),
      expected_status:'reviewed', expected:sample.expected,
    };
    return {query:sample.query,prompt:sample.prompt,documents:JSON.parse(sample.documents_text || '[]'),
      expected_spec:sample.expected_spec_text?.trim() ? JSON.parse(sample.expected_spec_text) : null,
      ...(['completed','insufficient_evidence'].includes(sample.expected_status) ? {expected_document_ids:sample.expected_status==='completed'
        ? JSON.parse(sample.expected_document_ids_text || '[]') : []} : {}),
      expected_status:sample.expected_status,expected:sample.expected};
  } catch {throw new Error('测试资料或预期参数的格式不完整，请核对 JSON。');}
}

export default function SkillTaskSample({skill,sample,change,disabled}) {
  const cad=skill.agent === 'cad';
  if (skill.optimization?.mode === 'review_flow') return <>
    <p>核查下面的任务输入与返回结果，只验证技能是否关注正确事实及缺项。不会派工、执行质检、保存业务报告或控制机器，不代表完整业务验收。</p>
    {[
      ['input_text','任务输入（测试样例）','填写原任务输入的 JSON 对象。不要填写密码、密钥或会话凭据。'],
      ['output_text','任务返回（测试样例）','填写该任务实际返回的 JSON 对象，原结果不会被模型改写。'],
      ['expected_highlights_text','预期关注事实','填写字段路径数组，例如 ["/output/status"]；路径必须指向返回结果或输入中已有的事实。'],
      ['expected_missing_text','预期指出缺项','填写实际缺失字段的路径数组，例如 ["/input/feedback"]。无此类要求填写 []。'],
    ].map(([key,label,hint])=><label key={key}>{label}<textarea aria-label={label} value={sample[key]}
      onChange={change(key)} disabled={disabled} required rows={key.endsWith('_text') && key.startsWith('expected_') ? 2 : 4}
      maxLength={100000}/><small>{hint}</small></label>)}
  </>;
  return <>
    <p>{cad ? '验证需求解析、补充问题和严格规格，不执行 FreeCAD、不生成实体、不启动机器。常规完整尺寸走固定解析，不代表已测试候选正文。'
      : '使用下面提供的测试问题和参考资料运行真实检索流程，不查询生产知识库，不触发模拟故障。'}</p>
    <label>{cad ? '测试设计需求' : '测试问题'}<textarea aria-label={cad ? '测试设计需求' : '测试问题'} value={cad ? sample.prompt : sample.query}
      onChange={change(cad ? 'prompt' : 'query')} disabled={disabled} required maxLength={4000} rows={3}/></label>
    {!cad && <label>测试参考资料<textarea aria-label="测试参考资料" value={sample.documents_text} onChange={change('documents_text')}
      disabled={disabled} required rows={5}/><small>只用于验证。格式：{`[{"document_id":"资料编号","title":"标题","content":"原文","source_type":"manual"}]`}
      。来源类型：manual（手册）、sop（规程）、alarm（报警）、case（案例）。没有资料填写 []。</small></label>}
    <label>预期状态<select value={sample.expected_status} onChange={change('expected_status')} disabled={disabled}>
      {cad ? <><option value="needs_input">需要补充参数</option><option value="ready">规格完整且符合预期</option></>
        : <><option value="insufficient_evidence">证据不足</option><option value="completed">返回有效证据</option></>}
    </select></label>
    {!cad && sample.expected_status==='completed' && <label>预期资料编号<textarea aria-label="预期资料编号"
      value={sample.expected_document_ids_text || ''} onChange={change('expected_document_ids_text')}
      disabled={disabled} required maxLength={3000} rows={2}/>
      <small>填写应返回的资料编号数组，例如 ["DOC-1"]。可在测试资料中加入无关内容；实际返回的编号必须与预期一致。</small></label>}
    {cad && sample.expected_status==='ready' && <label>预期规格<textarea value={sample.expected_spec_text}
      onChange={change('expected_spec_text')} disabled={disabled} required rows={5}/>
      <small>填写人工核对的完整结构化规格；系统将逐字段比较，不以模型自称正确作为验收。</small></label>}
  </>;
}
