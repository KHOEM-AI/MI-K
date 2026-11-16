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
  bodyColor?: string
): import("three").Group {
  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: bodyColor || (type === "car" ? "#1e3a8a" : "#dc2626"),
    metalness: 0.8,
    roughness: 0.3,
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
    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      group.add(wheel);
    });

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
    wheelPositions.forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMaterial);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x, y, z);
      wheel.castShadow = true;
      group.add(wheel);
    });

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
