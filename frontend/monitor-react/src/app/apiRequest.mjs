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
  const response = await fetch(path, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(errorDetail(body.error) || errorDetail(body.detail) || `请求失败：${response.status}`);
    error.status = response.status;
    error.detail = body.detail;
    throw error;
  }
  return body;
}
