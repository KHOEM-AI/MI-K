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
  createGarden 
} from "./hospitalGeometry";

export default function Hospital3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // ផ្ទៃមេឃពណ៌ខៀវភ្លឺ

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(25, 15, 35);
    camera.lookAt(0, 10, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true; // បើកស្រមោល
    mountRef.current.appendChild(renderer.domElement);

    // ពន្លឺព្រះអាទិត្យ (ពន្លឺពិតប្រាកដ)
    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.set(20, 40, 20);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // 1. បន្ថែមសួនច្បារ
    const garden = createGarden();
    scene.add(garden);

    // 2. បន្ថែមអគារ
    const hospital = createHospitalBuilding();
    hospital.position.set(0, 0, -5);
    scene.add(hospital);

    // 3. បន្ថែមដើមឈើ (ដើមធំ និងតូច)
    const treePositions = [
      { x: -10, z: 8, big: true },
      { x: -8, z: 12, big: false },
      { x: 10, z: 8, big: true },
      { x: 8, z: 12, big: false },
      { x: -12, z: 0, big: false },
      { x: 12, z: 0, big: false },
    ];
    treePositions.forEach(pos => {
      const tree = createTree(pos.big);
      tree.position.set(pos.x, 0, pos.z);
      scene.add(tree);
    });

    // 4. បន្ថែមកៅអីអង្គុយ
    const bench1 = createBench();
    bench1.position.set(-5, 0, 10);
    bench1.rotation.y = Math.PI / 2;
    scene.add(bench1);
    const bench2 = createBench();
    bench2.position.set(5, 0, 10);
    bench2.rotation.y = -Math.PI / 2;
    scene.add(bench2);

    // 5. បន្ថែមរថយន្តសង្គ្រោះ
    const ambulance = createAmbulance();
    ambulance.position.set(-10, 0, 14);
    ambulance.rotation.y = Math.PI / 2;
    scene.add(ambulance);

    // 6. បន្ថែមគ្រែអ្នកជំងឺ (២ គ្រែ)
    const bed1 = createHospitalBed();
    bed1.position.set(12, 0, 5);
    scene.add(bed1);
    const bed2 = createHospitalBed();
    bed2.position.set(12, 0, 1);
    scene.add(bed2);

    // 7. បន្ថែមគ្រូពេទ្យ
    const doc1 = createDoctor(false);
    doc1.position.set(-2, 0, 12);
    scene.add(doc1);
    const doc2 = createDoctor(true);
    doc2.position.set(2, 0, 12);
    scene.add(doc2);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 5, 0);
    controls.maxPolarAngle = Math.PI / 2; // កុំឱ្យឃើញក្រោមដី

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
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
