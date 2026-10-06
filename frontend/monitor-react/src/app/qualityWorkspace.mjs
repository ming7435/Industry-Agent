// 质检结果与闭环状态分开显示，缺资料不能当成不合格。
export function qualityOutcome(value = {}) {
  const status = String(value.result || value.status || "").toLowerCase();
  if (value.synthetic === true || value.degraded === true || value.evidence_status === "untrusted") return { label: "数据不足", tone: "warning" };
  if (["fail", "failed", "unqualified"].includes(status)) return { label: "不合格", tone: "fault" };
  if (["review", "insufficient_data"].includes(status)) return { label: "数据不足", tone: "warning" };
  if (["not_tested", "pending", "open"].includes(status)) return { label: "未检测", tone: "warning" };
  if (["pass", "passed", "qualified"].includes(status)) return { label: "合格", tone: "normal" };
  return { label: "待确认", tone: "warning" };
}

export function qualityChecks(value = {}) {
  if (value.inspection_items?.length) return value.inspection_items;
  if (value.items?.length) return value.items;
  const labels = { dimensions: "尺寸检测", appearance: "外观检测", material: "材料检测", function: "功能检测", process: "工艺追溯检测" };
  return Object.entries(value.quality_validation || {}).map(([key, item]) => ({ ...item, name: labels[key] || key }));
}

export function qualityWorkflowLabel(status) {
  return ({ passed: "检测通过，待放行", failed: "检测失败，待整改", review: "数据不足，待补充", not_tested: "未检测", insufficient_data: "数据不足", rectification: "整改中", reinspection: "复检阶段", appealed: "申诉处理中", released: "已放行", closed: "已关闭", rejected: "申诉未通过", withdrawn: "申诉已撤回" })[status] || "待确认";
}

export function qualityHistoryStatusLabel(record = {}) {
  return qualityWorkflowLabel(record.status === "open" ? record.result : record.status || record.result);
}

export function qualityFromAction(result = {}) {
  if (result.quality_check?.quality_check_id) return result.quality_check;
  return !result.closure_task_id && result.quality_check_id && result.status ? result : null;
}

export async function loadQualityResources(request, partId, deviceId) {
  const requests = [
    () => request("/api/experience/search", { method: "POST", body: JSON.stringify({ device_id: deviceId || "", limit: 8 }) }),
    () => partId.trim() ? request(`/api/v1/quality/checks?target_id=${encodeURIComponent(partId.trim())}`) : Promise.resolve({ items: [] }),
    () => request("/api/v1/closure-tasks"),
  ];
  const results = await Promise.allSettled(requests.map(call => call()));
  const [experiences, history, tasks] = results.map(result => result.status === "fulfilled" ? result.value.items || [] : []);
  return { experiences, history, tasks, errors: results.filter(result => result.status === "rejected").map(result => result.reason.message || "质检数据请求失败") };
}

export async function runQualityAction(request, action, values = {}) {
  const id = encodeURIComponent(String(values.checkId || ""));
  let path, body = {};
  if (action === "complete_task") {
    if (!values.taskId || !String(values.note || "").trim()) throw new Error("请填写整改完成记录");
    path = `/api/v1/closure-tasks/${encodeURIComponent(values.taskId)}/complete?note=${encodeURIComponent(values.note)}`;
  } else {
    if (!id) throw new Error("请先选择质检记录");
    const base = `/api/v1/quality/checks/${id}`;
    if (action === "reinspect") {
      const ref = String(values.reinspectionCheckId || "").trim();
      if (!ref || ref === values.checkId) throw new Error("请选择新生成的复检记录，不能引用原记录");
      path = `${base}/reinspect`;
      body = { passed: true, reinspection_check_id: ref };
    } else if (action === "create_task") {
      if (!String(values.title || "").trim()) throw new Error("请填写整改任务内容");
      path = "/api/v1/closure-tasks";
      body = { quality_check_id: values.checkId, title: values.title, owner: values.owner || "", actions: [values.title] };
    } else if (action === "appeal") {
      if (!String(values.note || "").trim()) throw new Error("请填写申诉原因");
      path = `${base}/appeal`;
      body = { reason: values.note };
    } else if (action === "resolve_appeal") {
      path = `${base}/appeal/resolve`;
      body = { decision: values.decision || "approved", reason: values.note || "", appeal_id: values.appealId || "" };
    } else if (action === "release") path = `${base}/release`;
    else if (action === "close") { path = `${base}/close`; body = { note: values.note || "" }; }
    else throw new Error("未知质检操作");
  }
  const result = await request(path, { method: "POST", body: JSON.stringify(body) });
  if (result.success === false) throw new Error(result.error || result.detail || "质检操作未完成");
  return result;
}
