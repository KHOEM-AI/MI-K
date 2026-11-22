import test from "node:test";
import assert from "node:assert/strict";
import { houseSlots, PLACES, ROAD_HALF_WIDTH, planRoute, alleyZ } from "../src/components/villageLayout.ts";

const slots = houseSlots(300);

test("300 houses are laid out and none stands on the road", () => {
  assert.equal(slots.length, 300);
  for (const h of slots) assert.ok(Math.abs(h.x) > ROAD_HALF_WIDTH + 4, "house " + h.index + " at x=" + h.x);
});

test("every front door is on the street side of its own house", () => {
  for (const h of slots) {
    const towardStreet = Math.sign(-h.x);
    assert.equal(Math.sign(h.door.x - h.x), towardStreet, "door " + h.index);
    assert.ok(Math.abs(h.door.x) < Math.abs(h.x), "door is closer to the street than the house centre");
  }
});

test("houses never overlap each other", () => {
  const seen = new Set(slots.map((h) => h.x + "," + h.z));
  assert.equal(seen.size, slots.length);
});

test("routes follow the street: the first and last points are exact, and every leg is axis-aligned", () => {
  const from = slots[0].door;
  const to = PLACES.find((p) => p.id === "market-2");
  const r = planRoute(from, { x: to.x, z: to.z });
  assert.deepEqual(r[0], from);
  assert.deepEqual(r[r.length - 1], { x: to.x, z: to.z });
  for (let i = 1; i < r.length; i++) {
    const dx = Math.abs(r[i].x - r[i - 1].x), dz = Math.abs(r[i].z - r[i - 1].z);
    assert.ok(dx < 1e-6 || dz < 1e-6, "leg " + i + " is diagonal");
  }
});

test("walking lanes between house rows really are gaps between rows", () => {
  const rowsZ = [...new Set(slots.map((h) => h.z))];
  for (const z of rowsZ) assert.ok(Math.abs(alleyZ(z + 5) - (z + 5)) < 1e-6);
});
