import * as THREE from 'three';

export function createHelicopter(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'helicopter';
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x223344, roughness: 0.5, metalness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88bbee, roughness: 0.1, metalness: 0.8 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffcc00 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 3, 16, 32), bodyMat);
  body.rotation.z = Math.PI / 2; body.castShadow = true; g.add(body);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), glassMat);
  cockpit.position.set(2, 0, 0); cockpit.scale.set(1.2, 0.8, 0.8); g.add(cockpit);

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.1, 5, 8), bodyMat);
  tail.rotation.z = Math.PI / 2; tail.position.set(-3.5, 0.2, 0); tail.castShadow = true; g.add(tail);

  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2, 0.1), blackMat);
  tailRotor.position.set(-6, 0.2, 0); tailRotor.name = 'tail-rotor'; g.add(tailRotor);

  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 1.6, 0);
  mainRotor.name = 'main-rotor';
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.5), blackMat);
    blade.rotation.y = (i / 4) * Math.PI * 2;
    mainRotor.add(blade);
  }
  g.add(mainRotor);

  const skidL = new THREE.Mesh(new THREE.BoxGeometry(3, 0.2, 0.2), yellowMat);
  skidL.position.set(0, -1.5, 0.8); g.add(skidL);
  const skidR = skidL.clone(); skidR.position.z = -0.8; g.add(skidR);
  for (let x of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), bodyMat);
    strut.position.set(x, -1, 0); g.add(strut);
  }

  return g;
}
