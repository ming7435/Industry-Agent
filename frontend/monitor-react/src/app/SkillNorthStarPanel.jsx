import React from 'react';

const finite = value => typeof value === 'number' && Number.isFinite(value);
const percentage = value => finite(value) ? `${value}%` : '待统计';
const samples = value => Number.isInteger(value?.numerator) && Number.isInteger(value?.denominator)
  ? `${value.numerator}/${value.denominator}` : '样本待收集';
const stages = {diagnosis:'智能诊断',maintenance:'维修方案',workorder:'工单系统',report:'报告中心'};
const domainStages = {knowledge_flow_receipt:{retrieval:'检索执行',evidence:'证据归属',expected_result:'预期结果',skill_used:'候选实际参与'},
  cad_spec_flow_receipt:{specification:'规格解析',missing_dimensions:'缺失尺寸检查',expected_result:'预期结果',skill_used:'候选实际参与'},
  review_flow_receipt:{evidence_scope:'证据归属',expected_result:'预期匹配',readonly:'只读边界',skill_used:'候选实际参与'}};

export default function SkillNorthStarPanel({ snapshot }) {
  const data = snapshot?.value?.kind === 'skill_north_star' && snapshot.value.schema === 1 ? snapshot.value : null;
  const gain = data?.weekly_gain;
  return <section className="skill-north-star" aria-label="北极星指标">
    <h2>北极星指标</h2>
    <p>本周技能效果与发布记录。用于辅助审核，不能代替测试或自动决定发布、回滚。</p>
    {snapshot?.error && <p role="alert" className="expert-alert">指标暂不可读取：{snapshot.error}</p>}
    <article aria-label="周进化收益">
      <h3>周进化收益</h3>
      <strong>{finite(gain?.value) ? `${gain.value > 0 ? '+' : ''}${gain.value} 个百分点` : '待统计'}</strong>
      <p>新版成功率减去旧版成功率。</p>
      {['old','new'].map(side=>gain?.[side] && <p key={side}>
        {side === 'old' ? '旧版' : '新版'} {gain[`${side}_version`] || '待核对'}：{percentage(gain[side].value)}
        {Number.isInteger(gain[side].successes) && Number.isInteger(gain[side].samples)
          ? ` · 成功 ${gain[side].successes}/${gain[side].samples}` : ''}
        {gain[side].excluded > 0 ? ` · 排除未知或连接异常 ${gain[side].excluded} 次` : ''}
      </p>)}
      <p>{gain?.message || '等待发布记录及新旧技能有效运行样本。'}</p>
      <small>实际运行的观测比较，不是同场景对照实验，也不等于已证明优化有效。</small>
    </article>
    {[
      ['漂移召回率','drift_recall','实际失败前已提前预警的次数 / 实际失败次数。'],
      ['门禁通过率','gate_pass_rate','通过验收的评估次数 / 已完成评估次数。'],
      ['回滚率','rollback_rate','发布后实际恢复旧内容的新版数 / 本周成功发布总数。'],
    ].map(([title,key,definition])=><article key={key} aria-label={title}>
      <h3>{title}</h3><strong>{percentage(data?.[key]?.value)}</strong>
      <p>{definition}</p><p>统计样本：{samples(data?.[key])}</p>
      {data?.[key]?.message && <p>{data[key].message}</p>}
      {!data && <p>等待后台收集可信记录。</p>}
    </article>)}
    {data?.latest_assessment && <div className="skill-north-star-acceptance">
      <h3>最近一次技能验收</h3>
      <p>{data.latest_assessment.accepted === true ? '验收通过' : '验收未通过'}</p>
      <ul>{Object.entries(domainStages[data.latest_assessment.basis] || stages).map(([key,title])=><li key={key}>{title}：
        {data.latest_assessment.criteria?.[key] === true ? '已通过' : '未通过或缺少证据'}</li>)}</ul>
    </div>}
    {!!data?.active_alerts?.length && <p className="expert-alert">技能效果风险预警：
      {data.active_alerts.at(-1).policy}。仅预警后续同版本执行风险，不控制设备。</p>}
    <details><summary>统计口径与数据来源</summary>
      <p>成功率使用业务执行校验结果；基础设施异常与未知结果不计入成功率分母。预警必须早于同版本实际失败，事后提示不算命中。</p>
      <p>验收按技能类型读取服务端测试回执：诊断使用维修闭环，检索使用证据验证，建模使用规格解析验证，其它技能使用输入输出核查验证。核查通过不算业务执行成功。回滚来自实际文件发布链，不是拒绝草稿或发布失败。</p>
      <p>{data?.coverage_note || '历史未保存的记录不补造；零分母或数据不完整时不评分。'}</p>
      {data?.period && <p>统计周起点：{data.period.start} · 观察截止：{data.period.end}（按北京时间划分周）</p>}
      {data?.collected_at && <p>源记录同步时间：{data.collected_at}</p>}
    </details>
  </section>;
}
