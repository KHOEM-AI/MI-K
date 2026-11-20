import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05, ...opts });

/* ============================================================
   ប្រាសាទបុរាណ (Ancient Temple)
   ============================================================ */
export function createAncientTemple(): THREE.Group {
  const g = new THREE.Group();
  const stoneMat = mat("#8b7355", { roughness: 1 });
  const mossMat = mat("#4a5d23", { roughness: 1 });
  const goldMat = mat("#d4af37", { metalness: 0.8, roughness: 0.3 });

  // ជណ្តើរ ៥ ជាន់
  for (let i = 0; i < 5; i++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(20 - i * 2, 1, 20 - i * 2),
      stoneMat
    );
    step.position.y = i * 1;
    step.castShadow = true;
    step.receiveShadow = true;
    g.add(step);
  }

  // ប្រាសាទកណ្តាល
  const baseY = 5;
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(8, 12, 8),
    stoneMat
  );
  tower.position.y = baseY + 6;
  tower.castShadow = true;
  g.add(tower);

  // កំពូល (Cone ជាន់ ៗ)
  [3, 2.5, 2, 1.5, 1].forEach((size, i) => {
    const top = new THREE.Mesh(
      new THREE.ConeGeometry(size, 2, 4),
      stoneMat
    );
    top.position.y = baseY + 12 + i * 1.5;
    top.rotation.y = Math.PI / 4;
    top.castShadow = true;
    g.add(top);
  });

  // កំពូលមាស
  const spire = new THREE.Mesh(
    new THREE.ConeGeometry(0.5, 3, 4),
    goldMat
  );
  spire.position.y = baseY + 21;
  spire.castShadow = true;
  g.add(spire);

  // សសរជុំវិញ ៤
  [[-5, -5], [5, -5], [-5, 5], [5, 5]].forEach(([x, z]) => {
    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 1, 10, 8),
      stoneMat
    );
    pillar.position.set(x, baseY + 5, z);
    pillar.castShadow = true;
    g.add(pillar);
  });

  // ស្នាមម៉ូស (moss) តាមជញ្ជាំង
  for (let i = 0; i < 6; i++) {
    const moss = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.3, 1.5),
      mossMat
    );
    moss.position.set(
      (Math.random() - 0.5) * 10,
      baseY + Math.random() * 10,
      (Math.random() - 0.5) * 10
    );
    g.add(moss);
  }

  return g;
}

/* ============================================================
   ហាងលក់វត្ថុបុរាណ (Antique Shop)
   ============================================================ */
export function createAntiqueShop(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = mat("#5d4037", { roughness: 0.9 });
  const roofMat = mat("#3e2723", { roughness: 0.9 });
  const goldMat = mat("#d4af37", { metalness: 0.8, roughness: 0.3 });

  // អគារឈើ
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(8, 5, 6),
    woodMat
  );
  base.position.y = 2.5;
  base.castShadow = true;
  base.receiveShadow = true;
  g.add(base);

  // ដំបូល
  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(6, 3, 4),
    roofMat
  );
  roof.position.y = 7;
  roof.rotation.y = Math.PI / 4;
  roof.castShadow = true;
  g.add(roof);

  // ទ្វារ
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 3, 0.1),
    mat("#2c1810")
  );
  door.position.set(0, 1.5, 3.05);
  g.add(door);

  // បង្អួច ២ (បើកពេលយប់)
  [-2, 2].forEach((x) => {
    const windowMat = new THREE.MeshStandardMaterial({
      color: "#f5e6ca",
      emissive: "#ffcc66",
      emissiveIntensity: 0,
    });
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), windowMat);
    win.position.set(x, 3, 3.05);
    win.name = "antiqueWindow";
    g.add(win);
  });

  // ផ្ទាំងសញ្ញា (មាស)
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.8, 0.1),
    goldMat
  );
  sign.position.set(0, 4.5, 3.05);
  g.add(sign);

  // វត្ថុបុរាណតាំងបង្ហាញ (ក្រៅ)
  // ថូរ
  [-2.5, 2.5].forEach((x) => {
    const vase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8),
      goldMat
    );
    vase.position.set(x, 0.6, 3.5);
    vase.castShadow = true;
    g.add(vase);
  });

  // រូបចម្លាក់តូច
  const statue = new THREE.Mesh(
    new THREE.ConeGeometry(0.4, 1.5, 6),
    mat("#8b7355")
  );
  statue.position.set(0, 0.75, 4);
  statue.castShadow = true;
  g.add(statue);

  return g;
}

/* ============================================================
   បង្កើតតំបន់បុរាណ (Ancient Zone) — ប្រាសាទ + ហាង
   ============================================================ */
export function createAncientZone(): {
  group: THREE.Group;
  temple: THREE.Group;
  shop: THREE.Group;
  windowMats: THREE.MeshStandardMaterial[];
} {
  const group = new THREE.Group();
  const windowMats: THREE.MeshStandardMaterial[] = [];

  // ប្រាសាទ (ជ្រុងខាងលិចជើង)
  const temple = createAncientTemple();
  temple.position.set(-180, 0, 200);
  group.add(temple);

  // ហាងបុរាណ (ជិតប្រាសាទ)
  const shop = createAntiqueShop();
  shop.position.set(-150, 0, 180);
  shop.rotation.y = Math.PI / 4;
  group.add(shop);

  // ប្រមូល window materials សម្រាប់បើកពេលយប់
  shop.traverse((child) => {
    if (child.name === "antiqueWindow") {
      const m = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      if (m.emissive !== undefined) windowMats.push(m);
    }
  });

  return { group, temple, shop, windowMats };
}

export function updateAncientZone(
  windowMats: THREE.MeshStandardMaterial[],
  hour: number
): void {
  const isNightTime = hour >= 18 || hour < 6;
  const target = isNightTime ? 1.5 : 0;
  windowMats.forEach((m) => {
    m.emissiveIntensity += (target - m.emissiveIntensity) * 0.05;
  });
}
