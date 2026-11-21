import { useEffect, useRef, useState } from "react";
import type { AnimationAction, AnimationMixer, BufferGeometry, Group, Material, Mesh, Object3D, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { isGlb } from "./modelTools.mjs";
import { TabIcon, PersonPortrait } from "./icons";

// 3D people for the studio. Turn them 360° (auto-turn or drag), and make them idle / walk / wave.
// If /characters/<id>.glb exists it is used (and its own animation clips are listed). Otherwise a built-in
// human figure (face, hands, clothing) is shown. For photoreal people, add a rigged GLB in /characters.

type Three = typeof import("three");
type Mode = "idle" | "walk" | "wave";

interface Person {
  id: string; name: string; role: string; desc: string; female: boolean; height: number;
  skin: number; top: number; bottom: number; hair: number;
  tie?: number; shirt?: number; skirt?: boolean; longHair?: boolean; bun?: boolean; longSleeves?: boolean;
}

const PEOPLE: Person[] = [
  { id: "businessman", name: "សុភ័ក្រ", role: "Businessman", desc: "អ្នកជំនួញ ស្លៀកឈុតអាវធំ និងក្រវ៉ាត់ក", female: false, height: 180, skin: 0xc58e69, top: 0x2a2e38, bottom: 0x2a2e38, hair: 0x15110e, tie: 0xb3202a, shirt: 0xf3f5f7, longSleeves: true },
  { id: "fashion-model", name: "ដារ៉ា", role: "Fashion Model", desc: "តារាបង្ហាញម៉ូដ អាវពណ៌ខៀវស", female: false, height: 178, skin: 0xc99672, top: 0x86b9ea, bottom: 0x232b3a, hair: 0x1a1410 },
  { id: "doctor", name: "គុសល", role: "Doctor", desc: "វេជ្ជបណ្ឌិត ពាក់អាវពេទ្យពណ៌ស", female: false, height: 182, skin: 0xc08a66, top: 0xf1f4f6, bottom: 0x3b4a5c, hair: 0x15110e, longSleeves: true },
  { id: "businesswoman", name: "លីហ្សា", role: "Businesswoman", desc: "អ្នកជំនួញស្ត្រី សម្លៀកបំពាក់ទាន់សម័យ", female: true, height: 168, skin: 0xd0a07c, top: 0x7a2d63, bottom: 0x24202c, hair: 0x120d0b, skirt: true, longHair: true, longSleeves: true },
  { id: "student", name: "ហ្សា", role: "Student", desc: "និស្សិតស្រី សម្លៀកបំពាក់ធម្មតា", female: true, height: 162, skin: 0xd1a27d, top: 0xf4f6f8, bottom: 0x1b2f5e, hair: 0x120d0b, skirt: true, longHair: true },
  { id: "nurse", name: "ស្រីពៅ", role: "Nurse", desc: "គិលានុបដ្ឋាយិកា សម្លៀកបំពាក់ពេទ្យ", female: true, height: 166, skin: 0xcf9f7b, top: 0x7fd0e0, bottom: 0x7fd0e0, hair: 0x120d0b, bun: true },
];

interface Rig {
  root: Group; hips: Group; torso: Group; head: Group;
  armL: Group; armR: Group; elbowL: Group; elbowR: Group;
  legL: Group; legR: Group; kneeL: Group; kneeR: Group;
}

// Body built from tapered limbs, with a face, hands, fingers, shoes and clothing details.
// Units: metres for a 1.75 m person, then scaled to the person's height.
// The figure faces +z. A limb hangs down (-y) from its joint, so rotation.x > 0 swings it backwards.
function buildPerson(T: Three, p: Person): Rig {
  const mat = (color: number, rough: number, extra: { side?: 0 | 1 | 2 } = {}): Material =>
    new T.MeshStandardMaterial({ color, roughness: rough, ...extra });
  const skin = mat(p.skin, 0.62), top = mat(p.top, 0.8, { side: T.DoubleSide }), bottom = mat(p.bottom, 0.85);
  const hair = mat(p.hair, 0.45), dark = mat(0x0b0b0d, 0.5);
  const white = mat(0xf6f6f4, 0.3), iris = mat(p.female ? 0x3a2418 : 0x2e1d14, 0.3);
  const lip = mat(p.female ? 0xa8504f : 0x9a5a50, 0.5);
  const lightShoe = p.id === "nurse" || p.id === "student" || p.id === "doctor";
  const shoe = mat(lightShoe ? 0xeeeeee : 0x15171c, 0.55), sole = mat(lightShoe ? 0xcfcfcf : 0x050506, 0.9);
  const sleeve = p.longSleeves ? top : skin;
  const add = (parent: Object3D, geo: BufferGeometry, m: Material, x = 0, y = 0, z = 0): Mesh => {
    const mesh = new T.Mesh(geo, m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  // Ellipsoid: a unit sphere scaled to the half-sizes rx, ry, rz.
  const ball = (parent: Object3D, rx: number, ry: number, rz: number, m: Material, x = 0, y = 0, z = 0): Mesh => {
    const mesh = add(parent, new T.SphereGeometry(1, 24, 16), m, x, y, z);
    mesh.scale.set(rx, ry, rz);
    return mesh;
  };
  // A tapered limb segment hanging down from the joint (r0 at the top, r1 at the bottom).
  const taper = (parent: Object3D, len: number, r0: number, r1: number, m: Material): Mesh =>
    add(parent, new T.CylinderGeometry(r0, r1, len, 20, 1), m, 0, -len / 2, 0);
  const joint = (parent: Object3D, x: number, y: number): Group => {
    const g = new T.Group();
    g.position.set(x, y, 0);
    parent.add(g);
    return g;
  };

  const f = p.female;
  const chestR = f ? 0.145 : 0.168;   // half shoulder/chest width
  const waistR = f ? 0.118 : 0.138;
  const hipR = f ? 0.165 : 0.15;
  const root = new T.Group();
  const hips = joint(root, 0, 0.92);
  const torso = joint(hips, 0, 0);

  // Pelvis, waist and chest as smooth ellipsoids / tapered cylinders, so there are no hard capsule seams.
  ball(hips, hipR, 0.11, hipR * 0.72, bottom, 0, 0.0, 0);
  const waist = add(torso, new T.CylinderGeometry(chestR * 0.9, hipR * 0.92, 0.32, 24, 1), top, 0, 0.16, 0);
  waist.scale.z = 0.72;
  ball(torso, chestR, 0.17, chestR * 0.66, top, 0, 0.4, 0);
  ball(torso, chestR * 0.85, 0.06, chestR * 0.55, top, 0, 0.5, 0);
  if (f) for (const s of [-1, 1]) ball(torso, 0.05, 0.05, 0.05, top, s * 0.058, 0.4, chestR * 0.6);
  // belt for trousers
  if (!p.skirt) add(torso, new T.CylinderGeometry(hipR * 0.9, hipR * 0.9, 0.03, 24, 1, true), mat(0x1a1410, 0.5, { side: T.DoubleSide }), 0, 0.01, 0).scale.z = 0.74;

  if (p.skirt) {
    const skirt = mat(p.bottom, 0.85, { side: T.DoubleSide });
    add(hips, new T.CylinderGeometry(hipR * 0.95, hipR * 1.5, 0.34, 28, 1, true), skirt, 0, -0.15, 0).scale.z = 0.85;
  }
  // Doctor: long white coat. Businessman: suit jacket with lapels.
  if (p.id === "doctor") {
    add(hips, new T.CylinderGeometry(hipR * 1.02, hipR * 1.28, 0.5, 28, 1, true), top, 0, -0.22, 0).scale.z = 0.85;
  } else if (p.id === "businessman") {
    add(hips, new T.CylinderGeometry(hipR * 1.0, hipR * 1.12, 0.26, 28, 1, true), top, 0, -0.1, 0).scale.z = 0.8;
    for (const s of [-1, 1]) {
      const lapel = add(torso, new T.BoxGeometry(0.05, 0.3, 0.012), top, s * 0.065, 0.38, chestR * 0.66 + 0.005);
      lapel.rotation.z = s * 0.28;
    }
  }

  // Neck and collar
  add(torso, new T.CylinderGeometry(0.047, 0.055, 0.12, 18), skin, 0, 0.59, 0);
  if (p.shirt !== undefined) {
    const shirt = mat(p.shirt, 0.7, { side: T.DoubleSide });
    add(torso, new T.BoxGeometry(0.1, 0.34, 0.016), shirt, 0, 0.36, chestR * 0.66 + 0.003);
    add(torso, new T.CylinderGeometry(0.062, 0.07, 0.035, 18, 1, true), shirt, 0, 0.6, 0);
  }
  if (p.tie !== undefined) {
    const tie = mat(p.tie, 0.5);
    add(torso, new T.BoxGeometry(0.036, 0.3, 0.012), tie, 0, 0.35, chestR * 0.66 + 0.014);
    add(torso, new T.BoxGeometry(0.05, 0.04, 0.016), tie, 0, 0.55, chestR * 0.66 + 0.012);
  }

  // Head: skull + jaw + ears + nose + eyes + brows + lips + hair
  const head = joint(torso, 0, 0.72);
  const skull = ball(head, 0.095, 0.118, 0.105, skin, 0, 0.0, 0);
  skull.name = "skull";
  ball(head, 0.078, 0.075, 0.088, skin, 0, -0.055, 0.016);                    // jaw / chin
  for (const s of [-1, 1]) {
    ball(head, 0.012, 0.026, 0.018, skin, s * 0.097, -0.005, 0);                // ears
    ball(head, 0.016, 0.0095, 0.008, white, s * 0.038, 0.018, 0.088);          // eye white
    ball(head, 0.0082, 0.0082, 0.006, iris, s * 0.038, 0.018, 0.0955);          // iris
    ball(head, 0.0036, 0.0036, 0.004, dark, s * 0.038, 0.018, 0.0985);          // pupil
    const brow = add(head, new T.BoxGeometry(0.038, p.female ? 0.005 : 0.0075, 0.008), hair, s * 0.04, 0.048, 0.094);
    brow.rotation.z = -s * 0.1;
  }
  ball(head, 0.012, 0.017, 0.015, skin, 0, -0.012, 0.104);                      // nose tip
  ball(head, 0.007, 0.022, 0.01, skin, 0, 0.008, 0.099);                        // nose bridge
  const mouth = add(head, new T.CapsuleGeometry(0.0055, 0.03, 4, 8), lip, 0, -0.05, 0.094);
  mouth.rotation.z = Math.PI / 2;
  // hair: crown + back + (long / bun)
  const cap = add(head, new T.SphereGeometry(0.113, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), hair, 0, 0.012, -0.006);
  cap.rotation.x = -0.42;
  ball(head, 0.106, 0.1, 0.1, hair, 0, 0.0, -0.03);
  if (p.longHair) {
    add(head, new T.CapsuleGeometry(0.088, 0.22, 6, 12), hair, 0, -0.14, -0.06);
    for (const s of [-1, 1]) add(head, new T.CapsuleGeometry(0.03, 0.14, 4, 8), hair, s * 0.09, -0.07, 0.0);
  }
  if (p.bun) ball(head, 0.05, 0.05, 0.05, hair, 0, 0.1, -0.1);

  // Arms: shoulder, upper arm, elbow, forearm, hand with fingers
  const arms: Group[] = [];
  const elbows: Group[] = [];
  for (const s of [-1, 1]) {
    const arm = joint(torso, s * (chestR + 0.03), 0.5);
    ball(arm, 0.058, 0.058, 0.058, top, 0, 0, 0);
    taper(arm, 0.29, 0.05, 0.04, top);
    const elbow = joint(arm, 0, -0.29);
    ball(elbow, 0.041, 0.041, 0.041, sleeve, 0, 0, 0);
    taper(elbow, 0.26, 0.04, 0.03, sleeve);
    const hand = joint(elbow, 0, -0.27);
    ball(hand, 0.034, 0.045, 0.014, skin, 0, -0.03, 0);                         // palm
    for (let i = 0; i < 4; i++) {
      const fx = (i - 1.5) * 0.0165;
      const len = [0.05, 0.058, 0.054, 0.042][i];
      const finger = add(hand, new T.CapsuleGeometry(0.0078, len, 3, 6), skin, fx, -0.075 - len / 2 + 0.01, 0.004);
      finger.rotation.x = -0.18;
    }
    const thumb = add(hand, new T.CapsuleGeometry(0.0095, 0.04, 3, 6), skin, -s * 0.036, -0.045, 0.012);
    thumb.rotation.z = -s * 0.45;
    thumb.rotation.x = -0.2;
    arms.push(arm);
    elbows.push(elbow);
  }

  // Legs: thigh, knee, calf, ankle, shoe with sole
  const legs: Group[] = [];
  const knees: Group[] = [];
  for (const s of [-1, 1]) {
    const leg = joint(hips, s * (f ? 0.082 : 0.09), 0);
    taper(leg, 0.44, f ? 0.088 : 0.09, 0.06, bottom);
    const knee = joint(leg, 0, -0.44);
    ball(knee, 0.06, 0.06, 0.06, bottom, 0, 0, 0);
    taper(knee, 0.43, 0.058, 0.038, bottom);
    ball(knee, 0.04, 0.04, 0.04, skin, 0, -0.43, 0);                            // ankle
    ball(knee, 0.047, 0.04, 0.125, shoe, 0, -0.455, 0.04);                      // shoe upper
    add(knee, new T.BoxGeometry(0.095, 0.012, 0.255), sole, 0, -0.482, 0.045);  // sole
    legs.push(leg);
    knees.push(knee);
  }
  root.scale.setScalar(p.height / 175);
  return { root, hips, torso, head, armL: arms[0], armR: arms[1], elbowL: elbows[0], elbowR: elbows[1], legL: legs[0], legR: legs[1], kneeL: knees[0], kneeR: knees[1] };
}

// Every frame the pose is a pure function of the mode and the clock, so switching modes never leaves a stuck limb.
function pose(r: Rig, mode: Mode, t: number): void {
  const breath = Math.sin(t * 1.6);
  r.hips.position.y = 0.92;
  r.torso.scale.y = 1 + 0.008 * breath;
  r.torso.rotation.set(0, 0.04 * Math.sin(t * 0.7), 0);
  r.head.rotation.set(0, 0.15 * Math.sin(t * 0.5), 0);
  r.legL.rotation.set(0, 0, 0);
  r.legR.rotation.set(0, 0, 0);
  r.kneeL.rotation.set(0, 0, 0);
  r.kneeR.rotation.set(0, 0, 0);
  r.armL.rotation.set(0, 0, -0.08 - 0.015 * breath);
  r.armR.rotation.set(0, 0, 0.08 + 0.015 * breath);
  r.elbowL.rotation.set(-0.12, 0, 0);
  r.elbowR.rotation.set(-0.12, 0, 0);
  if (mode === "walk") {
    const w = t * 5.5;
    const s = Math.sin(w);
    r.hips.position.y = 0.91 + Math.abs(Math.cos(w)) * 0.018;
    r.legL.rotation.x = s * 0.55;
    r.legR.rotation.x = -s * 0.55;
    r.kneeL.rotation.x = (1 - Math.cos(w + 1.2)) * 0.32;
    r.kneeR.rotation.x = (1 - Math.cos(w + 1.2 + Math.PI)) * 0.32;
    r.armL.rotation.x = -s * 0.5;
    r.armR.rotation.x = s * 0.5;
    r.elbowL.rotation.x = -0.35;
    r.elbowR.rotation.x = -0.35;
    r.torso.rotation.y = s * 0.12;
  } else if (mode === "wave") {
    r.armR.rotation.set(0, 0, 2.5);
    r.elbowR.rotation.set(0, 0, 0.35 + Math.sin(t * 8) * 0.45);
    r.head.rotation.y = 0.25 * Math.sin(t * 1.2);
  }
}

const box: React.CSSProperties = { background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, marginTop: 10 };
const cls = (on: boolean): string => (on ? "filter active" : "filter");
const MODE_LABELS: Record<Mode, string> = { idle: "ឈរ · Idle", walk: "ដើរ · Walk", wave: "ដាក់ដៃ · Wave" };
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

type Api = { show: (p: Person) => Promise<{ real: boolean; clips: string[] } | null>; togglePlay: (clip: string) => boolean; resetView: () => void };

export default function HumanViewer() {
  const hostRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const autoRef = useRef(true);
  const speedRef = useRef(0.6);
  const modeRef = useRef<Mode>("idle");
  const [ready, setReady] = useState(false);
  const [id, setId] = useState(PEOPLE[0].id);
  const [filter, setFilter] = useState<"all" | "m" | "f">("all");
  const [auto, setAuto] = useState(true);
  const [speed, setSpeed] = useState(0.6);
  const [mode, setMode] = useState<Mode>("idle");
  const [real, setReal] = useState(false);
  const [clips, setClips] = useState<string[]>([]);
  const [playing, setPlaying] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState("");

  const person = PEOPLE.find((x) => x.id === id) || PEOPLE[0];
  const list = PEOPLE.filter((x) => filter === "all" || (filter === "f") === x.female);

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
        const floor = new T.Mesh(new T.CircleGeometry(1.6, 48), new T.MeshStandardMaterial({ color: 0x3b4357, roughness: 0.9 }));
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);
        const pivot: Group = new T.Group();
        scene.add(pivot);

        const camera: PerspectiveCamera = new T.PerspectiveCamera(35, 1, 0.1, 100);
        const controls: OrbitControls = new Orbit(camera, gl.domElement);
        gl.domElement.style.touchAction = "pan-y"; // vertical swipe scrolls the page, horizontal rotates
        controls.enableDamping = true;
        controls.minDistance = 1.8;
        controls.maxDistance = 8;
        controls.maxPolarAngle = Math.PI * 0.49;
        const resetView = () => {
          camera.position.set(0, 1.2, 4);
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
        let rig: Rig | null = null;
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
          current = null; rig = null; mixer = null; actions.clear();
        };

        const api: Api = {
          async show(p) {
            const mine = ++seq;
            let buf: ArrayBuffer | null = null;
            try {
              const r = await fetch(`/characters/${p.id}.glb`);
              buf = r.ok ? await r.arrayBuffer() : null; // a dev server may answer a missing file with HTML, so check the bytes
            } catch { buf = null; }
            if (mine !== seq) return null;
            if (buf && isGlb(buf)) {
              const gltf: GLTF = await new Promise((res, rej) => new GLTFLoader().parse(buf as ArrayBuffer, "", res, (e) => rej(e instanceof Error ? e : new Error("The model could not be read"))));
              if (mine !== seq) return null;
              free();
              const m = gltf.scene;
              const s0 = new T.Box3().setFromObject(m).getSize(new T.Vector3());
              m.scale.multiplyScalar(p.height / 100 / (s0.y || 1));
              m.updateMatrixWorld(true);
              const b = new T.Box3().setFromObject(m);
              const c = b.getCenter(new T.Vector3());
              m.position.set(m.position.x - c.x, m.position.y - b.min.y, m.position.z - c.z);
              pivot.add(m);
              current = m;
              if (gltf.animations.length) mixer = new T.AnimationMixer(m);
              gltf.animations.forEach((clip, i) => { if (mixer) actions.set(clip.name || `clip_${i + 1}`, mixer.clipAction(clip)); });
              return { real: true, clips: [...actions.keys()] };
            }
            free();
            rig = buildPerson(T, p);
            current = rig.root;
            pivot.add(rig.root);
            return { real: false, clips: [] };
          },
          togglePlay(name) {
            const a = actions.get(name);
            if (!a) return false;
            if (a.isRunning()) { a.stop(); return false; }
            a.reset().play();
            return true;
          },
          resetView,
        };
        apiRef.current = api;

        let last = performance.now();
        const frame = (now: number) => {
          raf = requestAnimationFrame(frame);
          const dt = Math.min((now - last) / 1000, 0.05);
          last = now;
          if (autoRef.current) pivot.rotation.y += speedRef.current * dt;
          if (rig) pose(rig, modeRef.current, now / 1000);
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
    if (!ready || !apiRef.current) return;
    let cancelled = false;
    setErr("");
    apiRef.current.show(person).then((r) => {
      if (cancelled || !r) return;
      setReal(r.real); setClips(r.clips); setPlaying({});
    }).catch((e) => { if (!cancelled) setErr(msg(e)); });
    return () => { cancelled = true; };
  }, [ready, id]);

  const pick = (m: Mode) => { setMode(m); modeRef.current = m; };

  return (
    <div style={{ padding: 8 }}>
      <b><TabIcon name="people" /> KHOEM-AI 3D · តួអង្គ · Characters</b>
      <div className="filters wrap">
        <button type="button" className={cls(filter === "all")} onClick={() => setFilter("all")}>ទាំងអស់ ({PEOPLE.length})</button>
        <button type="button" className={cls(filter === "m")} onClick={() => setFilter("m")}><TabIcon name="male" size={16} /> ប្រុស</button>
        <button type="button" className={cls(filter === "f")} onClick={() => setFilter("f")}><TabIcon name="female" size={16} /> ស្រី</button>
      </div>
      <div className="person-grid">
        {list.map((x) => (
          <button type="button" key={x.id} className={x.id === id ? "person-card active" : "person-card"} aria-pressed={x.id === id} onClick={() => setId(x.id)}>
            <span className="person-portrait-wrap">
              <PersonPortrait role={x.role} skin={x.skin} top={x.top} hair={x.hair} shirt={x.shirt} tie={x.tie} longHair={x.longHair} bun={x.bun} />
            </span>
            <span className="person-text">
              <b>{x.name}</b>
              <small>{x.role} · {x.height} cm <TabIcon name={x.female ? "female" : "male"} size={13} /></small>
              <small>{x.desc}</small>
            </span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 6, marginBottom: 6 }}><b>{person.name}</b> · {person.role} · {person.height} cm</div>

      <div style={{ position: "relative", width: "100%", height: "52vh", minHeight: 300, borderRadius: 10, overflow: "hidden", background: "#0b1220" }}>
        <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
      </div>
      <div style={{ marginTop: 6, fontSize: 13, opacity: 0.85 }}>
        {real
          ? <><TabIcon name="check" size={16} /> ម៉ូដែល .glb ពិត · Real .glb model</>
          : `មនុស្សក្លែងសាកល្បង (មិនមែនមនុស្សពិត) · Test mannequin — real model: put it at public/characters/${person.id}.glb`}
      </div>
      {err && <div style={{ color: "#ff8a8a", marginTop: 6 }}><TabIcon name="warn" size={16} /> {err}</div>}

      <div style={box}>
        <div><TabIcon name="turn" size={18} /> បង្វិល 360° · Turn (អូសដើម្បីបង្វិលដោយដៃ · drag; pinch = zoom)</div>
        <label><input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); autoRef.current = e.target.checked; }} /> បង្វិលស្វ័យប្រវត្តិ · Auto-turn</label>
        <div>
          <input type="range" min={0.1} max={2} step={0.1} value={speed}
            onChange={(e) => { const v = Number(e.target.value); setSpeed(v); speedRef.current = v; }} /> {speed.toFixed(1)} rad/s
        </div>
        <button type="button" className="filter" onClick={() => apiRef.current && apiRef.current.resetView()}><TabIcon name="reset" size={16} /> មើលពីមុខ · Reset view</button>
      </div>

      <div style={box}>
        <div><TabIcon name="motion" size={18} /> ចលនា · Motion</div>
        <div className="filters wrap">
          {!real && (Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button type="button" key={m} className={cls(mode === m)} onClick={() => pick(m)}>{MODE_LABELS[m]}</button>
          ))}
          {real && clips.map((c) => (
            <button type="button" key={c} className={cls(!!playing[c])} onClick={() => { if (apiRef.current) { const on = apiRef.current.togglePlay(c); setPlaying((p) => ({ ...p, [c]: on })); } }}>
              <TabIcon name={playing[c] ? "stop" : "play"} size={14} /> {c}
            </button>
          ))}
        </div>
        {real && clips.length === 0 && <div style={{ opacity: 0.75, fontSize: 13 }}>ម៉ូដែលនេះគ្មាន Animation · This model has no animation clips.</div>}
      </div>
    </div>
  );
}
