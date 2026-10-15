import React from 'react';

const finite = value => typeof value === 'number' && Number.isFinite(value);
const percentage = value => finite(value) ? `${value}%` : '待统计';
const percentagePoints = value => finite(value) ? `${value > 0 ? '+' : ''}${value} 个百分点` : '待统计';
const sameVersion = gain => Boolean(gain?.old_version && gain.old_version === gain.new_version);
const samples = value => Number.isInteger(value?.numerator) && Number.isInteger(value?.denominator)
  ? `${value.numerator}/${value.denominator}` : '样本待收集';
const stages = {diagnosis:'智能诊断',maintenance:'维修方案',workorder:'工单系统',report:'报告中心'};
const domainStages = {knowledge_flow_receipt:{retrieval:'检索执行',evidence:'证据归属',query_relevance:'查询相关性',expected_result:'预期结果',skill_used:'候选实际参与'},
  cad_spec_flow_receipt:{specification:'规格解析',missing_dimensions:'缺失尺寸检查',expected_result:'预期结果',skill_used:'候选实际参与'},
  review_flow_receipt:{evidence_scope:'证据归属',expected_result:'预期匹配',readonly:'只读边界',skill_used:'候选实际参与'}};

export function SkillMetricSummary({snapshot,onMore}) {
  const data=snapshot?.value?.kind==='skill_north_star' && snapshot.value.schema===1 ? snapshot.value : null;
  const sameNumber=sameVersion(data?.weekly_gain);
  return <section className="expert-skill-metric-summary" aria-label="当前技能汇总">
    <div><span>本周验收通过率</span><strong>{percentage(data?.gate_pass_rate?.value)}</strong>
      <small>{samples(data?.gate_pass_rate)} · 当前技能</small></div>
    <div><span>{sameNumber && data?.weekly_gain?.source==='paired_evaluation' ? '本次评估差值' : '本周版本收益'}</span><strong>{percentagePoints(data?.weekly_gain?.value)}</strong>
      <small>{snapshot?.error ? '指标暂不可读取' : sameNumber ? `两组版本号均为 ${data.weekly_gain.new_version}，版本号未升级` : data?.weekly_gain?.source==='paired_evaluation'
        ? '同场景证据判断通过率差值 · 对照评估' : '实际运行成功率的观测差值'}</small></div>
    <button type="button" onClick={onMore}>查看全部运行指标</button>
  </section>;
}

export default function SkillNorthStarPanel({ snapshot }) {
  const data = snapshot?.value?.kind === 'skill_north_star' && snapshot.value.schema === 1 ? snapshot.value : null;
  const gain = data?.weekly_gain;
  const sameNumber = sameVersion(gain);
  return <section className="skill-north-star" aria-label="北极星指标">
    <h2>北极星指标</h2>
    <p>本周技能效果与发布记录。用于辅助审核，不能代替测试或自动决定发布、回滚。</p>
    {snapshot?.error && <p role="alert" className="expert-alert">指标暂不可读取：{snapshot.error}</p>}
    <article aria-label="周进化收益">
      <h3>周进化收益</h3>
      <small>{gain?.source==='paired_evaluation' ? '本周同场景对照评估' : '业务运行统计'}</small>
      <strong>{percentagePoints(gain?.value)}</strong>
      <p>{sameNumber ? `两组评估记录的版本号均为 ${gain.new_version}，版本号未升级；评估记录的差值不表示已发布新版本号。`
        : gain?.source==='paired_evaluation' ? '新版与旧版在相同标注场景中的证据判断通过率差值。' : '新版成功率减去旧版成功率。'}</p>
      {['old','new'].map(side=>gain?.[side] && <p key={side}>
        {sameVersion(gain) ? side === 'old' ? '参考记录' : '当前记录' : side === 'old' ? '旧版' : '新版'} {gain[`${side}_version`] || '待核对'}：{percentage(gain[side].value)}
        {Number.isInteger(gain[side].successes) && Number.isInteger(gain[side].samples)
          ? ` · 成功 ${gain[side].successes}/${gain[side].samples}` : ''}
        {gain[side].excluded > 0 ? ` · 排除未知或连接异常 ${gain[side].excluded} 次` : ''}
      </p>)}
      <p>{gain?.message || '等待发布记录及新旧技能有效运行样本。'}</p>
      <small>{gain?.source==='paired_evaluation' ? '使用真实模型、相同场景和独立标准答案；结果反映本次场景集，不代表生产周收益。'
        : '实际运行的观测比较，不是同场景对照实验，也不等于已证明优化有效。'}</small>
    </article>
    {[
      ['漂移召回率','drift_recall','实际失败前已提前预警的次数 / 实际失败次数。'],
      ['门禁通过率','gate_pass_rate','最终验收通过的独立测试数 / 本周已完成验收的独立测试数。'],
      ['回滚率','rollback_rate','本周发布后被回滚的内容版本数 / 本周实际改变技能内容的发布数。'],
    ].map(([title,key,definition])=><article key={key} aria-label={title}>
      <h3>{title}</h3><strong>{key==='rollback_rate' && data?.[key]?.status==='not_applicable' ? '不适用' : percentage(data?.[key]?.value)}</strong>
      <small>{data?.[key]?.source==='paired_evaluation' ? '本周同场景对照评估' : key==='drift_recall' ? '业务运行统计' : '业务回执统计'}</small>
      <p>{key==='drift_recall' && data?.[key]?.source==='paired_evaluation'
        ? '标注漂移场景中被模型识别并预警的数量 / 标注漂移场景总数。' : definition}</p><p>统计样本：{samples(data?.[key])}</p>
      {data?.[key]?.message && <p>{data[key].message}</p>}
      {key==='gate_pass_rate' && <p>同一次测试恢复完成后，按最终验收统计一次；检查项数量不算测试次数。</p>}
      {key==='rollback_rate' && Number.isInteger(data?.[key]?.excluded_unchanged) &&
        <p>本周记录 {data[key].observed_publications} 次保存，排除 {data[key].excluded_unchanged} 次内容未变的保存。仅改版本标记或格式也不计作内容变更发布。</p>}
      {['gate_pass_rate','rollback_rate'].includes(key) && !!data?.[key]?.records?.length && <details>
        <summary>{key==='gate_pass_rate' ? '查看验收计数依据' : '查看发布计数依据'}</summary>
        {data[key].records.map(row=><p key={row.assessment_id || row.edit_id} style={{overflowWrap:'anywhere'}}>
          {key==='gate_pass_rate' ? <>{row.assessment_id} · {row.accepted ? '通过' : '未通过'}
            {row.checks_total > 0 && <> · 检查项 {row.checks_passed}/{row.checks_total}</>}
            {Number.isInteger(row.revision) && <> · 验收修订 {row.revision}</>}</>
            : <>{row.edit_id} · {row.old_version} → {row.new_version} · {row.counted
              ? `计入内容变更发布，${row.rolled_back ? '已回滚' : '未回滚'}` : '内容未变，未计入'}</>}
        </p>)}
        {data[key].records.length < (key==='gate_pass_rate' ? data[key].denominator : data[key].observed_publications) &&
          <p>以上展示最近 {data[key].records.length} 条，比例按全部适用记录计算。</p>}
      </details>}
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
      {data?.operational_metrics && <p>业务运行口径仍保留：周收益 {percentagePoints(data.operational_metrics.weekly_gain?.value)}；
        生产失败预警召回率 {percentage(data.operational_metrics.drift_recall?.value)}。当前缺项使用本周独立对照评估展示，样本和口径分别标注。</p>}
      {data?.period && <p>统计周起点：{data.period.start} · 观察截止：{data.period.end}（按北京时间划分周）</p>}
      {data?.collected_at && <p>源记录同步时间：{data.collected_at}</p>}
    </details>
  </section>;
}
