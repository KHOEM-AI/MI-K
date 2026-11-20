#!/usr/bin/env python3
"""បន្ថែម Screenshot + Export GLB ទៅ Hospital3D និង School3D"""
import shutil
from pathlib import Path

HOSP = Path("src/components/Hospital3D.tsx")
SCHOOL = Path("src/components/School3D.tsx")

def backup(f: Path):
    b = Path(str(f) + ".before-export")
    if b.exists():
        print(f"ℹ️  Backup មានស្រាប់: {b}")
    else:
        shutil.copy2(f, b)
        print(f"✅ Backup: {b}")

# ==================== HOSPITAL ====================
print("\n=== Hospital3D ===")
backup(HOSP)
text = HOSP.read_text(encoding="utf-8")
changed = 0

# 1. import GLTFExporter
anchor = 'import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";'
new = anchor + '\nimport { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";'
if "GLTFExporter" not in text:
    if anchor not in text:
        raise SystemExit("❌ Hospital3D: រកមិនឃើញ OrbitControls import")
    text = text.replace(anchor, new, 1)
    changed += 1
    print("✅ បន្ថែម import GLTFExporter")

# 2. sceneRef ក្រោយ rendererRef
anchor = 'const rendererRef = useRef<THREE.WebGLRenderer | null>(null);'
new = anchor + '\n  const sceneRef = useRef<THREE.Scene | null>(null);\n  const [exportBusy, setExportBusy] = useState(false);'
if "sceneRef" not in text:
    if anchor not in text:
        raise SystemExit("❌ Hospital3D: រកមិនឃើញ rendererRef")
    text = text.replace(anchor, new, 1)
    changed += 1
    print("✅ បន្ថែម sceneRef + exportBusy")

# 3. sceneRef.current = scene (ក្រោយ const scene = new THREE.Scene())
anchor = 'const scene = new THREE.Scene();'
new = 'const scene = new THREE.Scene();\n    sceneRef.current = scene;'
if "sceneRef.current = scene;" not in text:
    if anchor not in text:
        raise SystemExit("❌ Hospital3D: រកមិនឃើញ scene")
    text = text.replace(anchor, new, 1)
    changed += 1
    print("✅ ភ្ជាប់ sceneRef")

# 4. exportGLB function ក្រោយ takeScreenshot
anchor = '''  const takeScreenshot = () => {
    if (!rendererRef.current) return;'''
if "const exportGLB" not in text:
    if anchor not in text:
        raise SystemExit("❌ Hospital3D: រកមិនឃើញ takeScreenshot")
    # រកចុងបញ្ចប់នៃ takeScreenshot function
    export_fn = '''
  const exportGLB = async () => {
    const scene = sceneRef.current;
    if (!scene || exportBusy) return;
    setExportBusy(true);
    try {
      const exporter = new GLTFExporter();
      const result = await exporter.parseAsync(scene, { binary: true });
      const blob = new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `hospital-${Date.now()}.glb`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export GLB failed:", err);
      alert("Export បរាជ័យ");
    } finally {
      setExportBusy(false);
    }
  };
'''
    # រក "};" ដំបូងបន្ទាប់ពី takeScreenshot
    idx = text.index(anchor) + len(anchor)
    # រក "};" បន្ទាប់
    end_idx = text.index("  };", idx) + len("  };")
    text = text[:end_idx] + export_fn + text[end_idx:]
    changed += 1
    print("✅ បន្ថែម exportGLB function")

# 5. button ក្រោយ screenshot button
anchor = '''        <button onClick={takeScreenshot} style={{ ...btnStyle, backgroundColor: "#16a085" }}>
          <SvgCamera /> Screenshot
        </button>'''
if "Export GLB" not in text:
    if anchor not in text:
        raise SystemExit("❌ Hospital3D: រកមិនឃើញ screenshot button")
    new_btn = anchor + '''
        <button onClick={exportGLB} disabled={exportBusy} style={{ ...btnStyle, backgroundColor: exportBusy ? "#7f8c8d" : "#8e44ad", cursor: exportBusy ? "wait" : "pointer" }}>
          🎬 {exportBusy ? "កំពុង Export..." : "Export GLB"}
        </button>'''
    text = text.replace(anchor, new_btn, 1)
    changed += 1
    print("✅ បន្ថែម Export GLB button")

HOSP.write_text(text, encoding="utf-8")
print(f"🎉 Hospital3D: {changed} កន្លែងកែ")

# ==================== SCHOOL ====================
print("\n=== School3D ===")
backup(SCHOOL)
text = SCHOOL.read_text(encoding="utf-8")
changed = 0

# 1. import GLTFExporter
anchor = 'import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";'
new = anchor + '\nimport { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";'
if "GLTFExporter" not in text:
    if anchor not in text:
        raise SystemExit("❌ School3D: រកមិនឃើញ OrbitControls import")
    text = text.replace(anchor, new, 1)
    changed += 1
    print("✅ បន្ថែម import GLTFExporter")

# 2. refs + state ក្រោយ nightRef
anchor = 'const nightRef = useRef(isNight);\n  nightRef.current = isNight;'
new = anchor + '\n  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);\n  const sceneRef = useRef<THREE.Scene | null>(null);\n  const [busy, setBusy] = useState(false);'
if "rendererRef" not in text:
    if anchor not in text:
        raise SystemExit("❌ School3D: រកមិនឃើញ nightRef")
    text = text.replace(anchor, new, 1)
    changed += 1
    print("✅ បន្ថែម rendererRef + sceneRef + busy")

# 3. ភ្ជាប់ refs
anchor = 'const scene = new THREE.Scene();\n    scene.background = new THREE.Color(0x87ceeb);'
new = 'const scene = new THREE.Scene();\n    sceneRef.current = scene;\n    scene.background = new THREE.Color(0x87ceeb);'
if "sceneRef.current = scene;" not in text:
    if anchor not in text:
        raise SystemExit("❌ School3D: រកមិនឃើញ scene")
    text = text.replace(anchor, new, 1)
    changed += 1
    print("✅ ភ្ជាប់ sceneRef")

anchor = 'const renderer = new THREE.WebGLRenderer({ antialias: true });\n    renderer.setSize(window.innerWidth, window.innerHeight);'
new = 'const renderer = new THREE.WebGLRenderer({ antialias: true });\n    rendererRef.current = renderer;\n    renderer.setSize(window.innerWidth, window.innerHeight);'
if "rendererRef.current = renderer;" not in text:
    if anchor not in text:
        raise SystemExit("❌ School3D: រកមិនឃើញ renderer")
    text = text.replace(anchor, new, 1)
    changed += 1
    print("✅ ភ្ជាប់ rendererRef")

# 4. functions មុន return
anchor = '''  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>'''
new = '''  const takeScreenshot = () => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const dataURL = renderer.domElement.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `school-${Date.now()}.png`;
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
      link.download = `school-${Date.now()}.glb`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export GLB failed:", err);
      alert("Export បរាជ័យ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>'''
if "takeScreenshot" not in text:
    if anchor not in text:
        raise SystemExit("❌ School3D: រកមិនឃើញ return block")
    text = text.replace(anchor, new, 1)
    changed += 1
    print("✅ បន្ថែម takeScreenshot + exportGLB")

# 5. buttons ខាងលើ night button
anchor = '''      <button
        onClick={() => setIsNight(!isNight)}'''
new = '''      <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", gap: 8 }}>
        <button
          onClick={takeScreenshot}
          style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: "#16a085", color: "#fff", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}
        >
          📸 Screenshot
        </button>
        <button
          onClick={exportGLB}
          disabled={busy}
          style={{ padding: "10px 16px", borderRadius: "8px", border: "none", backgroundColor: busy ? "#7f8c8d" : "#8e44ad", color: "#fff", cursor: busy ? "wait" : "pointer", fontWeight: "bold", fontSize: "14px" }}
        >
          {busy ? "⏳ កំពុង Export..." : "🎬 Export GLB"}
        </button>
      </div>
      <button
        onClick={() => setIsNight(!isNight)}'''
if "📸 Screenshot" not in text:
    if anchor not in text:
        raise SystemExit("❌ School3D: រកមិនឃើញ night button")
    text = text.replace(anchor, new, 1)
    changed += 1
    print("✅ បន្ថែម 2 ប៊ូតុង")

SCHOOL.write_text(text, encoding="utf-8")
print(f"🎉 School3D: {changed} កន្លែងកែ")
print("\n✅ រួចរាល់ទាំងអស់!")
