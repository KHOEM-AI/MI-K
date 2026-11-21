// studioInfra.ts - KHOEM-AI 3D Studio: railway, trains, bridges, forest, corridor.
// 100% procedural (Three.js only), free, self-made. 1 unit = 1 metre.
type T3 = typeof import("three");
type V3 = import("three").Vector3;
type BG = import("three").BufferGeometry;
type MatT = import("three").Material;
type Grp = import("three").Group;
type Crv = import("three").Curve<import("three").Vector3>;
type P3 = [number, number, number];
type RGB = [number, number, number];
type Mk = (hex: string, rough?: number, metal?: number, extra?: Record<string, unknown>) => MatT;

export type InfraShape =
  | "railway" | "railway_curve" | "locomotive" | "passenger" | "passenger_vip" | "caboose" | "trainset"
  | "bridge_rail" | "bridge_river" | "bridge_sea" | "bridge_mountain" | "bridge_creek" | "bridge_lake"
  | "flyover" | "forest" | "corridor" | "zone_city" | "zone_town" | "zone_remote" | "police_officer" | "hotel_room" | "hotel_v2" | "mall_v2" | "hospital_v2" | "police_v2";

export const INFRA_SHAPES: InfraShape[] = [
  "railway", "railway_curve", "locomotive", "passenger", "passenger_vip", "caboose", "trainset",
  "bridge_rail", "bridge_river", "bridge_sea", "bridge_mountain", "bridge_creek", "bridge_lake",
  "flyover", "forest", "corridor", "zone_city", "zone_town", "zone_remote", "police_officer", "hotel_room", "hotel_v2", "mall_v2", "hospital_v2", "police_v2",
];
export function isInfraShape(s: string): s is InfraShape { return (INFRA_SHAPES as string[]).includes(s); }
export const INFRA_PRESETS: { name: string; shape: InfraShape }[] = [
  { name: "Railway Track", shape: "railway" },
  { name: "Railway Curve", shape: "railway_curve" },
  { name: "Locomotive High-Speed", shape: "locomotive" },
  { name: "Passenger Coach", shape: "passenger" },
  { name: "VIP Coach", shape: "passenger_vip" },
  { name: "Observation Caboose", shape: "caboose" },
  { name: "Full Train Set", shape: "trainset" },
  { name: "Rail Viaduct", shape: "bridge_rail" },
  { name: "River Truss Bridge", shape: "bridge_river" },
  { name: "Sea Cable-Stayed Bridge", shape: "bridge_sea" },
  { name: "Mountain Arch Bridge", shape: "bridge_mountain" },
  { name: "Creek Stone Bridge", shape: "bridge_creek" },
  { name: "Lake Causeway Bridge", shape: "bridge_lake" },
  { name: "Flyover Elevated Road", shape: "flyover" },
  { name: "Forest", shape: "forest" },
  { name: "Highway Rail Corridor", shape: "corridor" },
  { name: "City Zone (hotel, mall, hospital, police)", shape: "zone_city" },
  { name: "Town Zone (shophouses, market, wat)", shape: "zone_town" },
  { name: "Remote Village (stilt houses, rice fields)", shape: "zone_remote" },
  { name: "Police Officer", shape: "police_officer" },
  { name: "Hotel Room (cutaway)", shape: "hotel_room" },
  { name: "Hotel (Detailed)", shape: "hotel_v2" },
  { name: "Shopping Mall (Detailed)", shape: "mall_v2" },
  { name: "Hospital (Detailed)", shape: "hospital_v2" },
  { name: "Police Station (Detailed)", shape: "police_v2" },
];

// ---------- math ----------
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
function hash2(x: number, y: number) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x: number, y: number) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number, oct = 4) {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; }
  return s;
}
function rngf(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; };
}
function hslRGB(THREE: T3, h: number, s: number, l: number): RGB {
  const c = new THREE.Color().setHSL(((h % 360) + 360) % 360 / 360, clamp01(s), clamp01(l), THREE.SRGBColorSpace);
  return [c.r, c.g, c.b];
}
function hexRGB(THREE: T3, hex: string): RGB { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; }

// ---------- geometry helpers (all return plain BufferGeometry for merging) ----------
function gBox(THREE: T3, w: number, h: number, d: number, x: number, y: number, z: number, ry = 0, rz = 0, rx = 0): BG {
  const g = new THREE.BoxGeometry(w, h, d);
  if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
  g.translate(x, y, z);
  return g;
}
function gCyl(THREE: T3, rt: number, rb: number, h: number, seg: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): BG {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1);
  if (rx || ry || rz) g.applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz)));
  g.translate(x, y, z);
  return g;
}
function gBetween(THREE: T3, a: P3, b: P3, r: number, seg = 6): BG {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.CylinderGeometry(r, r, Math.max(len, 1e-4), seg, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()));
  g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  return g;
}
function gPaint(THREE: T3, g: BG, c: string | RGB): BG {
  const rgb = typeof c === "string" ? hexRGB(THREE, c) : c;
  const n = g.attributes.position.count, arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = rgb[0]; arr[i * 3 + 1] = rgb[1]; arr[i * 3 + 2] = rgb[2]; }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}
function gMerge(THREE: T3, list: BG[]): BG {
  const pos: number[] = [], nor: number[] = [], col: number[] = [];
  let anyCol = false;
  for (const g0 of list) {
    const g = g0.index ? g0.toNonIndexed() : g0;
    if (!g.attributes.normal) g.computeVertexNormals();
    const p = g.attributes.position, n = g.attributes.normal, c = g.attributes.color;
    if (c) anyCol = true;
    for (let i = 0; i < p.count; i++) {
      pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i));
      if (c) col.push(c.getX(i), c.getY(i), c.getZ(i)); else col.push(1, 1, 1);
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  if (anyCol) out.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return out;
}
function addMerged(THREE: T3, g: Grp, list: BG[], mat: MatT): void {
  if (!list.length) return;
  g.add(new THREE.Mesh(gMerge(THREE, list), mat));
}
/** hard-edged sweep of a closed polygon profile (u lateral, v up) along a curve */
function gSweep(THREE: T3, curve: Crv, profile: [number, number][], steps: number, caps = false): BG {
  const up = new THREE.Vector3(0, 1, 0);
  const rings: V3[][] = [], centers: V3[] = [];
  let vc = 0; profile.forEach(([, v]) => { vc += v; }); vc /= profile.length;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, P = curve.getPointAt(t), T = curve.getTangentAt(t);
    const S = new THREE.Vector3().crossVectors(up, T);
    if (S.lengthSq() < 1e-8) S.set(0, 0, 1);
    S.normalize();
    rings.push(profile.map(([u, v]) => P.clone().addScaledVector(S, u).addScaledVector(up, v)));
    centers.push(P.clone().addScaledVector(up, vc));
  }
  const pos: number[] = [];
  const tri = (a: V3, b: V3, c: V3, out: V3) => {
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    if (n.dot(out) < 0) pos.push(a.x, a.y, a.z, c.x, c.y, c.z, b.x, b.y, b.z);
    else pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  const M = profile.length;
  for (let i = 0; i < steps; i++) for (let k = 0; k < M; k++) {
    const k2 = (k + 1) % M, a = rings[i][k], b = rings[i][k2], c = rings[i + 1][k2], d = rings[i + 1][k];
    const out = a.clone().add(b).add(c).add(d).multiplyScalar(0.25).sub(centers[i].clone().add(centers[i + 1]).multiplyScalar(0.5));
    tri(a, b, c, out); tri(a, c, d, out);
  }
  if (caps) for (let k = 0; k < M; k++) {
    const k2 = (k + 1) % M;
    tri(centers[0], rings[0][k], rings[0][k2], centers[0].clone().sub(centers[1]));
    tri(centers[steps], rings[steps][k], rings[steps][k2], centers[steps].clone().sub(centers[steps - 1]));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function lineC(THREE: T3, a: P3, b: P3): Crv { return new THREE.LineCurve3(new THREE.Vector3(...a), new THREE.Vector3(...b)); }
function pathC(THREE: T3, pts: P3[]): Crv { return new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal"); }
function offsetCurve(THREE: T3, base: Crv, d: number, dy = 0, n = 48): Crv {
  const up = new THREE.Vector3(0, 1, 0), pts: V3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = base.getPointAt(t), tg = base.getTangentAt(t);
    const s = new THREE.Vector3().crossVectors(up, tg).normalize();
    pts.push(p.addScaledVector(s, d).add(new THREE.Vector3(0, dy, 0)));
  }
  return new THREE.CatmullRomCurve3(pts, false, "centripetal");
}
function makeKit(THREE: T3): Mk {
  const cache = new Map<string, MatT>();
  return (hex, rough = 0.7, metal = 0, extra = {}) => {
    const key = hex + "|" + rough + "|" + metal + "|" + JSON.stringify(extra);
    let m = cache.get(key);
    if (!m) { m = new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: metal, ...extra }); cache.set(key, m); }
    return m;
  };
}
function recenterXZ(THREE: T3, g: Grp): void {
  const c = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());
  const inner = new THREE.Group();
  while (g.children.length) inner.add(g.children[0]);
  inner.position.set(-c.x, 0, -c.z);
  g.add(inner);
}

// ---------- paint with a function (position-based colour noise) ----------
function gPaintFn(THREE: T3, g: BG, fn: (x: number, y: number, z: number) => RGB): BG {
  const p = g.attributes.position, arr = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = fn(p.getX(i), p.getY(i), p.getZ(i)); arr[i * 3] = c[0]; arr[i * 3 + 1] = c[1]; arr[i * 3 + 2] = c[2]; }
  g.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return g;
}

// ---------- railway ----------
export const RAIL_TOP = 0.61;
const GAUGE = 1.435;
function arcCurve(THREE: T3, R: number, ang: number): Crv {
  const pts: P3[] = [], n = 24;
  for (let i = 0; i <= n; i++) { const a = (ang * i) / n; pts.push([R * Math.sin(a), 0, R * (1 - Math.cos(a))]); }
  return pathC(THREE, pts);
}
const RAIL_PROFILE: [number, number][] = [
  [-0.07, 0], [0.07, 0], [0.07, 0.02], [0.016, 0.045], [0.016, 0.115], [0.04, 0.13], [0.04, 0.16],
  [-0.04, 0.16], [-0.04, 0.13], [-0.016, 0.115], [-0.016, 0.045], [-0.07, 0.02],
];
function addTrack(THREE: T3, g: Grp, mk: Mk, curve: Crv, o: { cat?: boolean; seed?: number } = {}): void {
  const len = curve.getLength(), steps = Math.max(8, Math.ceil(len / 1.5)), rnd = rngf(o.seed ?? 7);
  const up = new THREE.Vector3(0, 1, 0);
  const bal = gSweep(THREE, curve, [[-1.8, 0], [1.8, 0], [1.3, 0.3], [-1.3, 0.3]], steps);
  gPaintFn(THREE, bal, (x, _y, z) => hslRGB(THREE, 30 + 10 * fbm(x * 0.4, z * 0.4), 0.05, 0.16 + 0.16 * fbm(x * 2.1, z * 2.1, 3)));
  g.add(new THREE.Mesh(gMerge(THREE, [bal]), mk("#ffffff", 1, 0, { vertexColors: true })));
  const sl: BG[] = [], clip: BG[] = [], cnt = Math.floor(len / 0.62);
  for (let i = 0; i < cnt; i++) {
    const t = (i + 0.5) / cnt, P = curve.getPointAt(t), T = curve.getTangentAt(t);
    const ry = Math.atan2(-T.z, T.x), S = new THREE.Vector3().crossVectors(up, T).normalize();
    const v = 0.5 + 0.12 * rnd();
    sl.push(gPaint(THREE, gBox(THREE, 0.26, 0.15, 2.6, P.x, 0.375 + P.y, P.z, ry), [v, v * 0.98, v * 0.95]));
    for (const s of [-1, 1]) {
      const q = P.clone().addScaledVector(S, s * GAUGE / 2);
      clip.push(gBox(THREE, 0.16, 0.04, 0.22, q.x, 0.47 + q.y, q.z, ry));
    }
  }
  addMerged(THREE, g, sl, mk("#ffffff", 0.95, 0, { vertexColors: true }));
  addMerged(THREE, g, clip, mk("#2a2a2c", 0.6, 0.5));
  const rails = [-1, 1].map((s) => gSweep(THREE, offsetCurve(THREE, curve, s * GAUGE / 2, 0.45, steps), RAIL_PROFILE, steps));
  addMerged(THREE, g, rails, mk("#9aa0a6", 0.3, 0.85));
  if (o.cat) {
    const mast: BG[] = [], wire: BG[] = [], n = Math.max(2, Math.floor(len / 45));
    const wpts: V3[] = [], mpts: V3[] = [];
    for (let i = 0; i <= n * 6; i++) {
      const t = i / (n * 6), P = curve.getPointAt(t), T = curve.getTangentAt(t);
      const S = new THREE.Vector3().crossVectors(up, T).normalize();
      wpts.push(P.clone().addScaledVector(S, 0.2 * (i % 2 ? 1 : -1)).setY(RAIL_TOP + 5.3));
      mpts.push(P.clone().setY(RAIL_TOP + 6.5 - 0.35 * Math.sin((Math.PI * (i % 6)) / 6)));
    }
    for (let i = 0; i < wpts.length - 1; i++) {
      wire.push(gBetween(THREE, [wpts[i].x, wpts[i].y, wpts[i].z], [wpts[i + 1].x, wpts[i + 1].y, wpts[i + 1].z], 0.016, 4));
      wire.push(gBetween(THREE, [mpts[i].x, mpts[i].y, mpts[i].z], [mpts[i + 1].x, mpts[i + 1].y, mpts[i + 1].z], 0.02, 4));
      if (i % 2 === 0) wire.push(gBetween(THREE, [mpts[i].x, mpts[i].y, mpts[i].z], [wpts[i].x, wpts[i].y, wpts[i].z], 0.008, 3));
    }
    for (let i = 0; i <= n; i++) {
      const t = i / n, P = curve.getPointAt(t), T = curve.getTangentAt(t);
      const S = new THREE.Vector3().crossVectors(up, T).normalize(), b = P.clone().addScaledVector(S, 3.3);
      const ry = Math.atan2(-T.z, T.x);
      mast.push(gBox(THREE, 0.22, 7.6, 0.22, b.x, 3.8, b.z, ry));
      mast.push(gBox(THREE, 0.5, 0.1, 0.5, b.x, 0.3, b.z, ry));
      mast.push(gBetween(THREE, [b.x, 7.4, b.z], [P.x, RAIL_TOP + 6.5, P.z], 0.05, 5));
      mast.push(gBetween(THREE, [b.x, 6.4, b.z], [P.x, RAIL_TOP + 5.8, P.z], 0.04, 5));
    }
    addMerged(THREE, g, mast, mk("#6c7178", 0.5, 0.7));
    addMerged(THREE, g, wire, mk("#2d2d30", 0.4, 0.8));
  }
}

// ---------- lofted vehicle body ----------
interface Sec { a: number; cy: number; bt: number; bb: number }
function loft(THREE: T3, xs: number[], sec: (x: number) => Sec, N: number, isWin: (i: number, k: number) => boolean,
  col: (x: number, y: number, z: number) => RGB, cap: boolean): { body: BG; glass: BG } {
  const P: number[][] = [], pos: number[] = [], clr: number[] = [], idx: number[] = [], gl: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    const s0 = sec(xs[i]); P.push([]);
    for (let k = 0; k < N; k++) {
      const t = (2 * Math.PI * k) / N, c = Math.cos(t), s = Math.sin(t);
      const z = s0.a * Math.sign(c) * Math.pow(Math.abs(c), 0.5);
      const y = s0.cy + (s >= 0 ? s0.bt : s0.bb) * Math.sign(s) * Math.pow(Math.abs(s), 0.5);
      const cc = col(xs[i], y, z);
      P[i].push(pos.length / 3); pos.push(xs[i], y, z); clr.push(cc[0], cc[1], cc[2]);
    }
  }
  const at = (i: number, k: number) => [pos[P[i][k % N] * 3], pos[P[i][k % N] * 3 + 1], pos[P[i][k % N] * 3 + 2]];
  for (let i = 0; i < xs.length - 1; i++) for (let k = 0; k < N; k++) {
    const a = P[i][k], b = P[i][(k + 1) % N], c = P[i + 1][(k + 1) % N], d = P[i + 1][k];
    if (isWin(i, k)) {
      const s0 = sec((xs[i] + xs[i + 1]) / 2);
      for (const v of [at(i, k), at(i, k + 1), at(i + 1, k + 1), at(i, k), at(i + 1, k + 1), at(i + 1, k)]) gl.push(v[0], s0.cy + (v[1] - s0.cy) * 0.992, v[2] * 0.992);
    } else idx.push(a, b, c, a, c, d);
  }
  if (cap) for (const e of [0, xs.length - 1]) {
    const s0 = sec(xs[e]), ci = pos.length / 3; pos.push(xs[e], s0.cy, 0);
    const cc = col(xs[e], s0.cy, 0); clr.push(cc[0], cc[1], cc[2]);
    for (let k = 0; k < N; k++) idx.push(ci, P[e][k], P[e][(k + 1) % N]);
  }
  let vol = 0;
  for (let i = 0; i < idx.length; i += 3) {
    const A = idx[i] * 3, B = idx[i + 1] * 3, C = idx[i + 2] * 3;
    vol += pos[A] * (pos[B + 1] * pos[C + 2] - pos[B + 2] * pos[C + 1]) - pos[A + 1] * (pos[B] * pos[C + 2] - pos[B + 2] * pos[C]) + pos[A + 2] * (pos[B] * pos[C + 1] - pos[B + 1] * pos[C]);
  }
  if (vol < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  const body = new THREE.BufferGeometry();
  body.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  body.setAttribute("color", new THREE.Float32BufferAttribute(clr, 3));
  body.setIndex(idx); body.computeVertexNormals();
  const glass = new THREE.BufferGeometry();
  glass.setAttribute("position", new THREE.Float32BufferAttribute(gl, 3));
  glass.computeVertexNormals();
  return { body, glass };
}

// ---------- wheels, bogies, seats ----------
function wheelGeo(THREE: T3, x: number, z: number): BG {
  const pts = [[0.1, -0.06], [0.44, -0.06], [0.46, -0.04], [0.46, 0.04], [0.5, 0.05], [0.5, 0.07], [0.38, 0.07], [0.1, 0.07]].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 20);
  g.applyMatrix4(new THREE.Matrix4().makeRotationX(z > 0 ? -Math.PI / 2 : Math.PI / 2));
  g.translate(x, RAIL_TOP + 0.46, z);
  return g;
}
function addBogie(THREE: T3, g: Grp, mk: Mk, x: number, spacing = 2.5): void {
  const fr: BG[] = [], cy = RAIL_TOP + 0.46;
  for (const dx of [-spacing / 2, spacing / 2]) {
    // each wheelset is its own pivot so the Studio can spin it (userData.infraWheel); axis = local x of the inner group
    const st: BG[] = [];
    for (const s of [-1, 1]) st.push(wheelGeo(THREE, 0, s * GAUGE / 2).translate(0, -cy, 0));
    st.push(gCyl(THREE, 0.06, 0.06, 1.9, 8, 0, 0, 0, Math.PI / 2));
    st.push(gCyl(THREE, 0.3, 0.3, 0.05, 20, 0, 0, 0.45, Math.PI / 2));
    st.push(gCyl(THREE, 0.3, 0.3, 0.05, 20, 0, 0, -0.45, Math.PI / 2));
    const outer = new THREE.Group(), inner = new THREE.Group(), m = new THREE.Mesh(gMerge(THREE, st), mk("#3b3f44", 0.45, 0.85));
    outer.position.set(x + dx, cy, 0); outer.rotation.y = Math.PI / 2; inner.userData.infraWheel = true; m.rotation.y = -Math.PI / 2;
    inner.add(m); outer.add(inner); g.add(outer);
  }
  for (const s of [-1, 1]) {
    fr.push(gBox(THREE, spacing + 0.8, 0.22, 0.14, x, RAIL_TOP + 0.78, s * 0.98));
    for (const dx of [-spacing / 2, spacing / 2]) fr.push(gCyl(THREE, 0.1, 0.1, 0.3, 8, x + dx, RAIL_TOP + 0.68, s * 0.98));
  }
  fr.push(gBox(THREE, 0.34, 0.26, 1.9, x, RAIL_TOP + 0.84, 0));
  fr.push(gBox(THREE, 0.6, 0.38, 0.6, x - 0.7, RAIL_TOP + 0.62, 0.2));
  fr.push(gBox(THREE, 0.6, 0.38, 0.6, x + 0.7, RAIL_TOP + 0.62, -0.2));
  addMerged(THREE, g, fr, mk("#1d1f22", 0.6, 0.5));
}
function seatGeo(THREE: T3, x: number, y: number, z: number, w: number, c: RGB, vip: boolean): BG[] {
  const o: BG[] = [], d = vip ? 0.62 : 0.5;
  o.push(gPaint(THREE, gBox(THREE, d, 0.14, w, x, y + 0.42, z), c));
  o.push(gPaint(THREE, gBox(THREE, 0.12, vip ? 0.78 : 0.66, w, x - d / 2 + 0.02, y + 0.82, z, 0, -0.12), c));
  o.push(gPaint(THREE, gBox(THREE, 0.14, 0.22, w * 0.7, x - d / 2 - 0.02, y + (vip ? 1.3 : 1.2), z, 0, -0.12), [c[0] * 1.15, c[1] * 1.15, c[2] * 1.15]));
  o.push(gPaint(THREE, gBox(THREE, 0.1, 0.3, 0.1, x, y + 0.2, z), [0.1, 0.1, 0.11]));
  if (vip) for (const s of [-1, 1]) o.push(gPaint(THREE, gBox(THREE, 0.5, 0.1, 0.07, x, y + 0.66, z + s * (w / 2 + 0.03)), [0.55, 0.38, 0.12]));
  return o;
}

interface CoachOpt { L: number; vip?: boolean; noseF?: number; noseB?: number; base: string; stripe: string; seed: number; cabX?: number }
const COACH_H = 3.25, COACH_YB = 0.95;
function buildCoach(THREE: T3, g: Grp, mk: Mk, o: CoachOpt): void {
  const { L, vip, base, stripe } = o, nF = o.noseF ?? 0, nB = o.noseB ?? 0, N = 96, H = COACH_H, yb = COACH_YB, a0 = 1.5;
  const rnd = rngf(o.seed), seatC: RGB[] = [];
  const bc = hexRGB(THREE, base), sc = hexRGB(THREE, stripe);
  const dx0 = L / 2 - 2.3;
  const wins: [number, number][] = [];
  const p = 2.35, xa = -L / 2 + 4.3 + (nB ? nB : 0) * 0.4, xb = L / 2 - 4.3 - (nF ? nF * 0.9 : 0);
  if (xb > xa) { const cnt = Math.floor((xb - xa) / p) + 1, st = (xa + xb) / 2 - ((cnt - 1) * p) / 2; for (let i = 0; i < cnt; i++) wins.push([st + i * p, 1.55]); }
  const doors: number[] = [];
  if (!nF) doors.push(dx0);
  if (!nB) doors.push(-dx0);
  if (nF && o.cabX !== undefined) wins.push([o.cabX, 1.2]);
  for (const d of doors) wins.push([d, 0.7]);
  const xsSet = new Set<number>([-L / 2, L / 2]);
  for (const [c, w] of wins) { xsSet.add(c - w / 2); xsSet.add(c + w / 2); }
  for (let i = 1; i < 16; i++) { if (nF) xsSet.add(L / 2 - nF + (nF * i) / 16); if (nB) xsSet.add(-L / 2 + nB - (nB * i) / 16); }
  const xs = Array.from(xsSet).sort((a, b) => a - b);
  const sec = (x: number): Sec => {
    let u = 0;
    if (nF && x > L / 2 - nF) u = (x - (L / 2 - nF)) / nF; else if (nB && x < -L / 2 + nB) u = (-L / 2 + nB - x) / nB;
    u = clamp01(u);
    const ub = Math.pow(u, 2.2), sw = Math.pow(Math.max(0, 1 - Math.pow(u, 2.6)), 0.55);
    const y0 = yb + 0.32 * H * ub, y1 = yb + 0.32 * H + 0.68 * H * Math.pow(Math.max(0, 1 - ub), 0.8);
    const yTop = u === 0 ? yb + H : y1, yBot = u === 0 ? yb : y0;
    return { a: a0 * sw, cy: (yTop + yBot) / 2, bt: (yTop - yBot) / 2, bb: (yTop - yBot) / 2 };
  };
  const inWin = (x: number) => wins.some(([c, w]) => Math.abs(x - c) < w / 2 + 1e-6);
  const kHalf = N / 2, kd = N / 72;
  const isWin = (i: number, k: number) => {
    const xm = (xs[i] + xs[i + 1]) / 2;
    if (!inWin(xm)) return false;
    return (k >= N - Math.round(2 * kd) || k <= Math.round(2 * kd)) || (k >= kHalf - Math.round(3 * kd) && k <= kHalf + Math.round(1 * kd));
  };
  const col = (x: number, y: number, z: number): RGB => {
    const rel = y - yb, n = fbm(x * 0.6, y * 1.6, 3);
    let c: RGB;
    const inN = (nF && x > L / 2 - nF * 0.95) || (nB && x < -L / 2 + nB * 0.95);
    if (rel < 0.38) c = [0.03, 0.03, 0.035];
    else if (rel > H - 0.34 && !inN) c = [0.62 * bc[0] + 0.1, 0.62 * bc[1] + 0.1, 0.62 * bc[2] + 0.1];
    else if (rel > 0.46 && rel < 0.82) c = sc;
    else c = bc;
    for (const d of doors) if (Math.abs(x - d) < 0.78 && rel > 0.38 && rel < H - 0.5) c = [bc[0] * 0.7, bc[1] * 0.72, bc[2] * 0.75];
    if (inN) {
      const nx = nF ? (x - (L / 2 - nF)) / nF : ((-L / 2 + nB) - x) / nB;
      const w = smooth(1.45, 1.7, rel) * (1 - smooth(H - 0.6, H - 0.35, rel)) * smooth(0.02, 0.22, nx) * (1 - smooth(0.9, 0.99, nx)) * (1 - smooth(0.85, 1.15, Math.abs(z)));
      c = [c[0] + (0.015 - c[0]) * w, c[1] + (0.02 - c[1]) * w, c[2] + (0.03 - c[2]) * w];
    }
    const dirt = 0.9 + 0.1 * n - 0.08 * (1 - smooth(0.2, 1.6, rel));
    return [c[0] * dirt, c[1] * dirt, c[2] * dirt];
  };
  const r = loft(THREE, xs, sec, N, isWin, col, true);
  g.add(new THREE.Mesh(r.body, mk("#ffffff", 0.32, 0.3, { vertexColors: true, side: THREE.DoubleSide })));
  g.add(new THREE.Mesh(r.glass, mk("#1b2c3a", 0.05, 0.6, { transparent: true, opacity: 0.45, side: THREE.DoubleSide, depthWrite: false })));
  // underframe, roof gear
  const uA = -L / 2 + nB + 0.6, uB = L / 2 - nF - 0.6, dark: BG[] = [gBox(THREE, uB - uA, 0.36, 2.3, (uA + uB) / 2, yb + 0.14, 0)];
  for (let i = 0; i < 3; i++) dark.push(gBox(THREE, 1.7, 0.4, 1.2, (i - 1) * Math.min(5, L * 0.25), yb - 0.2, 0));
  addMerged(THREE, g, dark, mk("#1e2023", 0.7, 0.4));
  const roof: BG[] = [];
  const rx0 = -L / 2 + (nB ? nB + 1 : 1.6), rx1 = L / 2 - (nF ? nF + 1 : 1.6);
  for (let x = rx0 + 1.8; x < rx1 - 1.0; x += 5.2) { roof.push(gBox(THREE, 2.7, 0.26, 1.3, x, yb + H + 0.1, 0)); roof.push(gBox(THREE, 0.7, 0.16, 0.7, x + 1.6, yb + H + 0.08, 0.2)); }
  addMerged(THREE, g, roof, mk("#aeb4ba", 0.55, 0.3));
  // gangway at flat ends
  const gw: BG[] = [];
  if (!nF) gw.push(gBox(THREE, 0.5, 2.7, 2.2, L / 2 + 0.2, yb + 1.45, 0));
  if (!nB) gw.push(gBox(THREE, 0.5, 2.7, 2.2, -L / 2 - 0.2, yb + 1.45, 0));
  addMerged(THREE, g, gw, mk("#111214", 0.9, 0));
  // bogies
  addBogie(THREE, g, mk, L / 2 - (nF ? nF * 0.9 + 2.2 : 3.4));
  addBogie(THREE, g, mk, -L / 2 + (nB ? nB * 0.9 + 2.2 : 3.4));
  // interior
  const fy = yb + 0.36;
  const floor: BG[] = [gPaint(THREE, gBox(THREE, L - 1.4, 0.06, 2.55, 0, fy - 0.03, 0), vip ? hslRGB(THREE, 350, 0.4, 0.18) : hslRGB(THREE, 215, 0.12, 0.22))];
  floor.push(gPaint(THREE, gBox(THREE, L - 1.4, 0.012, 0.5, 0, fy + 0.005, 0), vip ? hslRGB(THREE, 40, 0.55, 0.3) : hslRGB(THREE, 215, 0.2, 0.35)));
  addMerged(THREE, g, floor, mk("#ffffff", 0.95, 0, { vertexColors: true }));
  const seats: BG[] = [], tab: BG[] = [];
  const sx0 = rx0 + 0.4, sx1 = rx1 - 0.2, pitch = vip ? 1.9 : 1.05;
  const pal = vip ? [hslRGB(THREE, 350, 0.55, 0.2), hslRGB(THREE, 355, 0.5, 0.24)] : [hslRGB(THREE, 215, 0.45, 0.28), hslRGB(THREE, 215, 0.4, 0.33), hslRGB(THREE, 205, 0.35, 0.25)];
  for (let x = sx0 + 0.4; x < sx1; x += pitch) {
    const cl = pal[Math.floor(rnd() * pal.length)]; seatC.push(cl);
    if (vip) {
      for (const z of [-1.0, 0.95]) seats.push(...seatGeo(THREE, x, fy, z, 0.7, cl, true));
      tab.push(gPaint(THREE, gBox(THREE, 0.5, 0.05, 0.7, x + 0.62, fy + 0.72, 0.95), [0.38, 0.22, 0.1]));
      tab.push(gPaint(THREE, gBox(THREE, 0.08, 0.7, 0.08, x + 0.62, fy + 0.36, 0.95), [0.5, 0.4, 0.2]));
    } else for (const z of [-1.15, -0.62, 0.62, 1.15]) seats.push(...seatGeo(THREE, x, fy, z, 0.5, cl, false));
  }
  addMerged(THREE, g, seats, mk("#ffffff", vip ? 0.5 : 0.85, 0, { vertexColors: true }));
  addMerged(THREE, g, tab, mk("#ffffff", 0.3, 0.4, { vertexColors: true }));
  const rack: BG[] = [];
  for (const s of [-1, 1]) rack.push(gBox(THREE, L - 4.4, 0.04, 0.42, 0, yb + 2.45, s * 1.12));
  addMerged(THREE, g, rack, mk("#aab0b6", 0.4, 0.7));
  g.add(new THREE.Mesh(gBox(THREE, L - 4, 0.03, 0.26, 0, yb + H - 0.32, 0), mk("#fff8e8", 0.4, 0, { emissive: "#fff3d0", emissiveIntensity: vip ? 0.7 : 1.1 })));
}

// ---------- vehicles ----------
function addPantograph(THREE: T3, g: Grp, mk: Mk, x: number): void {
  const y0 = COACH_YB + COACH_H + 0.2, a: BG[] = [], b: BG[] = [];
  a.push(gBox(THREE, 1.6, 0.1, 0.9, x + 0.9, y0, 0));
  for (const s of [-0.35, 0.35]) {
    a.push(gBetween(THREE, [x + 0.9, y0 + 0.05, s], [x - 0.3, y0 + 0.8, s * 0.7], 0.045, 6));
    a.push(gBetween(THREE, [x - 0.3, y0 + 0.8, s * 0.7], [x + 0.4, y0 + 1.6, s * 0.4], 0.04, 6));
  }
  a.push(gBetween(THREE, [x + 0.9, y0 + 0.05, 0.35], [x + 0.9, y0 + 0.05, -0.35], 0.05, 6));
  b.push(gBox(THREE, 0.16, 0.06, 1.9, x + 0.4, y0 + 1.63, 0));
  b.push(gBetween(THREE, [x + 0.4, y0 + 1.63, 0.95], [x + 0.25, y0 + 1.5, 1.1], 0.03, 4));
  b.push(gBetween(THREE, [x + 0.4, y0 + 1.63, -0.95], [x + 0.25, y0 + 1.5, -1.1], 0.03, 4));
  addMerged(THREE, g, a, mk("#b9bec4", 0.35, 0.8));
  addMerged(THREE, g, b, mk("#2b2b2d", 0.5, 0.7));
  for (const s of [-1, 1]) g.add(new THREE.Mesh(gCyl(THREE, 0.1, 0.12, 0.25, 8, x + 0.9 + s * 0.5, y0 - 0.12, 0), mk("#c8d4dc", 0.2, 0.1)));
}
function addHeadlights(THREE: T3, g: Grp, mk: Mk, x: number, y: number): void {
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), mk("#ffffff", 0.1, 0, { emissive: "#fff6d8", emissiveIntensity: 2.2 }));
    m.position.set(x, y, s * 0.32); m.scale.set(0.6, 1, 1.2); g.add(m);
  }
  const m2 = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), mk("#ff2020", 0.2, 0, { emissive: "#ff1010", emissiveIntensity: 1.2 }));
  m2.position.set(x - 0.1, y + 0.35, 0); g.add(m2);
}
function makeLoco(THREE: T3, mk: Mk, rear = false): Grp {
  const g = new THREE.Group(), L = 26, nF = 7;
  buildCoach(THREE, g, mk, { L, base: "#eceff1", stripe: "#0b5cab", seed: 3, noseF: nF, cabX: L / 2 - nF - 1.0 });
  addPantograph(THREE, g, mk, -3);
  addHeadlights(THREE, g, mk, L / 2 - 0.3, 2.05);
  if (rear) g.rotation.y = Math.PI;
  return g;
}
function makeCoach(THREE: T3, mk: Mk, vip: boolean): Grp {
  const g = new THREE.Group();
  buildCoach(THREE, g, mk, vip
    ? { L: 25, vip: true, base: "#ece4d2", stripe: "#8c6a1a", seed: 11 }
    : { L: 25, base: "#eceff1", stripe: "#0b5cab", seed: 5 });
  if (!vip) addPantograph(THREE, g, mk, 6);
  return g;
}
function makeCaboose(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group();
  buildCoach(THREE, g, mk, { L: 17, noseB: 5, base: "#d8dce0", stripe: "#9a1c24", seed: 21 });
  return g;
}
function makeTrainset(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group();
  const cars: { o: Grp; len: number }[] = [
    { o: makeLoco(THREE, mk, true), len: 26 }, { o: makeCoach(THREE, mk, false), len: 25 },
    { o: makeCoach(THREE, mk, true), len: 25 }, { o: makeCoach(THREE, mk, false), len: 25 }, { o: makeLoco(THREE, mk, false), len: 26 },
  ];
  const total = cars.reduce((s, c) => s + c.len, 0) + (cars.length - 1) * 1.0;
  let x = -total / 2;
  for (const c of cars) { c.o.position.x = x + c.len / 2; g.add(c.o); x += c.len + 1.0; }
  return g;
}

// ---------- environment: terrain, water, trees ----------
type HFn = (x: number, z: number) => number;
function terrainMesh(THREE: T3, mk: Mk, W: number, D: number, seg: number, hfn: HFn, o: { water?: number; rock?: number; cx?: number; cz?: number } = {}): import("three").Mesh {
  const cx = o.cx ?? 0, cz = o.cz ?? 0, nx = seg, nz = Math.max(2, Math.round(seg * D / W));
  const pos: number[] = [], col: number[] = [], idx: number[] = [];
  const wy = o.water ?? -1e9, rk = o.rock ?? 1e9;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = cx - W / 2 + (W * i) / nx, z = cz - D / 2 + (D * j) / nz, y = hfn(x, z);
    const e = 1.5, sx = (hfn(x + e, z) - hfn(x - e, z)) / (2 * e), sz = (hfn(x, z + e) - hfn(x, z - e)) / (2 * e);
    const slope = Math.sqrt(sx * sx + sz * sz), n1 = fbm(x * 0.05, z * 0.05, 4), n2 = fbm(x * 0.6, z * 0.6, 2);
    const grass = hslRGB(THREE, 82 + 22 * n1, 0.36 + 0.1 * n2, 0.2 + 0.12 * n1 + 0.05 * n2);
    const dry = hslRGB(THREE, 58, 0.3, 0.3 + 0.1 * n2);
    const rock = hslRGB(THREE, 28 + 8 * n2, 0.08 + 0.06 * n1, 0.3 + 0.18 * n2 + 0.08 * n1);
    const sand = hslRGB(THREE, 40, 0.35, 0.5 + 0.08 * n2);
    const mud = hslRGB(THREE, 28, 0.28, 0.2 + 0.05 * n2);
    const wRock = clamp01(smooth(0.5, 1.0, slope) + smooth(rk - 6, rk + 8, y)), wDry = smooth(0.55, 0.85, n1);
    const wSand = 1 - smooth(wy + 0.1, wy + 1.4, y), wMud = 1 - smooth(wy - 1.5, wy + 0.3, y);
    const c: RGB = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      let v = grass[k] + (dry[k] - grass[k]) * wDry * 0.6;
      v += (rock[k] - v) * wRock; v += (sand[k] - v) * wSand; v += (mud[k] - v) * wMud * 0.7;
      c[k] = v;
    }
    pos.push(x, y, z); col.push(c[0], c[1], c[2]);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mk("#ffffff", 1, 0, { vertexColors: true }));
}
function waterMesh(THREE: T3, mk: Mk, W: number, D: number, y: number, cx = 0, cz = 0, tint = 195): import("three").Mesh {
  const nx = 48, nz = Math.max(4, Math.round(48 * D / W)), pos: number[] = [], col: number[] = [], idx: number[] = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = cx - W / 2 + (W * i) / nx, z = cz - D / 2 + (D * j) / nz, n = fbm(x * 0.08, z * 0.08, 3);
    const c = hslRGB(THREE, tint + 12 * n, 0.45, 0.2 + 0.14 * n);
    pos.push(x, y + 0.05 * Math.sin(x * 0.4 + z * 0.3) * n, z); col.push(c[0], c[1], c[2]);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mk("#ffffff", 0.06, 0.2, { vertexColors: true, transparent: true, opacity: 0.86 }));
}
function blob(THREE: T3, r: number, x: number, y: number, z: number, sy: number, seed: number, hue: number, sat: number, lit: number): BG {
  const g = new THREE.SphereGeometry(r, 10, 7), p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), n = vnoise(px * 2.2 + seed, pz * 2.2 + py * 1.7 + seed * 1.7);
    const k = 0.78 + 0.45 * n;
    p.setXYZ(i, px * k, py * k * sy, pz * k);
    const up = clamp01(0.5 + py / (2 * r)), rgb = hslRGB(THREE, hue + 8 * n, sat, lit * (0.62 + 0.62 * up * up) * (0.9 + 0.2 * n));
    c[i * 3] = rgb[0]; c[i * 3 + 1] = rgb[1]; c[i * 3 + 2] = rgb[2];
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  g.computeVertexNormals(); g.translate(x, y, z);
  return g;
}
function frond(THREE: T3, x: number, y: number, z: number, ang: number, len: number, droop: number, hue: number): BG {
  const seg = 7, w = len * 0.1, pos: number[] = [], col: number[] = [];
  const pt = (t: number, s: number): [number, number, number] => [x + Math.cos(ang) * len * t - Math.sin(ang) * s * w * Math.sin(Math.PI * Math.min(1, t * 1.15)), y + len * 0.5 * t - droop * len * t * t, z + Math.sin(ang) * len * t + Math.cos(ang) * s * w * Math.sin(Math.PI * Math.min(1, t * 1.15))];
  for (let i = 0; i < seg; i++) {
    const t0 = i / seg, t1 = (i + 1) / seg, a = pt(t0, -1), b = pt(t0, 1), c = pt(t1, 1), d = pt(t1, -1);
    const rgb = hslRGB(THREE, hue, 0.5, 0.2 + 0.12 * (1 - t0));
    for (const v of [a, b, c, a, c, d]) { pos.push(...v); col.push(rgb[0], rgb[1], rgb[2]); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}
type TreeKind = "broad" | "conifer" | "palm" | "tall";
function addTree(THREE: T3, kind: TreeKind, x: number, y: number, z: number, s: number, rnd: () => number, trunk: BG[], leaf: BG[]): void {
  const sd = rnd() * 50, hue = 82 + 28 * rnd(), lit = 0.2 + 0.08 * rnd(), tc: RGB = hslRGB(THREE, 28, 0.3, 0.16 + 0.06 * rnd());
  if (kind === "conifer") {
    const h = 9 * s;
    trunk.push(gPaint(THREE, gCyl(THREE, 0.12 * s, 0.3 * s, h * 0.5, 6, x, y + h * 0.25, z), tc));
    for (let i = 0; i < 6; i++) {
      const f = i / 6, r = (2.4 - 1.9 * f) * s, hh = 2.6 * s * (1.1 - 0.4 * f);
      const cone = new THREE.ConeGeometry(r, hh, 9, 1), ch = 140 + 10 * rnd(); cone.translate(x, y + h * (0.2 + 0.7 * f) + hh / 2, z);
      gPaintFn(THREE, cone, (_a, b, _c) => hslRGB(THREE, ch, 0.35, 0.1 + 0.07 * clamp01((b - y) / h)));
      leaf.push(cone);
    }
  } else if (kind === "palm") {
    const h = (6 + 3 * rnd()) * s, lean = (rnd() - 0.5) * 1.6 * s, pts: P3[] = [];
    for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push([x + lean * t * t, y + h * t, z + lean * 0.3 * t * t]); }
    for (let i = 0; i < 5; i++) trunk.push(gPaint(THREE, gBetween(THREE, pts[i], pts[i + 1], (0.2 - 0.05 * (i / 5)) * s, 7), hslRGB(THREE, 32, 0.15, 0.3 + 0.05 * rnd())));
    const top = pts[5];
    for (let i = 0; i < 11; i++) leaf.push(frond(THREE, top[0], top[1], top[2], (i / 11) * Math.PI * 2 + rnd() * 0.3, (3.2 + rnd()) * s, 0.55 + 0.4 * rnd(), 100 + 15 * rnd()));
    for (let i = 0; i < 4; i++) leaf.push(gPaint(THREE, new THREE.SphereGeometry(0.2 * s, 6, 5).translate(top[0] + Math.cos(i * 1.6) * 0.25 * s, top[1] - 0.2, top[2] + Math.sin(i * 1.6) * 0.25 * s), hslRGB(THREE, 70, 0.5, 0.3)));
  } else {
    const h = (kind === "tall" ? 13 : 7) * s, cr = (kind === "tall" ? 3.6 : 3.1) * s;
    trunk.push(gPaint(THREE, gCyl(THREE, 0.2 * s, 0.45 * s, h * 0.7, 7, x, y + h * 0.35, z), tc));
    for (const [dx, dy, dz] of [[0, 1.55, 0], [1.05, 1.25, 0.3], [-0.9, 1.3, -0.4], [0.2, 1.3, 1.0], [-0.2, 1.2, -1.0], [0.1, 1.85, 0.1]]) {
      const r = cr * (0.62 + 0.3 * rnd());
      leaf.push(blob(THREE, r, x + dx * cr * 0.55, y + h * 0.55 + dy * cr * 0.6, z + dz * cr * 0.55, 0.78, sd + dx * 3, hue, 0.45, lit));
    }
  }
}
function flushTrees(THREE: T3, g: Grp, mk: Mk, trunk: BG[], leaf: BG[]): void {
  addMerged(THREE, g, trunk, mk("#ffffff", 0.95, 0, { vertexColors: true }));
  addMerged(THREE, g, leaf, mk("#ffffff", 0.85, 0, { vertexColors: true, side: THREE.DoubleSide }));
}

// ---------- bridges: shared parts ----------
const stoneCol = (THREE: T3) => (x: number, y: number, z: number): RGB => {
  const f = (((y / 0.55) % 1) + 1) % 1, line = f < 0.07 ? -0.07 : 0;
  return hslRGB(THREE, 36 + 8 * fbm(x * 0.3, y * 0.3), 0.1 + 0.06 * fbm(x * 0.9, z * 0.9), 0.5 + 0.14 * fbm(x * 1.3 + z, y * 1.1, 3) + line);
};
function embank(h: number, x: number, z: number, halfL: number, y: number, width = 6): number {
  const tb = 1 - smooth(width * 0.6, width * 2, Math.abs(z)), along = smooth(halfL - 6, halfL, Math.abs(x));
  return h + (y - h) * tb * along;
}
function roadAlong(THREE: T3, g: Grp, mk: Mk, curve: Crv, w: number, steps: number, o: { girder?: number; barrier?: boolean; lamps?: boolean } = {}): void {
  const gd = o.girder ?? 1.1, hw = w / 2;
  const slab = gSweep(THREE, curve, [[-hw - 0.7, -gd], [hw + 0.7, -gd], [hw + 0.7, 0], [-hw - 0.7, 0]], steps);
  gPaintFn(THREE, slab, (x, y, z) => hslRGB(THREE, 40, 0.04, 0.5 + 0.1 * fbm(x * 0.5 + z, y * 0.5, 3)));
  g.add(new THREE.Mesh(gMerge(THREE, [slab]), mk("#ffffff", 0.9, 0, { vertexColors: true })));
  const as = gSweep(THREE, curve, [[-hw, 0], [hw, 0], [hw, 0.12], [-hw, 0.12]], steps);
  gPaintFn(THREE, as, (x, _y, z) => hslRGB(THREE, 220, 0.05, 0.15 + 0.06 * fbm(x * 1.1, z * 1.1, 3)));
  g.add(new THREE.Mesh(gMerge(THREE, [as]), mk("#ffffff", 0.95, 0, { vertexColors: true })));
  const line: BG[] = [];
  for (const s of [-1, 1]) line.push(gSweep(THREE, curve, [[s * (hw - 0.5) - 0.07, 0.12], [s * (hw - 0.5) + 0.07, 0.12], [s * (hw - 0.5) + 0.07, 0.125], [s * (hw - 0.5) - 0.07, 0.125]], steps));
  const len = curve.getLength(), n = Math.floor(len / 8), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, P = curve.getPointAt(t), T = curve.getTangentAt(t);
    line.push(gBox(THREE, 3, 0.012, 0.14, P.x, P.y + 0.126, P.z, Math.atan2(-T.z, T.x)));
  }
  addMerged(THREE, g, line, mk("#e8e6dc", 0.7, 0));
  if (o.barrier !== false) {
    const bar: BG[] = [];
    for (const s of [-1, 1]) bar.push(gSweep(THREE, curve, [[s * (hw + 0.1), 0.1], [s * (hw + 0.55), 0.1], [s * (hw + 0.45), 1.0], [s * (hw + 0.2), 1.0]], steps));
    g.add(new THREE.Mesh(gMerge(THREE, bar), mk("#b9b6ad", 0.85, 0)));
  }
  if (o.lamps) {
    const pole: BG[] = [], head: BG[] = [], ln = Math.floor(len / 28);
    for (let i = 0; i <= ln; i++) {
      const t = i / Math.max(1, ln), P = curve.getPointAt(t), T = curve.getTangentAt(t), S = new THREE.Vector3().crossVectors(up, T).normalize();
      const s = i % 2 ? 1 : -1, b = P.clone().addScaledVector(S, s * (hw + 0.3));
      pole.push(gCyl(THREE, 0.07, 0.12, 9, 6, b.x, b.y + 4.5, b.z));
      const e = b.clone().addScaledVector(S, -s * 2.2);
      pole.push(gBetween(THREE, [b.x, b.y + 8.8, b.z], [e.x, e.y + 9.2, e.z], 0.05, 5));
      head.push(gBox(THREE, 0.9, 0.12, 0.35, e.x, e.y + 9.15, e.z, Math.atan2(-T.z, T.x)));
    }
    addMerged(THREE, g, pole, mk("#8a9096", 0.5, 0.6));
    addMerged(THREE, g, head, mk("#fff6dc", 0.4, 0, { emissive: "#ffe9b0", emissiveIntensity: 1.2 }));
  }
}
function steelMember(THREE: T3, a: P3, b: P3, r = 0.22): BG { return gBetween(THREE, a, b, r, 4); }

// ---------- 1. stone rail viaduct ----------
function makeViaduct(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), H = 17, L = 114, R = 9, ys = 6, sp = 22, depth = 5.6, tot = 220;
  const hfn: HFn = (x, z) => {
    const v = 17.5 * Math.pow(smooth(18, 56, Math.abs(x + 7 * Math.sin(z * 0.05))), 1.1) + 1.0 * fbm(x * 0.05, z * 0.05) + 0.12;
    return embank(v, x, z, L / 2, H - 0.1, 5);
  };
  g.add(terrainMesh(THREE, mk, tot, 150, 110, hfn, { water: 0.7, rock: 30 }));
  g.add(waterMesh(THREE, mk, 70, 150, 0.7, 0, 0, 185));
  const sh = new THREE.Shape(); sh.moveTo(-L / 2, 0);
  for (let i = 0; i < 5; i++) { const xc = (i - 2) * sp; sh.lineTo(xc - R, 0); sh.lineTo(xc - R, ys); sh.absarc(xc, ys, R, Math.PI, 0, true); sh.lineTo(xc + R, 0); }
  sh.lineTo(L / 2, 0); sh.lineTo(L / 2, H); sh.lineTo(-L / 2, H); sh.lineTo(-L / 2, 0);
  const ex = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 18 });
  ex.translate(0, -1.2, -depth / 2);
  const body = ex.index ? ex.toNonIndexed() : ex; body.computeVertexNormals(); gPaintFn(THREE, body, stoneCol(THREE));
  g.add(new THREE.Mesh(body, mk("#ffffff", 0.95, 0, { vertexColors: true })));
  const top: BG[] = [gBox(THREE, L + 0.6, 0.5, 7.2, 0, H + 0.0, 0), gBox(THREE, L + 0.4, 0.9, 0.4, 0, H + 0.7, 3.4), gBox(THREE, L + 0.4, 0.9, 0.4, 0, H + 0.7, -3.4)];
  for (let x = -L / 2 + 1; x < L / 2; x += 5.5) for (const s of [-1, 1]) top.push(gBox(THREE, 0.7, 1.3, 0.7, x, H + 0.9, s * 3.4));
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) top.push(gBox(THREE, 0.9, 11, 0.3, (i - 2) * sp + 11, H - 6, s * (depth / 2 + 0.05)));
  addMerged(THREE, g, top.map((b) => gPaintFn(THREE, b, (x, y, z) => stoneCol(THREE)(x, y, z).map((v) => v * 1.06) as RGB)), mk("#ffffff", 0.9, 0, { vertexColors: true }));
  const tr = new THREE.Group(); addTrack(THREE, tr, mk, lineC(THREE, [-tot / 2 + 2, 0, 0], [tot / 2 - 2, 0, 0]), { cat: true }); tr.position.y = H + 0.25; g.add(tr);
  const rnd = rngf(5), trunk: BG[] = [], leaf: BG[] = [];
  for (let i = 0; i < 70; i++) {
    const x = (rnd() - 0.5) * tot, z = (rnd() - 0.5) * 140, y = hfn(x, z);
    if (Math.abs(z) < 7 && Math.abs(x) > L / 2 - 4 || (Math.abs(x) < 30 && y < 1.2) || (Math.abs(z) < 4)) continue;
    addTree(THREE, rnd() < 0.2 ? "palm" : rnd() < 0.3 ? "tall" : "broad", x, y - 0.1, z, 0.9 + 0.5 * rnd(), rnd, trunk, leaf);
  }
  flushTrees(THREE, g, mk, trunk, leaf);
  return g;
}

// ---------- 2. Warren truss river bridge ----------
function makeTruss(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), span = 70, np = 10, pw = span / np, th = 9, dk = 8, tot = 200;
  const hfn: HFn = (x, z) => {
    const ax = Math.abs(x + 5 * Math.sin(z * 0.06)), v = 7.4 * smooth(13, 27, ax) - 0.6 * (1 - smooth(0, 13, ax)) + 0.7 * fbm(x * 0.06, z * 0.06);
    return embank(v, x, z, span / 2 + 4, dk - 0.05, 5);
  };
  g.add(terrainMesh(THREE, mk, tot, 130, 100, hfn, { water: 1.2, rock: 30 }));
  g.add(waterMesh(THREE, mk, 80, 130, 1.2, 0, 0, 200));
  const steel = mk("#46607a", 0.45, 0.65), mem: BG[] = [], pl: BG[] = [];
  for (const z of [-3.6, 3.6]) {
    mem.push(gBox(THREE, span + 1, 0.7, 0.7, 0, dk + th, z), gBox(THREE, span + 1, 0.7, 0.7, 0, dk + 0.2, z));
    for (let i = 0; i < np; i++) {
      const x0 = -span / 2 + i * pw, x1 = x0 + pw, up = i % 2 === 0;
      mem.push(steelMember(THREE, [x0, up ? dk + 0.2 : dk + th, z], [x1, up ? dk + th : dk + 0.2, z], 0.2));
      mem.push(gBox(THREE, 0.4, th, 0.4, x0, dk + th / 2, z));
      pl.push(gBox(THREE, 1.1, 1.1, 0.12, x0, dk + th, z + Math.sign(z) * 0.4), gBox(THREE, 1.1, 1.1, 0.12, x0, dk + 0.2, z + Math.sign(z) * 0.4));
    }
    mem.push(gBox(THREE, 0.4, th, 0.4, span / 2, dk + th / 2, z));
  }
  for (let i = 0; i <= np; i++) {
    const x = -span / 2 + i * pw;
    mem.push(gBox(THREE, 0.3, 0.3, 7.4, x, dk - 0.5, 0), gBox(THREE, 0.45, 0.45, 7.4, x, dk + th, 0));
    if (i % 2 === 0) for (const s of [-1, 1]) mem.push(steelMember(THREE, [x, dk + th - 0.4, s * 3.5], [x, dk + th - 3.5, s * 0.0], 0.12));
  }
  for (let i = 0; i < np; i++) mem.push(steelMember(THREE, [-span / 2 + i * pw, dk + th, -3.6], [-span / 2 + (i + 1) * pw, dk + th, 3.6], 0.1));
  addMerged(THREE, g, mem, steel); addMerged(THREE, g, pl, mk("#2e3c4a", 0.5, 0.6));
  g.add(new THREE.Mesh(gMerge(THREE, [gPaintFn(THREE, gBox(THREE, span + 2, 0.7, 7.6, 0, dk - 0.45, 0), (x, _y, z) => hslRGB(THREE, 40, 0.04, 0.45 + 0.1 * fbm(x * 0.5, z, 2)))]), mk("#ffffff", 0.9, 0, { vertexColors: true })));
  for (const s of [-1, 1]) {
    const px = s * (span / 2 + 2.5), pier: BG[] = [gBox(THREE, 5, dk + 1.5, 8.6, px, (dk - 1.5) / 2 - 0.4, 0), gBox(THREE, 5.6, 0.7, 9.2, px, dk - 0.9, 0)];
    addMerged(THREE, g, pier.map((b) => gPaintFn(THREE, b, stoneCol(THREE))), mk("#ffffff", 0.95, 0, { vertexColors: true }));
  }
  const tr = new THREE.Group(); addTrack(THREE, tr, mk, lineC(THREE, [-tot / 2 + 2, 0, 0], [tot / 2 - 2, 0, 0]), { cat: false }); tr.position.y = dk + 0.0; g.add(tr);
  const rnd = rngf(9), trunk: BG[] = [], leaf: BG[] = [];
  for (let i = 0; i < 60; i++) {
    const x = (rnd() - 0.5) * tot, z = (rnd() - 0.5) * 120, y = hfn(x, z);
    if (Math.abs(x) < 29 || Math.abs(z) < 6) continue;
    addTree(THREE, rnd() < 0.3 ? "palm" : "broad", x, y - 0.1, z, 0.9 + 0.5 * rnd(), rnd, trunk, leaf);
  }
  flushTrees(THREE, g, mk, trunk, leaf);
  return g;
}

// ---------- 5. creek stone bridge (road) ----------
function makeCreek(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), H = 2.6, hump = 1.3, L = 28, tot = 120, hw = 2.9;
  const hfn: HFn = (x, z) => {
    const ax = Math.abs(x + 3 * Math.sin(z * 0.12)), v = 2.7 * smooth(3.5, 9, ax) - 0.5 * (1 - smooth(0, 3.5, ax)) + 0.9 * fbm(x * 0.09, z * 0.09, 4) * smooth(8, 25, ax);
    return embank(v, x, z, L / 2, H - 0.12, 3.5);
  };
  const cz = 0;
  g.add(terrainMesh(THREE, mk, tot, 80, 90, hfn, { water: 0.45, rock: 40, cz }));
  g.add(waterMesh(THREE, mk, 22, 80, 0.45, 0, cz, 175));
  const topY = (x: number) => H + hump * (1 - Math.min(1, Math.pow(x / 11, 2)));
  const sh = new THREE.Shape(); sh.moveTo(-L / 2, 0); sh.lineTo(-5.6, 0); sh.lineTo(-5.6, 1.4); sh.absarc(0, 1.4, 5.6, Math.PI, 0, true); sh.lineTo(5.6, 0); sh.lineTo(L / 2, 0);
  for (let i = 0; i <= 28; i++) { const x = L / 2 - (L * i) / 28; sh.lineTo(x, Math.max(H - 0.1, topY(x) - 0.2)); }
  sh.lineTo(-L / 2, 0);
  const ex = new THREE.ExtrudeGeometry(sh, { depth: 6.6, bevelEnabled: false, curveSegments: 16 });
  ex.translate(0, -0.9, -3.3);
  const body = ex.index ? ex.toNonIndexed() : ex; body.computeVertexNormals(); gPaintFn(THREE, body, stoneCol(THREE));
  g.add(new THREE.Mesh(body, mk("#ffffff", 0.95, 0, { vertexColors: true })));
  const pts: P3[] = []; for (let x = -52; x <= 52; x += x > -14 && x < 14 ? 1.4 : 6) pts.push([x, topY(x) - 0.1, 0]);
  const road = pathC(THREE, pts);
  roadAlong(THREE, g, mk, road, hw * 2, 60, { girder: 0.2, barrier: false });
  const par: BG[] = [];
  for (const s of [-1, 1]) par.push(gSweep(THREE, road, [[s * (hw + 0.05), 0], [s * (hw + 0.6), 0], [s * (hw + 0.6), 0.85], [s * (hw + 0.05), 0.85]], 60));
  par.forEach((b) => gPaintFn(THREE, b, (x, y, z) => stoneCol(THREE)(x, y, z).map((v) => v * 1.08) as RGB));
  g.add(new THREE.Mesh(gMerge(THREE, par), mk("#ffffff", 0.9, 0, { vertexColors: true })));
  const rnd = rngf(13), trunk: BG[] = [], leaf: BG[] = [], rocks: BG[] = [];
  for (let i = 0; i < 40; i++) {
    const x = (rnd() - 0.5) * 100, z = (rnd() - 0.5) * 70, y = hfn(x, z);
    if (Math.abs(x) < 8 && Math.abs(z) < 4) continue;
    if (Math.abs(z) < 4 && Math.abs(x) > 12) continue;
    addTree(THREE, rnd() < 0.25 ? "palm" : "broad", x, y - 0.1, z, 0.8 + 0.5 * rnd(), rnd, trunk, leaf);
  }
  for (let i = 0; i < 26; i++) {
    const x = (rnd() - 0.5) * 12, z = (rnd() - 0.5) * 70, y = 0.3, r = 0.3 + 0.6 * rnd();
    if (Math.abs(x) > 6) continue;
    const gr = hslRGB(THREE, 30, 0.06, 0.3 + 0.2 * rnd());
    rocks.push(gPaintFn(THREE, new THREE.SphereGeometry(r, 7, 5).translate(x, y, z), (a, b, c) => gr.map((v) => v * (0.8 + 0.4 * vnoise(a * 3, c * 3 + b))) as RGB));
  }
  flushTrees(THREE, g, mk, trunk, leaf); addMerged(THREE, g, rocks, mk("#ffffff", 0.95, 0, { vertexColors: true }));
  return g;
}

// ---------- 6. lake causeway bridge with pavilion ----------
function makeLake(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), L = 210, Y = 3.2, hw = 3.6;
  const hfn: HFn = (x, z) => {
    const r = Math.sqrt((x / 108) ** 2 + (z / 62) ** 2), v = -4 + 8.5 * smooth(0.8, 1.02, r) + 1.4 * fbm(x * 0.05, z * 0.05) * smooth(0.9, 1.2, r);
    return embank(v, x, z, 100, Y - 0.15, 5);
  };
  g.add(terrainMesh(THREE, mk, 270, 190, 120, hfn, { water: 0, rock: 40 }));
  g.add(waterMesh(THREE, mk, 270, 190, 0, 0, 0, 165));
  const pts: P3[] = []; for (let x = -L / 2; x <= L / 2; x += 15) pts.push([x, Y, 0]);
  const road = lineC(THREE, [-L / 2, Y, 0], [L / 2, Y, 0]);
  roadAlong(THREE, g, mk, road, hw * 2, 70, { girder: 1.0, lamps: true });
  const pier: BG[] = [];
  for (let x = -96; x <= 96; x += 12) {
    const gy = hfn(x, 0);
    if (gy > Y - 1.5) continue;
    for (const z of [-2.2, 2.2]) pier.push(gCyl(THREE, 0.42, 0.55, Y - 1.0 - gy + 0.4, 10, x, (Y - 1.0 + gy - 0.4) / 2, z));
    pier.push(gBox(THREE, 1.2, 0.8, hw * 2 + 0.2, x, Y - 1.4, 0));
  }
  addMerged(THREE, g, pier.map((b) => gPaintFn(THREE, b, (x, y, z) => hslRGB(THREE, 40, 0.05, 0.45 + 0.1 * fbm(x + z, y * 2, 2)))), mk("#ffffff", 0.9, 0, { vertexColors: true }));
  // pavilion (Khmer-style tiered roof)
  const px = 0, pz = 8.4, pav: BG[] = [], roof: BG[] = [], red = hslRGB(THREE, 12, 0.55, 0.28);
  pav.push(gPaint(THREE, gBox(THREE, 10, 0.6, 8, px, Y - 0.4, pz - 0.0), hslRGB(THREE, 35, 0.05, 0.55)));
  for (const [dx, dz] of [[-4, -3], [4, -3], [-4, 3], [4, 3]]) pav.push(gPaint(THREE, gCyl(THREE, 0.22, 0.26, 4.2, 10, px + dx, Y + 2.1, pz + dz), hslRGB(THREE, 20, 0.5, 0.2)));
  pav.push(gPaint(THREE, gBox(THREE, 9.4, 0.4, 7.4, px, Y + 4.3, pz), hslRGB(THREE, 20, 0.5, 0.18)));
  for (const s of [{ r: 7.6, y: 4.5, h: 1.8 }, { r: 5.4, y: 6.1, h: 1.7 }, { r: 3.2, y: 7.6, h: 1.6 }]) {
    const c = new THREE.ConeGeometry(s.r, s.h, 4, 1); c.rotateY(Math.PI / 4); c.translate(px, Y + s.y, pz);
    roof.push(gPaintFn(THREE, c, (x, _y, z) => red.map((v, i) => v * (0.85 + 0.3 * fbm(x * 1.2, z * 1.2, 2)) + (i === 0 ? 0.02 : 0)) as RGB));
  }
  roof.push(gPaint(THREE, gCyl(THREE, 0.05, 0.16, 1.8, 6, px, Y + 9.3, pz), hslRGB(THREE, 45, 0.8, 0.45)));
  addMerged(THREE, g, pav, mk("#ffffff", 0.8, 0, { vertexColors: true }));
  addMerged(THREE, g, roof, mk("#ffffff", 0.55, 0.1, { vertexColors: true }));
  // lily pads, lotus, shore trees
  const rnd = rngf(17), pads: BG[] = [], flw: BG[] = [], trunk: BG[] = [], leaf: BG[] = [];
  for (let i = 0; i < 260; i++) {
    const x = (rnd() - 0.5) * 220, z = (rnd() - 0.5) * 130, r = Math.sqrt((x / 108) ** 2 + (z / 62) ** 2);
    if (r > 0.93 || r < 0.3 || Math.abs(z) < 3) continue;
    const rr = 0.35 + 0.35 * rnd(), pad = new THREE.CylinderGeometry(rr, rr, 0.03, 10, 1).translate(x, 0.06, z);
    pads.push(gPaint(THREE, pad, hslRGB(THREE, 100 + 25 * rnd(), 0.5, 0.2 + 0.08 * rnd())));
    if (rnd() < 0.18) flw.push(gPaint(THREE, new THREE.ConeGeometry(0.17, 0.3, 7).translate(x + 0.1, 0.26, z), hslRGB(THREE, 330, 0.65, 0.65)));
  }
  for (let i = 0; i < 90; i++) {
    const x = (rnd() - 0.5) * 250, z = (rnd() - 0.5) * 170, y = hfn(x, z);
    if (y < 2.4 || Math.abs(z) < 8) continue;
    addTree(THREE, rnd() < 0.5 ? "palm" : rnd() < 0.5 ? "tall" : "broad", x, y - 0.1, z, 0.9 + 0.6 * rnd(), rnd, trunk, leaf);
  }
  addMerged(THREE, g, pads, mk("#ffffff", 0.7, 0, { vertexColors: true })); addMerged(THREE, g, flw, mk("#ffffff", 0.6, 0, { vertexColors: true }));
  flushTrees(THREE, g, mk, trunk, leaf);
  return g;
}

// ---------- 4. steel arch over a mountain valley (railway) ----------
function makeMountain(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), Y = 30, span = 32, tot = 260;
  const base = (x: number, z: number) => 42 * Math.pow(smooth(12, 62, Math.abs(x + 6 * Math.sin(z * 0.04))), 1.15) + 20 * smooth(55, 120, Math.abs(x)) * fbm(x * 0.03, z * 0.03 + 4, 4) + 1.5 * fbm(x * 0.08, z * 0.08, 4);
  const hfn: HFn = (x, z) => {
    const h = base(x, z), cut = 1 - smooth(5, 17, Math.abs(z)), a = smooth(30, 44, Math.abs(x));
    return h + (Y - 0.2 - h) * cut * a;
  };
  g.add(terrainMesh(THREE, mk, tot, 150, 130, hfn, { water: 0.6, rock: 40 }));
  g.add(waterMesh(THREE, mk, 16, 150, 0.6, 0, 0, 190));
  const sy = Math.max(6, hfn(span, 0) - 0.5), crown = Y - 2.2, steel = mk("#8a3a2e", 0.45, 0.6), mem: BG[] = [];
  const arch = (x: number) => sy + (crown - sy) * (1 - Math.pow(x / span, 2));
  for (const z of [-3.2, 3.2]) {
    const n = 20;
    for (let i = 0; i < n; i++) {
      const x0 = -span + (2 * span * i) / n, x1 = -span + (2 * span * (i + 1)) / n;
      mem.push(gBetween(THREE, [x0, arch(x0), z], [x1, arch(x1), z], 0.85, 4), gBetween(THREE, [x0, arch(x0) - 1.6, z], [x1, arch(x1) - 1.6, z], 0.5, 4));
      if (i % 2) mem.push(gBetween(THREE, [x0, arch(x0), z], [x0, arch(x0) - 1.6, z], 0.3, 4));
    }
    for (let x = -span + 6.4; x < span - 1; x += 6.4) {
      mem.push(gBox(THREE, 0.7, Y - 1.1 - arch(x), 0.7, x, (Y - 1.1 + arch(x)) / 2, z));
      mem.push(gBetween(THREE, [x, arch(x), z], [x + 6.4, arch(x + 6.4) + 0.5, z], 0.14, 4));
    }
  }
  for (let x = -span + 3.2; x < span; x += 3.2) mem.push(gBetween(THREE, [x, arch(x) + 0.3, -3.2], [x, arch(x) + 0.3, 3.2], 0.22, 4));
  addMerged(THREE, g, mem, steel);
  const conc = hslRGB(THREE, 38, 0.04, 0.5);
  const abut: BG[] = [];
  for (const s of [-1, 1]) abut.push(gPaint(THREE, gBox(THREE, 6, 3, 9.5, s * (span + 1.5), sy - 0.4, 0), conc));
  const deck = [gPaintFn(THREE, gBox(THREE, 2 * span + 24, 1.0, 8.4, 0, Y - 0.6, 0), (x, _y, z) => hslRGB(THREE, 40, 0.04, 0.48 + 0.1 * fbm(x * 0.4, z * 0.4, 3)))];
  addMerged(THREE, g, abut.concat(deck), mk("#ffffff", 0.9, 0, { vertexColors: true }));
  const tr = new THREE.Group(); addTrack(THREE, tr, mk, lineC(THREE, [-tot / 2 + 2, 0, 0], [tot / 2 - 2, 0, 0]), { cat: true }); tr.position.y = Y - 0.1; g.add(tr);
  const rnd = rngf(23), trunk: BG[] = [], leaf: BG[] = [];
  for (let i = 0; i < 160; i++) {
    const x = (rnd() - 0.5) * tot, z = (rnd() - 0.5) * 140, y = hfn(x, z);
    if (y > 26 || Math.abs(z) < 12 && Math.abs(x) > 30 || (Math.abs(x) < 20 && y < 1)) continue;
    addTree(THREE, y > 14 ? "conifer" : rnd() < 0.3 ? "palm" : "broad", x, y - 0.1, z, 0.9 + 0.6 * rnd(), rnd, trunk, leaf);
  }
  flushTrees(THREE, g, mk, trunk, leaf);
  return g;
}

// ---------- 3. cable-stayed sea bridge ----------
function makeSea(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), tot = 420, hw = 10, px = 80, top = 70;
  const dy = (x: number) => 5 + 11.5 * (1 - smooth(110, 205, Math.abs(x))) + 1.5 * clamp01(1 - Math.pow(x / 80, 2));
  const hfn: HFn = (x, z) => -9 + 12.8 * smooth(150, 200, Math.abs(x)) + 1.2 * fbm(x * 0.05, z * 0.05) * smooth(170, 215, Math.abs(x));
  g.add(terrainMesh(THREE, mk, tot + 30, 260, 130, hfn, { water: 0, rock: 40 }));
  g.add(waterMesh(THREE, mk, tot + 30, 260, 0, 0, 0, 200));
  const pts: P3[] = []; for (let x = -205; x <= 205; x += 10) pts.push([x, dy(x), 0]);
  roadAlong(THREE, g, mk, pathC(THREE, pts), hw * 2, 150, { girder: 2.4, lamps: true });
  const conc = (b: BG) => gPaintFn(THREE, b, (x, y, z) => hslRGB(THREE, 40, 0.04, 0.55 + 0.08 * fbm(x * 0.3 + z, y * 0.3, 3)));
  const pil: BG[] = [];
  for (let x = -200; x <= 200; x += 25) {
    if (Math.abs(Math.abs(x) - px) < 12) continue;
    const gy = hfn(x, 0), yt = dy(x) - 2.4;
    if (gy > yt - 2) continue;
    pil.push(conc(gBox(THREE, 3, yt - gy + 1, 7.5, x, (yt + gy) / 2 - 0.5, 0)), conc(gBox(THREE, 4.4, 1.2, 14, x, yt - 0.6, 0)));
  }
  for (const s of [-1, 1]) {
    const X = s * px;
    for (const z of [-1, 1]) {
      pil.push(conc(gCyl(THREE, 1.3, 1.7, 36, 4, X, 12, z * 8, 0, Math.PI / 4, 0).scale(1, 1, 1)));
      pil.push(conc(gBetween(THREE, [X, 30, z * 8], [X, top, z * 1.3], 1.15, 4)));
    }
    pil.push(conc(gBox(THREE, 2.4, 2.2, 15, X, 28, 0)), conc(gBox(THREE, 2.4, 2, 4.4, X, top + 0.6, 0)), conc(gBox(THREE, 2.2, 2, 18, X, dy(X) - 3.2, 0)));
  }
  addMerged(THREE, g, pil, mk("#ffffff", 0.88, 0, { vertexColors: true }));
  const st: BG[] = [];
  for (const s of [-1, 1]) for (let i = 0; i < 8; i++) for (const d of [-1, 1]) for (const z of [-1, 1]) {
    const hy = 42 + 3.4 * i, zz = z * (8 - 6.7 * (hy - 30) / 40), ax = s * px + d * (10 + 8.6 * i);
    st.push(gBetween(THREE, [s * px, hy, zz], [ax, dy(ax) + 0.3, z * (hw + 0.6)], 0.09, 4));
  }
  addMerged(THREE, g, st, mk("#e9e4d8", 0.4, 0.2));
  for (const s of [-1, 1]) { const m = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), mk("#ff3b2f", 0.3, 0, { emissive: "#ff2010", emissiveIntensity: 1.5 })); m.position.set(s * px, top + 2.2, 0); g.add(m); }
  const rnd = rngf(29), trunk: BG[] = [], leaf: BG[] = [];
  for (let i = 0; i < 70; i++) {
    const x = (rnd() > 0.5 ? 1 : -1) * (190 + 30 * rnd()), z = (rnd() - 0.5) * 220, y = hfn(x, z);
    if (Math.abs(z) < 14 || y < 2) continue;
    addTree(THREE, rnd() < 0.6 ? "palm" : "broad", x, y - 0.1, z, 1 + 0.6 * rnd(), rnd, trunk, leaf);
  }
  flushTrees(THREE, g, mk, trunk, leaf);
  return g;
}

// ---------- 7. flyover ----------
function makeFlyover(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), tot = 320, zf = (x: number) => 22 * Math.sin((x * Math.PI) / 130);
  const yf = (x: number) => 0.25 + 8.2 * smooth(-125, -65, x) * (1 - smooth(65, 125, x));
  g.add(terrainMesh(THREE, mk, tot, 200, 80, (x, z) => 0 + 0.0 * x * z, { cx: 0 }));
  roadAlong(THREE, g, mk, lineC(THREE, [-tot / 2, 0.06, -4], [tot / 2, 0.06, -4]), 16, 60, { girder: 0.1, barrier: false, lamps: true });
  const pts: P3[] = []; for (let x = -150; x <= 150; x += 6) pts.push([x, yf(x), zf(x)]);
  const c = pathC(THREE, pts);
  roadAlong(THREE, g, mk, c, 13, 160, { girder: 1.5, lamps: true });
  const pil: BG[] = [], up = new THREE.Vector3(0, 1, 0);
  for (let x = -112; x <= 112; x += 14) {
    const y = yf(x), z = zf(x), ry = -Math.atan2(22 * Math.cos((x * Math.PI) / 130) * (Math.PI / 130), 1);
    if (y < 2.2) continue;
    pil.push(gPaintFn(THREE, gBox(THREE, 1.8, y - 1.6, 1.8, x, (y - 1.6) / 2, z, ry), (a, b, d) => hslRGB(THREE, 40, 0.04, 0.5 + 0.1 * fbm(a + d, b * 0.5, 3))));
    pil.push(gPaintFn(THREE, gBox(THREE, 1.6, 1.3, 11, x, y - 1.6 + 0.2, z, ry), (a, b, d) => hslRGB(THREE, 40, 0.04, 0.46 + 0.1 * fbm(a + d, b, 3))));
  }
  void up;
  addMerged(THREE, g, pil, mk("#ffffff", 0.9, 0, { vertexColors: true }));
  const rnd = rngf(31), trunk: BG[] = [], leaf: BG[] = [];
  for (let i = 0; i < 40; i++) {
    const x = (rnd() - 0.5) * 300, z = (rnd() - 0.5) * 180;
    if (Math.abs(z - zf(x)) < 12 || Math.abs(z + 4) < 12) continue;
    addTree(THREE, rnd() < 0.5 ? "palm" : "broad", x, 0, z, 0.8 + 0.5 * rnd(), rnd, trunk, leaf);
  }
  flushTrees(THREE, g, mk, trunk, leaf);
  return g;
}

// ---------- forest ----------
function scatterForest(THREE: T3, g: Grp, mk: Mk, rnd: () => number, n: number, area: [number, number, number, number], hfn: HFn, ok: (x: number, z: number, y: number) => boolean): void {
  const trunk: BG[] = [], leaf: BG[] = [], bush: BG[] = [];
  for (let i = 0; i < n; i++) {
    const x = area[0] + (area[1] - area[0]) * rnd(), z = area[2] + (area[3] - area[2]) * rnd(), y = hfn(x, z);
    if (!ok(x, z, y)) continue;
    const r = rnd(), cl = fbm(x * 0.04, z * 0.04, 2);
    const kind: TreeKind = y > 9 ? "conifer" : cl > 0.55 ? (r < 0.5 ? "tall" : "broad") : r < 0.25 ? "palm" : r < 0.55 ? "tall" : "broad";
    addTree(THREE, kind, x, y - 0.15, z, 0.8 + 0.7 * rnd(), rnd, trunk, leaf);
    if (rnd() < 0.5) bush.push(blob(THREE, 0.5 + 0.5 * rnd(), x + (rnd() - 0.5) * 6, y + 0.3, z + (rnd() - 0.5) * 6, 0.7, rnd() * 40, 90 + 30 * rnd(), 0.45, 0.2));
  }
  flushTrees(THREE, g, mk, trunk, leaf); addMerged(THREE, g, bush, mk("#ffffff", 0.9, 0, { vertexColors: true }));
}
function makeForest(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), W = 170;
  const hfn: HFn = (x, z) => 7 * fbm(x * 0.018, z * 0.018, 4) + 0.5 * fbm(x * 0.1, z * 0.1, 3);
  g.add(terrainMesh(THREE, mk, W, W, 120, hfn, { rock: 40 }));
  const pc: P3[] = []; for (let i = 0; i <= 16; i++) { const x = -80 + i * 10, z = 14 * Math.sin(i * 0.55) + 3 * Math.sin(i * 1.7); pc.push([x, hfn(x, z) + 0.06, z]); }
  const path = pathC(THREE, pc), pb = gSweep(THREE, path, [[-1.2, 0], [1.2, 0], [1.2, 0.04], [-1.2, 0.04]], 160);
  gPaintFn(THREE, pb, (x, _y, z) => hslRGB(THREE, 28, 0.3, 0.26 + 0.1 * fbm(x * 0.8, z * 0.8, 3)));
  g.add(new THREE.Mesh(gMerge(THREE, [pb]), mk("#ffffff", 1, 0, { vertexColors: true })));
  const rnd = rngf(41), cs = Array.from({ length: 17 }, (_, i) => new THREE.Vector3(...pc[i]));
  scatterForest(THREE, g, mk, rnd, 900, [-80, 80, -80, 80], hfn, (x, z) => { for (const v of cs) if ((v.x - x) ** 2 + (v.z - z) ** 2 < 13) return false; return true; });
  const rocks: BG[] = [], fl: BG[] = [];
  for (let i = 0; i < 40; i++) {
    const x = (rnd() - 0.5) * 150, z = (rnd() - 0.5) * 150, r = 0.3 + 0.9 * rnd(), c = hslRGB(THREE, 30, 0.06, 0.3 + 0.2 * rnd());
    rocks.push(gPaintFn(THREE, new THREE.SphereGeometry(r, 7, 5).translate(x, hfn(x, z) + r * 0.2, z).scale(1, 0.7, 1), (a, b, d) => c.map((v) => v * (0.8 + 0.4 * vnoise(a * 2, d * 2 + b))) as RGB));
  }
  for (let i = 0; i < 160; i++) {
    const x = (rnd() - 0.5) * 150, z = (rnd() - 0.5) * 150;
    fl.push(gPaint(THREE, new THREE.SphereGeometry(0.1, 5, 4).translate(x, hfn(x, z) + 0.25, z), hslRGB(THREE, [0, 48, 300, 200][i % 4], 0.8, 0.6)));
  }
  addMerged(THREE, g, rocks, mk("#ffffff", 0.95, 0, { vertexColors: true })); addMerged(THREE, g, fl, mk("#ffffff", 0.7, 0, { vertexColors: true }));
  return g;
}

// ---------- highway + railway corridor with forest on both sides ----------
function makeCorridor(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), L = 300, D = 150;
  const hfn: HFn = (x, z) => { const k = smooth(20, 44, Math.abs(z + 2)); return -0.08 + k * (5 * fbm(x * 0.02, z * 0.02, 4) + 0.5); };
  g.add(terrainMesh(THREE, mk, L, D, 120, hfn, { rock: 40 }));
  roadAlong(THREE, g, mk, lineC(THREE, [-L / 2, 0.02, -14], [L / 2, 0.02, -14]), 15, 60, { girder: 0.12, barrier: false, lamps: true });
  const med = gSweep(THREE, lineC(THREE, [-L / 2, 0.02, -14], [L / 2, 0.02, -14]), [[-0.35, 0.1], [0.35, 0.1], [0.3, 0.9], [-0.3, 0.9]], 20);
  g.add(new THREE.Mesh(gMerge(THREE, [med]), mk("#b6b3aa", 0.85, 0)));
  const tr = new THREE.Group(); addTrack(THREE, tr, mk, lineC(THREE, [-L / 2, 0, 12], [L / 2, 0, 12]), { cat: true, seed: 3 }); tr.position.y = 0.03; g.add(tr);
  const rnd = rngf(47);
  scatterForest(THREE, g, mk, rnd, 1100, [-L / 2 + 4, L / 2 - 4, -D / 2 + 2, D / 2 - 2], hfn, (_x, z) => !(z > -26 && z < 20) || (z > -26 && z < -22 && rnd() < 0.3) || (z > 16 && z < 20 && rnd() < 0.25));
  return g;
}

// ---------- dispatcher ----------
export const INFRA_SCALE = 0.2;
export function createInfraGeometry(THREE: T3, shape: InfraShape, _color?: string, _metalness?: number, _roughness?: number): Grp {
  const mk = makeKit(THREE);
  let g: Grp;
  // the Studio animation moves a 'trainRun' group back and forth by +-range metres and rolls every 'infraWheel' with it
  const runner = (t: Grp, range: number): Grp => { const w = new THREE.Group(); w.userData.trainRun = range; w.add(t); return w; };
  const track = (len: number, cat = true) => { const t = new THREE.Group(); addTrack(THREE, t, mk, lineC(THREE, [-len / 2, 0, 0], [len / 2, 0, 0]), { cat }); return t; };
  switch (shape) {
    case "railway": g = track(120); break;
    case "railway_curve": g = new THREE.Group(); addTrack(THREE, g, mk, arcCurve(THREE, 120, Math.PI / 3), { cat: true }); break;
    case "locomotive": g = track(60); g.add(runner(makeLoco(THREE, mk), 15)); break;
    case "passenger": g = track(60); g.add(runner(makeCoach(THREE, mk, false), 17)); break;
    case "passenger_vip": g = track(60); g.add(runner(makeCoach(THREE, mk, true), 17)); break;
    case "caboose": g = track(50); g.add(runner(makeCaboose(THREE, mk), 14)); break;
    case "trainset": g = track(170); g.add(runner(makeTrainset(THREE, mk), 16)); break;
    case "bridge_rail": g = makeViaduct(THREE, mk); break;
    case "bridge_river": g = makeTruss(THREE, mk); break;
    case "bridge_sea": g = makeSea(THREE, mk); break;
    case "bridge_mountain": g = makeMountain(THREE, mk); break;
    case "bridge_creek": g = makeCreek(THREE, mk); break;
    case "bridge_lake": g = makeLake(THREE, mk); break;
    case "flyover": g = makeFlyover(THREE, mk); break;
    case "forest": g = makeForest(THREE, mk); break;
    case "zone_city": g = makeCityZone(THREE, mk); break;
    case "zone_town": g = makeTownZone(THREE, mk); break;
    case "zone_remote": g = makeRemoteZone(THREE, mk); break;
    case "police_officer": g = makePolice(THREE, mk); break;
    case "hotel_room": g = makeHotelRoom(THREE, mk); break;
    case "hotel_v2": g = makeBuilding(THREE, mk, "hotel"); break;
    case "mall_v2": g = makeBuilding(THREE, mk, "mall"); break;
    case "hospital_v2": g = makeBuilding(THREE, mk, "hospital"); break;
    case "police_v2": g = makeBuilding(THREE, mk, "police"); break;
    default: g = makeCorridor(THREE, mk);
  }
  g.traverse((o) => { const m = o as import("three").Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  recenterXZ(THREE, g);
  // 1 unit in the model = 1 metre; the Studio scene is much smaller, so scale everything by one common factor
  const wrap = new THREE.Group();
  while (g.children.length) wrap.add(g.children[0]);
  wrap.scale.setScalar(shape === "police_officer" ? 1 : shape === "hotel_room" ? 0.5 : INFRA_SCALE);
  g.add(wrap);
  g.userData.infra = shape;
  return g;
}

// ---------- zones (phase 2): city / town / remote ----------
interface Acc { body: BG[]; glass: BG[]; roof: BG[]; trim: BG[]; road: BG[]; walk: BG[]; wood: BG[]; gold: BG[]; red: BG[]; lit: BG[] }
const newAcc = (): Acc => ({ body: [], glass: [], roof: [], trim: [], road: [], walk: [], wood: [], gold: [], red: [], lit: [] });
function flushAcc(THREE: T3, g: Grp, mk: Mk, a: Acc): void {
  const vc = (r: number, m = 0) => mk("#ffffff", r, m, { vertexColors: true });
  addMerged(THREE, g, a.body, vc(0.85)); addMerged(THREE, g, a.glass, mk("#ffffff", 0.08, 0.75, { vertexColors: true }));
  addMerged(THREE, g, a.roof, vc(0.9)); addMerged(THREE, g, a.trim, vc(0.6)); addMerged(THREE, g, a.road, vc(0.95));
  addMerged(THREE, g, a.walk, vc(0.9)); addMerged(THREE, g, a.wood, vc(0.9)); addMerged(THREE, g, a.gold, mk("#ffffff", 0.3, 0.8, { vertexColors: true }));
  addMerged(THREE, g, a.red, vc(0.6));
  addMerged(THREE, g, a.lit, mk("#ffffff", 0.4, 0, { vertexColors: true, emissive: "#ffffff", emissiveIntensity: 0.55 }));
}
function tower(THREE: T3, a: Acc, x: number, z: number, w: number, d: number, h: number, hue: number, rnd: () => number): void {
  const body = hslRGB(THREE, hue, 0.06 + 0.1 * rnd(), 0.5 + 0.25 * rnd()), gl = hslRGB(THREE, 200 + 25 * rnd(), 0.35, 0.16 + 0.1 * rnd());
  const tiers = h > 50 ? 2 : 1;
  let y0 = 0, ww = w, dd = d, hh = tiers === 2 ? h * 0.65 : h;
  for (let t = 0; t < tiers; t++) {
    a.body.push(gPaintFn(THREE, gBox(THREE, ww, hh, dd, x, y0 + hh / 2, z), (_x, y, _z) => body.map((v) => v * (0.92 + 0.08 * vnoise(y * 0.3, x))) as RGB));
    const n = Math.floor(hh / 3.6);
    for (let f = 1; f < n; f++) {
      const y = y0 + f * 3.6 + 0.6;
      a.glass.push(gPaint(THREE, gBox(THREE, ww * 0.93, 2.1, 0.14, x, y, z + dd / 2), gl), gPaint(THREE, gBox(THREE, ww * 0.93, 2.1, 0.14, x, y, z - dd / 2), gl));
      a.glass.push(gPaint(THREE, gBox(THREE, 0.14, 2.1, dd * 0.93, x + ww / 2, y, z), gl), gPaint(THREE, gBox(THREE, 0.14, 2.1, dd * 0.93, x - ww / 2, y, z), gl));
    }
    a.roof.push(gPaint(THREE, gBox(THREE, ww + 0.5, 0.5, dd + 0.5, x, y0 + hh + 0.25, z), [0.3, 0.3, 0.32]));
    y0 += hh; ww *= 0.7; dd *= 0.7; hh = h - y0;
  }
  a.roof.push(gPaint(THREE, gBox(THREE, 3, 2, 3, x + w * 0.1, h + 1.2, z), [0.4, 0.4, 0.42]));
  if (h > 60) a.trim.push(gPaint(THREE, gCyl(THREE, 0.12, 0.2, 14, 5, x, h + 7, z), [0.7, 0.2, 0.2]));
}
function roadStrip(THREE: T3, a: Acc, x0: number, z0: number, x1: number, z1: number, w: number, dashes = true): void {
  const len = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(-(z1 - z0), x1 - x0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  a.road.push(gPaintFn(THREE, gBox(THREE, len, 0.12, w, cx, 0.06, cz, ry), (px, _y, pz) => hslRGB(THREE, 220, 0.04, 0.17 + 0.05 * fbm(px * 0.7, pz * 0.7, 2))));
  if (dashes) for (let s = 4; s < len - 3; s += 8) {
    const t = s / len; a.trim.push(gPaint(THREE, gBox(THREE, 3.2, 0.03, 0.18, x0 + (x1 - x0) * t, 0.14, z0 + (z1 - z0) * t, ry), [0.85, 0.84, 0.75]));
  }
}
function parkedCar(THREE: T3, a: Acc, x: number, z: number, ry: number, c: RGB): void {
  a.red.push(gPaint(THREE, gBox(THREE, 4.2, 0.8, 1.8, x, 0.7, z, ry), c));
  a.red.push(gPaint(THREE, gBox(THREE, 2.2, 0.7, 1.6, x - Math.cos(ry) * 0.2, 1.4, z + Math.sin(ry) * 0.2, ry), [0.05, 0.08, 0.1]));
  a.trim.push(gPaint(THREE, gBox(THREE, 4.0, 0.3, 1.9, x, 0.28, z, ry), [0.03, 0.03, 0.03]));
}

function makeCityZone(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), a = newAcc(), rnd = rngf(61);
  g.add(terrainMesh(THREE, mk, 250, 250, 50, (x, z) => -0.05 + 0.0 * x * z, {}));
  const ground = gPaint(THREE, gBox(THREE, 220, 0.1, 220, 0, 0.05, 0), hslRGB(THREE, 40, 0.04, 0.5)); a.walk.push(ground);
  for (let k = -2; k <= 2; k++) { roadStrip(THREE, a, -110, k * 50, 110, k * 50, 12); roadStrip(THREE, a, k * 50, -110, k * 50, 110, 12); }
  const cx = [-75, -25, 25, 75];
  const lot = (x: number, z: number, i: number, j: number) => {
    const r = Math.hypot(x, z), h0 = 14 + 78 * Math.exp(-((r / 70) ** 2)) * (0.45 + 0.8 * rnd());
    if (i === 1 && j === 1) return hotel(x, z);
    if (i === 2 && j === 2) return mall(x, z);
    if (i === 0 && j === 3) return hospital(x, z);
    if (i === 3 && j === 0) return police(x, z);
    if (i === 1 && j === 2) return park(x, z);
    for (const [sx, sz] of [[-9.5, -9.5], [9.5, -9.5], [-9.5, 9.5], [9.5, 9.5]]) {
      if (rnd() < 0.15) continue;
      tower(THREE, a, x + sx + (rnd() - 0.5) * 2, z + sz + (rnd() - 0.5) * 2, 11 + 4 * rnd(), 11 + 4 * rnd(), Math.max(10, h0 * (0.6 + 0.7 * rnd())), 190 + 50 * rnd(), rnd);
    }
  };
  const hotel = (x: number, z: number) => {
    tower(THREE, a, x, z, 24, 20, 52, 28, rnd);
    a.roof.push(gPaint(THREE, gBox(THREE, 20, 0.5, 8, x, 3.6, z + 14), [0.6, 0.5, 0.3]), gPaint(THREE, gBox(THREE, 0.4, 3.6, 0.4, x - 9, 1.8, z + 17.5), [0.7, 0.6, 0.4]), gPaint(THREE, gBox(THREE, 0.4, 3.6, 0.4, x + 9, 1.8, z + 17.5), [0.7, 0.6, 0.4]));
    for (let f = 1; f < 14; f++) a.trim.push(gPaint(THREE, gBox(THREE, 24.6, 0.18, 1.4, x, f * 3.6 + 1.6, z + 10.4), [0.75, 0.7, 0.62]));
  };
  const mall = (x: number, z: number) => {
    a.body.push(gPaint(THREE, gBox(THREE, 34, 14, 28, x, 7, z), hslRGB(THREE, 30, 0.15, 0.7)));
    a.glass.push(gPaint(THREE, gBox(THREE, 26, 6.5, 0.2, x, 4.2, z + 14), [0.05, 0.09, 0.12]), gPaint(THREE, gBox(THREE, 34.2, 2.2, 0.2, x, 11, z + 14), [0.05, 0.09, 0.12]));
    a.roof.push(gPaint(THREE, gBox(THREE, 34.6, 0.6, 28.6, x, 14.3, z), [0.25, 0.25, 0.27]), gPaint(THREE, gBox(THREE, 18, 3, 0.8, x, 16, z + 14.2), hslRGB(THREE, 355, 0.7, 0.4)));
    a.trim.push(gPaint(THREE, gBox(THREE, 30, 0.5, 5, x, 7.4, z + 16.5), [0.8, 0.8, 0.82]));
    for (let i = -3; i <= 3; i++) a.trim.push(gPaint(THREE, gBox(THREE, 0.4, 7.4, 0.4, x + i * 4.4, 3.7, z + 18.5), [0.8, 0.8, 0.82]));
    for (let i = 0; i < 12; i++) parkedCar(THREE, a, x - 16 + (i % 6) * 6, z + 23 + Math.floor(i / 6) * 6, Math.PI / 2, [rnd(), rnd(), rnd()].map((v) => 0.1 + 0.8 * v) as RGB);
  };
  const hospital = (x: number, z: number) => {
    const wh = [0.9, 0.9, 0.9] as RGB;
    a.body.push(gPaint(THREE, gBox(THREE, 30, 16, 14, x, 8, z - 6), wh), gPaint(THREE, gBox(THREE, 12, 22, 14, x + 9, 11, z + 6), wh), gPaint(THREE, gBox(THREE, 12, 12, 10, x - 9, 6, z + 8), wh));
    for (let f = 0; f < 4; f++) a.glass.push(gPaint(THREE, gBox(THREE, 28, 1.8, 0.14, x, f * 3.8 + 2.2, z + 1.05), [0.2, 0.35, 0.45]));
    a.red.push(gPaint(THREE, gBox(THREE, 1.2, 5, 0.3, x + 9, 16, z + 13.2), [0.85, 0.08, 0.08]), gPaint(THREE, gBox(THREE, 5, 1.2, 0.3, x + 9, 16, z + 13.2), [0.85, 0.08, 0.08]));
    a.roof.push(gPaint(THREE, gBox(THREE, 30.5, 0.5, 14.5, x, 16.3, z - 6), [0.6, 0.6, 0.62]), gPaint(THREE, gCyl(THREE, 4, 4, 0.2, 20, x - 4, 16.7, z - 6), [0.2, 0.2, 0.22]));
    a.trim.push(gPaint(THREE, gBox(THREE, 12, 0.3, 6, x - 9, 4.6, z + 15), [0.8, 0.1, 0.1]));
    parkedCar(THREE, a, x - 8, z + 17, 0, [0.9, 0.9, 0.9]);
  };
  const police = (x: number, z: number) => {
    a.body.push(gPaint(THREE, gBox(THREE, 24, 10, 16, x, 5, z), hslRGB(THREE, 215, 0.35, 0.42)));
    a.glass.push(gPaint(THREE, gBox(THREE, 20, 2, 0.14, x, 3, z + 8), [0.06, 0.1, 0.15]), gPaint(THREE, gBox(THREE, 20, 2, 0.14, x, 7, z + 8), [0.06, 0.1, 0.15]));
    a.roof.push(gPaint(THREE, gBox(THREE, 24.6, 0.5, 16.6, x, 10.25, z), [0.2, 0.2, 0.24]));
    a.trim.push(gPaint(THREE, gBox(THREE, 8, 1.6, 0.3, x, 9, z + 8.2), [0.9, 0.9, 0.9]), gPaint(THREE, gCyl(THREE, 0.08, 0.08, 9, 5, x + 10, 14.5, z + 9), [0.7, 0.7, 0.7]));
    a.red.push(gPaint(THREE, gBox(THREE, 1.2, 0.5, 0.5, x - 1, 10.8, z + 6), [0.1, 0.2, 0.95]), gPaint(THREE, gBox(THREE, 1.2, 0.5, 0.5, x + 1, 10.8, z + 6), [0.95, 0.1, 0.1]));
    for (let i = 0; i < 3; i++) { parkedCar(THREE, a, x - 8 + i * 7, z + 14, 0, [0.92, 0.93, 0.95]); a.red.push(gPaint(THREE, gBox(THREE, 4.22, 0.25, 1.82, x - 8 + i * 7, 0.9, z + 14), [0.1, 0.2, 0.8])); }
  };
  const park = (x: number, z: number) => {
    a.walk.push(gPaintFn(THREE, gBox(THREE, 36, 0.14, 36, x, 0.1, z), (px, _y, pz) => hslRGB(THREE, 95 + 10 * fbm(px * 0.1, pz * 0.1), 0.45, 0.28 + 0.08 * fbm(px, pz, 2))));
    const tr: BG[] = [], lf: BG[] = [];
    for (let i = 0; i < 16; i++) addTree(THREE, rnd() < 0.3 ? "palm" : "broad", x - 15 + 30 * rnd(), 0.1, z - 15 + 30 * rnd(), 0.7 + 0.5 * rnd(), rnd, tr, lf);
    flushTrees(THREE, g, mk, tr, lf);
  };
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) lot(cx[i], cx[j], i, j);
  for (let i = 0; i < 40; i++) { const k = Math.floor(rnd() * 5) - 2, t = (rnd() - 0.5) * 200; if (rnd() < 0.5) parkedCar(THREE, a, t, k * 50 + (rnd() < 0.5 ? -2.2 : 2.2), 0, [rnd() * 0.9, rnd() * 0.9, rnd() * 0.9]); else parkedCar(THREE, a, k * 50 + (rnd() < 0.5 ? -2.2 : 2.2), t, Math.PI / 2, [rnd() * 0.9, rnd() * 0.9, rnd() * 0.9]); }
  const tr: BG[] = [], lf: BG[] = [];
  for (let k = -2; k <= 2; k++) for (let t = -100; t <= 100; t += 14) { if (rnd() < 0.3) continue; addTree(THREE, "broad", t, 0.1, k * 50 + 7.5, 0.45, rnd, tr, lf); }
  flushTrees(THREE, g, mk, tr, lf); flushAcc(THREE, g, mk, a);
  return g;
}

function shophouse(THREE: T3, a: Acc, x: number, z: number, w: number, d: number, floors: number, front: number, hue: number, rnd: () => number): void {
  const h = floors * 3.3 + 0.8, c = hslRGB(THREE, hue, 0.35 + 0.2 * rnd(), 0.48 + 0.12 * rnd()), dk = [0.07, 0.09, 0.11] as RGB;
  a.body.push(gPaintFn(THREE, gBox(THREE, w, h, d, x, h / 2, z), (_x, y, pz) => c.map((v) => v * (0.9 + 0.1 * vnoise(y * 0.5, pz * 0.3 + x)) * (0.85 + 0.15 * smooth(0, 3, y))) as RGB));
  a.roof.push(gPaint(THREE, gBox(THREE, w + 0.2, 0.4, d + 0.2, x, h + 0.2, z), [0.55, 0.52, 0.48]));
  a.glass.push(gPaint(THREE, gBox(THREE, w * 0.7, 2.6, 0.14, x, 1.5, z + front * d / 2), dk));
  for (let f = 1; f < floors; f++) {
    const y = f * 3.3 + 1.7;
    a.glass.push(gPaint(THREE, gBox(THREE, w * 0.55, 1.7, 0.14, x, y, z + front * d / 2), dk));
    a.trim.push(gPaint(THREE, gBox(THREE, w + 0.2, 0.18, 1.2, x, f * 3.3 + 0.55, z + front * (d / 2 + 0.6)), [0.8, 0.78, 0.72]), gPaint(THREE, gBox(THREE, w * 0.9, 0.9, 0.08, x, f * 3.3 + 1.05, z + front * (d / 2 + 1.15)), [0.2, 0.2, 0.22]));
  }
  if (rnd() < 0.5) a.red.push(gPaint(THREE, gBox(THREE, w * 0.9, 0.7, 0.12, x, h - 0.5, z + front * (d / 2 + 0.1)), hslRGB(THREE, 360 * rnd(), 0.7, 0.45)));
  if (rnd() < 0.4) a.red.push(gPaint(THREE, gBox(THREE, w * 0.95, 0.15, 1.8, x, 3.0, z + front * (d / 2 + 0.9), 0, front * 0.35), hslRGB(THREE, 360 * rnd(), 0.6, 0.5)));
}
function makeTownZone(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), a = newAcc(), rnd = rngf(71);
  g.add(terrainMesh(THREE, mk, 210, 160, 50, (x, z) => 0.0 * x * z - 0.05, {}));
  roadStrip(THREE, a, -80, 0, 80, 0, 9); roadStrip(THREE, a, -30, -60, -30, 60, 6); roadStrip(THREE, a, 35, -60, 35, 60, 6);
  a.walk.push(gPaint(THREE, gBox(THREE, 168, 0.1, 5, 0, 0.06, 7), [0.55, 0.53, 0.5]), gPaint(THREE, gBox(THREE, 168, 0.1, 5, 0, 0.06, -7), [0.55, 0.53, 0.5]));
  const pal = [48, 12, 160, 200, 330, 28, 95];
  for (const side of [-1, 1]) for (let x = -76; x < 76; x += 4.8) {
    if (Math.abs(x + 30) < 5 || Math.abs(x - 35) < 5) continue;
    shophouse(THREE, a, x + 2.4, side * 17, 4.6, 14, 2 + Math.floor(rnd() * 2.2), -side, pal[Math.floor(rnd() * pal.length)] + 8 * rnd(), rnd);
  }
  for (const side of [-1, 1]) for (let z = 14; z < 56; z += 5) for (const sx of [-30, 35]) shophouse(THREE, a, sx + side * 8.5, z * (sx === -30 ? 1 : -1) * 1, 5, 6, 1 + Math.floor(rnd() * 2), side, pal[Math.floor(rnd() * pal.length)], rnd);
  // market hall with saw-tooth roof
  a.body.push(gPaint(THREE, gBox(THREE, 30, 5, 18, 0, 2.5, 52), hslRGB(THREE, 40, 0.2, 0.7)));
  for (let i = 0; i < 5; i++) a.roof.push(gPaint(THREE, gBox(THREE, 6.2, 0.3, 19, -12 + i * 6, 6.2, 52, 0, 0.35), hslRGB(THREE, 15, 0.55, 0.35)));
  for (let i = 0; i < 10; i++) a.trim.push(gPaint(THREE, gBox(THREE, 0.5, 5, 0.5, -13.5 + i * 3, 2.5, 61.2), [0.7, 0.68, 0.62]));
  // wat / pagoda with gold stupa
  const px = -60, pz = -50;
  a.body.push(gPaint(THREE, gBox(THREE, 14, 5, 10, px, 2.5, pz), [0.85, 0.78, 0.6]));
  for (const [r, y, hh] of [[9.5, 5.4, 2.2], [7.2, 7.4, 2.0], [4.8, 9.2, 1.8]]) { const c = new THREE.ConeGeometry(r, hh, 4, 1); c.rotateY(Math.PI / 4); c.translate(px, y + hh / 2, pz); a.red.push(gPaint(THREE, c, hslRGB(THREE, 8, 0.65, 0.3))); }
  a.gold.push(gPaint(THREE, gCyl(THREE, 0.1, 0.5, 4, 8, px, 12.6, pz), hslRGB(THREE, 45, 0.9, 0.5)));
  const st = new THREE.ConeGeometry(2.4, 11, 12); st.translate(px + 15, 5.5, pz); a.gold.push(gPaint(THREE, st, hslRGB(THREE, 46, 0.85, 0.48)));
  a.walk.push(gPaint(THREE, gBox(THREE, 30, 0.1, 22, px + 7, 0.08, pz), hslRGB(THREE, 35, 0.2, 0.58)));
  for (let i = 0; i < 24; i++) { const x = (rnd() - 0.5) * 150, z = rnd() < 0.5 ? -4.4 : 4.4; if (rnd() < 0.5) parkedCar(THREE, a, x, z, 0, [rnd() * 0.9, rnd() * 0.9, rnd() * 0.9]); }
  const tr: BG[] = [], lf: BG[] = [];
  for (let i = 0; i < 70; i++) { const x = (rnd() - 0.5) * 200, z = (rnd() - 0.5) * 150; if (Math.abs(z) < 28 && Math.abs(x) < 85) continue; if (Math.abs(x + 30) < 14 || Math.abs(x - 35) < 14) continue; addTree(THREE, rnd() < 0.5 ? "palm" : "broad", x, 0, z, 0.8 + 0.6 * rnd(), rnd, tr, lf); }
  flushTrees(THREE, g, mk, tr, lf); flushAcc(THREE, g, mk, a);
  return g;
}

function stiltHouse(THREE: T3, a: Acc, x: number, z: number, ry: number, rnd: () => number): void {
  const wood = hslRGB(THREE, 26 + 8 * rnd(), 0.4, 0.22 + 0.1 * rnd()), roofC = rnd() < 0.5 ? hslRGB(THREE, 28, 0.25, 0.3) : hslRGB(THREE, 10, 0.05, 0.5);
  const rot = (px: number, pz: number): [number, number] => [x + px * Math.cos(ry) + pz * Math.sin(ry), z - px * Math.sin(ry) + pz * Math.cos(ry)];
  for (const [px, pz] of [[-2.6, -1.8], [2.6, -1.8], [-2.6, 1.8], [2.6, 1.8], [0, -1.8], [0, 1.8]]) { const [qx, qz] = rot(px, pz); a.wood.push(gPaint(THREE, gCyl(THREE, 0.14, 0.17, 2.4, 7, qx, 1.2, qz), wood)); }
  const [fx, fz] = rot(0, 0);
  a.wood.push(gPaintFn(THREE, gBox(THREE, 6.4, 0.22, 4.4, fx, 2.45, fz, ry), (px, _y, pz) => wood.map((v) => v * (0.85 + 0.3 * vnoise(px * 4, pz * 0.4))) as RGB));
  a.wood.push(gPaintFn(THREE, gBox(THREE, 5.2, 2.3, 3.6, fx, 3.7, fz, ry), (px, py, pz) => wood.map((v) => v * (0.8 + 0.4 * vnoise(py * 6, px + pz))) as RGB));
  for (const s of [-1, 1]) {
    const hip = gBox(THREE, 7.4, 0.14, 2.9, 0, 0, 0, 0, 0, s * 0.62); hip.translate(0, 5.75, s * 1.2);
    hip.applyMatrix4(new THREE.Matrix4().makeRotationY(ry)); hip.translate(fx, 0, fz);
    a.roof.push(gPaintFn(THREE, hip, (px, _y, pz) => roofC.map((v) => v * (0.85 + 0.3 * vnoise(px * 2, pz * 2))) as RGB));
  }
  const [wx, wz] = rot(0, 1.82); a.glass.push(gPaint(THREE, gBox(THREE, 0.9, 0.9, 0.06, wx, 3.8, wz, ry), [0.03, 0.03, 0.03]));
  const [lx, lz] = rot(3.7, 0); a.wood.push(gPaint(THREE, gBox(THREE, 0.7, 0.1, 2.6, lx + 0.6 * Math.cos(ry), 1.2, lz - 0.6 * Math.sin(ry), ry + Math.PI / 2, 0, 0.0), wood));
  const [bx, bz] = rot(-2.6, 2.6); a.wood.push(gPaint(THREE, gCyl(THREE, 0.35, 0.35, 0.8, 8, bx, 0.4, bz), [0.5, 0.35, 0.25]));
}
function makeRemoteZone(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), a = newAcc(), rnd = rngf(83);
  const hfn: HFn = (x, z) => 0.5 * fbm(x * 0.02, z * 0.02, 3) - 0.1 + (Math.abs(x) > 100 || Math.abs(z) > 100 ? 1.5 * smooth(100, 150, Math.max(Math.abs(x), Math.abs(z))) : 0);
  g.add(terrainMesh(THREE, mk, 230, 230, 70, hfn, { water: -5 }));
  // rice paddies: bunded plots coloured green / gold
  const px: BG[] = [];
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
    const x = i * 22, z = j * 22 - 30; if (Math.abs(x) < 26 && Math.abs(z + 30) < 26) continue; if (z > 20 && Math.abs(x) < 14) continue;
    const ripe = fbm(i * 0.9 + 7, j * 0.9, 2) > 0.5, hue = ripe ? 46 + 6 * rnd() : 98 + 14 * rnd();
    px.push(gPaintFn(THREE, gBox(THREE, 19, 0.2, 19, x, 0.45, z), (qx, _y, qz) => hslRGB(THREE, hue, 0.6, 0.3 + 0.12 * fbm(qx * 1.5, qz * 1.5, 3))));
    a.walk.push(gPaint(THREE, gBox(THREE, 21, 0.4, 21, x, 0.4, z), hslRGB(THREE, 30, 0.3, 0.28)));
  }
  addMerged(THREE, g, px, mk("#ffffff", 0.85, 0, { vertexColors: true }));
  const rd = pathC(THREE, [[-112, 0.05, 60], [-60, 0.05, 52], [-10, 0.05, 66], [45, 0.05, 56], [112, 0.05, 70]]);
  const rb = gSweep(THREE, rd, [[-3, 0], [3, 0], [3, 0.12], [-3, 0.12]], 80);
  gPaintFn(THREE, rb, (x, _y, z) => hslRGB(THREE, 24, 0.45, 0.4 + 0.1 * fbm(x * 0.5, z * 0.5, 3)));
  g.add(new THREE.Mesh(gMerge(THREE, [rb]), mk("#ffffff", 1, 0, { vertexColors: true })));
  for (let i = 0; i < 9; i++) stiltHouse(THREE, a, -68 + i * 14 + 4 * rnd(), 78 + 10 * rnd() * (i % 2 ? 1 : -0.5), (rnd() - 0.5) * 0.6, rnd);
  g.add(waterMesh(THREE, mk, 30, 20, -0.02, 62, 98, 170));
  const tr: BG[] = [], lf: BG[] = [];
  for (let i = 0; i < 90; i++) {
    const x = (rnd() - 0.5) * 220, z = (rnd() - 0.5) * 220; if (Math.abs(z - 60) < 10) continue; if (z < 40 && Math.abs(x) < 80 && Math.abs(z + 30) < 70 && rnd() < 0.8) continue;
    addTree(THREE, rnd() < 0.55 ? "palm" : rnd() < 0.5 ? "tall" : "broad", x, hfn(x, z), z, 0.9 + 0.7 * rnd(), rnd, tr, lf);
  }
  flushTrees(THREE, g, mk, tr, lf); flushAcc(THREE, g, mk, a);
  return g;
}

// ---------- phase 3: police officer + hotel room ----------
/** rounded box: smooth bevelled edges, used for cushions, mattresses, furniture */
function gRBox(THREE: T3, w: number, h: number, d: number, r: number, x: number, y: number, z: number, ry = 0): BG {
  const g = new THREE.BoxGeometry(w, h, d, 6, 6, 6), p = g.attributes.position, n = new Float32Array(p.count * 3);
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.set(p.getX(i), p.getY(i), p.getZ(i));
    const ix = Math.max(-hx, Math.min(hx, v.x)), iy = Math.max(-hy, Math.min(hy, v.y)), iz = Math.max(-hz, Math.min(hz, v.z));
    const dx = v.x - ix, dy = v.y - iy, dz = v.z - iz, l = Math.hypot(dx, dy, dz) || 1;
    p.setXYZ(i, ix + (dx / l) * r, iy + (dy / l) * r, iz + (dz / l) * r); n[i * 3] = dx / l; n[i * 3 + 1] = dy / l; n[i * 3 + 2] = dz / l;
  }
  g.setAttribute("normal", new THREE.BufferAttribute(n, 3));
  if (ry) g.rotateY(ry);
  g.translate(x, y, z);
  return g;
}
function gEll(THREE: T3, rx: number, ry: number, rz: number, x: number, y: number, z: number, seg = 14): BG {
  const g = new THREE.SphereGeometry(1, seg, Math.max(6, seg - 4)); g.scale(rx, ry, rz); g.translate(x, y, z); return g;
}
/** smooth tube with varying elliptical radius along a path (limbs, torso, neck) */
function gTube(THREE: T3, pts: P3[], rx: number[], rzK: number, seg = 14): BG {
  const curve = pathC(THREE, pts), n = pts.length * 6, ref = new THREE.Vector3(0, 0, 1), pos: number[] = [], idx: number[] = [];
  const rad = (t: number) => { const f = t * (rx.length - 1), i = Math.min(rx.length - 2, Math.floor(f)); return rx[i] + (rx[i + 1] - rx[i]) * (f - i); };
  for (let i = 0; i <= n; i++) {
    const t = i / n, P = curve.getPointAt(t), T = curve.getTangentAt(t), s = new THREE.Vector3().crossVectors(ref, T).normalize(), f = new THREE.Vector3().crossVectors(T, s), r = rad(t);
    for (let k = 0; k < seg; k++) { const a = (2 * Math.PI * k) / seg; pos.push(P.x + s.x * r * Math.cos(a) + f.x * r * rzK * Math.sin(a), P.y + s.y * r * Math.cos(a) + f.y * r * rzK * Math.sin(a), P.z + s.z * r * Math.cos(a) + f.z * r * rzK * Math.sin(a)); }
  }
  for (let i = 0; i < n; i++) for (let k = 0; k < seg; k++) { const a = i * seg + k, b = i * seg + ((k + 1) % seg), c = a + seg, d = b + seg; idx.push(a, b, c, b, d, c); }
  for (const e of [0, n]) { const ci = pos.length / 3, P = curve.getPointAt(e / n); pos.push(P.x, P.y, P.z); for (let k = 0; k < seg; k++) { const a = e * seg + k, b = e * seg + ((k + 1) % seg); if (e === 0) idx.push(ci, b, a); else idx.push(ci, a, b); } }
  let vol = 0;
  for (let i = 0; i < idx.length; i += 3) { const A = idx[i] * 3, B = idx[i + 1] * 3, C = idx[i + 2] * 3; vol += pos[A] * (pos[B + 1] * pos[C + 2] - pos[B + 2] * pos[C + 1]) - pos[A + 1] * (pos[B] * pos[C + 2] - pos[B + 2] * pos[C]) + pos[A + 2] * (pos[B] * pos[C + 1] - pos[B + 1] * pos[C]); }
  if (vol < 0) for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function makePolice(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), cloth: BG[] = [], skin: BG[] = [], leather: BG[] = [], metal: BG[] = [], dark: BG[] = [], white: BG[] = [];
  const shirt = hslRGB(THREE, 215, 0.38, 0.2), pants = hslRGB(THREE, 220, 0.3, 0.13), sk = hslRGB(THREE, 28, 0.42, 0.5), black: RGB = [0.012, 0.012, 0.014], gold = hslRGB(THREE, 44, 0.85, 0.5);
  const C = (b: BG, c: RGB) => cloth.push(gPaint(THREE, b, c));
  // legs (trousers) + boots
  for (const s of [-1, 1]) {
    C(gTube(THREE, [[s * 0.095, 0.9, 0], [s * 0.1, 0.49, 0.01], [s * 0.1, 0.12, 0]], [0.092, 0.07, 0.058], 1.0, 14), pants);
    leather.push(gPaint(THREE, gTube(THREE, [[s * 0.1, 0.16, -0.01], [s * 0.1, 0.07, 0.07], [s * 0.1, 0.045, 0.19]], [0.056, 0.052, 0.04], 1.0, 12), black));
    leather.push(gPaint(THREE, gBox(THREE, 0.1, 0.03, 0.1, s * 0.1, 0.015, -0.01), black));
  }
  C(gEll(THREE, 0.165, 0.12, 0.105, 0, 0.93, 0), pants);
  // torso (shirt) + neck + collar
  C(gTube(THREE, [[0, 0.9, 0], [0, 1.0, 0], [0, 1.2, 0], [0, 1.38, 0], [0, 1.47, 0]], [0.15, 0.142, 0.17, 0.2, 0.12], 0.6, 18), shirt);
  skin.push(gPaint(THREE, gTube(THREE, [[0, 1.46, 0], [0, 1.52, 0.005], [0, 1.58, 0.012]], [0.052, 0.047, 0.045], 1.0, 12), sk));
  C(gTube(THREE, [[0, 1.46, 0], [0, 1.5, 0], [0, 1.52, 0]], [0.075, 0.068, 0.062], 0.95, 12), shirt);
  // arms: sleeves + cuffs + hands
  const arm = (s: number, el: P3, wr: P3) => {
    C(gTube(THREE, [[s * 0.205, 1.42, 0], el, wr], [0.056, 0.046, 0.036], 1.0, 12), shirt);
    C(gEll(THREE, 0.06, 0.06, 0.06, s * 0.205, 1.41, 0), shirt);
    skin.push(gPaint(THREE, gEll(THREE, 0.034, 0.06, 0.024, wr[0], wr[1] - 0.06, wr[2] + 0.01, 10), sk));
    skin.push(gPaint(THREE, gEll(THREE, 0.014, 0.03, 0.012, wr[0] + s * 0.02, wr[1] - 0.06, wr[2] + 0.03, 8), sk));
  };
  arm(-1, [-0.25, 1.15, 0.0], [-0.26, 0.92, 0.04]);
  arm(1, [0.3, 1.16, -0.02], [0.2, 1.0, 0.07]);
  // head
  skin.push(gPaint(THREE, gEll(THREE, 0.093, 0.117, 0.1, 0, 1.675, 0.004, 18), sk));
  skin.push(gPaint(THREE, gEll(THREE, 0.082, 0.07, 0.085, 0, 1.62, 0.014, 14), sk));
  skin.push(gPaint(THREE, gEll(THREE, 0.012, 0.026, 0.02, 0, 1.652, 0.098, 8), hslRGB(THREE, 26, 0.42, 0.46)));
  for (const s of [-1, 1]) {
    skin.push(gPaint(THREE, gEll(THREE, 0.012, 0.028, 0.02, s * 0.094, 1.67, -0.004, 8), hslRGB(THREE, 26, 0.42, 0.44)));
    white.push(gPaint(THREE, gEll(THREE, 0.015, 0.0095, 0.006, s * 0.037, 1.69, 0.09, 8), [0.85, 0.84, 0.82]));
    dark.push(gPaint(THREE, gEll(THREE, 0.0075, 0.0075, 0.005, s * 0.037, 1.69, 0.095, 8), [0.03, 0.02, 0.02]));
    dark.push(gPaint(THREE, gBox(THREE, 0.034, 0.006, 0.006, s * 0.037, 1.713, 0.092), [0.03, 0.02, 0.02]));
  }
  dark.push(gPaint(THREE, gBox(THREE, 0.042, 0.0045, 0.006, 0, 1.613, 0.092), hslRGB(THREE, 8, 0.4, 0.28)));
  const hair = new THREE.SphereGeometry(1, 16, 10, Math.PI / 2 + 0.75, Math.PI * 2 - 1.5, 0, Math.PI * 0.62); hair.scale(0.098, 0.12, 0.105); hair.translate(0, 1.68, 0);
  dark.push(gPaint(THREE, hair, [0.01, 0.01, 0.012]));
  // peaked cap
  leather.push(gPaint(THREE, gCyl(THREE, 0.109, 0.109, 0.04, 22, 0, 1.742, 0.0), black));
  C(gCyl(THREE, 0.126, 0.11, 0.05, 22, 0, 1.787, 0.0), shirt); C(gCyl(THREE, 0.126, 0.126, 0.006, 22, 0, 1.813, 0.0), shirt);
  const vis = new THREE.CylinderGeometry(0.112, 0.112, 0.006, 20, 1, false, -Math.PI / 2, Math.PI); vis.scale(1, 1, 1.35); vis.rotateX(-0.12); vis.translate(0, 1.728, 0.02); leather.push(gPaint(THREE, vis, black));
  metal.push(gPaint(THREE, gEll(THREE, 0.022, 0.026, 0.006, 0, 1.775, 0.116, 10), gold));
  // belt, holster, radio, baton, badge, name tag, pockets
  const belt = new THREE.TorusGeometry(0.153, 0.016, 8, 28); belt.rotateX(Math.PI / 2); belt.scale(1, 1, 0.64); belt.translate(0, 0.99, 0); leather.push(gPaint(THREE, belt, black));
  metal.push(gPaint(THREE, gBox(THREE, 0.04, 0.04, 0.012, 0, 0.99, 0.1), gold));
  leather.push(gPaint(THREE, gBox(THREE, 0.05, 0.16, 0.085, 0.165, 0.94, 0.01, 0, 0.08), black), gPaint(THREE, gBox(THREE, 0.03, 0.07, 0.05, 0.165, 1.04, 0.02), [0.05, 0.05, 0.06]));
  leather.push(gPaint(THREE, gBox(THREE, 0.05, 0.09, 0.03, -0.1, 1.38, 0.115), black), gPaint(THREE, gCyl(THREE, 0.004, 0.004, 0.14, 5, -0.085, 1.49, 0.115), black));
  leather.push(gPaint(THREE, gCyl(THREE, 0.013, 0.013, 0.34, 8, -0.16, 0.88, 0.04, 0, 0, 0.1), [0.03, 0.03, 0.035]));
  metal.push(gPaint(THREE, gEll(THREE, 0.022, 0.028, 0.006, -0.07, 1.31, 0.098, 10), gold));
  metal.push(gPaint(THREE, gBox(THREE, 0.05, 0.014, 0.004, 0.07, 1.31, 0.1), [0.8, 0.8, 0.78]));
  for (const s of [-1, 1]) { cloth.push(gPaint(THREE, gBox(THREE, 0.052, 0.05, 0.012, s * 0.075, 1.2, 0.1), [shirt[0] * 1.2, shirt[1] * 1.2, shirt[2] * 1.2])); metal.push(gPaint(THREE, gBox(THREE, 0.05, 0.012, 0.03, s * 0.14, 1.475, 0.0), gold)); }
  addMerged(THREE, g, cloth, mk("#ffffff", 0.9, 0, { vertexColors: true })); addMerged(THREE, g, skin, mk("#ffffff", 0.55, 0, { vertexColors: true }));
  addMerged(THREE, g, leather, mk("#ffffff", 0.3, 0.15, { vertexColors: true })); addMerged(THREE, g, metal, mk("#ffffff", 0.28, 0.9, { vertexColors: true }));
  addMerged(THREE, g, dark, mk("#ffffff", 0.7, 0, { vertexColors: true })); addMerged(THREE, g, white, mk("#ffffff", 0.3, 0, { vertexColors: true }));
  return g;
}

function makeHotelRoom(THREE: T3, mk: Mk): Grp {
  const g = new THREE.Group(), W = 5.4, D = 4.6, H = 2.8, wood: BG[] = [], soft: BG[] = [], wall: BG[] = [], dark: BG[] = [], metal: BG[] = [], lampS: BG[] = [], rnd = rngf(97);
  const cream = hslRGB(THREE, 38, 0.25, 0.78), teal = hslRGB(THREE, 188, 0.38, 0.26), gold = hslRGB(THREE, 40, 0.55, 0.45), oak = hslRGB(THREE, 28, 0.45, 0.28);
  for (let i = 0; i < Math.floor(D / 0.14); i++) for (const [x0, len] of [[-W / 2 + 1.7, 3.4], [W / 2 - 1.0, 2.0]]) {
    const c = hslRGB(THREE, 27 + 4 * rnd(), 0.42, 0.3 + 0.08 * rnd());
    wood.push(gPaint(THREE, gBox(THREE, len - 0.01, 0.05, 0.135, x0 - (x0 < 0 ? 0 : 0), 0.025, -D / 2 + 0.07 + i * 0.14), c));
  }
  wood.push(gPaint(THREE, gBox(THREE, 0.7, 0.05, D, -W / 2 + 0.35, 0.025, 0), hslRGB(THREE, 27, 0.42, 0.33)));
  const wl = (b: BG) => wall.push(gPaintFn(THREE, b, (x, y, z) => cream.map((v) => v * (0.93 + 0.07 * fbm(x * 0.8 + z, y * 0.8, 3))) as RGB));
  wl(gBox(THREE, W, H, 0.12, 0, H / 2, -D / 2 - 0.06)); wl(gBox(THREE, 0.12, H, D, -W / 2 - 0.06, H / 2, 0)); wl(gBox(THREE, 0.12, 1.0, D, W / 2 + 0.06, 0.5, 0));
  for (const [w, h, d, x, z] of [[W, 0.12, 0.03, 0, -D / 2 + 0.015], [0.03, 0.12, D, -W / 2 + 0.015, 0], [0.03, 0.12, D, W / 2 - 0.015, 0]]) wood.push(gPaint(THREE, gBox(THREE, w, h, d, x, 0.11, z), oak));
  // bed
  const bx = 0, bz = -D / 2 + 1.15;
  wood.push(gPaint(THREE, gRBox(THREE, 2.04, 0.3, 2.12, 0.04, bx, 0.2, bz), oak));
  soft.push(gPaint(THREE, gRBox(THREE, 1.94, 0.26, 2.0, 0.1, bx, 0.48, bz + 0.02), [0.93, 0.92, 0.9]));
  soft.push(gPaint(THREE, gRBox(THREE, 1.97, 0.1, 1.5, 0.05, bx, 0.64, bz + 0.3), hslRGB(THREE, 40, 0.15, 0.86)));
  soft.push(gPaint(THREE, gRBox(THREE, 1.98, 0.12, 0.5, 0.05, bx, 0.66, bz + 0.72), gold));
  for (const s of [-1, 1]) for (const k of [0, 1]) soft.push(gPaint(THREE, gRBox(THREE, 0.66, 0.17, 0.42, 0.07, bx + s * 0.5, 0.7 + 0.08 * k, bz - 0.76 + 0.13 * k, s * 0.04), k ? gold : [0.95, 0.95, 0.94]));
  soft.push(gPaint(THREE, gRBox(THREE, 2.4, 1.15, 0.14, 0.05, bx, 0.8, -D / 2 + 0.07), teal));
  for (let i = -3; i <= 3; i++) soft.push(gPaint(THREE, gRBox(THREE, 0.28, 0.9, 0.04, 0.02, bx + i * 0.32, 0.86, -D / 2 + 0.16), [teal[0] * 1.25, teal[1] * 1.25, teal[2] * 1.25]));
  for (const s of [-1, 1]) {
    const x = bx + s * 1.5; wood.push(gPaint(THREE, gRBox(THREE, 0.5, 0.5, 0.42, 0.03, x, 0.3, -D / 2 + 0.3), oak), gPaint(THREE, gBox(THREE, 0.42, 0.006, 0.34, x, 0.46, -D / 2 + 0.3), [0.1, 0.07, 0.05]));
    metal.push(gPaint(THREE, gCyl(THREE, 0.06, 0.07, 0.03, 12, x, 0.57, -D / 2 + 0.3), gold), gPaint(THREE, gCyl(THREE, 0.012, 0.012, 0.22, 6, x, 0.68, -D / 2 + 0.3), gold));
    const sh = new THREE.CylinderGeometry(0.12, 0.17, 0.2, 18, 1, true); sh.translate(x, 0.88, -D / 2 + 0.3); lampS.push(gPaint(THREE, sh, [1, 0.82, 0.5]));
    metal.push(gPaint(THREE, gBox(THREE, 0.3, 0.2, 0.012, x, 1.55, -D / 2 + 0.01), gold));
  }
  // rug, desk, chair, tv, armchair, wardrobe
  soft.push(gPaint(THREE, gRBox(THREE, 3.0, 0.02, 2.3, 0.01, bx, 0.06, bz + 1.5), hslRGB(THREE, 20, 0.3, 0.3)), gPaint(THREE, gRBox(THREE, 2.7, 0.025, 2.0, 0.01, bx, 0.07, bz + 1.5), hslRGB(THREE, 38, 0.3, 0.55)));
  const dx = W / 2 - 0.35, dz = -0.2;
  wood.push(gPaint(THREE, gRBox(THREE, 0.62, 0.05, 1.5, 0.02, dx, 0.76, dz), oak));
  for (const [ox, oz] of [[-0.26, -0.68], [0.26, -0.68], [-0.26, 0.68], [0.26, 0.68]]) metal.push(gPaint(THREE, gCyl(THREE, 0.02, 0.02, 0.74, 6, dx + ox, 0.37, dz + oz), [0.12, 0.12, 0.13]));
  dark.push(gPaint(THREE, gBox(THREE, 0.05, 0.56, 1.0, dx + 0.12, 1.07, dz), [0.015, 0.016, 0.02]), gPaint(THREE, gBox(THREE, 0.2, 0.03, 0.4, dx + 0.12, 0.81, dz), [0.1, 0.1, 0.11]));
  soft.push(gPaint(THREE, gRBox(THREE, 0.5, 0.12, 0.5, 0.04, dx - 0.55, 0.46, dz), teal), gPaint(THREE, gRBox(THREE, 0.1, 0.5, 0.5, 0.04, dx - 0.77, 0.74, dz), teal));
  soft.push(gPaint(THREE, gRBox(THREE, 0.8, 0.22, 0.8, 0.07, -W / 2 + 0.7, 0.34, D / 2 - 0.7, 0.5), teal), gPaint(THREE, gRBox(THREE, 0.8, 0.5, 0.18, 0.07, -W / 2 + 0.5, 0.66, D / 2 - 0.95, 0.5), teal));
  wood.push(gPaint(THREE, gBox(THREE, 0.5, 1.9, 1.1, W / 2 - 0.3, 0.97, D / 2 - 0.75), oak), gPaint(THREE, gBox(THREE, 0.02, 1.8, 0.02, W / 2 - 0.045, 0.97, D / 2 - 0.75), [0.08, 0.05, 0.03]));
  // window with city glow + curtains
  const gl = new THREE.BoxGeometry(0.03, 1.35, 1.9); gl.translate(-W / 2 + 0.02, 1.5, -0.2);
  gPaintFn(THREE, gl, (_x, y) => { const t = clamp01((y - 0.8) / 1.4); return hslRGB(THREE, 215 - 30 * (1 - t), 0.6 - 0.2 * t, 0.35 + 0.3 * (1 - t)); });
  const wg = new THREE.Mesh(gl, new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true })); g.add(wg);
  dark.push(gPaint(THREE, gBox(THREE, 0.06, 0.06, 2.0, -W / 2 + 0.03, 2.2, -0.2), [0.06, 0.06, 0.07]), gPaint(THREE, gBox(THREE, 0.06, 0.06, 2.0, -W / 2 + 0.03, 0.82, -0.2), [0.06, 0.06, 0.07]), gPaint(THREE, gBox(THREE, 0.06, 1.4, 0.05, -W / 2 + 0.03, 1.5, -0.2), [0.06, 0.06, 0.07]));
  for (const s of [-1, 1]) for (let f = 0; f < 5; f++) soft.push(gPaint(THREE, gRBox(THREE, 0.12, 2.4, 0.2, 0.05, -W / 2 + 0.14, 1.4, -0.2 + s * (0.95 + 0.0) - s * (0.06 + f * 0.2) * 1.0), hslRGB(THREE, 188, 0.3, 0.2 + 0.05 * (f % 2))));
  const fl = new THREE.CylinderGeometry(0.01, 0.01, 1.5, 6); fl.translate(-W / 2 + 0.45, 0.78, -D / 2 + 0.5); metal.push(gPaint(THREE, fl, [0.1, 0.1, 0.1]));
  const fs = new THREE.CylinderGeometry(0.16, 0.22, 0.3, 18, 1, true); fs.translate(-W / 2 + 0.45, 1.6, -D / 2 + 0.5); lampS.push(gPaint(THREE, fs, [1, 0.85, 0.55]));
  addMerged(THREE, g, wood, mk("#ffffff", 0.55, 0.05, { vertexColors: true })); addMerged(THREE, g, soft, mk("#ffffff", 0.92, 0, { vertexColors: true }));
  addMerged(THREE, g, wall, mk("#ffffff", 0.95, 0, { vertexColors: true })); addMerged(THREE, g, dark, mk("#ffffff", 0.25, 0.3, { vertexColors: true }));
  addMerged(THREE, g, metal, mk("#ffffff", 0.3, 0.85, { vertexColors: true }));
  g.add(new THREE.Mesh(gMerge(THREE, lampS), mk("#ffffff", 0.8, 0, { vertexColors: true, emissive: "#ffcf80", emissiveIntensity: 0.9, side: THREE.DoubleSide })));
  return g;
}

// ---------- detailed public buildings (v2): hotel, shopping mall, hospital, police station ----------
function facade(THREE: T3, a: Acc, cx: number, cz: number, w: number, d: number, y0: number, floors: number, fh: number, bay: number, lit: number, bal: boolean, rnd: () => number): void {
  const gl = hslRGB(THREE, 205, 0.42, 0.33), warm = hslRGB(THREE, 42, 0.85, 0.7), fin: RGB = [0.84, 0.82, 0.78];
  for (let face = 0; face < 4; face++) {
    const fz = face < 2, along = fz ? w : d, nb = Math.max(1, Math.round(along / bay)), bw = along / nb, sg = face % 2 ? -1 : 1;
    for (let f = 0; f < floors; f++) for (let i = 0; i < nb; i++) {
      const o = -along / 2 + (i + 0.5) * bw, on = rnd() < lit, px = fz ? cx + o : cx + sg * (w / 2), pz = fz ? cz + sg * (d / 2) : cz + o;
      (on ? a.lit : a.glass).push(gPaint(THREE, gBox(THREE, fz ? bw - 0.6 : 0.14, fh * 0.56, fz ? 0.14 : bw - 0.6, px, y0 + f * fh + fh * 0.55, pz), on ? warm : gl));
    }
    for (let i = 0; i <= nb; i++) {
      const o = -along / 2 + i * bw, px = fz ? cx + o : cx + sg * (w / 2), pz = fz ? cz + sg * (d / 2) : cz + o;
      a.trim.push(gPaint(THREE, gBox(THREE, fz ? 0.4 : 0.6, floors * fh, fz ? 0.6 : 0.4, px, y0 + (floors * fh) / 2, pz), fin));
    }
    for (let f = 0; f <= floors; f++) a.trim.push(gPaint(THREE, gBox(THREE, fz ? w + 0.2 : 0.5, 0.2, fz ? 0.5 : d + 0.2, fz ? cx : cx + sg * (w / 2), y0 + f * fh, fz ? cz + sg * (d / 2) : cz), fin));
    if (bal && face === 0) for (let f = 1; f < floors; f++) {
      a.trim.push(gPaint(THREE, gBox(THREE, w, 0.2, 1.4, cx, y0 + f * fh, cz + d / 2 + 0.7), [0.8, 0.78, 0.74]));
      a.glass.push(gPaint(THREE, gBox(THREE, w, 0.9, 0.05, cx, y0 + f * fh + 0.55, cz + d / 2 + 1.35), [0.35, 0.5, 0.58]));
    }
  }
}
function lampPost(THREE: T3, a: Acc, x: number, z: number, h = 7): void {
  a.trim.push(gPaint(THREE, gCyl(THREE, 0.08, 0.12, h, 6, x, h / 2, z), [0.3, 0.32, 0.34]));
  a.lit.push(gPaint(THREE, gBox(THREE, 0.9, 0.14, 0.4, x, h + 0.1, z), hslRGB(THREE, 45, 0.7, 0.8)));
}
function flagPole(THREE: T3, a: Acc, x: number, z: number, h: number, c: RGB): void {
  a.trim.push(gPaint(THREE, gCyl(THREE, 0.06, 0.09, h, 6, x, h / 2, z), [0.75, 0.75, 0.77]));
  a.red.push(gPaint(THREE, gBox(THREE, 1.9, 1.2, 0.05, x + 1.0, h - 0.8, z), c));
}
function pad(THREE: T3, a: Acc, w: number, d: number, lawn: boolean): void {
  a.walk.push(gPaintFn(THREE, gBox(THREE, w, 0.12, d, 0, 0.0, 0), (px, _y, pz) => lawn ? hslRGB(THREE, 98 + 10 * fbm(px * 0.08, pz * 0.08), 0.42, 0.27 + 0.08 * fbm(px, pz, 2)) : hslRGB(THREE, 40, 0.04, 0.5)));
}
function parkRow(THREE: T3, a: Acc, x0: number, z: number, n: number, rnd: () => number, lines = true): void {
  a.road.push(gPaint(THREE, gBox(THREE, n * 3.2 + 2, 0.14, 7, x0 + (n * 3.2) / 2, 0.07, z), hslRGB(THREE, 220, 0.04, 0.2)));
  for (let i = 0; i < n; i++) {
    if (lines) a.trim.push(gPaint(THREE, gBox(THREE, 0.12, 0.03, 4.6, x0 + i * 3.2 - 1.6 + 1.6 - 1.6, 0.16, z), [0.85, 0.84, 0.76]));
    if (rnd() < 0.7) parkedCar(THREE, a, x0 + i * 3.2, z, Math.PI / 2, [0.1 + 0.8 * rnd(), 0.1 + 0.8 * rnd(), 0.1 + 0.8 * rnd()]);
  }
}
function trees(THREE: T3, g: Grp, mk: Mk, rnd: () => number, pts: [number, number][], kind: TreeKind = "broad", s = 0.6): void {
  const tr: BG[] = [], lf: BG[] = [];
  for (const [x, z] of pts) addTree(THREE, kind, x, 0.05, z, s * (0.8 + 0.5 * rnd()), rnd, tr, lf);
  flushTrees(THREE, g, mk, tr, lf);
}
function bHotel(THREE: T3, g: Grp, mk: Mk, a: Acc, rnd: () => number): void {
  pad(THREE, a, 90, 80, true);
  a.road.push(gPaint(THREE, gBox(THREE, 90, 0.14, 9, 0, 0.07, 30), hslRGB(THREE, 220, 0.04, 0.18)));
  const ring = new THREE.TorusGeometry(10, 3.2, 3, 32); ring.rotateX(Math.PI / 2); ring.scale(1.3, 1, 1); ring.translate(0, 0.08, 12); a.road.push(gPaint(THREE, ring, hslRGB(THREE, 220, 0.04, 0.2)));
  a.body.push(gPaintFn(THREE, gBox(THREE, 44, 9, 22, 0, 4.5, 6), (px, py, pz) => hslRGB(THREE, 36, 0.12, 0.7 + 0.05 * fbm(px * 0.2 + pz, py * 0.2, 2))));
  a.glass.push(gPaint(THREE, gBox(THREE, 36, 5.2, 0.16, 0, 3.2, 17.05), [0.06, 0.1, 0.14]));
  for (let i = -6; i <= 6; i++) a.trim.push(gPaint(THREE, gBox(THREE, 0.35, 5.4, 0.4, i * 3, 3.2, 17.1), [0.85, 0.82, 0.78]));
  a.lit.push(gPaint(THREE, gBox(THREE, 36, 0.8, 0.2, 0, 7.4, 17.2), hslRGB(THREE, 42, 0.9, 0.55)));
  a.roof.push(gPaint(THREE, gBox(THREE, 45, 0.6, 23, 0, 9.3, 6), [0.45, 0.45, 0.47]));
  a.trim.push(gPaint(THREE, gBox(THREE, 16, 0.7, 9, 0, 6.6, 23), [0.88, 0.85, 0.78]));
  for (const s of [-1, 1]) for (const dz of [19, 26.5]) a.trim.push(gPaint(THREE, gCyl(THREE, 0.45, 0.5, 6.3, 12, s * 7, 3.15, dz), [0.9, 0.88, 0.84]));
  a.body.push(gPaintFn(THREE, gBox(THREE, 28, 56, 18, 0, 37, -6), (px, py, pz) => hslRGB(THREE, 34, 0.1, 0.78 + 0.05 * fbm(px * 0.1 + pz, py * 0.1, 2))));
  facade(THREE, a, 0, -6, 28, 18, 9.5, 15, 3.2, 3.5, 0.22, true, rnd);
  a.roof.push(gPaint(THREE, gBox(THREE, 29, 1.2, 19, 0, 65.6, -6), [0.3, 0.3, 0.32]), gPaint(THREE, gBox(THREE, 8, 3, 6, 6, 67.4, -8), [0.5, 0.5, 0.53]));
  a.lit.push(gPaint(THREE, gBox(THREE, 20, 2.2, 0.3, 0, 63.5, 3.2), hslRGB(THREE, 42, 0.95, 0.6)));
  a.trim.push(gPaint(THREE, gCyl(THREE, 0.15, 0.25, 12, 6, -10, 72, -8), [0.8, 0.2, 0.2]));
  for (const [x, z] of [[-34, 28], [34, 28], [-34, 10], [34, 10]]) lampPost(THREE, a, x, z, 6);
  for (const x of [-18, -15, 15, 18]) flagPole(THREE, a, x, 24, 11, hslRGB(THREE, 360 * rnd(), 0.6, 0.45));
  parkedCar(THREE, a, -5, 29, 0, [0.9, 0.75, 0.1]); parkedCar(THREE, a, 6, 31, 0, [0.9, 0.9, 0.92]);
  trees(THREE, g, mk, rnd, [[-36, 18], [-36, 24], [36, 18], [36, 24], [-28, -30], [28, -30], [-38, -12], [38, -12]], "palm", 0.9);
  trees(THREE, g, mk, rnd, [[-24, 22], [24, 22], [-20, -28], [20, -28]], "broad", 0.7);
}
function bMall(THREE: T3, g: Grp, mk: Mk, a: Acc, rnd: () => number): void {
  pad(THREE, a, 150, 120, false);
  a.walk.push(gPaint(THREE, gBox(THREE, 150, 0.14, 120, 0, 0.0, 0), hslRGB(THREE, 40, 0.03, 0.34)));
  a.body.push(gPaintFn(THREE, gBox(THREE, 70, 16, 36, 0, 8, -10), (px, py, pz) => hslRGB(THREE, 30, 0.14, 0.74 + 0.05 * fbm(px * 0.2 + pz, py * 0.3, 2))));
  a.glass.push(gPaint(THREE, gBox(THREE, 64, 6.4, 0.18, 0, 3.6, 8.1), [0.06, 0.11, 0.16]));
  for (let i = -10; i <= 10; i++) a.trim.push(gPaint(THREE, gBox(THREE, 0.3, 6.6, 0.4, i * 3.2, 3.6, 8.15), [0.82, 0.8, 0.76]));
  a.glass.push(gPaint(THREE, gBox(THREE, 64, 3.2, 0.16, 0, 11.4, 8.1), [0.1, 0.18, 0.24]));
  for (let i = -10; i <= 10; i++) a.trim.push(gPaint(THREE, gBox(THREE, 0.25, 3.4, 0.35, i * 3.2, 11.4, 8.12), [0.82, 0.8, 0.76]));
  a.roof.push(gPaint(THREE, gBox(THREE, 71, 0.7, 37, 0, 16.3, -10), [0.3, 0.3, 0.32]));
  const vault = new THREE.CylinderGeometry(9, 9, 22, 20, 1, true, -Math.PI / 2, Math.PI); vault.rotateX(Math.PI / 2); vault.scale(1, 0.62, 1); vault.translate(0, 16.4, 4); a.glass.push(gPaint(THREE, vault, [0.15, 0.28, 0.36]));
  for (let k = -4; k <= 4; k++) { const rib = new THREE.TorusGeometry(9, 0.18, 4, 20, Math.PI); rib.scale(1, 0.62, 1); rib.translate(0, 16.4, 4 + k * 2.6); a.trim.push(gPaint(THREE, rib, [0.8, 0.8, 0.8])); }
  a.trim.push(gPaint(THREE, gBox(THREE, 30, 0.6, 8, 0, 7.8, 12), [0.86, 0.84, 0.8]));
  for (let i = -4; i <= 4; i++) a.trim.push(gPaint(THREE, gCyl(THREE, 0.4, 0.4, 7.6, 10, i * 3.6, 3.8, 15.5), [0.88, 0.86, 0.82]));
  for (const [x, c] of [[-26, 355], [26, 215]] as [number, number][]) { a.lit.push(gPaint(THREE, gBox(THREE, 14, 3.4, 0.4, x, 14.2, 8.3), hslRGB(THREE, c, 0.75, 0.5))); a.red.push(gPaint(THREE, gBox(THREE, 14, 1.2, 1.2, x, 8.6, 8.8), hslRGB(THREE, c, 0.6, 0.36))); }
  a.lit.push(gPaint(THREE, gBox(THREE, 16, 4.2, 0.5, 0, 18.4, 8.6), hslRGB(THREE, 40, 0.9, 0.55)));
  for (let i = 0; i < 5; i++) a.roof.push(gPaint(THREE, gBox(THREE, 4, 1.8, 3, -26 + i * 12, 17.6, -18), [0.5, 0.5, 0.53]));
  for (let r = 0; r < 3; r++) parkRow(THREE, a, -44, 30 + r * 10.5, 28, rnd);
  for (let x = -60; x <= 60; x += 24) for (const z of [24, 56]) lampPost(THREE, a, x, z, 9);
  trees(THREE, g, mk, rnd, [[-70, 10], [70, 10], [-70, -30], [70, -30], [-50, -40], [50, -40], [0, -42]], "broad", 0.8);
  trees(THREE, g, mk, rnd, [[-70, 22], [70, 22], [-70, 0], [70, 0]], "palm", 0.9);
}
function bHospital(THREE: T3, g: Grp, mk: Mk, a: Acc, rnd: () => number): void {
  pad(THREE, a, 110, 90, true);
  a.road.push(gPaint(THREE, gBox(THREE, 110, 0.14, 8, 0, 0.07, 34), hslRGB(THREE, 220, 0.04, 0.18)));
  const wh = hslRGB(THREE, 40, 0.05, 0.88);
  a.body.push(gPaintFn(THREE, gBox(THREE, 44, 19, 18, 0, 9.5, -4), (px, py, pz) => wh.map((v) => v * (0.95 + 0.05 * fbm(px * 0.2 + pz, py * 0.2, 2))) as RGB));
  a.body.push(gPaint(THREE, gBox(THREE, 16, 28, 16, -8, 14, 12), wh), gPaint(THREE, gBox(THREE, 14, 12, 14, 24, 6, 10), wh), gPaint(THREE, gBox(THREE, 14, 12, 14, -24, 6, 10), wh));
  facade(THREE, a, 0, -4, 44, 18, 0.4, 5, 3.6, 3.2, 0.08, false, rnd);
  facade(THREE, a, -8, 12, 16, 16, 0.4, 7, 3.9, 3.2, 0.1, false, rnd);
  facade(THREE, a, 24, 10, 14, 14, 0.4, 3, 3.9, 3.2, 0.05, false, rnd);
  facade(THREE, a, -24, 10, 14, 14, 0.4, 3, 3.9, 3.2, 0.05, false, rnd);
  for (let f = 1; f < 7; f++) a.trim.push(gPaint(THREE, gBox(THREE, 16.6, 0.15, 1.2, -8, f * 3.9 + 0.2, 20.2), [0.7, 0.72, 0.74]));
  a.glass.push(gPaint(THREE, gBox(THREE, 10, 4.2, 0.16, -8, 2.6, 20.1), [0.05, 0.1, 0.14]));
  a.trim.push(gPaint(THREE, gBox(THREE, 14, 0.5, 8, -8, 5.2, 24), [0.9, 0.9, 0.9]), gPaint(THREE, gBox(THREE, 0.5, 5.2, 0.5, -14.5, 2.6, 27.5), [0.9, 0.9, 0.9]), gPaint(THREE, gBox(THREE, 0.5, 5.2, 0.5, -1.5, 2.6, 27.5), [0.9, 0.9, 0.9]));
  a.red.push(gPaint(THREE, gBox(THREE, 1.4, 6, 0.4, -8, 22, 20.5), [0.85, 0.05, 0.05]), gPaint(THREE, gBox(THREE, 6, 1.4, 0.4, -8, 22, 20.5), [0.85, 0.05, 0.05]));
  a.lit.push(gPaint(THREE, gBox(THREE, 7, 1.0, 0.3, 24, 9.5, 17.2), hslRGB(THREE, 0, 0.8, 0.5)));
  a.roof.push(gPaint(THREE, gBox(THREE, 17, 0.6, 17, -8, 28.3, 12), [0.5, 0.5, 0.53]));
  const hp = new THREE.CylinderGeometry(6.5, 6.5, 0.3, 28); hp.translate(-8, 28.8, 12); a.roof.push(gPaint(THREE, hp, [0.22, 0.24, 0.26]));
  for (const [dx, dz, w, d] of [[-1.6, 0, 0.8, 5], [1.6, 0, 0.8, 5], [0, 0, 3.4, 0.8]]) a.trim.push(gPaint(THREE, gBox(THREE, w, 0.05, d, -8 + dx, 29.0, 12 + dz), [0.95, 0.95, 0.95]));
  a.lit.push(gPaint(THREE, gBox(THREE, 0.3, 0.3, 0.3, -14, 29, 6), [1, 0.3, 0.2]), gPaint(THREE, gBox(THREE, 0.3, 0.3, 0.3, -2, 29, 18), [1, 0.3, 0.2]));
  a.roof.push(gPaint(THREE, gBox(THREE, 45, 0.6, 19, 0, 19.3, -4), [0.5, 0.5, 0.53]));
  for (const x of [20, 30, 40]) { a.red.push(gPaint(THREE, gBox(THREE, 6.4, 2.4, 2.6, x - 10, 1.9, 36), wh)); a.red.push(gPaint(THREE, gBox(THREE, 6.42, 0.4, 2.62, x - 10, 1.8, 36), [0.85, 0.08, 0.08])); a.lit.push(gPaint(THREE, gBox(THREE, 0.8, 0.2, 2.4, x - 10, 3.2, 36), [0.2, 0.4, 1])); a.trim.push(gPaint(THREE, gBox(THREE, 6.4, 0.5, 2.7, x - 10, 0.6, 36), [0.05, 0.05, 0.06])); }
  for (let i = 0; i < 8; i++) parkedCar(THREE, a, 12 + i * 4, 28, 0, [0.1 + 0.8 * rnd(), 0.1 + 0.8 * rnd(), 0.1 + 0.8 * rnd()]);
  for (const [x, z] of [[-30, 26], [30, 26], [-40, -20], [40, -20]]) lampPost(THREE, a, x, z, 6);
  trees(THREE, g, mk, rnd, [[-42, 30], [-36, 36], [-46, 8], [46, 8], [-40, -30], [40, -30], [0, -34], [-20, 32]], "broad", 0.8);
  trees(THREE, g, mk, rnd, [[-48, 20], [48, 20]], "palm", 0.9);
}
function bPolice(THREE: T3, g: Grp, mk: Mk, a: Acc, rnd: () => number): void {
  pad(THREE, a, 70, 60, false);
  a.walk.push(gPaint(THREE, gBox(THREE, 70, 0.14, 60, 0, 0.0, 0), hslRGB(THREE, 40, 0.03, 0.4)));
  a.body.push(gPaintFn(THREE, gBox(THREE, 30, 11, 16, 0, 5.5, -4), (px, py, pz) => hslRGB(THREE, 215, 0.32, 0.4 + 0.05 * fbm(px * 0.3 + pz, py * 0.3, 2))));
  a.body.push(gPaint(THREE, gBox(THREE, 8, 14, 12, -11, 7, 2), hslRGB(THREE, 215, 0.3, 0.34)));
  facade(THREE, a, 0, -4, 30, 16, 0.6, 3, 3.5, 3.4, 0.1, false, rnd);
  a.trim.push(gPaint(THREE, gBox(THREE, 31, 0.6, 17, 0, 11.3, -4), [0.88, 0.88, 0.9]), gPaint(THREE, gBox(THREE, 12, 0.5, 6, 4, 4.4, 8.5), [0.9, 0.9, 0.92]));
  for (const x of [-1, 3, 7, 9]) a.trim.push(gPaint(THREE, gCyl(THREE, 0.35, 0.38, 4.2, 10, x + 0.0, 2.2, 11), [0.9, 0.9, 0.92]));
  a.glass.push(gPaint(THREE, gBox(THREE, 10, 3.2, 0.14, 4, 2, 4.1), [0.05, 0.09, 0.13]));
  a.lit.push(gPaint(THREE, gBox(THREE, 10, 1.1, 0.3, 4, 9.6, 4.3), hslRGB(THREE, 215, 0.9, 0.55)));
  a.red.push(gPaint(THREE, gBox(THREE, 2.2, 2.2, 0.3, -11, 10, 8.3), [0.9, 0.9, 0.95]));
  a.trim.push(gPaint(THREE, gCyl(THREE, 0.15, 0.25, 16, 6, -14, 8, -8), [0.75, 0.75, 0.78]), gPaint(THREE, gBox(THREE, 2, 0.3, 0.3, -14, 15.6, -8), [0.75, 0.75, 0.78]));
  flagPole(THREE, a, 16, 12, 10, hslRGB(THREE, 0, 0.7, 0.45)); flagPole(THREE, a, 20, 12, 10, hslRGB(THREE, 215, 0.7, 0.4));
  for (let i = 0; i < 4; i++) { const x = -22 + i * 4.8; parkedCar(THREE, a, x, 20, Math.PI / 2, [0.92, 0.93, 0.95]); a.lit.push(gPaint(THREE, gBox(THREE, 1.0, 0.2, 0.4, x, 1.95, 20), i % 2 ? [0.1, 0.2, 1] : [1, 0.1, 0.1])); a.red.push(gPaint(THREE, gBox(THREE, 4.22, 0.3, 1.82, x, 0.9, 20), [0.1, 0.2, 0.8])); }
  for (let z = 14; z <= 30; z += 4) a.red.push(gPaint(THREE, gBox(THREE, 0.5, 1.0, 0.5, 30, 0.6, z), [0.95, 0.5, 0.1]));
  for (const [x, z] of [[-28, 16], [28, 16], [-28, -20], [28, -20]]) lampPost(THREE, a, x, z, 6);
  trees(THREE, g, mk, rnd, [[-30, -22], [30, -22], [-30, 4], [30, 4]], "broad", 0.7);
}
function makeBuilding(THREE: T3, mk: Mk, kind: "hotel" | "mall" | "hospital" | "police"): Grp {
  const g = new THREE.Group(), a = newAcc(), rnd = rngf(kind === "hotel" ? 101 : kind === "mall" ? 103 : kind === "hospital" ? 107 : 109);
  if (kind === "hotel") bHotel(THREE, g, mk, a, rnd); else if (kind === "mall") bMall(THREE, g, mk, a, rnd); else if (kind === "hospital") bHospital(THREE, g, mk, a, rnd); else bPolice(THREE, g, mk, a, rnd);
  flushAcc(THREE, g, mk, a);
  return g;
}

