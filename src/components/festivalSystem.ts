import * as THREE from "three";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   ភ្លើងបុណ្យ (Fireworks)
   ============================================================ */
export interface FireworkParticle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export interface Firework {
  group: THREE.Group;
  particles: FireworkParticle[];
  active: boolean;
  timer: number;
}

export function createFirework(): Firework {
  const group = new THREE.Group();
  group.visible = false;
  return { group, particles: [], active: false, timer: 0 };
}

export function launchFirework(firework: Firework, x: number, z: number): void {
  // សម្អាតចាស់
  while (firework.group.children.length > 0) {
    firework.group.remove(firework.group.children[0]);
  }
  firework.particles = [];

  const colors = ["#e74c3c", "#f1c40f", "#3498db", "#e91e63", "#27ae60", "#f39c12", "#9b59b6"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const count = 30 + Math.floor(Math.random() * 20);

  for (let i = 0; i < count; i++) {
    const particle = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 6, 6),
      new THREE.MeshBasicMaterial({ color })
    );
    particle.position.set(x, 30, z);
    firework.group.add(particle);

    const angle = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 5 + Math.random() * 8;
    firework.particles.push({
      mesh: particle,
      velocity: new THREE.Vector3(
        Math.sin(phi) * Math.cos(angle) * speed,
        Math.cos(phi) * speed * 0.8,
        Math.sin(phi) * Math.sin(angle) * speed
      ),
      life: 0,
      maxLife: 1.5 + Math.random() * 0.5,
    });
  }

  firework.active = true;
  firework.timer = 0;
  firework.group.visible = true;
}

export function updateFirework(firework: Firework, delta: number): void {
  if (!firework.active) return;

  firework.timer += delta;
  let aliveCount = 0;

  firework.particles.forEach((p) => {
    p.life += delta;
    if (p.life < p.maxLife) {
      // ចលនា
      p.mesh.position.x += p.velocity.x * delta;
      p.mesh.position.y += p.velocity.y * delta;
      p.mesh.position.z += p.velocity.z * delta;

      // ទំនាញ
      p.velocity.y -= 9.8 * delta * 0.5;

      // Fade
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - p.life / p.maxLife;
      mat.transparent = true;
      aliveCount++;
    } else {
      p.mesh.visible = false;
    }
  });

  if (aliveCount === 0) {
    firework.active = false;
    firework.group.visible = false;
  }
}

/* ============================================================
   ចង្កៀងគោម (Lantern)
   ============================================================ */
export interface Lantern {
  mesh: THREE.Group;
  light: THREE.PointLight;
  phase: number;
}

export function createLantern(color = "#e74c3c"): Lantern {
  const group = new THREE.Group();

  // តួចង្កៀង
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 12, 8),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.9,
    })
  );
  body.scale.set(1, 1.3, 1);
  body.position.y = 3;
  group.add(body);

  // ខ្សែពួរ
  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1, 4),
    mat("#8b6f47")
  );
  string.position.y = 4;
  group.add(string);

  // Point light
  const light = new THREE.PointLight(color, 1.5, 8);
  light.position.y = 3;
  group.add(light);

  return { mesh: group, light, phase: Math.random() * Math.PI * 2 };
}

export function createLanterns(
  count = 20,
  radius = 100
): { group: THREE.Group; lanterns: Lantern[] } {
  const group = new THREE.Group();
  const lanterns: Lantern[] = [];
  const colors = ["#e74c3c", "#f39c12", "#f1c40f", "#e91e63"];

  for (let i = 0; i < count; i++) {
    const lantern = createLantern(colors[i % colors.length]);
    const angle = (i / count) * Math.PI * 2;
    const r = radius * (0.7 + Math.random() * 0.3);
    lantern.mesh.position.set(
      Math.cos(angle) * r,
      0,
      Math.sin(angle) * r
    );
    group.add(lantern.mesh);
    lanterns.push(lantern);
  }

  return { group, lanterns };
}

export function updateLanterns(lanterns: Lantern[], elapsed: number, night: boolean): void {
  lanterns.forEach((l, i) => {
    // បក់តាមខ្យល់
    l.mesh.rotation.z = Math.sin(elapsed * 1.5 + l.phase) * 0.1;

    // ពន្លឺ flicker
    const flicker = 0.8 + Math.sin(elapsed * 3 + i) * 0.2;
    const target = night ? 1.5 : 0;
    l.light.intensity += (target * flicker - l.light.intensity) * 0.05;
    const bodyMat = (l.mesh.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial;
    bodyMat.emissiveIntensity += ((night ? 1.5 : 0.2) - bodyMat.emissiveIntensity) * 0.05;
  });
}

/* ============================================================
   ពិធីបុណ្យ (Festival) — មនុស្សជុំគ្នា
   ============================================================ */
export interface FestivalPerson {
  mesh: THREE.Group;
  phase: number;
}

export function createFestivalPerson(color: string): THREE.Group {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.9, 8),
    mat(color)
  );
  body.position.y = 1.05;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 8, 8),
    mat("#f5cba7")
  );
  head.position.y = 1.7;
  g.add(head);

  [-0.32, 0.32].forEach((x) => {
    const arm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.7, 6),
      mat(color)
    );
    arm.position.set(x, 1.05, 0);
    arm.name = "arm";
    g.add(arm);
  });

  [-0.12, 0.12].forEach((x) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.6, 6),
      mat("#2c3e50")
    );
    leg.position.set(x, 0.3, 0);
    g.add(leg);
  });

  return g;
}

export function createFestival(
  count = 30,
  centerX = 0,
  centerZ = 50
): { group: THREE.Group; people: FestivalPerson[] } {
  const group = new THREE.Group();
  const people: FestivalPerson[] = [];
  const colors = ["#e74c3c", "#f39c12", "#f1c40f", "#3498db", "#27ae60", "#9b59b6"];

  for (let i = 0; i < count; i++) {
    const person = createFestivalPerson(colors[i % colors.length]);
    const angle = (i / count) * Math.PI * 2;
    const radius = 3 + Math.random() * 8;
    person.position.set(
      centerX + Math.cos(angle) * radius,
      0,
      centerZ + Math.sin(angle) * radius
    );
    person.rotation.y = -angle + Math.PI / 2;
    group.add(person);

    people.push({ mesh: person, phase: Math.random() * Math.PI * 2 });
  }

  return { group, people };
}

export function updateFestival(people: FestivalPerson[], elapsed: number): void {
  people.forEach((p) => {
    // លោតឡើងចុះ (dance)
    p.mesh.position.y = Math.abs(Math.sin(elapsed * 3 + p.phase)) * 0.3;

    // ដៃបក់
    p.mesh.traverse((child) => {
      if (child.name === "arm") {
        child.rotation.z = Math.sin(elapsed * 5 + p.phase) * 0.8;
      }
    });
  });
}
