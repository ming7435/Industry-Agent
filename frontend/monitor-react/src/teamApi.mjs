export function registrationPayload(username, password, role, primaryDeviceId) {
  return { username: username.trim(), password, role, primary_device_id: role === 'technician' ? primaryDeviceId : '' };
}

export async function teamRequest(path, body) {
  const response = await fetch(`/api/team/${path}`, { credentials: 'same-origin', method: body === undefined ? 'GET' : 'POST', headers: {'Content-Type': 'application/json'}, ...(body === undefined ? {} : {body: JSON.stringify(body)}) });
  const value = await response.json();
  if (!response.ok) throw new Error(typeof value.detail === 'string' ? value.detail : value.error || '账号服务请求失败');
  return value;
}
