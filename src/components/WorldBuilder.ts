import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createOcean, createSkyAndLights } from './oceanEnvironment';
import { buildPrisonIsland } from './PrisonIsland3D';
import type { PrisonIslandConfig, TransportConfig } from './prisonTypes';
import { createTransportPlane, createTransportShip } from './prisonGeometry';
import { applyTimePreset, createStars, TIME_PRESETS, type TimeOfDay } from './timeOfDay';
import { CinematicCamera } from './cinematicCamera';
import { WeatherSystem } from './weatherSystem';
import { createHelicopter } from './helicopter';
import { createMantaRay, createShark, createDolphin, createSeaTurtle, createFishSchool } from './marineLife';
import { OceanSoundManager } from './soundManager';
import { INTERIOR_VIEWS, flyToInterior } from './interiorViews';

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
  const hemiLight = scene.children.find((c) => c instanceof THREE.HemisphereLight) as THREE.HemisphereLight | undefined;
  const dirLight = scene.children.find((c) => c instanceof THREE.DirectionalLight) as THREE.DirectionalLight | undefined;
  const stars = createStars(500);
  scene.add(stars);
  let currentTime: TimeOfDay = 'day';
  const ocean = createOcean(3000);
  scene.add(ocean);

  const configs: PrisonIslandConfig[] = [
    { id: 'main-prison', name: 'Prison Island', type: 'main-island', position: [0, 0, 0] },
    { id: 'airport', name: 'Airport Island', type: 'airport-island', position: [350, 0, -200] },
    { id: 'port', name: 'Port Island', type: 'port-island', position: [-300, 0, 150] },
    { id: 'nature', name: 'Nature Island', type: 'nature-island', position: [250, 0, 300] }
  ];


  // បង្កើតសត្វសមុទ្រ
  const marineGroup = new THREE.Group();
  marineGroup.name = 'marine-life';
  
  // ហ្វូងត្រីតូចៗ ៥ កន្លែង
  for (let i = 0; i < 5; i++) {
    const school = createFishSchool(40);
    school.position.set(
      (Math.random() - 0.5) * 800,
      -10 - Math.random() * 5,
      (Math.random() - 0.5) * 800
    );
    marineGroup.add(school);
  }

  // ត្រីបង្ក ២
  for (let i = 0; i < 2; i++) {
    const ray = createMantaRay();
    ray.position.set((Math.random() - 0.5) * 600, -15, (Math.random() - 0.5) * 600);
    ray.scale.setScalar(1.5);
    marineGroup.add(ray);
  }

  // ត្រីឆ្លាម ២
  for (let i = 0; i < 2; i++) {
    const shark = createShark();
    shark.position.set((Math.random() - 0.5) * 600, -12, (Math.random() - 0.5) * 600);
    marineGroup.add(shark);
  }

  // ដុលហ្វីន ៣
  for (let i = 0; i < 3; i++) {
    const dolphin = createDolphin();
    dolphin.position.set((Math.random() - 0.5) * 600, -8, (Math.random() - 0.5) * 600);
    marineGroup.add(dolphin);
  }

  // អណ្តើក ២
  for (let i = 0; i < 2; i++) {
    const turtle = createSeaTurtle();
    turtle.position.set((Math.random() - 0.5) * 600, -6, (Math.random() - 0.5) * 600);
    marineGroup.add(turtle);
  }

  scene.add(marineGroup);

  // ចាប់យកសត្វទាំងអស់ដើម្បីធ្វើចលនា
  const mantaRays: THREE.Group[] = [];
  const sharks: THREE.Group[] = [];
  const dolphins: THREE.Group[] = [];
  const turtles: THREE.Group[] = [];
  const fishSchools: THREE.Group[] = [];

  marineGroup.traverse((obj) => {
    if (obj.name === 'manta-ray') mantaRays.push(obj as THREE.Group);
    if (obj.name === 'shark') sharks.push(obj as THREE.Group);
    if (obj.name === 'dolphin') dolphins.push(obj as THREE.Group);
    if (obj.name === 'turtle') turtles.push(obj as THREE.Group);
    if (obj.name === 'fish-school') fishSchools.push(obj as THREE.Group);
  });

    const worldGroup = buildPrisonIsland(configs, []);
  const weather = new WeatherSystem();
  scene.add(weather.rain);
  scene.add(weather.clouds);
  
  const heli = createHelicopter();
  heli.position.set(-30, 40, -35); // លើអគាររដ្ឋបាល
  scene.add(heli);
  
  // ចុចមើលព័ត៌មាន
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      let obj: any = intersects[0].object;
      let info = null;
      
      // រកមើលឈ្មោះវត្ថុ
      while (obj) {
        if (obj.name === 'manta-ray') info = { title: 'Manta Ray', desc: 'ត្រីបង្កដ៏ធំ' };
        else if (obj.name === 'shark') info = { title: 'Shark', desc: 'ត្រីឆ្លាម' };
        else if (obj.name === 'dolphin') info = { title: 'Dolphin', desc: 'ដុលហ្វីន' };
        else if (obj.name === 'turtle') info = { title: 'Sea Turtle', desc: 'អណ្តើកសមុទ្រ' };
        else if (obj.name === 'fish-school') info = { title: 'Fish School', desc: 'ហ្វូងត្រីតូចៗ' };
        else if (obj.name === 'prison-bus') info = { title: 'Prison Bus', desc: 'ឡានដឹកអ្នកទោស' };
        else if (obj.name === 'helicopter') info = { title: 'Helicopter', desc: 'ឧទ្ធម្ភាគចក្រ' };
        else if (obj.name === 'theme-airport') info = { title: 'Airport Island', desc: 'កោះព្រលានយន្តហោះ' };
        else if (obj.name === 'theme-port') info = { title: 'Port Island', desc: 'កោះកំពង់ផែ' };
        else if (obj.name === 'theme-nature') info = { title: 'Nature Island', desc: 'កោះធម្មជាតិ' };
        else if (obj.name === 'main-island') info = { title: 'Prison Island', desc: 'កោះពន្ធនាគារ' };
        
        if (info) break;
        obj = obj.parent;
      }
      
      if (info) {
        window.dispatchEvent(new CustomEvent('ocean-click', { detail: info }));
      }
    }
  });
  scene.add(worldGroup);

  // ចាប់យកតួអង្គដែលត្រូវធ្វើចលនា
  const walkers: THREE.Group[] = [];
  const patrollers: THREE.Group[] = [];
  let fountainWater: THREE.Mesh | null = null;

  worldGroup.traverse((obj) => {
    if (obj.name === 'walking-prisoner') walkers.push(obj as THREE.Group);
    if (obj.name === 'patrol-guard') patrollers.push(obj as THREE.Group);
    if (obj.name === 'fountain-water') fountainWater = obj as THREE.Mesh;
  });

  // ចាប់យកតួអង្គទាំងអស់ និងឡានដឹកអ្នកទោស
  const allCharacters: THREE.Group[] = [];
  let prisonBus: THREE.Object3D | null = null;
  
  scene.traverse((obj) => {
    if (obj.name === 'head' || (obj.parent && obj.parent.parent && obj.parent.parent.name === 'theme-airport')) {
       // តួអង្គគឺជា Group ដែលមានកូនឈ្មោះ head
       if (obj.name === 'head' && obj.parent instanceof THREE.Group) {
         if (!allCharacters.includes(obj.parent)) allCharacters.push(obj.parent);
       }
    }
    if (obj.name === 'prison-bus') prisonBus = obj;
  });

    const ship = createTransportShip();
  ship.position.set(-150, -2, 75);
  scene.add(ship);

  const plane = createTransportPlane();
  plane.position.set(150, 30, -100);
  scene.add(plane);

  const cinematic = new CinematicCamera();
  const sound = new OceanSoundManager();
  let isBuildMode = false;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const buildGroup = new THREE.Group();
  scene.add(buildGroup);

  canvas.addEventListener('pointerdown', (e) => {
    if (!isBuildMode) return;
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(worldGroup.children, true);
    if (hits.length > 0) {
      const pt = hits[0].point;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(6, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 })
      );
      box.position.copy(pt);
      box.position.y += 4;
      box.castShadow = true;
      box.receiveShadow = true;
      buildGroup.add(box);
    }
  });
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 50;
  controls.maxDistance = 1000;

  let animationFrameId: number;
  const clock = new THREE.Clock();

  function animate() {
    animationFrameId = requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);
    const time = clock.getElapsedTime();

    // Cinematic camera
    cinematic.update(camera, controls, Math.min(dt, 0.1));

    // ចលនាសត្វសមុទ្រ
    mantaRays.forEach((ray, idx) => {
      const angle = time * 0.15 + idx * Math.PI;
      ray.position.x = Math.cos(angle) * 150;
      ray.position.z = Math.sin(angle) * 150;
      ray.position.y = -15 + Math.sin(time * 0.5 + idx) * 2;
      ray.rotation.y = -angle;
      ray.rotation.z = Math.sin(time * 1.5 + idx) * 0.2;
    });

    sharks.forEach((shark, idx) => {
      const angle = time * 0.2 + idx * Math.PI + 1;
      shark.position.x = Math.cos(angle) * 200;
      shark.position.z = Math.sin(angle) * 200;
      shark.position.y = -12 + Math.sin(time * 0.7 + idx) * 1.5;
      shark.rotation.y = -angle - Math.PI / 2;
      shark.rotation.z = Math.sin(time * 2 + idx) * 0.1;
    });

    dolphins.forEach((dolphin, idx) => {
      const angle = time * 0.25 + idx * Math.PI;
      dolphin.position.x = Math.cos(angle) * 180;
      dolphin.position.z = Math.sin(angle) * 180;
      dolphin.position.y = -8 + Math.sin(time * 1.2 + idx) * 2.5;
      dolphin.rotation.y = -angle - Math.PI / 2;
    });

    turtles.forEach((turtle, idx) => {
      const angle = time * 0.1 + idx * Math.PI;
      turtle.position.x = Math.cos(angle) * 100;
      turtle.position.z = Math.sin(angle) * 100;
      turtle.position.y = -6 + Math.sin(time * 0.3 + idx) * 0.8;
      turtle.rotation.y = -angle - Math.PI / 2;
    });

    fishSchools.forEach((school, idx) => {
      const angle = time * 0.18 + idx;
      school.position.x = Math.cos(angle) * 120;
      school.position.z = Math.sin(angle) * 120;
      school.position.y = -10 + Math.sin(time * 0.5 + idx) * 2;
      school.rotation.y = -angle;
    });

        weather.update(time, dt);
    
    // ចលនាឧទ្ធម្ភាគចក្រ (ហោះឡើងចុះ)
    heli.position.y = 40 + Math.sin(time * 0.8) * 3;
    heli.rotation.y = Math.sin(time * 0.2) * 0.2;
    const mainRotor = heli.getObjectByName('main-rotor');
    const tailRotor = heli.getObjectByName('tail-rotor');
    if (mainRotor) mainRotor.rotation.y = time * 20;
    if (tailRotor) tailRotor.rotation.x = time * 30;

    // ចលនាតួអង្គ (ដកដង្ហើម និងកម្រើកក្បាល)
    allCharacters.forEach((char, idx) => {
      const offset = idx * 0.5;
      const head = char.getObjectByName('head');
      const body = char.getObjectByName('body');
      if (head) {
        head.rotation.y = Math.sin(time * 0.8 + offset) * 0.2;
        head.rotation.x = Math.sin(time * 1.2 + offset) * 0.05;
      }
      if (body) {
        // ដកដង្ហើមបន្តិចៗ
        body.scale.y = 1 + Math.sin(time * 2 + offset) * 0.03;
      }
    });

    // ចលនាឡានដឹកអ្នកទោស (រង្វង់ជុំវិញកោះ)
    if (prisonBus) {
      const busSpeed = time * 0.15;
      prisonBus.position.x = Math.cos(busSpeed) * 25;
      prisonBus.position.z = Math.sin(busSpeed) * 25;
      prisonBus.rotation.y = -busSpeed;
    }

    // Advance water shader
    const waterMat = ocean.userData.waterMaterial as THREE.ShaderMaterial | undefined;
    if (waterMat) waterMat.uniforms.uTime.value = time;

    // ចលនាកប៉ាល់ និងយន្តហោះ
    ship.position.x = -150 + Math.sin(time * 0.5) * 100;
    ship.rotation.y = Math.cos(time * 0.5) > 0 ? 0 : Math.PI;

    plane.position.x = Math.cos(time * 0.3) * 400;
    plane.position.z = Math.sin(time * 0.3) * 400;
    plane.position.y = 50 + Math.sin(time * 2) * 5;
    plane.rotation.y = -time * 0.3 + Math.PI / 2;

    // ចលនាអ្នកទោសដើរ (ដើរជារង្វង់ និងកម្រើកដៃជើង)
    walkers.forEach((w, idx) => {
      const speed = time * 0.5 + idx * Math.PI;
      w.position.x = Math.cos(speed) * 15;
      w.position.z = Math.sin(speed) * 15;
      w.rotation.y = -speed + Math.PI / 2;

      const lArm = w.getObjectByName('left-arm');
      const rArm = w.getObjectByName('right-arm');
      const lLeg = w.getObjectByName('left-leg');
      const rLeg = w.getObjectByName('right-leg');
      if (lArm && rArm && lLeg && rLeg) {
        lArm.rotation.x = Math.sin(time * 6) * 0.5;
        rArm.rotation.x = -Math.sin(time * 6) * 0.5;
        lLeg.rotation.x = -Math.sin(time * 6) * 0.5;
        rLeg.rotation.x = Math.sin(time * 6) * 0.5;
      }
    });

    // ចលនាអ្នកយាមល្បាតលើជញ្ជាំង (រង្វង់ធំ)
    patrollers.forEach((p, idx) => {
      const speed = time * 0.2 + idx;
      p.position.x = Math.cos(speed) * 40;
      p.position.z = Math.sin(speed) * 40;
      p.rotation.y = -speed;

      const lLeg = p.getObjectByName('left-leg');
      const rLeg = p.getObjectByName('right-leg');
      if (lLeg && rLeg) {
        lLeg.rotation.x = -Math.sin(time * 4) * 0.4;
        rLeg.rotation.x = Math.sin(time * 4) * 0.4;
      }
    });

    // ចលនាទឹកផុស
    if (fountainWater) {
      fountainWater.position.y = 2.9 + Math.sin(time * 3) * 0.2;
      fountainWater.scale.x = 1 + Math.sin(time * 2) * 0.1;
      fountainWater.scale.z = 1 + Math.sin(time * 2) * 0.1;
    }

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

  // Expose debug API for OceanWorldViewer UI
  (window as any).__oceanAPI = {
    toggleSound: () => sound.toggle(),
    toggleRain: () => weather.toggleRain(),
    toggleBuildMode: () => {
      isBuildMode = !isBuildMode;
      return isBuildMode;
    },
    takeScreenshot: () => {
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MI-K-VISION-3D-' + Date.now() + '.png';
      a.click();
    },
    setTime: (t: TimeOfDay) => {
      currentTime = t;
      applyTimePreset(scene, TIME_PRESETS[t], hemiLight ?? null, dirLight ?? null);
      stars.visible = t === 'night';
    },
    toggleCinematic: () => cinematic.toggle(),
    flyTo: (x: number, z: number) => {
      controls.target.set(x, 0, z);
      camera.position.set(x + 200, 150, z + 200);
      controls.update();
    },
    flyToInterior: (id: string) => {
      const view = INTERIOR_VIEWS.find((v) => v.id === id);
      if (view) flyToInterior(camera, controls, view);
    },
  };

  return () => {
    delete (window as any).__oceanAPI;
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
