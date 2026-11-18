from pathlib import Path
import shutil

p = Path("src/components/Studio3D.tsx")
s = p.read_text()

# Backup មុនកែ
backup = Path("src/components/Studio3D.tsx.v2-backup")
shutil.copy2(p, backup)
print("Backup created:", backup)

plant2 = (
    'item.shape === "cactus" || item.shape === "pinetree" || '
    'item.shape === "sunflower" || item.shape === "lotus" || '
    'item.shape === "grass" || item.shape === "vine"'
)
env = (
    'item.shape === "rock" || item.shape === "pond" || '
    'item.shape === "hill" || item.shape === "groundpatch"'
)

# Viewport
viewport_anchor = '} else if (item.shape === "khoem") {'
viewport_code = f'''}} else if ({plant2}) {{
              obj = createPlantGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            }} else if ({env}) {{
              obj = createEnvironmentGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            }} else if (item.shape === "khoem") {{'''

if 'obj = createPlantGeometry2(THREE' not in s:
    if viewport_anchor not in s:
        raise SystemExit("ERROR: Viewport anchor not found")
    s = s.replace(viewport_anchor, viewport_code, 1)
    print("OK: Viewport branches added")
else:
    print("SKIP: Viewport branch already exists")

# HTML and GLB export
def add_export(source, add_call, label):
    marker = f'{add_call}(plantGroup);'
    pos = source.find(marker)
    if pos == -1:
        raise SystemExit(f"ERROR: {label} plant export not found")

    anchor = 'if (item.shape === "khoem") {'
    anchor_pos = source.find(anchor, pos + len(marker))
    if anchor_pos == -1:
        raise SystemExit(f"ERROR: {label} khoem anchor not found")

    section = source[pos:anchor_pos]
    if 'const plant2Group = createPlantGeometry2' in section:
        print(f"SKIP: {label} branches already exist")
        return source

    code = f'''if ({plant2}) {{
            const plant2Group = createPlantGeometry2(THREE, item.shape, item.color, item.metalness, item.roughness);
            plant2Group.position.set(item.position.x, item.position.y, item.position.z);
            plant2Group.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            plant2Group.scale.set(item.scale.x, item.scale.y, item.scale.z);
            plant2Group.name = item.name;
            {add_call}(plant2Group);
            return;
          }}

          if ({env}) {{
            const environmentGroup = createEnvironmentGeometry(THREE, item.shape, item.color, item.metalness, item.roughness);
            environmentGroup.position.set(item.position.x, item.position.y, item.position.z);
            environmentGroup.rotation.set(item.rotation.x, item.rotation.y, item.rotation.z);
            environmentGroup.scale.set(item.scale.x, item.scale.y, item.scale.z);
            environmentGroup.name = item.name;
            {add_call}(environmentGroup);
            return;
          }}

          '''

    return source[:anchor_pos] + code + source[anchor_pos:]

s = add_export(s, "exportScene.add", "HTML")
s = add_export(s, "exportScene!.add", "GLB")

p.write_text(s)
print("DONE: Studio3D.tsx updated")
