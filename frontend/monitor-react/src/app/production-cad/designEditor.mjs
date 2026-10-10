import { validFreeCadRun } from './freecad.mjs';

const names = { box: '长方体', cylinder: '圆柱体', sphere: '球体', cone: '圆台', tetrahedron: '正四面体', gear: '齿轮', thread: '螺纹', loft: '截面放样', fillet: '圆角', chamfer: '倒角' };
const labels = { length: '长度', width: '宽度', height: '高度', diameter: '直径', edge_length: '边长', bottom_diameter: '底部直径', top_diameter: '顶部直径', module: '模数', teeth: '齿数', pressure_angle: '压力角', bore_diameter: '中心孔直径', major_diameter: '外径', pitch: '螺距', depth: '深度', flank_angle: '牙型角', radius: '圆角半径', distance: '倒角距离', base_length: '底边直段长度', flange_length: '翻边直段长度', thickness: '厚度', bend_radius: '内折弯半径', bend_angle: '折弯角度', k_factor: '中性层系数', offset: '距墙起点', sill: '洞口底部高度', start: '运动起点', end: '运动终点', duration: '运动时长', frames: '运动帧数', scale: '图纸比例', angle: '关节角度' };
const dimensions = { box: ['length','width','height'], cylinder: ['diameter','length'], sphere: ['diameter'], cone: ['bottom_diameter','top_diameter','height'], tetrahedron: ['edge_length'], gear: ['module','width','bore_diameter','teeth','pressure_angle'], thread: ['major_diameter','pitch','length','depth','flank_angle'], loft: [], fillet: ['radius'], chamfer: ['distance'] };
const angleFields = new Set(['pressure_angle','flank_angle','bend_angle','angle']);
const zeroFields = new Set(['top_diameter','bore_diameter','sill','offset']);
const pathValue = (object, path) => path.reduce((value, key) => value?.[key], object);
// 与发送给服务端的 JSON 一致，同时断开不同零件之间偶然共享的对象引用。
const clone = (value) => JSON.parse(JSON.stringify(value));

function numericField(object, path, key, options = {}) {
  const full = [...path, key], value = pathValue(object, full);
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return { id: full.join('.'), path: full, label: labels[key] || key, value, unit: angleFields.has(key) ? '°' : key === 'duration' ? '秒' : ['teeth','frames','k_factor','scale'].includes(key) ? '' : 'mm',
    min: zeroFields.has(key) ? 0 : 0.000001, max: 10000, ...options };
}
function vectorFields(object, path, key, label, count = 3) {
  return Array.from({ length: count }, (_, index) => numericField(object, [...path, key], index, { label: `${label} ${'XYZ'[index]}`, min: -10000 }));
}

export function designParameterGroups(spec) {
  if (!spec || spec.units !== 'mm') return [];
  const groups = [];
  const add = (path, label, fields, extra = {}) => groups.push({ id: path.join('.'), label, fields: fields.filter(Boolean), ...extra });
  const operations = (list, root, partLabel = '') => (list || []).forEach((operation, index) => {
    if (!dimensions[operation?.type]) return;
    const path = [...root, index], label = `${partLabel}${index ? `特征 ${index}` : '主体'} · ${operation.mode === 'cut' && operation.type === 'cylinder' ? '通孔' : operation.mode === 'cut' ? '切除' : names[operation.type]}`;
    const fields = dimensions[operation.type].map((key) => numericField(spec, path, key,
      key === 'teeth' ? { min: 8, max: 120, integer: true } : key === 'pressure_angle' ? { min: 10, max: 35 } : {}));
    if (Array.isArray(operation.position)) fields.push(...vectorFields(spec, path, 'position', '位置'));
    if (operation.axis) fields.push({ id: [...path, 'axis'].join('.'), path: [...path, 'axis'], label: '方向', value: operation.axis, options: [['x','X 方向'],['y','Y 方向'],['z','Z 方向']] });
    (operation.sections || []).forEach((_, section) => {
      const sectionPath = [...path, 'sections', section];
      fields.push(numericField(spec, sectionPath, 'z', { label: `截面 ${section + 1} 高度`, min: -10000 }), numericField(spec, sectionPath, 'diameter', { label: `截面 ${section + 1} 直径` }),
        ...vectorFields(spec, sectionPath, 'center', `截面 ${section + 1} 中心`, 2));
    });
    add(path, label, fields, { removable: index > 0, operation: true, partPath: root });
  });
  operations(spec.operations, ['operations']);
  (spec.parts || []).forEach((part, index) => operations(part.operations, ['parts', index, 'operations'], `${part.name} / `));
  if (spec.sheet_metal) add(['sheet_metal'], '钣金尺寸', Object.keys(spec.sheet_metal).map((key) => numericField(spec, ['sheet_metal'], key,
    key === 'k_factor' ? { min: 0, max: 1, unit: '' } : key === 'bend_angle' ? { min: 1, max: 179 } : {})));
  for (const [type, label, keys, vectors] of [['walls','墙体',['height','thickness'],['start','end']], ['slabs','楼板',['length','width','thickness'],['position']], ['openings','门窗洞口',['offset','sill','width','height'],[]]]) {
    (spec.bim?.[type] || []).forEach((item, index) => {
      const path = ['bim', type, index];
      add(path, `${label} ${index + 1} · ${item.name}`, [...keys.map((key) => numericField(spec, path, key)), ...vectors.flatMap((key) => vectorFields(spec, path, key, key === 'end' ? '终点' : key === 'start' ? '起点' : '位置'))]);
    });
  }
  (spec.assembly?.joints || []).forEach((joint, index) => {
    const path = ['assembly', 'joints', index];
    add(path, `关节 ${index + 1} · ${joint.name}`, [numericField(spec, path, 'angle', { min: -360, max: 360 }), numericField(spec, path, 'distance', { min: -10000 }),
      ...['connector1','connector2'].flatMap((key, i) => vectorFields(spec, [...path, key], 'position', `连接点 ${i + 1}`))]);
  });
  if (spec.assembly?.motion) add(['assembly','motion'], '运动设置', ['start','end','duration','frames'].map((key) => numericField(spec, ['assembly','motion'], key,
    key === 'frames' ? { min: 2, max: 120, integer: true } : key === 'duration' ? { min: 0.01, max: 60 } : { min: -10000, unit: '关节单位' })));
  if (spec.drawing) {
    const fields = [numericField(spec, ['drawing'], 'scale', { min: 0.001, max: 10 }),
      { id: 'drawing.projection', path: ['drawing','projection'], label: '投影方式', value: spec.drawing.projection, options: [['third_angle','第三角法'],['first_angle','第一角法']] }];
    if (spec.drawing.section) fields.push(...vectorFields(spec, ['drawing','section'], 'origin', '剖切位置'), ...vectorFields(spec, ['drawing','section'], 'normal', '剖切方向'));
    add(['drawing'], '工程图设置', fields);
  }
  return groups.filter((group) => group.fields.length);
}

export function updateDesignParameter(spec, id, input) {
  const field = designParameterGroups(spec).flatMap((group) => group.fields).find((item) => item.id === id);
  if (!field) throw new Error('此参数不可编辑。');
  let value;
  if (field.options) {
    if (!field.options.some(([option]) => option === input)) throw new Error(`请选择有效的${field.label}。`);
    value = input;
  } else {
    if (String(input).trim() === '') throw new Error(`请填写${field.label}。`);
    value = Number(input);
    if (!Number.isFinite(value) || value < field.min || value > field.max || (field.integer && !Number.isInteger(value))) throw new Error(`${field.label}超出可用范围${field.integer ? '，必须为整数' : ''}。`);
  }
  const result = clone(spec), parent = pathValue(result, field.path.slice(0, -1));
  parent[field.path.at(-1)] = value;
  return result;
}

export function addDesignFeature(spec, type, partPath) {
  if (!['hole','fillet','chamfer'].includes(type)) throw new Error('不支持此特征。');
  const path = partPath || (spec.operations ? ['operations'] : null);
  if (!path || !designParameterGroups(spec).some((group) => group.operation && JSON.stringify(group.partPath) === JSON.stringify(path))) throw new Error('请先选择需要修改的零件。');
  const result = clone(spec), list = pathValue(result, path);
  const total = spec.parts ? spec.parts.reduce((sum, part) => sum + part.operations.length, 0) : list.length;
  if (total >= 24) throw new Error('当前设计的特征数量已达上限。');
  let feature;
  if (type === 'hole') {
    const base = list[0], axis = base.type === 'box' ? 'z' : base.type === 'cylinder' ? base.axis : null;
    if (!axis) throw new Error('该主体不支持自动定位通孔，请使用高级参数明确位置。');
    const position = [...base.position];
    if (base.type === 'box') { position[0] += base.length / 2; position[1] += base.width / 2; }
    feature = { type: 'cylinder', mode: 'cut', diameter: 6, length: base.type === 'box' ? base.height : base.length, axis, position };
    const planar = [0,1,2].filter((index) => index !== 'xyz'.indexOf(axis));
    const free = (candidate) => !list.some((op) => op.mode === 'cut' && op.type === 'cylinder' && op.axis === axis &&
      Math.hypot(...planar.map((index) => candidate[index] - op.position[index])) < (op.diameter + feature.diameter) / 2);
    if (!free(position)) {
      const candidates = base.type === 'box' ? [[0.25,0.25],[0.75,0.25],[0.25,0.75],[0.75,0.75]].map(([x,y]) => [base.position[0] + base.length*x, base.position[1] + base.width*y, base.position[2]]) :
        [[1,1],[-1,1],[-1,-1],[1,-1]].map(([x,y]) => { const candidate = [...position]; candidate[planar[0]] += base.diameter / 4*x; candidate[planar[1]] += base.diameter / 4*y; return candidate; });
      const candidate = candidates.find(free);
      if (!candidate) throw new Error('现有孔占用了预设位置，请在高级参数中明确新孔位置。');
      feature.position = candidate;
    }
  } else feature = type === 'fillet' ? { type: 'fillet', radius: 1, edges: 'all' } : { type: 'chamfer', distance: 1, edges: 'all' };
  const finish = list.findIndex((operation) => ['fillet','chamfer'].includes(operation.type));
  if (type === 'hole' && finish >= 0) list.splice(finish, 0, feature); else list.push(feature);
  return result;
}

export function removeDesignFeature(spec, id) {
  const group = designParameterGroups(spec).find((item) => item.id === id);
  if (!group?.removable) throw new Error('主体不能删除，请新建设计。');
  const result = clone(spec), index = Number(id.split('.').at(-1));
  pathValue(result, group.partPath).splice(index, 1);
  return result;
}

export function appendDesignVersion(history, run) {
  const safe = (Array.isArray(history) ? history : []).filter((entry) => validFreeCadRun(entry?.run_id) && entry.status === 'completed').slice(-19);
  if (!validFreeCadRun(run?.run_id) || run.status !== 'completed') return safe;
  const index = safe.findIndex((entry) => entry.run_id === run.run_id);
  const previous = index >= 0 ? safe[index] : null;
  const entry = { run_id: run.run_id, prompt: String(run.prompt || '').slice(0,10000), status: 'completed', spec: run.spec ? clone(run.spec) : null, created_at: run.created_at || previous?.created_at || Date.now() / 1000,
    part_name: typeof run.part_name === 'string' ? run.part_name.slice(0, 120) : previous?.part_name || '',
    part_number: typeof run.part_number === 'string' ? run.part_number.slice(0, 80) : previous?.part_number || '' };
  if (index >= 0) safe[index] = entry; else safe.push(entry);
  return safe;
}

const drawing = { projection: 'third_angle', scale: 1, section: null };
export const designTemplates = {
  flange: { label: '法兰轴套 · 中心孔与安装孔', prompt: '法兰直径70mm、厚12mm，凸台直径32mm、高30mm，中心通孔16mm，四个直径6mm安装孔，孔中心距轴线22mm；生成三视图。',
    spec: { units: 'mm', operations: [
      { type: 'cylinder', mode: 'add', diameter: 70, length: 12, axis: 'z', position: [0,0,0] },
      { type: 'cylinder', mode: 'add', diameter: 32, length: 30, axis: 'z', position: [0,0,12] },
      { type: 'cylinder', mode: 'cut', diameter: 16, length: 42, axis: 'z', position: [0,0,0] },
      ...[[22,0],[-22,0],[0,22],[0,-22]].map(([x,y]) => ({ type: 'cylinder', mode: 'cut', diameter: 6, length: 12, axis: 'z', position: [x,y,0] })),
    ], drawing } },
  plate: { label: '安装底板 · 四孔与凹槽', prompt: '长100mm、宽70mm、厚12mm安装底板，四个8mm通孔，中心60×30×4mm凹槽；生成三视图。',
    spec: { units: 'mm', operations: [
      { type: 'box', mode: 'add', length: 100, width: 70, height: 12, position: [0,0,0] },
      ...[[12,12],[88,12],[12,58],[88,58]].map(([x,y]) => ({ type: 'cylinder', mode: 'cut', diameter: 8, length: 12, axis: 'z', position: [x,y,0] })),
      { type: 'box', mode: 'cut', length: 60, width: 30, height: 4, position: [20,20,8] },
    ], drawing } },
};
