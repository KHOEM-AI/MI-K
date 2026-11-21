import * as THREE from 'three';

// បង្កើតដីកោះ (Realistic Island Terrain)
export function createIslandGeometry(size: number = 50): THREE.Group {
  const group = new THREE.Group();

  // 1. ថ្មក្រោមសមុទ្រ (Rock base)
  const rockGeo = new THREE.CylinderGeometry(size, size * 1.3, 15, 64);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x4a4238, roughness: 0.95, metalness: 0.05 });
  const rock = new THREE.Mesh(rockGeo, rockMat);
  rock.position.y = -7.5;
  rock.castShadow = true;
  rock.receiveShadow = true;
  group.add(rock);

  // 2. ឆ្នេរខ្សាច់ (Sandy beach)
  const sandGeo = new THREE.CylinderGeometry(size * 1.05, size * 1.15, 1.5, 64);
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 0.9 });
  const sand = new THREE.Mesh(sandGeo, sandMat);
  sand.position.y = 0.75;
  sand.receiveShadow = true;
  sand.castShadow = true;
  group.add(sand);

  // 3. ស្មៅ (Grass surface)
  const grassGeo = new THREE.CylinderGeometry(size * 0.9, size, 1, 64);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x3e6b34, roughness: 0.9 });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.position.y = 2;
  grass.receiveShadow = true;
  group.add(grass);

  return group;
}

// បង្កើតជញ្ជាំងគុក (Realistic Prison Wall with Towers)
export function createPrisonWall(radius: number = 40): THREE.Group {
  const group = new THREE.Group();
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.85, metalness: 0.1 });
  const towerMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.8 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });

  // 1. ជញ្ជាំងមូល (Main Circular Wall)
  const wallGeo = new THREE.CylinderGeometry(radius, radius, 15, 64, 1, true);
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.y = 9.5;
  wall.castShadow = true;
  wall.receiveShadow = true;
  group.add(wall);

  // 2. ផ្ទៃខាងលើជញ្ជាំង (Wall Walkway)
  const walkwayGeo = new THREE.RingGeometry(radius - 2, radius + 0.5, 64);
  const walkway = new THREE.Mesh(walkwayGeo, wallMat);
  walkway.rotation.x = -Math.PI / 2;
  walkway.position.y = 17;
  walkway.receiveShadow = true;
  group.add(walkway);

  // 3. បន្ទាយយាម ៤ ជ្រុង (Guard Towers)
  const towerGeo = new THREE.BoxGeometry(8, 24, 8);
  const positions = [
    [radius, 12, 0], [-radius, 12, 0], 
    [0, 12, radius], [0, 12, -radius]
  ];
  
  positions.forEach(pos => {
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(pos[0], pos[1], pos[2]);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);

    const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 6, 4), roofMat);
    roof.position.set(pos[0], pos[1] + 15, pos[2]);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // ភ្លើងស្វែងរក (Searchlight)
    const searchlight = new THREE.SpotLight(0xffffee, 2000, 150, Math.PI / 8, 0.5, 1);
    searchlight.position.set(pos[0], pos[1] + 10, pos[2]);
    searchlight.target.position.set(0, 0, 0);
    searchlight.castShadow = true;
    group.add(searchlight);
    group.add(searchlight.target);
  });

  return group;
}

// បង្កើតអគារក្នុងគុក (Realistic Prison Buildings with Windows)
export function createPrisonFacilities(): THREE.Group {
  const group = new THREE.Group();
  const buildingMat = new THREE.MeshStandardMaterial({ color: 0x5c5c5c, roughness: 0.9 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x88bbee, roughness: 0.1, metalness: 0.9, emissive: 0x112233, emissiveIntensity: 0.5 });

  const addBuilding = (x: number, z: number, w: number, h: number, d: number) => {
    const bGroup = new THREE.Group();
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), buildingMat);
    body.position.y = h / 2 + 2.5;
    body.castShadow = true;
    body.receiveShadow = true;
    bGroup.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 0.8, d + 1), roofMat);
    roof.position.y = h + 2.9;
    roof.castShadow = true;
    bGroup.add(roof);

    const cols = Math.floor(w / 3);
    const rows = Math.floor(h / 3);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 0.2), windowMat);
        win.position.set(-w/2 + 2 + i * 3, 4 + j * 3, d/2 + 0.1);
        bGroup.add(win);
        const winB = win.clone();
        winB.position.z = -d/2 - 0.1;
        bGroup.add(winB);
      }
    }

    bGroup.position.set(x, 0, z);
    return bGroup;
  };

  group.add(addBuilding(-20, -20, 30, 12, 15));
  group.add(addBuilding(20, -20, 30, 12, 15));
  group.add(addBuilding(0, -35, 20, 16, 10));
  group.add(addBuilding(20, 20, 15, 10, 15));
  
  return group;
}

export function createTransportPlane(): THREE.Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.3, metalness: 0.6 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 1.0 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.5, 12, 16, 32), bodyMat);
  body.rotation.z = Math.PI / 2;
  body.castShadow = true;
  group.add(body);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), glassMat);
  cockpit.position.set(6.5, 0, 0);
  cockpit.scale.set(1, 0.8, 0.8);
  group.add(cockpit);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 0.5), bodyMat);
  wing.position.set(0, -0.5, 0);
  wing.castShadow = true;
  group.add(wing);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 0.5), bodyMat);
  tail.position.set(-5, 2, 0);
  tail.castShadow = true;
  group.add(tail);

  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3, 4), bodyMat);
  tailFin.position.set(-5, 1, 0);
  tailFin.castShadow = true;
  group.add(tailFin);

  for (const z of [-4, 4]) {
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 3, 16), darkMat);
    engine.rotation.x = Math.PI / 2;
    engine.position.set(1, -1, z);
    engine.castShadow = true;
    group.add(engine);
    
    const turbine = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), glassMat);
    turbine.rotation.x = Math.PI / 2;
    turbine.position.set(1, -1, z + 1.5);
    group.add(turbine);
  }

  return group;
}

export function createTransportShip(): THREE.Group {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: 0x1a2b3c, roughness: 0.7 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.4 });
  const containerMats = [
    new THREE.MeshStandardMaterial({ color: 0xcc3333, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x3366cc, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0x33cc66, roughness: 0.8 }),
    new THREE.MeshStandardMaterial({ color: 0xccaa33, roughness: 0.8 })
  ];

  const hull = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2, 20, 32), hullMat);
  hull.rotation.z = Math.PI / 2;
  hull.castShadow = true;
  hull.receiveShadow = true;
  group.add(hull);

  const deck = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 5), deckMat);
  deck.position.y = 1.5;
  deck.castShadow = true;
  deck.receiveShadow = true;
  group.add(deck);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 4.5), cabinMat);
  cabin.position.set(-6, 3.25, 0);
  cabin.castShadow = true;
  group.add(cabin);

  const bridge = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 4.5), cabinMat);
  bridge.position.set(-6, 5.5, 0);
  bridge.castShadow = true;
  group.add(bridge);

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      for (let k = 0; k < 2; k++) {
        const mat = containerMats[Math.floor(Math.random() * containerMats.length)];
        const container = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.2), mat);
        container.position.set(-2 + i * 3, 3, -1.1 + j * 2.2);
        container.castShadow = true;
        container.receiveShadow = true;
        group.add(container);
      }
    }
  }

  return group;
}
