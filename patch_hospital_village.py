#!/usr/bin/env python3
"""បន្ថែមភូមិជុំវិញ Hospital3D"""
import shutil
from pathlib import Path

FILE = Path("src/components/Hospital3D.tsx")
BACKUP = Path("src/components/Hospital3D.tsx.before-village")

if BACKUP.exists():
    print(f"ℹ️  Backup មានស្រាប់: {BACKUP}")
else:
    shutil.copy2(FILE, BACKUP)
    print(f"✅ Backup: {BACKUP}")

text = FILE.read_text(encoding="utf-8")
changed = 0

# 1. Import createHospitalSurroundings
# រក import ដំបូងបំផុតពី hospitalGeometry
import re
m = re.search(r'import\s*\{[^}]*\}\s*from\s*["\']\./hospitalGeometry["\'];', text)
if not m:
    raise SystemExit("❌ រកមិនឃើញ import ពី hospitalGeometry")

# បន្ថែម import ថ្មីក្រោយ
new_import = '\nimport { createHospitalSurroundings } from "./villageGeometry";'
if "createHospitalSurroundings" not in text:
    text = text[:m.end()] + new_import + text[m.end():]
    changed += 1
    print("✅ បន្ថែម import createHospitalSurroundings")

# 2. ហៅ function ក្នុង scene (ក្រោយ scene.add ដំបូងៗ)
# រក "scene.add(create...)" ដំបូង
anchor = 'scene.add(new THREE.AmbientLight'
if "createHospitalSurroundings()" not in text.split("import")[-1]:
    # បន្ថែមក្រោយ ambient light
    if anchor in text:
        idx = text.index(anchor)
        # រកចុងបញ្ចប់នៃ statement
        end = text.index(";", idx) + 1
        text = text[:end] + "\n\n    // បរិវេណជុំវិញ (ភូមិតូច)\n    scene.add(createHospitalSurroundings());" + text[end:]
        changed += 1
        print("✅ បន្ថែម scene.add(createHospitalSurroundings())")
    else:
        raise SystemExit("❌ រកមិនឃើញ ambient light")

FILE.write_text(text, encoding="utf-8")
print(f"🎉 កែរួចរាល់ ({changed} កន្លែង) → {FILE}")
