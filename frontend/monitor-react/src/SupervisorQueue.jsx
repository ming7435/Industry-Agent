import React, { useEffect, useState } from 'react';
import { teamRequest } from './teamApi.mjs';

export default function SupervisorQueue({ actor }) {
  const [orders, setOrders] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  useEffect(() => {
    let active = true;
    const refresh = () => Promise.all([teamRequest('workorders'), teamRequest('reminders')]).then(([o, r]) => { if(active) {setOrders(o.items); setReminders(r.items); setError('');} }).catch(e => active && setError(e.message));
    refresh(); const timer = setInterval(refresh, 5000);
    return () => {active = false; clearInterval(timer);};
  }, [actor.user_id]);
  async function remind(order) {
    setBusy(order.workorder_id);
    try {await teamRequest('reminders', {workorder_id: order.workorder_id, text: '请及时确认接单、执行维修并反馈进展'}); setError('催办已发送');} catch(e) {setError(e.message);} finally {setBusy('');}
  }
  return <section className="workorder-queue"><h2>{actor.role === 'supervisor' ? '监督与催办' : '我的催办消息'}</h2>
    {actor.role === 'supervisor' && <ul>{orders.map(o => <li key={o.workorder_id}><strong>{o.title}</strong><p>{o.workorder_id} · {o.device_id} · {o.assignee_name || '待派工'} · {o.status} · {o.accepted_by ? '已接单' : '尚未确认接单'}</p><button className="button" disabled={busy === o.workorder_id || !o.assignee || ['completed', 'closed'].includes(o.status)} onClick={() => remind(o)}>站内催办</button></li>)}</ul>}
    {reminders.length ? <ul>{reminders.map(r => <li key={r.reminder_id}>{r.workorder_id}：{r.text} · {r.read ? '已读' : '未读'}{actor.role === 'technician' && !r.read && <button className="button" onClick={async () => {try { await teamRequest(`reminders/${r.reminder_id}/read`, {}); setReminders(values => values.map(value => value.reminder_id === r.reminder_id ? {...value, read: true} : value)); } catch(e) { setError(e.message); }}}>我已收到</button>}</li>)}</ul> : <p>暂无催办记录</p>}{error && <p role="status">{error}</p>}
  </section>;
}
