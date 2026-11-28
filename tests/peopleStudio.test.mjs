import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  PRESETS, DEFAULT_SELECTION, STUDIO_MODEL, heightScale, lineupPositions, togglePreset,
  stageSize, fitStageDistance, clipPhase, pickDefaultClip,
} from "../src/vehicles3d/peopleStudio.mjs";
import { isGlb } from "../src/vehicles3d/modelTools.mjs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("heightScale gives the factor and refuses bad sizes", () => {
  assert.equal(heightScale(1, 2), 2);
  assert.ok(Math.abs(heightScale(1.6, 1.8) - 1.125) < 1e-12);
  for (const bad of [0, -1, NaN, "x"]) assert.throws(() => heightScale(bad, 1));
  assert.throws(() => heightScale(1, 0));
});

test("lineupPositions are centred and evenly spaced", () => {
  assert.deepEqual(lineupPositions(0), []);
  assert.deepEqual(lineupPositions(1), [0]);
  const xs = lineupPositions(4, 1);
  assert.deepEqual(xs, [-1.5, -0.5, 0.5, 1.5]);
  assert.throws(() => lineupPositions(2, 0));
});

test("togglePreset keeps order, adds and removes, never empties the stage", () => {
  assert.deepEqual(togglePreset(["woman"], "man"), ["woman", "man"]);
  assert.deepEqual(togglePreset(["man"], "small_adult"), ["small_adult", "man"]);
  assert.deepEqual(togglePreset(["woman", "man"], "woman"), ["man"]);
  assert.deepEqual(togglePreset(["woman"], "woman"), ["woman"]);
  assert.throws(() => togglePreset(["woman"], "robot"));
});

test("presets: unique ids, rising heights, the default exists", () => {
  assert.equal(new Set(PRESETS.map((p) => p.id)).size, PRESETS.length);
  const hs = PRESETS.map((p) => p.height);
  assert.deepEqual([...hs].sort((a, b) => a - b), hs);
  for (const id of DEFAULT_SELECTION) assert.ok(PRESETS.some((p) => p.id === id));
  assert.equal(PRESETS.find((p) => p.id === "woman").height, 1.67);
});

test("stage fits: a wide row on a narrow screen is decided by its width", () => {
  const one = stageSize([1.67]);
  const row = stageSize(PRESETS.map((p) => p.height));
  assert.ok(row.halfWidth > one.halfWidth && row.height === 2.05);
  const wide = fitStageDistance(row, 35, 0.45);
  const tall = fitStageDistance(row, 35, 2);
  assert.ok(wide > tall);
  assert.ok(fitStageDistance(one, 35, 1) > 0);
  assert.throws(() => stageSize([]));
  assert.throws(() => fitStageDistance(one, 180, 1));
  assert.throws(() => fitStageDistance(one, 35, 0));
});

test("clipPhase stays inside the clip and differs between people", () => {
  assert.equal(clipPhase(0, 18.23), 0);
  const a = clipPhase(1, 18.23), b = clipPhase(2, 18.23);
  assert.ok(a > 0 && a < 18.23 && b > 0 && b < 18.23 && a !== b);
  assert.equal(clipPhase(3, 0), 0);
});

test("pickDefaultClip prefers a dance clip", () => {
  assert.equal(pickDefaultClip(["TPose", "SambaDance"]), "SambaDance");
  assert.equal(pickDefaultClip(["Walk", "Idle"]), "Walk");
  assert.equal(pickDefaultClip([]), null);
  assert.equal(pickDefaultClip(undefined), null);
});

test("the bundled model is a real GLB with the clips the studio shows", () => {
  const file = new URL("../public" + STUDIO_MODEL, import.meta.url);
  const buf = fs.readFileSync(file);
  assert.ok(isGlb(new Uint8Array(buf)), "not a GLB");
  const jsonLen = buf.readUInt32LE(12);
  const json = JSON.parse(buf.subarray(20, 20 + jsonLen).toString("utf8"));
  const names = json.animations.map((a) => a.name);
  assert.ok(names.includes("SambaDance"), "SambaDance clip missing");
  assert.equal(pickDefaultClip(names), "SambaDance");
});

test("the studio is a tab of KHOEM-AI 3D and follows the 3D tab rules", () => {
  const tabs = read("src/vehicles3d/Vehicles3D.tsx");
  assert.ok(tabs.includes("PeopleStudio") && tabs.includes('"studio"'));
  assert.ok(tabs.includes('className="filters"'));
  const s = read("src/vehicles3d/PeopleStudio.tsx");
  assert.ok(!/\p{Extended_Pictographic}/u.test(s), "emoji in PeopleStudio");
  assert.ok(!s.includes("#4f7cff"), "hard-coded blue in PeopleStudio");
  assert.ok(s.includes("NOT FOUND"), "a missing model must be reported, not replaced");
  assert.ok(s.includes("dispose"), "GPU resources are released");
});
