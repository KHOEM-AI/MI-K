import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

export function createVillageHouse(color = "#e8dcc4", roofColor = "#8b4513"): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 3.2), mat(color));
  base.position.y = 1.2;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), mat(roofColor));
  roof.position.y = 3.1;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.05), mat("#5d4037"));
  door.position.set(0, 0.75, 1.61);
  g.add(door);
  [-1, 1].forEach((x) => {
    const w = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.05),
      mat("#87ceeb", { emissive: "#87ceeb", emissiveIntensity: 0.3 })
    );
    w.position.set(x * 0.9, 1.5, 1.61);
    g.add(w);
  });
  return g;
}

export function createMarketStall(color = "#e74c3c"): THREE.Group {
  const g = new THREE.Group();
  [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), mat("#8d6e63"));
    p.position.set(x, 1.2, z);
    p.castShadow = true;
    g.add(p);
  });
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.4, 0.9, 4),
    mat(color, { side: THREE.DoubleSide })
  );
  roof.position.y = 2.7;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.15, 2.6), mat("#a0522d"));
  table.position.y = 0.85;
  g.add(table);
  ["#e74c3c", "#f39c12", "#27ae60", "#f1c40f"].forEach((c, i) => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), mat(c));
    f.position.set(-0.9 + i * 0.6, 1.05, 0.4);
    g.add(f);
  });
  return g;
}

export function createPhoneShop(): THREE.Group {
  const g = new THREE.Group();
  const shop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.8, 3), mat("#ecf0f1"));
  shop.position.y = 1.4;
  shop.castShadow = true;
  shop.receiveShadow = true;
  g.add(shop);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.2, 3.3), mat("#2c3e50"));
  roof.position.y = 2.9;
  g.add(roof);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.6, 0.1),
    mat("#3498db", { emissive: "#3498db", emissiveIntensity: 0.6 })
  );
  sign.position.set(0, 2.3, 1.55);
  g.add(sign);
  for (let i = 0; i < 4; i++) {
    const phone = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.24, 0.03),
      mat(i % 2 ? "#111" : "#555", { metalness: 0.6, roughness: 0.3 })
    );
    phone.position.set(-0.9 + i * 0.6, 1.2, 1.55);
    g.add(phone);
  }
  return g;
}

export function createClothingShop(): THREE.Group {
  const g = new THREE.Group();
  const shop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.8, 3), mat("#fdfefe"));
  shop.position.y = 1.4;
  shop.castShadow = true;
  shop.receiveShadow = true;
  g.add(shop);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.2, 3.3), mat("#c0392b"));
  roof.position.y = 2.9;
  g.add(roof);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.6, 0.1),
    mat("#e91e63", { emissive: "#e91e63", emissiveIntensity: 0.5 })
  );
  sign.position.set(0, 2.3, 1.55);
  g.add(sign);
  ["#e74c3c", "#3498db", "#27ae60", "#f39c12"].forEach((c, i) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.05), mat(c));
    s.position.set(-1.2 + i * 0.8, 1.5, 1.55);
    g.add(s);
  });
  return g;
}

export function createMotorbikeShop(): THREE.Group {
  const g = new THREE.Group();
  const shop = new THREE.Mesh(new THREE.BoxGeometry(4.5, 3, 3.5), mat("#d5dbdb"));
  shop.position.y = 1.5;
  shop.castShadow = true;
  shop.receiveShadow = true;
  g.add(shop);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.25, 3.9), mat("#1a1a1a"));
  roof.position.y = 3.1;
  g.add(roof);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.7, 0.1),
    mat("#e67e22", { emissive: "#e67e22", emissiveIntensity: 0.6 })
  );
  sign.position.set(0, 2.5, 1.8);
  g.add(sign);
  for (let i = 0; i < 3; i++) {
    const bike = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.5, 0.5),
      mat(i % 2 ? "#c0392b" : "#2c3e50")
    );
    body.position.y = 0.6;
    bike.add(body);
    [-0.4, 0.4].forEach((x) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12), mat("#111"));
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.3, 0);
      bike.add(wheel);
    });
    bike.position.set(-1.4 + i * 1.4, 0, 1.9);
    g.add(bike);
  }
  return g;
}

export function createBikeShop(): THREE.Group {
  const g = new THREE.Group();
  const shop = new THREE.Mesh(new THREE.BoxGeometry(4, 2.8, 3.2), mat("#f9e79f"));
  shop.position.y = 1.4;
  shop.castShadow = true;
  shop.receiveShadow = true;
  g.add(shop);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.2, 3.5), mat("#7d6608"));
  roof.position.y = 2.9;
  g.add(roof);
  for (let i = 0; i < 4; i++) {
    const bike = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.04, 6, 12),
      mat("#2980b9", { metalness: 0.6 })
    );
    frame.rotation.y = Math.PI / 2;
    frame.position.y = 0.5;
    bike.add(frame);
    [-0.35, 0.35].forEach((x) => {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 16), mat("#222"));
      wheel.rotation.y = Math.PI / 2;
      wheel.position.set(x, 0.3, 0);
      bike.add(wheel);
    });
    bike.position.set(-1.4 + i * 0.9, 0, 1.7);
    g.add(bike);
  }
  return g;
}

export function createMeatVegFactory(): THREE.Group {
  const g = new THREE.Group();
  const main = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 14), mat("#bdc3c7"));
  main.position.y = 4;
  main.castShadow = true;
  main.receiveShadow = true;
  g.add(main);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(20.6, 0.4, 14.6), mat("#7f8c8d"));
  roof.position.y = 8.2;
  g.add(roof);
  [-6, 6].forEach((x) => {
    const chimney = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.1, 6, 16),
      mat("#95a5a6", { metalness: 0.4 })
    );
    chimney.position.set(x, 11, 4);
    chimney.castShadow = true;
    g.add(chimney);
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 0.3), mat("#2c3e50"));
  door.position.set(0, 2.5, 7.1);
  g.add(door);
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(10, 1.2, 0.2),
    mat("#27ae60", { emissive: "#27ae60", emissiveIntensity: 0.7 })
  );
  sign.position.set(0, 7, 7.15);
  g.add(sign);
  ["#e67e22", "#c0392b", "#27ae60"].forEach((c, i) => {
    for (let k = 0; k < 2; k++) {
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), mat(c));
      crate.position.set(-8 + (i * 2 + k) * 2.8, 0.6, -8.5);
      crate.castShadow = true;
      g.add(crate);
    }
  });
  return g;
}

export function createVillageHouses(count = 300): THREE.Group {
  const g = new THREE.Group();
  const cols = 20;
  const rows = Math.ceil(count / cols);
  const spacingX = 5.5;
  const spacingZ = 6.5;
  const startX = -((cols - 1) * spacingX) / 2;
  const startZ = -((rows - 1) * spacingZ) / 2;
  const houseColors = ["#f5e6ca", "#e8dcc4", "#f0e0d0", "#ddd4b8"];
  const roofColors = ["#8b4513", "#a0522d", "#6b3410", "#8d6e63"];
  let built = 0;
  for (let r = 0; r < rows && built < count; r++) {
    for (let c = 0; c < cols && built < count; c++) {
      if (c === 10) continue;
      const h = createVillageHouse(
        houseColors[(r + c) % houseColors.length],
        roofColors[(r * 3 + c) % roofColors.length]
      );
      h.position.set(startX + c * spacingX, 0, startZ + r * spacingZ);
      h.rotation.y = ((r * 7 + c * 3) % 4) * (Math.PI / 2);
      g.add(h);
      built++;
    }
  }
  return g;
}

export function createVillageRoads(): THREE.Group {
  const g = new THREE.Group();
  const roadMat = mat("#5d6d7e", { roughness: 1 });
  const mainRoad = new THREE.Mesh(new THREE.BoxGeometry(80, 0.1, 6), roadMat);
  mainRoad.position.set(0, 0.05, 40);
  mainRoad.receiveShadow = true;
  g.add(mainRoad);
  const crossRoad = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 80), roadMat);
  crossRoad.position.set(0, 0.05, 0);
  crossRoad.receiveShadow = true;
  g.add(crossRoad);
  return g;
}

export function createVillageGround(): THREE.Mesh {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    mat("#7cb342", { roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  return ground;
}
