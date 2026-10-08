import { assertTeamSessionCurrent, getTeamSession, invalidateTeamSession, isTeamSessionPath } from './teamSession.mjs';

function normalizeDeviceIds(value) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];
  return [...new Set(items.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean))];
}

export function responsibleDeviceIds(actor) {
  return normalizeDeviceIds(Array.isArray(actor?.responsible_device_ids) ? actor.responsible_device_ids : actor?.primary_device_id);
}

export function responsibilityPayload(deviceIds) {
  const selected = normalizeDeviceIds(deviceIds);
  if (!selected.length) throw new Error('请至少选择一台负责设备');
  return { responsible_device_ids: selected };
}

export function registrationPayload(username, password, deviceIds) {
  const scope = responsibilityPayload(deviceIds);
  return { username: username.trim(), password, role: 'technician', primary_device_id: scope.responsible_device_ids[0], ...scope };
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
