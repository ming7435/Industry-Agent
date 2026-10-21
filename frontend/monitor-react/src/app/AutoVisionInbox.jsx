import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';
import { verifiedAutoVisionResult, verifiedAutoVisionStatus } from './qualityVision.mjs';

const prefix = '/api/quality/vision/auto';

export default function AutoVisionInbox({ checked, userId }) {
  const [status, setStatus] = useState(null), [result, setResult] = useState(null), [error, setError] = useState('');
  const currentId = useRef('');

  useEffect(() => {
    let active = true, timer;
    const controller = new AbortController();
    currentId.current = '';
    setStatus(null); setResult(null); setError('');
    if (!checked || !userId) return () => controller.abort();
    async function poll() {
      try {
        const next = verifiedAutoVisionStatus(await request(prefix + '/status', { signal: controller.signal }));
        if (!active) return;
        setStatus(next); setError('');
        if (next.latest?.inspection_id && next.latest.inspection_id !== currentId.current) {
          const latest = verifiedAutoVisionResult(await request(prefix + '/latest', { signal: controller.signal }));
          if (!active) return;
          if (latest.inspection_id !== next.latest.inspection_id) throw new Error('自动检测结果已更新，正在重新读取。');
          currentId.current = latest.inspection_id;
          setResult(latest);
        }
      } catch (failure) {
        if (active && !failure.sessionChanged && failure.name !== 'AbortError') setError(failure.message);
      } finally {
        if (active) timer = window.setTimeout(poll, 2500);
      }
    }
    poll();
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [checked, userId]);

  return <section className="vision-auto" aria-labelledby="vision-auto-heading">
    <div className="vision-heading"><div><h3 id="vision-auto-heading">自动检测 · 本地收图目录</h3>
      <p>新齿轮图片进入目录后自动调用现成的 PatchCore 记忆库，无需逐张上传或点击检测。</p></div>
      <span className={`vision-status ${status?.running ? 'ready' : ''}`}>{status?.running ? '自动监听中' : status?.enabled === false ? '未配置收图目录' : status?.enabled ? '监听未运行' : '正在连接检测服务'}</span></div>
    {status?.enabled && <><p className="vision-note">收图目录：<strong>{status.input_dir}</strong>。支持 PNG、JPEG、WebP，单张最多 4 MiB；完整图片处理后移到同级 processed，无法解析的图片移到 failed。</p>
      <dl className="vision-metrics"><div><dt>等待检测</dt><dd>{status.pending_count}</dd></div><div><dt>本次服务已检测</dt><dd>{status.processed_count}</dd></div><div><dt>无法解析</dt><dd>{status.failed_count}</dd></div></dl>
      {status.last_error && <p className="vision-error" role="status">{status.last_error}</p>}
      {!result && <p className="vision-note">等待目录中的第一张新图片；请让采集程序先写临时文件，再改名为图片扩展名，避免读取未写完的图片。</p>}
      {result && <div className="vision-auto-result"><h3>最新自动检测：{result.status === 'defect' ? '检出异常' : '未检出异常'}</h3>
        <p className="vision-note">{result.filename} · 异常距离 {result.score.toFixed(4)} · 阈值 {result.threshold.toFixed(4)} · {result.created_at}</p>
        <div className="vision-images"><figure><img src={result.annotated_image} alt="自动检测定位结果" /><figcaption>定位结果 · {result.filename}</figcaption></figure>
          <figure><img src={result.heatmap_image} alt="自动检测异常热力图" /><figcaption>PatchCore 异常热力图</figcaption></figure></div>
      </div>}</>}
    {status?.enabled === false && <p className="vision-note">本地服务尚未设置 QUALITY_VISION_AUTO_INBOX_DIR。</p>}
    {error && <p className="vision-error" role="alert">{error}</p>}
  </section>;
}
