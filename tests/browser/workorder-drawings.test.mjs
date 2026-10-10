import test, {before, after} from 'node:test';
import assert from 'node:assert/strict';
import {centerFixture, respond, deferred} from './helpers/center-fixture.mjs';

let fixture;
before(async () => { fixture = await centerFixture(); });
after(async () => { await fixture?.close(); });
const devices = [
  ['TRAK-TC820LTYSI-001', 'TC820si.html'], ['LNS-QL-SERVO-80-S2-001', 'QLS80S2.html'],
  ['RENISHAW-EQUATOR300-001', 'Equator300.html'], ['ELITE-CS612-ROBOT-001', 'EliteCS612.html'],
];
const order = (device_id, index = 0) => ({workorder_id:`WO-${index}`, device_id, status:'dispatched',
  title:'故障核查', repair_target:{part_name:'刀塔旋转超时', component:'', part_no:''}, repair_steps:[]});
const body = (device_id, filename) => ({device_id, status:filename ? 'available':'not_found', drawings:filename ? [{
  drawing_id:'REF-'+device_id, drawing_name:'设备整机图纸', device_id, drawing_url:'/drawings/'+filename,
  evidence_scope:'device_reference', engineering_status:'reference_only', source_kind:'original_edrawings',
}] : []});

async function open(items, lookup) {
  const context = await fixture.browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  const calls = [], errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await context.route('**/api/**', async route => {
    const req = route.request(), url = new URL(req.url());
    calls.push([req.method(), url.pathname, Object.fromEntries(url.searchParams)]);
    if (req.method() !== 'GET') return route.abort();
    if (url.pathname === '/api/workorders') return respond(route,{items});
    if (url.pathname === '/api/cad/drawings') return lookup(route, url.searchParams.get('device_id'));
    if (url.pathname === '/api/cad/resolve') return respond(route,{detail:'部件尚未建档'},404);
    return respond(route,{items:[]});
  });
  await context.route('**/drawings/*.html', route => route.fulfill({contentType:'text/html',body:'<title>隔离三维查看器</title>'}));
  await page.goto(`${fixture.base}/?view=workorder`);
  return {context, page, calls, errors};
}

for (const [device, filename] of devices) test(`工单${device}只按服务返回显示整机图纸，不把故障文本当部件编号`, async () => {
  const {context,page,calls,errors} = await open([order(device)], (route,id) => respond(route,body(id,filename)));
  try {
    const iframe = page.locator('.repair-drawing-frame');
    await iframe.waitFor();
    assert.equal(await iframe.getAttribute('src'), '/drawings/'+filename);
    const query = calls.find(item => item[1] === '/api/cad/drawings');
    assert.equal(query[2].device_id, device);
    assert.equal(query[2].component, undefined);
    assert.equal(calls.some(item => item[1] === '/api/cad/resolve'), false);
    assert.ok((await page.locator('[aria-label="故障部件定位状态"]').innerText()).includes('尚未建立'));
    assert.deepEqual(errors,[]);
    assert.ok(calls.every(item => item[0] === 'GET'));
  } finally { await context.close(); }
});

test('机器人未登记时明确缺图，不借用车床图纸；刷新仍只读', async () => {
  const robot=devices[3][0];
  const {context,page,calls} = await open([order(robot)], (route,id) => respond(route,body(id,'')));
  try {
    await page.getByText('尚未登记这台设备的图纸',{exact:true}).waitFor();
    assert.equal(await page.locator('.repair-drawing-frame').count(),0);
    await page.getByRole('button',{name:'重新检索图纸',exact:true}).click();
    await page.waitForFunction(() => document.body.innerText.includes('尚未登记这台设备的图纸'));
    assert.ok(calls.filter(item => item[1] === '/api/cad/drawings').length >= 2);
    assert.ok(calls.every(item => item[0] === 'GET'));
  } finally { await context.close(); }
});

test('不接受跨设备或非本地图纸地址', async () => {
  const {context,page} = await open([order(devices[0][0])], route => respond(route,body(devices[1][0],devices[1][1])));
  try {
    await page.getByText('图纸检索失败',{exact:true}).waitFor();
    assert.equal(await page.locator('.repair-drawing-frame').count(),0);
  } finally { await context.close(); }
});

test('切换工单时清除旧图纸，迟到结果不能覆盖当前设备', async () => {
  const gate = deferred();
  const {context,page} = await open(devices.slice(0,2).map(([id],index)=>order(id,index)), async (route,id) => {
    if (id === devices[0][0]) await gate.promise;
    await respond(route,body(id,devices.find(([device])=>device===id)[1]));
  });
  try {
    await page.locator('.workorder-queue-item').filter({hasText:'WO-1'}).click();
    const frame = page.locator('.repair-drawing-frame');
    await frame.waitFor();
    assert.equal(await frame.getAttribute('src'),'/drawings/QLS80S2.html');
    gate.resolve();
    await page.waitForTimeout(100);
    assert.equal(await frame.getAttribute('src'),'/drawings/QLS80S2.html');
  } finally { gate.resolve(); await context.close(); }
});

test('同编号的两个已登记版本可以分别选择，不串用同一iframe', async () => {
  const device = devices[0][0];
  const result = body(device, 'TC820si.html');
  result.drawings = [{...result.drawings[0],version_id:'V1',version_label:'A'},
    {...result.drawings[0],version_id:'V2',version_label:'B',drawing_url:'/drawings/TC820si-B.html'}];
  const {context,page} = await open([order(device)], route => respond(route,result));
  try {
    const select = page.getByRole('combobox',{name:'选择图纸版本'});
    await select.waitFor();
    await select.selectOption({label:'设备整机图纸 · B'});
    assert.equal(await page.locator('.repair-drawing-frame').getAttribute('src'),'/drawings/TC820si-B.html');
  } finally { await context.close(); }
});

test('按工单已保存的机型及版本标签检索，不改用当前默认版本', async () => {
  const device=devices[0][0];
  const item={...order(device),device_model:'TC820LTYsi',drawing_context:{version_label:'B'}};
  const result=body(device,'TC820si-B.html');
  result.drawings[0]={...result.drawings[0],device_model:'TC820LTYsi',version_id:'V2',version_label:'B'};
  const {context,page,calls}=await open([item],route=>respond(route,result));
  try {
    await page.locator('.repair-drawing-frame').waitFor();
    const params=calls.find(item=>item[1]==='/api/cad/drawings')[2];
    assert.equal(params.version,'B');
    assert.equal(params.device_model,'TC820LTYsi');
    assert.equal(await page.locator('.repair-drawing-frame').getAttribute('src'),'/drawings/TC820si-B.html');
  } finally { await context.close(); }
});

test('已保存机型与返回图纸不一致时不显示图纸', async () => {
  const device=devices[0][0];
  const result=body(device,'TC820si.html');
  result.drawings[0].device_model='OTHER';
  const {context,page}=await open([{...order(device),device_model:'TC820LTYsi'}],route=>respond(route,result));
  try {
    await page.getByText('图纸检索失败',{exact:true}).waitFor();
    assert.equal(await page.locator('.repair-drawing-frame').count(),0);
  } finally { await context.close(); }
});
