from pathlib import Path

# 1. ជួសជុល hospitalGeometry.ts
p1 = Path("src/components/hospitalGeometry.ts")
text1 = p1.read_text()

if "windowMaterial: windowMat" not in text1:
    text1 = text1.replace(
        "  return group;\n}\n\n// 2. គ្រែអ្នកជំងឺ",
        "  group.userData = { windowMaterial: windowMat };\n  return group;\n}\n\n// 2. គ្រែអ្នកជំងឺ"
    )

if "lampLight: light" not in text1:
    text1 = text1.replace(
        "  return lamp;\n}\n\n// 15. ចំណតឧទ្ធម្ភាគចក្រ",
        "  lamp.userData = { lampLight: light };\n  return lamp;\n}\n\n// 15. ចំណតឧទ្ធម្ភាគចក្រ"
    )

p1.write_text(text1)

# 2. ជួសជុល Hospital3D.tsx ដើម្បីបើកភ្លើងតាមផ្លូវ
p2 = Path("src/components/Hospital3D.tsx")
text2 = p2.read_text()

if "lamp1.traverse" not in text2:
    text2 = text2.replace(
        "      // បង្អួចអគារភ្លឺពេលយប់\n      if (windowMat) {",
        """      // អំពូលភ្លើងតាមផ្លូវ
      lamp1.traverse(child => {
        if (child instanceof THREE.PointLight) {
          child.intensity += ((isNightMode ? 2 : 0) - child.intensity) * 0.05;
        }
      });
      lamp2.traverse(child => {
        if (child instanceof THREE.PointLight) {
          child.intensity += ((isNightMode ? 2 : 0) - child.intensity) * 0.05;
        }
      });

      // បង្អួចអគារភ្លឺពេលយប់
      if (windowMat) {"""
    )

p2.write_text(text2)
print("✅ ជួសជុល Day/Night Mode រួចរាល់!")
