export interface IslandMarker {
  id: string;
  name: string;
  nameKm: string;
  x: number;
  z: number;
  color: string;
}

export const ISLAND_MARKERS: IslandMarker[] = [
  { id: 'main-prison', name: 'Prison', nameKm: 'គុក', x: 0, z: 0, color: '#e74c3c' },
  { id: 'airport', name: 'Airport', nameKm: 'យន្តហោះ', x: 350, z: -200, color: '#3498db' },
  { id: 'port', name: 'Port', nameKm: 'កំពង់ផែ', x: -300, z: 150, color: '#f39c12' },
  { id: 'nature', name: 'Nature', nameKm: 'ធម្មជាតិ', x: 250, z: 300, color: '#27ae60' },
];

export function createMinimapHTML(onIslandClick: (x: number, z: number) => void): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute; top: 20px; right: 20px; z-index: 10;
    width: 180px; height: 180px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,105,148,0.85) 0%, rgba(0,47,95,0.95) 100%);
    border: 3px solid rgba(255,255,255,0.3); box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    pointer-events: auto;
  `;
  
  const centerX = 90, centerY = 90, scale = 90 / 450;
  
  ISLAND_MARKERS.forEach((island) => {
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute;
      left: ${centerX + island.x * scale - 8}px;
      top: ${centerY + island.z * scale - 8}px;
      width: 16px; height: 16px; border-radius: 50%;
      background: ${island.color};
      border: 2px solid white; cursor: pointer;
      transition: transform 0.2s;
      box-shadow: 0 0 8px ${island.color};
    `;
    dot.title = `${island.name} (${island.nameKm})`;
    dot.addEventListener('mouseenter', () => { dot.style.transform = 'scale(1.4)'; });
    dot.addEventListener('mouseleave', () => { dot.style.transform = 'scale(1)'; });
    dot.addEventListener('click', () => onIslandClick(island.x, island.z));
    container.appendChild(dot);
  });
  
  const label = document.createElement('div');
  label.style.cssText = 'position: absolute; bottom: 4px; left: 0; right: 0; text-align: center; color: #fff; font-size: 10px; font-family: monospace; text-shadow: 0 1px 3px #000; pointer-events: none;';
  label.textContent = 'KHOEM-AI MAP';
  container.appendChild(label);
  
  return container;
}
