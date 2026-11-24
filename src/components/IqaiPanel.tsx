import { useCallback, useEffect, useRef, useState } from "react";
import {
  ASPECTS,
  MAX_FRAMES,
  IqaiError,
  buildStoryBody,
  clampNumber,
  findCanvas,
  grabCanvasPng,
  iqai,
  startRecording,
} from "../lib/iqai.mjs";
import type { IqaiCapabilities, IqaiSound } from "../lib/iqai.mjs";

// MI-K 3D -> IQ-AI: turn whatever 3D page is open into photos, a story video or a recorded mp4.
// Everything goes through the Vite proxy /iqai (token added server-side). Styles are inline so
// the panel does not depend on style.css.

type Frame = { key: string; blob: Blob; url: string };
type Result = { url: string; blob: Blob; name: string };

const box = { padding: 10, borderRadius: 10, border: "1px solid #8886", marginBottom: 8 } as const;
const btn = { padding: "8px 12px", borderRadius: 8, border: 0, background: "#4f46e5", color: "#fff", cursor: "pointer" } as const;
const field = { padding: 6, borderRadius: 6, border: "1px solid #8886", width: "100%", marginBottom: 6 } as const;

const errText = (e: unknown) => (e instanceof IqaiError ? `${e.code}: ${e.message}` : e instanceof Error ? e.message : String(e));

export default function IqaiPanel() {
  const [open, setOpen] = useState(false);
  const [caps, setCaps] = useState<IqaiCapabilities | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);
  const [sfxTypes, setSfxTypes] = useState<string[]>([]);
  const [sounds, setSounds] = useState<IqaiSound[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [secs, setSecs] = useState("3");
  const [aspect, setAspect] = useState("9:16");
  const [transition, setTransition] = useState("fade");
  const [sound, setSound] = useState("");
  const [recSecs, setRecSecs] = useState("8");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const stopRec = useRef<(() => void) | null>(null);
  const framesRef = useRef<Frame[]>([]);
  const resultRef = useRef<Result | null>(null);
  framesRef.current = frames;
  resultRef.current = result;

  useEffect(() => () => {
    framesRef.current.forEach((f) => URL.revokeObjectURL(f.url));
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    stopRec.current?.();
  }, []);

  const connect = useCallback(async () => {
    setMsg("");
    if (!(await iqai.health())) {
      setOnline(false);
      setMsg("IQ-AI មិនរត់ · IQ-AI is not running (cd ~/IQ-AI && ./ai.sh start)");
      return;
    }
    setOnline(true);
    try {
      setCaps(await iqai.capabilities());
      const o = await iqai.videoOptions().catch(() => null);
      setSfxTypes(o?.sfxTypes ?? []);
      setSounds(await iqai.sounds().catch(() => []));
    } catch (e) {
      setMsg(errText(e));
    }
  }, []);

  useEffect(() => { if (open && online === null) void connect(); }, [open, online, connect]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setMsg("");
    try { await fn(); } catch (e) { setMsg(errText(e)); } finally { setBusy(false); }
  };

  const showResult = (blob: Blob, name: string) => {
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
    setResult({ blob, name, url: URL.createObjectURL(blob) });
  };

  const capture = () => run(async () => {
    if (frames.length >= MAX_FRAMES) throw new Error(`Up to ${MAX_FRAMES} frames`);
    const canvas = findCanvas();
    if (!canvas) throw new Error("គ្មាន 3D នៅបើក · Open a 3D page first");
    const blob = await grabCanvasPng(canvas);
    setFrames((old) => [...old, { key: `${Date.now()}-${old.length}`, blob, url: URL.createObjectURL(blob) }]);
  });

  const removeFrame = (key: string) => setFrames((old) => {
    old.filter((f) => f.key === key).forEach((f) => URL.revokeObjectURL(f.url));
    return old.filter((f) => f.key !== key);
  });

  const makeStory = () => run(async () => {
    const temp: string[] = []; // frames/sound stored in IQ-AI only for this render; removed afterwards
    try {
      const ids: string[] = [];
      for (const [i, f] of frames.entries()) {
        const m = await iqai.uploadMedia(f.blob, `mik-frame-${Date.now()}-${i}.png`, "image/png");
        ids.push(m.id);
        temp.push(m.id);
      }
      let audioId: string | undefined;
      let sfx: string | undefined;
      if (sound.startsWith("lib:")) {
        const b = await iqai.soundBlob(sound.slice(4));
        const m = await iqai.uploadMedia(b, "mik-sound", b.type || "audio/wav");
        audioId = m.id;
        temp.push(m.id);
      } else if (sound.startsWith("sfx:")) {
        sfx = sound.slice(4);
      }
      setMsg("កំពុងបង្កើតវីដេអូ… · Rendering…");
      const body = buildStoryBody({ imageIds: ids, secondsPerScene: clampNumber(secs, 1, 60, 3), aspect, transition, audioId, sfx });
      const r = await iqai.story(body);
      showResult(r.blob, `MI-K-story-${Date.now()}.mp4`);
      setMsg("✔ រួចរាល់ · Done");
    } finally {
      await Promise.all(temp.map((id) => iqai.deleteMedia(id).catch(() => undefined)));
    }
  });

  const startRecord = () => run(async () => {
    const canvas = findCanvas();
    if (!canvas) throw new Error("គ្មាន 3D នៅបើក · Open a 3D page first");
    const rec = startRecording(canvas, { seconds: clampNumber(recSecs, 1, 30, 8) });
    stopRec.current = rec.stop;
    setRecording(true);
    setMsg("កំពុងថត… · Recording…");
    try {
      const webm = await rec.done;
      setMsg("កំពុងបម្លែងទៅ mp4… · Converting to mp4…");
      const r = await iqai.editVideo(webm, {});
      showResult(r.blob, `MI-K-record-${Date.now()}.mp4`);
      setMsg("✔ រួចរាល់ · Done");
    } finally {
      stopRec.current = null;
      setRecording(false);
    }
  });

  const saveToIqai = () => run(async () => {
    if (!result) return;
    const m = await iqai.uploadMedia(result.blob, result.name, "video/mp4");
    setMsg(`✔ រក្សាទុកក្នុង IQ-AI រួចហើយ · Saved to IQ-AI (id ${m.id})`);
  });

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.name;
    a.click();
  };

  const ffmpegOk = caps?.system?.ffmpeg !== false;

  return (
    <div style={{ position: "fixed", right: 12, bottom: 12, zIndex: 1000, maxWidth: "92vw" }}>
      {!open ? (
        <button type="button" style={btn} onClick={() => setOpen(true)} aria-label="Open IQ-AI video panel">🎬 IQ-AI</button>
      ) : (
        <div style={{ width: "min(92vw, 360px)", maxHeight: "72vh", overflow: "auto", background: "#111827", color: "#eee", borderRadius: 12, padding: 12, boxShadow: "0 6px 24px #0008" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <b>🎬 3D → IQ-AI</b>
            <span>
              <button type="button" style={{ ...btn, background: "#374151", marginRight: 6 }} onClick={() => { setOnline(null); }} title="Reconnect">↻</button>
              <button type="button" style={{ ...btn, background: "#374151" }} onClick={() => setOpen(false)} aria-label="Close">✕</button>
            </span>
          </div>

          {online === false && <div style={{ ...box, color: "#fca5a5" }}>⚠️ {msg}</div>}
          {online && !ffmpegOk && <div style={{ ...box, color: "#fca5a5" }}>⚠️ ffmpeg មិនមាន · pkg install ffmpeg</div>}

          <div style={box}>
            <b>១. ថតរូប · Frames ({frames.length}/{MAX_FRAMES})</b>
            <div style={{ fontSize: 12, opacity: 0.8, margin: "4px 0" }}>ប្តូរមុំកាមេរ៉ា រួចចុចថត · Move the camera, then capture.</div>
            <button type="button" style={btn} disabled={busy || recording || frames.length >= MAX_FRAMES} onClick={capture}>📸 ថតរូប · Capture</button>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {frames.map((f) => (
                <span key={f.key} style={{ position: "relative" }}>
                  <img src={f.url} alt="frame" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
                  <button type="button" onClick={() => removeFrame(f.key)} aria-label="Remove frame"
                    style={{ position: "absolute", top: -4, right: -4, border: 0, borderRadius: 10, background: "#ef4444", color: "#fff", width: 20, height: 20, cursor: "pointer" }}>×</button>
                </span>
              ))}
            </div>
          </div>

          <div style={box}>
            <b>២. វីដេអូពីរូប · Story video</b>
            <label style={{ display: "block", marginTop: 6 }}>វិនាទី/រូប · Seconds per frame
              <input style={field} inputMode="decimal" value={secs} onChange={(e) => setSecs(e.target.value)} />
            </label>
            <select style={field} value={aspect} onChange={(e) => setAspect(e.target.value)} aria-label="Aspect">
              {Object.keys(ASPECTS).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select style={field} value={transition} onChange={(e) => setTransition(e.target.value)} aria-label="Transition">
              <option value="fade">fade</option>
              <option value="none">none</option>
            </select>
            <select style={field} value={sound} onChange={(e) => setSound(e.target.value)} aria-label="Sound">
              <option value="">គ្មានសំឡេង · No sound</option>
              {sfxTypes.length > 0 && <optgroup label="Effects">{sfxTypes.map((t) => <option key={t} value={`sfx:${t}`}>{t}</option>)}</optgroup>}
              {sounds.length > 0 && <optgroup label="Sound library">{sounds.map((s) => <option key={s.id} value={`lib:${s.id}`}>{s.name}</option>)}</optgroup>}
            </select>
            <button type="button" style={btn} disabled={busy || recording || !online || !ffmpegOk || frames.length === 0} onClick={makeStory}>🎞️ បង្កើតវីដេអូ · Make video</button>
          </div>

          <div style={box}>
            <b>៣. ថតវីដេអូ 3D · Record 3D</b>
            <label style={{ display: "block", marginTop: 6 }}>វិនាទី · Seconds (1–30)
              <input style={field} inputMode="decimal" value={recSecs} onChange={(e) => setRecSecs(e.target.value)} />
            </label>
            {!recording ? (
              <button type="button" style={btn} disabled={busy || !online || !ffmpegOk} onClick={startRecord}>⏺ ថត · Record</button>
            ) : (
              <button type="button" style={{ ...btn, background: "#dc2626" }} onClick={() => stopRec.current?.()}>⏹ ឈប់ · Stop</button>
            )}
          </div>

          {msg && online !== false && <div style={{ ...box, fontSize: 13 }}>{msg}</div>}

          {result && (
            <div style={box}>
              <video src={result.url} controls style={{ width: "100%", borderRadius: 8 }} />
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <button type="button" style={btn} onClick={download}>⬇️ ទាញយក</button>
                <button type="button" style={btn} disabled={busy || !online} onClick={saveToIqai}>💾 រក្សាក្នុង IQ-AI</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
