import * as THREE from 'three';

export class WeatherSystem {
  public rain: THREE.Points;
  public clouds: THREE.Group;
  private rainVelocities: Float32Array;
  private rainPositions: Float32Array;
  private rainCount = 3000;

  constructor() {
    // --- ភ្លៀង ---
    const rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);
    this.rainVelocities = new Float32Array(this.rainCount);

    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 800;
      this.rainPositions[i * 3 + 1] = Math.random() * 200;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 800;
      this.rainVelocities[i] = 0.5 + Math.random() * 1.5;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({ color: 0xaaccff, size: 0.8, transparent: true, opacity: 0.6 });
    this.rain = new THREE.Points(rainGeo, rainMat);
    this.rain.visible = false;
    this.rain.name = 'rain';

    // --- ពពក ---
    this.clouds = new THREE.Group();
    this.clouds.name = 'clouds';
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 1 });
    
    for (let i = 0; i < 15; i++) {
      const c = new THREE.Group();
      const parts = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < parts; j++) {
        const geo = new THREE.SphereGeometry(5 + Math.random() * 5, 8, 8);
        const mesh = new THREE.Mesh(geo, cloudMat);
        mesh.position.set(j * 6 - parts * 3, Math.random() * 2, Math.random() * 4 - 2);
        c.add(mesh);
      }
      c.position.set((Math.random() - 0.5) * 800, 120 + Math.random() * 50, (Math.random() - 0.5) * 800);
      this.clouds.add(c);
    }
  }

  update(time: number, dt: number): void {
    // ធ្វើឱ្យភ្លៀងធ្លាក់
    if (this.rain.visible) {
      const positions = this.rain.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < this.rainCount; i++) {
        positions[i * 3 + 1] -= this.rainVelocities[i] * dt * 60;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 200;
        }
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
    }

    // ធ្វើឱ្យពពករសាត់
    this.clouds.children.forEach((cloud) => {
      cloud.position.x += dt * 3;
      if (cloud.position.x > 400) cloud.position.x = -400;
    });
  }

  toggleRain(): boolean {
    this.rain.visible = !this.rain.visible;
    return this.rain.visible;
  }
}
