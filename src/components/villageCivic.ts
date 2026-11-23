import * as THREE from "three";
import { CLINIC_BUILDING, SCHOOL_BUILDING } from "./villageLayout.ts";
import { createVehicle } from "./vehicleModels.ts";

// The village school and clinic. Both are built facing +Z, then turned toward the street.
// Doors, yards and fences match the places in villageLayout.ts, where people walk to.

const M = new Map<string, THREE.MeshStandardMaterial>();
const mat = (color: string, rough = 0.8, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  const key = color + rough + JSON.stringify(extra);
  let m = M.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05, ...extra }); M.set(key, m); }
  return m;
};
const glass = () => mat("#9fd3ea", 0.1, { metalness: 0.3, transparent: true, opacity: 0.75 });

const box = (p: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  p.add(mesh);
  return mesh;
};
const cyl = (p: THREE.Object3D, r: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 10) => {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  p.add(mesh);
  return mesh;
};

/** gable roof: triangular prism along X */
function gableRoof(p: THREE.Object3D, w: number, d: number, rise: number, m: THREE.Material, y: number) {
  const s = new THREE.Shape();
  s.moveTo(-d / 2 - 0.6, 0); s.lineTo(d / 2 + 0.6, 0); s.lineTo(0, rise); s.closePath();
  const geom = new THREE.ExtrudeGeometry(s, { depth: w + 1.2, bevelEnabled: false });
  geom.translate(0, 0, -(w + 1.2) / 2);
  geom.rotateY(Math.PI / 2);
  const mesh = new THREE.Mesh(geom, m);
  mesh.position.y = y;
  mesh.castShadow = true;
  p.add(mesh);
}

function tree(p: THREE.Object3D, x: number, z: number, s = 1) {
  cyl(p, 0.25 * s, 3 * s, mat("#6d4c2f"), x, 1.5 * s, z, 6);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(1.7 * s, 10, 8), mat("#3f8f3a", 0.9));
  crown.position.set(x, 3.8 * s, z);
  crown.castShadow = true;
  p.add(crown);
}

/** low fence along a rectangle in the yard; `gap` leaves a gate opening on the front side */
function fence(p: THREE.Object3D, x0: number, x1: number, z0: number, z1: number, gap: [number, number] | null) {
  const post = mat("#7f8c8d"), rail = mat("#bdc3c7");
  const side = (ax: number, az: number, bx: number, bz: number, skip?: [number, number]) => {
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 2.5));
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (skip && z > skip[0] && z < skip[1] && Math.abs(bx - ax) < 0.01) continue;
      box(p, 0.15, 1.3, 0.15, post, x, 0.65, z);
    }
    const r = box(p, Math.abs(bx - ax) < 0.01 ? 0.08 : len, 0.1, Math.abs(bx - ax) < 0.01 ? len : 0.08, rail, (ax + bx) / 2, 1.0, (az + bz) / 2);
    if (skip) r.visible = false; // gate side has posts only
  };
  side(x0, z0, x1, z0); side(x0, z1, x1, z1); side(x0, z0, x0, z1); side(x1, z0, x1, z1, gap ?? undefined);
}

export function createVillageSchool(): THREE.Group {
  const root = new THREE.Group();
  const g = new THREE.Group();            // local: front faces +Z
  root.add(g);
  const W = 26, D = 9, H = 7;
  const wall = mat("#f4e9c9"), band = mat("#2b5aa8"), roof = mat("#b5472f", 0.7), trim = mat("#ffffff");
  box(g, W, H, D, wall, 0, H / 2, 0);                         // two storeys
  box(g, W + 0.2, 1.1, D + 0.2, band, 0, 0.55, 0);            // blue base stripe
  box(g, W + 0.4, 0.3, D + 0.4, trim, 0, 3.55, 0);            // floor slab line
  gableRoof(g, W, D, 2.8, roof, H);
  for (const fy of [1.9, 5.3]) for (let i = 0; i < 8; i++) {   // 16 windows on the front
    const x = -W / 2 + 2 + i * ((W - 4) / 7);
    if (fy < 3 && (i === 3 || i === 4)) continue;             // doors in the middle
    box(g, 1.6, 1.7, 0.12, glass(), x, fy, D / 2 + 0.04);
    box(g, 1.9, 0.18, 0.2, trim, x, fy - 0.95, D / 2 + 0.1);
  }
  for (const x of [-1.1, 1.1]) box(g, 1.7, 2.8, 0.15, mat("#6b4a2b"), x, 1.4, D / 2 + 0.05); // double door
  // covered veranda with pillars (children wait here when it rains)
  box(g, W - 4, 0.3, 3, trim, 0, 3.4, D / 2 + 1.5);
  for (let i = 0; i < 7; i++) cyl(g, 0.22, 3.3, trim, -W / 2 + 2 + i * ((W - 4) / 6), 1.65, D / 2 + 2.8);
  box(g, 6, 0.9, 0.2, mat("#1f4e9c"), 0, 6.4, D / 2 + 0.1);  // name board
  box(g, 5.2, 0.5, 0.05, trim, 0, 6.4, D / 2 + 0.22);
  box(g, 3.2, 0.3, 1.2, mat("#cfcfcf"), 0, 0.15, D / 2 + 0.7); // steps
  // yard: paved court, flagpole, basketball hoop, benches, trees, fence with a gate on the street side
  box(g, 26, 0.08, 16, mat("#b9b3a6", 0.95), 0, 0.04, D / 2 + 8.2);
  cyl(g, 0.1, 9, mat("#d0d3d4"), -8, 4.5, D / 2 + 9);
  box(g, 2.2, 1.3, 0.05, mat("#2b5aa8"), -6.9, 8.2, D / 2 + 9);
  cyl(g, 0.1, 4.2, mat("#444"), 9, 2.1, D / 2 + 12);
  box(g, 1.8, 1.2, 0.1, trim, 9, 4.3, D / 2 + 11.9);
  box(g, 3, 0.15, 0.8, mat("#8d6e63"), 4, 0.55, D / 2 + 4.2); box(g, 3, 0.15, 0.8, mat("#8d6e63"), -4, 0.55, D / 2 + 4.2);
  tree(g, -11, D / 2 + 13, 1.1); tree(g, 11, D / 2 + 14, 1.0); tree(g, -12, D / 2 + 4, 0.9);
  fence(g, -13, 13, D / 2 + 0.2, D / 2 + 16.4, [-2.2, 2.2]);
  root.position.set(SCHOOL_BUILDING.x, 0, SCHOOL_BUILDING.z);
  root.rotation.y = Math.PI / 2;     // front faces +X, toward the village
  return root;
}

export function createVillageClinic(): THREE.Group {
  const root = new THREE.Group();
  const g = new THREE.Group();
  root.add(g);
  const W = 20, D = 9, H = 4.6;
  const wall = mat("#f7f9fa"), green = mat("#1f9d6b"), red = mat("#d63031", 0.5), trim = mat("#dfe6e9");
  box(g, W, H, D, wall, 0, H / 2, 0);
  box(g, W + 0.2, 0.9, D + 0.2, green, 0, 0.45, 0);
  box(g, W + 1.6, 0.35, D + 1.6, trim, 0, H + 0.17, 0);       // flat roof with overhang
  box(g, 5, 1.2, 3, mat("#c8d0d4"), 4, H + 0.95, -1);         // rooftop air-conditioning unit
  for (let i = 0; i < 6; i++) {
    const x = -W / 2 + 2 + i * ((W - 4) / 5);
    if (i === 2 || i === 3) continue;
    box(g, 1.7, 1.5, 0.12, glass(), x, 2.4, D / 2 + 0.04);
    box(g, 2.0, 0.15, 0.2, trim, x, 1.58, D / 2 + 0.1);
  }
  box(g, 2.8, 2.9, 0.14, glass(), 0, 1.45, D / 2 + 0.05);     // glass entrance
  box(g, 6.5, 0.25, 3.2, trim, 0, 3.6, D / 2 + 1.6);          // entrance canopy
  for (const x of [-3, 3]) cyl(g, 0.18, 3.5, trim, x, 1.75, D / 2 + 3);
  // red cross sign on the front
  box(g, 2.4, 0.7, 0.12, red, 0, 4.0, D / 2 + 0.1); box(g, 0.7, 2.4, 0.12, red, 0, 4.0, D / 2 + 0.1);
  box(g, 3, 0.15, 3.5, mat("#bfc5c8"), 0, 0.08, D / 2 + 2.6);   // ramp / forecourt
  // yard: parking with an ambulance, benches, small garden, fence with a gate
  box(g, 20, 0.08, 13, mat("#b9b3a6", 0.95), 0, 0.04, D / 2 + 8.6);
  const amb = createVehicle("car", "#ffffff");
  amb.group.scale.set(1.25, 1.35, 1.1);
  amb.group.position.set(-5.5, 0, D / 2 + 9);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.22, 5.6), red);
  stripe.position.set(0, 0.95, 0); amb.group.add(stripe);
  const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.3), mat("#e74c3c", 0.3, { emissive: "#ff2d2d", emissiveIntensity: 0.6 }));
  beacon.position.set(0, 1.85, 0.2); amb.group.add(beacon);
  g.add(amb.group);
  box(g, 3, 0.15, 0.8, mat("#8d6e63"), 5, 0.55, D / 2 + 5); box(g, 3, 0.15, 0.8, mat("#8d6e63"), 8, 0.55, D / 2 + 5);
  tree(g, -9, D / 2 + 14, 1.0); tree(g, 9, D / 2 + 13, 1.1); tree(g, 8.5, D / 2 + 2.4, 0.8);
  for (let i = 0; i < 5; i++) box(g, 1, 0.5, 1, mat(["#e84393", "#fdcb6e", "#e17055", "#a29bfe", "#55efc4"][i]), -8 + i * 1.3, 0.3, D / 2 + 3);
  fence(g, -11, 11, D / 2 + 0.2, D / 2 + 15.4, [-2.2, 2.2]);
  root.position.set(CLINIC_BUILDING.x, 0, CLINIC_BUILDING.z);
  root.rotation.y = -Math.PI / 2;    // front faces -X, toward the village
  return root;
}
