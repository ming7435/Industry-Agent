import React, {useEffect,useRef,useState} from 'react';
import {request} from './apiRequest.mjs';

const groups=[
  {title:'诊断与工程',description:'发现问题、检索证据、定位部件',agents:['diagnosis','knowledge','cad']},
  {title:'维修与执行',description:'生成维修方案、派发工单、检查质量',agents:['maintenance','workorder','quality']},
  {title:'编排与沉淀',description:'分派任务、汇总报告、积累经验',agents:['router','report','memory']},
];
const descriptions={diagnosis:'分析报警与运行证据，定位设备故障。',knowledge:'检索手册与知识资料，为处理结论提供依据。',
  cad:'解析工程需求，查询图纸与部件关联。',maintenance:'结合故障、部件和备件信息，生成维修方案。',
  workorder:'核查派工条件，创建和跟踪维修工单。',quality:'检查零件质量，记录检测结果与复核意见。',
  router:'识别任务意图，将任务交给对应专家。',report:'汇总处理过程，生成并保存报告。',memory:'整理历史处理记录，积累可检索的经验。'};
const formatTime=value=>value ? new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',
  hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)) : '暂无记录';
const formatUpdateTime=value=>value&&!Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat('zh-CN',{
  timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
}).format(new Date(value)) : '暂无';
const status=metric=>!metric ? ['unknown','统计暂不可用'] : metric.running ? ['running','执行中'] : metric.failed ? ['failure','有执行失败']
  : metric.blocked ? ['attention','有受阻调用']
  : metric.unconfirmed ? ['attention','状态待确认'] : metric.pending ? ['attention','有等待处理记录']
  : metric.total ? ['success','调用正常'] : ['unknown','待运行'];

const POLL_INTERVAL=5000, REQUEST_TIMEOUT=15000;

export default function ExpertOverview({items,actor,active=true,onOpen}){
  const [query,setQuery]=useState('');
  const [attention,setAttention]=useState(false);
  const [snapshot,setSnapshot]=useState(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [connection,setConnection]=useState('loading');
  const refreshRef=useRef(()=>{});
  const owner=`${actor?.user_id}:${actor?.role}`;
  const data=snapshot?.owner===owner ? snapshot : null;
  useEffect(()=>{
    if(!active){setConnection('paused');setBusy(false);refreshRef.current=()=>{};return undefined;}
    let disposed=false,timer=null,controller=null,inFlight=false,queued=false;
    const visible=()=>document.visibilityState!=='hidden';
    const schedule=()=>{if(!disposed && visible())timer=window.setTimeout(read,POLL_INTERVAL);};
    const read=async()=>{
      window.clearTimeout(timer);
      if(disposed || !visible())return;
      if(inFlight){queued=true;return;}
      inFlight=true;setBusy(true);
      const current=new AbortController();controller=current;
      let timedOut=false;
      const timeout=window.setTimeout(()=>{timedOut=true;current.abort();},REQUEST_TIMEOUT);
      try{
        const value=await request('/api/expert/agents',{signal:current.signal});
        if(disposed || current.signal.aborted)return;
        if(value.available!==true || !Array.isArray(value.items))throw new Error('统计暂不可用');
        setSnapshot({...value,owner});setError('');setConnection('live');
      }catch(e){
        if(!disposed && (e.name!=='AbortError' || timedOut)){
          setError(timedOut ? '请求超时，将自动重试。' : '统计暂不可读取，将自动重试。');setConnection('error');
        }
      }finally{
        window.clearTimeout(timeout);inFlight=false;
        if(!disposed){
          setBusy(false);
          if(!visible()){queued=false;setConnection('paused');}
          else if(queued){queued=false;read();}
          else schedule();
        }
      }
    };
    refreshRef.current=read;
    const onVisible=()=>{
      window.clearTimeout(timer);
      if(!visible()){queued=false;controller?.abort();setConnection('paused');}
      else read();
    };
    document.addEventListener('visibilitychange',onVisible);
    window.addEventListener('focus',onVisible);
    if(visible()){setConnection('loading');read();}else setConnection('paused');
    return()=>{disposed=true;window.clearTimeout(timer);controller?.abort();
      document.removeEventListener('visibilitychange',onVisible);window.removeEventListener('focus',onVisible);refreshRef.current=()=>{};};
  },[owner,active]);
  const experts=[...new Map(items.map(item=>[item.agent,{agent:item.agent,label:item.agent_label || item.agent}])).values()]
    .map(expert=>({...expert,skills:items.filter(item=>item.agent===expert.agent),
      metric:data?.available ? data.items?.find(item=>item.agent===expert.agent) : null}));
  const visible=experts.filter(expert=>[expert.label,expert.agent,...expert.skills.flatMap(skill=>[skill.title,skill.name,skill.goal])]
    .join(' ').toLowerCase().includes(query.trim().toLowerCase()) && (!attention || expert.metric?.failed || expert.metric?.blocked || expert.metric?.unconfirmed));
  const observed=experts.filter(expert=>expert.metric);
  const count=key=>observed.reduce((sum,expert)=>sum+(expert.metric[key]||0),0);
  const attentionCount=experts.filter(expert=>expert.metric?.failed || expert.metric?.blocked || expert.metric?.unconfirmed).length;
  return <section className="expert-overview" aria-label="专家总览">
    <dl className="expert-overview-summary">
      <div><dt>专家</dt><dd>{experts.length}<small>位 Agent</small></dd></div>
      <div><dt>绑定技能</dt><dd>{items.length}<small>项 Skill</small></dd></div>
      <div><dt>近 24 小时调用</dt><dd>{observed.length ? count('total') : '—'}<small>次尝试</small></dd></div>
      <div><dt>需关注专家</dt><dd>{observed.length ? attentionCount : '—'}<small>位</small></dd></div>
    </dl>
    <div className="expert-overview-toolbar">
      <label>查找专家或技能<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="专家名称、技能名称或标识" /></label>
      <label className="expert-attention-filter"><input type="checkbox" checked={attention} onChange={event=>setAttention(event.target.checked)} />只看需关注</label>
      <button type="button" disabled={busy} onClick={()=>refreshRef.current()}>{busy ? '读取统计中…' : '刷新调用统计'}</button>
    </div>
    <div className={`expert-monitor-status ${connection}`} role="status" aria-live="polite">
      <span className="expert-monitor-dot" aria-hidden="true" />
      <span>{connection==='error' ? '自动更新失败' : connection==='paused' ? '监测已暂停' :
        connection==='live' ? (data?.partial ? '部分数据 · 约每 5 秒更新' : '近实时监测中 · 约每 5 秒更新') : '正在连接监测'}</span>
      {busy && data && <span>更新中…</span>}
      {data?.window_end && <span>上次更新 {formatUpdateTime(data.window_end)}（北京时间）</span>}
    </div>
    <p className="expert-overview-note">每位专家仅调用自己绑定的 Skill。调用统计取自近 24 小时运行记录，包含业务与测试；每次重试独立计数。执行中以本服务的活跃调用为准，无法确认的未结束记录单独列出。</p>
    {error && <p className="expert-alert" role="alert">{error}</p>}
    {data?.partial && <p className="expert-alert" role="status">当前仅能读取部分运行记录，下方数字为已读取样本，不能代表完整的 24 小时。</p>}
    {groups.map(group=>{
      const entries=visible.filter(expert=>group.agents.includes(expert.agent));
      return entries.length ? <section key={group.title} className="expert-agent-group" aria-label={group.title}>
        <div className="expert-group-heading"><h2>{group.title}<span>{entries.length} 位专家</span></h2><p>{group.description}</p></div>
        <div className="expert-agent-grid">{entries.map(expert=>{
          const metric=expert.metric,[tone,label]=status(metric);
          return <article key={expert.agent} className={`expert-agent-card ${tone}`} aria-label={`${expert.label}专家`}>
            <div className="expert-agent-card-heading"><h3><span className={`expert-status-dot ${tone}`} />{expert.label}专家</h3>
              <span className="expert-skill-count">{expert.skills.length} 项技能</span></div>
            <p className="expert-agent-description">{descriptions[expert.agent]}</p>
            <div className="expert-agent-rate"><strong>{metric?.completion_rate!=null ? `${metric.completion_rate}%` : '—'}</strong>
              <div><span>调用完成率</span><span className={`expert-agent-state ${tone}`}>{metric?.total===0 ? '暂无运行数据' : label}</span></div></div>
            <p className="expert-agent-activity">当前执行中 {metric ? metric.running : '—'}
              {metric?.unconfirmed ? ` · 未确认结束 ${metric.unconfirmed}` : ''}
              {metric && (metric.failed || metric.blocked) ? ` · 近 24 小时失败 ${metric.failed} · 受阻 ${metric.blocked}` : ''}</p>
            <dl className="expert-agent-stats">{[['total','总调用'],['completed','完成'],['failed','失败'],['blocked','受阻']].map(([key,title])=>
              <div key={key}><dt>{title}</dt><dd>{metric ? metric[key] : '—'}</dd></div>)}</dl>
            <p className="expert-agent-last">最近失败 / 受阻：{metric ? formatTime(metric.last_failure_at) : '待读取'}
              {Boolean(metric?.pending) && <span>近 24 小时等待处理 {metric.pending} 次</span>}</p>
            <div className="expert-bound-skills" aria-label="绑定技能">{expert.skills.slice(0,3).map(skill=><span key={skill.name}>{skill.title}</span>)}
              {expert.skills.length>3 && <span>+{expert.skills.length-3}</span>}</div>
            <div className="expert-agent-footer"><span>Agent · {expert.agent}</span><button type="button" onClick={()=>onOpen(expert.agent)}>查看技能</button></div>
          </article>;
        })}</div>
      </section> : null;
    })}
    {!visible.length && <p className="expert-card" role="status">{items.length ? '没有匹配的专家，请调整搜索或筛选。' : '正在读取专家及绑定技能…'}</p>}
    <p className="expert-overview-note">完成率 = 完成 /（完成 + 失败 + 受阻），等待处理、执行中和状态待确认不计入分母。调用完成不代表业务验收通过，验收及四个北极星指标请进入 Skill 查看。
      </p>
  </section>;
}
