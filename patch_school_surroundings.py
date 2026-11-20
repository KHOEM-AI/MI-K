#!/usr/bin/env python3
"""បន្ថែមផ្សារ + ផ្ទះជុំវិញ School3D"""
import re
import shutil
from pathlib import Path

FILE = Path("src/components/School3D.tsx")
BACKUP = Path("src/components/School3D.tsx.before-surroundings")

if not FILE.exists():
    raise SystemExit("❌ រកមិនឃើញ School3D.tsx")

if BACKUP.exists():
    print(f"ℹ️  Backup មានស្រាប់: {BACKUP}")
else:
    shutil.copy2(FILE, BACKUP)
    print(f"✅ Backup: {BACKUP}")

text = FILE.read_text(encoding="utf-8")
changed = 0

# ============ 1. Import createSchoolSurroundings ============
# រក import ពី schoolGeometry
import_pattern = re.compile(
    r'(import\s*\{[^}]*\}\s*from\s*["\']\.\/schoolGeometry["\'];?)',
    re.DOTALL
)
m = import_pattern.search(text)
if not m:
    raise SystemExit("❌ រកមិនឃើញ import ពី schoolGeometry")

if 'from "./villageGeometry"' not in text:
    new_import = '\nimport { createSchoolSurroundings } from "./villageGeometry";'
    text = text[:m.end()] + new_import + text[m.end():]
    changed += 1
    print("✅ បន្ថែម import createSchoolSurroundings")

# ============ 2. scene.add(createSchoolSurroundings()) ============
# រក "const school = createSchoolBuilding();" ហើយបន្ថែមក្រោយ scene.add(school)
anchor_pattern = re.compile(
    r'(const school\s*=\s*createSchoolBuilding\(\);[^\n]*scene\.add\(school\);)'
)
if 'createSchoolSurroundings()' not in text:
    m2 = anchor_pattern.search(text)
    if m2:
        insert_after = m2.end()
    else:
        # fallback: ក្រោយ scene.add(grass) ឬ ក្រោយ scene.add(flag)
        fallback = re.compile(
            r'(const flag\s*=\s*createFlagPole\(\);[^\n]*scene\.add\(flag\);)'
        )
        m3 = fallback.search(text)
        if not m3:
            raise SystemExit("❌ រកមិនឃើញទីតាំងសម្រាប់បន្ថែម")
        insert_after = m3.end()

    insert_text = "\n    // បរិវេណជុំវិញ (ផ្សារ ៤ + ផ្ទះ ១០)\n    scene.add(createSchoolSurroundings());"
    text = text[:insert_after] + insert_text + text[insert_after:]
    changed += 1
    print("✅ បន្ថែម scene.add(createSchoolSurroundings())")

if changed == 0:
    print("ℹ️  School3D មានផ្សារជុំវិញស្រាប់ — គ្មានការកែ")
else:
    FILE.write_text(text, encoding="utf-8")
    print(f"🎉 កែរួចរាល់ ({changed} កន្លែង) → {FILE}")
