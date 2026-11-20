#!/usr/bin/env python3
# install-infra-v1.py - KHOEM-AI MI-K-VISION-3D: railway, trains (VIP), bridges, flyover, forest, corridor
# របៀបប្រើ: cd ~/MI-K-VISION-3D && python3 ~/downloads/install-infra-v1.py
import base64, zlib, os, re, shutil, subprocess, sys, time
ROOT = os.path.expanduser("~/MI-K-VISION-3D")
SRC = os.path.join(ROOT, "src", "components")
NEW = os.path.join(SRC, "studioInfra.ts")
TS = time.strftime("%Y%m%d-%H%M%S")
PAYLOAD = """
eNrtfWlz20iy4Hf/Cown3gvAItkESICU1HaH7bbbveN2ey2/bnsUXAcIQhJHvAYgJVI9/u+bR524SNmembcvdg6LqLuysrKyMrMy
v/vOydebyXT58+Iiizvr3Gk7f3n164tf2k9/dno/OmeUeeJk8XR2G+9azhp+LfKWM86mk8sUflwsszRft5xkmUHSMus8+O47x+92
/8NZZcsknWyyeOa476+yNO38LXeWi9nOg1rw2XLydHbRnseTtOP4zmYxXTuP4cc8XWdp58F6t0qd9z1Iwl/LC2c6Xy2ztftwjW09
9E65xG9YopDV+S1N1susJ4o8+6miyLPNxUWa/ZQusbudKPlLvH5fURaS02waz0Spn7JVRaGfsuVmJUo8z24qSjzfZDfp9zVjfSKq
vsX5nC8283GatRz770iUeffTs/2FfrmGMu5Vuj2BJc6mi8uWAyO8vPrhRFWAqccz4zvdwvLC97sUVnPyvay2WVwvlreLJ57z+AmB
6PTBg3SLs6ClcQh3zq5i+Pn4geP8w3ko0OWh8ftTgrOnlNkyWc6X66n4XMV5ni4u08z++nQzXVFKEo+Xy5zLMvql64fcD2PhJ+zi
ofkNTWdmQp7G5ud8uVmsoSEzLYHVuDYTZvF1Krq5mO2WskXGdx6YQPmHGh7JcpGvnZ/fvHz39NPZq6dvX5ydGOA5H+GyQZsKQK0i
fFoWeFomdFpF4LQ0bFoGaFrYgQmZVgEwLQsurTJYWgWotGygUAcSJi0FkpYBkdYDQEMBk4vNIllPlwtnmmtQuLlESw9+QJaJRX84
WbreZAvHNSHpxLmocj7yOtNFMttM0tzNvVPncxX83757cfbiPSzAH84inqeyv1Mnx07MdXE+q5WRZR++42Vx3mdxghAQlTRqf25V
FX8uVrFQXGK/Xem1Wmnn1fTyqn22StOJUdncKHbNtxIRnOfLOLky6hi7ya7y289v6wvzZrMr/DrO0+wmpqV7rvBMVlW70q70cjOb
IcymC+cMcVGVV+hZATjnt2k82SRmcWtnF2ogEkMfmzx3nlGxinpMAeyKZ2mME5ml7bN1vEsntbWJXNh1fxF7w3maJVe1FTVhsWs/
x20Eh+lykdbWFQSogCGw32DMmzxF5KqrSruyuBC8P50XsxTWECb7bhmbuKVoWqGa3MuqnKB3djFEVxwRrd5ztes1dsgkrAekAJmC
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
"""
def die(m):
    print("ABORT (មិនបានកែអ្វីទេ):", m); sys.exit(1)
def rd(p):
    with open(p, encoding="utf-8") as f: return f.read()
def wr(p, s):
    with open(p, "w", encoding="utf-8") as f: f.write(s)
if not os.path.isdir(SRC): die("រកមិនឃើញ " + SRC)
if os.path.exists(NEW) and "INFRA_SHAPES" in rd(NEW): print("ធ្លាប់ដំឡើងរួចហើយ (studioInfra.ts មាន) - គ្មានអ្វីត្រូវធ្វើ"); sys.exit(0)
code = zlib.decompress(base64.b64decode("".join(PAYLOAD.split()))).decode("utf-8")
P = {n: os.path.join(SRC, n) for n in ("Studio3D.tsx", "studioTypes.ts", "studioConstants.ts")}
for p in P.values():
    if not os.path.exists(p): die("ខ្វះឯកសារ " + p)
S3, TY, CO = rd(P["Studio3D.tsx"]), rd(P["studioTypes.ts"]), rd(P["studioConstants.ts"])
# ---- validate anchors ----
if S3.count('} else if (item.shape === "khoem") {') != 1: die('Studio3D render anchor: រក khoem branch មិនបាន 1 ដង (' + str(S3.count('} else if (item.shape === "khoem") {')) + ")")
exp = list(re.finditer(r'^([ \t]*)if \(item\.shape === "airplane" \|\| item\.shape === "helicopter"\) \{[ \t]*$', S3, re.M))
if len(exp) != 2: die("Studio3D export anchors: រកឃើញ " + str(len(exp)) + " (ត្រូវការ 2)")
if not re.search(r'from "\./studioGeometry";', S3): die('Studio3D: រក import "./studioGeometry" មិនឃើញ')
if TY.count('| "monastery";') != 1: die('studioTypes: anchor | "monastery"; មិនត្រឹមត្រូវ')
tail = '  { name: "Monastery", shape: "monastery" },\n];'
if CO.count(tail) != 1: die("studioConstants: preset anchor មិនត្រឹមត្រូវ")
# ---- derive export block from existing airplane block ----
def block_at(s, m):
    i = m.start(); j = s.index("{", m.start()); d = 0; k = j
    while True:
        c = s[k]
        if c == "{": d += 1
        elif c == "}":
            d -= 1
            if d == 0: break
        k += 1
    return i, k + 1
new_s3 = S3
for m in reversed(exp):
    a, b = block_at(new_s3, m); blk = new_s3[a:b]
    calls = list(re.finditer(r'create\w+\(THREE[^;]*?\)\s*;', blk))
    if len(calls) != 1:
        print("--- block ---\n" + blk + "\n---"); die("export block មានការហៅ create... " + str(len(calls)) + " (ត្រូវការ 1)")
    nb = blk.replace(calls[0].group(0), "createInfraGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);")
    nb = re.sub(r'^([ \t]*)if \(.*?\) \{', r'\1if (isInfraShape(item.shape)) {', nb, count=1)
    new_s3 = new_s3[:a] + nb + "\n" + blk + new_s3[b:]
new_s3 = new_s3.replace('} else if (item.shape === "khoem") {',
  '} else if (isInfraShape(item.shape)) {\n        obj = createInfraGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);\n      } else if (item.shape === "khoem") {', 1)
im = re.search(r'from "\./studioGeometry";', new_s3)
new_s3 = new_s3[:im.end()] + '\nimport { createInfraGeometry, isInfraShape } from "./studioInfra";' + new_s3[im.end():]
new_ty = 'import type { InfraShape } from "./studioInfra";\n' + TY.replace('| "monastery";', '| "monastery"\n  | InfraShape;', 1)
new_co = 'import { INFRA_PRESETS } from "./studioInfra";\n' + CO.replace(tail, '  { name: "Monastery", shape: "monastery" },\n  ...INFRA_PRESETS,\n];', 1)
# ---- backup + write ----
bk = {}
for k, p in P.items():
    bk[p] = p + ".pre-infra-" + TS; shutil.copy2(p, bk[p])
def rollback():
    for p, b in bk.items(): shutil.copy2(b, p)
    if os.path.exists(NEW): os.remove(NEW)
    print("ROLLBACK រួចរាល់ - ឯកសារត្រឡប់ដូចដើម")
wr(NEW, code); wr(P["Studio3D.tsx"], new_s3); wr(P["studioTypes.ts"], new_ty); wr(P["studioConstants.ts"], new_co)
print("សរសេររួច - កំពុងពិនិត្យ npm run typecheck ...")
r = subprocess.run("npm run typecheck", shell=True, cwd=ROOT, capture_output=True, text=True)
print((r.stdout + r.stderr)[-3000:])
if r.returncode != 0:
    rollback(); sys.exit(1)
d = subprocess.run("git diff --check", shell=True, cwd=ROOT, capture_output=True, text=True)
print("git diff --check:", "OK" if d.returncode == 0 else d.stdout[-800:])
print("\nជោគជ័យ. ឯកសារកែ: studioInfra.ts (ថ្មី), Studio3D.tsx, studioTypes.ts, studioConstants.ts")
print("បន្ទាប់: npm run build && npm test  រួចបើក Studio ជ្រើស Railway/Bridge/Train ...")
