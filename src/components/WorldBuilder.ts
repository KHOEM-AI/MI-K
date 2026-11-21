import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createOcean, createSkyAndLights } from './oceanEnvironment';
import { buildPrisonIsland } from './PrisonIsland3D';
import type { PrisonIslandConfig, TransportConfig } from './prisonTypes';
import { createTransportPlane, createTransportShip } from './prisonGeometry'; // នាំចូលដើម្បីបង្កើតចលនា

export function initOceanWorld(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(400, 250, 400);
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

  // បង្កើតកោះ (មិនដាក់ transport ក្នុងនេះទេ ដើម្បីងាយស្រួលធ្វើចលនា)
  const worldGroup = buildPrisonIsland(configs, []);
  scene.add(worldGroup);

  // ----------------------------------------------------
  // បន្ថែមចលនាកប៉ាល់ និងយន្តហោះ
  // ----------------------------------------------------
  const ship = createTransportShip();
  ship.position.set(-150, -2, 75);
  scene.add(ship);

  const plane = createTransportPlane();
  plane.position.set(150, 30, -100);
  scene.add(plane);

  // បង្កើតកាមេរ៉ា និងការគ្រប់គ្រង
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 50;
  controls.maxDistance = 1000;

  let animationFrameId: number;
  let clock = new THREE.Clock();

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();

    // ធ្វើឱ្យកប៉ាល់រំកិលទៅមុខ-ថយក្រោយ
    ship.position.x = -150 + Math.sin(time * 0.5) * 100;
    ship.rotation.y = Math.cos(time * 0.5) > 0 ? 0 : Math.PI;

    // ធ្វើឱ្យយន្តហោះហោះជុំវិញកោះ (គន្លងរង្វង់)
    plane.position.x = Math.cos(time * 0.3) * 400;
    plane.position.z = Math.sin(time * 0.3) * 400;
    plane.position.y = 50 + Math.sin(time * 2) * 5; // លោតឡើងចុះបន្តិច
    
    // បង្វិលយន្តហោះឱ្យត្រូវនឹងទិសដៅហោះ
    plane.rotation.y = -time * 0.3 + Math.PI / 2;

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

  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', onWindowResize);
    controls.dispose();
    renderer.dispose();
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
