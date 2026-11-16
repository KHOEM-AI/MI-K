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
