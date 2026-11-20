import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05, ...opts });

/* ============================================================
   អូរ (Stream/River)
   ============================================================ */
export function createStream(
  points: [number, number, number][],
  width = 6
): THREE.Group {
  const g = new THREE.Group();

  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z))
  );

  // ទឹក
  const waterGeo = new THREE.TubeGeometry(curve, 64, width / 2, 8, false);
  const waterMat = new THREE.MeshStandardMaterial({
    color: "#3498db",
    roughness: 0.1,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.scale.y = 0.05; // រាបស្មើ
  water.position.y = 0.1;
  water.name = "streamWater";
  g.add(water);

  // ច្រាំង (ស្មៅ + ដី)
  const bankGeo = new THREE.TubeGeometry(curve, 64, width / 2 + 0.5, 8, false);
  const bankMat = mat("#6d4c41");
  const bank = new THREE.Mesh(bankGeo, bankMat);
  bank.scale.y = 0.05;
  bank.position.y = 0.05;
  g.add(bank);

  return g;
}

/* ============================================================
   ទឹកជ្រោះ (Waterfall)
   ============================================================ */
export function createWaterfall(height = 30, width = 8): THREE.Group {
  const g = new THREE.Group();

  // ទឹកហូរ (plane បញ្ឈរ)
  const waterGeo = new THREE.PlaneGeometry(width, height, 8, 16);
  const waterMat = new THREE.MeshStandardMaterial({
    color: "#5dade2",
    roughness: 0.1,
    metalness: 0.3,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  const water = new THREE.Mesh(waterGeo, waterMat);
  water.position.y = height / 2;
  water.name = "waterfallSheet";
  g.add(water);

  // ស្នោខាងក្រោម (sphere តូច ៗ)
  for (let i = 0; i < 8; i++) {
    const foam = new THREE.Mesh(
      new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 6, 6),
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: 0.6,
      })
    );
    foam.position.set(
      (Math.random() - 0.5) * width,
      0.3 + Math.random() * 0.5,
      (Math.random() - 0.5) * 2
    );
    g.add(foam);
  }

  // ថ្មជុំវិញ
  for (let i = 0; i < 4; i++) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1 + Math.random(), 0),
      mat("#5d6d7e", { roughness: 1 })
    );
    rock.position.set(
      (Math.random() - 0.5) * width * 1.5,
      0.5,
      (Math.random() - 0.5) * 3
    );
    g.add(rock);
  }

  return g;
}

/* ============================================================
   ដើមឈើផ្លែឈើព្រៃ (Wild Fruit Tree)
   ============================================================ */
export function createWildFruitTree(
  fruitColor: string = "#e74c3c"
): THREE.Group {
  const g = new THREE.Group();

  // ដើម
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.6, 4, 8),
    mat("#5d4037", { roughness: 1 })
  );
  trunk.position.y = 2;
  trunk.castShadow = true;
  g.add(trunk);

  // មែក ៣
  [0, 2, 4].forEach((angle) => {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.25, 2.5, 6),
      mat("#5d4037", { roughness: 1 })
    );
    branch.position.set(Math.cos(angle) * 1.5, 4, Math.sin(angle) * 1.5);
    branch.rotation.z = Math.cos(angle) * 0.5;
    branch.rotation.x = Math.sin(angle) * 0.5;
    g.add(branch);
  });

  // ស្លឹក (sphere ជាន់ ៗ)
  const leafMat = mat("#2d6a4f", { roughness: 1 });
  for (let i = 0; i < 4; i++) {
    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(1.8 - i * 0.2, 8, 8),
      leafMat
    );
    leaves.position.y = 4.5 + i * 0.5;
    leaves.castShadow = true;
    g.add(leaves);
  }

  // ផ្លែឈើ (៦-៨)
  const fruitCount = 6 + Math.floor(Math.random() * 3);
  for (let i = 0; i < fruitCount; i++) {
    const angle = (i / fruitCount) * Math.PI * 2;
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 8),
      mat(fruitColor)
    );
    fruit.position.set(
      Math.cos(angle) * 2,
      4.5 + Math.random() * 1.5,
      Math.sin(angle) * 2
    );
    fruit.castShadow = true;
    g.add(fruit);
  }

  return g;
}

/* ============================================================
   ផ្កាវល្លិ៍ (Vine Flower)
   ============================================================ */
export function createVineFlower(
  color: string = "#e91e63"
): THREE.Group {
  const g = new THREE.Group();

  // វល្លិ៍ (curve)
  const vinePoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.3, 2, 0),
    new THREE.Vector3(-0.2, 4, 0.1),
    new THREE.Vector3(0.4, 6, 0),
    new THREE.Vector3(0, 8, 0.2),
  ];
  const vineCurve = new THREE.CatmullRomCurve3(vinePoints);
  const vineGeo = new THREE.TubeGeometry(vineCurve, 20, 0.05, 6, false);
  const vine = new THREE.Mesh(vineGeo, mat("#2d6a4f"));
  g.add(vine);

  // ផ្កា ៦ (តាមវល្លិ៍)
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const point = vineCurve.getPointAt(t);
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 6, 6),
      mat(color, { emissive: color, emissiveIntensity: 0.2 })
    );
    flower.position.copy(point);
    g.add(flower);

    // មជ្ឈមណ្ឌលផ្កា (លឿង)
    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 6, 6),
      mat("#f1c40f")
    );
    center.position.copy(point);
    g.add(center);
  }

  return g;
}

/* ============================================================
   ឃ្មុំភ្នំ (Wild Beehive)
   ============================================================ */
export function createBeehive(): THREE.Group {
  const g = new THREE.Group();

  // សំបុក (ellipsoid ត្នោត)
  const hive = new THREE.Mesh(
    new THREE.SphereGeometry(1, 12, 12),
    mat("#8b6914", { roughness: 1 })
  );
  hive.scale.set(1, 1.5, 1);
  hive.position.y = 3;
  hive.castShadow = true;
  g.add(hive);

  // ប្រហោងចូល
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8),
    mat("#1a1a1a")
  );
  hole.rotation.z = Math.PI / 2;
  hole.position.set(1, 3, 0);
  g.add(hole);

  // ឃ្មុំ ១៥ (ហោះជុំវិញ)
  for (let i = 0; i < 15; i++) {
    const bee = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 6, 6),
      mat("#f1c40f")
    );
    const angle = (i / 15) * Math.PI * 2;
    bee.position.set(
      Math.cos(angle) * 2,
      3 + Math.sin(angle) * 1,
      Math.sin(angle) * 2
    );
    bee.name = "bee";
    g.add(bee);
  }

  return g;
}

/* ============================================================
   ឃ្មុំស្រុក (Domestic Beehive Box)
   ============================================================ */
export function createDomesticBeehive(): THREE.Group {
  const g = new THREE.Group();

  // ប្រអប់ឈើ
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.5, 1),
    mat("#8b6914")
  );
  box.position.y = 1.5;
  box.castShadow = true;
  g.add(box);

  // ដំបូល
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.15, 1.2),
    mat("#5d4037")
  );
  roof.position.y = 2.3;
  g.add(roof);

  // ប្រហោង
  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.15, 6),
    mat("#1a1a1a")
  );
  hole.rotation.z = Math.PI / 2;
  hole.position.set(0.6, 1.2, 0);
  g.add(hole);

  return g;
}

/* ============================================================
   រុក្ខជាតិថ្នាំបុរាណ (Ancient Medicinal Plant)
   ============================================================ */
export function createMedicinalPlant(age: number = 100): THREE.Group {
  const g = new THREE.Group();

  // ដើមឈើចាស់ (ក្រាស់)
  const trunkHeight = 3 + age / 100;
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.8, trunkHeight, 8),
    mat("#5d4037", { roughness: 1 })
  );
  trunk.position.y = trunkHeight / 2;
  trunk.castShadow = true;
  g.add(trunk);

  // ស្លឹកពណ៌បៃតងចាស់
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(1.2 - i * 0.1, 6, 6),
      mat("#27ae60", { roughness: 1 })
    );
    leaf.position.y = trunkHeight + i * 0.3;
    leaf.castShadow = true;
    g.add(leaf);
  }

  // ផ្កាពណ៌ស (ឱសថ)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 6, 6),
      mat("#ffffff", { emissive: "#f5f5dc", emissiveIntensity: 0.1 })
    );
    flower.position.set(
      Math.cos(angle) * 1.5,
      trunkHeight + 1,
      Math.sin(angle) * 1.5
    );
    g.add(flower);
  }

  // ស្លាក (បន្ទះតូច)
  const label = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.3, 0.05),
    mat("#8b6f47")
  );
  label.position.set(0.9, 0.5, 0);
  g.add(label);

  return g;
}

/* ============================================================
   បង្កើតតំបន់ព្រៃភ្នំ (Forest Zone)
   ============================================================ */
export function createForestZone(centerX = -300, centerZ = 250): {
  group: THREE.Group;
  bees: THREE.Mesh[];
  waterMeshes: THREE.Mesh[];
  waterfallSheet: THREE.Mesh | null;
} {
  const group = new THREE.Group();
  const bees: THREE.Mesh[] = [];
  const waterMeshes: THREE.Mesh[] = [];

  // អូរ (ពីភ្នំចុះមក)
  const stream = createStream([
    [centerX + 20, 0, centerZ - 30],
    [centerX + 10, 0, centerZ - 10],
    [centerX, 0, centerZ + 10],
    [centerX - 10, 0, centerZ + 30],
    [centerX - 20, 0, centerZ + 50],
  ], 8);
  group.add(stream);
  stream.traverse((c) => {
    if (c.name === "streamWater") waterMeshes.push(c as THREE.Mesh);
  });

  // ទឹកជ្រោះ
  const waterfall = createWaterfall(25, 8);
  waterfall.position.set(centerX - 30, 0, centerZ - 50);
  group.add(waterfall);
  waterfall.traverse((c) => {
    if (c.name === "waterfallSheet") waterMeshes.push(c as THREE.Mesh);
  });
  const waterfallSheet = waterfall.children.find(
    (c) => c.name === "waterfallSheet"
  ) as THREE.Mesh | null;

  // ដើមឈើផ្លែឈើព្រៃ ២០ (ចម្រុះពណ៌)
  const fruitColors = ["#e74c3c", "#f39c12", "#9b59b6", "#f1c40f", "#27ae60"];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 30 + Math.random() * 40;
    const tree = createWildFruitTree(fruitColors[i % fruitColors.length]);
    tree.position.set(
      centerX + Math.cos(angle) * radius,
      0,
      centerZ + Math.sin(angle) * radius
    );
    tree.scale.setScalar(0.8 + Math.random() * 0.5);
    group.add(tree);
  }

  // ផ្កាវល្លិ៍ ១៥
  const flowerColors = ["#e91e63", "#9b59b6", "#ff69b4", "#ffc0cb"];
  for (let i = 0; i < 15; i++) {
    const angle = (i / 15) * Math.PI * 2;
    const radius = 20 + Math.random() * 30;
    const vine = createVineFlower(flowerColors[i % flowerColors.length]);
    vine.position.set(
      centerX + Math.cos(angle) * radius,
      0,
      centerZ + Math.sin(angle) * radius
    );
    group.add(vine);
  }

  // ឃ្មុំភ្នំ ៣
  for (let i = 0; i < 3; i++) {
    const hive = createBeehive();
    const angle = (i / 3) * Math.PI * 2 + Math.PI;
    hive.position.set(
      centerX + Math.cos(angle) * 40,
      0,
      centerZ + Math.sin(angle) * 40
    );
    group.add(hive);
    hive.traverse((c) => {
      if (c.name === "bee") bees.push(c as THREE.Mesh);
    });
  }

  // ឃ្មុំស្រុក ៥ (ជិតភូមិ)
  for (let i = 0; i < 5; i++) {
    const hive = createDomesticBeehive();
    hive.position.set(
      centerX + 100 + i * 3,
      0,
      centerZ + 80
    );
    group.add(hive);
  }

  // រុក្ខជាតិថ្នាំបុរាណ ៨ (អាយុ ១០០-៥០០ ឆ្នាំ)
  for (let i = 0; i < 8; i++) {
    const age = 100 + Math.random() * 400;
    const plant = createMedicinalPlant(age);
    const angle = (i / 8) * Math.PI * 2 + Math.PI / 4;
    plant.position.set(
      centerX + Math.cos(angle) * 60,
      0,
      centerZ + Math.sin(angle) * 60
    );
    group.add(plant);
  }

  return { group, bees, waterMeshes, waterfallSheet };
}

/* ============================================================
   Update Forest Zone (រលកទឹក + ឃ្មុំហោះ)
   ============================================================ */
export function updateForestZone(
  bees: THREE.Mesh[],
  waterMeshes: THREE.Mesh[],
  elapsed: number
): void {
  // ឃ្មុំហោះ
  bees.forEach((bee, i) => {
    const angle = elapsed * 2 + i * 0.5;
    const radius = 2 + Math.sin(elapsed + i) * 0.5;
    bee.position.x = Math.cos(angle) * radius;
    bee.position.z = Math.sin(angle) * radius;
    bee.position.y = 3 + Math.sin(elapsed * 3 + i) * 0.3;
  });

  // រលកទឹក (គ្រាន់តែបង្វិល opacity)
  waterMeshes.forEach((w, i) => {
    const m = w.material as THREE.MeshStandardMaterial;
    m.opacity = 0.75 + Math.sin(elapsed * 2 + i) * 0.15;
  });
}
