import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { PrisonIslandConfig, TransportConfig } from './prisonTypes';
import { createThemedIsland } from './islandThemes';
import { 
  createIslandGeometry, 
  createPrisonWall, 
  createPrisonFacilities,
  createTransportPlane,
  createTransportShip
} from './prisonGeometry';
import { 
  createOuterFenceAndSecurity, 
  createPrisonFacilitiesDetails,
  createEducationAndAdmin,
  createFlowerGardenAndPaths, createDockAndVehicles } from './prisonDetails';
import { createAirportDetails, createPortDetails, createNatureDetails } from './islandDetails';

interface PrisonIsland3DProps {
  configs: PrisonIslandConfig[];
  transports: TransportConfig[];
  onMount?: (group: THREE.Group) => void;
}

export const PrisonIsland3D: React.FC<PrisonIsland3DProps> = ({ configs, transports, onMount }) => {
  const groupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const rootGroup = new THREE.Group();
    rootGroup.name = 'Prison-Island-Block';
    
    configs.forEach((cfg) => {
      const islandGroup = new THREE.Group();
      islandGroup.name = cfg.id;
      islandGroup.position.set(...cfg.position);
      
      islandGroup.add(createIslandGeometry());
      { const theme = createThemedIsland(cfg.type); if (theme) islandGroup.add(theme); }

      if (cfg.type === 'main-island') {
        islandGroup.add(createPrisonWall());
        islandGroup.add(createPrisonFacilities());
        
        islandGroup.add(createOuterFenceAndSecurity());
        islandGroup.add(createPrisonFacilitiesDetails());
        islandGroup.add(createEducationAndAdmin());
        islandGroup.add(createFlowerGardenAndPaths());
      islandGroup.add(createDockAndVehicles());
      } else if (cfg.type === 'airport-island') {
        islandGroup.add(createAirportDetails());
        const plane = createTransportPlane();
        plane.position.set(0, 15, 0);
        islandGroup.add(plane);
      } else if (cfg.type === 'port-island') {
        islandGroup.add(createPortDetails());
        const ship = createTransportShip();
        ship.position.set(0, 2, 25);
        islandGroup.add(ship);
      } else if (cfg.type === 'nature-island') {
        islandGroup.add(createNatureDetails());
      }

      rootGroup.add(islandGroup);
    });

    transports.forEach((t) => {
      const vehicle = t.type === 'plane' ? createTransportPlane() : createTransportShip();
      vehicle.position.set(...t.start);
      rootGroup.add(vehicle);
    });

    groupRef.current = rootGroup;

    if (onMount) {
      onMount(rootGroup);
    }

    return () => {
      rootGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    };
  }, [configs, transports, onMount]);

  return null; 
};

export function buildPrisonIsland(configs: PrisonIslandConfig[], transports: TransportConfig[]): THREE.Group {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Prison-Island-Block';
  
  configs.forEach((cfg) => {
    const islandGroup = new THREE.Group();
    islandGroup.name = cfg.id;
    islandGroup.position.set(...cfg.position);
    
    islandGroup.add(createIslandGeometry());
      { const theme = createThemedIsland(cfg.type); if (theme) islandGroup.add(theme); }

    if (cfg.type === 'main-island') {
      islandGroup.add(createPrisonWall());
      islandGroup.add(createPrisonFacilities());
      islandGroup.add(createOuterFenceAndSecurity());
      islandGroup.add(createPrisonFacilitiesDetails());
      islandGroup.add(createEducationAndAdmin());
      islandGroup.add(createFlowerGardenAndPaths());
      islandGroup.add(createDockAndVehicles());
    } else if (cfg.type === 'airport-island') {
      islandGroup.add(createAirportDetails());
      const plane = createTransportPlane();
      plane.position.set(0, 15, 0);
      islandGroup.add(plane);
    } else if (cfg.type === 'port-island') {
      islandGroup.add(createPortDetails());
      const ship = createTransportShip();
      ship.position.set(0, 2, 25);
      islandGroup.add(ship);
    } else if (cfg.type === 'nature-island') {
      islandGroup.add(createNatureDetails());
    }

    rootGroup.add(islandGroup);
  });

  transports.forEach((t) => {
    const vehicle = t.type === 'plane' ? createTransportPlane() : createTransportShip();
    vehicle.position.set(...t.start);
    rootGroup.add(vehicle);
  });

  return rootGroup;
}
