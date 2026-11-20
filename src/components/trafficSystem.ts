import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   បង្កើតម៉ូតូ (សម្រាប់ animation)
   ============================================================ */
export function createAnimatedMotorbike(color = "#e74c3c"): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = mat(color, { metalness: 0.5, roughness: 0.3 });

  // តួម៉ូតូ
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.4), bodyMat);
  body.position.y = 0.7;
  body.castShadow = true;
  g.add(body);

  // អ្នកបើក
  const rider = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.8, 8),
    mat("#2c3e50")
  );
  rider.position.set(-0.2, 1.2, 0);
  rider.castShadow = true;
  g.add(rider);

  // ក្បាល
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 8, 8),
    mat("#f5cba7")
  );
  head.position.set(-0.2, 1.75, 0);
  g.add(head);

  // កង់ ២
  [-0.6, 0.6].forEach((x) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12),
      mat("#111")
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.3, 0);
    wheel.castShadow = true;
    wheel.name = "wheel";
    g.add(wheel);
  });

  return g;
}

/* ============================================================
   បង្កើតឡាន (សម្រាប់ animation)
   ============================================================ */
export function createAnimatedCar(color = "#c0392b"): THREE.Group {
  const g = new THREE.Group();

  // តួឡាន
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 0.8, 1.6),
    mat(color, { metalness: 0.6, roughness: 0.3 })
  );
  body.position.y = 0.9;
  body.castShadow = true;
  g.add(body);

  // កាប៊ីន
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 0.8, 1.4),
    mat("#1a1a1a", { metalness: 0.5 })
  );
  cabin.position.set(-0.2, 1.7, 0);
  cabin.castShadow = true;
  g.add(cabin);

  // កង់ ៤
  [
    [-1.2, 0.7],
    [-1.2, -0.7],
    [1.2, 0.7],
    [1.2, -0.7],
  ].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16),
      mat("#111")
    );
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.35, z);
    wheel.name = "wheel";
    g.add(wheel);
  });

  return g;
}

/* ============================================================
   បង្កើតអ្នកថ្មើរជើង (Walk)
   ============================================================ */
export function createWalker(shirtColor = "#3498db"): THREE.Group {
  const g = new THREE.Group();

  // តួ
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.9, 8),
    mat(shirtColor)
  );
  body.position.y = 1.1;
  body.castShadow = true;
  g.add(body);

  // ក្បាល
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    mat("#f5cba7")
  );
  head.position.y = 1.8;
  g.add(head);

  // ជើង ២
  const legs: THREE.Mesh[] = [];
  [-0.15, 0.15].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.7, 6),
      mat("#2c3e50")
    );
    leg.position.set(x, 0.35, 0);
    leg.castShadow = true;
    leg.name = "leg";
    legs.push(leg);
    g.add(leg);
  });

  return g;
}

/* ============================================================
   Traffic System — គ្រប់គ្រងការធ្វើដំណើរ
   ============================================================ */
export interface TrafficVehicle {
  mesh: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  speed: number;
  offset: number;
  type: "motorbike" | "car" | "walker";
}

export function createTrafficCurves(): {
  mainRoad: THREE.CatmullRomCurve3;
  innerRoad: THREE.CatmullRomCurve3;
  walkway: THREE.CatmullRomCurve3;
} {
  // ផ្លូវធំ (loop ជុំវិញភូមិ)
  const mainRoad = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-95, 0.5, 0),
    new THREE.Vector3(0, 0.5, 0),
    new THREE.Vector3(95, 0.5, 0),
    new THREE.Vector3(95, 0.5, 50),
    new THREE.Vector3(0, 0.5, 50),
    new THREE.Vector3(-95, 0.5, 50),
    new THREE.Vector3(-95, 0.5, 0),
  ], true, "catmullrom", 0.5);

  // ផ្លូវខាងក្នុង
  const innerRoad = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-70, 0.5, 20),
    new THREE.Vector3(0, 0.5, 20),
    new THREE.Vector3(70, 0.5, 20),
    new THREE.Vector3(70, 0.5, -20),
    new THREE.Vector3(0, 0.5, -20),
    new THREE.Vector3(-70, 0.5, -20),
    new THREE.Vector3(-70, 0.5, 20),
  ], true, "catmullrom", 0.5);

  // ផ្លូវថ្មើរជើង
  const walkway = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-85, 0, 8),
    new THREE.Vector3(85, 0, 8),
    new THREE.Vector3(85, 0, -8),
    new THREE.Vector3(-85, 0, -8),
    new THREE.Vector3(-85, 0, 8),
  ], true, "catmullrom", 0.3);

  return { mainRoad, innerRoad, walkway };
}

/* ============================================================
   បង្កើតយានជំនិះទាំងអស់
   ============================================================ */
export function createTrafficSystem(): {
  group: THREE.Group;
  vehicles: TrafficVehicle[];
} {
  const group = new THREE.Group();
  const vehicles: TrafficVehicle[] = [];
  const curves = createTrafficCurves();

  // ម៉ូតូ ១០ តាមផ្លូវធំ
  const motorbikeColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6", "#1abc9c", "#e67e22", "#c0392b", "#16a085", "#8e44ad"];
  for (let i = 0; i < 10; i++) {
    const bike = createAnimatedMotorbike(motorbikeColors[i % motorbikeColors.length]);
    group.add(bike);
    vehicles.push({
      mesh: bike,
      curve: curves.mainRoad,
      speed: 0.015 + Math.random() * 0.01,
      offset: i / 10,
      type: "motorbike",
    });
  }

  // ឡាន ៥ តាមផ្លូវខាងក្នុង
  const carColors = ["#c0392b", "#2c3e50", "#e67e22", "#27ae60", "#8e44ad"];
  for (let i = 0; i < 5; i++) {
    const car = createAnimatedCar(carColors[i]);
    group.add(car);
    vehicles.push({
      mesh: car,
      curve: curves.innerRoad,
      speed: 0.008 + Math.random() * 0.005,
      offset: i / 5,
      type: "car",
    });
  }

  // អ្នកថ្មើរជើង ៨
  const shirtColors = ["#3498db", "#e74c3c", "#f39c12", "#27ae60", "#9b59b6", "#1abc9c", "#e67e22", "#2c3e50"];
  for (let i = 0; i < 8; i++) {
    const walker = createWalker(shirtColors[i]);
    group.add(walker);
    vehicles.push({
      mesh: walker,
      curve: curves.walkway,
      speed: 0.005 + Math.random() * 0.003,
      offset: i / 8,
      type: "walker",
    });
  }

  return { group, vehicles };
}

/* ============================================================
   Update traffic (ហៅក្នុង animation loop)
   ============================================================ */
export function updateTraffic(
  vehicles: TrafficVehicle[],
  elapsed: number
): void {
  vehicles.forEach((v) => {
    let t = (v.offset + v.speed * elapsed) % 1;
    if (t < 0) t += 1;

    const point = v.curve.getPointAt(t);
    const tangent = v.curve.getTangentAt(t);

    v.mesh.position.copy(point);
    // បង្វិលរថយន្តឱ្យងាកតាម tangent
    const angle = Math.atan2(tangent.x, tangent.z);
    v.mesh.rotation.y = angle;

    // បង្វិលកង់
    v.mesh.traverse((child) => {
      if (child.name === "wheel") {
        child.rotation.x += v.speed * 30;
      }
      if (child.name === "leg") {
        // ជើងញាក់
        const legMesh = child as THREE.Mesh;
        legMesh.rotation.x = Math.sin(elapsed * 8 + v.offset * 10) * 0.4;
      }
    });
  });
}
