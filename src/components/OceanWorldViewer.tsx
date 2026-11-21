import { useEffect, useRef } from 'react';
import { initOceanWorld } from './WorldBuilder';

export const OceanWorldViewer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // ហៅយក Function ដែលយើងបានសរសេរក្នុង WorldBuilder
      initOceanWorld(canvasRef.current);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
      
      {/* បង្ហាញឈ្មោះម៉ាកយីហោរបស់បងនៅលើអេក្រង់ */}
      <div style={{
        position: 'absolute', top: 20, left: 20, color: 'white', 
        background: 'rgba(0,0,0,0.5)', padding: '10px 20px', borderRadius: '8px',
        fontFamily: 'sans-serif', pointerEvents: 'none'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>MI-K-VISION-3D</h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#00ffcc' }}>@KHOEM-AI</p>
      </div>
    </div>
  );
};
