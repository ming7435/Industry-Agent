import React, {useEffect, useMemo, useRef, useState} from "react";
import * as THREE from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {createEquator300} from "./equator300.js";
import {createMotionClock, getMachineMotionState, machineStatus, machineStatusLabel} from "./workshopMotion.mjs";

const ROBOT_CYCLE_SECONDS = 4;
const VISION_CAMERA_ID = "HIKROBOT-MV-CU060-10GM-001";

// 世界坐标中的工位；分拣箱位于检测侧辅助机械臂的工作范围内。
const workshopLayout = Object.freeze({
  robot: [5.8, -.15],
  pickup: [4.7, 1.12],
  inspection: [7.6, 1],
  qualified: [8.45, 3.25],
  rework: [6.75, 3.1],
  robotReach: 2.22,
});

export default function Machine3DScene({ machines = [], motion, selectedMachineId, status, viewMode, onSelect }) {
  const mountRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const machinesRef = useRef(machines);
  const motionRef = useRef(motion);
  const motionClockRef = useRef(null);
  if (!motionClockRef.current) motionClockRef.current = createMotionClock();
  const applyViewRef = useRef(null);
  const viewModeRef = useRef(viewMode || "iso");
  const selectedMachineIdRef = useRef(selectedMachineId);
  const updateSelectionRef = useRef(null);
  const hoverTimerRef = useRef(null);
  const hoveredMachineRef = useRef(null);
  const [hoveredLabel, setHoveredLabel] = useState(null);
  const sceneMachineState = useMemo(
    () => machines.map((machine) => machine.id).join("|"),
    [machines],
  );

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    machinesRef.current = machines;
    updateSelectionRef.current?.(selectedMachineIdRef.current);
  }, [machines]);
  useEffect(() => { motionRef.current = motion; }, [motion]);
  useEffect(() => {
    viewModeRef.current = viewMode || "iso";
    applyViewRef.current?.(viewModeRef.current);
  }, [viewMode]);
  useEffect(() => {
    selectedMachineIdRef.current = selectedMachineId;
    updateSelectionRef.current?.(selectedMachineId);
  }, [selectedMachineId]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xf3f6f4, 14, 52);

    const camera = new THREE.PerspectiveCamera(39, mount.clientWidth / mount.clientHeight, 0.1, 100);
    const compactScene = mount.clientWidth < 600;
    if (compactScene) {
      camera.fov = 55;
      camera.updateProjectionMatrix();
    }
    camera.position.set(compactScene ? 13 : 10.4, compactScene ? 12 : 5.7, compactScene ? 40 : 13.7);
    camera.lookAt(1.3, .75, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compactScene ? 1.25 : 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(1.3, .75, 0);
    controls.enableDamping = true;
    controls.dampingFactor = .08;
    controls.minDistance = 6.2;
    controls.maxDistance = compactScene ? 55 : 22;
    controls.minPolarAngle = Math.PI * .16;
    controls.maxPolarAngle = Math.PI * .49;
    controls.enablePan = true;
    controls.panSpeed = .55;
    controls.rotateSpeed = .55;
    controls.zoomSpeed = .72;
    const applyCameraView = (mode) => {
      if (mode === "top") {
        camera.position.set(1.3, compactScene ? 33 : 18, .1);
        controls.target.set(1.3, 0, -.2);
        controls.enableRotate = false;
      } else if (mode === "line") {
        camera.position.set(compactScene ? 7 : 3.8, compactScene ? 10 : 4.5, compactScene ? 40 : 17);
        controls.target.set(1.3, .55, .2);
        controls.enableRotate = true;
      } else {
        camera.position.set(compactScene ? 13 : 10.4, compactScene ? 12 : 5.7, compactScene ? 40 : 13.7);
        controls.target.set(1.3, .75, 0);
        controls.enableRotate = true;
      }
      camera.lookAt(controls.target);
      controls.update();
    };
    applyViewRef.current = applyCameraView;
    applyCameraView(viewModeRef.current);

    const machineById = new Map(machinesRef.current.map((machine) => [machine.id, machine]));
    const getCurrentMachine = (id) => machinesRef.current.find((machine) => machine.id === id);
    const currentStatusForMachine = (id) => {
      const machine = getCurrentMachine(id);
      return machineStatus(machine, machine?.result);
    };
    const statusForMachine = (id) => machineStatus(machineById.get(id), machineById.get(id)?.result);
    const colorForMachine = (id) => statusColor(statusForMachine(id));
    const selectionEffects = [];
    const machineHalos = [];
    const statusMaterials = [];
    const isSelectedMachine = (id) => id === selectedMachineIdRef.current;
    const updateSelection = (id) => {
      machineHalos.forEach(({ machineId, ring }) => {
        const current = currentStatusForMachine(machineId);
        const alert = ["fault", "alarm", "warning"].includes(current);
        const color = current === "fault" ? 0xe13b35 : current === "alarm" ? 0xd27a12 : current === "warning" ? 0xe0a229 : 0x14aa72;
        ring.visible = alert || machineId === id;
        ring.material.color.setHex(alert ? color : 0x14aa72);
        ring.material.emissive.setHex(alert ? color : 0x14aa72);
      });
      selectionEffects.forEach(({ machineId, material, selectedValue, defaultValue, property }) => {
        material[property] = machineId === id ? selectedValue : defaultValue;
      });
      statusMaterials.forEach(({ machineId, material }) => {
        const color = statusColor(currentStatusForMachine(machineId));
        material.color.setHex(color);
        material.emissive.setHex(color);
      });
    };
    updateSelectionRef.current = updateSelection;
    const isAlertStatus = (localStatus) => {
      return localStatus === "fault" || localStatus === "alarm" || localStatus === "warning";
    };
    const labelForMachine = (id) => {
      if (id === "EQUATOR300-VISUAL") {
        const simulatedMachine = getCurrentMachine("RENISHAW-EQUATOR300-001");
        const localStatus = machineStatus(simulatedMachine, simulatedMachine?.result);
        return {
          id,
          name: "Renishaw Equator 300",
          type: "模拟工厂质检工位 · 动画仅示意",
          status: localStatus,
          statusLabel: simulatedMachine ? machineStatusLabel(localStatus) : "无设备数据",
        };
      }
      const machine = getCurrentMachine(id);
      if (!machine) return null;
      const localStatus = currentStatusForMachine(id);
      return {
        id,
        name: machine.name || id,
        type: machine.type || "设备",
        status: localStatus,
        statusLabel: machineStatusLabel(localStatus),
      };
    };
    const accent = statusColor(status);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0xd9ddde, roughness: .63, metalness: .03 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xd7dedf, roughness: .8, metalness: .04, side: THREE.DoubleSide });
    const safetyMat = new THREE.MeshStandardMaterial({ color: 0xd9a21b, roughness: .58, metalness: .04 });
    const conveyorMat = new THREE.MeshStandardMaterial({ color: 0x405057, roughness: .6, metalness: .18 });
    const conveyorEdgeMat = new THREE.MeshStandardMaterial({ color: 0x687b80, roughness: .4, metalness: .5 });
    const blockMat = new THREE.MeshStandardMaterial({ color: 0x647177, roughness: .72, metalness: .08 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2b3338, roughness: .75, metalness: .05 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc9d1d3, roughness: .43, metalness: .25 });
    const solidBodyMat = new THREE.MeshStandardMaterial({ color: 0x859399, roughness: .46, metalness: .32 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x22272d, roughness: .7, metalness: .2, transparent: true, opacity: .86 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xb9bec2, roughness: .55, metalness: .12, transparent: true, opacity: .68 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x71969c, roughness: .12, metalness: .04, transparent: true, opacity: .35, side: THREE.DoubleSide, depthWrite: false });
    const accentMat = new THREE.MeshStandardMaterial({ color: accent, roughness: .42, metalness: .12, emissive: accent, emissiveIntensity: .08 });
    statusMaterials.push({ machineId: "TRAK-TC820LTYSI-001", material: accentMat });
    const innerMat = new THREE.MeshStandardMaterial({ color: 0x95a0a5, roughness: .52, metalness: .28 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x49545a, roughness: .36, metalness: .45 });
    const rawMat = new THREE.MeshStandardMaterial({ color: 0xb7822a, roughness: .42, metalness: .22, emissive: 0x3a2300, emissiveIntensity: .05 });
    const cutMetalMat = new THREE.MeshStandardMaterial({ color: 0xcbd2d7, roughness: .32, metalness: .72 });
    const cutterMat = new THREE.MeshStandardMaterial({ color: 0x425059, roughness: .28, metalness: .78 });
    const chipMat = new THREE.MeshStandardMaterial({ color: 0xc3c9c9, roughness: .3, metalness: .82 });
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x263238, transparent: true, opacity: .42 });
    const hitMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .001, depthWrite: false });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const interactiveObjects = [];
    const alertEffects = [];

    const registerMachineObject = (root, id, hitTarget) => {
      root.userData.machineId = id;
      root.traverse((object) => {
        object.userData.machineId = id;
      });
      if (hitTarget) interactiveObjects.push(hitTarget);
      return root;
    };

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.36;
    // 不透明墙面/顶棚的阴影投射会在环氧地面上形成很大的三角形斑块。
    floor.receiveShadow = false;
    scene.add(floor);

    const addSceneBox = (size, position, material, rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow = !material.transparent && size[1] > .05;
      mesh.receiveShadow = material !== wallMat && !material.transparent;
      scene.add(mesh);
      return mesh;
    };

    addSceneBox([26, 2.6, .08], [0, .92, -7.2], wallMat);
    addSceneBox([.08, 2.25, 12.5], [-12.3, .78, -.6], wallMat);
    addSceneBox([.08, 2.25, 12.5], [12.3, .78, -.6], wallMat);
    addSceneBox([24, .08, .12], [0, 2.32, -6.95], roofMat);
    addSceneBox([.12, .08, 12], [-11.5, 2.16, -.8], roofMat);
    addSceneBox([.12, .08, 12], [11.5, 2.16, -.8], roofMat);

    // 使用略微抬高并带边缘收口的工业地面标线，避免与地面共面产生闪烁。
    const lineEdgeMat = new THREE.MeshStandardMaterial({ color: 0x707875, roughness: .78 });
    const addFloorLine = (size, position, paint) => {
      addSceneBox([size[0] + .035, .017, size[2] + .035], [position[0], -.332, position[2]], lineEdgeMat);
      addSceneBox([size[0], .019, size[2]], [position[0], -.313, position[2]], paint);
    };
    addFloorLine([6.8, 0, .075], [0, 0, 2], safetyMat);
    addFloorLine([6.8, 0, .075], [0, 0, -1.95], safetyMat);
    addFloorLine([.075, 0, 3.95], [-3.4, 0, .02], safetyMat);
    addFloorLine([.075, 0, 3.95], [3.4, 0, .02], safetyMat);
    const aisleMat = new THREE.MeshStandardMaterial({ color: 0xf4f4ed, roughness: .7 });
    addFloorLine([17, 0, .045], [0, 0, 2.52], aisleMat);
    addFloorLine([17, 0, .045], [0, 0, 3.92], aisleMat);

    const addConveyor = (size, position, rotation = [0, 0, 0], edgeNormal = new THREE.Vector3(0, 0, 1)) => {
      addSceneBox(size, position, conveyorMat, rotation);
      addSceneBox(
        [size[0], .035, .08],
        [position[0] - edgeNormal.x * size[2] / 2, position[1] + .06, position[2] - edgeNormal.z * size[2] / 2],
        conveyorEdgeMat,
        rotation,
      );
      addSceneBox(
        [size[0], .035, .08],
        [position[0] + edgeNormal.x * size[2] / 2, position[1] + .06, position[2] + edgeNormal.z * size[2] / 2],
        conveyorEdgeMat,
        rotation,
      );
    };

    const conveyorRollers = [];
    const conveyorFlights = [];
    const yAxis = new THREE.Vector3(0, 1, 0);
    const addConveyorSegment = (start, end, width = .52, flightCount = 6) => {
      const from = new THREE.Vector3(start[0], -.08, start[1]);
      const to = new THREE.Vector3(end[0], -.08, end[1]);
      const delta = new THREE.Vector3().subVectors(to, from);
      const length = delta.length();
      const center = new THREE.Vector3().addVectors(from, to).multiplyScalar(.5);
      const yaw = Math.atan2(delta.x, delta.z);
      const rotation = [0, yaw - Math.PI / 2, 0];

      const direction = delta.clone().normalize();
      const normal = new THREE.Vector3(-direction.z, 0, direction.x);
      addConveyor([length, .13, width], [center.x, center.y, center.z], rotation, normal);
      const rollerCount = Math.max(3, Math.round(length / .27));
      for (let index = 0; index <= rollerCount; index += 1) {
        const t = index / rollerCount;
        const point = from.clone().lerp(to, t);
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, width + .1, 16), railMat);
        roller.position.set(point.x, .03, point.z);
        roller.quaternion.setFromUnitVectors(yAxis, normal);
        scene.add(roller);
        conveyorRollers.push(roller);
      }

      for (let index = 0; index < flightCount; index += 1) {
        const flight = new THREE.Mesh(new THREE.BoxGeometry(.08, .035, width + .06), railMat);
        flight.userData.offset = index / flightCount;
        flight.quaternion.setFromAxisAngle(yAxis, yaw - Math.PI / 2);
        flight.castShadow = true;
        scene.add(flight);
        conveyorFlights.push({ mesh: flight, start: from, end: to });
      }
    };

    // 原料进入送料机；加工件沿出料线到机械臂，再送 Equator300 检测。
    addConveyorSegment([-5.68, 2.45], [-5.68, .72], .55, 0);
    addConveyorSegment([2.45, 1.12], [4.85, 1.12], .55, 0);

    // 出料滚筒上的视觉检测点：立柱在输送线后侧，镜头正对工件经过的中心线。
    const industrialCamera = new THREE.Group();
    industrialCamera.name = "industrial-camera";
    industrialCamera.userData.visualOnly = true;
    industrialCamera.position.set(3.75, 0, 0);
    scene.add(industrialCamera);
    const cameraFrameMat = new THREE.MeshStandardMaterial({ color: 0x849399, roughness: .38, metalness: .65 });
    const cameraMountMat = new THREE.MeshStandardMaterial({ color: 0x303b41, roughness: .43, metalness: .52 });
    const cameraBodyMat = new THREE.MeshStandardMaterial({ color: 0x222a30, roughness: .35, metalness: .38 });
    const cameraLensMat = new THREE.MeshStandardMaterial({ color: 0x142b39, roughness: .1, metalness: .45, emissive: 0x0b3b50, emissiveIntensity: .18 });
    const cameraIndicatorMat = new THREE.MeshStandardMaterial({ color: 0x20b986, emissive: 0x20b986, emissiveIntensity: .65 });
    const cameraLightMat = new THREE.MeshStandardMaterial({ color: 0xe6eee9, emissive: 0xd1f0df, emissiveIntensity: .48 });
    const addCameraBox = (name, size, position, material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      industrialCamera.add(mesh);
      return mesh;
    };
    addCameraBox("camera-foot", [.34, .06, .34], [0, -.29, .5], cameraMountMat);
    addCameraBox("camera-post", [.085, 1.62, .085], [0, .51, .5], cameraFrameMat);
    addCameraBox("camera-crossbar", [.085, .085, .64], [0, 1.28, .86], cameraMountMat);
    addCameraBox("camera-mount", [.18, .08, .18], [0, 1.23, 1.12], cameraMountMat);
    addCameraBox("camera-housing", [.36, .27, .32], [0, 1.05, 1.12], cameraBodyMat);
    addCameraBox("camera-status", [.12, .025, .025], [0, 1.11, 1.293], cameraIndicatorMat);
    const lensBarrel = new THREE.Mesh(new THREE.CylinderGeometry(.105, .115, .17, 24), cameraMountMat);
    lensBarrel.name = "camera-lens-barrel";
    lensBarrel.position.set(0, .83, 1.12);
    lensBarrel.castShadow = true;
    industrialCamera.add(lensBarrel);
    const lensGlass = new THREE.Mesh(new THREE.CylinderGeometry(.078, .078, .012, 24), cameraLensMat);
    lensGlass.name = "camera-lens-glass";
    lensGlass.position.set(0, .738, 1.12);
    industrialCamera.add(lensGlass);
    const ringLight = new THREE.Mesh(new THREE.TorusGeometry(.17, .034, 10, 32), cameraMountMat);
    ringLight.name = "camera-ring-light";
    ringLight.rotation.x = Math.PI / 2;
    ringLight.position.set(0, .7, 1.12);
    ringLight.castShadow = true;
    industrialCamera.add(ringLight);
    const ringDiffuser = new THREE.Mesh(new THREE.TorusGeometry(.17, .013, 8, 32), cameraLightMat);
    ringDiffuser.name = "camera-ring-diffuser";
    ringDiffuser.rotation.x = Math.PI / 2;
    ringDiffuser.position.set(0, .685, 1.12);
    industrialCamera.add(ringDiffuser);

    // 照片中的台式视觉检测架：显示屏、立柱相机、环形光和棋盘格标定板。
    const tabletopVision = new THREE.Group();
    tabletopVision.name = "tabletop-vision-station";
    tabletopVision.position.set(-2.2, -.35, 4.75);
    tabletopVision.rotation.y = .12;
    scene.add(tabletopVision);
    const visionTableMat = new THREE.MeshStandardMaterial({ color: 0x68767b, roughness: .54, metalness: .32 });
    const visionBaseMat = new THREE.MeshStandardMaterial({ color: 0x20262b, roughness: .68, metalness: .19 });
    const visionBodyMat = new THREE.MeshStandardMaterial({ color: 0x11171c, roughness: .36, metalness: .3 });
    const visionPostMat = new THREE.MeshStandardMaterial({ color: 0xbac4c8, roughness: .27, metalness: .7 });
    const visionLightMat = new THREE.MeshStandardMaterial({ color: 0xe8eee7, emissive: 0xcfe6d5, emissiveIntensity: .65 });
    const visionLensMat = new THREE.MeshStandardMaterial({ color: 0x172f3a, roughness: .1, metalness: .38, emissive: 0x0d3645, emissiveIntensity: .18 });
    const addVisionPart = (name, geometry, material, position, parent = tabletopVision) => {
      const part = new THREE.Mesh(geometry, material);
      part.name = name;
      part.position.set(...position);
      part.castShadow = true;
      part.receiveShadow = true;
      parent.add(part);
      return part;
    };
    const visionBox = (name, size, position, material, parent) =>
      addVisionPart(name, new THREE.BoxGeometry(...size), material, position, parent);
    visionBox("vision-workbench-top", [2.35, .1, 1.25], [0, .75, 0], visionTableMat);
    for (const x of [-1.02, 1.02]) {
      for (const z of [-.47, .47]) visionBox("vision-workbench-leg", [.11, .69, .11], [x, .36, z], visionTableMat);
    }
    visionBox("vision-workbench-brace", [2.1, .08, .08], [0, .2, -.43], visionBaseMat);
    visionBox("vision-optical-base", [1.13, .055, .9], [-.23, .835, .2], visionBaseMat);

    const checkerCanvas = document.createElement("canvas");
    checkerCanvas.width = 256;
    checkerCanvas.height = 256;
    const checkerContext = checkerCanvas.getContext("2d");
    checkerContext.fillStyle = "#e9eeed";
    checkerContext.fillRect(0, 0, 256, 256);
    for (let row = 0; row < 16; row += 1) {
      for (let column = 0; column < 16; column += 1) {
        if ((row + column) % 2 === 0) {
          checkerContext.fillStyle = "#182026";
          checkerContext.fillRect(column * 14 + 16, row * 14 + 16, 14, 14);
        }
      }
    }
    const checkerTexture = new THREE.CanvasTexture(checkerCanvas);
    checkerTexture.colorSpace = THREE.SRGBColorSpace;
    visionBox("vision-calibration-plate", [.75, .022, .75], [-.48, .876, .25], visionPostMat);
    const checkerboard = addVisionPart("vision-checkerboard", new THREE.PlaneGeometry(.69, .69),
      new THREE.MeshBasicMaterial({ map: checkerTexture, side: THREE.DoubleSide }), [-.48, .891, .25]);
    checkerboard.rotation.x = -Math.PI / 2;

    const monitorCanvas = document.createElement("canvas");
    monitorCanvas.width = 512;
    monitorCanvas.height = 300;
    const monitorContext = monitorCanvas.getContext("2d");
    const drawVisionMonitor = (cameraReady, fps, samplePresent, scanning) => {
      monitorContext.fillStyle = "#e7eeef";
      monitorContext.fillRect(0, 0, 512, 300);
      monitorContext.fillStyle = "#20343d";
      monitorContext.fillRect(0, 0, 512, 38);
      monitorContext.fillStyle = "#e5f4ee";
      monitorContext.font = "bold 17px sans-serif";
      monitorContext.fillText("VISION SAMPLE STATION", 17, 26);
      const rows = [
        ["CAMERA", cameraReady ? "ACQUIRING" : "NO LIVE IMAGE"],
        ["FRAME RATE", cameraReady && Number.isFinite(fps) ? `${fps.toFixed(1)} fps` : "--"],
        ["SAMPLE", scanning ? "CAPTURE DEMO" : samplePresent ? "ON STAGE" : "WAITING"],
        ["QUALITY RESULT", "REQUIRES IMAGE REVIEW"],
      ];
      rows.forEach(([label, value], index) => {
        const y = 58 + index * 57;
        monitorContext.fillStyle = index % 2 ? "#d6e2e2" : "#f6f9f8";
        monitorContext.fillRect(14, y, 484, 50);
        monitorContext.fillStyle = "#4a5e64";
        monitorContext.font = "bold 15px sans-serif";
        monitorContext.fillText(label, 29, y + 20);
        monitorContext.fillStyle = scanning && index === 2 ? "#087f75" : "#1c3037";
        monitorContext.font = "bold 17px sans-serif";
        monitorContext.fillText(value, 205, y + 31);
      });
    };
    drawVisionMonitor(false, NaN, false, false);
    let lastVisionMonitorState = "";
    const monitorTexture = new THREE.CanvasTexture(monitorCanvas);
    monitorTexture.colorSpace = THREE.SRGBColorSpace;
    visionBox("vision-monitor-frame", [1.42, .9, .085], [-.4, 1.43, -.42], visionBodyMat);
    addVisionPart("vision-monitor-screen", new THREE.PlaneGeometry(1.31, .79),
      new THREE.MeshBasicMaterial({ map: monitorTexture }), [-.4, 1.43, -.371]);
    visionBox("vision-monitor-neck", [.1, .33, .1], [-.4, .85, -.44], visionPostMat);
    visionBox("vision-monitor-foot", [.48, .035, .3], [-.4, .822, -.44], visionBaseMat);

    addVisionPart("vision-column-foot", new THREE.CylinderGeometry(.18, .2, .08, 32), visionBaseMat, [.55, .91, .24]);
    addVisionPart("vision-column", new THREE.CylinderGeometry(.075, .075, 1.14, 32), visionPostMat, [.55, 1.47, .24]);
    visionBox("vision-column-clamp", [.27, .28, .25], [.55, 1.58, .24], visionBodyMat);
    visionBox("vision-camera-crossarm", [.88, .1, .13], [.13, 1.6, .24], visionBodyMat);
    visionBox("vision-camera-body", [.57, .3, .37], [-.38, 1.51, .24], visionBodyMat);
    addVisionPart("vision-lens-barrel", new THREE.CylinderGeometry(.105, .13, .22, 28), visionBodyMat, [-.43, 1.26, .24]);
    addVisionPart("vision-lens-glass", new THREE.CylinderGeometry(.085, .085, .016, 28), visionLensMat, [-.43, 1.14, .24]);
    const benchRing = addVisionPart("vision-ring-light", new THREE.TorusGeometry(.22, .058, 12, 36), visionBaseMat, [-.43, 1.13, .24]);
    benchRing.rotation.x = Math.PI / 2;
    const benchDiffuser = addVisionPart("vision-ring-diffuser", new THREE.TorusGeometry(.2, .014, 8, 36), visionLightMat, [-.43, 1.118, .24]);
    benchDiffuser.rotation.x = Math.PI / 2;
    const visionCaptureBeam = addVisionPart("vision-capture-beam", new THREE.CylinderGeometry(.16, .13, .2, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x57e0b1, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide }), [-.43, 1.01, .24]);
    visionCaptureBeam.visible = false;
    visionBox("vision-camera-indicator", [.08, .03, .012], [-.58, 1.57, .431], cameraIndicatorMat);
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-.17, 1.67, .21), new THREE.Vector3(.04, 2.02, .21),
      new THREE.Vector3(.48, 2.05, .22), new THREE.Vector3(.57, 1.82, .24),
    ]);
    addVisionPart("vision-camera-cable", new THREE.TubeGeometry(cableCurve, 24, .026, 8, false), visionBaseMat, [0, 0, 0]);
    const visionHitBox = visionBox("vision-station-hitbox", [2.45, 2.15, 1.36], [0, 1.05, 0], hitMat);
    registerMachineObject(tabletopVision, VISION_CAMERA_ID, visionHitBox);
    statusMaterials.push({ machineId: VISION_CAMERA_ID, material: cameraIndicatorMat });

    addSceneBox([1.45, .42, .75], [-6.15, -.08, -6.15], blockMat);
    addSceneBox([1.55, .13, .85], [-6.15, .22, -6.15], roofMat);
    addSceneBox([1.35, .38, .72], [6.05, -.08, -6.15], blockMat);
    addSceneBox([1.45, .12, .82], [6.05, .18, -6.15], roofMat);
    const fenceFrameMat = new THREE.MeshStandardMaterial({ color: 0x596970, roughness: .46, metalness: .55 });
    const fenceGlassMat = new THREE.MeshStandardMaterial({ color: 0x9bbfc4, roughness: .18, transparent: true, opacity: .24, depthWrite: false, side: THREE.DoubleSide });
    for (const x of [-3.25, -1.65, -.05, 1.55, 3.15]) {
      addSceneBox([.065, 1.22, .065], [x, .31, -2.25], fenceFrameMat);
      addSceneBox([.16, .035, .16], [x, -.32, -2.25], fenceFrameMat);
    }
    for (let i = 0; i < 3; i += 1) {
      const x = -2.45 + i * 1.6;
      addSceneBox([1.49, 1.06, .018], [x, .32, -2.25], fenceGlassMat);
      addSceneBox([1.54, .04, .06], [x, .89, -2.25], fenceFrameMat);
      addSceneBox([1.54, .04, .06], [x, -.25, -2.25], fenceFrameMat);
    }
    // 带边框的亚克力安全门，包含铰链、把手和顶部导轨。
    addSceneBox([1.49, 1.06, .018], [2.35, .32, -2.25], fenceGlassMat);
    addSceneBox([1.52, .045, .07], [2.35, .89, -2.25], fenceFrameMat);
    addSceneBox([1.52, .045, .07], [2.35, -.25, -2.25], fenceFrameMat);
    addSceneBox([.05, 1.14, .07], [1.59, .32, -2.25], fenceFrameMat);
    addSceneBox([.05, 1.14, .07], [3.11, .32, -2.25], fenceFrameMat);
    for (const y of [.02, .66]) addSceneBox([.09, .11, .12], [1.59, y, -2.17], railMat);
    addSceneBox([.035, .25, .09], [2.96, .28, -2.14], railMat);
    addSceneBox([6.48, .045, .07], [-.05, .94, -2.25], fenceFrameMat);
    for (const x of [-8.9, 8.9]) {
      const z = -6.35;
      addSceneBox([.85, 1.65, .62], [x, .5, z], solidBodyMat);
      addSceneBox([.62, .35, .025], [x, .95, z + .33], darkMat);
      addSceneBox([.08, .2, .05], [x + .32, .45, z + .34], railMat);
      for (let i = 0; i < 5; i += 1) addSceneBox([.48, .014, .015], [x, .15 + i * .055, z + .33], railMat);
      for (const footX of [-.3, .3]) addSceneBox([.1, .08, .1], [x + footX, -.32, z], railMat);
    }

    for (let index = 0; index < 10; index += 1) {
      const x = index % 2 === 0 ? -10.8 : 10.8;
      const z = -5.7 + Math.floor(index / 2) * 2.8;
      const column = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, 2.6, 12), blockMat);
      column.position.set(x, .92, z);
      column.castShadow = true;
      scene.add(column);
    }

    const addMachineHalo = (id, position, radius = 1.45) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, .035, 8, 64),
        new THREE.MeshStandardMaterial({
          color: 0x14aa72,
          emissive: 0x14aa72,
          emissiveIntensity: .35,
          transparent: true,
          opacity: .9,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(position[0], -.28, position[2]);
      ring.visible = false;
      scene.add(ring);
      machineHalos.push({ machineId: id, ring });
      return ring;
    };

    const addMachineAlert = (id, position) => {
      const glow = new THREE.PointLight(0xff2525, 0, 4.8);
      glow.position.set(position[0], 1.05, position[2]);
      scene.add(glow);
      alertEffects.push({ id, glow });
      return glow;
    };

    const towerLamps = [];
    const addTowerLamp = (id, x, y, z) => {
      addSceneBox([.08, .28, .08], [x, y - .16, z], railMat);
      const lamps = [0xb83436, 0xe6a729, 0x36977f].map((color, index) => {
        const material = new THREE.MeshStandardMaterial({ color, roughness: .3, emissive: color, emissiveIntensity: .06 });
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(.083, .083, .09, 20), material);
        lens.position.set(x, y + index * .095, z);
        scene.add(lens);
        return material;
      });
      towerLamps.push({ id, lamps });
    };

    const addBarFeeder = () => {
      const id = "LNS-QL-SERVO-80-S2-001";
      const color = colorForMachine(id);
      const accentLocal = new THREE.MeshStandardMaterial({ color, roughness: .4, metalness: .12, emissive: color, emissiveIntensity: isSelectedMachine(id) ? .16 : .05 });
      statusMaterials.push({ machineId: id, material: accentLocal });
      selectionEffects.push({ machineId: id, material: accentLocal, property: "emissiveIntensity", selectedValue: .16, defaultValue: .05 });
      const feederWhiteMat = new THREE.MeshStandardMaterial({ color: 0xe6e9ec, roughness: .56, metalness: .08 });
      const feederPanelMat = new THREE.MeshStandardMaterial({ color: 0xcfd5d8, roughness: .5, metalness: .12 });
      const feederGlassMat = new THREE.MeshStandardMaterial({ color: 0x9eb9c0, roughness: .2, metalness: .04, transparent: true, opacity: .42, side: THREE.DoubleSide });
      const feederGroup = new THREE.Group();
      const feederRollers = [];
      feederGroup.position.set(-4.15, .12, .13);
      feederGroup.rotation.y = 0;
      feederGroup.scale.set(.86, .86, .86);
      scene.add(feederGroup);
      addMachineHalo(id, [feederGroup.position.x, feederGroup.position.y, feederGroup.position.z], 1.5);
      addMachineAlert(id, [feederGroup.position.x, feederGroup.position.y, feederGroup.position.z]);
      addTowerLamp(id, -3.9, 1.7, .1);

      const addFeederBox = (size, position, material, rotation = [0, 0, 0]) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        feederGroup.add(mesh);
        return mesh;
      };

      const addFeederCylinder = (radius, length, position, material, rotation = [0, 0, 0], segments = 24) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        feederGroup.add(mesh);
        return mesh;
      };

      const addTubeBetween = (start, end, radius, material) => {
        const from = new THREE.Vector3(...start);
        const to = new THREE.Vector3(...end);
        const direction = new THREE.Vector3().subVectors(to, from);
        const length = direction.length();
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 16), material);
        mesh.position.copy(from.add(to).multiplyScalar(.5));
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        feederGroup.add(mesh);
        return mesh;
      };

      addFeederBox([4.3, .08, 1.08], [0, .06, 0], railMat);
      addFeederBox([4.05, .08, .1], [0, .18, -.48], darkMat);
      addFeederBox([4.05, .08, .1], [0, .18, .48], darkMat);
      addFeederBox([.18, .16, .24], [-1.92, .13, -.48], darkMat);
      addFeederBox([.18, .16, .24], [-1.92, .13, .48], darkMat);
      addFeederBox([.18, .16, .24], [1.92, .13, -.48], darkMat);
      addFeederBox([.18, .16, .24], [1.92, .13, .48], darkMat);

      addFeederBox([1.05, .78, .82], [-.35, .55, .03], feederPanelMat);
      addFeederBox([.86, .52, .06], [-.35, .58, .46], feederWhiteMat);
      addFeederBox([.5, .08, .08], [-.35, .9, .5], accentLocal);
      addFeederBox([.42, .18, .04], [-.35, .46, .5], darkMat);

      addTubeBetween([-1.45, .16, -.42], [-.82, .88, -.2], .035, railMat);
      addTubeBetween([1.45, .16, -.42], [.82, .88, -.2], .035, railMat);
      addTubeBetween([-1.45, .16, .42], [-.82, .88, .2], .035, railMat);
      addTubeBetween([1.45, .16, .42], [.82, .88, .2], .035, railMat);

      addFeederBox([4.1, .24, .72], [0, 1.02, 0], feederWhiteMat);
      addFeederBox([4.28, .14, .84], [0, 1.2, 0], feederPanelMat);
      addFeederBox([.34, .74, .84], [-2.0, .9, 0], feederPanelMat);
      addFeederBox([.34, .66, .84], [2.0, .86, 0], feederPanelMat);
      addFeederBox([3.75, .08, .64], [0, 1.37, -.18], feederWhiteMat, [-.18, 0, 0]);
      addFeederBox([1.05, .055, .34], [-.82, 1.45, -.36], feederGlassMat, [-.18, 0, 0]);
      addFeederBox([1.05, .055, .34], [.82, 1.45, -.36], feederGlassMat, [-.18, 0, 0]);
      addFeederBox([4.08, .08, .12], [0, 1.31, .46], darkMat);
      for (const x of [-1.5, -.5, .5, 1.5]) {
        addFeederBox([.025, .18, .012], [x, 1.08, .435], railMat);
      }
      for (const x of [-1.55, 1.55]) {
        addFeederBox([.18, .62, .55], [x, -.28, 0], feederPanelMat);
        addFeederBox([.38, .07, .65], [x, -.61, 0], railMat);
      }
      for (let i = 0; i < 8; i += 1) {
        addFeederBox([.016, .14, .012], [-.58 + i * .065, .55, .502], railMat);
      }
      addFeederBox([.42, .18, .012], [.35, .6, .504], darkMat);
      addFeederBox([.22, .045, .014], [.35, .6, .514], accentLocal);

      addFeederBox([3.85, .09, .24], [.18, .88, .43], conveyorMat);
      addFeederCylinder(.09, 4.25, [.18, .94, .55], conveyorMat, [0, 0, Math.PI / 2], 32);
      addFeederCylinder(.045, 4.0, [.08, 1.03, .43], rawMat, [0, 0, Math.PI / 2], 24);
      const pusher = addFeederBox([.18, .16, .28], [-1.72, 1.03, .55], accentLocal);
      addFeederBox([1.05, .09, .18], [1.28, 1.02, .58], accentLocal);
      addFeederBox([.42, .18, .24], [2.1, .96, .55], darkMat);

      addFeederBox([3.35, .055, .06], [0, .78, -.35], railMat);
      addFeederBox([3.35, .055, .06], [0, .78, .35], railMat);

      for (let index = 0; index < 8; index += 1) {
        const roller = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .78, 18), railMat);
        roller.position.set(-1.45 + index * .42, .82, 0);
        roller.rotation.x = Math.PI / 2;
        roller.castShadow = true;
        feederGroup.add(roller);
        feederRollers.push(roller);
      }

      for (let index = 0; index < 4; index += 1) {
        const wheelX = index < 2 ? -1.82 : 1.82;
        const wheelZ = index % 2 === 0 ? -.55 : .55;
        addFeederCylinder(.09, .08, [wheelX, .04, wheelZ], darkMat, [Math.PI / 2, 0, 0], 20);
      }

      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(4.7, 1.6, 1.3), hitMat);
      hitBox.position.set(0, .78, .02);
      feederGroup.add(hitBox);
      registerMachineObject(feederGroup, id, hitBox);
      return { feederGroup, feederRollers, pusher };
    };

    const addRobotCell = () => {
      const id = "ELITE-CS612-ROBOT-001";
      const color = colorForMachine(id);
      const accentLocal = new THREE.MeshStandardMaterial({ color, roughness: .38, metalness: .16, emissive: color, emissiveIntensity: isSelectedMachine(id) ? .18 : .06 });
      statusMaterials.push({ machineId: id, material: accentLocal });
      selectionEffects.push({ machineId: id, material: accentLocal, property: "emissiveIntensity", selectedValue: .18, defaultValue: .06 });
      const robotShellMat = new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: .34, metalness: .08 });
      const robotArmMat = new THREE.MeshStandardMaterial({ color: 0xcfd4d8, roughness: .24, metalness: .62 });
      const robotBandMat = new THREE.MeshStandardMaterial({ color: 0x172b68, roughness: .28, metalness: .2 });
      const robotDarkMat = new THREE.MeshStandardMaterial({ color: 0x2a2f35, roughness: .42, metalness: .4 });
      const robotGroup = new THREE.Group();
      robotGroup.position.set(workshopLayout.robot[0], -.25, workshopLayout.robot[1]);
      scene.add(robotGroup);
      addMachineHalo(id, [robotGroup.position.x, robotGroup.position.y, robotGroup.position.z], .85);
      addMachineAlert(id, [robotGroup.position.x, robotGroup.position.y, robotGroup.position.z]);
      addTowerLamp(id, workshopLayout.robot[0], 1.42, workshopLayout.robot[1]);

      const addRobotCylinder = (radius, length, position, material, rotation = [0, 0, 0], segments = 40) => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments), material);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        robotGroup.add(mesh);
        return mesh;
      };

      const addRobotBox = (size, position, material, rotation = [0, 0, 0]) => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        robotGroup.add(mesh);
        return mesh;
      };

      const addJoint = (radius, material) => {
        const joint = new THREE.Group();
        const shell = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .26, 32), material);
        shell.rotation.x = Math.PI / 2;
        shell.castShadow = true;
        joint.add(shell);
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * .79, radius * .79, .028, 32), robotBandMat);
        cap.rotation.x = Math.PI / 2;
        cap.position.z = .145;
        joint.add(cap);
        joint.castShadow = true;
        robotGroup.add(joint);
        return joint;
      };
      const addLink = (radius, length, material) => {
        const link = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * .94, length, 24), material);
        link.castShadow = true;
        robotGroup.add(link);
        return link;
      };
      addRobotCylinder(.45, .08, [0, .05, 0], robotDarkMat);
      addRobotCylinder(.31, .32, [0, .27, 0], robotShellMat);
      addRobotCylinder(.32, .045, [0, .46, 0], robotBandMat);
      addRobotBox([.22, .1, .1], [.28, .12, 0], robotDarkMat);
      const shoulderJoint = addJoint(.26, robotShellMat);
      const elbowJoint = addJoint(.23, robotShellMat);
      const wristJoint = addJoint(.17, robotShellMat);
      const upperLink = addLink(.145, 1.14, robotArmMat);
      const foreLink = addLink(.12, 1.14, robotArmMat);
      const wristBand = addLink(.175, .05, robotBandMat);
      const attachedTool = new THREE.Group();
      robotGroup.add(attachedTool);
      const toolFlange = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .08, 24), robotDarkMat);
      attachedTool.add(toolFlange);
      const gripperBody = new THREE.Mesh(new THREE.BoxGeometry(.28, .1, .2), robotDarkMat);
      gripperBody.position.y = -.1;
      attachedTool.add(gripperBody);
      const makeFinger = (z) => {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(.055, .26, .05), robotArmMat);
        finger.position.set(0, -.25, z);
        attachedTool.add(finger);
        return finger;
      };
      const attachedFingerA = makeFinger(.13);
      const attachedFingerB = makeFinger(-.13);
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .28, 12), robotDarkMat);
      cable.rotation.z = Math.PI / 2;
      cable.position.set(.29, .14, 0);
      robotGroup.add(cable);
      const hitBox = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.2, 2.2), hitMat);
      hitBox.position.set(.72, 1.0, 0);
      robotGroup.add(hitBox);
      registerMachineObject(robotGroup, id, hitBox);
      return {
        robotGroup,
        shoulderJoint,
        elbowJoint,
        wristJoint,
        upperLink,
        foreLink,
        wristBand,
        toolCarrier: attachedTool,
        fingerA: attachedFingerA,
        fingerB: attachedFingerB,
      };
    };

    // 辅助机械臂参与场景中的取放工件；未接入独立设备数据。
    const addAuxiliaryRobot = (name, position, bandColor) => {
      const shellMat = new THREE.MeshStandardMaterial({ color: 0xe5eaed, roughness: .38, metalness: .2 });
      const linkMat = new THREE.MeshStandardMaterial({ color: 0xbec8cd, roughness: .3, metalness: .48 });
      const bandMat = new THREE.MeshStandardMaterial({ color: bandColor, roughness: .32, metalness: .18 });
      const jointMat = new THREE.MeshStandardMaterial({ color: 0x26333a, roughness: .48, metalness: .35 });
      const root = new THREE.Group();
      root.name = name;
      root.userData.visualOnly = true;
      root.position.set(position[0], -.35, position[1]);
      scene.add(root);

      const addPart = (parent, geometry, material, position, partName) => {
        const part = new THREE.Mesh(geometry, material);
        part.name = partName;
        part.position.set(...position);
        part.castShadow = true;
        part.receiveShadow = true;
        parent.add(part);
        return part;
      };
      addPart(root, new THREE.CylinderGeometry(.4, .43, .09, 32), jointMat, [0, .045, 0], "base");
      addPart(root, new THREE.CylinderGeometry(.29, .34, .37, 32), shellMat, [0, .27, 0], "pedestal");
      addPart(root, new THREE.CylinderGeometry(.3, .3, .06, 32), bandMat, [0, .48, 0], "base-band");

      const yaw = new THREE.Group();
      yaw.name = "base-yaw";
      yaw.position.y = .51;
      root.add(yaw);
      const shoulder = new THREE.Group();
      shoulder.name = "shoulder-pivot";
      shoulder.position.y = .18;
      yaw.add(shoulder);
      const jointGeometry = new THREE.CylinderGeometry(.23, .23, .3, 32);
      const shoulderJoint = addPart(shoulder, jointGeometry, shellMat, [0, 0, 0], "shoulder-joint");
      shoulderJoint.rotation.x = Math.PI / 2;
      addPart(shoulder, new THREE.CylinderGeometry(.14, .17, .79, 24), linkMat, [0, .395, 0], "upper-arm");
      addPart(shoulder, new THREE.CylinderGeometry(.14, .14, .09, 24), bandMat, [0, .65, 0], "upper-band");

      const elbow = new THREE.Group();
      elbow.name = "elbow-pivot";
      elbow.position.y = .79;
      shoulder.add(elbow);
      const elbowJoint = addPart(elbow, new THREE.CylinderGeometry(.2, .2, .28, 32), shellMat, [0, 0, 0], "elbow-joint");
      elbowJoint.rotation.x = Math.PI / 2;
      addPart(elbow, new THREE.CylinderGeometry(.105, .13, .73, 24), linkMat, [0, .365, 0], "forearm");
      const wrist = new THREE.Group();
      wrist.name = "wrist-pivot";
      wrist.position.y = .73;
      elbow.add(wrist);
      const wristJoint = addPart(wrist, new THREE.CylinderGeometry(.15, .15, .22, 24), shellMat, [0, 0, 0], "wrist-joint");
      wristJoint.rotation.x = Math.PI / 2;
      addPart(wrist, new THREE.CylinderGeometry(.1, .1, .12, 24), jointMat, [0, .14, 0], "tool-flange");
      addPart(wrist, new THREE.BoxGeometry(.27, .1, .21), jointMat, [0, .24, 0], "gripper");
      const fingerA = addPart(wrist, new THREE.BoxGeometry(.05, .2, .05), linkMat, [0, .37, -.11], "gripper-finger-left");
      const fingerB = addPart(wrist, new THREE.BoxGeometry(.05, .2, .05), linkMat, [0, .37, .11], "gripper-finger-right");
      return { root, yaw, shoulder, elbow, wrist, fingerA, fingerB };
    };

    const feederCell = addBarFeeder();
    const robotCell = addRobotCell();
    const auxiliaryRobots = [
      addAuxiliaryRobot("infeed-assist-robot", [-6.35, 1], 0xd48720),
      addAuxiliaryRobot("inspection-assist-robot", [7.8, 2.25], 0x1d7183),
    ];
    const inspection = createEquator300();
    addMachineHalo(VISION_CAMERA_ID, [tabletopVision.position.x, tabletopVision.position.y, tabletopVision.position.z], 1.3);
    addMachineAlert(VISION_CAMERA_ID, [tabletopVision.position.x, tabletopVision.position.y, tabletopVision.position.z]);
    inspection.workpiece.name = "inspectionWorkpiece";
    inspection.root.position.set(workshopLayout.inspection[0], -.3, workshopLayout.inspection[1]);
    scene.add(inspection.root);
    addMachineHalo("RENISHAW-EQUATOR300-001", [workshopLayout.inspection[0], -.3, workshopLayout.inspection[1]], .95);
    addMachineAlert("RENISHAW-EQUATOR300-001", [workshopLayout.inspection[0], -.3, workshopLayout.inspection[1]]);
    const inspectionHitBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.76, 1.6), hitMat);
    inspectionHitBox.position.set(workshopLayout.inspection[0], .56, workshopLayout.inspection[1]);
    scene.add(inspectionHitBox);
    registerMachineObject(inspection.root, "EQUATOR300-VISUAL", inspectionHitBox);
    inspectionHitBox.userData.machineId = "EQUATOR300-VISUAL";
    addTowerLamp("RENISHAW-EQUATOR300-001", workshopLayout.inspection[0], 1.57, workshopLayout.inspection[1]);

    const group = new THREE.Group();
    group.position.set(.05, -.1, -.08);
    group.rotation.y = 0;
    group.scale.set(.82, .82, .82);
    scene.add(group);

    const addBox = (name, size, position, material, rotation = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat);
      edges.position.copy(mesh.position);
      edges.rotation.copy(mesh.rotation);
      edges.scale.copy(mesh.scale);
      group.add(edges);
      return mesh;
    };

    addBox("machine-base", [4.65, .52, 1.68], [0, .28, 0], darkMat);
    addBox("left-headstock-cabinet", [1.08, 1.88, 1.66], [-1.78, 1.4, 0], darkMat);
    addBox("transparent-main-shell", [3.35, 1.78, 1.58], [-.15, 1.4, 0], bodyMat);
    addBox("rear-column", [.45, 1.95, 1.58], [-2.2, 1.44, 0], solidBodyMat);
    const machineDoor = new THREE.Group();
    machineDoor.position.set(-1.62, 1.42, .89);
    group.add(machineDoor);
    const doorBox = (size, position, material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.position.set(...position);
      machineDoor.add(mesh);
      return mesh;
    };
    doorBox([1.68, 1.18, .025], [.9, 0, 0], glassMat);
    doorBox([1.8, .075, .08], [.9, .64, 0], solidBodyMat);
    doorBox([1.8, .075, .08], [.9, -.64, 0], solidBodyMat);
    doorBox([.075, 1.3, .08], [.04, 0, 0], solidBodyMat);
    doorBox([.075, 1.3, .08], [1.76, 0, 0], solidBodyMat);
    doorBox([.075, .32, .075], [1.65, -.06, .09], railMat);
    addBox("right-slanted-cover", [.86, 1.56, 1.5], [1.32, 1.38, .04], bodyMat, [0, 0, -0.18]);
    addBox("control-panel", [.45, 1.22, .18], [1.98, 1.5, .78], darkMat, [0, 0, -0.24]);
    addBox("top-service-rail", [3.12, .16, 1.34], [-.24, 2.28, 0], darkMat);
    addBox("status-strip", [1.82, .06, .08], [-.42, 2.39, .7], accentMat);
    addBox("chip-conveyor-neck", [1.12, .28, .34], [2.38, 1.0, .22], darkMat, [0, 0, .4]);
    addBox("chip-bin", [.7, .58, .7], [3.0, .76, .22], bodyMat);
    addBox("front-service-panel", [2.68, .5, .08], [-.36, .58, .86], lightMat);
    for (let i = 0; i < 9; i += 1) addBox("cabinet-vent", [.23, .018, .014], [1.34, 1.9 - i * .06, .83], railMat);
    for (let i = 0; i < 6; i += 1) addBox("panel-key", [.035, .035, .018], [1.94 + (i % 2) * .09, 1.95 - Math.floor(i / 2) * .1, .89], lightMat);
    addBox("panel-screen", [.27, .24, .025], [1.97, 1.66, .9], glassMat);
    addBox("nameplate", [.46, .12, .02], [-1.8, 1.9, .85], railMat);
    addBox("left-foot", [.25, .5, .22], [-1.85, -.02, .56], darkMat);
    addBox("right-foot", [.25, .5, .22], [1.55, -.02, .56], darkMat);

    addBox("inner-bed", [2.45, .18, .46], [-.35, 1.02, .4], innerMat);
    addBox("linear-guide-left", [2.35, .055, .055], [-.32, 1.16, .22], railMat);
    addBox("linear-guide-right", [2.35, .055, .055], [-.32, 1.16, .58], railMat);
    addBox("tailstock-shadow", [.42, .44, .5], [.9, 1.26, .38], innerMat);

    const spindleChuck = new THREE.Group();
    spindleChuck.name = "spindleChuck";
    spindleChuck.position.set(-1.12, 1.36, .78);
    group.add(spindleChuck);

    const chuckBody = new THREE.Mesh(new THREE.CylinderGeometry(.29, .29, .22, 48), railMat);
    chuckBody.rotation.z = Math.PI / 2;
    chuckBody.castShadow = true;
    spindleChuck.add(chuckBody);

    const chuckFace = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .04, 48), accentMat);
    chuckFace.position.x = .13;
    chuckFace.rotation.z = Math.PI / 2;
    spindleChuck.add(chuckFace);

    for (let index = 0; index < 3; index += 1) {
      const angle = index * (Math.PI * 2 / 3);
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(.16, .06, .24), cutterMat);
      jaw.position.set(.17, Math.cos(angle) * .16, Math.sin(angle) * .16);
      jaw.rotation.x = angle;
      jaw.castShadow = true;
      spindleChuck.add(jaw);
    }

    const machiningWorkpiece = new THREE.Mesh(new THREE.CylinderGeometry(.13, .13, .88, 48), cutMetalMat);
    machiningWorkpiece.name = "machiningWorkpiece";
    machiningWorkpiece.position.x = .48;
    machiningWorkpiece.rotation.z = Math.PI / 2;
    machiningWorkpiece.castShadow = true;
    spindleChuck.add(machiningWorkpiece);

    const toolSlide = new THREE.Group();
    toolSlide.name = "toolSlide";
    toolSlide.position.set(.32, 1.27, .55);
    group.add(toolSlide);

    const toolCarriage = new THREE.Mesh(new THREE.BoxGeometry(.56, .34, .42), innerMat);
    toolCarriage.castShadow = true;
    toolSlide.add(toolCarriage);

    const turret = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .25, 8), railMat);
    turret.rotation.x = Math.PI / 2;
    turret.position.set(-.05, .08, .24);
    turret.castShadow = true;
    toolSlide.add(turret);

    const cutter = new THREE.Mesh(new THREE.ConeGeometry(.06, .34, 4), cutterMat);
    cutter.name = "cutterTip";
    cutter.position.set(-.33, .08, .24);
    cutter.rotation.z = Math.PI / 2;
    cutter.rotation.y = Math.PI / 4;
    cutter.castShadow = true;
    toolSlide.add(cutter);

    const cutterGlow = new THREE.PointLight(0xffc05a, .9, 1.3);
    cutterGlow.name = "cuttingGlow";
    cutterGlow.position.set(-.45, .08, .24);
    toolSlide.add(cutterGlow);

    const loadingArm = new THREE.Group();
    loadingArm.name = "loadingArm";
    loadingArm.position.set(-2.02, 1.62, .62);
    group.add(loadingArm);
    const armRail = new THREE.Mesh(new THREE.BoxGeometry(.08, .72, .08), railMat);
    armRail.castShadow = true;
    loadingArm.add(armRail);
    const armFingerA = new THREE.Mesh(new THREE.BoxGeometry(.08, .08, .38), cutterMat);
    armFingerA.position.set(.18, -.33, .12);
    loadingArm.add(armFingerA);
    const armFingerB = armFingerA.clone();
    armFingerB.position.z = -.12;
    loadingArm.add(armFingerB);

    addTowerLamp("TRAK-TC820LTYSI-001", -1.35, 2.05, -.08);
    // 送料管和出料滑槽共用机床轴线，但分别服务两端。
    addSceneBox([1.2, .12, .17], [-1.93, .98, .56], railMat);
    addSceneBox([1.1, .055, .27], [2.37, .31, 1.02], innerMat, [0, 0, -.16]);
    addSceneBox([.09, .14, .28], [2.82, .28, 1.02], railMat);

    const createRawPart = (offset) => {
      const part = new THREE.Group();
      part.userData.offset = offset;
      part.name = "rawBarStock";
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(.11, .11, .66, 32), rawMat);
      bar.rotation.z = Math.PI / 2;
      bar.castShadow = true;
      part.add(bar);
      const end = new THREE.Mesh(new THREE.CylinderGeometry(.115, .115, .025, 32), darkMat);
      end.position.x = -.35;
      end.rotation.z = Math.PI / 2;
      part.add(end);
      scene.add(part);
      return part;
    };

    const createScrewPart = (offset = 0, material = cutMetalMat) => {
      const part = new THREE.Group();
      part.userData.offset = offset;
      part.name = "screwPart";
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .42, 32), material);
      body.rotation.z = Math.PI / 2;
      body.castShadow = true;
      part.add(body);

      const collar = new THREE.Mesh(new THREE.CylinderGeometry(.09, .09, .08, 32), material);
      collar.position.x = -.23;
      collar.rotation.z = Math.PI / 2;
      collar.castShadow = true;
      part.add(collar);

      const slot = new THREE.Mesh(new THREE.BoxGeometry(.018, .13, .018), darkMat);
      slot.position.x = -.275;
      slot.castShadow = true;
      part.add(slot);

      scene.add(part);
      return part;
    };

    const createFinishedPart = (offset) => {
      const part = createScrewPart(offset);
      part.name = "finishedParts";
      const bore = new THREE.Mesh(new THREE.CylinderGeometry(.022, .022, .44, 24), darkMat);
      bore.rotation.z = Math.PI / 2;
      bore.scale.set(1, 1, 1);
      part.add(bore);
      return part;
    };

    const rawParts = [createRawPart(0)];
    const finishedParts = [createFinishedPart(.05), createFinishedPart(.34), createFinishedPart(.68)];
    const visionSample = createScrewPart(0, cutMetalMat);
    visionSample.name = "visionSample";
    visionSample.userData.visualOnly = true;
    tabletopVision.add(visionSample);
    visionSample.position.set(.7, .97, .25);
    visionSample.scale.setScalar(.75);
    visionSample.visible = false;
    const carriedScrew = createScrewPart(0, cutMetalMat);
    const inspectionTransferPart = createScrewPart(0, cutMetalMat);
    inspectionTransferPart.name = "inspectionTransferPart";
    inspectionTransferPart.scale.setScalar(.72);
    inspectionTransferPart.visible = false;
    if (robotCell?.toolCarrier) {
      robotCell.toolCarrier.add(carriedScrew);
      carriedScrew.position.set(0, -.35, 0);
      carriedScrew.rotation.set(0, 0, 0);
      carriedScrew.scale.setScalar(.78);
      carriedScrew.visible = false;
    }

    const boxMat = new THREE.MeshStandardMaterial({ color: 0x566978, roughness: .6, metalness: .22 });
    const boxPosition = new THREE.Vector3(workshopLayout.qualified[0], -.16, workshopLayout.qualified[1]);
    const rejectPosition = new THREE.Vector3(workshopLayout.rework[0], -.16, workshopLayout.rework[1]);
    const rejectMat = new THREE.MeshStandardMaterial({ color: 0x9a7250, roughness: .68, metalness: .08 });
    const addBin = (position, material, label) => {
      const { x, y, z } = position;
      addSceneBox([1.05, .12, .82], [x, y, z], material);
      for (const side of [-1, 1]) {
        addSceneBox([.08, .47, .82], [x + side * .52, y + .25, z], material);
        addSceneBox([.16, .065, .28], [x + side * .56, y + .51, z], railMat);
        for (const offset of [-.22, .22]) addSceneBox([.025, .4, .08], [x + side * .565, y + .25, z + offset], railMat);
      }
      for (const side of [-1, 1]) {
        addSceneBox([1.05, .47, .08], [x, y + .25, z + side * .41], material);
        for (const offset of [-.35, .35]) addSceneBox([.045, .4, .025], [x + offset, y + .25, z + side * .455], railMat);
      }
      addSceneBox([1.15, .065, .07], [x, y + .51, z + .41], railMat);
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 96;
      const context = canvas.getContext("2d");
      context.fillStyle = "#e4e8e7";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#26343b";
      context.font = "bold 46px sans-serif";
      context.textAlign = "center";
      context.fillText(label, 128, 66);
      const texture = new THREE.CanvasTexture(canvas);
      const sticker = new THREE.Mesh(new THREE.PlaneGeometry(.5, .18), new THREE.MeshStandardMaterial({ map: texture, roughness: .75 }));
      sticker.position.set(x, y + .26, z + .457);
      scene.add(sticker);
    };
    addBin(boxPosition, boxMat, "合格品");
    addBin(rejectPosition, rejectMat, "待处理");

    const boxedScrews = [boxPosition, rejectPosition].map((bin, binIndex) =>
      Array.from({ length: 9 }, (_, index) => {
        const screw = createScrewPart(index / 9, cutMetalMat);
        screw.name = binIndex === 0 ? "qualifiedBoxPart" : "reworkBoxPart";
        screw.position.set(
          bin.x - .28 + (index % 3) * .22,
          bin.y + .16 + Math.floor(index / 3) * .035,
          bin.z - .2 + Math.floor(index / 3) * .18,
        );
        screw.scale.setScalar(.72);
        screw.visible = false;
        return screw;
      }));
    const chips = Array.from({ length: 18 }, (_, index) => {
      const spark = index < 3;
      const material = spark ? new THREE.MeshBasicMaterial({ color: 0xffba63 }) : chipMat;
      const chip = new THREE.Mesh(new THREE.TorusGeometry(spark ? .01 : .033, spark ? .004 : .008, 4, 10, Math.PI * 1.3), material);
      chip.userData.offset = index / 18;
      chip.castShadow = true;
      group.add(chip);
      return chip;
    });

    addMachineHalo("TRAK-TC820LTYSI-001", [group.position.x, group.position.y, group.position.z], 2.05);
    addMachineAlert("TRAK-TC820LTYSI-001", [group.position.x, group.position.y, group.position.z]);
    const machineHitBox = new THREE.Mesh(new THREE.BoxGeometry(5.1, 2.8, 2.3), hitMat);
    machineHitBox.position.set(.08, 1.15, .05);
    group.add(machineHitBox);
    registerMachineObject(group, "TRAK-TC820LTYSI-001", machineHitBox);

    const ambient = new THREE.HemisphereLight(0xffffff, 0xb8c5c9, 1.4);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(3, 5, 4);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight(accent, .9);
    rim.position.set(-3, 2.5, -2);
    scene.add(rim);

    const toolHomePosition = new THREE.Vector3(0, 1.35, .48);
    const toRobotLocal = (point, y) => new THREE.Vector3(point[0] - workshopLayout.robot[0], y, point[1] - workshopLayout.robot[1]);
    const toolPickHoverPosition = toRobotLocal(workshopLayout.pickup, 1.12);
    const toolPickPosition = toRobotLocal(workshopLayout.pickup, .7);
    const toolLiftPosition = new THREE.Vector3(.1, 1.42, 1.12);
    const toolInspectHoverPosition = toRobotLocal(workshopLayout.inspection, 1.13);
    const toolInspectDropPosition = toRobotLocal(workshopLayout.inspection, .58);
    const handoffScrew = finishedParts[0];
    const tempA = new THREE.Vector3();
    const tempB = new THREE.Vector3();
    const tempC = new THREE.Vector3();
    const tempD = new THREE.Vector3();
    const buildMotionPath = (points) => {
      const segments = [];
      let total = 0;
      for (let index = 0; index < points.length - 1; index += 1) {
        const from = points[index];
        const to = points[index + 1];
        const length = from.distanceTo(to);
        segments.push({ from, to, length });
        total += length;
      }
      return { segments, total };
    };
    const rawMotionPath = buildMotionPath([
      new THREE.Vector3(-5.68, .08, 2.45),
      new THREE.Vector3(-5.68, .08, .72),
    ]);
    const finishedMotionPath = buildMotionPath([
      new THREE.Vector3(2.45, .08, 1.12),
      new THREE.Vector3(4.7, .08, 1.12),
    ]);
    const pointOnMotionPath = (path, progress, target) => {
      let distance = Math.max(0, Math.min(1, progress)) * path.total;
      for (const segment of path.segments) {
        if (distance <= segment.length) {
          return target.copy(segment.from).lerp(segment.to, segment.length ? distance / segment.length : 0);
        }
        distance -= segment.length;
      }
      const lastSegment = path.segments[path.segments.length - 1];
      return target.copy(lastSegment.to);
    };

    const moveBetween = (from, to, progress) => tempA.copy(from).lerp(to, progress);
    const moveOverArc = (from, via, to, progress) => {
      tempB.copy(from).lerp(via, progress);
      tempC.copy(via).lerp(to, progress);
      return tempA.copy(tempB).lerp(tempC, progress);
    };
    const easeInOut = (value) => value * value * (3 - 2 * value);
    const progressBetween = (cycle, start, end) => easeInOut(Math.max(0, Math.min(1, (cycle - start) / (end - start))));
    const sweepDuringIdle = (home, progress, range) => {
      const angle = progress * Math.PI * 2;
      return tempA.set(
        home.x + Math.sin(angle) * range,
        home.y + (1 - Math.cos(angle)) * range * .45,
        home.z + Math.sin(angle * 2) * range * .45,
      );
    };
    const infeedHome = new THREE.Vector3(-6.35, 1.4, 1);
    const infeedPickHover = new THREE.Vector3(-5.68, .9, .72);
    const infeedPickTool = new THREE.Vector3(-5.68, .46, .72);
    const infeedPlaceHover = new THREE.Vector3(-5.63, 1.53, .5);
    const infeedPlaceTool = new THREE.Vector3(-5.63, 1.38, .5);
    const infeedPlacedPart = new THREE.Vector3(-5.63, 1, .5);
    const outputHome = new THREE.Vector3(7.8, 1.4, 2.25);
    const outputPickHover = new THREE.Vector3(7.6, .85, 1);
    const outputPickTool = new THREE.Vector3(7.6, .4, 1);
    const outputBinHover = [boxPosition, rejectPosition].map((bin) => new THREE.Vector3(bin.x, .85, bin.z));
    const outputBinTool = [boxPosition, rejectPosition].map((bin) => new THREE.Vector3(bin.x, .45, bin.z));
    const handoffPickWorld = new THREE.Vector3(workshopLayout.pickup[0], .08, workshopLayout.pickup[1]);
    const armUp = new THREE.Vector3(0, 1, 0);
    const shoulderPoint = new THREE.Vector3(0, .7, 0);
    const armAxis = new THREE.Vector3(0, 1, 0);
    const elbowPoint = new THREE.Vector3();
    const armDirection = new THREE.Vector3();
    const bendDirection = new THREE.Vector3();
    const placeArmLink = (mesh, start, end, length) => {
      mesh.position.copy(start).add(end).multiplyScalar(.5);
      mesh.quaternion.setFromUnitVectors(armAxis, tempD.copy(end).sub(start).normalize());
      mesh.scale.y = start.distanceTo(end) / length;
    };
    const poseRobot = (target) => {
      const distance = Math.min(2.26, Math.max(.01, armDirection.copy(target).sub(shoulderPoint).length()));
      armDirection.normalize();
      bendDirection.copy(armUp).addScaledVector(armDirection, -armUp.dot(armDirection)).normalize();
      if (bendDirection.lengthSq() < .001) bendDirection.set(0, 0, 1);
      const height = Math.sqrt(Math.max(0, 1.14 * 1.14 - distance * distance / 4));
      elbowPoint.copy(shoulderPoint).addScaledVector(armDirection, distance / 2).addScaledVector(bendDirection, height);
      robotCell.shoulderJoint.position.copy(shoulderPoint);
      robotCell.elbowJoint.position.copy(elbowPoint);
      robotCell.wristJoint.position.copy(target);
      placeArmLink(robotCell.upperLink, shoulderPoint, elbowPoint, 1.14);
      placeArmLink(robotCell.foreLink, elbowPoint, target, 1.14);
      robotCell.wristBand.position.copy(target).addScaledVector(armUp, -.12);
      robotCell.toolCarrier.position.copy(target);
    };
    const poseAuxiliaryRobot = (cell, target, gripping) => {
      const dx = target.x - cell.root.position.x;
      const dz = target.z - cell.root.position.z;
      const radial = Math.hypot(dx, dz);
      const vertical = target.y - (cell.root.position.y + .69);
      const reach = Math.max(.061, Math.min(1.519, Math.hypot(radial, vertical)));
      const upper = .79;
      const fore = .73;
      const shoulderAngle = Math.atan2(radial, vertical)
        - Math.acos(Math.max(-1, Math.min(1, (upper * upper + reach * reach - fore * fore) / (2 * upper * reach))));
      const elbowAngle = Math.atan2(radial - upper * Math.sin(shoulderAngle), vertical - upper * Math.cos(shoulderAngle));
      cell.yaw.rotation.y = Math.atan2(-dz, dx);
      cell.shoulder.rotation.z = -shoulderAngle;
      cell.elbow.rotation.z = shoulderAngle - elbowAngle;
      cell.wrist.rotation.z = Math.PI + elbowAngle;
      cell.fingerA.position.z = gripping ? -.07 : -.11;
      cell.fingerB.position.z = gripping ? .07 : .11;
    };

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      const now = performance.now();
      const liveMotion = motionRef.current;
      const { time, delta } = motionClockRef.current.tick(now, Boolean(liveMotion?.running) && Date.now() <= liveMotion.validUntil && !document.hidden);
      const alertTime = now * .001;
      const cutCycle = (Math.sin(time * 1.05) + 1) / 2;
      const lineCycle = (time * .18) % 1;
      const robotCycle = (time % ROBOT_CYCLE_SECONDS) / ROBOT_CYCLE_SECONDS;
      const cameraDevice = getCurrentMachine(VISION_CAMERA_ID);
      const cameraMetrics = cameraDevice?.result?.current_sample?.metrics || cameraDevice?.sample?.metrics || {};
      const cameraReady = getMachineMotionState(cameraDevice) === "running"
        && cameraMetrics.camera_online === 1 && cameraMetrics.camera_acquiring === 1;
      const cameraFps = Number(cameraMetrics.camera_frame_rate_fps);
      visionSample.visible = robotCycle >= .4 && robotCycle < .72;
      if (visionSample.visible) {
        visionSample.position.x = robotCycle < .5
          ? .7 - 1.13 * progressBetween(robotCycle, .4, .5)
          : robotCycle < .64 ? -.43 : -.43 + 1.13 * progressBetween(robotCycle, .64, .72);
      }
      const sampleUnderCamera = visionSample.visible && robotCycle >= .5 && robotCycle < .64;
      const captureActive = cameraReady && sampleUnderCamera && Boolean(liveMotion?.running);
      visionCaptureBeam.visible = captureActive;
      visionLightMat.emissiveIntensity = captureActive ? 1.6 + Math.sin(time * 46) * .28 : cameraReady ? .34 : .05;
      const visionMonitorState = JSON.stringify([cameraReady, Number.isFinite(cameraFps) ? cameraFps : null,
        visionSample.visible, captureActive]);
      if (visionMonitorState !== lastVisionMonitorState) {
        drawVisionMonitor(cameraReady, cameraFps, visionSample.visible, captureActive);
        monitorTexture.needsUpdate = true;
        lastVisionMonitorState = visionMonitorState;
      }

      const machining = robotCycle < .38;
      spindleChuck.rotation.x = machining ? time * 8.6 : 0;
      machiningWorkpiece.rotation.x = 0;
      toolSlide.position.x = machining ? .22 + Math.sin(time * .92) * .22 : .48;
      toolSlide.position.z = machining ? .48 + Math.sin(time * 1.45) * .08 : .55;
      turret.rotation.z = machining ? time * .65 : 0;
      cutterGlow.intensity = machining ? .15 + cutCycle * .2 : 0;
      cutter.material.emissive.setHex(0x5a625d);
      cutter.material.emissiveIntensity = machining ? .08 : 0;
      machineDoor.position.x = -1.62 + (machining ? 0 : 1.12);
      loadingArm.rotation.z = Math.sin(time * 1.2) * .18;
      conveyorRollers.forEach((roller) => {
        roller.rotateY(-9.6 * delta);
      });
      conveyorFlights.forEach((flight) => {
        const progress = (lineCycle + flight.mesh.userData.offset) % 1;
        tempB.copy(flight.start).lerp(flight.end, progress);
        flight.mesh.position.set(tempB.x, .02, tempB.z);
      });
      if (feederCell) {
        feederCell.feederRollers.forEach((roller) => {
          roller.rotateY(-10.8 * delta);
        });
        const feedStroke = robotCycle < .78 ? progressBetween(robotCycle, .52, .78)
          : 1 - progressBetween(robotCycle, .9, 1);
        feederCell.pusher.position.x = -1.72 + feedStroke * 3.18;
      }
      const infeedRobot = auxiliaryRobots[0];
      const infeedIdlePhase = robotCycle >= .62 ? (robotCycle - .62) / .5 : (robotCycle + .38) / .5;
      let infeedTarget = sweepDuringIdle(infeedHome, infeedIdlePhase, .34);
      if (robotCycle >= .12 && robotCycle < .18) {
        infeedTarget = moveBetween(infeedHome, infeedPickHover, progressBetween(robotCycle, .12, .18));
      } else if (robotCycle >= .18 && robotCycle < .22) {
        infeedTarget = moveBetween(infeedPickHover, infeedPickTool, progressBetween(robotCycle, .18, .22));
      } else if (robotCycle >= .22 && robotCycle < .26) {
        infeedTarget = infeedPickTool;
      } else if (robotCycle >= .26 && robotCycle < .32) {
        infeedTarget = moveBetween(infeedPickTool, infeedPickHover, progressBetween(robotCycle, .26, .32));
      } else if (robotCycle >= .32 && robotCycle < .42) {
        infeedTarget = moveBetween(infeedPickHover, infeedPlaceHover, progressBetween(robotCycle, .32, .42));
      } else if (robotCycle >= .42 && robotCycle < .48) {
        infeedTarget = moveBetween(infeedPlaceHover, infeedPlaceTool, progressBetween(robotCycle, .42, .48));
      } else if (robotCycle >= .48 && robotCycle < .52) {
        infeedTarget = infeedPlaceTool;
      } else if (robotCycle >= .52 && robotCycle < .62) {
        infeedTarget = moveBetween(infeedPlaceTool, infeedHome, progressBetween(robotCycle, .52, .62));
      }
      poseAuxiliaryRobot(infeedRobot, infeedTarget, robotCycle >= .22 && robotCycle < .5);
      infeedRobot.wrist.rotation.y = Math.sin(time * 24) * .16;

      // 检测后交接到两个示意分拣箱；交替路径不代表真实测量结论。
      const outputToRework = Math.floor(time / ROBOT_CYCLE_SECONDS) % 2 === 1;
      const outputBinIndex = outputToRework ? 1 : 0;
      const outputRobot = auxiliaryRobots[1];
      let outputTarget = sweepDuringIdle(outputHome, robotCycle / .66, .38);
      if (robotCycle >= .66 && robotCycle < .72) {
        outputTarget = moveBetween(outputHome, outputPickHover, progressBetween(robotCycle, .66, .72));
      } else if (robotCycle >= .72 && robotCycle < .76) {
        outputTarget = moveBetween(outputPickHover, outputPickTool, progressBetween(robotCycle, .72, .76));
      } else if (robotCycle >= .76 && robotCycle < .78) {
        outputTarget = outputPickTool;
      } else if (robotCycle >= .78 && robotCycle < .82) {
        outputTarget = moveBetween(outputPickTool, outputPickHover, progressBetween(robotCycle, .78, .82));
      } else if (robotCycle >= .82 && robotCycle < .9) {
        outputTarget = moveBetween(outputPickHover, outputBinHover[outputBinIndex], progressBetween(robotCycle, .82, .9));
      } else if (robotCycle >= .9 && robotCycle < .94) {
        outputTarget = moveBetween(outputBinHover[outputBinIndex], outputBinTool[outputBinIndex], progressBetween(robotCycle, .9, .94));
      } else if (robotCycle >= .94 && robotCycle < .96) {
        outputTarget = outputBinTool[outputBinIndex];
      } else if (robotCycle >= .96) {
        outputTarget = moveBetween(outputBinTool[outputBinIndex], outputHome, progressBetween(robotCycle, .96, 1));
      }
      poseAuxiliaryRobot(outputRobot, outputTarget, robotCycle >= .76 && robotCycle < .96);
      outputRobot.wrist.rotation.y = Math.sin(time * 24 + 1.3) * .16;
      if (robotCell) {
        // 原有机械臂只负责出料线 → 检测台，给检测侧机械臂留出取件时间。
        const carrying = robotCycle >= .25 && robotCycle < .56;
        const gripping = robotCycle >= .22 && robotCycle < .6;
        const primaryIdlePhase = robotCycle >= .74 ? (robotCycle - .74) / .36 : (robotCycle + .26) / .36;
        let toolPosition = sweepDuringIdle(toolHomePosition, primaryIdlePhase, .27);
        if (robotCycle >= .1 && robotCycle < .2) {
          toolPosition = moveBetween(toolHomePosition, toolPickHoverPosition, easeInOut((robotCycle - .1) / .1));
        } else if (robotCycle < .25) {
          toolPosition = moveBetween(toolPickHoverPosition, toolPickPosition, easeInOut((robotCycle - .2) / .05));
        } else if (robotCycle < .28) {
          toolPosition = toolPickPosition;
        } else if (robotCycle < .38) {
          toolPosition = moveBetween(toolPickPosition, toolPickHoverPosition, easeInOut((robotCycle - .28) / .1));
        } else if (robotCycle < .5) {
          toolPosition = moveOverArc(toolPickHoverPosition, toolLiftPosition, toolInspectHoverPosition, easeInOut((robotCycle - .38) / .12));
        } else if (robotCycle < .56) {
          toolPosition = moveBetween(toolInspectHoverPosition, toolInspectDropPosition, easeInOut((robotCycle - .5) / .06));
        } else if (robotCycle < .6) {
          toolPosition = toolInspectDropPosition;
        } else if (robotCycle < .66) {
          toolPosition = moveBetween(toolInspectDropPosition, toolInspectHoverPosition, easeInOut((robotCycle - .6) / .06));
        } else if (robotCycle < .74) {
          toolPosition = moveBetween(toolInspectHoverPosition, toolHomePosition, progressBetween(robotCycle, .66, .74));
        }

        poseRobot(toolPosition);
        robotCell.toolCarrier.rotation.y = Math.sin(time * 24 + .65) * .12;
        robotCell.fingerA.position.z = gripping ? .07 : .14;
        robotCell.fingerB.position.z = gripping ? -.07 : -.14;
        carriedScrew.visible = carrying;
      }
      const rawPart = rawParts[0];
      rawPart.visible = robotCycle < .78;
      if (robotCycle < .22) {
        pointOnMotionPath(rawMotionPath, Math.min(1, robotCycle / .18), tempB);
        rawPart.position.copy(tempB);
      } else if (robotCycle < .48) {
        infeedRobot.wrist.getWorldPosition(rawPart.position);
        rawPart.position.y -= .38;
      } else if (robotCycle < .78) {
        rawPart.position.copy(infeedPlacedPart);
        rawPart.position.x += progressBetween(robotCycle, .52, .78) * 2.74;
      }
      rawPart.rotation.x = time * 2.5;

      if (handoffScrew) {
        if (robotCycle < .25) {
          handoffScrew.visible = true;
          handoffScrew.position.copy(handoffPickWorld);
        } else {
          handoffScrew.visible = false;
        }
      }
      inspection.workpiece.visible = robotCycle >= .56 && robotCycle < .78;
      inspectionTransferPart.visible = robotCycle >= .78 && robotCycle < .96;
      if (inspectionTransferPart.visible) {
        outputRobot.wrist.getWorldPosition(inspectionTransferPart.position);
        inspectionTransferPart.position.y -= .38;
      }

      finishedParts.slice(1).forEach((part) => {
        const progress = (time * .17 + part.userData.offset) % 1;
        const stagedProgress = progress > .86 ? .86 + (progress - .86) * .18 : progress;
        pointOnMotionPath(finishedMotionPath, stagedProgress, tempB);
        part.position.copy(tempB);
        part.rotation.x = time * 2.6;
        part.rotation.y = Math.sin(time * 1.6 + part.userData.offset) * .08;
      });

      const completedTransfers = Math.floor(time / ROBOT_CYCLE_SECONDS) + (robotCycle >= .96 ? 1 : 0);
      boxedScrews[0].forEach((screw, index) => { screw.visible = index < Math.min(9, Math.ceil(completedTransfers / 2)); });
      boxedScrews[1].forEach((screw, index) => { screw.visible = index < Math.min(9, Math.floor(completedTransfers / 2)); });

      chips.forEach((chip) => {
        const progress = (time * 1.4 + chip.userData.offset) % 1;
        chip.position.set(
          -.18 + progress * .7,
          1.35 - progress * .45 + Math.sin(progress * Math.PI * 4) * .035,
          .8 + progress * .28,
        );
        chip.rotation.set(time * 4 + progress, time * 2.3, progress * 6);
        chip.visible = machining;
      });
      alertEffects.forEach((effect) => {
        const shouldAlert = isAlertStatus(currentStatusForMachine(effect.id));
        const pulse = .35 + Math.abs(Math.sin(alertTime * 4.6)) * .65;
        effect.glow.intensity = shouldAlert ? 2.2 + pulse * 2.4 : 0;
      });
      towerLamps.forEach(({ id, lamps }) => {
        const current = currentStatusForMachine(id);
        const active = ["idle", "stopped", "unknown"].includes(current) ? -1 : current === "fault" || current === "alarm" ? 0 : current === "warning" ? 1 : 2;
        lamps.forEach((lamp, index) => { lamp.emissiveIntensity = index === active ? (active === 0 ? .8 + Math.abs(Math.sin(alertTime * 5)) * 1.3 : .9) : .04; });
      });
      controls.update();
      renderer.render(scene, camera);
    };
    updateSelection(selectedMachineIdRef.current);
    animate();

    const handleResize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(mount);

    const clearHover = () => {
      if (hoverTimerRef.current) {
        window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      hoveredMachineRef.current = null;
      setHoveredLabel(null);
    };

    const pickMachineAtPointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(interactiveObjects, false);
      return hits[0]?.object?.userData?.machineId || null;
    };

    const handlePointerMove = (event) => {
      const machineId = pickMachineAtPointer(event);
      if (!machineId) {
        clearHover();
        return;
      }

      const tooltipPosition = {
        x: Math.min(Math.max(event.offsetX + 14, 14), Math.max(mount.clientWidth - 250, 14)),
        y: Math.min(Math.max(event.offsetY + 14, 14), Math.max(mount.clientHeight - 112, 14)),
      };

      if (hoveredMachineRef.current === machineId) {
        setHoveredLabel((current) => current ? { ...current, ...tooltipPosition } : current);
        return;
      }

      if (hoverTimerRef.current) window.clearTimeout(hoverTimerRef.current);
      hoveredMachineRef.current = machineId;
      setHoveredLabel(null);
      hoverTimerRef.current = window.setTimeout(() => {
        const label = labelForMachine(machineId);
        if (!label || hoveredMachineRef.current !== machineId) return;
        setHoveredLabel({ ...label, ...tooltipPosition });
      }, 2000);
    };

    const handlePointerLeave = () => clearHover();
    const handleClick = (event) => {
      const machineId = pickMachineAtPointer(event) || hoveredMachineRef.current;
      if (machineId === "EQUATOR300-VISUAL") {
        if (getCurrentMachine("RENISHAW-EQUATOR300-001")) onSelectRef.current("RENISHAW-EQUATOR300-001");
      } else if (machineId) onSelectRef.current(machineId);
    };
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerleave", handlePointerLeave);
    renderer.domElement.addEventListener("click", handleClick);

    return () => {
      updateSelectionRef.current = null;
      applyViewRef.current = null;
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      clearHover();
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
      renderer.domElement.removeEventListener("click", handleClick);
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
          else {
            if (object.material.map) object.material.map.dispose();
            object.material.dispose();
          }
        }
      });
      controls.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [sceneMachineState]);

  return (
    <div ref={mountRef} className="machine-3d-canvas" aria-hidden="true">
      {hoveredLabel ? (
        <div
          className={`scene-hover-label ${hoveredLabel.status}`}
          style={{ left: hoveredLabel.x, top: hoveredLabel.y }}
        >
          <strong>{hoveredLabel.name}</strong>
          <span>{hoveredLabel.type}</span>
          <em>{hoveredLabel.statusLabel}</em>
        </div>
      ) : null}
    </div>
  );
}

function statusColor(status) {
  if (status === "fault") return 0xb73732;
  if (status === "alarm" || status === "warning") return 0xb66a00;
  if (["idle", "stopped", "unknown"].includes(status)) return 0x7d8c93;
  return 0x087f75;
}
