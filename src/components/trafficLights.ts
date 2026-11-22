import * as THREE from 'three';

export interface TrafficLight {
  group: THREE.Group;
  red: THREE.Mesh;
  yellow: THREE.Mesh;
  green: THREE.Mesh;
  phase: number; // ត្រូវការសម្រាប់ Village3D
  update: (time: number) => void;
}

export function createTrafficLight(x: number, z: number): TrafficLight {
  const group = new THREE.Group();
  group.position.set(x, 2.5, z);

  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 8), poleMat);
  pole.position.y = 3; pole.castShadow = true; group.add(pole);

  const boxMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.8, 0.6), boxMat);
  box.position.y = 6; group.add(box);

  const offMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, emissive: 0xffcc00, emissiveIntensity: 2 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 2 });

  const red = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), offMat);
  red.position.set(0, 6.5, 0.3); group.add(red);
  const yellow = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), offMat);
  yellow.position.set(0, 6, 0.3); group.add(yellow);
  const green = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), offMat);
  green.position.set(0, 5.5, 0.3); group.add(green);

  const tl: TrafficLight = {
    group, red, yellow, green, phase: 0,
    update: (time: number) => {
      const cycle = time % 15;
      tl.phase = cycle;
      red.material = cycle < 7 ? redMat : offMat;
      yellow.material = (cycle >= 7 && cycle < 8) ? yellowMat : offMat;
      green.material = cycle >= 8 ? greenMat : offMat;
    }
  };
  return tl;
}

// បន្ថែម API ចាស់សម្រាប់ Village3D
export function createTrafficLights(..._args: any[]): any {
  const group = new THREE.Group();
  const lights = [createTrafficLight(0, 0)];
  lights.forEach((l) => group.add(l.group));
  return {
    group,
    lights,
    update: (time: number) => { lights.forEach((l) => l.update(time)); }
  };
}

export function updateTrafficLights(system: any, time: number): void {
  if (system && typeof system.update === 'function') system.update(time);
}
