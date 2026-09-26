import * as THREE from "three";

// Geometry and proportions adapted from the user-provided Equator300.html viewer.
// The viewer uses millimetres; the workshop uses compact scene units.
export function createEquator300() {
  const root = new THREE.Group();
  root.name = "Equator300";
  const scale = 0.0018;
  root.scale.setScalar(scale);

  const mat = (color, roughness = 0.48, metalness = 0.3) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const frame = mat(0x33373d);
  const frameLight = mat(0x44484f);
  const dark = mat(0x1c1e22);
  const orange = mat(0xf26a12, 0.42, 0.1);
  const rail = mat(0x2b2e33, 0.34, 0.55);
  const steel = mat(0x9aa2ab, 0.28, 0.9);
  const tableMat = mat(0x6e747c, 0.55, 0.35);
  const ruby = mat(0xd23a3a, 0.25, 0.2);
  const partMat = mat(0xcbd2d7, 0.32, 0.72);
  const add = (parent, geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };
  const cylinder = (r1, r2, height, sides = 24) => new THREE.CylinderGeometry(r1, r2, height, sides);
  const polar = (degrees, radius) => {
    const a = degrees * Math.PI / 180;
    return [Math.sin(a) * radius, Math.cos(a) * radius];
  };
  const rod = (parent, from, to, radius, material) => {
    const direction = to.clone().sub(from);
    const mesh = add(parent, cylinder(radius, radius, direction.length(), 12), material, 0, 0, 0);
    mesh.position.copy(from).addScaledVector(direction, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  };

  // Six-sided base, raised table and six adjustable feet.
  add(root, cylinder(329, 350, 78, 6), frame, 0, 57, 0).rotation.y = -Math.PI / 6;
  add(root, cylinder(225, 250, 44, 6), frameLight, 0, 118, 0).rotation.y = -Math.PI / 6;
  add(root, cylinder(150, 150, 19, 40), tableMat, 0, 149.5, 0);
  for (let i = 0; i < 6; i += 1) {
    const [x, z] = polar(30 + i * 60, 300);
    add(root, cylinder(18, 22, 18), orange, x, 12, z);
    add(root, cylinder(24, 24, 6), dark, x, 3, z);
  }

  // Three rail pairs, three upper wheels and their triangular support rods.
  for (const angle of [60, 180, 300]) {
    const [cx, cz] = polar(angle, 320);
    const tangentialX = Math.cos(angle * Math.PI / 180);
    const tangentialZ = -Math.sin(angle * Math.PI / 180);
    for (const offset of [-46, 46]) {
      const x = cx + tangentialX * offset;
      const z = cz + tangentialZ * offset;
      add(root, cylinder(17, 17, 660, 16), rail, x, 373, z);
      rod(root, new THREE.Vector3(x, 678, z), new THREE.Vector3(0, 464, 0), 10, steel);
    }
    const [wx, wz] = polar(angle, 330);
    const wheel = add(root, cylinder(75, 75, 62, 36), dark, wx, 716, wz);
    wheel.rotation.x = Math.PI / 2;
    add(root, cylinder(24, 24, 68, 24), steel, wx, 716, wz).rotation.x = Math.PI / 2;
    add(root, cylinder(34, 34, 66), frameLight, wx, 772, wz);
  }

  // Three-lobed head cover, upper enclosure and recognisable orange fascia.
  add(root, cylinder(205, 205, 74, 48), frame, 0, 777, 0);
  for (const angle of [60, 180, 300]) {
    const [x, z] = polar(angle, 294);
    add(root, cylinder(105, 105, 74, 32), frame, x, 777, z);
    add(root, cylinder(72, 72, 72, 24), frame, x * 0.55, 777, z * 0.55);
    add(root, cylinder(58, 66, 34), dark, x * 0.62, 826, z * 0.62);
  }
  add(root, new THREE.BoxGeometry(250, 145, 175), frame, 0, 886, 0);
  add(root, new THREE.BoxGeometry(120, 56, 27), orange, 0, 845, 101);

  // Central spindle, SP25-style probe and ruby stylus ball.
  add(root, cylinder(28, 28, 215), steel, 0, 570, 0);
  add(root, cylinder(32, 20, 48), frameLight, 0, 396, 0);
  add(root, cylinder(4, 4, 118, 12), steel, 0, 310, 0);
  add(root, new THREE.SphereGeometry(6, 18, 12), ruby, 0, 246, 0);

  // The inspection workpiece is controlled by the workshop animation, not the viewer's demo cup.
  const workpiece = add(root, cylinder(37, 37, 30, 24), partMat, 0, 176, 0);
  workpiece.visible = false;
  return { root, workpiece };
}
