import React from 'react';
import ExpertDocument from './ExpertDocument.jsx';

const statuses = {open: '待接单', assigned: '待接单', in_progress: '处理中', completed: '已完成', closed: '已关闭',
  running: '运行中', stopped: '已停机', emergency_stop: '已停机', alarm: '有报警'};

export default function ExpertTrialDetails({ trial, actor, formatTime }) {
  const details = trial.details || {};
  const diagnosis = details.diagnosis || trial.result || {};
  const plan = details.maintenance_plan || {};
  const orders = details.workorders || [];
  const restart = details.restart || {};
  const report = details.report || {};
  const confidence = Number(diagnosis.confidence);
  const ownerName = order => order.assignee === actor?.user_id ? actor.username || '当前维修人员'
    : order.assignee_name && order.assignee_name !== order.assignee ? order.assignee_name : '已派发的维修人员';
  return <section className="expert-trial-details" aria-label="测试详情">
    <h3>本轮测试详情</h3>
    <dl className="expert-trial-overview">
      <div><dt>故障设备</dt><dd>{trial.machine?.name || trial.machine?.device_id || '尚未读取'}</dd></div>
      <div><dt>报警编号</dt><dd>{trial.machine ? trial.machine.alarm_code || '无报警码' : '尚未读取'}</dd></div>
      <div><dt>测试开始</dt><dd>{formatTime(trial.created_at)}</dd></div>
    </dl>
    {trial.baseline_changed && <p className="expert-alert">技能说明已更新，本轮结果仅供查看；请用当前内容重新测试后发布。</p>}
    <div className="expert-trial-detail-grid">
      <section className="expert-trial-detail expert-trial-detail-wide">
        <h4>智能诊断结果</h4>
        {diagnosis.confidence != null && Number.isFinite(confidence) && <p>诊断置信度：{Math.round(confidence * 100)}%</p>}
        {diagnosis.requires_human_review && <p>诊断结论需要维修人员进一步核实。</p>}
        {[['故障概述', diagnosis.summary], ['诊断判断', diagnosis.diagnosis], ['处理建议', diagnosis.recommendation]].map(([label, value]) =>
          value && <section key={label}><h5>{label}</h5><ExpertDocument value={value} label={label} readOnly /></section>)}
        {!diagnosis.summary && !diagnosis.diagnosis && <p>本轮诊断结果尚未保存。</p>}
      </section>
      <section className="expert-trial-detail">
        <h4>维修方案</h4>
        {plan.plan_id ? <p>方案编号：{plan.plan_id}</p> : <p>本轮尚未生成可读取的维修方案。</p>}
        {plan.workorder_ready===false && <p>方案已生成，尚未通过派工校验。</p>}
        {!!plan.validation_findings?.length && <ul>{plan.validation_findings.map((finding,index)=><li key={index}>{finding}</li>)}</ul>}
        {plan.summary && <ExpertDocument value={plan.summary} label="维修方案说明" readOnly />}
        {!!plan.steps?.length && <ol>{plan.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>}
      </section>
      <section className="expert-trial-detail">
        <h4>工单与检查结果</h4>
        {!orders.length && <p>本轮尚未生成关联工单。</p>}
        {orders.map(order => <section key={order.workorder_id} className="expert-trial-order">
          <h5>工单 {order.workorder_id}</h5>
          <dl><div><dt>工单状态</dt><dd>{statuses[order.status] || '待确认'}</dd></div>
            <div><dt>维修负责人</dt><dd>{ownerName(order)}</dd></div>
            <div><dt>派发时间</dt><dd>{formatTime(order.created_at)}</dd></div>
            <div><dt>确认完成时间</dt><dd>{formatTime(order.completed_at)}</dd></div></dl>
          {order.confirmation_method === 'manual_confirmation' && <p>检查方式：维修人员人工确认。</p>}
          <h5>处理说明</h5>
          {order.feedback ? <ExpertDocument value={order.feedback} label="已保存的处理说明" readOnly /> : <p>维修人员尚未提交处理说明。</p>}
          <a href={`/?view=workorder&workorder_id=${encodeURIComponent(order.workorder_id)}`}>查看此工单</a>
        </section>)}
      </section>
      <section className="expert-trial-detail expert-trial-detail-wide">
        <h4>整线复机情况</h4>
        <p>{restart.completed ? `本轮已保存复机记录，复机时间：${formatTime(restart.restarted_at)}` : '本轮尚未读取到整线复机记录。'}</p>
        {!!restart.devices?.length && <dl className="expert-trial-overview">{restart.devices.map(device =>
          <div key={device.device_id}><dt>{device.name}</dt><dd>{statuses[device.status] || '状态暂未读取'}</dd></div>)}</dl>}
      </section>
      <section className="expert-trial-detail expert-trial-detail-wide">
        <h4>汇总报告</h4>
        {report.report_id ? <><p>{report.title || '故障处理汇总报告'} · {report.report_id}</p>
          {report.article ? <ExpertDocument value={report.article} label="本轮汇总报告正文" readOnly /> : <p>报告已保存，正文暂未读取。</p>}
          <a href="/?view=report">打开报告中心</a></> : <p>本轮汇总报告尚未保存。</p>}
      </section>
    </div>
    {!!details.pending_reasons?.length && <section className="expert-trial-pending"><h4>仍需处理的事项</h4>
      <ul>{details.pending_reasons.map((reason, index) => <li key={index}>{reason}</li>)}</ul></section>}
  </section>;
}
