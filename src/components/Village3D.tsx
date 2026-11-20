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
  createWindingRoad,
} from "./natureElements";

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
