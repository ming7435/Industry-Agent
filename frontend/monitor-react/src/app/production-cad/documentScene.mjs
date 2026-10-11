import * as THREE from 'three';
export const cadToViewerPosition=([x,y,z])=>[x,z,y===0?0:-y];
export function objectIdFromIntersection(intersection) {
  let object=intersection?.object, id=null;
  while(object) {if(!object.visible)return null;id||=object.userData?.objectId;object=object.parent;}
  return /^OBJ-[\w-]+$/.test(id||'')?id:null;
}
export async function buildDocumentScene(snapshot,loadGeometry,signal) {
  const root=new THREE.Group(),objectMap=new Map(),resources=new Set();
  const dispose=()=>{for(const resource of resources)resource.dispose?.();resources.clear();root.clear();objectMap.clear();};
  try {
    if(!/^DOC-[\w-]+$/.test(snapshot.document_id)||!Number.isInteger(snapshot.revision))throw new Error('快照身份无效');
    const objects=new Map(snapshot.objects.map(o=>[o.object_id,o]));
    const visible=(object,seen=new Set())=>{
      if(object.visible===false||seen.has(object.object_id))return false;
      const path=new Set(seen);path.add(object.object_id);
      return (object.parent_ids||[]).every(id=>!objects.has(id)||visible(objects.get(id),path));
    };
    for(const object of snapshot.objects) {
      signal?.throwIfAborted();
      const name=object.geometry?.mesh||object.geometry?.curves;if(!name)continue;
      const curves=!!object.geometry.curves;
      if(!/^OBJ-[\w-]+$/.test(object.object_id)||name!==object.object_id+(curves?'.json':'.stl')||objectMap.has(object.object_id))throw new Error('对象产物身份不一致');
      const entry=snapshot.artifacts?.find(a=>a.name===name);if(!entry)throw new Error('快照没有对应对象产物');
      const loaded=await loadGeometry(object,entry,signal);
      if(loaded?.isBufferGeometry)resources.add(loaded);signal?.throwIfAborted();
      let geometry,material,mesh;
      if(curves) {
        if(!Array.isArray(loaded?.lines)||loaded.lines.length%2||loaded.lines.length>2000000||loaded.lines.some(p=>!Array.isArray(p)||p.length!==3||!p.every(Number.isFinite)))throw new Error('曲线数据无效');
        geometry=new THREE.BufferGeometry();resources.add(geometry);geometry.setAttribute('position',new THREE.Float32BufferAttribute(loaded.lines.flatMap(cadToViewerPosition),3));
        material=new THREE.LineBasicMaterial({color:0x526b71});resources.add(material);mesh=new THREE.LineSegments(geometry,material);
      } else {
        geometry=loaded;const points=geometry?.getAttribute('position');
        if(!points||points.count<3||points.count%3||points.count>6000000||!Array.from(points.array).every(Number.isFinite))throw new Error('STL 网格无效');
        for(let i=0;i<points.count;i++){const [x,y,z]=cadToViewerPosition([points.getX(i),points.getY(i),points.getZ(i)]);points.setXYZ(i,x,y,z);}points.needsUpdate=true;geometry.computeVertexNormals();
        material=new THREE.MeshStandardMaterial({color:0xb3b8b8,metalness:.35,roughness:.45,side:THREE.DoubleSide});resources.add(material);mesh=new THREE.Mesh(geometry,material);
      }
      geometry.computeBoundingBox();if(!geometry.boundingBox||geometry.boundingBox.isEmpty())throw new Error('几何范围无效');
      mesh.visible=visible(object);mesh.userData.objectId=object.object_id;root.add(mesh);objectMap.set(object.object_id,mesh);
    }
    const bounds=new THREE.Box3();for(const mesh of objectMap.values())if(mesh.visible)bounds.union(mesh.geometry.boundingBox);
    // Only the complete document is centered. Native component positions remain unchanged.
    if(!bounds.isEmpty()){const center=bounds.getCenter(new THREE.Vector3());root.position.copy(center.negate());bounds.translate(center);}
    return {root,bounds,objectMap,dispose};
  }catch(error){dispose();throw error;}
}
