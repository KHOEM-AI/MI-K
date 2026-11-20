#!/usr/bin/env python3
"""បន្ថែមភូមិជុំវិញ Hospital3D (កែ version ២ — ត្រឹមត្រូវ)"""
import re
import shutil
from pathlib import Path

FILE = Path("src/components/Hospital3D.tsx")
BACKUP = Path("src/components/Hospital3D.tsx.before-village-v2")

if not FILE.exists():
    raise SystemExit("❌ រកមិនឃើញ Hospital3D.tsx")

if BACKUP.exists():
    print(f"ℹ️  Backup មានស្រាប់: {BACKUP}")
else:
    shutil.copy2(FILE, BACKUP)
    print(f"✅ Backup: {BACKUP}")

text = FILE.read_text(encoding="utf-8")
changed = 0

# ============ 1. Import createHospitalSurroundings ============
# រក import block ពី hospitalGeometry (អាចមានច្រើនបន្ទាត់)
import_pattern = re.compile(
    r'(import\s*\{[^}]*\}\s*from\s*["\']\.\/hospitalGeometry["\'];?)',
    re.DOTALL
)
m = import_pattern.search(text)
if not m:
    raise SystemExit("❌ រកមិនឃើញ import ពី hospitalGeometry")

if 'from "./villageGeometry"' not in text:
    new_import = '\nimport { createHospitalSurroundings } from "./villageGeometry";'
    text = text[:m.end()] + new_import + text[m.end():]
    changed += 1
    print("✅ បន្ថែម import createHospitalSurroundings")

# ============ 2. scene.add(createHospitalSurroundings()) ============
# រកបន្ទាត់ "const hospital = createHospitalBuilding();" ឬ "scene.add(hospital)"
# បន្ថែមក្រោយ scene.add(hospital)
anchor_pattern = re.compile(
    r'(const hospital\s*=\s*createHospitalBuilding\(\);[^\n]*scene\.add\(hospital\);)'
)
if 'createHospitalSurroundings()' not in text:
    m2 = anchor_pattern.search(text)
    if m2:
        insert_after = m2.end()
    else:
        # fallback: បន្ថែមក្រោយ scene.add(ambientLight)
        fallback = re.compile(
            r'(const ambientLight\s*=\s*new THREE\.AmbientLight\([^)]*\);[^\n]*)'
        )
        m3 = fallback.search(text)
        if not m3:
            raise SystemExit("❌ រកមិនឃើញទីតាំងសម្រាប់បន្ថែម (ambient/hospital)")
        insert_after = m3.end()

    insert_text = "\n\n    // បរិវេណជុំវិញ (ភូមិតូច ២៥ ខ្នង + ផ្សារ ២ + ដើមឈើ ១២)\n    scene.add(createHospitalSurroundings());"
    text = text[:insert_after] + insert_text + text[insert_after:]
    changed += 1
    print("✅ បន្ថែម scene.add(createHospitalSurroundings())")

if changed == 0:
    print("ℹ️  Hospital3D មានភូមិជុំវិញស្រាប់ — គ្មានការកែ")
else:
    FILE.write_text(text, encoding="utf-8")
    print(f"🎉 កែរួចរាល់ ({changed} កន្លែង) → {FILE}")
