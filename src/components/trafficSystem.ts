import * as THREE from "three";
import { createHumanFigure } from "./humanFigure";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   បង្កើតម៉ូតូ (សម្រាប់ animation)
   ============================================================ */
export function createAnimatedMotorbike(color = "#e74c3c"): THREE.Group {
  // Faces +z. Two spoked wheels, frame, tank, seat, handlebar, headlight, exhaust and a seated rider with helmet.
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.35 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.6 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xcfd3d8, metalness: 0.9, roughness: 0.2 });

  for (const z of [0.72, -0.72]) {
    const wheel = new THREE.Group();
    wheel.name = "wheel";
    wheel.position.set(0, 0.34, z);
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 10, 24), new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.9 }));
    tyre.rotation.y = Math.PI / 2;
    wheel.add(tyre);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 10), chrome);
    hub.rotation.z = Math.PI / 2;
    wheel.add(hub);
    for (let i = 0; i < 4; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), chrome);
      spoke.rotation.x = (i / 4) * Math.PI;
      wheel.add(spoke);
    }
    wheel.traverse((c) => { (c as THREE.Mesh).castShadow = true; });
    g.add(wheel);
  }
  // fork and rear swing arm
  const fork = add3(g, new THREE.CylinderGeometry(0.025, 0.025, 0.75, 8), chrome, 0, 0.7, 0.62);
  fork.rotation.x = 0.3;
  const arm = add3(g, new THREE.BoxGeometry(0.1, 0.06, 0.8), dark, 0, 0.36, -0.4);
  arm.rotation.x = 0.05;
  // engine, tank, seat, rear cover
  add3(g, new THREE.BoxGeometry(0.28, 0.3, 0.45), dark, 0, 0.42, 0.05);
  add3(g, new THREE.CapsuleGeometry(0.15, 0.3, 6, 12), paint, 0, 0.85, 0.3).rotation.x = Math.PI / 2;
  add3(g, new THREE.BoxGeometry(0.26, 0.09, 0.62), dark, 0, 0.8, -0.28);
  add3(g, new THREE.BoxGeometry(0.22, 0.16, 0.5), paint, 0, 0.74, -0.78);
  const pipe = add3(g, new THREE.CylinderGeometry(0.04, 0.05, 0.6, 10), chrome, 0.17, 0.35, -0.5);
  pipe.rotation.x = Math.PI / 2;
  // handlebar, headlight, tail light, front mudguard
  add3(g, new THREE.CylinderGeometry(0.02, 0.02, 0.62, 8), dark, 0, 1.05, 0.52).rotation.z = Math.PI / 2;
  add3(g, new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xfff2b0, emissiveIntensity: 0.6 }), 0, 0.98, 0.72).scale.set(1, 1, 0.7);
  add3(g, new THREE.BoxGeometry(0.12, 0.06, 0.04), new THREE.MeshStandardMaterial({ color: 0xcc1111, emissive: 0x880000, emissiveIntensity: 0.5 }), 0, 0.78, -1.05);
  add3(g, new THREE.BoxGeometry(0.14, 0.03, 0.4), paint, 0, 0.68, 0.78);

  const rider = createHumanFigure({
    lite: true, height: 1.8, shirt: 0x2c3e50, pants: 0x34495e, skin: 0xc58e69, hat: "helmet", hatColor: 0xf1c40f,
    sitting: true, seatHeight: 0.8, longSleeves: true, hairStyle: "short",
  });
  rider.position.set(0, 0, -0.22);
  g.add(rider);
  g.traverse((c) => { if ((c as THREE.Mesh).isMesh) c.castShadow = true; });
  return g;
}

/* ============================================================
   បង្កើតឡាន (សម្រាប់ animation)
   ============================================================ */
let carBodyGeo: THREE.ExtrudeGeometry | undefined;
let carWinGeo: THREE.ExtrudeGeometry | undefined;

export function createAnimatedCar(color = "#c0392b"): THREE.Group {
  // Faces +z (drives forward along the road). Body = extruded side profile with bevel, so it has a
  // real car silhouette (hood, windscreen, roof, boot) instead of two boxes.
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color, metalness: 0.35, roughness: 0.32 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x16202b, metalness: 0.6, roughness: 0.08 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.7 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xcfd3d8, metalness: 0.9, roughness: 0.2 });

  const prof = new THREE.Shape();
  prof.moveTo(-2.0, 0.38);
  prof.lineTo(-2.1, 0.6);
  prof.lineTo(-2.05, 0.98);
  prof.lineTo(-1.3, 1.02);
  prof.lineTo(-0.8, 1.52);
  prof.lineTo(0.5, 1.52);
  prof.lineTo(1.1, 1.02);
  prof.lineTo(2.0, 0.92);
  prof.lineTo(2.1, 0.66);
  prof.lineTo(2.0, 0.38);
  prof.lineTo(-2.0, 0.38);
  if (!carBodyGeo) {
    carBodyGeo = new THREE.ExtrudeGeometry(prof, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 4, curveSegments: 6 });
    carBodyGeo.translate(0, 0, -0.75);
  }
  const bodyGeo = carBodyGeo;
  const body = new THREE.Mesh(bodyGeo, paint);
  body.rotation.y = -Math.PI / 2;
  body.castShadow = true;
  g.add(body);

  // side windows
  const win = new THREE.Shape();
  win.moveTo(-0.72, 1.06); win.lineTo(-0.58, 1.47); win.lineTo(0.42, 1.47); win.lineTo(0.92, 1.06); win.lineTo(-0.72, 1.06);
  if (!carWinGeo) {
    carWinGeo = new THREE.ExtrudeGeometry(win, { depth: 1.78, bevelEnabled: false });
    carWinGeo.translate(0, 0, -0.89);
  }
  const winGeo = carWinGeo;
  const windows = new THREE.Mesh(winGeo, glass);
  windows.rotation.y = -Math.PI / 2;
  g.add(windows);
  // windscreen and rear window
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.02), glass);
  ws.position.set(0, 1.296, 0.81);
  ws.rotation.x = -0.85;
  g.add(ws);
  const rw = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.74, 0.02), glass);
  rw.position.set(0, 1.285, -1.06);
  rw.rotation.x = 0.74;
  g.add(rw);

  // bumpers, grille, lights, mirrors
  add3(g, new THREE.BoxGeometry(1.72, 0.14, 0.14), dark, 0, 0.45, 2.17);
  add3(g, new THREE.BoxGeometry(1.72, 0.14, 0.14), dark, 0, 0.45, -2.17);
  add3(g, new THREE.BoxGeometry(0.7, 0.16, 0.04), chrome, 0, 0.68, 2.2);
  for (const s of [-1, 1]) {
    add3(g, new THREE.SphereGeometry(0.11, 12, 8), new THREE.MeshStandardMaterial({ color: 0xfff6d0, emissive: 0xfff2b0, emissiveIntensity: 0.6 }), s * 0.62, 0.78, 2.12).scale.set(1, 0.7, 0.6);
    add3(g, new THREE.BoxGeometry(0.28, 0.1, 0.05), new THREE.MeshStandardMaterial({ color: 0xcc1111, emissive: 0x880000, emissiveIntensity: 0.5 }), s * 0.62, 0.82, -2.2);
    add3(g, new THREE.BoxGeometry(0.1, 0.07, 0.14), paint, s * 0.98, 1.06, 0.78);
  }

  // wheels: tyre + rim; the "wheel" group spins about its x axle
  for (const [x, z] of [[-0.86, 1.3], [0.86, 1.3], [-0.86, -1.3], [0.86, -1.3]] as [number, number][]) {
    const wheel = new THREE.Group();
    wheel.name = "wheel";
    wheel.position.set(x, 0.37, z);
    const tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.26, 22), new THREE.MeshStandardMaterial({ color: 0x101010, roughness: 0.9 }));
    tyre.rotation.z = Math.PI / 2;
    wheel.add(tyre);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.28, 18), chrome);
    rim.rotation.z = Math.PI / 2;
    wheel.add(rim);
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.05, 0.4), dark);
      spoke.rotation.x = (i / 5) * Math.PI;
      wheel.add(spoke);
    }
    wheel.traverse((c) => { (c as THREE.Mesh).castShadow = true; });
    g.add(wheel);
  }
  return g;
}

function add3(parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

/* ============================================================
   បង្កើតអ្នកថ្មើរជើង (Walk)
   ============================================================ */
export function createWalker(shirtColor = "#3498db"): THREE.Group {
  const n = shirtColor.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const skins = [0xc58e69, 0xc99672, 0xb98560, 0xd0a07c];
  const female = n % 3 === 1;
  return createHumanFigure({ lite: true,
    height: 1.95 + (n % 4) * 0.04, shirt: shirtColor, pants: female ? 0x3b2f5e : 0x2c3e50, skin: skins[n % skins.length],
    female, skirt: female, hairStyle: female ? "long" : "short", longSleeves: false,
  });
}

/* ============================================================
   Traffic System — គ្រប់គ្រងការធ្វើដំណើរ
   ============================================================ */
export interface TrafficVehicle {
  mesh: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  type: "motorbike" | "car" | "walker";
}

export function createTrafficCurves(): {
  mainRoad: THREE.CatmullRomCurve3;
  innerRoad: THREE.CatmullRomCurve3;
  walkway: THREE.CatmullRomCurve3;
} {
  // ផ្លូវធំ (loop ជុំវិញភូមិ)
  const mainRoad = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-95, 0.5, 0),
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(95, 0.5, 0),
    new THREE.Vector3(95, 0.5, 50),
    new THREE.Vector3(0, 0.5, 50),
    new THREE.Vector3(-95, 0.5, 50),
    new THREE.Vector3(-95, 0.5, 0),
  ], true, "catmullrom", 0.5);

  // ផ្លូវខាងក្នុង
  const innerRoad = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-70, 0.5, 20),
    new THREE.Vector3(0, 0.5, 20),
    new THREE.Vector3(70, 0.5, 20),
    new THREE.Vector3(70, 0.5, -20),
    new THREE.Vector3(0, 0.5, -20),
    new THREE.Vector3(-70, 0.5, -20),
    new THREE.Vector3(-70, 0.5, 20),
  ], true, "catmullrom", 0.5);

  // ផ្លូវថ្មើរជើង
  const walkway = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-85, 0, 8),
    new THREE.Vector3(85, 0, 8),
    new THREE.Vector3(85, 0, -8),
    new THREE.Vector3(-85, 0, -8),
    new THREE.Vector3(-85, 0, 8),
  ], true, "catmullrom", 0.3);

  return { mainRoad, innerRoad, walkway };
}

/* ============================================================
   បង្កើតយានជំនិះទាំងអស់
   ============================================================ */
export function createTrafficSystem(): {
  group: THREE.Group;
  vehicles: TrafficVehicle[];
} {
  const group = new THREE.Group();
  const vehicles: TrafficVehicle[] = [];
  const curves = createTrafficCurves();

  // ម៉ូតូ ១០ តាមផ្លូវធំ
  const motorbikeColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#c0392b", "#16a085", "#8e44ad"];
  for (let i = 0; i < 10; i++) {
    const bike = createAnimatedMotorbike(motorbikeColors[i % motorbikeColors.length]);
    group.add(bike);
    vehicles.push({
      mesh: bike,
      curve: curves.mainRoad,
      speed: 0.015 + Math.random() * 0.01,
      offset: i / 10,
      type: "motorbike",
    });
  }

  // ឡាន ៥ តាមផ្លូវខាងក្នុង
  const carColors = ["#c0392b", "#2c3e50", "#e67e22", "#27ae60", "#8e44ad"];
  for (let i = 0; i < 5; i++) {
    const car = createAnimatedCar(carColors[i]);
    group.add(car);
    vehicles.push({
      mesh: car,
      curve: curves.innerRoad,
      speed: 0.008 + Math.random() * 0.005,
      offset: i / 5,
      type: "car",
    });
  }

  // អ្នកថ្មើរជើង ៨
  const shirtColors = ["#3498db", "#e74c3c", "#f39c12", "#27ae60", "#9b59b6", "#1abc9c", "#e67e22", "#2c3e50"];
  for (let i = 0; i < 8; i++) {
    const walker = createWalker(shirtColors[i]);
    group.add(walker);
    vehicles.push({
      mesh: walker,
      curve: curves.walkway,
      speed: 0.005 + Math.random() * 0.003,
      offset: i / 8,
      type: "walker",
    });
  }

  return { group, vehicles };
}

/* ============================================================
   Update traffic (ហៅក្នុង animation loop)
   ============================================================ */
export function updateTraffic(
  vehicles: TrafficVehicle[],
  elapsed: number
): void {
  vehicles.forEach((v) => {
    let t = (v.offset + v.speed * elapsed) % 1;
    if (t < 0) t += 1;

    const point = v.curve.getPointAt(t);
    const tangent = v.curve.getTangentAt(t);

    v.mesh.position.copy(point);
    // បង្វិលរថយន្តឱ្យងាកតាម tangent
    const angle = Math.atan2(tangent.x, tangent.z);
    v.mesh.rotation.y = angle;

    // បង្វិលកង់
    v.mesh.traverse((child) => {
      if (child.name === "wheel") {
        child.rotation.x += v.speed * 30;
      }
      if (child.name === "leg") {
        // ជើងញាក់
        const legMesh = child as THREE.Mesh;
        legMesh.rotation.x = (legMesh.userData.side ?? 1) * Math.sin(elapsed * 8 + v.offset * 10) * 0.4;
      }
    });
  });
}
