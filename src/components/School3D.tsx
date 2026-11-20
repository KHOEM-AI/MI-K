import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createSchoolBuilding, createFlagPole, createStudent, createTeacher } from "./schoolGeometry";
import { createTree, createFlower, createBench } from "./hospitalGeometry";

export default function School3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isNight, setIsNight] = useState(false);
  const nightRef = useRef(isNight);
  nightRef.current = isNight;

  useEffect(() => {
    if (!mountRef.current) return;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(25, 18, 30); camera.lookAt(0, 6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
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

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
      <button
        onClick={() => setIsNight(!isNight)}
        style={{ position: "absolute", top: "20px", right: "20px", padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: isNight ? "#f1c40f" : "#2c3e50", color: isNight ? "#000" : "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "16px" }}
      >
        {isNight ? "☀️ Day Mode" : "🌙 Night Mode"}
      </button>
    </div>
  );
}
