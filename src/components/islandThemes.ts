import * as THREE from 'three';
import { createCharacterLineup } from './characterFactory.ts';

export const GROUND = 2.5;
export const THEME_MESH_BUDGET = 400;

type Spot = [number, number, number, number];

function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
function std(color: number, roughness = 0.8): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}
function glassMat(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0x7fb8e6, roughness: 0.1, metalness: 0.4 });
  m.emissive.set(0x1c3a55); m.emissiveIntensity = 0.6; return m;
}
function lampMat(): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: 0xffe9a8, roughness: 0.3 });
  m.emissive.set(0xffdd77); m.emissiveIntensity = 1.6; return m;
}
function shaded<T extends THREE.Mesh>(mesh: T, x: number, y: number, z: number): T {
  mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}
function box(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  return shaded(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat), x, y, z);
}
function cyl(rTop: number, rBottom: number, h: number, seg: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  return shaded(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, seg), mat), x, y, z);
}
function instanced(geo: THREE.BufferGeometry, mat: THREE.Material, spots: Spot[]): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geo, mat, spots.length);
  const dummy = new THREE.Object3D();
  spots.forEach(([x, y, z, s], i) => {
    dummy.position.set(x, y, z); dummy.scale.setScalar(s); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false;
  mesh.castShadow = true; mesh.receiveShadow = true; return mesh;
}

// ---------------------------------------------------------------- nature island
export function createNatureIsland(): THREE.Group {
  const g = new THREE.Group(); g.name = 'theme-nature';
  const peakX = -6, peakZ = -8, hillX = 16, hillZ = 8;
  g.add(shaded(new THREE.Mesh(new THREE.ConeGeometry(15, 32, 8), std(0x6f7d5c, 0.95)), peakX, GROUND + 16, peakZ));
  const hill = shaded(new THREE.Mesh(new THREE.SphereGeometry(11, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0x4f8a3a, 0.9)), hillX, GROUND, hillZ);
  hill.scale.y = 0.6; g.add(hill);
  const water = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.1, transparent: true, opacity: 0.85 });
  const fall = shaded(new THREE.Mesh(new THREE.BoxGeometry(2.4, 20, 0.5), water), peakX, GROUND + 10, peakZ + 10.9);
  fall.rotation.x = -Math.atan(15 / 32); g.add(fall);
  g.add(shaded(new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.3, 20), water), peakX, GROUND + 0.15, peakZ + 18));
  const rand = rng(7); const trunks: Spot[] = []; const crowns: Spot[] = [];
  for (let tries = 0; tries < 600 && trunks.length < 70; tries++) {
    const a = rand() * Math.PI * 2, r = 8 + rand() * 34;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - peakX, z - peakZ) < 17) continue;
    if (Math.hypot(x - hillX, z - hillZ) < 12) continue;
    if (Math.hypot(x - peakX, z - (peakZ + 18)) < 6) continue;
    const s = 0.8 + rand() * 0.7;
    trunks.push([x, GROUND + 1.2 * s, z, s]); crowns.push([x, GROUND + 4.2 * s, z, s]);
  }
  g.add(instanced(new THREE.CylinderGeometry(0.25, 0.35, 2.4, 6), std(0x6b4423, 0.9), trunks));
  g.add(instanced(new THREE.ConeGeometry(1.9, 4.6, 7), std(0x2d6a2d, 0.85), crowns));
  return g;
}

// --------------------------------------------------------------- airport island
export function createAirportIsland(): THREE.Group {
  const g = new THREE.Group(); g.name = 'theme-airport';
  const asphalt = std(0x2b2d31, 0.9), concrete = std(0x9aa0a6, 0.9), white = std(0xf2f2f2, 0.7);
  const dark = std(0x3a3f47, 0.8), glass = glassMat();
  g.add(box(84, 0.3, 9, asphalt, 0, GROUND + 0.15, 0));
  const marks: Spot[] = [];
  for (let i = 0; i < 14; i++) marks.push([-35.75 + i * 5.5, GROUND + 0.33, 0, 1]);
  g.add(instanced(new THREE.BoxGeometry(3, 0.06, 0.5), white, marks));
  g.add(box(30, 0.3, 14, concrete, -20, GROUND + 0.15, -14));
  g.add(box(22, 6, 8, white, -20, GROUND + 3.3, -17));
  g.add(box(22.4, 2, 8.4, glass, -20, GROUND + 4.2, -17));
  g.add(box(23, 0.6, 9, dark, -20, GROUND + 6.6, -17));
  g.add(cyl(1.4, 1.9, 14, 12, white, 18, GROUND + 7, -14));
  g.add(cyl(3.2, 2.4, 3, 12, glass, 18, GROUND + 15.5, -14));
  g.add(cyl(3.6, 3.6, 0.5, 12, dark, 18, GROUND + 17.3, -14));
  const hangar = std(0x7f8c8d, 0.8);
  g.add(box(14, 5, 10, hangar, 20, GROUND + 2.5, 18));
  g.add(box(14, 5, 10, hangar, -2, GROUND + 2.5, 20));

  // ដាក់តួអង្គទាំង ២០ នៅលើកោះព្រលានយន្តហោះ
  g.add(createCharacterLineup());
  return g;
}

// ------------------------------------------------------------------ port island
function crane(x: number, z: number, body: THREE.Material, dark: THREE.Material): THREE.Group {
  const c = new THREE.Group(); const base = GROUND + 0.1;
  for (const lx of [-3, 3]) { for (const lz of [-2.5, 2.5]) c.add(box(0.7, 12, 0.7, body, lx, base + 6, lz)); }
  c.add(box(8, 1, 7, body, 0, base + 12.5, 0));
  c.add(box(1.2, 1, 20, body, 0, base + 14, 8)); // ខ្លីជាងមុន (ពី 26 → 20)
  c.add(box(2, 1.4, 2, dark, 0, base + 13, 12));
  c.position.set(x, 0, z); return c;
}

export function createPortIsland(): THREE.Group {
  const g = new THREE.Group(); g.name = 'theme-port';
  const concrete = std(0x8d949b, 0.9), white = std(0xf4f4f4, 0.6), red = std(0xc0392b, 0.6), dark = std(0x2f3a45, 0.7);
  const quayTop = GROUND + 0.1;
  g.add(box(60, quayTop, 16, concrete, 0, quayTop / 2, 46));
  const palette = [0xc0392b, 0x2e86c1, 0xe67e22, 0x27ae60, 0xecf0f1, 0xf1c40f];
  const spots: Spot[] = [];
  for (const z of [41, 45]) { for (let i = 0; i < 8; i++) { for (let level = 0; level < 2; level++) spots.push([-24.5 + i * 7, quayTop + 1.3 + level * 2.6, z, 1]); } }
  const containers = instanced(new THREE.BoxGeometry(6, 2.5, 2.4), std(0xffffff, 0.6), spots);
  const tint = new THREE.Color();
  spots.forEach((_, i) => { tint.setHex(palette[i % palette.length] ?? 0xffffff); containers.setColorAt(i, tint); });
  if (containers.instanceColor) containers.instanceColor.needsUpdate = true;
  g.add(containers);
  const orange = std(0xe67e22, 0.6);
  g.add(crane(-12, 50, orange, dark)); g.add(crane(16, 50, orange, dark));
  const lh = new THREE.Group();
  lh.add(cyl(1.6, 2.6, 20, 12, white, 0, GROUND + 10, 0));
  lh.add(cyl(2.03, 2.15, 3, 12, red, 0, GROUND + 6, 0));
  lh.add(cyl(1.93, 2.08, 3, 12, red, 0, GROUND + 13.5, 0));
  lh.add(cyl(2.3, 2.3, 0.4, 12, dark, 0, GROUND + 20.2, 0));
  lh.add(cyl(1.5, 1.5, 2.4, 12, lampMat(), 0, GROUND + 21.4, 0));
  lh.add(shaded(new THREE.Mesh(new THREE.ConeGeometry(2.1, 1.8, 12), red), 0, GROUND + 23.5, 0));
  lh.position.set(-30, 0, 26); g.add(lh);
  g.add(box(18, 5, 9, std(0x7f8c8d, 0.8), 22, GROUND + 2.5, 14));
  return g;
}

export function createThemedIsland(type: string): THREE.Group | null {
  if (type === 'nature-island') return createNatureIsland();
  if (type === 'airport-island') return createAirportIsland();
  if (type === 'port-island') return createPortIsland();
  return null;
}
