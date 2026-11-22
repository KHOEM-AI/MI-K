import * as THREE from 'three';

export interface InteriorView {
  id: string;
  name: string;
  nameKm: string;
  cameraPos: [number, number, number];
  target: [number, number, number];
}

// Positions are inside the main prison (island centre, island-local coords)
export const INTERIOR_VIEWS: InteriorView[] = [
  { id: 'cellblock', name: 'Cell Block', nameKm: 'បន្ទប់ឃុំឃាំង', cameraPos: [-20, 8, -10], target: [-20, 5, -20] },
  { id: 'exercise', name: 'Exercise Yard', nameKm: 'ទីធ្លាហាត់ប្រាណ', cameraPos: [-15, 10, 20], target: [0, 5, 15] },
  { id: 'admin', name: 'Admin Building', nameKm: 'អគាររដ្ឋបាល', cameraPos: [25, 10, -15], target: [20, 5, -20] },
  { id: 'cafeteria', name: 'Cafeteria', nameKm: 'អាហារដ្ឋាន', cameraPos: [-10, 6, 20], target: [-15, 4, 15] },
];

export function flyToInterior(camera: THREE.PerspectiveCamera, controls: { target: THREE.Vector3; update: () => void }, view: InteriorView): void {
  camera.position.set(...view.cameraPos);
  controls.target.set(...view.target);
  controls.update();
}
