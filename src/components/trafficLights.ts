import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   ភ្លើងស្តុបមួយ (Traffic Light)
   ============================================================ */
export interface TrafficLight {
  group: THREE.Group;
  red: THREE.MeshStandardMaterial;
  yellow: THREE.MeshStandardMaterial;
  green: THREE.MeshStandardMaterial;
  phase: number; // 0 = ក្រហម, 1 = លឿង, 2 = បៃតង
  timer: number;
}

export function createTrafficLight(): TrafficLight {
  const g = new THREE.Group();

  // បង្គោល
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 5, 8),
    mat("#2c3e50", { metalness: 0.7 })
  );
  pole.position.y = 2.5;
  pole.castShadow = true;
  g.add(pole);

  // ប្រអប់ភ្លើង
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 1.8, 0.4),
    mat("#1a1a1a")
  );
  box.position.y = 5.5;
  box.castShadow = true;
  g.add(box);

  // ភ្លើងក្រហម
  const red = new THREE.MeshStandardMaterial({ color: "#e74c3c", emissive: "#e74c3c", emissiveIntensity: 0 });
  const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), red);
  redLight.position.set(0, 6, 0.25);
  g.add(redLight);

  // ភ្លើងលឿង
  const yellow = new THREE.MeshStandardMaterial({ color: "#f39c12", emissive: "#f39c12", emissiveIntensity: 0 });
  const yellowLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), yellow);
  yellowLight.position.set(0, 5.5, 0.25);
  g.add(yellowLight);

  // ភ្លើងបៃតង
  const green = new THREE.MeshStandardMaterial({ color: "#27ae60", emissive: "#27ae60", emissiveIntensity: 0 });
  const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), green);
  greenLight.position.set(0, 5, 0.25);
  g.add(greenLight);

  return {
    group: g,
    red,
    yellow,
    green,
    phase: 2,
    timer: 0,
  };
}

/* ============================================================
   បង្កើតភ្លើងស្តុប ៤ (តាមផ្លូវបំបែក)
   ============================================================ */
export function createTrafficLights(): {
  group: THREE.Group;
  lights: TrafficLight[];
} {
  const group = new THREE.Group();
  const lights: TrafficLight[] = [];

  // ទីតាំងតាមផ្លូវបំបែក (៤ ជ្រុង)
  const positions = [
    { x: -20, z: -20, rotY: 0 },
    { x: 20, z: -20, rotY: Math.PI / 2 },
    { x: 20, z: 20, rotY: Math.PI },
    { x: -20, z: 20, rotY: -Math.PI / 2 },
  ];

  positions.forEach(({ x, z, rotY }) => {
    const tl = createTrafficLight();
    tl.group.position.set(x, 0, z);
    tl.group.rotation.y = rotY;
    group.add(tl.group);
    lights.push(tl);
  });

  return { group, lights };
}

/* ============================================================
   Update traffic lights (ក្រហម → បៃតង → លឿង → ក្រហម)
   ============================================================ */
export function updateTrafficLights(lights: TrafficLight[], delta: number): void {
  lights.forEach((tl) => {
    tl.timer += delta;

    // វដ្ត: បៃតង ៥ វិ → លឿង ២ វិ → ក្រហម ៥ វិ
    if (tl.phase === 2 && tl.timer > 5) {
      tl.phase = 1;
      tl.timer = 0;
    } else if (tl.phase === 1 && tl.timer > 2) {
      tl.phase = 0;
      tl.timer = 0;
    } else if (tl.phase === 0 && tl.timer > 5) {
      tl.phase = 2;
      tl.timer = 0;
    }

    // Update emissive
    tl.red.emissiveIntensity = tl.phase === 0 ? 2.5 : 0;
    tl.yellow.emissiveIntensity = tl.phase === 1 ? 2.5 : 0;
    tl.green.emissiveIntensity = tl.phase === 2 ? 2.5 : 0;
  });
}
