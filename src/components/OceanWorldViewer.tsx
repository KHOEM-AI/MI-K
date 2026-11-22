import { useEffect, useRef } from 'react';
import { initOceanWorld } from './WorldBuilder';
import { createMinimapHTML } from './minimapUI';
import { INTERIOR_VIEWS } from './interiorViews';

export const OceanWorldViewer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = initOceanWorld(canvasRef.current);

    // Wait a tick for __oceanAPI to be ready
    const timer = setTimeout(() => {
      const api = (window as any).__oceanAPI;
      if (!api || !containerRef.current) return;
      
      // B) Minimap
      const minimap = createMinimapHTML((x: number, z: number) => api.flyTo(x, z));
      containerRef.current.appendChild(minimap);
    }, 100);

    return () => {
      clearTimeout(timer);
      if (cleanup) cleanup();
    };
  }, []);

  const call = (fn: () => void) => { try { fn(); } catch { /* noop */ } };
  const api = (window as any).__oceanAPI;

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Title badge */}
      <div style={{
        position: 'absolute', top: 20, left: 20, color: 'white',
        background: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '8px',
        fontFamily: 'sans-serif', pointerEvents: 'none', zIndex: 10
      }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>MI-K-VISION-3D</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#00ffcc' }}>@KHOEM-AI</p>
      </div>

      {/* A) Time of day buttons */}
      <div style={{ position: 'absolute', bottom: 20, left: 20, zIndex: 10, display: 'flex', gap: 8 }}>
        {(['day', 'sunset', 'night'] as const).map((t) => (
          <button key={t} type="button" onClick={() => call(() => api?.setTime(t))} style={{
            padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 13,
            backdropFilter: 'blur(4px)',
          }}>{(t === 'day' ? '☀️' : t === 'sunset' ? '🌅' : '🌙') + ' ' + t}</button>
        ))}
        <button type="button" onClick={() => call(() => api?.toggleCinematic())} style={{
          padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: 13,
        }}>🎬 Cinematic</button>
      </div>

      {/* D) Interior view buttons */}
      <div style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {INTERIOR_VIEWS.map((v) => (
          <button key={v.id} type="button" onClick={() => call(() => api?.flyToInterior(v.id))} style={{
            padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(231,76,60,0.7)', color: '#fff', fontWeight: 600, fontSize: 12,
            textAlign: 'left',
          }}>🚪 {v.nameKm}</button>
        ))}
      </div>
    </div>
  );
};
