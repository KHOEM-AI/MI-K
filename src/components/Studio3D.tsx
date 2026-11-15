import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Unlock, Pencil } from "lucide-react";
import { saveAsset } from "../lib/storage.mjs";
import {
  listScenes,
  saveScene,
  deleteScene,
  loadScene,
  serializeSceneSnapshot,
  parseImportedScene,
  writeAutobackup,
  readAutobackup,
  clearAutobackup,
} from "../lib/sceneStorage.mjs";
import type {
  SceneSnapshot,
  AutobackupData,
} from "../lib/sceneStorage.mjs";

type Shape = "box" | "sphere" | "cone" | "cylinder" | "torus";
type Vector3 = { x: number; y: number; z: number };

type SceneObject = {
  id: string;
  name: string;
  shape: Shape;
  color: string;
  metalness: number;
  roughness: number;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  visible?: boolean;
  locked?: boolean;
  textureData?: string | null;
};

type StudioAsset = {
  id: string;
  file: File;
  kind: "model";
};

type Studio3DProps = {
  onAssetSaved?: (asset: StudioAsset) => void;
};

const presets: { name: string; shape: Shape }[] = [
  { name: "Cube", shape: "box" },
  { name: "Sphere", shape: "sphere" },
  { name: "Cone", shape: "cone" },
  { name: "Cylinder", shape: "cylinder" },
  { name: "Ring", shape: "torus" },
];

const zero = (): Vector3 => ({ x: 0, y: 0, z: 0 });
const one = (): Vector3 => ({ x: 1, y: 1, z: 1 });

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function serializeForBaseline(
  objs: SceneObject[],
  ambient: number,
  directional: number
): string {
  return JSON.stringify({
    objects: objs,
    ambientIntensity: ambient,
    directionalIntensity: directional,
  });
}

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

function disposeMesh(mesh: import("three").Mesh) {
  mesh.geometry.dispose();
  const material = mesh.material;
  if (Array.isArray(material)) {
    material.forEach((item) => {
      if ((item as any).map) (item as any).map.dispose();
      item.dispose();
    });
  } else {
    if ((material as any).map) (material as any).map.dispose();
    material.dispose();
  }
}

export default function Studio3D({ onAssetSaved }: Studio3DProps) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<import("three").Scene | null>(null);
  const meshesRef = useRef(new Map<string, import("three").Mesh>());
  const controlsRef = useRef<import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | null>(null);
  const hemiLightRef = useRef<import("three").HemisphereLight | null>(null);
  const dirLightRef = useRef<import("three").DirectionalLight | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [objects, setObjects] = useState<SceneObject[]>([
    {
      id: createId(),
      name: "Cube 1",
      shape: "box",
      color: "#168de2",
      metalness: 0.25,
      roughness: 0.35,
      position: zero(),
      rotation: zero(),
      scale: one(),
      visible: true,
      locked: false,
      textureData: null,
    },
  ]);

  const [history, setHistory] = useState<{
    past: SceneObject[][];
    future: SceneObject[][];
  }>({ past: [], future: [] });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newShape, setNewShape] = useState<Shape>("box");
  const [mode, setMode] = useState<"object" | "ui">("object");
  const [sceneReady, setSceneReady] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [ambientIntensity, setAmbientIntensity] = useState(2);
  const [directionalIntensity, setDirectionalIntensity] = useState(3);
  const [sceneName, setSceneName] = useState("");
  const [savedScenes, setSavedScenes] = useState<SceneSnapshot[]>([]);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [pendingAutobackup, setPendingAutobackup] = useState<AutobackupData | null>(null);
  const baselineRef = useRef<string>("");
  const autosaveTimerRef = useRef<number | null>(null);

  const selectedObject = objects.find((item) => item.id === selectedId);

  function commitObjects(next: SceneObject[]) {
    setHistory((current) => ({
      past: [...current.past, objects].slice(-50),
      future: [],
    }));
    setObjects(next);
  }

  function undo() {
    if (!history.past.length) return;
    const previous = history.past[history.past.length - 1];
    setHistory((current) => ({
      past: current.past.slice(0, -1),
      future: [objects, ...current.future].slice(0, 50),
    }));
    setObjects(previous);
    setMessage("បាន Undo សកម្មភាពចុងក្រោយ។");
  }

  function redo() {
    if (!history.future.length) return;
    const next = history.future[0];
    setHistory((current) => ({
      past: [...current.past, objects].slice(-50),
      future: current.future.slice(1),
    }));
    setObjects(next);
    setMessage("បាន Redo សកម្មភាព។");
  }

  useEffect(() => {
    let renderer: import("three").WebGLRenderer | undefined;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let cleanup = false;
    let scene: import("three").Scene | undefined;
    let camera: import("three").PerspectiveCamera | undefined;
    let controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | undefined;

    async function start() {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (cleanup || !canvasHost.current) return;

      scene = new THREE.Scene();
      scene.background = new THREE.Color("#080f1b");

      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(4, 3, 7);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      canvasHost.current.appendChild(renderer.domElement);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, 0, 0);
      controls.update();
      controlsRef.current = controls;

      const hemi = new THREE.HemisphereLight(0xffffff, 0x26344c, ambientIntensity);
      scene.add(hemi);
      hemiLightRef.current = hemi;

      const light = new THREE.DirectionalLight(0xffffff, directionalIntensity);
      light.position.set(4, 5, 4);
      scene.add(light);
      dirLightRef.current = light;

      const floor = new THREE.GridHelper(12, 12, 0x31516e, 0x1b2b40);
      floor.position.y = -1.2;
      scene.add(floor);

      sceneRef.current = scene;
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
        controls?.update();
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
      controls?.dispose();
      controlsRef.current = null;
      meshesRef.current.forEach(disposeMesh);
      meshesRef.current.clear();
      renderer?.dispose();
      renderer?.domElement.remove();
      sceneRef.current = null;
      hemiLightRef.current = null;
      dirLightRef.current = null;
    };
  }, []);

  useEffect(() => {
    refreshSavedScenes();
  }, []);

  useEffect(() => {
    baselineRef.current = serializeForBaseline(
      objects,
      ambientIntensity,
      directionalIntensity
    );
    const backup = readAutobackup();
    if (backup) {
      const backupBaseline = serializeForBaseline(
        backup.objects as SceneObject[],
        backup.ambientIntensity,
        backup.directionalIntensity
      );
      if (backupBaseline !== baselineRef.current) {
        setPendingAutobackup(backup);
      } else {
        clearAutobackup();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sceneReady) return;
    if (hemiLightRef.current) hemiLightRef.current.intensity = ambientIntensity;
    if (dirLightRef.current) dirLightRef.current.intensity = directionalIntensity;
  }, [ambientIntensity, directionalIntensity, sceneReady]);

  useEffect(() => {
    if (!sceneReady) return;
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      const current = serializeForBaseline(
        objects,
        ambientIntensity,
        directionalIntensity
      );
      if (current === baselineRef.current) return;
      writeAutobackup({
        objects,
        ambientIntensity,
        directionalIntensity,
        sceneName,
        currentSceneId,
        savedAt: Date.now(),
      });
    }, 2000);
    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [
    objects,
    ambientIntensity,
    directionalIntensity,
    sceneName,
    currentSceneId,
    sceneReady,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function updateScene() {
      const THREE = await import("three");
      if (cancelled || !sceneReady || !sceneRef.current) return;

      const scene = sceneRef.current;

      meshesRef.current.forEach((mesh) => {
        scene.remove(mesh);
        disposeMesh(mesh);
      });
      meshesRef.current.clear();

      objects.forEach((item) => {
        const material = new THREE.MeshStandardMaterial({
          color: item.color,
          metalness: item.metalness,
          roughness: item.roughness,
          emissive: item.id === selectedId ? "#183b60" : "#000000",
        });

        if (item.textureData) {
          new THREE.TextureLoader().load(item.textureData, (texture) => {
            if (cancelled) {
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            material.map = texture;
            material.needsUpdate = true;
          });
        }

        const mesh = new THREE.Mesh(
          createGeometry(THREE, item.shape),
          material
        );

        mesh.position.set(
          item.position.x,
          item.position.y,
          item.position.z
        );
        mesh.rotation.set(
          item.rotation.x,
          item.rotation.y,
          item.rotation.z
        );
        mesh.scale.set(
          item.scale.x,
          item.scale.y,
          item.scale.z
        );

        mesh.userData.objectId = item.id;
        mesh.name = item.name;
        mesh.visible = item.visible !== false;
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
    const preset = presets.find((item) => item.shape === newShape);
    const count = objects.filter((item) => item.shape === newShape).length + 1;

    const next: SceneObject = {
      id: createId(),
      name: `${preset?.name ?? "Object"} ${count}`,
      shape: newShape,
      color: "#168de2",
      metalness: 0.25,
      roughness: 0.35,
      position: {
        x: ((objects.length % 3) - 1) * 2.5,
        y: 0,
        z: Math.floor(objects.length / 3) * 2.5,
      },
      rotation: zero(),
      scale: one(),
      visible: true,
      locked: false,
      textureData: null,
    };

    commitObjects([...objects, next]);
    setSelectedId(next.id);
    setMessage(`បានបន្ថែម ${next.name}។`);
  }

  function duplicateObject() {
    if (!selectedObject) return;

    const copy: SceneObject = {
      ...selectedObject,
      id: createId(),
      name: `${selectedObject.name} Copy`,
      position: {
        ...selectedObject.position,
        x: selectedObject.position.x + 1.5,
      },
      rotation: { ...selectedObject.rotation },
      scale: { ...selectedObject.scale },
      visible: selectedObject.visible !== false,
      locked: false, // Duplicated objects are unlocked by default
      textureData: selectedObject.textureData,
    };

    commitObjects([...objects, copy]);
    setSelectedId(copy.id);
    setMessage(`បានចម្លង ${copy.name}។`);
  }

  function deleteObject() {
    if (!selectedId) return;
    const remaining = objects.filter((item) => item.id !== selectedId);
    commitObjects(remaining);
    setSelectedId(remaining[remaining.length - 1]?.id ?? null);
    setMessage("បានលុបវត្ថុដែលបានជ្រើស។");
  }

  function refreshSavedScenes() {
    setSavedScenes(listScenes());
  }

  function handleSaveScene() {
    const name = sceneName.trim() || `Scene ${new Date().toLocaleString()}`;
    const now = Date.now();
    const id = currentSceneId ?? createId();
    const existing = savedScenes.find((item) => item.id === id);
    const snapshot: SceneSnapshot = {
      id,
      name,
      objects,
      ambientIntensity,
      directionalIntensity,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const ok = saveScene(snapshot);
    if (ok) {
      refreshSavedScenes();
      setCurrentSceneId(id);
      baselineRef.current = serializeForBaseline(
        objects,
        ambientIntensity,
        directionalIntensity
      );
      clearAutobackup();
      setPendingAutobackup(null);
      setMessage(`បានរក្សាទុក "${name}"។`);
    } else {
      setMessage("មិនអាចរក្សាទុក Scene បានទេ។");
    }
  }

  function handleLoadScene(id: string) {
    const snapshot = loadScene(id);
    if (!snapshot) {
      setMessage("រកមិនឃើញ Scene នេះទេ។");
      return;
    }
    const parsed = snapshot.objects as SceneObject[];
    setObjects(parsed);
    setAmbientIntensity(snapshot.ambientIntensity);
    setDirectionalIntensity(snapshot.directionalIntensity);
    setSceneName(snapshot.name);
    setCurrentSceneId(snapshot.id);
    setSelectedId(parsed[parsed.length - 1]?.id ?? null);
    setHistory({ past: [], future: [] });
    baselineRef.current = serializeForBaseline(
      parsed,
      snapshot.ambientIntensity,
      snapshot.directionalIntensity
    );
    clearAutobackup();
    setPendingAutobackup(null);
    setMessage(`បានបើក "${snapshot.name}"។`);
  }

  function handleDeleteScene(id: string) {
    if (!window.confirm("លុប Scene នេះទេ?")) return;
    const ok = deleteScene(id);
    if (!ok) {
      setMessage("មិនអាចលុប Scene បានទេ។");
      return;
    }
    refreshSavedScenes();
    if (currentSceneId === id) {
      setCurrentSceneId(null);
      setSceneName("");
    }
    setMessage("បានលុប Scene។");
  }

  function handleExportJSON() {
    if (!objects.length) {
      setMessage("សូមបន្ថែមវត្ថុ 3D មុនពេល Export JSON។");
      return;
    }
    try {
      const name = sceneName.trim() || "scene";
      const snapshot: SceneSnapshot = {
        id: currentSceneId ?? createId(),
        name,
        objects,
        ambientIntensity,
        directionalIntensity,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const payload = serializeSceneSnapshot(snapshot);
      const text = JSON.stringify(payload, null, 2);
      const blob = new Blob([text], { type: "application/json" });
      const safeName = name.replace(/[^\w\-]+/g, "_").slice(0, 40) || "scene";
      const filename = `KHOEM-AI-${safeName}-${Date.now()}.json`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);

      setMessage(`បាន Export Scene ជា JSON: ${filename}`);
    } catch (error) {
      console.error("Scene JSON export failed:", error);
      setMessage(
        error instanceof Error
          ? `Export JSON failed: ${error.message}`
          : "មិនអាច Export JSON បានទេ។"
      );
    }
  }

  function handleImportJSONFile(file: File) {
    if (!file) return;
    const reader = new FileReader();

    reader.onerror = () => {
      setMessage("មិនអាចអានឯកសារបានទេ។");
    };

    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      if (!text.trim()) {
        setMessage("ឯកសារ JSON ទទេ។");
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        console.error("JSON parse failed:", error);
        setMessage("ឯកសារ JSON មិនត្រឹមត្រូវ (parse error)។");
        return;
      }

      const result = parseImportedScene(parsed);
      if (!result.ok) {
        setMessage(`Import បរាជ័យ: ${result.error}`);
        return;
      }

      const snapshot = result.data;
      const importedObjects = snapshot.objects as SceneObject[];
      setObjects(importedObjects);
      setAmbientIntensity(snapshot.ambientIntensity);
      setDirectionalIntensity(snapshot.directionalIntensity);
      setSceneName(snapshot.name);
      setCurrentSceneId(null);
      setSelectedId(importedObjects[importedObjects.length - 1]?.id ?? null);
      setHistory({ past: [], future: [] });
      baselineRef.current = serializeForBaseline(
        importedObjects,
        snapshot.ambientIntensity,
        snapshot.directionalIntensity
      );
      clearAutobackup();
      setPendingAutobackup(null);
      setMessage(
        `បាន Import Scene "${snapshot.name}" (${importedObjects.length} វត្ថុ)។`
      );
    };

    reader.readAsText(file);
  }

  function handleImportJSON(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage("ឯកសារធំពេក (max 2MB)។");
      return;
    }
    handleImportJSONFile(file);
  }

  function handleRestoreAutobackup() {
    if (!pendingAutobackup) return;
    const restored = pendingAutobackup.objects as SceneObject[];
    setObjects(restored);
    setAmbientIntensity(pendingAutobackup.ambientIntensity);
    setDirectionalIntensity(pendingAutobackup.directionalIntensity);
    setSceneName(pendingAutobackup.sceneName);
    setCurrentSceneId(pendingAutobackup.currentSceneId);
    setSelectedId(restored[restored.length - 1]?.id ?? null);
    setHistory({ past: [], future: [] });
    baselineRef.current = serializeForBaseline(
      restored,
      pendingAutobackup.ambientIntensity,
      pendingAutobackup.directionalIntensity
    );
    clearAutobackup();
    setPendingAutobackup(null);
    setMessage(
      `បាន Restore Scene ពី Auto Backup (${new Date(
        pendingAutobackup.savedAt
      ).toLocaleString()})។`
    );
  }

  function handleDiscardAutobackup() {
    if (!pendingAutobackup) return;
    clearAutobackup();
    setPendingAutobackup(null);
    setMessage("បានបោះបង់ Auto Backup។");
  }

  function toggleVisibility(id: string) {
    commitObjects(
      objects.map((item) =>
        item.id === id ? { ...item, visible: item.visible === false } : item
      )
    );
  }

  function toggleLock(id: string) {
    commitObjects(
      objects.map((item) =>
        item.id === id ? { ...item, locked: !item.locked } : item
      )
    );
  }

  function renameObject(id: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    commitObjects(
      objects.map((item) =>
        item.id === id ? { ...item, name: trimmed } : item
      )
    );
  }

  function handleTextureUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedId) return;
    if (file.size > 1024 * 1024) {
      setMessage("រូបភាពធំពេក (អតិបរមា 1MB)។");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        commitObjects(
          objects.map((item) =>
            item.id === selectedId ? { ...item, textureData: dataUrl } : item
          )
        );
        setMessage("បានដាក់ Texture លើវត្ថុ។");
      }
    };
    reader.readAsDataURL(file);
  }

  function clearTexture(id: string) {
    commitObjects(
      objects.map((item) =>
        item.id === id ? { ...item, textureData: null } : item
      )
    );
    setMessage("បានលុប Texture ចេញពីវត្ថុ។");
  }

  function updateSelected(
    key: "position" | "rotation" | "scale",
    axis: keyof Vector3,
    value: number
  ) {
    if (!selectedId || !Number.isFinite(value)) return;

    commitObjects(
      objects.map((item) =>
        item.id === selectedId
          ? { ...item, [key]: { ...item[key], [axis]: value } }
          : item
      )
    );
  }

  function updateSelectedColor(value: string) {
    if (!selectedId) return;
    commitObjects(
      objects.map((item) =>
        item.id === selectedId ? { ...item, color: value } : item
      )
    );
  }

  function updateSelectedMaterial(
    key: "metalness" | "roughness",
    value: number
  ) {
    if (!selectedId || !Number.isFinite(value)) return;
    const safeValue = Math.max(0, Math.min(1, value));
    commitObjects(
      objects.map((item) =>
        item.id === selectedId ? { ...item, [key]: safeValue } : item
      )
    );
  }

  function renderVectorControls(
    title: string,
    key: "position" | "rotation" | "scale",
    values: Vector3,
    step: number,
    disabled?: boolean
  ) {
    return (
      <div className="studio-transform-group">
        <h4>{title}</h4>
        <div className="studio-transform-grid">
          {(["x", "y", "z"] as const).map((axis) => (
            <label key={axis}>
              {axis.toUpperCase()}
              <input
                type="number"
                step={step}
                value={Number(values[axis].toFixed(3))}
                onChange={(event) =>
                  updateSelected(key, axis, Number(event.target.value))
                }
                disabled={disabled}
              />
            </label>
          ))}
        </div>
      </div>
    );
  }

  async function exportGLB() {
    if (exporting) return;
    if (!objects.length) {
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

      const loader = new THREE.TextureLoader();
      await Promise.all(
        objects.map(async (item) => {
          const material = new THREE.MeshStandardMaterial({
            color: item.color,
            metalness: item.metalness,
            roughness: item.roughness,
          });

          if (item.textureData) {
            const texture = await new Promise<import("three").Texture>((resolve) => {
              loader.load(item.textureData!, (tex) => {
                tex.colorSpace = THREE.SRGBColorSpace;
                resolve(tex);
              });
            });
            material.map = texture;
          }

          const mesh = new THREE.Mesh(
            createGeometry(THREE, item.shape),
            material
          );

          mesh.position.set(item.position.x, item.position.y, item.position.z);
          mesh.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
          mesh.scale.set(item.scale.x, item.scale.y, item.scale.z);
          mesh.name = item.name;
          exportScene!.add(mesh);
        })
      );

      exportScene.updateMatrixWorld(true);

      const exporter = new GLTFExporter();
      const result = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(
          exportScene!,
          (output) => {
            if (output instanceof ArrayBuffer) resolve(output);
            else reject(new Error("GLB binary output was not returned."));
          },
          (error) => reject(error),
          { binary: true }
        );
      });

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
        `បាន Export វត្ថុ ${objects.length} ជា GLB និងរក្សាទុកក្នុង Asset Library រួចរាល់។`
      );
    } catch (error) {
      console.error("GLB export failed:", error);
      setMessage(
        error instanceof Error
          ? `Export failed: ${error.message}`
          : "មិនអាច Export GLB បានទេ។"
      );
    } finally {
      if (exportScene) {
        exportScene.traverse((item) => {
          if ((item as import("three").Mesh).isMesh) {
            disposeMesh(item as import("three").Mesh);
          }
        });
      }
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
                onChange={(event) => setNewShape(event.target.value as Shape)}
              >
                {presets.map((item) => (
                  <option key={item.shape} value={item.shape}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="upload-button" onClick={addObject}>
              + Add Object
            </button>
          </div>

          <div className="studio-history-controls">
            <button type="button" className="filter" onClick={undo} disabled={!history.past.length}>
              ↶ Undo
            </button>
            <button type="button" className="filter" onClick={redo} disabled={!history.future.length}>
              ↷ Redo
            </button>
          </div>

          {pendingAutobackup && (
            <div
              className="studio-transform-panel"
              style={{
                borderColor: "#f0b849",
                borderWidth: 1,
                borderStyle: "solid",
              }}
            >
              <h3>🔄 Auto Backup មាន</h3>
              <p className="studio-note">
                មាន Auto Backup ពី{" "}
                {new Date(pendingAutobackup.savedAt).toLocaleString()} (
                {pendingAutobackup.objects.length} វត្ថុ)។ តើអ្នកចង់ Restore ឬបោះបង់?
              </p>
              <div className="studio-controls">
                <button
                  type="button"
                  className="upload-button"
                  onClick={handleRestoreAutobackup}
                >
                  Restore
                </button>
                <button
                  type="button"
                  className="filter"
                  onClick={handleDiscardAutobackup}
                >
                  Discard
                </button>
              </div>
            </div>
          )}

          <div className="studio-transform-panel">
            <h3>Scene Manager</h3>
            <div className="studio-controls">
              <label>
                Scene Name
                <input
                  type="text"
                  placeholder="My Scene"
                  value={sceneName}
                  onChange={(event) => setSceneName(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="upload-button"
                onClick={handleSaveScene}
              >
                {currentSceneId ? "Update Scene" : "Save Scene"}
              </button>
              <button
                type="button"
                className="filter"
                onClick={handleExportJSON}
                disabled={!objects.length}
              >
                Export JSON
              </button>
              <button
                type="button"
                className="filter"
                onClick={() => fileInputRef.current?.click()}
              >
                Import JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportJSON}
                style={{ display: "none" }}
              />
            </div>

            {savedScenes.length === 0 ? (
              <p className="studio-note">
                មិនទាន់មាន Scene ដែលបានរក្សាទុកទេ។ សូមដាក់ឈ្មោះ ហើយចុច Save Scene។
              </p>
            ) : (
              <div className="studio-object-list">
                {savedScenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={
                      currentSceneId === scene.id
                        ? "studio-object-item selected"
                        : "studio-object-item"
                    }
                  >
                    <span>{scene.name}</span>
                    <small>
                      {(scene.objects as SceneObject[]).length} obj
                    </small>
                    <button
                      type="button"
                      className="filter"
                      onClick={() => handleLoadScene(scene.id)}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      className="filter"
                      onClick={() => handleDeleteScene(scene.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="studio-canvas" ref={canvasHost}>
            <span className="studio-hint">3D LIVE PREVIEW</span>
          </div>

          <div className="studio-transform-panel">
            <h3>Scene Lighting</h3>
            <div className="studio-controls">
              <label>
                Ambient Light: {ambientIntensity.toFixed(2)}
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={ambientIntensity}
                  onChange={(event) =>
                    setAmbientIntensity(Number(event.target.value))
                  }
                />
              </label>
              <label>
                Directional Light: {directionalIntensity.toFixed(2)}
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={directionalIntensity}
                  onChange={(event) =>
                    setDirectionalIntensity(Number(event.target.value))
                  }
                />
              </label>
            </div>
          </div>

          <div className="studio-object-manager">
            <h3>Scene Objects ({objects.length})</h3>
            {objects.length === 0 ? (
              <p className="studio-note">មិនទាន់មានវត្ថុទេ។ សូមចុច Add Object។</p>
            ) : (
              <div className="studio-object-list">
                {objects.map((item) => (
                  <div
                    key={item.id}
                    className={selectedId === item.id ? "studio-object-item selected" : "studio-object-item"}
                    onClick={() => setSelectedId(item.id)}
                    style={{ opacity: item.visible === false ? 0.5 : 1, cursor: "pointer" }}
                  >
                    <span className="studio-object-swatch" style={{ backgroundColor: item.color }} />
                    <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </span>
                    <small style={{ marginRight: "8px" }}>{item.shape}</small>
                    <div style={{ display: "flex", gap: "2px" }}>
                      <button
                        type="button"
                        title={item.visible === false ? "Show" : "Hide"}
                        onClick={(e) => { e.stopPropagation(); toggleVisibility(item.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", color: "inherit" }}
                      >
                        {item.visible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        type="button"
                        title={item.locked ? "Unlock" : "Lock"}
                        onClick={(e) => { e.stopPropagation(); toggleLock(item.id); }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", color: "inherit" }}
                      >
                        {item.locked ? <Lock size={16} /> : <Unlock size={16} />}
                      </button>
                      <button
                        type="button"
                        title="Rename"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newName = window.prompt("បញ្ចូលឈ្មោះថ្មីសម្រាប់វត្ថុនេះ:", item.name);
                          if (newName) renameObject(item.id, newName);
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", color: "inherit" }}
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedObject && (
            <div className="studio-transform-panel">
              <h3>Transform: {selectedObject.name}</h3>

              {selectedObject.locked && (
                <p className="studio-note" style={{ color: "#f0b849", marginBottom: "8px" }}>
                  🔒 វត្ថុនេះកំពុងត្រូវបានចាក់សោ។ សូមដោះសោដើម្បីកែប្រែ។
                </p>
              )}

              <div className="studio-controls">
                <label>
                  Material Color
                  <input
                    type="color"
                    value={selectedObject.color}
                    onChange={(event) => updateSelectedColor(event.target.value)}
                    disabled={selectedObject.locked}
                  />
                </label>
                <label>
                  Texture Image (Max 1MB)
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTextureUpload}
                    disabled={selectedObject.locked}
                    style={{ display: "none" }}
                    id={`texture-upload-${selectedObject.id}`}
                  />
                  <button
                    type="button"
                    className="filter"
                    disabled={selectedObject.locked}
                    onClick={() => document.getElementById(`texture-upload-${selectedObject.id}`)?.click()}
                    style={{ marginTop: "4px" }}
                  >
                    {selectedObject.textureData ? "Change Texture" : "Upload Texture"}
                  </button>
                </label>
                {selectedObject.textureData && (
                  <button
                    type="button"
                    className="filter"
                    disabled={selectedObject.locked}
                    onClick={() => clearTexture(selectedObject.id)}
                  >
                    Clear Texture
                  </button>
                )}
                <label>
                  Metalness
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={selectedObject.metalness}
                    onChange={(event) =>
                      updateSelectedMaterial("metalness", Number(event.target.value))
                    }
                  />
                  <small>{selectedObject.metalness.toFixed(2)}</small>
                </label>
                <label>
                  Roughness
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={selectedObject.roughness}
                    onChange={(event) =>
                      updateSelectedMaterial("roughness", Number(event.target.value))
                    }
                  />
                  <small>{selectedObject.roughness.toFixed(2)}</small>
                </label>
                <button type="button" className="filter" onClick={duplicateObject}>
                  Duplicate
                </button>
                <button type="button" className="filter" onClick={deleteObject}>
                  Delete
                </button>
              </div>

              {renderVectorControls("Move Position", "position", selectedObject.position, 0.1, selectedObject.locked)}
              {renderVectorControls("Rotate (Radians)", "rotation", selectedObject.rotation, 0.1, selectedObject.locked)}
              {renderVectorControls("Scale", "scale", selectedObject.scale, 0.1, selectedObject.locked)}
            </div>
          )}

          <div className="studio-export">
            <button
              type="button"
              className="upload-button"
              onClick={exportGLB}
              disabled={exporting || objects.length === 0}
            >
              {exporting ? "Exporting..." : `Export ${objects.length} Object(s) as GLB`}
            </button>
          </div>

          {message && <p className="backup-message" role="status">{message}</p>}

          <p className="studio-note">
            Move, Rotate និង Scale ប្រើអ័ក្ស X, Y, Z។ Undo/Redo អាចត្រឡប់ការកែប្រែបានរហូតដល់ 50 សកម្មភាព។
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
          <p className="studio-note">នេះជាគំរូ UI បែប 3D ដំបូង។</p>
        </div>
      )}
    </section>
  );
}
