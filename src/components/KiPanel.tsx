import { useState } from "react";
import { ki } from "../lib/ki.mjs";
import type { SceneObject } from "./studioTypes";

type Palette = { id: string; name?: string; cols: string[] };

type KiPanelProps = {
  objects: SceneObject[];
  onApplyColor?: (color: string) => void;
};

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function KiPanel({ objects, onApplyColor }: KiPanelProps) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [palettes, setPalettes] = useState<Palette[]>([]);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(true);
    setMsg("");
    try {
      await fn();
      setMsg(label);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "KI error");
    } finally {
      setBusy(false);
    }
  }

  const saveCounts = () =>
    run("Saved scene counts", async () => {
      const counts: Record<string, number> = {};
      for (const o of objects) counts[o.shape] = (counts[o.shape] ?? 0) + 1;
      await ki.saveScan({ id: newId(), time: new Date().toISOString(), name: "MI-K scene", counts });
    });

  const savePalette = () =>
    run("Saved palette", async () => {
      const cols = [...new Set(objects.map((o) => o.color))].slice(0, 64);
      await ki.savePalette({ id: newId(), cols });
    });

  const loadPalettes = () =>
    run("Loaded palettes", async () => {
      setPalettes((await ki.getColors()).palettes as Palette[]);
    });

  return (
    <div className="studio-transform-panel">
      <h3>KI</h3>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button type="button" className="upload-button" disabled={busy || objects.length === 0} onClick={saveCounts}>
          Save scene counts
        </button>
        <button type="button" className="upload-button" disabled={busy || objects.length === 0} onClick={savePalette}>
          Save palette
        </button>
        <button type="button" className="upload-button" disabled={busy} onClick={loadPalettes}>
          Load palettes
        </button>
      </div>
      {msg && <p style={{ fontSize: "0.8rem", marginTop: 8 }}>{msg}</p>}
      {palettes.slice(-5).map((p) => (
        <div key={p.id} style={{ display: "flex", gap: 4, marginTop: 6 }}>
          {p.cols.map((c, i) => (
            <button
              key={i}
              type="button"
              title={c}
              disabled={!onApplyColor}
              onClick={() => onApplyColor?.(c)}
              style={{ width: 24, height: 24, borderRadius: 4, border: "1px solid #888", background: c }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
