import React,{useEffect,useRef,useState} from 'react';
import ProductionQualityWorkspace from './ProductionQualityWorkspace.jsx';
import {readProductionJobs} from './productionQuality.mjs';
import {getTeamSession,setTeamSessionActor,subscribeTeamSession} from '../teamSession.mjs';
import {teamRequest} from '../teamApi.mjs';
import './productionQuality.css';
export default function QualitySourceWorkspace({Demo}){
  const [auth,setAuth]=useState(getTeamSession),[source,setSource]=useState('demo'),chosen=useRef(false),[checked,setChecked]=useState(false);
  useEffect(()=>{let active=true;const unsubscribe=subscribeTeamSession(value=>{if(active)setAuth(value);});
    teamRequest('me').then(value=>{if(active)setTeamSessionActor(value.user);}).catch(()=>{}).finally(()=>{if(active)setChecked(true);});
    return()=>{active=false;unsubscribe();};},[]);
  useEffect(()=>{const abort=new AbortController();chosen.current=false;setSource('demo');
    if(checked&&auth.actor)readProductionJobs({signal:abort.signal}).then(values=>{if(!abort.signal.aborted&&values.length&&!chosen.current)setSource('production');}).catch(()=>{});
    return()=>abort.abort();},[checked,auth.version]);
  return <><nav className="pq-source" aria-label="质检来源"><button aria-pressed={source==='production'} onClick={()=>{chosen.current=true;setSource('production');}}>工厂产出检测</button><button aria-pressed={source==='demo'} onClick={()=>{chosen.current=true;setSource('demo');}}>比对仪数值演示</button></nav>
    {source==='production'?<ProductionQualityWorkspace key={auth.version}/>:Demo?<Demo/>:<p>暂无比对仪演示组件。</p>}</>;
}
