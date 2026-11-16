import { useEffect, useRef } from "react";

export function UI3DPreview() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let renderer: import("three").WebGLRenderer | undefined;
    let frame = 0;
    let cleanup = false;
    let scene: import("three").Scene | undefined;
    let camera: import("three").PerspectiveCamera | undefined;
    let mesh: import("three").Mesh | undefined;

    async function start() {
      const THREE = await import("three");
      if (cleanup || !hostRef.current) return;

      scene = new THREE.Scene();
      scene.background = new THREE.Color("#080f1b");

      camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(0, 0, 6);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      hostRef.current.appendChild(renderer.domElement);

      const ambient = new THREE.AmbientLight(0xffffff, 1.5);
      scene.add(ambient);
      const dir = new THREE.DirectionalLight(0xffffff, 3);
      dir.position.set(2, 3, 4);
      scene.add(dir);

      // Create a canvas texture for the 3D Card
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#111e31";
        ctx.fillRect(0, 0, 512, 256);
        ctx.strokeStyle = "#168de2";
        ctx.lineWidth = 12;
        ctx.strokeRect(6, 6, 500, 244);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 56px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("KHOEM-AI", 256, 110);

        ctx.fillStyle = "#168de2";
        ctx.font = "24px sans-serif";
        ctx.fillText("3D CARD COMPONENT", 256, 160);

        ctx.fillStyle = "#168de2";
        ctx.fillRect(156, 190, 200, 40);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px sans-serif";
        ctx.fillText("ACTION BUTTON", 256, 217);
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      const geo = new THREE.BoxGeometry(4, 2, 0.2);
      const sideMat = new THREE.MeshStandardMaterial({ color: "#0c1626", metalness: 0.5, roughness: 0.5 });
      const frontMat = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.2, roughness: 0.4 });

      const materials = [sideMat, sideMat, sideMat, sideMat, frontMat, sideMat];
      mesh = new THREE.Mesh(geo, materials);
      scene.add(mesh);

      const resize = () => {
        if (!renderer || !camera || !hostRef.current) return;
        const width = hostRef.current.clientWidth;
        const height = hostRef.current.clientHeight;
        if (!width || !height) return;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const observer = new ResizeObserver(resize);
      observer.observe(hostRef.current);
      resize();

      let t = 0;
      const animate = () => {
        if (cleanup || !renderer || !scene || !camera || !mesh) return;
        t += 0.01;
        mesh.rotation.y = Math.sin(t) * 0.5;
        mesh.rotation.x = Math.sin(t * 0.5) * 0.2;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      animate();

      return () => {
        observer.disconnect();
      };
    }

    const cleanupPromise = start();

    return () => {
      cleanup = true;
      cancelAnimationFrame(frame);
      cleanupPromise.then((cleanupFn) => cleanupFn?.());
      renderer?.dispose();
      renderer?.domElement.remove();
      if (mesh) {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      }
    };
  }, []);

  return (
    <div className="ui-design-preview" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p className="eyebrow">3D INTERFACE PREVIEW</p>
      <div
        ref={hostRef}
        style={{
          width: "100%",
          height: "300px",
          borderRadius: "12px",
          overflow: "hidden",
          backgroundColor: "#080f1b",
          position: "relative"
        }}
      />
      <p className="studio-note">
        នេះជាគំរូ UI បែប 3D ដែលអាចបង្វិលបាន។ (Auto-rotating 3D Card)
      </p>
    </div>
  );
}
