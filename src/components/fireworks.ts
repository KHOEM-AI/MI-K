import * as THREE from 'three';

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class FireworksSystem {
  private particles: Particle[] = [];
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry;
  private maxParticles = 2000;

  constructor(scene: THREE.Scene) {
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxParticles * 3);
    const colors = new Float32Array(this.maxParticles * 3);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  launch(): void {
    const origin = new THREE.Vector3((Math.random() - 0.5) * 100, 20, (Math.random() - 0.5) * 100);
    const baseColor = new THREE.Color().setHSL(Math.random(), 1, 0.5);

    for (let i = 0; i < 300; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 15 + Math.random() * 20;

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed,
        Math.sin(phi) * Math.sin(theta) * speed
      );

      this.particles.push({
        position: origin.clone(),
        velocity,
        life: 0,
        maxLife: 2 + Math.random(),
        color: baseColor.clone().offsetHSL((Math.random() - 0.5) * 0.2, 0, 0)
      });
    }
  }

  update(dt: number): void {
    if (this.particles.length === 0) return;

    const posArray = this.geometry.attributes.position.array as Float32Array;
    const colArray = this.geometry.attributes.color.array as Float32Array;

    this.particles = this.particles.filter(p => {
      p.life += dt;
      if (p.life >= p.maxLife) return false;

      p.velocity.y -= 9.8 * dt; // ទំនាញផែនដី
      p.position.addScaledVector(p.velocity, dt);
      return true;
    });

    posArray.fill(0);
    colArray.fill(0);

    this.particles.forEach((p, i) => {
      if (i >= this.maxParticles) return;
      const alpha = 1 - (p.life / p.maxLife);
      posArray[i * 3] = p.position.x;
      posArray[i * 3 + 1] = p.position.y;
      posArray[i * 3 + 2] = p.position.z;
      colArray[i * 3] = p.color.r * alpha;
      colArray[i * 3 + 1] = p.color.g * alpha;
      colArray[i * 3 + 2] = p.color.b * alpha;
    });

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.setDrawRange(0, Math.min(this.particles.length, this.maxParticles));
  }
}
