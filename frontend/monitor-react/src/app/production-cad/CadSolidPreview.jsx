import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { cadFileUrl } from "./productionCad.mjs";

export default function CadSolidPreview({ artifact }) {
  const host = useRef(null);
  const [message, setMessage] = useState("正在加载已生成的实体文件…");
  useEffect(() => {
    const container = host.current;
    const abort = new AbortController();
    let renderer, geometry, material, controls, frame, observer;
    setMessage("正在加载已生成的实体文件…");
    async function load() {
      try {
        const response = await fetch(cadFileUrl(artifact.url), { signal: abort.signal, credentials: "same-origin" });
        if (!response.ok) throw new Error("实体文件加载失败");
        const data = await response.arrayBuffer();
        if (abort.signal.aborted) return;
        geometry = new STLLoader().parse(data);
        geometry.computeBoundingSphere();
        geometry.center();
        const radius = geometry.boundingSphere.radius;
        if (!Number.isFinite(radius) || radius <= 0) throw new Error("实体预览文件无有效尺寸");
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0xf1f7f6, 1);
        container.appendChild(renderer.domElement);
        renderer.domElement.setAttribute("aria-label", "由 CAD 实体 STL 文件加载的三维零件");
        const scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(0xffffff, 0x4a635e, 2.4));
        const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(radius * 2, radius * 3, radius * 4); scene.add(light);
        material = new THREE.MeshStandardMaterial({ color: 0x248b80, roughness: 0.4, metalness: 0.35 });
        scene.add(new THREE.Mesh(geometry, material));
        const camera = new THREE.PerspectiveCamera(38, 1, radius / 100, radius * 100);
        camera.up.set(0, 0, 1); camera.position.set(radius * 2.2, -radius * 3, radius * 2);
        controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
        observer = new ResizeObserver(() => {
          const width = container.clientWidth, height = container.clientHeight;
          if (width && height) { renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix(); }
        }); observer.observe(container);
        const animate = () => { controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate); }; animate();
        setMessage("");
      } catch (error) {
        if (!abort.signal.aborted) setMessage(`${error.message}。可查看下方工程视图，或下载 STEP 文件。`);
      }
    }
    load();
    return () => { abort.abort(); cancelAnimationFrame(frame); observer?.disconnect(); controls?.dispose(); geometry?.dispose(); material?.dispose(); renderer?.dispose(); renderer?.domElement.remove(); };
  }, [artifact.url]);
  // React 管理提示，Three.js 独占空容器，避免状态更新清空已挂载画布。
  return <div className="cad-solid-preview"><div className="cad-solid-canvas" ref={host} />{message && <p role="status">{message}</p>}</div>;
}
