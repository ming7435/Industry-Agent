import React, { useEffect, useRef, useState } from 'react';
import { request } from './apiRequest.mjs';

const endpoint = '/api/quality/vision/part-segmentation/predict';
const labels = { endface: '端面', toothface: '齿面' };

export default function PartSegmentationPanel({ status, userId, checked }) {
  const [image, setImage] = useState(null);
  const [confidence, setConfidence] = useState('0.25');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pending = useRef(null);
  const readToken = useRef(0);
  useEffect(() => () => pending.current?.abort(), []);

  function selectImage(event) {
    const token = ++readToken.current;
    pending.current?.abort();
    setBusy(false); setResult(null); setError(''); setImage(null);
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
      setError('请选择不超过 4 MB 的 PNG、JPEG 或 WebP 图片。');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (token !== readToken.current) return;
      if (typeof reader.result === 'string') setImage({ name: file.name, data: reader.result });
      else setError('图片读取失败，请重新选择。');
    };
    reader.onerror = () => { if (token === readToken.current) setError('图片读取失败，请重新选择。'); };
    reader.readAsDataURL(file);
  }

  async function predict() {
    const threshold = Number(confidence);
    if (!image || !userId || !status?.available || !Number.isFinite(threshold) || threshold <= 0 || threshold > 1) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true); setResult(null); setError('');
    try {
      const value = await request(endpoint, { method: 'POST', signal: controller.signal,
        body: JSON.stringify({ image: image.data, confidence: threshold }) });
      if (value.purpose !== 'part_segmentation' || value.model_id !== 'part-seg-v1'
        || !Array.isArray(value.detections) || !value.annotated_image?.startsWith('data:image/png;base64,')) {
        throw new Error('工件分割结果格式无效。');
      }
      if (pending.current === controller) setResult(value);
    } catch (failure) {
      if (pending.current === controller && failure.name !== 'AbortError') setError(failure.message);
    } finally {
      if (pending.current === controller) { pending.current = null; setBusy(false); }
    }
  }

  const threshold = Number(confidence);
  const canRun = !!userId && !!status?.available && !!image && !busy
    && Number.isFinite(threshold) && threshold > 0 && threshold <= 1;
  return <section className="vision-part-seg vision-seg-workbench" aria-labelledby="part-seg-heading">
    <div className="vision-main-grid"><aside className="vision-setup" aria-label="工件分割设置">
    <div className="vision-section-label"><span>01</span><h3 id="part-seg-heading">分割设置</h3></div>
    <p className="vision-note vision-yolo-note">本模型只识别端面和齿面，分割结果不能作为缺陷、合格或不合格判定。</p>
    {!status?.available && checked && <p className="vision-note">{status?.reason || '正在检查工件分割模型…'}</p>}
    {!userId && checked && <p className="vision-note">请先登录维修小组账号。</p>}
    <div className="vision-query"><label>工件图片<input type="file" accept="image/png,image/jpeg,image/webp"
      aria-label="工件分割图片" disabled={!userId || busy} onChange={selectImage} /></label>
      <label>分割置信度<input type="number" aria-label="分割置信度" min="0.01" max="1" step="0.05"
        value={confidence} onChange={event => { setConfidence(event.target.value); setResult(null); }} /></label></div>
    <div className="vision-run"><span className="vision-note">{image ? image.name : '请选择单张工件图片（不超过 4 MB）'}</span>
      <button className="button primary" type="button" disabled={!canRun} onClick={predict}>{busy ? '正在分割…' : '运行工件分割'}</button></div>
    {error && <p className="vision-error" role="alert">{error}</p>}
    </aside><section className="vision-output vision-result-stage" aria-label="工件分割结果">
    <header><h3>工件分割结果</h3><span className="vision-status">{busy ? '正在分割' : result ? '分割完成' : '等待检测'}</span></header>
    {!result && (image ? <div className="vision-images"><figure><img src={image.data} alt="工件原图"/><figcaption>{image.name}</figcaption></figure></div> : <div className="vision-empty-state"><h4>上传工件图片</h4><p>查看端面与齿面的轮廓、位置和面积。</p></div>)}
    {result && <div><p className="vision-note">检出 {result.detections.length} 个工件区域 · 模型 {result.model_id} · 推理 {result.inference_ms} ms。此处不生成质量结论。</p>
      <div className="vision-images"><figure><img src={image.data} alt="工件原图" /><figcaption>原图</figcaption></figure>
        <figure><img src={result.annotated_image} alt="端面和齿面分割区域" /><figcaption>工件分割轮廓</figcaption></figure></div>
      {!!result.detections.length && <div className="vision-table-scroll"><table><thead><tr><th>区域</th><th>类别</th><th>置信度</th><th>边界框</th><th>掩码面积</th></tr></thead><tbody>
        {result.detections.map((item, index) => <tr key={index}><td>{index + 1}</td><td>{labels[item.class] || item.class}</td>
          <td>{(item.conf * 100).toFixed(1)}%</td><td>{item.box.join(', ')}</td><td>{item.mask_area} px²</td></tr>)}
      </tbody></table></div>}</div>}
    </section></div>
  </section>;
}
