import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   Forklift (រទេះលើកទំនិញ)
   ============================================================ */
export function createForklift(color = "#f1c40f"): THREE.Group {
  const g = new THREE.Group();

  // តួ
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(2, 1.5, 1.5),
    mat(color, { metalness: 0.5 })
  );
  body.position.y = 1;
  body.castShadow = true;
  g.add(body);

  // កាប៊ីន (អ្នកបើក)
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1.2),
    new THREE.MeshStandardMaterial({
      color: "#3498db",
      transparent: true,
      opacity: 0.6,
    })
  );
  cabin.position.set(-0.3, 2, 0);
  g.add(cabin);

  // បង្គោល (fork posts)
  const post1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 3, 0.1),
    mat("#34495e")
  );
  post1.position.set(1, 2, 0.5);
  g.add(post1);
  const post2 = post1.clone();
  post2.position.z = -0.5;
  g.add(post2);

  // Fork (ពន្លាក់)
  const fork = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.1, 0.8),
    mat("#34495e")
  );
  fork.position.set(1.5, 0.3, 0);
  fork.name = "fork";
  g.add(fork);

  // កង់ ៤
  [[-0.7, 0.7], [-0.7, -0.7], [0.7, 0.7], [0.7, -0.7]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.2, 12),
      mat("#111")
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.35, z);
    wheel.name = "wheel";
    g.add(wheel);
  });

  // ប្រអប់លើ fork (ទំនិញ)
  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.8, 0.8),
    mat("#d4a574")
  );
  cargo.position.set(1.5, 0.8, 0);
  cargo.name = "forkliftCargo";
  g.add(cargo);

  return g;
}

/* ============================================================
   Assembly Line (ខ្សែផលិតកម្ម)
   ============================================================ */
export function createAssemblyLine(): THREE.Group {
  const g = new THREE.Group();

  // ខ្សែ (conveyor belt)
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(10, 0.3, 1.5),
    mat("#34495e", { metalness: 0.5 })
  );
  belt.position.y = 0.8;
  belt.castShadow = true;
  g.add(belt);

  // ជើងទ្រទ្រង់ ៤
  [-4, -1.5, 1.5, 4].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.8, 0.3),
      mat("#7f8c8d")
    );
    leg.position.set(x, 0.4, 0);
    g.add(leg);
  });

  // ប្រអប់ហោះលើខ្សែ ៦
  for (let i = 0; i < 6; i++) {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.5, 0.6),
      mat(i % 2 === 0 ? "#e74c3c" : "#3498db")
    );
    box.position.set(-4 + i * 1.5, 1.2, 0);
    box.name = "assemblyBox";
    box.userData.startX = -4 + i * 1.5;
    g.add(box);
  }

  return g;
}

/* ============================================================
   Warehouse Shelves (ធ្នើរក្នុងឃ្លាំង)
   ============================================================ */
export function createWarehouseShelves(): THREE.Group {
  const g = new THREE.Group();

  // ធ្នើរ ៤ ជាន់
  for (let floor = 0; floor < 4; floor++) {
    // សសរ ៤
    [[-3, -1], [3, -1], [-3, 1], [3, 1]].forEach(([x, z]) => {
      const pole = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 8, 0.15),
        mat("#7f8c8d", { metalness: 0.7 })
      );
      pole.position.set(x, 4, z);
      g.add(pole);
    });

    // ជាន់
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(6, 0.1, 2.2),
      mat("#34495e")
    );
    shelf.position.y = floor * 2;
    g.add(shelf);

    // ប្រអប់លើជាន់ ៣
    for (let i = 0; i < 3; i++) {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.2, 1.8),
        mat(i % 3 === 0 ? "#e67e22" : i % 3 === 1 ? "#c0392b" : "#27ae60")
      );
      box.position.set(-2 + i * 2, floor * 2 + 0.7, 0);
      box.castShadow = true;
      g.add(box);
    }
  }

  return g;
}

/* ============================================================
   បង្កើតម៉ាស៊ីនថ្មី (C)
   ============================================================ */
export interface AnimatedMachine {
  mesh: THREE.Group;
  blades?: THREE.Mesh[];
  boxes?: THREE.Mesh[];
  fork?: THREE.Mesh;
  forkliftPath?: THREE.CatmullRomCurve3;
  forkliftOffset?: number;
  forkliftSpeed?: number;
}

export function createMoreMachines(): {
  group: THREE.Group;
  machines: AnimatedMachine[];
} {
  const group = new THREE.Group();
  const machines: AnimatedMachine[] = [];

  // Forklift ៣
  const forkliftSpots: [number, number][] = [
    [0, -105],     // រោងចក្រសាច់
    [-250, 215],   // រោងចក្រឈើ
    [-100, -95],   // រោងចក្របន្លែ
  ];
  forkliftSpots.forEach(([cx, cz], i) => {
    const forklift = createForklift(i % 2 === 0 ? "#f1c40f" : "#e67e22");
    group.add(forklift);
    const angle = (i / 3) * Math.PI * 2;
    const path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cx + Math.cos(angle) * 10, 0, cz + Math.sin(angle) * 10),
      new THREE.Vector3(cx + Math.cos(angle + 2) * 12, 0, cz + Math.sin(angle + 2) * 12),
      new THREE.Vector3(cx + Math.cos(angle + 4) * 10, 0, cz + Math.sin(angle + 4) * 10),
      new THREE.Vector3(cx + Math.cos(angle) * 10, 0, cz + Math.sin(angle) * 10),
    ], true);
    const fork = forklift.children.find((c) => c.name === "fork") as THREE.Mesh;
    const boxes = forklift.children.filter((c) => c.name === "forkliftCargo") as THREE.Mesh[];
    machines.push({
      mesh: forklift,
      fork,
      boxes,
      forkliftPath: path,
      forkliftOffset: i / 3,
      forkliftSpeed: 0.01,
    });
  });

  // Assembly Line ២ (រោងចក្រសាច់ + បន្លែ)
  const assemblyLines: [number, number][] = [
    [0, -108], [-100, -98],
  ];
  assemblyLines.forEach(([x, z]) => {
    const line = createAssemblyLine();
    line.position.set(x, 0, z);
    group.add(line);
    const boxes = line.children.filter((c) => c.name === "assemblyBox") as THREE.Mesh[];
    machines.push({ mesh: line, boxes });
  });

  // Warehouse Shelves ៣ (មួយក្នុងរោងចក្រនីមួយៗ)
  const warehouseSpots: [number, number][] = [
    [-10, -100], [-240, 230], [-90, -90],
  ];
  warehouseSpots.forEach(([x, z]) => {
    const shelves = createWarehouseShelves();
    shelves.position.set(x, 0, z);
    group.add(shelves);
    machines.push({ mesh: shelves });
  });

  return { group, machines };
}

/* ============================================================
   Update Machines
   ============================================================ */
export function updateMoreMachines(
  machines: AnimatedMachine[],
  elapsed: number
): void {
  machines.forEach((m) => {
    // Forklift (រត់តាម path)
    if (m.forkliftPath) {
      const t = ((m.forkliftOffset ?? 0) + (m.forkliftSpeed ?? 0.01) * elapsed) % 1;
      const point = m.forkliftPath.getPointAt(t);
      const tangent = m.forkliftPath.getTangentAt(t);
      m.mesh.position.copy(point);
      m.mesh.rotation.y = Math.atan2(tangent.x, tangent.z);

      // កង់បង្វិល
      m.mesh.traverse((c) => {
        if (c.name === "wheel") {
          c.rotation.x += 0.1;
        }
      });

      // Fork លើកចុះឡើង
      if (m.fork) {
        m.fork.position.y = 0.3 + Math.abs(Math.sin(elapsed * 2)) * 1.5;
        if (m.boxes) {
          m.boxes.forEach((box) => {
            box.position.y = m.fork!.position.y + 0.5;
          });
        }
      }
    }

    // ប្រអប់ហោះលើ assembly line
    if (m.boxes && !m.forkliftPath) {
      m.boxes.forEach((box, i) => {
        const startX = box.userData.startX ?? box.position.x;
        box.position.x = startX + Math.sin(elapsed * 1.5 + i * 0.5) * 1.2;
      });
    }
  });
}
