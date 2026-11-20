import * as THREE from "three";

export function createSchoolBuilding() {
  const g = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.7 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x224466, emissiveIntensity: 0.5, metalness: 0.8, roughness: 0.1 });

  const building = new THREE.Mesh(new THREE.BoxGeometry(16, 12, 10), wallMat);
  building.position.y = 6;
  g.add(building);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(17, 1, 11), roofMat);
  roof.position.y = 12.5;
  g.add(roof);

  // បង្អួច ៣ ជាន់
  for (let floor = 1; floor <= 3; floor++) {
    for (let w = -3; w <= 3; w++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.2), windowMat);
      win.position.set(w * 2, floor * 3.5, 5.1);
      g.add(win);
    }
  }

  // ទ្វារចូល
  const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
  const door = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.3), doorMat);
  door.position.set(0, 2, 5.15);
  g.add(door);

  g.userData = { windowMaterial: windowMat };
  return g;
}

export function createFlagPole() {
  const g = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.1 });
  const flagMat = new THREE.MeshStandardMaterial({ color: 0x0000ff, side: THREE.DoubleSide });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8, 8), poleMat);
  pole.position.y = 4;
  g.add(pole);

  const flag = new THREE.Mesh(new THREE.BoxGeometry(2, 1.2, 0.05), flagMat);
  flag.position.set(1, 7, 0);
  g.add(flag);
  return g;
}

export function createStudent(shirtColor: number) {
  const g = new THREE.Group();
  const shirt = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.9 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x1e3a8a });
  const skin = new THREE.MeshStandardMaterial({ color: 0xffdbac });
  const hair = new THREE.MeshStandardMaterial({ color: 0x1a0f08 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 8), shirt);
  body.position.y = 1.05; g.add(body);
  for (let x of [-0.15, 0.15]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8), pants);
    leg.position.set(x, 0.35, 0); g.add(leg);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), skin);
  head.position.y = 1.8; g.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 16, 0, Math.PI*2, 0, Math.PI/2), hair);
  cap.position.y = 1.83; g.add(cap);
  return g;
}

export function createTeacher() {
  const g = createStudent(0xfbbf24);
  g.scale.set(1.2, 1.2, 1.2);
  return g;
}
