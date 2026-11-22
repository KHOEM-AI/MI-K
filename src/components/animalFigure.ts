import * as THREE from "three";

// Shared four-legged animal for the village and the forest.
// The animal faces +z (so group.rotation.y = atan2(tangent.x, tangent.z) makes it walk forward).
// Legs are pivot groups named "leg" at the hips/shoulders; userData.side is +1 / -1 so that diagonal
// legs swing together (a real walking gait). Feet are on y = 0.

type Col = THREE.ColorRepresentation;

// Shared geometry / material caches: every animal re-uses the same GPU buffers.
const geoCache = new Map<string, THREE.BufferGeometry>();
function shared<T extends THREE.BufferGeometry>(kind: string, args: unknown[], make: () => T): T {
  const key = kind + JSON.stringify(args);
  let g = geoCache.get(key);
  if (!g) { g = make(); geoCache.set(key, g); }
  return g as T;
}
const cyl = (...a: ConstructorParameters<typeof THREE.CylinderGeometry>) => shared("cyl", a, () => new THREE.CylinderGeometry(...a));
const cone = (...a: ConstructorParameters<typeof THREE.ConeGeometry>) => shared("cone", a, () => new THREE.ConeGeometry(...a));
const sph = (...a: ConstructorParameters<typeof THREE.SphereGeometry>) => shared("sph", a, () => new THREE.SphereGeometry(...a));
const box = (...a: ConstructorParameters<typeof THREE.BoxGeometry>) => shared("box", a, () => new THREE.BoxGeometry(...a));
const torus = (...a: ConstructorParameters<typeof THREE.TorusGeometry>) => shared("torus", a, () => new THREE.TorusGeometry(...a));
const matCache = new Map<string, THREE.MeshStandardMaterial>();

export interface QuadOpts {
  length: number; width: number; bodyRy: number;
  legLen: number; legR: number;
  color: Col; belly?: Col; dark?: Col; socks?: Col;
  neck?: number; headLen: number; headR: number;
  snout?: "short" | "long" | "flat" | "none"; snoutColor?: Col;
  ear?: "round" | "point" | "flop" | "big" | "none";
  horns?: "cow" | "banteng" | "rhino" | "antler" | "none"; hornColor?: Col;
  tusks?: "small" | "long" | "none";
  trunk?: boolean;
  tail?: "thin" | "tuft" | "curl" | "short" | "none";
  spots?: boolean; stripes?: boolean; quills?: boolean; hump?: boolean; paws?: boolean;
  eyeColor?: Col;
}

export function createQuadruped(o: QuadOpts): THREE.Group {
  const g = new THREE.Group();
  const mat = (c: Col, r = 0.85) => {
    const key = `${new THREE.Color(c).getHexString()}|${r}`;
    let m = matCache.get(key);
    if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0.02 }); matCache.set(key, m); }
    return m;
  };
  const body = mat(o.color), darkM = mat(o.dark ?? 0x1a1a1a), bellyM = mat(o.belly ?? o.color);
  const noseM = mat(o.snoutColor ?? 0x2b2b2b, 0.5), hornM = mat(o.hornColor ?? 0xf1ead2, 0.5);
  const eyeM = mat(o.eyeColor ?? 0x050505, 0.2), white = mat(0xf4f1e8, 0.4);
  const L = o.length, W = o.width, RY = o.bodyRy;

  const add = (parent: THREE.Object3D, geo: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  const ball = (parent: THREE.Object3D, rx: number, ry: number, rz: number, m: THREE.Material, x = 0, y = 0, z = 0) => {
    const mesh = add(parent, sph(1, 18, 12), m, x, y, z);
    mesh.scale.set(rx, ry, rz);
    return mesh;
  };
  // tapered cylinder between two points
  const link = (parent: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3, r0: number, r1: number, m: THREE.Material) => {
    const d = b.clone().sub(a);
    const len = d.length();
    const mesh = add(parent, cyl(r1, r0, len, 14, 1), m);
    mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return mesh;
  };

  const bodyY = o.legLen + RY * 0.8;

  // torso: main ellipsoid + chest + rump (+ belly, hump)
  ball(g, W / 2, RY, L / 2, body, 0, bodyY, 0);
  ball(g, W * 0.54, RY * 1.04, L * 0.27, body, 0, bodyY + RY * 0.04, L * 0.26);
  ball(g, W * 0.52, RY * 1.0, L * 0.27, body, 0, bodyY, -L * 0.27);
  if (o.belly !== undefined) ball(g, W * 0.46, RY * 0.55, L * 0.4, bellyM, 0, bodyY - RY * 0.42, 0);
  if (o.hump) ball(g, W * 0.38, RY * 0.5, L * 0.18, body, 0, bodyY + RY * 0.82, L * 0.2);

  // neck and head
  const neckUp = o.neck ?? RY * 0.3;
  const headY = bodyY + RY * 0.5 + neckUp;
  const headZ = L / 2 + o.headLen * 0.3;
  const hr = o.headR;
  link(g, new THREE.Vector3(0, bodyY + RY * 0.2, L * 0.3), new THREE.Vector3(0, headY, headZ - o.headLen * 0.2), hr * 1.25, hr * 0.85, body);
  const head = new THREE.Group();
  head.position.set(0, headY, headZ);
  g.add(head);
  ball(head, hr * 0.85, hr, o.headLen * 0.5, body);
  const snoutKind = o.snout ?? "short";
  let tipZ = o.headLen * 0.5;
  if (snoutKind === "long") {
    ball(head, hr * 0.5, hr * 0.45, o.headLen * 0.42, mat(o.snoutColor ?? o.color), 0, -hr * 0.25, o.headLen * 0.42);
    tipZ = o.headLen * 0.82;
    ball(head, hr * 0.28, hr * 0.22, hr * 0.2, noseM, 0, -hr * 0.2, tipZ);
  } else if (snoutKind === "short") {
    ball(head, hr * 0.62, hr * 0.5, hr * 0.55, mat(o.snoutColor ?? o.color), 0, -hr * 0.3, o.headLen * 0.42);
    tipZ = o.headLen * 0.42 + hr * 0.5;
    ball(head, hr * 0.3, hr * 0.2, hr * 0.15, noseM, 0, -hr * 0.2, tipZ);
  } else if (snoutKind === "flat") {
    const disc = add(head, cyl(hr * 0.5, hr * 0.55, hr * 0.5, 16), noseM, 0, -hr * 0.2, o.headLen * 0.5 + hr * 0.2);
    disc.rotation.x = Math.PI / 2;
    tipZ = o.headLen * 0.5 + hr * 0.45;
    for (const s of [-1, 1]) ball(head, hr * 0.07, hr * 0.09, hr * 0.04, darkM, s * hr * 0.17, -hr * 0.2, tipZ + 0.01);
  }
  for (const s of [-1, 1]) {
    ball(head, hr * 0.14, hr * 0.14, hr * 0.12, eyeM, s * hr * 0.66, hr * 0.3, o.headLen * 0.18);
    // ears
    const e = o.ear ?? "round";
    if (e === "round") ball(head, hr * 0.09, hr * 0.32, hr * 0.28, body, s * hr * 0.82, hr * 0.78, -o.headLen * 0.1).rotation.z = -s * 0.5;
    else if (e === "point") {
      const c = add(head, cone(hr * 0.3, hr * 0.9, 10), body, s * hr * 0.6, hr * 1.05, -o.headLen * 0.1);
      c.rotation.z = -s * 0.5;
    } else if (e === "flop") ball(head, hr * 0.1, hr * 0.5, hr * 0.38, body, s * hr * 0.85, hr * 0.5, o.headLen * 0.02).rotation.z = -s * 0.9;
    else if (e === "big") ball(head, hr * 0.09, hr * 1.1, hr * 0.95, mat(o.color), s * hr * 0.95, hr * 0.2, -o.headLen * 0.1).rotation.y = s * 0.25;
  }

  // horns / tusks / trunk
  const horns = o.horns ?? "none";
  if (horns === "cow") {
    for (const s of [-1, 1]) add(head, cone(hr * 0.13, hr * 0.7, 8), hornM, s * hr * 0.6, hr * 1.1, -o.headLen * 0.08).rotation.z = -s * 0.5;
  } else if (horns === "banteng") {
    for (const s of [-1, 1]) {
      const h1 = add(head, cone(hr * 0.16, hr * 1.4, 8), hornM, s * hr * 1.25, hr * 0.85, -o.headLen * 0.08);
      h1.rotation.z = -s * 1.05;
      const h2 = add(head, cone(hr * 0.1, hr * 0.8, 8), hornM, s * hr * 1.85, hr * 1.45, -o.headLen * 0.08);
      h2.rotation.z = -s * 0.2;
    }
  } else if (horns === "rhino") {
    add(head, cone(hr * 0.3, hr * 1.4, 10), hornM, 0, hr * 0.35, tipZ * 0.82).rotation.x = -0.35;
    add(head, cone(hr * 0.17, hr * 0.6, 8), hornM, 0, hr * 0.85, tipZ * 0.4).rotation.x = -0.2;
  } else if (horns === "antler") {
    const antler = mat(o.hornColor ?? 0x8b6914, 0.7);
    for (const s of [-1, 1]) {
      const base = new THREE.Vector3(s * hr * 0.35, hr * 0.9, -o.headLen * 0.1);
      let prev = base;
      for (let i = 1; i <= 3; i++) {
        const nx = base.x + s * hr * 0.3 * i, ny = base.y + hr * 0.9 * i, nz = base.z - hr * 0.25 * i;
        const cur = new THREE.Vector3(nx, ny, nz);
        link(head, prev, cur, hr * 0.09, hr * 0.07, antler);
        link(head, cur, new THREE.Vector3(nx + s * hr * 0.1, ny + hr * 0.5, nz + hr * 0.7), hr * 0.05, hr * 0.03, antler);
        prev = cur;
      }
    }
  }
  if (o.tusks === "small") for (const s of [-1, 1]) add(head, cone(hr * 0.09, hr * 0.5, 8), white, s * hr * 0.33, -hr * 0.25, tipZ * 0.9).rotation.x = -0.6;
  if (o.tusks === "long") {
    for (const s of [-1, 1]) {
      const a = new THREE.Vector3(s * hr * 0.55, -hr * 0.45, o.headLen * 0.4);
      const b = new THREE.Vector3(s * hr * 0.75, -hr * 0.75, o.headLen * 0.4 + hr * 1.1);
      const c = new THREE.Vector3(s * hr * 0.7, -hr * 0.45, o.headLen * 0.4 + hr * 1.9);
      link(head, a, b, hr * 0.14, hr * 0.1, white);
      link(head, b, c, hr * 0.1, hr * 0.02, white);
    }
  }
  if (o.trunk) {
    const gray = mat(o.color);
    let parent: THREE.Object3D = head;
    let y = -hr * 0.2, z = o.headLen * 0.45;
    const segs = 5;
    for (let i = 0; i < segs; i++) {
      const pivot = new THREE.Group();
      pivot.position.set(0, y, z);
      pivot.rotation.x = i === 0 ? -0.1 : -0.14;
      parent.add(pivot);
      const len = hr * 0.75, r0 = hr * (0.34 - i * 0.045), r1 = hr * (0.3 - i * 0.045);
      add(pivot, cyl(r1, r0, len, 12, 1), gray, 0, -len / 2, 0);
      ball(pivot, r1, r1, r1, gray, 0, -len, 0);
      parent = pivot; y = -len; z = 0;
    }
  }

  // legs: pivot at the hip/shoulder, diagonal pairs swing together
  const legTop = o.legLen + RY * 0.3;
  for (const fz of [1, -1]) {
    for (const sx of [-1, 1]) {
      const leg = new THREE.Group();
      leg.name = "leg";
      leg.userData.side = sx * fz;
      leg.position.set(sx * W * 0.34, legTop, fz * L * 0.3);
      g.add(leg);
      const rTop = o.legR * (fz < 0 ? 1.3 : 1.15), rBot = o.legR * 0.8;
      add(leg, cyl(rTop, rBot, legTop, 14, 1), body, 0, -legTop / 2, 0);
      if (o.socks !== undefined) add(leg, cyl(rBot * 1.02, rBot * 1.05, legTop * 0.3, 14, 1), mat(o.socks), 0, -legTop * 0.85, 0);
      if (o.paws) ball(leg, rBot * 1.35, rBot * 0.8, rBot * 1.8, body, 0, -legTop + rBot * 0.5, rBot * 0.5);
      else add(leg, cyl(rBot * 1.05, rBot * 1.15, rBot * 0.8, 14, 1), darkM, 0, -legTop + rBot * 0.4, 0);
    }
  }

  // tail
  const tailKind = o.tail ?? "thin";
  if (tailKind !== "none") {
    const tail = new THREE.Group();
    tail.name = "tail";
    tail.position.set(0, bodyY + RY * 0.35, -L / 2 + 0.05);
    g.add(tail);
    if (tailKind === "thin" || tailKind === "tuft") {
      const len = tailKind === "tuft" ? L * 0.5 : L * 0.4;
      const end = new THREE.Vector3(0, -len * 0.85, -len * (tailKind === "tuft" ? 0.5 : 0.25));
      link(tail, new THREE.Vector3(), end, o.legR * (tailKind === "tuft" ? 0.4 : 0.25), o.legR * 0.2, body);
      ball(tail, o.legR * 0.5, o.legR * 1.2, o.legR * 0.5, tailKind === "tuft" ? darkM : mat(o.dark ?? o.color), end.x, end.y - o.legR, end.z);
    } else if (tailKind === "curl") {
      const t = add(tail, torus(o.legR * 0.7, o.legR * 0.2, 8, 14), body, 0, 0.02, -o.legR * 0.7);
      t.rotation.y = Math.PI / 2;
    } else {
      ball(tail, o.legR * 0.6, o.legR * 0.6, o.legR * 1.1, body, 0, -o.legR * 0.3, -o.legR * 0.6);
    }
  }

  // markings
  if (o.spots) {
    const spot = darkM;
    const pts: [number, number, number, number][] = [[0.5, 0.15, 0.35, 0.28], [0.1, -0.1, 0.45, 0.22], [-0.45, 0.2, 0.3, 0.3], [-0.2, 0.3, 0.1, 0.18], [0.35, -0.25, 0.1, 0.18]];
    for (const s of [-1, 1]) for (const [pz, py, , r] of pts) ball(g, 0.03, RY * r * 1.2, L * r * 0.45, spot, s * (W / 2 - 0.005), bodyY + RY * py * s * 0.6 + RY * 0.1, L * pz * 0.9 * (s > 0 ? 1 : -0.6));
  }
  if (o.stripes) {
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
      const z = -L * 0.36 + i * L * 0.1;
      const st = ball(g, 0.025, RY * (0.5 + 0.12 * Math.sin(i * 1.7)), L * 0.022, darkM, s * (W / 2 * 0.97 - 0.003), bodyY + RY * 0.15, z);
      st.rotation.z = s * 0.12;
    }
    for (let i = 0; i < 3; i++) ball(head, hr * 0.5, hr * 0.012, hr * 0.03, darkM, 0, hr * (0.55 + i * 0.12), o.headLen * 0.2);
  }
  if (o.quills) {
    const q1 = mat(0x1a1a1a, 0.6), q2 = mat(0xe8e2cf, 0.6);
    for (let i = 0; i < 70; i++) {
      const a = (i * 2.399963) % (Math.PI * 2);              // golden-angle spread
      const t = (i + 0.5) / 70;
      const n = new THREE.Vector3(Math.cos(a) * 0.8, 0.6 + 0.4 * t, -0.5 + t * -0.4 + Math.sin(a) * 0.4).normalize();
      const pos = new THREE.Vector3(n.x * W / 2, bodyY + n.y * RY, n.z * L / 2 * 0.9);
      const quill = add(g, cone(0.035, 0.5, 5), i % 3 === 0 ? q2 : q1, pos.x, pos.y, pos.z);
      quill.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(n.x, n.y + 0.2, n.z - 0.5).normalize());
      quill.translateY(0.2);
    }
  }

  g.traverse((c) => { if ((c as THREE.Mesh).isMesh) c.castShadow = true; });
  return g;
}
