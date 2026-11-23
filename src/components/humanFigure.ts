import * as THREE from "three";

// Shared human figure for every person in the scenes (workers, guards, cooks, villagers, students...).
// Tapered limbs, a real face, hands with fingers, shoes, clothes and optional hats.
// Legs and arms are pivot groups named "leg" / "arm" (userData.side = +1 / -1) so the walk updaters
// can swing them from the hip / shoulder, with opposite arm and leg moving together.

type Col = THREE.ColorRepresentation;
export type FigureDetail = "low" | "high";
let DEFAULT_DETAIL: FigureDetail = "high";
/** "low" = the same as lite: true. perf.ts picks it for phones. */
export function setFigureDetail(d: FigureDetail) { DEFAULT_DETAIL = d; }

export type HairStyle = "short" | "long" | "bun" | "bald";
export type HatStyle = "none" | "helmet" | "cap" | "chef" | "nurse";

export interface HumanOpts {
  detail?: FigureDetail;
  height?: number;        // total height in scene units (default 2.3)
  skin?: Col;
  shirt?: Col;
  pants?: Col;
  hair?: Col;
  shoe?: Col;
  female?: boolean;
  hairStyle?: HairStyle;
  hat?: HatStyle;
  hatColor?: Col;
  longSleeves?: boolean;  // default true
  coat?: boolean;         // long coat (doctor)
  skirt?: boolean;
  tie?: Col;
  lite?: boolean;         // crowd version: no fingers/eyelids/brows/ears/lips, no shadows (about 40 meshes instead of ~110)
  sitting?: boolean;      // seated pose (legs forward); leg pivots are named "sitLeg" so walkers ignore them
  seatHeight?: number;    // seat top height in scene units when sitting (default 0.45)
}

const M = 1.75;           // design height in metres

// Geometries and materials are shared between all figures (a crowd re-uses a few dozen GPU buffers
// instead of creating thousands). Meshes only differ by position / scale / material.
const geoCache = new Map<string, THREE.BufferGeometry>();
function shared<T extends THREE.BufferGeometry>(kind: string, args: unknown[], make: () => T): T {
  const key = kind + JSON.stringify(args);
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g as T;
}
const cyl = (...a: ConstructorParameters<typeof THREE.CylinderGeometry>) => shared("cyl", a, () => new THREE.CylinderGeometry(...a));
const box = (...a: ConstructorParameters<typeof THREE.BoxGeometry>) => shared("box", a, () => new THREE.BoxGeometry(...a));
const capsule = (...a: ConstructorParameters<typeof THREE.CapsuleGeometry>) => shared("cap", a, () => new THREE.CapsuleGeometry(...a));
const sph = (...a: ConstructorParameters<typeof THREE.SphereGeometry>) => shared("sph", a, () => new THREE.SphereGeometry(...a));
const matCache = new Map<string, THREE.MeshStandardMaterial>();
function sharedMat(c: THREE.ColorRepresentation, rough: number, side: THREE.Side): THREE.MeshStandardMaterial {
  const key = `${new THREE.Color(c).getHexString()}|${rough}|${side}`;
  let m = matCache.get(key);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: rough, side }); matCache.set(key, m); }
  return m;
}

export function createHumanFigure(o: HumanOpts = {}): THREE.Group {
  if (o.lite === undefined && (o.detail ?? DEFAULT_DETAIL) === "low") o = { ...o, lite: true };
  const f = !!o.female;
  const S = (o.height ?? 2.3) / M;
  const lite = !!o.lite;
  const mat = (c: Col, r: number, side: THREE.Side = THREE.FrontSide) => sharedMat(c, r, side);
  const skin = mat(o.skin ?? 0xc99672, 0.62);
  const top = mat(o.shirt ?? 0x3498db, 0.8, THREE.DoubleSide);
  const bottom = mat(o.pants ?? 0x2c3e50, 0.85, THREE.DoubleSide);
  const hairM = mat(o.hair ?? 0x15110e, 0.45);
  const dark = mat(0x0b0b0d, 0.5), white = mat(0xf6f6f4, 0.3);
  const iris = mat(f ? 0x3a2418 : 0x2e1d14, 0.3), lip = mat(f ? 0xa8504f : 0x9a5a50, 0.5);
  const shoeM = mat(o.shoe ?? 0x15171c, 0.55), soleM = mat(0x050506, 0.9);
  const longSleeves = o.longSleeves ?? true;
  const sleeve = longSleeves ? top : skin;

  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const ball = (parent: THREE.Object3D, rx: number, ry: number, rz: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = add(parent, sph(1, 20, 14), m, x, y, z);
    mesh.scale.set(rx, ry, rz);
    return mesh;
  };
  const taper = (parent: THREE.Object3D, len: number, r0: number, r1: number, m: THREE.Material) =>
    add(parent, cyl(r0, r1, len, 16, 1), m, 0, -len / 2, 0);
  const joint = (parent: THREE.Object3D, x: number, y: number, name = "") => {
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    if (name) g.name = name;
    parent.add(g);
    return g;
  };

  const chestR = f ? 0.145 : 0.168, waistR = f ? 0.118 : 0.138, hipR = f ? 0.165 : 0.15;
  const outer = new THREE.Group();
  const root = new THREE.Group();
  root.scale.setScalar(S);
  outer.add(root);
  const hipY = o.sitting ? (o.seatHeight ?? 0.45) / S + 0.1 : 0.92;
  const hips = joint(root, 0, hipY);
  const torso = joint(hips, 0, 0);

  // pelvis, waist, chest
  ball(hips, hipR, 0.11, hipR * 0.72, bottom);
  add(torso, cyl(chestR * 0.9, hipR * 0.92, 0.32, 22, 1), top, 0, 0.16, 0).scale.z = 0.72;
  ball(torso, chestR, 0.17, chestR * 0.66, top, 0, 0.4, 0);
  ball(torso, chestR * 0.85, 0.06, chestR * 0.55, top, 0, 0.5, 0);
  if (f) for (const s of [-1, 1]) ball(torso, 0.05, 0.05, 0.05, top, s * 0.058, 0.4, chestR * 0.6);
  if (!o.skirt && !lite) add(torso, cyl(hipR * 0.9, hipR * 0.9, 0.03, 22, 1, true), mat(0x1a1410, 0.5, THREE.DoubleSide), 0, 0.01, 0).scale.z = 0.74;
  if (o.skirt) add(hips, cyl(hipR * 0.95, hipR * 1.5, 0.34, 26, 1, true), bottom, 0, -0.15, 0).scale.z = 0.85;
  if (o.coat) add(hips, cyl(hipR * 1.02, hipR * 1.28, 0.5, 26, 1, true), top, 0, -0.22, 0).scale.z = 0.85;
  if (o.tie !== undefined) {
    const tie = mat(o.tie, 0.5);
    add(torso, box(0.036, 0.3, 0.012), tie, 0, 0.35, chestR * 0.66 + 0.014);
  }

  // neck + collar
  add(torso, cyl(0.047, 0.055, 0.12, 16), skin, 0, 0.59, 0);
  add(torso, cyl(0.062, 0.07, 0.035, 16, 1, true), top, 0, 0.6, 0);

  // head
  const head = joint(torso, 0, 0.72);
  ball(head, 0.095, 0.118, 0.105, skin);
  ball(head, 0.078, 0.075, 0.088, skin, 0, -0.055, 0.016);
  for (const s of [-1, 1]) {
    if (lite) { ball(head, 0.011, 0.011, 0.008, dark, s * 0.038, 0.018, 0.097); continue; }
    ball(head, 0.012, 0.026, 0.018, skin, s * 0.097, -0.005, 0);
    ball(head, 0.016, 0.0095, 0.008, white, s * 0.038, 0.018, 0.088);
    ball(head, 0.0082, 0.0082, 0.006, iris, s * 0.038, 0.018, 0.0955);
    ball(head, 0.0036, 0.0036, 0.004, dark, s * 0.038, 0.018, 0.0985);
    const brow = add(head, box(0.038, f ? 0.005 : 0.0075, 0.008), hairM, s * 0.04, 0.048, 0.094);
    brow.rotation.z = -s * 0.1;
  }
  ball(head, 0.012, 0.017, 0.015, skin, 0, -0.012, 0.104);
  if (!lite) {
    ball(head, 0.007, 0.022, 0.01, skin, 0, 0.008, 0.099);
    add(head, capsule(0.0055, 0.03, 4, 8), lip, 0, -0.05, 0.094).rotation.z = Math.PI / 2;
  }

  const style: HairStyle = o.hairStyle ?? (f ? "long" : "short");
  if (style !== "bald") {
    const cap = add(head, sph(0.113, 22, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), hairM, 0, 0.012, -0.006);
    cap.rotation.x = -0.42;
    ball(head, 0.106, 0.1, 0.1, hairM, 0, 0, -0.03);
    if (style === "long") {
      add(head, capsule(0.088, 0.22, 6, 10), hairM, 0, -0.14, -0.06);
      for (const s of [-1, 1]) add(head, capsule(0.03, 0.14, 4, 8), hairM, s * 0.09, -0.07, 0);
    }
    if (style === "bun") ball(head, 0.05, 0.05, 0.05, hairM, 0, 0.1, -0.1);
  }
  // hats
  const hatM = mat(o.hatColor ?? 0xe74c3c, 0.5, THREE.DoubleSide);
  if (o.hat === "helmet") {
    add(head, sph(0.128, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), hatM, 0, 0.03, 0);
    add(head, cyl(0.15, 0.15, 0.012, 24), hatM, 0, 0.032, 0.012);
  } else if (o.hat === "cap") {
    add(head, cyl(0.115, 0.12, 0.07, 22), hatM, 0, 0.09, 0);
    add(head, box(0.15, 0.01, 0.075), mat(0x0b0b0d, 0.4), 0, 0.07, 0.14);
  } else if (o.hat === "chef") {
    add(head, cyl(0.11, 0.1, 0.1, 22), hatM, 0, 0.12, 0);
    ball(head, 0.13, 0.08, 0.13, hatM, 0, 0.22, 0);
  } else if (o.hat === "nurse") {
    add(head, box(0.14, 0.05, 0.1), hatM, 0, 0.12, 0.01);
  }

  // arms with hands
  for (const s of [-1, 1]) {
    const arm = joint(torso, s * (chestR + 0.03), 0.5, "arm");
    arm.userData.side = -s;
    ball(arm, 0.058, 0.058, 0.058, top);
    taper(arm, 0.29, 0.05, 0.04, top);
    const elbow = joint(arm, 0, -0.29);
    if (o.sitting) { arm.rotation.x = -0.5; elbow.rotation.x = -1.0; arm.name = "sitArm"; }
    else elbow.rotation.x = -0.12;
    ball(elbow, 0.041, 0.041, 0.041, sleeve);
    taper(elbow, 0.26, 0.04, 0.03, sleeve);
    const hand = joint(elbow, 0, -0.27);
    ball(hand, 0.034, 0.045, 0.014, skin, 0, -0.03, 0);
    if (lite) ball(hand, 0.03, 0.05, 0.013, skin, 0, -0.085, 0.004);
    else {
      for (let i = 0; i < 4; i++) {
        const len = [0.05, 0.058, 0.054, 0.042][i];
        add(hand, capsule(0.0078, len, 3, 6), skin, (i - 1.5) * 0.0165, -0.075 - len / 2 + 0.01, 0.004).rotation.x = -0.18;
      }
      const thumb = add(hand, capsule(0.0095, 0.04, 3, 6), skin, -s * 0.036, -0.045, 0.012);
      thumb.rotation.z = -s * 0.45;
      thumb.rotation.x = -0.2;
    }
  }

  // legs with shoes
  for (const s of [-1, 1]) {
    const leg = joint(hips, s * (f ? 0.082 : 0.09), 0, o.sitting ? "sitLeg" : "leg");
    leg.userData.side = s;
    taper(leg, 0.44, f ? 0.088 : 0.09, 0.06, bottom);
    const knee = joint(leg, 0, -0.44);
    if (o.sitting) { leg.rotation.x = -Math.PI / 2; knee.rotation.x = Math.PI / 2; }
    ball(knee, 0.06, 0.06, 0.06, bottom);
    taper(knee, 0.43, 0.058, 0.038, bottom);
    ball(knee, 0.04, 0.04, 0.04, skin, 0, -0.43, 0);
    ball(knee, 0.047, 0.04, 0.125, shoeM, 0, -0.455, 0.04);
    if (!lite) add(knee, box(0.095, 0.012, 0.255), soleM, 0, -0.482, 0.045);
  }

  if (!lite) outer.traverse((c) => { if ((c as THREE.Mesh).isMesh) c.castShadow = true; });
  return outer;
}
