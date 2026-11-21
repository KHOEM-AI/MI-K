import * as THREE from "three";
import { createQuadruped } from "./animalFigure";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   គោ (Cow)
   ============================================================ */
export function createCow(color = "#f5f5dc"): THREE.Group {
  return createQuadruped({
    length: 2.3, width: 1.0, bodyRy: 0.62, legLen: 0.75, legR: 0.13, color, dark: 0x2c2c2c,
    headLen: 0.7, headR: 0.33, snout: "short", snoutColor: 0xe8b4a8, ear: "round", horns: "cow",
    tail: "thin", spots: true, neck: 0.15,
  });
}

/* ============================================================
   ជ្រូក (Pig)
   ============================================================ */
export function createPig(color = "#f5b7b1"): THREE.Group {
  return createQuadruped({
    length: 1.4, width: 0.75, bodyRy: 0.42, legLen: 0.32, legR: 0.09, color, dark: 0x6b3b36,
    headLen: 0.5, headR: 0.26, snout: "flat", snoutColor: 0xe08f8a, ear: "flop", tail: "curl", neck: 0.05,
  });
}

/* ============================================================
   ទា (Duck)
   ============================================================ */
export function createDuck(color = "#f5f5f5"): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat(color);
  const beakMat = mat("#f39c12");

  // តួ
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 10), bodyMat);
  body.position.y = 0.5;
  body.scale.set(1.3, 1, 1);
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 10), bodyMat);
  head.position.set(0.5, 0.9, 0);
  head.castShadow = true;
  g.add(head);

  // ចំពុះ
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), beakMat);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.8, 0.85, 0);
  g.add(beak);

  // ភ្នែក ២
  [-0.1, 0.1].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), mat("#000"));
    eye.position.set(0.68, 0.95, z);
    g.add(eye);
  });

  // ស្លាប ២
  [-0.3, 0.3].forEach((z) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.3), bodyMat);
    wing.position.set(0, 0.6, z);
    wing.rotation.z = z > 0 ? 0.3 : -0.3;
    g.add(wing);
  });

  // ជើង ២
  [-0.1, 0.1].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.25, 4), beakMat);
    leg.position.set(x, 0.15, 0);
    g.add(leg);
  });

  return g;
}

/* ============================================================
   បង្កើតសត្វចម្រុះ (ដើរតាម loop)
   ============================================================ */
export interface AnimatedAnimal {
  mesh: THREE.Group;
  path: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  legPhase: number;
}

export function createVillageAnimals(): {
  group: THREE.Group;
  animals: AnimatedAnimal[];
} {
  const group = new THREE.Group();
  const animals: AnimatedAnimal[] = [];

  // គោ ៥ ក្បាល (ដើរក្នុងចម្ការ)
  const cowColors = ["#f5f5dc", "#d4b896", "#c9a577", "#f0e6d2", "#e8d5b7"];
  const cowPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-140, 0, 140),
    new THREE.Vector3(-100, 0, 150),
    new THREE.Vector3(-100, 0, 110),
    new THREE.Vector3(-140, 0, 110),
    new THREE.Vector3(-140, 0, 140),
  ], true);
  for (let i = 0; i < 5; i++) {
    const cow = createCow(cowColors[i]);
    group.add(cow);
    animals.push({
      mesh: cow,
      path: cowPath,
      speed: 0.01,
      offset: i / 5,
      legPhase: Math.random() * Math.PI * 2,
    });
  }

  // ជ្រូក ៦ ក្បាល
  const pigColors = ["#f5b7b1", "#e8b4b8", "#f0c4c4", "#e6a8a8", "#f5c0b8", "#d4a5a5"];
  const pigPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(130, 0, 140),
    new THREE.Vector3(160, 0, 150),
    new THREE.Vector3(160, 0, 110),
    new THREE.Vector3(130, 0, 110),
    new THREE.Vector3(130, 0, 140),
  ], true);
  for (let i = 0; i < 6; i++) {
    const pig = createPig(pigColors[i]);
    pig.scale.setScalar(0.9);
    group.add(pig);
    animals.push({
      mesh: pig,
      path: pigPath,
      speed: 0.012,
      offset: i / 6,
      legPhase: Math.random() * Math.PI * 2,
    });
  }

  // ទា ១៥ ក្បាល (ហែលទឹកបឹង)
  const duckPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-210, 0.2, -100),
    new THREE.Vector3(-150, 0.2, -100),
    new THREE.Vector3(-150, 0.2, -70),
    new THREE.Vector3(-210, 0.2, -70),
    new THREE.Vector3(-210, 0.2, -100),
  ], true);
  for (let i = 0; i < 15; i++) {
    const duck = createDuck(i % 3 === 0 ? "#f5f5f5" : "#e8e8e8");
    duck.scale.setScalar(0.7);
    group.add(duck);
    animals.push({
      mesh: duck,
      path: duckPath,
      speed: 0.008,
      offset: i / 15,
      legPhase: Math.random() * Math.PI * 2,
    });
  }

  return { group, animals };
}

/* ============================================================
   Update animals (ហៅក្នុង animation loop)
   ============================================================ */
export function updateAnimals(animals: AnimatedAnimal[], elapsed: number): void {
  animals.forEach((a) => {
    const t = (a.offset + a.speed * elapsed) % 1;
    const point = a.path.getPointAt(t);
    const tangent = a.path.getTangentAt(t);

    a.mesh.position.copy(point);
    const angle = Math.atan2(tangent.x, tangent.z);
    a.mesh.rotation.y = angle;

    // ជើងញាក់
    a.mesh.traverse((child) => {
      if (child.name === "leg") {
        child.rotation.x = (child.userData.side ?? 1) * Math.sin(elapsed * 6 + a.legPhase) * 0.3;
      }
    });
  });
}


/* ============================================================
   មាន់ដើរ (A)
   ============================================================ */
export interface AnimatedChicken {
  mesh: THREE.Group;
  angle: number;
  radius: number;
  speed: number;
  centerX: number;
  centerZ: number;
  legPhase: number;
}

export function createChickenFlock(
  count = 20,
  centerX = 0,
  centerZ = 0,
  radius = 50
): { group: THREE.Group; chickens: AnimatedChicken[] } {
  const group = new THREE.Group();
  const chickens: AnimatedChicken[] = [];

  for (let i = 0; i < count; i++) {
    // មាន់ color ចម្រុះ
    const colors = ["#f39c12", "#ffffff", "#e67e22", "#c0392b", "#f1c40f"];
    const chicken = createDuck(colors[i % colors.length]);
    chicken.scale.setScalar(0.6);
    group.add(chicken);

    const startAngle = (i / count) * Math.PI * 2;
    chickens.push({
      mesh: chicken,
      angle: startAngle,
      radius: radius + (Math.random() - 0.5) * 15,
      speed: 0.15 + Math.random() * 0.15,
      centerX,
      centerZ,
      legPhase: Math.random() * Math.PI * 2,
    });
  }

  return { group, chickens };
}

export function updateChickenFlock(
  chickens: AnimatedChicken[],
  elapsed: number
): void {
  chickens.forEach((c) => {
    // ដើរជុំវិញ center
    c.angle += c.speed * 0.016;
    const x = c.centerX + Math.cos(c.angle) * c.radius;
    const z = c.centerZ + Math.sin(c.angle) * c.radius;

    c.mesh.position.set(x, 0, z);
    // បង្វិលជាមួយ tangent
    c.mesh.rotation.y = c.angle + Math.PI / 2;

    // ជើងញាក់ + ក្បាលញ័រ (pecking)
    c.mesh.traverse((child) => {
      if (child.name === "leg") {
        child.rotation.x = Math.sin(elapsed * 8 + c.legPhase) * 0.4;
      }
    });
    // ក្បាលញ័រ (ចុចចុះឡើង)
    if (c.mesh.children[1]) {
      c.mesh.children[1].position.y =
        0.9 + Math.abs(Math.sin(elapsed * 4 + c.legPhase)) * 0.1;
    }
  });
}
