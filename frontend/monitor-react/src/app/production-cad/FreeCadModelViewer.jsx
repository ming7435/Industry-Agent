import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function FreeCadModelViewer({ url }) {
  const viewport = useRef(null), panel = useRef(null), actions = useRef(null);
  const [status, setStatus] = useState("loading"), [error, setError] = useState("");
  const [triangles, setTriangles] = useState(0), [rotating, setRotating] = useState(false);

  useEffect(() => {
    const host = viewport.current, abort = new AbortController();
    let renderer, controls, geometry, edges, material, edgeMaterial, grid, observer, frame;
    let disposed = false, contextLost = false;
    setStatus("loading"); setError(""); setRotating(false);
    const onContextLost = (event) => { event.preventDefault(); contextLost = true; setStatus("error"); setError("WebGL 上下文已丢失。请刷新页面恢复三维预览，或下载模型。 "); };
    const initialize = async () => {
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0xf0f5f7);
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
        const size = geometry.boundingBox.getSize(new THREE.Vector3());
        if (![size.x, size.y, size.z].every((value) => Number.isFinite(value) && value > 0)) throw new Error("STL 模型范围无效，无法显示实体。");
        geometry.center(); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
        const radius = geometry.boundingSphere.radius, scene = new THREE.Scene();
        material = new THREE.MeshStandardMaterial({ color: 0x498b98, metalness: 0.3, roughness: 0.4, flatShading: true });
        scene.add(new THREE.Mesh(geometry, material));
        edges = new THREE.EdgesGeometry(geometry, 25);
        edgeMaterial = new THREE.LineBasicMaterial({ color: 0x275260, transparent: true, opacity: 0.45 });
        scene.add(new THREE.LineSegments(edges, edgeMaterial));
        scene.add(new THREE.HemisphereLight(0xffffff, 0x667b85, 2.5));
        const key = new THREE.DirectionalLight(0xffffff, 3.5); key.position.set(radius * 3, radius * 5, radius * 2); scene.add(key);
        const fill = new THREE.DirectionalLight(0xa7cfec, 1.5); fill.position.set(-radius * 3, radius, -radius * 2); scene.add(fill);
        grid = new THREE.GridHelper(radius * 5, 20, 0xaabcc3, 0xd6e0e4); grid.position.y = -size.y / 2 - radius * 0.002; scene.add(grid);
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
        };
        resize(); fit(); observer = new ResizeObserver(resize); observer.observe(host);
        actions.current = { reset: () => controls.reset(), rotate: (value) => { controls.autoRotate = value; }, zoom: (factor) => { const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor); offset.clampLength(controls.minDistance, controls.maxDistance); camera.position.copy(controls.target).add(offset); controls.update(); } };
        const render = () => { if (disposed || contextLost) return; controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(render); };
        render(); setTriangles(positions.count / 3); setStatus("ready");
      } catch (failure) {
        if (disposed || failure.name === "AbortError") return;
        setStatus("error"); setError(renderer ? `STL 模型加载失败：${failure.message}` : "当前浏览器无法启用 WebGL，不能显示三维模型。请启用硬件加速，或下载 STEP / STL 文件查看。");
      }
    };
    initialize();
    return () => {
      disposed = true; abort.abort(); cancelAnimationFrame(frame); observer?.disconnect(); controls?.dispose(); actions.current = null;
      geometry?.dispose(); edges?.dispose(); material?.dispose(); edgeMaterial?.dispose(); grid?.geometry.dispose();
      if (grid) for (const item of [grid.material].flat()) item.dispose();
      if (renderer) { renderer.domElement.removeEventListener("webglcontextlost", onContextLost); renderer.dispose(); renderer.domElement.remove(); }
    };
  }, [url]);

  return <section className="cad-model-viewer" ref={panel} aria-label="交互三维预览">
    <div className="cad-viewer-heading"><h3>交互三维模型</h3><span>FreeCAD 导出的 STL · mm</span></div>
    <div className="cad-viewport" ref={viewport}>
      {status === "loading" && <p className="cad-viewer-overlay" role="status">正在读取 STL 并建立三维视图…</p>}
      {status === "error" && <p className="cad-viewer-overlay cad-viewer-error" role="alert">{error}</p>}
    </div>
    <div className="cad-viewer-toolbar"><div className="cad-viewer-buttons">
      <button type="button" disabled={status !== "ready"} onClick={() => actions.current?.reset()}>复位视角</button>
      <button type="button" disabled={status !== "ready"} onClick={() => actions.current?.zoom(0.8)}>放大</button>
      <button type="button" disabled={status !== "ready"} onClick={() => actions.current?.zoom(1.25)}>缩小</button>
      <button type="button" disabled={status !== "ready"} aria-pressed={rotating} onClick={() => { const next = !rotating; setRotating(next); actions.current?.rotate(next); }}>自动旋转</button>
      {typeof document !== "undefined" && document.fullscreenEnabled && <button type="button" disabled={status !== "ready"} onClick={() => { const pending = document.fullscreenElement ? document.exitFullscreen() : panel.current.requestFullscreen(); pending.catch(() => setError("浏览器未允许全屏显示。")); }}>全屏</button>}
    </div><span className="cad-viewer-help">拖动旋转 · 滚轮缩放 · 右键平移</span></div>
    {status === "ready" && <p className="cad-model-loaded" role="status">模型已加载 · {triangles.toLocaleString()} 个三角面</p>}
    {status === "ready" && error && <p role="alert">{error}</p>}
  </section>;
}
