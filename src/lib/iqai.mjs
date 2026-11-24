// IQ-AI media client for MI-K (runs in the browser). Plain .mjs like ki.mjs so node:test can run it.
// Base "/iqai" is the Vite proxy -> http://127.0.0.1:8799/api/v1. The proxy adds the token;
// the browser never sees it. See src/lib/iqaiRoutes.mjs for the routes the proxy lets through.

export class IqaiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "IqaiError";
    this.status = status;
    this.code = code;
  }
}

export const ASPECTS = { "9:16": [720, 1280], "16:9": [1280, 720], "1:1": [720, 720] };
export const MAX_FRAMES = 12; // IQ-AI allows 30 scenes; 12 keeps phone uploads small

export function clampNumber(v, lo, hi, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(hi, Math.max(lo, n));
}

// ---- pure helpers -------------------------------------------------------------------------

// Body for POST /videos/story. Frames must already be stored in IQ-AI (/media) - pass their ids.
export function buildStoryBody({
  imageIds, secondsPerScene = 3, aspect = "9:16", transition = "fade", effect = "zoom-in",
  sfx = null, audioId = null,
} = {}) {
  if (!Array.isArray(imageIds) || imageIds.length < 1) {
    throw new IqaiError(0, "bad_params", "Capture at least one frame first");
  }
  if (imageIds.length > MAX_FRAMES) {
    throw new IqaiError(0, "bad_params", `At most ${MAX_FRAMES} frames`);
  }
  const size = ASPECTS[aspect];
  if (!size) throw new IqaiError(0, "bad_params", `aspect must be one of: ${Object.keys(ASPECTS).join(", ")}`);
  const body = {
    scenes: imageIds.map((imageId) => ({ imageId })),
    secondsPerScene: clampNumber(secondsPerScene, 1, 60, 3),
    width: size[0],
    height: size[1],
    transition,
    effect,
  };
  // IQ-AI accepts one sound only: a stored track wins over a generated effect.
  if (audioId) body.audioId = audioId;
  else if (sfx) body.sfx = sfx;
  return body;
}

const RECORDER_MIMES = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];

export function pickRecorderMime(isTypeSupported) {
  for (const t of RECORDER_MIMES) {
    try { if (isTypeSupported(t)) return t; } catch { /* try the next one */ }
  }
  return "";
}

// The 3D page canvas = the biggest visible <canvas> in the document.
export function findCanvas(root = globalThis.document) {
  if (!root || typeof root.querySelectorAll !== "function") return null;
  let best = null;
  let bestArea = 0;
  for (const c of Array.from(root.querySelectorAll("canvas"))) {
    const area = (c.clientWidth || 0) * (c.clientHeight || 0);
    if (area > bestArea) { best = c; bestArea = area; }
  }
  return best;
}

// WebGL clears its drawing buffer after each composite. Reading inside a requestAnimationFrame callback
// registered after the scene's own render loop runs after that frame's render, so the buffer is still valid.
export function grabCanvasPng(canvas, raf = (cb) => globalThis.requestAnimationFrame(cb)) {
  return new Promise((resolve, reject) => {
    raf(() => {
      try {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new IqaiError(0, "capture_failed", "The canvas returned no image"))),
          "image/png",
        );
      } catch (e) {
        reject(e);
      }
    });
  });
}

// Records the canvas with MediaRecorder. Returns { stop(), done: Promise<Blob> }; stops itself after `seconds`.
export function startRecording(canvas, { seconds = 8, fps = 30, bitsPerSecond = 2_500_000, MR = globalThis.MediaRecorder } = {}) {
  if (!MR || !canvas || typeof canvas.captureStream !== "function") {
    throw new IqaiError(0, "recording_unsupported", "This browser cannot record a canvas");
  }
  const mimeType = pickRecorderMime((t) => MR.isTypeSupported(t));
  const stream = canvas.captureStream(fps);
  const rec = new MR(stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: bitsPerSecond });
  const chunks = [];
  let timer;
  const done = new Promise((resolve, reject) => {
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onerror = (e) => {
      clearTimeout(timer);
      reject(new IqaiError(0, "recording_failed", (e && e.error && e.error.message) || "Recording failed"));
    };
    rec.onstop = () => {
      clearTimeout(timer);
      stream.getTracks().forEach((t) => t.stop());
      const type = String(rec.mimeType || mimeType || "video/webm").split(";")[0];
      if (chunks.length) resolve(new Blob(chunks, { type }));
      else reject(new IqaiError(0, "recording_empty", "Nothing was recorded"));
    };
  });
  rec.start(1000);
  timer = setTimeout(() => { if (rec.state !== "inactive") rec.stop(); }, clampNumber(seconds, 1, 30, 8) * 1000);
  return { stop: () => { if (rec.state !== "inactive") rec.stop(); }, done };
}

// ---- HTTP client --------------------------------------------------------------------------

export function createIqai(base = "/iqai") {
  async function fail(r) {
    let code = `http_${r.status}`;
    let message = r.statusText || `HTTP ${r.status}`;
    try {
      const j = await r.json();
      const e = j && j.error;
      if (typeof e === "string") { code = e; message = j.message ?? e; }
      else if (e) { code = e.code ?? code; message = e.message ?? message; }
    } catch { /* body was not JSON */ }
    throw new IqaiError(r.status, code, message);
  }

  async function request(path, init = {}, timeoutMs = 15000) {
    const r = await fetch(base + path, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    if (!r.ok) await fail(r);
    return r;
  }

  // Most routes answer { ok, data, error }; the sounds routes answer bare JSON.
  async function data(r) {
    const j = await r.json();
    return j && typeof j === "object" && "ok" in j && "data" in j ? j.data : j;
  }

  const appliedOf = (r) => {
    try { return JSON.parse(r.headers.get("X-Applied") || "null"); } catch { return null; }
  };

  const qs = (o) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
    const s = p.toString();
    return s ? `?${s}` : "";
  };

  return {
    health: async () => {
      try { return (await fetch(`${base}/health`, { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; }
    },
    capabilities: async () => data(await request("/capabilities")),
    videoOptions: async () => data(await request("/videos/effects")),
    sounds: async (q = "") => {
      const d = await data(await request(`/sounds${qs({ limit: 100, q })}`));
      return (d && d.items) || [];
    },
    soundBlob: async (id) => (await request(`/sounds/${encodeURIComponent(id)}/content`, {}, 30000)).blob(),

    // Stores a file in the IQ-AI media library. mime must be one IQ-AI accepts (png, jpeg, wav, mp4, webm ...).
    uploadMedia: async (blob, filename, mime = blob.type) =>
      data(await request("/media", {
        method: "POST",
        headers: { "Content-Type": mime, "X-Filename": encodeURIComponent(filename) },
        body: blob,
      }, 60000)),
    deleteMedia: async (id) => data(await request(`/media/${encodeURIComponent(id)}`, { method: "DELETE" })),
    mediaUrl: (id) => `${base}/media/${encodeURIComponent(id)}/content`,

    // photos (stored ids) -> mp4
    story: async (body) => {
      const r = await request("/videos/story", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      }, 300000);
      return { blob: await r.blob(), applied: appliedOf(r) };
    },
    // a recorded webm/mp4 -> H.264 mp4 (also trim / speed / mute / size)
    editVideo: async (blob, o = {}) => {
      const r = await request(`/videos/edit${qs(o)}`, {
        method: "POST", headers: { "Content-Type": blob.type || "video/webm" }, body: blob,
      }, 300000);
      return { blob: await r.blob(), applied: appliedOf(r) };
    },
  };
}

export const iqai = createIqai();
