import React,{useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {STLLoader} from 'three/addons/loaders/STLLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildDocumentScene,objectIdFromIntersection} from './documentScene.mjs';

const directions={'等轴测':[1,.8,1],'前视图':[0,0,1],'后视图':[0,0,-1],'顶视图':[0,1,0],'底视图':[0,-1,0],'左视图':[-1,0,0],'右视图':[1,0,0]};
export default function DocumentViewer({snapshot,selectedObjectId,onSelect}) {
  const viewport=useRef(null),actions=useRef(null),selection=useRef({selectedObjectId,onSelect}),[status,setStatus]=useState(''),[error,setError]=useState(''),[mode,setMode]=useState('perspective');
  selection.current={selectedObjectId,onSelect};
  const identity=snapshot?`${snapshot.document_id}:${snapshot.revision}`:'';
  useEffect(()=>{
    const host=viewport.current,abort=new AbortController();let disposed=false,renderer,controls,observer,frame,bundle,camera,scene;let radius=1,direction='等轴测',orthographic=false,pointerStart;
    setError('');setStatus(snapshot?'正在加载对象…':'空文档');setMode('perspective');
    const lost=event=>{event.preventDefault();cancelAnimationFrame(frame);setError('WebGL 上下文已丢失，请刷新视图或下载原生文件');setStatus('');};
    const resize=()=>{if(!renderer||!camera)return;const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1),aspect=w/h;renderer.setSize(w,h);if(camera.isPerspectiveCamera)camera.aspect=aspect;else {const half=radius*1.3;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;}camera.updateProjectionMatrix();};
    const fit=()=>{if(!camera)return;const aspect=Math.max(host.clientWidth,1)/Math.max(host.clientHeight,1),limiting=2*Math.atan(Math.tan(THREE.MathUtils.degToRad(20))*Math.min(aspect,1)),distance=radius/Math.sin(limiting/2)*1.2;camera.up.set(0,1,0);if(['顶视图','底视图'].includes(direction))camera.up.set(0,0,-1);camera.position.copy(new THREE.Vector3(...directions[direction]).normalize().multiplyScalar(distance));controls.target.set(0,0,0);camera.lookAt(0,0,0);camera.zoom=1;resize();controls.update();};
    const cameraMode=value=>{orthographic=value;camera=value?new THREE.OrthographicCamera(-1,1,1,-1,.001,radius*100):new THREE.PerspectiveCamera(40,1,.001,radius*100);if(controls)controls.object=camera;fit();setMode(value?'orthographic':'perspective');};
    const pick=event=>{if(!bundle||!camera||!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>5)return;const rect=renderer.domElement.getBoundingClientRect(),ray=new THREE.Raycaster();ray.params.Line.threshold=radius*.005;ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);scene.updateMatrixWorld(true);const hit=ray.intersectObjects([...bundle.objectMap.values()].filter(o=>o.visible),false).find(h=>objectIdFromIntersection(h));selection.current.onSelect?.(hit?objectIdFromIntersection(hit):'');};
    const down=event=>{pointerStart={x:event.clientX,y:event.clientY};};
    async function initialize() {
      if(!snapshot)return;
      try {
        bundle=await buildDocumentScene(snapshot,async(object,entry,signal)=>{
          const response=await fetch(`/api/cad/freecad/documents/${encodeURIComponent(snapshot.document_id)}/snapshots/${snapshot.revision}/artifacts/${encodeURIComponent(entry.name)}`,{signal,credentials:'same-origin',cache:'no-store'});
          if(!response.ok)throw new Error(`对象文件读取失败（${response.status}）`);
          if(Number(response.headers.get('content-length')||0)>100*1024*1024)throw new Error('对象文件过大');
          if(object.geometry.curves)return response.json();const bytes=await response.arrayBuffer();if(bytes.byteLength>100*1024*1024)throw new Error('STL 文件过大');try{return new STLLoader().parse(bytes);}catch{throw new Error('STL 网格文件损坏，无法显示对象');}
        },abort.signal);
        if(disposed){bundle.dispose();return;}
        if(bundle.objectMap.size===0||bundle.bounds.isEmpty()){setStatus('无可见几何对象；非几何对象可在模型树中查看');return;}
        radius=Math.max(bundle.bounds.getBoundingSphere(new THREE.Sphere()).radius,.01);
        renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor(0xf2f5f5);renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','FreeCAD 文档三维视图');renderer.domElement.addEventListener('webglcontextlost',lost);renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointerup',pick);host.appendChild(renderer.domElement);
        scene=new THREE.Scene();scene.add(bundle.root,new THREE.HemisphereLight(0xffffff,0x666666,3));const light=new THREE.DirectionalLight(0xffffff,4);light.position.set(radius*3,radius*4,radius*2);scene.add(light);
        camera=new THREE.PerspectiveCamera(40,1,.001,radius*100);controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=radius*.1;controls.maxDistance=radius*30;fit();observer=new ResizeObserver(resize);observer.observe(host);
        actions.current={fit,view:name=>{direction=name;fit();},mode:cameraMode};
        setStatus(`已加载 ${bundle.objectMap.size} 个几何对象 · 修订 ${snapshot.revision}`);
        const render=()=>{if(disposed)return;for(const [id,object] of bundle.objectMap)object.material.color.setHex(id===selection.current.selectedObjectId?0x0b9b8c:object.isMesh?0xb3b8b8:0x526b71);controls.update();renderer.render(scene,camera);frame=requestAnimationFrame(render);};render();
      }catch(failure){if(!disposed&&failure.name!=='AbortError'){setError(failure.message);setStatus('');}}
    }
    initialize();return()=>{disposed=true;abort.abort();cancelAnimationFrame(frame);observer?.disconnect();controls?.dispose();actions.current=null;bundle?.dispose();if(renderer){renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointerup',pick);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();}};
  },[identity]);
  return <div className="cad-document-viewer"><div className="cad-actions"><button disabled={!actions.current} onClick={()=>actions.current?.mode(mode!=='orthographic')}>{mode==='orthographic'?'透视视图':'正交视图'}</button><button onClick={()=>actions.current?.fit()}>适应视图</button>{Object.keys(directions).map(name=><button key={name} onClick={()=>actions.current?.view(name)}>{name}</button>)}</div><div className="cad-document-viewport" ref={viewport}/>{error?<p role="alert">{error}</p>:<p role="status">{status}</p>}</div>;
}
