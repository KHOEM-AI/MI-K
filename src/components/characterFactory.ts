import * as THREE from 'three';

// ទីតាំងឈរតម្រង់ជួរ
export const CHARACTER_TYPES = [
  'korean_soldier', 'chinese_soldier', 'japanese_soldier', 'thai_soldier', 'vietnamese_soldier',
  'american_soldier', 'british_soldier', 'french_soldier', 'german_soldier', 'russian_soldier',
  'fitness_model', 'businessman', 'fashion_model', 'doctor', 'adventurer',
  'sexy_model', 'businesswoman', 'student', 'nurse', 'heiress'
] as const;

export type CharacterType = typeof CHARACTER_TYPES[number];

// បង្កើតតួអង្គតាមប្រភេទ
export function createRealisticCharacter(type: CharacterType, scale: number = 1): THREE.Group {
  const g = new THREE.Group();
  
  // កំណត់ពណ៌ស្បែក និងសក់ តាមប្រទេស
  let skinColor = 0xf1c27d;
  let hairColor = 0x2a1b10;
  let uniformColor = 0x4b5320; // Camo green
  let pantsColor = 0x3b421a;
  let isSoldier = type.includes('soldier');
  let dressColor = 0xffffff;

  if (type === 'korean_soldier') { skinColor = 0xfceee2; hairColor = 0x111111; }
  else if (type === 'chinese_soldier') { skinColor = 0xfceee2; hairColor = 0x111111; uniformColor = 0x556b2f; }
  else if (type === 'japanese_soldier') { skinColor = 0xfceee2; hairColor = 0x2a1b10; }
  else if (type === 'thai_soldier') { skinColor = 0xd2a679; hairColor = 0x1a1a1a; uniformColor = 0x4a5d23; }
  else if (type === 'vietnamese_soldier') { skinColor = 0xd2a679; hairColor = 0x1a1a1a; }
  else if (type === 'american_soldier') { skinColor = 0xf1c27d; hairColor = 0x654321; }
  else if (type === 'british_soldier') { skinColor = 0xfceee2; hairColor = 0xd4af37; }
  else if (type === 'french_soldier') { skinColor = 0xf1c27d; hairColor = 0x4a3219; }
  else if (type === 'german_soldier') { skinColor = 0xfceee2; hairColor = 0xd4af37; }
  else if (type === 'russian_soldier') { skinColor = 0xfceee2; hairColor = 0x8b4513; }
  
  if (type === 'businessman') { uniformColor = 0x1a1a2e; pantsColor = 0x1a1a2e; }
  if (type === 'doctor') { uniformColor = 0xffffff; pantsColor = 0x3b5998; }
  if (type === 'nurse') { uniformColor = 0xffffff; pantsColor = 0xffffff; }
  if (type === 'student') { uniformColor = 0xa3c1e0; pantsColor = 0x2c3e50; }
  if (type === 'sexy_model') { uniformColor = 0xff69b4; pantsColor = 0xff69b4; }
  if (type === 'businesswoman') { uniformColor = 0xc0392b; pantsColor = 0xc0392b; }
  if (type === 'heiress') { uniformColor = 0xd4af37; pantsColor = 0xd4af37; }
  if (type === 'fashion_model') { uniformColor = 0x800080; pantsColor = 0x800080; }
  if (type === 'fitness_model') { uniformColor = 0x2c3e50; pantsColor = 0x2c3e50; }
  if (type === 'adventurer') { uniformColor = 0x8b5a2b; pantsColor = 0x4a3219; }

  const skinMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.6 });
  const hairMat = new THREE.MeshStandardMaterial({ color: hairColor, roughness: 0.8 });
  const topMat = new THREE.MeshStandardMaterial({ color: uniformColor, roughness: 0.8 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

  // ក្បាល
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), skinMat);
  head.position.y = 1.6; head.castShadow = true; g.add(head);

  // មុខ (ច្រមុះ និងភ្នែក)
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 8), skinMat);
  nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.62, 0.22); g.add(nose);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), blackMat);
  eyeL.position.set(-0.08, 1.66, 0.2); g.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), blackMat);
  eyeR.position.set(0.08, 1.66, 0.2); g.add(eyeR);

  // សក់ (ប្រុសខ្លី ស្រីវែង)
  const isFemale = ['korean_soldier', 'chinese_soldier', 'japanese_soldier', 'thai_soldier', 'vietnamese_soldier', 'american_soldier', 'british_soldier', 'french_soldier', 'german_soldier', 'russian_soldier', 'sexy_model', 'businesswoman', 'student', 'nurse', 'heiress', 'fashion_model'].includes(type);
  
  if (isFemale) {
    const hair = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.4, 8, 16), hairMat);
    hair.position.set(0, 1.5, -0.05); hair.castShadow = true; g.add(hair);
  } else {
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    hair.position.set(0, 1.6, 0); g.add(hair);
  }

  // ដងខ្លួន
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.6, 8, 24), topMat);
  body.position.y = 1.0; body.castShadow = true; g.add(body);

  // ដៃ
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 8, 16), isSoldier ? topMat : skinMat);
  armL.position.set(-0.35, 1.05, 0); armL.rotation.z = 0.2; armL.castShadow = true; g.add(armL);
  const armR = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.5, 8, 16), isSoldier ? topMat : skinMat);
  armR.position.set(0.35, 1.05, 0); armR.rotation.z = -0.2; armR.castShadow = true; g.add(armR);

  // ជើង
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.7, 8, 16), bottomMat);
  legL.position.set(-0.15, 0.4, 0); legL.castShadow = true; g.add(legL);
  const legR = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.7, 8, 16), bottomMat);
  legR.position.set(0.15, 0.4, 0); legR.castShadow = true; g.add(legR);

  // ស្បែកជើង
  const shoeL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.25), blackMat);
  shoeL.position.set(-0.15, 0.05, 0.05); g.add(shoeL);
  const shoeR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.25), blackMat);
  shoeR.position.set(0.15, 0.05, 0.05); g.add(shoeR);

  // បើជាទាហាន បន្ថែមកាំភ្លើង និងមួក
  if (isSoldier) {
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2a3b1a, roughness: 0.9 }));
    helmet.position.y = 1.6; g.add(helmet);
    
    const rifleBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.7), blackMat);
    rifleBody.position.set(0.4, 0.9, 0.2); g.add(rifleBody);
    const rifleBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), blackMat);
    rifleBarrel.rotation.x = Math.PI / 2; rifleBarrel.position.set(0.4, 0.95, 0.6); g.add(rifleBarrel);
    const rifleMag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.1), blackMat);
    rifleMag.position.set(0.4, 0.8, 0.15); g.add(rifleMag);
  }

  // បើជាគ្រូពេទ្យ បន្ថែម Stethoscope
  if (type === 'doctor' || type === 'nurse') {
    const steth = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 16), blackMat);
    steth.position.set(0, 1.3, 0.25); g.add(steth);
  }

  g.scale.setScalar(scale);
  return g;
}

// បង្កើតតួអង្គទាំង ២០ ឈរតម្រង់ជួរ
export function createCharacterLineup(): THREE.Group {
  const g = new THREE.Group();
  const row1 = CHARACTER_TYPES.slice(0, 10); // ទាហាន
  const row2 = CHARACTER_TYPES.slice(10, 20); // អ្នកស៊ីវិល័យ

  row1.forEach((type, i) => {
    const char = createRealisticCharacter(type, 1.2);
    char.position.set(-18 + i * 4, 2.5, -10);
    char.rotation.y = 0; // បែរមុខទៅមុខ
    g.add(char);
  });

  row2.forEach((type, i) => {
    const char = createRealisticCharacter(type, 1.2);
    char.position.set(-18 + i * 4, 2.5, 10);
    char.rotation.y = 0;
    g.add(char);
  });

  return g;
}
