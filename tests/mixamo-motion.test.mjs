import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { parseGlb, buildGlb, validateGlb, editModel } from "../scripts/glb-rig-tool.mjs";
import { addClips, poseAtKey } from "../scripts/mixamo-motion.mjs";
import { CLIP_NAMES, sampleClip } from "../scripts/people-motion.mjs";

const FILE = new URL("../public/characters/fashion-model.glb", import.meta.url);
const opts = { skip: existsSync(FILE) ? false : "public/characters/fashion-model.glb is not in this project" };
const load = () => parseGlb(readFileSync(FILE));
/** A model with the five clips added (optionally resized first). */
function moving(height) {
  const m = load();
  if (height) editModel(m.json, { height });
  const r = addClips(m);
  return { json: m.json, bin: r.bin };
}
const keys = (name) => sampleClip(name, 20).times.length;
const lowestToe = (p) => Math.min(p.LeftToe_End[1], p.RightToe_End[1], p.LeftToeBase[1], p.RightToeBase[1]);

test("the five clips are added and the file stays valid", opts, () => {
  const { json, bin } = moving();
  assert.deepEqual(json.animations.slice(-5).map((a) => a.name), CLIP_NAMES);
  assert.deepEqual(validateGlb(json, bin), []);
  assert.deepEqual(validateGlb(...Object.values(parseGlb(buildGlb(json, bin)))), []);
  for (const a of json.animations.slice(-5)) assert.equal(a.channels.length, 17, a.name);
});

test("every pose is finite and every clip loops (first key = last key)", opts, () => {
  const { json, bin } = moving();
  for (const name of CLIP_NAMES) {
    const n = keys(name), first = poseAtKey(json, bin, name, 0), last = poseAtKey(json, bin, name, n - 1);
    for (const [bone, p] of Object.entries(first)) {
      assert.ok(p.every(Number.isFinite), `${name}/${bone}`);
      p.forEach((v, i) => assert.ok(Math.abs(v - last[bone][i]) < 1e-4, `${name}/${bone} does not loop`));
    }
  }
});

test("idle: both arms hang down beside the body", opts, () => {
  const { json, bin } = moving();
  for (let k = 0; k < keys("idle"); k += 10) {
    const p = poseAtKey(json, bin, "idle", k);
    for (const s of ["Left", "Right"]) {
      assert.ok(p[s + "Hand"][1] < p[s + "Arm"][1] - 0.3, `${s} hand below the shoulder`);
      assert.ok(Math.abs(p[s + "Hand"][0]) < 0.3, `${s} hand close to the body`);
    }
    assert.ok(p.Head[1] > p.Hips[1] + 0.25, "standing upright");
  }
});

test("wave: the right hand goes above the head, the left hand stays down", opts, () => {
  const { json, bin } = moving();
  for (let k = 0; k < keys("wave"); k += 5) {
    const p = poseAtKey(json, bin, "wave", k);
    assert.ok(p.RightHand[1] > p.Head[1] + 0.1, `right hand ${p.RightHand[1].toFixed(2)} vs head ${p.Head[1].toFixed(2)} at key ${k}`);
    assert.ok(p.LeftHand[1] < p.LeftArm[1], "left hand down");
  }
});

test("talk: both hands are in front of the chest, below the chin", opts, () => {
  const { json, bin } = moving();
  for (let k = 0; k < keys("talk"); k += 4) {
    const p = poseAtKey(json, bin, "talk", k);
    for (const s of ["Left", "Right"]) {
      assert.ok(p[s + "Hand"][2] > p.Spine2[2] + 0.1, `${s} hand forward at key ${k}`);
      assert.ok(p[s + "Hand"][1] < p.Head[1], `${s} hand below the head`);
    }
  }
});

test("walk: the legs swing in opposite directions (forward is +Z)", opts, () => {
  const { json, bin } = moving();
  const a = poseAtKey(json, bin, "walk", 5), b = poseAtKey(json, bin, "walk", 15);   // a quarter and three quarters of the cycle
  assert.ok(a.LeftFoot[2] > a.RightFoot[2] + 0.3, "left foot ahead at 0.25 s");
  assert.ok(b.RightFoot[2] > b.LeftFoot[2] + 0.3, "right foot ahead at 0.75 s");
  assert.ok(a.LeftHand[2] < a.RightHand[2], "left hand behind when the left foot is ahead");
});

test("walk and run: the feet touch the floor, never sink into it, never float, at every height", opts, () => {
  for (const height of [undefined, 1.1, 1.92]) {
    const { json, bin } = moving(height);
    for (const [name, tol] of [["walk", 0.08], ["run", 0.12]]) {
      const scale = (height ?? 1.58) / 1.58;
      for (let k = 0; k < keys(name); k++) {
        const y = lowestToe(poseAtKey(json, bin, name, k));
        assert.ok(y > -0.03 * scale && y < tol * scale, `${name} at ${height ?? "default"} m: lowest toe ${y.toFixed(3)} at key ${k}`);
      }
    }
  }
});

test("running is a bigger motion than walking", opts, () => {
  const { json, bin } = moving();
  const stride = (name) => Math.max(...Array.from({ length: keys(name) }, (_, k) => { const p = poseAtKey(json, bin, name, k); return Math.abs(p.LeftFoot[2] - p.RightFoot[2]); }));
  assert.ok(stride("run") > stride("walk") * 1.3);
});

test("a name that already exists, or a rig that is not Mixamo, is refused", opts, () => {
  const m = load();
  assert.throws(() => addClips({ json: m.json, bin: m.bin }, ["SambaDance"]), /already has/);
  const other = load();
  other.json.nodes.forEach((n) => { if (n.name) n.name = "other:" + n.name; });
  assert.throws(() => addClips(other), /not a Mixamo rig/);
});
