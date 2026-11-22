import type * as THREE from "three";

export interface GLBOptions {
  binary?: boolean;
  animations?: THREE.AnimationClip[];
}

export interface ScreenshotOptions {
  mimeType?: "image/png" | "image/jpeg" | "image/webp";
  quality?: number;
  renderBeforeCapture?: () => void;
}

export interface VideoOptions {
  durationMs?: number;
  fps?: number;
  mimeType?: string;
  videoBitsPerSecond?: number;
  onFrame?: (t: number, elapsedMs: number) => void;
  onProgress?: (t: number) => void;
}

export interface ExportContext {
  root: THREE.Object3D | null;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  pivot: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "video/webm": "webm",
  "video/mp4": "mp4",
  "model/gltf-binary": "glb",
  "model/gltf+json": "gltf",
};

export function safeSlug(s: string): string {
  const slug = s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "model";
}

export function filenameFor(prefix: string, mime: string): string {
  const ext = MIME_TO_EXT[mime] ?? "bin";
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${safeSlug(prefix)}-${stamp}.${ext}`;
}

export function pickMimeType(preferred?: string): string {
  const candidates = [
    preferred,
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ].filter(Boolean) as string[];
  if (typeof MediaRecorder !== "undefined") {
    for (const c of candidates) {
      try { if (MediaRecorder.isTypeSupported(c)) return c; } catch { /* noop */ }
    }
  }
  return "video/webm";
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportGLB(
  root: THREE.Object3D,
  options: GLBOptions = {}
): Promise<Blob> {
  const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
  const exporter = new GLTFExporter();
  const result = await new Promise<ArrayBuffer | object>((resolve, reject) => {
    exporter.parse(
      root,
      (out) => resolve(out as ArrayBuffer | object),
      (err) => reject(err),
      {
        binary: options.binary ?? true,
        animations: options.animations ?? [],
      }
    );
  });
  if (result instanceof ArrayBuffer) {
    return new Blob([result], { type: "model/gltf-binary" });
  }
  return new Blob([JSON.stringify(result)], { type: "model/gltf+json" });
}

export async function exportScreenshot(
  renderer: THREE.WebGLRenderer,
  options: ScreenshotOptions = {}
): Promise<Blob> {
  options.renderBeforeCapture?.();
  const mimeType = options.mimeType ?? "image/png";
  const quality = options.quality ?? 1;
  const dataUrl = renderer.domElement.toDataURL(mimeType, quality);
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function recordVideo(
  canvas: HTMLCanvasElement,
  options: VideoOptions = {}
): Promise<Blob> {
  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder is not available in this browser");
  }
  if (typeof canvas.captureStream !== "function") {
    throw new Error("canvas.captureStream is not supported");
  }

  const fps = options.fps ?? 30;
  const durationMs = options.durationMs ?? 5000;
  const mimeType = pickMimeType(options.mimeType);

  const stream = canvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: options.videoBitsPerSecond ?? 8000000,
  });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const done = new Promise<void>((resolve) => { recorder.onstop = () => resolve(); });

  recorder.start();
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / durationMs);
      options.onFrame?.(t, elapsed);
      options.onProgress?.(t);
      if (elapsed >= durationMs) { resolve(); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  recorder.stop();
  await done;
  stream.getTracks().forEach((t) => t.stop());
  return new Blob(chunks, { type: mimeType });
}
