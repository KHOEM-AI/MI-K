import { useEffect, useRef, useState } from "react";

/**
 * FPS Counter — បង្ហាញ FPS ពិតប្រាកដនៅជ្រុងខាងស្តាំខាងលើ
 * ប្រើ requestAnimationFrame ដើម្បីវាស់ frame rate
 */
export default function FpsCounter() {
  const [fps, setFps] = useState(0);
  const [color, setColor] = useState("#27ae60");
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 500) {
        const measured = Math.round((frameCount.current * 1000) / elapsed);
        setFps(measured);
        // ពណ៌តាម FPS
        if (measured >= 120) setColor("#27ae60");      // បៃតង (ល្អណាស់)
        else if (measured >= 60) setColor("#f39c12");  // លឿង (ល្អ)
        else if (measured >= 30) setColor("#e67e22");  // ទឹកក្រូច (មធ្យម)
        else setColor("#e74c3c");                      // ក្រហម (យឺត)
        frameCount.current = 0;
        lastTime.current = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        padding: "8px 14px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        fontSize: 13,
        fontFamily: "monospace",
        fontWeight: "bold",
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 6,
        borderLeft: `3px solid ${color}`,
      }}
      title="Frames per second (measured live)"
    >
      <span style={{ color }}>●</span>
      {fps} FPS
    </div>
  );
}
