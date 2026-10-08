/** CAD 标准数值由服务端给出，这里只整理检验人员实际输入的数据。 */
export function buildComparisonPayload(design, partId, entries = {}) {
  const runId = String(design?.run_id || '');
  const digest = String(design?.design_digest || '');
  const identifier = String(partId || '').trim();
  if (!/^FC-[a-f0-9]{64}$/.test(runId) || !/^[a-f0-9]{64}$/.test(digest)) throw new Error('CAD 运行编号或参数摘要无效，请重新读取');
  if (!/^[A-Za-z0-9_.:-]{1,100}$/.test(identifier)) throw new Error('生产零件编号须为 1–100 位字母、数字或 . _ : -');
  const rows = Array.isArray(design.parameters) ? design.parameters : [];
  if (!rows.length) throw new Error('没有可以进行实测对照的 CAD 参数');
  const validKeys = new Set(rows.map((row) => row.key));
  if (Object.keys(entries).some((key) => !validKeys.has(key))) throw new Error('检测输入包含未知的 CAD 参数');
  const measurements = {};
  for (const row of rows) {
    const raw = entries[row.key] || {};
    const actualText = String(raw.actual ?? '').trim();
    const toleranceText = String(raw.tolerance ?? '').trim();
    if (!actualText || !toleranceText) continue; // 交由后端返回“数据不足”，不会伪造 0 或设计值。
    const actual = Number(actualText);
    const tolerance = Number(toleranceText);
    if (!Number.isFinite(actual)) throw new Error(`${row.label || row.key}：请输入有效实测数字`);
    if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 10000) throw new Error(`${row.label || row.key}：公差请输入有效非负数字`);
    if (row.exact && (!Number.isInteger(actual) || tolerance !== 0)) throw new Error(`${row.label || row.key}：整数计数必须填写整数和零公差`);
    measurements[row.key] = { actual, tolerance };
  }
  return { run_id: runId, design_digest: digest, part_id: identifier, measurements };
}

export function comparisonStatusLabel(status) {
  return ({consistent:'参数一致',inconsistent:'参数不一致',insufficient_data:'数据不足'})[status] || '待检测';
}
