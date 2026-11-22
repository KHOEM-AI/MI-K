import { useEffect, useRef, useState } from 'react';
import { initOceanWorld } from './WorldBuilder';
import { createMinimapHTML } from './minimapUI';
import { INTERIOR_VIEWS } from './interiorViews';

export const OceanWorldViewer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [clickInfo, setClickInfo] = useState<{ title: string; desc: string } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = initOceanWorld(canvasRef.current);

    const timer = setTimeout(() => {
      const api = (window as any).__oceanAPI;
      if (!api || !containerRef.current) return;
      const minimap = createMinimapHTML((x: number, z: number) => api.flyTo(x, z));
      containerRef.current.appendChild(minimap);
    }, 100);

    const handleClick = (e: Event) => {
      const customEvent = e as CustomEvent;
      setClickInfo(customEvent.detail);
      setTimeout(() => setClickInfo(null), 3000); // បិទវិញក្រោយ 3 វិនាទី
    };
    window.addEventListener('ocean-click', handleClick);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('ocean-click', handleClick);
      if (cleanup) cleanup();
    };
  }, []);

  const call = (fn: () => void) => { try { fn(); } catch { /* noop */ } };
  const api = (window as any).__oceanAPI;

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  };

  const btnStyle = {
    padding: '10px 16px', borderRadius: '12px', cursor: 'pointer',
    color: '#fff', fontWeight: 600, fontSize: 13, transition: 'all 0.2s',
    ...glassStyle
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden', touchAction: 'none', fontFamily: 'sans-serif' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />

      {/* Title */}
      <div style={{ position: 'absolute', top: 20, left: 20, padding: '12px 24px', borderRadius: '16px', pointerEvents: 'none', zIndex: 10, ...glassStyle }}>
        <h1 style={{ margin: 0, fontSize: '22px', color: '#fff', letterSpacing: '1px' }}>MI-K-VISION-3D</h1>
        <p style={{ margin: 0, fontSize: '12px', color: '#00ffcc', fontWeight: 'bold' }}>@KHOEM-AI</p>
      </div>

      {/* Tools (E, G, H, Rain) */}
      <div style={{ position: 'absolute', top: 20, right: 220, zIndex: 10, display: 'flex', gap: 10 }}>
        <button onClick={() => call(() => api?.toggleSound())} style={btnStyle}>🔊 Sound</button>
        <button onClick={() => call(() => api?.toggleRain())} style={btnStyle}>🌧️ Rain</button>
        <button onClick={() => call(() => api?.toggleAlarm())} style={{...btnStyle, color: '#ff4444'}}>🚨 Alarm</button>
        <button onClick={() => call(() => api?.exportGLB())} style={btnStyle}>📦 Export</button>
        <button onClick={() => call(() => api?.triggerFirework())} style={{...btnStyle, color: '#ffdd00'}}>🎆 Firework</button>
        <button onClick={() => call(() => api?.toggleBuildMode())} style={btnStyle}>🏗️ Build</button>
        <button onClick={() => call(() => api?.takeScreenshot())} style={btnStyle}>📸 Photo</button>
      </div>

      {/* Time & Camera (A, C) */}
      <div style={{ position: 'absolute', bottom: 30, left: 20, zIndex: 10, display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: '60%' }}>
        {(['day', 'sunset', 'night'] as const).map((t) => (
          <button key={t} onClick={() => call(() => api?.setTime(t))} style={btnStyle}>
            {(t === 'day' ? '☀️' : t === 'sunset' ? '🌅' : '🌙') + ' ' + t.toUpperCase()}
          </button>
        ))}
        <button onClick={() => call(() => api?.toggleCinematic())} style={{ ...btnStyle, background: 'rgba(255, 215, 0, 0.2)' }}>🎬 Cinematic</button>
      </div>

      {/* Game Mode */}
      <div style={{ position: 'absolute', top: 90, left: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => call(() => { const n = api?.spawnPrisoner(); })} style={{...btnStyle, background: 'rgba(255,136,0,0.3)'}}>👤 Spawn Prisoner</button>
        <button onClick={() => call(() => { const n = api?.spawnGuard(); })} style={{...btnStyle, background: 'rgba(34,51,170,0.3)'}}>💂 Spawn Guard</button>
        <button onClick={() => call(() => { api?.clearSpawned(); })} style={{...btnStyle, background: 'rgba(200,50,50,0.3)'}}>🗑️ Clear All</button>
      </div>

      {/* Interior Views (D) */}
      <div style={{ position: 'absolute', bottom: 30, right: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {INTERIOR_VIEWS.map((v) => (
          <button key={v.id} onClick={() => call(() => api?.flyToInterior(v.id))} style={{ ...btnStyle, textAlign: 'left', background: 'rgba(231, 76, 60, 0.2)' }}>
            🚪 {v.nameKm}
          </button>
        ))}
      </div>

      {/* Click Info Panel */}
      {clickInfo && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '20px 40px', borderRadius: '20px', color: '#fff', textAlign: 'center', zIndex: 20, animation: 'fadeIn 0.3s ease-out', ...glassStyle, background: 'rgba(0,0,0,0.7)' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#00ffcc' }}>{clickInfo.title}</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '16px' }}>{clickInfo.desc}</p>
        </div>
      )}
    </div>
  );
};
