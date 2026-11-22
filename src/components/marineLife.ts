import * as THREE from 'three';

// បង្កើតត្រីបង្ក (Manta Ray)
export function createMantaRay(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7, side: THREE.DoubleSide });
  
  // តួកណ្តាល
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1, 2, 8, 16), mat);
  body.rotation.x = Math.PI / 2;
  body.scale.set(1, 0.2, 1);
  g.add(body);

  // ស្លាបធំៗ
  const wingGeo = new THREE.ConeGeometry(2.5, 5, 4);
  wingGeo.rotateX(Math.PI / 2);
  const wingL = new THREE.Mesh(wingGeo, mat);
  wingL.position.set(-2.5, 0, 0);
  wingL.rotation.z = 0.3;
  g.add(wingL);
  
  const wingR = new THREE.Mesh(wingGeo, mat);
  wingR.position.set(2.5, 0, 0);
  wingR.rotation.z = -0.3;
  g.add(wingR);

  // កន្ទុយវែង
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.02, 5, 8), mat);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0, -3);
  g.add(tail);

  g.traverse((c) => { if (c instanceof THREE.Mesh) c.castShadow = true; });
  g.name = 'manta-ray';
  return g;
}

// បង្កើតត្រីឆ្លាម (Shark)
export function createShark(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a5a6a, roughness: 0.6 });
  const belly = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1, 3, 8, 16), mat);
  body.rotation.x = Math.PI / 2;
  g.add(body);

  const fin = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.5, 4), mat);
  fin.position.set(0, 1, -0.5);
  fin.rotation.x = -0.3;
  g.add(fin);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2, 4), mat);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0, -2.5);
  g.add(tail);

  const bellyMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 2.8, 8, 16), belly);
  bellyMesh.rotation.x = Math.PI / 2;
  bellyMesh.position.y = -0.2;
  g.add(bellyMesh);

  g.traverse((c) => { if (c instanceof THREE.Mesh) c.castShadow = true; });
  g.name = 'shark';
  return g;
}

// បង្កើតដុលហ្វីន (Dolphin)
export function createDolphin(): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x6688aa, roughness: 0.4 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.6, 2, 8, 16), mat);
  body.rotation.x = Math.PI / 2;
  g.add(body);

  const fin = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 4), mat);
  fin.position.set(0, 0.6, -0.3);
  g.add(fin);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 8), mat);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0, 1.4);
  g.add(nose);

  g.traverse((c) => { if (c instanceof THREE.Mesh) c.castShadow = true; });
  g.name = 'dolphin';
  return g;
}

// បង្កើតអណ្តើកសមុទ្រ (Sea Turtle)
export function createSeaTurtle(): THREE.Group {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: 0x2e4d2e, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0x5a8a5a, roughness: 0.6 });

  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), shellMat);
  shell.scale.set(1, 0.5, 1.2);
  g.add(shell);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), skinMat);
  head.position.set(0, 0, 1);
  g.add(head);

  // ជើងទាំង ៤
  for (let i = 0; i < 4; i++) {
    const flipper = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 4, 8), skinMat);
    flipper.position.set(i < 2 ? -0.7 : 0.7, 0, i % 2 === 0 ? 0.5 : -0.5);
    flipper.rotation.z = i < 2 ? Math.PI / 2 : -Math.PI / 2;
    g.add(flipper);
  }

  g.traverse((c) => { if (c instanceof THREE.Mesh) c.castShadow = true; });
  g.name = 'turtle';
  return g;
}

// បង្កើតហ្វូងត្រីតូចៗ (School of Fish) - ប្រើ InstancedMesh ដើម្បីសន្សំសំចៃ
export function createFishSchool(count: number = 30): THREE.Group {
  const g = new THREE.Group();
  const geo = new THREE.ConeGeometry(0.15, 0.5, 6);
  geo.rotateX(Math.PI / 2);
  const mat = new THREE.MeshStandardMaterial({ color: 0xffaa33, roughness: 0.5, metalness: 0.3 });

  const inst = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    dummy.position.set(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 8
    );
    dummy.rotation.y = Math.random() * Math.PI * 2;
    dummy.updateMatrix();
    inst.setMatrixAt(i, dummy.matrix);
  }
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = true;
  g.add(inst);
  g.name = 'fish-school';
  return g;
}
