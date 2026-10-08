import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import * as THREE from 'three';

const id = `FC-${'a'.repeat(64)}`;
const modelUrl = `/api/cad/freecad/runs/${id}/artifacts/model.stl`;
const motionUrl = `/api/cad/freecad/runs/${id}/artifacts/motion.json`;
const triangles = [0,0,0, 1,0,0, 0,1,0, 0,0,0, 0,0,1, 1,0,0,
  0,0,0, 0,1,0, 0,0,1, 1,0,0, 0,0,1, 0,1,0];
const fixture = () => ({
  components: [{ name: '固定件', triangles: [...triangles] }, { name: '摇臂', triangles: [...triangles] }],
  frames: [
    { time: 0, placements: [{ name: '固定件', position: [0,0,0], quaternion: [0,0,0,1] },
      { name: '摇臂', position: [10,0,20], quaternion: [0,0,0,1] }] },
    { time: 2, placements: [{ name: '固定件', position: [0,0,0], quaternion: [0,0,0,1] },
      { name: '摇臂', position: [10,0,20], quaternion: [0,0,Math.SQRT1_2,Math.SQRT1_2] }] },
  ],
});
async function api() {
  assert.ok(existsSync(new URL('./motion.mjs', import.meta.url)), '缺少真实运动数据校验模块');
  return import('./motion.mjs');
}

test('原生帧和局部网格通过校验，不把角度当作四元数', async () => {
  const { validateMotionData } = await api();
  const value = fixture();
  assert.deepEqual(validateMotionData(value), value);
});

test('拒绝未知字段、无效网格、过多帧和缺失零件位姿', async () => {
  const { validateMotionData } = await api();
  for (const edit of [
    (x) => { x.code = 'alert(1)'; },
    (x) => { x.components[1].name = '固定件'; },
    (x) => { x.components[0].triangles[0] = Infinity; },
    (x) => { x.components[0].triangles[0] = '0'; },
    (x) => { x.components[0].triangles.pop(); },
    (x) => { x.components[0].triangles = Array(540009).fill(0); },
    (x) => { x.frames = []; },
    (x) => { x.frames = Array(121).fill(x.frames[0]); },
    (x) => { x.frames[1].time = 0; },
    (x) => { x.frames[1].time = NaN; },
    (x) => { x.frames[0].time = 1; },
    (x) => { x.frames[1].placements.pop(); },
    (x) => { x.frames[1].placements[1].name = '未知零件'; },
    (x) => { x.frames[1].placements[1].position = [0, 0, NaN]; },
    (x) => { x.frames[1].placements[1].quaternion = [0, 0, 90, 1]; },
    (x) => { x.frames[1].placements[1].quaternion = [0, 0, 0, 0]; },
    (x) => { x.frames[1].placements[1].quaternion = [0, 0, 0, true]; },
  ]) {
    const value = fixture(); edit(value);
    assert.throws(() => validateMotionData(value));
  }
});

test('仅加载同一运行的固定motion.json路径，拒绝外部或注入URL', async () => {
  const { validateMotionUrl } = await api();
  assert.equal(validateMotionUrl(motionUrl, modelUrl), motionUrl);
  for (const value of ['https://example.com' + motionUrl, '//example.com' + motionUrl,
    'javascript:alert(1)', motionUrl + '?x=1', motionUrl + '#fragment',
    motionUrl.replace(id, `FC-${'b'.repeat(64)}`), '/api/cad/freecad/runs/../motion.json']) {
    assert.throws(() => validateMotionUrl(value, modelUrl));
  }
});

test('以真实Three组应用局部网格和世界位姿，Z向上只转换一次', async () => {
  const { validateMotionData, applyMotionFrame } = await api();
  const data = validateMotionData(fixture());
  const root = new THREE.Group(); root.rotation.x = -Math.PI / 2;
  const groups = new Map(data.components.map((component) => {
    const group = new THREE.Group(); root.add(group); return [component.name, group];
  }));
  applyMotionFrame(groups, data, 1); root.updateMatrixWorld(true);
  const point = groups.get('摇臂').localToWorld(new THREE.Vector3(1, 0, 0));
  assert.ok(point.distanceTo(new THREE.Vector3(10, 20, -1)) < 1e-9);
  assert.throws(() => applyMotionFrame(groups, data, 2));
});

test('按真实时间选择已求解帧，不插入猜测运动', async () => {
  const { frameIndexAtTime } = await api();
  const frames = [{time:0}, {time:.5}, {time:2}];
  assert.equal(frameIndexAtTime(frames, .49), 0);
  assert.equal(frameIndexAtTime(frames, .5), 1);
  assert.equal(frameIndexAtTime(frames, 1), 1);
  assert.equal(frameIndexAtTime(frames, 3), 2);
});

test('获取运动文件时限制来源、重定向、内容大小并解析真实JSON', async () => {
  const { loadMotionData } = await api();
  let called = false;
  const fetcher = async (url, options) => {
    called = true;
    assert.equal(url, motionUrl);
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.redirect, 'error');
    return new Response(JSON.stringify(fixture()), { headers: { 'Content-Type': 'application/json' } });
  };
  assert.deepEqual(await loadMotionData(motionUrl, modelUrl, undefined, fetcher), fixture());
  assert.equal(called, true);
  await assert.rejects(loadMotionData(motionUrl, modelUrl, undefined, async () =>
    new Response('{}', {headers:{'Content-Type':'application/json','Content-Length':'40000000'}})));
  await assert.rejects(loadMotionData('https://example.com/model', modelUrl, undefined, async () => {
    assert.fail('外部URL不能进入fetch');
  }));
});
