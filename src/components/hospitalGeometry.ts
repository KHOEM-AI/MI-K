import * as THREE from "three";
import { createHumanFigure } from "./humanFigure";

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
  return createHumanFigure({
    height: 3.4, shirt: 0xffffff, pants: 0x3b4a5c, skin: 0xc99672, female: isFemale,
    hairStyle: isFemale ? "bun" : "short", coat: true, shoe: 0xeeeeee, tie: isFemale ? undefined : 0x2c6fb5,
  });
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
  const blanketMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.8 }); // ភួយពណ៌ខៀវ

  // រាងមនុស្សដេកផ្ងារ (មុខឡើងលើ ក្បាលនៅ -z)
  const body = createHumanFigure({ height: 2.2, shirt: 0xdfeaf2, pants: 0xdfeaf2, skin: 0xc99672, hairStyle: "short", shoe: 0xdddddd, longSleeves: false });
  body.rotation.x = -Math.PI / 2;
  body.position.set(0, 1.55, 0.7);
  patient.add(body);

  // ភួយគ្របពីទ្រូងចុះក្រោម (ក្បាល និងស្មានៅចំហ)
  const blanket = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.24, 1.7), blanketMat);
  blanket.position.set(0, 1.66, 0.4);
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
  return createHumanFigure({
    height: 3.1, shirt: 0xffb6c1, pants: 0xffb6c1, skin: 0xcf9f7b, female: true, hairStyle: "bun",
    hat: "nurse", hatColor: 0xffffff, shoe: 0xf2f2f2, longSleeves: false,
  });
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

// 20. អ្នកទស្សនា (Visitor) ដើរលេងក្នុងសួន
export function createVisitor(shirtColor: number) {
  return createHumanFigure({ height: 2.35, shirt: shirtColor, pants: 0x333333, skin: 0xc99672, longSleeves: false });
}

// 21. ផ្កាយ (Stars) ពេលយប់
export function createStars() {
  const count = 800;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 300;
    positions[i + 1] = Math.random() * 80 + 40;
    positions[i + 2] = (Math.random() - 0.5) * 300;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.4, transparent: true, opacity: 0 });
  return new THREE.Points(geo, mat);
}

// 22. ភ្លៀង (Rain)
export function createRain() {
  const count = 3000;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = Math.random() * 50;
    positions[i + 2] = (Math.random() - 0.5) * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xaaccff, size: 0.15, transparent: true, opacity: 0.7 });
  return new THREE.Points(geo, mat);
}

// 23. ផ្លាកសញ្ញាចរាចរណ៍ (Traffic Sign)
export function createTrafficSign() {
  const sign = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.3 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000 });
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 8), poleMat);
  pole.position.y = 1.5;
  sign.add(pole);

  const board = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 24), redMat);
  board.rotation.x = Math.PI / 2;
  board.position.y = 3;
  sign.add(board);

  const inner = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.11), whiteMat);
  inner.position.set(0, 3, 0.06);
  sign.add(inner);
  return sign;
}

// 24. ពន្លឺចម្រុះពណ៌ (Colorful Lights)
export function createColorfulLights() {
  const group = new THREE.Group();
  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
  const lights: THREE.PointLight[] = [];
  for (let i = 0; i < 6; i++) {
    const light = new THREE.PointLight(colors[i], 0, 20);
    light.position.set(-15 + i * 6, 6, 0);
    group.add(light);
    lights.push(light);
  }
  group.userData = { lights };
  return group;
}

// 25. របង (Fence)
export function createFence() {
  const fence = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8, roughness: 0.4 });
  for (let i = -20; i <= 20; i += 2) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 8), metalMat);
    post.position.set(i, 1, 20);
    fence.add(post);
  }
  const rail = new THREE.Mesh(new THREE.BoxGeometry(40, 0.1, 0.1), metalMat);
  rail.position.set(0, 1.8, 20);
  fence.add(rail);
  const rail2 = rail.clone(); rail2.position.y = 1; fence.add(rail2);
  return fence;
}

// 26. ភ្លើងអាលីបាបា (String Lights)
export function createStringLights() {
  const lights = new THREE.Group();
  const wireMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffaa, emissive: 0xffffaa, emissiveIntensity: 2 });

  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 40, 4), wireMat);
  wire.rotation.z = Math.PI / 2;
  wire.position.set(0, 2, 20);
  lights.add(wire);

  for (let i = -19; i <= 19; i += 1.5) {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), bulbMat);
    bulb.position.set(i, 1.8 + Math.sin(i * 0.5) * 0.2, 20); // ធ្លាក់ចុះបន្តិច
    lights.add(bulb);
    const pointLight = new THREE.PointLight(0xffaa00, 0, 5);
    pointLight.position.copy(bulb.position);
    lights.add(pointLight);
  }
  return lights;
}

// 27. ម៉ាស៊ីនត្រជាក់ (Air Conditioner)
export function createACUnit() {
  const ac = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.5 });
  const grillMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
  const fanMat = new THREE.MeshStandardMaterial({ color: 0x222222 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.5), bodyMat);
  ac.add(body);
  const grill = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.1), grillMat);
  grill.position.set(0, -0.2, 0.26); ac.add(grill);
  const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), fanMat);
  fan.rotation.x = Math.PI / 2;
  fan.position.set(0.4, 0, 0.26); ac.add(fan);
  return ac;
}

// 28. រទេះរុញគ្រែអ្នកជំងឺ (Stretcher)
export function createStretcher() {
  const stretcher = new THREE.Group();
  const metalMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.2 });
  const bedMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 2.5), metalMat);
  frame.position.y = 1.2; stretcher.add(frame);
  const mattress = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.2, 2.4), bedMat);
  mattress.position.y = 1.35; stretcher.add(mattress);

  // ជើង និងកង់
  const wheelGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  for (let x of [-0.5, 0.5]) {
    for (let z of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8), metalMat);
      leg.position.set(x, 0.6, z); stretcher.add(leg);
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.15, z); stretcher.add(wheel);
    }
  }
  return stretcher;
}

// 29. ទូទឹកកក (Refrigerator)
export function createFridge() {
  const fridge = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.5, roughness: 0.3 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.8), mat);
  body.position.y = 1; fridge.add(body);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.05), handleMat);
  handle.position.set(0.4, 1.5, 0.41); fridge.add(handle);
  return fridge;
}

// 30. ទូរទស្សន៍ (TV)
export function createTV() {
  const tv = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x2244aa, emissiveIntensity: 1 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 0.1), frameMat);
  tv.add(frame);
  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.9, 0.12), screenMat);
  screen.position.z = 0.01; tv.add(screen);
  return tv;
}

// 31. ម៉ាស៊ីនទឹកស្អាត (Water Dispenser)
export function createWaterDispenser() {
  const dispenser = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const bottleMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.7 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), bodyMat);
  body.position.y = 0.6; dispenser.add(body);
  const bottle = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.6, 16), bottleMat);
  bottle.position.y = 1.5; dispenser.add(bottle);
  return dispenser;
}

// 32. បន្ទប់ VIP
export function createVIPRoom() {
  const room = new THREE.Group();
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xaaccff, transparent: true, opacity: 0.2, metalness: 0.8, roughness: 0.1 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 8), floorMat);
  floor.position.y = 0.1; room.add(floor);
  // ជញ្ជាំងកញ្ចក់
  const wall1 = new THREE.Mesh(new THREE.BoxGeometry(8, 3, 0.1), glassMat);
  wall1.position.set(0, 1.5, -4); room.add(wall1);
  const wall2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 8), glassMat);
  wall2.position.set(-4, 1.5, 0); room.add(wall2);

  // គ្រឿងសង្ហារឹម
  const bed = createHospitalBed(); bed.position.set(1, 0, -1); bed.rotation.y = Math.PI / 2; room.add(bed);
  const ac = createACUnit(); ac.position.set(0, 2.8, -3.9); room.add(ac);
  const fridge = createFridge(); fridge.position.set(-3.2, 0, 3); room.add(fridge);
  const tv = createTV(); tv.position.set(-3.9, 1.8, 0); tv.rotation.y = Math.PI / 2; room.add(tv);

  return room;
}

// 33. កន្លែងគិតលុយ (Reception)
export function createReception() {
  const reception = new THREE.Group();
  const deskMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });

  const desk = new THREE.Mesh(new THREE.BoxGeometry(5, 1.2, 1.5), deskMat);
  desk.position.y = 0.6; reception.add(desk);
  const top = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.1, 1.7), woodMat);
  top.position.y = 1.25; reception.add(top);

  // ទូរទស្សន៍ព្យួរជញ្ជាំង
  const tv = createTV(); tv.position.set(0, 3, -0.7); reception.add(tv);
  // ម៉ាស៊ីនទឹកស្អាត
  const water = createWaterDispenser(); water.position.set(3, 0, 0); reception.add(water);

  return reception;
}

// 34. ទូរទស្សន៍អក្សររត់ (Digital TV with Scrolling Text)
export function createDigitalTV() {
  const tv = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  
  // ស៊ុមទូរទស្សន៍
  const frame = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1, 0.1), frameMat);
  tv.add(frame);

  // បង្កើត Canvas សម្រាប់សរសេរអក្សរ
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#00ffcc';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KHOEM-AI HOSPITAL', 256, 128);
  }
  
  const texture = new THREE.CanvasTexture(canvas);
  const screenMat = new THREE.MeshStandardMaterial({ map: texture, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 1 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.9), screenMat);
  screen.position.z = 0.06;
  tv.add(screen);

  // រក្សាទុក Canvas និង Context សម្រាប់ Animate
  tv.userData = { canvas, ctx, texture };
  return tv;
}

// 35. កៅអីអង្គុយវែង (Long Bench for 3, 5, or 6 people)
export function createLongBench(seats: number = 3) {
  const bench = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
  const length = seats * 0.8; // ទទឹងកៅអី ០.៨ ម៉ែត្រ/នាក់

  // កន្លែងអង្គុយ
  const seat = new THREE.Mesh(new THREE.BoxGeometry(length, 0.1, 0.6), woodMat);
  seat.position.y = 0.8;
  bench.add(seat);

  // ខ្នងកៅអី
  const back = new THREE.Mesh(new THREE.BoxGeometry(length, 0.6, 0.1), woodMat);
  back.position.set(0, 1.2, -0.25);
  bench.add(back);

  // ជើងកៅអី (៣ ជើង)
  const legGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
  for (let i = -1; i <= 1; i++) {
    const leg = new THREE.Mesh(legGeo, metalMat);
    leg.position.set(i * (length / 2.2), 0.4, 0);
    bench.add(leg);
  }
  return bench;
}

// 36. បន្ទប់យាម (Security Guard Booth)
export function createGuardBooth() {
  const booth = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.8 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 2), wallMat);
  body.position.y = 1.25;
  booth.add(body);

  const window1 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1, 0.1), glassMat);
  window1.position.set(0, 1.5, 1.05);
  booth.add(window1);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.2, 2.5), roofMat);
  roof.position.y = 2.6;
  booth.add(roof);

  return booth;
}

// 37. ជណ្តើរយន្ត (Elevator) ខាងក្រៅ
export function createElevator() {
  const elevator = new THREE.Group();
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.5, metalness: 0.8, roughness: 0.1 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });

  // ប្រអប់ជណ្តើរយន្ត
  const box = new THREE.Mesh(new THREE.BoxGeometry(3, 3, 3), glassMat);
  box.position.y = 1.5;
  elevator.add(box);

  // ស៊ុម
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 3.2), frameMat);
  frame.position.y = 1.5;
  elevator.add(frame);

  // ជាន់
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.1, 2.8), floorMat);
  floor.position.y = 0.1;
  elevator.add(floor);

  elevator.userData = { isElevator: true };
  return elevator;
}

// 38. ជណ្តើរជើង (Stairs)
export function createStairs() {
  const stairs = new THREE.Group();
  const stepMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.7 });
  for (let i = 0; i < 10; i++) {
    const step = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 0.5), stepMat);
    step.position.set(0, i * 0.3, i * 0.5);
    stairs.add(step);
  }
  return stairs;
}

// 39. បំពង់ពន្លត់អគ្គីភ័យ (Fire Hydrant)
export function createFireHydrant() {
  const hydrant = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8), redMat);
  body.position.y = 0.4;
  hydrant.add(body);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), redMat);
  cap.position.y = 0.8;
  hydrant.add(cap);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8), redMat);
  nozzle.rotation.z = Math.PI / 2;
  nozzle.position.set(0.25, 0.5, 0);
  hydrant.add(nozzle);
  return hydrant;
}

// 40. ទូដាក់ទុយោទឹកពន្លត់អគ្គីភ័យ (Fire Hose Cabinet)
export function createFireHoseCabinet() {
  const cabinet = new THREE.Group();
  const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.5, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.3), redMat);
  cabinet.add(box);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.9, 0.05), glassMat);
  glass.position.set(0, 0.1, 0.16);
  cabinet.add(glass);
  return cabinet;
}

// 41. ធុងសំរាមតូច (Small Trash Bin)
export function createSmallTrashBin() {
  const bin = new THREE.Group();
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57, roughness: 0.8 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.5, 8), greenMat);
  body.position.y = 0.25;
  bin.add(body);
  return bin;
}

// 42. ធុងសំរាមធំ (Big Trash Bin) មានគម្រប
export function createBigTrashBin() {
  const bin = new THREE.Group();
  const greyMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 });
  const lidMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.2, 0.8), greyMat);
  body.position.y = 0.6;
  bin.add(body);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.9), lidMat);
  lid.position.y = 1.25;
  bin.add(lid);
  return bin;
}

// 43. ឡានដឹកសំរាម (Garbage Truck)
export function createGarbageTruck() {
  const truck = new THREE.Group();
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const greenMat = new THREE.MeshStandardMaterial({ color: 0x2e8b57 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9 });
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.8, 2), whiteMat);
  cabin.position.set(0, 1.5, 2.5);
  truck.add(cabin);

  const container = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 4), greenMat);
  container.position.set(0, 1.6, -1);
  truck.add(container);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 0.1), glassMat);
  windshield.position.set(0, 1.8, 3.5);
  truck.add(windshield);

  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
  for (let x of [-1.2, 1.2]) {
    for (let z of [-2, 2]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.5, z);
      truck.add(wheel);
    }
  }
  return truck;
}

// 44. ឡានពេទ្យប្រភេទផ្សេងៗ (Ambulance Variants)
export function createAmbulanceVariant(type: "fast" | "slow" | "province" | "international") {
  const amb = createAmbulance();
  if (type === "fast") {
    amb.scale.set(1.2, 1.2, 1.2);
    amb.userData = { speed: 1.5 };
  } else if (type === "slow") {
    amb.scale.set(0.9, 0.9, 0.9);
    amb.userData = { speed: 0.5 };
  } else if (type === "province") {
    amb.scale.set(1.1, 1.1, 1.1);
    amb.userData = { speed: 1.0 };
  } else if (type === "international") {
    amb.scale.set(1.3, 1.3, 1.3);
    amb.userData = { speed: 1.8 };
  }
  return amb;
}

// 45. រោងចំណតយានយន្ត (Garage)
export function createGarage(color: number) {
  const garage = new THREE.Group();
  const roofMat = new THREE.MeshStandardMaterial({ color: color, metalness: 0.5, roughness: 0.5 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });

  const roof = new THREE.Mesh(new THREE.BoxGeometry(8, 0.2, 8), roofMat);
  roof.position.y = 4;
  garage.add(roof);

  for (let x of [-4, 4]) {
    for (let z of [-4, 4]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 4, 8), poleMat);
      pole.position.set(x, 2, z);
      garage.add(pole);
    }
  }
  return garage;
}

// 46. មនុស្សអង្គុយ (Sitting Person)
export function createSittingPerson(shirtColor: number) {
  return createHumanFigure({ height: 2.2, shirt: shirtColor, pants: 0x333333, skin: 0xc99672, sitting: true, seatHeight: 0.8, longSleeves: false });
}

// 47. អ្នកអនាម័យ (Cleaner)
export function createCleaner(isFemale: boolean, isSupervisor: boolean = false) {
  const cleaner = createHumanFigure({
    height: 2.3, shirt: isSupervisor ? 0x9b59b6 : 0x3498db, pants: 0x2c3e50, skin: 0xc58e69,
    female: isFemale, hairStyle: isFemale ? "bun" : "short", hat: isFemale ? "none" : "cap", hatColor: isSupervisor ? 0x9b59b6 : 0x3498db,
  });
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
  stick.position.set(0.4, 0.8, 0.2); stick.rotation.z = -Math.PI / 6; cleaner.add(stick);
  const broom = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.2), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
  broom.position.set(0.65, 0.1, 0.2); cleaner.add(broom);
  return cleaner;
}

// 48. សន្តិសុខ (Security Guard)
export function createSecurityGuard() {
  return createHumanFigure({ height: 2.4, shirt: 0x1e3a8a, pants: 0x111111, hat: "cap", hatColor: 0x111111, skin: 0xc58e69, shoe: 0x0b0b0d });
}

// 49. បន្ទប់ពិនិត្យអ្នកជំងឺ (Examination Room)
export function createExamRoom() {
  const room = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf0f8ff });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0xdddddd });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 6), floorMat);
  floor.position.y = 0.1; room.add(floor);
  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.2), wallMat);
  wallBack.position.set(0, 1.5, -3); room.add(wallBack);
  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 6), wallMat);
  wallLeft.position.set(-3, 1.5, 0); room.add(wallLeft);

  const bed = createHospitalBed();
  bed.position.set(0, 0, 0); bed.scale.set(0.8, 0.8, 0.8); room.add(bed);
  const doc = createDoctor(false);
  doc.position.set(1, 0, 1); room.add(doc);

  return room;
}

// 50. របារចាប់ដៃអ៊ីណុក (Stainless Steel Handrail) សម្រាប់មនុស្សចាស់
export function createHandrail(length: number = 4) {
  const handrail = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, length, 8), steelMat);
  bar.rotation.z = Math.PI / 2;
  bar.position.y = 0.8; // កម្ពស់ ០.៨ ម៉ែត្រ
  handrail.add(bar);
  for (let i = -length/2 + 1; i <= length/2 - 1; i += 2) {
    const bracket = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), steelMat);
    bracket.rotation.x = Math.PI / 2;
    bracket.position.set(i, 0.8, -0.1);
    handrail.add(bracket);
  }
  return handrail;
}

// 51. បន្ទប់ទឹក (Bathroom) មានបត់ជើង និងមុជទឹក
export function createBathroom(hasShower: boolean) {
  const bath = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x88ccff });
  
  const floor = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 2), floorMat);
  bath.add(floor);
  
  const back = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 0.1), wallMat); back.position.set(0, 1.25, -1); bath.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 2), wallMat); left.position.set(-1, 1.25, 0); bath.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 2), wallMat); right.position.set(1, 1.25, 0); bath.add(right);
  
  const toilet = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.4, 16), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  toilet.position.set(-0.5, 0.2, -0.5);
  bath.add(toilet);
  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  tank.position.set(-0.5, 0.5, -0.8); bath.add(tank);

  if (hasShower) {
    const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
    showerHead.position.set(0.5, 2.2, -0.8); bath.add(showerHead);
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
    pipe.position.set(0.5, 2.0, -0.85); pipe.rotation.x = Math.PI/4; bath.add(pipe);
  }
  
  const hRail = createHandrail(1.5);
  hRail.position.set(0, 0, -0.9); bath.add(hRail);

  return bath;
}

// 52. ទូដាក់ថ្នាំពេទ្យ (Pharmacy Cabinet) មានថ្នាំគ្រប់ប្រភេទ
export function createPharmacy() {
  const pharmacy = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xaaccff, transparent: true, opacity: 0.4 });
  
  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.5), woodMat);
  cabinet.position.y = 1.25; pharmacy.add(cabinet);
  
  for (let y = 0.5; y < 2.5; y += 0.5) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.05, 0.4), glassMat);
    shelf.position.set(0, y, 0.05); pharmacy.add(shelf);
    for (let x = -1.5; x <= 1.5; x += 0.3) {
      if (Math.random() > 0.3) {
        const medColor = [0xff0000, 0x00ff00, 0x0000ff, 0xffffff, 0xffff00][Math.floor(Math.random()*5)];
        const med = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), new THREE.MeshStandardMaterial({ color: medColor }));
        med.position.set(x, y + 0.15, 0.1); pharmacy.add(med);
      }
    }
  }
  const front = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.05), glassMat);
  front.position.set(0, 1.25, 0.3); pharmacy.add(front);
  return pharmacy;
}

// 53. ការិយាល័យប្រធានមន្ទីរពេទ្យ (Director Office)
export function createDirectorOffice() {
  const office = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
  
  const floor = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 6), floorMat); floor.position.y = 0.1; office.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 0.2), wallMat); back.position.set(0, 1.5, -3); office.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 6), wallMat); left.position.set(-3, 1.5, 0); office.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 6), wallMat); right.position.set(3, 1.5, 0); office.add(right);
  
  const desk = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 1.2), new THREE.MeshStandardMaterial({ color: 0x5c4033 })); desk.position.set(0, 1, 0); office.add(desk);
  const deskLegs = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1, 1), new THREE.MeshStandardMaterial({ color: 0x5c4033 })); deskLegs.position.set(0, 0.5, 0); office.add(deskLegs);
  const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.6), new THREE.MeshStandardMaterial({ color: 0x111111 })); chairSeat.position.set(0, 0.6, 0.8); office.add(chairSeat);
  const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 })); chairBack.position.set(0, 1, 1.1); office.add(chairBack);
  const pc = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x222222 })); pc.position.set(0, 1.3, -0.2); office.add(pc);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.5, 0.5), new THREE.MeshStandardMaterial({ color: 0x8b5a2b })); shelf.position.set(-2, 1.25, -2.7); office.add(shelf);
  
  const director = createDoctor(false); director.scale.set(1.1, 1.1, 1.1); director.position.set(0, 0, 0.5); director.rotation.y = Math.PI; office.add(director);
  const hr = createHandrail(4); hr.position.set(2.8, 0, 0); hr.rotation.y = Math.PI/2; office.add(hr);

  return office;
}

// 54. មេការអនាម័យ និងមេសន្តិសុខ (Female Supervisor - Beautiful & Tall)
export function createFemaleSupervisor(role: "cleaner" | "security") {
  return createHumanFigure({
    height: 2.45, shirt: role === "cleaner" ? 0x9b59b6 : 0x2c3e50, pants: role === "cleaner" ? 0x9b59b6 : 0x2c3e50,
    skin: 0xdcb08c, female: true, skirt: true, hairStyle: "long", hair: 0x111111, shoe: 0x111111,
  });
}

// 55. អ្នកអនាម័យប្រុស (Male Cleaner)
export function createMaleCleaner() {
  return createCleaner(false);
}

// 56. វេជ្ជបណ្ឌិតស្រី (Female Doctor)
export function createFemaleDoctor() {
  return createDoctor(true);
}

// 57. បន្ទប់ការិយាល័យសន្តិសុខ (Security Office)
export function createSecurityOffice() {
  const office = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x555555 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(5, 0.2, 5), floorMat);
  floor.position.y = 0.1; office.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 0.2), wallMat); back.position.set(0, 1.5, -2.5); office.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 5), wallMat); left.position.set(-2.5, 1.5, 0); office.add(left);
  const right = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 5), wallMat); right.position.set(2.5, 1.5, 0); office.add(right);

  // តុធំ
  const desk = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  desk.position.set(0, 1, 0); office.add(desk);

  // ម៉ូនីទ័រ CCTV (៤ អេក្រង់)
  for (let i = 0; i < 4; i++) {
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.1), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    monitor.position.set(-1.2 + i * 0.8, 1.5, -2.2); 
    office.add(monitor);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x00ffcc, emissiveIntensity: 1 }));
    screen.position.set(-1.2 + i * 0.8, 1.5, -2.14); 
    office.add(screen);
  }
  
  // បុគ្គលិកសន្តិសុខ ២ នាក់
  const guard1 = createSecurityGuard(); guard1.position.set(-1, 0, 0.5); office.add(guard1);
  const guard2 = createSecurityGuard(); guard2.position.set(1, 0, 0.5); office.add(guard2);

  return office;
}

// 58. ការិយាល័យអនុប្រធានរងតាមផ្នែក (Deputy Office)
export function createDeputyOffice(department: string) {
  const office = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7 });
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(4, 0.2, 4), floorMat);
  floor.position.y = 0.1; office.add(floor);
  const back = new THREE.Mesh(new THREE.BoxGeometry(4, 2.5, 0.2), wallMat); back.position.set(0, 1.25, -2); office.add(back);
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 4), wallMat); left.position.set(-2, 1.25, 0); office.add(left);
  
  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0x5c4033 }));
  desk.position.set(0, 1, 0); office.add(desk);
  const pc = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  pc.position.set(0, 1.3, -0.3); office.add(pc);

  const doctor = createDoctor(true); doctor.scale.set(1.1, 1.1, 1.1); doctor.position.set(0, 0, 0.8); doctor.rotation.y = Math.PI; office.add(doctor);

  // ផ្លាកសញ្ញានាមផ្នែក (Text Label)
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#000000'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(department, 128, 40);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const labelMat = new THREE.MeshStandardMaterial({ map: texture });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.5), labelMat);
  label.position.set(0, 2.2, -1.89); office.add(label);

  return office;
}

// 59. ផ្លូវកៅស៊ូ (Rubber/Asphalt Road)
export function createRubberRoad(width: number, length: number) {
  const road = new THREE.Group();
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
  const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const yellowLineMat = new THREE.MeshStandardMaterial({ color: 0xffff00 });

  const asphalt = new THREE.Mesh(new THREE.BoxGeometry(width, 0.1, length), roadMat);
  asphalt.position.y = 0.05; road.add(asphalt);

  // ខ្សែស ពីរខាង
  const whiteLineL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, length), lineMat);
  whiteLineL.position.set(-width/2 + 0.3, 0.05, 0); road.add(whiteLineL);
  const whiteLineR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, length), lineMat);
  whiteLineR.position.set(width/2 - 0.3, 0.05, 0); road.add(whiteLineR);

  // ខ្សែលឿងកណ្តាល
  for (let z = -length/2 + 1; z < length/2; z += 2) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 1), yellowLineMat);
    dash.position.set(0, 0.05, z); road.add(dash);
  }
  return road;
}

// 60. របារហាមឃាត់ចូលចេញ (Parking Barrier Gate)
export function createParkingBarrier() {
  const barrier = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 });
  const armMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), baseMat);
  base.position.y = 0.75; barrier.add(base);

  // Barrier Arm (របារសម្រាប់ហាមឃាត់)
  const armGroup = new THREE.Group();
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 4), armMat);
  arm.position.z = 2; armGroup.add(arm);
  for (let i = 0; i < 4; i++) {
    const whiteStripe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.5), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    whiteStripe.position.set(0, 0, 1 + i * 1); armGroup.add(whiteStripe);
  }
  armGroup.position.set(0, 1.5, 0); 
  barrier.add(armGroup);
  barrier.userData = { armGroup };

  // ស្លាកសញ្ញា STOP
  const stopSign = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 8), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
  stopSign.rotation.x = Math.PI / 2; stopSign.position.set(0, 1.5, -0.26); barrier.add(stopSign);

  return barrier;
}

// 61. ម៉ាស៊ីនចុចយកសំបុត្រ (Ticket Dispenser)
export function createTicketMachine() {
  const machine = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x0000ff, emissive: 0x0000ff, emissiveIntensity: 1 });
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x000000 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.4), bodyMat);
  body.position.y = 0.75; machine.add(body);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.05), screenMat);
  screen.position.set(0, 1.2, 0.21); machine.add(screen);

  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.1), slotMat);
  slot.position.set(0, 0.8, 0.21); machine.add(slot);

  // ប៊ូតុងចុចពណ៌បៃតង
  const buttonMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00aa00, emissiveIntensity: 0.5 });
  const button = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16), buttonMat);
  button.rotation.x = Math.PI / 2; button.position.set(0, 0.5, 0.21); machine.add(button);

  return machine;
}

// 62. ម៉ាស៊ីនគិតលុយចំណត (Parking Payment Machine)
export function createPaymentMachine() {
  const machine = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
  const screenMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 1 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.5), bodyMat);
  body.position.y = 0.75; machine.add(body);

  const screen = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.05), screenMat);
  screen.position.set(0, 1.2, 0.26); machine.add(screen);

  // ប្រហោងដាក់កាក់
  const coinSlot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 1 }));
  coinSlot.position.set(0.2, 0.7, 0.26); machine.add(coinSlot);

  // ប៊ូតុងពិនិត្យ
  const btnMat = new THREE.MeshStandardMaterial({ color: 0x0088ff });
  for (let i = 0; i < 3; i++) {
    const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8), btnMat);
    btn.rotation.x = Math.PI / 2; btn.position.set(-0.15 + i * 0.15, 0.4, 0.26); machine.add(btn);
  }
  return machine;
}

// 63. របងព័ទ្ធជុំវិញ (Perimeter Wall)
export function createPerimeterWall(size: number) {
  const wallGroup = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
  
  // ជញ្ជាំង ៤ ជ្រុង
  const wallThickness = 0.2;
  const wallHeight = 2.5;
  
  const wallN = new THREE.Mesh(new THREE.BoxGeometry(size, wallHeight, wallThickness), wallMat);
  wallN.position.set(0, wallHeight / 2, -size / 2); wallGroup.add(wallN);
  
  const wallS = new THREE.Mesh(new THREE.BoxGeometry(size, wallHeight, wallThickness), wallMat);
  wallS.position.set(0, wallHeight / 2, size / 2); wallGroup.add(wallS);
  
  const wallE = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, size), wallMat);
  wallE.position.set(size / 2, wallHeight / 2, 0); wallGroup.add(wallE);
  
  const wallW = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, size), wallMat);
  wallW.position.set(-size / 2, wallHeight / 2, 0); wallGroup.add(wallW);
  
  return wallGroup;
}

// 64. ចង្កៀងគោមសូឡា (Solar Wall Lamp)
export function createSolarWallLamp() {
  const lamp = new THREE.Group();
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffdd55, emissive: 0xffdd55, emissiveIntensity: 2 });
  
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.1), baseMat);
  lamp.add(base);
  
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
  bulb.position.set(0, 0.15, 0.1);
  lamp.add(bulb);
  
  return lamp;
}

// 65. បង្គោលភ្លើងសូឡា (Solar Light Pole)
export function createSolarPole() {
  const pole = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.7 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x111133, metalness: 0.9 });
  const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.5 });
  
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 3, 8), poleMat);
  pillar.position.y = 1.5;
  pole.add(pillar);
  
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.4), panelMat);
  panel.position.set(0, 3.1, 0);
  panel.rotation.x = Math.PI / 6;
  pole.add(panel);
  
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), poleMat);
  arm.rotation.z = Math.PI / 2;
  arm.position.set(0.25, 2.8, 0);
  pole.add(arm);
  
  const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.2), bulbMat);
  bulb.position.set(0.5, 2.75, 0);
  pole.add(bulb);
  
  pole.userData = { bulb };
  return pole;
}

// 66. ដើមស្លា (Palm Tree)
export function createPalmTree() {
  const palm = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x228b22, roughness: 0.8 });
  
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 4, 8), trunkMat);
  trunk.position.y = 2;
  palm.add(trunk);
  
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.8, 2.5, 5), leafMat);
    leaf.position.set(0, 4, 0);
    leaf.rotation.x = (Math.PI / 4) + (i * Math.PI / 2.5);
    leaf.rotation.z = (Math.PI / 4);
    palm.add(leaf);
  }
  
  return palm;
}

// 67. បង្កើតបរិវេណទាំងមូល (Full Perimeter Setup)
export function createFullPerimeter(size: number) {
  const perimeter = new THREE.Group();
  
  // 1. របង
  perimeter.add(createPerimeterWall(size));
  
  const halfSize = size / 2;
  const stepLamp = 1.5; // រាល់ ១.៥ ម៉ែត្រ
  const stepPole = 5.0; // រាល់ ៥ ម៉ែត្រ
  
  // បង្កើតវត្ថុជុំវិញរបង
  for (let i = -halfSize; i <= halfSize; i += stepLamp) {
    // ចង្កៀងគោម (១.៥ ម៉ែត្រ)
    const lampN = createSolarWallLamp(); lampN.position.set(i, 2.2, -halfSize + 0.1); lampN.rotation.y = Math.PI; perimeter.add(lampN);
    const lampS = createSolarWallLamp(); lampS.position.set(i, 2.2, halfSize - 0.1); perimeter.add(lampS);
    const lampE = createSolarWallLamp(); lampE.position.set(halfSize - 0.1, 2.2, i); lampE.rotation.y = -Math.PI / 2; perimeter.add(lampE);
    const lampW = createSolarWallLamp(); lampW.position.set(-halfSize + 0.1, 2.2, i); lampW.rotation.y = Math.PI / 2; perimeter.add(lampW);

    // ដើមស្លា (រាល់ ១.៥ ម៉ែត្រ)
    const palmN = createPalmTree(); palmN.position.set(i, 0, -halfSize - 1); perimeter.add(palmN);
    const palmS = createPalmTree(); palmS.position.set(i, 0, halfSize + 1); perimeter.add(palmS);
    const palmE = createPalmTree(); palmE.position.set(halfSize + 1, 0, i); perimeter.add(palmE);
    const palmW = createPalmTree(); palmW.position.set(-halfSize - 1, 0, i); perimeter.add(palmW);
    
    // ផ្កាចម្រុះពណ៌ (ដាក់ចន្លោះដើមស្លា)
    if (Math.round(i) % 3 === 0) {
      const fN = createFlower(0xff00ff); fN.position.set(i, 0, -halfSize - 1.5); perimeter.add(fN);
      const fS = createFlower(0xffff00); fS.position.set(i, 0, halfSize + 1.5); perimeter.add(fS);
      const fE = createFlower(0x00ffff); fE.position.set(halfSize + 1.5, 0, i); perimeter.add(fE);
      const fW = createFlower(0xff0000); fW.position.set(-halfSize - 1.5, 0, i); perimeter.add(fW);
    }
  }

  for (let i = -halfSize; i <= halfSize; i += stepPole) {
    // បង្គោលភ្លើង (រាល់ ៥ ម៉ែត្រ)
    const poleN = createSolarPole(); poleN.position.set(i, 0, -halfSize - 2.5); perimeter.add(poleN);
    const poleS = createSolarPole(); poleS.position.set(i, 0, halfSize + 2.5); poleS.rotation.y = Math.PI; perimeter.add(poleS);
    const poleE = createSolarPole(); poleE.position.set(halfSize + 2.5, 0, i); poleE.rotation.y = -Math.PI / 2; perimeter.add(poleE);
    const poleW = createSolarPole(); poleW.position.set(-halfSize - 2.5, 0, i); poleW.rotation.y = Math.PI / 2; perimeter.add(poleW);
  }
  
  // ថ្មើរជើង (Sidewalk) ជុំវិញ
  const sideMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
  const kerbMat = new THREE.MeshStandardMaterial({ color: 0x555555 });
  
  // ថ្មើរជើង N & S
  const swN = new THREE.Mesh(new THREE.BoxGeometry(size + 6, 0.1, 1.5), sideMat); swN.position.set(0, 0.05, -halfSize - 2.5); perimeter.add(swN);
  const swS = new THREE.Mesh(new THREE.BoxGeometry(size + 6, 0.1, 1.5), sideMat); swS.position.set(0, 0.05, halfSize + 2.5); perimeter.add(swS);
  // ថ្មើរជើង E & W
  const swE = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, size + 6), sideMat); swE.position.set(halfSize + 2.5, 0.05, 0); perimeter.add(swE);
  const swW = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, size + 6), sideMat); swW.position.set(-halfSize - 2.5, 0.05, 0); perimeter.add(swW);

  // គីរូ (Kerb)
  const k1 = new THREE.Mesh(new THREE.BoxGeometry(size + 6, 0.15, 0.1), kerbMat); k1.position.set(0, 0.07, -halfSize - 3.25); perimeter.add(k1);
  const k2 = new THREE.Mesh(new THREE.BoxGeometry(size + 6, 0.15, 0.1), kerbMat); k2.position.set(0, 0.07, halfSize + 3.25); perimeter.add(k2);
  const k3 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, size + 6), kerbMat); k3.position.set(halfSize + 3.25, 0.07, 0); perimeter.add(k3);
  const k4 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, size + 6), kerbMat); k4.position.set(-halfSize - 3.25, 0.07, 0); perimeter.add(k4);

  return perimeter;
}
