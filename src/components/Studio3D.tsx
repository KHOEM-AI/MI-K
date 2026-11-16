import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Unlock, Pencil, HelpCircle, X, Camera, Trash2, Copy, RotateCcw } from "lucide-react";
import { saveAsset } from "../lib/storage.mjs";
import { UI3DPreview } from "./UI3DPreview";
import { presets, MATERIAL_PRESETS, zero, one, createId } from "./studioConstants";
import { createGeometry, disposeMesh } from "./studioGeometry";
import { CameraPresets } from "./CameraPresets";
import { SceneLightingPanel } from "./SceneLightingPanel";
import { MaterialPanel } from "./MaterialPanel";
import { TransformPanel } from "./TransformPanel";
import type { Shape, Vector3, SceneObject, StudioAsset, Studio3DProps } from "./studioTypes";
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

export default function Studio3D({ onAssetSaved }: Studio3DProps) {
  const canvasHost = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<import("three").Scene | null>(null);
  const meshesRef = useRef(new Map<string, import("three").Object3D>());
  const controlsRef = useRef<import("three/examples/jsm/controls/OrbitControls.js").OrbitControls | null>(null);
  const cameraRef = useRef<import("three").PerspectiveCamera | null>(null);
  const rendererRef = useRef<import("three").WebGLRenderer | null>(null);
  const hemiLightRef = useRef<import("three").HemisphereLight | null>(null);
  const dirLightRef = useRef<import("three").DirectionalLight | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const glbInputRef = useRef<HTMLInputElement | null>(null);
  const txtInputRef = useRef<HTMLInputElement | null>(null);
  const allScenesInputRef = useRef<HTMLInputElement | null>(null);

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [sceneSearchQuery, setSceneSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | null>(null);
  const lastSnapshotRef = useRef<string>("");
  const autoSaveTimerRef = useRef<number | null>(null);
  const [bgColor, setBgColor] = useState("#080f1b");
  const [showHelp, setShowHelp] = useState(false);
  const [useEnvMap, setUseEnvMap] = useState(true);
  const useEnvMapRef = useRef(useEnvMap);
  useEnvMapRef.current = useEnvMap;
  const [activeLighting, setActiveLighting] = useState<"day" | "night" | "studio" | null>("day");
  const baselineRef = useRef<string>("");
  const autosaveTimerRef = useRef<number | null>(null);

  const selectedObject = objects.find((item) => item.id === selectedId);

  const TOUR_STEPS = [
    {
      title: "សូមស្វាគមន៍មកកាន់ KHOEM-AI 3D Studio! 🎉",
      body: "អ្នកអាចបង្កើត កែសម្រួល និង Export វត្ថុ 3D បានយ៉ាងងាយស្រួល។ តោះ! មើល Feature សំខាន់ៗទាំងអស់គ្នា។",
    },
    {
      title: "1. បន្ថែមវត្ថុ 3D",
      body: "ចុចប៊ូតុង '+ Add Object' ដើម្បីបន្ថែម Cube, Sphere, Cone, Cylinder, Ring ឬ Text។ អ្នកក៏អាច Import GLB ឬ .txt បានផងដែរ។",
    },
    {
      title: "2. កែសម្រួល Material",
      body: "ជ្រើសរើសវត្ថុមួយ រួចកែ Color, Metalness, Roughness, បន្ថែម Texture ឬជ្រើស Preset ដូចជា Gold, Silver, Glass។",
    },
    {
      title: "3. ពន្លឺ និង Camera",
      body: "ប្តូរ Lighting Preset (Day/Night/Studio), បើក Shadows, ឬប្រើ Camera Presets (Front/Top/Iso) ដើម្បីមើលវត្ថុពីមុំផ្សេងៗ។",
    },
    {
      title: "4. Save & Backup",
      body: "រក្សាទុក Scene ជា Local Storage (Save Scene), បង្កើត Version ថ្មី (Save As New), Export/Import JSON, ឬ Export All Scenes។",
    },
    {
      title: "5. Multi-Select & Group",
      body: "Ctrl+Click ដើម្បីជ្រើសវត្ថុច្រើន, Shift+Click សម្រាប់ Range, ឬប្រើ Group ដើម្បីដាក់វត្ថុជាក្រុម។",
    },
    {
      title: "6. Keyboard Shortcuts",
      body: "ប្រើ Ctrl+Z (Undo), Ctrl+D (Duplicate), F (Fit to Center), Delete (លុប), Esc (ដោះជម្រើស) ដើម្បីធ្វើការបានលឿន។",
    },
    {
      title: "7. Export & Share 🚀",
      body: "Export PNG (Screenshot) ឬ Export GLB ដើម្បីចែករំលែក Scene ទៅកាន់អ្នកដទៃ។ សូមរីករាយនឹងការបង្កើត!",
    },
  ];

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("khoem-ai-tour-seen");
    if (!hasSeenTour) {
      // Delay slightly so scene is rendered first
      const timer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  function toggleSelectObject(id: string, event: React.MouseEvent) {
    const isCtrl = event.ctrlKey || event.metaKey;
    const isShift = event.shiftKey;
    const clickedObject = objects.find((o) => o.id === id);
    const groupMembers = clickedObject?.groupId
      ? objects.filter((o) => o.groupId === clickedObject.groupId).map((o) => o.id)
      : [id];

    if (isCtrl) {
      // Ctrl+Click: Toggle selection (for group, toggle all members)
      const allSelected = groupMembers.every((gid) => selectedIds.includes(gid));
      const nextSelectedIds = allSelected
        ? selectedIds.filter((x) => !groupMembers.includes(x))
        : [...new Set([...selectedIds, ...groupMembers])];

      setSelectedIds(nextSelectedIds);
      setSelectedId(
        allSelected
          ? nextSelectedIds[nextSelectedIds.length - 1] ?? null
          : id
      );
    } else if (isShift && selectedId) {
      // Shift+Click: Range select
      const currentIndex = objects.findIndex((o) => o.id === selectedId);
      const targetIndex = objects.findIndex((o) => o.id === id);
      if (currentIndex !== -1 && targetIndex !== -1) {
        const start = Math.min(currentIndex, targetIndex);
        const end = Math.max(currentIndex, targetIndex);
        const range = objects.slice(start, end + 1).map((o) => o.id);
        setSelectedIds(range);
        setSelectedId(id);
      }
    } else {
      // Normal click: Select whole group (if in group) or single object
      setSelectedId(id);
      setSelectedIds(groupMembers);
    }
  }

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

      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;
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
      rendererRef.current = null;
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

  // Auto-save Scene every 30 seconds (if changes detected)
  useEffect(() => {
    if (!sceneReady || objects.length === 0) return;

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      window.clearInterval(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setInterval(() => {
      const currentSnapshot = serializeForBaseline(
        objects,
        ambientIntensity,
        directionalIntensity,
        bgColor
      );

      // Only save if changed since last successful auto-save
      if (currentSnapshot === lastSnapshotRef.current) return;

      const timestamp = new Date().toLocaleTimeString();
      const now = Date.now();
      const previousAutoSave = listScenes().find(
        (scene) => scene && scene.id === "autosave-latest"
      );
      const snapshot: SceneSnapshot = {
        id: "autosave-latest",
        name: `Auto-Save ${timestamp}`,
        objects,
        ambientIntensity,
        directionalIntensity,
        backgroundColor: bgColor,
        thumbnail: captureSceneThumbnail(),
        createdAt: previousAutoSave?.createdAt ?? now,
        updatedAt: now,
      };

      if (saveScene(snapshot)) {
        lastSnapshotRef.current = currentSnapshot;
        refreshSavedScenes();
        console.log(`[Auto-Save] Scene saved at ${timestamp}`);
      }
    }, 30000); // 30 seconds

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [objects, ambientIntensity, directionalIntensity, bgColor, sceneReady]);

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
                fontLoader.load("/fonts/helvetiker_regular.typeface.json", resolve);
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

  function groupSelectedObjects() {
    if (selectedIds.length < 2) {
      setMessage("សូមជ្រើសរើសវត្ថុយ៉ាងហោចណាស់ ២ ដើម្បីបង្កើត Group។");
      return;
    }

    const groupName = window.prompt("បញ្ចូលឈ្មោះ Group:", "Group 1");
    if (!groupName?.trim()) return;

    const newGroupId = createId();
    commitObjects(
      objects.map((item) =>
        selectedIds.includes(item.id)
          ? { ...item, groupId: newGroupId, groupName: groupName.trim() }
          : item
      )
    );
    setMessage(`បានបង្កើត Group "${groupName.trim()}" ជាមួយវត្ថុ ${selectedIds.length}។`);
  }

  function ungroupSelectedObjects() {
    if (selectedIds.length === 0) {
      setMessage("សូមជ្រើសរើសវត្ថុដើម្បីដោះចេញពី Group។");
      return;
    }

    commitObjects(
      objects.map((item) =>
        selectedIds.includes(item.id)
          ? { ...item, groupId: undefined, groupName: undefined }
          : item
      )
    );
    setMessage(`បានដោះវត្ថុ ${selectedIds.length} ចេញពី Group។`);
  }

  function duplicateObject() {
    if (!selectedObject) return;

    const idsToDuplicate = new Set(
      selectedIds.length > 0 ? selectedIds : [selectedObject.id]
    );

    const copies: SceneObject[] = [];
    objects.forEach((item) => {
      if (idsToDuplicate.has(item.id)) {
        copies.push({
          ...item,
          id: createId(),
          name: `${item.name} Copy`,
          position: {
            ...item.position,
            x: item.position.x + 1.5,
          },
          rotation: { ...item.rotation },
          scale: { ...item.scale },
          visible: item.visible !== false,
          locked: false,
          textureData: item.textureData,
        });
      }
    });

    if (copies.length === 0) return;

    commitObjects([...objects, ...copies]);
    setSelectedId(copies[copies.length - 1].id);
    setSelectedIds(copies.map((c) => c.id));
    setMessage(`បានចម្លងវត្ថុ ${copies.length}។`);
  }

  function deleteObject() {
    const idsToDelete = new Set(
      selectedIds.length > 0 ? selectedIds : selectedId ? [selectedId] : []
    );

    if (idsToDelete.size === 0) return;

    const remaining = objects.filter((item) => !idsToDelete.has(item.id));
    commitObjects(remaining);
    setSelectedId(remaining[remaining.length - 1]?.id ?? null);
    setSelectedIds([]);
    setMessage(`បានលុបវត្ថុ ${idsToDelete.size}។`);
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

  function handleTextImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 10 * 1024) {
      setMessage("ឯកសារ .txt ធំពេក (អតិបរមា 10KB)។");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      const trimmed = text.trim().slice(0, 100); // កំណត់អក្សរអតិបរមា ១០០ តួ
      if (!trimmed) {
        setMessage("ឯកសារ .txt ទទេ។");
        return;
      }

      const next: SceneObject = {
        id: createId(),
        name: `Text: ${file.name.replace(/\.txt$/i, "")}`,
        shape: "text",
        color: "#168de2",
        metalness: 0.25,
        roughness: 0.35,
        text: trimmed,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        visible: true,
        locked: false,
        textureData: null,
      };

      commitObjects([...objects, next]);
      setSelectedId(next.id);
      setMessage(`បាន Import Text ពី File: "${file.name}"។`);
    };

    reader.onerror = () => {
      setMessage(`មិនអាចអានឯកសារ .txt "${file.name}" បានទេ។`);
    };

    reader.readAsText(file);
  }

  function clearScene() {
    if (!objects.length) return;
    if (!window.confirm("តើអ្នកពិតជាចង់លុបវត្ថុទាំងអស់ចេញពី Scene មែនទេ?")) return;
    commitObjects([]);
    setSelectedId(null);
    setSelectedIds([]);
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
      thumbnail: captureSceneThumbnail(),
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

  function handleSaveAsNewScene() {
    const baseName = sceneName.trim() || "Scene";
    const newName = `${baseName} Copy ${new Date().toLocaleTimeString()}`;
    const now = Date.now();
    const newId = createId();

    const snapshot: SceneSnapshot = {
      id: newId,
      name: newName,
      objects,
      ambientIntensity,
      directionalIntensity,
      backgroundColor: bgColor,
      thumbnail: captureSceneThumbnail(),
      createdAt: now,
      updatedAt: now,
    };

    const ok = saveScene(snapshot);
    if (ok) {
      refreshSavedScenes();
      setCurrentSceneId(newId);
      setSceneName(newName);
      baselineRef.current = serializeForBaseline(
        objects,
        ambientIntensity,
        directionalIntensity,
        bgColor
      );
      clearAutobackup();
      setPendingAutobackup(null);
      setMessage(`បានបង្កើត Scene ថ្មី: "${newName}"។`);
    } else {
      setMessage("មិនអាចបង្កើត Scene ថ្មីបានទេ។");
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

  function handleRenameScene(id: string, currentName: string) {
    const newName = window.prompt("បញ្ចូលឈ្មោះថ្មីសម្រាប់ Scene:", currentName);
    if (!newName?.trim() || newName.trim() === currentName) return;

    const snapshot = loadScene(id);
    if (!snapshot) {
      setMessage("រកមិនឃើញ Scene នេះទេ។");
      return;
    }

    const updated: SceneSnapshot = {
      ...snapshot,
      name: newName.trim(),
      updatedAt: Date.now(),
    };

    if (saveScene(updated)) {
      refreshSavedScenes();
      if (currentSceneId === id) setSceneName(newName.trim());
      setMessage(`បានប្តូរឈ្មោះទៅ "${newName.trim()}"។`);
    } else {
      setMessage("មិនអាចប្តូរឈ្មោះ Scene បានទេ។");
    }
  }

  function handleDuplicateScene(id: string) {
    const snapshot = loadScene(id);
    if (!snapshot) {
      setMessage("រកមិនឃើញ Scene នេះទេ។");
      return;
    }

    const copy: SceneSnapshot = {
      ...snapshot,
      id: createId(),
      name: `${snapshot.name} Copy`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (saveScene(copy)) {
      refreshSavedScenes();
      setMessage(`បានចម្លង Scene ទៅ "${copy.name}"។`);
    } else {
      setMessage("មិនអាចចម្លង Scene បានទេ។");
    }
  }

  function handleResetTour() {
    localStorage.removeItem("khoem-ai-tour-seen");
    setShowSettings(false);
    setTourStep(0);
    setShowTour(true);
    setMessage("បានកំណត់ Tour ឡើងវិញ។");
  }

  function handleClearAllData() {
    if (
      !window.confirm(
        "តើអ្នកពិតជាចង់លុបទិន្នន័យទាំងអស់មែនទេ? (Scene ទាំងអស់ និង Auto-Save នឹងត្រូវលុប ហើយមិនអាចត្រឡប់វិញបានទេ)"
      )
    )
      return;

    localStorage.removeItem("khoem-ai.scenes.v1");
    localStorage.removeItem("khoem-ai.autobackup.v1");
    localStorage.removeItem("khoem-ai-tour-seen");

    // Reset auto-save baselines to prevent empty data from being saved again.
    const emptySnapshot = serializeForBaseline(
      [],
      ambientIntensity,
      directionalIntensity,
      bgColor
    );
    lastSnapshotRef.current = emptySnapshot;
    baselineRef.current = emptySnapshot;

    setObjects([]);
    setSelectedId(null);
    setSelectedIds([]);
    setSceneName("");
    setCurrentSceneId(null);
    setSavedScenes([]);
    setPendingAutobackup(null);
    setShowSettings(false);
    setMessage("បានលុបទិន្នន័យទាំងអស់។ App ត្រូវបានកំណត់ឡើងវិញ។");
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

  const filteredSavedScenes = savedScenes
    .filter((scene) =>
      scene.name.toLowerCase().includes(sceneSearchQuery.toLowerCase().trim())
    )
    .sort((a, b) => {
      if (sortOrder === "newest") return b.updatedAt - a.updatedAt;
      if (sortOrder === "oldest") return a.updatedAt - b.updatedAt;
      if (sortOrder === "name-asc") return a.name.localeCompare(b.name);
      if (sortOrder === "name-desc") return b.name.localeCompare(a.name);
      return 0;
    });
  const filteredObjects = objects.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  function captureSceneThumbnail(): string | null {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return null;
    try {
      renderer.render(scene, camera);
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 90;
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.drawImage(renderer.domElement, 0, 0, 160, 90);
      return canvas.toDataURL("image/jpeg", 0.55);
    } catch (error) {
      console.warn("Scene thumbnail capture failed:", error);
      return null;
    }
  }

  function handleExportPNG() {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    // Render once more just before capturing to ensure the buffer is not cleared
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL("image/png");

    const link = document.createElement("a");
    link.download = `KHOEM-AI-Screenshot-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    setMessage("បានថតរូប 3D Preview ជោគជ័យ។");
  }

  function handleExportAllScenes() {
    const allScenes = listScenes();
    if (allScenes.length === 0) {
      setMessage("មិនមាន Scene ដែលបានរក្សាទុកទេ។");
      return;
    }

    const payload = {
      version: 1,
      exportedAt: Date.now(),
      app: "KHOEM-AI 3D Studio",
      type: "all-scenes",
      scenes: allScenes,
    };

    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const filename = `KHOEM-AI-All-Scenes-${Date.now()}.json`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 3000);

    setMessage(`បាន Export Scene ទាំង ${allScenes.length} ជា JSON។`);
  }

  function handleStartRecording() {
    const renderer = rendererRef.current;
    if (!renderer) return;

    try {
      const canvas = renderer.domElement;
      const stream = canvas.captureStream(30); // 30 FPS

      // Try to use VP9 first for better quality, fallback to VP8
      let mimeType = "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8";
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      const startedAt = Date.now();

      recorder.onstop = () => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        stream.getTracks().forEach((track) => track.stop());
        if (recordingTimeoutRef.current !== null) {
          window.clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `KHOEM-AI-${(sceneName || "Scene").replace(/[^\w-]/g, "_")}-${Date.now()}.webm`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 3000);

        setMessage(`បានថតវីដេអូរួចរាល់! (${elapsed}s)`);
        setRecordingTime(0);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      setMessage("កំពុងថតវីដេអូ... ចុច Stop ដើម្បីបញ្ចប់។");

      // Auto-stop after 30 seconds
      recordingTimeoutRef.current = window.setTimeout(() => {
        handleStopRecording();
      }, 30000);
    } catch (error) {
      console.error("Recording failed:", error);
      setMessage("មិនអាចថតវីដេអូបានទេ។ Browser របស់អ្នកអាចមិនគាំទ្រ។");
    }
  }

  function handleStopRecording() {
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
    }
  }

  // Update recording time counter
  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  async function handleExportHTML() {
    if (exporting || objects.length === 0) return;

    setExporting(true);
    setMessage("កំពុងបង្កើត HTML...");

    try {
      // First, generate the GLB data URL using existing export logic
      const THREE = await import("three");
      const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");

      const exportScene = new THREE.Scene();
      exportScene.background = new THREE.Color(bgColor);

      // Add lights
      const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);
      exportScene.add(ambient);
      const directional = new THREE.DirectionalLight(0xffffff, directionalIntensity);
      directional.position.set(4, 5, 4);
      exportScene.add(directional);

      // Add objects (reuse existing logic)
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
              fontLoader.load("/fonts/helvetiker_regular.typeface.json", resolve);
            });
            geo = new TextGeometry(item.text || "Hello", {
              font, size: 1.5, depth: 0.3, curveSegments: 12,
              bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.03, bevelOffset: 0, bevelSegments: 5,
            });
            geo.computeBoundingBox();
            if (geo.boundingBox) {
              geo.translate(-0.5 * (geo.boundingBox.max.x - geo.boundingBox.min.x), 0, 0);
            }
          } else {
            geo = createGeometry(THREE, item.shape);
          }

          const mesh = new THREE.Mesh(geo, material);
          mesh.position.set(item.position.x, item.position.y, item.position.z);
          mesh.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
          mesh.scale.set(item.scale.x, item.scale.y, item.scale.z);
          mesh.name = item.name;
          exportScene.add(mesh);
        })
      );

      exportScene.updateMatrixWorld(true);

      // Export to GLB data URL
      const exporter = new GLTFExporter();
      const glbResult = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(exportScene, (output) => {
          if (output instanceof ArrayBuffer) resolve(output);
          else reject(new Error("GLB export failed"));
        }, reject, { binary: true });
      });

      const glbBase64 = btoa(
        new Uint8Array(glbResult).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const glbDataUrl = `data:model/gltf-binary;base64,${glbBase64}`;

      // Create HTML with embedded Three.js viewer
      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sceneName || "KHOEM-AI 3D Scene"}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; background: ${bgColor}; overflow: hidden; }
    #canvas-container { width: 100vw; height: 100vh; }
    #info { position: fixed; top: 16px; left: 16px; color: #fff; background: rgba(0,0,0,0.7); padding: 12px 16px; border-radius: 8px; font-size: 14px; }
    #info strong { color: #168de2; }
  </style>
</head>
<body>
  <div id="info">
    <strong>${sceneName || "KHOEM-AI Scene"}</strong><br>
    ${objects.length} objects · ${new Date().toLocaleDateString()}<br>
    <small>Drag to rotate · Scroll to zoom</small>
  </div>
  <div id="canvas-container"></div>
  <script type="importmap">
    { "imports": { "three": "https://unpkg.com/three@0.160.0/build/three.module.js", "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/" } }
  </script>
  <script type="module">
    import * as THREE from "three";
    import { OrbitControls } from "three/addons/controls/OrbitControls.js";
    import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("${bgColor}");

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(4, 3, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    document.getElementById("canvas-container").appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;

    // Load GLB from embedded data
    const loader = new GLTFLoader();
    loader.load("${glbDataUrl}", (gltf) => {
      scene.add(gltf.scene);
      // Auto-fit camera
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const distance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
      camera.position.set(center.x + distance, center.y + distance * 0.5, center.z + distance);
      controls.target.copy(center);
      controls.update();
    });

    const grid = new THREE.GridHelper(12, 12, 0x31516e, 0x1b2b40);
    grid.position.y = -1.2;
    scene.add(grid);

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;

      // Download the HTML file
      const blob = new Blob([htmlContent], { type: "text/html" });
      const filename = `KHOEM-AI-${(sceneName || "Scene").replace(/[^\w-]/g, "_")}-${Date.now()}.html`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);

      setMessage(`បាន Export Scene ជា HTML: ${filename}`);
    } catch (error) {
      console.error("HTML export failed:", error);
      setMessage(error instanceof Error ? `Export HTML failed: ${error.message}` : "មិនអាច Export HTML បានទេ។");
    } finally {
      setExporting(false);
    }
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

  function handleImportAllScenesFile(file: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = typeof e.target?.result === "string" ? e.target.result : "";
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

      // Validate that this is an "all-scenes" payload
      if (
        !parsed ||
        typeof parsed !== "object" ||
        !("scenes" in parsed) ||
        !Array.isArray((parsed as any).scenes)
      ) {
        setMessage("ឯកសារនេះមិនមែនជា 'All Scenes' backup ទេ។");
        return;
      }

      const scenes = (parsed as any).scenes as unknown[];
      if (scenes.length === 0) {
        setMessage("ឯកសារគ្មាន Scene ណាមួយទេ។");
        return;
      }

      // Import each scene using the existing saveScene function
      let imported = 0;
      let skipped = 0;

      scenes.forEach((scene: unknown, index: number) => {
        if (
          !scene ||
          typeof scene !== "object" ||
          !("id" in scene) ||
          !("name" in scene) ||
          !("objects" in scene) ||
          !Array.isArray((scene as any).objects)
        ) {
          skipped++;
          return;
        }

        const snapshot: SceneSnapshot = {
          id: createId(),
          name: (scene as any).name,
          objects: (scene as any).objects,
          ambientIntensity: (scene as any).ambientIntensity ?? 2,
          directionalIntensity: (scene as any).directionalIntensity ?? 3,
          backgroundColor: (scene as any).backgroundColor ?? "#080f1b",
          thumbnail: (scene as any).thumbnail ?? null,
          createdAt: (scene as any).createdAt ?? Date.now(),
          updatedAt: Date.now(),
        };

        if (saveScene(snapshot)) imported++;
        else skipped++;
      });

      refreshSavedScenes();
      setMessage(`បាន Import Scene ${imported}${skipped > 0 ? ` (រំលង ${skipped})` : ""}។`);
    };

    reader.onerror = () => {
      setMessage("មិនអាចអានឯកសារបានទេ។");
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
              fontLoader.load("/fonts/helvetiker_regular.typeface.json", resolve);
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
          onClick={() => setShowSettings(true)}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}
        >
          ⚙️ Settings
        </button>
        <button
          type="button"
          className="upload-button"
          onClick={() => setShowHelp(true)}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
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
              onClick={() => txtInputRef.current?.click()}
            >
              Import .txt
            </button>
            <input
              ref={txtInputRef}
              type="file"
              accept=".txt,text/plain"
              onChange={handleTextImport}
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
                className="filter"
                onClick={handleSaveAsNewScene}
                title="បង្កើត Scene ថ្មីដោយមិនប៉ះពាល់ដើម"
              >
                Save As New
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
              <button
                type="button"
                className="filter"
                onClick={handleExportAllScenes}
                disabled={savedScenes.length === 0}
                style={{ color: savedScenes.length === 0 ? "inherit" : "#4a90d9" }}
              >
                Export All ({savedScenes.length})
              </button>
              <button
                type="button"
                className="filter"
                onClick={() => allScenesInputRef.current?.click()}
                style={{ color: "#4a90d9" }}
              >
                Import All
              </button>
              <input
                ref={allScenesInputRef}
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) handleImportAllScenesFile(file);
                }}
                style={{ display: "none" }}
              />
            </div>

            {savedScenes.length === 0 ? (
              <p className="studio-note">
                មិនទាន់មាន Scene ដែលបានរក្សាទុកទេ។ សូមដាក់ឈ្មោះ ហើយចុច Save Scene។
              </p>
            ) : (
              <>
                {savedScenes.length > 3 && (
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <input
                      type="text"
                      placeholder="ស្វែងរក Scene..."
                      value={sceneSearchQuery}
                      onChange={(e) => setSceneSearchQuery(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #31516e",
                        backgroundColor: "#080f1b",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        boxSizing: "border-box",
                      }}
                    />
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
                      title="តម្រៀប"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #31516e",
                        backgroundColor: "#080f1b",
                        color: "#ffffff",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                      }}
                    >
                      <option value="newest">ថ្មីបំផុត</option>
                      <option value="oldest">ចាស់បំផុត</option>
                      <option value="name-asc">ឈ្មោះ A-Z</option>
                      <option value="name-desc">ឈ្មោះ Z-A</option>
                    </select>
                  </div>
                )}
                {filteredSavedScenes.length === 0 && sceneSearchQuery.trim() ? (
                  <p className="studio-note">រកមិនឃើញ Scene ដែលត្រូវនឹងការស្វែងរកទេ។</p>
                ) : (
                  <div className="studio-object-list">
                    {filteredSavedScenes.map((scene) => (
                  <div
                    key={scene.id}
                    className={
                      currentSceneId === scene.id
                        ? "studio-object-item selected"
                        : "studio-object-item"
                    }
                    title={`ឈ្មោះ: ${scene.name}\nចំនួនវត្ថុ: ${(scene.objects as SceneObject[]).length}\nបង្កើត: ${new Date(scene.createdAt).toLocaleString()}\nកែប្រែចុងក្រោយ: ${new Date(scene.updatedAt).toLocaleString()}`}
                  >
                    {scene.thumbnail ? (
                      <img
                        src={scene.thumbnail}
                        alt={`${scene.name} preview`}
                        width={80}
                        height={45}
                        style={{ objectFit: "cover", borderRadius: "6px", flexShrink: 0 }}
                      />
                    ) : null}
                    <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {scene.name}
                    </span>
                    <small style={{ marginRight: "8px" }}>
                      {(scene.objects as SceneObject[]).length} obj
                    </small>
                    <button
                      type="button"
                      title="ចម្លង"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateScene(scene.id);
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", color: "#4a90d9" }}
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      type="button"
                      title="ប្តូរឈ្មោះ"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameScene(scene.id, scene.name);
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", color: "#a0aec0" }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      title="លុប"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(scene.id);
                      }}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", color: "#ff6b6b" }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      type="button"
                      className="filter"
                      onClick={() => handleLoadScene(scene.id)}
                      style={{ marginLeft: "4px" }}
                    >
                      Load
                    </button>
                    </div>
                    ))}
                  </div>
                )}
              </>
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

          <CameraPresets
            setCameraPreset={setCameraPreset}
            autoRotate={autoRotate}
            setAutoRotate={setAutoRotate}
          />

          <div className="studio-canvas" ref={canvasHost}>
            <span className="studio-hint">3D LIVE PREVIEW</span>
          </div>

          <SceneLightingPanel
            activeLighting={activeLighting}
            setLightingPreset={setLightingPreset}
            bgColor={bgColor}
            setBgColor={setBgColor}
            useEnvMap={useEnvMap}
            setUseEnvMap={setUseEnvMap}
            ambientIntensity={ambientIntensity}
            setAmbientIntensity={setAmbientIntensity}
            directionalIntensity={directionalIntensity}
            setDirectionalIntensity={setDirectionalIntensity}
            setActiveLighting={setActiveLighting}
          />

          <div className="studio-object-manager">
            <h3>
              Scene Objects ({objects.length})
              {sceneReady && (
                <span style={{ color: "#6b7280", fontSize: "0.7rem", marginLeft: "8px" }}>
                  💾 Auto-Save
                </span>
              )}
              {selectedIds.length > 1 && (
                <span style={{ color: "#4a90d9", fontSize: "0.85rem", marginLeft: "8px" }}>
                  ({selectedIds.length} ជ្រើស)
                </span>
              )}
            </h3>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button
                type="button"
                className="filter"
                disabled={selectedIds.length < 2}
                onClick={groupSelectedObjects}
              >
                Group
              </button>
              <button
                type="button"
                className="filter"
                disabled={selectedIds.length === 0}
                onClick={ungroupSelectedObjects}
              >
                Ungroup
              </button>
            </div>
            {objects.length > 0 && (
              <input
                type="text"
                placeholder="ស្វែងរកឈ្មោះវត្ថុ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  marginBottom: "12px",
                  borderRadius: "6px",
                  border: "1px solid #31516e",
                  backgroundColor: "#080f1b",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  boxSizing: "border-box",
                }}
              />
            )}
            {objects.length === 0 ? (
              <p className="studio-note">មិនទាន់មានវត្ថុទេ។ សូមចុច Add Object។</p>
            ) : filteredObjects.length === 0 ? (
              <p className="studio-note">រកមិនឃើញវត្ថុដែលត្រូវនឹងការស្វែងរកទេ។</p>
            ) : (
              <div className="studio-object-list">
                {selectedIds.length > 1 && (
                  <p className="studio-note" style={{ color: "#4a90d9", fontSize: "0.8rem", marginBottom: "8px" }}>
                    💡 ចុច Delete ដើម្បីលុបវត្ថុទាំង {selectedIds.length} ព្រមគ្នា
                  </p>
                )}
                {filteredObjects.map((item) => (
                  <div
                    key={item.id}
                    className={selectedId === item.id ? "studio-object-item selected" : "studio-object-item"}
                    onClick={(e) => toggleSelectObject(item.id, e)}
                    style={{
                      opacity: item.visible === false ? 0.5 : 1,
                      cursor: "pointer",
                      border: selectedIds.includes(item.id) && item.id !== selectedId
                        ? "1px dashed #4a90d9"
                        : undefined,
                      backgroundColor: item.groupId
                        ? "rgba(74, 144, 217, 0.05)"
                        : undefined,
                    }}
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
            <TransformPanel
              selectedObject={selectedObject}
              updateSelected={updateSelected}
              centerAndFitObject={centerAndFitObject}
              duplicateObject={duplicateObject}
              deleteObject={deleteObject}
              commitObjects={commitObjects}
              objects={objects}
            />
          )}

          <div className="studio-export">
            <button
              type="button"
              className="upload-button"
              onClick={handleExportPNG}
              disabled={!sceneReady}
              style={{ marginBottom: "8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              <Camera size={16} /> Export PNG (Screenshot)
            </button>
            <button
              type="button"
              className="upload-button"
              onClick={exportGLB}
              disabled={exporting || objects.length === 0}
            >
              {exporting ? "Exporting..." : `Export ${objects.length} Object(s) as GLB`}
            </button>
            <button
              type="button"
              className="filter"
              onClick={handleExportHTML}
              disabled={exporting || objects.length === 0}
              style={{ marginTop: "8px", color: "#4a90d9" }}
            >
              {exporting ? "Exporting..." : "Export as Interactive HTML"}
            </button>
            {isRecording ? (
              <button
                type="button"
                className="upload-button"
                onClick={handleStopRecording}
                style={{
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  backgroundColor: "#ff4d4f",
                  color: "white",
                  borderColor: "transparent",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "10px",
                    height: "10px",
                    backgroundColor: "white",
                    borderRadius: "50%",
                    animation: "pulse 1s ease-in-out infinite",
                  }}
                />
                Stop Recording ({recordingTime}s)
              </button>
            ) : (
              <button
                type="button"
                className="filter"
                onClick={handleStartRecording}
                disabled={!sceneReady || objects.length === 0}
                style={{ marginTop: "8px", color: "#ff4d4f" }}
              >
                ● Record Video (30s max)
              </button>
            )}
          </div>

          {message && <p className="backup-message" role="status">{message}</p>}

          <p className="studio-note">
            Move, Rotate និង Scale ប្រើអ័ក្ស X, Y, Z។ Undo/Redo អាចត្រឡប់ការកែប្រែបានរហូតដល់ 50 សកម្មភាព។
          </p>
        </>
      ) : (
        <UI3DPreview />
      )}

      {showTour && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 10000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "#111e31",
              color: "#ffffff",
              padding: "32px",
              borderRadius: "16px",
              maxWidth: "520px",
              width: "100%",
              border: "2px solid #168de2",
              boxShadow: "0 20px 60px rgba(22, 141, 226, 0.4)",
            }}
          >
            <h2 style={{ margin: "0 0 16px", color: "#168de2", fontSize: "1.4rem" }}>
              {TOUR_STEPS[tourStep].title}
            </h2>
            <p style={{ margin: "0 0 24px", lineHeight: "1.7", color: "#d1d5db" }}>
              {TOUR_STEPS[tourStep].body}
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                {tourStep + 1} / {TOUR_STEPS.length}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="filter"
                  onClick={() => {
                    localStorage.setItem("khoem-ai-tour-seen", "true");
                    setShowTour(false);
                  }}
                  style={{ padding: "8px 16px" }}
                >
                  រំលង (Skip)
                </button>
                {tourStep > 0 && (
                  <button
                    type="button"
                    className="filter"
                    onClick={() => setTourStep(tourStep - 1)}
                    style={{ padding: "8px 16px" }}
                  >
                    ត្រឡប់
                  </button>
                )}
                <button
                  type="button"
                  className="upload-button"
                  onClick={() => {
                    if (tourStep < TOUR_STEPS.length - 1) {
                      setTourStep(tourStep + 1);
                    } else {
                      localStorage.setItem("khoem-ai-tour-seen", "true");
                      setShowTour(false);
                    }
                  }}
                  style={{ padding: "8px 20px" }}
                >
                  {tourStep < TOUR_STEPS.length - 1 ? "បន្ទាប់" : "ចាប់ផ្តើម! 🚀"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>

      {showSettings && (
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
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              backgroundColor: "#111e31",
              color: "#ffffff",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "480px",
              width: "100%",
              border: "1px solid #168de2",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#168de2" }}>⚙️ Settings</h3>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                style={{ background: "none", border: "none", color: "#ffffff", cursor: "pointer", display: "flex" }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ fontSize: "1rem", marginBottom: "8px" }}>ការណែនាំ (Tour)</h4>
              <p style={{ fontSize: "0.9rem", color: "#a0aec0", marginBottom: "12px" }}>
                បើអ្នកចង់មើលការណែនាំឡើងវិញ សូមចុចប៊ូតុងខាងក្រោម។
              </p>
              <button
                type="button"
                className="upload-button"
                onClick={handleResetTour}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <RotateCcw size={16} /> Reset Tour
              </button>
            </div>

            <div style={{ borderTop: "1px solid #31516e", paddingTop: "20px" }}>
              <h4 style={{ fontSize: "1rem", marginBottom: "8px", color: "#ff6b6b" }}>
                តំបន់គ្រោះថ្នាក់
              </h4>
              <p style={{ fontSize: "0.9rem", color: "#a0aec0", marginBottom: "12px" }}>
                លុប Scene ទាំងអស់ Auto-Save និងការកំណត់ Tour។ សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។
              </p>
              <button
                type="button"
                className="filter"
                onClick={handleClearAllData}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#ff6b6b",
                  borderColor: "#ff6b6b",
                }}
              >
                <Trash2 size={16} /> Clear All Data
              </button>
            </div>
          </div>
        </div>
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
