let session = { actor: null, version: 0, reason: '' };
const listeners = new Set();

export const getTeamSession = () => session;
export const isTeamSessionCurrent = version => session.version === version;

function publish(next) {
  session = next;
  for (const listener of listeners) listener(session);
}

export function subscribeTeamSession(listener) {
  listeners.add(listener);
  listener(session);
  return () => listeners.delete(listener);
}

export function setTeamSessionActor(actor, { force = false } = {}) {
  const next = actor && typeof actor === 'object' && !Array.isArray(actor) ? actor : null;
  const sameIdentity = (session.actor?.user_id || '') === (next?.user_id || '')
    && (session.actor?.role || '') === (next?.role || '');
  publish({ actor: next, version: session.version + (force || !sameIdentity ? 1 : 0), reason: '' });
}

export function invalidateTeamSession(version, reason = '维修会话已失效，请重新登录') {
  if (!isTeamSessionCurrent(version)) return false;
  publish({ actor: null, version: version + 1, reason });
  return true;
}

export function assertTeamSessionCurrent(version) {
  if (isTeamSessionCurrent(version)) return;
  const error = new Error('维修账号已变化，忽略旧会话返回');
  error.name = 'AbortError';
  error.sessionChanged = true;
  throw error;
}

export function isTeamSessionPath(path) {
  const pathname = new URL(path, 'http://session.local').pathname;
  if (/^\/api\/workorders(?:\/|$)/.test(pathname)) return true;
  if (/^\/api\/maintenance\/plans\/(?:delete(?:\/|$)|[^/]+\/retry(?:\/|$))/.test(pathname)) return true;
  if (pathname.startsWith('/api/team/')) return !['devices', 'register', 'login'].includes(pathname.slice('/api/team/'.length));
  return false;
}
