import { VillageRegistry, type HouseInfo } from "./villageSimulation";
import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   អ្នកស្រុក (Villager) — ដើរចេញ/ចូលផ្ទះ
   ============================================================ */
export interface Villager {
  mesh: THREE.Group;
  homePos: THREE.Vector3;
  workPos: THREE.Vector3;
  state: "home" | "walking-out" | "work" | "walking-home";
  progress: number; // 0-1
  speed: number;
  legPhase: number;
  shirtColor: string;
}

export function createVillager(shirtColor = "#3498db"): THREE.Group {
  const g = new THREE.Group();

  // តួ
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.9, 8),
    mat(shirtColor)
  );
  body.position.y = 1.05;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    mat("#f5cba7")
  );
  head.position.y = 1.7;
  head.castShadow = true;
  g.add(head);

  // ដៃ ២
  [-0.32, 0.32].forEach((x) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.7, 6),
      mat(shirtColor)
    );
    arm.position.set(x, 1.05, 0);
    arm.rotation.z = x > 0 ? -0.2 : 0.2;
    arm.name = "arm";
    g.add(arm);
  });

  // ជើង ២
  [-0.12, 0.12].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6),
      mat("#2c3e50")
    );
    leg.position.set(x, 0.3, 0);
    leg.name = "leg";
    g.add(leg);
  });

  return g;
}

/* ============================================================
   បង្កើតអ្នកស្រុក ៣០ នាក់
   ============================================================ */
export function createVillagers(count = 100): {
  group: THREE.Group;
  villagers: Villager[];
} {
  const group = new THREE.Group();
  const villagers: Villager[] = [];
  const shirtColors = ["#3498db", "#e74c3c", "#f39c12", "#27ae60", "#9b59b6", "#1abc9c", "#e67e22", "#2c3e50"];

  // ផ្ទះ ៣០ (positions តាម grid ដូច villageGeometry)
  const cols = 20;
  const spacingX = 9;
  const spacingZ = 10;
  const startX = -((cols - 1) * spacingX) / 2;
  const startZ = -50;

  let built = 0;
  for (let r = 0; r < 15 && built < count; r++) {
    for (let c = 0; c < cols && built < count; c++) {
      if (c === 10) continue;
      const x = startX + c * spacingX;
      const z = startZ + r * spacingZ;

      // កន្លែងធ្វើការ (រោងចក្រ, ផ្សារ, ចម្ការ)
      const workSpots: [number, number][] = [
        [0, -110],   // រោងចក្រ
        [-70, 60], [70, 60], [-70, -60], [70, -60], // ផ្សារ
        [-140, 120], [140, 120], [-140, -120], [140, -120], // ស្រែ
      ];
      const work = workSpots[built % workSpots.length];

      const villager = createVillager(shirtColors[built % shirtColors.length]);
      villager.position.set(x, 0, z);
      group.add(villager);

      villagers.push({
        mesh: villager,
        homePos: new THREE.Vector3(x, 0, z),
        workPos: new THREE.Vector3(work[0], 0, work[1]),
        state: "home",
        progress: 0,
        speed: 0.005 + Math.random() * 0.003,
        legPhase: Math.random() * Math.PI * 2,
        shirtColor: shirtColors[built % shirtColors.length],
      });
      built++;
    }
  }

  return { group, villagers };
}

/* ============================================================
   Update Villagers (ចេញពេលព្រឹក, ត្រឡប់ពេលល្ងាច)
   ============================================================ */
export function updateVillagers(
  villagers: Villager[],
  hour: number,
  elapsed: number
): void {
  // ម៉ោង ៦-៨: ចេញពីផ្ទះ
  // ម៉ោង ៨-១៧: ធ្វើការ
  // ម៉ោង ១៧-១៩: ត្រឡប់មកផ្ទះ
  // ម៉ោង ១៩-៦: នៅផ្ទះ

  const shouldBeOut = hour >= 7 && hour < 18;
  const shouldWalkOut = hour >= 6 && hour < 7;
  const shouldWalkHome = hour >= 17 && hour < 18.5;

  villagers.forEach((v) => {
    if (shouldWalkOut && v.state === "home") {
      v.state = "walking-out";
      v.progress = 0;
    } else if (shouldWalkHome && v.state === "work") {
      v.state = "walking-home";
      v.progress = 0;
    } else if (!shouldBeOut && !shouldWalkOut && !shouldWalkHome && v.state === "work") {
      v.state = "walking-home";
      v.progress = 0;
    }

    if (v.state === "walking-out" || v.state === "walking-home") {
      v.progress += v.speed;
      if (v.progress >= 1) {
        v.state = v.state === "walking-out" ? "work" : "home";
        v.progress = 0;
      }

      // គណនាទីតាំងតាម interpolation
      const from = v.state === "walking-out" ? v.homePos : v.workPos;
      const to = v.state === "walking-out" ? v.workPos : v.homePos;
      const t = Math.min(1, v.progress);
      const x = from.x + (to.x - from.x) * t;
      const z = from.z + (to.z - from.z) * t;
      v.mesh.position.set(x, 0, z);

      // បង្វិលតាមទិសដើរ
      v.mesh.rotation.y = Math.atan2(to.x - from.x, to.z - from.z);

      // ជើងញាក់
      v.mesh.traverse((child) => {
        if (child.name === "leg") {
          child.rotation.x = Math.sin(elapsed * 8 + v.legPhase) * 0.4;
        }
        if (child.name === "arm") {
          child.rotation.z = Math.sin(elapsed * 8 + v.legPhase) * 0.3;
        }
      });
    } else if (v.state === "work") {
      // នៅកន្លែងធ្វើការ (ដៃបក់បន្តិច)
      v.mesh.position.copy(v.workPos);
      v.mesh.traverse((child) => {
        if (child.name === "arm") {
          child.rotation.z = Math.sin(elapsed * 3 + v.legPhase) * 0.2;
        }
      });
    } else {
      // នៅផ្ទះ (សម្ងំ)
      v.mesh.position.copy(v.homePos);
    }
  });
}

/* ============================================================
   ភ្លើងផ្ទះ (House Lights) — បើក/បិទតាមម៉ោង
   ============================================================ */
export interface HouseLight {
  light: THREE.PointLight;
  windowMesh: THREE.Mesh;
  windowMat: THREE.MeshStandardMaterial;
}

export function createHouseLights(count = 300, registry?: VillageRegistry): {
  group: THREE.Group;
  lights: HouseLight[];
} {
  const group = new THREE.Group();
  const lights: HouseLight[] = [];

  const cols = 20;
  const spacingX = 9;
  const spacingZ = 10;
  const startX = -((cols - 1) * spacingX) / 2;
  const startZ = -50;

  // បង្កើត PointLight តែ ១០០ (សម្រាប់ performance)
  const LIGHT_COUNT = 100;

  let built = 0;
  for (let r = 0; r < 15 && built < count; r++) {
    for (let c = 0; c < cols && built < count; c++) {
      if (c === 10) continue;
      const x = startX + c * spacingX;
      const z = startZ + r * spacingZ;

      // Point light តែ ១០០ ដំបូង (ជិតកណ្តាល)
      let light: THREE.PointLight;
      if (built < LIGHT_COUNT) {
        light = new THREE.PointLight("#ffcc66", 0, 15);
        light.position.set(x, 3, z);
        light.castShadow = false;
        group.add(light);
      } else {
        light = new THREE.PointLight("#ffcc66", 0, 15);
        light.position.set(0, -100, 0); // លាក់
      }

      // បង្អួច emissive
      const windowMat = new THREE.MeshStandardMaterial({
        color: "#87ceeb",
        emissive: "#ffcc66",
        emissiveIntensity: 0,
      });
      const windowMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.05),
        windowMat
      );
      windowMesh.position.set(x + 1.5, 2, z + 1.6);
      group.add(windowMesh);

      // Register house
      if (registry) {
        const wealth = built % 3 === 0 ? 2 : built % 3 === 1 ? 1 : 0;
        // familySize deterministic: អ្នកមាន ៤-៦, កណ្តាល ៣-៥, ក្រ ២-៤
        const baseFamily = wealth === 2 ? 4 : wealth === 1 ? 3 : 2;
        const familySize = baseFamily + (built % 3);
        registry.register({
          x, z,
          wealth: wealth as 0 | 1 | 2,
          familySize,
          hasLight: true,
          hasCar: wealth === 2,
          hasBike: wealth === 1,
          hasBicycle: wealth === 0,
          windowMat,
          light,
        });
      }

      lights.push({ light, windowMesh, windowMat });
      built++;
    }
  }

  return { group, lights };
}

export function updateHouseLights(
  lights: HouseLight[],
  hour: number
): void {
  // បើកពេល ១៨-៦ ម៉ោង
  const isNightTime = hour >= 18 || hour < 6;
  // ស្រាល ៗ បន្តិច (ព្រលប់)
  const isDusk = hour >= 17 && hour < 18;
  const isDawn = hour >= 5 && hour < 7;

  const targetIntensity = isNightTime ? 1 : isDusk ? 0.6 : isDawn ? 0.4 : 0;
  const targetEmissive = isNightTime ? 1.5 : isDusk ? 0.8 : isDawn ? 0.5 : 0;

  lights.forEach((h) => {
    h.light.intensity += (targetIntensity - h.light.intensity) * 0.05;
    h.windowMat.emissiveIntensity += (targetEmissive - h.windowMat.emissiveIntensity) * 0.05;
  });
}
