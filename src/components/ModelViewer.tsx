import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function ModelViewer({ file }: { file: File }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#101827");

    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10000);
    camera.position.set(4, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 2));

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(5, 8, 5);
    scene.add(light);

    const url = URL.createObjectURL(file);
    const loader = new GLTFLoader();
    let active = true;
    let frame = 0;

    loader.load(
      url,
      (gltf) => {
        if (!active) return;

        const model = gltf.scene;
        scene.add(model);

        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());

        model.position.sub(center);

        const largest = Math.max(size.x, size.y, size.z, 1);
        camera.position.set(largest * 1.8, largest * 1.3, largest * 1.8);
        camera.lookAt(0, 0, 0);
      },
      undefined,
      () => {
        if (active) console.error("Could not load this 3D model.");
      }
    );

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight || 400;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const animate = () => {
      if (!active) return;
      frame = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      URL.revokeObjectURL(url);
      renderer.dispose();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.domElement.remove();
    };
  }, [file]);

  return <div className="model-viewer" ref={host} />;
}


export default ModelViewer;
