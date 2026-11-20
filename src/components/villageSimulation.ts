import * as THREE from "three";

/* ============================================================
   Village Registry — តាមដានផ្ទះនីមួយៗ
   ============================================================ */
export interface HouseInfo {
  id: number;
  x: number;
  z: number;
  wealth: 0 | 1 | 2; // 0=ក្រ, 1=កណ្តាល, 2=មាន
  familySize: number;
  hasLight: boolean;
  hasCar: boolean;
  hasBike: boolean;
  hasBicycle: boolean;
  windowMat: THREE.MeshStandardMaterial | null;
  light: THREE.PointLight | null;
}

export class VillageRegistry {
  houses: HouseInfo[] = [];
  totalFamilies = 0;
  totalPeople = 0;

  register(house: Omit<HouseInfo, "id">): number {
    const id = this.houses.length;
    this.houses.push({ ...house, id });
    this.totalFamilies++;
    this.totalPeople += house.familySize;
    return id;
  }

  getHouse(id: number): HouseInfo | undefined {
    return this.houses[id];
  }

  getHousesWithLight(): HouseInfo[] {
    return this.houses.filter((h) => h.hasLight);
  }

  getStats() {
    return {
      totalFamilies: this.totalFamilies,
      totalPeople: this.totalPeople,
      rich: this.houses.filter((h) => h.wealth === 2).length,
      middle: this.houses.filter((h) => h.wealth === 1).length,
      poor: this.houses.filter((h) => h.wealth === 0).length,
    };
  }
}

/* ============================================================
   Crop Cycle — វដ្តដាំដុះ
   ============================================================ */
export type CropStage = "seed" | "growing" | "mature" | "harvested";

export interface CropCycle {
  mesh: THREE.Mesh;
  stage: CropStage;
  timer: number;
  stageDuration: number;
  baseScale: number;
  phase: number;
}

export function createCropCycle(mesh: THREE.Mesh, baseScale = 1): CropCycle {
  return {
    mesh,
    stage: "seed",
    timer: 0,
    stageDuration: 15, // ១៥ វិនាទី/ដំណាក់
    baseScale,
    phase: Math.random() * Math.PI * 2,
  };
}

export function updateCropCycle(
  crop: CropCycle,
  delta: number,
  elapsed: number
): void {
  crop.timer += delta;

  // បក់តាមខ្យល់ (គ្រប់ដំណាក់)
  crop.mesh.rotation.z = Math.sin(elapsed * 2 + crop.phase) * 0.05;

  if (crop.timer >= crop.stageDuration) {
    crop.timer = 0;
    // ឆ្លងដំណាក់
    if (crop.stage === "seed") crop.stage = "growing";
    else if (crop.stage === "growing") crop.stage = "mature";
    else if (crop.stage === "mature") crop.stage = "harvested";
    else crop.stage = "seed"; // ចាប់ផ្តើមឡើងវិញ
  }

  // កំណត់ scale តាមដំណាក់
  let targetScale = crop.baseScale;
  let targetColor = 0x7cb342; // បៃតង

  if (crop.stage === "seed") {
    targetScale = crop.baseScale * 0.2;
    targetColor = 0x5d4037; // ត្នោត
  } else if (crop.stage === "growing") {
    targetScale = crop.baseScale * 0.6;
    targetColor = 0x7cb342; // បៃតងស្រាល
  } else if (crop.stage === "mature") {
    targetScale = crop.baseScale * 1.2;
    targetColor = 0xffd700; // មាស (ដល់ពេលប្រមូល)
  } else {
    targetScale = crop.baseScale * 0.1;
    targetColor = 0x5d4037; // ត្នោត (ប្រមូលហើយ)
  }

  crop.mesh.scale.setScalar(targetScale);
  const mat = crop.mesh.material as THREE.MeshStandardMaterial;
  if (mat) {
    mat.color.setHex(targetColor);
  }
}

/* ============================================================
   Smart Traffic — យានយន្តឈប់តាមភ្លើងស្តុប
   ============================================================ */
export interface SmartVehicle {
  mesh: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  currentT: number;
  stopped: boolean;
  // ចំណុចឈប់ (ជិតភ្លើងស្តុប)
  stopPoints: { t: number; lightIndex: number }[];
}

/* បង្កើត smart traffic ដែលឈប់តាមភ្លើង */
export function createSmartTraffic(
  vehicles: THREE.Group[],
  curve: THREE.CatmullRomCurve3,
  stopPoints: { t: number; lightIndex: number }[]
): SmartVehicle[] {
  return vehicles.map((mesh, i) => ({
    mesh,
    curve,
    speed: 0.015 + Math.random() * 0.008,
    offset: i / vehicles.length,
    currentT: i / vehicles.length,
    stopped: false,
    stopPoints,
  }));
}

export function updateSmartTraffic(
  vehicles: SmartVehicle[],
  lightPhases: number[], // 0=ក្រហម, 1=លឿង, 2=បៃតង
  delta: number
): void {
  vehicles.forEach((v) => {
    // ពិនិត្យ stop points
    let shouldStop = false;
    for (const sp of v.stopPoints) {
      const distToStop = Math.abs(v.currentT - sp.t);
      if (distToStop < 0.01) {
        // ជិតភ្លើង → ឈប់បើក្រហម/លឿង
        const phase = lightPhases[sp.lightIndex] ?? 2;
        if (phase !== 2) {
          shouldStop = true;
        }
      }
    }

    v.stopped = shouldStop;

    if (!shouldStop) {
      v.currentT = (v.currentT + v.speed) % 1;
    }

    const point = v.curve.getPointAt(v.currentT);
    const tangent = v.curve.getTangentAt(v.currentT);
    v.mesh.position.copy(point);
    v.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

    // បង្វិលកង់
    v.mesh.traverse((child) => {
      if (child.name === "wheel") {
        if (!shouldStop) child.rotation.x += v.speed * 30;
      }
    });
  });
}
