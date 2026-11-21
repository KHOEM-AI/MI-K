import * as THREE from 'three';

export function createOcean(size: number = 2000): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(size, size, 64, 64);
  const mat = new THREE.MeshStandardMaterial({ 
    color: 0x005f8c, 
    transparent: true, 
    opacity: 0.9, 
    roughness: 0.2,
    metalness: 0.6
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -3;
  mesh.receiveShadow = true;
  return mesh;
}

export function createSkyAndLights(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x87CEEB); 
  scene.fog = new THREE.Fog(0x87CEEB, 500, 1500);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
  hemiLight.position.set(0, 200, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(200, 300, 100);
  dirLight.castShadow = true;
  
  dirLight.shadow.camera.top = 300;
  dirLight.shadow.camera.bottom = -300;
  dirLight.shadow.camera.left = -300;
  dirLight.shadow.camera.right = 300;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);
}
