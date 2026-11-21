import * as THREE from 'three';

// បង្កើតមនុស្សរលូនៗ (ដាក់ឈ្មោះឱ្យដៃជើងដើម្បីងាយស្រួលធ្វើចលនា)
export function createSmoothHuman(color: string | number, role: 'prisoner' | 'guard' | 'chef' | 'cleaner'): THREE.Group {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xe8b88a, roughness: 0.6 });
  const suit = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), skin);
  head.position.y = 1.6; head.castShadow = true; g.add(head);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.6, 8, 16), suit);
  body.position.y = 0.9; body.castShadow = true; g.add(body);

  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 8, 16), suit);
  armL.position.set(-0.4, 1.0, 0); armL.rotation.z = 0.2; armL.castShadow = true; 
  armL.name = 'left-arm'; // ដាក់ឈ្មោះសម្រាប់ដៃឆ្វេង
  g.add(armL);

  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.5, 8, 16), suit);
  armR.position.set(0.4, 1.0, 0); armR.rotation.z = -0.2; armR.castShadow = true; 
  armR.name = 'right-arm'; // ដាក់ឈ្មោះសម្រាប់ដៃស្តាំ
  g.add(armR);

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.6, 8, 16), dark);
  legL.position.set(-0.15, 0.3, 0); legL.castShadow = true; 
  legL.name = 'left-leg'; // ដាក់ឈ្មោះសម្រាប់ជើងឆ្វេង
  g.add(legL);

  const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.6, 8, 16), dark);
  legR.position.set(0.15, 0.3, 0); legR.castShadow = true; 
  legR.name = 'right-leg'; // ដាក់ឈ្មោះសម្រាប់ជើងស្តាំ
  g.add(legR);

  if (role === 'guard') {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 16), dark);
    hat.position.y = 1.8; g.add(hat);
  } else if (role === 'chef') {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3, 16), new THREE.MeshStandardMaterial({color: 0xffffff}));
    hat.position.y = 1.85; g.add(hat);
  }
  return g;
}

export function createOuterFenceAndSecurity(radius: number = 55): THREE.Group {
  const g = new THREE.Group();
  const fenceMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
  const cameraMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 });

  const fence = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 8, 64, 1, true), fenceMat);
  fence.position.y = 4; fence.castShadow = true; fence.receiveShadow = true;
  g.add(fence);

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * (radius - 2);
    const z = Math.sin(angle) * (radius - 2);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 12, 8), concreteMat);
    pole.position.set(x, 6, z); pole.castShadow = true; g.add(pole);

    const camBase = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1.5), cameraMat);
    camBase.position.set(x, 11.5, z);
    camBase.lookAt(0, 0, 0);
    g.add(camBase);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8), new THREE.MeshStandardMaterial({color: 0xff0000, emissive: 0xff0000}));
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0, 0.8);
    camBase.add(lens);
  }
  return g;
}

export function createPrisonFacilitiesDetails(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.4 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x4a3219, roughness: 1.0 });
  const plantMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.8 });
  const courtMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.9 });

  // ១. តំបន់ស៊ីបាយ
  for (let i = 0; i < 4; i++) {
    const tableGroup = new THREE.Group();
    const table = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 2), woodMat);
    table.position.y = 1.2; table.castShadow = true; tableGroup.add(table);
    const bench1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 0.8), woodMat);
    bench1.position.set(0, 0.6, 1.5); bench1.castShadow = true; tableGroup.add(bench1);
    const bench2 = bench1.clone(); bench2.position.z = -1.5; tableGroup.add(bench2);

    for (let j = 0; j < 3; j++) {
      const prisoner = createSmoothHuman(0xffa500, 'prisoner');
      prisoner.position.set(-2 + j * 2, 0.6, 1.5);
      prisoner.rotation.x = -Math.PI / 2; // អង្គុយ
      tableGroup.add(prisoner);
    }
    tableGroup.position.set(-15 + i * 10, 2.5, 15);
    g.add(tableGroup);
  }

  // ២. បន្ទប់ទឹក
  const bath = new THREE.Mesh(new THREE.BoxGeometry(15, 6, 10), new THREE.MeshStandardMaterial({color: 0x7f8c8d, roughness: 0.9}));
  bath.position.set(25, 5.5, -5); bath.castShadow = true; bath.receiveShadow = true; g.add(bath);
  for(let i=0;i<3;i++) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 8), metalMat);
    pipe.position.set(25 - 4 + i*4, 6, -5); g.add(pipe);
  }

  // ៣. តំបន់ហាត់កីឡា
  const court = new THREE.Mesh(new THREE.CylinderGeometry(12, 12, 0.2, 32), courtMat);
  court.position.set(-25, 2.5, -20); court.receiveShadow = true; g.add(court);
  const hoopPole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 6, 8), metalMat);
  hoopPole.position.set(-25, 5.5, -32); g.add(hoopPole);
  const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.1, 8, 16), metalMat);
  hoop.rotation.x = Math.PI / 2; hoop.position.set(-25, 8.5, -31.5); g.add(hoop);

  // ៤. កន្លែងដាំបន្លែ
  for(let i=0;i<6;i++) {
    const plot = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 8), soilMat);
    plot.position.set(15 + i * 4, 2.6, 25); plot.receiveShadow = true; g.add(plot);
    for(let j=0;j<4;j++) {
      const plant = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), plantMat);
      plant.position.set(15 + i * 4, 2.9, 22 + j * 2); plant.castShadow = true; g.add(plant);
    }
  }

  // ៥. អ្នកទោសដើរ និងអ្នកយាមល្បាត
  const walker = createSmoothHuman(0xffa500, 'prisoner');
  walker.name = 'walking-prisoner'; // ដាក់ឈ្មោះឱ្យអ្នកទោសដើរ
  walker.position.set(0, 2.5, 0); 
  g.add(walker);

  const walker2 = createSmoothHuman(0xffa500, 'prisoner');
  walker2.name = 'walking-prisoner';
  walker2.position.set(5, 2.5, 0); 
  g.add(walker2);

  const patroller = createSmoothHuman(0x2c3e50, 'guard');
  patroller.name = 'patrol-guard'; // ដាក់ឈ្មោះឱ្យអ្នកយាមល្បាត
  patroller.position.set(40, 17, 0); // ដើរលើជញ្ជាំង
  g.add(patroller);

  // ៦. អ្នកអនាម័យ និងចុងភៅ
  const cleaner = createSmoothHuman(0x3498db, 'cleaner'); cleaner.position.set(5, 2.5, 25); g.add(cleaner);
  const chef = createSmoothHuman(0xffffff, 'chef'); chef.position.set(-15, 2.5, 10); g.add(chef);

  return g;
}

export function createEducationAndAdmin(): THREE.Group {
  const g = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0x95a5a6, roughness: 0.9 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x88bbee, roughness: 0.1, metalness: 0.9 });

  const addTallBuilding = (x: number, z: number, w: number, h: number, d: number) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), concrete);
    b.position.set(x, h/2 + 2.5, z); b.castShadow = true; b.receiveShadow = true; g.add(b);
    for(let r=1; r < h/3; r++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(w-2, 1.5, 0.2), glass);
      win.position.set(x, r*3, z + d/2 + 0.1); g.add(win);
    }
  };

  addTallBuilding(-30, -35, 20, 18, 15);
  addTallBuilding(30, -35, 25, 15, 15);

  for(let i=0;i<3;i++){
    const desk = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 2), new THREE.MeshStandardMaterial({color:0x8b5a2b}));
    desk.position.set(30, 3.5, -35 - 4 + i*4); g.add(desk);
    const student = createSmoothHuman(0xffa500, 'prisoner');
    student.position.set(30, 2.5, -35 - 4 + i*4);
    student.rotation.x = -Math.PI/2; g.add(student);
  }

  return g;
}

export function createFlowerGardenAndPaths(): THREE.Group {
  const g = new THREE.Group();
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1.0 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.8 });
  const flowerColors = [0xff0000, 0xff69b4, 0xffff00, 0x800080, 0xffffff];

  const path1 = new THREE.Mesh(new THREE.BoxGeometry(6, 0.1, 80), pathMat);
  path1.position.y = 2.55; path1.receiveShadow = true; g.add(path1);
  const path2 = new THREE.Mesh(new THREE.BoxGeometry(80, 0.1, 6), pathMat);
  path2.position.y = 2.55; path2.receiveShadow = true; g.add(path2);

  const gardenCenter = new THREE.Vector3(20, 2.5, 10);
  const gardenRadius = 8;
  
  for (let i = 0; i < 60; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * gardenRadius;
    const x = gardenCenter.x + Math.cos(angle) * r;
    const z = gardenCenter.z + Math.sin(angle) * r;
    
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 4), leafMat);
    stem.position.set(x, 2.9, z); g.add(stem);
    
    const fColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: fColor, roughness: 0.5 }));
    flower.position.set(x, 3.3, z); g.add(flower);
  }

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = gardenCenter.x + Math.cos(angle) * (gardenRadius + 2);
    const z = gardenCenter.z + Math.sin(angle) * (gardenRadius + 2);
    
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 8), trunkMat);
    trunk.position.set(x, 4, z); trunk.castShadow = true; g.add(trunk);
    
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), leafMat);
    leaves.position.set(x, 6, z); leaves.castShadow = true; g.add(leaves);
  }

  for (let i = 0; i < 4; i++) {
    const bGroup = new THREE.Group();
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.6), wood);
    seat.position.y = 0.5; seat.castShadow = true; bGroup.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 0.1), wood);
    back.position.set(0, 0.8, -0.25); back.castShadow = true; bGroup.add(back);
    
    const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.5), legMat);
    legL.position.set(-0.8, 0.25, 0); bGroup.add(legL);
    const legR = legL.clone(); legR.position.x = 0.8; bGroup.add(legR);

    bGroup.position.set(15, 2.5, 5 + i * 4);
    bGroup.rotation.y = Math.PI / 2;
    g.add(bGroup);
  }

  const fountainBase = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.5, 0.5, 32), pathMat);
  fountainBase.position.set(0, 2.75, 0); fountainBase.receiveShadow = true; g.add(fountainBase);
  
  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.3, 32), new THREE.MeshStandardMaterial({ color: 0x006994, transparent: true, opacity: 0.8, roughness: 0.1 }));
  water.position.set(0, 2.9, 0); 
  water.name = 'fountain-water'; // ដាក់ឈ្មោះឱ្យទឹកផុស
  g.add(water);
  
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 2, 16), pathMat);
  pillar.position.set(0, 3.5, 0); pillar.castShadow = true; g.add(pillar);

  return g;
}
