const prefix = '/api/quality/simulation';

export const pendingSimulationKey = (actor, runId) => `quality.simulation.pending:${actor}:${runId}`;
export const formatSimulationRate = value => typeof value === 'number' && Number.isFinite(value) ? `${value.toFixed(2)}%` : '—';

const locationRules = {
  size: {
    location: '刀具／刀补／加工程序尺寸',
    reason: '尺寸参数与设计名义值不一致，可能与加工程序、刀具状态或刀补设置有关。',
    recommendations: ['先复测异常样本，核对测量基准和仪器校准状态。', '核对对应工序的程序尺寸、刀具磨损和刀补；调整须由授权人员确认，调整后重新检测。'],
  },
  position: {
    location: '定位夹具／工件坐标零点／孔槽定位程序',
    reason: '孔槽或主体的位置参数不一致，可能与装夹偏移、坐标基准或定位程序有关。',
    recommendations: ['核对定位夹具、装夹方向、工件坐标零点及孔槽位置程序。', '确认定位基准后复测异常样本，不能仅凭模拟偏差认定夹具故障。'],
  },
  direction: {
    location: '加工方向／装夹方向／工序程序',
    reason: '孔槽轴向与设计方向不一致，可能与工序方向或装夹方向设置有关。',
    recommendations: ['核对设计轴向、加工工序方向、装夹方向和对应程序版本。', '确认正确方向后复测；不要直接修改设备轴参数。'],
  },
  process: {
    location: '加工工序／孔槽数量与工序完整性',
    reason: '孔槽数量与设计不一致，可能存在工序遗漏、重复加工或程序版本不匹配。',
    recommendations: ['逐项核对孔槽数量、加工工序执行记录及程序版本。', '核对关联样本和批次后复测，先确认工序问题再制定返工方案。'],
  },
  acquisition: {
    location: '比对仪数据采集／测量记录传输环节',
    reason: '样本缺少部分参数的测量记录，可能与采集或传输环节有关；缺测不能证明探针或加工机故障。',
    recommendations: ['核对本次样本编号、检测任务是否结束以及测量记录是否完整传输。', '补齐缺失测量并重新核对结果；缺测样本仍保持待判定，不计入合格率分母。'],
  },
  review: {
    location: '设计参数与对应工序核对位置',
    reason: '当前异常参数不能映射到具体加工部位，需要先核对参数来源和对应工序。',
    recommendations: ['核对设计版本、参数定义和对应测量记录，确认含义后再排查。'],
  },
};

// Advisory display derived from a verified saved batch; never change its measurements or verdict.
export function possibleProblemLocations(result) {
  if (result?.simulation !== true || result.synthetic !== true || !['qualified', 'unqualified', 'partial'].includes(result.status)) return [];
  const trace = result.traceability || {}, groups = new Map();
  const text = value => typeof value === 'string' && value.trim() ? value.trim() : null;
  const productionId = trace.traceability_source === 'simulation_profile' && text(trace.production_device_name) ? text(trace.production_device_id) : null;
  const measurementId = text(trace.measurement_device_id) && trace.measurement_device_id === result.station?.measurement_device_id ? trace.measurement_device_id : null;
  const add = (category, row) => {
    if (!text(row?.key) || !text(row.part_id)) return;
    if (!groups.has(category)) {
      const measuring = category === 'acquisition', deviceId = measuring ? measurementId : productionId;
      groups.set(category, {
        category, status: 'unconfirmed', source: 'simulation_parameter_rules',
        device_id: deviceId, device_name: measuring ? (deviceId ? '模拟比对仪' : '未知测量设备') : (deviceId ? text(trace.production_device_name) : '未知机器'),
        line_id: productionId ? text(trace.line_id) : null, line_name: productionId ? text(trace.line_name) || '未知产线' : '未知产线',
        ...locationRules[category],
        reason: locationRules[category].reason + (deviceId ? '' : ' 缺少有效设备关联，无法定位具体机器。'),
        evidence: [],
      });
    }
    const group = groups.get(category);
    if (!group.evidence.some(e => e.key === row.key && e.part_id === row.part_id)) group.evidence.push({ ...row });
  };
  for (const row of Array.isArray(result.issues) ? result.issues : []) {
    if (!row || row.actual == null || row.expected == null || String(row.actual) === String(row.expected)) continue;
    if (row.status && row.status !== 'unqualified') continue;
    const key = row.key || '';
    const category = /^operations\.\d+\.position\.[012]$/.test(key) ? 'position'
      : /^operations\.\d+\.axis$/.test(key) ? 'direction'
        : ['cut_feature_count', 'hole_count', 'pocket_count'].includes(key) ? 'process'
          : (/^operations\.\d+\.(length|width|height|diameter)$/.test(key) || /^model\.bounds_mm\.[012]$/.test(key)) && row.unit === 'mm' ? 'size' : 'review';
    add(category, row);
  }
  for (const sample of Array.isArray(result.samples) ? result.samples : []) {
    if (sample?.simulation !== true || sample.synthetic !== true || !sample.observations || typeof sample.observations !== 'object' || Array.isArray(sample.observations)) continue;
    for (const parameter of Array.isArray(result.basis?.parameters) ? result.basis.parameters : []) {
      if (parameter && parameter.comparable !== false && (!Object.hasOwn(sample.observations, parameter.key) || sample.observations[parameter.key] == null)) {
        add('acquisition', { ...parameter, part_id: sample.part_id, actual: null, difference: null, status: 'pending' });
      }
    }
  }
  return [...groups.values()].map(group => ({ ...group, sample_count: new Set(group.evidence.map(row => row.part_id)).size }));
}

export function simulationResult(value, runId, requestId) {
  if (value?.simulation !== true || value.synthetic !== true || value.design_run_id !== runId
    || (requestId && value.request_id !== requestId) || typeof value.batch_id !== 'string'
    || !value.rates || Object.values(value.rates).some(v => v !== null && (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 100))) {
    throw new Error('检测返回的版本或模拟结果无效，请按请求编号核对');
  }
  return value;
}

export async function detectSimulation(api, body) {
  try {
    return simulationResult(await api(prefix + '/detect', { method: 'POST', body: JSON.stringify(body) }), body.design_run_id, body.request_id);
  } catch (error) {
    if (error.sessionChanged || error.name === 'AbortError') throw error;
    const unknown = (!error.status || error.status >= 500) && error.detail?.execution_started !== false;
    if (!unknown) throw error;
    try {
      return simulationResult(await api(prefix + '/requests/' + body.request_id), body.design_run_id, body.request_id);
    } catch {
      throw Object.assign(new Error(`${error.message}；本次结果待确认，请先核对或按原请求重试。`), { outcomeUnknown: true });
    }
  }
}
