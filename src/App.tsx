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
        <div className="status">ASSET WORKSPACE</div>
      </header>

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
        </div>
        <button
          type="button"
          className="upload-button"
          onClick={() => setStudioOpen((open) => !open)}
        >
          {studioOpen ? "Close Studio" : "Open 3D Studio"}
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
