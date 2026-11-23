import * as THREE from "three";
import { createHumanFigure } from "./humanFigure.ts";

// Everyday vehicles for the village, built to real proportions (metres x K = scene units).
// Forward is +Z, the axle is the X axis, so a yaw of atan2(dx, dz) points them along their route.
// Wheels are named groups so they can roll; geometry and materials are shared by all vehicles of a kind.

const K = 1.14; // scene units per metre (a 1.75 m person is about 2 units tall)
export type VehicleKind = "car" | "moto" | "bicycle";

export interface Vehicle {
  kind: VehicleKind;
  group: THREE.Group;
  wheels: { obj: THREE.Object3D; radius: number }[];
  crank: THREE.Object3D | null;
  /** how much faster than walking this vehicle moves in the village */
  speedFactor: number;
  /** where it is parked at home, and which way it faces there */
  park: { x: number; z: number; yaw: number };
  rider: THREE.Group | null;
}

const cache = new Map<string, THREE.BufferGeometry>();
const geo = (key: string, make: () => THREE.BufferGeometry) => {
  let g = cache.get(key);
  if (!g) { g = make(); cache.set(key, g); }
  return g;
};
const mats = new Map<string, THREE.MeshStandardMaterial>();
const mat = (color: string, rough = 0.6, metal = 0.2, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  const key = color + rough + metal + JSON.stringify(extra);
  let m = mats.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra }); mats.set(key, m); }
  return m;
};

const box = (p: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
  const mesh = new THREE.Mesh(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w * K, h * K, d * K)), m);
  mesh.position.set(x * K, y * K, z * K);
  mesh.castShadow = true;
  p.add(mesh);
  return mesh;
};

/** cylinder between two points (metres) */
const tube = (p: THREE.Object3D, a: [number, number, number], b: [number, number, number], r: number, m: THREE.Material) => {
  const va = new THREE.Vector3(...a).multiplyScalar(K), vb = new THREE.Vector3(...b).multiplyScalar(K);
  const len = va.distanceTo(vb);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r * K, r * K, len, 8, 1), m);
  mesh.position.copy(va).add(vb).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  p.add(mesh);
  return mesh;
};

/** a wheel with tyre, rim, hub and spokes; spins about X */
function wheel(p: THREE.Object3D, radius: number, tyre: number, x: number, y: number, z: number, spokes: boolean, width = 0) {
  const w = new THREE.Group();
  w.position.set(x * K, y * K, z * K);
  const rubber = mat("#151515", 0.9, 0);
  const metal = mat("#b9bec4", 0.35, 0.8);
  if (width > 0) { // car / motorbike: solid tyre
    const t = new THREE.Mesh(geo(`t${radius},${width}`, () => new THREE.CylinderGeometry(radius * K, radius * K, width * K, 20)), rubber);
    t.rotation.z = Math.PI / 2;
    w.add(t);
    const rim = new THREE.Mesh(geo(`r${radius},${width}`, () => new THREE.CylinderGeometry(radius * 0.62 * K, radius * 0.62 * K, (width + 0.01) * K, 14)), metal);
    rim.rotation.z = Math.PI / 2;
    w.add(rim);
    // one off-centre bolt so rolling is visible
    const bolt = new THREE.Mesh(geo("bolt", () => new THREE.BoxGeometry(0.03 * K, 0.1 * K, 0.04 * K)), rubber);
    bolt.position.set((width / 2 + 0.01) * K, radius * 0.35 * K, 0);
    w.add(bolt);
  } else { // bicycle: thin tyre + rim + spokes
    const t = new THREE.Mesh(geo(`tt${radius}`, () => new THREE.TorusGeometry(radius * K, tyre * K, 8, 28)), rubber);
    t.rotation.y = Math.PI / 2;
    w.add(t);
    const rim = new THREE.Mesh(geo(`rr${radius}`, () => new THREE.TorusGeometry((radius - tyre) * K, 0.008 * K, 6, 28)), metal);
    rim.rotation.y = Math.PI / 2;
    w.add(rim);
  }
  if (spokes) {
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(geo(`s${radius}`, () => new THREE.CylinderGeometry(0.004 * K, 0.004 * K, (radius * 2 - 0.05) * K, 4)), metal);
      s.rotation.x = (i * Math.PI) / 3;
      w.add(s);
    }
  }
  p.add(w);
  return { obj: w, radius: radius * K };
}

/* ---------------- bicycle: diamond frame, basket-less city bike ---------------- */
function buildBicycle(color: string): Vehicle {
  const g = new THREE.Group();
  const frame = mat(color, 0.4, 0.6), dark = mat("#222", 0.6, 0.3);
  const wheels = [wheel(g, 0.34, 0.025, 0, 0.34, 0.55, true), wheel(g, 0.34, 0.025, 0, 0.34, -0.55, true)];
  const bb: [number, number, number] = [0, 0.3, 0], seatTop: [number, number, number] = [0, 0.78, -0.17];
  const head: [number, number, number] = [0, 0.88, 0.45], rear: [number, number, number] = [0, 0.34, -0.55], front: [number, number, number] = [0, 0.34, 0.55];
  tube(g, bb, seatTop, 0.017, frame); tube(g, bb, head, 0.019, frame); tube(g, seatTop, head, 0.015, frame);
  tube(g, rear, bb, 0.012, frame); tube(g, rear, seatTop, 0.012, frame); tube(g, head, front, 0.014, frame);
  tube(g, [0, 0.88, 0.45], [0, 1.0, 0.42], 0.013, dark);                       // stem
  tube(g, [-0.27, 1.0, 0.42], [0.27, 1.0, 0.42], 0.011, dark);                  // handlebar
  box(g, 0.14, 0.04, 0.26, dark, 0, 0.81, -0.19);                               // saddle
  box(g, 0.2, 0.02, 0.32, dark, 0, 0.58, -0.66);                                // rear rack
  box(g, 0.32, 0.16, 0.26, mat("#8d6e63", 0.9, 0), 0, 1.08, 0.5);               // front basket
  const crank = new THREE.Group();
  crank.position.set(0, 0.3 * K, 0);
  tube(crank, [-0.08, 0.17, 0], [-0.08, -0.17, 0], 0.012, dark);
  box(crank, 0.1, 0.02, 0.1, dark, -0.12, -0.17, 0);
  box(crank, 0.1, 0.02, 0.1, dark, 0.12, 0.17, 0);
  g.add(crank);
  return { kind: "bicycle", group: g, wheels, crank, speedFactor: 1.7, park: { x: 0, z: 0, yaw: 0 }, rider: null };
}

/* ---------------- motorbike: step-through moped, the everyday village bike ---------------- */
function buildMoto(color: string): Vehicle {
  const g = new THREE.Group();
  const body = mat(color, 0.35, 0.5), dark = mat("#1b1b1d", 0.6, 0.3), chrome = mat("#c8ccd0", 0.25, 0.9);
  const wheels = [wheel(g, 0.27, 0, 0, 0.27, 0.6, true, 0.1), wheel(g, 0.27, 0, 0, 0.27, -0.6, true, 0.1)];
  box(g, 0.24, 0.28, 0.5, body, 0, 0.5, -0.12);                                  // body cover
  box(g, 0.26, 0.5, 0.07, body, 0, 0.66, 0.36).rotation.x = -0.25;               // leg shield
  box(g, 0.14, 0.04, 0.5, dark, 0, 0.3, 0.05);                                   // floorboard (step-through)
  box(g, 0.3, 0.09, 0.62, dark, 0, 0.78, -0.28);                                 // seat
  box(g, 0.22, 0.16, 0.34, body, 0, 0.6, -0.68);                                 // tail cover
  box(g, 0.18, 0.05, 0.08, mat("#d63031", 0.4, 0, { emissive: "#7a0c0c", emissiveIntensity: 0.4 }), 0, 0.65, -0.87); // tail light
  box(g, 0.2, 0.03, 0.4, body, 0, 0.56, 0.6);                                    // front mudguard
  box(g, 0.2, 0.03, 0.36, body, 0, 0.48, -0.78);                                 // rear mudguard
  tube(g, [0, 0.95, 0.4], [0, 0.35, 0.6], 0.018, chrome);                         // fork
  tube(g, [-0.3, 1.0, 0.38], [0.3, 1.0, 0.38], 0.014, dark);                      // handlebar
  const lamp = new THREE.Mesh(geo("lamp", () => new THREE.SphereGeometry(0.075 * K, 12, 8)), mat("#fff6c9", 0.2, 0.1, { emissive: "#fff2b0", emissiveIntensity: 0.5 }));
  lamp.position.set(0, 0.95 * K, 0.5 * K);
  g.add(lamp);
  for (const s of [-1, 1]) box(g, 0.05, 0.04, 0.06, chrome, s * 0.28, 1.03, 0.36); // mirrors
  tube(g, [0.16, 0.3, -0.5], [0.16, 0.34, 0.05], 0.035, chrome);                  // exhaust
  box(g, 0.2, 0.2, 0.3, mat("#303034", 0.5, 0.5), 0, 0.3, -0.25);                 // engine
  return { kind: "moto", group: g, wheels, crank: null, speedFactor: 2.3, park: { x: 0, z: 0, yaw: 0 }, rider: null };
}

/* ---------------- car: family sedan from a real side profile ---------------- */
function buildCar(color: string): Vehicle {
  const g = new THREE.Group();
  const paint = mat(color, 0.3, 0.6), glass = mat("#20303c", 0.1, 0.5, { transparent: true, opacity: 0.6 }), dark = mat("#161616", 0.6, 0.2);
  const side = (pts: [number, number][], width: number, m: THREE.Material) => {
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i === 0 ? s.moveTo(x * K, y * K) : s.lineTo(x * K, y * K)));
    s.closePath();
    const geom = new THREE.ExtrudeGeometry(s, { depth: width * K, bevelEnabled: false });
    geom.rotateY(-Math.PI / 2);          // profile x -> forward (+Z), extrusion -> across X
    geom.translate((width * K) / 2, 0, 0);
    const mesh = new THREE.Mesh(geom, m);
    mesh.castShadow = true;
    g.add(mesh);
  };
  side([[-2.15, 0.32], [-2.15, 0.92], [-1.4, 0.96], [1.2, 0.92], [2.1, 0.86], [2.15, 0.6], [2.15, 0.32]], 1.8, paint);   // lower body
  side([[-1.4, 0.95], [-0.95, 1.42], [0.45, 1.42], [1.1, 0.95]], 1.6, glass);                                           // glasshouse
  side([[-0.95, 1.4], [-0.9, 1.46], [0.4, 1.46], [0.45, 1.4]], 1.62, paint);                                            // roof panel
  const wheels = [] as Vehicle["wheels"];
  for (const x of [-0.9, 0.9]) for (const z of [-1.35, 1.35]) wheels.push(wheel(g, 0.33, 0, x, 0.33, z, false, 0.22));
  const lamp = mat("#fff7d6", 0.2, 0.1, { emissive: "#fff2b0", emissiveIntensity: 0.5 });
  const tail = mat("#c0392b", 0.4, 0.1, { emissive: "#7a0c0c", emissiveIntensity: 0.4 });
  for (const s of [-1, 1]) { box(g, 0.34, 0.12, 0.05, lamp, s * 0.62, 0.74, 2.15); box(g, 0.3, 0.1, 0.05, tail, s * 0.64, 0.8, -2.16); }
  box(g, 1.7, 0.16, 0.12, dark, 0, 0.42, 2.15);                                  // front bumper
  box(g, 1.7, 0.16, 0.12, dark, 0, 0.42, -2.15);                                 // rear bumper
  box(g, 0.34, 0.12, 0.02, mat("#f2f2f2", 0.6, 0), 0, 0.62, -2.18);              // number plate
  return { kind: "car", group: g, wheels, crank: null, speedFactor: 2.6, park: { x: 0, z: 0, yaw: 0 }, rider: null };
}

export function createVehicle(kind: VehicleKind, color: string): Vehicle {
  return kind === "car" ? buildCar(color) : kind === "moto" ? buildMoto(color) : buildBicycle(color);
}

/* ---------------- riders: a small pool, borrowed only while a vehicle is moving ---------------- */
const SEAT: Record<VehicleKind, { x: number; y: number; z: number }> = {
  bicycle: { x: 0, y: 0.84, z: -0.2 },
  moto: { x: 0, y: 0.82, z: -0.25 },
  car: { x: -0.45, y: 0.52, z: -0.2 }, // driver sits on the left
};
const riderPool: Record<VehicleKind, THREE.Group[]> = { car: [], moto: [], bicycle: [] };
const shirts = ["#2d6cdf", "#e17055", "#00b894", "#6c5ce7", "#fdcb6e", "#d63031"];
let riderCount = 0;
const POOL_LIMIT: Record<VehicleKind, number> = { car: 8, moto: 14, bicycle: 14 };

export function borrowRider(v: Vehicle): boolean {
  if (v.rider) return true;
  let r = riderPool[v.kind].pop() ?? null;
  if (!r) {
    if (riderCount >= POOL_LIMIT.car + POOL_LIMIT.moto + POOL_LIMIT.bicycle) return false;
    const n = riderCount++;
    r = createHumanFigure({
      height: 2.0, sitting: true, seatHeight: SEAT[v.kind].y * K,
      shirt: shirts[n % shirts.length], skin: [0xc58e69, 0xc99672, 0xb98560][n % 3],
      hat: v.kind === "moto" ? "helmet" : "none", hatColor: "#f5f5f5", longSleeves: v.kind !== "car",
      female: n % 4 === 0, hairStyle: n % 4 === 0 ? "long" : "short",
    });
  }
  const s = SEAT[v.kind];
  r.position.set(s.x * K, 0, s.z * K);
  r.rotation.set(0, 0, 0);
  v.group.add(r);
  v.rider = r;
  return true;
}

export function returnRider(v: Vehicle): void {
  if (!v.rider) return;
  v.group.remove(v.rider);
  riderPool[v.kind].push(v.rider);
  v.rider = null;
}

/** roll the wheels, turn the pedals and bob the legs for `dist` scene units travelled */
export function rollVehicle(v: Vehicle, dist: number): void {
  for (const w of v.wheels) w.obj.rotation.x += dist / w.radius;
  if (v.crank) {
    v.crank.rotation.x += dist * 2.2;
    if (v.rider) {
      let side = 1;
      v.rider.traverse((c) => {
        if (c.name === "sitLeg") { c.rotation.x = -Math.PI / 2 + 0.45 * Math.sin(v.crank!.rotation.x + (side > 0 ? 0 : Math.PI)); side = -side; }
      });
    }
  }
}
