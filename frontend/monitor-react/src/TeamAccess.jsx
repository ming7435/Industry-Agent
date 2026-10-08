import React, { useEffect, useState } from 'react';
import { registrationPayload, responsibilityPayload, responsibleDeviceIds, teamRequest } from './teamApi.mjs';
import { getTeamSession, setTeamSessionActor, subscribeTeamSession } from './teamSession.mjs';

function DeviceScopeFields({ devices, selected, onChange, disabled }) {
  const choices = new Map(devices.map(device => [device.device_id || device.id, device]));
  selected.forEach(id => { if (!choices.has(id)) choices.set(id, { device_id: id }); });
  return <fieldset className="team-device-scope" disabled={disabled}>
    <legend>负责设备（可多选）</legend>
    <div className="team-device-options">{[...choices].map(([id, device]) => <label className="team-device-option" key={id}>
      <input type="checkbox" value={id} checked={selected.includes(id)} onChange={event => onChange(event.target.checked ? [...selected, id] : selected.filter(value => value !== id))} />
      <span>{device.name || device.display_name || id}{(device.name || device.display_name) && <small>{id}</small>}</span>
    </label>)}</div>
    <p className="team-device-hint">至少选择一台设备，系统按负责范围自动匹配维修任务。</p>
    {!choices.size && <p role="status">设备目录暂未读出，请稍后重试。</p>}
  </fieldset>;
}

export default function TeamAccess({ actor, onActor, line, onLine }) {
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [scopeDevices, setScopeDevices] = useState([]);
  const [editingScope, setEditingScope] = useState(false);
  const [scopeMessage, setScopeMessage] = useState('');
  const [devices, setDevices] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setEditingScope(false);
    setScopeDevices([]);
    setScopeMessage('');
  }, [actor?.user_id]);
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
    event.preventDefault();
    if (busy) return;
    let registration;
    try { if (mode === 'register') registration = registrationPayload(username, password, selectedDevices); }
    catch (e) { setError(e.message); return; }
    setBusy(true); setError('');
    // A user-started login owns a new epoch before any older session response can arrive.
    setTeamSessionActor(null, {force: true});
    try {
      if (registration) await teamRequest('register', registration);
      const value = await teamRequest('login', {username, password});
      setTeamSessionActor(value.user, {force: true}); setPassword('');
    } catch(e) { if (!e.sessionChanged) setError(e.message); } finally { setBusy(false); }
  }
  async function saveScope(event) {
    event.preventDefault();
    if (busy || !actor?.user_id) return;
    const userId = actor.user_id;
    setBusy(true); setError(''); setScopeMessage('');
    try {
      const value = await teamRequest('responsibilities', responsibilityPayload(scopeDevices));
      if (value.user?.user_id !== userId || value.user?.role !== 'technician'
        || !Array.isArray(value.user?.responsible_device_ids) || !responsibleDeviceIds(value.user).length) {
        throw new Error('负责设备保存结果尚未确认，请重新核对账号信息');
      }
      setTeamSessionActor(value.user, { force: true });
      setEditingScope(false);
      setScopeMessage('负责设备已更新');
    } catch(e) { if (!e.sessionChanged) setError(e.message); } finally { setBusy(false); }
  }
  const assignedDevices = responsibleDeviceIds(actor);
  const deviceName = id => {
    const device = devices.find(item => (item.device_id || item.id) === id);
    const name = device?.name || device?.display_name;
    return name ? `${name} · ${id}` : id;
  };
  const states = {unknown: '尚无控制记录', stopped: '整线已暂停', stopping: '正在暂停整线', starting: '复机验证中', running: '整线运行已复核', failed: '复机失败，已回停', rollback_failed: '复机失败，部分回停未确认', stop_failed: '部分设备停机未确认', unreconciled: '停机待对账，禁止复机', unavailable: '控制账本不可用'};
  return <details className="team-access"><summary>维修小组 · {actor ? `${actor.username}（维修人员）` : '注册 / 登录'} · {states[line?.state] || '未启用控制'}</summary>
    <div className="team-access-body">
      {actor ? <><p>负责设备：</p><ul className="team-assigned-devices" aria-label="当前负责设备">{assignedDevices.map(id => <li key={id}>{deviceName(id)}</li>)}</ul>{!assignedDevices.length && <p>尚未绑定设备</p>}
        {editingScope ? <form onSubmit={saveScope}>
          <DeviceScopeFields devices={devices} selected={scopeDevices} onChange={setScopeDevices} disabled={busy} />
          <div className="team-scope-actions"><button type="submit" className="button primary" disabled={busy || !scopeDevices.length}>{busy ? '保存中…' : '保存负责设备'}</button><button type="button" className="button" disabled={busy} onClick={() => { setEditingScope(false); setScopeDevices([]); setError(''); }}>取消修改</button></div>
        </form> : <button type="button" className="button" disabled={busy} onClick={() => { setScopeDevices(assignedDevices); setEditingScope(true); setScopeMessage(''); setError(''); }}>修改负责设备</button>}
        {scopeMessage && <p role="status">{scopeMessage}</p>}
        <button type="button" className="button" disabled={busy} onClick={async () => { try { await teamRequest('logout', {}); setTeamSessionActor(null, {force: true}); onLine({state: 'unavailable'}); setError(''); } catch(e) {if (!e.sessionChanged) setError(e.message);} }}>退出登录</button></> : <form onSubmit={submit}>
        <label>用户名<input autoComplete="username" required maxLength={64} value={username} onChange={e => setUsername(e.target.value)} /></label>
        <label>密码<input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} maxLength={256} required value={password} onChange={e => setPassword(e.target.value)} /></label>
        {mode === 'register' && <><p>注册维修人员账号，选择您负责的设备，可多选。</p><DeviceScopeFields devices={devices} selected={selectedDevices} onChange={setSelectedDevices} disabled={busy} /></>}
        <button className="button primary" disabled={busy || (mode === 'register' && !selectedDevices.length)}>{busy ? '提交中' : mode === 'register' ? '注册并登录' : '登录'}</button><button className="button" type="button" disabled={busy} onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? '注册新账号' : '已有账号'}</button>
      </form>}
      <p>故障确认后暂停整线；所有故障工单完成且设备数据复核通过后，才会启动整线。</p>
      {line?.devices && <ul>{Object.entries(line.devices).map(([id, result]) => <li key={id}>{id}：{result.state === 'verified' ? '已读回确认' : '尚未确认'}（{result.action === 'start' ? '启动' : '停止'}）</li>)}</ul>}
      {line?.reason && <p role="status">原因：{line.reason}</p>}
      {line?.rollback && <ul>{Object.entries(line.rollback).map(([id, result]) => <li key={id}>回停 {id}：{result.state === 'verified' ? '已读回确认停止' : '停止未确认，请检查设备'}</li>)}</ul>}
      {error && <p className="inline-error" role="alert">{error}</p>}
    </div>
  </details>;
}
