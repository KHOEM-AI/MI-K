import * as THREE from "three";
import { createQuadruped } from "./animalFigure";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05, ...opts });

/* ============================================================
   ខ្ទីង (Porcupine)
   ============================================================ */
export function createPorcupine(): THREE.Group {
  return createQuadruped({
    length: 1.2, width: 0.7, bodyRy: 0.4, legLen: 0.25, legR: 0.07, color: 0x5d4037,
    headLen: 0.4, headR: 0.2, snout: "short", ear: "round", tail: "short", quills: true, neck: 0,
  });
}

/* ============================================================
   ក្ដាន់ (Banteng - Wild Cattle)
   ============================================================ */
export function createBanteng(): THREE.Group {
  return createQuadruped({
    length: 2.4, width: 1.0, bodyRy: 0.7, legLen: 1.0, legR: 0.14, color: 0x3e2723, socks: 0xf1ead2,
    headLen: 0.8, headR: 0.35, snout: "short", snoutColor: 0x2b1b17, ear: "round", horns: "banteng",
    tail: "thin", hump: true, neck: 0.1,
  });
}

/* ============================================================
   ព្រើស (Wild Boar)
   ============================================================ */
export function createWildBoar(): THREE.Group {
  return createQuadruped({
    length: 1.7, width: 0.85, bodyRy: 0.55, legLen: 0.55, legR: 0.1, color: 0x4a3728,
    headLen: 0.8, headR: 0.3, snout: "long", snoutColor: 0x2b1f16, ear: "point", tusks: "small", tail: "short", hump: true, neck: 0.02,
  });
}

/* ============================================================
   ង៉ែង (Eld's Deer)
   ============================================================ */
export function createEldsDeer(): THREE.Group {
  return createQuadruped({
    length: 1.7, width: 0.6, bodyRy: 0.4, legLen: 1.0, legR: 0.055, color: 0xc9a577, belly: 0xefe3cf,
    headLen: 0.55, headR: 0.2, snout: "long", snoutColor: 0xb89466, ear: "point", horns: "antler", hornColor: 0x8b6914,
    tail: "short", neck: 0.55,
  });
}

/* ============================================================
   ខ្លាឃ្មុំ (Bear)
   ============================================================ */
export function createBear(): THREE.Group {
  return createQuadruped({
    length: 2.0, width: 1.3, bodyRy: 0.75, legLen: 0.7, legR: 0.26, color: 0x3e2723,
    headLen: 0.7, headR: 0.4, snout: "short", snoutColor: 0x7a5a48, ear: "round", paws: true, tail: "short", hump: true, neck: 0.05,
  });
}

/* ============================================================
   រមាស (Rhinoceros)
   ============================================================ */
export function createRhinoceros(): THREE.Group {
  return createQuadruped({
    length: 3.4, width: 1.6, bodyRy: 0.95, legLen: 0.95, legR: 0.34, color: 0x5d6d7e,
    headLen: 1.5, headR: 0.6, snout: "long", snoutColor: 0x53606f, ear: "point", horns: "rhino", tail: "thin", neck: 0.0,
  });
}

/* ============================================================
   ក្រពើ (Crocodile)
   ============================================================ */
export function createCrocodile(): THREE.Group {
  const g = new THREE.Group();
  const greenMat = mat("#2d5016");
  const darkGreen = mat("#1a3d0a");
  const teethMat = mat("#f5f5dc");

  // តួ (វែង)
  const body = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 1.2), greenMat);
  body.position.y = 0.4;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.6, 1), greenMat);
  head.position.set(2.5, 0.4, 0);
  head.castShadow = true;
  g.add(head);

  // ភ្នែក ២ (លឿង)
  [-0.3, 0.3].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), mat("#f1c40f"));
    eye.position.set(2.8, 0.7, z);
    g.add(eye);
  });

  // ធ្មេញ ៦ (តូច)
  for (let i = 0; i < 6; i++) {
    const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), teethMat);
    tooth.position.set(3 + i * 0.15, 0.3, 0.4);
    tooth.rotation.z = Math.PI;
    g.add(tooth);
  }

  // ស្នាមខ្នង ៨ (spikes)
  for (let i = 0; i < 8; i++) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.3, 4),
      darkGreen
    );
    spike.position.set(-1.5 + i * 0.5, 0.9, 0);
    g.add(spike);
  }

  // ជើង ៤
  [[-1.2, 0.5], [-1.2, -0.5], [1.2, 0.5], [1.2, -0.5]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), greenMat);
    leg.position.set(x, 0.2, z);
    leg.name = "leg";
    g.add(leg);
  });

  // កន្ទុយ (វែង)
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.05, 2.5, 6), greenMat);
  tail.rotation.z = -Math.PI / 2;
  tail.position.set(-3, 0.4, 0);
  g.add(tail);

  return g;
}

/* ============================================================
   បង្កើតសត្វព្រៃបន្ថែម (Forest Wildlife)
   ============================================================ */
export interface ForestAnimal {
  mesh: THREE.Group;
  path: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  phase: number;
  type: "porcupine" | "banteng" | "boar" | "deer" | "bear" | "rhino" | "croc";
}

export function createForestWildlife(
  centerX = -300,
  centerZ = 250
): {
  group: THREE.Group;
  animals: ForestAnimal[];
} {
  const group = new THREE.Group();
  const animals: ForestAnimal[] = [];

  // ខ្ទីង ៣ (ដើរយឺត)
  for (let i = 0; i < 3; i++) {
    const porcupine = createPorcupine();
    group.add(porcupine);
    const angle = (i / 3) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 20, 0, centerZ + Math.sin(angle) * 20),
      new THREE.Vector3(centerX + Math.cos(angle + 2) * 25, 0, centerZ + Math.sin(angle + 2) * 25),
      new THREE.Vector3(centerX + Math.cos(angle + 4) * 20, 0, centerZ + Math.sin(angle + 4) * 20),
      new THREE.Vector3(centerX + Math.cos(angle) * 20, 0, centerZ + Math.sin(angle) * 20),
    ], true);
    animals.push({
      mesh: porcupine,
      path,
      speed: 0.008,
      offset: i / 3,
      phase: Math.random() * Math.PI * 2,
      type: "porcupine",
    });
  }

  // ក្ដាន់ ៣ (ដើរ)
  for (let i = 0; i < 3; i++) {
    const banteng = createBanteng();
    group.add(banteng);
    const angle = (i / 3) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 35, 0, centerZ + Math.sin(angle) * 35),
      new THREE.Vector3(centerX + Math.cos(angle + 2) * 45, 0, centerZ + Math.sin(angle + 2) * 45),
      new THREE.Vector3(centerX + Math.cos(angle + 4) * 35, 0, centerZ + Math.sin(angle + 4) * 35),
      new THREE.Vector3(centerX + Math.cos(angle) * 35, 0, centerZ + Math.sin(angle) * 35),
    ], true);
    animals.push({
      mesh: banteng,
      path,
      speed: 0.006,
      offset: i / 3,
      phase: Math.random() * Math.PI * 2,
      type: "banteng",
    });
  }

  // ព្រើស ៤ (ដើរលឿនបន្តិច)
  for (let i = 0; i < 4; i++) {
    const boar = createWildBoar();
    group.add(boar);
    const angle = (i / 4) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 25, 0, centerZ + Math.sin(angle) * 25),
      new THREE.Vector3(centerX + Math.cos(angle + 2) * 30, 0, centerZ + Math.sin(angle + 2) * 30),
      new THREE.Vector3(centerX + Math.cos(angle + 4) * 25, 0, centerZ + Math.sin(angle + 4) * 25),
      new THREE.Vector3(centerX + Math.cos(angle) * 25, 0, centerZ + Math.sin(angle) * 25),
    ], true);
    animals.push({
      mesh: boar,
      path,
      speed: 0.012,
      offset: i / 4,
      phase: Math.random() * Math.PI * 2,
      type: "boar",
    });
  }

  // ង៉ែង ៤ (ដើរ)
  for (let i = 0; i < 4; i++) {
    const deer = createEldsDeer();
    group.add(deer);
    const angle = (i / 4) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 30, 0, centerZ + Math.sin(angle) * 30),
      new THREE.Vector3(centerX + Math.cos(angle + 2) * 40, 0, centerZ + Math.sin(angle + 2) * 40),
      new THREE.Vector3(centerX + Math.cos(angle + 4) * 30, 0, centerZ + Math.sin(angle + 4) * 30),
      new THREE.Vector3(centerX + Math.cos(angle) * 30, 0, centerZ + Math.sin(angle) * 30),
    ], true);
    animals.push({
      mesh: deer,
      path,
      speed: 0.01,
      offset: i / 4,
      phase: Math.random() * Math.PI * 2,
      type: "deer",
    });
  }

  return { group, animals };
}

export function updateForestWildlife(
  animals: ForestAnimal[],
  elapsed: number
): void {
  animals.forEach((a) => {
    const t = (a.offset + a.speed * elapsed) % 1;
    const point = a.path.getPointAt(t);
    const tangent = a.path.getTangentAt(t);

    a.mesh.position.copy(point);
    a.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

    // ជើងញាក់
    a.mesh.traverse((child) => {
      if (child.name === "leg") {
        child.rotation.x = (child.userData.side ?? 1) * Math.sin(elapsed * 5 + a.phase) * 0.3;
      }
    });
  });
}
