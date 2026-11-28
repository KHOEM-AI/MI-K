import { useState } from "react";
import { S } from "./styles";
import Text2DPanel from "./panels/Text2DPanel";
import GlbPanel from "./panels/GlbPanel";
import WorldPanel from "./panels/WorldPanel";

type Tab = "2d" | "glb" | "3d";

interface Props {
  onOpenModule: (id: string) => void;
  onClose: () => void;
}

export default function CreativeStudio({ onOpenModule, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("2d");
  const [lastImage, setLastImage] = useState("");

  return (
    <div style={S.root}>
      <header style={S.header}>
        <div>
          <div style={S.kicker}>KHOEM-AI</div>
          <h1 style={S.h1}>Creative Studio</h1>
          <p style={S.sub}>Prompt → Model → Processing → Preview → Export</p>
        </div>
        <button onClick={onClose} style={S.close} aria-label="Close">✕</button>
      </header>

      <nav style={S.tabs}>
        {([
          ["2d", "2D AI", "Text → Image"],
          ["glb", "GLB AI", "Image → GLB"],
          ["3d", "3D AI", "World Gen"],
        ] as [Tab, string, string][]).map(([id, label, desc]) => (
          <button key={id} onClick={() => setTab(id)}
                  style={{ ...S.tab, ...(tab === id ? S.tabOn : null) }}>
            <strong>{label}</strong>
            <small style={S.tabDesc}>{desc}</small>
          </button>
        ))}
      </nav>

      <main style={S.body}>
        {tab === "2d" && <Text2DPanel onResult={setLastImage} />}
        {tab === "glb" && <GlbPanel initialImage={lastImage} />}
        {tab === "3d" && <WorldPanel onOpenStudio={() => onOpenModule("studio")} />}
      </main>

      <footer style={S.footer}>Export: PNG · JPG · GLB · GLTF · MP4</footer>
    </div>
  );
}
