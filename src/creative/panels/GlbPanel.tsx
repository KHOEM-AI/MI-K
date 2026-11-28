import { useRef, useState } from "react";
import { postGlb, abs } from "../api";
import { S } from "../styles";

export default function GlbPanel({ initialImage }: { initialImage?: string }) {
  const [image, setImage] = useState(initialImage || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [glb, setGlb] = useState("");
  const [meta, setMeta] = useState<{ provider?: string; testData?: boolean; modelSize?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => setImage(String(r.result || ""));
    r.readAsDataURL(f);
  }

  async function run() {
    if (!image) return;
    setBusy(true); setErr(null); setGlb(""); setMeta({});
    try {
      const res: any = await postGlb(image);
      setGlb(abs(res.glbUrl));
      setMeta({ provider: res.provider, testData: res.testData, modelSize: res.modelSize });
    } catch (e: any) { setErr(e?.message || String(e)); }
    finally { setBusy(false); }
  }

  return (
    <div style={S.wrap}>
      <p style={S.hint}>ផ្ទុករូបភាព ឬប្រើលទ្ធផល 2D ចុងក្រោយ → បង្កើត .glb</p>
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} style={{ display: "none" }} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => fileRef.current?.click()} style={S.btnGhost}>Choose image</button>
        {initialImage && <button onClick={() => setImage(initialImage)} style={S.btnGhost}>Use last 2D</button>}
        <button onClick={run} disabled={!image || busy} style={S.btn}>
          {busy ? "Building GLB… (អាចយូរ ១-៥ នាទី)" : "Generate GLB"}
        </button>
      </div>
      {err && <div style={S.err}>{err}</div>}
      {image && <img src={image} alt="input" style={{ ...S.img, maxHeight: 220, marginTop: 14 }} />}
      {glb && (
        <div style={S.previewBox}>
          {meta.testData && (
            <p style={{ color: "orange", fontSize: 13, margin: "0 0 8px" }}>
              ⚠ នេះជា TEST placeholder — មិនមែនបង្កើតពីរូបភាពរបស់អ្នកទេ។ ត្រូវប្រើ TRELLIS provider។
            </p>
          )}
          {!meta.testData && meta.provider && (
            <p style={S.hint}>Provider: {meta.provider}{meta.modelSize ? ` · ${meta.modelSize} m` : ""}</p>
          )}
          <a href={glb} download style={S.link}>Download .glb</a>
          <a href={glb} target="_blank" rel="noreferrer" style={{ ...S.link, marginLeft: 14 }}>Open raw</a>
        </div>
      )}
    </div>
  );
}
