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

// ============================================================
// PLANT GEOMETRIES V4 (Lavender, Cattail, Fern, Cactus Flower, Bonsai)
// ============================================================

export function createPlantGeometry4(
  THREE: typeof import("three"),
  type: "lavender" | "cattail" | "fern" | "cactusflower" | "bonsai",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "lavender") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#4a7a2d", roughness: 0.9 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: color || "#9b59b6", roughness: 0.6 });

    // 5 stems
    for (let s = 0; s < 5; s++) {
      const x = (Math.random() - 0.5) * 0.4;
      const z = (Math.random() - 0.5) * 0.4;
      const height = 1.5 + Math.random() * 0.5;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, height, 6), stemMat);
      stem.position.set(x, height / 2, z);
      group.add(stem);

      // Flower spike (many small spheres)
      for (let i = 0; i < 8; i++) {
        const floret = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), flowerMat);
        floret.position.set(x + (Math.random() - 0.5) * 0.08, height - 0.1 + i * 0.08, z + (Math.random() - 0.5) * 0.08);
        group.add(floret);
      }
    }
  } else if (type === "cattail") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#4a7a2d", roughness: 0.9 });
    const cattailMat = new THREE.MeshStandardMaterial({ color: color || "#6b4423", roughness: 0.8 });

    // 3 cattails
    for (let s = 0; s < 3; s++) {
      const x = (Math.random() - 0.5) * 0.5;
      const z = (Math.random() - 0.5) * 0.5;
      const height = 2.5 + Math.random() * 0.5;

      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, height, 6), stemMat);
      stem.position.set(x, height / 2, z);
      group.add(stem);

      // Brown cylinder (cattail head)
      const head = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 10), cattailMat);
      head.position.set(x, height - 0.3, z);
      group.add(head);

      // Spike on top
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.2, 4), stemMat);
      spike.position.set(x, height + 0.05, z);
      group.add(spike);
    }

    // Water base
    const waterMat = new THREE.MeshStandardMaterial({ color: "#29b6f6", transparent: true, opacity: 0.6, roughness: 0.1 });
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.02;
    group.add(water);
  } else if (type === "fern") {
    const fernMat = new THREE.MeshStandardMaterial({ color: color || "#2d6a2d", roughness: 0.85, side: THREE.DoubleSide });

    // 8 fronds radiating from center
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const frondLength = 1.2 + Math.random() * 0.4;

      // Main stem
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, frondLength, 5), fernMat);
      stem.position.set(Math.cos(angle) * frondLength * 0.4, 0.6, Math.sin(angle) * frondLength * 0.4);
      stem.rotation.z = Math.cos(angle) * Math.PI / 3;
      stem.rotation.x = Math.sin(angle) * Math.PI / 3;
      group.add(stem);

      // Leaves along stem (small elongated spheres)
      for (let j = 1; j <= 6; j++) {
        const t = j / 6;
        const leafX = Math.cos(angle) * frondLength * t * 0.7;
        const leafY = 0.6 + Math.sin(t * Math.PI / 2) * 0.5;
        const leafZ = Math.sin(angle) * frondLength * t * 0.7;
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 5, 4), fernMat);
        leaf.position.set(leafX, leafY, leafZ);
        leaf.scale.set(1.5, 0.2, 0.6);
        leaf.rotation.y = angle;
        group.add(leaf);
      }
    }
  } else if (type === "cactusflower") {
    // Cactus body
    const cactusMat = new THREE.MeshStandardMaterial({ color: "#3a8a3a", roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), cactusMat);
    body.position.y = 0.5;
    body.scale.set(1, 1.2, 1);
    group.add(body);

    // Spines
    const spineMat = new THREE.MeshStandardMaterial({ color: "#e8e8c0", roughness: 0.6 });
    for (let i = 0; i < 20; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 3), spineMat);
      spine.position.set(
        Math.sin(phi) * Math.cos(theta) * 0.5,
        0.5 + Math.cos(phi) * 0.6,
        Math.sin(phi) * Math.sin(theta) * 0.5
      );
      spine.lookAt(0, 0.5, 0);
      group.add(spine);
    }

    // Bright flower on top
    const flowerMat = new THREE.MeshStandardMaterial({ color: color || "#ff1493", roughness: 0.4, emissive: "#ff1493", emissiveIntensity: 0.2 });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), flowerMat);
      petal.position.set(Math.cos(angle) * 0.2, 1.2, Math.sin(angle) * 0.2);
      petal.scale.set(1, 0.4, 0.7);
      group.add(petal);
    }
    const flowerCenter = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: "#ffdd00" }));
    flowerCenter.position.y = 1.2;
    group.add(flowerCenter);
  } else if (type === "bonsai") {
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#5d3a1a", roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: color || "#2d5a2d", roughness: 0.85 });

    // Pot
    const potMat = new THREE.MeshStandardMaterial({ color: "#8b4513", roughness: 0.7 });
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.4, 0.3, 12), potMat);
    pot.position.y = 0.15;
    group.add(pot);

    // Twisted trunk (using segments)
    let prevY = 0.3;
    for (let i = 0; i < 5; i++) {
      const angle = i * 1.2;
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06 - i * 0.008, 0.08 - i * 0.008, 0.3, 6),
        trunkMat
      );
      seg.position.set(Math.cos(angle) * i * 0.06, prevY + 0.15, Math.sin(angle) * i * 0.06);
      seg.rotation.z = Math.cos(angle) * 0.4;
      seg.rotation.x = Math.sin(angle) * 0.4;
      group.add(seg);
      prevY += 0.25;
    }

    // Foliage clusters
    const foliagePositions: [number, number, number, number][] = [
      [0.2, 1.5, 0, 0.5],
      [-0.3, 1.4, 0.2, 0.4],
      [0.1, 1.7, -0.2, 0.45],
      [-0.15, 1.6, -0.15, 0.35],
    ];
    foliagePositions.forEach(([x, y, z, r]) => {
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), leafMat);
      foliage.position.set(x, y, z);
      foliage.scale.set(1.2, 0.6, 1.2);
      group.add(foliage);
    });
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
// ENVIRONMENT GEOMETRIES V2 (Volcano, Sand Dune, Ice, Lava Rock, Cave)
// ============================================================

export function createEnvironmentGeometry2(
  THREE: typeof import("three"),
  type: "volcano" | "sanddune" | "ice" | "lavarock" | "cave",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "volcano") {
    const volcanoMat = new THREE.MeshStandardMaterial({ color: color || "#3a2a1a", roughness: 0.95 });
    const volcano = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.5, 16, 1, true), volcanoMat);
    volcano.position.y = 1.25;
    group.add(volcano);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 8, 16), volcanoMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 2.4;
    group.add(rim);

    const lavaMat = new THREE.MeshStandardMaterial({ color: "#ff4400", emissive: "#ff2200", emissiveIntensity: 1.5, roughness: 0.5 });
    const lava = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), lavaMat);
    lava.position.y = 2.3;
    lava.scale.set(1, 0.3, 1);
    group.add(lava);

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const flow = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.9, 0.15), lavaMat);
      flow.position.set(Math.cos(angle) * 0.8, 1.6, Math.sin(angle) * 0.8);
      flow.rotation.z = Math.cos(angle) * 0.3;
      group.add(flow);
    }
  } else if (type === "sanddune") {
    const sandMat = new THREE.MeshStandardMaterial({ color: color || "#e8c88a", roughness: 0.95 });
    const dunes: [number, number, number, number, number][] = [
      [0, 0, 0, 1.5, 0.6],
      [1.2, 0, 0.5, 1.0, 0.4],
      [-1.0, 0, -0.3, 1.2, 0.5],
    ];
    dunes.forEach(([x, y, z, r, h]) => {
      const dune = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), sandMat);
      dune.position.set(x, y, z);
      dune.scale.set(1, h, 1);
      group.add(dune);
    });
  } else if (type === "ice") {
    const iceMat = new THREE.MeshStandardMaterial({
      color: color || "#a8e0ff",
      roughness: 0.1,
      metalness: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const positions: [number, number, number, number][] = [
      [0, 0.8, 0, 0.5],
      [0.6, 0.5, 0.2, 0.4],
      [-0.5, 0.6, -0.3, 0.45],
      [0.3, 0.4, -0.6, 0.35],
    ];
    positions.forEach(([x, y, z, r]) => {
      const ice = new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), iceMat);
      ice.position.set(x, y, z);
      ice.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(ice);
    });
  } else if (type === "lavarock") {
    const rockMat = new THREE.MeshStandardMaterial({ color: "#2a1a1a", roughness: 0.95 });
    const lavaMat = new THREE.MeshStandardMaterial({ color: "#ff4400", emissive: "#ff2200", emissiveIntensity: 1.2, roughness: 0.6 });

    for (let i = 0; i < 5; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.2, 0), rockMat);
      rock.position.set((Math.random() - 0.5) * 1.5, 0.2, (Math.random() - 0.5) * 1.5);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(rock);
    }

    for (let i = 0; i < 4; i++) {
      const crack = new THREE.Mesh(new THREE.BoxGeometry(0.4 + Math.random() * 0.3, 0.05, 0.08), lavaMat);
      crack.position.set((Math.random() - 0.5) * 1.2, 0.08, (Math.random() - 0.5) * 1.2);
      crack.rotation.y = Math.random() * Math.PI;
      group.add(crack);
    }
  } else if (type === "cave") {
    const rockMat = new THREE.MeshStandardMaterial({ color: color || "#4a3a2a", roughness: 0.95 });

    const back = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2, 0.3), rockMat);
    back.position.set(0, 1, -0.6);
    group.add(back);

    const left = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2, 1.5), rockMat);
    left.position.set(-1.05, 1, 0);
    group.add(left);

    const right = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2, 1.5), rockMat);
    right.position.set(1.05, 1, 0);
    group.add(right);

    const top = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 1.5), rockMat);
    top.position.set(0, 2, 0);
    group.add(top);

    // Stalactites
    const stalMat = new THREE.MeshStandardMaterial({ color: "#3a2a1a", roughness: 0.9 });
    for (let i = 0; i < 4; i++) {
      const stal = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), stalMat);
      stal.position.set((Math.random() - 0.5) * 1.5, 1.7, (Math.random() - 0.5) * 1);
      stal.rotation.x = Math.PI;
      group.add(stal);
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
// SPACE GEOMETRIES (Planet, Satellite, Spaceship)
// ============================================================

export function createSpaceGeometry(
  THREE: typeof import("three"),
  type: "planet" | "satellite" | "spaceship",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "planet") {
    // Main planet sphere
    const planetMat = new THREE.MeshStandardMaterial({
      color: color || "#4a90d9",
      roughness: roughness ?? 0.7,
      metalness: metalness ?? 0.1,
    });
    const planet = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), planetMat);
    group.add(planet);

    // Rings (Saturn-like)
    const ringMat = new THREE.MeshStandardMaterial({
      color: "#e8c88a",
      roughness: 0.6,
      metalness: 0.3,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.15, 8, 40), ringMat);
    ring1.rotation.x = Math.PI / 2.2;
    group.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.08, 8, 40), ringMat);
    ring2.rotation.x = Math.PI / 2.2;
    group.add(ring2);

    // Surface details (small dark spots)
    const spotMat = new THREE.MeshStandardMaterial({ color: "#2a4a6a", roughness: 0.9 });
    for (let i = 0; i < 12; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.1 + Math.random() * 0.08, 8, 6), spotMat);
      spot.position.set(
        Math.sin(phi) * Math.cos(theta) * 1,
        Math.cos(phi) * 1,
        Math.sin(phi) * Math.sin(theta) * 1
      );
      spot.scale.set(1, 1, 0.3);
      group.add(spot);
    }
  } else if (type === "satellite") {
    // Main body (cylinder)
    const bodyMat = new THREE.MeshStandardMaterial({ color: "#a0a0a0", roughness: 0.5, metalness: 0.8 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1, 12), bodyMat);
    group.add(body);

    // Solar panels (two boxes)
    const panelMat = new THREE.MeshStandardMaterial({ color: "#1a3a8a", roughness: 0.3, metalness: 0.9 });
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.6), panelMat);
      panel.position.set(side * 1.2, 0, 0);
      group.add(panel);

      // Panel grid lines
      for (let i = 0; i < 4; i++) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.6), new THREE.MeshStandardMaterial({ color: "#0a1a5a" }));
        line.position.set(side * (0.6 + i * 0.3), 0, 0);
        group.add(line);
      }
    }

    // Antenna dish
    const dishMat = new THREE.MeshStandardMaterial({ color: "#c0c0c0", roughness: 0.4, metalness: 0.9 });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), dishMat);
    dish.position.y = 0.8;
    dish.rotation.x = Math.PI;
    group.add(dish);

    // Antenna pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), bodyMat);
    pole.position.y = 0.65;
    group.add(pole);
  } else if (type === "spaceship") {
    // Main hull
    const hullMat = new THREE.MeshStandardMaterial({ color: "#d0d0d0", roughness: 0.3, metalness: 0.9 });
    const hull = new THREE.Mesh(new THREE.ConeGeometry(0.6, 2.5, 12), hullMat);
    hull.rotation.z = Math.PI / 2;
    hull.position.x = 0.5;
    group.add(hull);

    // Cockpit
    const cockpitMat = new THREE.MeshStandardMaterial({
      color: "#00aaff",
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.7,
      emissive: "#0088ff",
      emissiveIntensity: 0.3,
    });
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), cockpitMat);
    cockpit.position.set(0.3, 0.4, 0);
    cockpit.scale.set(1, 0.6, 1);
    group.add(cockpit);

    // Wings
    const wingMat = new THREE.MeshStandardMaterial({ color: "#a0a0a0", roughness: 0.4, metalness: 0.9 });
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 1.5), wingMat);
      wing.position.set(-0.3, 0, side * 0.9);
      wing.rotation.z = side * 0.2;
      group.add(wing);
    }

    // Engine glow (at back)
    const engineMat = new THREE.MeshStandardMaterial({ color: "#00ccff", emissive: "#00aaff", emissiveIntensity: 2, roughness: 0.3 });
    const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.3, 12), engineMat);
    engine.rotation.z = Math.PI / 2;
    engine.position.x = -0.9;
    group.add(engine);
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
// BUILDING GEOMETRIES (Skyscraper, Castle)
// ============================================================

export function createBuildingGeometry(
  THREE: typeof import("three"),
  type: "skyscraper" | "castle",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "skyscraper") {
    const glassMat = new THREE.MeshStandardMaterial({
      color: color || "#4a90d9",
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.6, metalness: 0.9 });

    // Main tower (stacked boxes with decreasing size)
    const heights = [4, 3, 2.5, 2, 1.5];
    let currentY = 0;
    heights.forEach((h, i) => {
      const w = 1.5 - i * 0.15;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), glassMat);
      tower.position.y = currentY + h / 2;
      group.add(tower);

      // Floor lines
      const line = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, 0.05, w + 0.05), frameMat);
      line.position.y = currentY + h / 2;
      group.add(line);

      currentY += h;
    });

    // Antenna on top
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6), frameMat);
    antenna.position.y = currentY + 0.75;
    group.add(antenna);

    // Red light on top
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: "#ff0000", emissive: "#ff0000", emissiveIntensity: 2 }));
    light.position.y = currentY + 1.5;
    group.add(light);

    // Windows (small glowing squares)
    const windowMat = new THREE.MeshStandardMaterial({ color: "#ffff88", emissive: "#ffff44", emissiveIntensity: 0.8, roughness: 0.3 });
    for (let floor = 0; floor < 15; floor++) {
      for (let side = 0; side < 4; side++) {
        if (Math.random() > 0.7) continue;
        const angle = (side / 4) * Math.PI * 2;
        const window = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.02), windowMat);
        const r = 0.75;
        window.position.set(
          Math.cos(angle) * r,
          0.4 + floor * 0.4,
          Math.sin(angle) * r
        );
        window.rotation.y = -angle + Math.PI / 2;
        group.add(window);
      }
    }
  } else if (type === "castle") {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: color || "#a0a0a0",
      roughness: 0.9,
      metalness: 0.1,
    });
    const roofMat = new THREE.MeshStandardMaterial({ color: "#8b0000", roughness: 0.7 });

    // Main keep
    const keep = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 2), stoneMat);
    keep.position.y = 1.25;
    group.add(keep);

    // Keep roof (cone)
    const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.5, 4), roofMat);
    keepRoof.position.y = 3.25;
    keepRoof.rotation.y = Math.PI / 4;
    group.add(keepRoof);

    // 4 corner towers
    const towerPositions: [number, number][] = [
      [-1.2, -1.2],
      [-1.2, 1.2],
      [1.2, -1.2],
      [1.2, 1.2],
    ];
    towerPositions.forEach(([x, z]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 3, 8), stoneMat);
      tower.position.set(x, 1.5, z);
      group.add(tower);

      const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 8), roofMat);
      towerRoof.position.set(x, 3.4, z);
      group.add(towerRoof);

      // Battlement details on top of tower
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.15), stoneMat);
        merlon.position.set(x + Math.cos(angle) * 0.3, 3.05, z + Math.sin(angle) * 0.3);
        group.add(merlon);
      }
    });

    // Gate (dark opening)
    const gateMat = new THREE.MeshStandardMaterial({ color: "#3a2a1a", roughness: 0.9 });
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.1), gateMat);
    gate.position.set(0, 0.6, 1.01);
    group.add(gate);

    // Windows on keep
    const windowMat = new THREE.MeshStandardMaterial({ color: "#ffdd44", emissive: "#ffaa00", emissiveIntensity: 0.6 });
    for (let i = 0; i < 3; i++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.05), windowMat);
      win.position.set(-0.5 + i * 0.5, 1.8, 1.01);
      group.add(win);
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
// LUXURY CAR GEOMETRIES (Lamborghini, Ferrari, Tesla)
// ============================================================

export function createLuxuryCarGeometry(
  THREE: typeof import("three"),
  type: "lamborghini" | "ferrari" | "tesla",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: color || (type === "lamborghini" ? "#ffcc00" : type === "ferrari" ? "#cc0000" : "#202020"),
    metalness: metalness ?? 0.9,
    roughness: roughness ?? 0.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: "#88ccff", metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.7,
  });
  const wheelMat = new THREE.MeshStandardMaterial({ color: "#171717", metalness: 0.3, roughness: 0.7 });
  const rimMat = new THREE.MeshStandardMaterial({ color: "#d0d0d0", metalness: 1, roughness: 0.1 });

  if (type === "lamborghini") {
    // Low angular body
    const lower = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 1.8), bodyMat);
    lower.position.y = 0.5;
    group.add(lower);

    // Angular cabin (slightly tilted)
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 1.5), bodyMat);
    cabin.position.set(-0.1, 1.0, 0);
    cabin.rotation.z = 0.08;
    group.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.35, 1.4), glassMat);
    windshield.position.set(0.5, 1.05, 0);
    windshield.rotation.z = -0.3;
    group.add(windshield);

    // Nose wedge
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 1.7), bodyMat);
    nose.position.set(2.0, 0.5, 0);
    nose.rotation.z = -0.2;
    group.add(nose);

    // Spoiler
    const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 1.9), bodyMat);
    spoiler.position.set(-2.0, 1.2, 0);
    group.add(spoiler);

    // Rear wing supports
    for (const side of [-0.7, 0.7]) {
      const support = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), bodyMat);
      support.position.set(-2.0, 1.0, side);
      group.add(support);
    }
  } else if (type === "ferrari") {
    // Rounded body
    const lower = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.55, 1.9), bodyMat);
    lower.position.y = 0.55;
    group.add(lower);

    // Rounded cabin
    const cabin = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat);
    cabin.position.set(-0.2, 1.0, 0);
    cabin.scale.set(1.2, 0.6, 1);
    group.add(cabin);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 1.5), glassMat);
    windshield.position.set(0.6, 1.0, 0);
    windshield.rotation.z = -0.3;
    group.add(windshield);

    // Long hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 1.7), bodyMat);
    hood.position.set(1.3, 0.65, 0);
    hood.rotation.z = -0.08;
    group.add(hood);
  } else {
    // Tesla — sleek modern design
    const lower = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.55, 1.9), bodyMat);
    lower.position.y = 0.55;
    group.add(lower);

    // Smooth cabin (sphere-based)
    const cabin = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat);
    cabin.position.set(-0.2, 1.0, 0);
    cabin.scale.set(1.5, 0.55, 1);
    group.add(cabin);

    // Long smooth windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), glassMat);
    windshield.position.set(0.4, 1.05, 0);
    windshield.rotation.z = -0.2;
    group.add(windshield);

    // Tesla logo area (small dark triangle)
    const logoMat = new THREE.MeshStandardMaterial({ color: "#101010", roughness: 0.3 });
    const logo = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.05, 3), logoMat);
    logo.position.set(2.2, 0.65, 0);
    logo.rotation.x = -Math.PI / 2;
    group.add(logo);
  }

  // Common wheels for all car types
  const wheelRadius = 0.5;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.35, 24);
  const rimGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.37, 12);
  const wheelPositions: [number, number][] = [
    [-1.4, 0.95],
    [-1.4, -0.95],
    [1.4, 0.95],
    [1.4, -0.95],
  ];
  wheelPositions.forEach(([x, z]) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, wheelRadius, z);
    group.add(wheel);

    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, wheelRadius, z);
    group.add(rim);
  });

  // Headlights (common)
  const headlightMat = new THREE.MeshStandardMaterial({
    color: "#ffffff", emissive: "#ffffaa", emissiveIntensity: 0.8, roughness: 0.3,
  });
  for (const side of [-0.6, 0.6]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.35), headlightMat);
    light.position.set(2.15, 0.65, side);
    group.add(light);
  }

  // Taillights
  const tailMat = new THREE.MeshStandardMaterial({ color: "#ff0000", emissive: "#ff0000", emissiveIntensity: 0.6 });
  for (const side of [-0.6, 0.6]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.4), tailMat);
    light.position.set(-2.15, 0.7, side);
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

// ============================================================
// AIRCRAFT GEOMETRIES (Airplane, Helicopter)
// ============================================================

export function createAircraftGeometry(
  THREE: typeof import("three"),
  type: "airplane" | "helicopter",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: color || "#e8e8e8",
    metalness: metalness ?? 0.7,
    roughness: roughness ?? 0.3,
  });
  const windowMat = new THREE.MeshStandardMaterial({
    color: "#88ccff", metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.7,
  });

  if (type === "airplane") {
    // Fuselage (main body)
    const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 5, 16), bodyMat);
    fuselage.rotation.z = Math.PI / 2;
    fuselage.position.y = 0.5;
    group.add(fuselage);

    // Nose (cone)
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1, 16), bodyMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(3, 0.5, 0);
    group.add(nose);

    // Tail fin (vertical stabilizer)
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.9), bodyMat);
    tailFin.position.set(-2.3, 1.1, 0);
    group.add(tailFin);

    // Horizontal stabilizers
    const hStab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.4), bodyMat);
    hStab.position.set(-2.3, 0.5, 0);
    group.add(hStab);

    // Main wings
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 6), bodyMat);
    wing.position.set(0.2, 0.5, 0);
    group.add(wing);

    // Wing engines (2)
    for (const side of [-2, 2]) {
      const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.8, 12), bodyMat);
      engine.rotation.x = Math.PI / 2;
      engine.position.set(0.2, 0.5, side);
      group.add(engine);
    }

    // Windows (row of small squares along fuselage)
    for (let i = 0; i < 10; i++) {
      for (const side of [-1, 1]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.02), windowMat);
        win.position.set(-1.5 + i * 0.4, 0.6, side * 0.4);
        group.add(win);
      }
    }

    // Cockpit window
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), windowMat);
    cockpit.position.set(2.5, 0.6, 0);
    cockpit.rotation.x = Math.PI / 2;
    group.add(cockpit);
  } else if (type === "helicopter") {
    // Main body (rounded)
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), bodyMat);
    body.position.y = 1;
    body.scale.set(1.5, 0.8, 1);
    group.add(body);

    // Tail boom
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 2.5, 10), bodyMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-1.8, 1.1, 0);
    group.add(tail);

    // Tail rotor
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.8, 0.08), bodyMat);
    tailRotor.position.set(-3, 1.1, 0);
    group.add(tailRotor);

    // Main rotor mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8), bodyMat);
    mast.position.y = 1.8;
    group.add(mast);

    // Main rotor blades (2 crossed)
    const blade1 = new THREE.Mesh(new THREE.BoxGeometry(4, 0.03, 0.2), bodyMat);
    blade1.position.y = 2;
    group.add(blade1);

    const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 4), bodyMat);
    blade2.position.y = 2;
    group.add(blade2);

    // Skids (landing gear)
    for (const side of [-0.5, 0.5]) {
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 8), bodyMat);
      skid.rotation.z = Math.PI / 2;
      skid.position.set(0, 0.2, side);
      group.add(skid);

      // Supports
      for (const x of [-0.5, 0.5]) {
        const support = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), bodyMat);
        support.position.set(x, 0.45, side);
        group.add(support);
      }
    }

    // Cockpit glass
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), windowMat);
    cockpit.position.set(0.7, 1, 0);
    cockpit.rotation.z = Math.PI / 2;
    cockpit.scale.set(1, 1, 0.8);
    group.add(cockpit);
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
// BOAT GEOMETRIES (Boat, Yacht)
// ============================================================

export function createBoatGeometry(
  THREE: typeof import("three"),
  type: "boat" | "yacht",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({
    color: color || "#ffffff",
    metalness: metalness ?? 0.3,
    roughness: roughness ?? 0.5,
  });
  const deckMat = new THREE.MeshStandardMaterial({ color: "#d4a373", roughness: 0.8 });
  const windowMat = new THREE.MeshStandardMaterial({ color: "#88ccff", metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.7 });

  if (type === "boat") {
    // Simple hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(3, 0.6, 1.2), hullMat);
    hull.position.y = 0.3;
    group.add(hull);

    // Bow (angled front)
    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1, 4), hullMat);
    bow.rotation.x = -Math.PI / 2;
    bow.rotation.y = Math.PI / 4;
    bow.position.set(1.7, 0.3, 0);
    group.add(bow);

    // Deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.05, 1.1), deckMat);
    deck.position.y = 0.62;
    group.add(deck);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 0.8), hullMat);
    cabin.position.set(-0.3, 0.9, 0);
    group.add(cabin);

    // Cabin windows
    for (let i = 0; i < 3; i++) {
      for (const side of [-1, 1]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.02), windowMat);
        win.position.set(-0.6 + i * 0.3, 0.95, side * 0.41);
        group.add(win);
      }
    }

    // Mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8), new THREE.MeshStandardMaterial({ color: "#3a2a1a" }));
    mast.position.set(0.5, 1.4, 0);
    group.add(mast);

    // Sail
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), new THREE.MeshStandardMaterial({ color: "#f0f0f0", side: THREE.DoubleSide, roughness: 0.9 }));
    sail.position.set(0.9, 1.5, 0);
    sail.rotation.y = Math.PI / 2;
    group.add(sail);
  } else if (type === "yacht") {
    // Luxury yacht hull (long, streamlined)
    const hull = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 1.6), hullMat);
    hull.position.y = 0.4;
    group.add(hull);

    // Pointed bow
    const bow = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 6), hullMat);
    bow.rotation.z = -Math.PI / 2;
    bow.position.set(3.5, 0.4, 0);
    group.add(bow);

    // Lower deck
    const deck1 = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.05, 1.5), deckMat);
    deck1.position.y = 0.82;
    group.add(deck1);

    // Main cabin (multi-level)
    const cabin1 = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.7, 1.3), hullMat);
    cabin1.position.set(-0.5, 1.2, 0);
    group.add(cabin1);

    // Upper cabin
    const cabin2 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 1.1), hullMat);
    cabin2.position.set(-0.8, 1.8, 0);
    group.add(cabin2);

    // Windows on both cabins
    for (let i = 0; i < 6; i++) {
      for (const side of [-1, 1]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.02), windowMat);
        win.position.set(-1.8 + i * 0.55, 1.2, side * 0.66);
        group.add(win);
      }
    }
    for (let i = 0; i < 4; i++) {
      for (const side of [-1, 1]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.02), windowMat);
        win.position.set(-1.5 + i * 0.55, 1.85, side * 0.56);
        group.add(win);
      }
    }

    // Radar mast
    const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), new THREE.MeshStandardMaterial({ color: "#c0c0c0", metalness: 0.9, roughness: 0.2 }));
    radarMast.position.set(-0.8, 2.3, 0);
    group.add(radarMast);

    // Radar dish
    const radar = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: "#e0e0e0", metalness: 0.9, roughness: 0.2 }));
    radar.position.set(-0.8, 2.65, 0);
    radar.rotation.x = Math.PI;
    group.add(radar);
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
// ANIMAL GEOMETRIES (Tiger, Elephant)
// ============================================================

export function createAnimalGeometry(
  THREE: typeof import("three"),
  type: "tiger" | "elephant",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "tiger") {
    const orangeMat = new THREE.MeshStandardMaterial({ color: color || "#ff8800", roughness: 0.8 });
    const blackMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.8 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 0.8 });

    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), orangeMat);
    body.position.y = 0.9;
    body.scale.set(1.8, 0.9, 0.9);
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), orangeMat);
    head.position.set(1.5, 1.1, 0);
    group.add(head);

    // Ears
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.2, 6), orangeMat);
      ear.position.set(1.4, 1.55, side * 0.35);
      group.add(ear);
    }

    // Eyes
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), blackMat);
      eye.position.set(1.8, 1.2, side * 0.2);
      group.add(eye);
    }

    // Snout
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), whiteMat);
    snout.position.set(1.85, 1.0, 0);
    snout.scale.set(0.8, 0.7, 1);
    group.add(snout);

    // Black stripes on body
    for (let i = 0; i < 5; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.02), blackMat);
      stripe.position.set(-0.6 + i * 0.4, 1.05, 0.78);
      stripe.rotation.z = 0.2;
      group.add(stripe);
    }

    // 4 legs
    const legPositions: [number, number][] = [
      [1.0, 0.3], [1.0, -0.3], [-1.0, 0.3], [-1.0, -0.3],
    ];
    legPositions.forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.9, 8), orangeMat);
      leg.position.set(x, 0.45, z);
      group.add(leg);
    });

    // Tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1, 6), orangeMat);
    tail.position.set(-1.5, 1.3, 0);
    tail.rotation.z = -0.4;
    group.add(tail);

    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), blackMat);
    tailTip.position.set(-1.9, 1.7, 0);
    group.add(tailTip);
  } else if (type === "elephant") {
    const grayMat = new THREE.MeshStandardMaterial({ color: color || "#808080", roughness: 0.9 });

    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), grayMat);
    body.position.y = 1.2;
    body.scale.set(1.6, 1, 1);
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), grayMat);
    head.position.set(1.7, 1.4, 0);
    group.add(head);

    // Trunk
    let prevY = 1.3;
    let prevX = 2.2;
    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.15 - i * 0.015, 0.18 - i * 0.015, 0.3, 8), grayMat);
      seg.position.set(prevX + 0.05, prevY - 0.15, 0);
      seg.rotation.z = -0.15;
      group.add(seg);
      prevY -= 0.28;
      prevX += 0.05;
    }

    // Ears (large)
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 10), grayMat);
      ear.position.set(1.5, 1.5, side * 0.7);
      ear.scale.set(0.3, 1, 0.8);
      group.add(ear);
    }

    // Eyes
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshStandardMaterial({ color: "#1a1a1a" }));
      eye.position.set(2.2, 1.55, side * 0.3);
      group.add(eye);
    }

    // Tusks
    for (const side of [-1, 1]) {
      const tusk = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.6, 8), new THREE.MeshStandardMaterial({ color: "#f5f0e0", roughness: 0.3 }));
      tusk.position.set(2.3, 0.9, side * 0.35);
      tusk.rotation.z = -0.4;
      tusk.rotation.x = side * 0.2;
      group.add(tusk);
    }

    // 4 thick legs
    const legPositions: [number, number][] = [
      [1.0, 0.5], [1.0, -0.5], [-1.0, 0.5], [-1.0, -0.5],
    ];
    legPositions.forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1, 10), grayMat);
      leg.position.set(x, 0.5, z);
      group.add(leg);
    });

    // Tail
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.03, 0.8, 6), grayMat);
    tail.position.set(-1.7, 1.3, 0);
    tail.rotation.z = 0.3;
    group.add(tail);
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
// ROBOT and DRAGON GEOMETRIES
// ============================================================

export function createCharacterGeometry(
  THREE: typeof import("three"),
  type: "dragon" | "robot",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "dragon") {
    const scaleMat = new THREE.MeshStandardMaterial({ color: color || "#2a8a4a", roughness: 0.7, metalness: 0.2 });
    const wingMat = new THREE.MeshStandardMaterial({ color: "#1a5a3a", roughness: 0.8, side: THREE.DoubleSide });
    const eyeMat = new THREE.MeshStandardMaterial({ color: "#ff4400", emissive: "#ff2200", emissiveIntensity: 1.5 });

    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 12), scaleMat);
    body.position.y = 1.2;
    body.scale.set(1.8, 1, 1);
    group.add(body);

    // Neck (curved)
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.2, 10), scaleMat);
    neck.position.set(1.3, 1.7, 0);
    neck.rotation.z = -0.5;
    group.add(neck);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), scaleMat);
    head.position.set(2.0, 2.1, 0);
    head.scale.set(1.3, 0.9, 0.9);
    group.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.4), scaleMat);
    snout.position.set(2.4, 2.05, 0);
    group.add(snout);

    // Horns
    for (const side of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.4, 6), new THREE.MeshStandardMaterial({ color: "#3a2a1a" }));
      horn.position.set(1.9, 2.4, side * 0.2);
      horn.rotation.z = -0.3;
      group.add(horn);
    }

    // Glowing eyes
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), eyeMat);
      eye.position.set(2.2, 2.2, side * 0.2);
      group.add(eye);
    }

    // Wings
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.8, 1.2), wingMat);
      wing.position.set(0, 1.7, side * 0.8);
      wing.rotation.z = side * 0.5;
      group.add(wing);
    }

    // Spikes along back
    for (let i = 0; i < 6; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 4), new THREE.MeshStandardMaterial({ color: "#1a3a1a" }));
      spike.position.set(-0.5 + i * 0.35, 1.9, 0);
      group.add(spike);
    }

    // Tail
    let prevY = 1.2;
    let prevX = -1.5;
    for (let i = 0; i < 4; i++) {
      const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.15 - i * 0.03, 0.2 - i * 0.03, 0.4, 8), scaleMat);
      seg.position.set(prevX, prevY, 0);
      seg.rotation.z = Math.PI / 2 + 0.1;
      group.add(seg);
      prevX -= 0.35;
      prevY -= 0.08;
    }

    // 4 legs
    const legPositions: [number, number][] = [
      [1.0, 0.4], [1.0, -0.4], [-0.8, 0.4], [-0.8, -0.4],
    ];
    legPositions.forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.2, 8), scaleMat);
      leg.position.set(x, 0.6, z);
      group.add(leg);
    });
  } else if (type === "robot") {
    const metalMat = new THREE.MeshStandardMaterial({ color: color || "#a0a0a0", metalness: 0.9, roughness: 0.2 });
    const darkMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", metalness: 0.7, roughness: 0.4 });
    const glowMat = new THREE.MeshStandardMaterial({ color: "#00aaff", emissive: "#00aaff", emissiveIntensity: 1.5 });

    // Body (box)
    const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.7), metalMat);
    body.position.y = 1.5;
    group.add(body);

    // Head (cube)
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), metalMat);
    head.position.y = 2.7;
    group.add(head);

    // Eyes (glowing)
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), glowMat);
      eye.position.set(0, 2.75, side * 0.15);
      eye.scale.set(1, 1, 0.5);
      group.add(eye);
    }

    // Antenna on head
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), darkMat);
    antenna.position.y = 3.2;
    group.add(antenna);

    const antennaBall = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), glowMat);
    antennaBall.position.y = 3.4;
    group.add(antennaBall);

    // Arms (2)
    for (const side of [-1, 1]) {
      const upperArm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.3), metalMat);
      upperArm.position.set(side * 0.75, 1.9, 0);
      group.add(upperArm);

      const lowerArm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.6, 0.25), darkMat);
      lowerArm.position.set(side * 0.75, 1.2, 0);
      group.add(lowerArm);

      // Hand
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), metalMat);
      hand.position.set(side * 0.75, 0.85, 0);
      group.add(hand);
    }

    // Legs (2)
    for (const side of [-1, 1]) {
      const upperLeg = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.35), metalMat);
      upperLeg.position.set(side * 0.25, 0.4, 0);
      group.add(upperLeg);

      // Foot
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.6), darkMat);
      foot.position.set(side * 0.25, 0.08, 0.1);
      group.add(foot);
    }

    // Chest panel (glowing)
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.05), glowMat);
    chest.position.set(0, 1.6, 0.36);
    group.add(chest);
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
// SPACE GEOMETRIES V2 (Meteor, Comet, UFO)
// ============================================================

export function createSpaceGeometry2(
  THREE: typeof import("three"),
  type: "meteor" | "comet" | "ufo",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "meteor") {
    const rockMat = new THREE.MeshStandardMaterial({
      color: color || "#5a4a3a",
      roughness: roughness ?? 0.95,
      metalness: metalness ?? 0.1,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: "#ff4400",
      emissive: "#ff2200",
      emissiveIntensity: 2,
      roughness: 0.5,
    });

    // Main rock body
    const body = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), rockMat);
    body.position.y = 1;
    group.add(body);

    // Craters
    for (let i = 0; i < 6; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const crater = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshStandardMaterial({ color: "#3a2a1a", roughness: 0.95 }));
      crater.position.set(
        Math.sin(phi) * Math.cos(theta) * 0.7,
        1 + Math.cos(phi) * 0.7,
        Math.sin(phi) * Math.sin(theta) * 0.7
      );
      crater.scale.set(1, 1, 0.4);
      group.add(crater);
    }

    // Fire trail
    for (let i = 0; i < 8; i++) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3 - i * 0.03, 0.6, 6), glowMat);
      flame.position.set(-0.5 - i * 0.2, 1 - i * 0.05, 0);
      flame.rotation.z = Math.PI / 2;
      flame.scale.set(1, 1 - i * 0.1, 1);
      group.add(flame);
    }
  } else if (type === "comet") {
    const coreMat = new THREE.MeshStandardMaterial({
      color: color || "#ffffff",
      emissive: "#aaddff",
      emissiveIntensity: 1.5,
      roughness: 0.3,
    });
    const tailMat = new THREE.MeshStandardMaterial({
      color: "#88ccff",
      emissive: "#66aaff",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.7,
      roughness: 0.5,
    });

    // Core
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), coreMat);
    core.position.y = 1.5;
    group.add(core);

    // Tail (tapered cone)
    for (let i = 0; i < 12; i++) {
      const seg = new THREE.Mesh(new THREE.SphereGeometry(0.35 - i * 0.025, 12, 8), tailMat);
      seg.position.set(-0.6 - i * 0.25, 1.5 + i * 0.05, 0);
      seg.scale.set(1, 0.8, 0.8);
      group.add(seg);
    }
  } else if (type === "ufo") {
    const metalMat = new THREE.MeshStandardMaterial({
      color: color || "#a0a0a0",
      metalness: metalness ?? 0.9,
      roughness: roughness ?? 0.2,
    });
    const glowMat = new THREE.MeshStandardMaterial({
      color: "#00ff88",
      emissive: "#00ff88",
      emissiveIntensity: 2,
      roughness: 0.3,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: "#88ccff",
      metalness: 0.5,
      roughness: 0.1,
      transparent: true,
      opacity: 0.6,
    });

    // Main saucer
    const saucer = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 8, 0, Math.PI * 2, 0, Math.PI / 4), metalMat);
    saucer.position.y = 1;
    saucer.scale.set(1, 0.4, 1);
    group.add(saucer);

    // Dome (cockpit)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    dome.position.y = 1.2;
    dome.scale.set(1, 0.8, 1);
    group.add(dome);

    // Bottom rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.08, 8, 32), metalMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.85;
    group.add(rim);

    // Glowing lights around rim
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const light = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), glowMat);
      light.position.set(Math.cos(angle) * 1.15, 0.85, Math.sin(angle) * 1.15);
      group.add(light);
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
// STRUCTURE GEOMETRIES (Lighthouse, Windmill, Statue)
// ============================================================

export function createStructureGeometry(
  THREE: typeof import("three"),
  type: "lighthouse" | "windmill" | "statue",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "lighthouse") {
    const towerMat = new THREE.MeshStandardMaterial({
      color: color || "#ffffff",
      roughness: roughness ?? 0.7,
    });
    const redMat = new THREE.MeshStandardMaterial({ color: "#cc0000", roughness: 0.6 });
    const lightMat = new THREE.MeshStandardMaterial({
      color: "#ffff88",
      emissive: "#ffff44",
      emissiveIntensity: 2,
      roughness: 0.3,
    });

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 0.4, 12), new THREE.MeshStandardMaterial({ color: "#7a7a7a", roughness: 0.9 }));
    base.position.y = 0.2;
    group.add(base);

    // Tower (tapered with red stripes)
    for (let i = 0; i < 4; i++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7 - i * 0.1, 0.8 - i * 0.1, 0.8, 12),
        i % 2 === 0 ? towerMat : redMat
      );
      seg.position.y = 0.8 + i * 0.8;
      group.add(seg);
    }

    // Top platform
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12), new THREE.MeshStandardMaterial({ color: "#2a2a2a", metalness: 0.8, roughness: 0.3 }));
    platform.position.y = 4;
    group.add(platform);

    // Light room
    const lightRoom = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12), new THREE.MeshStandardMaterial({ color: "#88ccff", transparent: true, opacity: 0.7, roughness: 0.1 }));
    lightRoom.position.y = 4.35;
    group.add(lightRoom);

    // Glowing light inside
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), lightMat);
    light.position.y = 4.35;
    group.add(light);

    // Roof (cone)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.5, 12), redMat);
    roof.position.y = 4.85;
    group.add(roof);

    // Antenna
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), new THREE.MeshStandardMaterial({ color: "#2a2a2a" }));
    antenna.position.y = 5.3;
    group.add(antenna);
  } else if (type === "windmill") {
    const towerMat = new THREE.MeshStandardMaterial({
      color: color || "#d4a373",
      roughness: roughness ?? 0.8,
    });
    const bladeMat = new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 0.7 });

    // Base (tapered tower)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 3, 10), towerMat);
    base.position.y = 1.5;
    group.add(base);

    // Roof cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1, 0.8, 10), new THREE.MeshStandardMaterial({ color: "#8b4513", roughness: 0.8 }));
    cap.position.y = 3.4;
    group.add(cap);

    // Hub (center of blades)
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshStandardMaterial({ color: "#2a2a2a", metalness: 0.9, roughness: 0.2 }));
    hub.position.set(0, 3, 0.9);
    group.add(hub);

    // 4 blades
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 0.05), bladeMat);
      blade.position.set(
        Math.cos(angle) * 0.75,
        3 + Math.sin(angle) * 0.75,
        0.9
      );
      blade.rotation.z = angle;
      group.add(blade);
    }
  } else if (type === "statue") {
    const marbleMat = new THREE.MeshStandardMaterial({
      color: color || "#e8e8e8",
      roughness: roughness ?? 0.7,
      metalness: metalness ?? 0.1,
    });

    // Pedestal
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1, 0.4, 1), new THREE.MeshStandardMaterial({ color: "#7a7a7a", roughness: 0.9 }));
    pedestal.position.y = 0.2;
    group.add(pedestal);

    // Body (torso)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.2, 12), marbleMat);
    torso.position.y = 1.0;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), marbleMat);
    head.position.y = 1.85;
    group.add(head);

    // Arms (one raised)
    for (const [side, raise] of [[-1, 0.3], [1, 0.8]] as [number, number][]) {
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8), marbleMat);
      upperArm.position.set(side * 0.4, 1.3 + raise * 0.3, 0);
      upperArm.rotation.z = side * (raise > 0.5 ? -0.5 : 0.3);
      group.add(upperArm);

      const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.5, 8), marbleMat);
      lowerArm.position.set(side * (0.55 + raise * 0.3), 1.0 + raise * 0.8, 0);
      lowerArm.rotation.z = side * (raise > 0.5 ? -0.3 : 0.2);
      group.add(lowerArm);
    }

    // Legs
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.8, 10), marbleMat);
      leg.position.set(side * 0.15, 0.4, 0);
      group.add(leg);
    }

    // Wings (if angel-like statue)
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 0.6), marbleMat);
      wing.position.set(side * 0.5, 1.4, -0.2);
      wing.rotation.z = side * 0.4;
      group.add(wing);
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
// STRUCTURE GEOMETRIES V2 (Satellite Dish, Telescope, Fountain, Bridge2, Tower, Pyramid)
// ============================================================

export function createStructureGeometry2(
  THREE: typeof import("three"),
  type: "satellitedish" | "telescope" | "fountain" | "bridge2" | "tower" | "pyramid",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "satellitedish") {
    const metalMat = new THREE.MeshStandardMaterial({
      color: color || "#d0d0d0",
      metalness: metalness ?? 0.8,
      roughness: roughness ?? 0.3,
    });
    const baseMat = new THREE.MeshStandardMaterial({ color: "#5a5a5a", roughness: 0.8, metalness: 0.5 });

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.3, 12), baseMat);
    base.position.y = 0.15;
    group.add(base);

    // Pole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.5, 10), metalMat);
    pole.position.y = 1.05;
    group.add(pole);

    // Dish (half sphere)
    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3),
      metalMat
    );
    dish.position.y = 2.1;
    dish.rotation.x = Math.PI / 3;
    dish.scale.set(1, 0.6, 1);
    group.add(dish);

    // Antenna receiver
    const receiver = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: "#ffaa00", emissive: "#ff8800", emissiveIntensity: 0.5 }));
    receiver.position.set(0, 2.3, 0.4);
    group.add(receiver);

    // Support struts
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 6), metalMat);
      strut.position.set(Math.cos(angle) * 0.3, 2.3, Math.sin(angle) * 0.3);
      strut.rotation.z = Math.cos(angle) * 0.3;
      strut.rotation.x = Math.sin(angle) * 0.3;
      group.add(strut);
    }
  } else if (type === "telescope") {
    const metalMat = new THREE.MeshStandardMaterial({
      color: color || "#2a2a2a",
      metalness: metalness ?? 0.9,
      roughness: roughness ?? 0.2,
    });
    const tubeMat = new THREE.MeshStandardMaterial({ color: "#a0a0a0", metalness: 0.9, roughness: 0.2 });

    // Tripod base
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8), metalMat);
      leg.position.set(Math.cos(angle) * 0.6, 0.75, Math.sin(angle) * 0.6);
      leg.rotation.z = Math.cos(angle) * 0.4;
      leg.rotation.x = Math.sin(angle) * 0.4;
      group.add(leg);
    }

    // Main tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 2, 16), tubeMat);
    tube.position.set(0, 2, 0);
    tube.rotation.z = -0.5;
    group.add(tube);

    // Eyepiece
    const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.3, 10), metalMat);
    eyepiece.position.set(-0.7, 1.4, 0);
    eyepiece.rotation.z = -0.5;
    group.add(eyepiece);

    // Front lens (glass)
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16), new THREE.MeshStandardMaterial({ color: "#88ccff", transparent: true, opacity: 0.7, roughness: 0.1 }));
    lens.position.set(0.6, 2.5, 0);
    lens.rotation.z = -0.5;
    group.add(lens);
  } else if (type === "fountain") {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: color || "#d0d0d0",
      roughness: roughness ?? 0.9,
      metalness: metalness ?? 0.1,
    });
    const waterMat = new THREE.MeshStandardMaterial({
      color: "#4fc3f7",
      roughness: 0.1,
      metalness: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    // Base pool
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.7, 0.3, 24), stoneMat);
    base.position.y = 0.15;
    group.add(base);

    // Water in pool
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.32;
    group.add(water);

    // Center pillar
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1, 12), stoneMat);
    pillar.position.y = 0.8;
    group.add(pillar);

    // Upper basin
    const upperBasin = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.5, 0.2, 16), stoneMat);
    upperBasin.position.y = 1.3;
    group.add(upperBasin);

    // Upper water
    const upperWater = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), waterMat);
    upperWater.rotation.x = -Math.PI / 2;
    upperWater.position.y = 1.42;
    group.add(upperWater);

    // Top spout
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 10), stoneMat);
    spout.position.y = 1.6;
    group.add(spout);

    // Water spray (particles)
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), waterMat);
      drop.position.set(Math.cos(angle) * 0.5, 1.85, Math.sin(angle) * 0.5);
      group.add(drop);
    }
  } else if (type === "bridge2") {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: color || "#8a7a5a",
      roughness: roughness ?? 0.9,
      metalness: metalness ?? 0.1,
    });

    // Arch bridge
    const archGeo = new THREE.TorusGeometry(1.5, 0.2, 8, 24, Math.PI);
    const arch = new THREE.Mesh(archGeo, stoneMat);
    arch.position.y = 1.5;
    group.add(arch);

    // Road deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.2, 1.5), stoneMat);
    deck.position.y = 1.5;
    group.add(deck);

    // Side railings
    for (const side of [-0.75, 0.75]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.3, 0.1), stoneMat);
      rail.position.set(0, 1.75, side);
      group.add(rail);
    }
  } else if (type === "tower") {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: color || "#a0a0a0",
      roughness: roughness ?? 0.8,
      metalness: metalness ?? 0.2,
    });

    // Base (wider)
    const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.5, 2), stoneMat);
    base.position.y = 0.25;
    group.add(base);

    // Middle section
    const middle = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3, 1.5), stoneMat);
    middle.position.y = 2;
    group.add(middle);

    // Top section (narrower)
    const top = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), stoneMat);
    top.position.y = 4.5;
    group.add(top);

    // Crown (pyramid roof)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1, 4), new THREE.MeshStandardMaterial({ color: "#c0392b", roughness: 0.7 }));
    roof.position.y = 6;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Windows
    const windowMat = new THREE.MeshStandardMaterial({ color: "#ffdd44", emissive: "#ffaa00", emissiveIntensity: 0.6 });
    for (let floor = 0; floor < 4; floor++) {
      for (const side of [-0.76, 0.76]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.05), windowMat);
        win.position.set(side, 0.8 + floor * 0.7, 0);
        win.rotation.y = Math.PI / 2;
        group.add(win);
      }
    }
  } else if (type === "pyramid") {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: color || "#d4a373",
      roughness: roughness ?? 0.9,
      metalness: metalness ?? 0.1,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: "#ffd700",
      metalness: 1,
      roughness: 0.2,
      emissive: "#ffaa00",
      emissiveIntensity: 0.3,
    });

    // Main pyramid (square base, 4 sides)
    const pyramid = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.5, 4), stoneMat);
    pyramid.position.y = 1.25;
    pyramid.rotation.y = Math.PI / 4;
    group.add(pyramid);

    // Gold cap on top
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 4), goldMat);
    cap.position.y = 2.6;
    cap.rotation.y = Math.PI / 4;
    group.add(cap);

    // Entrance
    const entrance = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.9 }));
    entrance.position.set(0, 0.4, 1.3);
    group.add(entrance);
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
// ENVIRONMENT GEOMETRIES V3 (Volcano2, Glacier, Canyon, Oasis)
// ============================================================

export function createEnvironmentGeometry3(
  THREE: typeof import("three"),
  type: "volcano2" | "glacier" | "canyon" | "oasis",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "volcano2") {
    const rockMat = new THREE.MeshStandardMaterial({
      color: color || "#4a3a2a",
      roughness: roughness ?? 0.95,
      metalness: metalness ?? 0.05,
    });
    const lavaMat = new THREE.MeshStandardMaterial({
      color: "#ff4400",
      emissive: "#ff2200",
      emissiveIntensity: 2,
      roughness: 0.5,
    });

    // Main volcano (larger, more detailed)
    const volcano = new THREE.Mesh(new THREE.ConeGeometry(2, 3, 20, 3), rockMat);
    volcano.position.y = 1.5;
    group.add(volcano);

    // Crater rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.15, 8, 20), rockMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 3;
    group.add(rim);

    // Glowing lava lake
    const lavaLake = new THREE.Mesh(new THREE.CircleGeometry(0.55, 20), lavaMat);
    lavaLake.rotation.x = -Math.PI / 2;
    lavaLake.position.y = 2.95;
    group.add(lavaLake);

    // Lava flows (4 rivers down the sides)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const flow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.5, 0.2), lavaMat);
      flow.position.set(Math.cos(angle) * 1.2, 1.5, Math.sin(angle) * 1.2);
      flow.rotation.z = Math.cos(angle) * 0.3;
      flow.rotation.x = Math.sin(angle) * 0.3;
      group.add(flow);
    }

    // Smoke clouds
    const smokeMat = new THREE.MeshStandardMaterial({ color: "#3a3a3a", transparent: true, opacity: 0.6, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.5 + i * 0.2, 12, 8), smokeMat);
      smoke.position.set(0, 3.5 + i * 0.5, 0);
      group.add(smoke);
    }
  } else if (type === "glacier") {
    const iceMat = new THREE.MeshStandardMaterial({
      color: color || "#a8e0ff",
      roughness: roughness ?? 0.1,
      metalness: metalness ?? 0.2,
      transparent: true,
      opacity: 0.85,
    });

    // Large ice chunks
    const positions: [number, number, number, number][] = [
      [0, 1.2, 0, 1.2],
      [1.2, 0.8, 0.3, 0.9],
      [-1.0, 1.0, -0.4, 1.0],
      [0.5, 1.8, -0.3, 0.7],
      [-0.6, 1.5, 0.5, 0.8],
    ];
    positions.forEach(([x, y, z, r]) => {
      const ice = new THREE.Mesh(new THREE.OctahedronGeometry(r, 0), iceMat);
      ice.position.set(x, y, z);
      ice.rotation.set(Math.random() * 0.5, Math.random() * Math.PI, Math.random() * 0.5);
      group.add(ice);
    });

    // Snow base
    const snowMat = new THREE.MeshStandardMaterial({ color: "#f0f8ff", roughness: 0.9 });
    const snow = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), snowMat);
    snow.rotation.x = -Math.PI / 2;
    snow.position.y = 0.01;
    group.add(snow);
  } else if (type === "canyon") {
    const rockMat = new THREE.MeshStandardMaterial({
      color: color || "#c87a4a",
      roughness: roughness ?? 0.9,
      metalness: metalness ?? 0.1,
    });

    // Two canyon walls
    for (const side of [-1, 1]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.5, 5), rockMat);
      wall.position.set(side * 1.5, 1.25, 0);
      group.add(wall);

      // Layered rock stripes
      for (let i = 0; i < 4; i++) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.2, 5.05), new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? "#a85a3a" : "#d88a5a", roughness: 0.9 }));
        stripe.position.set(side * 1.5, 0.3 + i * 0.55, 0);
        group.add(stripe);
      }
    }

    // River at bottom
    const riverMat = new THREE.MeshStandardMaterial({ color: "#3a8ac8", roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.8 });
    const river = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 5), riverMat);
    river.position.y = 0.03;
    group.add(river);

    // Rocks in river
    for (let i = 0; i < 6; i++) {
      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.15, 0), rockMat);
      rock.position.set((Math.random() - 0.5) * 1.8, 0.15, (Math.random() - 0.5) * 4.5);
      group.add(rock);
    }
  } else if (type === "oasis") {
    // Sand base
    const sandMat = new THREE.MeshStandardMaterial({ color: "#e8c88a", roughness: 0.95 });
    const sand = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), sandMat);
    sand.rotation.x = -Math.PI / 2;
    sand.position.y = 0.01;
    group.add(sand);

    // Water pond
    const waterMat = new THREE.MeshStandardMaterial({ color: "#29b6f6", roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.85 });
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 20), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.05;
    group.add(water);

    // Palm trees around pond
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#6b4423", roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.8 });
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const x = Math.cos(angle) * 1.5;
      const z = Math.sin(angle) * 1.5;

      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 1.5, 8), trunkMat);
      trunk.position.set(x, 0.75, z);
      group.add(trunk);

      const crown = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), leafMat);
      crown.position.set(x, 1.6, z);
      crown.scale.set(1.3, 0.5, 1.3);
      group.add(crown);
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
// MONUMENT GEOMETRIES (Totem, Obelisk)
// ============================================================

export function createMonumentGeometry(
  THREE: typeof import("three"),
  type: "totem" | "obelisk",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "totem") {
    const woodMat = new THREE.MeshStandardMaterial({
      color: color || "#8b4513",
      roughness: roughness ?? 0.9,
      metalness: metalness ?? 0.05,
    });
    const paintColors = ["#e63946", "#f4a261", "#2a9d8f", "#e9c46a", "#264653"];

    // 4 stacked totem heads
    for (let i = 0; i < 4; i++) {
      const headMat = new THREE.MeshStandardMaterial({ color: paintColors[i % paintColors.length], roughness: 0.7 });
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.5), woodMat);
      head.position.y = 0.5 + i * 0.75;
      group.add(head);

      // Painted face details
      // Eyes
      for (const side of [-0.15, 0.15]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), headMat);
        eye.position.set(side, 0.5 + i * 0.75 + 0.15, 0.26);
        group.add(eye);
      }

      // Beak/nose
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 4), headMat);
      beak.position.set(0, 0.5 + i * 0.75, 0.3);
      beak.rotation.x = Math.PI / 2;
      group.add(beak);

      // Wings (on sides)
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.4), headMat);
        wing.position.set(side * 0.35, 0.5 + i * 0.75, 0);
        wing.rotation.z = side * 0.2;
        group.add(wing);
      }
    }

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.7), woodMat);
    base.position.y = 0.15;
    group.add(base);
  } else if (type === "obelisk") {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: color || "#d4c4a4",
      roughness: roughness ?? 0.7,
      metalness: metalness ?? 0.1,
    });
    const goldMat = new THREE.MeshStandardMaterial({ color: "#ffd700", metalness: 1, roughness: 0.2 });

    // Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1, 0.3, 1), stoneMat);
    base.position.y = 0.15;
    group.add(base);

    // Obelisk body (tapered)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.35, 4, 4), stoneMat);
    body.position.y = 2.3;
    body.rotation.y = Math.PI / 4;
    group.add(body);

    // Pyramid top (gold)
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 4), goldMat);
    top.position.y = 4.6;
    top.rotation.y = Math.PI / 4;
    group.add(top);

    // Hieroglyphic carvings (dark boxes)
    for (let i = 0; i < 5; i++) {
      const carving = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.02), new THREE.MeshStandardMaterial({ color: "#5a4a3a" }));
      carving.position.set(0, 0.8 + i * 0.6, 0.25);
      group.add(carving);
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
// BUILDING GEOMETRIES V2 (Castle2, Temple, Colosseum, Stadium)
// ============================================================

export function createBuildingGeometry2(
  THREE: typeof import("three"),
  type: "castle2" | "temple" | "colosseum" | "stadium",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "castle2") {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: color || "#8a8a8a",
      roughness: roughness ?? 0.9,
      metalness: metalness ?? 0.1,
    });
    const roofMat = new THREE.MeshStandardMaterial({ color: "#8b0000", roughness: 0.7 });

    // Central keep
    const keep = new THREE.Mesh(new THREE.BoxGeometry(2, 2.5, 2), stoneMat);
    keep.position.y = 1.25;
    group.add(keep);

    // Central roof
    const keepRoof = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.5, 4), roofMat);
    keepRoof.position.y = 3.25;
    keepRoof.rotation.y = Math.PI / 4;
    group.add(keepRoof);

    // 4 corner towers (taller)
    const towerPositions: [number, number][] = [
      [-1.2, -1.2], [-1.2, 1.2], [1.2, -1.2], [1.2, 1.2],
    ];
    towerPositions.forEach(([x, z]) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 3.5, 8), stoneMat);
      tower.position.set(x, 1.75, z);
      group.add(tower);

      const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.7, 8), roofMat);
      towerRoof.position.set(x, 3.85, z);
      group.add(towerRoof);
    });

    // Front gate
    const gateMat = new THREE.MeshStandardMaterial({ color: "#3a2a1a", roughness: 0.9 });
    const gate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.1), gateMat);
    gate.position.set(0, 0.6, 1.01);
    group.add(gate);

    // Battlements on keep
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.2), stoneMat);
      merlon.position.set(Math.cos(angle) * 0.8, 2.65, Math.sin(angle) * 0.8);
      group.add(merlon);
    }
  } else if (type === "temple") {
    const marbleMat = new THREE.MeshStandardMaterial({
      color: color || "#f0e8d8",
      roughness: roughness ?? 0.5,
      metalness: metalness ?? 0.1,
    });
    const roofMat = new THREE.MeshStandardMaterial({ color: "#d4a373", roughness: 0.7 });

    // Base platform
    const base = new THREE.Mesh(new THREE.BoxGeometry(3, 0.3, 2), marbleMat);
    base.position.y = 0.15;
    group.add(base);

    // Steps
    for (let i = 0; i < 3; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(3 - i * 0.2, 0.15, 0.4), marbleMat);
      step.position.set(0, 0.3 + i * 0.15, 1.2 - i * 0.2);
      group.add(step);
    }

    // 6 columns
    for (let i = 0; i < 6; i++) {
      const x = -1.2 + i * 0.5;
      for (const z of [-0.7, 0.7]) {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 2.5, 12), marbleMat);
        column.position.set(x, 1.6, z);
        group.add(column);

        // Column capital
        const capital = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 0.4), marbleMat);
        capital.position.set(x, 2.9, z);
        group.add(capital);
      }
    }

    // Roof (triangular prism)
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1, 4), roofMat);
    roof.position.y = 3.5;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.2, 0.8, 1);
    group.add(roof);
  } else if (type === "colosseum") {
    const stoneMat = new THREE.MeshStandardMaterial({
      color: color || "#c8b8a0",
      roughness: roughness ?? 0.9,
      metalness: metalness ?? 0.1,
    });

    // Main circular wall (3 tiers)
    for (let tier = 0; tier < 3; tier++) {
      const radius = 2 - tier * 0.15;
      const wall = new THREE.Mesh(
        new THREE.CylinderGeometry(radius, radius, 1, 24, 1, true),
        stoneMat
      );
      wall.position.y = 0.5 + tier * 1;
      group.add(wall);

      // Arch openings (dark boxes around)
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const arch = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: "#4a3a2a", roughness: 0.9 }));
        arch.position.set(Math.cos(angle) * radius, 0.5 + tier * 1, Math.sin(angle) * radius);
        arch.rotation.y = -angle + Math.PI / 2;
        group.add(arch);
      }
    }

    // Arena floor
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), new THREE.MeshStandardMaterial({ color: "#e8c88a", roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.05;
    group.add(floor);
  } else if (type === "stadium") {
    const metalMat = new THREE.MeshStandardMaterial({
      color: color || "#4a90d9",
      roughness: roughness ?? 0.6,
      metalness: metalness ?? 0.3,
    });
    const fieldMat = new THREE.MeshStandardMaterial({ color: "#2d7a2d", roughness: 0.9 });

    // Field
    const field = new THREE.Mesh(new THREE.CircleGeometry(1.5, 24), fieldMat);
    field.rotation.x = -Math.PI / 2;
    field.position.y = 0.05;
    group.add(field);

    // Stadium seating (ring around field)
    for (let i = 0; i < 3; i++) {
      const radius = 1.6 + i * 0.3;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.2, 8, 24),
        metalMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.2 + i * 0.3;
      group.add(ring);
    }

    // Stadium lights (4 corners)
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 8), new THREE.MeshStandardMaterial({ color: "#2a2a2a" }));
      pole.position.set(Math.cos(angle) * 2.2, 1.5, Math.sin(angle) * 2.2);
      group.add(pole);

      const light = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshStandardMaterial({ color: "#ffff88", emissive: "#ffff44", emissiveIntensity: 1.5 }));
      light.position.set(Math.cos(angle) * 2.2, 3.1, Math.sin(angle) * 2.2);
      group.add(light);
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
// STRUCTURE GEOMETRIES V3 (Lighthouse2, Windmill2)
// ============================================================

export function createStructureGeometry3(
  THREE: typeof import("three"),
  type: "lighthouse2" | "windmill2",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "lighthouse2") {
    const towerMat = new THREE.MeshStandardMaterial({
      color: color || "#ffffff",
      roughness: roughness ?? 0.7,
    });
    const redMat = new THREE.MeshStandardMaterial({ color: "#cc0000", roughness: 0.6 });
    const lightMat = new THREE.MeshStandardMaterial({
      color: "#ffff88",
      emissive: "#ffff44",
      emissiveIntensity: 3,
      roughness: 0.2,
    });

    // Tall tapered tower
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.7 - i * 0.07, 0.75 - i * 0.07, 0.8, 12),
        i % 2 === 0 ? towerMat : redMat
      );
      seg.position.y = 0.8 + i * 0.8;
      group.add(seg);
    }

    // Light room at top
    const lightRoom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.6, 12),
      new THREE.MeshStandardMaterial({ color: "#88ccff", transparent: true, opacity: 0.6, roughness: 0.1 })
    );
    lightRoom.position.y = 5.3;
    group.add(lightRoom);

    // Glowing light
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), lightMat);
    light.position.y = 5.3;
    group.add(light);

    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.5, 12), redMat);
    roof.position.y = 5.85;
    group.add(roof);

    // Rotating lighthouse beam pivot
    const beaconPivot = new THREE.Group();
    beaconPivot.position.set(0, 5.3, 0);
    beaconPivot.userData.beacon = true;

    const beamMat = new THREE.MeshStandardMaterial({
      color: "#ffff66",
      emissive: "#ffff22",
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.38, 2, 16, 1, true),
      beamMat
    );
    beam.rotation.x = Math.PI / 2;
    beam.position.z = 1;
    beaconPivot.add(beam);

    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 6),
      lightMat
    );
    beacon.position.y = 0.9;
    beaconPivot.add(beacon);
    group.add(beaconPivot);
  } else if (type === "windmill2") {
    const towerMat = new THREE.MeshStandardMaterial({
      color: color || "#d4a373",
      roughness: roughness ?? 0.8,
    });
    const bladeMat = new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 0.7 });
    const hubMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", metalness: 0.9, roughness: 0.2 });

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 0.3, 12), new THREE.MeshStandardMaterial({ color: "#8a7a6a", roughness: 0.9 }));
    base.position.y = 0.15;
    group.add(base);

    // Tall tower (tapered)
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.1, 4, 12), towerMat);
    tower.position.y = 2.3;
    group.add(tower);

    // Roof cap
    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.8, 12), new THREE.MeshStandardMaterial({ color: "#8b4513", roughness: 0.8 }));
    cap.position.y = 4.7;
    group.add(cap);

    // Hub
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), hubMat);
    hub.position.set(0, 4, 1);
    group.add(hub);

    // Rotating blade group centered on the hub
    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(0, 4, 1);
    bladeGroup.userData.windmillBlades = true;

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 2.2, 0.05),
        bladeMat
      );
      blade.position.set(
        Math.cos(angle) * 1.1,
        Math.sin(angle) * 1.1,
        0
      );
      blade.rotation.z = angle;
      bladeGroup.add(blade);
    }

    group.add(bladeGroup);

    // Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.5, 0.05), new THREE.MeshStandardMaterial({ color: "#3a2a1a" }));
    door.position.set(0, 0.4, 1.05);
    group.add(door);
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
// BUILDING GEOMETRIES V3 (Airport, Train Station, Skyscraper2)
// ============================================================

export function createBuildingGeometry3(
  THREE: typeof import("three"),
  type: "airport" | "trainstation" | "skyscraper2",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "airport") {
    const glassMat = new THREE.MeshStandardMaterial({
      color: color || "#88ccff",
      metalness: metalness ?? 0.6,
      roughness: roughness ?? 0.2,
      transparent: true,
      opacity: 0.8,
    });
    const concreteMat = new THREE.MeshStandardMaterial({ color: "#a0a0a0", roughness: 0.9 });

    // Main terminal building
    const terminal = new THREE.Mesh(new THREE.BoxGeometry(5, 1.5, 2.5), glassMat);
    terminal.position.y = 0.75;
    group.add(terminal);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.15, 2.7), concreteMat);
    roof.position.y = 1.55;
    group.add(roof);

    // Control tower
    const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2, 12), concreteMat);
    towerBase.position.set(-2, 1, 0);
    group.add(towerBase);

    const towerTop = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.6, 12), glassMat);
    towerTop.position.set(-2, 2.3, 0);
    group.add(towerTop);

    const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.4, 12), concreteMat);
    towerRoof.position.set(-2, 2.8, 0);
    group.add(towerRoof);

    // Runway
    const runway = new THREE.Mesh(new THREE.BoxGeometry(6, 0.05, 0.8), new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.9 }));
    runway.position.set(0, 0.025, 1.8);
    group.add(runway);

    // Runway markings
    for (let i = 0; i < 6; i++) {
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.1), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9 }));
      mark.position.set(-2 + i * 0.8, 0.06, 1.8);
      group.add(mark);
    }

    // Small plane on runway
    const planeMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.4 });
    const plane = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), planeMat);
    plane.rotation.z = Math.PI / 2;
    plane.position.set(1.5, 0.15, 1.8);
    group.add(plane);

    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.03, 0.6), planeMat);
    wing.position.set(1.5, 0.15, 1.8);
    group.add(wing);
  } else if (type === "trainstation") {
    const brickMat = new THREE.MeshStandardMaterial({
      color: color || "#a0503a",
      roughness: roughness ?? 0.8,
      metalness: metalness ?? 0.1,
    });
    const roofMat = new THREE.MeshStandardMaterial({ color: "#3a2a2a", roughness: 0.8 });

    // Main building
    const main = new THREE.Mesh(new THREE.BoxGeometry(3, 1.8, 1.5), brickMat);
    main.position.y = 0.9;
    group.add(main);

    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2, 0.8, 4), roofMat);
    roof.position.y = 2.2;
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(1.2, 1, 0.8);
    group.add(roof);

    // Clock tower
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.8, 0.5), brickMat);
    tower.position.set(1, 1.4, 0);
    group.add(tower);

    const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5 }));
    clockFace.position.set(1, 2.2, 0.26);
    group.add(clockFace);

    // Platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(5, 0.1, 1), new THREE.MeshStandardMaterial({ color: "#8a8a8a", roughness: 0.9 }));
    platform.position.set(0, 0.05, 1.5);
    group.add(platform);

    // Train tracks
    for (const z of [1.2, 1.8]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(5, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: "#5a5a5a", metalness: 0.9, roughness: 0.3 }));
      rail.position.set(0, 0.03, z);
      group.add(rail);
    }

    // Train
    const trainMat = new THREE.MeshStandardMaterial({ color: "#4a4a4a", metalness: 0.7, roughness: 0.4 });
    const train = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.4), trainMat);
    train.position.set(-1, 0.3, 1.5);
    group.add(train);
  } else if (type === "skyscraper2") {
    const glassMat = new THREE.MeshStandardMaterial({
      color: color || "#4a90d9",
      roughness: roughness ?? 0.1,
      metalness: metalness ?? 0.8,
      transparent: true,
      opacity: 0.85,
    });
    const frameMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.6, metalness: 0.9 });

    // Twisted tower (stacked boxes rotating)
    for (let i = 0; i < 6; i++) {
      const seg = new THREE.Mesh(new THREE.BoxGeometry(1.4 - i * 0.1, 1, 1.4 - i * 0.1), glassMat);
      seg.position.y = 0.5 + i * 1;
      seg.rotation.y = i * 0.15;
      group.add(seg);

      // Floor line
      const line = new THREE.Mesh(new THREE.BoxGeometry(1.5 - i * 0.1, 0.05, 1.5 - i * 0.1), frameMat);
      line.position.y = 0.5 + i * 1;
      group.add(line);
    }

    // Spire
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 2, 8), frameMat);
    spire.position.y = 7;
    group.add(spire);

    // Red light
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: "#ff0000", emissive: "#ff0000", emissiveIntensity: 2 }));
    light.position.y = 8;
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

// ============================================================
// ENERGY GEOMETRIES (Wind Turbine, Solar Panel, Satellite2)
// ============================================================

export function createEnergyGeometry(
  THREE: typeof import("three"),
  type: "windturbine" | "solarpanel" | "satellite2",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "windturbine") {
    const whiteMat = new THREE.MeshStandardMaterial({
      color: color || "#ffffff",
      roughness: roughness ?? 0.5,
      metalness: metalness ?? 0.2,
    });

    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 0.3, 12), new THREE.MeshStandardMaterial({ color: "#8a8a8a", roughness: 0.9 }));
    base.position.y = 0.15;
    group.add(base);

    // Tower (tall tapered)
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.25, 5, 12), whiteMat);
    tower.position.y = 2.65;
    group.add(tower);

    // Nacelle
    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.3), whiteMat);
    nacelle.position.set(0, 5.2, 0);
    group.add(nacelle);

    // Hub
    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), whiteMat);
    hub.position.set(0.35, 5.2, 0);
    group.add(hub);

    // Rotating blade assembly centered on the hub
    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(0.35, 5.2, 0);
    bladeGroup.userData.turbineBlades = true;
    group.add(bladeGroup);

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.8, 0.1), whiteMat);
      blade.position.set(0, Math.sin(angle) * 0.9, Math.cos(angle) * 0.9);
      blade.rotation.x = angle;
      bladeGroup.add(blade);
    }
  } else if (type === "solarpanel") {
    const frameMat = new THREE.MeshStandardMaterial({
      color: color || "#2a2a3a",
      metalness: metalness ?? 0.7,
      roughness: roughness ?? 0.3,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: "#1a3a6a",
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.9,
    });

    // Support legs
    for (const [x, z] of [[-0.6, -0.4], [-0.6, 0.4], [0.6, -0.4], [0.6, 0.4]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), new THREE.MeshStandardMaterial({ color: "#5a5a5a", metalness: 0.8, roughness: 0.3 }));
      leg.position.set(x, 0.25, z);
      group.add(leg);
    }

    // Tilted panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 1), frameMat);
    panel.position.y = 0.6;
    panel.rotation.x = -0.4;
    group.add(panel);

    // Solar cells grid
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 2; j++) {
        const cell = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.02, 0.4), glassMat);
        cell.position.set(-0.5 + i * 0.5, 0.63, -0.25 + j * 0.5);
        cell.rotation.x = -0.4;
        group.add(cell);
      }
    }
  } else if (type === "satellite2") {
    const metalMat = new THREE.MeshStandardMaterial({
      color: color || "#d0d0d0",
      metalness: metalness ?? 0.9,
      roughness: roughness ?? 0.2,
    });
    const goldMat = new THREE.MeshStandardMaterial({ color: "#ffd700", metalness: 1, roughness: 0.3 });
    const solarMat = new THREE.MeshStandardMaterial({ color: "#1a3a8a", metalness: 0.8, roughness: 0.3 });

    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), goldMat);
    group.add(body);

    // Solar panels (larger, 4 sides)
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.8), solarMat);
      panel.position.set(side * 1.1, 0, 0);
      group.add(panel);
    }

    // Dish
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), metalMat);
    dish.position.y = 0.5;
    dish.rotation.x = Math.PI;
    group.add(dish);

    // Antenna
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 6), metalMat);
    antenna.position.y = 0.8;
    group.add(antenna);
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
// TRANSPORT GEOMETRIES (Cruise Ship, Submarine, Hot Air Balloon, Helicopter2, Train, Bus)
// ============================================================

export function createTransportGeometry(
  THREE: typeof import("three"),
  type: "cruiseship" | "submarine" | "hotairballoon" | "helicopter2" | "train" | "bus",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "cruiseship") {
    const hullMat = new THREE.MeshStandardMaterial({
      color: color || "#f0f0f0",
      roughness: roughness ?? 0.5,
      metalness: metalness ?? 0.3,
    });
    const glassMat = new THREE.MeshStandardMaterial({ color: "#88ccff", metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.7 });

    // Long hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 2), hullMat);
    hull.position.y = 0.4;
    group.add(hull);

    // Pointed bow
    const bow = new THREE.Mesh(new THREE.ConeGeometry(1, 1.5, 6), hullMat);
    bow.rotation.z = -Math.PI / 2;
    bow.position.set(4.5, 0.4, 0);
    group.add(bow);

    // Multi-level decks
    for (let i = 0; i < 3; i++) {
      const deck = new THREE.Mesh(new THREE.BoxGeometry(7 - i * 0.5, 0.6, 1.8 - i * 0.1), hullMat);
      deck.position.set(-0.3, 1.1 + i * 0.65, 0);
      group.add(deck);

      // Windows on each deck
      for (let j = 0; j < 12; j++) {
        for (const side of [-1, 1]) {
          const win = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.02), glassMat);
          win.position.set(-3 + j * 0.55, 1.1 + i * 0.65, side * (0.9 - i * 0.05));
          group.add(win);
        }
      }
    }

    // Funnel (smokestack)
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.8, 10), new THREE.MeshStandardMaterial({ color: "#cc0000", roughness: 0.5 }));
    funnel.position.set(-1.5, 3.1, 0);
    group.add(funnel);

    // Pool on top deck
    const pool = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.8), new THREE.MeshStandardMaterial({ color: "#4fc3f7", roughness: 0.1, metalness: 0.3 }));
    pool.position.set(1.5, 2.35, 0);
    group.add(pool);
  } else if (type === "submarine") {
    const hullMat = new THREE.MeshStandardMaterial({
      color: color || "#4a4a4a",
      roughness: roughness ?? 0.5,
      metalness: metalness ?? 0.6,
    });
    const glassMat = new THREE.MeshStandardMaterial({ color: "#88ccff", metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.6 });

    // Main cylindrical body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 4, 16), hullMat);
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.8;
    group.add(body);

    // Nose (rounded)
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), hullMat);
    nose.position.set(2, 0.8, 0);
    nose.scale.set(0.8, 1, 1);
    group.add(nose);

    // Tail (tapered)
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.2, 16), hullMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-2.6, 0.8, 0);
    group.add(tail);

    // Conning tower (sail)
    const sail = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.5), hullMat);
    sail.position.set(0, 1.6, 0);
    group.add(sail);

    // Periscope
    const periscope = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), new THREE.MeshStandardMaterial({ color: "#2a2a2a", metalness: 0.9, roughness: 0.2 }));
    periscope.position.set(0, 2.2, 0);
    group.add(periscope);

    // Portholes
    for (let i = 0; i < 4; i++) {
      const porthole = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), glassMat);
      porthole.position.set(1.5 - i * 1, 0.8, 0.71);
      group.add(porthole);
    }

    // Propeller
    const prop = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6), new THREE.MeshStandardMaterial({ color: "#d0d0d0", metalness: 0.9, roughness: 0.2 }));
    prop.rotation.z = Math.PI / 2;
    prop.position.set(-3.2, 0.8, 0);
    group.add(prop);

    for (let i = 0; i < 3; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.1), new THREE.MeshStandardMaterial({ color: "#d0d0d0", metalness: 0.9, roughness: 0.2 }));
      blade.position.set(-3.2, 0.8, 0);
      blade.rotation.x = (i / 3) * Math.PI * 2;
      group.add(blade);
    }
  } else if (type === "hotairballoon") {
    const balloonMat = new THREE.MeshStandardMaterial({
      color: color || "#e63946",
      roughness: roughness ?? 0.5,
      metalness: metalness ?? 0.1,
    });
    const basketMat = new THREE.MeshStandardMaterial({ color: "#8b4513", roughness: 0.9 });

    // Balloon (large sphere)
    const balloon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 16), balloonMat);
    balloon.position.y = 3.5;
    balloon.scale.set(1, 1.2, 1);
    group.add(balloon);

    // Stripes on balloon
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const stripe = new THREE.Mesh(new THREE.SphereGeometry(1.21, 24, 16, angle, Math.PI / 8), new THREE.MeshStandardMaterial({ color: "#ffd700", roughness: 0.5 }));
      stripe.position.y = 3.5;
      stripe.scale.set(1, 1.2, 1);
      group.add(stripe);
    }

    // Basket
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), basketMat);
    basket.position.y = 1.5;
    group.add(basket);

    // Ropes
    for (const [x, z] of [[-0.25, -0.25], [-0.25, 0.25], [0.25, -0.25], [0.25, 0.25]]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.2, 4), new THREE.MeshStandardMaterial({ color: "#3a2a1a" }));
      rope.position.set(x, 2.4, z);
      group.add(rope);
    }

    // Burner flame
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 8), new THREE.MeshStandardMaterial({ color: "#ffaa00", emissive: "#ff6600", emissiveIntensity: 2 }));
    flame.position.y = 2.1;
    group.add(flame);
  } else if (type === "helicopter2") {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color || "#2a5a8a",
      roughness: roughness ?? 0.5,
      metalness: metalness ?? 0.5,
    });
    const glassMat = new THREE.MeshStandardMaterial({ color: "#88ccff", metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.6 });

    // Body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), bodyMat);
    body.position.y = 1;
    body.scale.set(1.4, 0.8, 1);
    group.add(body);

    // Cockpit glass
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    cockpit.position.set(0.6, 1.1, 0);
    cockpit.rotation.z = Math.PI / 2;
    group.add(cockpit);

    // Tail boom
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.08, 2, 10), bodyMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-1.5, 1.1, 0);
    group.add(tail);

    // Tail fin
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.3), bodyMat);
    fin.position.set(-2.4, 1.3, 0);
    group.add(fin);

    // Tail rotor
    const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.06), bodyMat);
    tailRotor.position.set(-2.5, 1.1, 0);
    group.add(tailRotor);

    // Main rotor mast
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), new THREE.MeshStandardMaterial({ color: "#2a2a2a" }));
    mast.position.y = 1.7;
    group.add(mast);

    // Main rotor blades
    const bladeGroup = new THREE.Group();
    bladeGroup.userData.helicopterBlades = true;
    bladeGroup.position.y = 1.9;
    for (let i = 0; i < 2; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(3, 0.03, 0.15), new THREE.MeshStandardMaterial({ color: "#2a2a2a" }));
      blade.rotation.y = i * Math.PI / 2;
      bladeGroup.add(blade);
    }
    group.add(bladeGroup);

    // Skids
    for (const side of [-0.4, 0.4]) {
      const skid = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 6), new THREE.MeshStandardMaterial({ color: "#2a2a2a" }));
      skid.rotation.z = Math.PI / 2;
      skid.position.set(0, 0.2, side);
      group.add(skid);
    }
  } else if (type === "train") {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color || "#4a4a4a",
      roughness: roughness ?? 0.4,
      metalness: metalness ?? 0.7,
    });
    const glassMat = new THREE.MeshStandardMaterial({ color: "#88ccff", metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.7 });

    // Locomotive
    const loco = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, 1.4), bodyMat);
    loco.position.y = 0.8;
    group.add(loco);

    // Engine hood (angled front)
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1, 0.8, 1.3), bodyMat);
    hood.position.set(1.9, 0.9, 0);
    group.add(hood);

    // Cab
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1.4), bodyMat);
    cab.position.set(-0.8, 1.2, 0);
    group.add(cab);

    // Cab windows
    for (const side of [-1, 1]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.02), glassMat);
      win.position.set(-0.8, 1.4, side * 0.71);
      group.add(win);
    }

    // Chimney
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.5, 8), new THREE.MeshStandardMaterial({ color: "#2a2a2a" }));
    chimney.position.set(1.5, 1.65, 0);
    group.add(chimney);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.7 });
    for (const [x, z] of [[-1, -0.7], [-1, 0.7], [1, -0.7], [1, 0.7], [2, -0.7], [2, 0.7]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.15, 16), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.3, z);
      group.add(wheel);
    }

    // Cowcatcher
    const cowcatcher = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.5, 4), bodyMat);
    cowcatcher.rotation.z = -Math.PI / 2;
    cowcatcher.position.set(2.6, 0.3, 0);
    cowcatcher.scale.set(1, 1, 1.2);
    group.add(cowcatcher);
  } else if (type === "bus") {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color || "#f0c040",
      roughness: roughness ?? 0.5,
      metalness: metalness ?? 0.4,
    });
    const glassMat = new THREE.MeshStandardMaterial({ color: "#88ccff", metalness: 0.5, roughness: 0.1, transparent: true, opacity: 0.7 });

    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.5, 1.5, 1.8), bodyMat);
    body.position.y = 1;
    group.add(body);

    // Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 1.8), bodyMat);
    roof.position.y = 1.8;
    group.add(roof);

    // Windshield
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.7, 1.6), glassMat);
    windshield.position.set(2.26, 1.2, 0);
    group.add(windshield);

    // Side windows
    for (let i = 0; i < 6; i++) {
      for (const side of [-1, 1]) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.02), glassMat);
        win.position.set(-1.8 + i * 0.65, 1.3, side * 0.91);
        group.add(win);
      }
    }

    // Door (front side)
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1, 0.02), new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.5 }));
    door.position.set(1.5, 0.8, 0.91);
    group.add(door);

    // Wheels
    const wheelMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.7 });
    for (const [x, z] of [[-1.5, -0.9], [-1.5, 0.9], [1.5, -0.9], [1.5, 0.9]]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.35, z);
      wheel.userData.wheel = true;
      group.add(wheel);
    }

    // Headlights
    for (const side of [-0.6, 0.6]) {
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.3), new THREE.MeshStandardMaterial({ color: "#ffffaa", emissive: "#ffff66", emissiveIntensity: 0.8 }));
      light.position.set(2.26, 0.7, side);
      group.add(light);
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
// PERSONAL TRANSPORT GEOMETRIES (Motorcycle, Bicycle, Skateboard, Surfboard, Kayak, Paraglider)
// ============================================================

export function createPersonalTransportGeometry(
  THREE: typeof import("three"),
  type: "motorcycle" | "bicycle" | "skateboard" | "surfboard" | "kayak" | "paraglider",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "motorcycle") {
    const bodyMat = new THREE.MeshStandardMaterial({
      color: color || "#cc0000",
      roughness: roughness ?? 0.3,
      metalness: metalness ?? 0.7,
    });
    const blackMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.7 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: "#e0e0e0", metalness: 1, roughness: 0.1 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.4, 0.5), bodyMat);
    body.position.y = 0.7;
    group.add(body);

    // Fuel tank
    const tank = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), bodyMat);
    tank.position.set(0.2, 0.9, 0);
    tank.scale.set(1.2, 0.7, 0.9);
    group.add(tank);

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.4), blackMat);
    seat.position.set(-0.4, 0.95, 0);
    group.add(seat);

    // Handlebars
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), chromeMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0.65, 1.1, 0);
    group.add(bar);

    // Front fork
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8), chromeMat);
    fork.position.set(0.7, 0.5, 0);
    fork.rotation.z = -0.3;
    group.add(fork);

    // 2 wheels
    for (const x of [-0.6, 0.7]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 20), blackMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, 0.3, 0);
      wheel.userData.wheel = true;
      group.add(wheel);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), chromeMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.set(x, 0.3, 0);
      group.add(rim);
    }

    // Headlight
    const headlight = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), new THREE.MeshStandardMaterial({ color: "#ffffaa", emissive: "#ffff66", emissiveIntensity: 1 }));
    headlight.position.set(0.85, 0.9, 0);
    group.add(headlight);

    // Exhaust pipe
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), chromeMat);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(-0.4, 0.4, 0.3);
    group.add(exhaust);
  } else if (type === "bicycle") {
    const frameMat = new THREE.MeshStandardMaterial({
      color: color || "#1e88e5",
      roughness: roughness ?? 0.4,
      metalness: metalness ?? 0.6,
    });
    const blackMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.7 });

    // Frame (triangular)
    const frame1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), frameMat);
    frame1.position.set(0, 0.7, 0);
    frame1.rotation.z = 0.3;
    group.add(frame1);

    const frame2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), frameMat);
    frame2.position.set(-0.2, 0.55, 0);
    frame2.rotation.z = -0.6;
    group.add(frame2);

    const frame3 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), frameMat);
    frame3.position.set(0.3, 0.55, 0);
    frame3.rotation.z = 0.5;
    group.add(frame3);

    // Handlebars
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8), blackMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0.5, 1.0, 0);
    group.add(bar);

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.15), blackMat);
    seat.position.set(-0.35, 1.0, 0);
    group.add(seat);

    // 2 wheels
    for (const x of [-0.5, 0.5]) {
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 24), blackMat);
      wheel.position.set(x, 0.3, 0);
      wheel.userData.wheel = true;
      group.add(wheel);

      // Spokes
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.6, 4), new THREE.MeshStandardMaterial({ color: "#d0d0d0", metalness: 0.9, roughness: 0.2 }));
        spoke.position.set(x, 0.3, 0);
        spoke.rotation.z = angle;
        group.add(spoke);
      }
    }
  } else if (type === "skateboard") {
    const deckMat = new THREE.MeshStandardMaterial({
      color: color || "#8b4513",
      roughness: roughness ?? 0.7,
      metalness: metalness ?? 0.1,
    });
    const wheelMat = new THREE.MeshStandardMaterial({ color: "#ffdd44", roughness: 0.4 });
    const truckMat = new THREE.MeshStandardMaterial({ color: "#d0d0d0", metalness: 0.9, roughness: 0.2 });

    // Deck
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.4), deckMat);
    deck.position.y = 0.2;
    group.add(deck);

    // Trucks (metal axles)
    for (const x of [-0.5, 0.5]) {
      const truck = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.3), truckMat);
      truck.position.set(x, 0.15, 0);
      group.add(truck);

      // Wheels (4)
      for (const z of [-0.15, 0.15]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), wheelMat);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.08, z);
        wheel.userData.wheel = true;
        group.add(wheel);
      }
    }
  } else if (type === "surfboard") {
    const boardMat = new THREE.MeshStandardMaterial({
      color: color || "#ffdd44",
      roughness: roughness ?? 0.3,
      metalness: metalness ?? 0.1,
    });
    const stripeMat = new THREE.MeshStandardMaterial({ color: "#ff6600", roughness: 0.3 });

    // Main board (long, pointed)
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 2.5), boardMat);
    board.position.y = 0.1;
    group.add(board);

    // Pointed front
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.5, 4), boardMat);
    nose.rotation.x = -Math.PI / 2;
    nose.rotation.z = Math.PI / 4;
    nose.position.set(0, 0.1, 1.5);
    nose.scale.set(1, 1, 0.15);
    group.add(nose);

    // Tail (slightly pointed)
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.3, 4), boardMat);
    tail.rotation.x = Math.PI / 2;
    tail.rotation.z = Math.PI / 4;
    tail.position.set(0, 0.1, -1.4);
    tail.scale.set(1, 1, 0.1);
    group.add(tail);

    // Stripe
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 2.3), stripeMat);
    stripe.position.y = 0.1;
    group.add(stripe);

    // Fin on tail
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.15), boardMat);
    fin.position.set(0, -0.05, -1.2);
    group.add(fin);
  } else if (type === "kayak") {
    const hullMat = new THREE.MeshStandardMaterial({
      color: color || "#ff8800",
      roughness: roughness ?? 0.5,
      metalness: metalness ?? 0.2,
    });
    const seatMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.7 });

    // Long narrow hull (rounded)
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.5, 16), hullMat);
    hull.rotation.z = Math.PI / 2;
    hull.position.y = 0.25;
    group.add(hull);

    // Pointed nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 12), hullMat);
    nose.rotation.z = -Math.PI / 2;
    nose.position.set(1.5, 0.25, 0);
    group.add(nose);

    // Pointed tail
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.4, 12), hullMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-1.5, 0.25, 0);
    group.add(tail);

    // Cockpit opening
    const cockpit = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 12), new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.9 }));
    cockpit.position.set(0, 0.4, 0);
    cockpit.scale.set(2, 1, 1);
    group.add(cockpit);

    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.3), seatMat);
    seat.position.set(-0.2, 0.42, 0);
    group.add(seat);
  } else if (type === "paraglider") {
    const canopyMat = new THREE.MeshStandardMaterial({
      color: color || "#e63946",
      roughness: roughness ?? 0.4,
      metalness: metalness ?? 0.1,
      side: THREE.DoubleSide,
    });
    const lineMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 });
    const harnessMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.7 });

    // Canopy (curved airfoil shape using half sphere)
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 4),
      canopyMat
    );
    canopy.position.y = 4;
    canopy.scale.set(1, 0.4, 0.6);
    group.add(canopy);

    // Canopy stripes
    for (let i = 0; i < 5; i++) {
      const stripe = new THREE.Mesh(
        new THREE.SphereGeometry(2.02, 24, 12, (i / 5) * Math.PI * 2, Math.PI / 10, 0, Math.PI / 4),
        new THREE.MeshStandardMaterial({ color: "#ffdd00", roughness: 0.4, side: THREE.DoubleSide })
      );
      stripe.position.y = 4;
      stripe.scale.set(1, 0.4, 0.6);
      group.add(stripe);
    }

    // Harness (pilot seat)
    const harness = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.3), harnessMat);
    harness.position.y = 1.5;
    group.add(harness);

    // Pilot (simple figure)
    const pilotBody = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 8), new THREE.MeshStandardMaterial({ color: "#4a90d9", roughness: 0.7 }));
    pilotBody.position.y = 1.85;
    group.add(pilotBody);

    const pilotHead = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), new THREE.MeshStandardMaterial({ color: "#f4c8a0", roughness: 0.7 }));
    pilotHead.position.y = 2.15;
    group.add(pilotHead);

    // Lines (from harness to canopy)
    for (const [x, z] of [[-0.3, -0.2], [-0.3, 0.2], [0.3, -0.2], [0.3, 0.2]]) {
      const line = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 2.3, 4), lineMat);
      line.position.set(x * 3, 3.1, z * 3);
      line.rotation.z = x * 0.3;
      line.rotation.x = z * 0.3;
      group.add(line);
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
// FOOD GEOMETRIES (Donut, Cake, Pizza, Ice Cream, Coffee Cup, Hamburger)
// ============================================================

export function createFoodGeometry(
  THREE: typeof import("three"),
  type: "donut" | "cake" | "pizza" | "icecream" | "coffeecup" | "hamburger",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "donut") {
    const doughMat = new THREE.MeshStandardMaterial({
      color: color || "#d4a373",
      roughness: roughness ?? 0.8,
      metalness: metalness ?? 0.1,
    });
    const glazeMat = new THREE.MeshStandardMaterial({ color: "#ff69b4", roughness: 0.3 });
    const sprinkleColors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"];

    // Donut ring (torus)
    const donut = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.3, 16, 32), doughMat);
    donut.position.y = 0.3;
    donut.rotation.x = Math.PI / 2;
    group.add(donut);

    // Glaze on top (half torus)
    const glaze = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.31, 16, 32, Math.PI), glazeMat);
    glaze.position.y = 0.32;
    glaze.rotation.x = Math.PI / 2;
    glaze.rotation.z = Math.PI;
    group.add(glaze);

    // Sprinkles
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 0.5 + Math.random() * 0.2;
      const sprinkle = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.02, 0.02),
        new THREE.MeshStandardMaterial({ color: sprinkleColors[Math.floor(Math.random() * 5)], roughness: 0.5 })
      );
      sprinkle.position.set(Math.cos(angle) * r, 0.6, Math.sin(angle) * r);
      sprinkle.rotation.y = Math.random() * Math.PI;
      group.add(sprinkle);
    }
  } else if (type === "cake") {
    const cakeMat = new THREE.MeshStandardMaterial({
      color: color || "#ffb6c1",
      roughness: roughness ?? 0.7,
    });
    const icingMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.4 });
    const cherryMat = new THREE.MeshStandardMaterial({ color: "#cc0000", roughness: 0.3 });
    const candleMat = new THREE.MeshStandardMaterial({ color: "#ffdd00", roughness: 0.5 });

    // Base cake
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 0.6, 24), cakeMat);
    base.position.y = 0.3;
    group.add(base);

    // Icing on top
    const icing = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.82, 0.1, 24), icingMat);
    icing.position.y = 0.65;
    group.add(icing);

    // Second layer
    const layer2 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.7, 0.5, 24), cakeMat);
    layer2.position.y = 1;
    group.add(layer2);

    const icing2 = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 24), icingMat);
    icing2.position.y = 1.3;
    group.add(icing2);

    // Cherries
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), cherryMat);
      cherry.position.set(Math.cos(angle) * 0.5, 1.38, Math.sin(angle) * 0.5);
      group.add(cherry);
    }

    // Candles
    for (let i = 0; i < 3; i++) {
      const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 6), candleMat);
      candle.position.set(-0.2 + i * 0.2, 1.5, 0);
      group.add(candle);

      // Flame
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 6), new THREE.MeshStandardMaterial({ color: "#ff6600", emissive: "#ff4400", emissiveIntensity: 2 }));
      flame.position.set(-0.2 + i * 0.2, 1.7, 0);
      group.add(flame);
    }
  } else if (type === "pizza") {
    const crustMat = new THREE.MeshStandardMaterial({
      color: color || "#d4a373",
      roughness: roughness ?? 0.8,
    });
    const cheeseMat = new THREE.MeshStandardMaterial({ color: "#ffdd66", roughness: 0.6 });
    const pepperoniMat = new THREE.MeshStandardMaterial({ color: "#cc0000", roughness: 0.5 });

    // Pizza base (flat cylinder)
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 32), crustMat);
    base.position.y = 0.04;
    group.add(base);

    // Cheese layer
    const cheese = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.05, 32), cheeseMat);
    cheese.position.y = 0.1;
    group.add(cheese);

    // Pepperoni
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 0.4 + Math.random() * 0.3;
      const pep = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 12), pepperoniMat);
      pep.position.set(Math.cos(angle) * r, 0.13, Math.sin(angle) * r);
      group.add(pep);
    }

    // Slices cut lines
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const cut = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.85), new THREE.MeshStandardMaterial({ color: "#8a5a3a" }));
      cut.position.set(Math.cos(angle) * 0.4, 0.14, Math.sin(angle) * 0.4);
      cut.rotation.y = angle;
      group.add(cut);
    }
  } else if (type === "icecream") {
    const coneMat = new THREE.MeshStandardMaterial({
      color: color || "#d4a373",
      roughness: roughness ?? 0.9,
    });
    const scoopMat = new THREE.MeshStandardMaterial({ color: "#ffb6c1", roughness: 0.6 });
    const scoop2Mat = new THREE.MeshStandardMaterial({ color: "#87ceeb", roughness: 0.6 });
    const scoop3Mat = new THREE.MeshStandardMaterial({ color: "#98fb98", roughness: 0.6 });

    // Cone (inverted)
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.9, 16), coneMat);
    cone.position.y = 0.45;
    cone.rotation.x = Math.PI;
    group.add(cone);

    // 3 scoops
    const scoop1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), scoopMat);
    scoop1.position.y = 1.1;
    group.add(scoop1);

    const scoop2 = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), scoop2Mat);
    scoop2.position.set(0, 1.5, 0);
    group.add(scoop2);

    const scoop3 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), scoop3Mat);
    scoop3.position.set(0, 1.85, 0);
    group.add(scoop3);

    // Cherry on top
    const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: "#cc0000", roughness: 0.3 }));
    cherry.position.y = 2.1;
    group.add(cherry);

    // Sprinkles
    for (let i = 0; i < 10; i++) {
      const sprinkle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? "#ffdd00" : "#ff69b4", roughness: 0.5 }));
      const angle = Math.random() * Math.PI * 2;
      sprinkle.position.set(Math.cos(angle) * 0.22, 1.7 + Math.random() * 0.2, Math.sin(angle) * 0.22);
      group.add(sprinkle);
    }
  } else if (type === "coffeecup") {
    const cupMat = new THREE.MeshStandardMaterial({
      color: color || "#ffffff",
      roughness: roughness ?? 0.5,
      metalness: metalness ?? 0.1,
    });
    const coffeeMat = new THREE.MeshStandardMaterial({ color: "#3a1a0a", roughness: 0.2, metalness: 0.3 });
    const saucerMat = new THREE.MeshStandardMaterial({ color: "#f0f0f0", roughness: 0.5 });

    // Saucer
    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.05, 24), saucerMat);
    saucer.position.y = 0.025;
    group.add(saucer);

    // Cup
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.5, 20), cupMat);
    cup.position.y = 0.3;
    group.add(cup);

    // Handle
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 8, 16), cupMat);
    handle.position.set(0.35, 0.3, 0);
    handle.rotation.y = Math.PI / 2;
    group.add(handle);

    // Coffee surface
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.33, 20), coffeeMat);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.53;
    group.add(coffee);

    // Steam
    const steamMat = new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.4, roughness: 0.9 });
    for (let i = 0; i < 3; i++) {
      const steam = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), steamMat);
      steam.position.set(-0.1 + i * 0.1, 0.65 + i * 0.08, 0);
      steam.scale.set(1, 1.5, 1);
      group.add(steam);
    }
  } else if (type === "hamburger") {
    const bunMat = new THREE.MeshStandardMaterial({
      color: color || "#d4a373",
      roughness: roughness ?? 0.7,
    });
    const pattyMat = new THREE.MeshStandardMaterial({ color: "#5a2a1a", roughness: 0.8 });
    const cheeseMat = new THREE.MeshStandardMaterial({ color: "#ffcc00", roughness: 0.5 });
    const lettuceMat = new THREE.MeshStandardMaterial({ color: "#4a8a2d", roughness: 0.9 });
    const tomatoMat = new THREE.MeshStandardMaterial({ color: "#cc0000", roughness: 0.5 });

    // Bottom bun
    const bottomBun = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.2, 20), bunMat);
    bottomBun.position.y = 0.1;
    group.add(bottomBun);

    // Patty
    const patty = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.15, 20), pattyMat);
    patty.position.y = 0.28;
    group.add(patty);

    // Cheese (slightly melted)
    const cheese = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.9), cheeseMat);
    cheese.position.y = 0.38;
    group.add(cheese);

    // Lettuce
    const lettuce = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.55, 0.08, 20), lettuceMat);
    lettuce.position.y = 0.44;
    group.add(lettuce);

    // Tomato
    const tomato = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.08, 20), tomatoMat);
    tomato.position.y = 0.5;
    group.add(tomato);

    // Top bun (dome)
    const topBun = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), bunMat);
    topBun.position.y = 0.55;
    topBun.scale.set(1, 0.6, 1);
    group.add(topBun);

    // Sesame seeds
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.4;
      const seed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), new THREE.MeshStandardMaterial({ color: "#f0e0c0" }));
      seed.position.set(Math.cos(angle) * r, 0.9 + Math.random() * 0.05, Math.sin(angle) * r);
      seed.scale.set(1, 0.5, 1);
      group.add(seed);
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
// NATURE GEOMETRIES (Grass, Trees, Insects, Fruits, Flowers)
// ============================================================

export function createNatureGeometry(
  THREE: typeof import("three"),
  type:
    | "grass_short" | "grass_tall"
    | "tree_small" | "tree_large" | "tree_low" | "tree_high"
    | "butterfly" | "bee" | "ladybug" | "dragonfly" | "ant"
    | "apple" | "orange" | "banana" | "grape" | "mango" | "watermelon"
    | "daisy" | "orchid" | "hibiscus" | "bougainvillea",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "grass_short") {
    const grassMat = new THREE.MeshStandardMaterial({ color: color || "#4d8a2d", roughness: roughness ?? 0.9, side: THREE.DoubleSide });
    for (let i = 0; i < 14; i++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.25 + Math.random() * 0.1, 4), grassMat);
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.5;
      blade.position.set(Math.cos(angle) * r, 0.13, Math.sin(angle) * r);
      blade.rotation.z = (Math.random() - 0.5) * 0.4;
      blade.rotation.y = Math.random() * Math.PI;
      group.add(blade);
    }
  } else if (type === "grass_tall") {
    const grassMat = new THREE.MeshStandardMaterial({ color: color || "#3a7a1d", roughness: roughness ?? 0.9, side: THREE.DoubleSide });
    for (let i = 0; i < 20; i++) {
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.7 + Math.random() * 0.4, 4), grassMat);
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.6;
      blade.position.set(Math.cos(angle) * r, 0.4, Math.sin(angle) * r);
      blade.rotation.z = (Math.random() - 0.5) * 0.3;
      blade.rotation.y = Math.random() * Math.PI;
      group.add(blade);
    }
  } else if (type === "tree_small") {
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#6b4423", roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: color || "#2d6a2d", roughness: 0.85 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.2, 8), trunkMat);
    trunk.position.y = 0.6;
    group.add(trunk);
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), leafMat);
    foliage.position.y = 1.6;
    group.add(foliage);
  } else if (type === "tree_large") {
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#6b4423", roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: color || "#1e4d1e", roughness: 0.85 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 3, 12), trunkMat);
    trunk.position.y = 1.5;
    group.add(trunk);
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 12), leafMat);
    foliage.position.y = 3.5;
    foliage.scale.set(1.2, 1, 1.2);
    group.add(foliage);
    const foliage2 = new THREE.Mesh(new THREE.SphereGeometry(0.9, 12, 10), leafMat);
    foliage2.position.set(0.8, 4, 0.5);
    group.add(foliage2);
  } else if (type === "tree_low") {
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#6b4423", roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: color || "#2d6a2d", roughness: 0.85 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.5, 10), trunkMat);
    trunk.position.y = 0.75;
    group.add(trunk);
    const foliage = new THREE.Mesh(new THREE.ConeGeometry(1, 1, 12), leafMat);
    foliage.position.y = 1.8;
    group.add(foliage);
  } else if (type === "tree_high") {
    const trunkMat = new THREE.MeshStandardMaterial({ color: "#5d3a1a", roughness: 0.9 });
    const leafMat = new THREE.MeshStandardMaterial({ color: color || "#1e5a1e", roughness: 0.85 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.5, 10), trunkMat);
    trunk.position.y = 1.25;
    group.add(trunk);
    for (let i = 0; i < 3; i++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1 - i * 0.2, 1.5, 12), leafMat);
      cone.position.y = 2.5 + i * 0.8;
      group.add(cone);
    }
  } else if (type === "butterfly") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.5 });
    const wingMat = new THREE.MeshStandardMaterial({ color: color || "#ff69b4", roughness: 0.4, side: THREE.DoubleSide });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8), bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), wingMat);
      wing.position.set(0, 0, side * 0.15);
      wing.rotation.x = side * 0.3;
      group.add(wing);
    }
  } else if (type === "bee") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: "#ffcc00", roughness: 0.5 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), bodyMat);
    group.add(body);
    for (let i = 0; i < 2; i++) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 6, 12), stripeMat);
      stripe.rotation.x = Math.PI / 2;
      stripe.position.y = -0.05 + i * 0.1;
      group.add(stripe);
    }
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.CircleGeometry(0.1, 8), new THREE.MeshStandardMaterial({ color: "#ffffff", transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
      wing.position.set(0.05, 0.1, side * 0.12);
      wing.rotation.x = side * 0.5;
      group.add(wing);
    }
  } else if (type === "ladybug") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: color || "#cc0000", roughness: 0.4 });
    const spotMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), bodyMat);
    body.scale.set(1, 0.6, 1);
    group.add(body);
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 0.12;
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), spotMat);
      spot.position.set(Math.cos(angle) * r, 0.12, Math.sin(angle) * r);
      group.add(spot);
    }
  } else if (type === "dragonfly") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: color || "#4a90d9", roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8), bodyMat);
    body.rotation.z = Math.PI / 2;
    group.add(body);
    for (const side of [-1, 1]) {
      for (const offset of [-0.1, 0.1]) {
        const wing = new THREE.Mesh(new THREE.CircleGeometry(0.2, 12), new THREE.MeshStandardMaterial({ color: "#aaddff", transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
        wing.position.set(offset, 0, side * 0.2);
        wing.rotation.x = side * 0.2;
        group.add(wing);
      }
    }
  } else if (type === "ant") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.7 });
    for (let i = 0; i < 3; i++) {
      const segment = new THREE.Mesh(new THREE.SphereGeometry(0.1 - i * 0.02, 10, 8), bodyMat);
      segment.position.x = -0.15 + i * 0.15;
      group.add(segment);
    }
    for (const side of [-1, 1]) {
      for (const x of [-0.1, 0.1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 4), bodyMat);
        leg.position.set(x, 0.1, side * 0.08);
        leg.rotation.z = side * 0.5;
        group.add(leg);
      }
    }
  } else if (type === "apple") {
    const appleMat = new THREE.MeshStandardMaterial({ color: color || "#e63946", roughness: 0.4 });
    const apple = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), appleMat);
    apple.position.y = 0.3;
    apple.scale.set(1, 0.9, 1);
    group.add(apple);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6), new THREE.MeshStandardMaterial({ color: "#5d3a1a" }));
    stem.position.y = 0.65;
    group.add(stem);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: "#2d6a2d" }));
    leaf.position.set(0.1, 0.62, 0);
    leaf.scale.set(1.5, 0.2, 0.6);
    group.add(leaf);
  } else if (type === "orange") {
    const orangeMat = new THREE.MeshStandardMaterial({ color: color || "#ff8800", roughness: 0.4 });
    const orange = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12), orangeMat);
    orange.position.y = 0.32;
    group.add(orange);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshStandardMaterial({ color: "#2d6a2d" }));
    leaf.position.set(0.1, 0.68, 0);
    leaf.scale.set(1.5, 0.2, 0.6);
    group.add(leaf);
  } else if (type === "banana") {
    const bananaMat = new THREE.MeshStandardMaterial({ color: color || "#ffdd44", roughness: 0.5 });
    const banana = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 12, Math.PI * 1.2), bananaMat);
    banana.position.y = 0.2;
    banana.rotation.x = Math.PI / 2;
    group.add(banana);
  } else if (type === "grape") {
    const grapeMat = new THREE.MeshStandardMaterial({ color: color || "#6a3a8a", roughness: 0.3 });
    const clusters: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 0.15;
      clusters.push([Math.cos(angle) * r, 0.2 + (i % 3) * 0.12, Math.sin(angle) * r]);
    }
    clusters.forEach(([x, y, z]) => {
      const grape = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), grapeMat);
      grape.position.set(x, y, z);
      group.add(grape);
    });
  } else if (type === "mango") {
    const mangoMat = new THREE.MeshStandardMaterial({ color: color || "#ffaa33", roughness: 0.4 });
    const mango = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mangoMat);
    mango.position.y = 0.3;
    mango.scale.set(1, 1.2, 0.8);
    group.add(mango);
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: "#2d6a2d" }));
    leaf.position.set(0.08, 0.65, 0);
    leaf.scale.set(1.5, 0.2, 0.6);
    group.add(leaf);
  } else if (type === "watermelon") {
    const rindMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.7 });
    const fleshMat = new THREE.MeshStandardMaterial({ color: "#ff4444", roughness: 0.5 });
    const seedMat = new THREE.MeshStandardMaterial({ color: "#1a1a1a", roughness: 0.6 });
    const rind = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), rindMat);
    rind.position.y = 0.25;
    group.add(rind);
    const flesh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 20), fleshMat);
    flesh.position.y = 0.28;
    group.add(flesh);
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const seed = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), seedMat);
      seed.position.set(Math.cos(angle) * 0.2, 0.3, Math.sin(angle) * 0.2);
      group.add(seed);
    }
  } else if (type === "daisy") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.9 });
    const petalMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 });
    const centerMat = new THREE.MeshStandardMaterial({ color: "#ffdd00", roughness: 0.5 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8), stemMat);
    stem.position.y = 0.4;
    group.add(stem);
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), petalMat);
      petal.position.set(Math.cos(angle) * 0.2, 0.9, Math.sin(angle) * 0.2);
      petal.scale.set(1, 0.3, 0.5);
      group.add(petal);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), centerMat);
    center.position.y = 0.9;
    group.add(center);
  } else if (type === "orchid") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.9 });
    const petalMat = new THREE.MeshStandardMaterial({ color: color || "#da70d6", roughness: 0.5 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), stemMat);
    stem.position.y = 0.6;
    group.add(stem);
    for (let i = 0; i < 3; i++) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), petalMat);
      flower.position.set((i - 1) * 0.2, 1.2 + i * 0.15, 0);
      group.add(flower);
    }
  } else if (type === "hibiscus") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.9 });
    const petalMat = new THREE.MeshStandardMaterial({ color: color || "#ff3366", roughness: 0.5 });
    const centerMat = new THREE.MeshStandardMaterial({ color: "#ffdd00", roughness: 0.5 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8), stemMat);
    stem.position.y = 0.4;
    group.add(stem);
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), petalMat);
      petal.position.set(Math.cos(angle) * 0.2, 0.9, Math.sin(angle) * 0.2);
      petal.scale.set(1, 0.4, 0.6);
      petal.rotation.y = -angle;
      group.add(petal);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), centerMat);
    center.position.y = 0.9;
    group.add(center);
  } else if (type === "bougainvillea") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#5d3a1a", roughness: 0.9 });
    const bractMat = new THREE.MeshStandardMaterial({ color: color || "#ff1493", roughness: 0.5 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1, 8), stemMat);
    trunk.position.y = 0.5;
    group.add(trunk);
    const clusters: [number, number, number][] = [
      [0, 1.2, 0], [0.2, 1.3, 0.1], [-0.2, 1.2, -0.1], [0.1, 1.4, -0.2], [-0.1, 1.35, 0.2],
    ];
    clusters.forEach(([x, y, z]) => {
      const cluster = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), bractMat);
      cluster.position.set(x, y, z);
      group.add(cluster);
    });
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
// FRUIT GEOMETRIES V2 (Pineapple, Coconut, Strawberry, Cherry, Lemon, Peach)
// ============================================================

export function createFruitGeometry2(
  THREE: typeof import("three"),
  type: "pineapple" | "coconut" | "strawberry" | "cherry" | "lemon" | "peach",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "pineapple") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: color || "#e8b04a", roughness: roughness ?? 0.7 });
    const leafMat = new THREE.MeshStandardMaterial({ color: "#2d7a2d", roughness: 0.8 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.7, 12), bodyMat);
    body.position.y = 0.35;
    group.add(body);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 4), leafMat);
      leaf.position.set(Math.cos(angle) * 0.15, 0.8, Math.sin(angle) * 0.15);
      leaf.rotation.z = Math.cos(angle) * 0.3;
      leaf.rotation.x = Math.sin(angle) * 0.3;
      group.add(leaf);
    }
    // Crosshatch pattern (diamond texture approximation)
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        const diamond = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), new THREE.MeshStandardMaterial({ color: "#a87a2a", roughness: 0.9 }));
        diamond.position.set(-0.15 + i * 0.075, 0.15 + j * 0.15, 0.31);
        diamond.rotation.z = Math.PI / 4;
        group.add(diamond);
      }
    }
  } else if (type === "coconut") {
    const shellMat = new THREE.MeshStandardMaterial({ color: color || "#6b4423", roughness: roughness ?? 0.9 });
    const meatMat = new THREE.MeshStandardMaterial({ color: "#f5f0e0", roughness: 0.7 });
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), shellMat);
    shell.position.y = 0.3;
    group.add(shell);
    // Coconut face (3 holes)
    for (const [x, y] of [[-0.1, 0.15], [0.1, 0.15], [0, 0]]) {
      const hole = new THREE.Mesh(new THREE.CircleGeometry(0.03, 8), new THREE.MeshStandardMaterial({ color: "#2a1a0a" }));
      hole.position.set(x, 0.3 + y, 0.29);
      group.add(hole);
    }
    // Cracked open half
    const half = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), meatMat);
    half.position.set(0.5, 0.28, 0);
    half.rotation.x = Math.PI;
    half.scale.set(1, 0.6, 1);
    group.add(half);
  } else if (type === "strawberry") {
    const berryMat = new THREE.MeshStandardMaterial({ color: color || "#e63946", roughness: roughness ?? 0.4 });
    const seedMat = new THREE.MeshStandardMaterial({ color: "#ffdd44", roughness: 0.5 });
    const leafMat = new THREE.MeshStandardMaterial({ color: "#2d7a2d", roughness: 0.8 });
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), berryMat);
    berry.position.y = 0.25;
    berry.scale.set(1, 1.2, 1);
    group.add(berry);
    // Seeds
    for (let i = 0; i < 20; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const seed = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 4), seedMat);
      seed.position.set(
        Math.sin(phi) * Math.cos(theta) * 0.24,
        0.25 + Math.cos(phi) * 0.28,
        Math.sin(phi) * Math.sin(theta) * 0.24
      );
      group.add(seed);
    }
    // Crown leaves
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 4), leafMat);
      leaf.position.set(Math.cos(angle) * 0.08, 0.55, Math.sin(angle) * 0.08);
      leaf.rotation.z = Math.cos(angle) * 0.5;
      group.add(leaf);
    }
  } else if (type === "cherry") {
    const cherryMat = new THREE.MeshStandardMaterial({ color: color || "#cc0000", roughness: roughness ?? 0.3 });
    const stemMat = new THREE.MeshStandardMaterial({ color: "#5d3a1a", roughness: 0.9 });
    // Two cherries
    for (const x of [-0.12, 0.12]) {
      const cherry = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), cherryMat);
      cherry.position.set(x, 0.2, 0);
      group.add(cherry);
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.3, 4), stemMat);
      stem.position.set(x, 0.4, 0);
      stem.rotation.z = x * 2;
      group.add(stem);
    }
    // Leaf
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshStandardMaterial({ color: "#2d6a2d" }));
    leaf.position.set(0, 0.55, 0);
    leaf.scale.set(1.5, 0.2, 0.6);
    group.add(leaf);
  } else if (type === "lemon") {
    const lemonMat = new THREE.MeshStandardMaterial({ color: color || "#ffdd44", roughness: roughness ?? 0.4 });
    const lemon = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), lemonMat);
    lemon.position.y = 0.3;
    lemon.scale.set(1.2, 0.9, 0.9);
    group.add(lemon);
    // Pointed ends
    for (const x of [-0.3, 0.3]) {
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 8), lemonMat);
      tip.position.set(x, 0.3, 0);
      tip.rotation.z = x > 0 ? -Math.PI / 2 : Math.PI / 2;
      group.add(tip);
    }
  } else if (type === "peach") {
    const peachMat = new THREE.MeshStandardMaterial({ color: color || "#ffaa77", roughness: roughness ?? 0.4 });
    const leafMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.8 });
    const peach = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), peachMat);
    peach.position.y = 0.3;
    peach.scale.set(1, 1.1, 1);
    group.add(peach);
    // Crease
    const crease = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.5, 0.02), new THREE.MeshStandardMaterial({ color: "#cc6655" }));
    crease.position.set(0, 0.3, 0.25);
    group.add(crease);
    // Leaf
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), leafMat);
    leaf.position.set(0.1, 0.6, 0);
    leaf.scale.set(1.5, 0.2, 0.6);
    group.add(leaf);
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
// MUSHROOM2 & CACTUS2 GEOMETRIES
// ============================================================

export function createPlantExtraGeometry(
  THREE: typeof import("three"),
  type: "mushroom2" | "cactus2",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "mushroom2") {
    const stemMat = new THREE.MeshStandardMaterial({ color: "#f5f0e0", roughness: roughness ?? 0.8 });
    const capMat = new THREE.MeshStandardMaterial({ color: color || "#c0392b", roughness: 0.6 });
    const spotMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.8, 12), stemMat);
    stem.position.y = 0.4;
    group.add(stem);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), capMat);
    cap.position.y = 0.8;
    cap.scale.set(1, 0.7, 1);
    group.add(cap);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r = 0.15 + Math.random() * 0.15;
      const spot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), spotMat);
      spot.position.set(Math.cos(angle) * r, 0.8 + Math.sqrt(Math.max(0, 0.45 * 0.45 - r * r)) * 0.7, Math.sin(angle) * r);
      spot.scale.set(1, 0.3, 1);
      group.add(spot);
    }
  } else if (type === "cactus2") {
    const cactusMat = new THREE.MeshStandardMaterial({ color: color || "#3a8a3a", roughness: roughness ?? 0.8 });
    const spineMat = new THREE.MeshStandardMaterial({ color: "#e8e8c0", roughness: 0.6 });
    const flowerMat = new THREE.MeshStandardMaterial({ color: "#ff69b4", roughness: 0.4 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.8, 12), cactusMat);
    trunk.position.y = 0.9;
    group.add(trunk);
    // Arms
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.8, 10), cactusMat);
      arm.position.set(side * 0.35, 1.2, 0);
      arm.rotation.z = side * -0.7;
      group.add(arm);
      const armTop = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 10), cactusMat);
      armTop.position.set(side * 0.7, 1.55, 0);
      group.add(armTop);
    }
    // Spines
    for (let i = 0; i < 15; i++) {
      const spine = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 4), spineMat);
      const angle = (i / 15) * Math.PI * 2;
      spine.position.set(Math.cos(angle) * 0.26, 0.2 + i * 0.11, Math.sin(angle) * 0.26);
      spine.rotation.z = Math.PI / 2;
      spine.rotation.y = angle;
      group.add(spine);
    }
    // Flower
    const flower = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), flowerMat);
    flower.position.y = 1.9;
    flower.scale.set(1, 0.5, 1);
    group.add(flower);
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
// PARK & FURNITURE GEOMETRIES (Book, Lamp Post, Bench, Mailbox, Fountain2, Swing, Slide, Sandbox)
// ============================================================

export function createParkGeometry(
  THREE: typeof import("three"),
  type: "book" | "lamppost" | "bench" | "mailbox" | "fountain2" | "swing" | "slide" | "sandbox",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "book") {
    const coverMat = new THREE.MeshStandardMaterial({ color: color || "#8b4513", roughness: roughness ?? 0.7, metalness: metalness ?? 0.1 });
    const pageMat = new THREE.MeshStandardMaterial({ color: "#f5f0e0", roughness: 0.9 });
    const book = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.55), coverMat);
    book.position.y = 0.04;
    group.add(book);
    const pages = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.06, 0.52), pageMat);
    pages.position.y = 0.04;
    group.add(pages);
    // Spine
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.55), coverMat);
    spine.position.set(-0.2, 0.04, 0);
    group.add(spine);
  } else if (type === "lamppost") {
    const poleMat = new THREE.MeshStandardMaterial({ color: color || "#2a2a2a", roughness: roughness ?? 0.6, metalness: metalness ?? 0.8 });
    const glassMat = new THREE.MeshStandardMaterial({ color: "#ffffaa", emissive: "#ffff44", emissiveIntensity: 0.8, roughness: 0.3, transparent: true, opacity: 0.8 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.2, 8), poleMat);
    base.position.y = 0.1;
    group.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.5, 8), poleMat);
    pole.position.y = 1.35;
    group.add(pole);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 8), poleMat);
    top.position.y = 2.7;
    group.add(top);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), glassMat);
    lamp.position.y = 2.55;
    group.add(lamp);
    // Arms
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.05), poleMat);
      arm.position.set(side * 0.2, 2.2, 0);
      group.add(arm);
      const sideLamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), glassMat);
      sideLamp.position.set(side * 0.4, 2.2, 0);
      group.add(sideLamp);
    }
  } else if (type === "bench") {
    const woodMat = new THREE.MeshStandardMaterial({ color: color || "#8b4513", roughness: roughness ?? 0.8 });
    const ironMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.6, metalness: 0.8 });
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.5), woodMat);
    seat.position.y = 0.5;
    group.add(seat);
    // Back
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.08), woodMat);
    back.position.set(0, 0.8, -0.21);
    group.add(back);
    // Legs (iron)
    for (const x of [-0.7, 0.7]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.4), ironMat);
      leg.position.set(x, 0.25, 0);
      group.add(leg);
    }
  } else if (type === "mailbox") {
    const postMat = new THREE.MeshStandardMaterial({ color: "#5a5a5a", roughness: 0.7, metalness: 0.5 });
    const boxMat = new THREE.MeshStandardMaterial({ color: color || "#cc0000", roughness: roughness ?? 0.5 });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), postMat);
    post.position.y = 0.6;
    group.add(post);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.5), boxMat);
    box.position.y = 1.35;
    group.add(box);
    // Rounded top
    const rounded = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.5, 12, 1, false, 0, Math.PI), boxMat);
    rounded.rotation.z = Math.PI / 2;
    rounded.rotation.y = Math.PI / 2;
    rounded.position.y = 1.53;
    group.add(rounded);
    // Flag
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.08), new THREE.MeshStandardMaterial({ color: "#ff0000" }));
    flag.position.set(0.16, 1.5, 0);
    group.add(flag);
  } else if (type === "fountain2") {
    const stoneMat = new THREE.MeshStandardMaterial({ color: color || "#d0d0d0", roughness: roughness ?? 0.9 });
    const waterMat = new THREE.MeshStandardMaterial({ color: "#4fc3f7", roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.85 });
    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.3, 24), stoneMat);
    base.position.y = 0.15;
    group.add(base);
    // Water basin
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.32;
    group.add(water);
    // Central column
    const column = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.2, 12), stoneMat);
    column.position.y = 0.9;
    group.add(column);
    // Upper bowl
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.3, 0.15, 16), stoneMat);
    bowl.position.y = 1.55;
    group.add(bowl);
    // Upper water
    const upperWater = new THREE.Mesh(new THREE.CircleGeometry(0.5, 16), waterMat);
    upperWater.rotation.x = -Math.PI / 2;
    upperWater.position.y = 1.63;
    group.add(upperWater);
    // Spray particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const drop = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), waterMat);
      drop.position.set(Math.cos(angle) * 0.3, 1.8 + Math.random() * 0.3, Math.sin(angle) * 0.3);
      group.add(drop);
    }
  } else if (type === "swing") {
    const metalMat = new THREE.MeshStandardMaterial({ color: color || "#4a90d9", roughness: roughness ?? 0.5, metalness: metalness ?? 0.6 });
    const seatMat = new THREE.MeshStandardMaterial({ color: "#8b4513", roughness: 0.8 });
    // Two side frames (A-frame)
    for (const x of [-1, 1]) {
      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.08), metalMat);
      frame.position.set(x * 0.7, 0.9, 0);
      frame.rotation.z = x * 0.2;
      group.add(frame);
      const frame2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.8, 0.08), metalMat);
      frame2.position.set(x * 0.7, 0.9, 0);
      frame2.rotation.z = x * -0.2;
      group.add(frame2);
    }
    // Top bar
    const topBar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8), metalMat);
    topBar.rotation.z = Math.PI / 2;
    topBar.position.y = 1.75;
    group.add(topBar);
    // Ropes
    for (const x of [-0.3, 0.3]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.2, 6), new THREE.MeshStandardMaterial({ color: "#3a2a1a" }));
      rope.position.set(x, 1.15, 0);
      group.add(rope);
    }
    // Seat
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.3), seatMat);
    seat.position.y = 0.55;
    group.add(seat);
  } else if (type === "slide") {
    const metalMat = new THREE.MeshStandardMaterial({ color: color || "#ff6b6b", roughness: roughness ?? 0.4, metalness: metalness ?? 0.5 });
    const ladderMat = new THREE.MeshStandardMaterial({ color: "#4a90d9", roughness: 0.5, metalness: 0.6 });
    // Ladder
    for (const x of [-0.25, 0.25]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.8, 0.06), ladderMat);
      rail.position.set(x, 0.9, -0.5);
      group.add(rail);
    }
    for (let i = 0; i < 4; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.04, 0.1), ladderMat);
      step.position.set(0, 0.4 + i * 0.4, -0.5);
      group.add(step);
    }
    // Platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.7), metalMat);
    platform.position.set(0, 1.75, -0.15);
    group.add(platform);
    // Slide (angled)
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 1.8), metalMat);
    slide.position.set(0, 0.9, 0.6);
    slide.rotation.x = 0.5;
    group.add(slide);
    // Side rails on slide
    for (const x of [-0.3, 0.3]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 1.8), metalMat);
      rail.position.set(x, 1.0, 0.6);
      rail.rotation.x = 0.5;
      group.add(rail);
    }
  } else if (type === "sandbox") {
    const woodMat = new THREE.MeshStandardMaterial({ color: color || "#8b4513", roughness: roughness ?? 0.8 });
    const sandMat = new THREE.MeshStandardMaterial({ color: "#e8c88a", roughness: 0.95 });
    // Wooden frame (4 sides)
    for (const [x, z, w, d] of [[0, -0.75, 1.6, 0.1], [0, 0.75, 1.6, 0.1], [-0.75, 0, 0.1, 1.6], [0.75, 0, 0.1, 1.6]]) {
      const board = new THREE.Mesh(new THREE.BoxGeometry(w, 0.2, d), woodMat);
      board.position.set(x, 0.1, z);
      group.add(board);
    }
    // Sand
    const sand = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 1.4), sandMat);
    sand.position.y = 0.1;
    group.add(sand);
    // Small bucket
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.15, 12), new THREE.MeshStandardMaterial({ color: "#ffdd00", roughness: 0.5 }));
    bucket.position.set(0.3, 0.22, 0.3);
    group.add(bucket);
    // Shovel
    const shovel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.02, 0.3), new THREE.MeshStandardMaterial({ color: "#ff6600" }));
    shovel.position.set(-0.3, 0.16, 0.2);
    group.add(shovel);
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
// STREET & OUTDOOR GEOMETRIES (Street Sign, Traffic Cone, Barrier, Fire Hydrant, Trash Can, Bench2, Picnic Table, BBQ Grill)
// ============================================================

export function createStreetGeometry(
  THREE: typeof import("three"),
  type: "streetsign" | "trafficcone" | "barrier" | "firehydrant" | "trashcan" | "bench2" | "picnictable" | "bbqgrill",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "streetsign") {
    const poleMat = new THREE.MeshStandardMaterial({ color: "#5a5a5a", roughness: roughness ?? 0.6, metalness: metalness ?? 0.7 });
    const signMat = new THREE.MeshStandardMaterial({ color: color || "#2a7a2a", roughness: 0.5 });
    const textMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.5, 8), poleMat);
    pole.position.y = 1.25;
    group.add(pole);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.05), signMat);
    sign.position.set(0.3, 2.3, 0);
    group.add(sign);
    // Text strips
    for (let i = 0; i < 3; i++) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.01), textMat);
      strip.position.set(0.3, 2.25 + i * 0.05, 0.03);
      group.add(strip);
    }
    const sign2 = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.05), signMat);
    sign2.position.set(-0.2, 1.9, 0);
    sign2.rotation.y = Math.PI;
    group.add(sign2);
  } else if (type === "trafficcone") {
    const coneMat = new THREE.MeshStandardMaterial({ color: color || "#ff6b00", roughness: roughness ?? 0.6 });
    const stripeMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.6 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.35), coneMat);
    base.position.y = 0.025;
    group.add(base);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.6, 12), coneMat);
    cone.position.y = 0.35;
    group.add(cone);
    // White stripe
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.1, 12), stripeMat);
    stripe.position.y = 0.4;
    group.add(stripe);
  } else if (type === "barrier") {
    const redMat = new THREE.MeshStandardMaterial({ color: color || "#cc0000", roughness: roughness ?? 0.5 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.5 });
    const legMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.6, metalness: 0.7 });
    // Horizontal bar
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.08), redMat);
    bar.position.y = 1;
    group.add(bar);
    // White stripes
    for (let i = 0; i < 4; i++) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.09), whiteMat);
      stripe.position.set(-0.6 + i * 0.4, 1, 0);
      group.add(stripe);
    }
    // Legs
    for (const x of [-0.7, 0.7]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1, 0.5), legMat);
      leg.position.set(x, 0.5, 0);
      group.add(leg);
    }
  } else if (type === "firehydrant") {
    const redMat = new THREE.MeshStandardMaterial({ color: color || "#cc0000", roughness: roughness ?? 0.6 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.1, 12), redMat);
    base.position.y = 0.05;
    group.add(base);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.5, 12), redMat);
    body.position.y = 0.35;
    group.add(body);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), redMat);
    top.position.y = 0.6;
    top.scale.set(1, 0.6, 1);
    group.add(top);
    // Side caps
    for (const side of [-1, 1]) {
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 8), redMat);
      cap.rotation.z = Math.PI / 2;
      cap.position.set(side * 0.18, 0.35, 0);
      group.add(cap);
    }
  } else if (type === "trashcan") {
    const bodyMat = new THREE.MeshStandardMaterial({ color: color || "#2a5a2a", roughness: roughness ?? 0.7, metalness: metalness ?? 0.3 });
    const lidMat = new THREE.MeshStandardMaterial({ color: "#1a3a1a", roughness: 0.6, metalness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.25, 0.8, 16), bodyMat);
    body.position.y = 0.4;
    group.add(body);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 16), lidMat);
    lid.position.y = 0.84;
    group.add(lid);
    // Vertical ribs
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.7, 0.03), lidMat);
      rib.position.set(Math.cos(angle) * 0.28, 0.4, Math.sin(angle) * 0.28);
      group.add(rib);
    }
  } else if (type === "bench2") {
    const woodMat = new THREE.MeshStandardMaterial({ color: color || "#a0522d", roughness: roughness ?? 0.8 });
    const metalMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.6, metalness: 0.7 });
    // Curved seat (multiple planks)
    for (let i = 0; i < 5; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.08), woodMat);
      plank.position.set(0, 0.5, -0.2 + i * 0.1);
      group.add(plank);
    }
    // Curved back
    for (let i = 0; i < 4; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.05, 0.08), woodMat);
      plank.position.set(0, 0.7 + i * 0.1, -0.3 - i * 0.02);
      plank.rotation.x = -0.1 * i;
      group.add(plank);
    }
    // Metal legs
    for (const x of [-0.75, 0.75]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 0.5), metalMat);
      leg.position.set(x, 0.25, 0);
      group.add(leg);
    }
  } else if (type === "picnictable") {
    const woodMat = new THREE.MeshStandardMaterial({ color: color || "#a0522d", roughness: roughness ?? 0.8 });
    // Table top
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.8), woodMat);
    top.position.y = 0.75;
    group.add(top);
    // Table legs (A-frame)
    for (const x of [-0.6, 0.6]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), woodMat);
      leg.position.set(x, 0.375, 0);
      group.add(leg);
    }
    // Seats
    for (const side of [-1, 1]) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.3), woodMat);
      seat.position.set(0, 0.45, side * 0.55);
      group.add(seat);
      // Seat supports
      for (const x of [-0.6, 0.6]) {
        const sup = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.08), woodMat);
        sup.position.set(x, 0.225, side * 0.55);
        group.add(sup);
      }
    }
  } else if (type === "bbqgrill") {
    const metalMat = new THREE.MeshStandardMaterial({ color: color || "#2a2a2a", roughness: roughness ?? 0.5, metalness: metalness ?? 0.8 });
    const fireMat = new THREE.MeshStandardMaterial({ color: "#ff4400", emissive: "#ff2200", emissiveIntensity: 1.5, roughness: 0.5 });
    // Legs
    for (const [x, z] of [[-0.3, -0.2], [-0.3, 0.2], [0.3, -0.2], [0.3, 0.2]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 6), metalMat);
      leg.position.set(x, 0.4, z);
      group.add(leg);
    }
    // Grill body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16), metalMat);
    body.position.y = 0.85;
    group.add(body);
    // Grill grates
    for (let i = 0; i < 5; i++) {
      const grate = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.04), metalMat);
      grate.position.set(0, 1.0, -0.3 + i * 0.15);
      group.add(grate);
    }
    // Fire glow
    for (let i = 0; i < 6; i++) {
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.15, 6), fireMat);
      flame.position.set((Math.random() - 0.5) * 0.5, 0.9, (Math.random() - 0.5) * 0.5);
      group.add(flame);
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
// GARDEN & FARM GEOMETRIES (Playground2, Gnome, Birdhouse, Weather Vane, Sundial, Well, Scarecrow, Hay Bale)
// ============================================================

export function createGardenGeometry(
  THREE: typeof import("three"),
  type: "playground2" | "gnome" | "birdhouse" | "weathervane" | "sundial" | "well" | "scarecrow" | "haybale",
  color?: string,
  metalness?: number,
  roughness?: number
): import("three").Group {
  const group = new THREE.Group();

  if (type === "playground2") {
    const metalMat = new THREE.MeshStandardMaterial({ color: color || "#4a90d9", roughness: roughness ?? 0.5, metalness: metalness ?? 0.6 });
    const seatMat = new THREE.MeshStandardMaterial({ color: "#ff6b6b", roughness: 0.6 });
    // Rotating carousel
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16), metalMat);
    base.position.y = 0.05;
    group.add(base);
    const center = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 12), metalMat);
    center.position.y = 0.4;
    group.add(center);
    // 4 seats
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.1), metalMat);
      arm.position.set(Math.cos(angle) * 0.6, 0.3, Math.sin(angle) * 0.6);
      arm.rotation.y = -angle;
      group.add(arm);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.2), seatMat);
      seat.position.set(Math.cos(angle) * 1.0, 0.3, Math.sin(angle) * 1.0);
      group.add(seat);
    }
    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.4, 12), seatMat);
    roof.position.y = 0.9;
    group.add(roof);
  } else if (type === "gnome") {
    const hatMat = new THREE.MeshStandardMaterial({ color: color || "#cc0000", roughness: roughness ?? 0.7 });
    const skinMat = new THREE.MeshStandardMaterial({ color: "#f4c8a0", roughness: 0.7 });
    const beardMat = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.8 });
    const bodyMat = new THREE.MeshStandardMaterial({ color: "#2d6a2d", roughness: 0.7 });
    // Body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.5, 10), bodyMat);
    body.position.y = 0.25;
    group.add(body);
    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), skinMat);
    head.position.y = 0.6;
    group.add(head);
    // Beard
    const beard = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.25, 8), beardMat);
    beard.position.set(0, 0.5, 0.1);
    beard.rotation.x = -0.2;
    group.add(beard);
    // Hat
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 10), hatMat);
    hat.position.y = 0.85;
    group.add(hat);
  } else if (type === "birdhouse") {
    const woodMat = new THREE.MeshStandardMaterial({ color: color || "#8b4513", roughness: roughness ?? 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: "#cc0000", roughness: 0.7 });
    // Post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.5, 8), woodMat);
    post.position.y = 0.75;
    group.add(post);
    // House
    const house = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.3), woodMat);
    house.position.y = 1.65;
    group.add(house);
    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.25, 4), roofMat);
    roof.position.y = 1.95;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
    // Hole
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.06, 12), new THREE.MeshStandardMaterial({ color: "#1a1a1a" }));
    hole.position.set(0, 1.65, 0.151);
    group.add(hole);
    // Perch
    const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), woodMat);
    perch.rotation.z = Math.PI / 2;
    perch.position.set(0, 1.55, 0.15);
    group.add(perch);
  } else if (type === "weathervane") {
    const metalMat = new THREE.MeshStandardMaterial({ color: "#2a2a2a", roughness: 0.5, metalness: 0.9 });
    const arrowMat = new THREE.MeshStandardMaterial({ color: "#d4a373", roughness: 0.4, metalness: 0.5 });
    // Post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 8), metalMat);
    post.position.y = 0.6;
    group.add(post);
    // N/S/E/W indicators
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.02), metalMat);
      bar.position.set(Math.cos(angle) * 0.2, 1.1, Math.sin(angle) * 0.2);
      bar.rotation.y = -angle;
      group.add(bar);
    }
    // Arrow (rotating)
    const arrowGroup = new THREE.Group();
    arrowGroup.userData.weathervaneArrow = true;
    arrowGroup.position.y = 1.15;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), arrowMat);
    arrowGroup.add(shaft);
    const head = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 6), arrowMat);
    head.rotation.z = -Math.PI / 2;
    head.position.x = 0.3;
    arrowGroup.add(head);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), arrowMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -0.3;
    arrowGroup.add(tail);
    group.add(arrowGroup);
  } else if (type === "sundial") {
    const stoneMat = new THREE.MeshStandardMaterial({ color: color || "#c8b8a0", roughness: roughness ?? 0.9 });
    const metalMat = new THREE.MeshStandardMaterial({ color: "#8a7a5a", metalness: 0.5, roughness: 0.5 });
    // Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.15, 16), stoneMat);
    base.position.y = 0.075;
    group.add(base);
    // Dial plate
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16), stoneMat);
    dial.position.y = 0.18;
    group.add(dial);
    // Roman numerals (approximated as small boxes)
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, 0.06), metalMat);
      mark.position.set(Math.cos(angle) * 0.35, 0.21, Math.sin(angle) * 0.35);
      mark.rotation.y = -angle;
      group.add(mark);
    }
    // Gnomon (triangle-shaped pointer)
    const gnomon = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.5, 4), metalMat);
    gnomon.position.set(0, 0.4, 0);
    gnomon.rotation.x = Math.PI / 4;
    group.add(gnomon);
  } else if (type === "well") {
    const stoneMat = new THREE.MeshStandardMaterial({ color: color || "#8a8a8a", roughness: roughness ?? 0.9 });
    const woodMat = new THREE.MeshStandardMaterial({ color: "#8b4513", roughness: 0.8 });
    const waterMat = new THREE.MeshStandardMaterial({ color: "#4fc3f7", roughness: 0.1, metalness: 0.4, transparent: true, opacity: 0.9 });
    // Stone base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.8, 0.8, 16, 1, true), stoneMat);
    base.position.y = 0.4;
    group.add(base);
    // Water inside
    const water = new THREE.Mesh(new THREE.CircleGeometry(0.6, 16), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.5;
    group.add(water);
    // Wooden posts
    for (const x of [-0.65, 0.65]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.5, 0.08), woodMat);
      post.position.set(x, 1.15, 0);
      group.add(post);
    }
    // Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 0.6, 4), new THREE.MeshStandardMaterial({ color: "#cc0000", roughness: 0.7 }));
    roof.position.y = 2.1;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
    // Bucket
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.15, 10), woodMat);
    bucket.position.set(0, 1.5, 0);
    group.add(bucket);
    // Rope
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.8, 4), new THREE.MeshStandardMaterial({ color: "#3a2a1a" }));
    rope.position.set(0, 1.5, 0);
    group.add(rope);
  } else if (type === "scarecrow") {
    const woodMat = new THREE.MeshStandardMaterial({ color: color || "#8b4513", roughness: roughness ?? 0.9 });
    const clothMat = new THREE.MeshStandardMaterial({ color: "#a0a0a0", roughness: 0.8 });
    const hatMat = new THREE.MeshStandardMaterial({ color: "#5d3a1a", roughness: 0.8 });
    // Cross post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), woodMat);
    post.position.y = 0.9;
    group.add(post);
    const cross = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 8), woodMat);
    cross.rotation.z = Math.PI / 2;
    cross.position.y = 1.5;
    group.add(cross);
    // Shirt
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), clothMat);
    shirt.position.y = 1.3;
    group.add(shirt);
    // Head (burlap sack)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshStandardMaterial({ color: "#d4a373", roughness: 0.9 }));
    head.position.y = 1.75;
    group.add(head);
    // Hat
    const hat = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.3, 12), hatMat);
    hat.position.y = 2.0;
    group.add(hat);
    // Straw hands
    for (const side of [-1, 1]) {
      const straw = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.15, 6), new THREE.MeshStandardMaterial({ color: "#ffdd44", roughness: 0.8 }));
      straw.position.set(side * 0.75, 1.5, 0);
      straw.rotation.z = side * Math.PI / 2;
      group.add(straw);
    }
  } else if (type === "haybale") {
    const hayMat = new THREE.MeshStandardMaterial({ color: color || "#d4a34a", roughness: roughness ?? 0.95 });
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.8, 16), hayMat);
    bale.rotation.x = Math.PI / 2;
    bale.position.y = 0.5;
    group.add(bale);
    // Rope bands
    for (const z of [-0.25, 0.25]) {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.02, 6, 16), new THREE.MeshStandardMaterial({ color: "#5d3a1a" }));
      band.rotation.y = Math.PI / 2;
      band.position.set(0, 0.5, z);
      group.add(band);
    }
    // Straw pieces sticking out
    for (let i = 0; i < 10; i++) {
      const straw = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.15, 4), hayMat);
      const angle = Math.random() * Math.PI * 2;
      straw.position.set(Math.cos(angle) * 0.5, 0.5 + (Math.random() - 0.5) * 0.6, Math.sin(angle) * 0.5);
      straw.rotation.x = Math.random() * Math.PI;
      straw.rotation.z = Math.random() * Math.PI;
      group.add(straw);
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
