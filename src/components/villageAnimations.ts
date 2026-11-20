import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   B. ស្រូវបក់តាមខ្យល់
   ============================================================ */
export interface SwayCrop {
  mesh: THREE.Mesh;
  baseX: number;
  baseZ: number;
  phase: number;
  amplitude: number;
}

export function createSwayCrops(
  count = 256,
  centerX = 0,
  centerZ = 0,
  spread = 30
): { group: THREE.Group; crops: SwayCrop[] } {
  const group = new THREE.Group();
  const crops: SwayCrop[] = [];
  const riceMat = mat("#7cb342", { roughness: 1 });

  for (let i = 0; i < count; i++) {
    const x = centerX + (Math.random() - 0.5) * spread;
    const z = centerZ + (Math.random() - 0.5) * spread;

    const crop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.15, 0.8, 4),
      riceMat
    );
    crop.position.set(x, 0.4, z);
    crop.castShadow = true;
    group.add(crop);

    crops.push({
      mesh: crop,
      baseX: x,
      baseZ: z,
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.05 + Math.random() * 0.05,
    });
  }

  return { group, crops };
}

export function updateSwayCrops(crops: SwayCrop[], elapsed: number): void {
  crops.forEach((c) => {
    // បក់តាម sin wave
    const sway = Math.sin(elapsed * 2 + c.phase) * c.amplitude;
    c.mesh.rotation.z = sway;
    c.mesh.rotation.x = sway * 0.5;
  });
}

/* ============================================================
   B2. បន្លែក្នុងចម្ការបក់
   ============================================================ */
export interface SwayVeg {
  mesh: THREE.Mesh;
  phase: number;
  amplitude: number;
}

export function createSwayVeggies(
  count = 100,
  centerX = 0,
  centerZ = 0,
  spread = 20
): { group: THREE.Group; veggies: SwayVeg[] } {
  const group = new THREE.Group();
  const veggies: SwayVeg[] = [];
  const vegColors = ["#27ae60", "#e74c3c", "#f39c12", "#f1c40f"];

  for (let i = 0; i < count; i++) {
    const x = centerX + (Math.random() - 0.5) * spread;
    const z = centerZ + (Math.random() - 0.5) * spread;

    const veg = new THREE.Mesh(
      new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 8, 8),
      mat(vegColors[i % vegColors.length])
    );
    veg.position.set(x, 0.3, z);
    veg.castShadow = true;
    group.add(veg);

    veggies.push({
      mesh: veg,
      phase: Math.random() * Math.PI * 2,
      amplitude: 0.08 + Math.random() * 0.06,
    });
  }

  return { group, veggies };
}

export function updateSwayVeggies(veggies: SwayVeg[], elapsed: number): void {
  veggies.forEach((v) => {
    const sway = Math.sin(elapsed * 2.5 + v.phase) * v.amplitude;
    v.mesh.rotation.z = sway;
  });
}

/* ============================================================
   C. ពពករសាត់លើមេឃ
   ============================================================ */
export interface DriftCloud {
  mesh: THREE.Group;
  speed: number;
  direction: number;
  startX: number;
  startZ: number;
}

export function createCloud(
  scale = 1,
  color = "#ffffff"
): THREE.Group {
  const g = new THREE.Group();
  const cloudMat = mat(color, {
    roughness: 1,
    transparent: true,
    opacity: 0.9,
  });

  // បង្កើតពពកពី sphere ៤-៦ តូច ៗ
  const puffCount = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < puffCount; i++) {
    const size = 2 + Math.random() * 2;
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(size, 8, 8),
      cloudMat
    );
    puff.position.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 4
    );
    puff.castShadow = false;
    g.add(puff);
  }

  g.scale.setScalar(scale);
  return g;
}

export function createClouds(
  count = 15,
  skyY = 100,
  spread = 500
): { group: THREE.Group; clouds: DriftCloud[] } {
  const group = new THREE.Group();
  const clouds: DriftCloud[] = [];

  for (let i = 0; i < count; i++) {
    const scale = 2 + Math.random() * 3;
    const cloud = createCloud(scale);
    const x = (Math.random() - 0.5) * spread;
    const z = (Math.random() - 0.5) * spread;
    const y = skyY + Math.random() * 40;

    cloud.position.set(x, y, z);
    group.add(cloud);

    clouds.push({
      mesh: cloud,
      speed: 0.5 + Math.random() * 1.5,
      direction: Math.random() > 0.5 ? 1 : -1,
      startX: x,
      startZ: z,
    });
  }

  return { group, clouds };
}

export function updateClouds(
  clouds: DriftCloud[],
  elapsed: number,
  spread = 500
): void {
  clouds.forEach((c) => {
    // រសាត់តាម X axis
    const offset = c.speed * elapsed * c.direction;
    let newX = c.startX + offset;
    // Wrap around
    if (newX > spread / 2) newX -= spread;
    if (newX < -spread / 2) newX += spread;
    c.mesh.position.x = newX;
  });
}
