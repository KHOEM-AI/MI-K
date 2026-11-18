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
  type: "car" | "sportcar" | "suv" | "pickup" | "van" | "police",
  bodyColor?: string,
  bodyMetalness?: number,
  bodyRoughness?: number
): import("three").Group {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: bodyColor || (type === "sportcar" ? "#dc2626" : "#1e3a8a"),
    metalness: bodyMetalness ?? 0.8,
    roughness: bodyRoughness ?? 0.3,
  });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: "#88ccff", metalness: 0.5, roughness: 0.2,
    transparent: true, opacity: 0.65,
  });
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: "#171717", metalness: 0.3, roughness: 0.7,
  });

  const isSport = type === "sportcar";
  const isSUV = type === "suv";
  const isPickup = type === "pickup";
  const isVan = type === "van";
  const isPolice = type === "police";

  const length = isSport ? 4.5 : isPickup ? 4.8 : isVan ? 4.2 : 4;
  const height = isSport ? 0.6 : isSUV ? 1.25 : isVan ? 1.35 : 1;
  const width = isVan ? 2.1 : 2;
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, width),
    bodyMaterial
  );
  body.position.y = isSport ? 0.5 : height / 2 + 0.1;
  group.add(body);

  const cabinLength = isSport ? 1.8 : isPickup ? 1.9 : isVan ? 2.7 : isSUV ? 2.5 : 2;
  const cabinHeight = isSport ? 0.55 : isSUV || isVan ? 1.15 : 0.8;
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(cabinLength, cabinHeight, width * 0.86),
    isPickup ? glassMaterial : bodyMaterial
  );
  cabin.position.set(isPickup ? -0.65 : -0.25, body.position.y + height / 2 + cabinHeight / 2 - 0.08, 0);
  group.add(cabin);

  const window = new THREE.Mesh(
    new THREE.BoxGeometry(cabinLength * 0.88, cabinHeight * 0.65, 0.035),
    glassMaterial
  );
  window.position.set(cabin.position.x, cabin.position.y, width * 0.435);
  group.add(window);
  const otherWindow = window.clone();
  otherWindow.position.z = -width * 0.435;
  group.add(otherWindow);

  if (isPickup) {
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.18, width * 0.88),
      bodyMaterial
    );
    bed.position.set(-1.55, body.position.y + height / 2 + 0.12, 0);
    group.add(bed);
    for (const z of [-width * 0.43, width * 0.43]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 0.12), bodyMaterial);
      rail.position.set(-1.55, bed.position.y + 0.2, z);
      group.add(rail);
    }
  }

  if (isPolice) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.16, 0.28),
      new THREE.MeshStandardMaterial({ color: "#2563eb", emissive: "#1d4ed8", emissiveIntensity: 0.8 })
    );
    bar.position.set(-0.15, cabin.position.y + cabinHeight / 2 + 0.12, 0);
    group.add(bar);
    const red = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.17, 0.3),
      new THREE.MeshStandardMaterial({ color: "#ef4444", emissive: "#dc2626", emissiveIntensity: 0.8 })
    );
    red.position.set(0.2, bar.position.y, 0);
    group.add(red);
  }

  const wheelRadius = isSport ? 0.48 : isSUV ? 0.52 : 0.42;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.32, 24);
  const wheelX = length * 0.31;
  const wheelZ = width * 0.5;
  const wheels: import("three").Mesh[] = [];
  for (const x of [-wheelX, wheelX]) {
    for (const z of [-wheelZ, wheelZ]) {
      const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, wheelRadius, z);
      wheel.userData.wheel = true;
      group.add(wheel);
      wheels.push(wheel);
    }
  }
  group.userData.wheels = wheels;

  const headlightMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffcc", emissive: "#ffff66", emissiveIntensity: 0.6,
  });
  for (const z of [-0.65, 0.65]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.35), headlightMaterial);
    light.position.set(length / 2 + 0.02, body.position.y, z);
    group.add(light);
  }

  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

export function createStreetLightGeometry(
  THREE: typeof import("three"),
  color = "#64748b",
  metalness = 0.7,
  roughness = 0.35
): import("three").Group {
  const group = new THREE.Group();
  const poleMaterial = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const lampMaterial = new THREE.MeshStandardMaterial({
    color: "#fff4c2",
    emissive: "#ffdf80",
    emissiveIntensity: 1.2,
    roughness: 0.3,
  });

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.14, 6, 16),
    poleMaterial
  );
  pole.position.y = 3;
  group.add(pole);

  const arm = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.1, 0.1),
    poleMaterial
  );
  arm.position.set(0.65, 5.8, 0);
  group.add(arm);

  const lamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.16, 0.38),
    lampMaterial
  );
  lamp.position.set(1.25, 5.7, 0);
  group.add(lamp);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.32, 0.25, 16),
    poleMaterial
  );
  base.position.y = 0.12;
  group.add(base);

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


export function createKhoemGeometry(
  THREE: typeof import("three"),
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  // Materials
  const bodyMat = new THREE.MeshStandardMaterial({
    color: color || "#a0a0a0",
    metalness: metalness ?? 0.9,
    roughness: roughness ?? 0.2,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: "#1a1a1a",
    metalness: 0.8,
    roughness: 0.3,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: "#0a0a0a",
    metalness: 0.9,
    roughness: 0.1,
    transparent: true,
    opacity: 0.8,
  });
  const neonMat = new THREE.MeshStandardMaterial({
    color: "#00aaff",
    emissive: "#00aaff",
    emissiveIntensity: 2.0,
  });

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.6, 2.2), bodyMat);
  body.position.y = 0.6;
  group.add(body);

  // Nose (slanted front)
  const nose = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 2.0), bodyMat);
  nose.position.set(2.4, 0.5, 0);
  nose.rotation.z = -0.2;
  group.add(nose);

  // Cabin (glass)
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 1.8), glassMat);
  cabin.position.set(-0.5, 1.15, 0);
  cabin.rotation.z = 0.1;
  group.add(cabin);

  // Spoiler base
  const spoilerBaseL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 2.0), darkMat);
  spoilerBaseL.position.set(-2.2, 1.0, 0.8);
  group.add(spoilerBaseL);

  const spoilerBaseR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 2.0), darkMat);
  spoilerBaseR.position.set(-2.2, 1.0, -0.8);
  group.add(spoilerBaseR);

  // Spoiler wing
  const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 2.2), bodyMat);
  spoilerWing.position.set(-2.3, 1.3, 0);
  group.add(spoilerWing);

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 24);
  const wheelPositions = [
    [1.5, 0.6, 1.15],
    [1.5, 0.6, -1.15],
    [-1.4, 0.6, 1.15],
    [-1.4, 0.6, -1.15],
  ];
  const wheels: import("three").Mesh[] = [];
  wheelPositions.forEach(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, darkMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.castShadow = true;
    group.add(wheel);
    wheels.push(wheel);
  });
  group.userData.wheels = wheels;

  // Headlights (neon blue)
  const headlightGeo = new THREE.BoxGeometry(0.1, 0.1, 0.6);
  const headlightL = new THREE.Mesh(headlightGeo, neonMat);
  headlightL.position.set(2.9, 0.6, 0.7);
  headlightL.rotation.y = 0.2;
  group.add(headlightL);

  const headlightR = new THREE.Mesh(headlightGeo, neonMat);
  headlightR.position.set(2.9, 0.6, -0.7);
  headlightR.rotation.y = -0.2;
  group.add(headlightR);

  // Underglow (neon blue)
  const underglowGeo = new THREE.BoxGeometry(3.5, 0.05, 0.1);
  const underglowL = new THREE.Mesh(underglowGeo, neonMat);
  underglowL.position.set(0, 0.2, 1.15);
  group.add(underglowL);

  const underglowR = new THREE.Mesh(underglowGeo, neonMat);
  underglowR.position.set(0, 0.2, -1.15);
  group.add(underglowR);

  // Taillight bar
  const taillight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, 1.8), neonMat);
  taillight.position.set(-2.4, 0.7, 0);
  group.add(taillight);

  // Enable shadows
  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createHighwayGeometry(
  THREE: typeof import("three"),
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  // Materials
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: color || "#2a2a2a",
    metalness: metalness ?? 0.1,
    roughness: roughness ?? 0.9,
  });
  const lineMat = new THREE.MeshStandardMaterial({ color: "#f5f5dc", metalness: 0.1, roughness: 0.8 });
  const poleMat = new THREE.MeshStandardMaterial({ color: "#4a4a4a", metalness: 0.8, roughness: 0.3 });
  const ledMat = new THREE.MeshStandardMaterial({
    color: "#ffffaa",
    emissive: "#ffff00",
    emissiveIntensity: 2.0,
  });

  // 1. Road (Dual Lane)
  const roadGeo = new THREE.BoxGeometry(4, 0.1, 40);
  const road1 = new THREE.Mesh(roadGeo, asphaltMat);
  road1.position.set(-2, 0, 0);
  group.add(road1);

  const road2 = new THREE.Mesh(roadGeo, asphaltMat);
  road2.position.set(2, 0, 0);
  group.add(road2);

  // 2. Center Divider (Grass/Median)
  const medianGeo = new THREE.BoxGeometry(0.5, 0.2, 40);
  const median = new THREE.Mesh(medianGeo, new THREE.MeshStandardMaterial({ color: "#3a5a3a", roughness: 0.9 }));
  median.position.set(0, 0.15, 0);
  group.add(median);

  // 3. Lane Markings (Dashed white lines)
  for (let i = -18; i <= 18; i += 3) {
    const dashGeo = new THREE.BoxGeometry(0.1, 0.02, 1.5);
    const dash1 = new THREE.Mesh(dashGeo, lineMat);
    dash1.position.set(-2, 0.06, i);
    group.add(dash1);
    const dash2 = new THREE.Mesh(dashGeo, lineMat);
    dash2.position.set(2, 0.06, i);
    group.add(dash2);
  }

  // 4. Twin Lamp Posts (Both sides)
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4, 8);
  const armGeo = new THREE.BoxGeometry(1.5, 0.08, 0.08);
  const lampGeo = new THREE.BoxGeometry(0.6, 0.15, 0.4);

  const positions = [-5, -10, -15, 5, 10, 15, 0]; // Spacing along the road
  const ledLights: import("three").Mesh[] = [];

  positions.forEach((z) => {
    // Left side
    const leftPole = new THREE.Mesh(poleGeo, poleMat);
    leftPole.position.set(-4.5, 2, z);
    group.add(leftPole);

    const leftArm = new THREE.Mesh(armGeo, poleMat);
    leftArm.position.set(-3.75, 4, z);
    group.add(leftArm);

    const leftLamp = new THREE.Mesh(lampGeo, ledMat);
    ledLights.push(leftLamp);
    leftLamp.position.set(-3.2, 3.9, z);
    group.add(leftLamp);

    // Right side
    const rightPole = new THREE.Mesh(poleGeo, poleMat);
    rightPole.position.set(4.5, 2, z);
    group.add(rightPole);

    const rightArm = new THREE.Mesh(armGeo, poleMat);
    rightArm.position.set(3.75, 4, z);
    group.add(rightArm);

    const rightLamp = new THREE.Mesh(lampGeo, ledMat);
    ledLights.push(rightLamp);
    rightLamp.position.set(3.2, 3.9, z);
    group.add(rightLamp);
  });

  group.userData.ledLights = ledLights;

  // Enable shadows
  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}


export function createBridgeGeometry(
  THREE: typeof import("three"),
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();
  const roadMat = new THREE.MeshStandardMaterial({ color: color || "#2a2a2a", metalness: metalness ?? 0.1, roughness: roughness ?? 0.9 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: "#888888", metalness: 0.1, roughness: 0.9 });
  const railMat = new THREE.MeshStandardMaterial({ color: "#a0a0a0", metalness: 0.9, roughness: 0.2 });

  // Elevated Road
  const road = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 30), roadMat);
  road.position.y = 4;
  group.add(road);

  // Side Rails
  const railL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 30), railMat);
  railL.position.set(-3, 4.35, 0);
  group.add(railL);
  const railR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 30), railMat);
  railR.position.set(3, 4.35, 0);
  group.add(railR);

  // Pillars (Supporting the bridge)
  const pillarGeo = new THREE.CylinderGeometry(0.8, 1, 4, 16);
  [-10, 0, 10].forEach((z) => {
    const pillar = new THREE.Mesh(pillarGeo, concreteMat);
    pillar.position.set(0, 2, z);
    group.add(pillar);
  });

  // Ramps (Slanted to connect to ground)
  const rampGeo = new THREE.BoxGeometry(6, 0.2, 10);
  const rampL = new THREE.Mesh(rampGeo, roadMat);
  rampL.position.set(0, 2, -20);
  rampL.rotation.x = -Math.PI / 6;
  group.add(rampL);

  const rampR = new THREE.Mesh(rampGeo, roadMat);
  rampR.position.set(0, 2, 20);
  rampR.rotation.x = Math.PI / 6;
  group.add(rampR);

  group.traverse(c => { if ((c as import("three").Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }});
  return group;
}

export function createTrafficLightGeometry(
  THREE: typeof import("three"),
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();
  const poleMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", metalness: 0.8, roughness: 0.3 });
  const boxMat = new THREE.MeshStandardMaterial({ color: "#222222", metalness: 0.5, roughness: 0.5 });
  const housingMat = new THREE.MeshStandardMaterial({ color: "#333333", metalness: 0.5, roughness: 0.6 });

  // Pole
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3, 8), poleMat);
  pole.position.y = 1.5;
  group.add(pole);

  // Housing Box
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 0.4), housingMat);
  housing.position.set(0, 3.5, 0);
  group.add(housing);

  // Lights (Red, Yellow, Green)
  const createLight = (y: number, colorHex: string, name: string) => {
    const mat = new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.1 });
    const light = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16), mat);
    light.rotation.x = Math.PI / 2;
    light.position.set(0, y, 0.21);
    light.name = name;
    group.add(light);
    return light;
  };

  const red = createLight(4.0, "#ff0000", "red");
  const yellow = createLight(3.5, "#ffff00", "yellow");
  const green = createLight(3.0, "#00ff00", "green");

  // Store in userData for animation
  group.userData.trafficLights = { red, yellow, green };

  group.traverse(c => { if ((c as import("three").Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; }});
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

// ============================================================
// PLANT GEOMETRIES (Palm, Big Tree, Bush, Flower, Bamboo)
// ============================================================

export function createPlantGeometry(
  THREE: typeof import("three"),
  type: "palmtree" | "bigtree" | "bush" | "flower" | "bamboo",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({
    color: "#6b4423",
    metalness: metalness ?? 0.05,
    roughness: roughness ?? 0.9,
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: color || "#2d6a2d",
    metalness: metalness ?? 0.05,
    roughness: roughness ?? 0.8,
  });

  if (type === "palmtree") {
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.35, 4.5, 10);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.25;
    trunk.rotation.z = 0.08;
    group.add(trunk);

    const frondGeo = new THREE.BoxGeometry(0.15, 0.05, 2.2);
    for (let i = 0; i < 7; i++) {
      const frond = new THREE.Mesh(frondGeo, leafMat);
      const angle = (i / 7) * Math.PI * 2;
      frond.position.set(
        Math.cos(angle) * 0.9,
        4.5 + Math.sin(i) * 0.1,
        Math.sin(angle) * 0.9
      );
      frond.rotation.y = angle;
      frond.rotation.x = -0.5;
      group.add(frond);
    }

    const coconutMat = new THREE.MeshStandardMaterial({ color: "#8b5a2b", roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const coconut = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), coconutMat);
      coconut.position.set(
        Math.cos((i / 3) * Math.PI * 2) * 0.3,
        4.3,
        Math.sin((i / 3) * Math.PI * 2) * 0.3
      );
      group.add(coconut);
    }
  } else if (type === "bigtree") {
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 3.5, 12);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.75;
    group.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({
      color: color || "#1e4d1e",
      roughness: 0.85,
    });
    const positions: [number, number, number, number][] = [
      [0, 4.5, 0, 2.0],
      [1.2, 4.8, 0.5, 1.5],
      [-1.2, 4.8, -0.5, 1.5],
      [0.5, 5.5, -1.0, 1.4],
      [-0.6, 5.3, 1.0, 1.4],
    ];
    positions.forEach(([x, y, z, r]) => {
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), foliageMat);
      foliage.position.set(x, y, z);
      group.add(foliage);
    });

    const branchGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.8, 8);
    for (let i = 0; i < 4; i++) {
      const branch = new THREE.Mesh(branchGeo, trunkMat);
      const angle = (i / 4) * Math.PI * 2;
      branch.position.set(Math.cos(angle) * 0.9, 3.5, Math.sin(angle) * 0.9);
      branch.rotation.z = Math.cos(angle) * 0.6;
      branch.rotation.x = Math.sin(angle) * 0.6;
      group.add(branch);
    }
  } else if (type === "bush") {
    const bushMat = new THREE.MeshStandardMaterial({
      color: color || "#3a7d3a",
      roughness: 0.9,
    });
    const positions: [number, number, number, number][] = [
      [0, 0.6, 0, 0.8],
      [0.6, 0.5, 0.3, 0.6],
      [-0.6, 0.5, -0.2, 0.65],
      [0.2, 0.9, -0.5, 0.55],
    ];
    positions.forEach(([x, y, z, r]) => {
      const bush = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), bushMat);
      bush.position.set(x, y, z);
      group.add(bush);
    });
  } else if (type === "flower") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.9 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.6, 8), stemMat);
    stem.position.y = 0.8;
    group.add(stem);

    const petalMat = new THREE.MeshStandardMaterial({
      color: color || "#ff69b4",
      roughness: 0.6,
      metalness: 0.1,
    });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), petalMat);
      petal.position.set(Math.cos(angle) * 0.28, 1.7, Math.sin(angle) * 0.28);
      petal.scale.set(1, 0.5, 1);
      group.add(petal);
    }

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 10, 8),
      new THREE.MeshStandardMaterial({ color: "#ffdd00", emissive: "#ffdd00", emissiveIntensity: 0.3 })
    );
    center.position.y = 1.75;
    group.add(center);

    const leafMatF = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.9 });
    for (const sign of [-1, 1]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), leafMatF);
      leaf.position.set(sign * 0.25, 0.9, 0);
      leaf.scale.set(1, 0.3, 0.6);
      group.add(leaf);
    }
  } else if (type === "bamboo") {
    const bambooMat = new THREE.MeshStandardMaterial({
      color: color || "#7caa3a",
      roughness: 0.7,
      metalness: 0.05,
    });
    for (let i = 0; i < 5; i++) {
      const height = 3 + Math.random() * 1.5;
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.12, height, 10),
        bambooMat
      );
      stalk.position.set(
        (Math.random() - 0.5) * 1.2,
        height / 2,
        (Math.random() - 0.5) * 1.2
      );
      group.add(stalk);

      for (let j = 1; j < 4; j++) {
        const node = new THREE.Mesh(
          new THREE.TorusGeometry(0.13, 0.03, 6, 12),
          new THREE.MeshStandardMaterial({ color: "#5a7a2a", roughness: 0.9 })
        );
        node.position.set(stalk.position.x, (height / 4) * j, stalk.position.z);
        node.rotation.x = Math.PI / 2;
        group.add(node);
      }

      for (let k = 0; k < 3; k++) {
        const leaf = new THREE.Mesh(
          new THREE.BoxGeometry(0.4, 0.02, 0.12),
          new THREE.MeshStandardMaterial({ color: "#4d8a2d", roughness: 0.8 })
        );
        leaf.position.set(
          stalk.position.x + (Math.random() - 0.5) * 0.3,
          height - 0.2,
          stalk.position.z + (Math.random() - 0.5) * 0.3
        );
        leaf.rotation.y = Math.random() * Math.PI;
        group.add(leaf);
      }
    }
  }

  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

// ============================================================
// PLANT GEOMETRIES V2 (Cactus, Pine, Sunflower, Lotus, Grass, Vine)
// ============================================================

export function createPlantGeometry2(
  THREE: typeof import("three"),
  type: "cactus" | "pinetree" | "sunflower" | "lotus" | "grass" | "vine",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "cactus") {
    const cactusMat = new THREE.MeshStandardMaterial({ color: color || "#3a8a3a", roughness: 0.8 });
    // Main trunk
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 2.5, 12), cactusMat);
    trunk.position.y = 1.25;
    group.add(trunk);
    // Two arms
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 1.0, 10), cactusMat);
      arm.position.set(side * 0.45, 1.4, 0);
      arm.rotation.z = side * -0.8;
      group.add(arm);
      const armTop = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 10), cactusMat);
      armTop.position.set(side * 0.85, 1.85, 0);
      group.add(armTop);
    }
    // Spines (small cones)
    const spineMat = new THREE.MeshStandardMaterial({ color: "#e8e8c0", roughness: 0.6 });
    for (let i = 0; i < 12; i++) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.12, 4), spineMat);
      const angle = (i / 12) * Math.PI * 2;
      spine.position.set(Math.cos(angle) * 0.36, 0.3 + i * 0.18, Math.sin(angle) * 0.36);
      spine.rotation.z = Math.PI / 2;
      spine.rotation.y = angle;
      group.add(spine);
    }
    // Pink flower on top
    const flowerMat = new THREE.MeshStandardMaterial({ color: "#ff69b4", roughness: 0.5 });
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), flowerMat);
    flower.position.y = 2.55;
    flower.scale.set(1, 0.6, 1);
    group.add(flower);
  } else if (type === "pinetree") {
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#5d3a1a", roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.5, 10), trunkMat);
    trunk.position.y = 0.75;
    group.add(trunk);
    // 3 stacked cones (pine layers)
    const pineMat = new THREE.MeshStandardMaterial({ color: color || "#1e5a1e", roughness: 0.85 });
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.2 - i * 0.25, 1.5, 12), pineMat);
      cone.position.y = 1.5 + i * 0.9;
      group.add(cone);
    }
    // Snow cap on top
    const snowMat = new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 0.6 });
    const snow = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 12), snowMat);
    snow.position.y = 3.7;
    group.add(snow);
  } else if (type === "sunflower") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.9 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.5, 8), stemMat);
    stem.position.y = 1.25;
    group.add(stem);
    // Leaves on stem
    for (const [y, side] of [[0.8, 1], [1.5, -1], [2.0, 1]] as [number, number][]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), stemMat);
      leaf.position.set(side * 0.3, y, 0);
      leaf.scale.set(1.2, 0.25, 0.6);
      group.add(leaf);
    }
    // Yellow petals (12)
    const petalMat = new THREE.MeshStandardMaterial({ color: color || "#ffd700", roughness: 0.5, emissive: "#ffaa00", emissiveIntensity: 0.2 });
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), petalMat);
      petal.position.set(Math.cos(angle) * 0.42, 2.55, Math.sin(angle) * 0.42);
      petal.scale.set(1, 0.4, 0.7);
      group.add(petal);
    }
    // Brown center
    const centerMat = new THREE.MeshStandardMaterial({ color: "#5a3a1a", roughness: 0.9 });
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), centerMat);
    center.position.y = 2.55;
    center.scale.set(1, 0.4, 1);
    group.add(center);
  } else if (type === "lotus") {
    // Water lily pad
    const padMat = new THREE.MeshStandardMaterial({ color: "#3a7d3a", roughness: 0.7, side: THREE.DoubleSide });
    const pad = new THREE.Mesh(new THREE.CircleGeometry(1.2, 24), padMat);
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.02;
    group.add(pad);
    // Pink petals (2 layers)
    const petalMat = new THREE.MeshStandardMaterial({ color: color || "#ffb6d9", roughness: 0.4, side: THREE.DoubleSide });
    for (let layer = 0; layer < 2; layer++) {
      const count = 6;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + layer * 0.5;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), petalMat);
        petal.position.set(Math.cos(angle) * 0.4, 0.15 + layer * 0.1, Math.sin(angle) * 0.4);
        petal.scale.set(1, 0.5, 0.4);
        petal.rotation.y = -angle;
        group.add(petal);
      }
    }
    // Yellow center
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({ color: "#ffdd00", emissive: "#ffaa00", emissiveIntensity: 0.3 }));
    center.position.y = 0.3;
    group.add(center);
  } else if (type === "grass") {
    const grassMat = new THREE.MeshStandardMaterial({ color: color || "#4d8a2d", roughness: 0.9, side: THREE.DoubleSide });
    // 20 blade clusters
    for (let i = 0; i < 20; i++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.4 + Math.random() * 0.3, 4), grassMat);
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.6;
      blade.position.set(Math.cos(angle) * radius, 0.2, Math.sin(angle) * radius);
      blade.rotation.z = (Math.random() - 0.5) * 0.5;
      blade.rotation.y = Math.random() * Math.PI;
      group.add(blade);
    }
  } else if (type === "vine") {
    // Vertical pole
    const poleMat = new THREE.MeshStandardMaterial({ color: "#5d3a1a", roughness: 0.9 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 8), poleMat);
    pole.position.y = 1.5;
    group.add(pole);
    // Spiral leaves
    const vineMat = new THREE.MeshStandardMaterial({ color: color || "#3a8a3a", roughness: 0.8 });
    for (let i = 0; i < 24; i++) {
      const t = i / 24;
      const angle = t * Math.PI * 6;
      const y = 0.3 + t * 2.7;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), vineMat);
      leaf.position.set(Math.cos(angle) * 0.25, y, Math.sin(angle) * 0.25);
      leaf.scale.set(1.2, 0.4, 0.8);
      leaf.rotation.y = angle;
      group.add(leaf);
    }
  }

  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

// ============================================================
// ENVIRONMENT GEOMETRIES (Rock, Pond, Hill, Ground Patch)
// ============================================================

export function createEnvironmentGeometry(
  THREE: typeof import("three"),
  type: "rock" | "pond" | "hill" | "groundpatch",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "rock") {
    const rockMat = new THREE.MeshStandardMaterial({ color: color || "#6b6b6b", roughness: roughness ?? 0.9, metalness: metalness ?? 0.1 });
    const positions: [number, number, number, number][] = [
      [0, 0.3, 0, 0.6],
      [0.4, 0.2, 0.3, 0.4],
      [-0.3, 0.25, -0.2, 0.45],
      [0.2, 0.15, -0.4, 0.3],
    ];
    positions.forEach(([x, y, z, r]) => {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), rockMat);
      rock.position.set(x, y, z);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rock);
    });
  } else if (type === "pond") {
    // Water surface
    const waterMat = new THREE.MeshStandardMaterial({ color: color || "#1e88e5", roughness: roughness ?? 0.1, metalness: metalness ?? 0.5, transparent: true, opacity: 0.8 });
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.8, 32), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.05;
    group.add(water);
    // Surrounding rocks
    const rockMat = new THREE.MeshStandardMaterial({ color: "#7a7a7a", roughness: 0.9 });
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.15, 0), rockMat);
      rock.position.set(Math.cos(angle) * 1.9, 0.1, Math.sin(angle) * 1.9);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rock);
    }
  } else if (type === "hill") {
    const hillMat = new THREE.MeshStandardMaterial({ color: color || "#3a8a3a", roughness: roughness ?? 0.9 });
    const hill = new THREE.Mesh(new THREE.SphereGeometry(2.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), hillMat);
    hill.position.y = 0;
    hill.scale.set(1, 0.5, 1);
    group.add(hill);
    // Grass tufts on top
    const grassMat = new THREE.MeshStandardMaterial({ color: "#5aa83a", roughness: 0.8 });
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 1.5;
      const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), grassMat);
      tuft.position.set(Math.cos(angle) * r, 1.2 - r * 0.15, Math.sin(angle) * r);
      group.add(tuft);
    }
  } else if (type === "groundpatch") {
    const groundMat = new THREE.MeshStandardMaterial({ color: color || "#5a4a3a", roughness: roughness ?? 0.95 });
    const patch = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 3), groundMat);
    patch.position.y = 0.05;
    group.add(patch);
    // Some grass details
    const grassMat = new THREE.MeshStandardMaterial({ color: "#4a7a2d", roughness: 0.9 });
    for (let i = 0; i < 15; i++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 4), grassMat);
      blade.position.set((Math.random() - 0.5) * 2.8, 0.15, (Math.random() - 0.5) * 2.8);
      blade.rotation.z = (Math.random() - 0.5) * 0.4;
      group.add(blade);
    }
  }

  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

// ============================================================
// PLANT GEOMETRIES V3 (Rose, Tulip, Mushroom)
// ============================================================

export function createPlantGeometry3(
  THREE: typeof import("three"),
  type: "rose" | "tulip" | "mushroom",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "rose") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.9 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2, 8), stemMat);
    stem.position.y = 1;
    group.add(stem);

    // Leaves
    for (const [y, side] of [[0.6, 1], [1.2, -1]] as [number, number][]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), stemMat);
      leaf.position.set(side * 0.2, y, 0);
      leaf.scale.set(1.3, 0.25, 0.6);
      group.add(leaf);
    }

    // Rose petals — spiral layers
    const roseMat = new THREE.MeshStandardMaterial({ color: color || "#e63946", roughness: 0.5 });
    for (let layer = 0; layer < 3; layer++) {
      const count = 5 + layer * 2;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + layer * 0.4;
        const radius = 0.15 + layer * 0.12;
        const petal = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), roseMat);
        petal.position.set(
          Math.cos(angle) * radius,
          2 + layer * 0.08,
          Math.sin(angle) * radius
        );
        petal.scale.set(1, 0.6, 0.5);
        petal.rotation.y = -angle;
        petal.rotation.z = -0.3;
        group.add(petal);
      }
    }
    // Center
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), roseMat);
    center.position.y = 2.15;
    group.add(center);
  } else if (type === "tulip") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.9 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.8, 8), stemMat);
    stem.position.y = 0.9;
    group.add(stem);

    // Long leaves
    for (const [y, side] of [[0.5, 1], [1.0, -1]] as [number, number][]) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), stemMat);
      leaf.position.set(side * 0.25, y, 0);
      leaf.scale.set(1.5, 0.15, 0.5);
      group.add(leaf);
    }

    // Tulip cup (5 petals)
    const tulipMat = new THREE.MeshStandardMaterial({ color: color || "#ff6b9d", roughness: 0.4 });
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), tulipMat);
      petal.position.set(Math.cos(angle) * 0.15, 2, Math.sin(angle) * 0.15);
      petal.scale.set(1, 1.2, 0.5);
      petal.rotation.y = -angle;
      group.add(petal);
    }
    // Yellow center
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshStandardMaterial({ color: "#ffdd00", roughness: 0.6 }));
    center.position.y = 2.1;
    group.add(center);
  } else if (type === "mushroom") {
    // Stem
    const stemMat = new THREE.MeshStandardMaterial({ color: "#f5f0e0", roughness: 0.8 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.8, 12), stemMat);
    stem.position.y = 0.4;
    group.add(stem);

    // Cap (half sphere)
    const capMat = new THREE.MeshStandardMaterial({ color: color || "#d32f2f", roughness: 0.7 });
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      capMat
    );
    cap.position.y = 0.8;
    cap.scale.set(1, 0.7, 1);
    group.add(cap);

    // White spots on cap
    const spotMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 0.25 + Math.random() * 0.2;
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), spotMat);
      spot.position.set(
        Math.cos(angle) * r,
        0.8 + Math.sqrt(Math.max(0, 0.55 * 0.55 - r * r)) * 0.7,
        Math.sin(angle) * r
      );
      spot.scale.set(1, 0.3, 1);
      group.add(spot);
    }
  }

  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}

// ============================================================
// SKY GEOMETRIES (Star, Moon, Cloud, Waterfall)
// ============================================================

export function createSkyGeometry(
  THREE: typeof import("three"),
  type: "star" | "moon" | "cloud" | "waterfall",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "star") {
    // 3D star using two tetrahedrons
    const starMat = new THREE.MeshStandardMaterial({
      color: color || "#ffdd00",
      emissive: "#ffaa00",
      emissiveIntensity: 0.8,
      roughness: 0.4,
      metalness: 0.3,
    });
    const shape = new THREE.Shape();
    const outer = 0.6, inner = 0.25;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
    const star = new THREE.Mesh(geo, starMat);
    star.position.y = 0.5;
    group.add(star);
  } else if (type === "moon") {
    // Crescent moon — big sphere minus offset sphere (use two spheres)
    const moonMat = new THREE.MeshStandardMaterial({
      color: color || "#f0e68c",
      emissive: "#e8dc80",
      emissiveIntensity: 0.5,
      roughness: 0.6,
    });
    const moon = new THREE.Mesh(new THREE.SphereGeometry(0.8, 24, 16), moonMat);
    group.add(moon);
    // Crater details
    const craterMat = new THREE.MeshStandardMaterial({ color: "#d8c870", roughness: 0.9 });
    const craters: [number, number, number, number][] = [
      [0.3, 0.2, 0.6, 0.15],
      [-0.2, 0.4, 0.5, 0.1],
      [0.1, -0.3, 0.7, 0.12],
      [-0.4, -0.1, 0.5, 0.08],
    ];
    craters.forEach(([x, y, z, r]) => {
      const crater = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), craterMat);
      crater.position.set(x, y, z);
      crater.scale.set(1, 1, 0.3);
      group.add(crater);
    });
  } else if (type === "cloud") {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: color || "#ffffff",
      roughness: 0.9,
      metalness: 0.0,
      transparent: true,
      opacity: 0.95,
    });
    const positions: [number, number, number, number][] = [
      [0, 0, 0, 0.7],
      [0.7, 0.1, 0, 0.5],
      [-0.7, 0.05, 0, 0.55],
      [0.4, 0.4, 0.2, 0.45],
      [-0.4, 0.35, -0.2, 0.4],
      [0, 0.5, 0, 0.5],
    ];
    positions.forEach(([x, y, z, r]) => {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudMat);
      puff.position.set(x, y, z);
      group.add(puff);
    });
  } else if (type === "waterfall") {
    // Rock cliff
    const cliffMat = new THREE.MeshStandardMaterial({ color: "#5a5a5a", roughness: 0.9 });
    const cliff = new THREE.Mesh(new THREE.BoxGeometry(2, 3, 1.5), cliffMat);
    cliff.position.set(0, 1.5, -0.5);
    group.add(cliff);

    // Water stream
    const waterMat = new THREE.MeshStandardMaterial({
      color: color || "#4fc3f7",
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.85,
    });
    const water = new THREE.Mesh(new THREE.BoxGeometry(1.4, 3, 0.2), waterMat);
    water.position.set(0, 1.5, 0.26);
    group.add(water);

    // Foam at bottom
    const foamMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 6; i++) {
      const foam = new THREE.Mesh(new THREE.SphereGeometry(0.2 + Math.random() * 0.1, 8, 6), foamMat);
      foam.position.set((Math.random() - 0.5) * 1.2, 0.15, 0.5 + Math.random() * 0.3);
      group.add(foam);
    }

    // Pool
    const poolMat = new THREE.MeshStandardMaterial({ color: "#29b6f6", roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.7 });
    const pool = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), poolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(0, 0.05, 0.8);
    group.add(pool);
  }

  group.traverse((child) => {
    if ((child as import("three").Mesh).isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return group;
}
