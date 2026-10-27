import React, {useEffect, useState} from 'react';
import {request} from './apiRequest.mjs';
import {dimensionDefectTypes, verifiedVisionStatistics} from './qualityStatistics.mjs';
import './qualityStatistics.css';

const rate = n => typeof n==='number' && Number.isFinite(n) ? `${n.toFixed(2)}%` : '—';

export function DimensionStatistics({result}) {
  if (!result) return null;
  const valid=result.status!=='review', c=valid ? result.counts : null, types=dimensionDefectTypes(result);
  const pending=(c?.pending || 0)+(c?.review || 0);
  const partialBasis=result.basis?.parameters?.some(parameter=>parameter.comparable===false);
  return <section className="quality-statistics" aria-label="本批质检统计">
    <h3>本批质检统计</h3><dl className="quality-stat-cards">
      {partialBasis ? <>
        <div><dt>整件合格率</dt><dd>{valid ? rate(result.rates?.qualified) : '—'}</dd><small>合格 / 已判定 {c?.qualified ?? '—'} / {c?.determinate ?? '—'} 件</small></div>
        <div><dt>合格 / 不合格</dt><dd>{c ? `${c.qualified} / ${c.unqualified}` : '—'}</dd><small>共 {c?.total ?? '—'} 件模拟样本</small></div>
      </> : <>
        <div><dt>合格件数</dt><dd>{c?.qualified ?? '—'}</dd><small>共 {c?.total ?? '—'} 件模拟样本</small></div>
        <div><dt>不合格件数</dt><dd>{c?.unqualified ?? '—'}</dd><small>已完成判定的异常样本</small></div>
      </>}
      <div><dt>待判定</dt><dd>{c ? pending : '—'}</dd><small>缺测或尚未完成全部检测</small></div>
    </dl>
    <h4>不合格类型（已发现的异常项）</h4>
    {types.length ? <table><thead><tr><th>类型</th><th>异常项数</th><th>涉及样本</th></tr></thead><tbody>{types.map(row=><tr key={row.key}><td>{row.label}</td><td>{row.occurrences} 项</td><td>{row.sample_count} 件</td></tr>)}</tbody></table>
      : <p>{valid ? '本批尚未发现参数不一致。' : '记录待复核，暂不统计。'}</p>}
    <p className="quality-stat-note">按当前模拟批次统计。待判定样本不计入合格率分母；同一样本可有多种异常，发现异常项不代表已完成整件判定。</p>
  </section>;
}

export function VisionStatistics({auth, checked, part, revision}) {
  const [source,setSource]=useState('upload'), [refresh,setRefresh]=useState(0), [state,setState]=useState(null);
  const partId=source==='upload' ? part?.run_id || '' : '';
  const key=JSON.stringify([auth.version,auth.actor?.user_id,source,partId,refresh,revision]);
  useEffect(()=>{
    const abort=new AbortController();
    if(!checked || !auth.actor?.user_id) return ()=>abort.abort();
    const params=new URLSearchParams({image_source:source,part_id:partId});
    request('/api/quality/vision/statistics?'+params,{signal:abort.signal}).then(value=>{
      if(!abort.signal.aborted) setState({key,value:verifiedVisionStatistics(value,source,partId)});
    }).catch(error=>{if(!abort.signal.aborted && !error.sessionChanged) setState({key,error:error.message});});
    return ()=>abort.abort();
  },[key,checked]);
  const current=state?.key===key ? state : null, stats=current?.value, c=stats?.counts;
  return <section className="quality-statistics" aria-label="视觉质检统计">
    <header><h3>视觉质检统计</h3><div className="quality-stat-actions"><select aria-label="视觉统计图片来源" value={source} onChange={event=>setSource(event.target.value)}>
      <option value="upload">上传图片</option><option value="public_gear_reference">参考测试图片</option></select>
      <button type="button" className="button" disabled={!auth.actor?.user_id} onClick={()=>setRefresh(value=>value+1)}>刷新统计</button></div></header>
    <p className="quality-stat-note">{partId ? `当前零件：${part.name}（${part.number}）` : '当前账号全部'+(source==='upload'?'上传图片':'参考测试图片')} · 按已保存检测图次统计</p>
    <dl className="quality-stat-cards">
      <div><dt>视觉合格率</dt><dd>{rate(stats?.qualified_rate)}</dd><small>未检出异常 / 已检测 {c?.qualified ?? '—'} / {c?.total ?? '—'} 图次</small></div>
      <div><dt>不合格</dt><dd>{c?.unqualified ?? '—'}</dd><small>PatchCore 检出异常的图次</small></div>
      <div><dt>异常待定位／分类</dt><dd>{c?.unlocalized ?? '—'}</dd><small>计入不合格，类别仍待确认</small></div>
    </dl>
    <h4>不合格类型</h4>
    {stats?.types.length ? <table><thead><tr><th>类型</th><th>涉及图次</th><th>缺陷框数</th><th>占不合格图次</th></tr></thead><tbody>{stats.types.map(row=><tr key={row.key}><td>{row.label}</td><td>{row.image_count}</td><td>{row.key==='unlocalized'?'—':row.occurrences}</td><td>{rate(row.share)}</td></tr>)}</tbody></table>
      : <p>{!auth.actor?.user_id ? '登录后查看质检统计。' : current?.error || (!stats ? '正在读取统计…' : c.total ? '当前范围未检出不合格图片。' : '当前范围暂无已完成检测。')}</p>}
    {stats?.invalid_records>0 && <p className="quality-stat-warning">有 {stats.invalid_records} 条记录无法核验，未计入统计。</p>}
    {stats?.research_model_count>0 && <p className="quality-stat-note">其中 {stats.research_model_count} 图次使用研究／演示模型，结果需复核。</p>}
    {stats?.truncated && <p className="quality-stat-warning">仅统计最近保存记录范围，未覆盖更早历史。</p>}
    <p className="quality-stat-note">同图复检另计；一图多种缺陷时占比可合计超过 100%。以上为模型判定统计，不代表检测准确率或整件放行率。</p>
  </section>;
}
