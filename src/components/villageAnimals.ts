import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   គោ (Cow)
   ============================================================ */
export function createCow(color = "#f5f5dc"): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat(color);
  const spotMat = mat("#2c2c2c");

  // តួ
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1), bodyMat);
  body.position.y = 1.3;
  body.castShadow = true;
  g.add(body);

  // ស្នាមអុច ៗ
  for (let i = 0; i < 3; i++) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), spotMat);
    spot.position.set(-0.6 + i * 0.6, 1.5, 0.5);
    spot.scale.set(1, 0.5, 0.3);
    g.add(spot);
  }

  // ក្បាល
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), bodyMat);
  head.position.set(1.3, 1.5, 0);
  head.castShadow = true;
  g.add(head);

  // ភ្នែក ២
  [-0.2, 0.2].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat("#000"));
    eye.position.set(1.65, 1.6, z);
    g.add(eye);
  });

  // ត្រចៀក ២
  [-0.4, 0.4].forEach((z) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.4), bodyMat);
    ear.position.set(1.2, 1.9, z);
    g.add(ear);
  });

  // ជើង ៤
  [[-0.8, 0.4], [-0.8, -0.4], [0.8, 0.4], [0.8, -0.4]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6), bodyMat);
    leg.position.set(x, 0.35, z);
    leg.castShadow = true;
    leg.name = "leg";
    g.add(leg);
  });

  // កន្ទុយ
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4), bodyMat);
  tail.position.set(-1.2, 1.5, 0);
  tail.rotation.z = Math.PI / 3;
  g.add(tail);

  return g;
}

/* ============================================================
   ជ្រូក (Pig)
   ============================================================ */
export function createPig(color = "#f5b7b1"): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat(color);

  // តួ (មូល)
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 12, 12), bodyMat);
  body.position.y = 0.8;
  body.scale.set(1.5, 1, 1);
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), bodyMat);
  head.position.set(1, 0.9, 0);
  head.castShadow = true;
  g.add(head);

  // ច្រមុះ
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.2, 8), mat("#e74c3c"));
  snout.rotation.z = Math.PI / 2;
  snout.position.set(1.35, 0.85, 0);
  g.add(snout);

  // ភ្នែក ២
  [-0.15, 0.15].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat("#000"));
    eye.position.set(1.25, 1.1, z);
    g.add(eye);
  });

  // ត្រចៀក ២
  [-0.3, 0.3].forEach((z) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.25, 4), bodyMat);
    ear.position.set(0.85, 1.25, z);
    ear.rotation.z = z > 0 ? -0.3 : 0.3;
    g.add(ear);
  });

  // ជើង ៤ (ខ្លី)
  [[-0.6, 0.3], [-0.6, -0.3], [0.6, 0.3], [0.6, -0.3]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.4, 6), bodyMat);
    leg.position.set(x, 0.2, z);
    leg.name = "leg";
    g.add(leg);
  });

  return g;
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
        child.rotation.x = Math.sin(elapsed * 6 + a.legPhase) * 0.3;
      }
    });
  });
}
