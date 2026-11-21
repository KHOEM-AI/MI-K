import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { PrisonIslandConfig, TransportConfig } from './prisonTypes';
import { 
  createIslandGeometry, 
  createPrisonWall, 
  createPrisonFacilities,
  createTransportPlane,
  createTransportShip
} from './prisonGeometry';

interface PrisonIsland3DProps {
  configs: PrisonIslandConfig[];
  transports: TransportConfig[];
  onMount?: (group: THREE.Group) => void; // សម្រាប់ភ្ជាប់ទៅ Scene
}

export const PrisonIsland3D: React.FC<PrisonIsland3DProps> = ({ configs, transports, onMount }) => {
  const groupRef = useRef<THREE.Group>(new THREE.Group());

  useEffect(() => {
    const rootGroup = groupRef.current;
    // សម្អាតចាស់
    while(rootGroup.children.length > 0) {
      rootGroup.remove(rootGroup.children[0]);
    }
    
    // បង្កើតថ្មី
    configs.forEach((cfg) => {
      const islandGroup = new THREE.Group();
      islandGroup.name = cfg.id;
      islandGroup.position.set(...cfg.position);
      
      islandGroup.add(createIslandGeometry());

      if (cfg.type === 'main-island') {
        islandGroup.add(createPrisonWall());
        islandGroup.add(createPrisonFacilities());
      } else if (cfg.type === 'airport-island') {
        const plane = createTransportPlane();
        plane.position.set(0, 15, 0);
        islandGroup.add(plane);
      } else if (cfg.type === 'port-island') {
        const ship = createTransportShip();
        ship.position.set(0, 2, 25);
        islandGroup.add(ship);
      }

      rootGroup.add(islandGroup);
    });

    // បន្ថែម Transport ផ្សេងៗ
    transports.forEach((t) => {
      const vehicle = t.type === 'plane' ? createTransportPlane() : createTransportShip();
      vehicle.position.set(...t.start);
      rootGroup.add(vehicle);
    });

    if (onMount) {
      onMount(rootGroup);
    }

    // Cleanup ពេល unmount
    return () => {
      while(rootGroup.children.length > 0) {
        rootGroup.remove(rootGroup.children[0]);
      }
    };
  }, [configs, transports, onMount]);

  // បើគ្មាន R3F យើងមិន Render JSX ទេ តែយើងអាចប្រើ Component នេះជា Wrapper ដែលផ្តល់ Group ទៅ Scene
  return null; // ឬបងអាចប្រើ `<primitive object={groupRef.current} />` បើបងប្រើ R3F
};

// បង្កើត Helper សម្រាប់ប្រើក្នុង Scene ធម្មតា
export function buildPrisonIsland(configs: PrisonIslandConfig[], transports: TransportConfig[]): THREE.Group {
  const root = new THREE.Group();
  root.name = 'Prison-Island-Block';

  configs.forEach((cfg) => {
    const islandGroup = new THREE.Group();
    islandGroup.position.set(...cfg.position);
    islandGroup.add(createIslandGeometry());
    
    if (cfg.type === 'main-island') {
      islandGroup.add(createPrisonWall());
      islandGroup.add(createPrisonFacilities());
    }
    root.add(islandGroup);
  });

  return root;
}
