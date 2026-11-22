import * as THREE from 'three';

export type TimeOfDay = 'day' | 'sunset' | 'night';

export interface TimePreset {
  bg: number;
  fog: number;
  fogNear: number;
  fogFar: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  dirColor: number;
  dirIntensity: number;
  sunPosition: [number, number, number];
}

export const TIME_PRESETS: Record<TimeOfDay, TimePreset> = {
  day: {
    bg: 0x87ceeb, fog: 0x87ceeb, fogNear: 500, fogFar: 1500,
    hemiSky: 0xffffff, hemiGround: 0x444444, hemiIntensity: 0.7,
    dirColor: 0xffffff, dirIntensity: 1.2, sunPosition: [200, 300, 100],
  },
  sunset: {
    bg: 0xff6b35, fog: 0xff8c5a, fogNear: 400, fogFar: 1200,
    hemiSky: 0xffb380, hemiGround: 0x2c1810, hemiIntensity: 0.5,
    dirColor: 0xff8844, dirIntensity: 1.6, sunPosition: [-200, 80, 200],
  },
  night: {
    bg: 0x05060f, fog: 0x05060f, fogNear: 300, fogFar: 1000,
    hemiSky: 0x2a3a5a, hemiGround: 0x0a0a15, hemiIntensity: 0.25,
    dirColor: 0x6a8acc, dirIntensity: 0.4, sunPosition: [-100, 200, -100],
  },
};

export function applyTimePreset(scene: THREE.Scene, preset: TimePreset, hemi: THREE.HemisphereLight | null, dir: THREE.DirectionalLight | null): void {
  scene.background = new THREE.Color(preset.bg);
  scene.fog = new THREE.Fog(preset.fog, preset.fogNear, preset.fogFar);
  if (hemi) {
    hemi.color.setHex(preset.hemiSky);
    hemi.groundColor.setHex(preset.hemiGround);
    hemi.intensity = preset.hemiIntensity;
  }
  if (dir) {
    dir.color.setHex(preset.dirColor);
    dir.intensity = preset.dirIntensity;
    dir.position.set(...preset.sunPosition);
  }
}

export function createStars(count: number = 500): THREE.Points {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 800 + Math.random() * 200;
    positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i*3+1] = Math.abs(r * Math.cos(phi)) + 200;
    positions[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: true, transparent: true, opacity: 0.9 });
  const points = new THREE.Points(geo, mat);
  points.name = 'stars';
  points.visible = false;
  return points;
}
