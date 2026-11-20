import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import {
  createVillageGround,
  createVillageRoads,
  createVillageHouses,
  createMeatVegFactory,
  createMarketStall,
  createPhoneShop,
  createClothingShop,
  createMotorbikeShop,
  createBikeShop,
  createRiceField,
  createVegetableGarden,
} from "./villageGeometry";

export default function Village3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

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

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.3);
    sun.position.set(100, 150, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -250;
    sun.shadow.camera.right = 250;
    sun.shadow.camera.top = 250;
    sun.shadow.camera.bottom = -250;
    sun.shadow.camera.far = 600;
    scene.add(sun);

    scene.add(createVillageGround());
    scene.add(createVillageRoads());

    // រោងចក្រ (ខាងជើង)
    const factory = createMeatVegFactory();
    factory.position.set(0, 0, -110);
    scene.add(factory);

    // ភូមិ ៣០០ គ្រួសារ (កណ្តាល)
    scene.add(createVillageHouses(300));

    // ផ្សារ ៤ (ជ្រុងភូមិ)
    const markets = [
      { f: createMarketStall("#e74c3c"), pos: [-70, 0, 60] },
      { f: createMarketStall("#f39c12"), pos: [70, 0, 60] },
      { f: createMarketStall("#27ae60"), pos: [-70, 0, -60] },
      { f: createMarketStall("#3498db"), pos: [70, 0, -60] },
    ];
    markets.forEach(({ f, pos }) => {
      f.position.set(pos[0], pos[1], pos[2]);
      scene.add(f);
    });

    // ហាងពាណិជ្ជកម្ម (តាមដងផ្លូវធំ)
    const shops = [
      { f: createPhoneShop(), pos: [-40, 0, 70] },
      { f: createClothingShop(), pos: [-15, 0, 70] },
      { f: createMotorbikeShop(), pos: [15, 0, 70] },
      { f: createBikeShop(), pos: [45, 0, 70] },
    ];
    shops.forEach(({ f, pos }) => {
      f.position.set(pos[0], pos[1], pos[2]);
      scene.add(f);
    });

    // កសិកម្ម — ស្រែ ៤ (ជ្រុងខាងក្រៅ)
    const riceFields = [
      [-140, 0, 120],
      [140, 0, 120],
      [-140, 0, -120],
      [140, 0, -120],
    ];
    riceFields.forEach(([x, y, z]) => {
      const field = createRiceField(30);
      field.position.set(x, y, z);
      scene.add(field);
    });

    // ចម្ការបន្លែ ៤ (ជិតរោងចក្រ)
    const gardens = [
      [-100, 0, -100],
      [-70, 0, -100],
      [70, 0, -100],
      [100, 0, -100],
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

    let rafId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      clock.getElapsedTime();
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
      alert("Export បរាជ័យ — សូមពិនិត្យ console");
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
          🏘️ កំពុងផ្ទុកភូមិកសិកម្ម និងឧស្សាហកម្ម...
        </div>
      )}
    </div>
  );
}
