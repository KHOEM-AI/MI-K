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
  createSirenLight
} from "./hospitalGeometry";

export default function Hospital3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x87ceeb, 30, 80); // អ័ព្ទស្រាលៗ

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(25, 15, 35);
    camera.lookAt(0, 10, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // ស្រមោលទន់ភ្លន់
    mountRef.current.appendChild(renderer.domElement);

    // ពន្លឺព្រះអាទិត្យ
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // 1. សួនច្បារ
    const garden = createGarden();
    scene.add(garden);

    // 2. អគារមន្ទីរពេទ្យ
    const hospital = createHospitalBuilding();
    hospital.position.set(0, 0, -5);
    scene.add(hospital);

    // 3. ផ្លាកសញ្ញា HOSPITAL
    const sign = createHospitalSign(THREE);
    sign.position.set(0, 32.5, 0);
    scene.add(sign);

    // 4. ដើមឈើ
    const treePositions = [
      { x: -10, z: 8, big: true },
      { x: -8, z: 12, big: false },
      { x: 10, z: 8, big: true },
      { x: 8, z: 12, big: false },
      { x: -12, z: 0, big: false },
      { x: 12, z: 0, big: false },
      { x: -14, z: 4, big: true },
      { x: 14, z: 4, big: true },
    ];
    treePositions.forEach(pos => {
      const tree = createTree(pos.big);
      tree.position.set(pos.x, 0, pos.z);
      scene.add(tree);
    });

    // 5. ផ្កាចម្រុះពណ៌ (១៥ ដើម)
    const flowerColors = [0xff69b4, 0xff0000, 0xffff00, 0xffa500, 0x800080, 0xffffff];
    for (let i = 0; i < 15; i++) {
      const flower = createFlower(flowerColors[i % flowerColors.length]);
      const angle = (i / 15) * Math.PI * 2;
      const radius = 14 + Math.random() * 2;
      flower.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      scene.add(flower);
    }

    // 6. កៅអី
    const bench1 = createBench();
    bench1.position.set(-5, 0, 10);
    bench1.rotation.y = Math.PI / 2;
    scene.add(bench1);
    const bench2 = createBench();
    bench2.position.set(5, 0, 10);
    bench2.rotation.y = -Math.PI / 2;
    scene.add(bench2);

    // 7. រថយន្តសង្គ្រោះ
    const ambulance = createAmbulance();
    ambulance.position.set(-10, 0, 14);
    ambulance.rotation.y = Math.PI / 2;
    scene.add(ambulance);

    // 8. ភ្លើងសង្គ្រោះវិល (បន្ថែមលើរថយន្ត)
    const siren = createSirenLight();
    siren.position.set(-10 + 0.6, 2.6, 14 + 2.5); // ទីតាំងលើដំបូលរថយន្ត
    scene.add(siren);

    // 9. គ្រែអ្នកជំងឺ ៣ គ្រែ
    const bedPositions = [
      { x: 12, z: 5 },
      { x: 12, z: 1 },
      { x: 12, z: -3 },
    ];
    bedPositions.forEach(pos => {
      const bed = createHospitalBed();
      bed.position.set(pos.x, 0, pos.z);
      scene.add(bed);

      // អ្នកជំងឺដេកលើគ្រែ
      const patient = createPatient();
      patient.position.set(pos.x, 0, pos.z);
      scene.add(patient);
    });

    // 10. គ្រូពេទ្យ
    const doc1 = createDoctor(false);
    doc1.position.set(-2, 0, 12);
    scene.add(doc1);
    const doc2 = createDoctor(true);
    doc2.position.set(2, 0, 12);
    scene.add(doc2);

    // 11. ពន្លឺបន្ថែម (Point Light) សម្រាប់មន្ទីរពេទ្យ
    const hospitalLight = new THREE.PointLight(0xffffff, 1, 50);
    hospitalLight.position.set(0, 15, 10);
    scene.add(hospitalLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 8, 0);
    controls.maxPolarAngle = Math.PI / 2;

    // Animation Loop (ភ្លើងសង្គ្រោះវិល)
    let animationId: number;
    const clock = new THREE.Clock();
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // ភ្លើងសង្គ្រោះវិល (ប្តូរពណ៌ និងពន្លឺ)
      if (siren.material instanceof THREE.MeshStandardMaterial) {
        const pulse = (Math.sin(elapsed * 10) + 1) / 2;
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
