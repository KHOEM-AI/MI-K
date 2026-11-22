import { VillageRegistry } from "./villageSimulation";
import { HOUSE_COUNT, houseSlots, placesOf, planRoute, type Place, type PlaceKind, type Pt } from "./villageLayout";
import * as THREE from "three";
import { createHumanFigure } from "./humanFigure";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   Villagers: daily routine by job, walking on the street, real doors
   ============================================================ */
export type VillagerRole = "farmer" | "factory" | "market" | "shopkeeper" | "elder";
type Dest = "home" | "work" | "social";

export interface Villager {
  mesh: THREE.Group;
  role: VillagerRole;
  homePos: THREE.Vector3;   // front door of their own house
  workPos: THREE.Vector3;   // personal spot inside the workplace (nobody shares a spot)
  workPlace: Place;
  shirtColor: string;
  state: "inside" | "walking" | "busy";
  dest: Dest;               // where they are, or are walking to
  schedule: { hour: number; dest: Dest }[];
  route: Pt[];
  routeIndex: number;
  walkSpeed: number;        // scene units per second
  yaw: number;
  gait: number;             // 0 standing .. 1 full stride (eases in and out)
  phase: number;
  idleTurnAt: number;
  idleYaw: number;
  limbs: { legs: THREE.Object3D[]; arms: THREE.Object3D[] };
}

export function createVillager(shirtColor = "#3498db"): THREE.Group {
  const n = shirtColor.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const skins = [0xc58e69, 0xc99672, 0xb98560, 0xd0a07c];
  const female = n % 3 === 0;
  return createHumanFigure({
    height: 1.95 + (n % 5) * 0.04, shirt: shirtColor, pants: female ? 0x3b2f5e : 0x2c3e50,
    skin: skins[n % skins.length], female, skirt: female, hairStyle: female ? "long" : "short", longSleeves: false,
  });
}

const ROLES: VillagerRole[] = ["farmer", "farmer", "farmer", "factory", "factory", "market", "market", "shopkeeper", "elder", "elder"];
const PLACE_KIND: Record<VillagerRole, PlaceKind> = {
  farmer: "field", factory: "factory", market: "market", shopkeeper: "shop", elder: "plaza",
};

/** Different hours for different jobs, with a small personal offset so nobody leaves at the same second. */
function makeSchedule(role: VillagerRole, i: number): Villager["schedule"] {
  const j = ((i * 37) % 13) / 13 - 0.5; // -0.5 .. +0.5 hours
  const evening = i % 3 === 0;
  switch (role) {
    case "farmer": return [{ hour: 5.6 + j, dest: "work" }, { hour: 17.4 + j, dest: "home" }, ...(evening ? [{ hour: 19 + j, dest: "social" as Dest }, { hour: 20.5, dest: "home" as Dest }] : [])];
    case "factory": return [{ hour: 6.7 + j, dest: "work" }, { hour: 17 + j, dest: "home" }, ...(evening ? [{ hour: 19.2, dest: "social" as Dest }, { hour: 21, dest: "home" as Dest }] : [])];
    case "market": return [{ hour: 7.4 + j, dest: "work" }, { hour: 17.6 + j, dest: "home" }];
    case "shopkeeper": return [{ hour: 7.9 + j * 0.5, dest: "work" }, { hour: 18 + j * 0.5, dest: "home" }];
    default: return [{ hour: 6 + j, dest: "social" }, { hour: 10 + j, dest: "home" }, { hour: 15.5 + j, dest: "social" }, { hour: 18 + j, dest: "home" }];
  }
}

/** Where is this person supposed to be at this hour? Before the first stop, the last stop of yesterday still counts. */
function scheduledDest(sc: Villager["schedule"], hour: number): Dest {
  let d = sc[sc.length - 1].dest;
  for (const s of sc) if (hour >= s.hour) d = s.dest;
  return d;
}

/** A personal spot around a place (golden-angle spiral): 100 people never stack on one point. */
function slotAround(place: Place, k: number): Pt {
  if (place.radius <= 2) return { x: place.x + ((k % 5) - 2) * 0.8, z: place.z };
  const ang = k * 2.399963;
  const r = Math.min(place.radius, 1.2 + 0.9 * Math.sqrt(k));
  return { x: place.x + Math.cos(ang) * r, z: place.z + Math.sin(ang) * r };
}

export function createVillagers(count = 100): { group: THREE.Group; villagers: Villager[] } {
  const group = new THREE.Group();
  const villagers: Villager[] = [];
  const shirtColors = ["#3498db", "#e74c3c", "#f39c12", "#27ae60", "#9b59b6", "#1abc9c", "#e67e22", "#2c3e50"];
  const used = new Map<string, number>();
  const slots = houseSlots(HOUSE_COUNT).slice(0, count);

  slots.forEach((house, i) => {
    const role = ROLES[i % ROLES.length];
    const places = placesOf(PLACE_KIND[role]);
    // neighbours share a workplace, but each gets a different spot in it
    const place = places[Math.floor(i / ROLES.length) % places.length];
    const k = used.get(place.id) ?? 0;
    used.set(place.id, k + 1);
    const spot = slotAround(place, k);

    const mesh = createVillager(shirtColors[i % shirtColors.length]);
    mesh.position.set(house.door.x, 0, house.door.z);
    mesh.visible = false; // asleep indoors until the schedule sends them out
    group.add(mesh);

    const legs: THREE.Object3D[] = [];
    const arms: THREE.Object3D[] = [];
    mesh.traverse((c) => { if (c.name === "leg") legs.push(c); else if (c.name === "arm") arms.push(c); });

    villagers.push({
      mesh, role,
      homePos: new THREE.Vector3(house.door.x, 0, house.door.z),
      workPos: new THREE.Vector3(spot.x, 0, spot.z),
      workPlace: place,
      shirtColor: shirtColors[i % shirtColors.length],
      state: "inside", dest: "home",
      schedule: makeSchedule(role, i),
      route: [], routeIndex: 0,
      walkSpeed: 2.8 + ((i * 17) % 10) / 10,
      yaw: 0, gait: 0, phase: (i * 1.7) % (Math.PI * 2),
      idleTurnAt: 0, idleYaw: 0,
      limbs: { legs, arms },
    });
  });
  return { group, villagers };
}

const lastElapsed = new WeakMap<object, number>();
const turnToward = (cur: number, target: number, maxStep: number) => {
  let d = ((target - cur + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  d = Math.max(-maxStep, Math.min(maxStep, d));
  return cur + d;
};

function targetPoint(v: Villager, dest: Dest): Pt {
  if (dest === "home") return { x: v.homePos.x, z: v.homePos.z };
  if (dest === "work") return { x: v.workPos.x, z: v.workPos.z };
  const plaza = placesOf("plaza")[0];
  const a = v.phase * 3;
  return { x: plaza.x + Math.cos(a) * (6 + (v.phase % 4)), z: plaza.z + Math.sin(a) * (6 + (v.phase % 4)) };
}

function swing(v: Villager, strideAmp: number, armAmp: number) {
  const s = Math.sin(v.phase);
  for (const l of v.limbs.legs) l.rotation.x = (l.userData.side ?? 1) * s * strideAmp * v.gait;
  for (const a of v.limbs.arms) a.rotation.x = (a.userData.side ?? 1) * s * armAmp * v.gait;
}

export function updateVillagers(
  villagers: Villager[],
  hour: number,
  elapsed: number,
  opts: { clockSpeed?: number } = {}
): void {
  const prev = lastElapsed.get(villagers) ?? elapsed;
  lastElapsed.set(villagers, elapsed);
  const dt = Math.min(0.1, Math.max(0, elapsed - prev)); // frame-rate independent
  // When the clock runs fast, walk a bit faster so people still make it to work in time.
  const boost = Math.min(2.5, Math.max(1, (opts.clockSpeed ?? 0.3) / 0.3));

  for (const v of villagers) {
    const want = scheduledDest(v.schedule, hour);

    if (v.state !== "walking" && v.dest !== want) {
      // leave: from the door (home) or from the workplace entrance
      const from = v.dest === "home" ? { x: v.homePos.x, z: v.homePos.z } : { x: v.mesh.position.x, z: v.mesh.position.z };
      v.route = planRoute(from, targetPoint(v, want));
      v.routeIndex = 1;
      v.dest = want;
      v.state = "walking";
      v.mesh.visible = true;
      v.mesh.position.set(from.x, 0, from.z);
    }

    if (v.state === "walking") {
      let step = v.walkSpeed * boost * dt;
      const pos = v.mesh.position;
      while (step > 0 && v.routeIndex < v.route.length) {
        const to = v.route[v.routeIndex];
        const dx = to.x - pos.x, dz = to.z - pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001) v.yaw = turnToward(v.yaw, Math.atan2(dx, dz), 7 * dt);
        if (dist <= step) { pos.x = to.x; pos.z = to.z; step -= dist; v.routeIndex++; }
        else { pos.x += (dx / dist) * step; pos.z += (dz / dist) * step; step = 0; }
      }
      v.gait += (1 - v.gait) * Math.min(1, 8 * dt);
      v.phase += (v.walkSpeed * boost / 1.15) * Math.PI * 2 * dt * 0.5; // one stride per ~1.15 units
      swing(v, 0.55, 0.4);
      pos.y = Math.abs(Math.sin(v.phase)) * 0.05 * v.gait; // body rises slightly at each step
      v.mesh.rotation.y = v.yaw;
      if (v.routeIndex >= v.route.length) {
        v.state = v.dest === "home" || (v.dest === "work" && v.workPlace.indoor) ? "inside" : "busy";
        v.mesh.visible = v.state !== "inside";
        pos.y = 0;
        v.idleTurnAt = elapsed;
      }
    } else if (v.state === "busy") {
      v.gait += (0 - v.gait) * Math.min(1, 6 * dt);
      swing(v, 0.55, 0.4);
      if (elapsed >= v.idleTurnAt) { // look around now and then
        v.idleYaw = v.yaw + (Math.sin(elapsed * 12.9898 + v.phase) * 1.2);
        v.idleTurnAt = elapsed + 3 + (v.phase % 3);
      }
      v.yaw = turnToward(v.yaw, v.idleYaw, 1.5 * dt);
      v.mesh.rotation.y = v.yaw;
      const working = v.dest === "work" && v.workPlace.kind === "field";
      for (const a of v.limbs.arms) a.rotation.x = (a.userData.side ?? 1) * Math.sin(elapsed * (working ? 2.2 : 1.1) + v.phase) * (working ? 0.7 : 0.15);
      v.mesh.rotation.x = working ? 0.25 + Math.sin(elapsed * 2.2 + v.phase) * 0.08 : 0; // bend over the crop
    }
  }
}

/* ============================================================
   ភ្លើងផ្ទះ (House Lights) — បើក/បិទតាមម៉ោង
   ============================================================ */
export interface HouseLight {
  light: THREE.PointLight;
  windowMesh: THREE.Mesh;
  windowMat: THREE.MeshStandardMaterial;
}

export function createHouseLights(count = 300, registry?: VillageRegistry): {
  group: THREE.Group;
  lights: HouseLight[];
} {
  const group = new THREE.Group();
  const lights: HouseLight[] = [];

  // បង្កើត PointLight តែ ១០០ (សម្រាប់ performance)
  const LIGHT_COUNT = 100;
  const slots = houseSlots(HOUSE_COUNT).slice(0, count);

  let built = 0;
  for (const slot of slots) {
    {
      const { x, z } = slot;

      // Point light តែ ១០០ ដំបូង (ជិតកណ្តាល)
      let light: THREE.PointLight;
      if (built < LIGHT_COUNT) {
        light = new THREE.PointLight("#ffcc66", 0, 15);
        light.position.set(x, 3, z);
        light.castShadow = false;
        group.add(light);
      } else {
        light = new THREE.PointLight("#ffcc66", 0, 15);
        light.position.set(0, -100, 0); // លាក់
      }

      // បង្អួច emissive
      const windowMat = new THREE.MeshStandardMaterial({
        color: "#87ceeb",
        emissive: "#ffcc66",
        emissiveIntensity: 0,
      });
      const windowMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.8, 0.05),
        windowMat
      );
      // on the street-facing wall, beside the door (the door x is 0.8 outside the wall)
      const toStreet = slot.col < 9 ? 1 : -1;
      windowMesh.position.set(slot.door.x - toStreet * 0.8, 2, z + 1.6);
      windowMesh.rotation.y = Math.PI / 2;
      group.add(windowMesh);

      // Register house
      if (registry) {
        const wealth = slot.wealth; // the same wealth the house was drawn with
        // familySize deterministic: អ្នកមាន ៤-៦, កណ្តាល ៣-៥, ក្រ ២-៤
        const baseFamily = wealth === 2 ? 4 : wealth === 1 ? 3 : 2;
        const familySize = baseFamily + (built % 3);
        registry.register({
          x, z,
          wealth,
          familySize,
          hasLight: true,
          hasCar: wealth === 2,
          hasBike: wealth === 1,
          hasBicycle: wealth === 0,
          windowMat,
          light,
        });
      }

      lights.push({ light, windowMesh, windowMat });
      built++;
    }
  }

  return { group, lights };
}

export function updateHouseLights(
  lights: HouseLight[],
  hour: number
): void {
  // បើកពេល ១៨-៦ ម៉ោង
  const isNightTime = hour >= 18 || hour < 6;
  // ស្រាល ៗ បន្តិច (ព្រលប់)
  const isDusk = hour >= 17 && hour < 18;
  const isDawn = hour >= 5 && hour < 7;

  const targetIntensity = isNightTime ? 1 : isDusk ? 0.6 : isDawn ? 0.4 : 0;
  const targetEmissive = isNightTime ? 1.5 : isDusk ? 0.8 : isDawn ? 0.5 : 0;

  lights.forEach((h) => {
    h.light.intensity += (targetIntensity - h.light.intensity) * 0.05;
    h.windowMat.emissiveIntensity += (targetEmissive - h.windowMat.emissiveIntensity) * 0.05;
  });
}
