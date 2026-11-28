import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { createHumanFigure } from "../src/components/humanFigure.ts";
import { PEOPLE, TONES, TONE_NAMES, figureOptions, validatePeople } from "../scripts/people-catalog.mjs";
import { JOINTS, CLIP_NAMES } from "../scripts/people-motion.mjs";
import { rigFigure, buildClips } from "../scripts/people-lib.mjs";
import { toGlb, readGlbJson } from "../scripts/glb-node.mjs";

const man = PEOPLE.find((p) => p.id === "man");
const make = (person = man, prefix = "") => {
  const figure = createHumanFigure(figureOptions(person));
  return { figure, rig: rigFigure(figure, prefix) };
};
const nonMesh = (o) => o.children.find((c) => !c.isMesh);
const world = (o) => o.getWorldPosition(new THREE.Vector3());
/** Returns a function that puts the figure into the pose it has `t` seconds into the clip. */
function player(figure, clip) {
  const mixer = new THREE.AnimationMixer(figure);
  mixer.clipAction(clip).play();
  return (t) => { mixer.setTime(t); figure.updateMatrixWorld(true); };
}

test("the people catalog is valid and covers every skin tone", () => {
  assert.deepEqual(validatePeople(), []);
  assert.deepEqual(new Set(PEOPLE.map((p) => p.tone)), new Set(TONE_NAMES));
  const heights = PEOPLE.map((p) => p.heightM);
  assert.ok(Math.min(...heights) < 1.2 && Math.max(...heights) > 1.75, "children and tall adults");
});

test("skin tone and height reach the figure (measured, in metres)", () => {
  const measure = (p, tone) => {
    const f = createHumanFigure(figureOptions(p, tone));
    return new THREE.Box3().setFromObject(f).getSize(new THREE.Vector3()).y / 1.143;
  };
  const child = measure(PEOPLE.find((p) => p.id === "child_boy")), tall = measure(PEOPLE.find((p) => p.id === "tall_man"));
  assert.ok(tall > child * 1.4, `tall ${tall.toFixed(2)} m vs child ${child.toFixed(2)} m`);
  assert.ok(Math.abs(measure(man) - man.heightM) < 0.15, `man is ${measure(man).toFixed(2)} m, wanted ${man.heightM}`);
  const skinOf = (tone) => {
    const f = createHumanFigure(figureOptions(man, tone));
    const hex = new Set();
    f.traverse((o) => o.isMesh && hex.add(o.material.color.getHex()));
    return hex;
  };
  for (const tone of TONE_NAMES) assert.ok(skinOf(tone).has(TONES[tone]), tone);
});

test("rigFigure gives every joint one unique name, with an optional prefix", () => {
  const { figure } = make();
  const names = [];
  figure.traverse((o) => o.name && names.push(o.name));
  for (const j of JOINTS) assert.equal(names.filter((n) => n === j).length, 1, j);
  const p = make(man, "man_");
  for (const j of JOINTS) assert.ok(p.figure.getObjectByName("man_" + j), j);
});

test("left is the figure's own left (+X) and sides are consistent for every person", () => {
  for (const person of PEOPLE) {
    const { rig } = make(person);
    assert.ok(rig.joints.ArmL.position.x > 0 && rig.joints.ArmR.position.x < 0, person.id);
    assert.ok(rig.joints.LegL.position.x > 0 && rig.joints.LegR.position.x < 0, person.id);
  }
});

test("a sitting figure is refused with a clear error", () => {
  assert.throws(() => rigFigure(createHumanFigure({ sitting: true })), /sitting/);
});

test("buildClips makes five looping clips; every track points at a real node", () => {
  const { figure, rig } = make();
  const clips = buildClips(THREE, rig);
  assert.deepEqual(clips.map((c) => c.name), CLIP_NAMES);
  for (const clip of clips) {
    assert.equal(clip.tracks.length, JOINTS.length + 1, clip.name);
    for (const track of clip.tracks) {
      const { nodeName } = THREE.PropertyBinding.parseTrackName(track.name);
      assert.ok(THREE.PropertyBinding.findNode(figure, nodeName), `${clip.name}: ${track.name}`);
      assert.ok(track.values.every(Number.isFinite));
    }
  }
});

test("the exported GLB carries all five clips with every channel", async () => {
  const { figure, rig } = make();
  const clips = buildClips(THREE, rig);
  const { glb, warnings } = await toGlb(GLTFExporter, figure, { animations: clips });
  const json = readGlbJson(glb);
  assert.deepEqual(json.animations.map((a) => a.name), CLIP_NAMES);
  for (const a of json.animations) {
    assert.equal(a.channels.length, JOINTS.length + 1, a.name);
    const paths = a.channels.map((c) => c.target.path);
    assert.equal(paths.filter((p) => p === "rotation").length, JOINTS.length);
    assert.equal(paths.filter((p) => p === "translation").length, 1);
    for (const c of a.channels) assert.ok(JOINTS.includes(json.nodes[c.target.node].name), "channel on a named joint");
  }
  for (const j of JOINTS) assert.equal(json.nodes.filter((n) => n.name === j).length, 1, j);
  assert.equal(warnings.filter((w) => /animation/i.test(w)).length, 0, warnings.join("; "));
  assert.ok(glb.length > 20000);
});

test("several people share one file without clashing (line-up)", async () => {
  const row = new THREE.Group(), clips = [];
  for (const p of PEOPLE.slice(0, 4)) {
    const { figure, rig } = make(p, p.id + "_");
    row.add(figure);
    clips.push(...buildClips(THREE, rig, ["idle"], { clipPrefix: p.id + "_" }));
  }
  const json = readGlbJson((await toGlb(GLTFExporter, row, { animations: clips })).glb);
  assert.equal(json.animations.length, 4);
  assert.equal(json.animations.reduce((n, a) => n + a.channels.length, 0), 4 * (JOINTS.length + 1));
});

test("wave: the right hand goes above the head; the left hand stays down", () => {
  const { figure, rig } = make();
  const clip = buildClips(THREE, rig, ["wave"])[0];
  const head = rig.joints.Head, at = player(figure, clip);
  for (const t of [0, 0.5, 1, 1.5]) {
    at(t);
    assert.ok(world(nonMesh(rig.joints.ElbowR)).y > world(head).y, `right hand above head at ${t}s`);
    assert.ok(world(nonMesh(rig.joints.ElbowL)).y < world(rig.joints.ArmL).y, `left hand down at ${t}s`);
  }
});

test("talk: both hands stay in front of the chest", () => {
  const { figure, rig } = make();
  const clip = buildClips(THREE, rig, ["talk"])[0];
  const at = player(figure, clip);
  for (let t = 0; t < 3.2; t += 0.4) {
    at(t);
    for (const side of ["L", "R"]) assert.ok(world(nonMesh(rig.joints["Elbow" + side])).z > 0.15, `${side} hand at ${t.toFixed(1)}s`);
  }
});

test("walk: opposite legs and arms, and the feet stay on the ground", () => {
  const { figure, rig } = make();
  const clip = buildClips(THREE, rig, ["walk"])[0];
  const at = player(figure, clip);
  at(0.25);                                                     // left leg forward, right leg back
  assert.ok(world(rig.joints.KneeL).z > world(rig.joints.KneeR).z + 0.15, "left knee ahead of right");
  assert.ok(world(nonMesh(rig.joints.ElbowL)).z < world(nonMesh(rig.joints.ElbowR)).z, "left hand behind right");
  for (let t = 0; t < 1; t += 0.05) {
    at(t);
    const low = new THREE.Box3().setFromObject(figure, true).min.y;
    assert.ok(Math.abs(low) < 0.1, `feet at ${low.toFixed(3)} at ${t.toFixed(2)}s`);
  }
});

test("run: the feet stay near the ground too", () => {
  const { figure, rig } = make();
  const clip = buildClips(THREE, rig, ["run"])[0];
  const at = player(figure, clip);
  for (let t = 0; t < 0.62; t += 0.05) {
    at(t);
    const low = new THREE.Box3().setFromObject(figure, true).min.y;
    assert.ok(Math.abs(low) < 0.18, `feet at ${low.toFixed(3)} at ${t.toFixed(2)}s`);
  }
});
