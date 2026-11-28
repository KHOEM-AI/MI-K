import test from "node:test";
import assert from "node:assert/strict";
import { CLIPS, CLIP_NAMES, JOINTS, sampleClip, hipsOffset } from "../scripts/people-motion.mjs";

const close = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

test("there are the five clips the exporter promises", () => {
  assert.deepEqual(CLIP_NAMES, ["idle", "walk", "run", "wave", "talk"]);
});

test("every clip samples to finite numbers, covers all joints and ends exactly at its duration", () => {
  for (const name of CLIP_NAMES) {
    const s = sampleClip(name, 20);
    assert.equal(s.times.length, Math.round(CLIPS[name].duration * 20) + 1, name);
    assert.equal(s.times[0], 0);
    assert.equal(s.times.at(-1), CLIPS[name].duration);
    assert.ok(s.times.every((t, i) => i === 0 || t > s.times[i - 1]), `${name}: times increase`);
    for (const j of JOINTS) {
      assert.equal(s.joints[j].length, s.times.length, `${name}/${j}`);
      for (const v of s.joints[j]) assert.ok(v.length === 3 && v.every((n) => Number.isFinite(n) && Math.abs(n) < 3.1), `${name}/${j}`);
    }
    assert.ok(s.hipsY.every(Number.isFinite));
  }
});

test("every clip loops: the last key equals the first", () => {
  for (const name of CLIP_NAMES) {
    const s = sampleClip(name);
    for (const j of JOINTS) s.joints[j][0].forEach((v, k) => assert.ok(close(v, s.joints[j].at(-1)[k]), `${name}/${j}`));
    assert.ok(close(s.hipsY[0], s.hipsY.at(-1)), `${name}/hips`);
  }
});

test("walking: the legs are in opposite phase, and each arm swings against the leg on its own side", () => {
  const s = sampleClip("walk");
  for (let i = 0; i < s.times.length; i++) {
    assert.ok(close(s.joints.LegL[i][0], -s.joints.LegR[i][0]));
    assert.ok(s.joints.LegL[i][0] * s.joints.ArmL[i][0] <= 1e-12, "left arm moves against left leg");
    assert.ok(s.joints.LegR[i][0] * s.joints.ArmR[i][0] <= 1e-12, "right arm moves against right leg");
  }
});

test("a knee only ever bends one way, and running is bigger and faster than walking", () => {
  const walk = sampleClip("walk"), run = sampleClip("run");
  for (const s of [walk, run]) for (const j of ["KneeL", "KneeR"]) assert.ok(s.joints[j].every((v) => v[0] >= 0));
  const peak = (s) => Math.max(...s.joints.LegL.map((v) => Math.abs(v[0])));
  assert.ok(peak(run) > peak(walk));
  assert.ok(CLIPS.run.duration < CLIPS.walk.duration);
});

test("the feet stay on the ground: the hips stay close to standing height (no floating) and never sink absurdly", () => {
  for (const name of CLIP_NAMES) {
    const s = sampleClip(name);
    assert.ok(s.hipsY.every((y) => y <= 0.03 && y > -0.3), `${name}: ${Math.min(...s.hipsY)}`);
  }
  assert.ok(sampleClip("idle").hipsY.every((y) => y === 0));
  assert.equal(hipsOffset(0, 0, 0, 0), 0);
  assert.ok(Math.min(...sampleClip("walk").hipsY) < -0.005, "walking bobs");
});

test("wave lifts the right arm above the shoulder and leaves the left one down", () => {
  const s = sampleClip("wave");
  assert.ok(s.joints.ArmR.every((v) => v[2] <= -2));
  assert.ok(s.joints.ArmL.every((v) => Math.abs(v[2]) < 0.2));
  const swing = s.joints.ElbowR.map((v) => v[2]);
  assert.ok(Math.max(...swing) - Math.min(...swing) > 0.5, "the forearm waves");
});

test("talk keeps both hands in front of the body", () => {
  const s = sampleClip("talk");
  assert.ok(s.joints.ElbowL.every((v) => v[0] < -0.5) && s.joints.ElbowR.every((v) => v[0] < -0.4));
});

test("an unknown clip is an error", () => {
  assert.throws(() => sampleClip("fly"), /unknown clip/);
});
