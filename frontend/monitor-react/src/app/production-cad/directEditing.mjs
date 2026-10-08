import { designParameterGroups } from './designEditor.mjs';

// 标注来自确认过的规格坐标，而非 STL 的像素或三角面包围盒。
export function directDimensions(spec, groupId) {
  if (!spec?.operations || spec.parts || spec.bim || spec.sheet_metal) return [];
  const group = designParameterGroups(spec).find((item) => item.id === groupId && item.operation);
  if (!group) return [];
  const op = spec.operations[Number(groupId.split('.').at(-1))];
  const p = op.position;
  if (!Array.isArray(p) || p.length !== 3 || !p.every(Number.isFinite)) return [];
  const result = [], size = Math.max(...['length','width','height','diameter','bottom_diameter','edge_length'].map((key) => Number(op[key]) || 0), 10), gap = size * 0.16;
  const shift = (point, axis, value) => point.map((v, i) => v + (i === axis ? value : 0));
  function add(key, a, b, delta) {
    const field = group.fields.find((item) => item.id === `${groupId}.${key}`);
    if (field) result.push({ ...field, a, b, delta });
  }
  const axis = 'xyz'.indexOf(op.axis || 'z'), radial = axis === 0 ? 1 : 0;
  function diameter(key, center) {
    const value = Number(op[key]);
    add(key, shift(center, radial, -value/2), shift(center, radial, value/2), [0,0,0].map((_, i) => i === radial ? 0.5 : 0));
  }
  function length(key, at, direction) {
    add(key, at, shift(at, direction, op[key]), [0,0,0].map((_, i) => i === direction ? 1 : 0));
  }
  if (op.type === 'box') {
    length('length', shift(p, 1, -gap), 0);
    length('width', shift(p, 0, -gap), 1);
    length('height', shift(p, 0, op.length + gap), 2);
  } else if (op.type === 'cylinder') {
    diameter('diameter', shift(p, axis, -gap));
    length('length', shift(p, radial, op.diameter/2 + gap), axis);
  } else if (op.type === 'sphere') diameter('diameter', p);
  else if (op.type === 'cone') {
    diameter('bottom_diameter', shift(p, axis, -gap));
    if (op.top_diameter > 0) diameter('top_diameter', shift(p, axis, op.height));
    length('height', shift(p, radial, op.bottom_diameter/2 + gap), axis);
  } else if (op.type === 'tetrahedron') length('edge_length', shift(p, 1, -gap), 0);
  else if (op.type === 'gear') {
    length('width', shift(p, radial, op.module * op.teeth/2 + gap), axis);
    if (op.bore_diameter > 0) diameter('bore_diameter', p);
  }
  if (op.mode === 'cut') {
    for (let i = 0; i < 2; i++) {
      const delta = [0,0,0]; delta[i] = 1;
      add(`position.${i}`, p, shift(p, i, size * 0.65), delta);
    }
  }
  return result;
}

export function projectDirectDimensions(measures, project, width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return [];
  return measures.flatMap((item) => {
    const a = project(item.a), b = project(item.b), next = project(item.b.map((v, i) => v + item.delta[i]));
    if ([a,b,next].some((p) => !p || ![p.x,p.y,p.z].every(Number.isFinite) || p.z < -1 || p.z > 1)) return [];
    // 标注引线避开顶部对象选择和底部确认栏；数值换算仍使用真实相机投影。
    const clamp = (p) => [Math.max(25, Math.min(width-25, p.x)), Math.max(110, Math.min(height-120, p.y))];
    const displayA = clamp(a), displayB = clamp(b);
    const labelAt = [Math.max(50, Math.min(width-50, (displayA[0]+displayB[0])/2)), Math.max(110, Math.min(height-156, (displayA[1]+displayB[1])/2))];
    // 短尺寸或边界压缩时，文字不能压住可拖动圆点。
    if (Math.abs(labelAt[0]-displayB[0]) < 100 && Math.abs(labelAt[1]-displayB[1]) < 28) labelAt[1] = displayB[1] < 140 ? displayB[1]+32 : displayB[1]-32;
    return [{ ...item, a: displayA, b: displayB, anchorA: [a.x,a.y], anchorB: [b.x,b.y], labelAt, unitPixels: [next.x-b.x,next.y-b.y] }];
  });
}

export function dragDimensionValue(item, dx, dy) {
  const [x,y] = item.unitPixels || [], norm = x*x + y*y;
  if (!Number.isFinite(norm) || norm < 0.01 || ![dx,dy].every(Number.isFinite)) throw new Error('当前视角不适合拖动这个尺寸，请旋转模型或直接输入。');
  const value = Math.round((item.value + (dx*x + dy*y)/norm) * 10) / 10;
  if (!Number.isFinite(value) || value < item.min || value > item.max) throw new Error('拖动尺寸超出可用范围，请直接输入有效尺寸。');
  return value;
}
