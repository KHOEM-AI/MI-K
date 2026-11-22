import * as THREE from 'three';

export interface NightLights {
  group: THREE.Group;
  setVisible: (on: boolean) => void;
}

export function createNightLights(): NightLights {
  const group = new THREE.Group();
  group.name = 'night-lights';
  group.visible = false;

  const lampMat = new THREE.MeshStandardMaterial({ color: 0xffdd77, emissive: 0xffaa33, emissiveIntensity: 1.5 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x = Math.cos(angle) * 42;
    const z = Math.sin(angle) * 42;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 8, 8), poleMat);
    pole.position.set(x, 6.5, z);
    pole.castShadow = true;
    group.add(pole);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 12), lampMat);
    lamp.position.set(x, 10.5, z);
    group.add(lamp);

    const light = new THREE.PointLight(0xffaa33, 1.5, 30);
    light.position.set(x, 10.5, z);
    group.add(light);
  }

  for (let i = -5; i <= 5; i++) {
    const light = new THREE.PointLight(0xffcc66, 0.8, 20);
    light.position.set(i * 5, 5, 0);
    group.add(light);
    const light2 = new THREE.PointLight(0xffcc66, 0.8, 20);
    light2.position.set(0, 5, i * 5);
    group.add(light2);
  }

  return {
    group,
    setVisible: (on: boolean) => { group.visible = on; },
  };
}
