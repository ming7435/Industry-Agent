import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {buildDocumentScene,cadToViewerPosition,objectIdFromIntersection} from './documentScene.mjs';
const obj=(id,mesh=true)=>({object_id:id,visible:true,geometry:mesh?{mesh:id+'.stl'}:{}});
const snapshot={document_id:'DOC-a',revision:1,objects:[obj('OBJ-a'),obj('OBJ-b'),obj('OBJ-none',false)],artifacts:[{name:'OBJ-a.stl'},{name:'OBJ-b.stl'}]};
test('components retain a shared coordinate frame and non-geometry objects stay in the tree only',async()=>{
  assert.deepEqual(cadToViewerPosition([0,0,10]),[0,10,0]);
  const scene=await buildDocumentScene(snapshot,async object=>{const geometry=new THREE.BoxGeometry(10,10,10);if(object.object_id==='OBJ-b')geometry.translate(40,0,0);return geometry;});
  const center=id=>scene.objectMap.get(id).geometry.boundingBox.getCenter(new THREE.Vector3());
  assert.equal(center('OBJ-a').distanceTo(center('OBJ-b')),40);
  assert.equal(scene.objectMap.has('OBJ-none'),false);
  assert.equal(objectIdFromIntersection({object:scene.objectMap.get('OBJ-b')}),'OBJ-b');
  scene.objectMap.get('OBJ-b').visible=false;assert.equal(objectIdFromIntersection({object:scene.objectMap.get('OBJ-b')}),null);scene.dispose();
});
test('curves may have zero thickness and no fabricated face identity',async()=>{
  const scene=await buildDocumentScene({...snapshot,objects:[{...obj('OBJ-a',false),geometry:{curves:'OBJ-a.json'}}],artifacts:[{name:'OBJ-a.json'}]},async()=>({lines:[[0,0,0],[10,0,0]]}));
  assert.equal(scene.objectMap.get('OBJ-a').isLineSegments,true);assert.equal(objectIdFromIntersection({object:scene.objectMap.get('OBJ-a'),faceIndex:1}),'OBJ-a');scene.dispose();
});
test('mismatched artifact/object identity and non-finite geometry are rejected',async()=>{
  await assert.rejects(buildDocumentScene({...snapshot,objects:[{...obj('OBJ-a'),geometry:{mesh:'OBJ-b.stl'}}]},async()=>new THREE.BoxGeometry()),/身份/);
  await assert.rejects(buildDocumentScene(snapshot,async()=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([NaN,0,0],3));return g;}),/网格/);
});

test('hidden containment groups hide descendants without hiding dependency consumers',async()=>{
  const objects=[{...obj('OBJ-group',false),visible:false}, {...obj('OBJ-a'),parent_ids:['OBJ-group']}, {...obj('OBJ-b'),dependency_ids:['OBJ-group']}];
  const scene=await buildDocumentScene({...snapshot,objects},async()=>new THREE.BoxGeometry());
  assert.equal(scene.objectMap.get('OBJ-a').visible,false);
  assert.equal(objectIdFromIntersection({object:scene.objectMap.get('OBJ-a')}),null);
  assert.equal(scene.objectMap.get('OBJ-b').visible,true);scene.dispose();
});
