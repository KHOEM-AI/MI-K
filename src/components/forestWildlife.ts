import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05, ...opts });

/* ============================================================
   ខ្ទីង (Porcupine)
   ============================================================ */
export function createPorcupine(): THREE.Group {
  const g = new THREE.Group();
  const brownMat = mat("#5d4037");

  // តួ
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), brownMat);
  body.position.y = 0.7;
  body.scale.set(1.3, 1, 1);
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), brownMat);
  head.position.set(0.9, 0.75, 0);
  g.add(head);

  // ភ្នែក ២
  [-0.1, 0.1].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat("#000"));
    eye.position.set(1.15, 0.85, z);
    g.add(eye);
  });

  // បន្លាខ្នង ៣០ (cone តូច)
  for (let i = 0; i < 30; i++) {
    const angle = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.5;
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.4, 4),
      mat("#1a1a1a")
    );
    spike.position.set(
      Math.cos(angle) * Math.sin(phi) * 0.6,
      0.7 + Math.cos(phi) * 0.6,
      Math.sin(angle) * Math.sin(phi) * 0.6
    );
    spike.rotation.x = phi;
    spike.rotation.z = angle;
    g.add(spike);
  }

  // ជើង ៤
  [[-0.6, 0.3], [-0.6, -0.3], [0.6, 0.3], [0.6, -0.3]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.3, 6), brownMat);
    leg.position.set(x, 0.15, z);
    leg.name = "leg";
    g.add(leg);
  });

  return g;
}

/* ============================================================
   ក្ដាន់ (Banteng - Wild Cattle)
   ============================================================ */
export function createBanteng(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat("#3e2723"); // ត្នោតចាស់
  const hornMat = mat("#f5f5dc");

  // តួ
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.3, 1.1), bodyMat);
  body.position.y = 1.3;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.8), bodyMat);
  head.position.set(1.5, 1.5, 0);
  head.castShadow = true;
  g.add(head);

  // ស្នែង ២ (កោង)
  [-0.4, 0.4].forEach((z) => {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.8, 6),
      hornMat
    );
    horn.position.set(1.6, 1.95, z);
    horn.rotation.z = z > 0 ? -0.5 : 0.5;
    horn.rotation.x = -0.3;
    g.add(horn);
  });

  // ភ្នែក ២ (ក្រហម)
  [-0.2, 0.2].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), mat("#e74c3c"));
    eye.position.set(1.95, 1.55, z);
    g.add(eye);
  });

  // ជើង ៤ (វែង)
  [[-0.9, 0.35], [-0.9, -0.35], [0.9, 0.35], [0.9, -0.35]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 6), bodyMat);
    leg.position.set(x, 0.6, z);
    leg.name = "leg";
    g.add(leg);
  });

  // កន្ទុយ
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4), bodyMat);
  tail.position.set(-1.3, 1.5, 0);
  tail.rotation.z = Math.PI / 3;
  g.add(tail);

  return g;
}

/* ============================================================
   ព្រើស (Wild Boar)
   ============================================================ */
export function createWildBoar(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat("#4a3728"); // ត្នោតចាស់
  const tuskMat = mat("#f5f5dc");

  // តួ (មូល)
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 10, 10), bodyMat);
  body.position.y = 0.9;
  body.scale.set(1.5, 1, 1);
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), bodyMat);
  head.position.set(1.3, 0.9, 0);
  head.castShadow = true;
  g.add(head);

  // ច្រមុះ (វែង)
  const snout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.2, 0.5, 8),
    bodyMat
  );
  snout.rotation.z = Math.PI / 2;
  snout.position.set(1.75, 0.8, 0);
  g.add(snout);

  // ភ្នែក ២
  [-0.2, 0.2].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), mat("#000"));
    eye.position.set(1.7, 1.05, z);
    g.add(eye);
  });

  // ធ្មេញ (tusks) ២
  [-0.2, 0.2].forEach((z) => {
    const tusk = new THREE.Mesh(
      new THREE.ConeGeometry(0.08, 0.35, 4),
      tuskMat
    );
    tusk.position.set(2, 0.6, z);
    tusk.rotation.z = Math.PI;
    g.add(tusk);
  });

  // ជើង ៤
  [[-0.7, 0.4], [-0.7, -0.4], [0.7, 0.4], [0.7, -0.4]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 6), bodyMat);
    leg.position.set(x, 0.3, z);
    leg.name = "leg";
    g.add(leg);
  });

  // កន្ទុយតូច
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 4), bodyMat);
  tail.position.set(-1.3, 1, 0);
  tail.rotation.z = Math.PI / 4;
  g.add(tail);

  return g;
}

/* ============================================================
   ង៉ែង (Eld's Deer)
   ============================================================ */
export function createEldsDeer(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat("#c9a577"); // លឿងស្រាល
  const antlerMat = mat("#8b6914");

  // តួ (ស្តើង)
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.9, 0.7), bodyMat);
  body.position.y = 1.4;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), bodyMat);
  head.position.set(1.1, 1.7, 0);
  head.castShadow = true;
  g.add(head);

  // ស្នែង ២ (មែកច្រើន)
  [-0.2, 0.2].forEach((z) => {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6),
      antlerMat
    );
    base.position.set(1.1, 2.5, z);
    base.rotation.z = z > 0 ? -0.3 : 0.3;
    g.add(base);

    // មែក ៣
    for (let i = 0; i < 3; i++) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.06, 0.5, 4),
        antlerMat
      );
      branch.position.set(1.1 + (i - 1) * 0.15, 2.8 + i * 0.3, z * 1.2);
      branch.rotation.z = (i - 1) * 0.4;
      g.add(branch);
    }
  });

  // ភ្នែក ២
  [-0.15, 0.15].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat("#000"));
    eye.position.set(1.4, 1.8, z);
    g.add(eye);
  });

  // ជើង ៤ (វែងស្តើង)
  [[-0.7, 0.25], [-0.7, -0.25], [0.7, 0.25], [0.7, -0.25]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), bodyMat);
    leg.position.set(x, 0.7, z);
    leg.name = "leg";
    g.add(leg);
  });

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
  type: "porcupine" | "banteng" | "boar" | "deer";
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
        child.rotation.x = Math.sin(elapsed * 5 + a.phase) * 0.3;
      }
    });
  });
}
