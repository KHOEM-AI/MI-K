import { useState } from "react";
import type { CSSProperties } from "react";
import type { ExportContext } from "./modelExporter";
import { downloadBlob, exportGLB, exportScreenshot, recordVideo, filenameFor } from "./modelExporter";

interface Props {
  getContext: () => ExportContext | null;
  label: string;
  isReal: boolean;
  onRecordStart?: () => void;
  onRecordEnd?: () => void;
}

// colours follow the page (Day/Night): tints of the text colour + the accent from the app colour system
const box: CSSProperties = {
  background: "color-mix(in srgb, currentColor 8%, transparent)",
  borderRadius: 10,
  padding: 10,
  marginTop: 10,
};

export default function ExportPanel({ getContext, label, isReal, onRecordStart, onRecordEnd }: Props) {
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [progress, setProgress] = useState(0);

  const run = async (name: string, fn: () => Promise<void>) => {
    setErr(""); setBusy(name); setProgress(0);
    try { await fn(); }
    catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(""); setProgress(0); }
  };

  const renderNow = () => {
    const ctx = getContext();
    if (ctx) ctx.renderer.render(ctx.scene, ctx.camera);
  };

  const onGLB = () => run("glb", async () => {
    const ctx = getContext();
    if (!ctx) throw new Error("មិនទាន់មាន 3D");
    if (!ctx.root) throw new Error("មិនទាន់មានតួអង្គ");
    const blob = await exportGLB(ctx.root, { binary: true, animations: ctx.animations });
    downloadBlob(blob, filenameFor(label, "model/gltf-binary"));
  });

  const onPNG = () => run("png", async () => {
    const ctx = getContext();
    if (!ctx) throw new Error("មិនទាន់មាន 3D");
    const blob = await exportScreenshot(ctx.renderer, { mimeType: "image/png", renderBeforeCapture: renderNow });
    downloadBlob(blob, filenameFor(label, "image/png"));
  });

  const onVideo = (ms: number) => run("video", async () => {
    const ctx = getContext();
    if (!ctx) throw new Error("មិនទាន់មាន 3D");
    const startY = ctx.pivot.rotation.y;
    onRecordStart?.();
    try {
      const blob = await recordVideo(ctx.renderer.domElement, {
        durationMs: ms,
        fps: 30,
        onFrame: (t) => { ctx.pivot.rotation.y = startY + t * Math.PI * 2; renderNow(); },
        onProgress: setProgress,
      });
      downloadBlob(blob, filenameFor(`${label}-turntable`, "video/webm"));
    } finally {
      ctx.pivot.rotation.y = startY;
      onRecordEnd?.();
    }
  });

  const btn = (text: string, onClick: () => void, active: boolean) => (
    <button type="button" className="filter" disabled={!!busy} onClick={onClick} style={{ minWidth: 76 }}>
      {active ? "…" : text}
    </button>
  );

  return (
    <div style={box}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>
        ទាញយក · Export
        <span style={{ opacity: 0.7, fontSize: 12, marginLeft: 8 }}>
          {isReal ? "GLB · PNG · Video" : "GLB (pose) · PNG · Video"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {btn("GLB", onGLB, busy === "glb")}
        {btn("PNG", onPNG, busy === "png")}
        {btn("Video 4s", () => onVideo(4000), busy === "video")}
        {btn("Video 8s", () => onVideo(8000), busy === "video")}
      </div>
      {progress > 0 && (
        <div style={{ marginTop: 8, height: 4, background: "color-mix(in srgb, currentColor 14%, transparent)", borderRadius: 2 }}>
          <div style={{ width: `${progress * 100}%`, height: "100%", background: "var(--ka-accent)", borderRadius: 2 }} />
        </div>
      )}
      {err && <div style={{ color: "#ff8a8a", marginTop: 6, fontSize: 12 }}>{err}</div>}
      <div style={{ marginTop: 6, fontSize: 11, opacity: 0.6 }}>
        GLB → Blender / Unreal · Video → Sora / Runway / Kling · PNG → image-to-video
      </div>
    </div>
  );
}
