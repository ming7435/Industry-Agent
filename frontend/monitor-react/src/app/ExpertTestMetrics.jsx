import React, {useEffect, useState} from 'react';

const common = {skill_used:'技能实际参与',baseline_unchanged:'技能版本一致',dependencies_unchanged:'依赖版本一致'};
export const testTypes = {machine_flow:'机器闭环测试',knowledge_flow:'知识检索测试',cad_spec_flow:'CAD 规格测试',review_flow:'规则核查测试'};
const criteriaFor = {
  machine_flow:{diagnosis:'诊断结果',maintenance:'维修方案',workorder:'工单闭环',report:'报告保存',...common},
  knowledge_flow:{retrieval:'检索执行',evidence:'证据归属',query_relevance:'查询相关性',expected_result:'预期结果',...common},
  cad_spec_flow:{specification:'规格解析',missing_dimensions:'缺失尺寸检查',expected_result:'预期结果',...common},
  review_flow:{evidence_scope:'证据归属',expected_result:'预期结果',readonly:'只读边界',...common},
};
const explanations = {diagnosis:'已保存本轮诊断结果',maintenance:'已生成可读取的维修方案',
  workorder:'关联工单完成且设备恢复运行',report:'本轮汇总报告已保存',
  retrieval:'实际执行检索工具',evidence:'返回资料来自本次样例',query_relevance:'返回证据与原始问题具有词项关联',
  expected_result:'实际结果符合本次样例预期',specification:'返回有效的规格或补充问题',
  missing_dimensions:'缺少尺寸时要求补充，不生成假参数',evidence_scope:'关注项和缺项来自实际输入输出',
  readonly:'核查没有改写业务结果',skill_used:'本次执行使用了所选技能草稿',
  baseline_unchanged:'测试期间线上技能版本未改变',dependencies_unchanged:'测试期间依赖技能未改变'};
const statuses = {awaiting_fault:'等待故障',running:'测试进行中',awaiting_repair:'等待维修确认',awaiting_report:'等待报告',failed:'测试未完成'};
const finite = value => typeof value === 'number' && Number.isFinite(value);
const percent = value => finite(value) && value>=0 && value<=1 ? `${Math.round(value*100)}%` : '待记录';
const count = value => Array.isArray(value) ? String(value.length) : '待记录';
const text = value => typeof value==='string' ? value : JSON.stringify(value) ?? '—';

export function trialPassed(trial, mode) {
  const assessment=trial?.assessment;
  return Boolean(trial?.status==='completed' && !trial.baseline_changed && criteriaFor[mode]
    && trial.mode===mode && assessment?.schema===1 && assessment.basis===`${mode}_receipt`
    && assessment.accepted===true
    && Object.keys(criteriaFor[mode]).every(key=>assessment.criteria?.[key]===true));
}

function duration(trial,ongoing,now) {
  const start=Date.parse(trial?.created_at),end=ongoing ? now : Date.parse(trial?.assessment?.completed_at);
  if(!Number.isFinite(start) || !Number.isFinite(end) || end<start) return '待记录';
  const seconds=Math.round((end-start)/1000);
  return seconds<60 ? `${seconds} 秒` : seconds<3600 ? `${Math.floor(seconds/60)} 分 ${seconds%60} 秒`
    : `${Math.floor(seconds/3600)} 小时 ${Math.floor(seconds%3600/60)} 分`;
}

function Metric({label,value,note}) {
  return <article className="expert-metric" aria-label={label}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</article>;
}

function SpecFields({value,path=''}) {
  return Object.entries(value || {}).map(([key,item])=>item && typeof item==='object'
    ? <SpecFields key={key} value={item} path={`${path}${key}.`} />
    : <div key={key}><dt>{path}{key}</dt><dd>{text(item)}</dd></div>);
}

export default function ExpertTestMetrics({trial,mode}) {
  const ongoing=['awaiting_fault','running','awaiting_repair','awaiting_report'].includes(trial?.status);
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{
    if(!ongoing) return undefined;
    setNow(Date.now());
    const timer=setInterval(()=>setNow(Date.now()),1000);
    return ()=>clearInterval(timer);
  },[trial?.test_id,ongoing]);
  const assessment=trial?.assessment, result=trial?.result;
  const checks=Object.entries(criteriaFor[mode] || {});
  const passed=checks.filter(([key])=>assessment?.criteria?.[key]===true).length;
  const failed=checks.filter(([key])=>assessment?.criteria?.[key]===false);
  const accepted=trialPassed(trial,mode);
  const outcome=!trial ? '尚未测试' : trial.baseline_changed ? '需要重新测试' : accepted ? '验收通过'
    : ongoing ? statuses[trial.status] : assessment?.accepted===false ? '验收未通过' : statuses[trial.status] || '回执待核实';
  const tone=accepted ? 'success' : !ongoing && (assessment?.accepted===false || trial?.status==='failed') ? 'failure' : 'pending';
  const diagnosis=trial?.details?.diagnosis || result;
  return <section className="expert-test-metrics" aria-label="本次测试指标">
    <div className="expert-section-title"><div><span className="expert-eyebrow">{testTypes[mode] || '技能测试'}</span><h2>本次测试</h2></div>
      <span className={`expert-badge ${tone}`}>{outcome}</span></div>
    <p>{!trial ? '先核对下方测试样例，再运行测试。结果与验收依据将在这里显示。'
      : accepted ? '各项验收已通过，请核对实际证据和预期结果后发布。'
      : failed.length && !ongoing ? `需核对：${failed.map(([,label])=>label).join('、')}。`
      : trial.baseline_changed ? '线上技能已改变，本次结果仅供查看。'
      : trial.message || '等待完整的服务端验收回执，当前结果不能用于发布。'}</p>
    <div className="expert-metric-grid">
      <Metric label="验收检查" value={assessment ? `${passed} / ${checks.length}` : '待验收'} note="通过项 / 必需检查项" />
      <Metric label="测试用时" value={duration(trial,ongoing,now)} note={ongoing ? '实时计时，含当前等待时间' : mode==='machine_flow' ? '含等待维修与报告的时间' : '从开始到验收完成'} />
      {mode==='machine_flow' && <>
        <Metric label="诊断置信度" value={percent(diagnosis?.confidence)} note="模型判断信心，不是准确率" />
        <Metric label="流程进度" value={trial?.progress?.length ? `${trial.progress.filter(item=>item.completed===true).length} / ${trial.progress.length}` : '待记录'} note="已完成 / 本轮记录的阶段" />
      </>}
      {mode==='knowledge_flow' && <>
        <Metric label="返回资料" value={count(result?.documents)} note="实际检索证据条数" />
        <Metric label="查询覆盖" value={percent(result?.confidence_details?.query_coverage)} note="词项覆盖，不代表语义正确率" />
        <Metric label="证据置信度" value={percent(result?.confidence)} note="证据包评分" />
        <Metric label="检索调用" value={count(result?.calls)} note="实际工具调用次数" />
      </>}
      {mode==='cad_spec_flow' && <>
        <Metric label="规格状态" value={result?.status==='ready' ? '规格完整' : result?.status==='needs_input' ? '需要补充' : '待记录'} note="仅验证解析，不代表实体建模成功" />
        <Metric label="待补参数" value={count(result?.questions || (result?.status==='ready' ? [] : undefined))} note="实际返回的补充问题数" />
      </>}
      {mode==='review_flow' && <>
        <Metric label="关注事实" value={count(result?.highlights)} note="核查实际关注的事实数" />
        <Metric label="指出缺项" value={count(result?.missing)} note="核查实际指出的缺失项数" />
      </>}
    </div>
    <details className="expert-checks" open={Boolean(trial) && !accepted}><summary>验收明细 <span>{assessment ? `${passed}/${checks.length} 项通过` : `${checks.length} 项待验证`}</span></summary>
      <ul>{checks.map(([key,label])=>{
        const value=ongoing && assessment?.criteria?.[key]===false ? undefined : assessment?.criteria?.[key];
        return <li key={key}><div><strong>{label}</strong><small>{explanations[key]}</small></div>
          <span className={`expert-badge ${value===true ? 'success' : value===false ? 'failure' : 'pending'}`}>{value===true ? '通过' : value===false ? '未通过' : '待验证'}</span></li>;
      })}</ul>
    </details>
    {result && mode==='knowledge_flow' && <section className="expert-evidence"><h3>检索证据</h3>
      <p>预期资料编号：{Array.isArray(trial.sample?.expected_document_ids) ? trial.sample.expected_document_ids.join('、') || '预期无返回资料' : '本次样例未设置编号对照'}</p>
      {result.documents?.length ? <ul>{result.documents.map((document,index)=><li key={`${document.document_id}:${index}`}>
        <strong>{document.title || document.document_id}</strong><span>{document.document_id}</span>
        <details><summary>查看证据原文</summary><p>{document.content}</p></details>
      </li>)}</ul> : <p>本次没有返回资料；是否符合预期，请查看验收明细。</p>}
    </section>}
    {result && mode==='cad_spec_flow' && <section className="expert-evidence"><h3>规格与补充问题</h3>
      {!!result.questions?.length && <ul>{result.questions.map((question,index)=><li key={index}>{question}</li>)}</ul>}
      {result.spec && <dl className="expert-spec-fields"><SpecFields value={result.spec} /></dl>}
    </section>}
    {result && mode==='review_flow' && <section className="expert-evidence"><h3>核查依据</h3>
      <ul>{result.highlights?.map((item,index)=><li key={index}><code>{item.path}</code><p>{text(item.value)}</p></li>)}</ul>
      {!!result.missing?.length && <p>缺失字段：{result.missing.join('、')}</p>}
    </section>}
    {trial && <details className="expert-technical"><summary>原始测试记录</summary><p>测试编号：{trial.test_id}</p>
      <pre>{JSON.stringify({result:trial.result,assessment:trial.assessment},null,2)}</pre></details>}
  </section>;
}
