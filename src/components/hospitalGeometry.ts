import * as THREE from "three";

export function createHospitalBuilding() {
  const hospitalGroup = new THREE.Group();

  // 1. បង្កើតអគារ ៩ ជាន់ (ស៊ីឡាំងការ៉េធំ)
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.2 });
  const building = new THREE.Mesh(new THREE.BoxGeometry(12, 27, 10), buildingMat);
  building.position.y = 13.5;
  hospitalGroup.add(building);

  // 2. បង្កើតបង្អួចគ្រប់ជាន់ (ប្រើ Loop សម្រាប់ ៩ ជាន់)
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x224466, emissiveIntensity: 0.5 });
  for (let floor = 1; floor <= 9; floor++) {
    for (let w = -2; w <= 2; w++) {
      const windowMesh = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 0.2), windowMat);
      windowMesh.position.set(w * 2.2, floor * 2.8, 5.1); // តម្រៀបបង្អួច
      hospitalGroup.add(windowMesh);
    }
  }

  // 3. បង្កើតផ្លាកសញ្ញាកាកបាទក្រហម (Red Cross) នៅលើដំបូល
  const redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x880000 });
  const cross1 = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 1), redMat);
  const cross2 = new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1), redMat);
  cross1.position.set(0, 28, 0); cross2.position.set(0, 28, 0);
  hospitalGroup.add(cross1, cross2);

  return hospitalGroup;
}

export function createDoctor(isFemale: boolean = false) {
  const doctor = new THREE.Group();

  // សម្លៀកបំពាក់ពណ៌ស
  const coatMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });

  // ខ្លួនប្រាណ
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2, 16), coatMat);
  body.position.y = 1.5;
  doctor.add(body);

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), skinMat);
  head.position.y = 3;
  doctor.add(head);

  // មួកពេទ្យ
  const capMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), capMat);
  cap.position.set(0, 3.3, 0);
  doctor.add(cap);

  return doctor;
}
