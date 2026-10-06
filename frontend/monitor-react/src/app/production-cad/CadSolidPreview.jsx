import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { cadFileUrl } from "./productionCad.mjs";

export default function CadSolidPreview({ artifact }) {
  const host = useRef(null), panel = useRef(null), viewer = useRef(null);
  const [message, setMessage] = useState("正在加载已生成的实体文件…");
  const [ready, setReady] = useState(false), [rotating, setRotating] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [view, setView] = useState("iso"), [wireframe, setWireframe] = useState(false);
  const [fullscreen, setFullscreen] = useState(false), [notice, setNotice] = useState("");

  useEffect(() => {
    const changed = () => setFullscreen(document.fullscreenElement === panel.current);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => { viewer.current?.rotate(rotating); }, [rotating]);
  useEffect(() => { viewer.current?.wireframe(wireframe); }, [wireframe]);

  useEffect(() => {
    const container = host.current;
    const abort = new AbortController();
    let renderer, scene, controls, frame, observer, previousFrame;
    const automatic = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReady(false); setLoadFailed(false); setRotating(automatic); setWireframe(false); setView(automatic ? "" : "iso"); setNotice("");
    setMessage("正在加载已生成的实体文件…");
    async function load() {
      try {
        const response = await fetch(cadFileUrl(artifact.url), { signal: abort.signal, credentials: "same-origin" });
        if (!response.ok) throw new Error("实体文件加载失败");
        const data = await response.arrayBuffer();
        if (abort.signal.aborted) return;
        const geometry = new STLLoader().parse(data);
        geometry.center();
        geometry.computeBoundingSphere(); geometry.computeBoundingBox();
        const radius = geometry.boundingSphere.radius;
        if (!Number.isFinite(radius) || radius <= 0) { geometry.dispose(); throw new Error("实体预览文件无有效尺寸"); }
        scene = new THREE.Scene();
        const material = new THREE.MeshStandardMaterial({ color: 0xa6bdce, roughness: 0.48, metalness: 0.18 });
        scene.add(new THREE.Mesh(geometry, material));
        // 轮廓来自真实 STL，只增强观察，不添加或修改零件几何。
        scene.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 35), new THREE.LineBasicMaterial({ color: 0x315267, transparent: true, opacity: 0.55 })));
        scene.add(new THREE.HemisphereLight(0xffffff, 0x8ba3b4, 3));
        const light = new THREE.DirectionalLight(0xffffff, 2.8);
        light.position.set(radius * 2, -radius * 3, radius * 4); scene.add(light);
        const fill = new THREE.DirectionalLight(0xffffff, 1.8);
        fill.position.set(-radius * 3, radius * 2, radius); scene.add(fill);
        const floor = geometry.boundingBox.min.z - radius * 0.04;
        const grid = new THREE.GridHelper(radius * 5, 20, 0xabc2cd, 0xd5e1e7);
        grid.rotation.x = Math.PI / 2; grid.position.z = floor;
        grid.material.transparent = true; grid.material.opacity = 0.6; grid.material.depthWrite = false; scene.add(grid);
        const axes = new THREE.AxesHelper(radius * 0.9);
        axes.position.set(-radius * 1.4, -radius * 1.4, floor); scene.add(axes);
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0xf2f6fa, 1);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.appendChild(renderer.domElement);
        renderer.domElement.setAttribute("aria-label", "由 CAD 实体 STL 文件加载的三维零件");
        const camera = new THREE.PerspectiveCamera(38, 1, radius / 100, radius * 100);
        camera.up.set(0, 0, 1); camera.position.set(radius * 2.2, -radius * 3, radius * 2);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true; controls.dampingFactor = 0.08;
        controls.minDistance = radius * 1.3; controls.maxDistance = radius * 12;
        controls.autoRotate = automatic; controls.autoRotateSpeed = 1.4;
        const rotate = (value) => {
          controls.autoRotate = value;
          // 暂停时清除旋转惯性，避免点击暂停后仍缓慢移动。
          if (!value) { controls.enableDamping = false; controls.update(); controls.enableDamping = true; }
        };
        controls.addEventListener("start", () => { rotate(false); setRotating(false); setView(""); });
        viewer.current = {
          rotate,
          wireframe: (value) => { material.wireframe = value; },
          view: (name) => {
            rotate(false); controls.target.set(0, 0, 0);
            // Z 向上；俯视保留极小偏移，避开相机上方向与视线平行的奇点。
            const directions = { iso: [2.2, -3, 2], front: [0, -4, 0], side: [4, 0, 0], top: [0, -0.001, 4] };
            camera.position.set(...directions[name]).multiplyScalar(radius);
            controls.enableDamping = false; controls.update(); controls.enableDamping = true;
          },
          zoom: (factor) => {
            rotate(false);
            const offset = camera.position.clone().sub(controls.target);
            const distance = Math.max(controls.minDistance, Math.min(controls.maxDistance, offset.length() * factor));
            camera.position.copy(controls.target).add(offset.setLength(distance)); controls.update();
          },
        };
        const resize = () => {
          const width = container.clientWidth, height = container.clientHeight;
          if (width && height) { renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); }
        };
        resize(); observer = new ResizeObserver(resize); observer.observe(container);
        const animate = (time) => {
          const delta = previousFrame == null ? 0 : Math.min((time - previousFrame) / 1000, 0.1);
          previousFrame = time; controls.update(delta); renderer.render(scene, camera); frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        setMessage(""); setReady(true);
      } catch (error) {
        if (!abort.signal.aborted) {
          setLoadFailed(true);
          setMessage(`${error.message}。可查看下方工程视图，或下载 STEP 文件。`);
        }
      }
    }
    load();
    return () => {
      abort.abort(); viewer.current = null; cancelAnimationFrame(frame); observer?.disconnect(); controls?.dispose();
      const geometries = new Set(), materials = new Set();
      scene?.traverse((object) => { if (object.geometry) geometries.add(object.geometry); for (const value of [].concat(object.material || [])) materials.add(value); });
      geometries.forEach((value) => value.dispose()); materials.forEach((value) => value.dispose());
      renderer?.dispose(); renderer?.domElement.remove();
    };
  }, [artifact.url]);
  function toggleRotation() { const next = !rotating; setRotating(next); if (next) setView(""); }
  function selectView(name) { setRotating(false); setView(name); viewer.current?.view(name); }
  function zoom(factor) { setRotating(false); viewer.current?.zoom(factor); }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === panel.current) await document.exitFullscreen();
      else await panel.current.requestFullscreen();
      setNotice("");
    } catch { setNotice("浏览器未允许全屏，仍可在当前区域旋转与缩放。"); }
  }
  // React 管理提示，Three.js 独占空容器，避免状态更新清空已挂载画布。
  return <div className="cad-solid-preview" ref={panel}>
    <div className="cad-preview-toolbar" role="toolbar" aria-label="3D 模型交互控制">
      <span className="cad-preview-label">交互式 3D · {ready ? rotating ? "自动旋转中" : "已暂停，可拖动" : loadFailed ? "预览暂不可用" : "正在加载"}</span>
      <button type="button" disabled={!ready} aria-pressed={rotating} onClick={toggleRotation}>{rotating ? "暂停旋转" : "开始旋转"}</button>
      {[["iso", "等轴"], ["front", "主视"], ["top", "俯视"], ["side", "侧视"]].map(([name, label]) => <button type="button" key={name} disabled={!ready} aria-pressed={view === name} onClick={() => selectView(name)}>{label}</button>)}
      <button type="button" disabled={!ready} onClick={() => zoom(0.8)}>放大</button>
      <button type="button" disabled={!ready} onClick={() => zoom(1.25)}>缩小</button>
      <button type="button" disabled={!ready} aria-pressed={wireframe} onClick={() => setWireframe((value) => !value)}>线框</button>
      <button type="button" disabled={!ready} onClick={() => selectView("iso")}>重置视角</button>
      <button type="button" disabled={!ready} onClick={toggleFullscreen}>{fullscreen ? "退出全屏" : "全屏"}</button>
    </div>
    <div className="cad-preview-viewport"><div className="cad-solid-canvas" ref={host} />
      {message && <p className="cad-preview-message" role="status">{message}</p>}
      {ready && <div className="cad-preview-hint">左键拖动旋转 · 滚轮缩放 · 右键拖动平移<span><i className="axis-x">X</i><i className="axis-y">Y</i><i className="axis-z">Z</i>真实 STL 实体</span></div>}
    </div>
    {notice && <p role="status">{notice}</p>}
  </div>;
}
