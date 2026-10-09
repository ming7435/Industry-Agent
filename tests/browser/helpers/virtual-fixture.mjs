import {createServer} from 'node:http';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';

export async function virtualFixture(entry){
  const root=fileURLToPath(new URL('../../../',import.meta.url));
  const {build}=await import(pathToFileURL(resolve(root,'frontend/monitor-react/node_modules/esbuild/lib/main.js')));
  const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH?pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href:'playwright-core');
  const compiled=await build({stdin:{resolveDir:resolve(root,'frontend/monitor-react/src/app'),contents:entry,loader:'jsx'},
    bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty','.png':'dataurl'},define:{'process.env.NODE_ENV':'"production"'}});
  const server=createServer((req,res)=>{res.writeHead(200,{'Content-Type':req.url==='/component.js'?'application/javascript':'text/html;charset=utf-8'});
    res.end(req.url==='/component.js'?compiled.outputFiles[0].text:'<!doctype html><meta charset="utf-8"><div id="root"></div><script src="/component.js"></script>');});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
  return {browser,base:`http://127.0.0.1:${server.address().port}`,close:async()=>{await browser.close();await new Promise(done=>server.close(done));}};
}
