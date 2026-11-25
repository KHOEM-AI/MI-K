import { useEffect, useRef, useState } from "react";
import type { AnimationAction, AnimationMixer, Group, Mesh, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { isGlb } from "./modelTools.mjs";
import { TabIcon } from "./icons";
import ExportPanel from "./ExportPanel";
import type { ExportContext } from "./modelExporter";
import { CATEGORIES, CATEGORY_META, MODELS, modelsByCategory, glbPath, type ModelCategory, type ModelEntry } from "./modelCatalog";

type Three = typeof import("three");

interface StudioApi {
  load: (entry: ModelEntry) => Promise<{ real: boolean; clips: string[] } | null>;
  togglePlay: (clip: string) => boolean;
  reset: () => void;
  getExportContext: () => ExportContext;
}

const box: React.CSSProperties = {
  background: "color-mix(in srgb, currentColor 8%, transparent)",
  borderRadius: 10, padding: 10, marginTop: 10,
};
const cls = (on: boolean): string => (on ? "filter active" : "filter");
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function ModelStudio() {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<StudioApi | null>(null);
  const autoRef = useRef(true);
  const speedRef = useRef(0.6);
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState<ModelCategory>("animal");
  const [id, setId] = useState<string>(modelsByCategory("animal")[0]?.id || "");
  const [real, setReal] = useState(false);
  const [clips, setClips] = useState<string[]>([]);
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [auto, setAuto] = useState(true);
  const [speed, setSpeed] = useState(0.6);
  const [err, setErr] = useState("");

  const list = modelsByCategory(category);
  const entry = MODELS.find((m) => m.id === id) || list[0];

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let renderer: WebGLRenderer | undefined;
    let observer: ResizeObserver | undefined;
    let dispose = () => {};

    async function start() {
      try {
        const T = await import("three");
        const { OrbitControls: Orbit } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const host = hostRef.current;
        if (disposed || !host) return;

        const gl = new T.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
        renderer = gl;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        host.appendChild(gl.domElement);
        Object.assign(gl.domElement.style, { width: "100%", height: "100%", display: "block", touchAction: "none" });

        const scene: Scene = new T.Scene();
        scene.background = new T.Color(0x141b2b);
        scene.add(new T.HemisphereLight(0xfff6e8, 0x5a6478, 2.3));
        const key = new T.DirectionalLight(0xfff1dd, 2.8);
        key.position.set(3, 5, 4);
        const rim = new T.DirectionalLight(0x39cfff, 1.2);
        rim.position.set(-4, 2, -3);
        scene.add(key, rim);

        const floor = new T.Mesh(
          new T.CircleGeometry(2.5, 48),
          new T.MeshStandardMaterial({ color: 0x3b4357, roughness: 0.9 })
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        const grid = new T.GridHelper(5, 10, 0x3b4357, 0x2a3040);
        scene.add(grid);

        const pivot: Group = new T.Group();
        scene.add(pivot);

        const camera: PerspectiveCamera = new T.PerspectiveCamera(35, 1, 0.1, 100);
        const controls: OrbitControls = new Orbit(camera, gl.domElement);
        controls.enableDamping = true;
        controls.minDistance = 1.5;
        controls.maxDistance = 15;
        controls.maxPolarAngle = Math.PI * 0.49;
        const resetView = () => {
          camera.position.set(0, 1.5, 4.5);
          controls.target.set(0, 0.9, 0);
          controls.update();
        };
        resetView();

        const resize = () => {
          const w = Math.max(1, host.clientWidth);
          const h = Math.max(1, host.clientHeight);
          gl.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();

        let current: Object3D | null = null;
        let mixer: AnimationMixer | null = null;
        let seq = 0;
        const actions = new Map<string, AnimationAction>();

        const free = () => {
          if (current) {
            pivot.remove(current);
            current.traverse((o) => {
              const m = o as Mesh;
              if (!m.isMesh) return;
              m.geometry.dispose();
              (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
            });
          }
          current = null; mixer = null; actions.clear();
        };

        const buildPlaceholder = (): Group => {
          const g = new T.Group();
          const wire = new T.Mesh(
            new T.BoxGeometry(1.2, 1.2, 1.2),
            new T.MeshStandardMaterial({ color: 0x39cfff, wireframe: true, transparent: true, opacity: 0.6 })
          );
          wire.position.y = 0.6;
          g.add(wire);
          return g;
        };

        const fitToView = (obj: Object3D, maxSize: number) => {
          obj.updateMatrixWorld(true);
          const b = new T.Box3().setFromObject(obj);
          const size = b.getSize(new T.Vector3());
          const s = maxSize / Math.max(size.x, size.y, size.z, 0.001);
          obj.scale.multiplyScalar(s);
          obj.updateMatrixWorld(true);
          const b2 = new T.Box3().setFromObject(obj);
          const c2 = b2.getCenter(new T.Vector3());
          obj.position.set(obj.position.x - c2.x, obj.position.y - b2.min.y, obj.position.z - c2.z);
        };

        const api: StudioApi = {
          async load(e) {
            const mine = ++seq;
            let buf: ArrayBuffer | null = null;
            try {
              const r = await fetch(glbPath(e));
              buf = r.ok ? await r.arrayBuffer() : null;
            } catch { buf = null; }
            if (mine !== seq) return null;

            if (buf && isGlb(buf)) {
              const gltf: GLTF = await new Promise((res, rej) => {
                new GLTFLoader().parse(buf as ArrayBuffer, "", res, (er) => rej(er instanceof Error ? er : new Error("parse failed")));
              });
              if (mine !== seq) return null;
              free();
              const m = gltf.scene;
              const target = e.category === "house" ? 6 : e.category === "tool" ? 1.2 : 2.5;
              fitToView(m, target);
              pivot.add(m);
              current = m;
              if (gltf.animations.length) mixer = new T.AnimationMixer(m);
              gltf.animations.forEach((clip, i) => { if (mixer) actions.set(clip.name || `clip_${i + 1}`, mixer.clipAction(clip)); });
              return { real: true, clips: [...actions.keys()] };
            }

            free();
            const ph = buildPlaceholder();
            current = ph;
            pivot.add(ph);
            return { real: false, clips: [] };
          },
          togglePlay(name) {
            const a = actions.get(name);
            if (!a) return false;
            if (a.isRunning()) { a.stop(); return false; }
            a.reset().play();
            return true;
          },
          reset: resetView,
          getExportContext: () => ({
            root: current,
            renderer: gl,
            scene,
            camera,
            pivot,
            animations: Array.from(new Set(Array.from(actions.values()).map((a) => a.getClip()))),
          }),
        };
        apiRef.current = api;

        let last = performance.now();
        const frame = (now: number) => {
          raf = requestAnimationFrame(frame);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (autoRef.current) pivot.rotation.y += speedRef.current * dt;
          if (mixer) mixer.update(dt);
          controls.update();
          gl.render(scene, camera);
        };
        raf = requestAnimationFrame(frame);

        dispose = () => { free(); controls.dispose(); };
        setReady(true);
      } catch (e) { if (!disposed) setErr(msg(e)); }
    }

    void start();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      dispose();
      if (observer) observer.disconnect();
      if (renderer) { renderer.dispose(); renderer.domElement.remove(); }
      apiRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !apiRef.current || !entry) return;
    let cancelled = false;
    setErr("");
    apiRef.current.load(entry).then((r) => {
      if (cancelled || !r) return;
      setReal(r.real); setClips(r.clips); setPlaying({});
    }).catch((e) => { if (!cancelled) setErr(msg(e)); });
    return () => { cancelled = true; };
  }, [ready, entry]);

  useEffect(() => {
    const first = modelsByCategory(category)[0];
    if (first) setId(first.id);
  }, [category]);

  return (
    <div style={{ padding: 8 }}>
      <b><TabIcon name="car" /> KHOEM-AI 3D · ម៉ូដែល · Real GLB Models</b>
      <div className="filters wrap">
        {CATEGORIES.map((cat) => (
          <button key={cat} type="button" className={cls(category === cat)} onClick={() => setCategory(cat)}>
            {CATEGORY_META[cat].khmer} · {CATEGORY_META[cat].label}
          </button>
        ))}
      </div>

      <div className="person-grid">
        {list.map((m) => (
          <button key={m.id} type="button" className={m.id === id ? "person-card active" : "person-card"} onClick={() => setId(m.id)}>
            <span className="person-text">
              <b>{m.khmerName}</b>
              <small>{m.name}</small>
              <small style={{ opacity: 0.6 }}>/models/{m.category}s/{m.id}.glb</small>
            </span>
          </button>
        ))}
      </div>

      {entry && (
        <>
          <div style={{ marginTop: 6, marginBottom: 6 }}><b>{entry.khmerName}</b> · {entry.name} · {entry.category}</div>

          <div style={{ position: "relative", width: "100%", height: "52vh", minHeight: 300, borderRadius: 10, overflow: "hidden", background: "#0b1220" }}>
            <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
          </div>

          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
            {real
              ? <><TabIcon name="check" size={16} /> ម៉ូដែល .glb ពិត · Real .glb loaded</>
              : <>មិនទាន់មាន .glb · No .glb yet — add <code>public{glbPath(entry)}</code></>}
          </div>
          {err && <div style={{ color: "#ff8a8a", marginTop: 6 }}><TabIcon name="warn" size={16} /> {err}</div>}

          <div style={box}>
            <div><TabIcon name="turn" size={18} /> បង្វិល 360° · Turn (drag; pinch = zoom)</div>
            <label><input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); autoRef.current = e.target.checked; }} /> Auto-turn</label>
            <div>
              <input type="range" min={0.1} max={2} step={0.1} value={speed}
                onChange={(e) => { const v = Number(e.target.value); setSpeed(v); speedRef.current = v; }} /> {speed.toFixed(1)} rad/s
            </div>
            <button type="button" className="filter" onClick={() => apiRef.current?.reset()}>
              <TabIcon name="reset" size={16} /> Reset view
            </button>
          </div>

          {clips.length > 0 && (
            <div style={box}>
              <div><TabIcon name="motion" size={18} /> Animation</div>
              <div className="filters wrap">
                {clips.map((c) => (
                  <button key={c} type="button" className={cls(!!playing[c])} onClick={() => {
                    if (apiRef.current) {
                      const on = apiRef.current.togglePlay(c);
                      setPlaying((p) => ({ ...p, [c]: on }));
                    }
                  }}>
                    <TabIcon name={playing[c] ? "stop" : "play"} size={14} /> {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ExportPanel
            getContext={() => (apiRef.current ? apiRef.current.getExportContext() : null)}
            label={`${entry.category}-${entry.id}`}
            isReal={real}
            onRecordStart={() => { autoRef.current = false; }}
            onRecordEnd={() => { autoRef.current = auto; }}
          />

          <div style={{ ...box, fontSize: 12, opacity: 0.75 }}>
            <b>Free GLB sources:</b>{" "}
            <a href="https://sketchfab.com/3d-models?features=downloadable" target="_blank" rel="noreferrer">Sketchfab (CC)</a> ·{" "}
            <a href="https://polyhaven.com/models" target="_blank" rel="noreferrer">Poly Haven</a> ·{" "}
            <a href="https://quaternius.com/" target="_blank" rel="noreferrer">Quaternius</a> ·{" "}
            <a href="https://kenney.nl/assets?q=3d" target="_blank" rel="noreferrer">Kenney</a>
          </div>
        </>
      )}
    </div>
  );
}
