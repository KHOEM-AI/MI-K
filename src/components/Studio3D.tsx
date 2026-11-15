import { useEffect, useRef, useState } from "react";
import { saveAsset } from "../lib/storage.mjs";

type Shape = "box" | "sphere" | "cone" | "cylinder" | "torus";

type SceneObject = {
  id: string;
  name: string;
  shape: Shape;
  color: string;
};

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

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function Studio3D({ onAssetSaved }: Studio3DProps) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<import("three").Scene | null>(null);
  const rendererRef = useRef<import("three").WebGLRenderer | null>(null);
  const meshesRef = useRef(
    new Map<string, import("three").Mesh>()
  );

  const [objects, setObjects] = useState<SceneObject[]>([
    {
      id: createId(),
      name: "Cube 1",
      shape: "box",
      color: "#168de2",
    },
  ]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newShape, setNewShape] = useState<Shape>("box");
  const [mode, setMode] = useState<"object" | "ui">("object");
  const [sceneReady, setSceneReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");

  const selectedObject = objects.find(
    (item) => item.id === selectedId
  );

  // Create the Three.js scene and renderer once.
  useEffect(() => {
    let renderer: import("three").WebGLRenderer | undefined;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let cleanup = false;
    let scene: import("three").Scene | undefined;
    let camera: import("three").PerspectiveCamera | undefined;

    async function start() {
      const THREE = await import("three");
      if (cleanup || !canvasHost.current) return;

      scene = new THREE.Scene();
      scene.background = new THREE.Color("#080f1b");

      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(4, 3, 7);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      canvasHost.current.appendChild(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x26344c, 2));

      const light = new THREE.DirectionalLight(0xffffff, 3);
      light.position.set(4, 5, 4);
      scene.add(light);

      const floor = new THREE.GridHelper(
        12,
        12,
        0x31516e,
        0x1b2b40
      );
      floor.position.y = -1.2;
      scene.add(floor);

      sceneRef.current = scene;
      rendererRef.current = renderer;
      setSceneReady(true);

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
        if (cleanup || !renderer || !scene || !camera) return;

        meshesRef.current.forEach((mesh) => {
          mesh.rotation.y += 0.003;
        });

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

      meshesRef.current.forEach((mesh) => {
        mesh.geometry.dispose();
        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material.dispose();
        }
      });
      meshesRef.current.clear();

      renderer?.dispose();
      renderer?.domElement.remove();

      sceneRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  // Rebuild scene objects when the object list or selection changes.
  useEffect(() => {
    let cancelled = false;

    async function updateScene() {
      const THREE = await import("three");
      if (cancelled) return;

      const scene = sceneRef.current;
      if (!sceneReady || !scene) return;

      meshesRef.current.forEach((mesh) => {
        scene.remove(mesh);
        mesh.geometry.dispose();

        const material = mesh.material;
        if (Array.isArray(material)) {
          material.forEach((item) => item.dispose());
        } else {
          material.dispose();
        }
      });
      meshesRef.current.clear();

      objects.forEach((item, index) => {
        const material = new THREE.MeshStandardMaterial({
          color: item.color,
          metalness: 0.25,
          roughness: 0.35,
          emissive:
            item.id === selectedId
              ? new THREE.Color("#183b60")
              : new THREE.Color("#000000"),
        });

        const mesh = new THREE.Mesh(
          createGeometry(THREE, item.shape),
          material
        );

        const columns = 3;
        const spacing = 2.5;
        mesh.position.x =
          ((index % columns) - 1) * spacing;
        mesh.position.z =
          Math.floor(index / columns) * spacing;

        mesh.userData.objectId = item.id;
        scene.add(mesh);
        meshesRef.current.set(item.id, mesh);
      });
    }

    updateScene().catch((error) => {
      console.error("Scene update failed:", error);
      setMessage("មិនអាចធ្វើបច្ចុប្បន្នភាព Scene បានទេ។");
    });

    return () => {
      cancelled = true;
    };
  }, [objects, selectedId, sceneReady]);

  function addObject() {
    const preset = presets.find(
      (item) => item.shape === newShape
    );

    const count =
      objects.filter((item) => item.shape === newShape).length + 1;

    const nextObject: SceneObject = {
      id: createId(),
      name: `${preset?.name ?? "Object"} ${count}`,
      shape: newShape,
      color: "#168de2",
    };

    setObjects((current) => [...current, nextObject]);
    setSelectedId(nextObject.id);
    setMessage(`បានបន្ថែម ${nextObject.name}។`);
  }

  function duplicateObject() {
    if (!selectedObject) return;

    const copy: SceneObject = {
      ...selectedObject,
      id: createId(),
      name: `${selectedObject.name} Copy`,
    };

    setObjects((current) => [...current, copy]);
    setSelectedId(copy.id);
    setMessage(`បានចម្លង ${copy.name}។`);
  }

  function deleteObject() {
    if (!selectedId) return;

    const remaining = objects.filter(
      (item) => item.id !== selectedId
    );

    setObjects(remaining);
    setSelectedId(remaining[remaining.length - 1]?.id ?? null);
    setMessage("បានលុបវត្ថុដែលបានជ្រើស។");
  }

  function updateSelectedColor(value: string) {
    if (!selectedId) return;

    setObjects((current) =>
      current.map((item) =>
        item.id === selectedId
          ? { ...item, color: value }
          : item
      )
    );
  }

  async function exportGLB() {
    if (exporting) return;

    if (objects.length === 0) {
      setMessage("សូមបន្ថែមវត្ថុ 3D មុនពេល Export។");
      return;
    }

    setExporting(true);
    setMessage("កំពុងបង្កើតឯកសារ GLB...");

    let exportScene: import("three").Scene | undefined;

    try {
      const THREE = await import("three");
      const { GLTFExporter } = await import(
        "three/examples/jsm/exporters/GLTFExporter.js"
      );

      exportScene = new THREE.Scene();

      objects.forEach((item, index) => {
        const material = new THREE.MeshStandardMaterial({
          color: item.color,
          metalness: 0.25,
          roughness: 0.35,
        });

        const mesh = new THREE.Mesh(
          createGeometry(THREE, item.shape),
          material
        );

        mesh.position.x = ((index % 3) - 1) * 2.5;
        mesh.position.z = Math.floor(index / 3) * 2.5;
        mesh.name = item.name;
        exportScene?.add(mesh);
      });

      exportScene.updateMatrixWorld(true);

      const exporter = new GLTFExporter();

      const result = await new Promise<ArrayBuffer>(
        (resolve, reject) => {
          exporter.parse(
            exportScene!,
            (output) => {
              if (output instanceof ArrayBuffer) {
                resolve(output);
              } else {
                reject(
                  new Error("GLB binary output was not returned.")
                );
              }
            },
            (error) => reject(error),
            { binary: true }
          );
        }
      );

      const filename = `KHOEM-AI-scene-${Date.now()}.glb`;
      const file = new File([result], filename, {
        type: "model/gltf-binary",
      });

      const savedAsset: StudioAsset = {
        id: createId(),
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

      setMessage(
        `បាន Export វត្ថុ ${objects.length} ក្នុង GLB និងរក្សាទុកក្នុង Asset Library រួចរាល់។`
      );
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
            បង្កើត និងគ្រប់គ្រងវត្ថុ 3D ច្រើនក្នុង Scene តែមួយ។
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
              Add Object
              <select
                value={newShape}
                onChange={(event) =>
                  setNewShape(event.target.value as Shape)
                }
              >
                {presets.map((item) => (
                  <option key={item.shape} value={item.shape}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="upload-button"
              onClick={addObject}
            >
              + Add Object
            </button>
          </div>

          <div className="studio-canvas" ref={canvasHost}>
            <span className="studio-hint">3D LIVE PREVIEW</span>
          </div>

          <div className="studio-object-manager">
            <h3>Scene Objects ({objects.length})</h3>

            {objects.length === 0 ? (
              <p className="studio-note">
                មិនទាន់មានវត្ថុទេ។ សូមចុច Add Object។
              </p>
            ) : (
              <div className="studio-object-list">
                {objects.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={
                      selectedId === item.id
                        ? "studio-object-item selected"
                        : "studio-object-item"
                    }
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span
                      className="studio-object-swatch"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                    <small>{item.shape}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedObject && (
            <div className="studio-controls">
              <label>
                Selected Object
                <input value={selectedObject.name} readOnly />
              </label>

              <label>
                Material Color
                <input
                  type="color"
                  value={selectedObject.color}
                  onChange={(event) =>
                    updateSelectedColor(event.target.value)
                  }
                />
              </label>

              <button
                type="button"
                className="filter"
                onClick={duplicateObject}
              >
                Duplicate
              </button>

              <button
                type="button"
                className="filter"
                onClick={deleteObject}
              >
                Delete
              </button>
            </div>
          )}

          <div className="studio-export">
            <button
              type="button"
              className="upload-button"
              onClick={exportGLB}
              disabled={exporting || objects.length === 0}
            >
              {exporting
                ? "Exporting..."
                : `Export ${objects.length} Object(s) as GLB`}
            </button>
          </div>

          {message && (
            <p className="backup-message" role="status">
              {message}
            </p>
          )}

          <p className="studio-note">
            អាចបន្ថែម ជ្រើសរើស ប្ដូរពណ៌ ចម្លង និងលុបវត្ថុ 3D។
            Export GLB នឹងរួមបញ្ចូលវត្ថុទាំងអស់ក្នុង Scene។
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
