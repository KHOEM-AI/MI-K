import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * AutoQuality — ស្តាប់ FPS ហើយលៃតម្រូវ quality ស្វ័យប្រវត្តិ
 * - FPS < 100 → បន្ថយ pixel ratio
 * - FPS > 130 → បង្កើន pixel ratio
 * - FPS < 60 → បិទ shadow
 */
export function useAutoQuality(
  rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>
) {
  const lastAdjust = useRef(0);
  const lowCount = useRef(0);
  const highCount = useRef(0);

  useEffect(() => {
    let rafId = 0;
    let frameCount = 0;
    let lastTime = performance.now();

    const tick = () => {
      frameCount++;
      const now = performance.now();
      const elapsed = now - lastTime;

      if (elapsed >= 1000) {
        const fps = Math.round((frameCount * 1000) / elapsed);
        const renderer = rendererRef.current;

        if (renderer && now - lastAdjust.current > 2000) {
          const currentPR = renderer.getPixelRatio();

          if (fps < 100) {
            lowCount.current++;
            highCount.current = 0;
            if (lowCount.current >= 2) {
              // បន្ថយ quality
              if (fps < 60 && renderer.shadowMap.enabled) {
                renderer.shadowMap.enabled = false;
                console.log("[AutoQuality] Shadow disabled (FPS < 60)");
              } else if (currentPR > 1.0) {
                const newPR = Math.max(1.0, currentPR - 0.25);
                renderer.setPixelRatio(newPR);
                console.log(`[AutoQuality] Pixel ratio → ${newPR} (FPS ${fps})`);
              }
              lowCount.current = 0;
              lastAdjust.current = now;
            }
          } else if (fps > 130) {
            highCount.current++;
            lowCount.current = 0;
            if (highCount.current >= 3 && currentPR < 1.5) {
              const newPR = Math.min(1.5, currentPR + 0.25);
              renderer.setPixelRatio(newPR);
              console.log(`[AutoQuality] Pixel ratio → ${newPR} (FPS ${fps})`);
              highCount.current = 0;
              lastAdjust.current = now;
            }
          }
        }

        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [rendererRef]);
}
