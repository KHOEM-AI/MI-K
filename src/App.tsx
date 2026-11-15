import { lazy, Suspense, useEffect, useState } from "react";
import { saveAsset, getAssets, deleteAsset } from "./lib/storage.mjs";

type Asset = {
  id: string;
  file: File;
  kind: "image" | "model";
};

const ModelViewer = lazy(() => import("./components/ModelViewer"));




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

  useEffect(() => {
    getAssets().then(saved => {
      setAssets(saved);
      setStorageReady(true);
    }).catch(error => console.error("Storage load failed:", error));
  }, []);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [filter, setFilter] = useState("all");

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

  function removeAsset(id: string) {
    setAssets((old) => old.filter((asset) => asset.id !== id));
    deleteAsset(id).catch(console.error);
    if (selected?.id === id) setSelected(null);
  }

  const visibleAssets = assets.filter(
    (asset) => filter === "all" || asset.kind === filter
  );

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

      <section className="upload-panel">
        <div>
          <h3>Add New Assets</h3>
          <p>បញ្ចូលរូបភាព ឬម៉ូដែល 3D របស់អ្នក</p>
        </div>
        <label className="upload-button">
          + Add Files
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,.glb,.gltf"
            multiple
            onChange={upload}
          />
        </label>
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
              <p className="empty-list">No assets added yet.</p>
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
        MI-K VISION 3D <span>•</span> IMAGE & 3D LIBRARY
      </footer>
    </main>
  );
}
