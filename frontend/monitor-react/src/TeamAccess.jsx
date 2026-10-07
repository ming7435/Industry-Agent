import React, { useEffect, useState } from 'react';
import { registrationPayload, teamRequest } from './teamApi.mjs';
import { getTeamSession, setTeamSessionActor, subscribeTeamSession } from './teamSession.mjs';

export default function TeamAccess({ actor, onActor, line, onLine }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('technician');
  const [device, setDevice] = useState('');
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    let lineVersion = -1;
    const refresh = () => {
      if (!getTeamSession().actor) return;
      teamRequest('line').then(v => active && onLine(v)).catch(e => active && !e.sessionChanged && onLine({state: 'unavailable'}));
    };
    const unsubscribe = subscribeTeamSession(current => {
      if (!active) return;
      onActor(current.actor);
      if (current.reason) {
        setError(current.reason);
        setPassword('');
        onLine({state: 'unavailable'});
      }
      if (current.actor && current.version !== lineVersion) { lineVersion = current.version; refresh(); }
    });
    teamRequest('me').then(v => active && setTeamSessionActor(v.user)).catch(e => active && !e.sessionChanged && setError(e.message));
    teamRequest('devices').then(v => active && setDevices(v.items || [])).catch(e => active && setError(e.message));
    const timer = setInterval(refresh, 2000);
    return () => { active = false; unsubscribe(); clearInterval(timer); };
  }, []);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    // A user-started login owns a new epoch before any older session response can arrive.
    setTeamSessionActor(null, {force: true});
    try {
      if (mode === 'register') await teamRequest('register', registrationPayload(username, password, role, device));
      const value = await teamRequest('login', {username, password});
      setTeamSessionActor(value.user, {force: true}); setPassword('');
    } catch(e) { if (!e.sessionChanged) setError(e.message); } finally { setBusy(false); }
  }
  const states = {unknown: '尚无控制记录', stopped: '整线已暂停', stopping: '正在暂停整线', starting: '复机验证中', running: '整线运行已复核', failed: '复机失败，已回停', rollback_failed: '复机失败，部分回停未确认', stop_failed: '部分设备停机未确认', unreconciled: '停机待对账，禁止复机', unavailable: '控制账本不可用'};
  return <details className="team-access"><summary>维修小组 · {actor ? `${actor.username}（${actor.role === 'supervisor' ? '监督人' : '维修人员'}）` : '注册 / 登录'} · {states[line?.state] || '未启用控制'}</summary>
    <div className="team-access-body">
      {actor ? <><p>主要负责设备：{actor.primary_device_id || '监督全部派工与接单'}</p><button type="button" className="button" onClick={async () => { try { await teamRequest('logout', {}); setTeamSessionActor(null, {force: true}); onLine({state: 'unavailable'}); setError(''); } catch(e) {if (!e.sessionChanged) setError(e.message);} }}>退出登录</button></> : <form onSubmit={submit}>
        <label>用户名<input autoComplete="username" required maxLength={64} value={username} onChange={e => setUsername(e.target.value)} /></label>
        <label>密码<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={256} required value={password} onChange={e => setPassword(e.target.value)} /></label>
        {mode === 'register' && <><label>身份<select value={role} onChange={e => setRole(e.target.value)}><option value="technician">维修人员（共4名）</option><option value="supervisor">监督人（共1名，仅查看和催办）</option></select></label>{role === 'technician' && <label>主要负责机器<select required value={device} onChange={e => setDevice(e.target.value)}><option value="">请选择当前工厂设备</option>{devices.map(d => <option key={d.device_id || d.id} value={d.device_id || d.id}>{d.name || d.display_name || d.device_id || d.id}</option>)}</select></label>}</>}
        <button className="button primary" disabled={busy}>{busy ? '提交中' : mode === 'register' ? '注册并登录' : '登录'}</button><button className="button" type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? '注册新账号' : '已有账号'}</button>
      </form>}
      <p>故障确认后暂停整线；所有故障工单完成且设备数据复核通过后，才会启动整线。监督人不控制设备。</p>
      {line?.devices && <ul>{Object.entries(line.devices).map(([id, result]) => <li key={id}>{id}：{result.state === 'verified' ? '已读回确认' : '尚未确认'}（{result.action === 'start' ? '启动' : '停止'}）</li>)}</ul>}
      {line?.reason && <p role="status">原因：{line.reason}</p>}
      {line?.rollback && <ul>{Object.entries(line.rollback).map(([id, result]) => <li key={id}>回停 {id}：{result.state === 'verified' ? '已读回确认停止' : '停止未确认，请检查设备'}</li>)}</ul>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  </details>;
}
