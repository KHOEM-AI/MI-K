import * as THREE from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createOcean } from "./oceanEnvironment";
import { buildPrisonIsland } from "./PrisonIsland3D";
import type { PrisonIslandConfig } from "./prisonTypes";
import {
  createHospitalBuilding, createDriveway, createHospitalSign, createAmbulance, createSirenLight,
  createDoctor, createFemaleDoctor, createNurse, createSecurityGuard, createTree, createHelipad,
  createHelicopter, createGarden, createRubberRoad,
} from "./hospitalGeometry";

// One big world around the village.
//
//   west  : (the village itself, built by Village3D, centre 0,0)
//   east  : hospital campus (x = 620), joined to the village by a road
//   south : beach, then the sea with four islands (prison, airport, port, nature)
//
// What was left out of the old stand-alone pages, because the village already has it or it is heavy:
// School 3D (the village has its school), the hospital's own houses/market/traffic (same as the village),
// the hospital interiors, the sea page's weather/rain/traffic lights/fireworks/guard dogs/marine life.
//
// Far zones are built only when the camera comes near, and hidden again when it leaves, so the village
// does not get slower just because the world is bigger.

export const MEGA_ZONES: { id: string; label: string }[] = [
  { id: "village", label: "ភូមិ" },
  { id: "hospital", label: "មន្ទីរពេទ្យ" },
  { id: "sea", label: "សមុទ្រ" },
  { id: "prison", label: "កោះគុក" },
  { id: "airport", label: "ព្រលានយន្តហោះ" },
  { id: "port", label: "កំពង់ផែ" },
  { id: "nature", label: "កោះធម្មជាតិ" },
];

type V3 = [number, number, number];

interface Zone {
  id: string;
  center: THREE.Vector3;
  radius: number;                       // built + shown while the camera is closer than this
  view: { pos: V3; target: V3 };
  build: () => THREE.Object3D;
  update?: (t: number, nightK: number) => void;
  root?: THREE.Object3D;
}

const VILLAGE_VIEW = { pos: [150, 100, 200] as V3, target: [0, 10, 0] as V3 };

function flat(w: number, d: number, color: number | string, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}

function buildHospitalCampus(): THREE.Object3D {
  const g = new THREE.Group();
  g.name = "mega-hospital";
  g.position.set(620, 0, 0);
  g.rotation.y = -Math.PI / 2;                       // the front gate faces the village road (west)

  g.add(flat(260, 260, 0x7cb342, 0, 0.01, 0));
  g.add(createGarden());
  const driveway = createDriveway(); driveway.position.set(0, 0, 5); g.add(driveway);
  const hospital = createHospitalBuilding(); hospital.position.set(0, 0, -5); g.add(hospital);
  const road = createRubberRoad(8, 40); road.position.set(0, 0, 35); g.add(road);

  const sign = createHospitalSign(THREE); sign.position.set(0, 32.5, -5); g.add(sign);
  const pad = createHelipad(); pad.position.set(0, 30.2, -5); g.add(pad);
  const heli = createHelicopter(); heli.position.set(0, 30.8, -5); g.add(heli);

  const ambulance = createAmbulance(); ambulance.position.set(-8, 0, 18); g.add(ambulance);
  const siren = createSirenLight(); siren.position.set(-8.6, 2.6, 20.5); g.add(siren);
  const people: [THREE.Object3D, number, number][] = [
    [createDoctor(false), -2, 12], [createFemaleDoctor(), 2, 12], [createNurse(), 4, 6], [createSecurityGuard(), 8, 22],
  ];
  for (const [p, x, z] of people) { p.position.set(x, 0, z); g.add(p); }

  const trees: [boolean, number, number][] = [
    [true, -45, -25], [true, 45, -25], [false, -45, 10], [false, 45, 10],
    [true, -35, 45], [true, 35, 45], [false, 0, -50], [true, -70, -40], [true, 70, -40],
  ];
  for (const [big, x, z] of trees) { const t = createTree(big); t.position.set(x, 0, z); g.add(t); }
  return g;
}

function buildIsland(cfg: PrisonIslandConfig, at: V3): THREE.Object3D {
  const root = buildPrisonIsland([{ ...cfg, position: [0, 0, 0] }], []);
  root.position.set(at[0], at[1], at[2]);
  return root;
}

export interface MegaWorld {
  tick(camPos: THREE.Vector3, t: number, night: boolean): void;
  flyTo(id: string, camera: THREE.PerspectiveCamera, controls: OrbitControls): void;
  dispose(): void;
}

export function createMegaWorld(scene: THREE.Scene): MegaWorld {
  // ---- always-on, very cheap: wide ground, beach, road to the hospital ----
  const base = new THREE.Group();
  base.name = "mega-base";
  base.add(flat(2400, 1220, 0x6aa84f, 0, -0.3, -90));          // grass under the whole land
  base.add(flat(2400, 80, 0xe0c98b, 0, -0.15, 500));           // beach
  base.add(flat(400, 14, 0x2b2b2b, 390, 0.05, 0));             // village -> hospital road
  base.add(flat(400, 0.5, 0xf5f5f5, 390, 0.06, 0));            // centre line
  scene.add(base);

  // ---- sea ----
  let waterMat: THREE.ShaderMaterial | null = null;
  const deep = new THREE.Color(0x002f5f), shallow = new THREE.Color(0x4a9fd4);
  const SEA_CENTER = new THREE.Vector3(0, -3, 1500);

  const islands: Record<string, { cfg: PrisonIslandConfig; at: V3 }> = {
    prison: { cfg: { id: "main-prison", name: "Prison Island", type: "main-island", position: [0, 0, 0] }, at: [0, 0, 1100] },
    airport: { cfg: { id: "airport", name: "Airport Island", type: "airport-island", position: [0, 0, 0] }, at: [350, 0, 900] },
    port: { cfg: { id: "port", name: "Port Island", type: "port-island", position: [0, 0, 0] }, at: [-300, 0, 1250] },
    nature: { cfg: { id: "nature", name: "Nature Island", type: "nature-island", position: [0, 0, 0] }, at: [250, 0, 1400] },
  };

  const zones: Zone[] = [
    {
      id: "hospital", center: new THREE.Vector3(620, 0, 0), radius: 450,
      view: { pos: [500, 55, 70], target: [620, 12, 0] }, build: buildHospitalCampus,
    },
    {
      id: "sea", center: SEA_CENTER.clone(), radius: 1250,
      view: { pos: [0, 140, 560], target: [0, 0, 900] },
      build: () => {
        const ocean = createOcean(2000);
        ocean.position.set(SEA_CENTER.x, SEA_CENTER.y, SEA_CENTER.z);
        waterMat = ocean.userData.waterMaterial as THREE.ShaderMaterial;
        return ocean;
      },
      update: (t, nightK) => {
        if (!waterMat) return;
        waterMat.uniforms.uTime.value = t;
        (waterMat.uniforms.uColorDeep.value as THREE.Color).copy(deep).multiplyScalar(nightK);
        (waterMat.uniforms.uColorShallow.value as THREE.Color).copy(shallow).multiplyScalar(nightK);
      },
    },
  ];
  const islandViews: Record<string, { pos: V3; target: V3 }> = {
    prison: { pos: [120, 80, 1010], target: [0, 5, 1100] },
    airport: { pos: [440, 80, 800], target: [350, 5, 900] },
    port: { pos: [-210, 80, 1150], target: [-300, 5, 1250] },
    nature: { pos: [330, 80, 1300], target: [250, 5, 1400] },
  };
  for (const id of Object.keys(islands)) {
    const { cfg, at } = islands[id];
    zones.push({
      id, center: new THREE.Vector3(at[0], 0, at[2]), radius: 650, view: islandViews[id],
      build: () => buildIsland(cfg, at),
    });
  }

  const ensure = (z: Zone) => {
    if (!z.root) { z.root = z.build(); scene.add(z.root); }
    z.root.visible = true;
  };

  let frame = 0;
  let nightK = 1;
  let fly: null | { camera: THREE.PerspectiveCamera; controls: OrbitControls; p0: THREE.Vector3; p1: THREE.Vector3; t0: THREE.Vector3; t1: THREE.Vector3; start: number } = null;

  return {
    tick(camPos, t, night) {
      if (frame++ % 20 === 0) {
        for (const z of zones) {
          if (camPos.distanceTo(z.center) < z.radius) ensure(z);
          else if (z.root) z.root.visible = false;
        }
      }
      nightK += ((night ? 0.25 : 1) - nightK) * 0.05;
      for (const z of zones) if (z.root && z.root.visible && z.update) z.update(t, nightK);

      if (fly) {                                         // smooth 1.4 s camera flight
        const k = Math.min(1, (t - fly.start) / 1.4);
        const e = k * k * (3 - 2 * k);
        fly.camera.position.lerpVectors(fly.p0, fly.p1, e);
        fly.controls.target.lerpVectors(fly.t0, fly.t1, e);
        if (k >= 1) fly = null;
      }
    },

    flyTo(id, camera, controls) {
      let view = VILLAGE_VIEW;
      if (id !== "village") {
        const z = zones.find((q) => q.id === id);
        if (!z) return;
        ensure(z);                                       // already built when the camera arrives
        view = z.view;
      }
      fly = {
        camera, controls,
        p0: camera.position.clone(), p1: new THREE.Vector3(...view.pos),
        t0: controls.target.clone(), t1: new THREE.Vector3(...view.target),
        start: performance.now() / 1000,
      };
    },

    dispose() {
      const free = (o: THREE.Object3D) => {
        o.traverse((n) => {
          const m = n as THREE.Mesh;
          if (!m.isMesh) return;
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          for (const x of mats) x?.dispose();
        });
      };
      free(base); scene.remove(base);
      for (const z of zones) if (z.root) { free(z.root); scene.remove(z.root); z.root = undefined; }
    },
  };
}
