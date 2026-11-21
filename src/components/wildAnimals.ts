import * as THREE from "three";
import { createQuadruped } from "./animalFigure";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05, ...opts });

/* ============================================================
   ខ្លា (Tiger)
   ============================================================ */
export function createTiger(): THREE.Group {
  return createQuadruped({
    length: 2.6, width: 0.85, bodyRy: 0.5, legLen: 0.9, legR: 0.16, color: 0xe67e22, belly: 0xf5f5f5, dark: 0x1a1a1a,
    headLen: 0.8, headR: 0.36, snout: "short", snoutColor: 0xf0d9c0, ear: "round", paws: true, tail: "tuft", stripes: true,
    eyeColor: 0xf1c40f, neck: 0.1,
  });
}

/* ============================================================
   ដំរី (Elephant)
   ============================================================ */
export function createElephant(): THREE.Group {
  return createQuadruped({
    length: 3.4, width: 1.8, bodyRy: 1.1, legLen: 1.5, legR: 0.4, color: 0x7f8c8d,
    headLen: 1.3, headR: 0.75, snout: "none", ear: "big", trunk: true, tusks: "long", tail: "thin", neck: 0.05,
  });
}

/* ============================================================
   ស្វា (Monkey)
   ============================================================ */
export function createMonkey(): THREE.Group {
  const g = new THREE.Group();
  const brownMat = mat("#8b6914");
  const lightMat = mat("#c9a577");

  // តួ
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), brownMat);
  body.position.y = 0.8;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 10), brownMat);
  head.position.y = 1.5;
  g.add(head);

  // មុខ (ស្រាល)
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), lightMat);
  face.position.set(0, 1.45, 0.25);
  g.add(face);

  // ត្រចៀក ២
  [-0.3, 0.3].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), brownMat);
    ear.position.set(x, 1.55, 0);
    g.add(ear);
  });

  // ដៃ ២
  [-0.5, 0.5].forEach((x) => {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6), brownMat);
    arm.position.set(x, 0.9, 0);
    arm.name = "arm";
    g.add(arm);
  });

  // កន្ទុយ (វែង, កោង)
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 12, Math.PI), brownMat);
  tail.position.set(0, 0.8, -0.5);
  tail.rotation.x = Math.PI / 2;
  g.add(tail);

  return g;
}

/* ============================================================
   ពស់ (Snake)
   ============================================================ */
export function createSnake(): THREE.Group {
  const g = new THREE.Group();
  const greenMat = mat("#27ae60");

  // តួ (តំណាងដោយ sphere ៥)
  const segments: THREE.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const seg = new THREE.Mesh(new THREE.SphereGeometry(0.2 - i * 0.02, 8, 8), greenMat);
    seg.position.set(i * 0.35, 0.2, 0);
    g.add(seg);
    segments.push(seg);
  }

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), greenMat);
  head.position.set(1.5, 0.3, 0);
  g.add(head);

  // ភ្នែក ២ (ក្រហម)
  [-0.1, 0.1].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat("#e74c3c"));
    eye.position.set(1.6, 0.35, z);
    g.add(eye);
  });

  // អណ្តាត
  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.05), mat("#e74c3c"));
  tongue.position.set(1.75, 0.25, 0);
  g.add(tongue);

  return g;
}

/* ============================================================
   បក្សីព្រៃ (Wild Bird)
   ============================================================ */
export function createWildBird(color = "#3498db"): THREE.Group {
  const g = new THREE.Group();
  const birdMat = mat(color);

  // តួ
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), birdMat);
  body.position.y = 0.5;
  body.scale.set(1.3, 1, 1);
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), birdMat);
  head.position.set(0.35, 0.7, 0);
  g.add(head);

  // ចំពុះ
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), mat("#f39c12"));
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.55, 0.7, 0);
  g.add(beak);

  // ស្លាប ២
  [-0.25, 0.25].forEach((z) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), birdMat);
    wing.position.set(0, 0.6, z);
    wing.rotation.z = z > 0 ? 0.3 : -0.3;
    wing.name = "wing";
    g.add(wing);
  });

  return g;
}

/* ============================================================
   បង្កើតសត្វព្រៃ (Wild Animals)
   ============================================================ */
export interface WildAnimal {
  mesh: THREE.Group;
  path: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  phase: number;
  type: "tiger" | "elephant" | "monkey" | "snake" | "bird";
}

export function createWildAnimals(): {
  group: THREE.Group;
  animals: WildAnimal[];
} {
  const group = new THREE.Group();
  const animals: WildAnimal[] = [];

  // តំបន់ព្រៃ (ជិតប្រាសាទ)
  const forestCenter = { x: -180, z: 200 };

  // ខ្លា ២ (ដើរយឺត ៗ)
  for (let i = 0; i < 2; i++) {
    const tiger = createTiger();
    group.add(tiger);
    const angleOffset = (i / 2) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 30, 0, forestCenter.z + Math.sin(angleOffset) * 30),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 2) * 40, 0, forestCenter.z + Math.sin(angleOffset + 2) * 40),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 4) * 30, 0, forestCenter.z + Math.sin(angleOffset + 4) * 30),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 30, 0, forestCenter.z + Math.sin(angleOffset) * 30),
    ], true);
    animals.push({
      mesh: tiger,
      path,
      speed: 0.008,
      offset: i / 2,
      phase: Math.random() * Math.PI * 2,
      type: "tiger",
    });
  }

  // ដំរី ២ (ដើរយឺត)
  for (let i = 0; i < 2; i++) {
    const elephant = createElephant();
    group.add(elephant);
    const angleOffset = (i / 2) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 50, 0, forestCenter.z + Math.sin(angleOffset) * 50),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 2) * 60, 0, forestCenter.z + Math.sin(angleOffset + 2) * 60),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 4) * 50, 0, forestCenter.z + Math.sin(angleOffset + 4) * 50),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 50, 0, forestCenter.z + Math.sin(angleOffset) * 50),
    ], true);
    animals.push({
      mesh: elephant,
      path,
      speed: 0.005,
      offset: i / 2,
      phase: Math.random() * Math.PI * 2,
      type: "elephant",
    });
  }

  // ស្វា ៤ (លោត)
  for (let i = 0; i < 4; i++) {
    const monkey = createMonkey();
    group.add(monkey);
    const angleOffset = (i / 4) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 15, 0, forestCenter.z + Math.sin(angleOffset) * 15),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 2) * 20, 0, forestCenter.z + Math.sin(angleOffset + 2) * 20),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 4) * 15, 0, forestCenter.z + Math.sin(angleOffset + 4) * 15),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 15, 0, forestCenter.z + Math.sin(angleOffset) * 15),
    ], true);
    animals.push({
      mesh: monkey,
      path,
      speed: 0.02,
      offset: i / 4,
      phase: Math.random() * Math.PI * 2,
      type: "monkey",
    });
  }

  // ពស់ ៣ (រអិល)
  for (let i = 0; i < 3; i++) {
    const snake = createSnake();
    group.add(snake);
    const angleOffset = (i / 3) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 25, 0.3, forestCenter.z + Math.sin(angleOffset) * 25),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 2) * 30, 0.3, forestCenter.z + Math.sin(angleOffset + 2) * 30),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 4) * 25, 0.3, forestCenter.z + Math.sin(angleOffset + 4) * 25),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 25, 0.3, forestCenter.z + Math.sin(angleOffset) * 25),
    ], true);
    animals.push({
      mesh: snake,
      path,
      speed: 0.015,
      offset: i / 3,
      phase: Math.random() * Math.PI * 2,
      type: "snake",
    });
  }

  // បក្សី ៨ (ហើរលើអាកាស)
  const birdColors = ["#3498db", "#e74c3c", "#f39c12", "#9b59b6", "#16a085", "#e67e22", "#c0392b", "#2c3e50"];
  for (let i = 0; i < 8; i++) {
    const bird = createWildBird(birdColors[i]);
    bird.position.y = 30 + Math.random() * 20;
    group.add(bird);
    const angleOffset = (i / 8) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 40, 30, forestCenter.z + Math.sin(angleOffset) * 40),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 1) * 60, 40, forestCenter.z + Math.sin(angleOffset + 1) * 60),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 2) * 40, 30, forestCenter.z + Math.sin(angleOffset + 2) * 40),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset + 3) * 60, 40, forestCenter.z + Math.sin(angleOffset + 3) * 60),
      new THREE.Vector3(forestCenter.x + Math.cos(angleOffset) * 40, 30, forestCenter.z + Math.sin(angleOffset) * 40),
    ], true);
    animals.push({
      mesh: bird,
      path,
      speed: 0.03,
      offset: i / 8,
      phase: Math.random() * Math.PI * 2,
      type: "bird",
    });
  }

  return { group, animals };
}

export function updateWildAnimals(
  animals: WildAnimal[],
  elapsed: number
): void {
  animals.forEach((a) => {
    const t = (a.offset + a.speed * elapsed) % 1;
    const point = a.path.getPointAt(t);
    const tangent = a.path.getTangentAt(t);

    a.mesh.position.copy(point);
    a.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

    // ចលនាតាមប្រភេទ
    if (a.type === "monkey") {
      // លោត
      a.mesh.position.y = Math.abs(Math.sin(elapsed * 3 + a.phase)) * 0.5;
    } else if (a.type === "bird") {
      // ស្លាបបក់
      a.mesh.traverse((child) => {
        if (child.name === "wing") {
          const wingMesh = child as THREE.Mesh;
          wingMesh.rotation.z = Math.sin(elapsed * 10 + a.phase) * 0.5;
        }
      });
    } else if (a.type === "snake") {
      // រអិល
      a.mesh.position.y = 0.3 + Math.sin(elapsed * 4 + a.phase) * 0.05;
    } else {
      // ជើងញាក់ (tiger, elephant)
      a.mesh.traverse((child) => {
        if (child.name === "leg") {
          child.rotation.x = (child.userData.side ?? 1) * Math.sin(elapsed * 5 + a.phase) * 0.3;
        }
      });
    }
  });
}
