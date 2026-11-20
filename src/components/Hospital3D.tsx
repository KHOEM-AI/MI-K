import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createHospitalBuilding, createDoctor } from "./hospitalGeometry";

export default function Hospital3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. រៀបចំ Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // ផ្ទៃមេឃពណ៌ខ្មៅងងឹត (សម្រាប់ទំនើប)

    // 2. រៀបចំ Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(20, 15, 30);

    // 3. រៀបចំ Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // 4. ពន្លឺ
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // 5. បន្ថែមអគារមន្ទីរពេទ្យ
    const hospital = createHospitalBuilding();
    scene.add(hospital);

    // 6. បន្ថែមគ្រូពេទ្យ (ឈរនៅមុខអគារ)
    const doc1 = createDoctor(false);
    doc1.position.set(-3, 0, 8);
    scene.add(doc1);

    const doc2 = createDoctor(true);
    doc2.position.set(3, 0, 8);
    scene.add(doc2);

    // 7. គ្រប់គ្រងការបង្វិល
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // 8. Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />;
}
