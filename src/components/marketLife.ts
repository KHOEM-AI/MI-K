import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   អ្នកលក់ដូរ (Vendor) — ឈរនៅតុលក់
   ============================================================ */
export function createVendor(shirtColor = "#3498db"): THREE.Group {
  const g = new THREE.Group();

  // តួ
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, 1.2, 8),
    mat(shirtColor)
  );
  body.position.y = 1.2;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 10, 10),
    mat("#f5cba7")
  );
  head.position.y = 2.05;
  head.castShadow = true;
  g.add(head);

  // មួក (optional)
  const hat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.1, 12),
    mat("#e67e22")
  );
  hat.position.y = 2.25;
  g.add(hat);

  // ដៃ ២
  [-0.35, 0.35].forEach((x) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6),
      mat(shirtColor)
    );
    arm.position.set(x, 1.3, 0);
    arm.rotation.z = x > 0 ? -0.3 : 0.3;
    arm.name = "arm";
    g.add(arm);
  });

  return g;
}

/* ============================================================
   រទេះរុញ (Cart)
   ============================================================ */
export function createCart(): THREE.Group {
  const g = new THREE.Group();

  // តួរទេះ
  const cart = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.8, 1.8),
    mat("#8b6f47", { roughness: 1 })
  );
  cart.position.y = 1;
  cart.castShadow = true;
  g.add(cart);

  // ដៃរទេះ
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 1.2, 6),
    mat("#5d4037")
  );
  handle.rotation.x = Math.PI / 2;
  handle.position.set(0, 1.5, 1);
  g.add(handle);

  // កង់ ២
  [-0.4, 0.4].forEach((z) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12),
      mat("#2c3e50")
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.4, z);
    g.add(wheel);
  });

  // ផ្លែឈើលើរទេះ
  const fruitColors = ["#e74c3c", "#f39c12", "#27ae60", "#f1c40f"];
  for (let i = 0; i < 6; i++) {
    const fruit = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      mat(fruitColors[i % fruitColors.length])
    );
    fruit.position.set(
      (Math.random() - 0.5) * 0.8,
      1.5,
      -0.5 + (i / 6) * 1.2
    );
    g.add(fruit);
  }

  return g;
}

/* ============================================================
   អ្នកទិញ (Shopper) — ដើរតាមផ្សារ
   ============================================================ */
export interface Shopper {
  mesh: THREE.Group;
  path: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  legPhase: number;
}

export function createShopper(shirtColor: string): THREE.Group {
  return createVendor(shirtColor);
}

/* ============================================================
   បង្កើតជីវិតផ្សារ (Market Life)
   ============================================================ */
export function createMarketLife(): {
  group: THREE.Group;
  shoppers: Shopper[];
} {
  const group = new THREE.Group();
  const shoppers: Shopper[] = [];

  // ឈរនៅតុលក់ (៤ ផ្សារ × ២ អ្នក = ៨)
  const marketPositions = [
    { x: -70, z: 60 },
    { x: 70, z: 60 },
    { x: -70, z: -60 },
    { x: 70, z: -60 },
  ];
  const vendorColors = ["#3498db", "#e74c3c", "#f39c12", "#27ae60", "#9b59b6", "#1abc9c", "#e67e22", "#2c3e50"];

  let idx = 0;
  marketPositions.forEach(({ x, z }) => {
    // អ្នកលក់ ២ នៅផ្សារនីមួយៗ
    for (let k = 0; k < 2; k++) {
      const vendor = createVendor(vendorColors[idx % vendorColors.length]);
      vendor.position.set(x + (k === 0 ? -1 : 1), 0, z);
      group.add(vendor);
      idx++;
    }
  });

  // រទេះរុញ ២ នៅផ្សារធំ ៗ
  [-1, 1].forEach((side) => {
    const cart = createCart();
    cart.position.set(side * 60, 0, 50);
    group.add(cart);
  });

  // អ្នកទិញ ១២ ដើរតាមផ្លូវថ្មើរជើងផ្សារ
  const shopperPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-90, 0, 70),
    new THREE.Vector3(-50, 0, 70),
    new THREE.Vector3(-50, 0, 50),
    new THREE.Vector3(50, 0, 50),
    new THREE.Vector3(50, 0, 70),
    new THREE.Vector3(90, 0, 70),
    new THREE.Vector3(90, 0, -70),
    new THREE.Vector3(-90, 0, -70),
    new THREE.Vector3(-90, 0, 70),
  ], true);

  for (let i = 0; i < 12; i++) {
    const shopper = createShopper(vendorColors[(i + 3) % vendorColors.length]);
    shopper.scale.setScalar(0.9);
    group.add(shopper);
    shoppers.push({
      mesh: shopper,
      path: shopperPath,
      speed: 0.01 + Math.random() * 0.005,
      offset: i / 12,
      legPhase: Math.random() * Math.PI * 2,
    });
  }

  return { group, shoppers };
}

export function updateShoppers(shoppers: Shopper[], elapsed: number): void {
  shoppers.forEach((s) => {
    const t = (s.offset + s.speed * elapsed) % 1;
    const point = s.path.getPointAt(t);
    const tangent = s.path.getTangentAt(t);

    s.mesh.position.copy(point);
    s.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

    // ដៃបក់ (ញាក់)
    s.mesh.traverse((child) => {
      if (child.name === "arm") {
        child.rotation.z = Math.sin(elapsed * 4 + s.legPhase) * 0.3;
      }
    });
  });
}
