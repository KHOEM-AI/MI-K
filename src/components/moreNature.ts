import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05, ...opts });

/* ============================================================
   B. សត្វព្រៃបន្ថែម (Lion, Leopard, Buffalo, Eagle)
   ============================================================ */
export function createLion(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat("#d4a574");
  const maneMat = mat("#8b4513");

  // តួ
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1), bodyMat);
  body.position.y = 1.2;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 10, 10), bodyMat);
  head.position.set(1.5, 1.5, 0);
  head.castShadow = true;
  g.add(head);

  // Mane (សក់)
  const mane = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 12), maneMat);
  mane.position.set(1.4, 1.5, 0);
  mane.scale.set(1, 1, 1);
  g.add(mane);

  // ភ្នែក ២
  [-0.2, 0.2].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 6), mat("#f1c40f"));
    eye.position.set(1.9, 1.6, z);
    g.add(eye);
  });

  // ជើង ៤
  [[-0.9, 0.35], [-0.9, -0.35], [0.9, 0.35], [0.9, -0.35]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 6), bodyMat);
    leg.position.set(x, 0.5, z);
    leg.name = "leg";
    g.add(leg);
  });

  // កន្ទុយ (មាន tuft)
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 4), bodyMat);
  tail.position.set(-1.3, 1.4, 0);
  tail.rotation.z = Math.PI / 3;
  g.add(tail);

  const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.15, 6, 6), maneMat);
  tuft.position.set(-1.7, 0.9, 0);
  g.add(tuft);

  return g;
}

export function createLeopard(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat("#f4a460");
  const spotMat = mat("#1a1a1a");

  // តួ (ស្តើង)
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.9, 0.8), bodyMat);
  body.position.y = 1;
  body.castShadow = true;
  g.add(body);

  // ចំណុច (spots) ១៥
  for (let i = 0; i < 15; i++) {
    const spot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), spotMat);
    spot.position.set(
      -1 + Math.random() * 2,
      1.3 + Math.random() * 0.2,
      (Math.random() > 0.5 ? 1 : -1) * 0.4
    );
    g.add(spot);
  }

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), bodyMat);
  head.position.set(1.35, 1.3, 0);
  head.castShadow = true;
  g.add(head);

  // ភ្នែក ២
  [-0.15, 0.15].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), mat("#f1c40f"));
    eye.position.set(1.7, 1.4, z);
    g.add(eye);
  });

  // ជើង ៤
  [[-0.8, 0.25], [-0.8, -0.25], [0.8, 0.25], [0.8, -0.25]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1, 6), bodyMat);
    leg.position.set(x, 0.5, z);
    leg.name = "leg";
    g.add(leg);
  });

  // កន្ទុយវែង
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 2.5, 4), bodyMat);
  tail.position.set(-1.5, 1, 0);
  tail.rotation.z = Math.PI / 4;
  g.add(tail);

  return g;
}

export function createBuffalo(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat("#2c2c2c");
  const hornMat = mat("#d4c4a8");

  // តួ (ក្រាស់)
  const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 1.5), bodyMat);
  body.position.y = 1.5;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 1), bodyMat);
  head.position.set(2, 1.5, 0);
  head.castShadow = true;
  g.add(head);

  // ស្នែង ២ (ធំកោង)
  [-0.5, 0.5].forEach((z) => {
    const horn = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.12, 6, 12, Math.PI * 1.2), hornMat);
    horn.position.set(1.8, 2.1, z);
    horn.rotation.y = Math.PI / 2;
    horn.rotation.x = z > 0 ? -0.4 : 0.4;
    g.add(horn);
  });

  // ភ្នែក ២
  [-0.3, 0.3].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 6), mat("#e74c3c"));
    eye.position.set(2.6, 1.7, z);
    g.add(eye);
  });

  // ជើង ៤
  [[-1, 0.5], [-1, -0.5], [1, 0.5], [1, -0.5]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8), bodyMat);
    leg.position.set(x, 0.6, z);
    leg.name = "leg";
    g.add(leg);
  });

  return g;
}

export function createEagle(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat("#3e2723");
  const beakMat = mat("#f39c12");

  // តួ
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), bodyMat);
  body.scale.set(1.5, 1, 1);
  body.position.y = 1.5;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bodyMat);
  head.position.set(0.5, 1.9, 0);
  g.add(head);

  // ចំពុះ
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), beakMat);
  beak.rotation.z = -Math.PI / 2;
  beak.position.set(0.85, 1.85, 0);
  g.add(beak);

  // ស្លាបធំ ២ (សក់)
  [-0.5, 0.5].forEach((z) => {
    const wing = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 0.05, 0.8),
      bodyMat
    );
    wing.position.set(0, 1.5, z);
    wing.rotation.z = z > 0 ? 0.2 : -0.2;
    wing.name = "wing";
    g.add(wing);
  });

  // ភ្នែក ២
  [-0.15, 0.15].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat("#f1c40f"));
    eye.position.set(0.7, 2, z);
    g.add(eye);
  });

  return g;
}

/* ============================================================
   C. រុក្ខជាតិបន្ថែម (Palm, Bamboo, Wild Grass, Wild Flowers)
   ============================================================ */
export function createPalmTree(): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = mat("#8b6914", { roughness: 1 });
  const leafMat = mat("#27ae60", { roughness: 1 });

  // ដើមកោង
  const trunkPoints: THREE.Vector3[] = [];
  for (let i = 0; i < 8; i++) {
    trunkPoints.push(new THREE.Vector3(i * 0.3, i * 1, 0));
  }
  const trunkCurve = new THREE.CatmullRomCurve3(trunkPoints);
  const trunkGeo = new THREE.TubeGeometry(trunkCurve, 10, 0.3, 8, false);
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.castShadow = true;
  g.add(trunk);

  // ស្លឹក ៨ (តាមកំពូល)
  const topPos = trunkCurve.getPointAt(1);
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const leaf = new THREE.Mesh(
      new THREE.ConeGeometry(0.4, 3, 4),
      leafMat
    );
    leaf.position.set(
      topPos.x + Math.cos(angle) * 1.5,
      topPos.y + 0.5,
      topPos.z + Math.sin(angle) * 1.5
    );
    leaf.rotation.z = Math.cos(angle) * 0.5;
    leaf.rotation.x = Math.sin(angle) * 0.5;
    leaf.castShadow = true;
    g.add(leaf);
  }

  // ដូង ៣
  for (let i = 0; i < 3; i++) {
    const coconut = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 8, 8),
      mat("#8b6914")
    );
    coconut.position.set(
      topPos.x + (Math.random() - 0.5) * 0.8,
      topPos.y - 0.3,
      topPos.z + (Math.random() - 0.5) * 0.8
    );
    g.add(coconut);
  }

  return g;
}

export function createBamboo(size = 1): THREE.Group {
  const g = new THREE.Group();
  const stalkMat = mat("#7cb342", { roughness: 1 });

  // ដើម ៥ (ខ្ពស់)
  for (let i = 0; i < 5; i++) {
    const stalk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 8, 6),
      stalkMat
    );
    stalk.position.set(
      (Math.random() - 0.5) * 1.5,
      4,
      (Math.random() - 0.5) * 1.5
    );
    stalk.castShadow = true;
    g.add(stalk);

    // ស្លឹកតូច ៗ
    for (let j = 0; j < 4; j++) {
      const leaf = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.6),
        new THREE.MeshStandardMaterial({
          color: "#7cb342",
          side: THREE.DoubleSide,
        })
      );
      leaf.position.set(
        stalk.position.x + (Math.random() - 0.5) * 0.5,
        3 + j * 1.5,
        stalk.position.z + (Math.random() - 0.5) * 0.5
      );
      leaf.rotation.z = Math.random() * Math.PI;
      g.add(leaf);
    }
  }

  g.scale.setScalar(size);
  return g;
}

export function createWildGrass(count = 20, areaSize = 30): THREE.Group {
  const g = new THREE.Group();
  const grassMat = mat("#7cb342", { roughness: 1, side: THREE.DoubleSide });

  for (let i = 0; i < count; i++) {
    const grass = new THREE.Mesh(
      new THREE.ConeGeometry(0.1, 1.5, 4),
      grassMat
    );
    grass.position.set(
      (Math.random() - 0.5) * areaSize,
      0.75,
      (Math.random() - 0.5) * areaSize
    );
    g.add(grass);
  }

  return g;
}

export function createWildFlowers(count = 15, areaSize = 20): THREE.Group {
  const g = new THREE.Group();
  const colors = ["#e74c3c", "#f1c40f", "#e91e63", "#9b59b6", "#ff69b4", "#ffffff"];

  for (let i = 0; i < count; i++) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.6, 4),
      mat("#27ae60")
    );
    stem.position.set(
      (Math.random() - 0.5) * areaSize,
      0.3,
      (Math.random() - 0.5) * areaSize
    );
    g.add(stem);

    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 6, 6),
      mat(colors[i % colors.length], { emissive: colors[i % colors.length], emissiveIntensity: 0.2 })
    );
    flower.position.set(stem.position.x, 0.6, stem.position.z);
    g.add(flower);
  }

  return g;
}

/* ============================================================
   បង្កើតសត្វ + រុក្ខជាតិថ្មី (More Nature)
   ============================================================ */
export interface MoreAnimal {
  mesh: THREE.Group;
  path: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  phase: number;
  type: "lion" | "leopard" | "buffalo" | "eagle";
}

export function createMoreNature(centerX = -300, centerZ = 250): {
  group: THREE.Group;
  animals: MoreAnimal[];
} {
  const group = new THREE.Group();
  const animals: MoreAnimal[] = [];

  // តោ ២
  for (let i = 0; i < 2; i++) {
    const lion = createLion();
    group.add(lion);
    const angle = (i / 2) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 35, 0, centerZ + Math.sin(angle) * 35),
      new THREE.Vector3(centerX + Math.cos(angle + 2) * 45, 0, centerZ + Math.sin(angle + 2) * 45),
      new THREE.Vector3(centerX + Math.cos(angle + 4) * 35, 0, centerZ + Math.sin(angle + 4) * 35),
      new THREE.Vector3(centerX + Math.cos(angle) * 35, 0, centerZ + Math.sin(angle) * 35),
    ], true);
    animals.push({ mesh: lion, path, speed: 0.008, offset: i / 2, phase: Math.random() * Math.PI * 2, type: "lion" });
  }

  // ខ្លារខិន ២
  for (let i = 0; i < 2; i++) {
    const leopard = createLeopard();
    group.add(leopard);
    const angle = (i / 2) * Math.PI * 2 + Math.PI;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 30, 0, centerZ + Math.sin(angle) * 30),
      new THREE.Vector3(centerX + Math.cos(angle + 2) * 35, 0, centerZ + Math.sin(angle + 2) * 35),
      new THREE.Vector3(centerX + Math.cos(angle + 4) * 30, 0, centerZ + Math.sin(angle + 4) * 30),
      new THREE.Vector3(centerX + Math.cos(angle) * 30, 0, centerZ + Math.sin(angle) * 30),
    ], true);
    animals.push({ mesh: leopard, path, speed: 0.012, offset: i / 2, phase: Math.random() * Math.PI * 2, type: "leopard" });
  }

  // ក្របីព្រៃ ៣
  for (let i = 0; i < 3; i++) {
    const buffalo = createBuffalo();
    group.add(buffalo);
    const angle = (i / 3) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 40, 0, centerZ + Math.sin(angle) * 40),
      new THREE.Vector3(centerX + Math.cos(angle + 2) * 55, 0, centerZ + Math.sin(angle + 2) * 55),
      new THREE.Vector3(centerX + Math.cos(angle + 4) * 40, 0, centerZ + Math.sin(angle + 4) * 40),
      new THREE.Vector3(centerX + Math.cos(angle) * 40, 0, centerZ + Math.sin(angle) * 40),
    ], true);
    animals.push({ mesh: buffalo, path, speed: 0.005, offset: i / 3, phase: Math.random() * Math.PI * 2, type: "buffalo" });
  }

  // ឥន្ទ្រី ៤ (ហើរខ្ពស់)
  for (let i = 0; i < 4; i++) {
    const eagle = createEagle();
    eagle.position.y = 50 + Math.random() * 20;
    group.add(eagle);
    const angle = (i / 4) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 50, 55, centerZ + Math.sin(angle) * 50),
      new THREE.Vector3(centerX + Math.cos(angle + 1.5) * 70, 65, centerZ + Math.sin(angle + 1.5) * 70),
      new THREE.Vector3(centerX + Math.cos(angle + 3) * 50, 55, centerZ + Math.sin(angle + 3) * 50),
      new THREE.Vector3(centerX + Math.cos(angle + 4.5) * 70, 65, centerZ + Math.sin(angle + 4.5) * 70),
      new THREE.Vector3(centerX + Math.cos(angle) * 50, 55, centerZ + Math.sin(angle) * 50),
    ], true);
    animals.push({ mesh: eagle, path, speed: 0.04, offset: i / 4, phase: Math.random() * Math.PI * 2, type: "eagle" });
  }

  // រុក្ខជាតិ
  // ដើមត្នោត ៨
  for (let i = 0; i < 8; i++) {
    const palm = createPalmTree();
    const angle = (i / 8) * Math.PI * 2;
    palm.position.set(
      centerX + Math.cos(angle) * 70,
      0,
      centerZ + Math.sin(angle) * 70
    );
    group.add(palm);
  }

  // ឫស្សី ១២ (ក្រោយព្រៃ)
  for (let i = 0; i < 12; i++) {
    const bamboo = createBamboo(0.8 + Math.random() * 0.5);
    const angle = (i / 12) * Math.PI * 2;
    bamboo.position.set(
      centerX + Math.cos(angle) * 80,
      0,
      centerZ + Math.sin(angle) * 80
    );
    group.add(bamboo);
  }

  // ស្មៅព្រៃ ៣ ក្រុម
  for (let i = 0; i < 3; i++) {
    const grass = createWildGrass(30, 25);
    const angle = (i / 3) * Math.PI * 2;
    grass.position.set(
      centerX + Math.cos(angle) * 60,
      0,
      centerZ + Math.sin(angle) * 60
    );
    group.add(grass);
  }

  // ផ្កាព្រៃ ៥ ក្រុម
  for (let i = 0; i < 5; i++) {
    const flowers = createWildFlowers(15, 15);
    const angle = (i / 5) * Math.PI * 2;
    flowers.position.set(
      centerX + Math.cos(angle) * 50,
      0,
      centerZ + Math.sin(angle) * 50
    );
    group.add(flowers);
  }

  return { group, animals };
}

export function updateMoreNature(animals: MoreAnimal[], elapsed: number): void {
  animals.forEach((a) => {
    const t = (a.offset + a.speed * elapsed) % 1;
    const point = a.path.getPointAt(t);
    const tangent = a.path.getTangentAt(t);

    a.mesh.position.copy(point);
    a.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

    if (a.type === "eagle") {
      a.mesh.traverse((child) => {
        if (child.name === "wing") {
          child.rotation.z = Math.sin(elapsed * 8 + a.phase) * 0.5;
        }
      });
    } else {
      a.mesh.traverse((child) => {
        if (child.name === "leg") {
          child.rotation.x = Math.sin(elapsed * 5 + a.phase) * 0.3;
        }
      });
    }
  });
}
