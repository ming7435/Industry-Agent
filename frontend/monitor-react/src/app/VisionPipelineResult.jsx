import React from 'react';

export const pipelineMessages = {
  clear: '本图未检出异常，已跳过 YOLO 定位。',
  known_defect: 'PatchCore 检出异常，YOLO 已定位并识别缺陷类别。',
  unknown_anomaly: 'PatchCore 检出异常，YOLO 未识别到已知缺陷；保留异常结论，待人工复核。',
  localization_failed: 'PatchCore 检出异常，YOLO 定位失败；保留异常结论，待人工复核。',
};

export default function VisionPipelineResult({ result, busy = false }) {
  const pc = result?.patchcore, yolo = result?.yolo;
  return <div className="vision-pipeline" aria-label="串联质检流程">
    <div className="vision-pipeline-stages">
      <div className={`vision-pipeline-step ${pc?.status || ''}`}><span className="vision-pipeline-number">1</span>
        <div><h4>PatchCore · 判断是否异常</h4><p>{pc ? pc.status === 'defect' ? '已检出异常' : '本图未检出异常' : busy ? '串联检测进行中…' : '等待检测'}</p>
          {pc && <small>异常距离 {pc.score.toFixed(4)} / 阈值 {pc.threshold.toFixed(4)}</small>}</div></div>
      <div className={`vision-pipeline-step ${result?.yolo_state || ''}`}><span className="vision-pipeline-number">2</span>
        <div><h4>YOLO · 定位缺陷位置与类别</h4><p>{!result ? '仅在 PatchCore 检出异常后运行' : result.yolo_state === 'skipped' ? '已跳过 · 前序未检出异常'
          : result.yolo_state === 'failed' ? '定位失败 · 异常待复核' : yolo.status === 'defect' ? `已定位 ${yolo.defects.length} 处缺陷` : '未定位到已知缺陷 · 异常待复核'}</p>
          {yolo && <small>置信度阈值 {yolo.threshold} · 已完成定位推理</small>}</div></div>
    </div>
    {result && <><p className={`vision-pipeline-verdict ${result.status}`} role="status">{pipelineMessages[result.classification]}</p>
      {result.localization_error && <p className="vision-error">{result.localization_error.detail}</p>}
      {result.status === 'defect' && result.classification !== 'known_defect' && <p className="vision-note">图中的异常区域来自 PatchCore，尚未获得 YOLO 确认的缺陷位置与类别。</p>}
      <details className="vision-steps"><summary>本次两阶段检测记录</summary>
        <p className="vision-note">串联记录：{result.inspection_id}</p>
        {[pc, yolo].filter(Boolean).map(stage => <div key={stage.inspection_id}><strong>{stage.algorithm === 'patchcore' ? 'PatchCore' : 'YOLO'} · {stage.model_id}</strong>
          <p className="vision-note">{stage.inspection_id} · {stage.created_at}</p>
          <ol>{stage.steps.map((step, i) => <li key={i}>{step.detail}</li>)}</ol></div>)}
      </details></>}
  </div>;
}
