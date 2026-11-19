import { lazy, Suspense, useEffect, useState } from "react";
import { saveAsset, getAssets, deleteAsset } from "./lib/storage.mjs";
import { createBackupJSON, restoreBackupJSON } from "./lib/backup.mjs";

type Asset = {
  id: string;
  file: File;
  kind: "image" | "model";
};

const ModelViewer = lazy(() => import("./components/ModelViewer"));
const Studio3D = lazy(() => import("./components/Studio3D"));
const Character3D = lazy(() => import("./components/Character3D"));

// Prefetch Studio3D on hover to make opening instant
const prefetchStudio3D = () => {
  import("./components/Studio3D");
};





type KIconName = "sun" | "moon" | "flashlight" | "car" | "cube";

function KIcon({ name }: { name: KIconName }) {
  return (
    <svg
      className={`k-icon k-icon-${name}`}
      viewBox="0 0 48 48"
      width="25"
      height="25"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "sun" && (
        <>
          <circle cx="24" cy="24" r="8" />
          <path d="M24 3v6 M24 39v6 M3 24h6 M39 24h6 M9.2 9.2l5 5 M33.8 33.8l5 5 M38.8 9.2l-5 5 M14.2 33.8l-5 5" />
        </>
      )}
      {name === "moon" && (
        <path d="M35 31A17 17 0 0 1 17 7a18 18 0 1 0 18 24Z" />
      )}
      {name === "flashlight" && (
        <>
          <path d="M17 8h14l4 10H13l4-10Z" />
          <path d="M16 18h16l-3 23H19l-3-23Z" />
          <path d="M20 25h8 M21 32h6" />
        </>
      )}
      {name === "car" && (
        <>
          <path d="m8 27 4-11h24l4 11v10H8V27Z" />
          <path d="M12 27h24 M16 16l-3 11 M32 16l3 11" />
          <circle cx="15" cy="37" r="3" />
          <circle cx="33" cy="37" r="3" />
        </>
      )}
      {name === "cube" && (
        <>
          <path d="m24 4 18 10v20L24 44 6 34V14L24 4Z" />
          <path d="m6 14 18 10 18-10 M24 24v20 M15 9l18 10" />
        </>
      )}
    </svg>
  );
}

function ImageViewer({ file }: { file: File }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url ? <img className="image-viewer" src={url} alt={file.name} /> : null;
}


export default function App() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [charactersOpen, setCharactersOpen] = useState(false);
  const [theme, setTheme] = useState<"day" | "night">(() => {
    try {
      return localStorage.getItem("khoem-ai-theme") === "day"
        ? "day"
        : "night";
    } catch {
      return "night";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("khoem-ai-theme", theme);
    } catch (error) {
      console.warn("Theme preference could not be saved:", error);
    }
  }, [theme]);
  const defaultColors = {
    accent: "#087fce",
    background: "#080e19",
    surface: "#111e31",
    sun: "#f5b942",
    moon: "#829cff",
    flashlight: "#f5b942",
    car: "#43b9ff",
    cube: "#55d6ad",
  };

  const [colors, setColors] = useState(defaultColors);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("khoem-ai-colors");
      if (saved) {
        const parsed = JSON.parse(saved);
        setColors((old) => ({ ...old, ...parsed }));
      }
    } catch (error) {
      console.warn("Could not load saved colors:", error);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const variables: Record<string, string> = {
      "--ka-accent": colors.accent,
      "--ka-background": colors.background,
      "--ka-surface": colors.surface,
      "--ka-sun": colors.sun,
      "--ka-moon": colors.moon,
      "--ka-flashlight": colors.flashlight,
      "--ka-car": colors.car,
      "--ka-cube": colors.cube,
    };

    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    try {
      localStorage.setItem("khoem-ai-colors", JSON.stringify(colors));
    } catch (error) {
      console.warn("Could not save colors:", error);
    }
  }, [colors]);

  function updateColor(key: keyof typeof defaultColors, value: string) {
    setColors((old) => ({ ...old, [key]: value }));
  }

  function resetColors() {
    setColors(defaultColors);
  }


  useEffect(() => {
    getAssets().then(saved => {
      setAssets(saved);
      setStorageReady(true);
    }).catch(error => console.error("Storage load failed:", error));
  }, []);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [filter, setFilter] = useState("all");
  const [backupMessage, setBackupMessage] = useState("");
  const [search, setSearch] = useState("");

  function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(event.target.files || []);

    const valid = incoming.filter((file) => {
      const name = file.name.toLowerCase();
      return (
        /\.(png|jpe?g|webp|gif)$/i.test(name) ||
        /\.(glb|gltf)$/i.test(name)
      );
    });

    const added: Asset[] = valid.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      kind: /\.(glb|gltf)$/i.test(file.name) ? "model" : "image",
    }));

    setAssets((old) => [...old, ...added]);
    added.forEach(asset => saveAsset(asset).catch(console.error));
    if (added.length) setSelected(added[0]);

    event.target.value = "";
  }

  async function handleExport() {
    try {
      setBackupMessage("Preparing backup...");
      const json = await createBackupJSON(assets);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `KHOEM-AI-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupMessage(`Exported ${assets.length} assets successfully.`);
    } catch (error) {
      console.error("Export failed:", error);
      setBackupMessage("Export failed. Please try again.");
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      setBackupMessage("Importing backup...");
      const imported = await restoreBackupJSON(await file.text());

      for (const asset of imported) {
        await saveAsset(asset);
      }

      setAssets((old) => [...old, ...imported]);

      if (imported.length) {
        setSelected(imported[0]);
      }

      setBackupMessage(`Imported ${imported.length} assets successfully.`);
    } catch (error) {
      console.error("Import failed:", error);
      setBackupMessage(
        error instanceof Error ? error.message : "Import failed."
      );
    }
  }

  function removeAsset(id: string) {
    setAssets((old) => old.filter((asset) => asset.id !== id));
    deleteAsset(id).catch(console.error);
    if (selected?.id === id) setSelected(null);
  }

  const visibleAssets = assets.filter((asset) => {
    const matchesFilter = filter === "all" || asset.kind === filter;
    const matchesSearch = asset.file.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <main className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">KA</div>
          <div>
            <h1>KHOEM-AI</h1>
            <p>IMAGE & 3D ASSET LIBRARY</p>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="status">ASSET WORKSPACE</span>
          <button
            type="button"
            className="theme-toggle settings-toggle"
            onClick={() => setSettingsOpen((open) => !open)}
            aria-expanded={settingsOpen}
          >
            <KIcon name="cube" />
            <span>Colors</span>
          </button>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme((value) => value === "night" ? "day" : "night")}
            aria-label={theme === "night" ? "Switch to day mode" : "Switch to night mode"}
            title={theme === "night" ? "Day Mode" : "Night Mode"}
          >
            <KIcon name={theme === "night" ? "sun" : "moon"} />
            <span>{theme === "night" ? "Day" : "Night"}</span>
          </button>
        </div>
      </header>

      {settingsOpen && (
        <section className="color-settings">
          <div className="color-settings-heading">
            <div>
              <p className="eyebrow">KHOEM-AI PERSONALIZATION</p>
              <h3>Color Settings</h3>
              <p>កំណត់ពណ៌កម្មវិធីតាមចំណង់ចំណូលចិត្ត។</p>
            </div>
            <button
              type="button"
              className="filter"
              onClick={resetColors}
            >
              Reset Colors
            </button>
          </div>

          <div className="color-grid">
            {([
              ["accent", "Button & Accent"],
              ["background", "App Background"],
              ["surface", "Card Background"],
              ["sun", "Sun SVG"],
              ["moon", "Moon SVG"],
              ["flashlight", "Flashlight SVG"],
              ["car", "Car SVG"],
              ["cube", "3D Object SVG"],
            ] as const).map(([key, label]) => (
              <label className="color-control" key={key}>
                <span>{label}</span>
                <input
                  type="color"
                  value={colors[key]}
                  onChange={(event) => updateColor(key, event.target.value)}
                />
                <small>{colors[key].toUpperCase()}</small>
              </label>
            ))}
          </div>
          <p className="studio-note">
            ពណ៌ត្រូវបានរក្សាទុកដោយស្វ័យប្រវត្តិ។
          </p>
        </section>
      )}

      <section className="welcome">
        <p className="eyebrow">DIGITAL ASSET MANAGEMENT</p>
        <h2>Your Visual Collection</h2>
        <p className="description">
          បណ្ណាល័យគ្រប់គ្រងរូបភាព និងម៉ូដែល 3D នៅកន្លែងតែមួយ។
        </p>
      </section>

      <section className="studio-launch">
        <div>
          <p className="eyebrow">CREATE SOMETHING NEW</p>
          <h3>3D Creation Studio</h3>
          <p>រចនា UI និងបង្កើតវត្ថុ 3D នៅទីនេះ។</p>
          <div className="brand-icons" aria-label="KHOEM-AI custom icons">
            <span title="Flashlight"><KIcon name="flashlight" /></span>
            <span title="Car"><KIcon name="car" /></span>
            <span title="3D Object"><KIcon name="cube" /></span>
          </div>
        </div>
        <button
          type="button"
          className="upload-button"
          onClick={() => setStudioOpen((open) => !open)}
          onMouseEnter={prefetchStudio3D}
          onFocus={prefetchStudio3D}
        >
          {studioOpen ? "Close Studio" : "Open 3D Studio"}
        </button>
        <button
          type="button"
          className="upload-button"
          onClick={() => setCharactersOpen((open) => !open)}
        >
          {charactersOpen ? "Close Characters" : "Open Characters"}
        </button>
      </section>

      {studioOpen && (
        <Suspense fallback={<div className="studio-panel">Loading 3D Studio...</div>}>
          <Studio3D
            onAssetSaved={(asset) => {
              setAssets((old) => [...old, asset]);
              setSelected(asset);
              setFilter("all");
              setSearch("");
            }}
          />
        </Suspense>
      )}

      {charactersOpen && (
        <Suspense fallback={<div className="studio-panel">Loading Characters...</div>}>
          <Character3D />
        </Suspense>
      )}

      <section className="upload-panel">
        <div>
          <h3>Add New Assets</h3>
          <p>បញ្ចូលរូបភាព ឬម៉ូដែល 3D របស់អ្នក</p>
        </div>
        <div className="backup-actions">
          <label className="upload-button">
            + Add Files
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,.glb,.gltf"
              multiple
              onChange={upload}
            />
          </label>

          <label className="upload-button">
            Import Backup
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleImport}
            />
          </label>

          <button
            type="button"
            className="upload-button"
            onClick={handleExport}
            disabled={assets.length === 0}
          >
            Export All
          </button>
        </div>
        {backupMessage && (
          <p className="backup-message" role="status">{backupMessage}</p>
        )}
      </section>

      <section className="stats">
        <div className="stat-card">
          <span>ALL ASSETS</span>
          <strong>{assets.length}</strong>
        </div>
        <div className="stat-card">
          <span>IMAGES</span>
          <strong>{assets.filter((a) => a.kind === "image").length}</strong>
        </div>
        <div className="stat-card">
          <span>3D MODELS</span>
          <strong>{assets.filter((a) => a.kind === "model").length}</strong>
        </div>
      </section>

      <section className="workspace">
        <aside className="library">
          <div className="library-heading">
            <h3>Asset Library</h3>
            <span>{visibleAssets.length}</span>
          </div>

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search images and 3D models..."
            aria-label="Search assets"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "10px",
              border: "1px solid #444",
              background: "#151922",
              color: "#fff",
              fontSize: "14px"
            }}
          />

          <div className="filters">
            {["all", "image", "model"].map((value) => (
              <button
                key={value}
                className={filter === value ? "filter active" : "filter"}
                onClick={() => setFilter(value)}
              >
                {value === "all" ? "All" : value === "image" ? "Images" : "3D"}
              </button>
            ))}
          </div>

          <div className="asset-list">
            {visibleAssets.length === 0 && (
              <p className="empty-list">
                {search.trim()
                  ? "No matching assets found."
                  : "No assets added yet."}
              </p>
            )}

            {visibleAssets.map((asset) => (
              <div
                key={asset.id}
                className={
                  selected?.id === asset.id ? "asset-row selected" : "asset-row"
                }
              >
                <button
                  className="asset-name"
                  onClick={() => setSelected(asset)}
                >
                  <span className="asset-symbol">
                    {asset.kind === "image" ? "▧" : "◇"}
                  </span>
                  <span>
                    <strong>{asset.file.name}</strong>
                    <small>{asset.kind === "image" ? "IMAGE" : "3D MODEL"}</small>
                  </span>
                </button>
                <button
                  className="remove-button"
                  onClick={() => removeAsset(asset.id)}
                  aria-label={`Remove ${asset.file.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="preview-panel">
          <div className="preview-heading">
            <div>
              <p className="eyebrow">PREVIEW AREA</p>
              <h3>{selected ? selected.file.name : "Asset Preview"}</h3>
            </div>
            {selected && (
              <span className="file-type">
                {selected.kind === "image" ? "IMAGE" : "3D MODEL"}
              </span>
            )}
          </div>

          <div className="preview-stage">
            {!selected ? (
              <div className="empty-preview">
                <div className="empty-icon">◇</div>
                <h3>No Asset Selected</h3>
                <p>ជ្រើសរើសឯកសារពីបណ្ណាល័យ ឬចុច Add Files</p>
              </div>
            ) : selected.kind === "image" ? (
              <ImageViewer file={selected.file} />
            ) : (
              <Suspense fallback={<div className="empty-preview">Loading 3D Viewer...</div>}>
                <ModelViewer file={selected.file} />
              </Suspense>
            )}
          </div>
        </section>
      </section>

      <footer>
        KHOEM-AI <span>•</span> IMAGE & 3D LIBRARY
      </footer>
    </main>
  );
}
