import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { applyMotionFrame, frameIndexAtTime, loadMotionData } from "./motion.mjs";
import InlineDimensionEditor from './InlineDimensionEditor.jsx';
import { projectDirectDimensions } from './directEditing.mjs';

export default function FreeCadModelViewer({ url, motionUrl, dimensionControls, editProps }) {
  const viewport = useRef(null), panel = useRef(null), actions = useRef(null);
  const measurements = useRef([]), [projections, setProjections] = useState([]), [viewportSize, setViewportSize] = useState(null);
  const setMeasurements = useCallback((items) => { measurements.current = items; }, []);
  const editInteraction = useCallback((active) => { actions.current?.editInteraction(active); if (active) { setRotating(false); setPlaying(false); } }, []);
  const [status, setStatus] = useState("loading"), [error, setError] = useState("");
  const [triangles, setTriangles] = useState(0), [rotating, setRotating] = useState(false);
  const [motionStatus, setMotionStatus] = useState("none"), [motionError, setMotionError] = useState("");
  const [motionTimes, setMotionTimes] = useState([]), [motionFrame, setMotionFrame] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const host = viewport.current, abort = new AbortController();
    let renderer, controls, geometry, edges, material, edgeMaterial, grid, observer, frame;
    const motionResources = [], playback = { playing: false, index: 0, startedAt: 0, startTime: 0 };
    let disposed = false, contextLost = false;
    setStatus("loading"); setError(""); setRotating(false);
    setMotionStatus(motionUrl ? "loading" : "none"); setMotionError(""); setMotionTimes([]); setMotionFrame(0); setPlaying(false);
    const onContextLost = (event) => { event.preventDefault(); contextLost = true; playback.playing = false; setPlaying(false); setStatus("error"); setError("WebGL 上下文已丢失。请刷新页面恢复三维预览，或下载模型。 "); };
    const initialize = async () => {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0xf2f2f2);
        renderer.domElement.setAttribute("aria-label", "FreeCAD 三维模型");
        renderer.domElement.setAttribute("role", "img");
        renderer.domElement.addEventListener("webglcontextlost", onContextLost);
        host.appendChild(renderer.domElement);
        const response = await fetch(url, { credentials: "same-origin", signal: abort.signal });
        if (!response.ok) throw new Error(`STL 文件读取失败（${response.status}）。请刷新状态或重新下载文件。`);
        const buffer = await response.arrayBuffer();
        if (disposed) return;
        geometry = new STLLoader().parse(buffer);
        const positions = geometry.getAttribute("position");
        if (!positions || positions.count < 12 || positions.count % 3 || !Array.from(positions.array).every(Number.isFinite)) throw new Error("STL 文件无有效三角网格，无法显示模型。");
        // FreeCAD 使用 Z 轴向上，展示时变换至 Three.js 的 Y 轴向上。
        geometry.rotateX(-Math.PI / 2); geometry.computeBoundingBox();
        let size = geometry.boundingBox.getSize(new THREE.Vector3());
        if (![size.x, size.y, size.z].every((value) => Number.isFinite(value) && value > 0)) throw new Error("STL 模型范围无效，无法显示实体。");
        const cadCenter = geometry.boundingBox.getCenter(new THREE.Vector3());
        geometry.center(); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
        let radius = geometry.boundingSphere.radius;
        const scene = new THREE.Scene();
        // 银灰色金属材质配合中性灯光，静态零件与运动装配均不带绿色或蓝色偏色。
        material = new THREE.MeshStandardMaterial({ color: 0xb0b0b0, metalness: 0.45, roughness: 0.4, flatShading: true });
        const staticModel = new THREE.Mesh(geometry, material); scene.add(staticModel);
        edges = new THREE.EdgesGeometry(geometry, 25);
        edgeMaterial = new THREE.LineBasicMaterial({ color: 0x505050, transparent: true, opacity: 0.45 });
        const staticEdges = new THREE.LineSegments(edges, edgeMaterial); scene.add(staticEdges);
        let motionData = null, motionGroups = null, triangleCount = positions.count / 3;
        if (motionUrl) {
          let motionRoot;
          try {
            const data = await loadMotionData(motionUrl, url, abort.signal);
            if (disposed) return;
            motionRoot = new THREE.Group();
            // 网格保持组件局部坐标，先应用原生Placement，再统一将Z向上转换为Y向上。
            motionRoot.rotation.x = -Math.PI / 2;
            const groups = new Map();
            for (const component of data.components) {
              const componentGeometry = new THREE.BufferGeometry(); motionResources.push(componentGeometry);
              componentGeometry.setAttribute("position", new THREE.Float32BufferAttribute(component.triangles, 3));
              componentGeometry.computeVertexNormals(); componentGeometry.computeBoundingBox();
              const group = new THREE.Group(); group.add(new THREE.Mesh(componentGeometry, material));
              const componentEdges = new THREE.EdgesGeometry(componentGeometry, 25); motionResources.push(componentEdges);
              group.add(new THREE.LineSegments(componentEdges, edgeMaterial));
              motionRoot.add(group); groups.set(component.name, group);
            }
            // 使用全部已求解帧的范围，避免播放时零件离开视野。
            const bounds = new THREE.Box3();
            for (let index = 0; index < data.frames.length; index += 1) {
              applyMotionFrame(groups, data, index); motionRoot.updateMatrixWorld(true);
              bounds.union(new THREE.Box3().setFromObject(motionRoot));
            }
            const motionSize = bounds.getSize(new THREE.Vector3());
            const motionRadius = bounds.getBoundingSphere(new THREE.Sphere()).radius;
            if (!Number.isFinite(motionRadius) || motionRadius <= 0 || ![motionSize.x, motionSize.y, motionSize.z].every((value) => Number.isFinite(value) && value > 0)) {
              throw new Error("机构运动范围无效。");
            }
            motionRoot.position.copy(bounds.getCenter(new THREE.Vector3()).negate());
            applyMotionFrame(groups, data, 0); scene.add(motionRoot);
            staticModel.visible = false; staticEdges.visible = false;
            motionData = data; motionGroups = groups; radius = motionRadius; size = motionSize;
            triangleCount = data.components.reduce((total, component) => total + component.triangles.length / 9, 0);
            setMotionTimes(data.frames.map((item) => item.time)); setMotionStatus("ready");
          } catch (failure) {
            if (disposed || failure.name === "AbortError") return;
            motionRoot?.removeFromParent();
            for (const resource of motionResources.splice(0)) resource.dispose();
            setMotionStatus("error"); setMotionError(failure.message);
          }
        }
        scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 2.5));
        const key = new THREE.DirectionalLight(0xffffff, 3.5); key.position.set(radius * 3, radius * 5, radius * 2); scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 1.5); fill.position.set(-radius * 3, radius, -radius * 2); scene.add(fill);
        grid = new THREE.GridHelper(radius * 5, 20, 0xb8b8b8, 0xdedede); grid.position.y = -size.y / 2 - radius * 0.002; scene.add(grid);
        const camera = new THREE.PerspectiveCamera(40, 1, radius / 100, radius * 100);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.1; controls.minDistance = radius * 1.1; controls.maxDistance = radius * 20; controls.autoRotateSpeed = 1.5;
        const fit = () => {
          const limitingFov = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * Math.min(camera.aspect, 1));
          const distance = radius / Math.sin(limitingFov / 2) * 1.15;
          controls.target.set(0, 0, 0); camera.position.copy(new THREE.Vector3(1.2, 0.8, 1.2).normalize().multiplyScalar(distance));
          camera.lookAt(0, 0, 0); controls.update(); controls.saveState();
        };
        const resize = () => {
          const width = Math.max(host.clientWidth, 1), height = Math.max(host.clientHeight, 1);
          renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
          setViewportSize({ width, height });
        };
        resize(); fit(); observer = new ResizeObserver(resize); observer.observe(host);
        const showMotionFrame = (index) => {
          if (!motionData) return;
          applyMotionFrame(motionGroups, motionData, index); playback.index = index; setMotionFrame(index);
        };
        actions.current = {
          editInteraction: (active) => { controls.enabled = !active; if (active) { controls.autoRotate = false; playback.playing = false; } },
          reset: () => controls.reset(), rotate: (value) => { controls.autoRotate = value; },
          zoom: (factor) => { const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor); offset.clampLength(controls.minDistance, controls.maxDistance); camera.position.copy(controls.target).add(offset); controls.update(); },
          seekMotion: (index) => { playback.playing = false; setPlaying(false); showMotionFrame(index); },
          toggleMotion: () => {
            if (!motionData) return;
            if (playback.playing) { playback.playing = false; setPlaying(false); return; }
            if (playback.index === motionData.frames.length - 1) showMotionFrame(0);
            playback.startedAt = performance.now(); playback.startTime = motionData.frames[playback.index].time;
            playback.playing = true; setPlaying(true);
          },
        };
        let lastProjection = 0;
        const render = () => {
          if (disposed || contextLost) return;
          if (motionData && playback.playing) {
            const time = playback.startTime + (performance.now() - playback.startedAt) / 1000;
            const index = frameIndexAtTime(motionData.frames, time);
            if (index !== playback.index) showMotionFrame(index);
            if (time >= motionData.frames.at(-1).time) { playback.playing = false; setPlaying(false); }
          }
          controls.update(); renderer.render(scene, camera);
          if (performance.now()-lastProjection > 50) {
            lastProjection = performance.now();
            // 与加载 STL 时相同的 Z 向上转换、中心平移和当前相机；不修改网格冒充新实体。
            const project = (point) => {
              const vector = new THREE.Vector3(point[0], point[2], -point[1]).sub(cadCenter).project(camera);
              return { x: (vector.x+1)*host.clientWidth/2, y: (1-vector.y)*host.clientHeight/2, z: vector.z };
            };
            const projected = motionData ? [] : projectDirectDimensions(measurements.current, project, host.clientWidth, host.clientHeight);
            setProjections((previous) => JSON.stringify(previous) === JSON.stringify(projected) ? previous : projected);
          }
          frame = requestAnimationFrame(render);
        };
        render(); setTriangles(triangleCount); setStatus("ready");
      } catch (failure) {
        if (disposed || failure.name === "AbortError") return;
        setStatus("error"); setError(renderer ? `STL 模型加载失败：${failure.message}` : "当前浏览器无法启用 WebGL，不能显示三维模型。请启用硬件加速，或下载 STEP / STL 文件查看。");
      }
    };
    initialize();
    return () => {
      disposed = true; abort.abort(); cancelAnimationFrame(frame); observer?.disconnect(); controls?.dispose(); actions.current = null;
      geometry?.dispose(); edges?.dispose(); material?.dispose(); edgeMaterial?.dispose(); grid?.geometry.dispose();
      for (const resource of motionResources) resource.dispose();
      if (grid) for (const item of [grid.material].flat()) item.dispose();
      if (renderer) { renderer.domElement.removeEventListener("webglcontextlost", onContextLost); renderer.dispose(); renderer.domElement.remove(); }
    };
  }, [url, motionUrl]);

  return <section className="cad-model-viewer" ref={panel} aria-label="交互三维预览">
    <div className="cad-viewer-heading"><h3>三维设计预览</h3><span>拖动查看 · 毫米</span></div>
    <div className="cad-viewport" ref={viewport}>
      {status === "loading" && <p className="cad-viewer-overlay" role="status">正在加载三维模型…</p>}
      {status === "error" && <p className="cad-viewer-overlay cad-viewer-error" role="alert">{error}</p>}
      {status === 'ready' && editProps && <InlineDimensionEditor {...editProps} kind="model" projections={projections} size={viewportSize} onMeasurements={setMeasurements} onInteraction={editInteraction} />}
    </div>
    {status === 'ready' && dimensionControls}
    <div className="cad-viewer-toolbar"><div className="cad-viewer-buttons">
      <button type="button" disabled={status !== "ready"} onClick={() => actions.current?.reset()}>复位视角</button>
      <button type="button" disabled={status !== "ready"} onClick={() => actions.current?.zoom(0.8)}>放大</button>
      <button type="button" disabled={status !== "ready"} onClick={() => actions.current?.zoom(1.25)}>缩小</button>
      <button type="button" disabled={status !== "ready"} aria-pressed={rotating} onClick={() => { const next = !rotating; setRotating(next); actions.current?.rotate(next); }}>自动旋转</button>
      {typeof document !== "undefined" && document.fullscreenEnabled && <button type="button" disabled={status !== "ready"} onClick={() => { const pending = document.fullscreenElement ? document.exitFullscreen() : panel.current.requestFullscreen(); pending.catch(() => setError("浏览器未允许全屏显示。")); }}>全屏</button>}
    </div><span className="cad-viewer-help">拖动旋转 · 滚轮缩放 · 右键平移</span></div>
    {motionStatus === "ready" && <div className="cad-viewer-toolbar" aria-label="机构运动播放">
      <button type="button" disabled={status !== "ready"} aria-pressed={playing} onClick={() => actions.current?.toggleMotion()}>{playing ? "暂停机构运动" : "播放机构运动"}</button>
      <label style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>运动帧
        <input aria-label="机构运动帧" type="range" min="0" max={motionTimes.length - 1} step="1" value={motionFrame}
          disabled={status !== "ready"} style={{ flex: 1 }} onChange={(event) => actions.current?.seekMotion(Number(event.target.value))} />
      </label>
      <span>第 {motionFrame + 1} / {motionTimes.length} 帧 · {(motionTimes[motionFrame] || 0).toFixed(2)} s</span>
    </div>}
    {motionStatus === "ready" && <p className="cad-viewer-help">按原生求解帧播放；尚未进行运动碰撞验收。</p>}
    {motionStatus === "error" && <p role="alert">运动预览不可用：{motionError} 当前显示静态 STL 模型。</p>}
    {status === "ready" && <p className="cad-model-loaded" role="status">模型已加载 · 可旋转、缩放与平移</p>}
    {status === "ready" && <details className="cad-viewer-diagnostics"><summary>显示信息</summary><p>{triangles.toLocaleString()} 个三角面 · 实际导出模型</p></details>}
    {status === "ready" && error && <p role="alert">{error}</p>}
  </section>;
}
