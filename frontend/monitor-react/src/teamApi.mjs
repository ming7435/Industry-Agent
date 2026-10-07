import { assertTeamSessionCurrent, getTeamSession, invalidateTeamSession, isTeamSessionPath } from './teamSession.mjs';

export function registrationPayload(username, password, role, primaryDeviceId) {
  return { username: username.trim(), password, role, primary_device_id: role === 'technician' ? primaryDeviceId : '' };
}

export async function teamRequest(path, body) {
  const url = `/api/team/${path}`;
  const sessionBound = isTeamSessionPath(url) || path === 'login';
  const version = getTeamSession().version;
  const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', method: body === undefined ? 'GET' : 'POST', headers: {'Content-Type': 'application/json'}, ...(body === undefined ? {} : {body: JSON.stringify(body)}) });
  if (sessionBound) assertTeamSessionCurrent(version);
  const expectedVersion = isTeamSessionPath(url) && response.status === 401 && invalidateTeamSession(version) ? version + 1 : version;
  let value;
  try {
    value = await response.json();
  } catch (cause) {
    if (sessionBound) assertTeamSessionCurrent(expectedVersion);
    const error = new Error(response.status === 401 ? '维修会话已失效，请重新登录' : `账号服务返回异常：${response.status}`);
    error.status = response.status;
    error.cause = cause;
    throw error;
  }
  if (sessionBound) assertTeamSessionCurrent(expectedVersion);
  if (!response.ok) {
    const error = new Error(typeof value.detail === 'string' ? value.detail : value.detail?.message || value.error || '账号服务请求失败');
    error.status = response.status;
    error.detail = value.detail;
    throw error;
  }
  return value;
}
