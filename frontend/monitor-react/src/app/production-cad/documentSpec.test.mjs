import test from 'node:test';
import assert from 'node:assert/strict';
import {beginSpecTask, snapshotSpec, specCommand, specTasks} from './documentSpec.mjs';

const snapshot=(type='Part::Box',dimensions={length:40,width:20,height:10})=>({document_id:'DOC-a',revision:4,source_spec:null,product_root_ids:['OBJ-a'],objects:[{object_id:'OBJ-a',type_id:type,dependency_ids:[],editable_commands:['set_placement','set_primitive_dimensions'],properties:[...Object.entries(dimensions).map(([name,value])=>({name,value,editable:true})),{name:'position',value:[10,5,0]},{name:'rotation',value:{axis:[0,0,1],angle:0}}]}]});

test('native box dimensions and document coordinates become a full spec without changing the snapshot',()=>{
  const source=snapshot(),before=JSON.stringify(source);
  assert.deepEqual(snapshotSpec(source),{units:'mm',operations:[{type:'box',mode:'add',length:40,width:20,height:10,position:[10,5,0]}]});
  const draft=beginSpecTask(source,'hole');
  assert.deepEqual(draft.operations[1],{type:'cylinder',mode:'cut',diameter:6,length:10,axis:'z',position:[30,15,0]});
  assert.equal(JSON.stringify(source),before);
});
test('spec edits retain every existing feature and auxiliary workbench setting',()=>{
  const source=snapshot();source.source_spec={units:'mm',operations:[{type:'box',mode:'add',length:40,width:20,height:10,position:[0,0,0]}],drawing:{projection:'first_angle',scale:0.5,section:null}};
  const draft=beginSpecTask(source,'fillet');
  assert.deepEqual(draft.operations.at(-1),{type:'fillet',radius:1,edges:'all'});
  assert.deepEqual(draft.drawing,{projection:'first_angle',scale:0.5,section:null});
  draft.operations[0].length=80;assert.equal(source.source_spec.operations[0].length,40);
});
test('uncertain native geometry is never silently rebuilt as an unrotated primitive',()=>{
  const rotated=snapshot();rotated.objects[0].properties.at(-1).value.angle=30;
  assert.throws(()=>beginSpecTask(rotated,'chamfer'),/旋转/);
  const partial=snapshot('Part::Cylinder',{diameter:20,length:30});partial.objects[0].properties.push({name:'native.Angle',value:180});
  assert.throws(()=>snapshotSpec(partial),/完整/);
  const complex=snapshot('PartDesign::Feature');
  assert.throws(()=>snapshotSpec(complex),/规格/);
  const multiple=snapshot();multiple.product_root_ids.push('OBJ-b');
  assert.throws(()=>snapshotSpec(multiple),/单个/);
});
test('missing placement evidence is not guessed as zero translation and zero rotation',()=>{
  const missingPosition=snapshot();missingPosition.objects[0].properties=missingPosition.objects[0].properties.filter(p=>p.name!=='position');
  assert.throws(()=>snapshotSpec(missingPosition),/位置/);
  const missingRotation=snapshot();missingRotation.objects[0].properties=missingRotation.objects[0].properties.filter(p=>p.name!=='rotation');
  assert.throws(()=>snapshotSpec(missingRotation),/旋转/);
});
test('a cylinder with missing angular extent is not assumed to be a complete cylinder',()=>{
  const missingExtent=snapshot('Part::Cylinder',{diameter:20,length:30});
  assert.throws(()=>snapshotSpec(missingExtent),/完整/);
  missingExtent.objects[0].properties.push({name:'native.Angle',value:360});
  assert.deepEqual(snapshotSpec(missingExtent),{units:'mm',operations:[{type:'cylinder',mode:'add',diameter:20,length:30,axis:'z',position:[10,5,0]}]});
});
test('engineering drawing and section use the current part, not a hardcoded example part',()=>{
  const drawing=beginSpecTask(snapshot(),'drawing');
  assert.equal(drawing.operations[0].length,40);assert.deepEqual(drawing.drawing,{projection:'third_angle',scale:1,section:null});
  const section=beginSpecTask(snapshot(),'section');
  assert.deepEqual(section.drawing.section,{origin:[0,0,0],normal:[0,1,0]});
});
test('new-workflow templates are independent drafts and do not mutate current model or shared defaults',()=>{
  assert.ok(specTasks.some(task=>task.id==='sheetmetal'));assert.ok(specTasks.some(task=>task.id==='motion'));
  const loft=beginSpecTask(snapshot(),'loft');
  assert.equal(loft.operations[0].type,'loft');assert.equal(loft.operations[0].sections.length,3);
  loft.operations[0].sections[0].diameter=999;
  assert.equal(beginSpecTask(snapshot(),'loft').operations[0].sections[0].diameter,40);
  assert.throws(()=>beginSpecTask(snapshot(),'Std_Macro'),/不支持/);
});
test('a prepared task is pinned to the exact model revision and uses only a typed spec command',()=>{
  const source=snapshot(),draft=beginSpecTask(source,'hole');
  const command=specCommand(source,draft,source);
  assert.equal(command.command_type,'replace_from_spec');assert.equal(command.expected_revision,4);assert.equal(command.document_id,'DOC-a');
  assert.deepEqual(command.parameters.spec.operations[1].position,[30,15,0]);assert.equal(Object.hasOwn(command.parameters,'code'),false);
  assert.throws(()=>specCommand(source,draft,{...source,revision:5}),/修订/);
  assert.throws(()=>specCommand(source,draft,{...source,document_id:'DOC-b'}),/文档/);
  assert.throws(()=>specCommand(source,{units:'inches',operations:[]},source),/毫米/);
  command.parameters.spec.operations[0].length=900;assert.equal(draft.operations[0].length,40);
});
