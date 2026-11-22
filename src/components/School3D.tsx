import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { createSchoolBuilding, createFlagPole, createStudent, createTeacher } from "./schoolGeometry";
import { createSchoolSurroundings } from "./villageGeometry";
import { createTrafficSystem, updateTraffic, type TrafficVehicle } from "./trafficSystem";
import { createTree, createFlower, createBench } from "./hospitalGeometry";

export default function School3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isNight, setIsNight] = useState(false);
  const nightRef = useRef(isNight);
  nightRef.current = isNight;
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(25, 18, 30); camera.lookAt(0, 6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(30, 50, 30); sun.castShadow = true; scene.add(sun);
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    // ស្មៅ
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x3a7d44 });
    const grass = new THREE.Mesh(new THREE.BoxGeometry(40, 0.2, 30), grassMat); scene.add(grass);
    // ទីលានកីឡា
    const field = new THREE.Mesh(new THREE.BoxGeometry(15, 0.22, 8), new THREE.MeshStandardMaterial({ color: 0x8b4513 }));
    field.position.set(0, 0.01, 10); scene.add(field);

    const school = createSchoolBuilding(); school.position.set(0, 0, -8); scene.add(school);
    // បរិវេណជុំវិញ (ផ្សារ ៤ + ផ្ទះ ១០)
    scene.add(createSchoolSurroundings());

    // ចរាចរណ៍ (ម៉ូតូ ៣ + ឡាន ២)
    const traffic = createTrafficSystem();
    traffic.group.scale.setScalar(0.25);
    scene.add(traffic.group);
    (scene as any).userData.traffic = traffic.vehicles;
    const flag = createFlagPole(); flag.position.set(-10, 0, 5); scene.add(flag);

    // ដើមឈើ
    [{x:-15,z:5},{x:15,z:5},{x:-12,z:12},{x:12,z:12}].forEach(p => {
      const t = createTree(true); t.position.set(p.x, 0, p.z); scene.add(t);
    });
    // ផ្កា
    for (let i = 0; i < 15; i++) {
      const f = createFlower([0xff69b4, 0xff0000, 0xffff00][i % 3]);
      f.position.set((Math.random() - 0.5) * 25, 0, Math.random() * 15 + 5);
      scene.add(f);
    }
    // កៅអី
    const b1 = createBench(); b1.position.set(-8, 0, 8); b1.rotation.y = Math.PI/2; scene.add(b1);
    const b2 = createBench(); b2.position.set(8, 0, 8); b2.rotation.y = -Math.PI/2; scene.add(b2);

    // សិស្ស ៦ នាក់ និងគ្រូ
    const students: THREE.Group[] = [];
    const colors = [0x3b82f6, 0xef4444, 0x22c55e, 0xf59e0b, 0xa855f7, 0x06b6d4];
    for (let i = 0; i < 6; i++) {
      const s = createStudent(colors[i]);
      s.position.set(-5 + (i % 3) * 2, 0, 10 + Math.floor(i / 3) * 2);
      scene.add(s); students.push(s);
    }
    const teacher = createTeacher(); teacher.position.set(0, 0, 14); scene.add(teacher);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; controls.target.set(0, 6, 0); controls.maxPolarAngle = Math.PI / 2.1;

    const windowMat = school.userData.windowMaterial;
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const night = nightRef.current;

      // សិស្សលោតលេង
      students.forEach((s, i) => {
        s.position.y = Math.abs(Math.sin(t * 2 + i)) * 0.5;
        s.rotation.y = Math.sin(t + i) * 0.3;
      });
      teacher.rotation.y = Math.sin(t * 0.5) * 0.5;

      // Day/Night
      const targetBg = night ? new THREE.Color(0x0a1128) : new THREE.Color(0x87ceeb);
      if (scene.background instanceof THREE.Color) scene.background.lerp(targetBg, 0.05);
      sun.intensity += ((night ? 0.1 : 2.5) - sun.intensity) * 0.05;
      if (windowMat) windowMat.emissiveIntensity += ((night ? 2.5 : 0.6) - windowMat.emissiveIntensity) * 0.05;

      const tv = (scene as any).userData.traffic as TrafficVehicle[] | undefined;
      if (tv && tv.length > 0) {
        updateTraffic(tv, clock.getElapsedTime());
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  const takeScreenshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const dataURL = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `school-${Date.now()}.png`;
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
      link.download = `school-${Date.now()}.glb`;
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
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", gap: 8 }}>
        <button
          onClick={takeScreenshot}
          style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "#16a085", color: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
        >
          📸 Screenshot
        </button>
        <button
          onClick={exportGLB}
          disabled={busy}
          style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: busy ? "#7f8c8d" : "#8e44ad", color: "#fff", cursor: busy ? "wait" : "pointer", fontWeight: "bold", fontSize: "14px" }}
        >
          {busy ? "⏳ កំពុង Export..." : "🎬 Export GLB"}
        </button>
      </div>
      <button
        onClick={() => setIsNight(!isNight)}
        style={{ position: "absolute", top: "20px", right: "20px", padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: isNight ? "#f1c40f" : "#2c3e50", color: isNight ? "#000" : "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}
      >
        {isNight ? "☀️ Day Mode" : "🌙 Night Mode"}
      </button>
    </div>
  );
}
