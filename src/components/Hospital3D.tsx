import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { 
  createHospitalBuilding, 
  createHospitalBed, 
  createTree, 
  createBench, 
  createAmbulance, 
  createDoctor, 
  createGarden,
  createPatient,
  createHospitalSign,
  createFlower,
  createSirenLight,
  createNurse,
  createWheelchair,
  createStreetLamp,
  createHelipad,
  createDriveway
} from "./hospitalGeometry";

export default function Hospital3D() {
  const mountRef = useRef<HTMLDivElement>(null);

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

    // ពន្លឺព្រះអាទិត្យ
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

    // 1. សួនច្បារ
    const garden = createGarden();
    scene.add(garden);

    // 2. ផ្លូវថ្នល់
    const driveway = createDriveway();
    driveway.position.set(0, 0, 5);
    scene.add(driveway);

    // 3. អគារមន្ទីរពេទ្យ
    const hospital = createHospitalBuilding();
    hospital.position.set(0, 0, -5);
    scene.add(hospital);

    // 4. ចំណតឧទ្ធម្ភាគចក្រ (នៅលើដំបូល)
    const helipad = createHelipad();
    helipad.position.set(0, 30.2, -5);
    scene.add(helipad);

    // 5. ផ្លាកសញ្ញា HOSPITAL
    const sign = createHospitalSign(THREE);
    sign.position.set(0, 32.5, -5);
    scene.add(sign);

    // 6. ដើមឈើ
    const treePositions = [
      { x: -12, z: 5, big: true }, { x: -10, z: 10, big: false },
      { x: 12, z: 5, big: true }, { x: 10, z: 10, big: false },
      { x: -14, z: -2, big: true }, { x: 14, z: -2, big: true },
      { x: -8, z: 15, big: false }, { x: 8, z: 15, big: false },
    ];
    treePositions.forEach(pos => {
      const tree = createTree(pos.big);
      tree.position.set(pos.x, 0, pos.z);
      scene.add(tree);
    });

    // 7. ផ្កាចម្រុះពណ៌
    const flowerColors = [0xff69b4, 0xff0000, 0xffff00, 0xffa500, 0x800080];
    for (let i = 0; i < 20; i++) {
      const flower = createFlower(flowerColors[i % flowerColors.length]);
      const angle = (i / 20) * Math.PI * 2;
      const radius = 16 + Math.random() * 2;
      flower.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      scene.add(flower);
    }

    // 8. កៅអី និងអំពូលភ្លើង
    const bench1 = createBench(); bench1.position.set(-6, 0, 12); bench1.rotation.y = Math.PI / 2; scene.add(bench1);
    const bench2 = createBench(); bench2.position.set(6, 0, 12); bench2.rotation.y = -Math.PI / 2; scene.add(bench2);
    
    const lamp1 = createStreetLamp(); lamp1.position.set(-8, 0, 6); scene.add(lamp1);
    const lamp2 = createStreetLamp(); lamp2.position.set(8, 0, 6); lamp2.rotation.y = Math.PI; scene.add(lamp2);

    // 9. រថយន្តសង្គ្រោះ
    const ambulance = createAmbulance();
    ambulance.position.set(-8, 0, 18);
    ambulance.rotation.y = 0; // បត់មុខចូល
    scene.add(ambulance);

    const siren = createSirenLight();
    siren.position.set(-8 - 0.6, 2.6, 18 + 2.5);
    scene.add(siren);

    // 10. គ្រែអ្នកជំងឺ និងអ្នកជំងឺ
    const bedPositions = [{ x: 12, z: -2 }, { x: 12, z: -6 }];
    bedPositions.forEach(pos => {
      const bed = createHospitalBed(); bed.position.set(pos.x, 0, pos.z); scene.add(bed);
      const patient = createPatient(); patient.position.set(pos.x, 0, pos.z); scene.add(patient);
    });

    // 11. គ្រូពេទ្យ និងគិលានុបដ្ឋាយិកា
    const doc1 = createDoctor(false); doc1.position.set(-2, 0, 8); scene.add(doc1);
    const doc2 = createDoctor(true); doc2.position.set(2, 0, 8); scene.add(doc2);
    const nurse1 = createNurse(); nurse1.position.set(4, 0, 6); scene.add(nurse1);

    // 12. រទេះរុញ
    const wc = createWheelchair(); wc.position.set(-4, 0, 6); scene.add(wc);

    // Point Light សម្រាប់ផ្នែកខាងមុខមន្ទីរពេទ្យ
    const hospitalLight = new THREE.PointLight(0xffffff, 1, 30);
    hospitalLight.position.set(0, 8, 5);
    scene.add(hospitalLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 8, 0);
    controls.maxPolarAngle = Math.PI / 2.1;

    let animationId: number;
    const clock = new THREE.Clock();
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // ភ្លើងសង្គ្រោះវិល
      if (siren.material instanceof THREE.MeshStandardMaterial) {
        const pulse = (Math.sin(elapsed * 8) + 1) / 2;
        siren.material.emissiveIntensity = 1 + pulse * 3;
        siren.scale.setScalar(1 + pulse * 0.2);
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
}
