import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { 
  createHospitalBuilding, createHospitalBed, createTree, createBench, 
  createAmbulance, createDoctor, createGarden, createPatient, 
  createHospitalSign, createFlower, createSirenLight, createNurse, 
  createWheelchair, createStreetLamp, createHelipad, createDriveway,
  createHelicopter, createCar, createSurgeryRoom
} from "./hospitalGeometry";

export default function Hospital3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isNight, setIsNight] = useState(false);
  const nightRef = useRef(isNight);
  nightRef.current = isNight;

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

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(30, 50, 30);
    sunLight.castShadow = true;
    scene.add(sunLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 1. សួនច្បារ ផ្លូវថ្នល់ អគារ
    scene.add(createGarden());
    const driveway = createDriveway(); driveway.position.set(0, 0, 5); scene.add(driveway);
    const hospital = createHospitalBuilding(); hospital.position.set(0, 0, -5); scene.add(hospital);

    // 2. Helipad, Sign (B: Neon), Helicopter
    const helipad = createHelipad(); helipad.position.set(0, 30.2, -5); scene.add(helipad);
    const sign = createHospitalSign(THREE); sign.position.set(0, 32.5, -5); scene.add(sign);
    const helicopter = createHelicopter(); helicopter.position.set(0, 30.8, -5); scene.add(helicopter);

    // 3. ដើមឈើ និងផ្កា
    [{ x: -12, z: 5, big: true }, { x: -10, z: 10, big: false }, { x: 12, z: 5, big: true }, { x: 10, z: 10, big: false }].forEach(pos => {
      const tree = createTree(pos.big); tree.position.set(pos.x, 0, pos.z); scene.add(tree);
    });
    const flowerColors = [0xff69b4, 0xff0000, 0xffff00, 0xffa500];
    for (let i = 0; i < 20; i++) {
      const flower = createFlower(flowerColors[i % flowerColors.length]);
      const angle = (i / 20) * Math.PI * 2; const radius = 16 + Math.random() * 2;
      flower.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius); scene.add(flower);
    }

    // 4. កៅអី អំពូលភ្លើង រថយន្តសង្គ្រោះ
    const bench1 = createBench(); bench1.position.set(-6, 0, 12); bench1.rotation.y = Math.PI / 2; scene.add(bench1);
    const bench2 = createBench(); bench2.position.set(6, 0, 12); bench2.rotation.y = -Math.PI / 2; scene.add(bench2);
    
    const lamp1 = createStreetLamp(); lamp1.position.set(-8, 0, 6); scene.add(lamp1);
    const lamp2 = createStreetLamp(); lamp2.position.set(8, 0, 6); lamp2.rotation.y = Math.PI; scene.add(lamp2);

    const ambulance = createAmbulance(); ambulance.position.set(-8, 0, 18); scene.add(ambulance);
    const siren = createSirenLight(); siren.position.set(-8.6, 2.6, 20.5); scene.add(siren);

    // C: ចំណតរថយន្ត (Parking Lot)
    const car1 = createCar(0xff0000); car1.position.set(10, 0, 22); car1.rotation.y = Math.PI / 2; scene.add(car1);
    const car2 = createCar(0x0000ff); car2.position.set(13, 0, 22); car2.rotation.y = Math.PI / 2; scene.add(car2);
    const car3 = createCar(0x00ff00); car3.position.set(16, 0, 22); car3.rotation.y = Math.PI / 2; scene.add(car3);

    // D: បន្ទប់វះកាត់ (Surgery Room)
    const surgeryRoom = createSurgeryRoom(); 
    surgeryRoom.position.set(-15, 0, -5); // ដាក់នៅខាងឆ្វេងអគារ
    scene.add(surgeryRoom);

    // A: មនុស្ស និងចលនាដើរ
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

    const windowMat = hospital.userData.windowMaterial;
    const neonLight = sign.userData.neonLight;
    
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
      }
      // 2. កង្ហារឧទ្ធម្ភាគចក្រ
      if (helicopter.userData.rotorGroup) helicopter.userData.rotorGroup.rotation.y += 0.8;

      // 3. ចលនាដើរ (A)
      doc1.position.z = 8 + Math.sin(elapsed * 1.5) * 3;
      doc1.rotation.y = Math.cos(elapsed * 1.5) > 0 ? 0 : Math.PI;
      
      doc2.position.x = 2 + Math.cos(elapsed * 1.2) * 2;
      doc2.position.z = 6 + Math.sin(elapsed * 1.2) * 2;
      doc2.rotation.y = Math.atan2(Math.cos(elapsed * 1.2) * -2, Math.cos(elapsed * 1.2) * 2); // បង្វិលមុខតាមផ្លូវ

      nurse1.position.z = 6 + Math.sin(elapsed * 2 + 2) * 4;
      nurse1.rotation.y = Math.cos(elapsed * 2 + 2) > 0 ? 0 : Math.PI;

      wc.position.x = -4 + Math.sin(elapsed * 0.8) * 5;

      // 4. ពន្លឺ Day/Night (B: Neon Sign, D: Surgery Light)
      const targetBg = isNightMode ? new THREE.Color(0x0a1128) : new THREE.Color(0x87ceeb);
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(targetBg, 0.05);
        if (scene.fog instanceof THREE.Fog) scene.fog.color.copy(scene.background);
      }

      sunLight.intensity += ((isNightMode ? 0.1 : 2.5) - sunLight.intensity) * 0.05;
      ambientLight.intensity += ((isNightMode ? 0.2 : 0.5) - ambientLight.intensity) * 0.05;

      // B: Neon Light ភ្លឺពេលយប់
      if (neonLight) neonLight.intensity += ((isNightMode ? 3 : 0) - neonLight.intensity) * 0.05;

      // បង្អួច និងអំពូលភ្លើង
      if (windowMat) {
        windowMat.emissiveIntensity += ((isNightMode ? 2.5 : 0.6) - windowMat.emissiveIntensity) * 0.05;
      }
      [lamp1, lamp2].forEach(lamp => {
        lamp.traverse(child => {
          if (child instanceof THREE.PointLight) {
            child.intensity += ((isNightMode ? 2 : 0) - child.intensity) * 0.05;
          }
        });
      });

      // D: Surgery Room Light ភ្លឺជានិច្ច
      if (surgeryRoom.userData.surgeryLight) {
        surgeryRoom.userData.surgeryLight.intensity = 5 + Math.sin(elapsed * 10) * 0.5; // ភ្លឺរលោងបន្តិច
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
