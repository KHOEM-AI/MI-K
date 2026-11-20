#!/usr/bin/env python3
"""បន្ថែម Screenshot + Export GLB ទៅ Village3D.tsx"""
import shutil
from pathlib import Path

FILE = Path("src/components/Village3D.tsx")
BACKUP = Path("src/components/Village3D.tsx.before-capture")

if not FILE.exists():
    raise SystemExit("❌ រកមិនឃើញ Village3D.tsx")

if BACKUP.exists():
    print(f"ℹ️  Backup មានស្រាប់: {BACKUP}")
else:
    shutil.copy2(FILE, BACKUP)
    print(f"✅ Backup: {BACKUP}")

text = FILE.read_text(encoding="utf-8")
changed = 0

# ---- 1. បន្ថែម imports ----
old_imports = '''import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";'''
new_imports = '''import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";'''
if "GLTFExporter" not in text:
    if old_imports not in text:
        raise SystemExit("❌ រកមិនឃើញបន្ទាត់ import OrbitControls")
    text = text.replace(old_imports, new_imports, 1)
    changed += 1
    print("✅ បន្ថែម import GLTFExporter")

# ---- 2. បន្ថែម state refs សម្រាប់ scene/renderer (ប្រើ useRef ដើម្បីចាប់ពី buttons) ----
# បន្ថែម refs ក្រោយ loading state
anchor_state = 'const [loading, setLoading] = useState(true);'
new_state = '''const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);'''
if "sceneRef" not in text:
    if anchor_state not in text:
        raise SystemExit("❌ រកមិនឃើញបន្ទាត់ loading state")
    text = text.replace(anchor_state, new_state, 1)
    changed += 1
    print("✅ បន្ថែម refs (sceneRef, rendererRef, cameraRef) + busy")

# ---- 3. ភ្ជាប់ refs ក្នុង useEffect ----
# ក្រោយ "const scene = new THREE.Scene();"
anchor_scene = 'const scene = new THREE.Scene();'
new_scene = '''const scene = new THREE.Scene();
    sceneRef.current = scene;'''
if "sceneRef.current = scene;" not in text:
    if anchor_scene not in text:
        raise SystemExit("❌ រកមិនឃើញបន្ទាត់ scene")
    text = text.replace(anchor_scene, new_scene, 1)
    changed += 1
    print("✅ ភ្ជាប់ sceneRef")

# ក្រោយ "const renderer = new THREE.WebGLRenderer({ antialias: true });"
anchor_renderer = 'const renderer = new THREE.WebGLRenderer({ antialias: true });'
new_renderer = '''const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;'''
if "rendererRef.current = renderer;" not in text:
    if anchor_renderer not in text:
        raise SystemExit("❌ រកមិនឃើញបន្ទាត់ renderer")
    text = text.replace(anchor_renderer, new_renderer, 1)
    changed += 1
    print("✅ ភ្ជាប់ rendererRef")

# ក្រោយ "camera.position.set(60, 50, 80);"
anchor_cam = 'camera.position.set(60, 50, 80);'
new_cam = '''camera.position.set(60, 50, 80);
    cameraRef.current = camera;'''
if "cameraRef.current = camera;" not in text:
    if anchor_cam not in text:
        raise SystemExit("❌ រកមិនឃើញបន្ទាត់ camera.position")
    text = text.replace(anchor_cam, new_cam, 1)
    changed += 1
    print("✅ ភ្ជាប់ cameraRef")

# ---- 4. បន្ថែម 2 functions (screenshot + export GLB) មុន return ----
# រកឃើញ "return (" ដំបូង (បន្ទាប់ពី useEffect)
anchor_return = '''  return (
    <div
      ref={mountRef}'''
new_functions = '''  const takeScreenshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const dataURL = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `village-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const exportGLB = async () => {
    const scene = sceneRef.current;
    if (!scene || busy) return;
    setBusy(true);
    try {
      const exporter = new GLTFExporter();
      const result = await exporter.parseAsync(scene, { binary: true });
      const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `village-${Date.now()}.glb`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export GLB failed:", err);
      alert("Export បរាជ័យ — សូមពិនិត្យ console");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={mountRef}'''
if "takeScreenshot" not in text or "exportGLB" not in text:
    if anchor_return not in text:
        raise SystemExit("❌ រកមិនឃើញ return block")
    text = text.replace(anchor_return, new_functions, 1)
    changed += 1
    print("✅ បន្ថែម takeScreenshot + exportGLB")

# ---- 5. បន្ថែម buttons ខាងលើ loading ----
# រកឃើញ "{loading && (" ហើយបន្ថែម buttons មុន
anchor_loading = '{loading && ('
new_buttons = '''{!loading && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            display: "flex",
            gap: 8,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={takeScreenshot}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: "#16a085",
              color: "#fff",
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            📸 Screenshot
          </button>
          <button
            type="button"
            onClick={exportGLB}
            disabled={busy}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: busy ? "#7f8c8d" : "#8e44ad",
              color: "#fff",
              fontSize: 14,
              cursor: busy ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {busy ? "⏳ កំពុង Export..." : "🎬 Export GLB"}
          </button>
        </div>
      )}
      {loading && ('''
if "📸 Screenshot" not in text:
    if anchor_loading not in text:
        raise SystemExit("❌ រកមិនឃើញ loading block")
    text = text.replace(anchor_loading, new_buttons, 1)
    changed += 1
    print("✅ បន្ថែម 2 ប៊ូតុង (Screenshot + Export GLB)")

if changed == 0:
    print("ℹ️  Village3D.tsx មាន Screenshot/Export ស្រាប់ — គ្មានការកែ")
else:
    FILE.write_text(text, encoding="utf-8")
    print(f"🎉 កែរួចរាល់ ({changed} កន្លែង) → {FILE}")
