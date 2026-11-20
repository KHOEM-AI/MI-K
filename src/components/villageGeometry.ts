import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   ឋានៈសង្គម: 0=ក្រ, 1=កណ្តាល, 2=មាន
   ============================================================ */
export type Wealth = 0 | 1 | 2;

export function pickWealth(rng: () => number): Wealth {
  const r = rng();
  if (r < 0.4) return 0;      // 40% ក្រ
  if (r < 0.8) return 1;      // 40% កណ្តាល
  return 2;                    // 20% មាន
}

/* ============================================================
   ផ្ទះតាមឋានៈ — ធំ, មានលម្អិត
   ============================================================ */

// ផ្ទះអ្នកក្រ: ១ ជាន់, ឈើ/ស្លឹក, តូច
export function createPoorHouse(roofColor = "#8b4513"): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.8, 4),
    mat("#d4c4a8")
  );
  base.position.y = 1.4;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // ដំបូលស្លឹក
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.4, 2, 4),
    mat(roofColor, { roughness: 1 })
  );
  roof.position.y = 3.6;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // ទ្វារ
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.6, 0.05), mat("#5d4037"));
  door.position.set(0, 0.8, 2.03);
  g.add(door);

  // បង្អួច ១
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.8, 0.05),
    mat("#87ceeb", { emissive: "#87ceeb", emissiveIntensity: 0.2 })
  );
  win.position.set(1.4, 1.8, 2.03);
  g.add(win);

  return g;
}

// ផ្ទះអ្នកកណ្តាល: ២ ជាន់, ឥដ្ឋ/ស៊ីម៉ង់, មធ្យម
export function createMiddleHouse(color = "#e8dcc4", roofColor = "#8b4513"): THREE.Group {
  const g = new THREE.Group();
  // ជាន់ក្រោម
  const floor1 = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 3, 5.5),
    mat(color)
  );
  floor1.position.y = 1.5;
  floor1.castShadow = true;
  floor1.receiveShadow = true;
  g.add(floor1);

  // ជាន់លើ
  const floor2 = new THREE.Mesh(
    new THREE.BoxGeometry(5, 2.5, 5),
    mat("#f0e0d0")
  );
  floor2.position.y = 4.25;
  floor2.castShadow = true;
  g.add(floor2);

  // ដំបូល
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(4.5, 1.8, 4),
    mat(roofColor)
  );
  roof.position.y = 6.4;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // ទ្វារធំ
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2, 0.05), mat("#5d4037"));
  door.position.set(0, 1, 2.78);
  g.add(door);

  // បង្អួច ៤ (២ ជាន់ក្រោម, ២ ជាន់លើ)
  const winMat = mat("#87ceeb", { emissive: "#87ceeb", emissiveIntensity: 0.3 });
  [-1.5, 1.5].forEach((x) => {
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), winMat);
    w1.position.set(x, 2, 2.78);
    g.add(w1);
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.05), winMat);
    w2.position.set(x, 4.5, 2.53);
    g.add(w2);
  });

  // រានហាល
  const porch = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 1.2), mat("#a0522d"));
  porch.position.set(0, 3, 3.2);
  g.add(porch);

  return g;
}

// ផ្ទះអ្នកមាន: ៣ ជាន់, វីឡា, ធំ, មានរបង, សួន
export function createRichHouse(color = "#fdfefe", roofColor = "#2c3e50"): THREE.Group {
  const g = new THREE.Group();
  // ជាន់ក្រោម
  const floor1 = new THREE.Mesh(
    new THREE.BoxGeometry(8, 3.2, 7),
    mat(color)
  );
  floor1.position.y = 1.6;
  floor1.castShadow = true;
  floor1.receiveShadow = true;
  g.add(floor1);

  // ជាន់ ២
  const floor2 = new THREE.Mesh(
    new THREE.BoxGeometry(7.5, 2.8, 6.5),
    mat("#f5f5f5")
  );
  floor2.position.y = 4.6;
  floor2.castShadow = true;
  g.add(floor2);

  // ជាន់ ៣
  const floor3 = new THREE.Mesh(
    new THREE.BoxGeometry(6, 2.5, 5),
    mat("#ececec")
  );
  floor3.position.y = 7.3;
  floor3.castShadow = true;
  g.add(floor3);

  // ដំបូលសំប៉ែត
  const roof = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.3, 7.2), mat(roofColor));
  roof.position.y = 8.7;
  g.add(roof);

  // បង្អួចធំ ៗ (ជាន់ ១)
  const winMat = mat("#87ceeb", { emissive: "#87ceeb", emissiveIntensity: 0.4 });
  [-2.5, 0, 2.5].forEach((x) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.05), winMat);
    w.position.set(x, 2, 3.53);
    g.add(w);
  });

  // បង្អួចជាន់ ២
  [-2, 0, 2].forEach((x) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.05), winMat);
    w.position.set(x, 5, 3.28);
    g.add(w);
  });

  // បង្អួចជាន់ ៣
  [-1.5, 1.5].forEach((x) => {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1, 0.05), winMat);
    w.position.set(x, 7.5, 2.53);
    g.add(w);
  });

  // ទ្វារធំ
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.3, 0.05), mat("#2c1810"));
  door.position.set(0, 1.15, 3.53);
  g.add(door);

  // រានហាលមុខ
  const porch = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 1.5), mat("#c9b38a"));
  porch.position.set(0, 3.3, 4.2);
  g.add(porch);

  // សសរ ៤
  [[-1.8, 5.9], [1.8, 5.9], [-1.8, 3.9], [1.8, 3.9]].forEach(([x, z]) => {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.3, 8), mat("#fff"));
    pillar.position.set(x, 1.65, z);
    g.add(pillar);
  });

  // របង (សង្ខេប)
  const fenceMat = mat("#8d6e63");
  [[-4.5, 4], [4.5, 4]].forEach(([x, z]) => {
    for (let i = 0; i < 6; i++) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), fenceMat);
      post.position.set(x - 3 + i * 1.2, 0.5, z + 1.5);
      g.add(post);
    }
  });

  // សួនផ្កាមុខ
  ["#e74c3c", "#f39c12", "#27ae60"].forEach((c, i) => {
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat(c));
    flower.position.set(-2 + i * 2, 0.3, 5.2);
    g.add(flower);
  });

  return g;
}

/* ============================================================
   យានជំនិះតាមឋានៈ
   ============================================================ */

// ឡាន (អ្នកមាន)
export function createCar(color = "#c0392b"): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.9, 1.8),
    mat(color, { metalness: 0.6, roughness: 0.3 })
  );
  body.position.y = 0.9;
  body.castShadow = true;
  g.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.8, 1.6),
    mat("#1a1a1a", { metalness: 0.5 })
  );
  cabin.position.set(-0.2, 1.7, 0);
  g.add(cabin);

  // កង់ ៤
  [[-1.4, 1], [-1.4, -1], [1.4, 1], [1.4, -1]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16),
      mat("#111")
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.4, z);
    g.add(wheel);
  });

  return g;
}

// ម៉ូតូ (អ្នកកណ្តាល)
export function createMotorbike(color = "#2c3e50"): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.5, 0.4),
    mat(color, { metalness: 0.5 })
  );
  body.position.y = 0.7;
  g.add(body);

  [-0.6, 0.6].forEach((x) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12),
      mat("#111")
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.3, 0);
    g.add(wheel);
  });

  return g;
}

// កង់ (អ្នកក្រ)
export function createBicycle(): THREE.Group {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.04, 6, 12),
    mat("#2980b9", { metalness: 0.6 })
  );
  frame.rotation.y = Math.PI / 2;
  frame.position.y = 0.5;
  g.add(frame);

  [-0.4, 0.4].forEach((x) => {
    const wheel = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.05, 6, 16),
      mat("#222")
    );
    wheel.rotation.y = Math.PI / 2;
    wheel.position.set(x, 0.3, 0);
    g.add(wheel);
  });

  return g;
}

/* ============================================================
   កសិកម្ម
   ============================================================ */

// ស្រែ (rice paddy)
export function createRiceField(size = 15): THREE.Group {
  const g = new THREE.Group();
  // ដីស្រែ
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(size, 0.05, size),
    mat("#5d4037", { roughness: 1 })
  );
  soil.position.y = 0.02;
  g.add(soil);

  // ដើមស្រូវពណ៌បៃតង
  const riceMat = mat("#7cb342", { roughness: 1 });
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const rice = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.15, 0.6, 4),
        riceMat
      );
      rice.position.set(
        -size / 2 + 1 + i * (size / 8),
        0.3,
        -size / 2 + 1 + j * (size / 8)
      );
      g.add(rice);
    }
  }

  return g;
}

// ចម្ការបន្លែ
export function createVegetableGarden(size = 10): THREE.Group {
  const g = new THREE.Group();
  const soil = new THREE.Mesh(
    new THREE.BoxGeometry(size, 0.05, size),
    mat("#6d4c41", { roughness: 1 })
  );
  soil.position.y = 0.02;
  g.add(soil);

  // បន្លែចម្រុះ
  const vegColors = ["#27ae60", "#e74c3c", "#f39c12", "#f1c40f"];
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const veg = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        mat(vegColors[(i + j) % vegColors.length])
      );
      veg.position.set(
        -size / 2 + 1.5 + i * (size / 5),
        0.3,
        -size / 2 + 1.5 + j * (size / 5)
      );
      g.add(veg);
    }
  }

  return g;
}

/* ============================================================
   រោងចក្រ — ធំ, មានច្រកចេញចូល
   ============================================================ */
export function createMeatVegFactory(): THREE.Group {
  const g = new THREE.Group();
  // អគារធំ
  const main = new THREE.Mesh(
    new THREE.BoxGeometry(30, 12, 20),
    mat("#bdc3c7")
  );
  main.position.y = 6;
  main.castShadow = true;
  main.receiveShadow = true;
  g.add(main);

  // ដំបូល
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(31, 0.5, 21),
    mat("#7f8c8d")
  );
  roof.position.y = 12.3;
  g.add(roof);

  // បំពង់ផ្សែង ៣
  [-8, 0, 8].forEach((x) => {
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.5, 8, 16),
      mat("#95a5a6", { metalness: 0.4 })
    );
    chimney.position.set(x, 16, 6);
    chimney.castShadow = true;
    g.add(chimney);
  });

  // ច្រកចូលធំ
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(6, 7, 0.3),
    mat("#2c3e50")
  );
  door.position.set(0, 3.5, 10.15);
  g.add(door);

  // ផ្ទាំងសញ្ញា
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(15, 2, 0.2),
    mat("#27ae60", { emissive: "#27ae60", emissiveIntensity: 0.8 })
  );
  sign.position.set(0, 10, 10.2);
  g.add(sign);

  // ប្រអប់វត្ថុធាតុដើម ១២
  const crateColors = ["#e67e22", "#c0392b", "#27ae60"];
  for (let i = 0; i < 12; i++) {
    const c = new THREE.Mesh(
      new THREE.BoxGeometry(2, 1.5, 2),
      mat(crateColors[i % 3])
    );
    c.position.set(-13 + i * 2.4, 0.75, -13);
    c.castShadow = true;
    g.add(c);
  }

  return g;
}

/* ============================================================
   ផ្សារ + ហាង
   ============================================================ */
export function createMarketStall(color = "#e74c3c"): THREE.Group {
  const g = new THREE.Group();
  [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([x, z]) => {
    const p = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 3, 8),
      mat("#8d6e63")
    );
    p.position.set(x, 1.5, z);
    p.castShadow = true;
    g.add(p);
  });
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.2, 1.2, 4),
    mat(color, { side: THREE.DoubleSide })
  );
  roof.position.y = 3.4;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
  const table = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 3.5), mat("#a0522d"));
  table.position.y = 1;
  g.add(table);
  // ផ្លែឈើ
  ["#e74c3c", "#f39c12", "#27ae60", "#f1c40f"].forEach((c, i) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), mat(c));
    f.position.set(-1.2 + i * 0.8, 1.3, 0.5);
    g.add(f);
  });
  return g;
}

export function createPhoneShop(): THREE.Group {
  const g = new THREE.Group();
  const shop = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 4), mat("#ecf0f1"));
  shop.position.y = 1.75;
  shop.castShadow = true;
  shop.receiveShadow = true;
  g.add(shop);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.25, 4.3), mat("#2c3e50"));
  roof.position.y = 3.6;
  g.add(roof);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.8, 0.15),
    mat("#3498db", { emissive: "#3498db", emissiveIntensity: 0.7 })
  );
  sign.position.set(0, 2.9, 2.05);
  g.add(sign);
  // ទូរសព្ទ ៤
  for (let i = 0; i < 4; i++) {
    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.3, 0.04),
      mat(i % 2 ? "#111" : "#555", { metalness: 0.6 })
    );
    phone.position.set(-1.4 + i * 0.9, 1.5, 2.05);
    g.add(phone);
  }
  return g;
}

export function createClothingShop(): THREE.Group {
  const g = new THREE.Group();
  const shop = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 4), mat("#fdfefe"));
  shop.position.y = 1.75;
  shop.castShadow = true;
  shop.receiveShadow = true;
  g.add(shop);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.25, 4.3), mat("#c0392b"));
  roof.position.y = 3.6;
  g.add(roof);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(4.5, 0.8, 0.15),
    mat("#e91e63", { emissive: "#e91e63", emissiveIntensity: 0.6 })
  );
  sign.position.set(0, 2.9, 2.05);
  g.add(sign);
  // អាវ ៤
  ["#e74c3c", "#3498db", "#27ae60", "#f39c12"].forEach((c, i) => {
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.7, 0.06), mat(c));
    shirt.position.set(-1.8 + i * 1.2, 1.7, 2.05);
    g.add(shirt);
  });
  return g;
}

export function createMotorbikeShop(): THREE.Group {
  const g = new THREE.Group();
  const shop = new THREE.Mesh(new THREE.BoxGeometry(6, 3.5, 4.5), mat("#d5dbdb"));
  shop.position.y = 1.75;
  shop.castShadow = true;
  shop.receiveShadow = true;
  g.add(shop);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.3, 4.9), mat("#1a1a1a"));
  roof.position.y = 3.65;
  g.add(roof);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(5.5, 0.9, 0.15),
    mat("#e67e22", { emissive: "#e67e22", emissiveIntensity: 0.7 })
  );
  sign.position.set(0, 3.1, 2.3);
  g.add(sign);
  // ម៉ូតូ ៣
  for (let i = 0; i < 3; i++) {
    const bike = createMotorbike(i % 2 ? "#c0392b" : "#2c3e50");
    bike.position.set(-2 + i * 2, 0, 2.5);
    g.add(bike);
  }
  return g;
}

export function createBikeShop(): THREE.Group {
  const g = new THREE.Group();
  const shop = new THREE.Mesh(new THREE.BoxGeometry(5.5, 3.5, 4), mat("#f9e79f"));
  shop.position.y = 1.75;
  shop.castShadow = true;
  shop.receiveShadow = true;
  g.add(shop);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.25, 4.3), mat("#7d6608"));
  roof.position.y = 3.6;
  g.add(roof);
  // កង់ ៤
  for (let i = 0; i < 4; i++) {
    const bike = createBicycle();
    bike.position.set(-2 + i * 1.3, 0, 2.2);
    g.add(bike);
  }
  return g;
}

/* ============================================================
   ភូមិ ៣០០ គ្រួសារ — ចែកឋានៈតាមតំបន់
   ============================================================ */
export function createVillageHouses(count = 300, seed = 42): THREE.Group {
  const g = new THREE.Group();
  const rng = mulberry32(seed);

  const cols = 20;
  const rows = Math.ceil(count / cols);
  const spacingX = 9;
  const spacingZ = 10;
  const startX = -((cols - 1) * spacingX) / 2;
  const startZ = -((rows - 1) * spacingZ) / 2;

  const poorRoofs = ["#8b4513", "#6b3410", "#a0522d"];
  const middleRoofs = ["#8d6e63", "#a0522d", "#5d4037"];
  const richRoofs = ["#2c3e50", "#34495e", "#1a1a2e"];

  let built = 0;
  for (let r = 0; r < rows && built < count; r++) {
    for (let c = 0; c < cols && built < count; c++) {
      // ទុកផ្លូវកណ្តាល (ជួរទី ១០)
      if (c === 10) continue;

      const wealth = pickWealth(rng);
      let house: THREE.Group;
      let roof: string;

      if (wealth === 0) {
        roof = poorRoofs[Math.floor(rng() * poorRoofs.length)];
        house = createPoorHouse(roof);
      } else if (wealth === 1) {
        roof = middleRoofs[Math.floor(rng() * middleRoofs.length)];
        house = createMiddleHouse("#e8dcc4", roof);
      } else {
        roof = richRoofs[Math.floor(rng() * richRoofs.length)];
        house = createRichHouse("#fdfefe", roof);
      }

      const x = startX + c * spacingX;
      const z = startZ + r * spacingZ;
      house.position.set(x, 0, z);
      // បង្វិលទៅរកផ្លូវកណ្តាល
      house.rotation.y = c < 10 ? Math.PI / 2 : -Math.PI / 2;
      g.add(house);

      // បន្ថែមយានជំនិះតាមឋានៈ
      if (wealth === 2) {
        // ឡាន ១-២
        const carCount = rng() < 0.5 ? 2 : 1;
        for (let k = 0; k < carCount; k++) {
          const car = createCar(rng() < 0.5 ? "#c0392b" : "#2c3e50");
          car.position.set(x + 2 + k * 2.5, 0, z + 4);
          car.rotation.y = Math.PI / 2;
          g.add(car);
        }
      } else if (wealth === 1) {
        // ម៉ូតូ ១
        const bike = createMotorbike(rng() < 0.5 ? "#e74c3c" : "#34495e");
        bike.position.set(x + 2, 0, z + 4);
        bike.rotation.y = Math.PI / 2;
        g.add(bike);
      } else {
        // កង់ ១ (មិនមែនគ្រប់គ្នា)
        if (rng() < 0.6) {
          const bike = createBicycle();
          bike.position.set(x + 2, 0, z + 3.5);
          bike.rotation.y = Math.PI / 2;
          g.add(bike);
        }
      }

      built++;
    }
  }

  return g;
}

/* ============================================================
   ផ្លូវ + ដី
   ============================================================ */
export function createVillageRoads(): THREE.Group {
  const g = new THREE.Group();
  const roadMat = mat("#5d6d7e", { roughness: 1 });
  const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(200, 0.1, 10), roadMat);
  mainRoad.position.set(0, 0.05, 0);
  mainRoad.receiveShadow = true;
  g.add(mainRoad);
  const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(10, 0.1, 200), roadMat);
  crossRoad.position.set(0, 0.05, 0);
  crossRoad.receiveShadow = true;
  g.add(crossRoad);
  return g;
}

export function createVillageGround(): THREE.Mesh {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    mat("#7cb342", { roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  return ground;
}

/* ============================================================
   Deterministic random (seed)
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

/* ============================================================
   បរិវេណជុំវិញ Hospital — ផ្ទះ ២៥, ផ្សារ ២, ដើមឈើ
   ============================================================ */
export function createHospitalSurroundings(): THREE.Group {
  const g = new THREE.Group();
  const rng = mulberry32(777);

  // ផ្ទះ ២៥ ខ្នង ជុំវិញ radius ៤០-៦៥
  for (let i = 0; i < 25; i++) {
    const angle = (i / 25) * Math.PI * 2 + rng() * 0.3;
    const radius = 45 + rng() * 20;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // លាយឋានៈ
    const wealth = pickWealth(rng);
    let house: THREE.Group;
    if (wealth === 0) {
      house = createPoorHouse("#8b4513");
    } else if (wealth === 1) {
      house = createMiddleHouse("#e8dcc4", "#8d6e63");
    } else {
      house = createRichHouse("#fdfefe", "#2c3e50");
    }

    house.position.set(x, 0, z);
    // បង្វិលទៅរកកណ្តាល (hospital)
    house.rotation.y = Math.atan2(-x, -z);
    g.add(house);
  }

  // ផ្សារ ២ ជ្រុង
  const market1 = createMarketStall("#e74c3c");
  market1.position.set(-50, 0, 30);
  g.add(market1);

  const market2 = createMarketStall("#f39c12");
  market2.position.set(50, 0, 30);
  g.add(market2);

  // ដើមឈើ ១២ (ប្រើ geometry ពី hospitalGeometry បើមាន)
  const treeMat = new THREE.MeshStandardMaterial({ color: "#2d6a4f", roughness: 1 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: "#5d4037", roughness: 1 });
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + rng() * 0.5;
    const radius = 70 + rng() * 15;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.5, 2, 8),
      trunkMat
    );
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;
    g.add(trunk);

    const leaves = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      treeMat
    );
    leaves.position.set(x, 3.5, z);
    leaves.castShadow = true;
    g.add(leaves);
  }

  return g;
}
