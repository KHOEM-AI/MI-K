import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createOcean, createSkyAndLights } from './oceanEnvironment';
import { buildPrisonIsland } from './PrisonIsland3D';
import type { PrisonIslandConfig, TransportConfig } from './prisonTypes';

export function initOceanWorld(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  
  // រៀបចំកាមេរ៉ា
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(300, 200, 300);
  camera.lookAt(0, 0, 0);

  // រៀបចំ Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // បន្ថែមមេឃ ពន្លឺ និងសមុទ្រ
  createSkyAndLights(scene);
  scene.add(createOcean(3000));

  // កំណត់ទីតាំងកោះនីមួយៗ
  const configs: PrisonIslandConfig[] = [
    { id: 'main-prison', name: 'Prison Island', type: 'main-island', position: [0, 0, 0] },
    { id: 'airport', name: 'Airport Island', type: 'airport-island', position: [350, 0, -200] },
    { id: 'port', name: 'Port Island', type: 'port-island', position: [-300, 0, 150] },
    { id: 'nature', name: 'Nature Island', type: 'nature-island', position: [250, 0, 300] }
  ];

  // កំណត់ទីតាំងយានដឹកជញ្ជូន
  const transports: TransportConfig[] = [
    { type: 'ship', start: [-150, -2, 75], end: [0, -2, 75] },
    { type: 'plane', start: [150, 30, -100], end: [0, 30, 0] }
  ];

  // បង្កើត និងបន្ថែមកោះពន្ធនាគារទាំងអស់
  const worldGroup = buildPrisonIsland(configs, transports);
  scene.add(worldGroup);

  // បន្ថែមការគ្រប់គ្រងកាមេរ៉ា (រំកិល, ហ្សូម)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // កុំឱ្យកាមេរ៉ាចុះក្រោមទឹក
  controls.minDistance = 50;
  controls.maxDistance = 1000;

  // បង្កើត Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // គ្រប់គ្រងពេលទំហំអេក្រង់ប្តូរ
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
