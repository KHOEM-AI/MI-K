import * as THREE from 'three';
import type { PrisonIslandConfig } from './prisonTypes'; // បន្ថែម 'type'

// បង្កើតដីកោះ
export function createIslandGeometry(size: number = 50): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(size, size * 1.2, 4, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -2;
  return mesh;
}

// បង្កើតជញ្ជាំងគុកព័ទ្ធជុំវិញ
export function createPrisonWall(radius: number = 40): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
  
  const wallGeo = new THREE.CylinderGeometry(radius, radius, 10, 64, 1, true);
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.y = 5;
  group.add(wall);

  const towerGeo = new THREE.BoxGeometry(6, 15, 6);
  const positions = [
    [radius, 7.5, 0], [-radius, 7.5, 0], 
    [0, 7.5, radius], [0, 7.5, -radius]
  ];
  
  positions.forEach(pos => {
    const tower = new THREE.Mesh(towerGeo, wallMat);
    tower.position.set(pos[0], pos[1], pos[2]);
    group.add(tower);
  });

  return group;
}

// បង្កើតអគារក្នុងគុក
export function createPrisonFacilities(): THREE.Group {
  const group = new THREE.Group();
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
  
  const buildings = [
    { pos: [-15, 5, -15], size: [20, 10, 15] },
    { pos: [15, 5, -15], size: [15, 10, 15] },
    { pos: [-15, 5, 15], size: [25, 10, 20] },
    { pos: [15, 5, 15], size: [10, 15, 10] },
  ];

  buildings.forEach(b => {
    const geo = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
    const mesh = new THREE.Mesh(geo, buildingMat);
    mesh.position.set(b.pos[0], b.pos[1], b.pos[2]);
    group.add(mesh);
  });

  return group;
}

// បង្កើតយន្តហោះ
export function createTransportPlane(): THREE.Group {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
  
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10, 8), mat);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(2, 10, 0.5), mat);
  group.add(wing);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.5), mat);
  tail.position.set(-4, 1, 0);
  group.add(tail);

  return group;
}

// បង្កើតកប៉ាល់
export function createTransportShip(): THREE.Group {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });

  const hull = new THREE.Mesh(new THREE.CylinderGeometry(2, 1.5, 15, 8), hullMat);
  hull.rotation.z = Math.PI / 2;
  group.add(hull);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 3), cabinMat);
  cabin.position.set(-3, 2, 0);
  group.add(cabin);

  return group;
}
