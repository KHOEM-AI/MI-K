import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# 1. បន្ថែម Lazy Load សម្រាប់ Hospital3D
if "Hospital3D" not in content:
    content = content.replace(
        'const KaraokeViewer = lazy(() => import("./components/KaraokeViewer"));',
        'const KaraokeViewer = lazy(() => import("./components/KaraokeViewer"));\nconst Hospital3D = lazy(() => import("./components/Hospital3D"));'
    )

# 2. បន្ថែម State ថ្មី
if "hospitalOpen" not in content:
    content = content.replace(
        'const [karaokeOpen, setKaraokeOpen] = useState(false);',
        'const [karaokeOpen, setKaraokeOpen] = useState(false);\n  const [hospitalOpen, setHospitalOpen] = useState(false);'
    )

# 3. បន្ថែមប៊ូតុងបើកមន្ទីរពេទ្យ (នៅក្បែរ Open Characters)
if 'Open Hospital' not in content:
    content = content.replace(
        '{charactersOpen ? "Close Characters" : "Open Characters"}\n        </button>',
        '''{charactersOpen ? "Close Characters" : "Open Characters"}
        </button>
        <button
          type="button"
          className="upload-button"
          onClick={() => setHospitalOpen((open) => !open)}
        >
          {hospitalOpen ? "Close Hospital" : "Open Hospital 3D"}
        </button>'''
    )

# 4. បង្ហាញ Hospital3D នៅពេលចុច (នៅក្បែរ Characters)
if '<Hospital3D />' not in content:
    content = content.replace(
        '{charactersOpen && (',
        '''{hospitalOpen && (
        <Suspense fallback={<div className="studio-panel">Loading Hospital...</div>}>
          <Hospital3D />
        </Suspense>
      )}

      {charactersOpen && ('''
    )

with open("src/App.tsx", "w") as f:
    f.write(content)

print("✅ កែសម្រួល App.tsx រួចរាល់!")
