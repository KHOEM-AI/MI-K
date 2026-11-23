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

/** Small meter in the corner: FPS, draw calls, triangles. Only when the address has ?fps (or localStorage mik.fps=1). */
export function attachStats(renderer: THREE.WebGLRenderer, host: HTMLElement, label = ""): () => void {
  let on = false;
  try { on = new URLSearchParams(location.search).has("fps") || localStorage.getItem("mik.fps") === "1"; } catch { /* ignore */ }
  if (!on) return () => {};
  const el = document.createElement("div");
  el.style.cssText = "position:absolute;left:6px;top:6px;z-index:50;padding:3px 7px;border-radius:6px;background:rgba(0,0,0,.65);color:#7CFC9A;font:11px/1.35 monospace;pointer-events:none;white-space:pre";
  host.appendChild(el);
  let frames = 0, last = performance.now(), raf = 0;
  const tick = () => {
    frames++;
    const now = performance.now();
    if (now - last >= 500) {
      const fps = Math.round((frames * 1000) / (now - last));
      const i = renderer.info;
      el.style.color = fps >= 50 ? "#7CFC9A" : fps >= 30 ? "#ffd166" : "#ff6b6b";
      el.textContent = `${label} ${fps} FPS  [${detectQuality()}]\ncalls ${i.render.calls}  tris ${(i.render.triangles / 1000).toFixed(0)}k\nmeshes/geo ${i.memory.geometries}  tex ${i.memory.textures}`;
      (window as unknown as { __perf?: unknown }).__perf = { fps, calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures };
      frames = 0; last = now;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => { cancelAnimationFrame(raf); el.remove(); };
}
