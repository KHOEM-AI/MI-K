import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   អ្នកយាម (Security Guard)
   ============================================================ */
export function createSecurityGuard(): THREE.Group {
  const g = new THREE.Group();

  // តួ (ឯកសណ្ឋានខ្មៅ)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 1.2, 8),
    mat("#2c3e50")
  );
  body.position.y = 1.2;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 10),
    mat("#f5cba7")
  );
  head.position.y = 2;
  g.add(head);

  // មួកយាម (កំពូល)
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.15, 12),
    mat("#1a1a2e")
  );
  cap.position.y = 2.2;
  g.add(cap);

  // Badge (លឿង)
  const badge = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.02),
    mat("#f1c40f", { emissive: "#f1c40f", emissiveIntensity: 0.3 })
  );
  badge.position.set(0.2, 1.4, 0.3);
  g.add(badge);

  // ដៃ ២
  [-0.35, 0.35].forEach((x) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6),
      mat("#2c3e50")
    );
    arm.position.set(x, 1.3, 0);
    arm.name = "arm";
    g.add(arm);
  });

  // ជើង ២
  [-0.13, 0.13].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6),
      mat("#1a1a1a")
    );
    leg.position.set(x, 0.35, 0);
    leg.name = "leg";
    g.add(leg);
  });

  return g;
}

/* ============================================================
   អ្នកសម្អាត (Cleaner)
   ============================================================ */
export function createCleaner(): THREE.Group {
  const g = new THREE.Group();

  // តួ (អាវពណ៌ខៀវ)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 1.2, 8),
    mat("#3498db")
  );
  body.position.y = 1.2;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 10),
    mat("#f5cba7")
  );
  head.position.y = 2;
  g.add(head);

  // ដៃ ២
  [-0.35, 0.35].forEach((x) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6),
      mat("#3498db")
    );
    arm.position.set(x, 1.3, 0);
    arm.name = "arm";
    g.add(arm);
  });

  // ជើង ២
  [-0.13, 0.13].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6),
      mat("#2c3e50")
    );
    leg.position.set(x, 0.35, 0);
    leg.name = "leg";
    g.add(leg);
  });

  // ជក់បោស (នៅដៃស្តាំ)
  const broom = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 1.5, 4),
    mat("#8b6f47")
  );
  broom.position.set(0.5, 0.75, 0.3);
  broom.rotation.z = -0.3;
  g.add(broom);

  // ក្បាលជក់
  const brush = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.1, 0.4),
    mat("#f1c40f")
  );
  brush.position.set(0.7, 0, 0.4);
  g.add(brush);

  return g;
}

/* ============================================================
   ចុងភៅ (Cook)
   ============================================================ */
export function createCook(): THREE.Group {
  const g = new THREE.Group();

  // តួ (អាវស)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 1.2, 8),
    mat("#ffffff")
  );
  body.position.y = 1.2;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 10),
    mat("#f5cba7")
  );
  head.position.y = 2;
  g.add(head);

  // មួកចុងភៅ (ខ្ពស់)
  const chefHat = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12),
    mat("#ffffff")
  );
  chefHat.position.y = 2.35;
  g.add(chefHat);

  // ដៃ ២
  [-0.35, 0.35].forEach((x) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6),
      mat("#ffffff")
    );
    arm.position.set(x, 1.3, 0);
    arm.name = "arm";
    g.add(arm);
  });

  // ជើង ២
  [-0.13, 0.13].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6),
      mat("#2c3e50")
    );
    leg.position.set(x, 0.35, 0);
    leg.name = "leg";
    g.add(leg);
  });

  return g;
}

/* ============================================================
   អ្នកបើកឡាន (Driver)
   ============================================================ */
export function createDriver(): THREE.Group {
  const g = new THREE.Group();

  // តួ (អាវក្រហម)
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 1.2, 8),
    mat("#c0392b")
  );
  body.position.y = 1.2;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 10, 10),
    mat("#f5cba7")
  );
  head.position.y = 2;
  g.add(head);

  // មួកបើកឡាន (ពណ៌ខ្មៅ)
  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.3, 0.15, 12),
    mat("#1a1a1a")
  );
  cap.position.y = 2.2;
  g.add(cap);

  // ដៃ ២
  [-0.35, 0.35].forEach((x) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.8, 6),
      mat("#c0392b")
    );
    arm.position.set(x, 1.3, 0);
    arm.name = "arm";
    g.add(arm);
  });

  // ជើង ២
  [-0.13, 0.13].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6),
      mat("#2c3e50")
    );
    leg.position.set(x, 0.35, 0);
    leg.name = "leg";
    g.add(leg);
  });

  return g;
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
        child.rotation.x = Math.sin(elapsed * 6 + s.phase) * 0.3;
      }
      if (child.name === "arm") {
        child.rotation.z = Math.sin(elapsed * 4 + s.phase) * 0.2;
      }
    });
  });
}
