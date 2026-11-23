import test from "node:test";
import assert from "node:assert/strict";
import { createVillagers, updateVillagers, createHouseLights } from "../src/components/villageLife.ts";
import { createHumanFigure, setFigureDetail } from "../src/components/humanFigure.ts";
import { createVehicle } from "../src/components/vehicleModels.ts";

const meshes = (o) => { let n = 0; o.traverse((c) => { if (c.isMesh) n++; }); return n; };

test("low-detail people use far fewer draw calls than full detail", () => {
  const hi = meshes(createHumanFigure({ height: 2, detail: "high" }));
  const lo = meshes(createHumanFigure({ height: 2, detail: "low" }));
  assert.ok(lo <= hi * 0.65, `low ${lo} vs high ${hi}`);
});

test("vehicles are detailed but light (under 40 meshes each)", () => {
  for (const k of ["bicycle", "moto", "car"]) {
    const n = meshes(createVehicle(k, "#c0392b").group);
    assert.ok(n >= 15 && n < 40, `${k}: ${n}`);
  }
});

test("house lights use glowing windows, not real point lights (each light costs every pixel)", () => {
  const { group } = createHouseLights(40);
  let lights = 0;
  group.traverse((c) => { if (c.isPointLight || c.isSpotLight) lights++; });
  assert.equal(lights, 0);
});

test("two days of village life: nobody is lost, everyone sleeps at night, nobody stands on another's spot", () => {
  setFigureDetail("low");
  const { villagers } = createVillagers(100);
  assert.equal(villagers.length, 100);
  const speed = 0.1, dt = 1 / 30;
  let hour = 3, t = 0, bad = 0, asleepAt3 = -1;
  for (let f = 0; f < 30 * (24 / speed) * 2; f++) {
    t += dt; hour = (hour + speed * dt) % 24;
    updateVillagers(villagers, hour, t, { clockSpeed: speed });
    for (const v of villagers) if (![v.mesh.position.x, v.mesh.position.y, v.mesh.position.z, v.yaw].every(Number.isFinite)) bad++;
    if (f > 30 * (24 / speed) && hour >= 3 && hour < 3 + speed * dt) asleepAt3 = villagers.filter((v) => v.state === "inside" && !v.mesh.visible).length;
  }
  assert.equal(bad, 0, "no NaN positions");
  assert.ok(asleepAt3 >= 95, `at 03:00 almost everyone is indoors, got ${asleepAt3}`);
  // workplace spots are personal
  const spots = new Set(villagers.map((v) => v.workPos.x.toFixed(2) + "," + v.workPos.z.toFixed(2)));
  assert.equal(spots.size, villagers.length, "every person has their own spot at work");
});

test("in the rain, nobody stays outdoors at an open workplace", () => {
  setFigureDetail("low");
  const { villagers } = createVillagers(60);
  let t = 0;
  const dt = 1 / 30;
  for (let f = 0; f < 30 * 40; f++) { t += dt; updateVillagers(villagers, 10, t, { clockSpeed: 0.1 }); } // work day, dry
  for (let f = 0; f < 30 * 90; f++) { t += dt; updateVillagers(villagers, 10, t, { clockSpeed: 0.1, raining: true }); }
  const out = villagers.filter((v) => v.state === "busy" && !v.workPlace.indoor);
  assert.equal(out.length, 0, "everyone outdoors went home");
});

test("families live together: every household has 2 adults and a child or grandparent", () => {
  const { villagers } = createVillagers(99);
  const byHouse = new Map();
  for (const v of villagers) byHouse.set(v.household, [...(byHouse.get(v.household) ?? []), v.role]);
  for (const [, roles] of byHouse) {
    assert.equal(roles.length, 3);
    assert.ok(roles.includes("student") || roles.includes("elder"));
  }
});
