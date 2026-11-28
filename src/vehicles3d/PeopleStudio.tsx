import { useEffect, useRef, useState } from "react";
import type { AnimationAction, AnimationClip, AnimationMixer, Group, Mesh, Object3D, PerspectiveCamera, WebGLRenderer } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { TabIcon } from "./icons";
import { CAMERA_PRESETS, cameraPreset, isGlb } from "./modelTools.mjs";
import {
  DEFAULT_SELECTION, PRESETS, STUDIO_MODEL, clipPhase, fitStageDistance, heightScale,
  lineupPositions, pickDefaultClip, stageSize, togglePreset,
} from "./peopleStudio.mjs";

// People Studio: the rigged model in /characters/fashion-model.glb on a grid floor, at one or several body
// heights in a row, all playing one of the model's own animation clips (for example SambaDance).
// Nothing is drawn by hand here: if the .glb is missing the studio says so instead of showing a stand-in.

type Three = typeof import("three");
type View = (typeof CAMERA_PRESETS)[number];

interface Api {
  setPeople: (ids: string[]) => void;
  setClip: (name: string | null) => void;
  setPaused: (paused: boolean) => void;
  setView: (view: View) => void;
}

interface Stand { holder: Group; mixer: AnimationMixer; actions: Map<string, AnimationAction> }

const VIEW_LABELS: Record<string, string> = {
  front: "មុខ · Front",
  threeQuarter: "ជ្រុង · 3/4",
  side: "ចំហៀង · Side",
  rear: "ក្រោយ · Rear",
  top: "លើ · Top",
};

const box: React.CSSProperties = { background: "rgba(127,127,127,0.12)", borderRadius: 10, padding: 10, marginTop: 10 };
const cls = (on: boolean): string => (on ? "filter active" : "filter");
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function PeopleStudio() {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const turnRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState<string[]>(DEFAULT_SELECTION);
  const [clips, setClips] = useState<string[]>([]);
  const [clip, setClip] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<View>("front");
  const [turn, setTurn] = useState(false);

  useEffect(() => {
    let disposed = false;
    let raf = 0;
    let renderer: WebGLRenderer | undefined;
    let observer: ResizeObserver | undefined;
    let dispose = () => {};

    async function start() {
      try {
        const T: Three = await import("three");
        const { OrbitControls: Orbit } = await import("three/examples/jsm/controls/OrbitControls.js");
        const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { clone } = await import("three/examples/jsm/utils/SkeletonUtils.js");
        const host = hostRef.current;
        if (disposed || !host) return;

        // A dev server answers a missing file with an HTML page, so check the bytes and not only the status.
        const res = await fetch(STUDIO_MODEL);
        const buf = res.ok ? await res.arrayBuffer() : null;
        if (disposed) return;
        if (!buf || !isGlb(buf)) throw new Error(`NOT FOUND: public${STUDIO_MODEL} (a rigged .glb is needed)`);
        const gltf: GLTF = await new Promise((ok, fail) =>
          new GLTFLoader().parse(buf, "", ok, (e) => fail(e instanceof Error ? e : new Error("The model could not be read"))));
        if (disposed) return;

        const base = gltf.scene;
        base.updateMatrixWorld(true);
        const baseBox = new T.Box3().setFromObject(base);
        const baseSize = baseBox.getSize(new T.Vector3());
        const baseCentre = baseBox.getCenter(new T.Vector3());
        if (!(baseSize.y > 0)) throw new Error("The model has no height");
        const animations: AnimationClip[] = gltf.animations;

        const gl = new T.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
        renderer = gl;
        gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        host.appendChild(gl.domElement);
        Object.assign(gl.domElement.style, { width: "100%", height: "100%", display: "block", touchAction: "pan-y" });

        const scene = new T.Scene();
        scene.background = new T.Color(0x05070c);
        scene.add(new T.HemisphereLight(0xfff6e8, 0x3a4252, 2.2));
        const key = new T.DirectionalLight(0xfff1dd, 2.6);
        key.position.set(3, 5, 4);
        const rim = new T.DirectionalLight(0x8fd4ff, 1.1);
        rim.position.set(-4, 3, -3);
        scene.add(key, rim);
        scene.add(new T.GridHelper(24, 48, 0x9aa3b2, 0x3a4252));
        const stage: Group = new T.Group();
        scene.add(stage);

        const camera: PerspectiveCamera = new T.PerspectiveCamera(35, 1, 0.1, 100);
        const controls: OrbitControls = new Orbit(camera, gl.domElement);
        controls.enableDamping = true;
        controls.autoRotateSpeed = 1.5;
        controls.maxPolarAngle = Math.PI * 0.495;

        let stands: Stand[] = [];
        let heights: number[] = [PRESETS[0].height];
        let current: string | null = null;
        let currentView: View = "front";
        let isPaused = false;

        const fit = () => {
          const size = stageSize(heights);
          const distance = fitStageDistance(size, camera.fov, camera.aspect);
          const [x, y, z] = cameraPreset(currentView, distance);
          const target = size.height * 0.5;
          controls.target.set(0, target, 0);
          camera.position.set(x, target + y, z);
          controls.minDistance = Math.min(1.5, distance);
          controls.maxDistance = distance * 3;
          controls.update();
        };

        const resize = () => {
          const w = Math.max(1, host.clientWidth);
          const h = Math.max(1, host.clientHeight);
          gl.setSize(w, h, false);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          fit();
        };

        const clear = () => {
          for (const s of stands) {
            s.mixer.stopAllAction();
            s.mixer.uncacheRoot(s.holder.children[0]);
            stage.remove(s.holder);
          }
          stands = [];
        };

        const play = (s: Stand, index: number) => {
          s.mixer.stopAllAction();
          if (!current) return;
          const a = s.actions.get(current);
          if (!a) return;
          a.reset().play();
          a.time = clipPhase(index, a.getClip().duration);
        };

        const api: Api = {
          setPeople(ids) {
            const chosen = PRESETS.filter((p) => ids.includes(p.id));
            if (!chosen.length) return;
            clear();
            heights = chosen.map((p) => p.height);
            const xs = lineupPositions(chosen.length);
            chosen.forEach((p, i) => {
              const model: Object3D = clone(base);
              model.position.set(-baseCentre.x, -baseBox.min.y, -baseCentre.z);
              const holder = new T.Group();
              holder.add(model);
              holder.scale.setScalar(heightScale(baseSize.y, p.height));
              holder.position.x = xs[i];
              stage.add(holder);
              const mixer = new T.AnimationMixer(model);
              const actions = new Map<string, AnimationAction>();
              animations.forEach((c, n) => actions.set(c.name || `clip_${n + 1}`, mixer.clipAction(c)));
              const s: Stand = { holder, mixer, actions };
              stands.push(s);
              play(s, i);
            });
            fit();
          },
          setClip(name) {
            current = name;
            stands.forEach(play);
          },
          setPaused(p) { isPaused = p; },
          setView(v) { currentView = v; fit(); },
        };
        apiRef.current = api;

        observer = new ResizeObserver(resize);
        observer.observe(host);
        resize();

        let last = performance.now();
        const frame = (now: number) => {
          raf = requestAnimationFrame(frame);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          controls.autoRotate = turnRef.current;
          if (!isPaused) stands.forEach((s) => s.mixer.update(dt));
          controls.update();
          gl.render(scene, camera);
        };
        raf = requestAnimationFrame(frame);

        dispose = () => {
          clear();
          controls.dispose();
          base.traverse((o) => {
            const m = o as Mesh;
            if (!m.isMesh) return;
            m.geometry.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
          });
        };

        const names = animations.map((c, n) => c.name || `clip_${n + 1}`);
        setClips(names);
        setClip(pickDefaultClip(names));
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

  useEffect(() => { if (ready && apiRef.current) apiRef.current.setPeople(selected); }, [ready, selected]);
  useEffect(() => { if (ready && apiRef.current) apiRef.current.setClip(clip); }, [ready, clip, selected]);
  useEffect(() => { if (apiRef.current) apiRef.current.setPaused(paused); }, [ready, paused]);
  useEffect(() => { if (apiRef.current) apiRef.current.setView(view); }, [ready, view]);

  return (
    <div style={{ padding: 8 }}>
      <b><TabIcon name="video" /> ស្ទូឌីយោមនុស្ស · People Studio</b>

      <div className="filters wrap">
        {PRESETS.map((p) => (
          <button type="button" key={p.id} className={cls(selected.includes(p.id))} aria-pressed={selected.includes(p.id)}
            onClick={() => setSelected((s) => togglePreset(s, p.id))}>
            <TabIcon name="people" size={14} /> {p.label} · {Math.round(p.height * 100)} cm
          </button>
        ))}
      </div>

      <div style={{ position: "relative", width: "100%", height: "60vh", minHeight: 320, borderRadius: 10, overflow: "hidden", background: "#05070c" }}>
        <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
        {ready
          ? <><TabIcon name="check" size={16} /> ម៉ូដែល .glb ពិត · Real .glb model · {selected.length} · {clips.length} clip</>
          : !err && "កំពុងផ្ទុក · Loading…"}
      </div>
      {err && <div style={{ color: "#ff8a8a", marginTop: 6 }}><TabIcon name="warn" size={16} /> {err}</div>}

      <div style={box}>
        <div><TabIcon name="motion" size={18} /> ចលនា · Motion</div>
        <div className="filters wrap">
          {clips.map((c) => (
            <button type="button" key={c} className={cls(clip === c)} aria-pressed={clip === c} onClick={() => setClip(c)}>
              <TabIcon name="play" size={14} /> {c}
            </button>
          ))}
          <button type="button" className={cls(paused)} aria-pressed={paused} onClick={() => setPaused((p) => !p)}>
            <TabIcon name="stop" size={14} /> {paused ? "បន្ត · Resume" : "ផ្អាក · Pause"}
          </button>
        </div>
        {ready && clips.length === 0 && <div style={{ opacity: 0.75, fontSize: 13 }}>ម៉ូដែលនេះគ្មាន Animation · This model has no animation clips.</div>}
      </div>

      <div style={box}>
        <div><TabIcon name="camera" size={18} /> កាមេរ៉ា · Camera</div>
        <div className="filters wrap">
          {CAMERA_PRESETS.map((v) => (
            <button type="button" key={v} className={cls(view === v)} aria-pressed={view === v} onClick={() => setView(v)}>
              {VIEW_LABELS[v] || v}
            </button>
          ))}
        </div>
        <label>
          <input type="checkbox" checked={turn} onChange={(e) => { setTurn(e.target.checked); turnRef.current = e.target.checked; }} />
          {" "}<TabIcon name="turn" size={16} /> បង្វិលស្វ័យប្រវត្តិ · Auto-turn (អូសដើម្បីបង្វិលដោយដៃ · drag; pinch = zoom)
        </label>
      </div>
    </div>
  );
}
