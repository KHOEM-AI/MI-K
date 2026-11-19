import { useEffect, useRef, useState } from "react";
import { createKaraokeGeometry } from "./studioGeometry";

type KaraokeTier =
  | "karaoke_full"
  | "karaoke_premium"
  | "karaoke_vip"
  | "karaoke_standard";

export default function KaraokeViewer({ onClose }: { onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [tier, setTier] = useState<KaraokeTier>("karaoke_full");

  useEffect(() => {
    let cancelled = false;
    const mount = mountRef.current;
    if (!mount) return;

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import(
        "three/examples/jsm/controls/OrbitControls.js"
      );
      const { RoomEnvironment } = await import(
        "three/examples/jsm/environments/RoomEnvironment.js"
      );
      if (cancelled) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#1a1428");

      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
      camera.position.set(42, 35, 42);
      camera.lookAt(0, 3, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      mount.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 3, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.maxPolarAngle = Math.PI / 2.05;
      controls.minDistance = 8;
      controls.maxDistance = 150;

      (window as any).__karaokeCamera = camera;
      (window as any).__karaokeControls = controls;

      // Environment map for real mirror reflections (A)
      const pmremGen = new THREE.PMREMGenerator(renderer);
      const envRT = pmremGen.fromScene(new RoomEnvironment(), 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 0.6;

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const dir = new THREE.DirectionalLight(0xffffff, 1.1);
      dir.position.set(20, 30, 20);
      dir.castShadow = true;
      dir.shadow.mapSize.set(1024, 1024);
      dir.shadow.camera.near = 1;
      dir.shadow.camera.far = 120;
      dir.shadow.camera.left = -35;
      dir.shadow.camera.right = 35;
      dir.shadow.camera.top = 35;
      dir.shadow.camera.bottom = -35;
      scene.add(dir);

      const pink = new THREE.PointLight(0xff1493, 4, 80);
      pink.position.set(-14, 8, 10);
      scene.add(pink);
      const cyan = new THREE.PointLight(0x00e5ff, 4, 80);
      cyan.position.set(14, 8, -10);
      scene.add(cyan);
      const gold = new THREE.PointLight(0xffd700, 3, 60);
      gold.position.set(0, 6, 5);
      scene.add(gold);
      const overhead = new THREE.PointLight(0xffffff, 1.5, 100);
      overhead.position.set(0, 15, 0);
      scene.add(overhead);
      const fillFront = new THREE.PointLight(0xffddaa, 1.0, 80);
      fillFront.position.set(0, 5, 15);
      scene.add(fillFront);

      // Karaoke building
      const karaoke = createKaraokeGeometry(
        THREE,
        tier,
        "#d4af37",
        0.7,
        0.35
      );
      scene.add(karaoke);

      // Ground grid
      const grid = new THREE.GridHelper(90, 45, 0x2a2050, 0x1a1030);
      grid.position.y = -0.02;
      scene.add(grid);

      // ---------- SMOKE/FOG PARTICLES (D) ----------
      const smokeCount = 50;
      const smokeGeo = new THREE.BufferGeometry();
      const smokePositions = new Float32Array(smokeCount * 3);
      const smokeVelocities = new Float32Array(smokeCount * 3);
      const smokePhases = new Float32Array(smokeCount);
      for (let i = 0; i < smokeCount; i++) {
        smokePositions[i * 3] = -4 + Math.random() * 8;
        smokePositions[i * 3 + 1] = 0.5 + Math.random() * 2.5;
        smokePositions[i * 3 + 2] = 7 + Math.random() * 4;
        smokeVelocities[i * 3] = (Math.random() - 0.5) * 0.3;
        smokeVelocities[i * 3 + 1] = 0.15 + Math.random() * 0.2;
        smokeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        smokePhases[i] = Math.random() * Math.PI * 2;
      }
      smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
      const smokeMat = new THREE.PointsMaterial({
        color: 0xc0c8e0,
        size: 0.5,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
      });
      const smokeParticles = new THREE.Points(smokeGeo, smokeMat);
      scene.add(smokeParticles);

      // ---------- HEAVY SMOKE MACHINE (from stage edge) ----------
      const smokeMachineCount = 80;
      const smokeMachineGeo = new THREE.BufferGeometry();
      const smokeMachinePositions = new Float32Array(smokeMachineCount * 3);
      const smokeMachineVelocities = new Float32Array(smokeMachineCount * 3);
      const smokeMachineSizes = new Float32Array(smokeMachineCount);
      for (let i = 0; i < smokeMachineCount; i++) {
        smokeMachinePositions[i * 3] = -3 + Math.random() * 6;
        smokeMachinePositions[i * 3 + 1] = 0.2 + Math.random() * 0.3;
        smokeMachinePositions[i * 3 + 2] = 10.5 + Math.random() * 0.5;
        smokeMachineVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
        smokeMachineVelocities[i * 3 + 1] = 0.3 + Math.random() * 0.4;
        smokeMachineVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3 - 0.2;
        smokeMachineSizes[i] = 1 + Math.random() * 1.5;
      }
      smokeMachineGeo.setAttribute("position", new THREE.BufferAttribute(smokeMachinePositions, 3));
      smokeMachineGeo.setAttribute("size", new THREE.BufferAttribute(smokeMachineSizes, 1));
      const smokeMachineMat = new THREE.PointsMaterial({
        color: 0xd8dde8,
        size: 1.2,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
      });
      const smokeMachine = new THREE.Points(smokeMachineGeo, smokeMachineMat);
      scene.add(smokeMachine);

      // Smoke machine hardware (visible box on stage)
      const machineBox = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.6, 0.8),
        new THREE.MeshStandardMaterial({ color: "#0a0a0a", metalness: 0.8, roughness: 0.3 })
      );
      machineBox.position.set(-5.5, 0.3, 9.2);
      scene.add(machineBox);
      const machineLed = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 8, 6),
        new THREE.MeshStandardMaterial({
          color: "#ff1493", emissive: "#ff1493", emissiveIntensity: 3.0,
        })
      );
      machineLed.position.set(-5.5, 0.45, 9.62);
      scene.add(machineLed);

      // ---------- CONFETTI PARTICLES (E) ----------
      const confettiCount = 100;
      const confettiGeo = new THREE.BufferGeometry();
      const confettiPositions = new Float32Array(confettiCount * 3);
      const confettiVelocities = new Float32Array(confettiCount * 3);
      const confettiColors = new Float32Array(confettiCount * 3);
      const confettiPhase = new Float32Array(confettiCount);
      const palette = [
        [1.0, 0.08, 0.58],
        [0.0, 0.90, 1.0],
        [1.0, 0.85, 0.0],
        [0.48, 0.23, 0.93],
        [0.0, 1.0, 0.53],
      ];
      for (let i = 0; i < confettiCount; i++) {
        confettiPositions[i * 3] = -18 + Math.random() * 36;
        confettiPositions[i * 3 + 1] = 2 + Math.random() * 12;
        confettiPositions[i * 3 + 2] = -18 + Math.random() * 36;
        confettiVelocities[i * 3] = (Math.random() - 0.5) * 0.4;
        confettiVelocities[i * 3 + 1] = -0.08 - Math.random() * 0.15;
        confettiVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
        const c = palette[i % palette.length];
        confettiColors[i * 3] = c[0];
        confettiColors[i * 3 + 1] = c[1];
        confettiColors[i * 3 + 2] = c[2];
        confettiPhase[i] = Math.random() * Math.PI * 2;
      }
      confettiGeo.setAttribute("position", new THREE.BufferAttribute(confettiPositions, 3));
      confettiGeo.setAttribute("color", new THREE.BufferAttribute(confettiColors, 3));
      const confettiMat = new THREE.PointsMaterial({
        size: 0.18,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        sizeAttenuation: true,
      });
      const confettiParticles = new THREE.Points(confettiGeo, confettiMat);
      scene.add(confettiParticles);

      // Animation loop
      let raf = 0;
      const clock = new THREE.Clock();

      const animate = () => {
        if (cancelled) return;
        const t = clock.getElapsedTime();

        pink.intensity = 2.5 + Math.sin(t * 1.5) * 0.8;
        cyan.intensity = 2.5 + Math.sin(t * 1.5 + 2) * 0.8;
        gold.intensity = 1.8 + Math.sin(t * 2.0 + 1) * 0.5;

        karaoke.traverse((obj: any) => {
          if (obj.name === "discoBall") {
            obj.rotation.y += 0.02;
            obj.rotation.x = Math.sin(t * 0.5) * 0.2;
          }
          if (obj.name === "danceTile") {
            const delay = obj.userData.tileDelay || 0;
            const intensity = 0.5 + Math.sin(t * 3 + delay) * 1.5;
            if (obj.material) {
              obj.material.emissiveIntensity = Math.max(0.2, intensity);
            }
          }
          if (obj.name === "roomLight") {
            const tierName = obj.userData.roomTier;
            const speed =
              tierName === "premium" ? 1.5 : tierName === "vip" ? 2.0 : 1.0;
            obj.intensity = 1.2 + Math.sin(t * speed) * 0.4;
          }
          if (obj.name === "dancer") {
            const delay = obj.userData.danceDelay || 0;
            const baseY = obj.userData.danceBaseY || 0.18;
            const baseRot = obj.userData.danceBaseRot || 0;
            obj.position.y = baseY + Math.abs(Math.sin(t * 2.5 + delay)) * 0.15;
            obj.rotation.y = baseRot + Math.sin(t * 1.5 + delay) * 0.4;
            obj.rotation.z = Math.cos(t * 2.0 + delay) * 0.1;
          }
        });

        // Update smoke particles (rise up + reset)
        {
          const pos = smokeGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < smokeCount; i++) {
            pos[i * 3] += smokeVelocities[i * 3] * 0.016 + Math.sin(t + smokePhases[i]) * 0.002;
            pos[i * 3 + 1] += smokeVelocities[i * 3 + 1] * 0.016;
            pos[i * 3 + 2] += smokeVelocities[i * 3 + 2] * 0.016;
            if (pos[i * 3 + 1] > 4.5) {
              pos[i * 3] = -4 + Math.random() * 8;
              pos[i * 3 + 1] = 0.5;
              pos[i * 3 + 2] = 7 + Math.random() * 4;
            }
          }
          smokeGeo.attributes.position.needsUpdate = true;
        }

        // Update confetti particles (fall down + reset)
        {
          const pos = confettiGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < confettiCount; i++) {
            pos[i * 3] += confettiVelocities[i * 3] * 0.016 + Math.sin(t * 2 + confettiPhase[i]) * 0.01;
            pos[i * 3 + 1] += confettiVelocities[i * 3 + 1] * 0.016;
            pos[i * 3 + 2] += confettiVelocities[i * 3 + 2] * 0.016;
            if (pos[i * 3 + 1] < 0.2) {
              pos[i * 3] = -18 + Math.random() * 36;
              pos[i * 3 + 1] = 13 + Math.random() * 2;
              pos[i * 3 + 2] = -18 + Math.random() * 36;
            }
          }
          confettiGeo.attributes.position.needsUpdate = true;
        }

        // Tier neon signs pulse
        karaoke.traverse((obj: any) => {
          if (obj.name === "tierNeonSign") {
            const base = obj.userData.neonColor;
            if (obj.material) {
              obj.material.emissiveIntensity = 1.5 + Math.sin(t * 2.5) * 1.0;
            }
          }
        });

        // Water wall drops flow down
        karaoke.traverse((obj: any) => {
          if (obj.name === "waterDrop") {
            const offset = obj.userData.waterOffset || 0;
            obj.position.y = 2.0 + Math.sin(t * 3 + offset) * 0.5;
          }
          if (obj.name === "chandelierCrystal") {
            const delay = obj.userData.crystalDelay || 0;
            obj.rotation.y = t * 0.5 + delay;
            obj.rotation.x = Math.sin(t * 0.7 + delay) * 0.3;
            if (obj.material) {
              obj.material.emissiveIntensity = 0.4 + Math.sin(t * 2 + delay) * 0.3;
            }
          }
        });

        // Laser beams rotate + pulse
        karaoke.traverse((obj: any) => {
          if (obj.name === "laserBeam") {
            const baseAng = obj.userData.laserAngle || 0;
            obj.rotation.z = Math.cos(baseAng) * 0.6 + Math.sin(t * 1.2) * 0.4;
            obj.rotation.y = -baseAng + Math.cos(t * 0.8) * 0.5;
            if (obj.material) {
              obj.material.emissiveIntensity = 1.8 + Math.sin(t * 3 + baseAng) * 1.2;
            }
          }
          if (obj.name === "photoFlash") {
            if (obj.material) {
              const flashPhase = Math.sin(t * 1.5);
              obj.material.emissiveIntensity = flashPhase > 0.9 ? 5.0 : 0.5;
            }
          }
          if (obj.name === "stringLight") {
            const delay = obj.userData.stringDelay || 0;
            if (obj.material) {
              obj.material.emissiveIntensity = 1.8 + Math.sin(t * 2 + delay) * 0.8;
            }
          }
          if (obj.name === "vipNeon") {
            if (obj.material) {
              obj.material.emissiveIntensity = 2.0 + Math.sin(t * 2.8) * 1.0;
            }
          }
          if (obj.name === "ceilingStars" && obj.material) {
            obj.material.opacity = 0.6 + Math.sin(t * 1.5) * 0.3;
          }
        });

        // Fountain jets pulse
        karaoke.traverse((obj: any) => {
          if (obj.name === "fountainJet") {
            const ang = obj.userData.jetAngle || 0;
            obj.position.y = 1.6 + Math.sin(t * 3 + ang) * 0.15;
            obj.scale.y = 1.0 + Math.sin(t * 2.5 + ang) * 0.2;
          }
          if (obj.name === "centerJet") {
            obj.position.y = 2.8 + Math.sin(t * 2) * 0.2;
            obj.scale.y = 1.0 + Math.sin(t * 3) * 0.25;
          }
          if (obj.name === "elevatorCar") {
            const baseY = obj.userData.elevatorBaseY || 1.0;
            const cycle = (Math.sin(t * 0.3) + 1) / 2;
            obj.position.y = baseY + cycle * 3.2;
          }
          if (obj.name === "turntable") {
            obj.rotation.y = t * 4;
          }
          if (obj.name === "realMirrorBall") {
            obj.rotation.y = t * 0.6;
          }
          if (obj.name === "outdoorLetter") {
            const delay = obj.userData.letterDelay || 0;
            if (obj.material) {
              obj.material.emissiveIntensity = 2.0 + Math.sin(t * 2 + delay) * 1.2;
            }
          }
          if (obj.name === "marqueeBulb") {
            const idx = obj.userData.bulbIndex || 0;
            const phase = Math.sin(t * 4 - idx * 0.4);
            if (obj.material) {
              obj.material.emissiveIntensity = phase > 0.3 ? 3.0 : 0.8;
            }
          }
        });

        // Animate heavy smoke machine
        {
          const pos = smokeMachineGeo.attributes.position.array as Float32Array;
          for (let i = 0; i < smokeMachineCount; i++) {
            pos[i * 3] += smokeMachineVelocities[i * 3] * 0.02;
            pos[i * 3 + 1] += smokeMachineVelocities[i * 3 + 1] * 0.02;
            pos[i * 3 + 2] += smokeMachineVelocities[i * 3 + 2] * 0.02;
            if (pos[i * 3 + 1] > 5.5) {
              pos[i * 3] = -3 + Math.random() * 6;
              pos[i * 3 + 1] = 0.2;
              pos[i * 3 + 2] = 10.5 + Math.random() * 0.5;
            }
          }
          smokeMachineGeo.attributes.position.needsUpdate = true;
        }

        // Fade machine LED (flicker)
        if (machineLed.material) {
          machineLed.material.emissiveIntensity = 2.0 + Math.sin(t * 8) * 1.5;
        }

        // Fireplace flicker animation
        karaoke.traverse((obj: any) => {
          if (obj.name === "fireGlow") {
            if (obj.material) {
              const flicker = 2.5 + Math.sin(t * 15) * 0.6 + Math.sin(t * 23) * 0.4;
              obj.material.emissiveIntensity = flicker;
            }
          }
          if (obj.name === "fireLight") {
            const baseFlicker = 2.0 + Math.sin(t * 12) * 0.5 + Math.sin(t * 19) * 0.3;
            obj.intensity = baseFlicker;
          }
        });

        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(animate);
      };
      animate();

      const resize = () => {
        if (!mount) return;
        const w = mount.clientWidth;
        const h = mount.clientHeight;
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", resize);
      resize();

      (mount as any).__karaokeCleanup = () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(raf);
        smokeGeo.dispose();
        smokeMat.dispose();
        confettiGeo.dispose();
        smokeMachineGeo.dispose();
        smokeMachineMat.dispose();
        confettiMat.dispose();
        controls.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
      };
    })();

    return () => {
      cancelled = true;
      const cleanup = (mount as any).__karaokeCleanup;
      if (cleanup) cleanup();
    };
  }, [tier]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "#0a0812",
      }}
    >
      <button
        onClick={() => {
          const cam = (window as any).__karaokeCamera;
          const ctrl = (window as any).__karaokeControls;
          if (cam && ctrl) {
            cam.position.set(42, 35, 42);
            ctrl.target.set(0, 3, 0);
            ctrl.update();
          }
        }}
        style={{
          position: "absolute",
          top: 16,
          right: 320,
          zIndex: 10,
          padding: "8px 14px",
          background: "rgba(255,255,255,0.14)",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        🔍 Fit View
      </button>

      <div
        style={{
          position: "absolute",
          top: 16,
          right: 120,
          zIndex: 10,
          display: "flex",
          gap: 6,
        }}
      >
        {(
          [
            ["karaoke_full", "🎤 Full"],
            ["karaoke_premium", "⭐ Premium"],
            ["karaoke_vip", "💎 VIP"],
            ["karaoke_standard", "🎵 Standard"],
          ] as [KaraokeTier, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTier(value)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              color: "#fff",
              background:
                tier === value ? "#4f7cff" : "rgba(255,255,255,0.14)",
              transition: "background 0.2s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 10,
          padding: "10px 18px",
          background: "#ff1493",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 700,
          boxShadow: "0 4px 16px rgba(255,20,147,0.5)",
        }}
      >
        ✕ Close
      </button>

      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          color: "#d4af37",
          fontSize: 20,
          fontWeight: 800,
          textShadow: "0 0 12px rgba(212,175,55,0.6)",
        }}
      >
        🎤 KHOEM-AI Karaoke / Pub
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 10,
          color: "#888",
          fontSize: 12,
        }}
      >
        Drag to rotate · Scroll/Pinch to zoom · Right-drag to pan
      </div>

      <div ref={mountRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
