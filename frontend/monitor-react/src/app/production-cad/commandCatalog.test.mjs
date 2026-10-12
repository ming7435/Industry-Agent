import test from 'node:test';import assert from 'node:assert/strict';
test('search and workbench filtering keep all command IDs without a fixed small subset',async()=>{
  const {catalogCommands}=await import('./commandCatalog.mjs');
  const commands=Array.from({length:800},(_,i)=>({id:`Part_Action${i}`,label:`命令${i}`,workbench_id:'PartWorkbench'}));
  commands.push({id:'Sketcher_NewSketch',label:'新建草图',workbench_id:'SketcherWorkbench'});
  assert.equal(catalogCommands({commands},'PartWorkbench','').length,800);
  assert.deepEqual(catalogCommands({commands},'SketcherWorkbench','草图').map(c=>c.id),['Sketcher_NewSketch']);
  assert.equal(catalogCommands({commands},'all','Action799')[0].id,'Part_Action799');
});
test('unadapted or stale commands cannot become arbitrary native execute requests',async()=>{
  const {catalogAction}=await import('./commandCatalog.mjs');
  assert.equal(catalogAction({execution:'not_adapted',action:{type:'execute_code',code:'bad'}}),null);
  assert.equal(catalogAction({execution:'discovery_stale',action:{type:'create_primitive',primitive_type:'box'}}),null);
  assert.deepEqual(catalogAction({execution:'adapted',action:{type:'create_primitive',primitive_type:'box'}}),{type:'create_primitive',primitive_type:'box'});
});
