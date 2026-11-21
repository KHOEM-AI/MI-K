import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createOcean, createSkyAndLights } from './oceanEnvironment';
import { buildPrisonIsland } from './PrisonIsland3D';
import type { PrisonIslandConfig, TransportConfig } from './prisonTypes';

export function initOceanWorld(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(300, 200, 300);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  createSkyAndLights(scene);
  scene.add(createOcean(3000));

  const configs: PrisonIslandConfig[] = [
    { id: 'main-prison', name: 'Prison Island', type: 'main-island', position: [0, 0, 0] },
    { id: 'airport', name: 'Airport Island', type: 'airport-island', position: [350, 0, -200] },
    { id: 'port', name: 'Port Island', type: 'port-island', position: [-300, 0, 150] },
    { id: 'nature', name: 'Nature Island', type: 'nature-island', position: [250, 0, 300] }
  ];

  const transports: TransportConfig[] = [
    { type: 'ship', start: [-150, -2, 75], end: [0, -2, 75] },
    { type: 'plane', start: [150, 30, -100], end: [0, 30, 0] }
  ];

  const worldGroup = buildPrisonIsland(configs, transports);
  scene.add(worldGroup);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 50;
  controls.maxDistance = 1000;

  let animationFrameId: number;

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onWindowResize);

  // បង្កើត Function សម្រាប់សម្អាត (Cleanup) ដើម្បីកុំឱ្យ Memory លេចធ្លាយ
  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', onWindowResize);
    controls.dispose();
    renderer.dispose();
    // សម្អាត Geometry និង Material ទាំងអស់ក្នុង Scene
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((mat) => mat.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  };
}
