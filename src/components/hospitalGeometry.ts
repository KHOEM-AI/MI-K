import * as THREE from "three";

// 1. អគារមន្ទីរពេទ្យ ៩ ជាន់ (Realistic Building)
export function createHospitalBuilding() {
  const group = new THREE.Group();

  // ជញ្ជាំងអគារ (ពណ៌ស និងកញ្ចក់ខៀវ)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.2, metalness: 0.1 });
  const building = new THREE.Mesh(new THREE.BoxGeometry(14, 30, 12), wallMat);
  building.position.y = 15;
  group.add(building);

  // បង្អួចគ្រប់ជាន់ (មានពន្លឺចាំង)
  const windowMat = new THREE.MeshStandardMaterial({ 
    color: 0x88ccff, 
    emissive: 0x2266aa, 
    emissiveIntensity: 0.6,
    roughness: 0.1,
    metalness: 0.8
  });
  
  for (let floor = 1; floor <= 9; floor++) {
    for (let w = -3; w <= 3; w++) {
      const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.2), windowMat);
      windowMesh.position.set(w * 1.8, floor * 3, 6.1); // ផ្នែកខាងមុខ
      group.add(windowMesh);
      // បង្អួចផ្នែកខាងក្រោយ
      const backWindow = windowMesh.clone();
      backWindow.position.z = -6.1;
      group.add(backWindow);
    }
  }

  // ច្រកចូល (Entrance) នៅជាន់ផ្ទាល់ដី
  const entranceMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.3 });
  const entrance = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 0.5), entranceMat);
  entrance.position.set(0, 2, 6.2);
  group.add(entrance);

  // ដំបូល (Roof)
  const roofMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.5, 12.5), roofMat);
  roof.position.y = 30.2;
  group.add(roof);

  // កាកបាទក្រហម (Red Cross)
  const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xaa0000, emissiveIntensity: 0.8 });
  const cross1 = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 1), redMat);
  const cross2 = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), redMat);
  cross1.position.set(0, 31, 0); cross2.position.set(0, 31, 0);
  group.add(cross1, cross2);

  group.userData = { windowMaterial: windowMat };
  return group;
}

// 2. គ្រែអ្នកជំងឺ (Hospital Bed)
export function createHospitalBed() {
  const bed = new THREE.Group();
  
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 });
  const sheetMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const pillowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });

  // ស៊ុមគ្រែ
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 4), metalMat);
  frame.position.y = 1;
  bed.add(frame);

  // ជើងគ្រែ ៤
  const legGeo = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
  for (let x of [-0.8, 0.8]) {
    for (let z of [-1.8, 1.8]) {
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(x, 0.5, z);
      bed.add(leg);
    }
  }

  // ពូក (Mattress)
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.3, 3.8), sheetMat);
  mattress.position.y = 1.25;
  bed.add(mattress);

  // ខ្នើយ (Pillow)
  const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 0.6), pillowMat);
  pillow.position.set(0, 1.45, -1.4);
  bed.add(pillow);

  return bed;
}

// 3. ដើមឈើពិតប្រាកដ (Realistic Tree)
export function createTree(isBig: boolean = false) {
  const tree = new THREE.Group();
  const scale = isBig ? 1.5 : 1;

  // ដើមឈើ (Trunk)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 1 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * scale, 0.5 * scale, 3 * scale, 8), trunkMat);
  trunk.position.y = 1.5 * scale;
  tree.add(trunk);

  // ស្លឹកឈើ (Leaves) - ប្រើ Icosahedron ដើម្បីឱ្យមើលទៅធម្មជាតិ
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 });
  const leaves = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 * scale, 1), leafMat);
  leaves.position.y = 3.5 * scale;
  tree.add(leaves);

  // ស្លឹកបន្ថែម (ដើម្បីឱ្យមើលទៅពេញលេញ)
  const leaf2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1 * scale, 1), leafMat);
  leaf2.position.set(1 * scale, 3 * scale, 0.5 * scale);
  tree.add(leaf2);
  const leaf3 = new THREE.Mesh(new THREE.IcosahedronGeometry(1 * scale, 1), leafMat);
  leaf3.position.set(-1 * scale, 3 * scale, -0.5 * scale);
  tree.add(leaf3);

  return tree;
}

// 4. កៅអីអង្គុយ (Bench)
export function createBench() {
  const bench = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });

  // កន្លែងអង្គុយ
  const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.6), woodMat);
  seat.position.y = 0.8;
  bench.add(seat);

  // ខ្នងកៅអី
  const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 0.1), woodMat);
  back.position.set(0, 1.2, -0.25);
  bench.add(back);

  // ជើងកៅអី
  const legGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
  for (let x of [-0.9, 0.9]) {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(x, 0.4, 0);
    bench.add(leg);
  }

  return bench;
}

// 5. រថយន្តសង្គ្រោះបន្ទាន់ (Ambulance)
export function createAmbulance() {
  const ambulance = new THREE.Group();
  
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.1, metalness: 0.9 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 });

  // តួរថយន្ត
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.8, 5), whiteMat);
  body.position.y = 1.5;
  ambulance.add(body);

  // កាប៊ីនមុខ
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.5), whiteMat);
  cabin.position.set(0, 1.5, 3.2);
  ambulance.add(cabin);

  // កញ្ចក់មុខ
  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.1), glassMat);
  windshield.position.set(0, 1.8, 4);
  ambulance.add(windshield);

  // ឆ្នូតក្រហម (Red Stripe)
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.3, 5.1), redMat);
  stripe.position.y = 1.5;
  ambulance.add(stripe);

  // ភ្លើងសង្គ្រោះ (Siren Lights)
  const siren1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.4), lightMat);
  siren1.position.set(-0.6, 2.5, 2.5);
  ambulance.add(siren1);
  const siren2 = siren1.clone();
  siren2.position.x = 0.6;
  ambulance.add(siren2);

  // កង់រថយន្ត ៤
  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (let x of [-1.3, 1.3]) {
    for (let z of [-1.5, 2.5]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.5, z);
      ambulance.add(wheel);
    }
  }

  return ambulance;
}

// 6. គ្រូពេទ្យ (Doctor)
export function createDoctor(isFemale: boolean = false) {
  const doctor = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
  
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2, 16), coatMat);
  body.position.y = 1.5;
  doctor.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), skinMat);
  head.position.y = 3;
  doctor.add(head);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), coatMat);
  cap.position.set(0, 3.3, 0);
  doctor.add(cap);

  return doctor;
}

// 7. សួនច្បារ (Garden)
export function createGarden() {
  const garden = new THREE.Group();
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44, roughness: 1 });
  
  // ស្មៅ
  const grass = new THREE.Mesh(new THREE.BoxGeometry(25, 0.2, 20), grassMat);
  grass.position.y = 0;
  garden.add(grass);

  // ផ្លូវដើរ
  const pathMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 });
  const path = new THREE.Mesh(new THREE.BoxGeometry(4, 0.22, 20), pathMat);
  path.position.set(0, 0.01, 0);
  garden.add(path);

  return garden;
}

// 8. អ្នកជំងឺដេកលើគ្រែ (Patient with Blanket)
export function createPatient() {
  const patient = new THREE.Group();
  
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5cba7 });
  const blanketMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.8 }); // ភួយពណ៌ខៀវ
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1b10 });

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), skinMat);
  head.position.set(0, 1.6, -1.2);
  patient.add(head);

  // សក់
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
  hair.position.set(0, 1.65, -1.2);
  patient.add(hair);

  // ភួយក្រណាត់ (គ្របពីកញ្ចឹងកដល់ជើង)
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 2.5), blanketMat);
  blanket.position.set(0, 1.5, 0);
  patient.add(blanket);

  return patient;
}

// 9. ផ្លាកសញ្ញា "HOSPITAL" (3D Text)
export function createHospitalSign(THREE: any) {
  const signGroup = new THREE.Group();
  
  // ប្រអប់ផ្លាក
  const boardMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
  const board = new THREE.Mesh(new THREE.BoxGeometry(8, 1.5, 0.3), boardMat);
  board.position.y = 0;
  signGroup.add(board);

  // អក្សរ 3D ពណ៌ស (ប្រើ Geometry សាមញ្ញជំនួស)
  const textMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 });
  const charGeo = new THREE.BoxGeometry(0.6, 0.8, 0.1);
  
  // បង្កើតតួអក្សរនីមួយៗ (H O S P I T A L)
  const neonLight = new THREE.PointLight(0x00ffff, 0, 20);
  neonLight.position.set(0, 0, 2);
  signGroup.add(neonLight);
  signGroup.userData = { neonLight };
  const letters = ["H", "O", "S", "P", "I", "T", "A", "L"];
  letters.forEach((_, i) => {
    const char = new THREE.Mesh(charGeo, textMat);
    char.position.set(-3.5 + i * 1, 0, 0.2);
    signGroup.add(char);
  });

  return signGroup;
}

// 10. ផ្កា (Flowers)
export function createFlower(color: number) {
  const flower = new THREE.Group();
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
  const petalMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.6 });
  const centerMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });

  // ដើម
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6), stemMat);
  stem.position.y = 0.4;
  flower.add(stem);

  // ត្របកផ្កា ៥
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), petalMat);
    petal.position.set(Math.cos(angle) * 0.2, 0.8, Math.sin(angle) * 0.2);
    petal.scale.set(1, 0.5, 1);
    flower.add(petal);
  }

  // កណ្តាលផ្កា
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), centerMat);
  center.position.y = 0.8;
  flower.add(center);

  return flower;
}

// 11. ភ្លើងសង្គ្រោះវិល (Siren Light) - ត្រូវការ Animation
export function createSirenLight() {
  const lightMat = new THREE.MeshStandardMaterial({ 
    color: 0xff0000, 
    emissive: 0xff0000, 
    emissiveIntensity: 2 
  });
  const siren = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), lightMat);
  return siren;
}

// 12. គិលានុបដ្ឋាយិកា (Nurse)
export function createNurse() {
  const nurse = new THREE.Group();
  const uniformMat = new THREE.MeshStandardMaterial({ color: 0xffb6c1, roughness: 0.8 }); // ពណ៌ផ្កាឈូក
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a1b10 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.8, 16), uniformMat);
  body.position.y = 1.4;
  nurse.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), skinMat);
  head.position.y = 2.7;
  nurse.add(head);

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.47, 16, 16, 0, Math.PI * 2, 0, Math.PI / 1.5), hairMat);
  hair.position.y = 2.75;
  nurse.add(hair);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.6), uniformMat);
  cap.position.set(0, 2.95, 0);
  nurse.add(cap);

  return nurse;
}

// 13. រទេះរុញអ្នកជំងឺ (Wheelchair)
export function createWheelchair() {
  const wc = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 });
  const seatMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 1.2), seatMat);
  seat.position.y = 1;
  wc.add(seat);

  const back = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.1), seatMat);
  back.position.set(0, 1.6, -0.55);
  wc.add(back);

  const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16);
  for (let x of [-0.65, 0.65]) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.6, -0.2);
    wc.add(wheel);
  }

  const smallWheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
  for (let x of [-0.5, 0.5]) {
    const wheel = new THREE.Mesh(smallWheelGeo, wheelMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.3, 0.6);
    wc.add(wheel);
  }

  return wc;
}

// 14. អំពូលភ្លើងតាមផ្លូវ (Street Lamp)
export function createStreetLamp() {
  const lamp = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9, roughness: 0.1 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 1 });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 6, 8), poleMat);
  pole.position.y = 3;
  lamp.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.1), poleMat);
  arm.position.set(0.75, 6, 0);
  lamp.add(arm);

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), bulbMat);
  bulb.position.set(1.5, 5.8, 0);
  lamp.add(bulb);

  const light = new THREE.PointLight(0xffffaa, 1, 10);
  light.position.set(1.5, 5.8, 0);
  lamp.add(light);

  lamp.userData = { lampLight: light };
  return lamp;
}

// 15. ចំណតឧទ្ធម្ភាគចក្រ (Helipad)
export function createHelipad() {
  const helipad = new THREE.Group();
  const padMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 0.2, 32), padMat);
  helipad.add(pad);

  const circle = new THREE.Mesh(new THREE.RingGeometry(3, 3.5, 32), whiteMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.15;
  helipad.add(circle);

  const h1 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 2), whiteMat);
  h1.position.set(-0.8, 0.15, 0);
  helipad.add(h1);
  const h2 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 2), whiteMat);
  h2.position.set(0.8, 0.15, 0);
  helipad.add(h2);
  const h3 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.3), whiteMat);
  h3.position.set(0, 0.15, 0);
  helipad.add(h3);

  return helipad;
}

// 16. ផ្លូវថ្នល់ (Driveway)
export function createDriveway() {
  const road = new THREE.Group();
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });

  const asphalt = new THREE.Mesh(new THREE.BoxGeometry(10, 0.15, 30), roadMat);
  asphalt.position.set(0, 0.1, 15);
  road.add(asphalt);

  for (let z = 2; z < 30; z += 4) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.16, 2), lineMat);
    line.position.set(0, 0.1, z);
    road.add(line);
  }

  return road;
}

// 17. ឧទ្ធម្ភាគចក្រ (Helicopter)
export function createHelicopter() {
  const heli = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdd2222, metalness: 0.6, roughness: 0.4 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7, metalness: 0.9, roughness: 0.1 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const skidMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });

  // តួឧទ្ធម្ភាគចក្រ
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), bodyMat);
  body.scale.set(1, 0.8, 1.8);
  heli.add(body);

  // កន្ទុយ
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.1, 3, 8), bodyMat);
  tail.rotation.x = Math.PI / 2;
  tail.position.set(0, 0, -2.5);
  heli.add(tail);

  // កញ្ចក់កាប៊ីន
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), glassMat);
  cockpit.position.set(0, 0.2, 0.8);
  cockpit.scale.set(0.9, 0.8, 1);
  heli.add(cockpit);

  // កង្ហារវិល (Rotor) - ត្រូវយកទៅ Animate
  const rotorGroup = new THREE.Group();
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.2), bladeMat);
  rotorGroup.add(rotor);
  const rotor2 = rotor.clone(); rotor2.rotation.y = Math.PI / 2; rotorGroup.add(rotor2);
  rotorGroup.position.set(0, 1.5, 0);
  heli.add(rotorGroup);

  // ជើងចុះចត (Skids)
  const skid1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8), skidMat);
  skid1.rotation.x = Math.PI / 2; skid1.position.set(-0.8, -1.2, 0); heli.add(skid1);
  const skid2 = skid1.clone(); skid2.position.x = 0.8; heli.add(skid2);

  heli.userData = { rotorGroup };
  return heli;
}

// 18. ឡានធម្មតា (Normal Car) សម្រាប់ចំណតរថយន្ត
export function createCar(color: number) {
  const car = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.5, roughness: 0.3 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.1 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 4), bodyMat);
  body.position.y = 0.8;
  car.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 2), glassMat);
  roof.position.set(0, 1.4, -0.2);
  car.add(roof);

  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  for (let x of [-0.9, 0.9]) {
    for (let z of [-1.2, 1.2]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.4, z);
      car.add(wheel);
    }
  }
  return car;
}

// 19. បន្ទប់វះកាត់ (Surgery Room) - ថែមនៅជាន់ផ្ទាល់ដី
export function createSurgeryRoom() {
  const room = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, roughness: 0.1 }); // ជញ្ជាំងកញ្ចក់
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.2, metalness: 0.5 });
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3 });

  // ជញ្ជាំង
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.2), wallMat);
  backWall.position.set(0, 2, -4); room.add(backWall);
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 8), wallMat);
  leftWall.position.set(-4, 2, 0); room.add(leftWall);
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 8), wallMat);
  rightWall.position.set(4, 2, 0); room.add(rightWall);

  // កម្រាលឥដ្ឋ
  const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 8), floorMat);
  floor.position.y = 0.1; room.add(floor);

  // តុវះកាត់
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.2, 3), tableMat);
  table.position.set(0, 1.2, 0); room.add(table);
  const tableLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.2, 8), tableMat);
  tableLeg.position.set(0, 0.6, 0); room.add(tableLeg);

  // ភ្លើងវះកាត់ (Surgical Light) នៅលើពិដាន
  const lightFixture = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16), lightMat);
  lightFixture.position.set(0, 3.8, 0);
  room.add(lightFixture);

  const spotLight = new THREE.SpotLight(0xffffff, 5, 10, Math.PI / 4, 0.5, 1);
  spotLight.position.set(0, 3.5, 0);
  spotLight.target.position.set(0, 1, 0);
  room.add(spotLight, spotLight.target);

  room.userData = { surgeryLight: spotLight, lightFixture };
  return room;
}
