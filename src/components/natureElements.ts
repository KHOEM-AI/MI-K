import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   ភ្នំ
   ============================================================ */
export function createMountain(height = 40, radius = 30, color = "#5d6d7e"): THREE.Mesh {
  const geo = new THREE.ConeGeometry(radius, height, 8, 1);
  // បន្ថែមភាពរញ៉េរញ៉ៃ (random vertices)
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < height / 2 - 0.1) {
      const jitter = 0.1 + Math.random() * 0.2;
      pos.setX(i, pos.getX(i) * (1 + jitter));
      pos.setZ(i, pos.getZ(i) * (1 + jitter));
    }
  }
  geo.computeVertexNormals();
  const mountain = new THREE.Mesh(geo, mat(color, { roughness: 1, flatShading: true }));
  mountain.castShadow = true;
  mountain.receiveShadow = true;
  return mountain;
}

/* ============================================================
   ព្រៃឈើ (ដើមឈើច្រើនប្រភេទ)
   ============================================================ */
export function createTree(scale = 1, kind: "pine" | "round" | "palm" = "round"): THREE.Group {
  const g = new THREE.Group();
  const trunkMat = mat("#5d4037", { roughness: 1 });
  const leafMat = mat(
    kind === "pine" ? "#2d5016" : kind === "palm" ? "#27ae60" : "#2d6a4f",
    { roughness: 1 }
  );

  if (kind === "palm") {
    // ដើមស្លា
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 5, 8),
      trunkMat
    );
    trunk.position.y = 2.5;
    trunk.castShadow = true;
    g.add(trunk);

    // ស្លឹកស្លា ៥
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const leaf = new THREE.Mesh(
        new THREE.ConeGeometry(0.5, 3, 4),
        leafMat
      );
      leaf.position.set(
        Math.cos(angle) * 0.8,
        5,
        Math.sin(angle) * 0.8
      );
      leaf.rotation.z = angle + Math.PI / 2;
      leaf.rotation.x = Math.PI / 3;
      leaf.castShadow = true;
      g.add(leaf);
    }
  } else if (kind === "pine") {
    // ដើមឈើស្រល់ (Cone ជាន់ ៗ)
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 2, 8),
      trunkMat
    );
    trunk.position.y = 1;
    trunk.castShadow = true;
    g.add(trunk);

    [1.2, 0.9, 0.6].forEach((size, idx) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(size * 2, 2.5, 8),
        leafMat
      );
      cone.position.y = 2 + idx * 1.5;
      cone.castShadow = true;
      g.add(cone);
    });
  } else {
    // ដើមឈើមូល
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 2.5, 8),
      trunkMat
    );
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    g.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      leafMat
    );
    leaves.position.y = 4;
    leaves.castShadow = true;
    g.add(leaves);
  }

  g.scale.setScalar(scale);
  return g;
}

/* ============================================================
   ព្រៃឈើច្រើន (៥០-១០០ ដើម) — InstancedMesh
   ============================================================ */
export function createForest(
  count = 80,
  centerX = 0,
  centerZ = 0,
  spread = 200,
  seed = 123
): THREE.Group {
  const g = new THREE.Group();
  const rng = mulberry32(seed);

  // បែងចែក ៣ ប្រភេទ
  const kinds: ("pine" | "round" | "palm")[] = [];
  for (let i = 0; i < count; i++) {
    const r = rng();
    if (r < 0.3) kinds.push("pine");
    else if (r < 0.85) kinds.push("round");
    else kinds.push("palm");
  }

  // បង្កើតដើមឈើនីមួយៗ (ចំនួនតិច — សម្រាប់ forest ធម្មតា)
  // សម្រាប់ ៨០ ដើមនេះមិនធ្ងន់ទេ
  kinds.forEach((kind, i) => {
    const scale = 0.7 + rng() * 0.8;
    const tree = createTree(scale, kind);
    const angle = rng() * Math.PI * 2;
    const radius = spread * 0.5 + rng() * spread * 0.5;
    tree.position.set(
      centerX + Math.cos(angle) * radius,
      0,
      centerZ + Math.sin(angle) * radius
    );
    tree.rotation.y = rng() * Math.PI * 2;
    g.add(tree);
  });

  return g;
}

/* ============================================================
   បឹង (រាបស្មើ, ពណ៌ខៀវ, មានរលក)
   ============================================================ */
export function createLake(radius = 50): THREE.Group {
  const g = new THREE.Group();

  // ផ្ទៃទឹក
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 32),
    new THREE.MeshStandardMaterial({
      color: "#3498db",
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.1;
  water.receiveShadow = true;
  water.name = "water";
  g.add(water);

  // ច្រាំង (torus ជុំវិញ)
  const shore = new THREE.Mesh(
    new THREE.RingGeometry(radius, radius + 3, 32),
    mat("#c9b898", { roughness: 1 })
  );
  shore.rotation.x = -Math.PI / 2;
  shore.position.y = 0.05;
  shore.receiveShadow = true;
  g.add(shore);

  return g;
}

/* ============================================================
   ស្រះចិញ្ចឹមត្រី (តូច)
   ============================================================ */
export function createFishPond(size = 8): THREE.Group {
  const g = new THREE.Group();

  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshStandardMaterial({
      color: "#2980b9",
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.9,
    })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.1;
  g.add(water);

  // ច្រាំង (BoxGeometry ៤)
  const bankMat = mat("#8b6f47", { roughness: 1 });
  [
    [0, 0, -size / 2 - 0.5, size + 1, 0.5, 1],
    [0, 0, size / 2 + 0.5, size + 1, 0.5, 1],
    [-size / 2 - 0.5, 0, 0, 1, 0.5, size + 1],
    [size / 2 + 0.5, 0, 0, 1, 0.5, size + 1],
  ].forEach(([x, y, z, w, h, d]) => {
    const bank = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), bankMat);
    bank.position.set(x, y, z);
    g.add(bank);
  });

  return g;
}

/* ============================================================
   ស្ពាន (ឆ្លងប្រឡាយ)
   ============================================================ */
export function createBridge(length = 12, width = 4): THREE.Group {
  const g = new THREE.Group();

  // ផ្ទៃស្ពាន
  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(length, 0.4, width),
    mat("#8b6f47", { roughness: 1 })
  );
  deck.position.y = 1;
  deck.castShadow = true;
  deck.receiveShadow = true;
  g.add(deck);

  // របារចំហៀង ២
  [-1, 1].forEach((side) => {
    const railing = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.8, 0.15),
      mat("#5d4037")
    );
    railing.position.set(0, 1.6, side * (width / 2 - 0.1));
    g.add(railing);

    // បង្គោល ៤
    for (let i = 0; i < 4; i++) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 1, 0.15),
        mat("#3e2723")
      );
      post.position.set(
        -length / 2 + i * (length / 3),
        1.5,
        side * (width / 2 - 0.1)
      );
      g.add(post);
    }
  });

  // សសរទ្រទ្រង់ ២
  [-length / 3, length / 3].forEach((x) => {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 2, 8),
      mat("#5d4037")
    );
    pillar.position.set(x, 0, 0);
    pillar.castShadow = true;
    g.add(pillar);
  });

  return g;
}

/* ============================================================
   មាន់
   ============================================================ */
export function createChicken(color = "#f39c12"): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat(color, { roughness: 1 });

  // តួ
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 8, 8),
    bodyMat
  );
  body.position.y = 0.5;
  body.scale.set(1, 0.85, 1.2);
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), bodyMat);
  head.position.set(0, 0.85, 0.35);
  g.add(head);

  // ចំពុះ
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.06, 0.15, 4),
    mat("#e67e22")
  );
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.85, 0.55);
  g.add(beak);

  // ជើង ២
  [-1, 1].forEach((side) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.03, 0.3, 4),
      mat("#e67e22")
    );
    leg.position.set(side * 0.1, 0.15, 0);
    g.add(leg);
  });

  return g;
}

/* ============================================================
   ចម្ការបន្លែចម្រុះ (ធំ, មានបន្លែច្រើន)
   ============================================================ */
export function createMixedFarm(size = 25): THREE.Group {
  const g = new THREE.Group();
  const rng = mulberry32(555);

  // ដីចម្ការ
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(size, 0.1, size),
    mat("#6d4c41", { roughness: 1 })
  );
  soil.position.y = 0.05;
  soil.receiveShadow = true;
  g.add(soil);

  // បន្លែប្រភេទផ្សេងៗ
  const vegColors = ["#27ae60", "#e74c3c", "#f39c12", "#f1c40f", "#9b59b6", "#16a085"];

  // អំពៅ (ខ្ពស់)
  for (let i = 0; i < 8; i++) {
    const cane = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.2, 4, 6),
      mat("#a4d65e", { roughness: 1 })
    );
    cane.position.set(
      -size / 2 + 2 + i * 3,
      2,
      -size / 2 + 2
    );
    cane.castShadow = true;
    g.add(cane);
  }

  // បន្លែចម្រុះ (គ្រាប់តូច ៗ)
  for (let i = 0; i < 30; i++) {
    const veg = new THREE.Mesh(
      new THREE.SphereGeometry(0.25 + rng() * 0.2, 8, 8),
      mat(vegColors[Math.floor(rng() * vegColors.length)])
    );
    veg.position.set(
      -size / 2 + 2 + rng() * (size - 4),
      0.3,
      -size / 2 + 6 + rng() * (size - 8)
    );
    veg.castShadow = true;
    g.add(veg);
  }

  return g;
}

/* ============================================================
   ផ្លូវកោង (Curve Road)
   ============================================================ */
export function createWindingRoad(
  points: [number, number, number][],
  width = 6
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y, z]) => new THREE.Vector3(x, y, z))
  );
  const segments = 100;
  const geo = new THREE.TubeGeometry(curve, segments, width / 2, 8, false);
  // ប្តូរទៅជាផ្ទៃរាបស្មើ (មិនមែន tube)
  const road = new THREE.Mesh(geo, mat("#5d6d7e", { roughness: 1 }));
  road.rotation.x = 0;
  road.position.y = 0.02;
  road.scale.y = 0.02;
  road.receiveShadow = true;
  return road;
}

/* ============================================================
   Deterministic random
   ============================================================ */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
