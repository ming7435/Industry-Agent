const maxBytes = 32 * 1024 * 1024;
const maxTriangles = 60000;

function fields(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== keys.length || keys.some((key) => !Object.hasOwn(value, key))) {
    throw new Error('运动数据结构不完整或包含未知字段。');
  }
}

function name(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 64 || /[\u0000-\u001f]/.test(value)) {
    throw new Error('运动零件名称无效。');
  }
}

function vector(value, length, limit) {
  if (!Array.isArray(value) || value.length !== length || value.some((item) => !Number.isFinite(item) || Math.abs(item) > limit)) {
    throw new Error('运动坐标或四元数包含无效数值。');
  }
}

export function validateMotionData(value) {
  fields(value, ['components', 'frames']);
  if (!Array.isArray(value.components) || value.components.length < 2 || value.components.length > 8 ||
      !Array.isArray(value.frames) || value.frames.length < 2 || value.frames.length > 120) {
    throw new Error('机构运动需要2至8个零件、2至120个真实求解帧。');
  }
  const names = new Set();
  let triangleCount = 0;
  for (const component of value.components) {
    fields(component, ['name', 'triangles']); name(component.name);
    if (names.has(component.name)) throw new Error('运动零件名称重复。');
    names.add(component.name);
    const triangles = component.triangles;
    if (!Array.isArray(triangles) || triangles.length < 36 || triangles.length % 9 !== 0) {
      throw new Error('运动零件缺少完整三角网格。');
    }
    triangleCount += triangles.length / 9;
    if (triangleCount > maxTriangles || triangles.some((item) => !Number.isFinite(item) || Math.abs(item) > 100000)) {
      throw new Error('运动网格超出资源上限或包含无效坐标。');
    }
    for (let axis = 0; axis < 3; axis += 1) {
      let min = Infinity, max = -Infinity;
      for (let index = axis; index < triangles.length; index += 3) {
        min = Math.min(min, triangles[index]); max = Math.max(max, triangles[index]);
      }
      if (max - min <= 1e-9) throw new Error('运动零件网格没有有效实体范围。');
    }
  }
  let previousTime = -1;
  for (const [index, frame] of value.frames.entries()) {
    fields(frame, ['time', 'placements']);
    if (!Number.isFinite(frame.time) || frame.time <= previousTime || frame.time > 60 || (index === 0 && frame.time !== 0) ||
        !Array.isArray(frame.placements) || frame.placements.length !== names.size) {
      throw new Error('运动帧时间或零件数量无效。');
    }
    previousTime = frame.time;
    const placed = new Set();
    for (const placement of frame.placements) {
      fields(placement, ['name', 'position', 'quaternion']);
      if (!names.has(placement.name) || placed.has(placement.name)) throw new Error('运动帧缺少唯一的零件对应关系。');
      placed.add(placement.name);
      vector(placement.position, 3, 100000); vector(placement.quaternion, 4, 1.000001);
      if (Math.abs(Math.hypot(...placement.quaternion) - 1) > 1e-5) {
        throw new Error('运动旋转必须为单位四元数，不能使用角度或零向量。');
      }
    }
  }
  return value;
}

export function validateMotionUrl(value, modelUrl) {
  const artifact = /^\/api\/cad\/freecad\/runs\/(FC-[a-f0-9]{64})\/artifacts\/(motion\.json|model\.stl)$/;
  const motion = typeof value === 'string' && value.match(artifact);
  const model = typeof modelUrl === 'string' && modelUrl.match(artifact);
  if (!motion || !model || motion[2] !== 'motion.json' || model[2] !== 'model.stl' || motion[1] !== model[1]) {
    throw new Error('运动文件必须来自当前模型运行的本地导出地址。');
  }
  return value;
}

export async function loadMotionData(motionUrl, modelUrl, signal, fetcher = fetch) {
  const url = validateMotionUrl(motionUrl, modelUrl);
  const response = await fetcher(url, { credentials: 'same-origin', redirect: 'error', signal });
  if (!response.ok) throw new Error(`运动文件读取失败（${response.status}）。`);
  if (!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) {
    throw new Error('运动文件必须为JSON数据。');
  }
  const length = Number(response.headers.get('content-length'));
  if (Number.isFinite(length) && length > maxBytes) throw new Error('运动文件超过32MiB资源上限。');
  const reader = response.body?.getReader();
  let text;
  if (reader) {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    const pieces = []; let bytes = 0;
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > maxBytes) {
          await reader.cancel(); throw new Error('运动文件超过32MiB资源上限。');
        }
        pieces.push(decoder.decode(chunk.value, { stream: true }));
      }
      pieces.push(decoder.decode()); text = pieces.join('');
    } finally { reader.releaseLock(); }
  } else {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > maxBytes) throw new Error('运动文件超过32MiB资源上限。');
    text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  }
  return validateMotionData(JSON.parse(text));
}

export function applyMotionFrame(groups, data, index) {
  if (!Number.isInteger(index) || index < 0 || index >= data.frames.length) throw new Error('运动帧编号无效。');
  for (const placement of data.frames[index].placements) {
    const group = groups.get(placement.name);
    if (!group) throw new Error('运动零件未建立三维对象。');
    group.position.fromArray(placement.position);
    group.quaternion.fromArray(placement.quaternion);
  }
}

export function frameIndexAtTime(frames, time) {
  let index = 0;
  while (index + 1 < frames.length && frames[index + 1].time <= time) index += 1;
  return index;
}
