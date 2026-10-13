import test from 'node:test';
import assert from 'node:assert/strict';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

test('非三维页面入口保持轻量，三维渲染依赖仅在独立模块中加载', async () => {
  const root=fileURLToPath(new URL('../../frontend/monitor-react/',import.meta.url));
  const {build}=await import(pathToFileURL(resolve(root,'node_modules/vite/dist/node/index.js')));
  const result=await build({root,logLevel:'error',build:{write:false}});
  const chunks=result.output.filter(item=>item.type==='chunk');
  const entry=chunks.find(item=>item.isEntry);
  assert.ok(entry);
  const rendererModules=chunk=>Object.keys(chunk.modules).filter(name=>name.includes('/node_modules/three/'));
  assert.deepEqual(rendererModules(entry),[], 'Business pages eagerly bundled the full 3D renderer');
  assert.ok(Buffer.byteLength(entry.code)<550*1024, `Main entry exceeds page budget: ${Buffer.byteLength(entry.code)}`);
  assert.ok(chunks.some(chunk=>!chunk.isEntry && rendererModules(chunk).length));
});
