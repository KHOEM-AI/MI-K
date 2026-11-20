import * as THREE from "three";

/* ============================================================
   ភ្លៀង (Rain) — ប្រើ Points system
   ============================================================ */
export interface RainSystem {
  points: THREE.Points;
  count: number;
  positions: Float32Array;
  velocities: Float32Array;
}

export function createRain(count = 2000, area = 400, height = 150): RainSystem {
  // ទឹកភ្លៀងតំណក់ (Points)
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * area;
    positions[i * 3 + 1] = Math.random() * height;
    positions[i * 3 + 2] = (Math.random() - 0.5) * area;
    velocities[i] = 1 + Math.random() * 2;
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: "#a0c4e8",
    size: 0.5,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.name = "rain";
  points.visible = false;

  return { points, count, positions, velocities };
}

export function updateRain(
  rain: RainSystem,
  delta: number,
  area = 400,
  height = 150
): void {
  if (!rain.points.visible) return;

  const pos = rain.points.geometry.attributes.position.array as Float32Array;
  const speed = 80;

  for (let i = 0; i < rain.count; i++) {
    pos[i * 3 + 1] -= rain.velocities[i] * speed * delta;

    // Wrap around (បើធ្លាក់ដល់ដី → ត្រឡប់ទៅលើ)
    if (pos[i * 3 + 1] < 0) {
      pos[i * 3 + 1] = height;
      pos[i * 3] = (Math.random() - 0.5) * area;
      pos[i * 3 + 2] = (Math.random() - 0.5) * area;
    }
  }

  rain.points.geometry.attributes.position.needsUpdate = true;
}

/* ============================================================
   ពន្លឺផ្លេកបន្ទោរ (Lightning)
   ============================================================ */
export interface LightningSystem {
  light: THREE.DirectionalLight;
  timer: number;
  nextFlash: number;
}

export function createLightning(): LightningSystem {
  const light = new THREE.DirectionalLight(0xffffff, 0);
  light.position.set(0, 200, 0);
  light.name = "lightning";
  return { light, timer: 0, nextFlash: 5 + Math.random() * 10 };
}

export function updateLightning(
  lightning: LightningSystem,
  delta: number
): number {
  lightning.timer += delta;
  lightning.nextFlash -= delta;

  if (lightning.nextFlash <= 0) {
    // ចាប់ផ្តើមផ្លេក
    lightning.light.intensity = 4;
    lightning.nextFlash = 8 + Math.random() * 15;
    lightning.timer = 0;
    return 1; // return flash intensity
  }

  // ថយចុះពន្លឺ
  lightning.light.intensity *= 0.85;
  if (lightning.light.intensity < 0.01) {
    lightning.light.intensity = 0;
  }
  return 0;
}
