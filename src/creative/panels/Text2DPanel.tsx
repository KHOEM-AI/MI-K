import { useState } from "react";
import { post2d, abs } from "../api";
import { S } from "../styles";

export default function Text2DPanel({ onResult }: { onResult?: (u: string) => void }) {
  const [prompt, setPrompt] = useState("a futuristic khmer temple in neon light, cinematic");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [url, setUrl] = useState("");

  async function run() {
    setBusy(true); setErr(null);
    try {
      const { imageUrl } = await post2d(prompt);
      const full = abs(imageUrl);
      setUrl(full); onResult?.(full);
    } catch (e: any) { setErr(e?.message || String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div style={S.wrap}>
      <label style={S.label}>Prompt</label>
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={4} style={S.textarea} />
      <button onClick={run} disabled={busy} style={S.btn}>
        {busy ? "Generating…" : "Generate Image"}
      </button>
      {err && <div style={S.err}>{err}</div>}
      {url && (
        <div style={S.previewBox}>
          <img src={url} alt="result" style={S.img} />
          <a href={url} download style={S.link}>Download PNG</a>
        </div>
      )}
    </div>
  );
}
