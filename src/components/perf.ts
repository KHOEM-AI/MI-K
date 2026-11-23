import * as THREE from "three";
import type { FigureDetail } from "./humanFigure.ts";

// One place that decides how heavy the 3D scenes are, plus a live meter so you can SEE the cost.
// Force a level with the address:  ?q=low  ?q=medium  ?q=high   (remembered on this phone)
// Show the meter with:             ?fps    (draw calls, triangles and FPS, top-left)

export type Quality = "low" | "medium" | "high";
export interface QualityProfile {
  quality: Quality;
  pixelRatio: number;        // max render resolution multiplier (phones are 2.5-3.5 by default!)
  antialias: boolean;
  shadows: boolean;
  shadowMap: number;
  maxLights: number;         // point/spot lights that may stay on (each one costs every pixel)
  villagers: number;
  rainDrops: number;
  figureDetail: FigureDetail;
  farCull: number;           // villagers/vehicles farther than this are not drawn
}

const PROFILES: Record<Quality, QualityProfile> = {
  low: { quality: "low", pixelRatio: 1, antialias: false, shadows: true, shadowMap: 512, maxLights: 3, villagers: 30, rainDrops: 500, figureDetail: "low", farCull: 110 },
  medium: { quality: "medium", pixelRatio: 1.25, antialias: true, shadows: true, shadowMap: 1024, maxLights: 6, villagers: 60, rainDrops: 1200, figureDetail: "low", farCull: 170 },
  high: { quality: "high", pixelRatio: 1.5, antialias: true, shadows: true, shadowMap: 2048, maxLights: 12, villagers: 100, rainDrops: 2000, figureDetail: "high", farCull: 400 },
};

export function detectQuality(): Quality {
  try {
    const q = new URLSearchParams(location.search).get("q");
    if (q === "low" || q === "medium" || q === "high") { localStorage.setItem("mik.quality", q); return q; }
    const saved = localStorage.getItem("mik.quality");
    if (saved === "low" || saved === "medium" || saved === "high") return saved;
  } catch { /* storage blocked: fall through */ }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const phone = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || Math.min(screen.width, screen.height) < 700;
  if (phone || (nav.deviceMemory ?? 8) <= 4 || (navigator.hardwareConcurrency ?? 8) <= 4) return "low";
  return (navigator.hardwareConcurrency ?? 8) <= 6 ? "medium" : "high";
}

export const getProfile = (): QualityProfile => PROFILES[detectQuality()];

export function applyRendererQuality(renderer: THREE.WebGLRenderer, p: QualityProfile) {
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, p.pixelRatio));
  renderer.shadowMap.enabled = p.shadows;
  renderer.shadowMap.type = p.quality === "high" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
}

/** Keep only the `max` strongest point/spot lights lit; the rest are switched off before the first frame. */
export function capLights(root: THREE.Object3D, max: number): number {
  const lights: (THREE.PointLight | THREE.SpotLight)[] = [];
  root.traverse((o) => {
    const l = o as THREE.PointLight;
    if ((l as unknown as { isPointLight?: boolean }).isPointLight || (l as unknown as { isSpotLight?: boolean }).isSpotLight) lights.push(l);
  });
  const weight = (l: THREE.Light) => (l.userData.perfWeight as number | undefined) ?? l.intensity;
  lights.sort((a, b) => weight(b) - weight(a));
  lights.slice(max).forEach((l) => { l.visible = false; });
  return Math.max(0, lights.length - max);
}

/** Render-based meter: FPS, CPU time inside render(), draw calls, triangles. Enabled by ?fps or localStorage mik.fps=1. */
export function attachStats(renderer: THREE.WebGLRenderer, host: HTMLElement, label = ""): () => void {
  let on = false;
  try {
    on = new URLSearchParams(location.search).has("fps") || localStorage.getItem("mik.fps") === "1";
  } catch { /* storage blocked */ }
  if (!on) return () => {};

  const el = document.createElement("div");
  el.style.cssText = "position:absolute;left:6px;top:6px;z-index:50;padding:4px 8px;border-radius:6px;background:rgba(0,0,0,.72);color:#7CFC9A;font:11px/1.45 monospace;pointer-events:none;white-space:pre";
  el.textContent = `${label} measuring...`;
  host.appendChild(el);

  let frames = 0;
  let renderMs = 0;
  let last = performance.now();
  const originalRender = renderer.render.bind(renderer);

  renderer.render = (scene, camera) => {
    const t0 = performance.now();
    originalRender(scene, camera);
    const now = performance.now();
    renderMs += now - t0;
    frames++;
    const elapsed = now - last;
    if (elapsed >= 500) {
      const fps = Math.round((frames * 1000) / elapsed);
      const info = renderer.info;
      el.style.color = fps >= 50 ? "#7CFC9A" : fps >= 30 ? "#ffd166" : "#ff6b6b";
      el.textContent =
        `${label} ${fps} FPS [${detectQuality()}]\n` +
        `frame ${(elapsed / frames).toFixed(1)} ms  render ${(renderMs / frames).toFixed(1)} ms\n` +
        `calls ${info.render.calls}  tris ${(info.render.triangles / 1000).toFixed(1)}k\n` +
        `geo ${info.memory.geometries}  tex ${info.memory.textures}`;
      (window as unknown as { __perf?: unknown }).__perf = {
        fps, calls: info.render.calls, triangles: info.render.triangles,
        geometries: info.memory.geometries, textures: info.memory.textures,
      };
      frames = 0; renderMs = 0; last = now;
    }
  };

  return () => {
    renderer.render = originalRender;
    el.remove();
  };
}
