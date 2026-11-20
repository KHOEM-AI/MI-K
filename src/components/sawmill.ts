import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0.05, ...opts });

/* ============================================================
   រោងចក្រកែច្នៃឈើ (Sawmill)
   ============================================================ */
export function createSawmill(): THREE.Group {
  const g = new THREE.Group();

  // អគារធំ
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(25, 8, 18),
    mat("#8b6f47", { roughness: 0.9 })
  );
  building.position.y = 4;
  building.castShadow = true;
  building.receiveShadow = true;
  g.add(building);

  // ដំបូល (ជម្រាល ២ ចំហៀង)
  const roofLeft = new THREE.Mesh(
    new THREE.BoxGeometry(13, 0.4, 18),
    mat("#5d4037")
  );
  roofLeft.position.set(-6, 9, 0);
  roofLeft.rotation.z = 0.4;
  g.add(roofLeft);

  const roofRight = new THREE.Mesh(
    new THREE.BoxGeometry(13, 0.4, 18),
    mat("#5d4037")
  );
  roofRight.position.set(6, 9, 0);
  roofRight.rotation.z = -0.4;
  g.add(roofRight);

  // ច្រកចូលធំ
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(6, 6, 0.3),
    mat("#2c1810")
  );
  door.position.set(0, 3, 9.15);
  g.add(door);

  // ផ្ទាំងសញ្ញា "SAWMILL"
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(12, 1.5, 0.2),
    mat("#d4af37", { metalness: 0.8, roughness: 0.3 })
  );
  sign.position.set(0, 8, 9.2);
  g.add(sign);

  // បំពង់ផ្សែង ១
  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1.2, 6, 12),
    mat("#7f8c8d")
  );
  chimney.position.set(8, 11, 5);
  chimney.castShadow = true;
  g.add(chimney);

  // បន្ទះឈើ (planks) តាំងជាន់ ១០
  const plankColors = ["#8b6f47", "#a0522d", "#6d4c41"];
  for (let i = 0; i < 10; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.2, 1),
      mat(plankColors[i % plankColors.length])
    );
    plank.position.set(-15 + (i % 5) * 4.5, 0.1 + Math.floor(i / 5) * 0.3, 12);
    plank.castShadow = true;
    g.add(plank);
  }

  // ដុំឈើធំ ៗ ៦ (logs) ខាងក្រៅ
  for (let i = 0; i < 6; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(1, 1, 4, 8),
      mat("#5d4037", { roughness: 1 })
    );
    log.rotation.z = Math.PI / 2;
    log.position.set(15 + (i % 3) * 2.5, 1, 8 + Math.floor(i / 3) * 2.5);
    log.castShadow = true;
    g.add(log);
  }

  // ម៉ាស៊ីនកាត់ឈើ (saw blade) ១
  const sawBase = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.5, 4),
    mat("#34495e")
  );
  sawBase.position.set(12, 0.25, -12);
  g.add(sawBase);

  const blade = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16),
    mat("#95a5a6", { metalness: 0.8, roughness: 0.2 })
  );
  blade.rotation.z = Math.PI / 2;
  blade.position.set(12, 1, -12);
  blade.name = "sawBlade";
  g.add(blade);

  // ផលិតផលសម្រេច (ទូ, គ្រែ, ក្ដារ) ៣ តាំង
  // ទូ
  const cabinet = new THREE.Mesh(
    new THREE.BoxGeometry(2, 3, 1.2),
    mat("#8b6f47")
  );
  cabinet.position.set(-12, 1.5, -12);
  cabinet.castShadow = true;
  g.add(cabinet);

  // គ្រែ
  const bedBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.5, 4),
    mat("#a0522d")
  );
  bedBase.position.set(-8, 0.5, -12);
  g.add(bedBase);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.3, 3.8),
    mat("#ffffff", { roughness: 1 })
  );
  mattress.position.set(-8, 0.9, -12);
  g.add(mattress);

  // ក្ដារ (planks) ៣ តាំង
  for (let i = 0; i < 3; i++) {
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.15, 1),
      mat(plankColors[i % plankColors.length])
    );
    plank.position.set(-3, 0.5 + i * 0.2, -12);
    g.add(plank);
  }

  return g;
}

/* ============================================================
   Update Sawmill (blade បង្វិល)
   ============================================================ */
export function updateSawmill(
  blade: THREE.Mesh | null,
  elapsed: number
): void {
  if (blade) {
    blade.rotation.x = elapsed * 5;
  }
}
