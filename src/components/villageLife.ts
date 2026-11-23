import type { VillageRegistry } from "./villageSimulation";
import { HOUSEHOLD_COUNT, HOUSEHOLD_SIZE, HOUSE_COUNT, houseSlots, placesOf, planRoute, type Place, type PlaceKind, type Pt } from "./villageLayout.ts";
import { borrowRider, createVehicle, returnRider, rollVehicle, type Vehicle, type VehicleKind } from "./vehicleModels.ts";
import * as THREE from "three";
import { createHumanFigure } from "./humanFigure.ts";

const mat = (color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...opts });

/* ============================================================
   Villagers: families, jobs, vehicles, lunch rest, rain
   ============================================================ */
export type VillagerRole = "farmer" | "factory" | "market" | "shopkeeper" | "elder" | "student" | "teacher" | "medic";
type Dest = "home" | "work" | "social";

export interface Villager {
  mesh: THREE.Group;
  role: VillagerRole;
  household: number;
  homePos: THREE.Vector3;   // front door of their own house
  workPos: THREE.Vector3;   // personal spot at the workplace (nobody shares a spot)
  socialPos: Pt;
  workPlace: Place;
  shirtColor: string;
  state: "inside" | "walking" | "busy";
  shown: boolean;           // what the schedule says; distance culling is applied on top
  dest: Dest;               // where they are, or are walking to
  schedule: { hour: number; dest: Dest }[];
  route: Pt[];
  routeIndex: number;
  walkSpeed: number;        // comfortable pace, scene units per second
  tripSpeed: number;        // pace chosen for the current trip (see updateVillagers)
  lateral: number;          // side offset when walking together as a family
  vehicle: Vehicle | null;  // their own bicycle / motorbike / car, parked where they left it
  riding: boolean;
  umbrella: THREE.Object3D | null;
  yaw: number;
  gait: number;             // 0 standing .. 1 full stride (eases in and out)
  phase: number;
  idleTurnAt: number;
  idleYaw: number;
  limbs: { legs: THREE.Object3D[]; arms: THREE.Object3D[] };
}

const SKINS = [0xc58e69, 0xc99672, 0xb98560, 0xd0a07c];

/** each role dresses and moves like what they are: school uniform, doctor's coat, farmer's hat... */
export function createVillager(shirtColor = "#3498db", role: VillagerRole = "market"): THREE.Group {
  const n = shirtColor.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const female = n % 3 === 0 || role === "medic" && n % 2 === 0;
  const base = { skin: SKINS[n % SKINS.length], female, hairStyle: (female ? "long" : "short") as "long" | "short" };
  switch (role) {
    case "student": return createHumanFigure({ ...base, height: 1.45 + (n % 4) * 0.05, shirt: "#ffffff", pants: "#1f3c88", skirt: female, longSleeves: false, hairStyle: female ? "bun" : "short" });
    case "teacher": return createHumanFigure({ ...base, height: 2.0, shirt: female ? "#f7f1e1" : "#dfe9f5", pants: "#2d3436", skirt: female, longSleeves: true, tie: female ? undefined : "#6c1d2a" });
    case "medic": return createHumanFigure({ ...base, height: 2.0, shirt: "#ffffff", pants: "#2c7a7b", coat: true, hat: female ? "nurse" : "none", longSleeves: true });
    case "farmer": return createHumanFigure({ ...base, height: 1.95, shirt: "#6d7b4f", pants: "#3e3a2f", hat: "cap", hatColor: "#c9a86a", longSleeves: true });
    case "factory": return createHumanFigure({ ...base, height: 2.0, shirt: "#e67e22", pants: "#2c3e50", hat: "helmet", hatColor: "#f1c40f", longSleeves: true });
    case "elder": return createHumanFigure({ ...base, height: 1.85, shirt: shirtColor, pants: "#4a4a4a", hair: 0xcfcfcf, longSleeves: true });
    default: return createHumanFigure({ ...base, height: 1.95 + (n % 5) * 0.04, shirt: shirtColor, pants: female ? 0x3b2f5e : 0x2c3e50, skirt: female, longSleeves: false });
  }
}

const PLACE_KIND: Record<VillagerRole, PlaceKind> = {
  farmer: "field", factory: "factory", market: "market", shopkeeper: "shop", elder: "plaza",
  student: "school", teacher: "school", medic: "clinic",
};
const ADULT_ROLES: VillagerRole[] = ["farmer", "factory", "market", "shopkeeper", "teacher", "medic", "factory", "farmer"];

/** Different hours for different jobs, with a small personal offset so nobody leaves at the same second. */
function makeSchedule(role: VillagerRole, i: number, house: number, familyOut: boolean): Villager["schedule"] {
  const j = ((i * 37) % 13) / 13 - 0.5; // -0.5 .. +0.5 hours
  const out: Villager["schedule"] = [];
  switch (role) {
    case "farmer": out.push({ hour: 5.6 + j, dest: "work" }, { hour: 17.4 + j, dest: "home" }); break;
    case "factory": out.push({ hour: 6.7 + j, dest: "work" }, { hour: 17 + j, dest: "home" }); break;
    case "market": out.push({ hour: 7.4 + j, dest: "work" }, { hour: 17.6 + j, dest: "home" }); break;
    case "shopkeeper": out.push({ hour: 7.9 + j * 0.5, dest: "work" }, { hour: 18 + j * 0.5, dest: "home" }); break;
    case "teacher": out.push({ hour: 6.8 + j * 0.3, dest: "work" }, { hour: 16.6, dest: "home" }); break;
    case "medic": // day shift or evening shift
      if (house % 2 === 0) out.push({ hour: 7.2, dest: "work" }, { hour: 15.8, dest: "home" });
      else out.push({ hour: 15.4, dest: "work" }, { hour: 23.4, dest: "home" });
      break;
    case "student": { // two school sessions with lunch at home; neighbours leave together
      const g = ((house * 29) % 7) / 14 - 0.25;
      out.push({ hour: 6.9 + g, dest: "work" }, { hour: 11.3, dest: "home" }, { hour: 12.8 + g, dest: "work" }, { hour: 16.2, dest: "home" });
      break;
    }
    default: out.push({ hour: 6 + j, dest: "social" }, { hour: 10 + j, dest: "home" }, { hour: 15.5 + j, dest: "social" }, { hour: 18 + j, dest: "home" });
  }
  // a family evening out: everybody in the house leaves at exactly the same time and walks together
  if (familyOut && role !== "elder") {
    const tail = out.filter((s) => s.hour < 18.5);
    out.length = 0;
    out.push(...tail, { hour: 19, dest: "social" }, { hour: 20.4, dest: "home" });
  }
  out.sort((a, b) => a.hour - b.hour);
  return out;
}

/** Where is this person supposed to be at this hour? Before the first stop, the last stop of yesterday still counts. */
function scheduledDest(sc: Villager["schedule"], hour: number): Dest {
  let d = sc[sc.length - 1].dest;
  for (const s of sc) if (hour >= s.hour) d = s.dest;
  return d;
}

/** A personal spot around a place (golden-angle spiral): nobody stacks on one point. */
function slotAround(place: Place, k: number): Pt {
  if (place.radius <= 2) return { x: place.x + ((k % 5) - 2) * 0.8, z: place.z };
  const ang = k * 2.399963;
  const r = Math.min(place.radius, 1.2 + 0.9 * Math.sqrt(k));
  return { x: place.x + Math.cos(ang) * r, z: place.z + Math.sin(ang) * r };
}

function makeUmbrella(): THREE.Object3D {
  const g = new THREE.Group();
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.32, 12, 1, true), new THREE.MeshStandardMaterial({ color: "#d63031", side: THREE.DoubleSide, roughness: 0.7 }));
  canopy.position.y = 2.55;
  const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 5), new THREE.MeshStandardMaterial({ color: "#333" }));
  stick.position.y = 2.2;
  g.add(canopy, stick);
  g.visible = false;
  return g;
}

export function createVillagers(count = 100): { group: THREE.Group; villagers: Villager[] } {
  const group = new THREE.Group();
  const villagers: Villager[] = [];
  const shirtColors = ["#3498db", "#e74c3c", "#f39c12", "#27ae60", "#9b59b6", "#1abc9c", "#e67e22", "#2c3e50"];
  const used = new Map<string, number>();
  const households = Math.min(HOUSEHOLD_COUNT, Math.ceil(count / HOUSEHOLD_SIZE));
  const slots = houseSlots(HOUSE_COUNT).slice(0, households);
  const carColors = ["#c0392b", "#2c3e50", "#ecf0f1", "#34495e"], bikeColors = ["#e74c3c", "#2d3436", "#0984e3"];

  slots.forEach((house, h) => {
    const familyOut = h % 3 === 0;
    const kinds: VillagerRole[] = [
      ADULT_ROLES[h % ADULT_ROLES.length],
      ADULT_ROLES[(h + 3) % ADULT_ROLES.length],
      h % 4 === 3 ? "elder" : "student",
    ];
    const toStreet = house.col < 9 ? 1 : -1;
    // one vehicle per adult for rich houses (two cars), otherwise one shared by the first adult: moped or bicycle
    const vehicles: (Vehicle | null)[] = [null, null, null];
    const kind: VehicleKind = house.wealth === 2 ? "car" : house.wealth === 1 ? "moto" : "bicycle";
    const owners = house.wealth === 2 ? [0, 1] : [0];
    owners.forEach((m, n) => {
      const v = createVehicle(kind, kind === "car" ? carColors[(h + n) % carColors.length] : bikeColors[h % bikeColors.length]);
      const px = house.door.x + toStreet * (kind === "car" ? 2.6 : 1.5);
      const pz = house.door.z + (n === 0 ? 3.2 : -3.2) + (kind === "car" ? 0 : 0.5);
      v.park = { x: px, z: pz, yaw: kind === "car" ? (n === 0 ? 0 : Math.PI) : (toStreet > 0 ? Math.PI / 2 : -Math.PI / 2) };
      v.group.position.set(px, 0, pz);
      v.group.rotation.y = v.park.yaw;
      group.add(v.group);
      vehicles[m] = v;
    });

    kinds.forEach((role, m) => {
      const i = villagers.length;
      if (i >= count) return;
      const places = placesOf(PLACE_KIND[role]);
      const place = places[(h + m) % places.length];
      const k = used.get(place.id) ?? 0;
      used.set(place.id, k + 1);
      const spot = slotAround(place, k);
      const color = shirtColors[i % shirtColors.length];
      const mesh = createVillager(color, role);
      mesh.position.set(house.door.x, 0, house.door.z);
      mesh.visible = false; // asleep indoors until the schedule sends them out
      group.add(mesh);
      const legs: THREE.Object3D[] = [], arms: THREE.Object3D[] = [];
      mesh.traverse((c) => { if (c.name === "leg") legs.push(c); else if (c.name === "arm") arms.push(c); });
      const umbrella = role === "student" ? null : makeUmbrella();
      if (umbrella) mesh.add(umbrella);
      const a = h * 0.9 + m * 0.5;
      villagers.push({
        mesh, role, household: h,
        homePos: new THREE.Vector3(house.door.x, 0, house.door.z),
        workPos: new THREE.Vector3(spot.x, 0, spot.z),
        socialPos: { x: Math.cos(a) * (7 + (h % 5)), z: Math.sin(a) * (7 + (h % 5)) },
        workPlace: place, shirtColor: color,
        state: "inside", shown: false, dest: "home",
        schedule: makeSchedule(role, i, h, familyOut),
        route: [], routeIndex: 0, tripSpeed: 0,
        walkSpeed: role === "student" ? 2.4 : 2.8 + ((i * 17) % 10) / 10,
        lateral: (m - 1) * 0.9,
        vehicle: vehicles[m] ?? null, riding: false, umbrella,
        yaw: 0, gait: 0, phase: (i * 1.7) % (Math.PI * 2),
        idleTurnAt: 0, idleYaw: 0, limbs: { legs, arms },
      });
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

/** family members walk side by side: shift the inner points of the route sideways, keep start and end exact */
function offsetRoute(route: Pt[], lateral: number): Pt[] {
  if (Math.abs(lateral) < 0.01 || route.length < 3) return route;
  return route.map((p, k) => {
    if (k === 0 || k === route.length - 1) return p;
    const a = route[k - 1], b = route[k + 1];
    const dx = b.x - a.x, dz = b.z - a.z, len = Math.hypot(dx, dz) || 1;
    return { x: p.x + (-dz / len) * lateral, z: p.z + (dx / len) * lateral };
  });
}

function targetPoint(v: Villager, dest: Dest, ride: boolean): Pt {
  if (dest === "home") return ride && v.vehicle ? { x: v.vehicle.park.x, z: v.vehicle.park.z } : { x: v.homePos.x, z: v.homePos.z };
  if (dest === "work") return { x: v.workPos.x, z: v.workPos.z };
  return { x: v.socialPos.x + v.lateral * 0.5, z: v.socialPos.z };
}

function swing(v: Villager, strideAmp: number, armAmp: number) {
  const s = Math.sin(v.phase);
  for (const l of v.limbs.legs) l.rotation.x = (l.userData.side ?? 1) * s * strideAmp * v.gait;
  for (const a of v.limbs.arms) a.rotation.x = (a.userData.side ?? 1) * s * armAmp * v.gait;
}

export interface VillageClock {
  clockSpeed?: number;
  raining?: boolean;
  /** camera position: people and parked vehicles farther than `far` are not drawn */
  viewer?: { x: number; y: number; z: number };
  far?: number;
}

export function updateVillagers(villagers: Villager[], hour: number, elapsed: number, opts: VillageClock = {}): void {
  const prev = lastElapsed.get(villagers) ?? elapsed;
  lastElapsed.set(villagers, elapsed);
  const dt = Math.min(0.1, Math.max(0, elapsed - prev)); // frame-rate independent
  const raining = !!opts.raining;
  const noon = hour >= 12 && hour < 13.3; // lunch break
  const far2 = (opts.far ?? Infinity) ** 2, cam = opts.viewer;
  const near = (x: number, z: number) => !cam || (x - cam.x) ** 2 + (z - cam.z) ** 2 <= far2;

  for (const v of villagers) {
    let want = scheduledDest(v.schedule, hour);
    // in the rain nobody stays out on the field, in the plaza or at an open stall: they go home
    if (raining && want !== "home" && !(want === "work" && v.workPlace.indoor)) want = "home";

    if (v.state !== "walking" && v.dest !== want) {
      const veh = v.vehicle;
      const here = { x: v.mesh.position.x, z: v.mesh.position.z };
      const from = v.dest === "home" ? { x: v.homePos.x, z: v.homePos.z } : here;
      // ride when the own vehicle is right here (never to a family evening walk)
      const ride = !!veh && want !== "social" && Math.hypot(veh.group.position.x - from.x, veh.group.position.z - from.z) < 12 && borrowRider(veh);
      const start = ride && veh ? { x: veh.group.position.x, z: veh.group.position.z } : from;
      v.route = offsetRoute(planRoute(start, targetPoint(v, want, ride)), ride ? 0 : v.lateral);
      // Pace the trip to the clock: a commute should take about 1.2 game hours, but never faster than a jog
      // (9 units/s on foot, 16 by vehicle). Without this, a 170-unit walk to the rice field takes a whole game day.
      let len = 0;
      for (let k = 1; k < v.route.length; k++) len += Math.hypot(v.route[k].x - v.route[k - 1].x, v.route[k].z - v.route[k - 1].z);
      const clock = Math.max(0.02, opts.clockSpeed ?? 0.1);
      const wantSec = Math.min(30, Math.max(5, 1.2 / clock));
      const base = v.walkSpeed * (ride && veh ? veh.speedFactor : 1) * (raining && !ride ? 1.5 : 1);
      v.tripSpeed = Math.min(ride ? 16 : 9, Math.max(base, len / wantSec));
      v.routeIndex = 1;
      v.dest = want;
      v.state = "walking";
      v.riding = ride;
      v.shown = !ride;
      v.mesh.position.set(start.x, 0, start.z);
      v.mesh.rotation.x = 0;
      if (ride && veh) veh.group.position.set(start.x, 0, start.z);
    }

    if (v.state === "walking") {
      const veh = v.riding ? v.vehicle : null;
      const speed = v.tripSpeed;
      const running = !veh && (raining || speed > 5.5);      // hurry through the rain, or when late
      let step = speed * dt;
      const moved = step;
      const pos = veh ? veh.group.position : v.mesh.position;
      while (step > 0 && v.routeIndex < v.route.length) {
        const to = v.route[v.routeIndex];
        const dx = to.x - pos.x, dz = to.z - pos.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.001) v.yaw = turnToward(v.yaw, Math.atan2(dx, dz), (veh ? 5 : 7) * dt);
        if (dist <= step) { pos.x = to.x; pos.z = to.z; step -= dist; v.routeIndex++; }
        else { pos.x += (dx / dist) * step; pos.z += (dz / dist) * step; step = 0; }
      }
      if (veh) {
        veh.group.rotation.y = v.yaw;
        rollVehicle(veh, moved);
        v.mesh.position.set(pos.x, 0, pos.z);
      } else {
        v.gait += (1 - v.gait) * Math.min(1, 8 * dt);
        v.phase += (speed / 1.15) * Math.PI * dt;            // one stride per ~1.15 units
        swing(v, running ? 0.8 : 0.55, running ? 0.7 : 0.4);
        pos.y = Math.abs(Math.sin(v.phase)) * 0.05 * v.gait; // body rises slightly at each step
        v.mesh.rotation.y = v.yaw;
      }
      if (v.umbrella) v.umbrella.visible = raining && !veh;
      if (v.routeIndex >= v.route.length) {
        const arrivedByVehicle = !!veh;
        if (veh && v.dest === "home") { // park at the house, then step inside
          veh.group.rotation.y = veh.park.yaw;
          v.mesh.position.set(v.homePos.x, 0, v.homePos.z);
        } else if (veh) {                // park here and get off beside the vehicle
          v.mesh.position.set(veh.group.position.x + Math.cos(veh.group.rotation.y) * 1.4, 0, veh.group.position.z - Math.sin(veh.group.rotation.y) * 1.4);
        }
        if (veh) returnRider(veh);
        v.riding = false;
        v.state = v.dest === "home" || (v.dest === "work" && v.workPlace.indoor) ? "inside" : "busy";
        v.shown = v.state !== "inside";
        v.mesh.position.y = 0;
        v.idleTurnAt = elapsed;
        void arrivedByVehicle;
      }
    } else if (v.state === "inside") {
      // indoor workers come out to the yard / doorway during the lunch break
      v.shown = noon && v.dest === "work" && v.workPlace.indoor && !raining;
      if (v.shown) { v.mesh.rotation.x = 0; swing(v, 0, 0.1); }
      if (v.umbrella) v.umbrella.visible = false;
    } else if (v.state === "busy") {
      v.gait += (0 - v.gait) * Math.min(1, 6 * dt);
      swing(v, 0.55, 0.4);
      if (elapsed >= v.idleTurnAt) { // look around now and then
        v.idleYaw = v.yaw + (Math.sin(elapsed * 12.9898 + v.phase) * 1.2);
        v.idleTurnAt = elapsed + 3 + (v.phase % 3);
      }
      v.yaw = turnToward(v.yaw, v.idleYaw, 1.5 * dt);
      v.mesh.rotation.y = v.yaw;
      const field = v.dest === "work" && v.workPlace.kind === "field" && !noon;   // farmers rest at noon
      const calm = noon || v.dest !== "work";
      for (const a of v.limbs.arms) a.rotation.x = (a.userData.side ?? 1) * Math.sin(elapsed * (field ? 2.2 : 1.1) + v.phase) * (field ? 0.7 : calm ? 0.08 : 0.15);
      v.mesh.rotation.x = field ? 0.25 + Math.sin(elapsed * 2.2 + v.phase) * 0.08 : 0; // bend over the crop
      if (v.umbrella) v.umbrella.visible = false;
    }
    v.mesh.visible = v.shown && near(v.mesh.position.x, v.mesh.position.z);
    if (v.vehicle && !v.riding) v.vehicle.group.visible = near(v.vehicle.group.position.x, v.vehicle.group.position.z);
  }
}

/* ============================================================
   ភ្លើងផ្ទះ (House Lights) — បើក/បិទតាមម៉ោង
   ============================================================ */
export interface HouseLight {
  light: THREE.PointLight | null; // none: 100 real lights made every pixel 100x more expensive; glowing windows do the job
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
  const slots = houseSlots(HOUSE_COUNT).slice(0, count);

  let built = 0;
  for (const slot of slots) {
    {
      const { x, z } = slot;

      const light: THREE.PointLight | null = null;

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
    if (h.light) h.light.intensity += (targetIntensity - h.light.intensity) * 0.05;
    h.windowMat.emissiveIntensity += (targetEmissive - h.windowMat.emissiveIntensity) * 0.05;
  });
}
