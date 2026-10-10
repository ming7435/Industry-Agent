import { freeCadDisplayNumber, readFreeCadSession, validFreeCadRun } from './production-cad/freecad.mjs';

export function readQualityCandidates(storage) {
  const saved = readFreeCadSession(storage);
  let history = [];
  try {
    const value = JSON.parse(storage?.getItem('freecad.design-versions') || '[]');
    if (Array.isArray(value)) history = value.slice(-20);
  } catch { /* 历史索引损坏不影响回查当前版本。 */ }
  const candidates = new Map();
  const current = saved?.run_id ? [{ ...saved, version: history.findIndex(item => item?.run_id === saved.run_id) + 1 }] : [];
  const entries = [...current, ...history.map((item, index) => ({ ...item, version: index + 1 })).reverse()
    .filter(item => item.status === 'completed')];
  for (const entry of entries) {
    if (!validFreeCadRun(entry.run_id) || candidates.has(entry.run_id)) continue;
    candidates.set(entry.run_id, { run_id: entry.run_id, version: entry.version,
      part_name: typeof entry.part_name === 'string' ? entry.part_name.slice(0, 120) : '',
      part_number: typeof entry.part_number === 'string' ? entry.part_number.slice(0, 80) : '' });
    if (candidates.size === 20) break;
  }
  return { currentRunId: saved?.run_id || '', candidates: [...candidates.values()] };
}

export function verifiedQualityPart(record, candidate) {
  if (record?.run_id !== candidate.run_id || record.status !== 'completed'
    || record.validation?.valid !== true || !Number.isInteger(record.validation?.solid_count)
    || record.validation.solid_count < 1
    || (record.spec?.parts && (!Array.isArray(record.spec.parts) || !record.spec.parts.length))) return null;
  // 旧接口只继承该版本已保存的标识，未提交草稿不参与名称或编号。
  const name = record.part_name ?? candidate.part_name;
  return { run_id: record.run_id, version: candidate.version,
    spec: record.spec,
    name: typeof name === 'string' && name.trim() ? name.trim() : '未命名零件',
    number: freeCadDisplayNumber({ run_id: record.run_id, part_number: record.part_number ?? candidate.part_number }) };
}
