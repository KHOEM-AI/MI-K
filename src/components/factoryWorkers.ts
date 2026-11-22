import * as THREE from "three";
import { createHumanFigure } from "./humanFigure";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   កម្មករ (Worker) — ពាក់មួកសុវត្ថិភាព
   ============================================================ */
export function createWorker(
  shirtColor = "#f39c12",
  hatColor = "#e74c3c"
): THREE.Group {
  return createHumanFigure({ lite: true, height: 2.3, shirt: shirtColor, pants: 0x2c3e50, hat: "helmet", hatColor, skin: 0xc58e69, shoe: 0x2b2118 });
}

/* ============================================================
   មេការ (Supervisor) — ពាក់ស្លៀកស
   ============================================================ */
export function createSupervisor(): THREE.Group {
  const g = createHumanFigure({ height: 2.4, shirt: 0xf3f5f7, pants: 0x1a1a1a, hat: "helmet", hatColor: 0xf1c40f, skin: 0xc08a66, tie: 0x2c3e50 });
  // clipboard in the right hand
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.03), new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.8 }));
  board.position.set(0.42, 1.0, 0.22);
  board.rotation.x = -0.3;
  g.add(board);
  return g;
}

/* ============================================================
   បុគ្គលិកកាមេរ៉ា (Camera Operator) — អង្គុយ
   ============================================================ */
export function createCameraOperator(): THREE.Group {
  const g = createHumanFigure({ height: 2.2, shirt: 0x3498db, pants: 0x2c3e50, hat: "none", skin: 0xc99672, sitting: true, seatHeight: 0.45 });
  const chair = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.7 }));
  chair.position.set(0, 0.4, -0.05);
  g.add(chair);
  return g;
}

/* ============================================================
   ម៉ាស៊ីនវេចខ្ចប់ (Packaging Machine)
   ============================================================ */
export function createPackagingMachine(): THREE.Group {
  const g = new THREE.Group();

  // តួម៉ាស៊ីន
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2, 1.5),
    mat("#7f8c8d", { metalness: 0.5 })
  );
  body.position.y = 1;
  body.castShadow = true;
  g.add(body);

  // ខ្សែ conveyor belt
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(5, 0.2, 1.2),
    mat("#34495e")
  );
  belt.position.set(0, 0.5, 1.5);
  belt.name = "conveyorBelt";
  g.add(belt);

  // ប្រអប់ហោះលើ conveyor ៥
  for (let i = 0; i < 5; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 0.5),
      mat("#d4a574")
    );
    box.position.set(-2 + i, 0.85, 1.5);
    box.name = "package";
    box.userData.startX = -2 + i;
    g.add(box);
  }

  // ភ្លើងស្តុប (status)
  const lightMat = new THREE.MeshStandardMaterial({
    color: "#27ae60",
    emissive: "#27ae60",
    emissiveIntensity: 1,
  });
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    lightMat
  );
  light.position.set(1.2, 2.2, 0);
  light.name = "statusLight";
  g.add(light);

  return g;
}

/* ============================================================
   ម៉ាស៊ីនកាត់ឈើ (Wood Cutter Machine)
   ============================================================ */
export function createWoodCutterMachine(): THREE.Group {
  const g = new THREE.Group();

  // តួម៉ាស៊ីន
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(4, 1.5, 2),
    mat("#8b6f47")
  );
  body.position.y = 0.75;
  body.castShadow = true;
  g.add(body);

  // Saw blade (បង្វិល)
  const blade = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 0.1, 16),
    mat("#95a5a6", { metalness: 0.9, roughness: 0.2 })
  );
  blade.rotation.z = Math.PI / 2;
  blade.position.set(0, 1.5, 0);
  blade.name = "cuttingBlade";
  g.add(blade);

  // ក្ដារឈើ (ត្រូវកាត់)
  const wood = new THREE.Mesh(
    new THREE.BoxGeometry(3, 0.2, 0.8),
    mat("#d4a574")
  );
  wood.position.set(0, 0.2, 1.5);
  g.add(wood);

  return g;
}

/* ============================================================
   ម៉ាស៊ីនកែច្នៃសាច់ (Meat Processing Machine)
   ============================================================ */
export function createMeatMachine(): THREE.Group {
  const g = new THREE.Group();

  // តួម៉ាស៊ីន (ដែកអ៊ីណុក)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3, 2.5, 1.8),
    mat("#bdc3c7", { metalness: 0.8, roughness: 0.2 })
  );
  body.position.y = 1.25;
  body.castShadow = true;
  g.add(body);

  // បំពង់ផ្សែងតូច
  const chimney = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.4, 2, 8),
    mat("#7f8c8d", { metalness: 0.6 })
  );
  chimney.position.set(0.8, 3.5, 0);
  g.add(chimney);

  // ប្រអប់សាច់ ៦ (ឆ្លងកាត់ conveyor)
  const meatColors = ["#e74c3c", "#c0392b", "#a93226"];
  for (let i = 0; i < 6; i++) {
    const meat = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.4),
      mat(meatColors[i % meatColors.length])
    );
    meat.position.set(-1.5 + i * 0.6, 2.7, 0);
    meat.name = "meatBox";
    g.add(meat);
  }

  // ភ្លើងស្តុប (status)
  const lightMat = new THREE.MeshStandardMaterial({
    color: "#e74c3c",
    emissive: "#e74c3c",
    emissiveIntensity: 1,
  });
  const light = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 8, 8),
    lightMat
  );
  light.position.set(1.3, 2.7, 0);
  g.add(light);

  return g;
}

/* ============================================================
   រថយន្តដឹកជញ្ជូន (Delivery Truck)
   ============================================================ */
export function createDeliveryTruck(color = "#2980b9"): THREE.Group {
  const g = new THREE.Group();

  // កាប៊ីន
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.5, 1.8),
    mat(color, { metalness: 0.6 })
  );
  cabin.position.set(2.5, 1.2, 0);
  cabin.castShadow = true;
  g.add(cabin);

  // ប្រអប់ដឹកទំនិញ (ធំ)
  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(5, 2.2, 2),
    mat("#ffffff")
  );
  cargo.position.set(-1, 1.4, 0);
  cargo.castShadow = true;
  g.add(cargo);

  // កង់ ៦
  [[2.5, 0.9], [2.5, -0.9], [-1, 0.9], [-1, -0.9], [-2.5, 0.9], [-2.5, -0.9]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.2, 12),
      mat("#111")
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.4, z);
    wheel.name = "wheel";
    g.add(wheel);
  });

  // ភ្លើងមុខ ២
  [-0.6, 0.6].forEach((z) => {
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 8, 8),
      mat("#f1c40f", { emissive: "#f1c40f", emissiveIntensity: 1 })
    );
    light.position.set(3.6, 1.2, z);
    g.add(light);
  });

  return g;
}

/* ============================================================
   បង្កើតបុគ្គលិក + ម៉ាស៊ីន + ការដឹកជញ្ជូន (តាមរោងចក្រ)
   ============================================================ */
export interface WorkerAnimation {
  mesh: THREE.Group;
  basePos: THREE.Vector3;
  path?: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  phase: number;
  type: "worker" | "supervisor" | "camera" | "truck";
}

export interface FactorySet {
  group: THREE.Group;
  workers: WorkerAnimation[];
  blades: THREE.Mesh[];
  packages: THREE.Mesh[];
}

/* បង្កើតបុគ្គលិក + ម៉ាស៊ីនសម្រាប់រោងចក្រសាច់ */
export function createMeatFactoryStaff(
  centerX: number,
  centerZ: number
): FactorySet {
  const group = new THREE.Group();
  const workers: WorkerAnimation[] = [];
  const blades: THREE.Mesh[] = [];
  const packages: THREE.Mesh[] = [];

  // ម៉ាស៊ីនកែច្នៃសាច់ ៣
  for (let i = 0; i < 3; i++) {
    const machine = createMeatMachine();
    machine.position.set(centerX - 8 + i * 8, 0, centerZ + 5);
    group.add(machine);
    machine.traverse((c) => {
      if (c.name === "meatBox") packages.push(c as THREE.Mesh);
    });
  }

  // កម្មករ ១២ (ដើរតាមខ្សែ)
  for (let i = 0; i < 12; i++) {
    const worker = createWorker(i % 2 === 0 ? "#f39c12" : "#e67e22");
    group.add(worker);
    const angle = (i / 12) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 10, 0, centerZ + Math.sin(angle) * 10),
      new THREE.Vector3(centerX + Math.cos(angle + 1.5) * 12, 0, centerZ + Math.sin(angle + 1.5) * 12),
      new THREE.Vector3(centerX + Math.cos(angle + 3) * 10, 0, centerZ + Math.sin(angle + 3) * 10),
      new THREE.Vector3(centerX + Math.cos(angle) * 10, 0, centerZ + Math.sin(angle) * 10),
    ], true);
    workers.push({
      mesh: worker,
      basePos: new THREE.Vector3(centerX, 0, centerZ),
      path,
      speed: 0.01,
      offset: i / 12,
      phase: Math.random() * Math.PI * 2,
      type: "worker",
    });
  }

  // មេការ ២
  for (let i = 0; i < 2; i++) {
    const sup = createSupervisor();
    group.add(sup);
    const angle = (i / 2) * Math.PI;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 15, 0, centerZ + Math.sin(angle) * 15),
      new THREE.Vector3(centerX + Math.cos(angle + Math.PI) * 15, 0, centerZ + Math.sin(angle + Math.PI) * 15),
      new THREE.Vector3(centerX + Math.cos(angle) * 15, 0, centerZ + Math.sin(angle) * 15),
    ], true);
    workers.push({
      mesh: sup,
      basePos: new THREE.Vector3(centerX, 0, centerZ),
      path,
      speed: 0.005,
      offset: i / 2,
      phase: Math.random() * Math.PI * 2,
      type: "supervisor",
    });
  }

  // បុគ្គលិកកាមេរ៉ា ២ (អង្គុយជ្រុង)
  for (let i = 0; i < 2; i++) {
    const op = createCameraOperator();
    op.position.set(centerX + 12, 0, centerZ + 10 - i * 3);
    op.rotation.y = -Math.PI / 4;
    group.add(op);
    workers.push({
      mesh: op,
      basePos: op.position.clone(),
      speed: 0,
      offset: 0,
      phase: Math.random() * Math.PI * 2,
      type: "camera",
    });
  }

  return { group, workers, blades, packages };
}

/* បង្កើតបុគ្គលិក + ម៉ាស៊ីនសម្រាប់រោងចក្រឈើ */
export function createSawmillStaff(
  centerX: number,
  centerZ: number
): FactorySet {
  const group = new THREE.Group();
  const workers: WorkerAnimation[] = [];
  const blades: THREE.Mesh[] = [];
  const packages: THREE.Mesh[] = [];

  // ម៉ាស៊ីនកាត់ឈើ ២
  for (let i = 0; i < 2; i++) {
    const machine = createWoodCutterMachine();
    machine.position.set(centerX - 5 + i * 10, 0, centerZ + 5);
    group.add(machine);
    machine.traverse((c) => {
      if (c.name === "cuttingBlade") blades.push(c as THREE.Mesh);
    });
  }

  // ម៉ាស៊ីនវេចខ្ចប់ ១
  const pack = createPackagingMachine();
  pack.position.set(centerX, 0, centerZ - 5);
  group.add(pack);
  pack.traverse((c) => {
    if (c.name === "package") packages.push(c as THREE.Mesh);
  });

  // កម្មករ ១០
  for (let i = 0; i < 10; i++) {
    const worker = createWorker(i % 2 === 0 ? "#d4a574" : "#8b6f47");
    group.add(worker);
    const angle = (i / 10) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 8, 0, centerZ + Math.sin(angle) * 8),
      new THREE.Vector3(centerX + Math.cos(angle + 1.5) * 10, 0, centerZ + Math.sin(angle + 1.5) * 10),
      new THREE.Vector3(centerX + Math.cos(angle + 3) * 8, 0, centerZ + Math.sin(angle + 3) * 8),
      new THREE.Vector3(centerX + Math.cos(angle) * 8, 0, centerZ + Math.sin(angle) * 8),
    ], true);
    workers.push({
      mesh: worker,
      basePos: new THREE.Vector3(centerX, 0, centerZ),
      path,
      speed: 0.012,
      offset: i / 10,
      phase: Math.random() * Math.PI * 2,
      type: "worker",
    });
  }

  // មេការ ១
  const sup = createSupervisor();
  group.add(sup);
  const supPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(centerX - 8, 0, centerZ),
    new THREE.Vector3(centerX + 8, 0, centerZ),
    new THREE.Vector3(centerX - 8, 0, centerZ),
  ], true);
  workers.push({
    mesh: sup,
    basePos: new THREE.Vector3(centerX, 0, centerZ),
    path: supPath,
    speed: 0.006,
    offset: 0,
    phase: Math.random() * Math.PI * 2,
    type: "supervisor",
  });

  // បុគ្គលិកកាមេរ៉ា ១
  const op = createCameraOperator();
  op.position.set(centerX + 8, 0, centerZ + 8);
  op.rotation.y = -Math.PI / 4;
  group.add(op);
  workers.push({
    mesh: op,
    basePos: op.position.clone(),
    speed: 0,
    offset: 0,
    phase: Math.random() * Math.PI * 2,
    type: "camera",
  });

  return { group, workers, blades, packages };
}

/* បង្កើតបុគ្គលិក + ម៉ាស៊ីនសម្រាប់រោងចក្របន្លែ */
export function createVegetableFactoryStaff(
  centerX: number,
  centerZ: number
): FactorySet {
  const group = new THREE.Group();
  const workers: WorkerAnimation[] = [];
  const blades: THREE.Mesh[] = [];
  const packages: THREE.Mesh[] = [];

  // ម៉ាស៊ីនវេចខ្ចប់ ២
  for (let i = 0; i < 2; i++) {
    const pack = createPackagingMachine();
    pack.position.set(centerX - 5 + i * 10, 0, centerZ + 3);
    group.add(pack);
    pack.traverse((c) => {
      if (c.name === "package") packages.push(c as THREE.Mesh);
    });
  }

  // កម្មករ ១០
  for (let i = 0; i < 10; i++) {
    const worker = createWorker(i % 2 === 0 ? "#27ae60" : "#2ecc71");
    group.add(worker);
    const angle = (i / 10) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX + Math.cos(angle) * 9, 0, centerZ + Math.sin(angle) * 9),
      new THREE.Vector3(centerX + Math.cos(angle + 1.5) * 11, 0, centerZ + Math.sin(angle + 1.5) * 11),
      new THREE.Vector3(centerX + Math.cos(angle + 3) * 9, 0, centerZ + Math.sin(angle + 3) * 9),
      new THREE.Vector3(centerX + Math.cos(angle) * 9, 0, centerZ + Math.sin(angle) * 9),
    ], true);
    workers.push({
      mesh: worker,
      basePos: new THREE.Vector3(centerX, 0, centerZ),
      path,
      speed: 0.013,
      offset: i / 10,
      phase: Math.random() * Math.PI * 2,
      type: "worker",
    });
  }

  // មេការ ១
  const sup = createSupervisor();
  group.add(sup);
  workers.push({
    mesh: sup,
    basePos: new THREE.Vector3(centerX, 0, centerZ),
    path: new THREE.CatmullRomCurve3([
      new THREE.Vector3(centerX - 7, 0, centerZ),
      new THREE.Vector3(centerX + 7, 0, centerZ),
      new THREE.Vector3(centerX - 7, 0, centerZ),
    ], true),
    speed: 0.007,
    offset: 0,
    phase: Math.random() * Math.PI * 2,
    type: "supervisor",
  });

  return { group, workers, blades, packages };
}

/* ============================================================
   បង្កើតរថយន្តដឹកជញ្ជូន (តាមរោងចក្រ)
   ============================================================ */
export function createDeliveryTrucks(): {
  group: THREE.Group;
  trucks: WorkerAnimation[];
} {
  const group = new THREE.Group();
  const trucks: WorkerAnimation[] = [];

  // រថយន្តដឹកសាច់ ១ (ពីរោងចក្រសាច់ → ផ្សារ)
  const truck1 = createDeliveryTruck("#e74c3c");
  group.add(truck1);
  trucks.push({
    mesh: truck1,
    basePos: new THREE.Vector3(0, 0, -110),
    path: new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, -100),
      new THREE.Vector3(0, 0, -50),
      new THREE.Vector3(-70, 0, 50),
      new THREE.Vector3(-70, 0, 55),
      new THREE.Vector3(0, 0, -50),
      new THREE.Vector3(0, 0, -100),
    ], true),
    speed: 0.008,
    offset: 0,
    phase: 0,
    type: "truck",
  });

  // រថយន្តដឹកឈើ ១ (ពីរោងចក្រឈើ → ភូមិ)
  const truck2 = createDeliveryTruck("#8b6f47");
  group.add(truck2);
  trucks.push({
    mesh: truck2,
    basePos: new THREE.Vector3(-250, 0, 220),
    path: new THREE.CatmullRomCurve3([
      new THREE.Vector3(-250, 0, 220),
      new THREE.Vector3(-200, 0, 180),
      new THREE.Vector3(-100, 0, 100),
      new THREE.Vector3(0, 0, 50),
      new THREE.Vector3(-100, 0, 100),
      new THREE.Vector3(-200, 0, 180),
      new THREE.Vector3(-250, 0, 220),
    ], true),
    speed: 0.007,
    offset: 0.3,
    phase: Math.PI / 3,
    type: "truck",
  });

  // រថយន្តដឹកបន្លែ ១ (ពីចម្ការ → រោងចក្រ)
  const truck3 = createDeliveryTruck("#27ae60");
  group.add(truck3);
  trucks.push({
    mesh: truck3,
    basePos: new THREE.Vector3(100, 0, 60),
    path: new THREE.CatmullRomCurve3([
      new THREE.Vector3(100, 0, 60),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-70, 0, -60),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(100, 0, 60),
    ], true),
    speed: 0.009,
    offset: 0.6,
    phase: Math.PI,
    type: "truck",
  });

  return { group, trucks };
}

/* ============================================================
   Update Workers + Machines
   ============================================================ */
export function updateFactoryWorkers(
  workers: WorkerAnimation[],
  blades: THREE.Mesh[],
  packages: THREE.Mesh[],
  elapsed: number
): void {
  // កម្មករ + មេការ (ដើរតាម path)
  workers.forEach((w) => {
    if (w.type === "camera") return; // អង្គុយស្ងៀម

    if (w.path) {
      const t = (w.offset + w.speed * elapsed) % 1;
      const point = w.path.getPointAt(t);
      const tangent = w.path.getTangentAt(t);
      w.mesh.position.copy(point);
      w.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);
    }

    // ជើងញាក់
    w.mesh.traverse((child) => {
      if (child.name === "leg") {
        child.rotation.x = (child.userData.side ?? 1) * Math.sin(elapsed * 6 + w.phase) * 0.3;
      }
      if (child.name === "arm") {
        child.rotation.x = (child.userData.side ?? 1) * Math.sin(elapsed * 4 + w.phase) * 0.3;
      }
    });
  });

  // ម៉ាស៊ីនកាត់ឈើ (blade បង្វិល)
  blades.forEach((b) => {
    b.rotation.x = elapsed * 8;
  });

  // ប្រអប់ហោះលើ conveyor
  packages.forEach((p, i) => {
    const startX = p.userData.startX ?? p.position.x;
    p.position.x = startX + Math.sin(elapsed * 2 + i) * 1.5;
  });
}

export function updateTrucks(trucks: WorkerAnimation[], elapsed: number): void {
  trucks.forEach((t) => {
    if (t.path) {
      const tPos = (t.offset + t.speed * elapsed) % 1;
      const point = t.path.getPointAt(tPos);
      const tangent = t.path.getTangentAt(tPos);
      t.mesh.position.copy(point);
      t.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

      // កង់បង្វិល
      t.mesh.traverse((child) => {
        if (child.name === "wheel") {
          child.rotation.x += t.speed * 20;
        }
      });
    }
  });
}
