import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { teamRequest } from './teamApi.mjs';
import { request } from './app/apiRequest.mjs';
import { getTeamSession, isTeamSessionPath, setTeamSessionActor, subscribeTeamSession } from './teamSession.mjs';

const originalFetch = globalThis.fetch;
const actorA = { user_id: 'U-A', username: '隔离甲', role: 'technician' };
const actorB = { user_id: 'U-B', username: '隔离乙', role: 'technician' };
afterEach(() => { globalThis.fetch = originalFetch; setTeamSessionActor(null, { force: true }); });
const response = (body, status = 200) => ({ status, ok: status < 400, json: async () => body });
const loginA = () => setTeamSessionActor(actorA, { force: true });
const stale = error => error.sessionChanged === true && error.name === 'AbortError';

test('会话保护范围排除公开方案与CAD外部账号', () => {
  for (const path of ['/api/workorders', '/api/workorders/W/action', '/api/workorders/W/revalidate-plan', '/api/maintenance/plans/delete', '/api/maintenance/plans/P/retry', '/api/team/me', '/api/team/reminders']) assert.equal(isTeamSessionPath(path), true, path);
  for (const path of ['/api/maintenance/plans', '/api/reports', '/api/quality/checks', '/api/cad/resolve', '/api/cad/buildcad/auth/status', '/api/team/devices', '/api/team/line', '/api/team/login', '/api/team/register']) assert.equal(isTeamSessionPath(path), false, path);
});

test('公共整线状态在登录或退出期间仍能交付，两个请求入口一致', async () => {
  for (const invoke of [() => request('/api/team/line'), () => teamRequest('line')]) {
    loginA(); let release;
    globalThis.fetch = () => new Promise(done => { release = done; });
    const pending = invoke();
    setTeamSessionActor(null, { force: true });
    release(response({ state: 'stopped' }));
    assert.deepEqual(await pending, { state: 'stopped' });
  }
});

test('同步订阅立即发布当前身份，me确认相同身份不改变epoch而登录必须改变', () => {
  loginA(); const initial = getTeamSession().version, snapshots = [];
  const stop = subscribeTeamSession(value => snapshots.push(value));
  assert.equal(snapshots[0].actor, actorA);
  setTeamSessionActor({ ...actorA }); assert.equal(getTeamSession().version, initial);
  setTeamSessionActor({ ...actorA }, { force: true }); assert.equal(getTeamSession().version, initial + 1);
  setTeamSessionActor(null, { force: true }); assert.equal(snapshots.at(-1).actor, null);
  stop();
});

test('非JSON401在正文解析前同步清会话，普通与team请求一致', async () => {
  for (const invoke of [() => request('/api/workorders/W/action'), () => teamRequest('reminders')]) {
    loginA();
    globalThis.fetch = async () => ({ status: 401, ok: false, json: async () => {
      assert.equal(getTeamSession().actor, null, '不能等正文解析后才失效'); throw new SyntaxError('isolated non-JSON');
    } });
    await assert.rejects(invoke(), error => error.status === 401);
    assert.equal(getTeamSession().actor, null);
  }
});

test('403权限不足和503临时故障都不清有效维修会话', async () => {
  for (const status of [403, 503]) for (const invoke of [() => request('/api/workorders'), () => teamRequest('reminders')]) {
    loginA(); globalThis.fetch = async () => response({ detail: '隔离拒绝/暂不可用' }, status);
    await assert.rejects(invoke(), error => error.status === status);
    assert.equal(getTeamSession().actor, actorA);
  }
});

test('CAD外部401和登录凭据错误401不清当前维修账号', async () => {
  for (const invoke of [() => request('/api/cad/buildcad/auth/status'), () => teamRequest('login', { username: 'isolated', password: 'synthetic' })]) {
    loginA(); globalThis.fetch = async () => response({ detail: '隔离账号校验失败' }, 401);
    await assert.rejects(invoke(), error => error.status === 401);
    assert.equal(getTeamSession().actor, actorA);
  }
});

test('换账号或同ID角色改变后，旧私有200不交付给调用者', async () => {
  for (const next of [actorB, { ...actorA, role: 'supervisor' }]) {
    loginA(); let release;
    globalThis.fetch = () => new Promise(done => { release = done; });
    const pending = request('/api/workorders');
    setTeamSessionActor(next, { force: true }); release(response({ items: [{ workorder_id: 'WO-PRIVATE-OLD' }] }));
    await assert.rejects(pending, stale); assert.equal(getTeamSession().actor, next);
  }
});

test('200的JSON解析期间切账号也必须丢弃旧正文', async () => {
  loginA(); let release, started;
  const parsing = new Promise(done => { started = done; });
  globalThis.fetch = async () => ({ status: 200, ok: true, json: () => new Promise(done => { release = done; started(); }) });
  const pending = request('/api/workorders'); await parsing;
  setTeamSessionActor(actorB, { force: true }); release({ items: [{ workorder_id: 'WO-PRIVATE-OLD' }] });
  await assert.rejects(pending, stale); assert.equal(getTeamSession().actor, actorB);
});

test('同账号重新登录后的旧401也不能退出新会话', async () => {
  loginA(); let release;
  globalThis.fetch = () => new Promise(done => { release = done; });
  const pending = request('/api/workorders');
  setTeamSessionActor(actorA, { force: true }); release(response({ detail: '旧会话过期' }, 401));
  await assert.rejects(pending, stale); assert.equal(getTeamSession().actor, actorA);
});

test('logout后的旧team/me200不交付，不能恢复已退出用户', async () => {
  loginA(); let release;
  globalThis.fetch = () => new Promise(done => { release = done; });
  const pending = teamRequest('me');
  setTeamSessionActor(null, { force: true }); release(response({ user: actorA }));
  await assert.rejects(pending, stale); assert.equal(getTeamSession().actor, null);
});

test('初始尚未确认身份时的401也阻止更早me200恢复旧身份', async () => {
  setTeamSessionActor(null, { force: true }); let releaseMe;
  globalThis.fetch = url => url.endsWith('/me') ? new Promise(done => { releaseMe = done; }) : Promise.resolve(response({ detail: '请先登录' }, 401));
  const pending = teamRequest('me');
  await assert.rejects(teamRequest('reminders'), error => error.status === 401);
  releaseMe(response({ user: actorA })); await assert.rejects(pending, stale);
  assert.equal(getTeamSession().actor, null);
});

test('401正文解析期间重新登录，旧401成功或非JSON失败都不污染新会话', async () => {
  for (const invoke of [() => request('/api/workorders'), () => teamRequest('me')]) {
    for (const malformed of [false, true]) {
      loginA(); let release, fail, started;
      const parsing = new Promise(done => { started = done; });
      globalThis.fetch = async () => ({ status: 401, ok: false, json: () => new Promise((done, reject) => {
        release = done; fail = reject; started();
      }) });
      const pending = invoke(); await parsing;
      assert.equal(getTeamSession().actor, null);
      setTeamSessionActor(actorB, { force: true });
      if (malformed) fail(new SyntaxError('isolated non-JSON401')); else release({ detail: '旧会话已过期' });
      await assert.rejects(pending, stale); assert.equal(getTeamSession().actor, actorB);
    }
  }
});
