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
import { createRain, updateRain, type RainSystem, createLightning, updateLightning, type LightningSystem } from "./rainSystem";
import { createMarketLife, updateShoppers, type Shopper } from "./marketLife";
import { createStars, updateStars, createMoon } from "./nightSky";
import { TimeController, getTimeOfDay, applyTimeOfDay } from "./timeSystem";
import {
  createVillagers,
  updateVillagers,
  createHouseLights,
  updateHouseLights,
  type Villager,
  type HouseLight,
} from "./villageLife";
import { VillageRegistry, createCropCycle, updateCropCycle, createSmartTraffic, updateSmartTraffic, type CropCycle, type SmartVehicle } from "./villageSimulation";
import {
  createFishSchool,
  updateFishSchool,
  createWaterRipple,
  updateWaterRipple,
  createFallingLeaves,
  updateFallingLeaves,
  type Fish,
  type WaterRipple,
  type FallingLeaf,
} from "./waterSystem";
import {
  createSoundSystem,
  initSound,
  setMasterVolume,
  setRainSound,
  setBirdSound,
  setWindSound,
  disposeSound,
  type SoundSystem,
} from "./soundSystem";
import {
  saveVillage,
  loadVillage,
  hasSave,
  clearSave,
  startAutoSave,
  type VillageSaveState,
} from "./villageSave";
import { createAncientZone, updateAncientZone } from "./ancientRuins";
import { createWildAnimals, updateWildAnimals, type WildAnimal } from "./wildAnimals";
import { createForestZone, updateForestZone } from "./forestEnvironment";
import { createForestWildlife, updateForestWildlife, type ForestAnimal } from "./forestWildlife";

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
  const rainRef = useRef<RainSystem | null>(null);
  const lightningRef = useRef<LightningSystem | null>(null);
  const shoppersRef = useRef<Shopper[]>([]);
  const [isRaining, setIsRaining] = useState(false);
  const [timeHour, setTimeHour] = useState(10);
  const timeControllerRef = useRef<TimeController | null>(null);
  const ambientRef = useRef<THREE.AmbientLight | null>(null);
  const villagersRef = useRef<Villager[]>([]);
  const houseLightsRef = useRef<HouseLight[]>([]);
  const registryRef = useRef<VillageRegistry | null>(null);
  const cropCyclesRef = useRef<CropCycle[]>([]);
  const smartTrafficRef = useRef<SmartVehicle[]>([]);
  const fishesRef = useRef<Fish[]>([]);
  const waterRipplesRef = useRef<WaterRipple[]>([]);
  const leavesRef = useRef<FallingLeaf[]>([]);
  const soundRef = useRef<SoundSystem>(createSoundSystem());
  const [soundOn, setSoundOn] = useState(false);
  const ancientWindowMatsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const wildAnimalsRef = useRef<WildAnimal[]>([]);
  const forestBeesRef = useRef<THREE.Mesh[]>([]);
  const forestWaterRef = useRef<THREE.Mesh[]>([]);
  const forestAnimalsRef = useRef<ForestAnimal[]>([]);
  const starsRef = useRef<THREE.Points | null>(null);
  const moonRef = useRef<THREE.Group | null>(null);
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  useAutoQuality(rendererRef);

  // Auto-save រៀងរាល់ ៣០ វិ
  useEffect(() => {
    const stop = startAutoSave(() => ({
      version: 1,
      timestamp: Date.now(),
      time: {
        hour: timeControllerRef.current?.getHour() ?? 10,
        speed: timeControllerRef.current?.getSpeed() ?? 0.3,
        running: timeControllerRef.current?.isRunning() ?? true,
      },
      weather: { isRaining, isNight },
      camera: {
        position: cameraRef.current
          ? [cameraRef.current.position.x, cameraRef.current.position.y, cameraRef.current.position.z]
          : [150, 100, 200],
        target: [0, 10, 0],
      },
      stats: {
        totalFamilies: registryRef.current?.totalFamilies ?? 0,
        totalPeople: registryRef.current?.totalPeople ?? 0,
        totalLights: registryRef.current?.getHousesWithLight().length ?? 0,
      },
    }));
    return stop;
  }, [isRaining, isNight]);

  // Update time display
  useEffect(() => {
    const interval = setInterval(() => {
      if (timeControllerRef.current) {
        setTimeHour(timeControllerRef.current.getHour());
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Toggle rain + rain sound
  useEffect(() => {
    if (rainRef.current) {
      rainRef.current.points.visible = isRaining;
    }
    if (lightningRef.current) {
      lightningRef.current.light.visible = isRaining;
    }
    if (soundRef.current) {
      setRainSound(soundRef.current, isRaining && soundOn);
    }
  }, [isRaining, soundOn]);

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
    ambientRef.current = ambient;
    scene.add(ambient);

    // Time controller
    const timeController = new TimeController(10, 0.3); // ចាប់ផ្តើម ១០ ម៉ោង, ០.៣ ម៉ោង/វិនាទី
    timeControllerRef.current = timeController;

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

    // ចរាចរណ៍ឆ្លាតវៃ (ឈប់តាមភ្លើងស្តុប)
    const stopPoints = [
      { t: 0.25, lightIndex: 0 },
      { t: 0.5, lightIndex: 1 },
      { t: 0.75, lightIndex: 2 },
      { t: 0.95, lightIndex: 3 },
    ];
    smartTrafficRef.current = createSmartTraffic(
      traffic.vehicles.slice(0, 10).map((v) => v.mesh),
      traffic.vehicles[0].curve,
      stopPoints
    );

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
      // បន្ថែមវដ្តដាំដុះ
      sw.crops.forEach((crop) => {
        cropCyclesRef.current.push(createCropCycle(crop.mesh, 1));
      });
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

    // ========== A: ភ្លៀង (Rain) ==========
    const rain = createRain(2000, 500, 150);
    scene.add(rain.points);
    rainRef.current = rain;

    const lightning = createLightning();
    scene.add(lightning.light);
    lightningRef.current = lightning;

    // ========== C: ជីវិតផ្សារ ==========
    const marketLife = createMarketLife();
    scene.add(marketLife.group);
    shoppersRef.current = marketLife.shoppers;

    // ========== A: ជីវិតប្រជាជន (៣០ នាក់) ==========
    const villagers = createVillagers(100);
    scene.add(villagers.group);
    villagersRef.current = villagers.villagers;

    // ========== B: ភ្លើងផ្ទះ (៣០) ==========
    const registry = new VillageRegistry();
    const houseLights = createHouseLights(100, registry);
    scene.add(houseLights.group);
    houseLightsRef.current = houseLights.lights;
    registryRef.current = registry;

    // ========== A: ត្រីហែលក្នុងស្រះ ==========
    // ស្រះត្រី ៤ ទីតាំង (±80, ±40)
    const pondPositions = [
      [-80, 40], [80, 40], [-80, -40], [80, -40],
    ];
    pondPositions.forEach(([px, pz]) => {
      const fishSchool = createFishSchool(5, px, pz, 10);
      scene.add(fishSchool.group);
      fishesRef.current.push(...fishSchool.fishes);

      // Water ripple
      const ripple = createWaterRipple(15, "#2980b9");
      ripple.mesh.position.set(px, 0.15, pz);
      scene.add(ripple.mesh);
      waterRipplesRef.current.push(ripple);
    });

    // បឹងធំ (-180, -100) radius 40
    const lakeRipple = createWaterRipple(80, "#3498db");
    lakeRipple.mesh.position.set(-180, 0.15, -100);
    scene.add(lakeRipple.mesh);
    waterRipplesRef.current.push(lakeRipple);

    // ========== A: ស្លឹកឈើជ្រុះ ==========
    const leaves = createFallingLeaves(50, 300);
    scene.add(leaves.group);
    leavesRef.current = leaves.leaves;

    // ========== តំបន់បុរាណ ==========
    const ancient = createAncientZone();
    scene.add(ancient.group);
    ancientWindowMatsRef.current = ancient.windowMats;

    // ========== សត្វព្រៃ ==========
    const wildAnimals = createWildAnimals();
    scene.add(wildAnimals.group);
    wildAnimalsRef.current = wildAnimals.animals;

    // ========== តំបន់ព្រៃភ្នំ (អូរ, ទឹកជ្រោះ, ដើមឈើផ្លែ, ផ្កាវល្លិ៍, ឃ្មុំ, ថ្នាំបុរាណ) ==========
    const forest = createForestZone(-300, 250);
    scene.add(forest.group);
    forestBeesRef.current = forest.bees;
    forestWaterRef.current = forest.waterMeshes;

    // ========== សត្វព្រៃបន្ថែម (ខ្ទីង, ក្ដាន់, ព្រើស, ង៉ែង) ==========
    const forestWildlife = createForestWildlife(-300, 250);
    scene.add(forestWildlife.group);
    forestAnimalsRef.current = forestWildlife.animals;

    // ========== B: ផ្កាយ + ព្រះច័ន្ទ (សម្រាប់ពេលយប់) ==========
    const stars = createStars(1500, 800);
    scene.add(stars);
    starsRef.current = stars;

    const moon = createMoon();
    scene.add(moon);
    moonRef.current = moon;

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

      // Update A: ភ្លៀង
      const delta = 1 / 60;
      if (rainRef.current) {
        updateRain(rainRef.current, delta, 500, 150);
      }
      if (lightningRef.current && isRaining) {
        updateLightning(lightningRef.current, delta);
      }

      // Update C: ផ្សារ
      if (shoppersRef.current.length > 0) {
        updateShoppers(shoppersRef.current, elapsedSec);
      }

      // Update A: Time of Day
      if (timeControllerRef.current) {
        const hour = timeControllerRef.current.update(1 / 60);
        const tod = getTimeOfDay(hour);
        const sun = sunRef.current;
        const amb = ambientRef.current;
        if (sun && amb) {
          applyTimeOfDay(scene, sun, amb, tod);
        }
        // ធ្វើឱ្យចង្កៀងផ្លូវភ្លឺពេលល្ងាច/យប់ (ជំនួស isNight manual)
        const nightNow = tod.isNight;
        scene.traverse((obj) => {
          if (obj.name === "streetLamp") {
            const mesh = obj as THREE.Mesh;
            const m = mesh.material as THREE.MeshStandardMaterial;
            const target = nightNow ? 1.5 : 0;
            m.emissiveIntensity += (target - m.emissiveIntensity) * 0.05;
          }
        });
      }

      // Update forest zone (ឃ្មុំ + ទឹក)
      if (forestBeesRef.current.length > 0 || forestWaterRef.current.length > 0) {
        updateForestZone(forestBeesRef.current, forestWaterRef.current, elapsedSec);
      }

      // Update forest wildlife
      if (forestAnimalsRef.current.length > 0) {
        updateForestWildlife(forestAnimalsRef.current, elapsedSec);
      }

      // Update ancient zone (windows បើកពេលយប់)
      if (ancientWindowMatsRef.current.length > 0 && timeControllerRef.current) {
        updateAncientZone(ancientWindowMatsRef.current, timeControllerRef.current.getHour());
      }

      // Update wild animals
      if (wildAnimalsRef.current.length > 0) {
        updateWildAnimals(wildAnimalsRef.current, elapsedSec);
      }

      // Update A: ត្រី + រលក + ស្លឹកឈើ
      if (fishesRef.current.length > 0) {
        updateFishSchool(fishesRef.current, elapsedSec);
      }
      if (waterRipplesRef.current.length > 0) {
        waterRipplesRef.current.forEach((r) => updateWaterRipple(r, elapsedSec));
      }
      if (leavesRef.current.length > 0) {
        updateFallingLeaves(leavesRef.current, delta);
      }

      // Update crop cycles
      if (cropCyclesRef.current.length > 0) {
        cropCyclesRef.current.forEach((crop) => {
          updateCropCycle(crop, delta, elapsedSec);
        });
      }

      // Update smart traffic
      if (smartTrafficRef.current.length > 0 && trafficLightsRef.current.length > 0) {
        const phases = trafficLightsRef.current.map((tl) => tl.phase);
        updateSmartTraffic(smartTrafficRef.current, phases, delta);
      }

      // Update A: ជីវិតប្រជាជន
      if (villagersRef.current.length > 0 && timeControllerRef.current) {
        const h = timeControllerRef.current.getHour();
        updateVillagers(villagersRef.current, h, elapsedSec);
      }

      // Update B: ភ្លើងផ្ទះ
      if (houseLightsRef.current.length > 0 && timeControllerRef.current) {
        updateHouseLights(houseLightsRef.current, timeControllerRef.current.getHour());
      }

      // Update B: ផ្កាយ + ព្រះច័ន្ទ
      if (starsRef.current) {
        const night = isNight || (timeControllerRef.current ? getTimeOfDay(timeControllerRef.current.getHour()).isNight : false);
        updateStars(starsRef.current, night, delta);
      }
      if (moonRef.current) {
        const night = isNight || (timeControllerRef.current ? getTimeOfDay(timeControllerRef.current.getHour()).isNight : false);
        moonRef.current.visible = night;
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
      disposeSound(soundRef.current);
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

  const handleSave = () => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!scene || !camera) return;

    // យក controls target ពី camera
    const target = new THREE.Vector3(0, 10, 0);

    const state: VillageSaveState = {
      version: 1,
      timestamp: Date.now(),
      time: {
        hour: timeControllerRef.current?.getHour() ?? 10,
        speed: timeControllerRef.current?.getSpeed() ?? 0.3,
        running: timeControllerRef.current?.isRunning() ?? true,
      },
      weather: {
        isRaining,
        isNight,
      },
      camera: {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [target.x, target.y, target.z],
      },
      stats: {
        totalFamilies: registryRef.current?.totalFamilies ?? 0,
        totalPeople: registryRef.current?.totalPeople ?? 0,
        totalLights: registryRef.current?.getHousesWithLight().length ?? 0,
      },
    };

    if (saveVillage(state)) {
      alert("✅ បានរក្សាទុកភូមិ!");
    } else {
      alert("❌ Save បរាជ័យ");
    }
  };

  const handleLoad = () => {
    const state = loadVillage();
    if (!state) {
      alert("❌ គ្មាន Save");
      return;
    }

    // Restore time
    if (timeControllerRef.current) {
      timeControllerRef.current.setHour(state.time.hour);
      timeControllerRef.current.setSpeed(state.time.speed);
      if (state.time.running && !timeControllerRef.current.isRunning()) {
        timeControllerRef.current.toggle();
      } else if (!state.time.running && timeControllerRef.current.isRunning()) {
        timeControllerRef.current.toggle();
      }
    }

    // Restore weather
    setIsRaining(state.weather.isRaining);
    setIsNight(state.weather.isNight);

    // Restore camera
    const camera = cameraRef.current;
    if (camera) {
      camera.position.set(...state.camera.position);
      camera.lookAt(...state.camera.target);
    }

    alert(`✅ Loaded! (${new Date(state.timestamp).toLocaleString()})`);
  };

  const handleClear = () => {
    if (confirm("លុប Save ចោល?")) {
      clearSave();
      alert("✅ លុបរួច");
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
          {/* Stats Display */}
          {registryRef.current && (
            <div
              style={{
                position: "absolute",
                bottom: 16,
                left: 16,
                padding: "10px 16px",
                borderRadius: 8,
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                fontSize: 12,
                fontFamily: "monospace",
                zIndex: 20,
                lineHeight: 1.6,
              }}
            >
              🏠 {registryRef.current.totalFamilies} គ្រួសារ
              <br />
              👥 {registryRef.current.totalPeople} នាក់
              <br />
              💡 {registryRef.current.houses.filter((h) => h.hasLight).length} ភ្លើង
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            style={{
              position: "absolute",
              top: 16,
              right: 380,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#3498db",
              color: "#fff",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            💾 Save
          </button>
          {hasSave() && (
            <button
              type="button"
              onClick={handleLoad}
              style={{
                position: "absolute",
                top: 16,
                right: 480,
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#27ae60",
                color: "#fff",
                fontSize: 14,
                fontWeight: "bold",
                cursor: "pointer",
                zIndex: 20,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              📂 Load
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const newOn = !soundOn;
              setSoundOn(newOn);
              if (newOn) {
                initSound(soundRef.current);
                setMasterVolume(soundRef.current, 0.3);
                setWindSound(soundRef.current, true);
                setBirdSound(soundRef.current, true);
              } else {
                setMasterVolume(soundRef.current, 0);
              }
            }}
            style={{
              position: "absolute",
              top: 16,
              right: 260,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: soundOn ? "#27ae60" : "#7f8c8d",
              color: "#fff",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {soundOn ? "🔊 Sound ON" : "🔇 Sound OFF"}
          </button>
          <button
            type="button"
            onClick={() => setIsRaining((r) => !r)}
            style={{
              position: "absolute",
              top: 16,
              right: 130,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: isRaining ? "#3498db" : "#34495e",
              color: "#fff",
              fontSize: 14,
              fontWeight: "bold",
              cursor: "pointer",
              zIndex: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {isRaining ? "🌧️ Stop Rain" : "🌧️ Start Rain"}
          </button>
          {/* Time of Day controls */}
          <div
            style={{
              position: "absolute",
              top: 60,
              right: 16,
              display: "flex",
              gap: 8,
              zIndex: 20,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (timeControllerRef.current) {
                  timeControllerRef.current.toggle();
                }
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: "#2c3e50",
                color: "#fff",
                fontSize: 13,
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              ⏸️ Pause
            </button>
            <button
              type="button"
              onClick={() => {
                if (timeControllerRef.current) {
                  const speeds = [0.1, 0.3, 0.5, 1, 2, 5];
                  const cur = timeControllerRef.current.getSpeed();
                  const idx = speeds.indexOf(cur);
                  const next = speeds[(idx + 1) % speeds.length];
                  timeControllerRef.current.setSpeed(next);
                  alert(`Speed: ${next} hr/sec`);
                }
              }}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: "#8e44ad",
                color: "#fff",
                fontSize: 13,
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              ⏩ Speed
            </button>
            <div
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                fontSize: 14,
                fontWeight: "bold",
                fontFamily: "monospace",
              }}
            >
              {timeControllerRef.current?.formatTime() || "10:00"}
            </div>
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
