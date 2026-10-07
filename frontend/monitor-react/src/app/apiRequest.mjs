import { assertTeamSessionCurrent, getTeamSession, invalidateTeamSession, isTeamSessionPath } from '../teamSession.mjs';

function errorDetail(value) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(item => {
    const path = Array.isArray(item?.loc) ? item.loc.join(".") : "";
    const message = errorDetail(item?.msg || item?.message || item);
    return [path, message].filter(Boolean).join(": ");
  }).filter(Boolean).join("；");
  if (value && typeof value === "object") return errorDetail(value.message || value.error || value.reason || "");
  return "";
}

export async function request(path, options = {}) {
  const sessionBound = isTeamSessionPath(path);
  const version = getTeamSession().version;
  const response = await fetch(path, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (sessionBound) assertTeamSessionCurrent(version);
  const expectedVersion = sessionBound && response.status === 401 && invalidateTeamSession(version) ? version + 1 : version;
  let body;
  try {
    body = await response.json();
  } catch (cause) {
    if (sessionBound) assertTeamSessionCurrent(expectedVersion);
    const error = new Error(response.status === 401 ? '维修会话已失效，请重新登录' : `服务返回异常：${response.status}`);
    error.status = response.status;
    error.cause = cause;
    throw error;
  }
  if (sessionBound) assertTeamSessionCurrent(expectedVersion);
  if (!response.ok) {
    const error = new Error(errorDetail(body.error) || errorDetail(body.detail) || `请求失败：${response.status}`);
    error.status = response.status;
    error.detail = body.detail;
    throw error;
  }
  return body;
}
