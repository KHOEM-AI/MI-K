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
      if (cancelled) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#1a1428");

      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 500);
      camera.position.set(42, 35, 42);
      camera.lookAt(0, 3, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 1.0));
      const dir = new THREE.DirectionalLight(0xffffff, 1.1);
      dir.position.set(20, 30, 20);
      dir.castShadow = true;
      dir.shadow.mapSize.set(2048, 2048);
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
