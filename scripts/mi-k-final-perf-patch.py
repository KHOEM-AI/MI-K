from pathlib import Path
from datetime import datetime
import re
import shutil
import sys

root = Path.home() / "MI-K-VISION-3D"

files = [
    "src/components/School3D.tsx",
    "src/components/Hospital3D.tsx",
    "src/components/Village3D.tsx",
]

backup = root / (
    "backup-perf-" + datetime.now().strftime("%Y%m%d-%H%M%S")
)
backup.mkdir(parents=True)

original = {}
for name in files:
    src = root / name
    if not src.is_file():
        sys.exit(f"STOP: missing {name}")
    original[name] = src.read_text()
    dst = backup / name
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

changes = {}

# SCHOOL
s = original[files[0]]
s, n = re.subn(
    r'const animate = \(\) => \{',
    'const dayBg = new THREE.Color(0x87ceeb);\n'
    '    const nightBg = new THREE.Color(0x0a1128);\n'
    '    const animate = () => {',
    s, count=1
)
if n != 1:
    sys.exit("STOP: School animate not found")

s, n = re.subn(
    r'const targetBg = night \? new THREE\.Color\(0x0a1128\) : new THREE\.Color\(0x87ceeb\);',
    'const targetBg = night ? nightBg : dayBg;',
    s, count=1
)
if n != 1:
    sys.exit("STOP: School targetBg not found")
changes[files[0]] = s

# HOSPITAL
s = original[files[1]]
s, n = re.subn(
    r'const animate = \(\) => \{',
    'const dayBg = new THREE.Color(0x87ceeb);\n'
    '    const nightBg = new THREE.Color(0x0a1128);\n'
    '    const followOffset = new THREE.Vector3(15, 10, 15);\n'
    '    const targetCamPos = new THREE.Vector3();\n'
    '    const animate = () => {',
    s, count=1
)
if n != 1:
    sys.exit("STOP: Hospital animate not found")

s, n = re.subn(
    r'const targetBg = isNightMode \? new THREE\.Color\(0x0a1128\) : new THREE\.Color\(0x87ceeb\);',
    'const targetBg = isNightMode ? nightBg : dayBg;',
    s, count=1
)
if n != 1:
    sys.exit("STOP: Hospital targetBg not found")

s, n = re.subn(
    r'const offset = new THREE\.Vector3\(15, 10, 15\);\s*const targetCamPos = helicopter\.position\.clone\(\)\.add\(offset\);',
    'targetCamPos.copy(helicopter.position).add(followOffset);',
    s, count=1
)
if n != 1:
    sys.exit("STOP: Hospital follow camera block not found")
changes[files[1]] = s

# VILLAGE
s = original[files[2]]
s, n = re.subn(
    r'const animate = \(\) => \{',
    'const trafficPhases: number[] = [];\n'
    '    const animate = () => {',
    s, count=1
)
if n != 1:
    sys.exit("STOP: Village animate not found")

s, n = re.subn(
    r'const phases = trafficLightsRef\.current\.map\(\(tl\) => tl\.phase\);\s*updateSmartTraffic\(smartTrafficRef\.current, phases, delta\);',
    'trafficPhases.length = trafficLightsRef.current.length;\n'
    '        for (let i = 0; i < trafficLightsRef.current.length; i++) {\n'
    '          trafficPhases[i] = trafficLightsRef.current[i].phase;\n'
    '        }\n'
    '        updateSmartTraffic(smartTrafficRef.current, trafficPhases, delta);',
    s, count=1
)
if n != 1:
    sys.exit("STOP: Village traffic phases block not found")
changes[files[2]] = s

# Write only after all checks have passed.
for name, content in changes.items():
    (root / name).write_text(content)
    print("PATCHED:", name)

print("BACKUP:", backup)
print("PATCH COMPLETE")
