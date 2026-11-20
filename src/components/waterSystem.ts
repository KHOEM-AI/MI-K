import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   ត្រីហែលក្នុងស្រះ (Fish)
   ============================================================ */
export interface Fish {
  mesh: THREE.Group;
  angle: number;
  radius: number;
  speed: number;
  centerX: number;
  centerZ: number;
  y: number;
  phase: number;
}

export function createFish(color = "#e67e22"): THREE.Group {
  const g = new THREE.Group();

  // តួត្រី
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 8, 8),
    mat(color, { metalness: 0.3, roughness: 0.5 })
  );
  body.scale.set(1.8, 0.7, 1);
  g.add(body);

  // កន្ទុយ
  const tail = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.3, 4),
    mat(color)
  );
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-0.5, 0, 0);
  g.add(tail);

  // ភ្នែក
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 6),
    mat("#000")
  );
  eye.position.set(0.3, 0.1, 0.15);
  g.add(eye);

  return g;
}

export function createFishSchool(
  count = 20,
  centerX = 0,
  centerZ = 0,
  pondRadius = 40
): { group: THREE.Group; fishes: Fish[] } {
  const group = new THREE.Group();
  const fishes: Fish[] = [];
  const colors = ["#e67e22", "#f39c12", "#e74c3c", "#f1c40f", "#d35400"];

  for (let i = 0; i < count; i++) {
    const fish = createFish(colors[i % colors.length]);
    fish.scale.setScalar(0.6 + Math.random() * 0.4);
    group.add(fish);

    fishes.push({
      mesh: fish,
      angle: (i / count) * Math.PI * 2,
      radius: 5 + Math.random() * (pondRadius * 0.6),
      speed: 0.1 + Math.random() * 0.15,
      centerX,
      centerZ,
      y: 0.3 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
    });
  }

  return { group, fishes };
}

export function updateFishSchool(fishes: Fish[], elapsed: number): void {
  fishes.forEach((f) => {
    f.angle += f.speed * 0.016;
    const x = f.centerX + Math.cos(f.angle) * f.radius;
    const z = f.centerZ + Math.sin(f.angle) * f.radius;
    const y = f.y + Math.sin(elapsed * 3 + f.phase) * 0.05;

    f.mesh.position.set(x, y, z);
    // បង្វិលតាមទិសហែល
    f.mesh.rotation.y = f.angle + Math.PI / 2;
    // កន្ទុយបក់
    f.mesh.children[1].rotation.y = Math.sin(elapsed * 8 + f.phase) * 0.5;
  });
}

/* ============================================================
   រលកទឹក (Water Ripple) — ប្រើ Plane ជាមួយ vertex animation
   ============================================================ */
export interface WaterRipple {
  mesh: THREE.Mesh;
  originalPositions: Float32Array;
  phase: number;
}

export function createWaterRipple(
  size = 100,
  color = "#3498db"
): WaterRipple {
  const geometry = new THREE.PlaneGeometry(size, size, 32, 32);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.1,
    metalness: 0.4,
    transparent: true,
    opacity: 0.85,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.15;
  mesh.receiveShadow = true;

  const originalPositions = new Float32Array(
    geometry.attributes.position.array as Float32Array
  );

  return {
    mesh,
    originalPositions,
    phase: Math.random() * Math.PI * 2,
  };
}

export function updateWaterRipple(
  ripple: WaterRipple,
  elapsed: number
): void {
  const geo = ripple.mesh.geometry;
  const pos = geo.attributes.position.array as Float32Array;
  const orig = ripple.originalPositions;

  for (let i = 0; i < pos.length; i += 3) {
    const x = orig[i];
    const y = orig[i + 1];
    // Wave ២ ស្រទាប់
    const wave1 = Math.sin(x * 0.1 + elapsed * 1.5) * 0.2;
    const wave2 = Math.cos(y * 0.1 + elapsed * 1.2) * 0.2;
    // Plane បង្វិល x = -90 → y ຂອງ plane គឺ z ຂອງ world
    pos[i + 2] = wave1 + wave2;
  }

  geo.attributes.position.needsUpdate = true;
}

/* ============================================================
   ស្លឹកឈើជ្រុះ (Falling Leaves)
   ============================================================ */
export interface FallingLeaf {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotationSpeed: THREE.Vector3;
  startY: number;
  resetY: number;
  areaSize: number;
}

export function createFallingLeaves(
  count = 50,
  areaSize = 200
): { group: THREE.Group; leaves: FallingLeaf[] } {
  const group = new THREE.Group();
  const leaves: FallingLeaf[] = [];
  const leafColors = ["#27ae60", "#f39c12", "#e74c3c", "#f1c40f", "#2d5016"];

  for (let i = 0; i < count; i++) {
    const leaf = new THREE.Mesh(
      new THREE.PlaneGeometry(0.4, 0.6),
      new THREE.MeshStandardMaterial({
        color: leafColors[i % leafColors.length],
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
      })
    );

    const startY = 15 + Math.random() * 30;
    leaf.position.set(
      (Math.random() - 0.5) * areaSize,
      startY,
      (Math.random() - 0.5) * areaSize
    );
    leaf.rotation.z = Math.random() * Math.PI;
    group.add(leaf);

    leaves.push({
      mesh: leaf,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        -0.5 - Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      ),
      rotationSpeed: new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      ),
      startY,
      resetY: 0,
      areaSize,
    });
  }

  return { group, leaves };
}

export function updateFallingLeaves(
  leaves: FallingLeaf[],
  delta: number
): void {
  leaves.forEach((leaf) => {
    // ចលនាធ្លាក់
    leaf.mesh.position.y += leaf.velocity.y * delta * 10;
    leaf.mesh.position.x += leaf.velocity.x * delta * 2;
    leaf.mesh.position.z += leaf.velocity.z * delta * 2;

    // បង្វិល
    leaf.mesh.rotation.x += leaf.rotationSpeed.x * delta;
    leaf.mesh.rotation.y += leaf.rotationSpeed.y * delta;
    leaf.mesh.rotation.z += leaf.rotationSpeed.z * delta;

    // Reset បើធ្លាក់ដល់ដី
    if (leaf.mesh.position.y < 0.1) {
      leaf.mesh.position.set(
        (Math.random() - 0.5) * leaf.areaSize,
        leaf.startY,
        (Math.random() - 0.5) * leaf.areaSize
      );
    }
  });
}
