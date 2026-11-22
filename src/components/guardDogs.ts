import * as THREE from 'three';

export function createGuardDog(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'guard-dog';
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1a, roughness: 0.8 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 0.7 });
  const tongueMat = new THREE.MeshStandardMaterial({ color: 0xff5588 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 6, 12), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.8;
  body.castShadow = true;
  g.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 12), bodyMat);
  head.position.set(0.85, 1.05, 0);
  head.castShadow = true;
  g.add(head);

  for (const z of [-0.2, 0.2]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 4), darkMat);
    ear.position.set(0.85, 1.35, z);
    g.add(ear);
  }

  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.1, 0.6, 6), bodyMat);
  tail.position.set(-0.75, 1.05, 0);
  tail.rotation.z = -0.5;
  tail.name = 'dog-tail';
  g.add(tail);

  const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
  const legPositions = [[0.4, 0.4, 0.25], [0.4, 0.4, -0.25], [-0.4, 0.4, 0.25], [-0.4, 0.4, -0.25]];
  legPositions.forEach(([x, y, z], i) => {
    const leg = new THREE.Mesh(legGeo, darkMat);
    leg.position.set(x, y, z);
    leg.name = 'dog-leg-' + i;
    leg.castShadow = true;
    g.add(leg);
  });

  const tongue = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.15), tongueMat);
  tongue.position.set(1.1, 0.9, 0);
  g.add(tongue);

  return g;
}

export function createGuardDogs(count: number = 4): THREE.Group[] {
  const dogs: THREE.Group[] = [];
  for (let i = 0; i < count; i++) {
    dogs.push(createGuardDog());
  }
  return dogs;
}
