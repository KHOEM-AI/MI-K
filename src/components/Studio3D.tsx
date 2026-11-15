import { useEffect, useRef, useState } from "react";
import { saveAsset } from "../lib/storage.mjs";

type Shape = "box" | "sphere" | "cone" | "cylinder" | "torus";

const presets: { name: string; shape: Shape }[] = [
  { name: "Cube", shape: "box" },
  { name: "Sphere", shape: "sphere" },
  { name: "Cone", shape: "cone" },
  { name: "Cylinder", shape: "cylinder" },
  { name: "Ring", shape: "torus" },
];

function createGeometry(THREE: typeof import("three"), shape: Shape) {
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

type StudioAsset = {
  id: string;
  file: File;
  kind: "model";
};

type Studio3DProps = {
  onAssetSaved?: (asset: StudioAsset) => void;
};

export default function Studio3D({ onAssetSaved }: Studio3DProps) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const [shape, setShape] = useState<Shape>("box");
  const [color, setColor] = useState("#168de2");
  const [mode, setMode] = useState<"object" | "ui">("object");
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let renderer: import("three").WebGLRenderer | undefined;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let cleanup = false;
    let mesh: import("three").Mesh | undefined;
    let scene: import("three").Scene | undefined;
    let camera: import("three").PerspectiveCamera | undefined;

    async function start() {
      const THREE = await import("three");
      if (cleanup || !canvasHost.current) return;

      scene = new THREE.Scene();
      scene.background = new THREE.Color("#080f1b");

      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(3, 2.5, 5);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      canvasHost.current.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x26344c, 2));

      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(4, 5, 4);
      scene.add(light);

      const floor = new THREE.GridHelper(10, 10, 0x31516e, 0x1b2b40);
      floor.position.y = -1.2;
      scene.add(floor);

      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.25,
        roughness: 0.35,
      });

      mesh = new THREE.Mesh(createGeometry(THREE, shape), material);
      scene.add(mesh);

      const resize = () => {
        if (!renderer || !camera || !canvasHost.current) return;
        const width = canvasHost.current.clientWidth;
        const height = canvasHost.current.clientHeight;
        if (!width || !height) return;

        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      observer = new ResizeObserver(resize);
      observer.observe(canvasHost.current);
      resize();

      const animate = () => {
        if (cleanup || !renderer || !scene || !camera || !mesh) return;
        mesh.rotation.y += 0.006;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };

      animate();
    }

    start().catch((error) => {
      console.error("3D Studio failed:", error);
      setMessage("មិនអាចបើក 3D Preview បានទេ។");
    });

    return () => {
      cleanup = true;
      cancelAnimationFrame(frame);
      observer?.disconnect();

      if (mesh) {
        mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material.dispose();
        }
      }

      renderer?.dispose();
      renderer?.domElement.remove();
    };
  }, [shape, color]);

  async function exportGLB() {
    if (exporting) return;

    setExporting(true);
    setMessage("កំពុងបង្កើតឯកសារ GLB...");

    try {
      const THREE = await import("three");
      const { GLTFExporter } = await import(
        "three/examples/jsm/exporters/GLTFExporter.js"
      );

      const scene = new THREE.Scene();

      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.25,
        roughness: 0.35,
      });

      const mesh = new THREE.Mesh(
        createGeometry(THREE, shape),
        material
      );

      scene.add(mesh);
      scene.updateMatrixWorld(true);

      const exporter = new GLTFExporter();

      const result = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(
          scene,
          (output) => {
            if (output instanceof ArrayBuffer) {
              resolve(output);
            } else {
              reject(new Error("GLB binary output was not returned."));
            }
          },
          (error) => reject(error),
          { binary: true }
        );
      });

      const filename = `KHOEM-AI-${shape}-${Date.now()}.glb`;
      const file = new File([result], filename, {
        type: "model/gltf-binary",
      });

      const savedAsset: StudioAsset = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        kind: "model",
      };

      await saveAsset(savedAsset);
      onAssetSaved?.(savedAsset);

      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);

      setMessage(`បានរក្សាទុក ${filename} ក្នុង Asset Library និងទាញយករួចរាល់។`);

      mesh.geometry.dispose();
      material.dispose();
    } catch (error) {
      console.error("GLB export failed:", error);
      setMessage(
        error instanceof Error
          ? `Export failed: ${error.message}`
          : "មិនអាច Export GLB បានទេ។"
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <section className="studio-panel">
      <div className="studio-heading">
        <div>
          <p className="eyebrow">KHOEM-AI CREATION WORKSPACE</p>
          <h2>3D Studio</h2>
          <p className="description">
            បង្កើត និងមើលវត្ថុ 3D ព្រមទាំងរចនា UI។
          </p>
        </div>
        <span className="file-type">3D WORKSPACE</span>
      </div>

      <div className="studio-tabs">
        <button
          className={mode === "object" ? "filter active" : "filter"}
          onClick={() => setMode("object")}
        >
          3D Objects
        </button>
        <button
          className={mode === "ui" ? "filter active" : "filter"}
          onClick={() => setMode("ui")}
        >
          3D UI Design
        </button>
      </div>

      {mode === "object" ? (
        <>
          <div className="studio-controls">
            <label>
              Object Type
              <select
                value={shape}
                onChange={(event) =>
                  setShape(event.target.value as Shape)
                }
              >
                {presets.map((item) => (
                  <option key={item.shape} value={item.shape}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Material Color
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
              />
            </label>
          </div>

          <div className="studio-canvas" ref={canvasHost}>
            <span className="studio-hint">3D LIVE PREVIEW</span>
          </div>

          <div className="studio-export">
            <button
              type="button"
              className="upload-button"
              onClick={exportGLB}
              disabled={exporting}
            >
              {exporting ? "Exporting..." : "Export GLB + Save Library"}
            </button>
          </div>

          {message && (
            <p className="backup-message" role="status">
              {message}
            </p>
          )}

          <p className="studio-note">
            អាច Export រាង 3D មូលដ្ឋានទាំង ៥ ជាឯកសារ GLB។
            ឯកសារនឹងត្រូវបានរក្សាទុកក្នុង Asset Library។
          </p>
        </>
      ) : (
        <div className="ui-design-preview">
          <p className="eyebrow">3D INTERFACE PREVIEW</p>
          <div className="ui-logo-preview">KA</div>
          <h3>KHOEM-AI</h3>
          <div className="ui-card-preview">
            <span>3D CARD COMPONENT</span>
            <button type="button">ACTION BUTTON</button>
          </div>
          <p className="studio-note">
            នេះជាគំរូ UI បែប 3D ដំបូង។
          </p>
        </div>
      )}
    </section>
  );
}
