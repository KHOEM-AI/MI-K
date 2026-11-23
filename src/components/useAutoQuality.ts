import { useEffect } from "react";
import * as THREE from "three";

/**
 * AutoQuality: lowers pixel ratio when FPS stays low, raises it back when FPS is high.
 * Thresholds are relative to the screen refresh rate, measured once at start.
 */
export function useAutoQuality(
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>
) {
  useEffect(() => {
    let rafId = 0;
    let frames = 0;
    let last = performance.now();
    let lastAdjust = 0;
    let low = 0;
    let high = 0;
    let refresh = 0; // best FPS seen = refresh-rate estimate
    let maxPR = 0; // cap = pixel ratio set by the quality profile

    const tick = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        const fps = Math.round((frames * 1000) / (now - last));
        frames = 0;
        last = now;
        refresh = Math.max(refresh, fps);
        const r = rendererRef.current;
        if (r && !maxPR) maxPR = r.getPixelRatio();
        if (r && refresh >= 30 && now - lastAdjust > 2000) {
          const pr = r.getPixelRatio();
          if (fps < refresh * 0.75) {
            high = 0;
            if (++low >= 2 && pr > 1) {
              r.setPixelRatio(Math.max(1, pr - 0.25));
              low = 0;
              lastAdjust = now;
            }
          } else if (fps >= refresh * 0.95) {
            low = 0;
            if (++high >= 5 && pr < maxPR) {
              r.setPixelRatio(Math.min(maxPR, pr + 0.25));
              high = 0;
              lastAdjust = now;
            }
          } else {
            low = 0;
            high = 0;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [rendererRef]);
}
