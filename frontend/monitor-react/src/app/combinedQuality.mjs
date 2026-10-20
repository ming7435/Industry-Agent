export const qualityDecision = { pass: '确认通过', fail: '确认不通过', pending: '待复检' };
export const combinedStatus = { qualified: '合格', unqualified: '不合格', pending: '待复检' };
export const combinedVerdict = part => [part.parameters?.decision, part.visual?.decision].includes('fail')
  ? 'unqualified' : part.parameters?.decision === 'pass' && part.visual?.decision === 'pass' ? 'qualified' : 'pending';
export const qualityRate = value => typeof value === 'number' && Number.isFinite(value) ? value.toFixed(2) + '%' : '—';

export function verifiedCombinedPart(part) {
  if (!part || !/^CQ-[a-f0-9]{32}$/.test(part.quality_part_id || '')
    || !['production', 'validation'].includes(part.scope)
    || ['batch_id', 'serial_number', 'design_version'].some(k => typeof part[k] !== 'string' || !part[k].trim())
    || !Number.isSafeInteger(part.revision) || part.revision < 0
    || ['parameters', 'visual'].some(k => !Object.hasOwn(qualityDecision, part[k]?.decision))
    || part.status !== combinedVerdict(part)) throw new Error('综合判定记录无效，请刷新核对。');
  return part;
}

export function verifiedCombinedReport(value, scope, batch) {
  const invalid = () => { throw new Error('综合合格率与零件明细不一致，请刷新核对。'); };
  if (value?.scope !== scope || value.batch_id !== batch || !Array.isArray(value.items)
    || !Array.isArray(value.batches) || value.batches.some(b => typeof b !== 'string' || !b.trim())
    || new Set(value.batches).size !== value.batches.length) invalid();
  const counts = { total: value.items.length, qualified: 0, unqualified: 0, pending: 0 };
  const ids = new Set(), serials = new Set();
  for (const item of value.items) {
    verifiedCombinedPart(item);
    const serial = JSON.stringify([item.batch_id, item.serial_number]);
    if (item.scope !== scope || (batch && item.batch_id !== batch) || ids.has(item.quality_part_id)
      || serials.has(serial) || !value.batches.includes(item.batch_id)) invalid();
    ids.add(item.quality_part_id); serials.add(serial); counts[item.status]++;
  }
  counts.determinate = counts.qualified + counts.unqualified;
  if (Object.entries(counts).some(([k, n]) => value.summary?.[k] !== n)) invalid();
  const rates = { rate_percent: counts.determinate ? counts.qualified * 100 / counts.determinate : null,
    coverage_percent: counts.total ? counts.determinate * 100 / counts.total : null };
  if (Object.entries(rates).some(([k, n]) => n === null ? value.summary[k] !== null
    : typeof value.summary[k] !== 'number' || !Number.isFinite(value.summary[k]) || Math.abs(value.summary[k] - n) > .00501)) invalid();
  return value;
}
