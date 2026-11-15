import { useEffect, useRef } from "react";

function ModelViewer({ file }: { file: File }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    let active = true;
    let frame = 0;
    let renderer: import("three").WebGLRenderer | null = null;
    let scene: import("three").Scene | null = null;
    let modelUrl: string | null = null;
    let observer: ResizeObserver | null = null;

    const startViewer = async () => {
      try {
        // Load 3D dependencies only when the viewer is opened.
        const [THREE, loaderModule] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
        ]);

        if (!active) return;

        const sceneInstance = new THREE.Scene();
        scene = sceneInstance;
        scene.background = new THREE.Color("#101827");

        const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 10000);
        camera.position.set(4, 3, 5);

        const rendererInstance = new THREE.WebGLRenderer({
          antialias: true,
        });
        renderer = rendererInstance;

        rendererInstance.setPixelRatio(
          Math.min(window.devicePixelRatio, 2)
        );

        container.appendChild(rendererInstance.domElement);

        sceneInstance.add(
          new THREE.HemisphereLight(0xffffff, 0x334455, 2)
        );

        const light = new THREE.DirectionalLight(0xffffff, 2);
        light.position.set(5, 8, 5);
        sceneInstance.add(light);

        modelUrl = URL.createObjectURL(file);

        const loader = new loaderModule.GLTFLoader();

        loader.load(
          modelUrl,
          (gltf) => {
            if (!active) {
              gltf.scene.traverse((object) => {
                if (object instanceof THREE.Mesh) {
                  object.geometry.dispose();
                }
              });
              return;
            }

            const model = gltf.scene;
            sceneInstance.add(model);

            const bounds = new THREE.Box3().setFromObject(model);
            const size = bounds.getSize(new THREE.Vector3());
            const center = bounds.getCenter(new THREE.Vector3());

            model.position.sub(center);

            const largest = Math.max(size.x, size.y, size.z, 1);

            camera.position.set(
              largest * 1.8,
              largest * 1.3,
              largest * 1.8
            );
            camera.lookAt(0, 0, 0);
          },
          undefined,
          () => {
            if (active) {
              console.error("Could not load this 3D model.");
            }
          }
        );

        const resize = () => {
          if (!active) return;

          const width = container.clientWidth;
          const height = container.clientHeight || 400;

          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          rendererInstance.setSize(width, height);
        };

        observer = new ResizeObserver(resize);
        observer.observe(container);
        resize();

        const animate = () => {
          if (!active) return;

          frame = requestAnimationFrame(animate);
          rendererInstance.render(sceneInstance, camera);
        };

        animate();
      } catch (error) {
        if (active) {
          console.error("Could not initialize 3D viewer:", error);
        }
      }
    };

    void startViewer();

    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer?.disconnect();

      if (modelUrl) {
        URL.revokeObjectURL(modelUrl);
      }

      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }

      scene?.traverse((object) => {
        if (object instanceof (object.constructor as typeof Object)) {
          const mesh = object as import("three").Mesh;

          if (mesh.isMesh) {
            mesh.geometry.dispose();

            const materials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];

            materials.forEach((material) => {
              Object.values(material).forEach((value) => {
                if (value && typeof value === "object" && "isTexture" in value) {
                  (value as import("three").Texture).dispose();
                }
              });

              material.dispose();
            });
          }
        }
      });
    };
  }, [file]);

  return <div className="model-viewer" ref={host} />;
}

export default ModelViewer;
