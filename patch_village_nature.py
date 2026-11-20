#!/usr/bin/env python3
"""បន្ថែមធាតុធម្មជាតិ (ភ្នំ, ព្រៃ, បឹង, ស្ពាន, ស្រះត្រី, មាន់, ចម្ការ) ចូល Village3D"""
import shutil
from pathlib import Path

FILE = Path("src/components/Village3D.tsx")
BACKUP = Path("src/components/Village3D.tsx.before-nature")

if not FILE.exists():
    raise SystemExit("❌ រកមិនឃើញ Village3D.tsx")

if BACKUP.exists():
    print(f"ℹ️  Backup មានស្រាប់: {BACKUP}")
else:
    shutil.copy2(FILE, BACKUP)
    print(f"✅ Backup: {BACKUP}")

text = FILE.read_text(encoding="utf-8")
changed = 0

# 1. Import ធាតុធម្មជាតិ
anchor_import = '''} from "./villageGeometry";'''
new_import = '''} from "./villageGeometry";
import {
  createMountain,
  createForest,
  createLake,
  createFishPond,
  createBridge,
  createChicken,
  createMixedFarm,
  createWindingRoad,
} from "./natureElements";'''
if "natureElements" not in text:
    if anchor_import not in text:
        raise SystemExit("❌ រកមិនឃើញ import villageGeometry")
    text = text.replace(anchor_import, new_import, 1)
    changed += 1
    print("✅ បន្ថែម import natureElements")

# 2. បន្ថែមធាតុធម្មជាតិក្រោយចម្ការបន្លែ
anchor_gardens = '''    gardens.forEach(([x, y, z]) => {
      const garden = createVegetableGarden(15);
      garden.position.set(x, y, z);
      scene.add(garden);
    });'''
new_nature = anchor_gardens + '''

    // ========== បរិស្ថានធម្មជាតិ ==========

    // ភ្នំ ៤ (ជ្រុងឆ្ងាយ)
    const mountains = [
      { pos: [-250, 0, -250], h: 60, r: 50, c: "#4a5568" },
      { pos: [250, 0, -250], h: 70, r: 55, c: "#5d6d7e" },
      { pos: [-280, 0, 200], h: 50, r: 40, c: "#4a5568" },
      { pos: [280, 0, 200], h: 55, r: 45, c: "#5d6d7e" },
    ];
    mountains.forEach(({ pos, h, r, c }) => {
      const m = createMountain(h, r, c);
      m.position.set(pos[0], h / 2, pos[2]);
      scene.add(m);
    });

    // ព្រៃឈើ ៣ កន្លែង
    scene.add(createForest(60, -200, 150, 100, 111));
    scene.add(createForest(60, 200, 150, 100, 222));
    scene.add(createForest(40, 0, -200, 120, 333));

    // បឹងធំ
    const lake = createLake(40);
    lake.position.set(-180, 0, -100);
    scene.add(lake);

    // ស្រះចិញ្ចឹមត្រី ៤ (ជិតផ្ទះនីមួយៗ)
    const ponds = [
      [-80, 0, 40],
      [80, 0, 40],
      [-80, 0, -40],
      [80, 0, -40],
    ];
    ponds.forEach(([x, y, z]) => {
      const pond = createFishPond(10);
      pond.position.set(x, y, z);
      scene.add(pond);
    });

    // ស្ពាន ២ (ឆ្លងប្រឡាយ)
    const bridge1 = createBridge(15, 5);
    bridge1.position.set(-40, 0, 0);
    bridge1.rotation.y = Math.PI / 2;
    scene.add(bridge1);

    const bridge2 = createBridge(15, 5);
    bridge2.position.set(40, 0, 0);
    bridge2.rotation.y = Math.PI / 2;
    scene.add(bridge2);

    // ចម្ការបន្លែចម្រុះ ៦ (ធំ)
    const mixedFarms = [
      [-130, 0, 150],
      [130, 0, 150],
      [-130, 0, -150],
      [130, 0, -150],
      [-150, 0, 60],
      [150, 0, 60],
    ];
    mixedFarms.forEach(([x, y, z]) => {
      const farm = createMixedFarm(25);
      farm.position.set(x, y, z);
      scene.add(farm);
    });

    // មាន់ ២០ ក្បាល (ជិតផ្ទះ)
    for (let i = 0; i < 20; i++) {
      const chicken = createChicken(i % 2 === 0 ? "#f39c12" : "#ffffff");
      const angle = (i / 20) * Math.PI * 2;
      const radius = 60 + (i % 3) * 10;
      chicken.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      chicken.rotation.y = angle;
      scene.add(chicken);
    }'''
if "createMountain" not in text.split("import")[-1]:
    if anchor_gardens not in text:
        raise SystemExit("❌ រកមិនឃើញ gardens forEach")
    text = text.replace(anchor_gardens, new_nature, 1)
    changed += 1
    print("✅ បន្ថែមធាតុធម្មជាតិ")

if changed == 0:
    print("ℹ️  Village3D មានធាតុធម្មជាតិស្រាប់")
else:
    FILE.write_text(text, encoding="utf-8")
    print(f"🎉 កែរួចរាល់ ({changed} កន្លែង) → {FILE}")
