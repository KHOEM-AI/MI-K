import * as THREE from "three";

/* ============================================================
   ផ្កាយ (Stars) — សម្រាប់ពេលយប់
   ============================================================ */
export function createStars(count = 1500, radius = 800): THREE.Points {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Sphere distribution (hemisphere ខាងលើ)
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const r = radius * (0.8 + Math.random() * 0.2);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = Math.abs(r * Math.cos(phi)); // តែខាងលើ
    const z = r * Math.sin(phi) * Math.sin(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // ពណ៌ផ្កាយ (ស, ខៀវ, លឿង)
    const colorChoice = Math.random();
    if (colorChoice < 0.7) {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    } else if (colorChoice < 0.85) {
      colors[i * 3] = 0.8;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 1;
    } else {
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 0.9;
      colors[i * 3 + 2] = 0.6;
    }
  }

  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 2,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(geometry, material);
  stars.name = "stars";
  return stars;
}

export function updateStars(stars: THREE.Points, night: boolean, delta: number): void {
  const mat = stars.material as THREE.PointsMaterial;
  const target = night ? 1 : 0;
  mat.opacity += (target - mat.opacity) * delta * 3;
}

/* ============================================================
   ព្រះច័ន្ទ (Moon)
   ============================================================ */
export function createMoon(): THREE.Group {
  const g = new THREE.Group();
  g.name = "moon";

  const moonMat = new THREE.MeshStandardMaterial({
    color: "#f5f5dc",
    emissive: "#e8e8d0",
    emissiveIntensity: 0.8,
    roughness: 1,
  });

  const moon = new THREE.Mesh(new THREE.SphereGeometry(20, 16, 16), moonMat);
  g.add(moon);

  // ចំណុចងងឹត ៗ លើព្រះច័ន្ទ (craters)
  for (let i = 0; i < 5; i++) {
    const crater = new THREE.Mesh(
      new THREE.SphereGeometry(2 + Math.random() * 3, 8, 8),
      new THREE.MeshStandardMaterial({ color: "#d4d4c8", roughness: 1 })
    );
    crater.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      15 + Math.random() * 3
    );
    g.add(crater);
  }

  g.position.set(300, 250, -400);
  g.visible = false;
  return g;
}

/* ============================================================
   Glow ព្រះច័ន្ទ
   ============================================================ */
export function createMoonGlow(): THREE.Mesh {
  const glowMat = new THREE.MeshBasicMaterial({
    color: "#f5f5dc",
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
    depthWrite: false,
  });

  const glow = new THREE.Mesh(new THREE.SphereGeometry(35, 16, 16), glowMat);
  glow.name = "moonGlow";
  return glow;
}
