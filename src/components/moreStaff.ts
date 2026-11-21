import * as THREE from "three";
import { createHumanFigure } from "./humanFigure";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   អ្នកយាម (Security Guard)
   ============================================================ */
export function createSecurityGuard(): THREE.Group {
  const g = createHumanFigure({ height: 2.35, shirt: 0x2c3e50, pants: 0x1a1a1a, hat: "cap", hatColor: 0x1a1a2e, skin: 0xc58e69, shoe: 0x0b0b0d });
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.015), mat("#f1c40f", { emissive: "#f1c40f", emissiveIntensity: 0.25 }));
  badge.position.set(0.12, 1.55, 0.2);
  g.add(badge);
  return g;
}

/* ============================================================
   អ្នកសម្អាត (Cleaner)
   ============================================================ */
export function createCleaner(): THREE.Group {
  const g = createHumanFigure({ height: 2.25, shirt: 0x3498db, pants: 0x2c3e50, hat: "none", skin: 0xbf8a64, hairStyle: "short" });
  const broom = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), mat("#8b6f47"));
  broom.position.set(0.5, 0.75, 0.3);
  broom.rotation.z = -0.3;
  g.add(broom);
  const brush = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.4), mat("#f1c40f"));
  brush.position.set(0.7, 0.05, 0.4);
  g.add(brush);
  return g;
}

/* ============================================================
   ចុងភៅ (Cook)
   ============================================================ */
export function createCook(): THREE.Group {
  return createHumanFigure({ height: 2.3, shirt: 0xffffff, pants: 0x2c3e50, hat: "chef", hatColor: 0xffffff, skin: 0xc99672, shoe: 0x222222 });
}

/* ============================================================
   អ្នកបើកឡាន (Driver)
   ============================================================ */
export function createDriver(): THREE.Group {
  return createHumanFigure({ height: 2.3, shirt: 0xc0392b, pants: 0x2c3e50, hat: "cap", hatColor: 0x1a1a1a, skin: 0xc08a66 });
}

/* ============================================================
   បង្កើតបុគ្គលិកថ្មី (B)
   ============================================================ */
export interface NewStaff {
  mesh: THREE.Group;
  path: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  phase: number;
  type: "guard" | "cleaner" | "cook" | "driver";
}

export function createMoreStaff(): {
  group: THREE.Group;
  staff: NewStaff[];
} {
  const group = new THREE.Group();
  const staff: NewStaff[] = [];

  // អ្នកយាម ៤ (នៅច្រកចូលរោងចក្រ ៣ + ភូមិ ១)
  const guardSpots = [
    [0, -100],      // ច្រករោងចក្រសាច់
    [-250, 200],    // ច្រករោងចក្រឈើ
    [-100, -80],    // ច្រករោងចក្របន្លែ
    [0, 50],        // ច្រកភូមិ (កណ្តាល)
  ];
  guardSpots.forEach(([x, z], i) => {
    const guard = createSecurityGuard();
    group.add(guard);
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x - 3, 0, z),
      new THREE.Vector3(x + 3, 0, z),
      new THREE.Vector3(x - 3, 0, z),
    ], true);
    staff.push({
      mesh: guard,
      path,
      speed: 0.008,
      offset: i / 4,
      phase: Math.random() * Math.PI * 2,
      type: "guard",
    });
  });

  // អ្នកសម្អាត ៦ (ដើរជុំវិញរោងចក្រ)
  const cleanerSpots: [number, number, number][] = [
    [0, -110, 20],
    [-250, 220, 20],
    [-100, -100, 20],
    [0, 0, 100],       // កណ្តាលភូមិ
    [-70, 60, 15],     // ផ្សារ
    [70, 60, 15],      // ផ្សារ
  ];
  cleanerSpots.forEach(([cx, cz, r], i) => {
    const cleaner = createCleaner();
    group.add(cleaner);
    const angle = (i / 6) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cx + Math.cos(angle) * r, 0, cz + Math.sin(angle) * r),
      new THREE.Vector3(cx + Math.cos(angle + 2) * r, 0, cz + Math.sin(angle + 2) * r),
      new THREE.Vector3(cx + Math.cos(angle + 4) * r, 0, cz + Math.sin(angle + 4) * r),
      new THREE.Vector3(cx + Math.cos(angle) * r, 0, cz + Math.sin(angle) * r),
    ], true);
    staff.push({
      mesh: cleaner,
      path,
      speed: 0.01,
      offset: i / 6,
      phase: Math.random() * Math.PI * 2,
      type: "cleaner",
    });
  });

  // ចុងភៅ ៤ (ក្នុងផ្សារ)
  const cookSpots = [
    [-70, 60], [70, 60], [-70, -60], [70, -60],
  ];
  cookSpots.forEach(([cx, cz], i) => {
    const cook = createCook();
    group.add(cook);
    const angle = (i / 4) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cx + Math.cos(angle) * 3, 0, cz + Math.sin(angle) * 3),
      new THREE.Vector3(cx + Math.cos(angle + Math.PI) * 3, 0, cz + Math.sin(angle + Math.PI) * 3),
      new THREE.Vector3(cx + Math.cos(angle) * 3, 0, cz + Math.sin(angle) * 3),
    ], true);
    staff.push({
      mesh: cook,
      path,
      speed: 0.006,
      offset: i / 4,
      phase: Math.random() * Math.PI * 2,
      type: "cook",
    });
  });

  // អ្នកបើកឡាន ៣ (ដើរជុំវិញឡានដឹកជញ្ជូន)
  const driverSpots: [number, number][] = [
    [0, -95], [-240, 210], [-90, -95],
  ];
  driverSpots.forEach(([x, z], i) => {
    const driver = createDriver();
    group.add(driver);
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, 0, z),
      new THREE.Vector3(x + 4, 0, z + 4),
      new THREE.Vector3(x, 0, z + 8),
      new THREE.Vector3(x - 4, 0, z + 4),
      new THREE.Vector3(x, 0, z),
    ], true);
    staff.push({
      mesh: driver,
      path,
      speed: 0.007,
      offset: i / 3,
      phase: Math.random() * Math.PI * 2,
      type: "driver",
    });
  });

  return { group, staff };
}

export function updateMoreStaff(staff: NewStaff[], elapsed: number): void {
  staff.forEach((s) => {
    const t = (s.offset + s.speed * elapsed) % 1;
    const point = s.path.getPointAt(t);
    const tangent = s.path.getTangentAt(t);
    s.mesh.position.copy(point);
    s.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

    // ជើងញាក់
    s.mesh.traverse((child) => {
      if (child.name === "leg") {
        child.rotation.x = (child.userData.side ?? 1) * Math.sin(elapsed * 6 + s.phase) * 0.3;
      }
      if (child.name === "arm") {
        child.rotation.x = (child.userData.side ?? 1) * Math.sin(elapsed * 4 + s.phase) * 0.2;
      }
    });
  });
}
