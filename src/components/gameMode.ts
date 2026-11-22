import * as THREE from 'three';

export class GameMode {
  private spawnGroup = new THREE.Group();
  private scene: THREE.Scene;
  private count = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.spawnGroup.name = 'game-mode-spawned';
    scene.add(this.spawnGroup);
  }

  spawnAt(type: 'prisoner' | 'guard', pos: THREE.Vector3): number {
    const color = type === 'prisoner' ? 0xff8800 : 0x2233aa;
    const human = this.createMiniHuman(color);
    human.position.copy(pos);
    human.position.y += 2.5;
    this.spawnGroup.add(human);
    this.count++;
    return this.count;
  }

  private createMiniHuman(color: number): THREE.Group {
    const g = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.7 });
    const suitMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), skinMat);
    head.position.y = 2.2;
    head.castShadow = true;
    g.add(head);

    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.8, 6, 12), suitMat);
    body.position.y = 1.3;
    body.castShadow = true;
    g.add(body);

    const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.7, 6, 12), suitMat);
    legL.position.set(-0.2, 0.4, 0);
    legL.castShadow = true;
    g.add(legL);

    const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.7, 6, 12), suitMat);
    legR.position.set(0.2, 0.4, 0);
    legR.castShadow = true;
    g.add(legR);

    return g;
  }

  getSpawnedCount(): number { return this.count; }

  clear(): void {
    while (this.spawnGroup.children.length > 0) {
      const c = this.spawnGroup.children[0];
      this.spawnGroup.remove(c);
      c.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }
    this.count = 0;
  }
}
