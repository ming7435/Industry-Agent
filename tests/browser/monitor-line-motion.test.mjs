// Exercise the real App, Three scene and renderer against isolated API responses.
// The build-only observer below reads rendered object transforms; it never replaces motion.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { respond } from './helpers/center-fixture.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const evidence = resolve(root, '.runtime/verification/frontend-line-motion-20261008');
const definitions = [
  ['TRAK-TC820LTYSI-001', 'cnc_lathe'],
  ['LNS-QL-SERVO-80-S2-001', 'bar_feeder'],
  ['ELITE-CS612-ROBOT-001', 'industrial_robot'],
  ['RENISHAW-EQUATOR300-001', 'equator_gauge'],
];
function snapshot(status = 'running', resultStatus = 'normal', enabled = true) {
  return { runner: { enabled }, data_source: 'isolated-fixture', devices: definitions.map(([device_id, device_type]) => ({
    device_id, device_type, name: device_id, live: true,
    latest_result: { status: resultStatus, current_sample: { device_id, status, control_state: status,
      timestamp: new Date().toISOString(), metrics: {}, equipment_states: {}, alarm_code: null } },
  })) };
}

const observer = `
window.__observeWorkshop = renderer => {
  const original = renderer.render.bind(renderer);
  const entry = { renderer, scene: null, camera: null, frames: 0 };
  window.__workshopRenders = (window.__workshopRenders || 0) + 1;
  window.__workshop = entry;
  renderer.render = (scene, camera) => {
    original(scene, camera);
    entry.scene = scene; entry.camera = camera; entry.frames += 1;
  };
};
window.__readWorkshop = () => {
  const entry = window.__workshop;
  if (!entry?.scene) return null;
  const round = values => values.map(value => Math.round(value * 1000000) / 1000000);
  const objects = [], lights = [];
  const visit = (object, path, ancestors = []) => {
    const names = [...ancestors, object.name || ''];
    if (object.isLight) lights.push({ path, intensity: Math.round(object.intensity * 1000000) / 1000000 });
    if (object.isMesh || object.isGroup) {
      const geometry = object.geometry?.parameters || {};
      objects.push({ path, name: object.name, machine: object.userData.machineId || '',
        ancestors: names, radius: geometry.radiusTop ?? null, height: geometry.height ?? null,
        rotation: round(object.rotation.toArray().slice(0, 3)),
        pose: [...round(object.position.toArray()), ...round(object.quaternion.toArray()),
          ...round(object.scale.toArray()), object.visible], world: round(object.matrixWorld.elements) });
    }
    object.children.forEach((child, index) => visit(child, path + '/' + index, names));
  };
  visit(entry.scene, 'scene');
  return { scene: entry.scene.uuid, renders: window.__workshopRenders, frames: entry.frames,
    camera: round([...entry.camera.position.toArray(), ...entry.camera.quaternion.toArray()]), objects, lights };
};
`;

let fixture;
before(async () => {
  await mkdir(evidence, { recursive: true });
  const { build } = await import(pathToFileURL(resolve(root, 'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href : 'playwright-core');
  const compiled = await build({
    stdin: { resolveDir: resolve(root, 'frontend/monitor-react/src/app'), contents: `${observer}\nimport React from 'react';import{createRoot}from'react-dom/client';import{App}from'./App.jsx';createRoot(document.getElementById('root')).render(React.createElement(App));` },
    plugins: [{ name: 'observe-real-workshop', setup(builder) { builder.onLoad({ filter: /[\\/]App\.jsx$/ }, async ({ path }) => {
      const source = await readFile(path, 'utf8');
      const marker = 'mount.appendChild(renderer.domElement);';
      assert.ok(source.includes(marker), 'Workshop renderer attachment must remain observable');
      return { loader: 'jsx', contents: source.replace(marker, marker + '\nwindow.__observeWorkshop(renderer);')
        .replace('const [bigScreen, setBigScreen] = useState(false);', 'const [bigScreen, setBigScreen] = useState(new URLSearchParams(location.search).has("fixtureBigScreen"));') };
    }); } }],
    bundle: true, write: false, format: 'iife', platform: 'browser', loader: { '.css': 'empty', '.png': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' },
  });
  const html = '<!doctype html><meta charset="utf-8"><style>body{margin:0;font:14px sans-serif}.machine-3d-canvas{width:900px;height:500px;position:relative}.scene-overlay{position:absolute;top:140px;pointer-events:none}.scene-view-toggle{pointer-events:auto}.factory-map{position:relative}.scene-click-hint{margin:0}.device-alert-grid{display:flex;gap:8px}.device-alert-card{width:220px}.workbench-sidebar{display:none}.team-access{height:24px}</style><div id="root"></div><script src="/component.js"></script>';
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': req.url === '/component.js' ? 'application/javascript' : 'text/html;charset=utf-8' });
    res.end(req.url === '/component.js' ? compiled.outputFiles[0].text : html);
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}), args: ['--enable-unsafe-swiftshader'] });
  fixture = { browser, base: `http://127.0.0.1:${server.address().port}`, close: async () => {
    await browser.close(); server.closeAllConnections(); await new Promise(done => server.close(done));
  } };
});
after(async () => { await fixture?.close(); });

const read = page => page.evaluate(() => window.__readWorkshop());
const poses = value => value.objects.map(({ path, pose, world }) => ({ path, pose, world }));
function assertFrozen(actual, expected, message) {
  const before = poses(expected), after = poses(actual);
  const changed = after.filter((object, index) => JSON.stringify(object) !== JSON.stringify(before[index])).map(object => object.path);
  assert.equal(after.length, before.length, 'The set of observed scene objects must remain stable');
  assert.deepEqual(changed.slice(0, 12), [], message);
}
const selected = (value, predicate) => value.objects.filter(predicate).map(({ path, pose, world }) => ({ path, pose, world }));
const device = id => object => object.machine === id;
const rollers = object => (object.radius === .045 && object.height === .65) || (object.radius === .055 && object.height === .78);
const parts = object => object.ancestors.some(name => ['rawBarStock', 'finishedParts', 'screwPart'].includes(name));
async function open({ bigScreen = false, initialStatus = 'running', line = 'running' } = {}) {
  const context = await fixture.browser.newContext({ viewport: { width: 1200, height: 1050 } });
  const page = await context.newPage(); page.setDefaultTimeout(7000);
  await page.clock.install();
  let current = snapshot(initialStatus), currentLine = { state: line }, failing = false;
  const heldEndpoints = new Set(), pending = [];
  const requests = [], writes = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  async function respondLive(route, path) {
    if (path === '/api/monitor/snapshot') {
      if (failing) return route.abort('connectionreset');
      const timestamp = await page.evaluate(() => new Date().toISOString());
      const fresh = structuredClone(current);
      fresh.devices.forEach(machine => { machine.latest_result.current_sample.timestamp = timestamp; });
      return respond(route, fresh);
    }
    return respond(route, currentLine);
  }
  await page.route('**/api/**', async route => {
    const request = route.request(), path = new URL(request.url()).pathname;
    requests.push(path);
    if (request.method() !== 'GET') { writes.push(path); return route.abort(); }
    if (heldEndpoints.has(path)) { pending.push({ path, route }); return; }
    if (path === '/api/monitor/snapshot' || path === '/api/team/line') return respondLive(route, path);
    if (path === '/api/team/me') return respond(route, { user: null });
    return respond(route, { items: [] });
  });
  await page.goto(`${fixture.base}/?view=monitor${bigScreen ? '&fixtureBigScreen=1' : ''}`);
  await page.locator('.machine-3d-canvas canvas').waitFor();
  await page.clock.runFor(96);
  async function refresh() {
    const result = page.waitForResponse(response => new URL(response.url()).pathname === '/api/monitor/snapshot');
    await page.clock.runFor(2100); await result; await page.clock.runFor(64);
  }
  return { page, context, requests, writes, errors, refresh, pending,
    setState: (status, control = status === 'running' ? 'running' : 'stopped', health = 'normal', enabled = true) => { current = snapshot(status, health, enabled); currentLine = { state: control }; },
    setLine: value => { currentLine = { state: value }; },
    setFailure: value => { failing = value; },
    hold: (path, value = true) => { if (value) heldEndpoints.add(path); else heldEndpoints.delete(path); },
    release: async path => {
      heldEndpoints.delete(path);
      const held = pending.filter(item => item.path === path);
      for (const item of held) { pending.splice(pending.indexOf(item), 1); await respondLive(item.route, path); }
    },
  };
}

test('匿名监控的四个工位、输送滚轮及工件在整线停机时冻结，复机后继续且相机保持可用', async () => {
  const view = await open();
  try {
    const first = await read(view.page);
    await view.page.clock.runFor(7300);
    const moving = await read(view.page);
    for (const id of [definitions[0][0], definitions[1][0], definitions[2][0], 'EQUATOR300-VISUAL']) {
      assert.ok(selected(first, device(id)).length > 0, `${id} must be present in the real scene`);
      assert.notDeepEqual(selected(moving, device(id)), selected(first, device(id)), `${id} must change while the line runs`);
    }
    assert.ok(selected(first, rollers).length >= 8, 'Both conveyor and feeder rollers are observed');
    assert.notDeepEqual(selected(moving, rollers), selected(first, rollers));
    assert.notDeepEqual(selected(moving, parts), selected(first, parts));
    await view.page.locator('.factory-map').screenshot({ path: resolve(evidence, 'running.png') });

    view.setState('emergency_stop'); await view.refresh();
    const stopped = await read(view.page);
    await view.page.clock.runFor(1700);
    const held = await read(view.page);
    assertFrozen(held, stopped, 'Every mechanical mesh/group, roller and part must freeze after stop');
    assert.ok(held.frames > stopped.frames, 'Rendering must continue for camera interaction and status updates');
    await view.page.locator('.factory-map').screenshot({ path: resolve(evidence, 'stopped.png') });

    await view.page.getByRole('button', { name: '俯视', exact: true }).click();
    await view.page.clock.runFor(80);
    const overhead = await read(view.page);
    assert.notDeepEqual(overhead.camera, held.camera, 'View controls remain interactive while stopped');
    assert.equal(overhead.scene, held.scene, 'View switching must retain the same Three scene');
    assertFrozen(overhead, held, 'Changing the view cannot move stopped machines');
    await view.page.clock.fastForward(15000);
    assertFrozen(await read(view.page), held, 'A long pause cannot advance the mechanical phase');

    view.setState('running'); await view.refresh();
    const resumed = await read(view.page); await view.page.clock.runFor(900);
    const resumedLater = await read(view.page);
    assert.notDeepEqual(selected(resumedLater, rollers), selected(resumed, rollers));
    assert.notDeepEqual(selected(resumedLater, parts), selected(resumed, parts));
    assert.equal(resumed.scene, stopped.scene, 'Stop/start must preserve the original scene and controls');
    const phase = value => value.objects.find(object => object.name === 'rawBarStock').rotation[0];
    assert.ok(phase(resumed) >= phase(stopped) && phase(resumed) - phase(stopped) < 8,
      'Resume continues the held phase instead of skipping through the 15 seconds spent stopped');
    await view.page.locator('.factory-map').screenshot({ path: resolve(evidence, 'resumed.png') });
    assert.deepEqual(view.writes, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});

test('未登录页面轮询公共整线状态，告警变化不会重建画布，账本未确认复机时全部保持暂停', async () => {
  const view = await open();
  try {
    await view.refresh();
    assert.ok(view.requests.includes('/api/team/line'), 'Anonymous monitoring must read public line status');
    const initial = await read(view.page);
    view.setState('running', 'stopped', 'fault'); await view.refresh();
    const blocked = await read(view.page);
    assert.match(await view.page.locator('.team-access summary').innerText(), /整线已暂停/, 'The header and scene must share the public line status even when logged out');
    assert.equal(blocked.scene, initial.scene, 'Changing alert status must not recreate the canvas/scene');
    assert.equal(blocked.renders, initial.renders, 'No new WebGL renderer may be created for an alarm');
    await view.page.clock.runFor(700);
    const flashing = await read(view.page);
    assertFrozen(flashing, blocked, 'A line stop overrides still-running device samples');
    assert.notDeepEqual(flashing.lights, blocked.lights, 'Fault lights continue to update while every mechanical object is frozen');
    view.setState('running', 'starting'); await view.refresh();
    const verifying = await read(view.page); await view.page.clock.runFor(700);
    assertFrozen(await read(view.page), verifying, 'Start verification must not animate premature motion');
    assert.deepEqual(view.writes, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});

test('监控读取失败和监测暂停会冻结缓存画面，恢复连接并开启监测后继续运动', async () => {
  const view = await open();
  try {
    await view.refresh();
    const running = await read(view.page); await view.page.clock.runFor(700);
    assert.notDeepEqual(selected(await read(view.page), rollers), selected(running, rollers));
    view.setFailure(true);
    const failedRequest = view.page.waitForEvent('requestfailed', {
      predicate: request => new URL(request.url()).pathname === '/api/monitor/snapshot',
    });
    await view.page.clock.runFor(2100); await failedRequest; await view.page.clock.runFor(64);
    const unavailable = await read(view.page); await view.page.clock.runFor(900);
    assertFrozen(await read(view.page), unavailable, 'A failed read cannot leave the cached scene moving');

    view.setFailure(false); await view.refresh();
    const reconnected = await read(view.page); await view.page.clock.runFor(700);
    assert.notDeepEqual(selected(await read(view.page), rollers), selected(reconnected, rollers));
    view.setState('running', 'running', 'normal', false); await view.refresh();
    const disabled = await read(view.page); await view.page.clock.runFor(900);
    assertFrozen(await read(view.page), disabled, 'runner.enabled=false must pause motion even with running cached samples');

    view.setState('running'); await view.refresh();
    const enabled = await read(view.page); await view.page.clock.runFor(700);
    assert.notDeepEqual(selected(await read(view.page), rollers), selected(enabled, rollers));
    assert.equal(enabled.scene, running.scene, 'Failure and reconnect cannot recreate the scene');
    assert.deepEqual(view.writes, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});

test('大屏在未登录时也遵守整线停机，退出大屏仍保持同一场景并可恢复运动', async () => {
  const view = await open({ bigScreen: true, initialStatus: 'stopped', line: 'stopped' });
  try {
    assert.equal(await view.page.locator('.platform-shell.big-screen').count(), 1);
    assert.equal(await view.page.locator('.team-access').count(), 0, 'Big-screen fixture does not mount TeamAccess');
    await view.refresh();
    assert.ok(view.requests.includes('/api/team/line'), 'Line polling must be independent of TeamAccess');
    const stopped = await read(view.page); await view.page.clock.runFor(700);
    assertFrozen(await read(view.page), stopped, 'Big-screen machines remain stationary while stopped');
    await view.page.getByRole('button', { name: '退出大屏', exact: true }).click();
    await view.page.clock.runFor(80);
    assert.equal((await read(view.page)).scene, stopped.scene);
    view.setState('running'); await view.refresh();
    const restored = await read(view.page); await view.page.clock.runFor(700);
    assert.notDeepEqual(selected(await read(view.page), rollers), selected(restored, rollers));
    assert.deepEqual(view.writes, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});

for (const heldPath of ['/api/monitor/snapshot', '/api/team/line']) {
  const fastPath = heldPath === '/api/monitor/snapshot' ? '/api/team/line' : '/api/monitor/snapshot';
  test(`停机响应 ${fastPath} 先返回时立即冻结，无需等候另一请求超时`, async () => {
    const view = await open();
    try {
      await view.refresh();
      const moving = await read(view.page); await view.page.clock.runFor(400);
      assert.notDeepEqual(selected(await read(view.page), rollers), selected(moving, rollers));
      view.hold(heldPath);
      view.setState(heldPath === '/api/monitor/snapshot' ? 'running' : 'stopped',
        heldPath === '/api/monitor/snapshot' ? 'stopped' : 'running');
      const stopResponse = view.page.waitForResponse(response => new URL(response.url()).pathname === fastPath);
      await view.page.clock.runFor(1100); await stopResponse; await view.page.clock.runFor(48);
      assert.ok(view.pending.some(request => request.path === heldPath), 'The sibling request must still be pending');
      const stopped = await read(view.page);
      await view.page.clock.runFor(500);
      assertFrozen(await read(view.page), stopped, 'A received stop must pause immediately within the 3-second sibling request timeout');
      await view.release(heldPath); await view.page.clock.runFor(64);

      view.hold(heldPath); view.setState('running');
      const halfResume = view.page.waitForResponse(response => new URL(response.url()).pathname === fastPath);
      await view.page.clock.runFor(1100); await halfResume; await view.page.clock.runFor(48);
      const stillStopped = await read(view.page); await view.page.clock.runFor(500);
      assertFrozen(await read(view.page), stillStopped, 'One running response cannot resume motion until both reads succeed');
      await view.release(heldPath); await view.page.clock.runFor(64);
      const restored = await read(view.page); await view.page.clock.runFor(400);
      assert.notDeepEqual(selected(await read(view.page), rollers), selected(restored, rollers), 'Both confirmed reads restore motion');
      assert.deepEqual(view.writes, []); assert.deepEqual(view.errors, []);
    } finally { await view.context.close(); }
  });
}

test('缓存运行采样过期后即使两路请求尚未返回，下一动画帧也必须冻结', async () => {
  const view = await open();
  try {
    await view.refresh();
    view.hold('/api/monitor/snapshot'); view.hold('/api/team/line');
    await view.page.clock.runFor(1100);
    assert.ok(view.pending.some(request => request.path === '/api/monitor/snapshot'));
    assert.ok(view.pending.some(request => request.path === '/api/team/line'));
    const beforeExpiry = await read(view.page);
    // Change wall-clock time without firing the 3-second request deadline.
    // The RAF must notice expired evidence even when React receives no new state.
    const now = await view.page.evaluate(() => Date.now());
    await view.page.clock.setSystemTime(new Date(now + 20000));
    await view.page.clock.runFor(32);
    const expired = await read(view.page);
    await view.page.clock.runFor(500);
    assertFrozen(await read(view.page), expired, 'Expired live samples cannot keep animating until network completion');
    const phase = value => value.objects.find(object => object.name === 'rawBarStock').rotation[0];
    assert.ok(phase(expired) - phase(beforeExpiry) < .8, 'Only a possible frame before the wall-clock change may advance');
    assert.deepEqual(view.writes, []); assert.deepEqual(view.errors, []);
  } finally { await view.context.close(); }
});
