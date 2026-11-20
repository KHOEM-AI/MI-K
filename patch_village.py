#!/usr/bin/env python3
"""បន្ថែម Village3D ចូល App.tsx ដោយសុវត្ថិភាព (មាន backup ស្វ័យប្រវត្តិ)"""
import shutil
from pathlib import Path

APP = Path("src/App.tsx")
BACKUP = Path("src/App.tsx.before-village")

if not APP.exists():
    raise SystemExit("❌ រកមិនឃើញ src/App.tsx")

if BACKUP.exists():
    print(f"ℹ️  Backup មានស្រាប់: {BACKUP}")
else:
    shutil.copy2(APP, BACKUP)
    print(f"✅ Backup: {BACKUP}")

text = APP.read_text(encoding="utf-8")
changed = 0

# ---- 1. lazy import ----
anchor_import = 'const School3D = lazy(() => import("./components/School3D"));'
new_import = anchor_import + '\nconst Village3D = lazy(() => import("./components/Village3D"));'
if "Village3D = lazy" not in text:
    if anchor_import not in text:
        raise SystemExit("❌ រកមិនឃើញបន្ទាត់ School3D import")
    text = text.replace(anchor_import, new_import, 1)
    changed += 1
    print("✅ បន្ថែម lazy import Village3D")

# ---- 2. useState ----
anchor_state = 'const [schoolOpen, setSchoolOpen] = useState(false);'
new_state = anchor_state + '\n  const [villageOpen, setVillageOpen] = useState(false);'
if "villageOpen" not in text:
    if anchor_state not in text:
        raise SystemExit("❌ រកមិនឃើញបន្ទាត់ schoolOpen useState")
    text = text.replace(anchor_state, new_state, 1)
    changed += 1
    print("✅ បន្ថែម useState villageOpen")

# ---- 3. ប៊ូតុង (បន្ថែមក្រោយប៊ូតុង School) ----
anchor_btn = '''          {schoolOpen ? "Close School" : "Open School 3D"}
        </button>'''
new_btn = anchor_btn + '''
        <button
          type="button"
          className="upload-button"
          onClick={() => setVillageOpen((open) => !open)}
        >
          {villageOpen ? "Close Village" : "Open Village 3D"}
        </button>'''
if "Open Village 3D" not in text:
    if anchor_btn not in text:
        raise SystemExit("❌ រកមិនឃើញប៊ូតុង School")
    text = text.replace(anchor_btn, new_btn, 1)
    changed += 1
    print("✅ បន្ថែមប៊ូតុង Open Village 3D")

# ---- 4. Suspense block ----
anchor_suspense = '''      {schoolOpen && (
        <Suspense fallback={<div className="studio-panel">Loading School...</div>}>
          <School3D />
        </Suspense>
      )}'''
new_suspense = anchor_suspense + '''

      {villageOpen && (
        <Suspense fallback={<div className="studio-panel">Loading Village...</div>}>
          <Village3D />
        </Suspense>
      )}'''
if "villageOpen &&" not in text:
    if anchor_suspense not in text:
        raise SystemExit("❌ រកមិនឃើញ Suspense block School")
    text = text.replace(anchor_suspense, new_suspense, 1)
    changed += 1
    print("✅ បន្ថែម Suspense block Village")

if changed == 0:
    print("ℹ️  App.tsx មាន Village3D ស្រាប់ — គ្មានការកែ")
else:
    APP.write_text(text, encoding="utf-8")
    print(f"🎉 កែរួចរាល់ ({changed} កន្លែង) → {APP}")
