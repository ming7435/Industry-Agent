import React from 'react';
import './qualityAssessment.css';

const causes = { equipment_parameters: '设备参数', drawing: '图纸／设计', measurement: '测量／采集', workpiece: '工件外观' };

export default function QualityAssessment({ result, kind }) {
  if (!result) return null;
  const sourceId = kind === 'dimensions' ? result.batch_id : result.inspection_id;
  const value = result.quality_assessment;
  const valid = value?.version === 1 && value.agent === 'quality' && value.mode === 'evidence_rules'
    && sourceId && value.source_id === sourceId && value.execution === 'not_executed'
    && value.release_allowed === false && Array.isArray(value.issues) && Array.isArray(value.cause_summary);
  const heading = `${kind === 'dimensions' ? '尺寸' : '视觉'}问题分类与处置`;
  return <section className="quality-assessment" aria-label={heading}>
    <header><div><span className="quality-kicker">QUALITY AGENT</span><h3>{heading}</h3></div>
      <span className={`quality-agent-state ${valid ? 'connected' : ''}`}>{valid ? '质检 Agent 已接入 · 规则分类' : '分类结果待获取'}</span></header>
    {!valid ? <p className="quality-assessment-note">当前记录没有匹配的 Agent 分类结果，请刷新记录或重新检测。</p> : <>
      <p className="quality-assessment-note">{value.scope === 'simulation' ? '模拟尺寸批次' : value.scope === 'reference_image' ? '公开参考图片' : '上传图片'} · 处置待确认，尚未执行。
        {kind === 'dimensions' ? ' 视觉检测请切换到“视觉检测”页签。' : ' 本图结果不代表尺寸已合格。'}</p>
      <div className="quality-cause-grid">{value.cause_summary.map(item => <div key={item.category}>
        <span>{item.label}</span><strong>{item.status}</strong><small>{item.evidence}</small>
      </div>)}</div>
      {value.issues.length ? <div className="quality-classification-list">{value.issues.map((issue, index) => <article className="quality-classification-card"
        data-issue-category={issue.category} key={`${issue.part_id}:${issue.location}:${index}`}>
        <div className="quality-classification-evidence"><span className="quality-category">{issue.category_label}</span><h4>{issue.location}</h4>
          <p>{issue.evidence}</p>{issue.part_id && <small>{kind === 'dimensions' ? '样本' : '设计关联'}：{issue.part_id}</small>}
          {issue.device && <small>关联设备：{issue.device}</small>}
          <p className="quality-cause-state">归因范围：{(issue.cause_categories || []).map(category => causes[category] || category).join(' / ')} · 根因待确认</p>
        </div>
        <div className="quality-disposition"><span>处置分类</span><strong>{issue.disposition?.label || '待复核'}</strong>
          <p>{issue.disposition?.basis}</p><small>待确认 · 未执行</small></div>
      </article>)}</div> : <p className="quality-assessment-note">{value.status === 'clear' ? '本次检测未检出可分类异常。' : '检测证据待复核，暂不生成缺陷处置。'}</p>}
      {value.uncovered_count > 0 && <p className="quality-assessment-note">另有 {value.uncovered_count} 项设计参数尚未覆盖检测，保持待判定。</p>}
    </>}
  </section>;
}
