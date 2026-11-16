import type { Shape } from "./studioTypes";

export function createGeometry(
  THREE: typeof import("three"),
  shape: Shape
): import("three").BufferGeometry {
  switch (shape) {
    case "sphere":
      return new THREE.SphereGeometry(1, 40, 32);
    case "cone":
      return new THREE.ConeGeometry(1, 2, 40);
    case "cylinder":
      return new THREE.CylinderGeometry(0.8, 0.8, 1.8, 40);
    case "torus":
      return new THREE.TorusGeometry(0.8, 0.28, 20, 80);
    default:
      return new THREE.BoxGeometry(1.7, 1.7, 1.7);
  }
}

export function createCarGeometry(
  THREE: typeof import("three"),
  type: "car" | "sportcar",
  bodyColor?: string,
  bodyMetalness?: number,
  bodyRoughness?: number
): import("three").Group {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: bodyColor || (type === "car" ? "#1e3a8a" : "#dc2626"),
    metalness: bodyMetalness ?? 0.8,
    roughness: bodyRoughness ?? 0.3,
  });

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    metalness: 0.3,
    roughness: 0.7,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: "#88ccff",
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.7,
  });

  if (type === "car") {
    // Audi-style sedan
    // Main body
    const bodyGeo = new THREE.BoxGeometry(4, 1, 2);
    const body = new THREE.Mesh(bodyGeo, bodyMaterial);
    body.position.y = 0.6;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Cabin (top)
    const cabinGeo = new THREE.BoxGeometry(2, 0.8, 1.8);
    const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
    cabin.position.set(-0.3, 1.4, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Windshield
    const windshieldGeo = new THREE.BoxGeometry(0.1, 0.7, 1.7);
    const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshield.position.set(0.7, 1.4, 0);
    group.add(windshield);

    // Rear window
    const rearWindow = new THREE.Mesh(windshieldGeo, glassMaterial);
    rearWindow.position.set(-1.3, 1.4, 0);
    group.add(rearWindow);

    // Side windows
    const sideWindowGeo = new THREE.BoxGeometry(1.8, 0.6, 0.05);
    const sideWindowL = new THREE.Mesh(sideWindowGeo, glassMaterial);
    sideWindowL.position.set(-0.3, 1.4, 0.9);
    group.add(sideWindowL);
    const sideWindowR = new THREE.Mesh(sideWindowGeo, glassMaterial);
    sideWindowR.position.set(-0.3, 1.4, -0.9);
    group.add(sideWindowR);

    // Wheels (4 cylinders)
    const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 24);
    const wheelPositions = [
      [1.3, 0.45, 1.0],
      [1.3, 0.45, -1.0],
      [-1.3, 0.45, 1.0],
      [-1.3, 0.45, -1.0],
    ];
    const wheels: import("three").Mesh[] = [];
    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      wheel.userData.wheel = true;
      group.add(wheel);
      wheels.push(wheel);
    });
    group.userData.wheels = wheels;

    // Headlights
    const headlightGeo = new THREE.BoxGeometry(0.1, 0.2, 0.4);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: "#ffffaa",
      emissive: "#ffff00",
      emissiveIntensity: 0.5,
    });
    const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
    headlightL.position.set(2.0, 0.6, 0.6);
    group.add(headlightL);
    const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
    headlightR.position.set(2.0, 0.6, -0.6);
    group.add(headlightR);

    // Taillights
    const taillightMat = new THREE.MeshStandardMaterial({
      color: "#ff0000",
      emissive: "#ff0000",
      emissiveIntensity: 0.5,
    });
    const taillightL = new THREE.Mesh(headlightGeo, taillightMat);
    taillightL.position.set(-2.0, 0.6, 0.6);
    group.add(taillightL);
    const taillightR = new THREE.Mesh(headlightGeo, taillightMat);
    taillightR.position.set(-2.0, 0.6, -0.6);
    group.add(taillightR);
  } else {
    // Sports car (lower, sleeker)
    // Main body - lower and longer
    const bodyGeo = new THREE.BoxGeometry(4.5, 0.6, 2);
    const body = new THREE.Mesh(bodyGeo, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Sleek cabin
    const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 1.6);
    const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
    cabin.position.set(-0.5, 1.05, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Windshield (more slanted)
    const windshieldGeo = new THREE.BoxGeometry(0.6, 0.5, 1.5);
    const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshield.position.set(0.5, 1.05, 0);
    windshield.rotation.z = -0.3;
    group.add(windshield);

    // Spoiler
    const spoilerGeo = new THREE.BoxGeometry(0.1, 0.4, 1.8);
    const spoiler = new THREE.Mesh(spoilerGeo, bodyMaterial);
    spoiler.position.set(-2.2, 1.0, 0);
    spoiler.castShadow = true;
    group.add(spoiler);

    const spoilerTopGeo = new THREE.BoxGeometry(0.5, 0.1, 2.0);
    const spoilerTop = new THREE.Mesh(spoilerTopGeo, bodyMaterial);
    spoilerTop.position.set(-2.2, 1.2, 0);
    group.add(spoilerTop);

    // Wheels - larger for sports car
    const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 24);
    const wheelPositions = [
      [1.4, 0.55, 1.05],
      [1.4, 0.55, -1.05],
      [-1.4, 0.55, 1.05],
      [-1.4, 0.55, -1.05],
    ];
    const wheels: import("three").Mesh[] = [];
    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      wheel.userData.wheel = true;
      group.add(wheel);
      wheels.push(wheel);
    });
    group.userData.wheels = wheels;

    // Headlights (angular)
    const headlightGeo = new THREE.BoxGeometry(0.15, 0.15, 0.5);
    const headlightMat = new THREE.MeshStandardMaterial({
      color: "#ffffff",
      emissive: "#aaddff",
      emissiveIntensity: 0.8,
    });
    const headlightL = new THREE.Mesh(headlightGeo, headlightMat);
    headlightL.position.set(2.25, 0.5, 0.6);
    group.add(headlightL);
    const headlightR = new THREE.Mesh(headlightGeo, headlightMat);
    headlightR.position.set(2.25, 0.5, -0.6);
    group.add(headlightR);
  }

  // Center the car
  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createFurnitureGeometry(
  THREE: typeof import("three"),
  type: "table" | "chair" | "sofa" | "tree" | "house" | "lamp",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();
  const defaultColor = 
    type === "table" ? "#8b4513" : 
    type === "chair" ? "#654321" : 
    type === "sofa" ? "#4a5568" : 
    type === "tree" ? "#2d5016" : 
    type === "house" ? "#d4a373" : 
    "#fbbf24";
  const material = new THREE.MeshStandardMaterial({
    color: color || defaultColor,
    metalness: metalness ?? 0.1,
    roughness: roughness ?? 0.7,
  });
  const cushionMaterial = new THREE.MeshStandardMaterial({
    color: "#cbd5e0",
    metalness: 0.05,
    roughness: 0.9,
  });

  if (type === "table") {
    // Table top
    const topGeo = new THREE.BoxGeometry(3, 0.15, 1.8);
    const top = new THREE.Mesh(topGeo, material);
    top.position.y = 1.5;
    group.add(top);

    // 4 Legs
    const legGeo = new THREE.BoxGeometry(0.15, 1.5, 0.15);
    const legPositions = [
      [1.3, 0.75, 0.75],
      [1.3, 0.75, -0.75],
      [-1.3, 0.75, 0.75],
      [-1.3, 0.75, -0.75],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, material);
      leg.position.set(x, y, z);
      group.add(leg);
    });
  } else if (type === "chair") {
    // Seat
    const seatGeo = new THREE.BoxGeometry(1.2, 0.15, 1.2);
    const seat = new THREE.Mesh(seatGeo, material);
    seat.position.y = 1.0;
    group.add(seat);

    // Backrest
    const backGeo = new THREE.BoxGeometry(1.2, 1.2, 0.15);
    const back = new THREE.Mesh(backGeo, material);
    back.position.set(0, 1.6, -0.55);
    group.add(back);

    // 4 Legs
    const legGeo = new THREE.BoxGeometry(0.12, 1.0, 0.12);
    const legPositions = [
      [0.5, 0.5, 0.5],
      [0.5, 0.5, -0.5],
      [-0.5, 0.5, 0.5],
      [-0.5, 0.5, -0.5],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, material);
      leg.position.set(x, y, z);
      group.add(leg);
    });
  } else if (type === "sofa") {
    // Sofa - base
    const baseGeo = new THREE.BoxGeometry(3.5, 0.5, 1.5);
    const base = new THREE.Mesh(baseGeo, material);
    base.position.y = 0.5;
    group.add(base);

    // Backrest
    const backGeo = new THREE.BoxGeometry(3.5, 1.0, 0.3);
    const back = new THREE.Mesh(backGeo, material);
    back.position.set(0, 1.2, -0.6);
    group.add(back);

    // 2 Armrests
    const armGeo = new THREE.BoxGeometry(0.3, 0.7, 1.5);
    const armL = new THREE.Mesh(armGeo, material);
    armL.position.set(-1.6, 0.85, 0);
    group.add(armL);
    const armR = new THREE.Mesh(armGeo, material);
    armR.position.set(1.6, 0.85, 0);
    group.add(armR);

    // 3 Cushions
    const cushionGeo = new THREE.BoxGeometry(1.0, 0.2, 1.2);
    const cushionPositions = [-1.1, 0, 1.1];
    cushionPositions.forEach((x) => {
      const cushion = new THREE.Mesh(cushionGeo, cushionMaterial);
      cushion.position.set(x, 0.85, 0.05);
      group.add(cushion);
    });
  } else if (type === "tree") {
    // Tree trunk
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 2.5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: "#5d3a1a",
      metalness: 0.05,
      roughness: 0.9,
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMaterial);
    trunk.position.y = 1.25;
    group.add(trunk);

    // Foliage (3 spheres of different sizes)
    const foliageMat = new THREE.MeshStandardMaterial({
      color: color || "#2d5016",
      metalness: 0.05,
      roughness: 0.8,
    });
    const foliage1Geo = new THREE.SphereGeometry(1.5, 16, 12);
    const foliage1 = new THREE.Mesh(foliage1Geo, foliageMat);
    foliage1.position.y = 3.0;
    group.add(foliage1);

    const foliage2Geo = new THREE.SphereGeometry(1.2, 16, 12);
    const foliage2 = new THREE.Mesh(foliage2Geo, foliageMat);
    foliage2.position.set(0.8, 3.8, 0.5);
    group.add(foliage2);

    const foliage3 = new THREE.Mesh(foliage2Geo, foliageMat);
    foliage3.position.set(-0.8, 3.8, -0.5);
    group.add(foliage3);
  } else if (type === "house") {
    // House walls
    const wallsGeo = new THREE.BoxGeometry(3, 2.5, 3);
    const walls = new THREE.Mesh(wallsGeo, material);
    walls.position.y = 1.25;
    group.add(walls);

    // Roof (cone)
    const roofGeo = new THREE.ConeGeometry(2.5, 1.5, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: "#8b0000",
      metalness: 0.1,
      roughness: 0.7,
    });
    const roof = new THREE.Mesh(roofGeo, roofMaterial);
    roof.position.y = 3.25;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Door
    const doorGeo = new THREE.BoxGeometry(0.6, 1.2, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: "#4a2c1a",
      metalness: 0.2,
      roughness: 0.6,
    });
    const door = new THREE.Mesh(doorGeo, doorMaterial);
    door.position.set(0, 0.6, 1.55);
    group.add(door);

    // 2 Windows
    const windowGeo = new THREE.BoxGeometry(0.5, 0.5, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: "#88ccff",
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.7,
    });
    const window1 = new THREE.Mesh(windowGeo, windowMaterial);
    window1.position.set(-0.9, 1.8, 1.55);
    group.add(window1);
    const window2 = new THREE.Mesh(windowGeo, windowMaterial);
    window2.position.set(0.9, 1.8, 1.55);
    group.add(window2);
  } else if (type === "lamp") {
    // Base
    const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.2, 16);
    const base = new THREE.Mesh(baseGeo, material);
    base.position.y = 0.1;
    group.add(base);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.08, 3, 8);
    const pole = new THREE.Mesh(poleGeo, material);
    pole.position.y = 1.6;
    group.add(pole);

    // Shade (cone)
    const shadeGeo = new THREE.ConeGeometry(0.8, 1.0, 16, 1, true);
    const shadeMaterial = new THREE.MeshStandardMaterial({
      color: "#fbbf24",
      metalness: 0.1,
      roughness: 0.8,
      emissive: "#fbbf24",
      emissiveIntensity: 0.5,
      side: THREE.DoubleSide,
    });
    const shade = new THREE.Mesh(shadeGeo, shadeMaterial);
    shade.position.y = 3.2;
    group.add(shade);
  }

  // Enable shadows
  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function disposeMesh(obj: import("three").Object3D) {
  obj.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      const mesh = child as import("three").Mesh;
      mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((m) => {
          if ((m as any).map) (m as any).map.dispose();
          m.dispose();
        });
      } else {
        if ((material as any).map) (material as any).map.dispose();
        material.dispose();
      }
    }
  });
}
