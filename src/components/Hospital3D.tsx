import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { 
  createHospitalBuilding, createHospitalBed, createTree, createBench, 
  createAmbulance, createDoctor, createGarden, createPatient, 
  createHospitalSign, createFlower, createSirenLight, createNurse, 
  createWheelchair, createStreetLamp, createHelipad, createDriveway,
  createHelicopter
} from "./hospitalGeometry";

export default function Hospital3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isNight, setIsNight] = useState(false);
  const nightRef = useRef(isNight);
  nightRef.current = isNight; // Update ref for the animation loop

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 40, 100);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(30, 20, 45);
    camera.lookAt(0, 10, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // ពន្លឺព្រះអាទិត្យ / ព្រះច័ន្ទ
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(30, 50, 30);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -40;
    sunLight.shadow.camera.right = 40;
    sunLight.shadow.camera.top = 40;
    sunLight.shadow.camera.bottom = -40;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 1. សួនច្បារ និងផ្លូវថ្នល់
    scene.add(createGarden());
    const driveway = createDriveway(); driveway.position.set(0, 0, 5); scene.add(driveway);

    // 2. អគារមន្ទីរពេទ្យ
    const hospital = createHospitalBuilding();
    hospital.position.set(0, 0, -5);
    scene.add(hospital);

    // 3. Helipad, Sign និង Helicopter
    const helipad = createHelipad(); helipad.position.set(0, 30.2, -5); scene.add(helipad);
    const sign = createHospitalSign(THREE); sign.position.set(0, 32.5, -5); scene.add(sign);
    
    const helicopter = createHelicopter();
    helicopter.position.set(0, 30.8, -5);
    scene.add(helicopter);

    // 4. ដើមឈើ និងផ្កា
    const treePositions = [
      { x: -12, z: 5, big: true }, { x: -10, z: 10, big: false },
      { x: 12, z: 5, big: true }, { x: 10, z: 10, big: false },
      { x: -14, z: -2, big: true }, { x: 14, z: -2, big: true },
    ];
    treePositions.forEach(pos => {
      const tree = createTree(pos.big); tree.position.set(pos.x, 0, pos.z); scene.add(tree);
    });
    const flowerColors = [0xff69b4, 0xff0000, 0xffff00, 0xffa500, 0x800080];
    for (let i = 0; i < 20; i++) {
      const flower = createFlower(flowerColors[i % flowerColors.length]);
      const angle = (i / 20) * Math.PI * 2; const radius = 16 + Math.random() * 2;
      flower.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius); scene.add(flower);
    }

    // 5. កៅអី អំពូលភ្លើង រថយន្តសង្គ្រោះ
    const bench1 = createBench(); bench1.position.set(-6, 0, 12); bench1.rotation.y = Math.PI / 2; scene.add(bench1);
    const bench2 = createBench(); bench2.position.set(6, 0, 12); bench2.rotation.y = -Math.PI / 2; scene.add(bench2);
    
    const lamp1 = createStreetLamp(); lamp1.position.set(-8, 0, 6); scene.add(lamp1);
    const lamp2 = createStreetLamp(); lamp2.position.set(8, 0, 6); lamp2.rotation.y = Math.PI; scene.add(lamp2);

    const ambulance = createAmbulance(); ambulance.position.set(-8, 0, 18); scene.add(ambulance);
    const siren = createSirenLight(); siren.position.set(-8.6, 2.6, 20.5); scene.add(siren);

    // 6. គ្រែអ្នកជំងឺ គ្រូពេទ្យ និងគិលានុបដ្ឋាយិកា
    const bedPositions = [{ x: 12, z: -2 }, { x: 12, z: -6 }];
    bedPositions.forEach(pos => {
      const bed = createHospitalBed(); bed.position.set(pos.x, 0, pos.z); scene.add(bed);
      const patient = createPatient(); patient.position.set(pos.x, 0, pos.z); scene.add(patient);
    });
    const doc1 = createDoctor(false); doc1.position.set(-2, 0, 8); scene.add(doc1);
    const doc2 = createDoctor(true); doc2.position.set(2, 0, 8); scene.add(doc2);
    const nurse1 = createNurse(); nurse1.position.set(4, 0, 6); scene.add(nurse1);
    const wc = createWheelchair(); wc.position.set(-4, 0, 6); scene.add(wc);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 10, 0);
    controls.maxPolarAngle = Math.PI / 2.1;

    // ស្វែងរក Material បង្អួចអគារ ដើម្បីបើកភ្លឺពេលយប់
    const windowMat = hospital.userData.windowMaterial;
    const targetColorDay = new THREE.Color(0x87ceeb);
    const targetColorNight = new THREE.Color(0x0a1128);
    
    let animationId: number;
    const clock = new THREE.Clock();
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const isNightMode = nightRef.current;

      // 1. ភ្លើងសង្គ្រោះវិល
      if (siren.material instanceof THREE.MeshStandardMaterial) {
        const pulse = (Math.sin(elapsed * 8) + 1) / 2;
        siren.material.emissiveIntensity = 1 + pulse * 3;
        siren.scale.setScalar(1 + pulse * 0.2);
      }

      // 2. កង្ហារឧទ្ធម្ភាគចក្រវិល
      if (helicopter.userData.rotorGroup) {
        helicopter.userData.rotorGroup.rotation.y += 0.8; // ល្បឿនវិល
      }

      // 3. ការផ្លាស់ប្តូរពេលថ្ងៃ និងយប់ (Smooth Transition)
      const targetBg = isNightMode ? targetColorNight : targetColorDay;
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(targetBg, 0.05);
        if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(scene.background);
      }

      sunLight.intensity += ((isNightMode ? 0.1 : 2.5) - sunLight.intensity) * 0.05;
      ambientLight.intensity += ((isNightMode ? 0.2 : 0.5) - ambientLight.intensity) * 0.05;

      // បង្អួចអគារភ្លឺពេលយប់
      if (windowMat) {
        const targetEmissive = isNightMode ? 2.5 : 0.6;
        windowMat.emissiveIntensity += (targetEmissive - windowMat.emissiveIntensity) * 0.05;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (mountRef.current) mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      {/* ប៊ូតុងបើក/បិទភ្លើង (Day/Night) */}
      <button
        onClick={() => setIsNight(!isNight)}
        style={{
          position: "absolute", top: "20px", right: "20px",
          padding: "10px 20px", borderRadius: "8px", border: "none",
          backgroundColor: isNight ? "#f1c40f" : "#2c3e50",
          color: isNight ? "#000" : "#fff", cursor: "pointer",
          fontWeight: "bold", fontSize: "16px", zIndex: 10
        }}
      >
        {isNight ? "☀️ Day Mode" : "🌙 Night Mode"}
      </button>
    </div>
  );
}
