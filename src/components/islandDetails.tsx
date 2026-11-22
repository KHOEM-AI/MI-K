import * as THREE from 'three';

// កោះព្រលានយន្តហោះ
export function createAirportDetails(): THREE.Group {
  const g = new THREE.Group();
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
  const concrete = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x88bbee, metalness: 0.9, roughness: 0.1 });

  const runway = new THREE.Mesh(new THREE.BoxGeometry(20, 0.2, 120), asphalt);
  runway.position.set(0, 2.6, 0); runway.receiveShadow = true; g.add(runway);

  for (let z = -55; z <= 55; z += 10) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(1, 0.25, 5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    line.position.set(0, 2.65, z); g.add(line);
  }

  const terminal = new THREE.Mesh(new THREE.BoxGeometry(40, 15, 25), concrete);
  terminal.position.set(30, 10, 0); terminal.castShadow = true; terminal.receiveShadow = true; g.add(terminal);

  for (let i = -3; i <= 3; i++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 0.5), glass);
    win.position.set(30 + i * 5, 10, 12.5); g.add(win);
  }

  const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(3, 4, 20, 16), concrete);
  towerBase.position.set(10, 12, 15); towerBase.castShadow = true; g.add(towerBase);
  const towerTop = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 5, 16), glass);
  towerTop.position.set(10, 24, 15); towerTop.castShadow = true; g.add(towerTop);

  return g;
}

// កោះកំពង់ផែ
export function createPortDetails(): THREE.Group {
  const g = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
  const metal = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.5, metalness: 0.8 });
  const containerColors = [0xcc3333, 0x3366cc, 0x33cc66, 0xccaa33, 0x9933cc];

  const createCrane = (x: number, z: number) => {
    const crane = new THREE.Group();
    const legL = new THREE.Mesh(new THREE.BoxGeometry(1, 25, 1), metal);
    legL.position.set(-4, 12.5, 0); crane.add(legL);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(1, 25, 1), metal);
    legR.position.set(4, 12.5, 0); crane.add(legR);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(2, 1, 25), metal);
    arm.position.set(0, 25, 5); crane.add(arm);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 4), concrete);
    cabin.position.set(0, 20, 0); crane.add(cabin);
    crane.position.set(x, 2.5, z);
    crane.traverse((c) => { if (c instanceof THREE.Mesh) c.castShadow = true; });
    return crane;
  };

  g.add(createCrane(-10, -10));
  g.add(createCrane(-10, 10));

  for (let i = 0; i < 15; i++) {
    const cColor = containerColors[i % containerColors.length];
    const box = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 2.5), new THREE.MeshStandardMaterial({ color: cColor, roughness: 0.8 }));
    box.position.set(5 + (i % 3) * 7, 4 + Math.floor(i / 9) * 3, -15 + (i % 9) * 3);
    box.castShadow = true; box.receiveShadow = true;
    g.add(box);
  }

  return g;
}

// កោះធម្មជាតិ
export function createNatureDetails(): THREE.Group {
  const g = new THREE.Group();
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 1.0 });
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 1.0 });

  const createMountain = (x: number, z: number, radius: number, height: number) => {
    const mountain = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), rockMat);
    mountain.position.set(x, 2.5 + height / 2, z);
    mountain.castShadow = true; mountain.receiveShadow = true;
    g.add(mountain);
    const peak = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.6, height * 0.4, 8), grassMat);
    peak.position.set(x, 2.5 + height - (height * 0.2), z);
    g.add(peak);
  };

  createMountain(0, 0, 30, 40);
  createMountain(-20, -15, 20, 25);
  createMountain(25, 10, 18, 20);

  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 10 + Math.random() * 30;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    
    const treeGroup = new THREE.Group();
    const h = 3 + Math.random() * 4;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, h, 6), trunkMat);
    trunk.position.y = h / 2; treeGroup.add(trunk);
    const leaves = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 6), grassMat);
    leaves.position.y = h + 1; treeGroup.add(leaves);
    
    treeGroup.position.set(x, 2.5, z);
    treeGroup.traverse((c) => { if (c instanceof THREE.Mesh) c.castShadow = true; });
    g.add(treeGroup);
  }

  return g;
}
