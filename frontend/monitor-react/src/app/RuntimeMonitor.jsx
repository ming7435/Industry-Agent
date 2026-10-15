import React, {useEffect,useRef,useState} from 'react';
import {readWorkspace,peekWorkspaceRead} from './workspaceReads.mjs';
import './runtimeMonitor.css';

const finite=value=>typeof value==='number'&&Number.isFinite(value);
const number=(value,digits=0)=>finite(value)?new Intl.NumberFormat('zh-CN',{maximumFractionDigits:digits}).format(value):'未采集';
const duration=value=>finite(value)?`${number(value/1000,2)} 秒`:'未采集';
const rate=value=>finite(value)?`${number(value*100,1)}%`:'未采集';
const time=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleString('zh-CN',{hour12:false}):'未采集';

function Metric({label,value,children}){
  return <div className="runtime-metric"><span>{label}</span><strong>{value}</strong><small>{children}</small></div>;
}

function UsageTrend({rows=[],valueKey='calls',bucketSeconds=60}){
  const tokens=valueKey==='total_tokens';
  const grain=bucketSeconds>=86400?'天':bucketSeconds>=3600?'小时':'分钟';
  const title=`每${grain}${tokens?' Token 消耗量':'模型调用量'}`;
  const unit=tokens?'Token':'次';
  const pointLabel=row=>`${time(row.at)} · ${number(row.amount)} ${unit}${tokens?'（已报告总量）':` · ${number(row.failed)} 个错误`}`;
  const viewport=useRef(null),[availableWidth,setAvailableWidth]=useState(0);
  useEffect(()=>{
    const element=viewport.current;
    const observer=new ResizeObserver(()=>setAvailableWidth(element.clientWidth));
    observer.observe(element);
    return()=>observer.disconnect();
  },[]);
  const samples=(Array.isArray(rows)?rows:[]).filter(row=>row&&Number.isFinite(Date.parse(row.at)))
    .map(row=>({...row,amount:row[valueKey],stamp:Date.parse(row.at)})).sort((left,right)=>left.stamp-right.stamp);
  const known=samples.filter(row=>finite(row.amount)&&row.amount>=0);
  const maximum=Math.max(1,...known.map(row=>row.amount));
  const start=samples[0]?.stamp,end=samples.at(-1)?.stamp,span=end-start;
  const gaps=samples.slice(1).map((row,index)=>row.stamp-samples[index].stamp).filter(gap=>gap>0);
  const spacing=Math.max(48,...known.map(row=>number(row.amount).length*8+20));
  const left=Math.max(48,number(maximum).length*8+16,spacing/2+8),right=Math.max(32,spacing/2+8);
  const width=Math.max(320,availableWidth,left+right+spacing+(span>0?span/Math.min(...gaps):0)*spacing);
  const x=stamp=>left+spacing/2+(span>0?(stamp-start)/span:.5)*(width-left-right-spacing);
  const y=amount=>162-amount/maximum*120;
  const segments=[];
  let segment=[];
  for(const row of samples){
    if(finite(row.amount)&&row.amount>=0)segment.push(`${x(row.stamp)},${y(row.amount)}`);
    else{if(segment.length>1)segments.push(segment);segment=[];}
  }
  if(segment.length>1)segments.push(segment);
  const tickTime=stamp=>new Date(stamp).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false,
    ...(bucketSeconds>=3600?{month:'numeric',day:'numeric'}:{}),
    ...(bucketSeconds<86400?{hour:'2-digit',minute:'2-digit',...(stamp%60000?{second:'2-digit'}:{})}:{})});
  const ticks=bucketSeconds>=86400?Array.from({length:Math.min(5,samples.length)},(_,index)=>
    samples[Math.round(index*(samples.length-1)/Math.max(1,Math.min(5,samples.length)-1))].stamp)
    :span>0?Array.from({length:5},(_,index)=>start+span*index/4):[start];
  return <div className="runtime-trend"><div className="runtime-trend-heading"><h3>{title}</h3>
    {!tokens&&known.some(row=>row.failed>0)&&<span className="runtime-trend-legend"><i/>空心点含错误调用</span>}</div>
    {tokens&&<p className="runtime-trend-note">包含输入与输出，按提供方总量回执统计；仅合计已报告部分，未采集的时段不补零。</p>}
    <div className="runtime-trend-scroll" ref={viewport} tabIndex={0} aria-label={`${title}趋势，可横向滚动查看各点数值`}>
      {known.length>0?<svg width={width} height="218" viewBox={`0 0 ${width} 218`} role="img" aria-label={`${title}折线图，标注各点${tokens?'已报告 Token 总量':'调用次数，空心点含错误调用'}`}>
        <text x="12" y="18" className="runtime-trend-tick">{unit}</text>
        {[...new Set([0,Math.ceil(maximum/2),maximum])].map(value=><g key={value} className="runtime-trend-grid">
          <line x1={left} x2={width-right} y1={y(value)} y2={y(value)}/><text x={left-12} y={y(value)+4} textAnchor="end" className="runtime-trend-tick">{number(value)}</text>
        </g>)}
        <line x1={left} x2={left} y1="42" y2="162" className="runtime-trend-axis"/>
        {ticks.map((stamp,index)=><text key={stamp} x={x(stamp)} y="194" textAnchor={ticks.length===1?'middle':index===0?'start':index===ticks.length-1?'end':'middle'} className="runtime-trend-tick">{tickTime(stamp)}</text>)}
        {segments.map((points,index)=><polyline key={index} points={points.join(' ')} className="runtime-trend-line"/>)}
        {known.map(row=><g key={row.at} className={`runtime-trend-point${!tokens&&row.failed>0?' has-errors':''}`} tabIndex={0}
          aria-label={pointLabel(row)}>
          <title>{pointLabel(row)}</title>
          <circle cx={x(row.stamp)} cy={y(row.amount)} r="4"/>
          <text x={x(row.stamp)} y={y(row.amount)-12} textAnchor="middle" className="runtime-trend-value">{number(row.amount)}</text>
        </g>)}
      </svg>:<p className="runtime-empty">本时段暂无已采集的{tokens?' Token 用量':'调用数据'}。</p>}
    </div>
    {known.length>0&&<div className="runtime-trend-labels"><span>{time(samples[0].at)}</span><span>每点一{grain} · 北京时间 · 当前{grain}未结束</span><span>{time(samples.at(-1).at)}</span></div>}
  </div>;
}

export default function RuntimeMonitor({active=true}){
  const [windowMinutes,setWindowMinutes]=useState(60),[revision,setRevision]=useState(0);
  const [value,setValue]=useState(()=>peekWorkspaceRead('/api/runtime/metrics?window_minutes=60'));
  const [loading,setLoading]=useState(!value),[error,setError]=useState('');
  useEffect(()=>{
    if(!active)return;
    let disposed=false,timer;
    const controller=new AbortController();
    async function load(){
      try{
        const body=await readWorkspace(`/api/runtime/metrics?window_minutes=${windowMinutes}`,{signal:controller.signal,freshFor:4500,force:revision>0});
        if(!body||body.window_minutes!==windowMinutes||!body.model||!body.agent)throw new Error('运行监控数据暂不可用');
        if(!disposed){setValue(body);setError('');}
      }catch(failure){if(!disposed&&failure.name!=='AbortError')setError('运行监控暂不可用，请稍后刷新');}
      finally{if(!disposed){setLoading(false);timer=setTimeout(load,5000);}}
    }
    setLoading(true);load();
    return()=>{disposed=true;controller.abort();clearTimeout(timer);};
  },[active,windowMinutes,revision]);
  const current=value?.window_minutes===windowMinutes?value:null;
  const model=current?.model?.available===true?current.model:null,agent=current?.agent;
  const usage=model?.usage,durations=model?.duration_ms;
  const capabilities=(model?.capabilities||[]).filter(row=>row.calls>0);
  return <section className="panel module-panel runtime-monitor" aria-label="系统运行监控">
    <div className="runtime-heading"><div><h2>系统运行监控</h2><p>模型用量与调用性能</p></div>
      <div className="runtime-controls"><label>统计范围 <select aria-label="监控时间范围" value={windowMinutes} onChange={event=>setWindowMinutes(Number(event.target.value))}>
        <option value={60}>最近 1 小时</option><option value={1440}>最近 1 天</option><option value={10080}>最近 1 周</option><option value={43200}>最近 1 个月（30天）</option>
      </select></label><button type="button" className="button secondary" onClick={()=>setRevision(value=>value+1)} disabled={loading}>刷新监控</button></div>
    </div>
    {(error||(!model&&current))&&<p className="runtime-warning" role="status">{error||current.model.message||'模型监控尚未采集'}</p>}
    <div className="runtime-metric-grid" aria-busy={loading}>
      <Metric label="Token 总用量" value={number(usage?.total_tokens)}>输入 {number(usage?.input_tokens)} · 输出 {number(usage?.output_tokens)}</Metric>
      <Metric label="模型调用" value={number(model?.calls)}>调用成功率 {rate(model?.success_rate)}</Metric>
      <Metric label="请求吞吐" value={finite(model?.requests_per_minute)?`${number(model.requests_per_minute,2)} 次/分钟`:'未采集'}>已报告 Token {number(model?.tokens_per_minute,1)}/分钟</Metric>
      <Metric label="平均响应时间" value={duration(durations?.average)}>95% 调用不超过 {duration(durations?.p95)}</Metric>
      <Metric label="错误调用" value={number(model?.failed)}>按已完成网关请求统计</Metric>
      <Metric label="正在执行" value={number(model?.inflight)}>当前模型请求，不含等待人工的任务</Metric>
    </div>
    <div className="runtime-observation"><span>自动刷新：5 秒</span><span>更新于 {time(current?.generated_at)}</span>
      {model&&<span>本模型进程启动于 {time(model.started_at)}</span>}
    </div>
    {usage&&<p className="runtime-coverage">用量回执：{number(usage.reported_calls)} 次已报告，{number(usage.missing_calls)} 次未报告；Token 仅合计已报告部分，不估算缺项。</p>}
    {model?.partial&&<p className="runtime-warning">本窗口超过采集容量，仅统计保留的最近 {number(model.capacity)} 条回执。</p>}
    {model&&finite(model.observed_seconds)&&model.observed_seconds<windowMinutes*60&&<p className="runtime-coverage">所选范围尚未完整采集，仅统计本次服务启动后已保留的数据；实际采集起点：{time(model.window_start||model.started_at)}。</p>}
    {model?.synthetic_calls>0&&<p className="runtime-coverage">另有 {number(model.synthetic_calls)} 次测试模式调用，未计入真实用量。</p>}
    {model&&(model.calls>0?<UsageTrend rows={model.timeline} bucketSeconds={model.bucket_seconds}/>:<p className="runtime-empty">本窗口暂无真实模型调用。</p>)}
    {model&&<UsageTrend rows={model.timeline} valueKey="total_tokens" bucketSeconds={model.bucket_seconds}/>}
    {agent?.available&&<div className="runtime-agent-summary"><span>Agent 回执：完成 {number(agent.agents?.completed)} · 错误 {number(agent.agents?.failed)}</span>
      <span>工具回执：完成 {number(agent.tools?.completed)} · 错误 {number(agent.tools?.failed)}</span>
      {agent.partial&&<span className="runtime-warning">运行轨迹为最近 {number(agent.sample_limit)} 条样本，非全量统计</span>}</div>}
    {agent?.available===false&&<p className="runtime-warning">{agent.message||'Agent运行统计暂不可用'}</p>}
    <details className="runtime-methods"><summary>统计口径与调用分类</summary>
      <p>模型统计仅覆盖本 Model 服务进程启动后、所选时间范围内的请求。吞吐按实际已观测秒数折算；正在执行为当前值。每个网关请求只计一次，供应商内部重试不另计，不能替代供应商账单；耗时包含网关等待与内部重试，不是首字延迟。</p>
      <p>Agent 与工具仅统计所选窗口内的终态回执并去重，完成不代表业务验收通过；不与模型调用数相加。进程计数器有界保存在内存，重启清零，不更改 MySQL、Redis 或 Milvus 业务数据。</p>
      {capabilities.length>0&&<div className="runtime-table-wrap"><table><thead><tr><th>调用类型</th><th>调用次数</th><th>错误</th><th>Token</th><th>平均耗时</th></tr></thead><tbody>
        {capabilities.map(row=><tr key={row.capability}><td>{{chat:'对话',embedding:'向量化',rerank:'重排',vision:'图像解析'}[row.capability]||'其他'}</td><td>{number(row.calls)}</td><td>{number(row.failed)}</td><td>{number(row.usage?.total_tokens)}</td><td>{duration(row.duration_ms?.average)}</td></tr>)}
      </tbody></table></div>}
    </details>
  </section>;
}
