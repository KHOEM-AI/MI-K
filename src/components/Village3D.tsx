import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import FpsCounter from "./FpsCounter";
import { useAutoQuality } from "./useAutoQuality";
import {
  createVillageGround,
  createVillageRoads,
  createVillageHousesInstanced,
  createMeatVegFactory,
  createMarketStall,
  createPhoneShop,
  createClothingShop,
  createMotorbikeShop,
  createBikeShop,
  createRiceField,
  createVegetableGarden,
  createStreetLamps,
} from "./villageGeometry";
import {
  createMountain,
  createForest,
  createLake,
  createFishPond,
  createBridge,
  createChicken,
  createMixedFarm,
} from "./natureElements";
import { createTrafficSystem, updateTraffic, type TrafficVehicle } from "./trafficSystem";
import { createVillageAnimals, updateAnimals, type AnimatedAnimal } from "./villageAnimals";
import { createTrafficLights, updateTrafficLights, type TrafficLight } from "./trafficLights";
import { createChickenFlock, updateChickenFlock, type AnimatedChicken } from "./villageAnimals";
import {
  createSwayCrops,
  updateSwayCrops,
  createSwayVeggies,
  updateSwayVeggies,
  createClouds,
  updateClouds,
  type SwayCrop,
  type SwayVeg,
  type DriftCloud,
} from "./villageAnimations";

export default function Village3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const nightRef = useRef(isNight);
  nightRef.current = isNight;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const trafficVehiclesRef = useRef<TrafficVehicle[]>([]);
  const animalsRef = useRef<AnimatedAnimal[]>([]);
  const trafficLightsRef = useRef<TrafficLight[]>([]);
  const chickensRef = useRef<AnimatedChicken[]>([]);
  const cropsRef = useRef<SwayCrop[]>([]);
  const veggiesRef = useRef<SwayVeg[]>([]);
  const cloudsRef = useRef<DriftCloud[]>([]);
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  useAutoQuality(rendererRef);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color("#87ceeb");
    scene.fog = new THREE.Fog("#87ceeb", 250, 700);

    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    camera.position.set(150, 100, 200);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(100, 150, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -250;
    sun.shadow.camera.right = 250;
    sun.shadow.camera.top = 250;
    sun.shadow.camera.bottom = -250;
    sun.shadow.camera.far = 600;
    sun.shadow.bias = -0.0005;
    sunRef.current = sun;
    scene.add(sun);

    scene.add(createVillageGround());
    scene.add(createVillageRoads());

    const factory = createMeatVegFactory();
    factory.position.set(0, 0, -110);
    scene.add(factory);

    const { group: villageGroup } = createVillageHousesInstanced(300);
    scene.add(villageGroup);

    // ចង្កៀងផ្លូវ
    scene.add(createStreetLamps());

    // ========== បរិស្ថានធម្មជាតិ ==========

    // ភ្នំ ៤
    const mountains = [
      { pos: [-250, 0, -250], h: 60, r: 50, c: "#4a5568" },
      { pos: [250, 0, -250], h: 70, r: 55, c: "#5d6d7e" },
      { pos: [-280, 0, 200], h: 50, r: 40, c: "#4a5568" },
      { pos: [280, 0, 200], h: 55, r: 45, c: "#5d6d7e" },
    ];
    mountains.forEach(({ pos, h, r, c }) => {
      const m = createMountain(h, r, c);
      m.position.set(pos[0], h / 2, pos[2]);
      scene.add(m);
    });

    // ព្រៃឈើ ៣
    scene.add(createForest(60, -200, 150, 100, 111));
    scene.add(createForest(60, 200, 150, 100, 222));
    scene.add(createForest(40, 0, -200, 120, 333));

    // បឹងធំ
    const lake = createLake(40);
    lake.position.set(-180, 0, -100);
    scene.add(lake);

    // ស្រះត្រី ៤
    const ponds: [number, number, number][] = [
      [-80, 0, 40],
      [80, 0, 40],
      [-80, 0, -40],
      [80, 0, -40],
    ];
    ponds.forEach(([x, y, z]) => {
      const pond = createFishPond(10);
      pond.position.set(x, y, z);
      scene.add(pond);
    });

    // ស្ពាន ២
    const bridge1 = createBridge(15, 5);
    bridge1.position.set(-40, 0, 0);
    bridge1.rotation.y = Math.PI / 2;
    scene.add(bridge1);

    const bridge2 = createBridge(15, 5);
    bridge2.position.set(40, 0, 0);
    bridge2.rotation.y = Math.PI / 2;
    scene.add(bridge2);

    // ចម្ការបន្លែចម្រុះ ៦
    const mixedFarms: [number, number, number][] = [
      [-130, 0, 150],
      [130, 0, 150],
      [-130, 0, -150],
      [130, 0, -150],
      [-150, 0, 60],
      [150, 0, 60],
    ];
    mixedFarms.forEach(([x, y, z]) => {
      const farm = createMixedFarm(25);
      farm.position.set(x, y, z);
      scene.add(farm);
    });

    // មាន់ ២០
    for (let i = 0; i < 20; i++) {
      const chicken = createChicken(i % 2 === 0 ? "#f39c12" : "#ffffff");
      const angle = (i / 20) * Math.PI * 2;
      const radius = 60 + (i % 3) * 10;
      chicken.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      chicken.rotation.y = angle;
      scene.add(chicken);
    }

    // ========== ចរាចរណ៍ (ម៉ូតូ ១០ + ឡាន ៥ + អ្នកថ្មើរជើង ៨) ==========
    const traffic = createTrafficSystem();
    scene.add(traffic.group);
    trafficVehiclesRef.current = traffic.vehicles;

    // ========== សត្វ (គោ ៥ + ជ្រូក ៦ + ទា ១៥) ==========
    const animals = createVillageAnimals();
    scene.add(animals.group);
    animalsRef.current = animals.animals;

    // ========== ភ្លើងស្តុប ៤ (តាមផ្លូវបំបែក) ==========
    const trafficLights = createTrafficLights();
    scene.add(trafficLights.group);
    trafficLightsRef.current = trafficLights.lights;

    // ========== A: មាន់ដើរ ២០ ==========
    const chickens = createChickenFlock(20, -50, 30, 25);
    scene.add(chickens.group);
    chickensRef.current = chickens.chickens;

    // ========== B: ស្រូវបក់ (ស្រែ ៤ កន្លែង) ==========
    const cropPositions = [
      [-140, 120], [140, 120], [-140, -120], [140, -120],
    ];
    cropPositions.forEach(([cx, cz]) => {
      const sw = createSwayCrops(64, cx, cz, 28);
      scene.add(sw.group);
      cropsRef.current.push(...sw.crops);
    });

    // ========== B2: បន្លែបក់ ==========
    const vegPositions = [
      [-100, -100], [-70, -100], [70, -100], [100, -100],
    ];
    vegPositions.forEach(([cx, cz]) => {
      const sv = createSwayVeggies(25, cx, cz, 13);
      scene.add(sv.group);
      veggiesRef.current.push(...sv.veggies);
    });

    // ========== C: ពពករសាត់ ១៥ ==========
    const cloudSystem = createClouds(15, 110, 500);
    scene.add(cloudSystem.group);
    cloudsRef.current = cloudSystem.clouds;

    const markets = [
      { f: createMarketStall("#e74c3c"), pos: [-70, 0, 60] as const },
      { f: createMarketStall("#f39c12"), pos: [70, 0, 60] as const },
      { f: createMarketStall("#27ae60"), pos: [-70, 0, -60] as const },
      { f: createMarketStall("#3498db"), pos: [70, 0, -60] as const },
    ];
    markets.forEach(({ f, pos }) => {
      f.position.set(pos[0], pos[1], pos[2]);
      scene.add(f);
    });

    const shops = [
      { f: createPhoneShop(), pos: [-40, 0, 70] as const },
      { f: createClothingShop(), pos: [-15, 0, 70] as const },
      { f: createMotorbikeShop(), pos: [15, 0, 70] as const },
      { f: createBikeShop(), pos: [45, 0, 70] as const },
    ];
    shops.forEach(({ f, pos }) => {
      f.position.set(pos[0], pos[1], pos[2]);
      scene.add(f);
    });

    const riceFields = [
      [-140, 0, 120] as const,
      [140, 0, 120] as const,
      [-140, 0, -120] as const,
      [140, 0, -120] as const,
    ];
    riceFields.forEach(([x, y, z]) => {
      const field = createRiceField(30);
      field.position.set(x, y, z);
      scene.add(field);
    });

    const gardens = [
      [-100, 0, -100] as const,
      [-70, 0, -100] as const,
      [70, 0, -100] as const,
      [100, 0, -100] as const,
    ];
    gardens.forEach(([x, y, z]) => {
      const garden = createVegetableGarden(15);
      garden.position.set(x, y, z);
      scene.add(garden);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 30;
    controls.maxDistance = 500;
    controls.target.set(0, 10, 0);
    controls.update();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    // ====== Day/Night transitions ======
    const dayBg = new THREE.Color("#87ceeb");
    const nightBg = new THREE.Color("#0a1128");
    let currentBg = dayBg.clone();

    let rafId = 0;
    const animate = () => {
      const night = nightRef.current;
      const targetBg = night ? nightBg : dayBg;

      // ផ្លាស់ពណ៌មេឃ
      currentBg.lerp(targetBg, 0.05);
      scene.background = currentBg;
      scene.fog!.color.copy(currentBg);

      // ផ្លាស់ពន្លឺថ្ងៃ
      const targetSun = night ? 0.1 : 1.3;
      sun.intensity += (targetSun - sun.intensity) * 0.05;

      // ចង្កៀងផ្លូវ (emissive)
      const targetLampEmissive = night ? 1.5 : 0;
      scene.traverse((obj) => {
        if (obj.name === "streetLamp") {
          const mesh = obj as THREE.Mesh;
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.emissiveIntensity += (targetLampEmissive - mat.emissiveIntensity) * 0.05;
        }
      });

      // Update traffic
      if (trafficVehiclesRef.current.length > 0) {
        const elapsed = performance.now() / 1000;
        updateTraffic(trafficVehiclesRef.current, elapsed);
      }

      // Update animals + traffic lights
      if (animalsRef.current.length > 0) {
        const elapsed = performance.now() / 1000;
        updateAnimals(animalsRef.current, elapsed);
      }
      if (trafficLightsRef.current.length > 0) {
        updateTrafficLights(trafficLightsRef.current, 1 / 60);
      }

      // Update A + B + C
      const elapsedSec = performance.now() / 1000;
      if (chickensRef.current.length > 0) {
        updateChickenFlock(chickensRef.current, elapsedSec);
      }
      if (cropsRef.current.length > 0) {
        updateSwayCrops(cropsRef.current, elapsedSec);
      }
      if (veggiesRef.current.length > 0) {
        updateSwayVeggies(veggiesRef.current, elapsedSec);
      }
      if (cloudsRef.current.length > 0) {
        updateClouds(cloudsRef.current, elapsedSec, 500);
      }

      controls.update();
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(animate);
    };
    animate();

    setLoading(false);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  const takeScreenshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const dataURL = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `village-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const exportGLB = async () => {
    const scene = sceneRef.current;
    if (!scene || busy) return;
    setBusy(true);
    try {
      const exporter = new GLTFExporter();
      const result = await exporter.parseAsync(scene, { binary: true });
      const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `village-${Date.now()}.glb`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export GLB failed:", err);
      alert("Export បរាជ័យ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={mountRef}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        background: "#87ceeb",
      }}
    >
      {!loading && (
        <>
          <FpsCounter />
          <div
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              display: "flex",
              gap: 8,
              zIndex: 10,
            }}
          >
            <button
              type="button"
              onClick={takeScreenshot}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#16a085",
                color: "#fff",
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              📸 Screenshot
            </button>
            <button
              type="button"
              onClick={exportGLB}
              disabled={busy}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: busy ? "#7f8c8d" : "#8e44ad",
                color: "#fff",
                fontSize: 14,
                cursor: busy ? "wait" : "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              {busy ? "⏳ កំពុង Export..." : "🎬 Export GLB"}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsNight((n) => !n)}
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: isNight ? "#f1c40f" : "#2c3e50",
              color: isNight ? "#000" : "#fff",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {isNight ? "☀️ Day Mode" : "🌙 Night Mode"}
          </button>
        </>
      )}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#fff",
            fontSize: "1.2rem",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          🏘️ កំពុងផ្ទុកភូមិ...
        </div>
      )}
    </div>
  );
}
