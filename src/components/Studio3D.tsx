import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Unlock, Pencil, HelpCircle, X, Camera, Trash2, Copy, RotateCcw } from "lucide-react";
import { saveAsset } from "../lib/storage.mjs";
import { UI3DPreview } from "./UI3DPreview";
import { presets, MATERIAL_PRESETS, PLANT_COLOR_PRESETS, SKY_COLOR_PRESETS, WATER_COLOR_PRESETS, zero, one, createId } from "./studioConstants";
import { createGeometry, createCarGeometry, createFurnitureGeometry, createPlantGeometry, createPlantGeometry2, createPlantGeometry3, createPlantGeometry4, createEnvironmentGeometry, createEnvironmentGeometry2, createEnvironmentGeometry3, createSkyGeometry, createSpaceGeometry, createSpaceGeometry2, createStructureGeometry, createStructureGeometry2, createStructureGeometry3, createMonumentGeometry, createBuildingGeometry, createBuildingGeometry2, createBuildingGeometry3, createHospitalGeometry, createBankGeometry, createCivicGeometry, createEnergyGeometry, createTransportGeometry, createPersonalTransportGeometry, createFoodGeometry, createNatureGeometry, createFruitGeometry2, createPlantExtraGeometry, createParkGeometry, createStreetGeometry, createGardenGeometry, createMineralGeometry, createLuxuryCarGeometry, createAircraftGeometry, createBoatGeometry, createAnimalGeometry, createCharacterGeometry, createKhoemGeometry, createHighwayGeometry, createBridgeGeometry, createTrafficLightGeometry, createStreetLightGeometry, disposeMesh } from "./studioGeometry";
import { CameraPresets } from "./CameraPresets";
import { SceneLightingPanel } from "./SceneLightingPanel";
import { MaterialPanel } from "./MaterialPanel";
import { TransformPanel } from "./TransformPanel";
import { EnvironmentTemplates, generateTemplate } from "./EnvironmentTemplates";
import { RoadElementsPanel } from "./RoadElementsPanel";
import { KiPanel } from "./KiPanel";
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
  const [windEnabled, setWindEnabled] = useState(true);
  const [windStrength, setWindStrength] = useState(1.0);
  const windTimeRef = useRef(0);
  const [autoRotate, setAutoRotate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sceneSearchQuery, setSceneSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "name-asc" | "name-desc">("newest");
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [bgMusicFile, setBgMusicFile] = useState<File | null>(null);
  const bgMusicInputRef = useRef<HTMLInputElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
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
  const [blinkingLights, setBlinkingLights] = useState(true);
  const blinkingLightsRef = useRef(blinkingLights);
  blinkingLightsRef.current = blinkingLights;
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

      let wheelAngle = 0;
      let ledTime = 0;
      let trafficTime = 0;
      let previousFrameTime = 0;

      const animate = () => {
        if (cleanup || !renderer || !scene || !camera) return;
        const now = performance.now();
        const deltaSeconds = previousFrameTime
          ? Math.min((now - previousFrameTime) / 1000, 0.1)
          : 0;
        previousFrameTime = now;
        trafficTime += deltaSeconds;

        controls?.update();

        // Animate car wheels around their axle
        wheelAngle += 0.05;
        wheelAngle += 0.05;
        meshesRef.current.forEach((obj) => {
          if (obj.userData.wheels && Array.isArray(obj.userData.wheels)) {
            obj.userData.wheels.forEach((wheel: import("three").Mesh) => {
              wheel.rotation.z = wheelAngle;
            });
          }
        });

        ledTime += 0.08;
        meshesRef.current.forEach((obj) => {
          const ledLights = obj.userData.ledLights;
          if (Array.isArray(ledLights)) {
            const intensity = blinkingLightsRef.current
              ? 0.2 + (Math.sin(ledTime) + 1) * 1.4
              : 1;

            ledLights.forEach((led: import("three").Mesh) => {
              const materials = Array.isArray(led.material)
                ? led.material
                : [led.material];

              materials.forEach((material) => {
                if ("emissiveIntensity" in material) {
                  material.emissiveIntensity = intensity;
                }
              });
            });
          }
        });

        // Animate Traffic Lights using real elapsed time
        const cycle = trafficTime % 9;
        meshesRef.current.forEach((obj) => {
          const lights = obj.userData.trafficLights;
          if (!lights) return;

          const setLight = (mesh: import("three").Mesh, active: boolean) => {
            const materials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];

            materials.forEach((material) => {
              if ("emissiveIntensity" in material) {
                material.emissiveIntensity = active ? 2.5 : 0.05;
              }
            });
          };

          setLight(lights.red, cycle < 3);
          setLight(lights.green, cycle >= 3 && cycle < 6);
          setLight(lights.yellow, cycle >= 6);
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

            if ((item.shape === "car" || item.shape === "sportcar" || item.shape === "suv" || item.shape === "pickup" || item.shape === "van" || item.shape === "police")) {
              obj = createCarGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "table" || item.shape === "chair" || item.shape === "sofa" || item.shape === "tree" || item.shape === "house" || item.shape === "lamp") {
              obj = createFurnitureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "palmtree" || item.shape === "bigtree" || item.shape === "bush" || item.shape === "flower" || item.shape === "bamboo") {
            obj = createPlantGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
          } else if (item.shape === "cactus" || item.shape === "pinetree" || item.shape === "sunflower" || item.shape === "lotus" || item.shape === "grass" || item.shape === "vine") {
              obj = createPlantGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "rock" || item.shape === "pond" || item.shape === "hill" || item.shape === "groundpatch") {
              obj = createEnvironmentGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "rose" || item.shape === "tulip" || item.shape === "mushroom") {
              obj = createPlantGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "star" || item.shape === "moon" || item.shape === "cloud" || item.shape === "waterfall") {
              obj = createSkyGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "lavender" || item.shape === "cattail" || item.shape === "fern" || item.shape === "cactusflower" || item.shape === "bonsai") {
              obj = createPlantGeometry4(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "volcano" || item.shape === "sanddune" || item.shape === "ice" || item.shape === "lavarock" || item.shape === "cave") {
              obj = createEnvironmentGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "planet" || item.shape === "satellite" || item.shape === "spaceship") {
              obj = createSpaceGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "skyscraper" || item.shape === "castle") {
              obj = createBuildingGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "lamborghini" || item.shape === "ferrari" || item.shape === "tesla") {
              obj = createLuxuryCarGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "airplane" || item.shape === "helicopter") {
              obj = createAircraftGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "boat" || item.shape === "yacht") {
              obj = createBoatGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "tiger" || item.shape === "elephant") {
              obj = createAnimalGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "dragon" || item.shape === "robot") {
              obj = createCharacterGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "meteor" || item.shape === "comet" || item.shape === "ufo") {
              obj = createSpaceGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "lighthouse" || item.shape === "windmill" || item.shape === "statue") {
              obj = createStructureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "satellitedish" || item.shape === "telescope" || item.shape === "fountain" || item.shape === "bridge2" || item.shape === "tower" || item.shape === "pyramid") {
              obj = createStructureGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "volcano2" || item.shape === "glacier" || item.shape === "canyon" || item.shape === "oasis") {
              obj = createEnvironmentGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "totem" || item.shape === "obelisk") {
              obj = createMonumentGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "castle2" || item.shape === "temple" || item.shape === "colosseum" || item.shape === "stadium") {
              obj = createBuildingGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "lighthouse2" || item.shape === "windmill2") {
              obj = createStructureGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "airport" || item.shape === "trainstation" || item.shape === "skyscraper2") {
              obj = createBuildingGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "windturbine" || item.shape === "solarpanel" || item.shape === "satellite2") {
              obj = createEnergyGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "cruiseship" || item.shape === "submarine" || item.shape === "hotairballoon" || item.shape === "helicopter2" || item.shape === "train" || item.shape === "bus") {
              obj = createTransportGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "motorcycle" || item.shape === "bicycle" || item.shape === "skateboard" || item.shape === "surfboard" || item.shape === "kayak" || item.shape === "paraglider") {
              obj = createPersonalTransportGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "donut" || item.shape === "cake" || item.shape === "pizza" || item.shape === "icecream" || item.shape === "coffeecup" || item.shape === "hamburger") {
              obj = createFoodGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "grass_short" || item.shape === "grass_tall" || item.shape === "tree_small" || item.shape === "tree_large" || item.shape === "tree_low" || item.shape === "tree_high" || item.shape === "butterfly" || item.shape === "bee" || item.shape === "ladybug" || item.shape === "dragonfly" || item.shape === "ant" || item.shape === "apple" || item.shape === "orange" || item.shape === "banana" || item.shape === "grape" || item.shape === "mango" || item.shape === "watermelon" || item.shape === "daisy" || item.shape === "orchid" || item.shape === "hibiscus" || item.shape === "bougainvillea") {
              obj = createNatureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "mushroom2" || item.shape === "cactus2") {
              obj = createPlantExtraGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "pineapple" || item.shape === "coconut" || item.shape === "strawberry" || item.shape === "cherry" || item.shape === "lemon" || item.shape === "peach") {
              obj = createFruitGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "book" || item.shape === "lamppost" || item.shape === "bench" || item.shape === "mailbox" || item.shape === "fountain2" || item.shape === "swing" || item.shape === "slide" || item.shape === "sandbox") {
              obj = createParkGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "streetsign" || item.shape === "trafficcone" || item.shape === "barrier" || item.shape === "firehydrant" || item.shape === "trashcan" || item.shape === "bench2" || item.shape === "picnictable" || item.shape === "bbqgrill") {
              obj = createStreetGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "playground2" || item.shape === "gnome" || item.shape === "birdhouse" || item.shape === "weathervane" || item.shape === "sundial" || item.shape === "well" || item.shape === "scarecrow" || item.shape === "haybale") {
              obj = createGardenGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "crystal" || item.shape === "geode" || item.shape === "fossil" || item.shape === "meteorite" || item.shape === "gemstone" || item.shape === "pearl" || item.shape === "shell" || item.shape === "coral") {
              obj = createMineralGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            } else if (item.shape === "khoem") {
              obj = createKhoemGeometry(THREE, item.color, item.metalness, item.roughness);
            } else if (item.shape === "highway") {
              obj = createHighwayGeometry(THREE, item.color, item.metalness, item.roughness);
            } else if (item.shape === "bridge") {
              obj = createBridgeGeometry(THREE, item.color, item.metalness, item.roughness);
            } else if (item.shape === "trafficlight") {
              obj = createTrafficLightGeometry(THREE, item.color, item.metalness, item.roughness);
            } else if (item.shape === "streetlight") {
              obj = createStreetLightGeometry(THREE, item.color, item.metalness, item.roughness);
            } else {
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

  function handleQuickAdd(shape: Shape) {
    const preset = presets.find(p => p.shape === shape);
    const count = objects.filter((o) => o.shape === shape).length + 1;
    const next: SceneObject = {
      id: createId(),
      name: `${preset?.name ?? "Object"} ${count}`,
      shape,
      color: shape === "highway" || shape === "bridge" ? "#2a2a2a" : "#fbbf24",
      metalness: 0.2,
      roughness: 0.8,
      position: { x: ((objects.length % 3) - 1) * 5, y: 0, z: Math.floor(objects.length / 3) * 5 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      visible: true,
      locked: false,
      textureData: null,
    };
    commitObjects([...objects, next]);
    setSelectedId(next.id);
    setMessage(`បានបន្ថែម ${next.name}។`);
  }

  function handleLoadTemplate(template: "park" | "room" | "studio" | "highway") {
    const newObjects = generateTemplate(template);
    commitObjects(newObjects);
    setSelectedId(newObjects[0]?.id ?? null);
    setSelectedIds([]);
    setMessage(`បានបង្កើត Scene ថ្មីជា "${template}"។`);
  }

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

  function handleMusicUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage("ឯកសារតន្ត្រីធំពេក (អតិបរមា 10MB)។");
      return;
    }

    if (!file.type.startsWith("audio/")) {
      setMessage("សូមជ្រើសរើសឯកសារតន្ត្រី MP3, WAV ឬ OGG។");
      return;
    }

    setBgMusicFile(file);
    setMessage(`បានបន្ថែមតន្ត្រី: "${file.name}"។`);
  }

  function handleClearMusic() {
    setBgMusicFile(null);
    setMessage("បានលុបតន្ត្រីចេញ។");
  }

  async function handleStartRecording() {
    const renderer = rendererRef.current;
    if (!renderer) return;

    let stream: MediaStream | null = null;

    try {
      const canvas = renderer.domElement;
      stream = canvas.captureStream(30);

      if (bgMusicFile) {
        const audioContext = new AudioContext();
        audioContextRef.current = audioContext;

        await audioContext.resume();

        const arrayBuffer = await bgMusicFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const destination = audioContext.createMediaStreamDestination();
        const audioSource = audioContext.createBufferSource();

        audioSource.buffer = audioBuffer;
        audioSource.loop = true;
        audioSource.connect(destination);
        destination.stream.getAudioTracks().forEach((track) => {
          stream?.addTrack(track);
        });

        audioSourceRef.current = audioSource;
        audioSource.start();
      }

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

        audioSourceRef.current?.stop();
        audioSourceRef.current = null;

        stream?.getTracks().forEach((track) => track.stop());

        const audioContext = audioContextRef.current;
        audioContextRef.current = null;
        if (audioContext && audioContext.state !== "closed") {
          void audioContext.close();
        }

        if (recordingTimeoutRef.current !== null) {
          window.clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }

        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `KHOEM-AI-${(sceneName || "Scene").replace(/[^\w-]/g, "_")}-${Date.now()}.webm`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 3000);
        }

        mediaRecorderRef.current = null;
        setIsRecording(false);
        setMessage(`បានថតវីដេអូរួចរាល់! (${elapsed}s)`);
        setRecordingTime(0);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingTime(0);
      setMessage(
        bgMusicFile
          ? "កំពុងថតវីដេអូជាមួយតន្ត្រី..."
          : "កំពុងថតវីដេអូ... ចុច Stop ដើម្បីបញ្ចប់។"
      );

      recordingTimeoutRef.current = window.setTimeout(() => {
        handleStopRecording();
      }, 30000);
    } catch (error) {
      console.error("Recording failed:", error);

      audioSourceRef.current?.stop();
      audioSourceRef.current = null;

      stream?.getTracks().forEach((track) => track.stop());

      const audioContext = audioContextRef.current;
      audioContextRef.current = null;
      if (audioContext && audioContext.state !== "closed") {
        void audioContext.close();
      }

      setIsRecording(false);
      setMessage("មិនអាចថតវីដេអូ ឬបញ្ចូលតន្ត្រីបានទេ។");
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

          if ((item.shape === "car" || item.shape === "sportcar" || item.shape === "suv" || item.shape === "pickup" || item.shape === "van" || item.shape === "police")) {
            const carGroup = createCarGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            carGroup.position.set(item.position.x, item.position.y, item.position.z);
            carGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            carGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            carGroup.name = item.name;
            exportScene.add(carGroup);
            return;
          }

          if (item.shape === "table" || item.shape === "chair" || item.shape === "sofa" || item.shape === "tree" || item.shape === "house" || item.shape === "lamp") {
            const furnitureGroup = createFurnitureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            furnitureGroup.position.set(item.position.x, item.position.y, item.position.z);
            furnitureGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            furnitureGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            furnitureGroup.name = item.name;
            exportScene.add(furnitureGroup);
            return;
          }
          if (item.shape === "palmtree" || item.shape === "bigtree" || item.shape === "bush" || item.shape === "flower" || item.shape === "bamboo") {
            const plantGroup = createPlantGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            plantGroup.position.set(item.position.x, item.position.y, item.position.z);
            plantGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plantGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plantGroup.name = item.name;
            exportScene.add(plantGroup);
            return;
          }

          if (item.shape === "cactus" || item.shape === "pinetree" || item.shape === "sunflower" || item.shape === "lotus" || item.shape === "grass" || item.shape === "vine") {
            const plant2Group = createPlantGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            plant2Group.position.set(item.position.x, item.position.y, item.position.z);
            plant2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plant2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plant2Group.name = item.name;
            exportScene.add(plant2Group);
            return;
          }

          if (item.shape === "rock" || item.shape === "pond" || item.shape === "hill" || item.shape === "groundpatch") {
            const environmentGroup = createEnvironmentGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            environmentGroup.position.set(item.position.x, item.position.y, item.position.z);
            environmentGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            environmentGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            environmentGroup.name = item.name;
            exportScene.add(environmentGroup);
            return;
          }

          if (item.shape === "rose" || item.shape === "tulip" || item.shape === "mushroom") {
            const plant3Group = createPlantGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            plant3Group.position.set(item.position.x, item.position.y, item.position.z);
            plant3Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plant3Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plant3Group.name = item.name;
            exportScene.add(plant3Group);
            return;
          }

          if (item.shape === "star" || item.shape === "moon" || item.shape === "cloud" || item.shape === "waterfall") {
            const skyGroup = createSkyGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            skyGroup.position.set(item.position.x, item.position.y, item.position.z);
            skyGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            skyGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            skyGroup.name = item.name;
            exportScene.add(skyGroup);
            return;
          }

          if (item.shape === "lavender" || item.shape === "cattail" || item.shape === "fern" || item.shape === "cactusflower" || item.shape === "bonsai") {
            const plant4Group = createPlantGeometry4(THREE, item.shape, item.color, item.metalness, item.roughness);
            plant4Group.position.set(item.position.x, item.position.y, item.position.z);
            plant4Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plant4Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plant4Group.name = item.name;
            exportScene.add(plant4Group);
            return;
          }

          if (item.shape === "volcano" || item.shape === "sanddune" || item.shape === "ice" || item.shape === "lavarock" || item.shape === "cave") {
            const env2Group = createEnvironmentGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            env2Group.position.set(item.position.x, item.position.y, item.position.z);
            env2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            env2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            env2Group.name = item.name;
            exportScene.add(env2Group);
            return;
          }

          if (item.shape === "planet" || item.shape === "satellite" || item.shape === "spaceship") {
            const spaceGroup = createSpaceGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            spaceGroup.position.set(item.position.x, item.position.y, item.position.z);
            spaceGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            spaceGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            spaceGroup.name = item.name;
            exportScene.add(spaceGroup);
            return;
          }

          if (item.shape === "skyscraper" || item.shape === "castle") {
            const buildingGroup = createBuildingGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            buildingGroup.position.set(item.position.x, item.position.y, item.position.z);
            buildingGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            buildingGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            buildingGroup.name = item.name;
            exportScene.add(buildingGroup);
            return;
          }

          if (item.shape === "lamborghini" || item.shape === "ferrari" || item.shape === "tesla") {
            const luxuryGroup = createLuxuryCarGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            luxuryGroup.position.set(item.position.x, item.position.y, item.position.z);
            luxuryGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            luxuryGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            luxuryGroup.name = item.name;
            exportScene.add(luxuryGroup);
            return;
          }

          if (item.shape === "airplane" || item.shape === "helicopter") {
            const aircraftGroup = createAircraftGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            aircraftGroup.position.set(item.position.x, item.position.y, item.position.z);
            aircraftGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            aircraftGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            aircraftGroup.name = item.name;
            exportScene.add(aircraftGroup);
            return;
          }

          if (item.shape === "boat" || item.shape === "yacht") {
            const boatGroup = createBoatGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            boatGroup.position.set(item.position.x, item.position.y, item.position.z);
            boatGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            boatGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            boatGroup.name = item.name;
            exportScene.add(boatGroup);
            return;
          }

          if (item.shape === "tiger" || item.shape === "elephant") {
            const animalGroup = createAnimalGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            animalGroup.position.set(item.position.x, item.position.y, item.position.z);
            animalGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            animalGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            animalGroup.name = item.name;
            exportScene.add(animalGroup);
            return;
          }

          if (item.shape === "dragon" || item.shape === "robot") {
            const characterGroup = createCharacterGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            characterGroup.position.set(item.position.x, item.position.y, item.position.z);
            characterGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            characterGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            characterGroup.name = item.name;
            exportScene.add(characterGroup);
            return;
          }

          if (item.shape === "meteor" || item.shape === "comet" || item.shape === "ufo") {
            const space2Group = createSpaceGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            space2Group.position.set(item.position.x, item.position.y, item.position.z);
            space2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            space2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            space2Group.name = item.name;
            exportScene.add(space2Group);
            return;
          }

          if (item.shape === "lighthouse" || item.shape === "windmill" || item.shape === "statue") {
            const structGroup = createStructureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            structGroup.position.set(item.position.x, item.position.y, item.position.z);
            structGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            structGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            structGroup.name = item.name;
            exportScene.add(structGroup);
            return;
          }

          if (item.shape === "satellitedish" || item.shape === "telescope" || item.shape === "fountain" || item.shape === "bridge2" || item.shape === "tower" || item.shape === "pyramid") {
            const struct2Group = createStructureGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            struct2Group.position.set(item.position.x, item.position.y, item.position.z);
            struct2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            struct2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            struct2Group.name = item.name;
            exportScene.add(struct2Group);
            return;
          }

          if (item.shape === "volcano2" || item.shape === "glacier" || item.shape === "canyon" || item.shape === "oasis") {
            const env3Group = createEnvironmentGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            env3Group.position.set(item.position.x, item.position.y, item.position.z);
            env3Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            env3Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            env3Group.name = item.name;
            exportScene.add(env3Group);
            return;
          }

          if (item.shape === "totem" || item.shape === "obelisk") {
            const monumentGroup = createMonumentGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            monumentGroup.position.set(item.position.x, item.position.y, item.position.z);
            monumentGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            monumentGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            monumentGroup.name = item.name;
            exportScene.add(monumentGroup);
            return;
          }

          if (item.shape === "castle2" || item.shape === "temple" || item.shape === "colosseum" || item.shape === "stadium") {
            const building2Group = createBuildingGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            building2Group.position.set(item.position.x, item.position.y, item.position.z);
            building2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            building2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            building2Group.name = item.name;
            exportScene.add(building2Group);
            return;
          }

          if (item.shape === "lighthouse2" || item.shape === "windmill2") {
            const struct3Group = createStructureGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            struct3Group.position.set(item.position.x, item.position.y, item.position.z);
            struct3Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            struct3Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            struct3Group.name = item.name;
            exportScene.add(struct3Group);
            return;
          }

          if (item.shape === "airport" || item.shape === "trainstation" || item.shape === "skyscraper2") {
            const building3Group = createBuildingGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            building3Group.position.set(item.position.x, item.position.y, item.position.z);
            building3Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            building3Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            building3Group.name = item.name;
            exportScene.add(building3Group);
            return;
          }

          if (item.shape === "windturbine" || item.shape === "solarpanel" || item.shape === "satellite2") {
            const energyGroup = createEnergyGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            energyGroup.position.set(item.position.x, item.position.y, item.position.z);
            energyGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            energyGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            energyGroup.name = item.name;
            exportScene.add(energyGroup);
            return;
          }

          if (item.shape === "cruiseship" || item.shape === "submarine" || item.shape === "hotairballoon" || item.shape === "helicopter2" || item.shape === "train" || item.shape === "bus") {
            const transportGroup = createTransportGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            transportGroup.position.set(item.position.x, item.position.y, item.position.z);
            transportGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            transportGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            transportGroup.name = item.name;
            exportScene.add(transportGroup);
            return;
          }

          if (item.shape === "motorcycle" || item.shape === "bicycle" || item.shape === "skateboard" || item.shape === "surfboard" || item.shape === "kayak" || item.shape === "paraglider") {
            const personalGroup = createPersonalTransportGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            personalGroup.position.set(item.position.x, item.position.y, item.position.z);
            personalGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            personalGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            personalGroup.name = item.name;
            exportScene.add(personalGroup);
            return;
          }

          if (item.shape === "donut" || item.shape === "cake" || item.shape === "pizza" || item.shape === "icecream" || item.shape === "coffeecup" || item.shape === "hamburger") {
            const foodGroup = createFoodGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            foodGroup.position.set(item.position.x, item.position.y, item.position.z);
            foodGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            foodGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            foodGroup.name = item.name;
            exportScene.add(foodGroup);
            return;
          }

          if (item.shape === "grass_short" || item.shape === "grass_tall" || item.shape === "tree_small" || item.shape === "tree_large" || item.shape === "tree_low" || item.shape === "tree_high" || item.shape === "butterfly" || item.shape === "bee" || item.shape === "ladybug" || item.shape === "dragonfly" || item.shape === "ant" || item.shape === "apple" || item.shape === "orange" || item.shape === "banana" || item.shape === "grape" || item.shape === "mango" || item.shape === "watermelon" || item.shape === "daisy" || item.shape === "orchid" || item.shape === "hibiscus" || item.shape === "bougainvillea") {
            const natureGroup = createNatureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            natureGroup.position.set(item.position.x, item.position.y, item.position.z);
            natureGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            natureGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            natureGroup.name = item.name;
            exportScene.add(natureGroup);
            return;
          }

          if (item.shape === "mushroom2" || item.shape === "cactus2") {
            const plantExtraGroup = createPlantExtraGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            plantExtraGroup.position.set(item.position.x, item.position.y, item.position.z);
            plantExtraGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plantExtraGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plantExtraGroup.name = item.name;
            exportScene.add(plantExtraGroup);
            return;
          }

          if (item.shape === "pineapple" || item.shape === "coconut" || item.shape === "strawberry" || item.shape === "cherry" || item.shape === "lemon" || item.shape === "peach") {
            const fruit2Group = createFruitGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            fruit2Group.position.set(item.position.x, item.position.y, item.position.z);
            fruit2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            fruit2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            fruit2Group.name = item.name;
            exportScene.add(fruit2Group);
            return;
          }

          if (item.shape === "book" || item.shape === "lamppost" || item.shape === "bench" || item.shape === "mailbox" || item.shape === "fountain2" || item.shape === "swing" || item.shape === "slide" || item.shape === "sandbox") {
            const parkGroup = createParkGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            parkGroup.position.set(item.position.x, item.position.y, item.position.z);
            parkGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            parkGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            parkGroup.name = item.name;
            exportScene.add(parkGroup);
            return;
          }

          if (item.shape === "streetsign" || item.shape === "trafficcone" || item.shape === "barrier" || item.shape === "firehydrant" || item.shape === "trashcan" || item.shape === "bench2" || item.shape === "picnictable" || item.shape === "bbqgrill") {
            const streetGroup = createStreetGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            streetGroup.position.set(item.position.x, item.position.y, item.position.z);
            streetGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            streetGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            streetGroup.name = item.name;
            exportScene.add(streetGroup);
            return;
          }

          if (item.shape === "playground2" || item.shape === "gnome" || item.shape === "birdhouse" || item.shape === "weathervane" || item.shape === "sundial" || item.shape === "well" || item.shape === "scarecrow" || item.shape === "haybale") {
            const gardenGroup = createGardenGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            gardenGroup.position.set(item.position.x, item.position.y, item.position.z);
            gardenGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            gardenGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            gardenGroup.name = item.name;
            exportScene.add(gardenGroup);
            return;
          }

          if (item.shape === "crystal" || item.shape === "geode" || item.shape === "fossil" || item.shape === "meteorite" || item.shape === "gemstone" || item.shape === "pearl" || item.shape === "shell" || item.shape === "coral") {
            const mineralGroup = createMineralGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            mineralGroup.position.set(item.position.x, item.position.y, item.position.z);
            mineralGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            mineralGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            mineralGroup.name = item.name;
            exportScene.add(mineralGroup);
            return;
          }

          if (item.shape === "hospital_urban_tall" || item.shape === "hospital_urban_low" || item.shape === "hospital_rural_tall" || item.shape === "hospital_rural_low") {
            const hospitalGroup = createHospitalGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            hospitalGroup.position.set(item.position.x, item.position.y, item.position.z);
            hospitalGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            hospitalGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            hospitalGroup.name = item.name;
            exportScene.add(hospitalGroup);
            return;
          }

          if (item.shape === "bank_urban_tall" || item.shape === "bank_urban_low" || item.shape === "bank_rural_tall" || item.shape === "bank_rural_low") {
            const bankGroup = createBankGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            bankGroup.position.set(item.position.x, item.position.y, item.position.z);
            bankGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            bankGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            bankGroup.name = item.name;
            exportScene.add(bankGroup);
            return;
          }

          if (item.shape === "school" || item.shape === "university" || item.shape === "library" || item.shape === "policestation" || item.shape === "firestation" || item.shape === "postoffice" || item.shape === "courthouse" || item.shape === "cityhall") {
            const civicGroup = createCivicGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            civicGroup.position.set(item.position.x, item.position.y, item.position.z);
            civicGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            civicGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            civicGroup.name = item.name;
            exportScene.add(civicGroup);
            return;
          }

          if (item.shape === "khoem") {
            const khoemGroup = createKhoemGeometry(THREE, item.color, item.metalness, item.roughness);
            khoemGroup.position.set(item.position.x, item.position.y, item.position.z);
            khoemGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            khoemGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            khoemGroup.name = item.name;
            exportScene.add(khoemGroup);
            return;
          }

          if (item.shape === "highway") {
            const highwayGroup = createHighwayGeometry(THREE, item.color, item.metalness, item.roughness);
            highwayGroup.position.set(item.position.x, item.position.y, item.position.z);
            highwayGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            highwayGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            highwayGroup.name = item.name;
            exportScene.add(highwayGroup);
            return;
          }

          if (item.shape === "bridge" || item.shape === "trafficlight" || item.shape === "streetlight") {
            const g = item.shape === "bridge"
              ? createBridgeGeometry(THREE, item.color, item.metalness, item.roughness)
              : item.shape === "trafficlight"
                ? createTrafficLightGeometry(THREE, item.color, item.metalness, item.roughness)
                : createStreetLightGeometry(THREE, item.color, item.metalness, item.roughness);
            g.position.set(item.position.x, item.position.y, item.position.z);
            g.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            g.scale.set(item.scale.x, item.scale.y, item.scale.z);
            g.name = item.name;
            exportScene.add(g);
            return;
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

          if ((item.shape === "car" || item.shape === "sportcar" || item.shape === "suv" || item.shape === "pickup" || item.shape === "van" || item.shape === "police")) {
            const carGroup = createCarGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            carGroup.position.set(item.position.x, item.position.y, item.position.z);
            carGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            carGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            carGroup.name = item.name;
            exportScene!.add(carGroup);
            return;
          }

          if (item.shape === "table" || item.shape === "chair" || item.shape === "sofa" || item.shape === "tree" || item.shape === "house" || item.shape === "lamp") {
            const furnitureGroup = createFurnitureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            furnitureGroup.position.set(item.position.x, item.position.y, item.position.z);
            furnitureGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            furnitureGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            furnitureGroup.name = item.name;
            exportScene!.add(furnitureGroup);
            return;
          }
          if (item.shape === "palmtree" || item.shape === "bigtree" || item.shape === "bush" || item.shape === "flower" || item.shape === "bamboo") {
            const plantGroup = createPlantGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            plantGroup.position.set(item.position.x, item.position.y, item.position.z);
            plantGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plantGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plantGroup.name = item.name;
            exportScene!.add(plantGroup);
            return;
          }

          if (item.shape === "cactus" || item.shape === "pinetree" || item.shape === "sunflower" || item.shape === "lotus" || item.shape === "grass" || item.shape === "vine") {
            const plant2Group = createPlantGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            plant2Group.position.set(item.position.x, item.position.y, item.position.z);
            plant2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plant2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plant2Group.name = item.name;
            exportScene!.add(plant2Group);
            return;
          }

          if (item.shape === "rock" || item.shape === "pond" || item.shape === "hill" || item.shape === "groundpatch") {
            const environmentGroup = createEnvironmentGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            environmentGroup.position.set(item.position.x, item.position.y, item.position.z);
            environmentGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            environmentGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            environmentGroup.name = item.name;
            exportScene!.add(environmentGroup);
            return;
          }

          if (item.shape === "rose" || item.shape === "tulip" || item.shape === "mushroom") {
            const plant3Group = createPlantGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            plant3Group.position.set(item.position.x, item.position.y, item.position.z);
            plant3Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plant3Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plant3Group.name = item.name;
            exportScene!.add(plant3Group);
            return;
          }

          if (item.shape === "star" || item.shape === "moon" || item.shape === "cloud" || item.shape === "waterfall") {
            const skyGroup = createSkyGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            skyGroup.position.set(item.position.x, item.position.y, item.position.z);
            skyGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            skyGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            skyGroup.name = item.name;
            exportScene!.add(skyGroup);
            return;
          }

          if (item.shape === "lavender" || item.shape === "cattail" || item.shape === "fern" || item.shape === "cactusflower" || item.shape === "bonsai") {
            const plant4Group = createPlantGeometry4(THREE, item.shape, item.color, item.metalness, item.roughness);
            plant4Group.position.set(item.position.x, item.position.y, item.position.z);
            plant4Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plant4Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plant4Group.name = item.name;
            exportScene!.add(plant4Group);
            return;
          }

          if (item.shape === "volcano" || item.shape === "sanddune" || item.shape === "ice" || item.shape === "lavarock" || item.shape === "cave") {
            const env2Group = createEnvironmentGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            env2Group.position.set(item.position.x, item.position.y, item.position.z);
            env2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            env2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            env2Group.name = item.name;
            exportScene!.add(env2Group);
            return;
          }

          if (item.shape === "planet" || item.shape === "satellite" || item.shape === "spaceship") {
            const spaceGroup = createSpaceGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            spaceGroup.position.set(item.position.x, item.position.y, item.position.z);
            spaceGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            spaceGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            spaceGroup.name = item.name;
            exportScene!.add(spaceGroup);
            return;
          }

          if (item.shape === "skyscraper" || item.shape === "castle") {
            const buildingGroup = createBuildingGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            buildingGroup.position.set(item.position.x, item.position.y, item.position.z);
            buildingGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            buildingGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            buildingGroup.name = item.name;
            exportScene!.add(buildingGroup);
            return;
          }

          if (item.shape === "lamborghini" || item.shape === "ferrari" || item.shape === "tesla") {
            const luxuryGroup = createLuxuryCarGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            luxuryGroup.position.set(item.position.x, item.position.y, item.position.z);
            luxuryGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            luxuryGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            luxuryGroup.name = item.name;
            exportScene!.add(luxuryGroup);
            return;
          }

          if (item.shape === "airplane" || item.shape === "helicopter") {
            const aircraftGroup = createAircraftGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            aircraftGroup.position.set(item.position.x, item.position.y, item.position.z);
            aircraftGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            aircraftGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            aircraftGroup.name = item.name;
            exportScene!.add(aircraftGroup);
            return;
          }

          if (item.shape === "boat" || item.shape === "yacht") {
            const boatGroup = createBoatGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            boatGroup.position.set(item.position.x, item.position.y, item.position.z);
            boatGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            boatGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            boatGroup.name = item.name;
            exportScene!.add(boatGroup);
            return;
          }

          if (item.shape === "tiger" || item.shape === "elephant") {
            const animalGroup = createAnimalGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            animalGroup.position.set(item.position.x, item.position.y, item.position.z);
            animalGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            animalGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            animalGroup.name = item.name;
            exportScene!.add(animalGroup);
            return;
          }

          if (item.shape === "dragon" || item.shape === "robot") {
            const characterGroup = createCharacterGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            characterGroup.position.set(item.position.x, item.position.y, item.position.z);
            characterGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            characterGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            characterGroup.name = item.name;
            exportScene!.add(characterGroup);
            return;
          }

          if (item.shape === "meteor" || item.shape === "comet" || item.shape === "ufo") {
            const space2Group = createSpaceGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            space2Group.position.set(item.position.x, item.position.y, item.position.z);
            space2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            space2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            space2Group.name = item.name;
            exportScene!.add(space2Group);
            return;
          }

          if (item.shape === "lighthouse" || item.shape === "windmill" || item.shape === "statue") {
            const structGroup = createStructureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            structGroup.position.set(item.position.x, item.position.y, item.position.z);
            structGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            structGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            structGroup.name = item.name;
            exportScene!.add(structGroup);
            return;
          }

          if (item.shape === "satellitedish" || item.shape === "telescope" || item.shape === "fountain" || item.shape === "bridge2" || item.shape === "tower" || item.shape === "pyramid") {
            const struct2Group = createStructureGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            struct2Group.position.set(item.position.x, item.position.y, item.position.z);
            struct2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            struct2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            struct2Group.name = item.name;
            exportScene!.add(struct2Group);
            return;
          }

          if (item.shape === "volcano2" || item.shape === "glacier" || item.shape === "canyon" || item.shape === "oasis") {
            const env3Group = createEnvironmentGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            env3Group.position.set(item.position.x, item.position.y, item.position.z);
            env3Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            env3Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            env3Group.name = item.name;
            exportScene!.add(env3Group);
            return;
          }

          if (item.shape === "totem" || item.shape === "obelisk") {
            const monumentGroup = createMonumentGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            monumentGroup.position.set(item.position.x, item.position.y, item.position.z);
            monumentGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            monumentGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            monumentGroup.name = item.name;
            exportScene!.add(monumentGroup);
            return;
          }

          if (item.shape === "castle2" || item.shape === "temple" || item.shape === "colosseum" || item.shape === "stadium") {
            const building2Group = createBuildingGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            building2Group.position.set(item.position.x, item.position.y, item.position.z);
            building2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            building2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            building2Group.name = item.name;
            exportScene!.add(building2Group);
            return;
          }

          if (item.shape === "lighthouse2" || item.shape === "windmill2") {
            const struct3Group = createStructureGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            struct3Group.position.set(item.position.x, item.position.y, item.position.z);
            struct3Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            struct3Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            struct3Group.name = item.name;
            exportScene!.add(struct3Group);
            return;
          }

          if (item.shape === "airport" || item.shape === "trainstation" || item.shape === "skyscraper2") {
            const building3Group = createBuildingGeometry3(THREE, item.shape, item.color, item.metalness, item.roughness);
            building3Group.position.set(item.position.x, item.position.y, item.position.z);
            building3Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            building3Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            building3Group.name = item.name;
            exportScene!.add(building3Group);
            return;
          }

          if (item.shape === "windturbine" || item.shape === "solarpanel" || item.shape === "satellite2") {
            const energyGroup = createEnergyGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            energyGroup.position.set(item.position.x, item.position.y, item.position.z);
            energyGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            energyGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            energyGroup.name = item.name;
            exportScene!.add(energyGroup);
            return;
          }

          if (item.shape === "cruiseship" || item.shape === "submarine" || item.shape === "hotairballoon" || item.shape === "helicopter2" || item.shape === "train" || item.shape === "bus") {
            const transportGroup = createTransportGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            transportGroup.position.set(item.position.x, item.position.y, item.position.z);
            transportGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            transportGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            transportGroup.name = item.name;
            exportScene!.add(transportGroup);
            return;
          }

          if (item.shape === "motorcycle" || item.shape === "bicycle" || item.shape === "skateboard" || item.shape === "surfboard" || item.shape === "kayak" || item.shape === "paraglider") {
            const personalGroup = createPersonalTransportGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            personalGroup.position.set(item.position.x, item.position.y, item.position.z);
            personalGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            personalGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            personalGroup.name = item.name;
            exportScene!.add(personalGroup);
            return;
          }

          if (item.shape === "donut" || item.shape === "cake" || item.shape === "pizza" || item.shape === "icecream" || item.shape === "coffeecup" || item.shape === "hamburger") {
            const foodGroup = createFoodGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            foodGroup.position.set(item.position.x, item.position.y, item.position.z);
            foodGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            foodGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            foodGroup.name = item.name;
            exportScene!.add(foodGroup);
            return;
          }

          if (item.shape === "grass_short" || item.shape === "grass_tall" || item.shape === "tree_small" || item.shape === "tree_large" || item.shape === "tree_low" || item.shape === "tree_high" || item.shape === "butterfly" || item.shape === "bee" || item.shape === "ladybug" || item.shape === "dragonfly" || item.shape === "ant" || item.shape === "apple" || item.shape === "orange" || item.shape === "banana" || item.shape === "grape" || item.shape === "mango" || item.shape === "watermelon" || item.shape === "daisy" || item.shape === "orchid" || item.shape === "hibiscus" || item.shape === "bougainvillea") {
            const natureGroup = createNatureGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            natureGroup.position.set(item.position.x, item.position.y, item.position.z);
            natureGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            natureGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            natureGroup.name = item.name;
            exportScene!.add(natureGroup);
            return;
          }

          if (item.shape === "mushroom2" || item.shape === "cactus2") {
            const plantExtraGroup = createPlantExtraGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            plantExtraGroup.position.set(item.position.x, item.position.y, item.position.z);
            plantExtraGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plantExtraGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plantExtraGroup.name = item.name;
            exportScene!.add(plantExtraGroup);
            return;
          }

          if (item.shape === "pineapple" || item.shape === "coconut" || item.shape === "strawberry" || item.shape === "cherry" || item.shape === "lemon" || item.shape === "peach") {
            const fruit2Group = createFruitGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            fruit2Group.position.set(item.position.x, item.position.y, item.position.z);
            fruit2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            fruit2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            fruit2Group.name = item.name;
            exportScene!.add(fruit2Group);
            return;
          }

          if (item.shape === "book" || item.shape === "lamppost" || item.shape === "bench" || item.shape === "mailbox" || item.shape === "fountain2" || item.shape === "swing" || item.shape === "slide" || item.shape === "sandbox") {
            const parkGroup = createParkGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            parkGroup.position.set(item.position.x, item.position.y, item.position.z);
            parkGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            parkGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            parkGroup.name = item.name;
            exportScene!.add(parkGroup);
            return;
          }

          if (item.shape === "streetsign" || item.shape === "trafficcone" || item.shape === "barrier" || item.shape === "firehydrant" || item.shape === "trashcan" || item.shape === "bench2" || item.shape === "picnictable" || item.shape === "bbqgrill") {
            const streetGroup = createStreetGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            streetGroup.position.set(item.position.x, item.position.y, item.position.z);
            streetGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            streetGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            streetGroup.name = item.name;
            exportScene!.add(streetGroup);
            return;
          }

          if (item.shape === "playground2" || item.shape === "gnome" || item.shape === "birdhouse" || item.shape === "weathervane" || item.shape === "sundial" || item.shape === "well" || item.shape === "scarecrow" || item.shape === "haybale") {
            const gardenGroup = createGardenGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            gardenGroup.position.set(item.position.x, item.position.y, item.position.z);
            gardenGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            gardenGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            gardenGroup.name = item.name;
            exportScene!.add(gardenGroup);
            return;
          }

          if (item.shape === "crystal" || item.shape === "geode" || item.shape === "fossil" || item.shape === "meteorite" || item.shape === "gemstone" || item.shape === "pearl" || item.shape === "shell" || item.shape === "coral") {
            const mineralGroup = createMineralGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            mineralGroup.position.set(item.position.x, item.position.y, item.position.z);
            mineralGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            mineralGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            mineralGroup.name = item.name;
            exportScene!.add(mineralGroup);
            return;
          }

          if (item.shape === "hospital_urban_tall" || item.shape === "hospital_urban_low" || item.shape === "hospital_rural_tall" || item.shape === "hospital_rural_low") {
            const hospitalGroup = createHospitalGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            hospitalGroup.position.set(item.position.x, item.position.y, item.position.z);
            hospitalGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            hospitalGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            hospitalGroup.name = item.name;
            exportScene!.add(hospitalGroup);
            return;
          }

          if (item.shape === "bank_urban_tall" || item.shape === "bank_urban_low" || item.shape === "bank_rural_tall" || item.shape === "bank_rural_low") {
            const bankGroup = createBankGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            bankGroup.position.set(item.position.x, item.position.y, item.position.z);
            bankGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            bankGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            bankGroup.name = item.name;
            exportScene!.add(bankGroup);
            return;
          }

          if (item.shape === "school" || item.shape === "university" || item.shape === "library" || item.shape === "policestation" || item.shape === "firestation" || item.shape === "postoffice" || item.shape === "courthouse" || item.shape === "cityhall") {
            const civicGroup = createCivicGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            civicGroup.position.set(item.position.x, item.position.y, item.position.z);
            civicGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            civicGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            civicGroup.name = item.name;
            exportScene!.add(civicGroup);
            return;
          }

          if (item.shape === "khoem") {
            const khoemGroup = createKhoemGeometry(THREE, item.color, item.metalness, item.roughness);
            khoemGroup.position.set(item.position.x, item.position.y, item.position.z);
            khoemGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            khoemGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            khoemGroup.name = item.name;
            exportScene!.add(khoemGroup);
            return;
          }

          if (item.shape === "highway") {
            const highwayGroup = createHighwayGeometry(THREE, item.color, item.metalness, item.roughness);
            highwayGroup.position.set(item.position.x, item.position.y, item.position.z);
            highwayGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            highwayGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            highwayGroup.name = item.name;
            exportScene!.add(highwayGroup);
            return;
          }

          if (item.shape === "bridge" || item.shape === "trafficlight" || item.shape === "streetlight") {
            const g = item.shape === "bridge"
              ? createBridgeGeometry(THREE, item.color, item.metalness, item.roughness)
              : item.shape === "trafficlight"
                ? createTrafficLightGeometry(THREE, item.color, item.metalness, item.roughness)
                : createStreetLightGeometry(THREE, item.color, item.metalness, item.roughness);
            g.position.set(item.position.x, item.position.y, item.position.z);
            g.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            g.scale.set(item.scale.x, item.scale.y, item.scale.z);
            g.name = item.name;
            exportScene!.add(g);
            return;
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

  // Civic animation (police siren flash, fire station bell, city hall clock tick)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const policeStations = new Set(["policestation"]);
    const fireStations = new Set(["firestation"]);
    const cityHalls = new Set(["cityhall"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (policeStations.has(sceneObj.shape)) {
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.emissiveIntensity !== undefined && mat.emissiveIntensity > 1) {
              mat.emissiveIntensity = 1.5 + Math.sin(t * 6 + sceneObj.position.x) * 1;
            }
          });
        } else if (fireStations.has(sceneObj.shape)) {
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.metalness === 1 && mat.roughness === 0.2) {
              mat.emissiveIntensity = Math.sin(t * 3) * 0.5 + 0.5;
            }
          });
        } else if (cityHalls.has(sceneObj.shape)) {
          mesh.rotation.y = sceneObj.rotation.y + Math.sin(t * 0.1) * 0.01;
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Mineral animation (crystal glow, pearl shimmer, coral sway)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const crystals = new Set(["crystal", "geode", "gemstone"]);
    const pearls = new Set(["pearl"]);
    const corals = new Set(["coral"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (crystals.has(sceneObj.shape)) {
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.emissiveIntensity !== undefined) {
              mat.emissiveIntensity = 0.3 + Math.sin(t * 2 + sceneObj.position.x) * 0.3;
            }
          });
        } else if (pearls.has(sceneObj.shape)) {
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.opacity !== undefined && mat.opacity < 1) {
              mat.opacity = 0.25 + Math.sin(t * 1.5 + sceneObj.position.x) * 0.1;
            }
          });
        } else if (corals.has(sceneObj.shape)) {
          mesh.rotation.z = sceneObj.rotation.z + Math.sin(t * 1.2 + sceneObj.position.x) * 0.03 * windStrength;
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, windStrength, sceneReady, objects]);

  // Garden animation (carousel rotate, weather vane arrow, scarecrow sway)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const carousels = new Set(["playground2"]);
    const vanes = new Set(["weathervane"]);
    const scarecrows = new Set(["scarecrow"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (carousels.has(sceneObj.shape)) {
          mesh.rotation.y = sceneObj.rotation.y + t * 0.5;
        } else if (vanes.has(sceneObj.shape)) {
          mesh.traverse((child) => {
            if (child.userData.weathervaneArrow) {
              child.rotation.y = Math.sin(t * 0.5) * 0.5;
            }
          });
        } else if (scarecrows.has(sceneObj.shape)) {
          mesh.rotation.z = sceneObj.rotation.z + Math.sin(t * 1.2 + sceneObj.position.x) * 0.03 * windStrength;
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, windStrength, sceneReady, objects]);

  // Street animation (traffic cone bob, bbq fire flicker, street sign swing)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const trafficCones = new Set(["trafficcone"]);
    const bbqs = new Set(["bbqgrill"]);
    const signs = new Set(["streetsign"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (trafficCones.has(sceneObj.shape)) {
          mesh.rotation.y = sceneObj.rotation.y + Math.sin(t * 2 + sceneObj.position.x) * 0.1;
        } else if (bbqs.has(sceneObj.shape)) {
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.emissiveIntensity !== undefined && mat.emissiveIntensity > 1) {
              mat.emissiveIntensity = 1.5 + Math.sin(t * 4 + sceneObj.position.x) * 0.5;
            }
          });
        } else if (signs.has(sceneObj.shape)) {
          mesh.rotation.z = sceneObj.rotation.z + Math.sin(t * 1.2 + sceneObj.position.x) * 0.02;
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Park animation (swing motion, fountain2 water, slide shimmer)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const swings = new Set(["swing"]);
    const fountains2 = new Set(["fountain2"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (swings.has(sceneObj.shape)) {
          // Gentle swing rotation
          mesh.rotation.x = sceneObj.rotation.x + Math.sin(t * 1.5 + sceneObj.position.x) * 0.15;
        } else if (fountains2.has(sceneObj.shape)) {
          // Water spray bob
          mesh.traverse((child) => {
            const childMesh = child as import("three").Mesh;
            if (childMesh.isMesh && childMesh.geometry.type === "SphereGeometry" && child.position.y > 1.7) {
              child.position.y = 1.8 + Math.sin(t * 3 + child.position.x) * 0.15;
            }
          });
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Extra plant/fruit animation (mushroom2 pulse, cactus2 sway, fruit bob)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const mushrooms = new Set(["mushroom2"]);
    const cacti = new Set(["cactus2"]);
    const fruits = new Set(["pineapple", "coconut", "strawberry", "cherry", "lemon", "peach"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (mushrooms.has(sceneObj.shape)) {
          const pulse = 1 + Math.sin(t * 2 + sceneObj.position.x) * 0.05;
          mesh.scale.set(sceneObj.scale.x * pulse, sceneObj.scale.y, sceneObj.scale.z * pulse);
        } else if (cacti.has(sceneObj.shape)) {
          mesh.rotation.z = sceneObj.rotation.z + Math.sin(t * 1.2 + sceneObj.position.x) * 0.03 * windStrength;
        } else if (fruits.has(sceneObj.shape)) {
          mesh.position.y = sceneObj.position.y + Math.sin(t * 1.5 + sceneObj.position.x) * 0.05;
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, windStrength, sceneReady, objects]);

  // Nature animation (butterfly flutter, bee hover, grass sway)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const butterflies = new Set(["butterfly"]);
    const bees = new Set(["bee"]);
    const ladybugs = new Set(["ladybug"]);
    const dragonflies = new Set(["dragonfly"]);
    const grasses = new Set(["grass_short", "grass_tall"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (butterflies.has(sceneObj.shape)) {
          mesh.position.y = sceneObj.position.y + Math.sin(t * 2 + sceneObj.position.x) * 0.15;
          mesh.rotation.z = sceneObj.rotation.z + Math.sin(t * 3) * 0.1;
        } else if (bees.has(sceneObj.shape)) {
          mesh.position.y = sceneObj.position.y + Math.sin(t * 4 + sceneObj.position.x) * 0.1;
          mesh.rotation.y = sceneObj.rotation.y + t * 1.5;
        } else if (ladybugs.has(sceneObj.shape)) {
          mesh.position.x = sceneObj.position.x + Math.sin(t * 0.5) * 0.3;
        } else if (dragonflies.has(sceneObj.shape)) {
          mesh.position.y = sceneObj.position.y + Math.sin(t * 3) * 0.12;
          mesh.rotation.z = sceneObj.rotation.z + Math.sin(t * 2) * 0.08;
        } else if (grasses.has(sceneObj.shape)) {
          mesh.rotation.z = sceneObj.rotation.z + Math.sin(t * 1.5 + sceneObj.position.x) * 0.05 * windStrength;
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, windStrength, sceneReady, objects]);

  // Food animation (coffee steam, donut sprinkles subtle motion)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const coffeeCups = new Set(["coffeecup"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (coffeeCups.has(sceneObj.shape)) {
          // Steam rising
          mesh.traverse((child) => {
            if ((child as import("three").Mesh).isMesh && (child as any).material?.opacity !== undefined && (child as any).material.opacity < 0.5) {
              child.position.y = 0.65 + Math.sin(t * 2 + child.position.x) * 0.08;
              child.rotation.y = t * 0.5;
            }
          });
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Personal transport animation (motorcycle/bicycle wheels, paraglider float)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const bikes = new Set(["motorcycle", "bicycle"]);
    const paragliders = new Set(["paraglider"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (bikes.has(sceneObj.shape)) {
          // Rotate wheels
          mesh.traverse((child) => {
            if (child.userData.wheel) {
              child.rotation.x += 0.05;
            }
          });
        } else if (paragliders.has(sceneObj.shape)) {
          // Float and sway
          mesh.position.y = sceneObj.position.y + Math.sin(t * 1.2 + sceneObj.position.x) * 0.3;
          mesh.rotation.z = sceneObj.rotation.z + Math.sin(t * 0.8) * 0.05;
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Transport animation (hot air balloon float, helicopter2 rotor, train wheels, bus wheels)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const balloons = new Set(["hotairballoon"]);
    const helicopters = new Set(["helicopter2"]);
    const trains = new Set(["train"]);
    const buses = new Set(["bus"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (balloons.has(sceneObj.shape)) {
          // Gentle float up and down
          mesh.position.y = sceneObj.position.y + Math.sin(t * 1.2 + sceneObj.position.x) * 0.3;
          mesh.rotation.y = sceneObj.rotation.y + Math.sin(t * 0.5) * 0.1;
        } else if (helicopters.has(sceneObj.shape)) {
          // Rotate main rotor
          mesh.traverse((child) => {
            if (child.userData.helicopterBlades) {
              child.rotation.y = t * 15;
            }
          });
        } else if (trains.has(sceneObj.shape) || buses.has(sceneObj.shape)) {
          // Rotate wheels
          mesh.traverse((child) => {
            if (child.userData.wheel) {
              child.rotation.x += 0.05;
            }
          });
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Energy animation (wind turbine blades, solar panel shimmer, satellite2 rotation)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const turbines = new Set(["windturbine"]);
    const solarPanels = new Set(["solarpanel"]);
    const satellites = new Set(["satellite2"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (turbines.has(sceneObj.shape)) {
          // Rotate blades
          mesh.traverse((child) => {
            if (child.userData.turbineBlades) {
              child.rotation.x = t * 3;
            }
          });
        } else if (solarPanels.has(sceneObj.shape)) {
          // Shimmer effect on glass cells
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.opacity !== undefined && mat.opacity < 1) {
              mat.opacity = 0.85 + Math.sin(t * 2 + sceneObj.position.x) * 0.1;
            }
          });
        } else if (satellites.has(sceneObj.shape)) {
          // Slow rotation
          mesh.rotation.y = sceneObj.rotation.y + t * 0.5;
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Structure V3 animation (lighthouse2 beacon, stadium lights, windmill2 blades)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const lighthouses = new Set(["lighthouse2"]);
    const stadiums = new Set(["stadium"]);
    const windmills = new Set(["windmill2"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (lighthouses.has(sceneObj.shape)) {
          // Rotating light beam
          mesh.traverse((child) => {
            if (child.userData.beacon) {
              child.rotation.y = t;
            }
          });
          // Pulse light
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.emissiveIntensity !== undefined && mat.emissiveIntensity > 2) {
              mat.emissiveIntensity = 2 + Math.sin(t * 4) * 1;
            }
          });
        } else if (stadiums.has(sceneObj.shape)) {
          // Stadium light pulse
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.emissiveIntensity !== undefined && mat.emissiveIntensity > 1) {
              mat.emissiveIntensity = 1 + Math.sin(t * 3 + sceneObj.position.x) * 0.5;
            }
          });
        } else if (windmills.has(sceneObj.shape)) {
          // Windmill blades rotating
          mesh.traverse((child) => {
            if (child.userData.windmillBlades) {
              child.rotation.z = t * 2;
            }
          });
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Environment V3 animation (volcano2 lava, glacier shimmer, obelisk glow)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const volcanos = new Set(["volcano2"]);
    const glaciers = new Set(["glacier"]);
    const obelisks = new Set(["obelisk"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (volcanos.has(sceneObj.shape)) {
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.emissiveIntensity !== undefined && mat.emissive && (mat.emissive as any).r > 0.5) {
              mat.emissiveIntensity = 1.5 + Math.sin(t * 2 + sceneObj.position.x) * 0.5;
            }
          });
        } else if (glaciers.has(sceneObj.shape)) {
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.opacity !== undefined && mat.opacity < 1) {
              mat.opacity = 0.75 + Math.sin(t * 1.5 + sceneObj.position.x) * 0.1;
            }
          });
        } else if (obelisks.has(sceneObj.shape)) {
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.metalness === 1 && mat.color && (mat.color as any).getHex() === 0xffd700) {
              mat.emissive.set("#ffaa00");
              mat.emissiveIntensity = 0.3 + Math.sin(t * 2.5) * 0.3;
            }
          });
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Fountain and tower light animation
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const fountains = new Set(["fountain"]);
    const towers = new Set(["tower"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (fountains.has(sceneObj.shape)) {
          // Water spray animation
          mesh.traverse((child) => {
            const childMesh = child as import("three").Mesh;
            if (childMesh.isMesh && childMesh.geometry.type === "SphereGeometry") {
              // Simple bob animation for water drops
              if (child.position.y > 1.7 && child.position.y < 2) {
                child.position.y = 1.85 + Math.sin(t * 3 + child.position.x) * 0.1;
              }
            }
          });
        } else if (towers.has(sceneObj.shape)) {
          // Tower light pulse
          mesh.traverse((child) => {
            const mat = (child as import("three").Mesh).material as import("three").MeshStandardMaterial;
            if (mat && mat.emissive) {
              mat.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.3;
            }
          });
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Space object animation (UFO, meteor, comet)
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const spaceShapes = new Set(["ufo", "meteor", "comet", "spaceship", "satellite"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj || !spaceShapes.has(sceneObj.shape)) return;
        if (sceneObj.locked) return;

        if (sceneObj.shape === "ufo") {
          mesh.rotation.y = sceneObj.rotation.y + t * 0.5;
          mesh.position.y = sceneObj.position.y + Math.sin(t * 1.5) * 0.1;
        } else if (sceneObj.shape === "meteor") {
          mesh.rotation.z = sceneObj.rotation.z + t * 0.8;
          mesh.rotation.x = sceneObj.rotation.x + t * 0.3;
        } else if (sceneObj.shape === "comet") {
          mesh.position.x = sceneObj.position.x + Math.sin(t * 0.5) * 0.3;
        } else if (sceneObj.shape === "spaceship" || sceneObj.shape === "satellite") {
          mesh.rotation.y = sceneObj.rotation.y + t * 0.3;
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

  // Wheel rotation animation for cars
  useEffect(() => {
    if (!sceneReady) return;

    const carShapes = new Set([
      "car", "sportcar", "suv", "pickup", "van", "police",
      "lamborghini", "ferrari", "tesla"
    ]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh) => {
        const sceneObj = objects.find(o => o.id === mesh.userData.objectId);
        if (!sceneObj || !carShapes.has(sceneObj.shape)) return;
        if (sceneObj.locked) return;

        // Rotate wheels if the mesh has wheel data
        mesh.traverse((child) => {
          if (child.userData.wheel) {
            child.rotation.x += 0.05;
          }
        });
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [sceneReady, objects]);

  // Water, cloud, star animation
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;

    const waterShapes = new Set(["pond", "waterfall"]);
    const cloudShapes = new Set(["cloud"]);
    const starShapes = new Set(["star", "moon"]);

    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;

      meshesRef.current.forEach((mesh, id) => {
        const sceneObj = objects.find(o => o.id === id);
        if (!sceneObj) return;
        if (sceneObj.locked) return;

        if (waterShapes.has(sceneObj.shape)) {
          // Gentle wave motion
          mesh.position.y = sceneObj.position.y + Math.sin(t * 2) * 0.02;
          mesh.rotation.y = sceneObj.rotation.y + Math.sin(t * 0.8) * 0.02;
        } else if (cloudShapes.has(sceneObj.shape)) {
          // Slow drift
          mesh.position.x = sceneObj.position.x + Math.sin(t * 0.3) * 0.5;
          mesh.position.y = sceneObj.position.y + Math.cos(t * 0.4) * 0.1;
        } else if (starShapes.has(sceneObj.shape)) {
          // Twinkle (scale pulse)
          const pulse = 1 + Math.sin(t * 3 + sceneObj.position.x) * 0.05;
          mesh.scale.set(
            sceneObj.scale.x * pulse,
            sceneObj.scale.y * pulse,
            sceneObj.scale.z * pulse
          );
        }
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, windStrength, sceneReady, objects]);

  // Wind animation for plants
  useEffect(() => {
    if (!windEnabled || !sceneReady) return;
    
    const plantShapes = new Set([
      "tree", "palmtree", "bigtree", "bush", "flower", "bamboo",
      "cactus", "pinetree", "sunflower", "lotus", "grass", "vine",
      "rose", "tulip", "mushroom"
    ]);
    
    let rafId: number;
    const animate = () => {
      windTimeRef.current += 0.016;
      const t = windTimeRef.current;
      
      meshesRef.current.forEach((mesh, id) => {
        const sceneObj = objects.find(o => o.id === id);
        if (!sceneObj || !plantShapes.has(sceneObj.shape)) return;
        if (sceneObj.locked) return;
        
        // Gentle sway based on time and position
        const baseRotZ = sceneObj.rotation.z;
        const baseRotX = sceneObj.rotation.x;
        const swayZ = Math.sin(t * 1.2 + sceneObj.position.x * 0.5) * 0.03 * windStrength;
        const swayX = Math.cos(t * 0.9 + sceneObj.position.z * 0.5) * 0.02 * windStrength;
        
        mesh.rotation.z = baseRotZ + swayZ;
        mesh.rotation.x = baseRotX + swayX;
      });
      
      rafId = requestAnimationFrame(animate);
    };
    
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [windEnabled, sceneReady, objects]);

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

          <EnvironmentTemplates onLoadTemplate={handleLoadTemplate} />
          <RoadElementsPanel onAdd={handleQuickAdd} />
          <KiPanel
            objects={objects}
            onApplyColor={(c) => {
              const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
              if (!ids.length) return;
              commitObjects(objects.map((o) => (ids.includes(o.id) && !o.locked ? { ...o, color: c } : o)));
            }}
          />

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
            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.9rem", color: "#a0aec0" }}>
              <input
                type="checkbox"
                checked={windEnabled}
                onChange={(e) => setWindEnabled(e.target.checked)}
              />
              🌬️ Wind Animation
            </label>
            {windEnabled && (
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem", color: "#a0aec0" }}>
                Strength:
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={windStrength}
                  onChange={(e) => setWindStrength(parseFloat(e.target.value))}
                  style={{ width: "100px" }}
                />
                <span style={{ fontSize: "0.8rem", minWidth: "30px" }}>{windStrength.toFixed(1)}</span>
              </label>
            )}

            <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#0a1420", borderRadius: "8px", border: "1px solid #31516e" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "#4a90d9" }}>🌱 Plant Colors</h4>
              <p style={{ margin: "0 0 8px", fontSize: "0.75rem", color: "#a0aec0" }}>
                ជ្រើសរើសវត្ថុរុក្ខជាតិមួយ រួចចុចពណ៌ខាងក្រោមដើម្បីផ្លាស់ពណ៌
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {PLANT_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    title={preset.name}
                    onClick={() => updateSelectedColor(preset.color)}
                    disabled={!selectedId}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: preset.color,
                      border: "2px solid #31516e",
                      cursor: selectedId ? "pointer" : "not-allowed",
                      opacity: selectedId ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#0a1420", borderRadius: "8px", border: "1px solid #31516e" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "#4a90d9" }}>🌌 Sky Colors</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {SKY_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    title={preset.name}
                    onClick={() => updateSelectedColor(preset.color)}
                    disabled={!selectedId}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: preset.color,
                      border: "2px solid #31516e",
                      cursor: selectedId ? "pointer" : "not-allowed",
                      opacity: selectedId ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginTop: "12px", padding: "12px", backgroundColor: "#0a1420", borderRadius: "8px", border: "1px solid #31516e" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "0.9rem", color: "#4a90d9" }}>💧 Water Colors</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {WATER_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    title={preset.name}
                    onClick={() => updateSelectedColor(preset.color)}
                    disabled={!selectedId}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: preset.color,
                      border: "2px solid #31516e",
                      cursor: selectedId ? "pointer" : "not-allowed",
                      opacity: selectedId ? 1 : 0.4,
                    }}
                  />
                ))}
              </div>
            </div>
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
            blinkingLights={blinkingLights}
            setBlinkingLights={setBlinkingLights}
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
            <div style={{ marginTop: "8px", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="filter"
                onClick={() => bgMusicInputRef.current?.click()}
                style={{ fontSize: "0.85rem" }}
              >
                🎵 {bgMusicFile ? "Change Music" : "Add Background Music"}
              </button>
              {bgMusicFile && (
                <>
                  <small style={{ color: "#4a90d9" }}>🎶 {bgMusicFile.name}</small>
                  <button
                    type="button"
                    className="filter"
                    onClick={handleClearMusic}
                    style={{ fontSize: "0.75rem", padding: "4px 8px", color: "#ff6b6b" }}
                  >
                    Remove
                  </button>
                </>
              )}
              <input
                ref={bgMusicInputRef}
                type="file"
                accept="audio/*"
                onChange={handleMusicUpload}
                style={{ display: "none" }}
              />
            </div>

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
