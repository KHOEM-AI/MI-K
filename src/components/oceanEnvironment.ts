import * as THREE from 'three';

// បង្កើតទឹកសមុទ្រ
export function createOcean(size: number = 2000): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(size, size, 64, 64);
  // ប្រើពណ៌ខៀវចាស់ និងថ្លាបន្តិច ដើម្បីឱ្យមើលទៅដូចទឹក
  const mat = new THREE.MeshStandardMaterial({ 
    color: 0x006994, 
    transparent: true, 
    opacity: 0.85, 
    roughness: 0.2,
    metalness: 0.5
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -5; // ដាក់ឱ្យទាបជាងកោះបន្តិច
  return mesh;
}

// បង្កើតមេឃ និងពន្លឺព្រះអាទិត្យ
export function createSkyAndLights(scene: THREE.Scene): void {
  // ពណ៌មេឃ (Sky Blue)
  scene.background = new THREE.Color(0x87CEEB); 
  // ចំហាយទឹក (Fog) ដើម្បីឱ្យចុងស្រមោលមើលទៅធម្មជាតិ
  scene.fog = new THREE.Fog(0x87CEEB, 500, 1500);

  // ពន្លឺពីលើមេឃ (Ambient)
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  // ពន្លឺព្រះអាទិត្យ (Directional) សម្រាប់បង្កើតម្លប់
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(200, 300, 100);
  dirLight.castShadow = true;
  
  // កំណត់ទំហំម្លប់
  dirLight.shadow.camera.top = 300;
  dirLight.shadow.camera.bottom = -300;
  dirLight.shadow.camera.left = -300;
  dirLight.shadow.camera.right = 300;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);
}
