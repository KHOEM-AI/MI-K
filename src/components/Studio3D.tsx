import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Unlock, Pencil, Sun, Moon, Lightbulb, HelpCircle, X, Gem, Droplet, TreePine, Box, RotateCw } from "lucide-react";
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

type Shape = "box" | "sphere" | "cone" | "cylinder" | "torus" | "text";
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
  glbData?: string | null;
  text?: string;
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
  { name: "Text", shape: "text" },
];

const MATERIAL_PRESETS = [
  { name: "Gold", color: "#ffd700", metalness: 1.0, roughness: 0.2, icon: Gem },
  { name: "Silver", color: "#e0e0e0", metalness: 1.0, roughness: 0.3, icon: Gem },
  { name: "Glass", color: "#88ccff", metalness: 0.9, roughness: 0.1, icon: Droplet },
  { name: "Wood", color: "#8b4513", metalness: 0.0, roughness: 0.9, icon: TreePine },
  { name: "Plastic", color: "#ff6b6b", metalness: 0.1, roughness: 0.4, icon: Box },
];

const zero = (): Vector3 => ({ x: 0, y: 0, z: 0 });
const one = (): Vector3 => ({ x: 1, y: 1, z: 1 });

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function serializeForBaseline(
  objs: SceneObject[],
  ambient: number,
  directional: number,
  bg: string
): string {
  return JSON.stringify({
    objects: objs,
    ambientIntensity: ambient,
    directionalIntensity: directional,
    backgroundColor: bg,
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

function disposeMesh(obj: import("three").Object3D) {
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

function UI3DPreview() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let renderer: import("three").WebGLRenderer | undefined;
    let frame = 0;
    let cleanup = false;
    let scene: import("three").Scene | undefined;
    let camera: import("three").PerspectiveCamera | undefined;
    let mesh: import("three").Mesh | undefined;

    async function start() {
      const THREE = await import("three");
      if (cleanup || !hostRef.current) return;

      scene = new THREE.Scene();
      scene.background = new THREE.Color("#080f1b");

      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 6);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      hostRef.current.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 3);
      dir.position.set(2, 3, 4);
      scene.add(dir);

      // Create a canvas texture for the 3D Card
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#111e31";
        ctx.fillRect(0, 0, 512, 256);
        ctx.strokeStyle = "#168de2";
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, 500, 244);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 56px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("KHOEM-AI", 256, 110);

        ctx.fillStyle = "#168de2";
        ctx.font = "24px sans-serif";
        ctx.fillText("3D CARD COMPONENT", 256, 160);

        ctx.fillStyle = "#168de2";
        ctx.fillRect(156, 190, 200, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("ACTION BUTTON", 256, 217);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      const geo = new THREE.BoxGeometry(4, 2, 0.2);
      const sideMat = new THREE.MeshStandardMaterial({ color: "#0c1626", metalness: 0.5, roughness: 0.5 });
      const frontMat = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.2, roughness: 0.4 });

      const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];
      mesh = new THREE.Mesh(geo, materials);
      scene.add(mesh);

      const resize = () => {
        if (!renderer || !camera || !hostRef.current) return;
        const width = hostRef.current.clientWidth;
        const height = hostRef.current.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const observer = new ResizeObserver(resize);
      observer.observe(hostRef.current);
      resize();

      let t = 0;
      const animate = () => {
        if (cleanup || !renderer || !scene || !camera || !mesh) return;
        t += 0.01;
        mesh.rotation.y = Math.sin(t) * 0.5;
        mesh.rotation.x = Math.sin(t * 0.5) * 0.2;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        observer.disconnect();
      };
    }

    const cleanupPromise = start();

    return () => {
      cleanup = true;
      cancelAnimationFrame(frame);
      cleanupPromise.then((cleanupFn) => cleanupFn?.());
      renderer?.dispose();
      renderer?.domElement.remove();
      if (mesh) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    };
  }, []);

  return (
    <div className="ui-design-preview" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p className="eyebrow">3D INTERFACE PREVIEW</p>
      <div
        ref={hostRef}
        style={{
          width: "100%",
          height: "300px",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#080f1b",
          position: "relative"
        }}
      />
      <p className="studio-note">
        នេះជាគំរូ UI បែប 3D ដែលអាចបង្វិលបាន។ (Auto-rotating 3D Card)
      </p>
    </div>
  );
}

export default function Studio3D({ onAssetSaved }: Studio3DProps) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<import("three").Scene | null>(null);
  const meshesRef = useRef(new Map<string, import("three").Object3D>());
  const controlsRef = useRef<import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | null>(null);
  const cameraRef = useRef<import("three").PerspectiveCamera | null>(null);
  const hemiLightRef = useRef<import("three").HemisphereLight | null>(null);
  const dirLightRef = useRef<import("three").DirectionalLight | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const glbInputRef = useRef<HTMLInputElement | null>(null);

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
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [bgColor, setBgColor] = useState("#080f1b");
  const [showHelp, setShowHelp] = useState(false);
  const [useEnvMap, setUseEnvMap] = useState(true);
  const useEnvMapRef = useRef(useEnvMap);
  useEnvMapRef.current = useEnvMap;
  const [activeLighting, setActiveLighting] = useState<"day" | "night" | "studio" | null>("day");
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
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;


      // Undo: Ctrl+Z or Cmd+Z
      if (!isInput && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Ctrl+Shift+Z or Cmd+Shift+Z or Ctrl+Y
      else if (
        (!isInput && (e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z") ||
        (!isInput && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y")
      ) {
        e.preventDefault();
        redo();
      }
      // Duplicate: Ctrl+D or Cmd+D
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d" && !isInput) {
        e.preventDefault();
        duplicateObject();
      }
      // Save: Ctrl+S or Cmd+S
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && !isInput) {
        e.preventDefault();
        handleSaveScene();
      }
      // Fit to Center: F
      else if (e.key.toLowerCase() === "f" && !isInput) {
        e.preventDefault();
        centerAndFitObject();
      }
      // Delete: Delete or Backspace (Only if not typing in an input)
      else if ((e.key === "Delete" || e.key === "Backspace") && !isInput) {
        if (selectedId) {
          e.preventDefault();
          deleteObject();
        }
      }
      // Deselect: Escape
      else if (e.key === "Escape" && !isInput) {
        if (showHelp) {
          setShowHelp(false);
        } else {
          setSelectedId(null);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    history,
    selectedId,
    objects,
    showHelp,
    ambientIntensity,
    directionalIntensity,
    bgColor,
    currentSceneId,
    sceneName
  ]);

  useEffect(() => {
    let renderer: import("three").WebGLRenderer | undefined;
    let frame = 0;
    let observer: ResizeObserver | undefined;
    let cleanup = false;
    let scene: import("three").Scene | undefined;
    let camera: import("three").PerspectiveCamera | undefined;
    let controls: import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | undefined;
    let envMap: import("three").Texture | undefined;
    let pmremGenerator: import("three").PMREMGenerator | undefined;

    async function start() {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (cleanup || !canvasHost.current) return;

      scene = new THREE.Scene();
      scene.background = new THREE.Color("#080f1b");

      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(4, 3, 7);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
      light.castShadow = true;
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 50;
      light.shadow.camera.left = -10;
      light.shadow.camera.right = 10;
      light.shadow.camera.top = 10;
      light.shadow.camera.bottom = -10;
      scene.add(light);
      dirLightRef.current = light;

      const floor = new THREE.GridHelper(12, 12, 0x31516e, 0x1b2b40);
      floor.position.y = -1.2;
      scene.add(floor);

      const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.ShadowMaterial({ opacity: 0.3, color: 0x000000 })
      );
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = -1.19;
      shadowPlane.receiveShadow = true;
      scene.add(shadowPlane);

      // Load HDRI Environment Map
      pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      const { RGBELoader } = await import("three/examples/jsm/loaders/RGBELoader.js");
      if (cleanup) {
        pmremGenerator.dispose();
        pmremGenerator = undefined;
        return;
      }

      const hdrLoader = new RGBELoader();

      hdrLoader.load(
        "https://threejs.org/examples/textures/equirectangular/royal_esplanade_1k.hdr",
        (texture) => {
          if (cleanup || !pmremGenerator) {
            texture.dispose();
            pmremGenerator?.dispose();
            pmremGenerator = undefined;
            return;
          }

          try {
            envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene!.userData.envMap = envMap;
            scene!.environment = useEnvMapRef.current ? envMap : null;
          } catch (error) {
            console.error("HDRI conversion failed:", error);
            setMessage("មិនអាចបង្កើត HDRI Environment Map បានទេ។");
          } finally {
            texture.dispose();
            pmremGenerator?.dispose();
            pmremGenerator = undefined;
          }
        },
        undefined,
        (error) => {
          pmremGenerator?.dispose();
          pmremGenerator = undefined;
          if (!cleanup) {
            console.error("HDRI load failed:", error);
            setMessage("មិនអាច Load HDRI បានទេ។ សូមពិនិត្យ Internet connection។");
          }
        }
      );

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
      if (scene) {
        scene.environment = null;
        scene.userData.envMap = null;
      }
      envMap?.dispose();
      envMap = undefined;
      pmremGenerator?.dispose();
      pmremGenerator = undefined;
      renderer?.dispose();
      renderer?.domElement.remove();
      sceneRef.current = null;
      hemiLightRef.current = null;
      dirLightRef.current = null;
      cameraRef.current = null;
    };
  }, []);

  useEffect(() => {
    refreshSavedScenes();
  }, []);

  useEffect(() => {
    baselineRef.current = serializeForBaseline(
      objects,
      ambientIntensity,
      directionalIntensity,
      bgColor
    );
    const backup = readAutobackup();
    if (backup) {
      const backupBaseline = serializeForBaseline(
        backup.objects as SceneObject[],
        backup.ambientIntensity,
        backup.directionalIntensity,
        backup.backgroundColor || "#080f1b"
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
    if (!sceneReady || !sceneRef.current) return;
    sceneRef.current.environment = useEnvMap ? sceneRef.current.userData.envMap || null : null;
  }, [useEnvMap, sceneReady]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0; // ល្បឿនបង្វិល
    }
  }, [autoRotate]);

  useEffect(() => {
    if (!sceneReady || !sceneRef.current) return;
    import("three").then((THREE) => {
      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(bgColor);
      }
    });
  }, [bgColor, sceneReady]);

  useEffect(() => {
    if (!sceneReady) return;
    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      const current = serializeForBaseline(
        objects,
        ambientIntensity,
        directionalIntensity,
        bgColor
      );
      if (current === baselineRef.current) return;
      writeAutobackup({
        objects,
        ambientIntensity,
        directionalIntensity,
        sceneName,
        currentSceneId,
        backgroundColor: bgColor,
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
    bgColor,
    sceneReady,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function updateScene() {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (cancelled || !sceneReady || !sceneRef.current) return;

      const scene = sceneRef.current;
      const gltfLoader = new GLTFLoader();

      meshesRef.current.forEach((obj) => {
        scene.remove(obj);
        disposeMesh(obj);
      });
      meshesRef.current.clear();

      await Promise.all(
        objects.map(async (item) => {
          let obj: import("three").Object3D;

          if (item.glbData) {
            obj = await new Promise((resolve, reject) => {
              gltfLoader.load(
                item.glbData!,
                (gltf) => {
                  const root = gltf.scene;
                  root.traverse((child) => {
                    if ((child as import("three").Mesh).isMesh) {
                      child.castShadow = true;
                      child.receiveShadow = true;
                    }
                  });
                  // Apply emissive to all meshes if selected
                  if (item.id === selectedId) {
                    root.traverse((child) => {
                      if ((child as import("three").Mesh).isMesh) {
                        const m = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
                        if (m && m.emissive) {
                          m.emissive.setHex(0x183b60);
                          m.needsUpdate = true;
                        }
                      }
                    });
                  }
                  resolve(root);
                },
                undefined,
                (err) => reject(err)
              );
            });
          } else {
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

            let geo: import("three").BufferGeometry;
            if (item.shape === "text") {
              const { FontLoader } = await import("three/examples/jsm/loaders/FontLoader.js");
              const { TextGeometry } = await import("three/examples/jsm/geometries/TextGeometry.js");
              const fontLoader = new FontLoader();

              const font = await new Promise<import("three/examples/jsm/loaders/FontLoader.js").Font>((resolve) => {
                fontLoader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", resolve);
              });

              geo = new TextGeometry(item.text || "Hello", {
                font: font,
                size: 1.5,
                depth: 0.3, // Note: Older three.js uses 'height', newer uses 'depth'
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.05,
                bevelSize: 0.03,
                bevelOffset: 0,
                bevelSegments: 5
              });

              // Center the text geometry
              geo.computeBoundingBox();
              if (geo.boundingBox) {
                const centerOffset = -0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x);
                geo.translate(centerOffset, 0, 0);
              }
            } else {
              geo = createGeometry(THREE, item.shape);
            }

            obj = new THREE.Mesh(geo, material);
            obj.castShadow = true;
            obj.receiveShadow = true;
          }

          if (cancelled) return;

          obj.position.set(item.position.x, item.position.y, item.position.z);
          obj.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
          obj.scale.set(item.scale.x, item.scale.y, item.scale.z);

          obj.userData.objectId = item.id;
          obj.name = item.name;
          obj.visible = item.visible !== false;
          scene.add(obj);
          meshesRef.current.set(item.id, obj);
        })
      );
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
      text: newShape === "text" ? "KHOEM-AI" : undefined,
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

  function handleGLBImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage("ឯកសារធំពេក (អតិបរមា 5MB)។");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) return;

      const next: SceneObject = {
        id: createId(),
        name: file.name.replace(/\.glb$/i, ""),
        shape: "box", // Fallback shape (unused when glbData is present)
        color: "#ffffff",
        metalness: 0.2,
        roughness: 0.5,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        locked: false,
        textureData: null,
        glbData: dataUrl,
      };

      commitObjects([...objects, next]);
      setSelectedId(next.id);
      setMessage(`បាន Import Model: ${next.name}។`);
    };
    reader.readAsDataURL(file);
  }

  function clearScene() {
    if (!objects.length) return;
    if (!window.confirm("តើអ្នកពិតជាចង់លុបវត្ថុទាំងអស់ចេញពី Scene មែនទេ?")) return;
    commitObjects([]);
    setSelectedId(null);
    setMessage("បានសម្អាតវត្ថុទាំងអស់ចេញពី Scene។");
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
      backgroundColor: bgColor,
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
        directionalIntensity,
        bgColor
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
    setBgColor(snapshot.backgroundColor || "#080f1b");
    setSceneName(snapshot.name);
    setCurrentSceneId(snapshot.id);
    setSelectedId(parsed[parsed.length - 1]?.id ?? null);
    setHistory({ past: [], future: [] });
    baselineRef.current = serializeForBaseline(
      parsed,
      snapshot.ambientIntensity,
      snapshot.directionalIntensity,
      snapshot.backgroundColor || "#080f1b"
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
      setBgColor(snapshot.backgroundColor || "#080f1b");
      setSceneName(snapshot.name);
      setCurrentSceneId(null);
      setSelectedId(importedObjects[importedObjects.length - 1]?.id ?? null);
      setHistory({ past: [], future: [] });
      baselineRef.current = serializeForBaseline(
        importedObjects,
        snapshot.ambientIntensity,
        snapshot.directionalIntensity,
        snapshot.backgroundColor || "#080f1b"
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
    setBgColor(pendingAutobackup.backgroundColor || "#080f1b");
    setSceneName(pendingAutobackup.sceneName);
    setCurrentSceneId(pendingAutobackup.currentSceneId);
    setSelectedId(restored[restored.length - 1]?.id ?? null);
    setHistory({ past: [], future: [] });
    baselineRef.current = serializeForBaseline(
      restored,
      pendingAutobackup.ambientIntensity,
      pendingAutobackup.directionalIntensity,
      pendingAutobackup.backgroundColor || "#080f1b"
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

  function centerAndFitObject() {
    if (!selectedId) return;

    const obj = meshesRef.current.get(selectedId);
    const currentObj = objects.find((item) => item.id === selectedId);
    if (!obj || !currentObj || currentObj.locked) return;

    import("three").then((THREE) => {
      if (!obj.parent || meshesRef.current.get(selectedId) !== obj) return;

      obj.updateMatrixWorld(true);

      // Calculate bounds in the object's local coordinate system.
      const worldBox = new THREE.Box3().setFromObject(obj);
      const inverseParent = new THREE.Matrix4();

      obj.parent.updateMatrixWorld(true);
      inverseParent.copy(obj.parent.matrixWorld).invert();

      const localBox = worldBox.clone();
      const corners = [
        new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.min.z),
        new THREE.Vector3(localBox.min.x, localBox.min.y, localBox.max.z),
        new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.min.z),
        new THREE.Vector3(localBox.min.x, localBox.max.y, localBox.max.z),
        new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.min.z),
        new THREE.Vector3(localBox.max.x, localBox.min.y, localBox.max.z),
        new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.min.z),
        new THREE.Vector3(localBox.max.x, localBox.max.y, localBox.max.z),
      ];

      const bounds = new THREE.Box3();
      corners.forEach((corner) => {
        corner.applyMatrix4(inverseParent);
        bounds.expandByPoint(corner);
      });

      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      bounds.getSize(size);
      bounds.getCenter(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      if (!Number.isFinite(maxDim) || maxDim <= 0) return;

      const factor = 2 / maxDim;
      const newScale = {
        x: currentObj.scale.x * factor,
        y: currentObj.scale.y * factor,
        z: currentObj.scale.z * factor,
      };

      const newPosition = {
        x: currentObj.position.x - center.x * factor,
        y: currentObj.position.y - center.y * factor,
        z: currentObj.position.z - center.z * factor,
      };

      commitObjects(
        objects.map((item) =>
          item.id === selectedId
            ? { ...item, scale: newScale, position: newPosition }
            : item
        )
      );

      setMessage("បានកែទំហំ និងដាក់វត្ថុឱ្យនៅកណ្តាល (Fit to Center)។");
    }).catch((error) => {
      console.error("Fit to Center failed:", error);
      setMessage("មិនអាចកែទំហំ និងទីតាំងវត្ថុបានទេ។");
    });
  }

  function setCameraPreset(preset: "front" | "top" | "iso") {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    if (preset === "front") {
      camera.position.set(0, 0, 10);
    } else if (preset === "top") {
      camera.position.set(0, 10, 0.01); // slight offset to avoid gimbal lock
    } else {
      camera.position.set(4, 3, 7); // default iso
    }

    controls.target.set(0, 0, 0);
    controls.update();
    setMessage(`បានប្តូរមុំមើលទៅ ${preset.toUpperCase()}។`);
  }

  function setLightingPreset(preset: "day" | "night" | "studio") {
    setActiveLighting(preset);
    if (preset === "day") {
      setAmbientIntensity(2.0);
      setDirectionalIntensity(3.0);
    } else if (preset === "night") {
      setAmbientIntensity(0.3);
      setDirectionalIntensity(1.0);
    } else {
      setAmbientIntensity(1.5);
      setDirectionalIntensity(5.0);
    }
    setMessage(`បានប្តូរពន្លឺទៅ ${preset.toUpperCase()}។`);
  }

  function updateSelected(
    key: "position" | "rotation" | "scale",
    axis: keyof Vector3,
    value: number
  ) {
    if (!selectedId || !Number.isFinite(value)) return;

    let finalValue = value;
    if (snapToGrid) {
      const gridStep = key === "position" ? 0.5 : 0.1;
      finalValue = Math.round(value / gridStep) * gridStep;
    }

    commitObjects(
      objects.map((item) =>
        item.id === selectedId
          ? { ...item, [key]: { ...item[key], [axis]: finalValue } }
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

  function applyMaterialPreset(preset: { color: string; metalness: number; roughness: number }) {
    if (!selectedId) return;
    commitObjects(
      objects.map((item) =>
        item.id === selectedId
          ? { ...item, color: preset.color, metalness: preset.metalness, roughness: preset.roughness }
          : item
      )
    );
    setMessage("បានប្តូរ Material ទៅជា Preset។");
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

          let geo: import("three").BufferGeometry;
          if (item.shape === "text") {
            const { FontLoader } = await import("three/examples/jsm/loaders/FontLoader.js");
            const { TextGeometry } = await import("three/examples/jsm/geometries/TextGeometry.js");
            const fontLoader = new FontLoader();

            const font = await new Promise<import("three/examples/jsm/loaders/FontLoader.js").Font>((resolve) => {
              fontLoader.load("https://threejs.org/examples/fonts/helvetiker_regular.typeface.json", resolve);
            });

            geo = new TextGeometry(item.text || "Hello", {
              font: font,
              size: 1.5,
              depth: 0.3,
              curveSegments: 12,
              bevelEnabled: true,
              bevelThickness: 0.05,
              bevelSize: 0.03,
              bevelOffset: 0,
              bevelSegments: 5
            });

            geo.computeBoundingBox();
            if (geo.boundingBox) {
              const centerOffset = -0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x);
              geo.translate(centerOffset, 0, 0);
            }
          } else {
            geo = createGeometry(THREE, item.shape);
          }

          const mesh = new THREE.Mesh(geo, material);

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
            disposeMesh(item as import("three").Object3D);
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
        <button
          type="button"
          className="upload-button"
          onClick={() => setShowHelp(true)}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <HelpCircle size={16} /> Help
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
            <button
              type="button"
              className="upload-button"
              onClick={() => glbInputRef.current?.click()}
            >
              Import GLB
            </button>
            <input
              ref={glbInputRef}
              type="file"
              accept=".glb,model/gltf-binary"
              onChange={handleGLBImport}
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="upload-button"
              onClick={clearScene}
              disabled={objects.length === 0}
              style={{ backgroundColor: objects.length === 0 ? "inherit" : "#ff4d4f", color: "white", borderColor: "transparent" }}
            >
              Clear Scene
            </button>
          </div>

          <div className="studio-history-controls">
            <button type="button" className="upload-button" onClick={undo} disabled={!history.past.length}>
              ↶ Undo
            </button>
            <button type="button" className="upload-button" onClick={redo} disabled={!history.future.length}>
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
                  className="upload-button"
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
                className="upload-button"
                onClick={handleExportJSON}
                disabled={!objects.length}
              >
                Export JSON
              </button>
              <button
                type="button"
                className="upload-button"
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

          <div className="studio-controls" style={{ marginBottom: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", color: "#a0aec0" }}>
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
              />
              Snap to Grid (0.5)
            </label>
          </div>

          <div className="studio-controls" style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="upload-button"
              onClick={() => setCameraPreset("front")}
              style={{ flex: 1 }}
            >
              Front
            </button>
            <button
              type="button"
              className="upload-button"
              onClick={() => setCameraPreset("top")}
              style={{ flex: 1 }}
            >
              Top
            </button>
            <button
              type="button"
              className="upload-button"
              onClick={() => setCameraPreset("iso")}
              style={{ flex: 1 }}
            >
              Iso
            </button>
            <button
              type="button"
              className={autoRotate ? "upload-button" : "filter"}
              onClick={() => setAutoRotate(!autoRotate)}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <RotateCw size={16} /> Auto Rotate
            </button>
          </div>

          <div className="studio-canvas" ref={canvasHost}>
            <span className="studio-hint">3D LIVE PREVIEW</span>
          </div>

          <div className="studio-transform-panel">
            <h3>Scene Lighting</h3>
            <div className="studio-controls" style={{ marginBottom: "8px", display: "flex", gap: "8px" }}>
              <button
                type="button"
                className={activeLighting === "day" ? "upload-button" : "filter"}
                onClick={() => setLightingPreset("day")}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Sun size={16} color="#fbbf24" /> Day
              </button>
              <button
                type="button"
                className={activeLighting === "night" ? "upload-button" : "filter"}
                onClick={() => setLightingPreset("night")}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Moon size={16} color="#818cf8" /> Night
              </button>
              <button
                type="button"
                className={activeLighting === "studio" ? "upload-button" : "filter"}
                onClick={() => setLightingPreset("studio")}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <Lightbulb size={16} color="#facc15" /> Studio
              </button>
            </div>
            <div className="studio-controls" style={{ marginBottom: "8px" }}>
              <label>
                Background Color
                <input
                  type="color"
                  value={bgColor}
                  onChange={(event) => setBgColor(event.target.value)}
                />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
                <input
                  type="checkbox"
                  checked={useEnvMap}
                  onChange={(e) => setUseEnvMap(e.target.checked)}
                />
                HDRI Reflections
              </label>
            </div>
            <div className="studio-controls">
              <label>
                Ambient Light: {ambientIntensity.toFixed(2)}
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={0.1}
                  value={ambientIntensity}
                  onChange={(event) => {
                    setAmbientIntensity(Number(event.target.value));
                    setActiveLighting(null);
                  }}
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
                  onChange={(event) => {
                    setDirectionalIntensity(Number(event.target.value));
                    setActiveLighting(null);
                  }}
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

              {selectedObject.shape === "text" && (
                <div className="studio-controls" style={{ marginBottom: "8px" }}>
                  <label style={{ width: "100%" }}>
                    Text Content
                    <input
                      type="text"
                      value={selectedObject.text || ""}
                      onChange={(e) => {
                        commitObjects(
                          objects.map((item) =>
                            item.id === selectedObject.id ? { ...item, text: e.target.value } : item
                          )
                        );
                      }}
                      disabled={selectedObject.locked}
                    />
                  </label>
                </div>
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
                <div style={{ display: "flex", gap: "4px", marginBottom: "8px", flexWrap: "wrap" }}>
                  {MATERIAL_PRESETS.map((preset) => {
                    const Icon = preset.icon;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        className="filter"
                        onClick={() => applyMaterialPreset(preset)}
                        disabled={selectedObject.locked}
                        style={{
                          flex: "1 1 30%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          fontSize: "0.8rem",
                          padding: "6px"
                        }}
                        title={preset.name}
                      >
                        <Icon size={14} /> {preset.name}
                      </button>
                    );
                  })}
                </div>

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
                <button type="button" className="upload-button" onClick={centerAndFitObject}>
                  Fit to Center
                </button>
                <button type="button" className="upload-button" onClick={duplicateObject}>
                  Duplicate
                </button>
                <button type="button" className="upload-button" onClick={deleteObject}>
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
        <UI3DPreview />
      )}

      {showHelp && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            style={{
              backgroundColor: "#111e31",
              color: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "100%",
              border: "1px solid #168de2",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#168de2" }}>ការណែនាំ និង Shortcuts</h3>
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", display: "flex" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: "16px", lineHeight: "1.6" }}>
              <h4 style={{ marginBottom: "8px", fontSize: "1rem" }}>⌨️ Keyboard Shortcuts</h4>
              <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "0.9rem", color: "#a0aec0" }}>
                <li><strong>Ctrl + D</strong> (ឬ Cmd + D): ចម្លងវត្ថុដែលបានជ្រើស (Duplicate)</li>
                <li><strong>Ctrl + Z</strong> (ឬ Cmd + Z): Undo</li>
                <li><strong>Ctrl + Shift + Z</strong> (ឬ Ctrl + Y): Redo</li>
                <li><strong>Delete</strong> ឬ <strong>Backspace</strong>: លុបវត្ថុដែលបានជ្រើស</li>
                <li><strong>Esc</strong>: ដោះជម្រើសវត្ថុ (Deselect)</li>
              </ul>
            </div>

            <div style={{ lineHeight: "1.6" }}>
              <h4 style={{ marginBottom: "8px", fontSize: "1rem" }}>💡 គន្លឹះបន្ថែម</h4>
              <ul style={{ paddingLeft: "20px", margin: 0, fontSize: "0.9rem", color: "#a0aec0" }}>
                <li>អ្នកអាច Import File <strong>.glb</strong> ពីខាងក្រៅបាន។</li>
                <li>ចុច <strong>Fit to Center</strong> ដើម្បីដាក់ Model ឱ្យនៅកណ្តាល និងមានទំហំស្តង់ដារ។</li>
                <li>ប្រើ <strong>Snap to Grid</strong> ដើម្បីកំណត់ទីតាំងឱ្យត្រង់បន្ទាត់។</li>
                <li>ចុចលើ Icon <strong>👁️</strong> ដើម្បីលាក់/បង្ហាញ និង <strong>🔒</strong> ដើម្បីចាក់សោវត្ថុ។</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
