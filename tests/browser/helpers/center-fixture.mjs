import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

export async function centerFixture({ actor = null, snapshot = { devices: [] }, sample = { device_id: 'D-MOCK' }, fullApp = false, exposeMaintenanceChanges = false, withStyles = false } = {}) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const { build } = await import(pathToFileURL(resolve(root, 'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE_PATH
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href
    : 'playwright-core');
  const compiled = await build({
    stdin: { resolveDir: resolve(root, 'frontend/monitor-react/src/app'), contents: (exposeMaintenanceChanges
      ? `import {publishMaintenanceChange} from './maintenanceChanges.mjs'; window.publishMaintenanceChange=publishMaintenanceChange;` : '')+(fullApp
      ? `import React from 'react'; import {createRoot} from 'react-dom/client'; import {App} from './App.jsx'; createRoot(document.getElementById('root')).render(React.createElement(App));`
      : `import React from 'react'; import {createRoot} from 'react-dom/client'; import {LogsWorkspace, ReportWorkspace, QualityWorkspace, MaintenancePlanWorkspace, WorkorderView, DiagnosisWorkspace} from './App.jsx'; const view=new URL(location.href).searchParams.get('view'); createRoot(document.getElementById('root')).render(React.createElement(({logs:LogsWorkspace,report:ReportWorkspace,quality:QualityWorkspace,maintenance:MaintenancePlanWorkspace,workorder:WorkorderView,diagnosis:DiagnosisWorkspace})[view],${JSON.stringify({ actor, snapshot, sample })}));`) },
    plugins: [{ name: 'center-components', setup(builder) { builder.onLoad({ filter: /[\\/]App\.jsx$/ }, async ({ path }) => ({ contents: `${await readFile(path, 'utf8')}\nexport {LogsWorkspace, ReportWorkspace, QualityWorkspace, MaintenancePlanWorkspace, WorkorderView, DiagnosisWorkspace};`, loader: 'jsx' })); } }],
    bundle: true, write: false, format: 'iife', platform: 'browser',
    ...(withStyles ? {outfile:resolve(root,'output/expert-fixture/component.js')} : {}),
    loader: { '.css': withStyles ? 'css' : 'empty', '.png': 'dataurl' }, define: { 'process.env.NODE_ENV': '"production"' },
  });
  const server = createServer((req, res) => {
    const javascript=compiled.outputFiles.find(file=>file.path.endsWith('.js')) || compiled.outputFiles[0];
    res.writeHead(200, { 'Content-Type': req.url === '/component.js' ? 'application/javascript' : req.url==='/component.css' ? 'text/css' : 'text/html;charset=utf-8' });
    res.end(req.url === '/component.js' ? javascript.text : req.url==='/component.css' ? compiled.outputFiles.find(file=>file.path.endsWith('.css'))?.text || ''
      : `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${withStyles ? '<link rel="stylesheet" href="/component.css">' : ''}<div id="root"></div><script src="/component.js"></script>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: [`--explicitly-allowed-ports=${server.address().port}`], ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}) });
  return { browser, base: `http://127.0.0.1:${server.address().port}`, close: async () => { await browser.close(); await new Promise(resolve => server.close(resolve)); } };
}

export function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

export const respond = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

// 旧日志行为测试显式展开后再检查内容；默认折叠另由 runtime-monitor 测试覆盖。
export async function openLogSections(page){
  for(const selector of ['.logs-runs-panel','.logs-execution-panel']){
    const section=page.locator(selector);
    if(await section.getAttribute('open')===null)await section.locator('summary').first().click();
  }
}
