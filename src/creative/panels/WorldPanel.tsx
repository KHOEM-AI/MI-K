import { useState } from "react";
import { postWorld } from "../api";
import { S } from "../styles";

export default function WorldPanel({ onOpenStudio }: { onOpenStudio: () => void }) {
  const [prompt, setPrompt] = useState("Sunset beach with 6 palm trees, 4 rocks and 1 cabin");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [scene, setScene] = useState<any>(null);

  async function run() {
    setBusy(true); setErr(null);
    try {
      const s = await postWorld(prompt);
      setScene(s);
      try { localStorage.setItem("khoem:world:scene", JSON.stringify(s)); } catch {}
    } catch (e: any) { setErr(e?.message || String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div style={S.wrap}>
      <label style={S.label}>World prompt</label>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} style={S.textarea} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={run} disabled={busy} style={S.btn}>{busy ? "Composing…" : "Generate World"}</button>
        <button onClick={onOpenStudio} style={S.btnGhost}>Open in Studio3D</button>
      </div>
      {err && <div style={S.err}>{err}</div>}
      {scene && <pre style={S.pre}>{JSON.stringify(scene, null, 2)}</pre>}
    </div>
  );
}
